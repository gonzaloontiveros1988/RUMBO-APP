// Training Intelligence: personal exercise planning, not medical advice.
export const ROUTINES=[
 {id:"strength-a",name:"Strength · Full body A",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Squat pattern · 3×8","Horizontal push · 3×8","Horizontal pull · 3×10","Hip hinge · 3×8","Core stability · 3 rounds"]},
 {id:"strength-b",name:"Strength · Full body B",type:"Strength",minutes:40,setting:"Gym",level:"Intermediate",blocks:["Split squat · 3×8 each side","Vertical push · 3×8","Vertical pull · 3×8","Glute bridge · 3×12","Carry · 3 rounds"]},
 {id:"hotel-20",name:"Hotel · Mobility reset",type:"Mobility",minutes:20,setting:"Hotel",level:"All levels",blocks:["Gentle spinal mobility · 4 min","Hip mobility · 4 min","Thoracic rotations · 3 min","Shoulder mobility · 3 min","Easy walk or breathing · 6 min"]},
 {id:"hotel-25",name:"Hotel · Bodyweight circuit",type:"Hotel session",minutes:25,setting:"Hotel",level:"All levels",blocks:["Bodyweight squat · 3×10","Incline push-up · 3×8","Reverse lunge · 3×8","Bird dog · 3×8","Easy cooldown · 5 min"]},
 {id:"cardio-30",name:"Cardio · Easy aerobic",type:"Cardio",minutes:30,setting:"Any",level:"Adjustable",blocks:["Easy conversational-pace aerobic activity · 25 min","Cool down · 5 min"]},
 {id:"mobility-15",name:"Mobility · Short session",type:"Mobility",minutes:15,setting:"Any",level:"All levels",blocks:["Neck and shoulder mobility · 3 min","Thoracic mobility · 4 min","Hips and ankles · 5 min","Gentle cooldown · 3 min"]},
 {id:"recovery-15",name:"Recovery · Gentle reset",type:"Recovery",minutes:15,setting:"Any",level:"All levels",blocks:["Easy walk or gentle movement · 8 min","Comfortable mobility · 5 min","Breathing and cooldown · 2 min"]}
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
 const goal=profile.goal||"general",setting=profile.setting||"gym",limit=Number(profile.availableMinutes)||40,targetDays=Math.max(2,Math.min(5,Number(profile.daysPerWeek)||3));
 const fatigue=Number(profile.fatigue)||3,sleep=Number(profile.sleepHours)||7,readiness=profile.readiness||"Moderate";
 const datePlus=(date,n)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 const recentDays=new Set(history.slice(0,4).map(x=>x.date)),scheduled=[];
 for(let i=0;i<14;i++){
  const date=datePlus(start,i),dayDuties=(duties||[]).filter(x=>x.date===date),previousDuty=(duties||[]).filter(x=>x.date===datePlus(date,-1));
  if(dayDuties.length||recentDays.has(date))continue;
  const dutyText=[...dayDuties,...previousDuty].map(x=>[x.code,x.kind,x.status].join(" ")).join(" ").toUpperCase();
  const postFlight=previousDuty.some(x=>/FLIGHT|DUTY|\d{3,4}/.test([x.code,x.kind,x.status].join(" ").toUpperCase())||x.segments?.length);
  const tooFatigued=readiness==="Low / fatigued"||fatigue>=4||sleep<5.5;
  let id,reason;
  if(tooFatigued){id="recovery-15";reason="Recovery-first option based on the fatigue / sleep check. Skip completely if you feel unwell or unsafe to exercise."}
  else if(postFlight||fatigue===3||readiness==="Moderate"){id="mobility-15";reason="Low-load mobility after a roster duty or moderate readiness. No heavy lifting is scheduled."}
  else if(setting==="hotel"){id=goal==="endurance"?"cardio-30":"hotel-25";reason="Hotel-friendly bodyweight or simple aerobic session; no gym equipment required."}
  else if(setting==="home"){id=goal==="endurance"?"cardio-30":goal==="mobility"?"mobility-15":"hotel-25";reason="Home session using bodyweight / the equipment you listed."}
  else if(goal==="strength"){id=scheduled.length%2===0?"strength-a":"strength-b";reason="Strength-focused session on a roster-unassigned date; keep reps in reserve and progress gradually."}
  else if(goal==="endurance"||goal==="fat-loss"){id="cardio-30";reason="Moderate aerobic conditioning matched to your current objective."}
  else if(goal==="mobility"){id="mobility-15";reason="Mobility and movement-quality session."}
  else{id=scheduled.length%2===0?"strength-a":"cardio-30";reason="Balanced general-fitness session."}
  const routine=ROUTINES.find(x=>x.id===id);if(!routine)continue;
  const scale=limit<25?0.6:limit<35?0.8:limit<45?1:1;
  const minutes=Math.min(limit,routine.minutes);
  scheduled.push({date,routineId:id,title:routine.name,minutes,type:routine.type,status:"candidate",reason,setting:setting==="mixed"?(postFlight?"hotel": "gym"):setting,readinessRequired:true,blocks:routine.blocks,equipment:profile.equipment||"",intensity:tooFatigued||postFlight?"low":"moderate"});
  if(scheduled.length>=targetDays*2)break;
 }
 return scheduled;
}
