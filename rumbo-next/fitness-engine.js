// Structured exercise catalogue and transparent load-progression helpers for RUMBO Fitness.
export const EXERCISES = [
 {id:"squat",name:"Goblet squat",pattern:"Squat",muscles:["Quadriceps","Glutes"],equipment:["Dumbbell"],level:"Beginner",cues:["Brace your trunk before descending.","Keep the whole foot grounded.","Move only through a comfortable range."],substitutions:["Bodyweight squat","Leg press"],videoSearch:"goblet squat exercise technique"},
 {id:"leg-press",name:"Leg press",pattern:"Squat",muscles:["Quadriceps","Glutes"],equipment:["Gym machine"],level:"Beginner",cues:["Keep hips and back supported.","Do not lock the knees forcefully.","Use a controlled range."],substitutions:["Goblet squat","Split squat"],videoSearch:"leg press exercise technique"},
 {id:"bench-press",name:"Barbell bench press",pattern:"Horizontal push",muscles:["Chest","Triceps","Front deltoids"],equipment:["Barbell","Bench"],level:"Intermediate",cues:["Set shoulder blades comfortably.","Keep wrists stacked over elbows.","Use a spotter or safety arms for challenging loads."],substitutions:["Dumbbell press","Incline push-up"],videoSearch:"barbell bench press technique"},
 {id:"db-press",name:"Dumbbell bench press",pattern:"Horizontal push",muscles:["Chest","Triceps"],equipment:["Dumbbells","Bench"],level:"Beginner",cues:["Keep shoulders stable.","Lower under control.","Choose a load that allows consistent reps."],substitutions:["Push-up","Machine chest press"],videoSearch:"dumbbell bench press technique"},
 {id:"row",name:"Seated cable row",pattern:"Horizontal pull",muscles:["Back","Biceps"],equipment:["Cable machine"],level:"Beginner",cues:["Keep torso stable.","Pull elbows toward the hips.","Avoid swinging to move the load."],substitutions:["Dumbbell row","Resistance-band row"],videoSearch:"seated cable row technique"},
 {id:"lat-pulldown",name:"Lat pulldown",pattern:"Vertical pull",muscles:["Lats","Biceps"],equipment:["Cable machine"],level:"Beginner",cues:["Start with shoulders controlled.","Pull toward upper chest without leaning excessively.","Return slowly."],substitutions:["Assisted pull-up","Band pulldown"],videoSearch:"lat pulldown exercise technique"},
 {id:"rdl",name:"Romanian deadlift",pattern:"Hip hinge",muscles:["Hamstrings","Glutes"],equipment:["Dumbbells or barbell"],level:"Intermediate",cues:["Keep spine neutral.","Move hips backward.","Keep the load close to the legs."],substitutions:["Hip bridge","Cable pull-through"],videoSearch:"romanian deadlift technique"},
 {id:"split-squat",name:"Split squat",pattern:"Single-leg",muscles:["Quadriceps","Glutes"],equipment:["Bodyweight or dumbbells"],level:"Intermediate",cues:["Use a stable stance.","Lower vertically within a comfortable range.","Hold support if balance is limiting."],substitutions:["Step-up","Supported lunge"],videoSearch:"split squat exercise technique"},
 {id:"shoulder-press",name:"Dumbbell shoulder press",pattern:"Vertical push",muscles:["Shoulders","Triceps"],equipment:["Dumbbells"],level:"Intermediate",cues:["Keep ribs stacked over pelvis.","Press without painful range.","Avoid excessive lower-back arch."],substitutions:["Landmine press","Incline push-up"],videoSearch:"dumbbell shoulder press technique"},
 {id:"hip-bridge",name:"Glute bridge",pattern:"Hip extension",muscles:["Glutes","Hamstrings"],equipment:["Bodyweight or band"],level:"Beginner",cues:["Keep ribs down.","Drive through the feet.","Pause briefly at the top without overextending."],substitutions:["Hip thrust","Single-leg bridge"],videoSearch:"glute bridge exercise technique"},
 {id:"plank",name:"Front plank",pattern:"Core stability",muscles:["Abdominals","Shoulders"],equipment:["Bodyweight"],level:"Beginner",cues:["Keep a straight line from head to heel.","Breathe continuously.","Stop when position cannot be maintained."],substitutions:["Incline plank","Dead bug"],videoSearch:"front plank exercise technique"},
 {id:"dead-bug",name:"Dead bug",pattern:"Core stability",muscles:["Abdominals"],equipment:["Bodyweight"],level:"Beginner",cues:["Keep lower back comfortably stable.","Move opposite arm and leg slowly.","Shorten the range if the back arches."],substitutions:["Heel taps","Bird dog"],videoSearch:"dead bug exercise technique"}
];
export function exerciseById(id){return EXERCISES.find(x=>x.id===id)||null}
export function suggestNextLoad(history,exerciseId){
 const entries=(history||[]).flatMap(w=>(w.exercises||[]).filter(x=>x.exerciseId===exerciseId).map(x=>({...x,date:w.date}))).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const last=entries[0];if(!last)return {status:"start",message:"Registra una primera sesión con una carga cómoda y técnica consistente."};
 const reps=Number(last.reps)||0,sets=Number(last.sets)||0,rpe=Number(last.rpe)||0,weight=Number(last.weight)||0;
 if(rpe>=9||reps<6)return {status:"hold",weight,message:"Mantén o reduce la carga; el último registro fue exigente o quedó por debajo del rango objetivo."};
 if(reps>=12&&sets>=3&&rpe>0&&rpe<=7.5)return {status:"increase",weight:Number((weight+(weight>0?weight*0.025:0)).toFixed(2)),message:"Si la técnica fue sólida, prueba un incremento pequeño (aprox. 2,5%) o la siguiente carga disponible."};
 return {status:"repeat",weight,message:"Repite la carga y consolida las repeticiones antes de progresar."};
}
export function validateExerciseEntry(entry){
 const errors=[];
 if(!exerciseById(entry.exerciseId))errors.push("Choose an exercise.");
 if(!Number.isInteger(Number(entry.sets))||Number(entry.sets)<1||Number(entry.sets)>20)errors.push("Sets must be between 1 and 20.");
 if(!Number.isInteger(Number(entry.reps))||Number(entry.reps)<1||Number(entry.reps)>100)errors.push("Reps must be between 1 and 100.");
 if(!Number.isFinite(Number(entry.weight))||Number(entry.weight)<0||Number(entry.weight)>1000)errors.push("Enter a valid load in kg.");
 if(entry.rpe!==""&&(!Number.isFinite(Number(entry.rpe))||Number(entry.rpe)<1||Number(entry.rpe)>10))errors.push("RPE must be between 1 and 10.");
 return errors;
}

export function exerciseProgressSummary(workouts,exerciseId){
 const entries=(workouts||[]).flatMap(w=>(w.exercises||[]).filter(x=>x.exerciseId===exerciseId).map(x=>({...x,date:w.date||""})))
  .sort((a,b)=>(a.date||"").localeCompare(b.date||""));
 if(!entries.length)return {sessions:0,last:null,bestLoad:0,bestVolume:0};
 const last=entries[entries.length-1],bestLoad=Math.max(0,...entries.map(x=>Number(x.weight)||0));
 const bestVolume=Math.max(0,...entries.map(x=>(Number(x.sets)||0)*(Number(x.reps)||0)*(Number(x.weight)||0)));
 return {sessions:entries.length,last,bestLoad:Number(bestLoad.toFixed(2)),bestVolume:Number(bestVolume.toFixed(1))};
}
export function validateBodyMetric(entry){
 const errors=[],values=["weightKg","waistCm","bodyFatPct"].map(k=>Number(entry?.[k])).filter(v=>Number.isFinite(v)&&v>0);
 if(!values.length)errors.push("Add at least one body measurement.");
 if(entry?.weightKg!==""&&entry?.weightKg!=null&&(!Number.isFinite(Number(entry.weightKg))||Number(entry.weightKg)<25||Number(entry.weightKg)>300))errors.push("Weight must be between 25 and 300 kg.");
 if(entry?.waistCm!==""&&entry?.waistCm!=null&&(!Number.isFinite(Number(entry.waistCm))||Number(entry.waistCm)<30||Number(entry.waistCm)>200))errors.push("Waist must be between 30 and 200 cm.");
 if(entry?.bodyFatPct!==""&&entry?.bodyFatPct!=null&&(!Number.isFinite(Number(entry.bodyFatPct))||Number(entry.bodyFatPct)<3||Number(entry.bodyFatPct)>70))errors.push("Body fat must be between 3 and 70%.");
 return errors;
}
