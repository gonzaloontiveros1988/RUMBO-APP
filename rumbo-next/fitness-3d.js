// RUMBO Fitness — clean GLB-first human viewer.
// Model: Sam, clothed and rigged, CC0, from Innerscene / MakeHuman- MPFB assets.
// This file intentionally contains no procedural humanoid made from geometric primitives.
const THREE_URL="https://esm.sh/three@0.170.0";
const LOADER_URL="https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
const MODEL_URL="https://files.innerscene.com/library/relaxed-walk-sam-3d-person-animated-732f1206/b11d02f72ad777e03d68/relaxed-walk-sam-3d-person-animated.glb";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let activeHost=null,activeDispose=null,THREE=null,GLTFLoader=null;
function makeViewer(host,exerciseId){
 if(host.dataset.rumboHumanReady==="1")return ()=>{};
 host.dataset.rumboHumanReady="1";
 const w=Math.max(240,host.clientWidth||360),h=Math.max(260,host.clientHeight||320);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(w,h);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 host.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xe8f7ff,0x243445,2.0));
 const key=new THREE.DirectionalLight(0xfff1df,3.0);key.position.set(-3,5,4);key.castShadow=true;scene.add(key);
 const fill=new THREE.DirectionalLight(0x62d9dd,1.15);fill.position.set(3,2,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.1,64),new THREE.MeshStandardMaterial({color:0x18394b,roughness:.9}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.03,.012,8,80),new THREE.MeshStandardMaterial({color:0x36c6c4,emissive:0x0a5557,emissiveIntensity:.4}));
 ring.rotation.x=Math.PI/2;ring.position.y=.012;scene.add(ring);
 const camera=new THREE.PerspectiveCamera(32,w/h,.1,100);camera.position.set(2.7,1.9,4.1);camera.lookAt(0,.95,0);
 const stage=document.createElement("div");stage.className="rumbo-human-stage";stage.style.cssText="position:absolute;inset:0;pointer-events:none";
 const status=document.createElement("div");status.textContent="Cargando modelo humano…";status.style.cssText="position:absolute;left:10px;top:10px;padding:6px 9px;border-radius:8px;background:#102c3dcc;color:#a9f2ed;font:600 10px system-ui;letter-spacing:.08em";
 stage.appendChild(status);host.appendChild(stage);
 const controls=document.createElement("div");controls.style.cssText="position:absolute;left:8px;bottom:8px;display:flex;gap:5px;z-index:4;flex-wrap:wrap";
 const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.style.cssText="border:1px solid #43808c;border-radius:7px;padding:6px 8px;background:#12384a;color:#dffcff;font:600 11px system-ui;cursor:pointer";b.addEventListener("click",fn);controls.appendChild(b);return b};
 host.appendChild(controls);
 let model=null,mixer=null,clipAction=null,paused=false,rate=1,az=0,el=.08,zoom=1,drag=false,lastX=0,lastY=0,raf=0,disposed=false,last=performance.now();
 button("Frontal",()=>{az=0;el=.08});button("Lateral",()=>{az=Math.PI/2;el=.08});button("Posterior",()=>{az=Math.PI;el=.08});
 const pauseButton=button("Ⅱ Pausa",()=>{paused=!paused;pauseButton.textContent=paused?"▶ Reanudar":"Ⅱ Pausa"});
 button("−",()=>{rate=clamp(rate-.25,.5,2)});button("Velocidad 1×",()=>{rate=rate>=2?.5:rate+.25});
 const onDown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)};
 const onUp=()=>drag=false;
 const onMove=e=>{if(!drag)return;az+=(e.clientX-lastX)*.008;el=clamp(el+(e.clientY-lastY)*.006,-.35,.5);lastX=e.clientX;lastY=e.clientY};
 const onWheel=e=>{zoom=clamp(zoom+e.deltaY*.001,.75,1.35)};
 renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onUp);renderer.domElement.addEventListener("pointercancel",onUp);renderer.domElement.addEventListener("pointermove",onMove);renderer.domElement.addEventListener("wheel",onWheel,{passive:true});
 const resize=new ResizeObserver(()=>{const ww=host.clientWidth,hh=host.clientHeight;if(!ww||!hh)return;renderer.setSize(ww,hh);camera.aspect=ww/hh;camera.updateProjectionMatrix()});resize.observe(host);
 const loader=new GLTFLoader();
 loader.load(MODEL_URL,gltf=>{
  if(disposed)return;
  model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=1.72/Math.max(size.y,.001);model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  model.rotation.y=Math.PI;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material.roughness=Math.max(.42,o.material.roughness??.65);o.material.envMapIntensity=1}}});
  scene.add(model);
  if(gltf.animations?.length){mixer=new THREE.AnimationMixer(model);const clip=gltf.animations.find(a=>/walk/i.test(a.name))||gltf.animations[0];clipAction=mixer.clipAction(clip);clipAction.play();host.dataset.humanAnimation=clip.name||"included"}
  host.dataset.humanModel="sam-clothed-rigged";host.dataset.humanLicense="CC0";host.dataset.humanBones=String(model.getObjectByProperty("type","SkinnedMesh")?.skeleton?.bones?.length||0);
  status.textContent="MODELO HUMANO 3D · CC0";status.style.background="#0d554dcc";
 },undefined,error=>{status.textContent="No se pudo cargar el modelo 3D";status.style.background="#7a302dcc";host.dataset.humanModel="load-error";console.error("RUMBO human GLB load failed",error)});
 const render=now=>{if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(.05,(now-last)/1000);last=now;if(mixer)mixer.update(paused?0:dt*rate);const radius=4.15*zoom;camera.position.set(radius*Math.sin(az)*Math.cos(el),1.0+radius*(.20+el),radius*Math.cos(az)*Math.cos(el));camera.lookAt(0,.91,0);renderer.render(scene,camera)};
 raf=requestAnimationFrame(render);host.dataset.engine="three-glb";
 return ()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onUp);renderer.domElement.removeEventListener("pointercancel",onUp);renderer.domElement.removeEventListener("pointermove",onMove);renderer.domElement.removeEventListener("wheel",onWheel);if(mixer)mixer.stopAllAction();renderer.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});renderer.domElement.remove();controls.remove();stage.remove();host.dataset.rumboHumanReady="0"};
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
