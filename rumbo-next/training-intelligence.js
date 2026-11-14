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
 {id:"recovery-15",name:"Recovery · Gentle reset",type:"Recovery",minutes:15,setting:"Any",level:"All levels",blocks:["Easy walk or gentle movement · 8 min","Comfortable mobility · 5 min","Breathing and cooldown · 2 min"]},
 {id:"strength-f",name:"Strength · Lower body & core",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Back squat · 3×6–8","Romanian deadlift · 3×8","Reverse lunge · 3×10 each side","Seated leg curl · 3×12","Pallof press · 3×10 each side"]},
 {id:"strength-g",name:"Strength · Upper body",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Incline dumbbell press · 3×8–10","Assisted pull-up · 3×6–10","Single-arm dumbbell row · 3×10","Lateral raise · 3×12–15","Cable triceps pushdown · 3×12"]},
 {id:"strength-h",name:"Strength · Posterior chain",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Hip thrust · 3×8–10","Single-leg Romanian deadlift · 3×8 each side","Seated leg curl · 3×12","Standing calf raise · 3×12–15","Farmer carry · 3×30 seconds"]},
 {id:"strength-i",name:"Strength · Push / pull",type:"Strength",minutes:45,setting:"Gym",level:"Intermediate",blocks:["Barbell bench press · 3×6–8","Seated cable row · 3×8–10","Dumbbell shoulder press · 3×8","Cable face pull · 3×12–15","Dumbbell biceps curl · 3×10–12"]},
 {id:"strength-j",name:"Strength · Unilateral & stability",type:"Strength",minutes:40,setting:"Gym",level:"Intermediate",blocks:["Dumbbell step-up · 3×8 each side","Goblet squat · 3×10","Cable chest fly · 3×12","Side plank · 3×30 seconds each side","Bird dog · 3×8 each side"]},
 {id:"hotel-upper",name:"Travel · Upper body & core",type:"Hotel session",minutes:30,setting:"Hotel",level:"Intermediate",blocks:["Push-up variation · 3×8–12","Backpack single-arm row · 3×10","Pike push-up or shoulder press · 3×8","Side plank · 3×25 seconds","Bird dog · 3×8 each side"]},
 {id:"hotel-lower",name:"Travel · Lower body",type:"Hotel session",minutes:30,setting:"Hotel",level:"Intermediate",blocks:["Reverse lunge · 3×10 each side","Single-leg hip hinge · 3×8 each side","Glute bridge · 3×12","Calf raise · 3×15","Dead bug · 3×10 each side"]},
 {id:"cardio-intervals",name:"Cardio · Intervals",type:"Cardio",minutes:30,setting:"Any",level:"Intermediate",blocks:["Warm-up · 5 min easy","Intervals · 8 rounds of 1 min brisk / 1 min easy","Cool down · 5 min"]}
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
 const start=startDate||new Date().toISOString().slice(0,10),history=(workouts||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const goal=profile.goal||"general",setting=profile.setting||"gym",limit=Math.max(15,Number(profile.availableMinutes)||40),targetDays=Math.max(2,Math.min(5,Number(profile.daysPerWeek)||3));
 const fatigue=Math.max(1,Math.min(5,Number(profile.fatigue)||3)),sleep=Number(profile.sleepHours)||7,readiness=profile.readiness||"Moderate";
 const datePlus=(date,n)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 const recentDays=new Set(history.slice(0,3).map(x=>x.date)),scheduled=[],strengthCycle=["strength-a","strength-b","strength-c","strength-d","strength-e"];
 const dutyKind=x=>String([x.code,x.kind,x.status,x.type].filter(Boolean).join(" ")).toUpperCase();
 const isFlight=x=>/FLIGHT|DUTY|\b(?:QR)?\d{3,4}\b/.test(dutyKind(x))||!!(x.segments?.length||x.flightNumbers?.length);
 for(let i=0;i<14;i++){
  const date=datePlus(start,i),dayDuties=(duties||[]).filter(x=>x.date===date),previousDuty=(duties||[]).filter(x=>x.date===datePlus(date,-1));
  const explicitOff=dayDuties.length>0&&dayDuties.every(x=>/\b(OFF|DOFF|DAY OFF|REST|LEAVE|VAC|VACATION|ANNUAL LEAVE|AL)\b/.test(dutyKind(x)));
  const blockingDuty=dayDuties.length>0&&!explicitOff;
  if(blockingDuty||recentDays.has(date))continue;
  // Spread sessions across the fortnight rather than filling consecutive dates.
  if(i%2===1&&scheduled.length<targetDays*2&&!explicitOff)continue;
  const postFlight=previousDuty.some(isFlight);
  const tooFatigued=readiness==="Low / fatigued"||fatigue>=4||sleep<5.5;
  let id,reason,intensity="moderate";
  if(tooFatigued){id="recovery-15";intensity="very-low";reason="Recovery option based on your self-reported sleep and fatigue. Skip if unwell."}
  else if(postFlight){id="mobility-15";intensity="low";reason="Low-load mobility after a rostered flight. Confirm you are recovered before progressing."}
  else if(setting==="hotel"){id=goal==="endurance"?"cardio-30":"hotel-strength";reason="Travel-compatible session using minimal equipment."}
  else if(setting==="home"){id=goal==="endurance"||goal==="fat-loss"?"cardio-30":goal==="mobility"?"mobility-15":"hotel-25";reason="Home session matched to your objective and available equipment."}
  else if(setting==="mixed"&&scheduled.length%3===2){id="hotel-strength";reason="Travel-friendly strength variation."}
  else if(goal==="endurance"||goal==="fat-loss"){id=scheduled.length%3===2?"mobility-15":"cardio-30";reason="Aerobic conditioning balanced with lower-load recovery."}
  else if(goal==="mobility"){id="mobility-15";reason="Mobility session matching your selected objective."}
  else{id=strengthCycle[scheduled.filter(x=>x.type==="Strength").length%strengthCycle.length];reason="Full-body strength session. Keep 2–3 repetitions in reserve and avoid maximal efforts."}
  if(setting==="mixed"&&scheduled.length%4===3&&id.startsWith("strength"))id="hotel-strength";
  const routine=ROUTINES.find(x=>x.id===id);if(!routine)continue;
  const availability=explicitOff?"roster-off":"unconfirmed";
  scheduled.push({date,routineId:id,title:routine.name,minutes:Math.min(limit,routine.minutes),type:routine.type,status:"candidate",reason,setting:setting==="mixed"?(id.startsWith("hotel")?"hotel":"gym"):setting,readinessRequired:true,blocks:routine.blocks,equipment:profile.equipment||"",intensity,cycleIndex:scheduled.length+1,programWeek:Math.floor(i/7)+1,availability,needsRosterConfirmation:!explicitOff});
  if(scheduled.length>=targetDays*2)break;
 }
 return scheduled;
}


export function buildTrainingProgram(profile={},startDate,duties=[],workouts=[]){
 const start=startDate||new Date().toISOString().slice(0,10);
 const goal=profile.goal||"general",setting=profile.setting||"gym";
 const days=Math.max(2,Math.min(5,Number(profile.daysPerWeek)||3));
 const duration=Math.max(20,Math.min(75,Number(profile.availableMinutes)||45));
 const datePlus=(date,n)=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
 const dutyKind=x=>String([x.code,x.kind,x.status,x.type].filter(Boolean).join(" ")).toUpperCase();
 const isExplicitOff=items=>items.length>0&&items.every(x=>/\b(OFF|DOFF|DAY OFF|REST|LEAVE|VAC|VACATION|ANNUAL LEAVE|AL)\b/.test(dutyKind(x)));
 const isBlocked=items=>items.length>0&&!isExplicitOff(items);
 const strength=["strength-a","strength-b","strength-c","strength-d","strength-e","strength-f","strength-g","strength-h","strength-i","strength-j"];
 const goalRoutine=slot=>{
  let id;
  if(goal==="mobility")id="mobility-15";
  else if(goal==="endurance")id=["cardio-30","strength-a","cardio-30","mobility-15","cardio-30"][slot%5];
  else if(goal==="fat-loss")id=["strength-a","cardio-30","strength-b","mobility-15","cardio-30"][slot%5];
  else if(goal==="strength")id=slot===days-1&&days>=4?"mobility-15":strength[slot%strength.length];
  else id=["strength-a","strength-b","cardio-30","mobility-15","strength-c"][slot%5];
  if(setting==="hotel"&&id.startsWith("strength"))id=slot%2===0?"hotel-strength":"hotel-lower";
  if(setting==="home"&&id.startsWith("strength"))id=slot%2===0?"hotel-25":"hotel-lower";
  if(setting==="mixed"&&id.startsWith("strength")&&slot%2===1)id=slot%3===0?"hotel-upper":"hotel-lower";
  return id;
 };
 const sessions=[];
 for(let week=1;week<=6;week++){
  const phase=week===4?"deload":week>=5?"intensify":"build",chosen=[];
  const eligible=Array.from({length:7},(_,offset)=>{
   const date=datePlus(start,(week-1)*7+offset),items=(duties||[]).filter(x=>x.date===date);
   return {offset,date,items,available:!isBlocked(items)};
  }).filter(x=>x.available);
  // Requested frequency is a target, not a spacing filter: fill 2–5 sessions if roster permits.
  for(let slot=0;slot<Math.min(days,eligible.length);slot++){
   const ideal=Math.round(slot*6/Math.max(1,days-1));
   const candidates=eligible.filter(c=>!chosen.some(x=>x.offset===c.offset));
   candidates.sort((a,b)=>{
    const score=c=>Math.abs(c.offset-ideal)*1.15+chosen.reduce((penalty,x)=>{
     const gap=Math.abs(x.offset-c.offset);
     return penalty+(gap===1?3.2:gap===2?0.45:0);
    },0);
    return score(a)-score(b)||a.offset-b.offset;
   });
   if(!candidates.length)break;
   const pick=candidates[0];
   chosen.push({offset:pick.offset,date:pick.date,availability:pick.items.length?"roster-off":"unconfirmed"});
  }
  chosen.sort((a,b)=>a.offset-b.offset);
  chosen.forEach((slot,index)=>{
   const id=goalRoutine(index),routine=ROUTINES.find(x=>x.id===id);if(!routine)return;
   const recent=(workouts||[]).filter(x=>x.date<slot.date).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,3);
   const progression=phase==="deload"?"Deload week: reduce volume and keep every repetition comfortable.":phase==="intensify"?"Consolidate progress; increase load only when every repetition is controlled.":"Build consistency and technique; keep 2–3 repetitions in reserve.";
   sessions.push({week,day:index+1,date:slot.date,phase,goal,routineId:id,title:routine.name,type:routine.type,minutes:Math.min(duration,routine.minutes),volumeMultiplier:phase==="deload"?.65:phase==="intensify"?1.05:1,progression,readinessNote:recent.length?"Review recent session load and recovery before increasing effort.":"Start conservatively and establish a repeatable baseline.",status:"planned",availability:slot.availability,needsRosterConfirmation:slot.availability==="unconfirmed"});
  });
 }
 return {id:"program-"+start,createdAt:new Date().toISOString(),startDate:start,weeks:6,goal,setting,daysPerWeek:days,sessions,rosterAware:true};
}
