// RUMBO roster ingestion helpers. Pure parsing only; never writes to user data.
export function parseDelimited(text) {
  const first = text.split(/\r?\n/, 1)[0] || "";
  const counts = [",", ";", "\t"].map(d => ({d, n: first.split(d).length - 1}));
  const delimiter = counts.sort((a,b) => b.n-a.n)[0].d;
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch === '"' && quoted && text[i+1] === '"'){cell+='"';i++;}
    else if(ch === '"') quoted=!quoted;
    else if(ch === delimiter && !quoted){row.push(cell.trim());cell="";}
    else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell="";}
    else cell+=ch;
  }
  row.push(cell.trim()); if(row.some(Boolean))rows.push(row);
  return rows;
}
function validDateKey(value) {
  const m=String(value||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return false;
  const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const date=new Date(Date.UTC(y,month-1,day));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}
export function normalizeRosterDate(raw) {
  raw=String(raw||"").trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const value=raw.slice(0,10);
    return validDateKey(value)?value:"";
  }
  let m=raw.match(/^(\d{2})[\/.](\d{2})[\/.](\d{4})$/);
  if(m) {
    const value=m[3]+"-"+m[2]+"-"+m[1];
    return validDateKey(value)?value:"";
  }
  m=raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if(!m)return "";
  const value=m[1]+"-"+m[2]+"-"+m[3];
  return validDateKey(value)?value:"";
}
export function parseRosterText(text, filename="roster.csv") {
  const rows=[];
  if(filename.toLowerCase().endsWith(".ics")){
    text=text.replace(/\r?\n[ \t]/g,"");
    for(const event of text.split("BEGIN:VEVENT").slice(1)){
      const dt=event.match(/DTSTART(?:;[^:]*)?:(\d{8})(?:T(\d{2})(\d{2}))?/);
      const end=event.match(/DTEND(?:;[^:]*)?:(\d{8})?(?:T(\d{2})(\d{2}))?/);
      const summary=event.match(/SUMMARY:(.*)/);
      const description=event.match(/DESCRIPTION:(.*)/);
      if(!dt)continue;
      const date=dt[1].slice(0,4)+"-"+dt[1].slice(4,6)+"-"+dt[1].slice(6,8);
      if(!validDateKey(date))continue;
      const reportTime=dt[2]?dt[2]+":"+dt[3]:"";
      const endTime=end?.[2]?end[2]+":"+end[3]:"";
      rows.push({date,code:(summary?.[1]||"IMPORTED DUTY").trim(),route:(description?.[1]||"").trim(),time:reportTime,reportTime,endTime});
    }
    return rows;
  }
  const table=parseDelimited(text),headers=(table.shift()||[]).map(x=>x.toLowerCase().replace(/[ _-]/g,""));
  for(const cells of table){
    const o=Object.fromEntries(headers.map((h,i)=>[h,cells[i]||""]));
    const date=normalizeRosterDate(o.date||o.dutydate||o.startdate||o.fecha||o.datum);
    if(!date)continue;
    const reportTime=o.reporttime||o.report||o.rpt||o.time||"";
    const endTime=o.endtime||o.dutyend||o.release||o.offtime||o.finish||"";
    rows.push({date,code:o.code||o.flight||o.duty||o.flightnumber||o.flightno||"DUTY",route:o.route||[o.from||o.origin,o.to||o.destination].filter(Boolean).join("–"),time:reportTime,reportTime,endTime});
  }
  return rows;
}
