// Pure recurring reminder helpers. Dates use the user's local calendar date (YYYY-MM-DD).
const dateOf=value=>{const [y,m,d]=String(value).slice(0,10).split("-").map(Number);return new Date(y,m-1,d,12,0,0,0)};
const keyOf=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();
export function reminderLabel(repeat){
 return ({none:"Una sola vez",monthly:"Cada mes",weekly:"Cada semana",yearly:"Cada año"})[repeat]||"Una sola vez";
}
export function expandReminders(reminders=[],from,to){
 const start=dateOf(from),end=dateOf(to),out=[];
 if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||start>end)return out;
 for(const r of reminders){
  if(!r||!r.title||!r.startDate)continue;
  const first=dateOf(r.startDate);if(Number.isNaN(first.getTime()))continue;
  const repeat=["monthly","weekly","yearly"].includes(r.repeat)?r.repeat:"none";
  if(repeat==="none"){
   if(first>=start&&first<=end)out.push({date:keyOf(first),title:r.title,reminderId:r.id,repeat});
   continue;
  }
  let cursor=new Date(Math.max(first.getTime(),start.getTime()));
  if(repeat==="weekly"){
   const diff=Math.max(0,Math.ceil((cursor-first)/86400000));
   cursor.setDate(cursor.getDate()+((7-(diff%7))%7));
   while(cursor<=end){if(cursor>=first)out.push({date:keyOf(cursor),title:r.title,reminderId:r.id,repeat});cursor.setDate(cursor.getDate()+7)}
  }else if(repeat==="monthly"){
   let index=Math.max(0,(cursor.getFullYear()-first.getFullYear())*12+cursor.getMonth()-first.getMonth());
   for(;index<2400;index++){
    const y=first.getFullYear()+Math.floor((first.getMonth()+index)/12),m=(first.getMonth()+index)%12;
    const d=new Date(y,m,Math.min(first.getDate(),daysInMonth(y,m)),12);
    if(d>end)break;if(d>=first&&d>=start)out.push({date:keyOf(d),title:r.title,reminderId:r.id,repeat});
   }
  }else{
   let index=Math.max(0,cursor.getFullYear()-first.getFullYear());
   for(;index<200;index++){
    const y=first.getFullYear()+index,m=first.getMonth(),d=new Date(y,m,Math.min(first.getDate(),daysInMonth(y,m)),12);
    if(d>end)break;if(d>=first&&d>=start)out.push({date:keyOf(d),title:r.title,reminderId:r.id,repeat});
   }
  }
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}
