// RUMBO Fitness · 2D exercise sequence illustrations
// Original inline vector artwork: three readable phases, no external assets or runtime dependencies.
const C={ink:"#d9e8ed",body:"#69d9d0",shade:"#2b9d9d",joint:"#f4c77f",metal:"#91a9b7",floor:"#547180"};
const families={
 squat:[[0,0],[0,0],[0,0]],
 hinge:[[0,0],[0,0],[0,0]],
 lunge:[[0,0],[0,0],[0,0]],
 push:[[0,0],[0,0],[0,0]],
 pull:[[0,0],[0,0],[0,0]],
 overhead:[[0,0],[0,0],[0,0]],
 curl:[[0,0],[0,0],[0,0]],
 raise:[[0,0],[0,0],[0,0]],
 bridge:[[0,0],[0,0],[0,0]],
 plank:[[0,0],[0,0],[0,0]],
 mobility:[[0,0],[0,0],[0,0]],
 cardio:[[0,0],[0,0],[0,0]],
 carry:[[0,0],[0,0],[0,0]],
 calf:[[0,0],[0,0],[0,0]]
};
function family(ex){
 const id=ex.id||"",p=(ex.pattern||"").toLowerCase(),n=(ex.name||"").toLowerCase();
 if(/squat/.test(id)||p==="squat")return "squat";
 if(/deadlift|rdl|pull-through/.test(id)||p.includes("hinge"))return "hinge";
 if(/lunge|step-up|step-down|split-squat/.test(id)||p.includes("single-leg"))return "lunge";
 if(/bench|push-up|chest-press|chest-fly|pec-deck/.test(id)||p.includes("horizontal push"))return "push";
 if(/row|face-pull|pull-up|pulldown/.test(id)||p.includes("horizontal pull")||p.includes("vertical pull"))return "pull";
 if(/shoulder-press|overhead/.test(id)||p.includes("vertical push"))return "overhead";
 if(/curl|triceps-pushdown|external-rotation/.test(id)||p.includes("elbow flexion")||p.includes("elbow extension")||p.includes("rotation"))return "curl";
 if(/raise/.test(id)||p.includes("abduction"))return "raise";
 if(/bridge|thrust/.test(id)||p.includes("hip extension"))return "bridge";
 if(/plank|dead-bug|bird-dog|crunch|pallof|mountain-climber/.test(id)||p.includes("core")||p.includes("anti-rotation"))return "plank";
 if(/stretch|mobility|cat-cow|thoracic|90-90|ankle-rock|childs/.test(id)||/mobility|stretch/.test(p))return "mobility";
 if(/jump|cycling|rope/.test(id)||p.includes("cardio"))return "cardio";
 if(/carry/.test(id)||p.includes("carry"))return "carry";
 if(/calf/.test(id)||p.includes("ankle"))return "calf";
 return "neutral";
}
function points(f,k){
 const stand={head:[0,-37],sh:[0,-10],hip:[0,30],el:[-13,7],hand:[-18,23],knee:[4,63],ankle:[5,96]};
 const P={
 neutral:[stand,stand,stand],
 squat:[
  stand,
  {head:[5,-26],sh:[8,0],hip:[12,43],el:[-12,14],hand:[-25,25],knee:[-17,66],ankle:[-18,96]},
  stand
 ],
 hinge:[
  stand,
  {head:[28,-15],sh:[20,0],hip:[0,30],el:[27,14],hand:[34,36],knee:[0,62],ankle:[5,96]},
  stand
 ],
 lunge:[
  stand,
  {head:[0,-27],sh:[0,-2],hip:[0,40],el:[-13,12],hand:[-18,25],knee:[-23,65],ankle:[-35,96]},
  stand
 ],
 push:[
  {head:[-30,10],sh:[-15,17],hip:[25,24],el:[-2,0],hand:[8,-5],knee:[43,34],ankle:[62,35]},
  {head:[-30,10],sh:[-15,17],hip:[25,24],el:[-5,27],hand:[-3,42],knee:[43,34],ankle:[62,35]},
  {head:[-30,10],sh:[-15,17],hip:[25,24],el:[-2,0],hand:[8,-5],knee:[43,34],ankle:[62,35]}
 ],
 pull:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-25,-2],hand:[-35,-24],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-20,6],hand:[-13,17],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-25,-2],hand:[-35,-24],knee:[4,63],ankle:[5,96]}
 ],
 overhead:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-15,-30],hand:[-18,-52],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-22,-15],hand:[-25,-37],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-15,-30],hand:[-18,-52],knee:[4,63],ankle:[5,96]}
 ],
 curl:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-15,7],hand:[-23,28],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-15,7],hand:[-9,-2],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-15,7],hand:[-23,28],knee:[4,63],ankle:[5,96]}
 ],
 raise:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-18,-4],hand:[-24,-1],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-32,-17],hand:[-43,-20],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-18,-4],hand:[-24,-1],knee:[4,63],ankle:[5,96]}
 ],
 bridge:[
  {head:[-38,38],sh:[-24,37],hip:[8,34],el:[-20,53],hand:[-14,60],knee:[32,40],ankle:[48,72]},
  {head:[-38,38],sh:[-24,37],hip:[8,2],el:[-20,53],hand:[-14,60],knee:[32,40],ankle:[48,72]},
  {head:[-38,38],sh:[-24,37],hip:[8,34],el:[-20,53],hand:[-14,60],knee:[32,40],ankle:[48,72]}
 ],
 plank:[
  {head:[-36,0],sh:[-20,7],hip:[20,18],el:[-18,30],hand:[-26,43],knee:[44,23],ankle:[65,27]},
  {head:[-36,0],sh:[-20,7],hip:[20,18],el:[-18,30],hand:[-26,43],knee:[44,23],ankle:[65,27]},
  {head:[-36,0],sh:[-20,7],hip:[20,18],el:[-18,30],hand:[-26,43],knee:[44,23],ankle:[65,27]}
 ],
 mobility:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-18,5],hand:[-25,22],knee:[4,63],ankle:[5,96]},
  {head:[12,-32],sh:[5,-8],hip:[0,30],el:[-26,-22],hand:[-32,-42],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-18,5],hand:[-25,22],knee:[4,63],ankle:[5,96]}
 ],
 cardio:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-16,1],hand:[-23,18],knee:[-8,62],ankle:[-20,88]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-18,-5],hand:[-26,8],knee:[18,52],ankle:[34,77]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-16,1],hand:[-23,18],knee:[-8,62],ankle:[-20,88]}
 ],
 carry:[
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-8,9],hand:[-8,45],knee:[4,63],ankle:[5,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-8,9],hand:[-8,45],knee:[-8,63],ankle:[-10,96]},
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-8,9],hand:[-8,45],knee:[4,63],ankle:[5,96]}
 ],
 calf:[
  stand,
  {head:[0,-37],sh:[0,-10],hip:[0,30],el:[-13,7],hand:[-18,23],knee:[4,63],ankle:[5,88]},
  stand
 ]
 };
 return P[f][k];
}
function drawFigure(f,k,cx){
 const p=points(f,k),x=v=>cx+v[0],y=v=>55+v[1];
 const limb=(a,b,top,bottom,col)=>{
  const ax=x(a),ay=y(a),bx=x(b),by=y(b),dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const r1=top/2,r2=bottom/2;
  return '<path d="M'+(ax+nx*r1)+' '+(ay+ny*r1)+' Q'+(ax+nx*r1*1.12)+' '+(ay+ny*r1*1.12)+' '+(bx+nx*r2)+' '+(by+ny*r2)+' Q'+bx+' '+by+' '+(bx-nx*r2)+' '+(by-ny*r2)+' Q'+(ax-nx*r1*1.12)+' '+(ay-ny*r1*1.12)+' '+(ax-nx*r1)+' '+(ay-ny*r1)+'Z" fill="'+col+'" stroke="#d8fff7" stroke-opacity=".24" stroke-width="1"/>';
 };
 const joint=v=>'<circle cx="'+x(v)+'" cy="'+y(v)+'" r="3.4" fill="'+C.joint+'" stroke="#fff0d2" stroke-width="1"/>';
 const torso='<path d="M'+(cx-9)+' '+(y(p.sh)-3)+' Q'+(cx-15)+' '+(y(p.sh)+8)+' '+(x(p.hip)-9)+' '+(y(p.hip)-3)+' Q'+x(p.hip)+' '+(y(p.hip)+8)+' '+(x(p.hip)+10)+' '+(y(p.hip)-3)+' Q'+(cx+15)+' '+(y(p.sh)+8)+' '+(cx+9)+' '+(y(p.sh)-3)+' Q'+cx+' '+(y(p.sh)-13)+' '+(cx-9)+' '+(y(p.sh)-3)+'Z" fill="'+C.body+'" stroke="#c8fff8" stroke-opacity=".42" stroke-width="1.2"/>';
 const shoulder='<ellipse cx="'+cx+'" cy="'+(y(p.sh)+1)+'" rx="12" ry="7" fill="'+C.body+'" stroke="#c8fff8" stroke-opacity=".3"/>';
 const head='<ellipse cx="'+x(p.head)+'" cy="'+y(p.head)+'" rx="8.8" ry="10.5" fill="'+C.body+'" stroke="#c8fff8" stroke-width="1.5"/><path d="M'+(x(p.head)-5)+' '+(y(p.head)-8)+'q5 -6 11 0" fill="none" stroke="#e8fffb" stroke-opacity=".6" stroke-width="1.5"/>';
 const armBack=limb([p.sh[0]+3,p.sh[1]+1],[p.el[0]+8,p.el[1]-2],10,8,C.shade)+limb([p.el[0]+8,p.el[1]-2],[p.hand[0]+9,p.hand[1]-3],8,6,C.shade);
 const armFront=limb(p.sh,p.el,12,8,C.body)+limb(p.el,p.hand,8,6,C.body);
 const legBack=limb([p.hip[0]+3,p.hip[1]+1],[p.knee[0]+8,p.knee[1]],14,10,C.shade)+limb([p.knee[0]+8,p.knee[1]],[p.ankle[0]+9,p.ankle[1]],10,8,C.shade);
 const legFront=limb(p.hip,p.knee,17,11,C.body)+limb(p.knee,p.ankle,11,8,C.body);
 const hand='<circle cx="'+x(p.hand)+'" cy="'+y(p.hand)+'" r="4.2" fill="#f0c6a2"/>';
 const foot='<path d="M'+(x(p.ankle)-2)+' '+y(p.ankle)+'q7 0 12 3l-1 4h-13q-3 -2 2 -7Z" fill="#e0b69a"/>';
 const anatomy='<path d="M'+(cx-4)+' '+(y(p.sh)+10)+'q4 10 0 19M'+(cx+4)+' '+(y(p.sh)+10)+'q-4 10 0 19" fill="none" stroke="#238d8b" stroke-width="1.4" opacity=".7"/>';
 const load=(f==="curl"||f==="raise"||f==="carry"||f==="hinge"||f==="squat"||f==="lunge"||f==="overhead")?'<g stroke="'+C.joint+'" stroke-width="4" stroke-linecap="round"><path d="M'+(x(p.hand)-8)+' '+(y(p.hand)-3)+'h16"/><path d="M'+(x(p.hand)-6)+' '+(y(p.hand)-8)+'v10M'+(x(p.hand)+6)+' '+(y(p.hand)-8)+'v10"/></g>':"";
 return '<g>'+legBack+armBack+torso+shoulder+legFront+armFront+head+anatomy+joint(p.sh)+joint(p.hip)+joint(p.el)+joint(p.knee)+hand+foot+load+'</g>';
}
function equipment(f,cx){
 const y=164;
 if(f==="push"||f==="bridge")return '<path d="M'+(cx-46)+' '+y+'h92m-82 0v9m72 -9v9" stroke="'+C.metal+'" stroke-width="5" stroke-linecap="round"/>';
 if(f==="pull")return '<path d="M'+(cx-35)+' 18v15m70 -15v15m-35 -15h35" stroke="'+C.metal+'" stroke-width="4" fill="none"/>';
 if(f==="calf"||f==="squat"||f==="lunge"||f==="hinge"||f==="overhead"||f==="curl"||f==="raise"||f==="carry")return '<path d="M'+(cx-24)+' 145h48" stroke="'+C.floor+'" stroke-width="2"/>';
 if(f==="plank"||f==="mobility"||f==="cardio")return '<path d="M'+(cx-45)+' 145h90" stroke="'+C.floor+'" stroke-width="2"/>';
 return "";
}

function specificExercise(id,k,cx){
 const joint='<circle cx="{x}" cy="{y}" r="4" fill="#f4c77f" stroke="#fff0d2" stroke-width="1"/>';
 const dot=(x,y)=>joint.replace("{x}",x).replace("{y}",y);
 if(id==="leg-press"){
  const poses=[
   {hip:[-14,111],knee:[10,130],ankle:[39,111]},
   {hip:[-14,111],knee:[30,91],ankle:[55,65]},
   {hip:[-14,111],knee:[10,130],ankle:[39,111]}
  ];
  const p=poses[k],x=cx;
  return '<g stroke-linecap="round" stroke-linejoin="round"><path d="M'+(x-48)+' 42v100h30" stroke="#91a9b7" stroke-width="5" fill="none"/><path d="M'+(x-47)+' 43l28 0" stroke="#91a9b7" stroke-width="4"/><path d="M'+(x-25)+' 82l12 0 0 46 -12 0Z" fill="#2b9d9d" stroke="#69d9d0"/><ellipse cx="'+(x-12)+'" cy="66" rx="9" ry="11" fill="#69d9d0" stroke="#d9fff7"/><path d="M'+(x-14)+' 78q-5 16 0 32l12 7 13 -4 -3 -27Z" fill="#69d9d0" stroke="#d9fff7"/><path d="M'+(x-5)+' 110L'+(x+p.knee[0])+' '+p.knee[1]+'L'+(x+p.ankle[0])+' '+p.ankle[1]+'" stroke="#69d9d0" stroke-width="13" fill="none"/><path d="M'+(x+p.knee[0])+' '+p.knee[1]+'L'+(x+p.ankle[0])+' '+p.ankle[1]+'" stroke="#2b9d9d" stroke-width="9" fill="none"/>'+dot(x+p.knee[0],p.knee[1])+dot(x+p.ankle[0],p.ankle[1])+'<path d="M'+(x+55)+' 45v102m-9 -4h18" stroke="#eac27d" stroke-width="5" fill="none"/><path d="M'+(x+39)+' '+(p.ankle[1]-5)+'l14 0" stroke="#f4c77f" stroke-width="6"/><path d="M'+(x-45)+' 148h105" stroke="#547180" stroke-width="2"/></g>';
 }
 if(id==="bench-press"||id==="db-press"){
  const raised=k===1, y=raised?86:112, elbow=raised?102:105;
  const bar=id==="bench-press"
   ? '<path d="M'+(cx-43)+' '+y+'h86m-78 -7v14m70 -14v14" stroke="#eac27d" stroke-width="4" stroke-linecap="round"/>'
   : '<g stroke="#eac27d" stroke-width="4" stroke-linecap="round"><path d="M'+(cx-30)+' '+y+'v-8m-7 0h14"/><path d="M'+(cx+30)+' '+y+'v-8m-7 0h14"/></g>';
  return '<g stroke-linecap="round" stroke-linejoin="round"><path d="M'+(cx-52)+' 132h104m-94 0v8m84 -8v8" stroke="#91a9b7" stroke-width="5"/><ellipse cx="'+(cx-31)+'" cy="99" rx="9" ry="10" fill="#69d9d0" stroke="#d9fff7"/><path d="M'+(cx-21)+' 101q22 -9 42 2l9 9 -45 8 -17 -9Z" fill="#69d9d0" stroke="#d9fff7"/><path d="M'+(cx-5)+' 104L'+(cx-3)+' '+elbow+'L'+(cx-30)+' '+y+'" stroke="#69d9d0" stroke-width="8" fill="none"/><path d="M'+(cx+5)+' 105L'+(cx+9)+' '+elbow+'L'+(cx+30)+' '+y+'" stroke="#2b9d9d" stroke-width="8" fill="none"/>'+dot(cx-3,elbow)+dot(cx+9,elbow)+bar+'<path d="M'+(cx-48)+' 145h96" stroke="#547180" stroke-width="2"/></g>';
 }
 return null;
}

export function exerciseMotionSvg(ex){
 const f=family(ex),cx=90;
 const frames=[0,1,2].map((k)=>'<g class="motion-phase motion-phase-'+k+'">'+(specificExercise(ex.id,k,cx)||equipment(f,cx)+drawFigure(f,k,cx))+'</g>').join("");
 const name=String(ex.name||"Ejercicio").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
 return '<svg class="exercise-motion-svg" viewBox="0 0 180 190" role="img" aria-label="'+name+' en bucle: posición inicial, ejecución y regreso"><defs><radialGradient id="motionGlow"><stop offset="0" stop-color="#2bc7bd" stop-opacity=".19"/><stop offset="1" stop-color="#102b3c" stop-opacity="0"/></radialGradient></defs><ellipse cx="90" cy="104" rx="86" ry="88" fill="url(#motionGlow)"/><path d="M18 166H162" stroke="#547180" stroke-width="2" stroke-linecap="round"/>'+frames+'</svg>';
}

export function exerciseSequenceSvg(ex){
 const f=family(ex),cx=[60,180,300],labels=["1 · PREPARA","2 · EJECUTA","3 · REGRESA"];
 const frames=cx.map((x,i)=>'<g class="exercise-phase exercise-phase-'+i+'"><rect x="'+(x-54)+'" y="8" width="112" height="176" rx="12" fill="#102b3c" stroke="#2e596b"/><text x="'+x+'" y="28" text-anchor="middle" fill="#d8f5f3" font-size="9" font-weight="800" letter-spacing="1.2">'+labels[i]+'</text><path d="M'+(x-43)+' 166h86" stroke="'+C.floor+'" stroke-width="2"/>'+(specificExercise(ex.id,i,x)||equipment(f,x)+drawFigure(f,i,x))+'</g>').join("");
 return '<svg class="exercise-demo-svg exercise-sequence-svg" viewBox="0 0 360 192" role="img" aria-label="'+String(ex.name||"Ejercicio").replace(/&/g,"&amp;").replace(/"/g,"&quot;")+' en tres fases: inicio, movimiento y final">'+frames+'<path d="M116 92h10m-4 -5 5 5 -5 5M236 92h10m-4 -5 5 5 -5 5" stroke="#eac27d" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
