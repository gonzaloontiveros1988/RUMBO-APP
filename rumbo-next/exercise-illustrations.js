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
 return "squat";
}
function points(f,k){
 const stand={head:[0,-37],sh:[0,-10],hip:[0,30],el:[-13,7],hand:[-18,23],knee:[4,63],ankle:[5,96]};
 const P={
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
 const seg=(a,b,w,col)=>'<path d="M'+x(a)+' '+y(a)+'L'+x(b)+' '+y(b)+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" fill="none"/>';
 const joint=v=>'<circle cx="'+x(v)+'" cy="'+y(v)+'" r="4.2" fill="'+C.joint+'" stroke="#fff0d2" stroke-width="1"/>';
 const body='<path d="M'+x(p.sh)+' '+y(p.sh)+' Q'+(cx-2)+' '+(y(p.sh)+19)+' '+x(p.hip)+' '+y(p.hip)+'" stroke="'+C.body+'" stroke-width="18" stroke-linecap="round" fill="none"/>';
 const arm=seg(p.sh,p.el,10,C.body)+seg(p.el,p.hand,8,C.body);
 const leg=seg(p.hip,p.knee,13,C.body)+seg(p.knee,p.ankle,10,C.body);
 const head='<circle cx="'+x(p.head)+'" cy="'+y(p.head)+'" r="10" fill="'+C.body+'" stroke="#c8fff8" stroke-width="2"/>';
 const otherArm=seg([p.sh[0]+3,p.sh[1]+1],[p.el[0]+8,p.el[1]-2],8,C.shade)+seg([p.el[0]+8,p.el[1]-2],[p.hand[0]+9,p.hand[1]-3],7,C.shade);
 const otherLeg=seg([p.hip[0]+3,p.hip[1]+1],[p.knee[0]+8,p.knee[1]],9,C.shade)+seg([p.knee[0]+8,p.knee[1]],[p.ankle[0]+9,p.ankle[1]],7,C.shade);
 const load=(f==="curl"||f==="raise"||f==="carry"||f==="hinge"||f==="squat"||f==="lunge"||f==="overhead")?'<g stroke="'+C.joint+'" stroke-width="4" stroke-linecap="round"><path d="M'+(x(p.hand)-7)+' '+(y(p.hand)-3)+'h14"/><path d="M'+(x(p.hand)-5)+' '+(y(p.hand)-8)+'v10M'+(x(p.hand)+5)+' '+(y(p.hand)-8)+'v10"/></g>':"";
 return '<g>'+head+body+otherArm+arm+otherLeg+leg+joint(p.sh)+joint(p.hip)+joint(p.el)+joint(p.knee)+load+'</g>';
}
function equipment(f,cx){
 const y=143;
 if(f==="push"||f==="bridge")return '<path d="M'+(cx-46)+' '+y+'h92m-82 0v9m72 -9v9" stroke="'+C.metal+'" stroke-width="5" stroke-linecap="round"/>';
 if(f==="pull")return '<path d="M'+(cx-35)+' 18v15m70 -15v15m-35 -15h35" stroke="'+C.metal+'" stroke-width="4" fill="none"/>';
 if(f==="calf"||f==="squat"||f==="lunge"||f==="hinge"||f==="overhead"||f==="curl"||f==="raise"||f==="carry")return '<path d="M'+(cx-24)+' 145h48" stroke="'+C.floor+'" stroke-width="2"/>';
 if(f==="plank"||f==="mobility"||f==="cardio")return '<path d="M'+(cx-45)+' 145h90" stroke="'+C.floor+'" stroke-width="2"/>';
 return "";
}
export function exerciseSequenceSvg(ex){
 const f=family(ex),cx=[60,180,300],labels=["INICIO","MOVIMIENTO","FINAL"];
 const frames=cx.map((x,i)=>'<g><rect x="'+(x-54)+'" y="8" width="108" height="150" rx="12" fill="#102b3c" stroke="#2e596b"/><text x="'+x+'" y="24" text-anchor="middle" fill="#8fb4c1" font-size="8" font-weight="700" letter-spacing="1">'+labels[i]+'</text><path d="M'+(x-43)+' 146h86" stroke="'+C.floor+'" stroke-width="2"/>'+equipment(f,x)+drawFigure(f,i,x)+'</g>').join("");
 return '<svg class="exercise-demo-svg exercise-sequence-svg" viewBox="0 0 360 166" role="img" aria-label="'+String(ex.name||"Ejercicio").replace(/&/g,"&amp;").replace(/"/g,"&quot;")+' en tres fases: inicio, movimiento y final">'+frames+'<path d="M116 82h10m-4 -4 4 4 -4 4M236 82h10m-4 -4 4 4 -4 4" stroke="#eac27d" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
