// Flight Intelligence domain logic. Calculations use only recorded sectors.
export function normalizeIcao(value){return String(value||"").trim().toUpperCase()}
export function validateSector(s){
 const errors=[];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s.date||""))errors.push("Date is required.");
 if(!/^[A-Z]{4}$/.test(normalizeIcao(s.from)))errors.push("Departure must be a 4-letter ICAO code.");
 if(!/^[A-Z]{4}$/.test(normalizeIcao(s.to)))errors.push("Arrival must be a 4-letter ICAO code.");
 if(normalizeIcao(s.from)===normalizeIcao(s.to))errors.push("Departure and arrival airports must differ.");
 const h=Number(s.hours);if(!Number.isFinite(h)||h<=0||h>24)errors.push("Block time must be between 0 and 24 hours.");
 if(s.landings!==""&&s.landings!=null&&(!Number.isInteger(Number(s.landings))||Number(s.landings)<0))errors.push("Landings must be a non-negative integer.");
 return errors;
}
export function summarizeLogbook(entries,previousExperienceHours=0){
 const valid=entries.filter(x=>!validateSector(x).length);
 const recordedHours=valid.reduce((n,x)=>n+Number(x.hours),0);const hours=recordedHours+Number(previousExperienceHours||0);
 const airports=new Set(valid.flatMap(x=>[normalizeIcao(x.from),normalizeIcao(x.to)]));
 const routes=new Map(),byMonth=new Map(),byYear=new Map(),byAirport=new Map();
 for(const x of valid){
  const route=normalizeIcao(x.from)+"–"+normalizeIcao(x.to);routes.set(route,(routes.get(route)||0)+1);
  const month=(x.date||"").slice(0,7),year=(x.date||"").slice(0,4);
  byMonth.set(month,(byMonth.get(month)||0)+Number(x.hours));byYear.set(year,(byYear.get(year)||0)+Number(x.hours));
  for(const apt of [normalizeIcao(x.from),normalizeIcao(x.to)])byAirport.set(apt,(byAirport.get(apt)||0)+1);
 }
 const topRoutes=[...routes].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([route,sectors])=>({route,sectors}));
 const monthly=[...byMonth].sort((a,b)=>a[0].localeCompare(b[0])).slice(-12).map(([month,hours])=>({month,hours:Number(hours.toFixed(1))}));
 const yearly=[...byYear].sort((a,b)=>a[0].localeCompare(b[0])).map(([year,hours])=>({year,hours:Number(hours.toFixed(1))}));
 const airportsRank=[...byAirport].sort((a,b)=>b[1]-a[1]).map(([icao,sectors])=>({icao,sectors}));
 return {sectors:valid.length,hours:Number(hours.toFixed(1)),recordedHours:Number(recordedHours.toFixed(1)),previousExperienceHours:Number(Number(previousExperienceHours||0).toFixed(1)),airports:airports.size,topRoutes,monthly,yearly,airportsRank,invalid:entries.length-valid.length};
}
export function logbookCsv(entries){
 const cols=["date","from","to","hours","flightNumber","aircraft","role","landings","notes"];
 const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 return [cols.join(","),...entries.map(x=>cols.map(k=>quote(x[k])).join(","))].join("\r\n");
}
