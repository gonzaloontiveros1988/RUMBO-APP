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
 const byName=new Map();model.traverse(o=>{if(o.isBone)byName.set(o.name,o)});
 const groups={
  pelvis:byName.get("pelvis"),spine1:byName.get("spine_01"),spine2:byName.get("spine_02"),spine3:byName.get("spine_03"),
  thighL:byName.get("thigh_l"),thighR:byName.get("thigh_r"),calfL:byName.get("calf_l"),calfR:byName.get("calf_r"),
  upperL:byName.get("upperarm_l"),upperR:byName.get("upperarm_r"),lowerL:byName.get("lowerarm_l"),lowerR:byName.get("lowerarm_r"),
  clavL:byName.get("clavicle_l"),clavR:byName.get("clavicle_r"),footL:byName.get("foot_l"),footR:byName.get("foot_r"),
  neck:byName.get("neck_01"),head:byName.get("head")
 };
 const rest=new Map();Object.values(groups).filter(Boolean).forEach(b=>rest.set(b,{q:b.quaternion.clone(),p:b.position.clone()}));
 const key=(exerciseId||"").toLowerCase();
 let kind="squat";
 if(/deadlift|romanian|\brdl\b|hip-hinge|good-morning|single-leg-rdl/.test(key))kind="hinge";
 else if(/lunge|split-squat|bulgarian|step-up/.test(key))kind="lunge";
 else if(/bench|push-up|chest-press|chest-fly|db-press|incline-db-press/.test(key))kind="horizontal-push";
 else if(/shoulder-press|overhead/.test(key))kind="vertical-push";
 else if(/lateral-raise/.test(key))kind="shoulder-abduction";
 else if(/row|face-pull/.test(key))kind="horizontal-pull";
 else if(/lat-pulldown|pull-up/.test(key))kind="vertical-pull";
 else if(/hip-thrust|hip-bridge|glute-bridge/.test(key))kind="bridge";
 else if(/plank|dead-bug|bird-dog|pallof|mountain-climber|side-plank/.test(key))kind="core";
 else if(/cat-cow|thoracic|stretch|ankle|childs-pose|hip-flexor|90-90/.test(key))kind="mobility";
 else if(/cycling|jump-rope|farmer-carry/.test(key))kind="cardio";
 else if(/leg-curl/.test(key))kind="knee-flexion";
 else if(/calf-raise/.test(key))kind="calf-raise";
 else if(/biceps-curl/.test(key))kind="elbow-flexion";
 else if(/triceps-pushdown/.test(key))kind="elbow-extension";
 else if(/pallof-press/.test(key))kind="anti-rotation";
 else if(/hip-thrust|hip-bridge|glute-bridge/.test(key))kind="bridge";
 else if(/plank|dead-bug|bird-dog|pallof|mountain-climber|side-plank/.test(key))kind="core";
 else if(/cat-cow|thoracic|stretch|ankle|childs-pose|hip-flexor/.test(key))kind="mobility";
 else if(/cycling|jump-rope|farmer-carry/.test(key))kind="cardio";
 const q=new THREE.Quaternion(),e=new THREE.Euler();
 const apply=(bone,rx=0,ry=0,rz=0,side=1)=>{
  if(!bone||!rest.has(bone))return;
  const r=rest.get(bone);e.set(rx*side,ry*side,rz*side,"XYZ");q.setFromEuler(e);bone.quaternion.copy(r.q).multiply(q);
 };
 const update=time=>{
  const c=(time%3.2)/3.2;
  const t=c<.42?c/.42:c<.55?1:(1-(c-.55)/.45);
  const d=Math.sin((t*t*(3-2*t))*Math.PI/2);
  // Named rig joints from the inspected 56-bone hierarchy. Angles are conservative first-pass values.
  if(kind==="squat"){
   apply(groups.thighL,-.78*d);apply(groups.thighR,-.78*d);
   apply(groups.calfL,1.18*d);apply(groups.calfR,1.18*d);
   apply(groups.spine1,.08*d);apply(groups.spine2,.07*d);apply(groups.spine3,.04*d);
   apply(groups.upperL,-.12*d);apply(groups.upperR,-.12*d);
   if(groups.pelvis){const r=rest.get(groups.pelvis);groups.pelvis.position.copy(r.p);groups.pelvis.position.y-=.18*d}
  }else if(kind==="hinge"){
   apply(groups.thighL,-.32*d);apply(groups.thighR,-.32*d);
   apply(groups.spine1,.22*d);apply(groups.spine2,.18*d);apply(groups.spine3,.10*d);
   apply(groups.lowerL,-.10*d);apply(groups.lowerR,-.10*d);
  }else if(kind==="lunge"){
   apply(groups.thighL,-.55*d);apply(groups.calfL,.82*d);
   apply(groups.thighR,.18*d);apply(groups.calfR,-.12*d);
   apply(groups.spine1,.04*d);apply(groups.spine2,.04*d);
  }else if(kind==="horizontal-push"){
   apply(groups.upperL,-.55*d);apply(groups.upperR,-.55*d);
   apply(groups.lowerL,.78*d);apply(groups.lowerR,.78*d);
   apply(groups.clavL,-.08*d);apply(groups.clavR,-.08*d);
  }else if(kind==="vertical-push"){
   apply(groups.upperL,-.82*d);apply(groups.upperR,-.82*d);
   apply(groups.lowerL,.18*d);apply(groups.lowerR,.18*d);
  }else if(kind==="horizontal-pull"){
   apply(groups.upperL,.45*d);apply(groups.upperR,.45*d);
   apply(groups.lowerL,-.48*d);apply(groups.lowerR,-.48*d);
   apply(groups.spine1,.05*d);
  }else if(kind==="vertical-pull"){
   apply(groups.upperL,-.72*d);apply(groups.upperR,-.72*d);
   apply(groups.lowerL,.32*d);apply(groups.lowerR,.32*d);
  }else if(kind==="shoulder-abduction"){
   apply(groups.upperL,-.62*d,0,-.10*d);apply(groups.upperR,-.62*d,0,.10*d);
   apply(groups.clavL,-.10*d);apply(groups.clavR,-.10*d);
  }else if(kind==="bridge"){
   apply(groups.thighL,-.48*d);apply(groups.thighR,-.48*d);
   apply(groups.spine1,-.18*d);apply(groups.spine2,-.18*d);apply(groups.spine3,-.10*d);
   if(groups.pelvis){const r=rest.get(groups.pelvis);groups.pelvis.position.copy(r.p);groups.pelvis.position.y+=.16*d}
  }else if(kind==="core"||kind==="anti-rotation"){
   apply(groups.spine1,kind==="anti-rotation"?.08*d:.12*d,0,kind==="anti-rotation"?.20*d:.0);
   apply(groups.spine2,0,0,kind==="anti-rotation"?.16*d:.0);
   apply(groups.upperL,-.24*d);apply(groups.upperR,-.24*d);
   apply(groups.thighL,.16*d);apply(groups.thighR,.16*d);
  }else if(kind==="mobility"){
   apply(groups.spine1,.24*d);apply(groups.spine2,.18*d);apply(groups.spine3,.12*d);
   apply(groups.neck,-.10*d);apply(groups.head,.08*d);
  }else if(kind==="cardio"){
   apply(groups.thighL,-.48*d);apply(groups.thighR,.48*d);
   apply(groups.calfL,.62*d);apply(groups.calfR,-.62*d);
   apply(groups.upperL,.18*d);apply(groups.upperR,-.18*d);
  }else if(kind==="knee-flexion"){
   apply(groups.calfL,.72*d);apply(groups.calfR,.72*d);
  }else if(kind==="calf-raise"){
   apply(groups.footL,-.32*d);apply(groups.footR,-.32*d);
   if(groups.pelvis){const r=rest.get(groups.pelvis);groups.pelvis.position.copy(r.p);groups.pelvis.position.y+=.05*d}
  }else if(kind==="elbow-flexion"){
   apply(groups.lowerL,-.88*d);apply(groups.lowerR,-.88*d);
   apply(groups.upperL,-.08*d);apply(groups.upperR,-.08*d);
  }else if(kind==="elbow-extension"){
   apply(groups.lowerL,.72*d);apply(groups.lowerR,.72*d);
  }else if(kind==="bridge"){
   apply(groups.thighL,-.42*d);apply(groups.thighR,-.42*d);
   apply(groups.spine1,-.22*d);apply(groups.spine2,-.20*d);apply(groups.spine3,-.12*d);
   if(groups.pelvis){const r=rest.get(groups.pelvis);groups.pelvis.position.copy(r.p);groups.pelvis.position.y+=.18*d}
  }else if(kind==="core"){
   apply(groups.spine1,.10*d);apply(groups.spine2,.08*d);
   apply(groups.upperL,-.22*d);apply(groups.upperR,-.22*d);
   apply(groups.thighL,.16*d);apply(groups.thighR,.16*d);
  }else if(kind==="mobility"){
   apply(groups.spine1,.22*d);apply(groups.spine2,.18*d);apply(groups.spine3,.12*d);
   apply(groups.neck,-.10*d);apply(groups.head,.08*d);
  }else if(kind==="cardio"){
   apply(groups.thighL,-.48*d);apply(groups.thighR,.48*d);
   apply(groups.calfL,.62*d);apply(groups.calfR,-.62*d);
   apply(groups.upperL,.18*d);apply(groups.upperR,-.18*d);
  }
 };
 return {update,kind,boneCount:rest.size,groups:Object.keys(groups).filter(k=>groups[k]),dispose(){for(const [bone,r] of rest){bone.quaternion.copy(r.q);bone.position.copy(r.p)}}};
}

function makeViewer(host,exerciseId){
 if(host.dataset.rumboHumanReady==="1")return ()=>{};
 host.dataset.rumboHumanReady="1";
 const viewerHeight=host.closest(".exercise-library-art")?300:380;const w=Math.max(280,host.clientWidth||420),h=viewerHeight;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(w,h);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const viewport=document.createElement("div");viewport.className="rumbo-human-viewport";viewport.style.cssText="position:relative;flex:0 0 ${viewerHeight}px;width:100%;height:${viewerHeight}px;min-height:${viewerHeight}px;overflow:hidden;border-radius:16px;background:radial-gradient(ellipse at 50% 38%,#1b4357 0%,#0b2233 65%,#071724 100%)";viewport.appendChild(renderer.domElement);host.style.cssText+=";height:auto!important;min-height:0!important;overflow:visible!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:10px!important;width:100%!important";host.replaceChildren(viewport);
 const scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xe8f7ff,0x243445,2.0));
 const key=new THREE.DirectionalLight(0xfff1df,3.0);key.position.set(-3,5,4);key.castShadow=true;scene.add(key);
 const fill=new THREE.DirectionalLight(0x62d9dd,1.15);fill.position.set(3,2,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.1,64),new THREE.MeshStandardMaterial({color:0x18394b,roughness:.9}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.03,.012,8,80),new THREE.MeshStandardMaterial({color:0x36c6c4,emissive:0x0a5557,emissiveIntensity:.4}));
 ring.rotation.x=Math.PI/2;ring.position.y=.012;scene.add(ring);
 const camera=new THREE.PerspectiveCamera(32,w/h,.1,100);camera.position.set(2.7,1.9,4.1);camera.lookAt(0,.95,0);
 const status=document.createElement("div");status.textContent="CARGANDO MODELO HUMANO…";status.style.cssText="position:relative;order:2;width:100%;box-sizing:border-box;padding:7px 10px;border:1px solid #285365;border-radius:8px;background:#0b2636;color:#a9f2ed;font:600 10px system-ui;letter-spacing:.08em;text-align:center";host.appendChild(status);
 const controls=document.createElement("div");controls.style.cssText="position:relative;order:3;display:flex;gap:7px;z-index:4;flex-wrap:wrap;justify-content:center;width:100%;padding:2px 0";
 const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.style.cssText="border:1px solid #43808c;border-radius:7px;padding:6px 8px;background:#12384a;color:#dffcff;font:600 11px system-ui;cursor:pointer";b.addEventListener("click",fn);controls.appendChild(b);return b};
 host.appendChild(controls);
 let model=null,mixer=null,clipAction=null,exerciseMotion=null,paused=false,rate=1,az=0,el=.08,zoom=1,drag=false,lastX=0,lastY=0,raf=0,disposed=false,last=performance.now(),motionTime=0;
 button("Frontal",()=>{az=0;el=.08});button("Lateral",()=>{az=Math.PI/2;el=.08});button("Posterior",()=>{az=Math.PI;el=.08});
 const pauseButton=button("Ⅱ Pausa",()=>{paused=!paused;pauseButton.textContent=paused?"▶ Reanudar":"Ⅱ Pausa"});
 button("−",()=>{rate=clamp(rate-.25,.5,2)});button("Velocidad 1×",()=>{rate=rate>=2?.5:rate+.25});
 const onDown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
 const onUp=()=>drag=false;
 const onMove=e=>{if(!drag)return;az+=(e.clientX-lastX)*.008;el=clamp(el+(e.clientY-lastY)*.006,-.35,.5);lastX=e.clientX;lastY=e.clientY};
 const onWheel=e=>{zoom=clamp(zoom+e.deltaY*.001,.75,1.35)};
 renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointercancel",onUp);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
 const resize=new ResizeObserver(()=>{const ww=viewport.clientWidth,hh=viewport.clientHeight;if(!ww||!hh)return;renderer.setSize(ww,hh);camera.aspect=ww/hh;camera.updateProjectionMatrix()});resize.observe(viewport);
 const loader=new GLTFLoader();
 loader.load(MODEL_URL,gltf=>{
  if(disposed)return;
  model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=1.72/Math.max(size.y,.001);model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(.42,o.material.roughness??.65);o.material.envMapIntensity=1}}});
  scene.add(model);
  exerciseMotion=createExerciseMotion(THREE,model,exerciseId);host.dataset.humanAnimation=exerciseMotion.kind;host.dataset.humanRigBones=String(exerciseMotion.boneCount);host.dataset.humanRigGroups=exerciseMotion.groups.join(",");if(!exerciseMotion.boneCount){status.textContent="NO SE HAN RECONOCIDO ARTICULACIONES";status.style.background="#7a302d"}else{status.textContent="ANIMACIÓN ACTIVA · "+exerciseMotion.kind.toUpperCase()+" · "+exerciseMotion.boneCount+" HUESOS"}
  host.dataset.humanModel="sam-clothed-rigged";host.dataset.humanLicense="CC0";host.dataset.humanBones=String(model.getObjectByProperty("type","SkinnedMesh")?.skeleton?.bones?.length||0);
  status.textContent="ANIMACIÓN ACTIVA · "+(exerciseMotion?exerciseMotion.kind.toUpperCase():"PREPARANDO")+" · "+(exerciseMotion?.boneCount||0)+" HUESOS";status.style.background="#0b2636";
 },undefined,error=>{status.textContent="No se pudo cargar el modelo 3D";status.style.background="#7a302d";host.dataset.humanModel="load-error";console.error("RUMBO human GLB load failed",error)});
 const render=now=>{if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(.05,(now-last)/1000);last=now;if(!paused&&exerciseMotion){motionTime+=dt*rate;exerciseMotion.update(motionTime)}const radius=(viewerHeight===300?3.65:3.25)*zoom;camera.position.set(radius*Math.sin(az)*Math.cos(el),1.05+radius*(.16+el),radius*Math.cos(az)*Math.cos(el));camera.lookAt(0,.88,0);renderer.render(scene,camera)};
 raf=requestAnimationFrame(render);host.dataset.engine="three-glb";
 return ()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointercancel",onUp);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("wheel",onWheel);if(mixer)mixer.stopAllAction();if(exerciseMotion)exerciseMotion.dispose();renderer.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});renderer.domElement.remove();controls.remove();status.remove();viewport.remove();host.dataset.rumboHumanReady="0"};
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
