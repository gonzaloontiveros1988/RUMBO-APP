// Training Intelligence: personal exercise planning, not medical advice.
export const ROUTINES=[
 {id:"strength-a",name:"Strength · Full body A",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Squat pattern · 3×8","Horizontal push · 3×8","Horizontal pull · 3×10","Hip hinge · 3×8","Core stability · 3 rounds"]},
 {id:"strength-b",name:"Strength · Full body B",type:"Strength",minutes:40,setting:"Gym",level:"Intermediate",blocks:["Split squat · 3×8 each side","Vertical push · 3×8","Vertical pull · 3×8","Glute bridge · 3×12","Carry · 3 rounds"]},
 {id:"hotel-20",name:"Hotel · Mobility reset",type:"Mobility",minutes:20,setting:"Hotel",level:"All levels",blocks:["Gentle spinal mobility · 4 min","Hip mobility · 4 min","Thoracic rotations · 3 min","Shoulder mobility · 3 min","Easy walk or breathing · 6 min"]},
 {id:"hotel-25",name:"Hotel · Bodyweight circuit",type:"Hotel session",minutes:25,setting:"Hotel",level:"All levels",blocks:["Bodyweight squat · 3×10","Incline push-up · 3×8","Reverse lunge · 3×8","Bird dog · 3×8","Easy cooldown · 5 min"]},
 {id:"cardio-30",name:"Cardio · Easy aerobic",type:"Cardio",minutes:30,setting:"Any",level:"Adjustable",blocks:["Easy conversational-pace aerobic activity · 25 min","Cool down · 5 min"]},
 {id:"mobility-15",name:"Mobility · Short session",type:"Mobility",minutes:15,setting:"Any",level:"All levels",blocks:["Neck and shoulder mobility · 3 min","Thoracic mobility · 4 min","Hips and ankles · 5 min","Gentle cooldown · 3 min"]},\n {id:"recovery-15",name:"Recovery · Gentle reset",type:"Recovery",minutes:15,setting:"Any",level:"All levels",blocks:["Easy walk or gentle movement · 8 min","Comfortable mobility · 5 min","Breathing and cooldown · 2 min"]}
];
export function validateWorkout(w){
 const e=[];if(!/^\d{4}-\d{2}-\d{2}$/.test(w.date||""))e.push("Choose a valid date.");
 if(!ROUTINES.some(r=>r.type===w.type)||!w.type)e.push("Choose a training type.");
 if(!Number.isFinite(Number(w.minutes))||Number(w.minutes)<1||Number(w.minutes)>300)e.push("Duration must be between 1 and 300 minutes.");
 return e;
}
function dutyOn(date,duties){return duties.find(d=>d.date===date)}
export function suggestTraining(duties,year,month,existing=[]){
 const days=new Date(year,month+1,0).getDate(),out=[],already=new Set(existing.map(x=>x.date));
 let count=0;
 for(let day=1;day<=days;day++){
  const d=new Date(year,month,day),date=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
  if(dutyOn(date,duties)||already.has(date))continue;
  // These are unassigned dates only, not confirmed days off or proof of adequate rest.
  const pick=count%4===0?"hotel-20":count%4===1?"strength-a":count%4===2?"cardio-30":"mobility-15";
  const routine=ROUTINES.find(r=>r.id===pick);
  out.push({date,routineId:routine.id,title:routine.name,minutes:routine.minutes,status:"candidate",note:"Unassigned roster date only. Confirm the official roster, recovery and personal readiness before accepting."});
  count++;
 }
 return out;
}
export function workoutStats(workouts){
 const total=workouts.length,minutes=workouts.reduce((n,x)=>n+Number(x.minutes||0),0),types={};
 for(const w of workouts)types[w.type]=(types[w.type]||0)+1;
 return {total,minutes,hours:Number((minutes/60).toFixed(1)),types};
}

export function adaptiveTrainingPlan(duties,workouts,profile={},startDate){
 const start=startDate||new Date().toISOString().slice(0,10),out=[],history=(workouts||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const recentTypes=history.slice(0,4).map(x=>x.type),lastDate=history[0]?.date;
 const datePlus=(date,n)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 for(let i=0;i<14;i++){
  const date=datePlus(start,i),dayDuties=(duties||[]).filter(x=>x.date===date);
  if(dayDuties.length)continue;
  const prev=dayDuties.length>0,logged=history.find(x=>x.date===date);if(logged)continue;
  const daysSince=lastDate?Math.floor((new Date(date+"T12:00:00")-new Date(lastDate+"T12:00:00"))/86400000):99;
  let id="hotel-20",reason="Light mobility option; confirm sleep, fatigue and readiness before starting.";
  if(daysSince>=2&&!recentTypes.slice(0,2).includes("Strength")&&profile.goal==="strength"){id="strength-a";reason="Strength candidate after a gap in logged sessions; adjust load to current readiness."}
  else if(daysSince>=2&&!recentTypes.slice(0,2).includes("Cardio")&&profile.goal==="cardio"){id="cardio-30";reason="Easy aerobic candidate; keep effort conversational and adjust to recovery."}
  else if(daysSince>=2&&i%3===1){id="hotel-25";reason="Short bodyweight option; reduce or skip if recovery is incomplete."}
  const routine=ROUTINES.find(x=>x.id===id);
  out.push({date,routineId:id,title:routine.name,minutes:routine.minutes,type:routine.type,status:"candidate",reason,readinessRequired:true});
 }
 return out;
}
