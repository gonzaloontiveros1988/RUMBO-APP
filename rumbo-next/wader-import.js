// Wader CSV importer. Keeps dated sectors separate from undated previous-experience totals.
function parseCsv(text){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
  if(quoted){if(c==='"'&&n==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}
  else if(c==='"')quoted=true;
  else if(c===","){row.push(cell);cell=""}
  else if(c==="\n"){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell=""}
  else cell+=c;
 }
 if(cell.length||row.length){row.push(cell.replace(/\r$/,""));rows.push(row)}
 return rows.filter(r=>r.some(x=>x!==""));
}
const num=v=>{const n=Number(String(v??"").trim());return Number.isFinite(n)?n:0};
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||"").trim());
export function parseWaderCsv(text){
 const rows=parseCsv(text);if(rows.length<2)throw new Error("CSV vacío o sin registros.");
 const headers=rows[0].map(x=>x.trim());const required=["isPreviousExperience","isSimulator","flightDate","flightNumber","depAirport","arrAirport","aircraftType","function","totalTime"];
 const index=Object.fromEntries(headers.map((h,i)=>[h,i]));const missing=required.filter(k=>index[k]===undefined);
 if(missing.length)throw new Error("No parece un CSV de Wader. Faltan columnas: "+missing.join(", "));
 const get=(r,k)=>(r[index[k]]??"").trim();
 const flights=[],simulators=[],previous=[];
 for(let i=1;i<rows.length;i++){
  const r=rows[i],date=get(r,"flightDate"),isSim=get(r,"isSimulator").toLowerCase()==="true",isPrev=get(r,"isPreviousExperience").toLowerCase()==="true";
  const minutes=num(get(r,"totalTime"));
  if(isPrev||!validDate(date)){if(isPrev&&minutes>0)previous.push({aircraft:get(r,"aircraftType"),minutes,picMinutes:num(get(r,"picTime")),dualMinutes:num(get(r,"dualTime")),crossCountryMinutes:num(get(r,"crossCountryTime")),ifrMinutes:num(get(r,"ifrTime")),nightMinutes:num(get(r,"nightTime"))});continue}
  const from=get(r,"depAirport").toUpperCase(),to=get(r,"arrAirport").toUpperCase();
  if(!from||!to||minutes<=0){if(isSim)simulators.push({date,aircraft:get(r,"aircraftType"),minutes});continue}
  const item={date,from,to,hours:Number((minutes/60).toFixed(4)),flightNumber:get(r,"flightNumber"),aircraft:get(r,"aircraftType"),tailnumber:get(r,"aircraftTailnumber"),role:get(r,"function"),picHours:Number((num(get(r,"picTime"))/60).toFixed(4)),sicHours:Number((num(get(r,"sicTime"))/60).toFixed(4)),picusHours:Number((num(get(r,"picusTime"))/60).toFixed(4)),ifrHours:Number((num(get(r,"ifrTime"))/60).toFixed(4)),nightHours:Number((num(get(r,"nightTime"))/60).toFixed(4)),takeoffs:num(get(r,"dayTakeoffs"))+num(get(r,"nightTakeoffs")),landings:num(get(r,"dayLandings"))+num(get(r,"nightLandings")),simulator:isSim,source:"Wader"};
  (isSim?simulators:flights).push(item);
 }
 const previousMinutes=previous.reduce((n,x)=>n+x.minutes,0),flightMinutes=flights.reduce((n,x)=>n+Math.round(x.hours*60),0);
 const airportSet=new Set(flights.flatMap(x=>[x.from,x.to]));
 const keys=new Set();let duplicates=0;for(const x of flights){const k=[x.date,x.flightNumber,x.from,x.to,x.hours].join("|");if(keys.has(k))duplicates++;else keys.add(k)}
 return {source:"Wader",flights,simulators,previous,summary:{flights:flights.length,simulatorSessions:simulators.length,previousExperienceHours:Number((previousMinutes/60).toFixed(2)),recordedFlightHours:Number((flightMinutes/60).toFixed(2)),allTimeHours:Number(((previousMinutes+flightMinutes)/60).toFixed(2)),allTimeMinutes:previousMinutes+flightMinutes,airports:airportSet.size,duplicateCandidates:duplicates,dateFrom:flights.map(x=>x.date).sort()[0]||null,dateTo:flights.map(x=>x.date).sort().at(-1)||null,aircraft:[...new Set(flights.map(x=>x.aircraft))]}};
}
