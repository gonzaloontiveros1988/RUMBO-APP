// Training Intelligence: personal exercise planning, not medical advice.
export const ROUTINES=[
 {id:"strength-a",name:"Strength · Full body A",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Squat pattern · 3×8","Horizontal push · 3×8","Horizontal pull · 3×10","Hip hinge · 3×8","Core stability · 3 rounds"]},
 {id:"strength-b",name:"Strength · Full body B",type:"Strength",minutes:40,setting:"Gym",level:"Intermediate",blocks:["Split squat · 3×8 each side","Vertical push · 3×8","Vertical pull · 3×8","Glute bridge · 3×12","Carry · 3 rounds"]},
 {id:"strength-c",name:"Strength · Full body C",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Romanian deadlift · 3×8","Incline dumbbell press · 3×10","Seated cable row · 3×10","Step-up · 3×10 each side","Pallof press · 3×12"]},
 {id:"strength-d",name:"Strength · Full body D",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Front-foot elevated split squat · 3×10 each side","Incline dumbbell press · 3×10","Chest-supported dumbbell row · 3×12","Dumbbell lateral raise · 3×15","Dead bug · 3×10 each side"]},
 {id:"strength-e",name:"Strength · Full body E",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Leg press · 3×12","Dumbbell floor press · 3×10","Neutral-grip lat pulldown · 3×10","Seated or lying leg curl · 3×12","Farmer carry · 3×30 seconds"]},
 {id:"hotel-strength",name:"Travel · Strength circuit",type:"Hotel session",minutes:30,setting:"Hotel",level:"All levels",blocks:["Tempo squat · 3×12","Push-up variation · 3×8–12","Single-leg hip hinge · 3×8 each side","Backpack row · 3×12","Dead bug · 3×10"]},
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
 const goal=profile.goal||"general",setting=profile.setting||"gym",limit=Math.max(15,Number(profile.availableMinutes)||40),targetDays=Math.max(2,Math.min(5,Number(profile.daysPerWeek)||3));
 const fatigue=Math.max(1,Math.min(5,Number(profile.fatigue)||3)),sleep=Number.isFinite(Number(profile.sleepHours))&&profile.sleepHours!==""?Number(profile.sleepHours):7,readiness=profile.readiness||"Moderate";
 const datePlus=(date,n)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 const recentDays=new Set(history.slice(0,4).map(x=>x.date)),scheduled=[],strengthCycle=["strength-a","strength-b","strength-c","strength-d","strength-e"];
 const dutyKind=(x)=>String([x.code,x.kind,x.status,x.type].filter(Boolean).join(" ")).toUpperCase();
 for(let i=0;i<14;i++){
  const date=datePlus(start,i),dayDuties=(duties||[]).filter(x=>x.date===date),previousDuty=(duties||[]).filter(x=>x.date===datePlus(date,-1));
  if(dayDuties.length||recentDays.has(date))continue;
  const postFlight=previousDuty.some(x=>/FLIGHT|DUTY|\b(?:QR)?\d{3,4}\b/.test(dutyKind(x))||x.segments?.length);
  const tooFatigued=readiness==="Low / fatigued"||fatigue>=4||sleep<5.5;
  let id,reason,intensity="moderate";
  if(tooFatigued){id="recovery-15";intensity="very-low";reason="Recovery-first option because your self-reported fatigue or sleep suggests reducing training stress. Skip if unwell."}
  else if(postFlight){id="mobility-15";intensity="low";reason="Low-load mobility after a rostered flight duty. Resume normal progression only when recovered."}
  else if(setting==="hotel"){id=goal==="endurance"?"cardio-30":"hotel-strength";reason="Travel-compatible session without requiring a full gym."}
  else if(setting==="home"){id=goal==="endurance"||goal==="fat-loss"?"cardio-30":goal==="mobility"?"mobility-15":"hotel-25";reason="Home session selected for the available equipment and stated objective."}
  else if(setting==="mixed"&&scheduled.length%3===2){id="hotel-strength";reason="Travel-friendly strength variation in the mixed-location rotation."}
  else if(readiness==="Moderate"||fatigue===3||sleep<6.5){
   if(goal==="endurance"||goal==="fat-loss"){id=scheduled.length%2===0?"cardio-30":"mobility-15";reason="Moderate-load conditioning with recovery spacing."}
   else if(goal==="mobility"){id="mobility-15";reason="Mobility-focused session matching your selected objective."}
   else{id=strengthCycle[scheduled.filter(x=>x.type==="Strength").length%strengthCycle.length];reason="Controlled strength session: keep 2–3 repetitions in reserve and avoid maximal efforts."}
   intensity="moderate";
  }
  else if(goal==="strength"){id=strengthCycle[scheduled.filter(x=>x.type==="Strength").length%strengthCycle.length];reason="Progressive strength session selected from the next rotation in your program."}
  else if(goal==="endurance"||goal==="fat-loss"){id=scheduled.length%3===2?"mobility-15":"cardio-30";reason="Aerobic conditioning balanced with lower-load recovery sessions."}
  else if(goal==="mobility"){id="mobility-15";reason="Mobility and movement-quality session."}
  else{id=scheduled.length%3===1?"cardio-30":strengthCycle[scheduled.filter(x=>x.type==="Strength").length%strengthCycle.length];reason="Balanced general-fitness session with alternating strength and cardiovascular work."}
  if(setting==="mixed"&&scheduled.length%4===3&&id.startsWith("strength"))id="hotel-strength";
  const routine=ROUTINES.find(x=>x.id===id);if(!routine)continue;
  const minutes=Math.min(limit,routine.minutes);
  scheduled.push({date,routineId:id,title:routine.name,minutes,type:routine.type,status:"candidate",reason,setting:setting==="mixed"?(id.startsWith("hotel")?"hotel":"gym"):setting,readinessRequired:true,blocks:routine.blocks,equipment:profile.equipment||"",intensity,cycleIndex:scheduled.length+1,programWeek:Math.floor(i/7)+1});
  if(scheduled.length>=targetDays*2)break;
 }
 return scheduled;
}
