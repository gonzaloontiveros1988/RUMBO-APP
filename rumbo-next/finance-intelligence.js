// Local receipt parsing and duplicate checks. No receipt text leaves the browser.
const CATEGORY_RULES=[
 ["Groceries",/GROCERY|SUPERMARKET|HYPERMARKET|CARREFOUR|LULU|MONOPRIX|SPINNEYS|TESCO|ALDI|LIDL|مخبز|بقالة|سوبرماركت/i],
 ["School",/SCHOOL|TUITION|EDUCATION|NURSERY|KINDERGARTEN|مدرسة|رسوم/i],
 ["Transport",/FUEL|PETROL|GAS STATION|UBER|TAXI|METRO|PARKING|SALIK|وقود|بنزين/i],
 ["Dining",/RESTAURANT|CAFE|COFFEE|FOOD DELIVERY|TALABAT|DELIVEROO|مطعم|مقهى/i],
 ["Healthcare",/PHARMACY|HOSPITAL|CLINIC|MEDICAL|صيدلية|مستشفى|عيادة/i],
 ["Utilities",/ELECTRICITY|WATER BILL|INTERNET|TELECOM|OOREDOO|VODAFONE|KAHRAMAA|كهرباء|ماء/i],
 ["Housing",/RENT|PROPERTY|MAINTENANCE|FACILITY|إيجار/i]
];
function parseAmount(value){
 let s=String(value||"").replace(/[^0-9,.-]/g,"");
 if(!s)return NaN;
 const comma=s.lastIndexOf(","),dot=s.lastIndexOf(".");
 if(comma>=0&&dot>=0){if(comma>dot)s=s.replace(/\./g,"").replace(",",".");else s=s.replace(/,/g,"")}
 else if(comma>=0){const decimals=s.length-comma-1;s=decimals===2?s.replace(",","."):s.replace(/,/g,"")}
 const n=Number(s);return Number.isFinite(n)&&n>=0?n:NaN;
}
function validIsoDate(year,month,day){
 const d=new Date(Date.UTC(year,month-1,day));
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day
  ?year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0"):"";
}
function parseReceiptDate(raw){
 let m=String(raw||"").match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
 if(m)return validIsoDate(Number(m[1]),Number(m[2]),Number(m[3]));
 m=String(raw||"").match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
 if(m){const a=Number(m[1]),b=Number(m[2]),y=Number(m[3]);return a>12?validIsoDate(y,b,a):b>12?validIsoDate(y,a,b):validIsoDate(y,b,a)}
 return "";
}
function detectCurrency(raw){
 const s=String(raw||"").toUpperCase();
 if(/\bQAR\b|\bQR\b|ر\.ق/.test(s))return "QAR";
 if(/\bAED\b|د\.إ/.test(s))return "AED";
 if(/\bSAR\b/.test(s))return "SAR";
 if(/\bEUR\b|€/.test(s))return "EUR";
 if(/\bUSD\b|\$/.test(s))return "USD";
 if(/\bGBP\b|£/.test(s))return "GBP";
 return "QAR";
}
function extractAmountFromLine(line){
 const matches=[...String(line||"").matchAll(/(?:QAR|QR|EUR|USD|AED|SAR|GBP|€|\$|£)?\s*([0-9][0-9,]*(?:[.,][0-9]{1,2})?)/gi)];
 const values=matches.map(m=>parseAmount(m[1])).filter(Number.isFinite);
 return values.length?values[values.length-1]:NaN;
}
function classifyReceipt(raw){
 const rule=CATEGORY_RULES.find(([,pattern])=>pattern.test(String(raw||"")));
 return rule?rule[0]:"Other";
}
function merchantFromLines(lines){
 const ignored=/^(TAX|VAT|TRN|INVOICE|RECEIPT|CASH|CARD|TOTAL|SUBTOTAL|DATE|TIME|TEL|PHONE|WWW\.|HTTP|THANK YOU|CUSTOMER COPY|رقم|التاريخ|الإجمالي|المجموع)/i;
 return lines.find(x=>x.length>2&&!ignored.test(x)&&!/^\d[\d\s./:-]*$/.test(x))||"";
}
export function parseReceiptText(raw){
 const text=String(raw||""),lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
 const totalLines=lines.filter(x=>/GRAND TOTAL|TOTAL DUE|AMOUNT DUE|TOTAL PAYABLE|NET TOTAL|\bTOTAL\b|الإجمالي|المجموع/i.test(x));
 let amount=NaN;
 for(const line of totalLines.slice().reverse()){amount=extractAmountFromLine(line);if(Number.isFinite(amount))break}
 if(!Number.isFinite(amount)){
  const currencyLines=lines.filter(x=>/QAR|QR|EUR|USD|AED|SAR|GBP|€|\$|£/.test(x));
  for(const line of currencyLines.slice().reverse()){amount=extractAmountFromLine(line);if(Number.isFinite(amount))break}
 }
 const date=parseReceiptDate(text),merchant=merchantFromLines(lines),currency=detectCurrency(text),category=classifyReceipt(text);
 const confidence=(Number.isFinite(amount)?0.5:0)+(date?0.25:0)+(merchant?0.25:0);
 const warnings=[];
 if(!merchant)warnings.push("No se ha identificado el comercio con suficiente confianza.");
 if(!date)warnings.push("No se ha identificado la fecha; revísala manualmente.");
 if(!Number.isFinite(amount))warnings.push("No se ha identificado el total; introdúcelo manualmente.");
 return {merchant,date,amount:Number.isFinite(amount)?Number(amount.toFixed(2)):null,currency,category,confidence,warnings};
}
function merchantTokens(value){
 return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .split(/[^a-z0-9]+/).filter(x=>x.length>2&&!["store","market","branch","qatar","company","limited","llc"].includes(x));
}
export function findDuplicateExpense(candidate,expenses=[]){
 if(!candidate||!candidate.date||!Number.isFinite(Number(candidate.amount)))return null;
 const amount=Math.round(Number(candidate.amount)*100),tokens=merchantTokens(candidate.name||candidate.merchant);
 return expenses.find(item=>{
  if(item.date!==candidate.date||(item.currency||"QAR")!==(candidate.currency||"QAR")||Math.round(Number(item.amount)*100)!==amount)return false;
  const other=merchantTokens(item.name||item.merchant);if(!tokens.length||!other.length)return false;
  const overlap=tokens.filter(x=>other.includes(x)).length,ratio=overlap/Math.max(tokens.length,other.length);
  return ratio>=0.6||tokens.join(" ").includes(other.join(" "))||other.join(" ").includes(tokens.join(" "));
 })||null;
}
