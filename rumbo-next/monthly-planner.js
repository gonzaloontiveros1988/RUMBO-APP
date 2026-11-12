// Monthly Autopilot planning engine.
// Suggestions are drafts only; never alter roster duties or external calendars.
const pad=n=>String(n).padStart(2,"0");
export const isoDate=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
export function classifyDuty(duty){
 const raw=[duty.code,duty.kind,duty.status,duty.raw,duty.type].filter(Boolean).join(" ").toUpperCase();
 if(/\b(PSBY|STANDBY|STAND-BY|SBY)\b/.test(raw))return "STANDBY";
 if(/\b(OFF|DOFF|DAY OFF|REST)\b/.test(raw))return "OFF";
 if(/\b(GRND|GROUND|TRAINING|SIM|SIMULATOR|TRNG|TRG)\b/.test(raw))return "TRAINING";
 if(/\b(LEAVE|VAC|VACATION|ANNUAL LEAVE|AL)\b/.test(raw))return "LEAVE";
 if(/\b(FLIGHT|DUTY)\b/.test(raw)||/\b(?:QR)?\d{3,4}\b/.test(raw)||duty.segments?.length||duty.flightNumbers?.length||duty.flightNumber)return "FLIGHT";
 return "OTHER";
}
export function summarizeRoster(duties,year,month){
 const inMonth=duties.filter(d=>{const x=new Date(d.date+"T12:00:00");return x.getFullYear()===year&&x.getMonth()===month});
 const priority={FLIGHT:6,TRAINING:5,STANDBY:4,LEAVE:3,OFF:2,OTHER:1},byDate=new Map();
 for(const d of inMonth){const type=classifyDuty(d),old=byDate.get(d.date);if(!old||(priority[type]||0)>(priority[old]||0))byDate.set(d.date,type)}
 const counts={FLIGHT:0,OFF:0,STANDBY:0,TRAINING:0,LEAVE:0,OTHER:0};for(const type of byDate.values())counts[type]++;
 return {total:inMonth.length,entries:inMonth.length,coveredDays:byDate.size,days:byDate.size,counts,...counts};
}
export function buildMonthlyPlan(duties,year,month){
 const inMonth=duties.filter(d=>{const x=new Date(d.date+"T12:00:00");return x.getFullYear()===year&&x.getMonth()===month}).sort((a,b)=>a.date.localeCompare(b.date));
 const byDate=new Map(inMonth.map(d=>[d.date,d]));
 const proposals=[];
 for(const duty of inMonth){
  const type=classifyDuty(duty),date=duty.date;
  if(type==="FLIGHT")proposals.push({date,title:"Flight duty · protect recovery window",detail:"Flight duty detected"+(duty.time?" · report "+duty.time:"")+". Review rest, hydration and personal commitments around this service.",kind:"recovery",sourceCode:duty.code});
  if(type==="STANDBY")proposals.push({date,title:"Standby · keep plans flexible",detail:"Standby identified. Avoid treating this day as confirmed free time until released.",kind:"flex",sourceCode:duty.code});
  if(type==="TRAINING")proposals.push({date,title:"Training duty · avoid duplicate sessions",detail:"Training or ground activity detected. Review whether a separate workout is appropriate.",kind:"training",sourceCode:duty.code});
  if(type==="OFF")proposals.push({date,title:"Roster OFF · candidate personal day",detail:"Roster marks this date OFF. Confirm family and recovery commitments before scheduling activities.",kind:"availability",sourceCode:duty.code});
  if(type==="LEAVE")proposals.push({date,title:"Leave · personal planning window",detail:"Leave marker detected. Confirm dates and any travel or family plans.",kind:"availability",sourceCode:duty.code});
 }
 for(let i=0;i<inMonth.length-1;i++){
  const a=inMonth[i],b=inMonth[i+1],gap=(new Date(b.date+"T12:00:00")-new Date(a.date+"T12:00:00"))/86400000;
  if(gap>1){const d=new Date(a.date+"T12:00:00");d.setDate(d.getDate()+1);const date=isoDate(d);if(d.getFullYear()===year&&d.getMonth()===month&&!byDate.has(date))proposals.push({date,title:"Unassigned roster date · verify availability",detail:"No imported duty was found on this date. This is not proof of a day off; verify the official roster before planning.",kind:"verify",sourceCode:""});}
 }
 return proposals.sort((a,b)=>a.date.localeCompare(b.date));
}
export function buildMonthCells(year,month,duties){
 const first=new Date(year,month,1),offset=(first.getDay()+6)%7,total=Math.ceil((offset+new Date(year,month+1,0).getDate())/7)*7;
 const map=new Map(duties.map(d=>[d.date,d]));
 return Array.from({length:total},(_,i)=>{const date=new Date(year,month,1-offset+i),iso=isoDate(date),duty=map.get(iso);return {date:iso,day:date.getDate(),inMonth:date.getMonth()===month,duty,type:duty?classifyDuty(duty):"UNKNOWN"};});
}
