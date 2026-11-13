const MODEL = "alibaba/qwen3.5-flash";
const MAX_QUERY = 180;
function send(res,status,body){res.setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.status(status).json(body)}
function clean(s=""){return String(s).replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim()}
function decodeRedirect(href){try{const u=new URL(href,"https://duckduckgo.com");return u.searchParams.get("uddg")||u.href}catch{return href}}
async function searchWeb(query){
 const url="https://html.duckduckgo.com/html/?q="+encodeURIComponent(query+" receta ingredientes preparación");
 const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; RUMBORecipeAssistant/1.0)"}});
 if(!r.ok)throw new Error("No se pudo consultar el buscador web.");
 const html=await r.text(),items=[],re=/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
 let m;while((m=re.exec(html))&&items.length<6){const href=decodeRedirect(m[1]);if(!/^https?:/.test(href)||/duckduckgo\.com/.test(href))continue;items.push({title:clean(m[2]),url:href,snippet:clean(m[3])})}
 return items;
}
async function fetchRecipePage(url){
 try{
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; RUMBORecipeAssistant/1.0)"}},signal:AbortSignal.timeout(6500));
  if(!r.ok)return null;const html=(await r.text()).slice(0,900000),scripts=[...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for(const match of scripts){try{const data=JSON.parse(match[1].replace(/<!--|-->/g,""));const nodes=[];const walk=x=>{if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==="object"){if(String(x["@type"]||"").toLowerCase().includes("recipe"))nodes.push(x);Object.values(x).forEach(walk)}};walk(data);if(nodes.length){const x=nodes[0],instructions=(x.recipeInstructions||[]).map(v=>typeof v==="string"?v:(v.text||v.name||"")).filter(Boolean);return {name:x.name||"",ingredients:x.recipeIngredient||[],instructions,prepTime:x.prepTime||"",cookTime:x.cookTime||"",yield:x.recipeYield||""}}}catch{}}
  return null;
 }catch{return null}
}
async function commonsImage(query){
 try{
  const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+encodeURIComponent("filetype:bitmap "+query+" food")+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json";
  const r=await fetch(url,{headers:{"User-Agent":"RUMBORecipeAssistant/1.0 (recipe image matching)"}});
  if(!r.ok)return null;const data=await r.json(),pages=Object.values(data?.query?.pages||{});
  const words=query.toLowerCase().split(/\W+/).filter(x=>x.length>3);
  const ranked=pages.map(p=>{const title=String(p.title||"").toLowerCase(),score=words.filter(w=>title.includes(w)).length;return {score,url:p.imageinfo?.[0]?.thumburl||p.imageinfo?.[0]?.url,description:p.title}}).filter(x=>x.url&&x.score>=Math.min(2,words.length)).sort((a,b)=>b.score-a.score);
  return ranked[0]||null;
 }catch{return null}
}
function parseJson(text){
 const raw=String(text||"").replace(/^\s*```(?:json)?/i,"").replace(/```\s*$/,"").trim();
 const start=raw.indexOf("{"),end=raw.lastIndexOf("}");
 if(start<0||end<start)throw new Error("La IA no devolvió una receta estructurada.");
 return JSON.parse(raw.slice(start,end+1));
}
function normalizeRecipe(r,index,source,requestedServings,requestedCategory){
 const name=String(r.name||"").trim().slice(0,100),ingredients=Array.isArray(r.ingredients)?r.ingredients.slice(0,24):[],steps=Array.isArray(r.steps)?r.steps.slice(0,12):[];
 if(!name||ingredients.length<2||steps.length<2)throw new Error("La receta recibida está incompleta.");
 return {id:"web-ai-"+Date.now()+"-"+index,name,category:requestedCategory,minutes:Math.max(5,Math.min(240,Number(r.minutes)||30)),servings:requestedServings,image:"",imageVerified:false,ingredients:ingredients.map(x=>[String(x.name||"Ingrediente").slice(0,70),String(x.quantity||"al gusto").slice(0,70),Number(x.kcal)||0,Number(x.protein)||0,Number(x.carbs)||0,Number(x.fat)||0]),steps:steps.map(x=>String(x).slice(0,400)),origin:source.type,sourceUrl:source.url||"",sourceTitle:source.title||"",sourceSnippet:source.snippet||""};
}
module.exports = async function handler(req,res){
 if(req.method!=="POST")return send(res,405,{error:"Método no permitido."});
 const host=String(req.headers.host||"");
 if(!host.endsWith(".vercel.app")&&!host.endsWith(".github.io"))return send(res,403,{error:"Origen no autorizado."});
 const body=typeof req.body==="string"?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
 const query=String(body.query||"").trim().slice(0,MAX_QUERY),servings=Math.max(1,Math.min(12,Number(body.servings)||4)),category=["Breakfast","Lunch","Dinner"].includes(body.category)?body.category:"Lunch";
 if(query.length<3)return send(res,400,{error:"Escribe qué plato o ingrediente quieres buscar."});
 if(!process.env.VERCEL_OIDC_TOKEN)return send(res,503,{error:"La autenticación de RUMBO AI no está disponible en este despliegue."});
 try{
  const webResults=await searchWeb(query).catch(()=>[]);
  const sourceContext=await Promise.all(webResults.map(async(x,i)=>({id:i+1,...x,pageRecipe:await fetchRecipePage(x.url)})));
  const system="Eres el asistente culinario de RUMBO. Devuelve exclusivamente JSON válido, sin Markdown. No inventes fuentes, enlaces ni datos de páginas. Usa el contexto web solo para la receta de origen web; crea además una receta original independiente. Ingredientes en cantidades para las raciones solicitadas, kcal/protein/carbs/fat aproximados por ingrediente. Recuerda que nutrición es estimada. Incluye pasos claros y seguros, temperaturas internas solo si son fiables. Categorías Breakfast, Lunch o Dinner.";
  const prompt={query,requestedServings:servings,preferredCategory:category,webResults:sourceContext,requiredOutput:{recipes:[{name:"",category:"Breakfast|Lunch|Dinner",minutes:30,servings,ingredients:[{name:"",quantity:"",kcal:0,protein:0,carbs:0,fat:0}],steps:[""]}],webRecipeIndex:0,aiRecipeIndex:1}};
  const response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+process.env.VERCEL_OIDC_TOKEN,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(prompt)}],temperature:.25,max_tokens:2200})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||"RUMBO AI no pudo preparar las recetas.");
  const parsed=parseJson(data?.choices?.[0]?.message?.content),raw=Array.isArray(parsed.recipes)?parsed.recipes:[];
  const candidates=[];
  if(raw[0]&&webResults[Number(parsed.webRecipeIndex)||0])candidates.push(normalizeRecipe(raw[0],0,{type:"web",...sourceContext[Number(parsed.webRecipeIndex)||0]},servings,category));
  if(raw[1])candidates.push(normalizeRecipe(raw[1],1,{type:"ai"},servings,category));
  if(!candidates.length)throw new Error("No se encontraron recetas completas para revisar.");
  await Promise.all(candidates.map(async r=>{const img=await commonsImage(r.name);if(img){r.image=img.url;r.imageVerified=true;r.imageAttribution=img.description}}));
  return send(res,200,{recipes:candidates,webResults:sourceContext.map(x=>({title:x.title,url:x.url,snippet:x.snippet})),model:data.model||MODEL,notice:"Las cantidades y la información nutricional son estimaciones. Revisa siempre la receta y los ingredientes antes de confirmar."+(webResults.length?"":" No se encontró una fuente web utilizable; se ofrece la receta original de RUMBO AI.")});
 }catch(error){return send(res,502,{error:String(error?.message||error).slice(0,240)})}
};
