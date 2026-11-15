// RUMBO Fitness — rigged human model with exercise-specific movement.
// Michelle is a textured, skinned humanoid sample; the app drives its rig with exercise cycles.
const THREE_URL="https://esm.sh/three@0.170.0";
const LOADER_URL="https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
export const FITNESS_MODEL_URL="https://threejs.org/examples/models/gltf/Michelle.glb";
const MODEL_URL=FITNESS_MODEL_URL;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let activeHost=null,activeDispose=null,THREE=null,GLTFLoader=null;

// Exercise motion library: procedural cycles applied to the real rig (not a stick figure).
const MOTION_RULES=[
 {id:"squat",test:/squat|goblet|leg-press|step-up/i,groups:{thigh:[.58,0,0],shin:[-.72,0,0],spine:[-.12,0,0],upperarm:[0,0,.12]}},
 {id:"hinge",test:/deadlift|\brdl\b|hip-hinge|good-morning|single-leg-rdl/i,groups:{thigh:[-.34,0,0],shin:[.12,0,0],spine:[.48,0,0],upperarm:[.12,0,0],forearm:[-.12,0,0]}},
 {id:"lunge",test:/lunge|split-squat|bulgarian|reverse-lunge|lateral-step-down/i,groups:{thigh:[.48,0,0],shin:[-.52,0,0],spine:[-.08,0,0]}},
 {id:"horizontal-push",test:/bench|push-up|chest-press|chest-fly|incline-db-press/i,groups:{upperarm:[-.62,0,0],forearm:[.72,0,0],spine:[-.06,0,0]}},
 {id:"vertical-push",test:/shoulder-press|overhead|lateral-raise/i,groups:{upperarm:[-.9,0,0],forearm:[.28,0,0],spine:[-.08,0,0]}},
 {id:"horizontal-pull",test:/row|face-pull|cable-row/i,groups:{upperarm:[.58,0,0],forearm:[-.62,0,0],spine:[.16,0,0]}},
 {id:"vertical-pull",test:/pull-up|lat-pulldown/i,groups:{upperarm:[-.85,0,0],forearm:[.42,0,0],spine:[.08,0,0]}},
 {id:"bridge",test:/hip-thrust|hip-bridge|glute-bridge/i,groups:{thigh:[-.48,0,0],shin:[.12,0,0],spine:[-.32,0,0]}},
 {id:"core",test:/plank|dead-bug|bird-dog|pallof|side-plank|mountain-climber|reverse-crunch|suitcase-carry/i,groups:{spine:[.08,0,0],upperarm:[-.2,0,0],thigh:[.18,0,0],shin:[-.16,0,0]}},
 {id:"mobility",test:/cat-cow|thoracic|stretch|ankle|childs-pose|hip-flexor|90-90-hip-switch/i,groups:{spine:[.32,0,0],upperarm:[-.24,0,0],thigh:[.18,0,0]}},
 {id:"cardio",test:/cycling|jump-rope|farmer-carry/i,groups:{thigh:[.42,0,0],shin:[-.58,0,0],upperarm:[.12,0,0],forearm:[-.08,0,0]}}
];
export function classifyExerciseMotion(exerciseId){
 const id=String(exerciseId||"").toLowerCase();
 if(id==="squat")return "goblet-squat";
 if(id==="leg-press")return "leg-press";
 if(id==="bench-press")return "bench-press";
 if(id==="db-press")return "dumbbell-bench";
 if(id==="rdl")return "deadlift";
 if(id==="biceps-curl")return "biceps-curl";
 if(/split-squat|step-up|lunge|lateral-step-down/.test(id))return "lunge";
 if(/triceps-pushdown/.test(id))return "elbow-extension";
 if(/leg-curl|hamstring-curl/.test(id))return "knee-flexion";
 if(/calf-raise/.test(id))return "calf-raise";
 if(/band-external-rotation/.test(id))return "shoulder-rotation";
 return MOTION_RULES.find(rule=>rule.test.test(id))?.id||"general";
}
function createExerciseMotion(THREE,model,exerciseId){
 const bones=new Map();model.traverse(o=>{if(o.isBone)bones.set(o.name,o)});
 const pick=(...names)=>names.map(name=>bones.get(name)).find(Boolean)||null;
 const g={
  pelvis:pick("pelvis","mixamorigHips","mixamorig:Hips","Hips"),
  spine1:pick("spine_01","mixamorigSpine","mixamorig:Spine","Spine"),
  spine2:pick("spine_02","mixamorigSpine1","mixamorig:Spine1","Spine1"),
  spine3:pick("spine_03","mixamorigSpine2","mixamorig:Spine2","Spine2"),
  hipL:pick("thigh_l","mixamorigLeftUpLeg","mixamorig:LeftUpLeg","LeftUpLeg"),
  hipR:pick("thigh_r","mixamorigRightUpLeg","mixamorig:RightUpLeg","RightUpLeg"),
  kneeL:pick("calf_l","mixamorigLeftLeg","mixamorig:LeftLeg","LeftLeg"),
  kneeR:pick("calf_r","mixamorigRightLeg","mixamorig:RightLeg","RightLeg"),
  shoulderL:pick("upperarm_l","mixamorigLeftArm","mixamorig:LeftArm","LeftArm"),
  shoulderR:pick("upperarm_r","mixamorigRightArm","mixamorig:RightArm","RightArm"),
  elbowL:pick("lowerarm_l","mixamorigLeftForeArm","mixamorig:LeftForeArm","LeftForeArm"),
  elbowR:pick("lowerarm_r","mixamorigRightForeArm","mixamorig:RightForeArm","RightForeArm"),
   ankleL:pick("foot_l","mixamorigLeftFoot","mixamorig:LeftFoot","LeftFoot"),
   ankleR:pick("foot_r","mixamorigRightFoot","mixamorig:RightFoot","RightFoot")
 };
 const rest=new Map();Object.values(g).filter(Boolean).forEach(b=>rest.set(b,{q:b.quaternion.clone(),p:b.position.clone()}));
 const id=(exerciseId||"").toLowerCase();
 const kind=classifyExerciseMotion(id);
 const duration=kind==="leg-press"?4.4:kind==="bench-press"||kind==="dumbbell-bench"?3.8:kind==="cardio"?2.8:kind==="mobility"?5.2:3.5;
 const axisWorld=new THREE.Vector3(1,0,0),axisParent=new THREE.Vector3(),delta=new THREE.Quaternion();
 const apply=(name,angle)=>{
  const bone=g[name],r=bone&&rest.get(bone);if(!r)return;
  bone.parent?.updateWorldMatrix(true,false);
  const parentQ=bone.parent?bone.parent.getWorldQuaternion(new THREE.Quaternion()):new THREE.Quaternion();
  axisParent.copy(axisWorld).applyQuaternion(parentQ.invert()).normalize();
  delta.setFromAxisAngle(axisParent,angle);bone.quaternion.copy(delta).multiply(r.q);
 };
 const setPelvis=(y=0,z=0)=>{const bone=g.pelvis,r=bone&&rest.get(bone);if(!r)return;bone.position.copy(r.p);bone.position.y+=y;bone.position.z+=z};
 const smooth=t=>t*t*(3-2*t);
 const phase=t=>{const p=(t%duration)/duration;if(p<.40)return smooth(p/.40);if(p<.52)return 1;if(p<.92)return 1-smooth((p-.52)/.40);return 0};
 const update=time=>{
  for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}
  const d=phase(time);
  if(kind==="goblet-squat"||kind==="squat"){
   apply("hipL",-.58*d);apply("hipR",-.58*d);apply("kneeL",1.02*d);apply("kneeR",1.02*d);
   apply("spine1",.12*d);apply("spine2",.09*d);apply("spine3",.04*d);apply("shoulderL",-.10*d);apply("shoulderR",-.10*d);setPelvis(-.12*d);
  }else if(kind==="leg-press"){
   apply("hipL",-.24*(1-d));apply("hipR",-.24*(1-d));apply("kneeL",.92*(1-d));apply("kneeR",.92*(1-d));apply("spine1",-.025);apply("spine2",-.015);setPelvis(-.025);
  }else if(kind==="deadlift"||kind==="hinge"){
   apply("hipL",.42*d);apply("hipR",.42*d);apply("kneeL",.12*d);apply("kneeR",.12*d);
   apply("spine1",-.035*d);apply("spine2",-.025*d);apply("spine3",-.015*d);apply("shoulderL",.05*d);apply("shoulderR",.05*d);setPelvis(0,.035*d);
  }else if(kind==="bench-press"||kind==="dumbbell-bench"||kind==="horizontal-push"){
   apply("shoulderL",-.42*d);apply("shoulderR",-.42*d);apply("elbowL",.82*(1-d));apply("elbowR",.82*(1-d));apply("spine1",-.015);apply("spine2",-.01);
  }else if(kind==="biceps-curl"){
    apply("elbowL",-.92*d);apply("elbowR",-.92*d);apply("shoulderL",-.035);apply("shoulderR",-.035);
   }else if(kind==="elbow-extension"){
    apply("elbowL",.72*d);apply("elbowR",.72*d);apply("shoulderL",.035);apply("shoulderR",.035);
   }else if(kind==="knee-flexion"){
    apply("kneeL",.72*d);apply("kneeR",.72*d);apply("hipL",-.06*d);apply("hipR",-.06*d);
   }else if(kind==="calf-raise"){
    apply("ankleL",-.28*d);apply("ankleR",-.28*d);apply("kneeL",.04*d);apply("kneeR",.04*d);
   }else if(kind==="shoulder-rotation"){
    apply("shoulderL",.18*d);apply("shoulderR",.18*d);apply("elbowL",.08*d);apply("elbowR",.08*d);
   }else if(kind==="bridge"){
    apply("hipL",-.46*d);apply("hipR",-.46*d);apply("kneeL",.18*d);apply("kneeR",.18*d);apply("spine1",-.22*d);apply("spine2",-.10*d);setPelvis(.13*d);
   }else if(kind==="core"){
    apply("spine1",.12*d);apply("spine2",-.06*d);apply("hipL",.14*d);apply("hipR",-.14*d);apply("shoulderL",-.18*d);apply("shoulderR",-.18*d);setPelvis(-.035*d);
   }else if(kind==="mobility"){
    const wave=Math.sin(time*1.2);apply("spine1",.22*wave);apply("spine2",-.14*wave);apply("spine3",.08*wave);apply("shoulderL",.10*d);apply("shoulderR",-.10*d);
   }else if(kind==="cardio"){
    const stride=Math.sin(time*3.1);apply("hipL",-.22*stride);apply("hipR",.22*stride);apply("kneeL",.34*Math.max(0,stride));apply("kneeR",.34*Math.max(0,-stride));apply("shoulderL",.10*stride);apply("shoulderR",-.10*stride);
   }else if(kind==="lunge"){
    const side=Math.sin(time*1.4)>=0?1:-1;apply("hipL",-.48*d*(side>0?1:.12));apply("kneeL",.78*d*(side>0?1:.1));apply("hipR",-.48*d*(side<0?1:.12));apply("kneeR",.78*d*(side<0?1:.1));setPelvis(-.07*d);
   }else if(kind==="horizontal-pull"||kind==="row"){
    apply("shoulderL",.42*d);apply("shoulderR",.42*d);apply("elbowL",-.58*d);apply("elbowR",-.58*d);
   }else if(kind==="vertical-pull"){
    apply("shoulderL",-.76*d);apply("shoulderR",-.76*d);apply("elbowL",.52*d);apply("elbowR",.52*d);
   }else if(kind==="vertical-push"||kind==="horizontal-push"){
    apply("shoulderL",-.65*d);apply("shoulderR",-.65*d);apply("elbowL",.22*(1-d));apply("elbowR",.22*(1-d));
   }else if(kind==="press"){
    apply("shoulderL",-.65*d);apply("shoulderR",-.65*d);apply("elbowL",.22*(1-d));apply("elbowR",.22*(1-d));
   }else{apply("spine1",.035*Math.sin(time*2));apply("shoulderL",.08*Math.sin(time*2));apply("shoulderR",-.08*Math.sin(time*2))}
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
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b2233);
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
  host.dataset.humanModel="michelle-mixamo-rigged";host.dataset.humanLicense="MIT";
  status.textContent="MICHELLE · "+exerciseMotion.kind.toUpperCase()+" · "+exerciseMotion.boneCount+" ARTICULACIONES";
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
