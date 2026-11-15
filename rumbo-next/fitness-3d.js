// RUMBO Fitness — clean GLB-first human viewer.
// Model: Sam, clothed and rigged, CC0, from Innerscene / MakeHuman- MPFB assets.
// This file intentionally contains no procedural humanoid made from geometric primitives.
const THREE_URL="https://esm.sh/three@0.170.0";
const LOADER_URL="https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
const MODEL_URL="https://files.innerscene.com/library/relaxed-walk-sam-3d-person-animated-732f1206/b11d02f72ad777e03d68/relaxed-walk-sam-3d-person-animated.glb";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let activeHost=null,activeDispose=null,THREE=null,GLTFLoader=null;

// Exercise motion library: procedural cycles applied to the real rig (not a stick figure).
const MOTION_RULES=[
 {id:"squat",test:/squat|goblet|leg-press|step-up/i,groups:{thigh:[.58,0,0],shin:[-.72,0,0],spine:[-.12,0,0],upperarm:[0,0,.12]}},
 {id:"hinge",test:/deadlift|\brdl\b|hip-hinge|good-morning|single-leg-rdl/i,groups:{thigh:[-.34,0,0],shin:[.12,0,0],spine:[.48,0,0],upperarm:[.12,0,0],forearm:[-.12,0,0]}},
 {id:"lunge",test:/lunge|split-squat|bulgarian|reverse-lunge/i,groups:{thigh:[.48,0,0],shin:[-.52,0,0],spine:[-.08,0,0]}},
 {id:"horizontal-push",test:/bench|push-up|chest-press|chest-fly|incline-db-press/i,groups:{upperarm:[-.62,0,0],forearm:[.72,0,0],spine:[-.06,0,0]}},
 {id:"vertical-push",test:/shoulder-press|overhead|lateral-raise/i,groups:{upperarm:[-.9,0,0],forearm:[.28,0,0],spine:[-.08,0,0]}},
 {id:"horizontal-pull",test:/row|face-pull|cable-row/i,groups:{upperarm:[.58,0,0],forearm:[-.62,0,0],spine:[.16,0,0]}},
 {id:"vertical-pull",test:/pull-up|lat-pulldown/i,groups:{upperarm:[-.85,0,0],forearm:[.42,0,0],spine:[.08,0,0]}},
 {id:"bridge",test:/hip-thrust|hip-bridge|glute-bridge/i,groups:{thigh:[-.48,0,0],shin:[.12,0,0],spine:[-.32,0,0]}},
 {id:"core",test:/plank|dead-bug|bird-dog|pallof|side-plank|mountain-climber/i,groups:{spine:[.08,0,0],upperarm:[-.2,0,0],thigh:[.18,0,0],shin:[-.16,0,0]}},
 {id:"mobility",test:/cat-cow|thoracic|stretch|ankle|childs-pose|hip-flexor/i,groups:{spine:[.32,0,0],upperarm:[-.24,0,0],thigh:[.18,0,0]}},
 {id:"cardio",test:/cycling|jump-rope|farmer-carry/i,groups:{thigh:[.42,0,0],shin:[-.58,0,0],upperarm:[.12,0,0],forearm:[-.08,0,0]}}
];
function createExerciseMotion(THREE,model,exerciseId){
 const bones=new Map();model.traverse(o=>{if(o.isBone)bones.set(o.name,o)});
 const g={
  pelvis:bones.get("pelvis"),s1:bones.get("spine_01"),s2:bones.get("spine_02"),s3:bones.get("spine_03"),
  neck:bones.get("neck_01"),head:bones.get("head"),
  hipL:bones.get("thigh_l"),hipR:bones.get("thigh_r"),kneeL:bones.get("calf_l"),kneeR:bones.get("calf_r"),
  shoulderL:bones.get("upperarm_l"),shoulderR:bones.get("upperarm_r"),elbowL:bones.get("lowerarm_l"),elbowR:bones.get("lowerarm_r"),
  clavL:bones.get("clavicle_l"),clavR:bones.get("clavicle_r"),ankleL:bones.get("foot_l"),ankleR:bones.get("foot_r")
 };
 const rest=new Map();Object.values(g).filter(Boolean).forEach(b=>rest.set(b,{q:b.quaternion.clone(),p:b.position.clone()}));
 const id=(exerciseId||"").toLowerCase();
 let kind="squat", unilateral=false, tempo=3.4;
 if(/squat|leg-press|tempo-squat/.test(id))kind="squat";
 else if(/lunge|split-squat|step-up|lateral-step-down/.test(id)){kind="lunge";unilateral=true}
 else if(/deadlift|\brdl\b|hip-hinge|good-morning|single-leg-rdl|pull-through/.test(id)){kind="hinge";unilateral=/single-leg/.test(id)}
 else if(/bench|push-up|chest-press|chest-fly|db-press|incline-db-press/.test(id))kind="horizontal-push";
 else if(/shoulder-press|overhead/.test(id))kind="vertical-push";
 else if(/lateral-raise|band-external-rotation/.test(id))kind="shoulder";
 else if(/row|face-pull/.test(id))kind="horizontal-pull";
 else if(/lat-pulldown|pull-up/.test(id))kind="vertical-pull";
 else if(/hip-thrust|hip-bridge|glute-bridge/.test(id))kind="bridge";
 else if(/leg-curl|hamstring-curl/.test(id))kind="knee-flexion";
 else if(/calf-raise/.test(id))kind="calf-raise";
 else if(/biceps-curl/.test(id))kind="elbow-flexion";
 else if(/triceps-pushdown/.test(id))kind="elbow-extension";
 else if(/pallof/.test(id))kind="anti-rotation";
 else if(/plank|dead-bug|bird-dog|reverse-crunch|side-plank|mountain-climber/.test(id))kind="core";
 else if(/cat-cow|thoracic|stretch|ankle|childs-pose|hip-flexor|90-90/.test(id))kind="mobility";
 else if(/cycling|jump-rope|farmer-carry|suitcase-carry/.test(id))kind="cardio";
 else if(/reverse-crunch/.test(id))kind="core";
 if(/plank|side-plank|farmer-carry|suitcase-carry/.test(id))tempo=4.8;
 if(/cat-cow|childs-pose|stretch|mobility|90-90|ankle-rock/.test(id))tempo=5.2;
 const q=new THREE.Quaternion(),e=new THREE.Euler();
 const set=(name,x=0,y=0,z=0,side=1)=>{
  const bone=g[name],r=bone&&rest.get(bone);if(!r)return;
  e.set(x*side,y*side,z*side,"XYZ");q.setFromEuler(e);bone.quaternion.copy(r.q).multiply(q);
 };
 const movePelvis=(y=0,z=0)=>{
  const bone=g.pelvis,r=bone&&rest.get(bone);if(!r)return;
  bone.position.copy(r.p);bone.position.y+=y;bone.position.z+=z;
 };
 const update=time=>{
  const cycle=(time%tempo)/tempo;
  // Controlled eccentric phase, short transition, then concentric return.
  const raw=cycle<.46?cycle/.46:cycle<.56?1:(1-(cycle-.56)/.44);
  const t=raw*raw*(3-2*raw),d=Math.sin(t*Math.PI/2);
  const side=unilateral?Math.sin(time*Math.PI*2/tempo)>=0?1:-1:1;
  // Clear the previous frame's pose before composing the new movement.
  for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}
  if(kind==="squat"){
   set("hipL",-.72*d);set("hipR",-.72*d);set("kneeL",1.02*d);set("kneeR",1.02*d);
   set("s1",.12*d);set("s2",.08*d);set("s3",.04*d);
   set("shoulderL",-.12*d);set("shoulderR",-.12*d);movePelvis(-.17*d);
  }else if(kind==="lunge"){
   set("hipL",-.58*d,0,0,side);set("kneeL",.86*d,0,0,side);
   set("hipR",.12*d,0,0,-side);set("kneeR",-.10*d,0,0,-side);
   set("s1",.08*d);set("s2",.04*d);movePelvis(-.09*d);
  }else if(kind==="hinge"){
   set("hipL",-.36*d);set("hipR",-.36*d);set("kneeL",.14*d);set("kneeR",.14*d);
   set("s1",.25*d);set("s2",.20*d);set("s3",.12*d);
   set("shoulderL",-.12*d);set("shoulderR",-.12*d);set("elbowL",.10*d);set("elbowR",.10*d);
   movePelvis(0,.035*d);
  }else if(kind==="horizontal-push"){
   set("shoulderL",-.52*d);set("shoulderR",-.52*d);set("elbowL",.82*d);set("elbowR",.82*d);
   set("clavL",-.06*d);set("clavR",-.06*d);set("s1",-.035*d);
  }else if(kind==="vertical-push"){
   set("shoulderL",-.88*d);set("shoulderR",-.88*d);set("elbowL",.20*d);set("elbowR",.20*d);
   set("clavL",-.10*d);set("clavR",-.10*d);set("s1",.035*d);
  }else if(kind==="shoulder"){
   set("shoulderL",-.58*d,0,-.10*d);set("shoulderR",-.58*d,0,.10*d);
   set("elbowL",-.06*d);set("elbowR",-.06*d);set("clavL",-.10*d);set("clavR",-.10*d);
  }else if(kind==="horizontal-pull"){
   set("shoulderL",.48*d);set("shoulderR",.48*d);set("elbowL",-.58*d);set("elbowR",-.58*d);
   set("s1",.045*d);set("s2",.025*d);
  }else if(kind==="vertical-pull"){
   set("shoulderL",-.76*d);set("shoulderR",-.76*d);set("elbowL",.42*d);set("elbowR",.42*d);
   set("s1",.07*d);movePelvis(0,-.025*d);
  }else if(kind==="bridge"){
   set("hipL",-.42*d);set("hipR",-.42*d);set("kneeL",.18*d);set("kneeR",.18*d);
   set("s1",-.16*d);set("s2",-.16*d);set("s3",-.09*d);movePelvis(.16*d);
  }else if(kind==="knee-flexion"){
   set("kneeL",.78*d);set("kneeR",.78*d);set("hipL",-.05*d);set("hipR",-.05*d);
  }else if(kind==="calf-raise"){
   set("ankleL",-.34*d);set("ankleR",-.34*d);movePelvis(.055*d);
  }else if(kind==="elbow-flexion"){
   set("elbowL",-.88*d);set("elbowR",-.88*d);set("shoulderL",-.04*d);set("shoulderR",-.04*d);
  }else if(kind==="elbow-extension"){
   set("elbowL",.76*d);set("elbowR",.76*d);set("shoulderL",-.08*d);set("shoulderR",-.08*d);
  }else if(kind==="anti-rotation"){
   set("shoulderL",-.20*d);set("shoulderR",-.20*d);set("s1",.07*d,0,.18*d);set("s2",0,0,.12*d);
  }else if(kind==="core"){
   set("s1",.12*d);set("s2",.08*d);set("hipL",.14*d);set("hipR",.14*d);
   set("shoulderL",-.20*d);set("shoulderR",-.20*d);
   if(/mountain-climber/.test(id)){set("hipL",-.50*d);set("hipR",.38*d);set("kneeL",.62*d);set("kneeR",-.35*d)}
   if(/bird-dog|dead-bug/.test(id)){set("shoulderL",-.42*d);set("shoulderR",.10*d);set("hipL",.30*d);set("hipR",-.28*d)}
   if(/reverse-crunch/.test(id)){set("hipL",-.52*d);set("hipR",-.52*d);set("kneeL",.65*d);set("kneeR",.65*d);movePelvis(.08*d)}
  }else if(kind==="mobility"){
   set("s1",.20*d);set("s2",.18*d);set("s3",.12*d);set("neck",-.08*d);set("head",.06*d);
   if(/thoracic-rotation/.test(id)){set("s1",.04*d,0,.28*d);set("s2",0,0,.22*d)}
   if(/cat-cow/.test(id)){set("s1",.30*d);set("s2",.24*d);set("s3",.16*d);set("head",-.12*d)}
   if(/hip-flexor|childs-pose|90-90/.test(id)){set("hipL",-.18*d);set("hipR",.12*d)}
  }else if(kind==="cardio"){
   const stride=Math.sin(time*Math.PI*2/tempo);
   set("hipL",-.42*stride);set("hipR",.42*stride);set("kneeL",.58*Math.max(0,stride));set("kneeR",.58*Math.max(0,-stride));
   set("shoulderL",.14*stride);set("shoulderR",-.14*stride);set("elbowL",-.08*stride);set("elbowR",.08*stride);
  }
 };
 return {update,kind,boneCount:rest.size,groups:Object.keys(g).filter(k=>g[k]),dispose(){for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}}};
}

function makeViewer(host,exerciseId){
 if(host.dataset.rumboHumanReady==="1")return ()=>{};
 host.dataset.rumboHumanReady="1";
 const inLibrary=!!host.closest(".exercise-library-art");
 const viewerHeight=inLibrary?244:400;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(Math.max(1,host.clientWidth||360),viewerHeight);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const viewport=document.createElement("div");viewport.className="rumbo-human-viewport";
 viewport.style.cssText="position:relative;flex:0 0 "+viewerHeight+"px;width:100%;height:"+viewerHeight+"px;min-height:"+viewerHeight+"px;overflow:hidden;border-radius:14px;background:radial-gradient(ellipse at 50% 38%,#1b4357 0%,#0b2233 68%,#071724 100%)";
 viewport.appendChild(renderer.domElement);
 host.style.cssText+=";height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important";
 host.replaceChildren(viewport);
 const scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xe8f7ff,0x243445,2.2));
 const key=new THREE.DirectionalLight(0xfff1df,3.1);key.position.set(-3,5,4);key.castShadow=true;scene.add(key);
 const fill=new THREE.DirectionalLight(0x62d9dd,1.25);fill.position.set(3,2,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(1.18,64),new THREE.MeshStandardMaterial({color:0x18394b,roughness:.9}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.018;floor.receiveShadow=true;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.98,.009,8,80),new THREE.MeshStandardMaterial({color:0x36c6c4,emissive:0x0a5557,emissiveIntensity:.35}));
 ring.rotation.x=Math.PI/2;ring.position.y=-.005;scene.add(ring);
 const camera=new THREE.PerspectiveCamera(30,Math.max(1,host.clientWidth)/viewerHeight,.05,100);
 const status=document.createElement("div");status.className="rumbo-human-status";status.textContent="CARGANDO MODELO HUMANO…";
 status.style.cssText="position:relative;order:2;width:100%;box-sizing:border-box;padding:6px 9px;border:1px solid #285365;border-radius:8px;background:#0b2636;color:#a9f2ed;font:600 10px system-ui;letter-spacing:.07em;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
 host.appendChild(status);
 const controls=document.createElement("div");controls.className="rumbo-human-controls";controls.style.cssText="position:relative;order:3;display:flex;gap:6px;z-index:4;flex-wrap:wrap;justify-content:center;width:100%;padding:2px 0";
 const button=(label,fn)=>{const el=document.createElement("button");el.type="button";el.textContent=label;el.style.cssText="border:1px solid #43808c;border-radius:7px;padding:6px 9px;background:#12384a;color:#dffcff;font:600 11px system-ui;cursor:pointer";el.addEventListener("click",fn);controls.appendChild(el);return el};
 host.appendChild(controls);
 let model=null,exerciseMotion=null,paused=false,rate=1,az=0,el=.02,zoom=1,drag=false,lastX=0,lastY=0,raf=0,disposed=false,last=performance.now(),motionTime=0,lookTarget=new THREE.Vector3(0,.86,0),fitDistance=4.8;
 if(!inLibrary){
  button("Frontal",()=>{az=0;el=.02});button("Lateral",()=>{az=Math.PI/2;el=.02});button("Posterior",()=>{az=Math.PI;el=.02});
  const pause=button("Ⅱ Pausa",()=>{paused=!paused;pause.textContent=paused?"▶ Reanudar":"Ⅱ Pausa"});
  const speed=button("Velocidad 1×",()=>{rate=rate>=1.75?.75:rate+.25;speed.textContent="Velocidad "+rate.toFixed(2).replace(/0$/,"")+"×"});
 }
 const onDown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;if(renderer.domElement.setPointerCapture)renderer.domElement.setPointerCapture(e.pointerId)};
 const onUp=()=>drag=false;
 const onMove=e=>{if(!drag)return;az+=(e.clientX-lastX)*.007;el=clamp(el+(e.clientY-lastY)*.005,-.28,.38);lastX=e.clientX;lastY=e.clientY};
 const onWheel=e=>{zoom=clamp(zoom+e.deltaY*.0007,.85,1.25)};
 renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointercancel",onUp);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
 const resize=()=>{
  const ww=viewport.clientWidth,hh=viewport.clientHeight;if(!ww||!hh)return;
  renderer.setSize(ww,hh,false);camera.aspect=ww/hh;camera.updateProjectionMatrix();
  if(model){const vFov=THREE.MathUtils.degToRad(camera.fov),hFov=2*Math.atan(Math.tan(vFov/2)*camera.aspect),lim=Math.min(vFov,hFov);fitDistance=(model.userData.rumboRadius||.95)/Math.sin(lim/2)*1.18}
 };
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
 const loader=new GLTFLoader();
 loader.load(MODEL_URL,gltf=>{
  if(disposed)return;
  model=gltf.scene;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(.48,o.material.roughness??.65);o.material.envMapIntensity=1.1}}});
  // Keep the source model's authored forward direction; do not turn its back to the camera.
  model.rotation.y=0;
  let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=1.72/Math.max(size.y,.001);model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  scene.add(model);
  bounds=new THREE.Box3().setFromObject(model);center=bounds.getCenter(new THREE.Vector3());const sphere=bounds.getBoundingSphere(new THREE.Sphere());
  lookTarget.set(center.x,center.y,center.z+.015);model.userData.rumboRadius=Math.max(sphere.radius,.9);
  exerciseMotion=createExerciseMotion(THREE,model,exerciseId);
  host.dataset.humanAnimation=exerciseMotion.kind;host.dataset.humanRigBones=String(exerciseMotion.boneCount);host.dataset.humanRigGroups=exerciseMotion.groups.join(",");
  host.dataset.humanModel="sam-clothed-rigged";host.dataset.humanLicense="CC0";
  status.textContent="DEMOSTRACIÓN · "+exerciseMotion.kind.toUpperCase()+" · "+exerciseMotion.boneCount+" ARTICULACIONES";
  resize();
 },undefined,error=>{status.textContent="No se pudo cargar el modelo 3D";status.style.background="#7a302d";host.dataset.humanModel="load-error";console.error("RUMBO human GLB load failed",error)});
 const render=now=>{
  if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!paused&&exerciseMotion){motionTime+=dt*rate;exerciseMotion.update(motionTime)}
  const r=fitDistance*zoom;camera.position.set(lookTarget.x+r*Math.sin(az)*Math.cos(el),lookTarget.y+r*(.08+el),lookTarget.z+r*Math.cos(az)*Math.cos(el));camera.lookAt(lookTarget);renderer.render(scene,camera);
 };
 raf=requestAnimationFrame(render);host.dataset.engine="three-glb";
 return ()=>{
  disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();
  renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointercancel",onUp);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("wheel",onWheel);
  if(exerciseMotion)exerciseMotion.dispose();renderer.dispose();
  scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});
  renderer.domElement.remove();controls.remove();status.remove();viewport.remove();host.dataset.rumboHumanReady="0";
 };
}
async function boot(){
 try{
  [THREE,{GLTFLoader}]=await Promise.all([import(THREE_URL),import(LOADER_URL)]);
  window.__RUMBO_HUMAN_MODEL_READY__=true;
  const mounted=new Map();
  const pending=new WeakSet();
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    const host=entry.target;observer.unobserve(host);
    if(mounted.has(host)||pending.has(host))continue;
    pending.add(host);
    try{const dispose=makeViewer(host,host.dataset.exercise3d);mounted.set(host,dispose)}
    catch(e){host.dataset.engine="error";host.dataset.humanModel="init-error";console.error("RUMBO human viewer init failed",e)}
   }
  },{root:null,rootMargin:"180px 0px",threshold:.01});
  const scan=()=>{
   const hosts=new Set(document.querySelectorAll(".guided-figure[data-exercise-3d]"));
   for(const [host,dispose] of mounted){if(!host.isConnected){dispose();mounted.delete(host)}}
   hosts.forEach(host=>{if(!mounted.has(host)&&!pending.has(host))observer.observe(host)});
  };
  const root=document.getElementById("view")||document.body;
  const mutationObserver=new MutationObserver(()=>requestAnimationFrame(scan));
  mutationObserver.observe(root,{childList:true,subtree:true});
  scan();
  window.__RUMBO_HUMAN_VIEWERS__={mounted,scan,disconnect(){mutationObserver.disconnect();observer.disconnect();for(const dispose of mounted.values())dispose();mounted.clear()}};
 }catch(e){window.__RUMBO_HUMAN_MODEL_ERROR__=String(e);console.error("RUMBO human viewer dependencies failed",e);document.querySelectorAll(".guided-figure[data-exercise-3d]").forEach(host=>{host.dataset.humanModel="dependency-error";host.innerHTML="<div style=\"padding:12px;color:#ffd0c2;font:600 11px system-ui;text-align:center\">ERROR VISOR 3D<br>"+String(e?.message||e).slice(0,180)+"</div>"})}
}
if(typeof window!=="undefined")boot();
