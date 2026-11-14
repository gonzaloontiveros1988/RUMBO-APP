// RUMBO 3D exercise viewer. Progressive enhancement: keeps the 2D demo if WebGL/Three.js is unavailable.
const THREE_URLS=["https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","https://esm.sh/three@0.170.0"];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const presets={
 squat:{kind:"squat",camera:[3.1,2.25,4.5]}, "back-squat":{kind:"squat",camera:[3.1,2.25,4.5]},"front-squat":{kind:"squat",camera:[3.1,2.25,4.5]},
 "split-squat":{kind:"lunge",camera:[3.4,2.2,4.5]},"reverse-lunge":{kind:"lunge",camera:[3.4,2.2,4.5]},"step-up":{kind:"lunge",camera:[3.4,2.2,4.5]},
 rdl:{kind:"hinge",camera:[3.2,2.1,4.7]},"single-leg-rdl":{kind:"hinge",camera:[3.2,2.1,4.7]},
 "bench-press":{kind:"press",camera:[3.8,2.0,4.4]},"db-press":{kind:"press",camera:[3.8,2.0,4.4]},"incline-db-press":{kind:"press",camera:[3.8,2.0,4.4]},"shoulder-press":{kind:"press",camera:[3.4,2.4,4.6]},
 row:{kind:"row",camera:[3.3,2.1,4.5]},"one-arm-row":{kind:"row",camera:[3.3,2.1,4.5]},"lat-pulldown":{kind:"pull",camera:[3.4,2.3,4.6]},"pull-up":{kind:"pull",camera:[3.4,2.3,4.6]},
 "hip-bridge":{kind:"bridge",camera:[3.4,2.0,4.5]},"hip-thrust":{kind:"bridge",camera:[3.4,2.0,4.5]},"push-up":{kind:"plank",camera:[3.6,2.0,4.6]},plank:{kind:"plank",camera:[3.6,2.0,4.6]},"side-plank":{kind:"plank",camera:[3.6,2.0,4.6]},
 "biceps-curl":{kind:"curl",camera:[3.3,2.3,4.5]},"triceps-pushdown":{kind:"curl",camera:[3.3,2.3,4.5]},"lateral-raise":{kind:"raise",camera:[3.3,2.3,4.5]},"farmer-carry":{kind:"carry",camera:[3.3,2.3,4.5]}, "leg-press":{kind:"squat",camera:[3.5,2.1,4.8]},"leg-curl":{kind:"curl",camera:[3.5,2.1,4.8]},"calf-raise":{kind:"squat",camera:[3.2,2.3,4.5]},"chest-fly":{kind:"press",camera:[3.8,2.0,4.4]},"face-pull":{kind:"pull",camera:[3.4,2.3,4.6]},"pallof-press":{kind:"carry",camera:[3.3,2.3,4.5]},"dead-bug":{kind:"plank",camera:[3.6,2.0,4.6]},"bird-dog":{kind:"plank",camera:[3.6,2.0,4.6]},"mountain-climber":{kind:"plank",camera:[3.6,2.0,4.6]},"cat-cow":{kind:"hinge",camera:[3.2,2.1,4.7]},"thoracic-rotation":{kind:"hinge",camera:[3.2,2.1,4.7]},"hip-flexor-stretch":{kind:"lunge",camera:[3.4,2.2,4.5]},"90-90-hip-switch":{kind:"lunge",camera:[3.4,2.2,4.5]},"ankle-rock":{kind:"lunge",camera:[3.4,2.2,4.5]},"childs-pose":{kind:"plank",camera:[3.6,2.0,4.6]},"jump-rope":{kind:"carry",camera:[3.3,2.3,4.5]},"cycling":{kind:"bridge",camera:[3.4,2.0,4.5]}
};
function init(host,id,THREE){
 if(host.dataset.ready==="1")return ()=>{};
 host.dataset.ready="1";
 const w=host.clientWidth||360,h=host.clientHeight||220;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(w,h);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene();scene.background=null;
 const camera=new THREE.PerspectiveCamera(34,w/h,.1,100);const preset=presets[id]||{kind:"squat",camera:[3.2,2.3,4.6]};camera.position.set(...preset.camera);camera.lookAt(0,1.05,0);
 scene.add(new THREE.HemisphereLight(0xd9f4ff,0x233746,2.0));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(3,5,4);key.castShadow=true;scene.add(key);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.MeshStandardMaterial({color:0x18384a,roughness:.8,transparent:true,opacity:.55}));floor.rotation.x=-Math.PI/2;floor.position.y=.015;scene.add(floor);
 const mat=(color,rough=.58)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.02});
 const skin=mat(0xd7a77f),shirt=mat(0x42c6ce),shorts=mat(0x24475d),jointMat=mat(0xe7c09f),shoe=mat(0x172b39),weightMat=mat(0xb8cbd3,.3);
 const ball=new THREE.SphereGeometry(1,32,24), limbGeo=new THREE.CapsuleGeometry(.075,.78,8,16);
 const nodes={};function node(name,material,r=.09,scale=[1,1,1]){const m=new THREE.Mesh(ball,material);m.scale.set(r*scale[0],r*scale[1],r*scale[2]);m.castShadow=true;m.receiveShadow=true;scene.add(m);nodes[name]=m}
 node("head",skin,.145,[.82,1.12,.9]);node("neck",skin,.075,[.9,1.15,.9]);
 node("pelvis",shorts,.19,[1.12,.72,.78]);node("chest",shirt,.23,[1.12,1.12,.78]);
 node("abdomen",shirt,.15,[.92,1.35,.76]);node("gluteL",shorts,.13,[1.1,.9,.85]);node("gluteR",shorts,.13,[1.1,.9,.85]);
 node("shoulderL",shirt,.105,[1.15,1,.95]);node("shoulderR",shirt,.105,[1.15,1,.95]);
 node("elbowL",skin,.068);node("elbowR",skin,.068);node("kneeL",shorts,.078,[1,.9,.92]);node("kneeR",shorts,.078,[1,.9,.92]);
 ["ls","rs","le","re","lw","rw","lh","rh","lk","rk","la","ra"].forEach(n=>node(n,jointMat,.065));
 node("handL",skin,.075,[.78,1.25,.7]);node("handR",skin,.075,[.78,1.25,.7]);
 node("footL",shoe,.11,[.8,.55,1.7]);node("footR",shoe,.11,[.8,.55,1.7]);
 const bones={};function bone(name,material,r=.065){const m=new THREE.Mesh(limbGeo,material);m.castShadow=true;m.receiveShadow=true;scene.add(m);bones[name]=m}
 ["upperArmL","lowerArmL","upperArmR","lowerArmR","thighL","shinL","thighR","shinR"].forEach(n=>bone(n,n.startsWith("thigh")?shorts:skin,n.startsWith("thigh")?.105:.07));
 const dumbbells=[];for(let s of [-1,1]){const g=new THREE.Group();const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.32,12),weightMat);bar.rotation.z=Math.PI/2;g.add(bar);for(let z of [-.17,.17]){const d=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.07,16),weightMat);d.rotation.z=Math.PI/2;d.position.x=z;g.add(d)}scene.add(g);dumbbells.push(g)}
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 function segment(mesh,a,b){const mid=a.clone().add(b).multiplyScalar(.5),dir=b.clone().sub(a);mesh.position.copy(mid);const arm=mesh===bones.upperArmL||mesh===bones.upperArmR||mesh===bones.lowerArmL||mesh===bones.lowerArmR;
 mesh.scale.set(arm ? .92 : 1,Math.max(.05,dir.length()-.12),arm?.92:1);mesh.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize())}
 let dragging=false,lastX=0,lastY=0,az=0,el=0,dist=1;renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener("pointerup",()=>dragging=false);renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;az+=(e.clientX-lastX)*.008;el=clamp(el+(e.clientY-lastY)*.006,-.5,.65);lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener("wheel",e=>{dist=clamp(dist+e.deltaY*.002,.72,1.6)},{passive:true});
 const phase=(t)=>.5-.5*Math.cos(t*Math.PI*2);
 function pose(p){
  const k=preset.kind,u=phase(p),P={};
  const upright=k!=="plank"&&k!=="bridge";
  if(id==="squat"){
   const d=.30*u,torso=.13*u,hip=V(.015+d*.16,1-d,0),chest=V(-Math.sin(torso)*.48,hip.y+.46,0),head=V(chest.x-.035,hip.y+.91,0);
   Object.assign(P,{pelvis:hip,chest,neck:V(chest.x-.015,chest.y+.13,0),head,
    ls:V(chest.x-.17,chest.y-.02,-.2),rs:V(chest.x-.17,chest.y-.02,.2),
    lh:V(.02,hip.y,-.14),rh:V(.02,hip.y,.14),
    lk:V(-.12-.22*u,hip.y-.43,-.14),rk:V(-.12-.22*u,hip.y-.43,.14),
    la:V(-.10, .12,-.14),ra:V(-.10,.12,.14)});
   P.le=V(chest.x-.28,chest.y-.04,-.2);P.re=V(chest.x-.28,chest.y-.04,.2);
   P.lw=V(chest.x-.42,chest.y-.12,-.16);P.rw=V(chest.x-.42,chest.y-.12,.16);
  }
  else if(id==="rdl"){
   const hinge=.48*u,hip=V(.30*u,1-.06*u,0),chest=V(-hinge,hip.y+.40,0),head=V(-hinge-.04,hip.y+.82,0);
   Object.assign(P,{pelvis:hip,chest,neck:V(chest.x-.02,chest.y+.12,0),head,
    ls:V(chest.x-.17,chest.y-.02,-.2),rs:V(chest.x-.17,chest.y-.02,.2),
    lh:V(hip.x-.08,hip.y,-.14),rh:V(hip.x-.08,hip.y,.14),
    lk:V(hip.x-.10,hip.y-.43,-.14),rk:V(hip.x-.10,hip.y-.43,.14),
    la:V(.02,.12,-.14),ra:V(.02,.12,.14)});
   P.le=V(chest.x-.12,chest.y-.18,-.2);P.re=V(chest.x-.12,chest.y-.18,.2);
   P.lw=V(chest.x-.05-.12*u,hip.y-.53,-.2);P.rw=V(chest.x-.05-.12*u,hip.y-.53,.2);
  }
  else if(id==="bench-press"){
   const press=.5-.5*Math.cos(p*Math.PI*2),shoulder=V(-.38,.66,0),elbow=V(-.48,.78,0),wrist=V(-.43,.98+.20*press,0);
   Object.assign(P,{head:V(-1.08,.57,0),neck:V(-.86,.59,0),chest:V(-.38,.62,0),pelvis:V(.28,.53,0),
    ls:V(-.39,.68,-.2),rs:V(-.39,.68,.2),lh:V(.28,.53,-.14),rh:V(.28,.53,.14),
    lk:V(.65,.34,-.14),rk:V(.65,.34,.14),la:V(.91,.12,-.14),ra:V(.91,.12,.14),
    le:V(elbow.x,elbow.y,-.29),re:V(elbow.x,elbow.y,.29),lw:V(wrist.x,wrist.y,-.29),rw:V(wrist.x,wrist.y,.29)});
  }
  else if(id==="row"){
   const pull=.5-.5*Math.cos(p*Math.PI*2),hip=V(.28,.62,0),chest=V(.12,.98,0);
   Object.assign(P,{head:V(.06,1.42,0),neck:V(.10,1.12,0),chest,pelvis:hip,
    ls:V(-.03,1.0,-.2),rs:V(-.03,1,.2),
    lh:V(.28,.62,-.14),rh:V(.28,.62,.14),lk:V(-.02,.38,-.14),rk:V(-.02,.38,.14),
    la:V(-.48,.12,-.14),ra:V(-.48,.12,.14),
    le:V(-.34+.34*pull,.82,-.29),re:V(-.34+.34*pull,.82,.29),
    lw:V(-.63+.44*pull,.80,-.29),rw:V(-.63+.44*pull,.80,.29)});
  }
  else if(id==="reverse-lunge"){
   const d=.28*u,hip=V(0,1-d,0),chest=V(-.045,hip.y+.46,0);
   Object.assign(P,{pelvis:hip,chest,neck:V(chest.x,chest.y+.13,0),head:V(chest.x-.02,chest.y+.80,0),
    ls:V(chest.x-.17,chest.y,-.2),rs:V(chest.x-.17,chest.y,.2),
    lh:V(-.10,hip.y,-.14),rh:V(.18,hip.y,.14),
    lk:V(-.12,hip.y-.43,-.14),rk:V(.38,hip.y-.38,.14),
    la:V(-.12,.12,-.14),ra:V(.64,.12,.14),
    le:V(chest.x-.25,chest.y-.28,-.2),re:V(chest.x-.25,chest.y-.28,.2),
    lw:V(chest.x-.27,chest.y-.55,-.2),rw:V(chest.x-.27,chest.y-.55,.2)});
  }
  else if(k==="plank"){Object.assign(P,{head:V(-.95,1.05,0),neck:V(-.78,1.03,0),chest:V(-.35,.99,0),pelvis:V(.38,.96,0),lh:V(.42,.95,-.13),rh:V(.42,.95,.13),lk:V(.85,.92,-.13),rk:V(.85,.92,.13),la:V(1.18,.91,-.13),ra:V(1.18,.91,.13),ls:V(-.58,.95,-.18),rs:V(-.58,.95,.18),le:V(-.72,.62,-.18),re:V(-.72,.62,.18),lw:V(-.95,.56,-.18),rw:V(-.95,.56,.18)})}
  else if(k==="bridge"){Object.assign(P,{head:V(-1.05,.28,0),neck:V(-.85,.34,0),chest:V(-.35,.62,0),pelvis:V(.25,.68,0),lh:V(.42,.62,-.13),rh:V(.42,.62,.13),lk:V(.82,.36,-.13),rk:V(.82,.36,.13),la:V(1.08,.13,-.13),ra:V(1.08,.13,.13),ls:V(-.58,.52,-.18),rs:V(-.58,.52,.18),le:V(-.72,.28,-.18),re:V(-.72,.28,.18),lw:V(-.9,.13,-.18),rw:V(-.9,.13,.18)})}
  else {
   let hipY=1.0,kneeF=0,torso=0,stance=.25;
   if(k==="squat"){hipY=1-.34*u;kneeF=.42*u;torso=.12*u}
   if(k==="lunge"){hipY=1-.28*u;kneeF=.34*u;stance=.42}
   if(k==="hinge"){hipY=1-.12*u;torso=.48*u}
   if(k==="press"||k==="pull"){hipY=1; kneeF=0}
   if(k==="row"){torso=.38;kneeF=.08}
   if(k==="curl"||k==="raise"||k==="carry"){hipY=1}
   const hip=V(0,hipY,0),chest=V(Math.sin(torso)*.22,hipY+.47,0),head=V(Math.sin(torso)*.28,hipY+.94,0);
   Object.assign(P,{pelvis:hip,chest,neck:V(chest.x*.9,chest.y+.12,0),head,ls:V(chest.x-.19,chest.y-.02,-.2),rs:V(chest.x-.19,chest.y-.02,.2),lh:V(-.13,hipY, -.14),rh:V(-.13,hipY,.14)});
   P.lk=V(-.13-kneeF,hipY-.43,-.14);P.rk=V(-.13+kneeF,hipY-.43,.14);P.la=V(-.12-kneeF,Math.max(.08,hipY-.88),-.14);P.ra=V(-.12+kneeF,Math.max(.08,hipY-.88),.14);
   let armL=V(chest.x-.3,chest.y-.3,-.25),armR=V(chest.x-.3,chest.y-.3,.25);
   if(k==="press"){armL=V(chest.x-.28,chest.y+.05+.45*u,-.28);armR=V(chest.x-.28,chest.y+.05+.45*u,.28)}
   if(k==="pull"){armL=V(chest.x-.32,chest.y+.5-.4*u,-.28);armR=V(chest.x-.32,chest.y+.5-.4*u,.28)}
   if(k==="row"){armL=V(chest.x-.35,chest.y-.25+.22*u,-.28);armR=V(chest.x-.35,chest.y-.25+.22*u,.28)}
   if(k==="curl"){armL=V(chest.x-.28,chest.y-.15+.28*u,-.28);armR=V(chest.x-.28,chest.y-.15+.28*u,.28)}
   if(k==="raise"){armL=V(chest.x-.55*u,chest.y-.05+.45*u,-.28);armR=V(chest.x-.55*u,chest.y-.05+.45*u,.28)}
   if(k==="carry"){armL=V(chest.x-.2,chest.y-.55,-.25);armR=V(chest.x-.2,chest.y-.55,.25)}
   P.le=armL;P.re=armR;P.lw=V(armL.x-.08,armL.y-.28,-.28);P.rw=V(armR.x-.08,armR.y-.28,.28);
  }
  P.spine=P.chest.clone().lerp(P.pelvis,.4);
  return P;
 }
 let raf;const start=performance.now();
 function draw(now){raf=requestAnimationFrame(draw);const p=((now-start)/2400)%1,P=pose(p);
  Object.entries(P).forEach(([n,v])=>{if(nodes[n])nodes[n].position.copy(v)});
  if(nodes.chest){nodes.chest.position.copy(P.chest);nodes.chest.quaternion.setFromUnitVectors(V(0,1,0),P.chest.clone().sub(P.pelvis).normalize())}
  if(nodes.pelvis)nodes.pelvis.position.copy(P.pelvis);
  if(nodes.neck)nodes.neck.position.copy(P.neck);
  if(nodes.abdomen){nodes.abdomen.position.copy(P.chest).lerp(P.pelvis,.48);nodes.abdomen.quaternion.copy(nodes.chest.quaternion)}
  if(nodes.gluteL){nodes.gluteL.position.copy(P.pelvis).add(V(.015,-.045,-.105));nodes.gluteR.position.copy(P.pelvis).add(V(.015,-.045,.105))}
  if(nodes.shoulderL){nodes.shoulderL.position.copy(P.ls);nodes.shoulderR.position.copy(P.rs)}
  if(nodes.elbowL){nodes.elbowL.position.copy(P.le);nodes.elbowR.position.copy(P.re)}
  if(nodes.kneeL){nodes.kneeL.position.copy(P.lk);nodes.kneeR.position.copy(P.rk)}
  if(nodes.head)nodes.head.position.copy(P.head);
  [["upperArmL","ls","le"],["lowerArmL","le","lw"],["upperArmR","rs","re"],["lowerArmR","re","rw"],["thighL","lh","lk"],["shinL","lk","la"],["thighR","rh","rk"],["shinR","rk","ra"]].forEach(([b,a,c])=>segment(bones[b],P[a],P[c]));
  if(P.lw){nodes.handL.position.copy(P.lw);nodes.handR.position.copy(P.rw);nodes.footL.position.copy(P.la).add(V(.07,-.035,0));nodes.footR.position.copy(P.ra).add(V(.07,-.035,0))}
  dumbbells.forEach((d,i)=>{const w=P[i===0?"lw":"rw"];d.position.copy(w);d.visible=["press","curl","raise","carry"].includes(preset.kind)});
  const target=V(0,1,0),radius=4.9*dist;camera.position.set(target.x+radius*Math.sin(az||.48)*Math.cos(el),target.y+radius*(.22+el),target.z+radius*Math.cos(az||.48)*Math.cos(el));camera.lookAt(target);renderer.render(scene,camera);
 }
 draw(performance.now());
 const ro=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()});ro.observe(host);
 host.dataset.engine="three";host.setAttribute("aria-label","Modelo humano 3D animado. Arrastra para rotar la cámara y usa la rueda para acercar.");
 return ()=>{
  cancelAnimationFrame(raf);ro.disconnect();renderer.dispose();
  scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});
  renderer.domElement.remove();
 };
}
let THREE_PROMISE,activeHost=null,activeDispose=null,activeFallback=null;
async function boot(){
 const restoreActive=()=>{
  if(activeDispose){try{activeDispose()}catch(e){console.warn("RUMBO renderer cleanup",e)}}
  if(activeHost){
   activeHost.dataset.ready="0";activeHost.dataset.engine="idle";
   if(activeFallback){activeHost.replaceChildren(activeFallback);activeFallback.style.display="block";activeFallback.style.opacity="1"}
  }
  activeHost=null;activeDispose=null;activeFallback=null;
 };
 const scan=()=>{
  const all=[...document.querySelectorAll(".guided-figure[data-exercise-3d]")];
  const preferred=document.querySelector(".guided-exercise-card .guided-figure[data-exercise-3d], .program-exercise-detail .guided-figure[data-exercise-3d]");
  const library=document.querySelector(".exercise-library-card .guided-figure[data-exercise-3d]");
  const target=preferred||library||all[0]||null;
  if(target===activeHost)return;
  restoreActive();
  if(!target||!window.__RUMBO_THREE__||window.__RUMBO_THREE_FAILED__)return;
  activeHost=target;activeFallback=target.querySelector("svg")?.cloneNode(true)||null;
  target.dataset.engine="loading";
  try{activeDispose=init(target,target.dataset.exercise3d,window.__RUMBO_THREE__)}
  catch(e){
   target.dataset.ready="0";target.dataset.engine="fallback";
   if(activeFallback){target.replaceChildren(activeFallback);activeFallback.style.display="block";activeFallback.style.opacity="1"}
   target.title="No se pudo iniciar el visor 3D: "+(e&&e.message||"error WebGL");
   console.error("RUMBO 3D init failed",e);activeHost=null;activeDispose=null;activeFallback=null;
  }
 };
 const root=document.getElementById("view")||document.body;
 const observer=new MutationObserver(()=>{if(!window.__RUMBO_SCAN_PENDING__){window.__RUMBO_SCAN_PENDING__=true;requestAnimationFrame(()=>{window.__RUMBO_SCAN_PENDING__=false;scan()})}});
 observer.observe(root,{childList:true,subtree:true});
 scan();
 try{
  let THREE,lastError;
  for(const url of THREE_URLS){try{THREE=await import(url);break}catch(e){lastError=e;console.warn("RUMBO Three.js source failed",url,e)}}
  if(!THREE)throw lastError||new Error("No se pudo descargar Three.js");
  window.__RUMBO_THREE__=THREE;scan();
 }catch(e){
  window.__RUMBO_THREE_FAILED__=true;
  document.querySelectorAll(".guided-figure[data-exercise-3d]").forEach(host=>{host.dataset.engine="fallback";host.dataset.ready="0";host.title="Visor 3D no disponible: "+(e&&e.message||"error de carga")});
  console.error("RUMBO 3D library failed",e);
 }
}
if(typeof window!=="undefined")boot();
