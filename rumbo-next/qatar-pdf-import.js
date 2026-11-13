// Qatar Airways Crew Schedule Report PDF reader.
// Uses PDF.js in-browser; extraction is preview-only until the user confirms import.
const PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
async function pdfjs(){if(window.pdfjsLib)return window.pdfjsLib;await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=PDFJS;s.onload=resolve;s.onerror=()=>reject(new Error("No se pudo cargar el lector PDF. Comprueba la conexión."));document.head.appendChild(s)});window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";return window.pdfjsLib}
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
const qatarIsoDate=raw=>{const m=String(raw||"").match(/^(\d{2})-([A-Z]{3})-(\d{4})$/i),months={JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12"};return m&&months[m[2].toUpperCase()]?m[3]+"-"+months[m[2].toUpperCase()]+"-"+m[1]:""};
export function extractDutyTimes(text){
 const raw=norm(text).toUpperCase();
 // Qatar's monthly grid places RPT at the top of each day's column,
 // followed by the individual sector / training event times. DH and BH
 // are duration totals at the bottom of the grid, not clock times.
 const report=raw.match(/\bRPT\s*:?\s*(\d{2}:\d{2})\b/);
 const labelledStart=raw.match(/\b(?:DUTY\s*START|START\s*DUTY|SIGN\s*ON)\s*:?\s*(\d{2}:\d{2})\b/);
 const clockTimes=[];
 for(const m of raw.matchAll(/\b(\d{2}):(\d{2})(\(\+1\))?/g)){
   const before=raw.slice(Math.max(0,m.index-5),m.index);
   if(/(?:DH|BH)\s*:\s*$/.test(before))continue;
   clockTimes.push({time:m[1]+":"+m[2],dayOffset:m[3]?1:0,index:m.index});
 }
 const start=report?.[1]||labelledStart?.[1]||clockTimes[0]?.time||"";
 // Ignore the RPT label itself: the final clock time in the column is
 // the last scheduled arrival / training event. Preserve (+1) arrivals.
 const end=clockTimes.length?clockTimes[clockTimes.length-1]:null;
 return {
   reportTime:start,
   endTime:end?.time||"",
   endDayOffset:end?.dayOffset||0,
   firstTime:clockTimes[0]?.time||"",
   lastTime:end?.time||""
 };
}
function getVal(items,re){const x=items.find(t=>re.test(t));return x||""}
export async function parseQatarRosterPDF(file){
 const lib=await pdfjs(),buf=await file.arrayBuffer(),pdf=await lib.getDocument({data:buf}).promise;
 let page1=await pdf.getPage(1),tc=await page1.getTextContent(),items=tc.items.map(i=>({t:norm(i.str),x:i.transform[4],y:i.transform[5]})).filter(i=>i.t);
 const period=items.map(i=>i.t).join(" ").match(/Period:\s*(\d{2}-[A-Za-z]{3}-\d{4})\s*-\s*(\d{2}-[A-Za-z]{3}-\d{4})/i);
 const name=items.map(i=>i.t).join(" ").match(/Name\s*:\s*(.*?)\s+All times/i);
 const header=items.filter(i=>/^\d{1,2}[A-Za-z]{3}$/i.test(i.t)).sort((a,b)=>a.x-b.x);
 if(!header.length)throw new Error("No reconozco la cabecera mensual del roster. No se ha importado ningún dato.");
 const cols=header.map(h=>({date:h.t, x:h.x, day:Number(h.t.match(/^\d+/)[0])}));
 const grouped=cols.map((c,index)=>{const next=cols[index+1]?.x??Infinity;const col=items.filter(i=>i.x>=c.x-3&&i.x<next-3&&i.y<=(header[0].y+10)&&i.y>120);return {header:c,items:col.sort((a,b)=>b.y-a.y)}});
 const duties=[];
 const excluded=new Set(["RPT","REQ","OFF","DOFF","PSBY","GRND","PA","SW","SIM","TRG","TRNG","GT","ST","SBY","DH","BH","A321","A320","QR","FO","CAP","PIC","SIC","UTC","LOCAL","SUN","MON","TUE","WED","THU","FRI","SAT","JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]);
 const month=(period?.[1]||"").match(/-([A-Za-z]{3})-/)?.[1]||"";
 const year=(period?.[1]||"").slice(-4);
 const monthNo=month?String(new Date(Date.parse(month+" 1, 2000")).getMonth()+1).padStart(2,"0"):"";
 const airportTokens=arr=>{const out=[];for(const item of arr){for(const m of item.t.toUpperCase().matchAll(/\b([A-Z]{3,4})\b/g)){const code=m[1];if(!excluded.has(code)&&!/^A32[01]$/.test(code)&&!/^QR$/.test(code))out.push({code,y:item.y,x:item.x})}}return out};
 for(const g of grouped){
   const text=g.items.map(i=>i.t).join(" | ");
   const times=extractDutyTimes(text);
   const status=text.match(/\b(OFF|DOFF|PSBY|GRND)\b/i);
   const flightCodes=[...text.matchAll(/\b(\d{3,4})\b/g)].map(m=>m[1]).filter(x=>!/^20\d{2}$/.test(x));
   const airports=airportTokens(g.items).sort((a,b)=>b.y-a.y||a.x-b.x).map(x=>x.code);
   const uniqueAirports=airports.filter((x,i)=>i===0||x!==airports[i-1]);
   const segments=[];
   for(let i=0;i+1<uniqueAirports.length;i+=2)segments.push({from:uniqueAirports[i],to:uniqueAirports[i+1],flightNumber:flightCodes[Math.floor(i/2)]||""});
   const route=segments.length?segments.map(x=>x.from+"–"+x.to).join(" / "):"";
   const date=year&&monthNo?year+"-"+monthNo+"-"+String(g.header.day).padStart(2,"0"):"";
   if(!times.reportTime&&!times.endTime&&!status&&!flightCodes.length&&!segments.length)continue;
   const kind=status?.[1]?.toUpperCase()||(segments.length?"FLIGHT":"DUTY");
   duties.push({date,code:status?.[1]?.toUpperCase()||flightCodes.join("/")||kind,route,time:times.reportTime,endTime:times.endTime,endDayOffset:times.endDayOffset||0,reportTime:times.reportTime,kind,segments,flightNumbers:flightCodes,airports:[...new Set(uniqueAirports)],source:"Qatar Airways PDF",raw:text});
 }
 const all=items.map(i=>i.t).join(" ");
 const statBlock=all.match(/STATISTICS([\s\S]*?)HOTEL DETAILS/);
 const stats=statBlock?{blockHours:(statBlock[1].match(/VALUE\s+(\d{2}:\d{2})/)||[])[1]||"",dutyHours:(statBlock[1].match(/VALUE\s+\d{2}:\d{2}\s+(\d{2}:\d{2})/)||[])[1]||"",groundTrainingDays:(statBlock[1].match(/VALUE\s+\d{2}:\d{2}\s+\d{2}:\d{2}\s+(\d+)/)||[])[1]||"",flightDays:(statBlock[1].match(/VALUE\s+\d{2}:\d{2}\s+\d{2}:\d{2}\s+\d+\s+(\d+)/)||[])[1]||""}:null;
 const hotels=[];for(const m of all.matchAll(/(\d{2}-[A-Z]{3}-\d{4})\s+(ALA|VIE|OTP|BEG)\s+(.{4,100}?)(?=\s+\+?\d[\d ]{7,}|$)/g))hotels.push({date:m[1],location:m[2],hotel:norm(m[3])});
 const training=[];if(pdf.numPages>1){const p=await pdf.getPage(2),t=await p.getTextContent();const txt=t.items.map(i=>norm(i.str)).filter(Boolean).join(" ");for(const m of txt.matchAll(/(\d{2}-[A-Z]{3}-\d{4})\s+(DOH)\s+QR-INTEGRATED TRAINING CENTRE ITC\s+.*?\s+(A321neo Door Training|Classroom 12)\s+Business Attire/gi))training.push({date:qatarIsoDate(m[1]),location:m[2],activity:m[3]})}
 const uniqueDutyDates=[...new Set(duties.map(x=>x.date).filter(Boolean))];
 const summary={days:uniqueDutyDates.length,flightDays:duties.filter(x=>x.kind==="FLIGHT").length,offDays:duties.filter(x=>x.kind==="OFF"||x.kind==="DOFF").length,standbyDays:duties.filter(x=>x.kind==="PSBY").length,trainingDays:duties.filter(x=>x.kind==="GRND").length,flightSectors:duties.reduce((n,x)=>n+x.segments.length,0)};
 return {period:period?period[1]+" – "+period[2]:"Period not detected",crew:name?.[1]||"",duties,stats,summary,hotels,training,pageCount:pdf.numPages,parser:"Qatar Airways Crew Schedule Report"};
}
