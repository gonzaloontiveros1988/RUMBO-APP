const {getGatewayToken}=require("./gateway-auth");
const MODEL = "alibaba/qwen3.5-flash";
const MAX_QUERY = 180;
const ALLOWED_ORIGINS=new Set(["https://gonzaloontiveros1988.github.io","https://rumbo-app-sandy.vercel.app","https://rumbo-app-gonzaloor1988-8991.vercel.app","https://rumbo-app-git-redesign-rumbo-os-v4-gonzaloor1988-8991.vercel.app","https://rumbo-app-git-redesign-rumbo-premium-2026-gonzaloor1988-8991.vercel.app"]);

const buckets = new Map();
function limited(ip){const now=Date.now(),items=(buckets.get(ip)||[]).filter(t=>now-t<60000);if(items.length>=5)return true;items.push(now);buckets.set(ip,items);return false;}
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
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; RUMBORecipeAssistant/1.0)"},signal:AbortSignal.timeout(6500)});
  if(!r.ok)return null;const html=(await r.text()).slice(0,900000),scripts=[...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for(const match of scripts){try{const data=JSON.parse(match[1].replace(/<!--|-->/g,""));const nodes=[];const walk=x=>{if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==="object"){if(String(x["@type"]||"").toLowerCase().includes("recipe"))nodes.push(x);Object.values(x).forEach(walk)}};walk(data);if(nodes.length){const x=nodes[0],instructions=(x.recipeInstructions||[]).map(v=>typeof v==="string"?v:(v.text||v.name||"")).filter(Boolean);return {name:x.name||"",ingredients:x.recipeIngredient||[],instructions,image:Array.isArray(x.image)?(x.image[0]?.url||x.image[0]||""):(typeof x.image==="object"?(x.image.url||x.image["@id"]||""):x.image||""),prepTime:x.prepTime||"",cookTime:x.cookTime||"",yield:x.recipeYield||""}}}catch{}}
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

const MEALDB_ES_ALIASES={
 "paella de marisco":["seafood paella","paella","seafood"],
 "paella marinera":["seafood paella","paella","seafood"],
 "paella valenciana":["paella","spanish rice"],
 "tortilla espanola":["spanish omelette","tortilla"],
 "tortilla de patatas":["spanish omelette","tortilla"],
 "gazpacho":["gazpacho","spanish cold tomato soup"],
 "salmorejo":["salmorejo","spanish tomato soup"],
 "pollo al ajillo":["garlic chicken","chicken garlic"],
 "pollo asado":["roast chicken","roasted chicken"],
 "albondigas":["meatballs","spanish meatballs"],
 "croquetas":["croquettes","spanish croquettes"],
 "ensaladilla rusa":["russian salad","potato salad"],
 "gambas al ajillo":["garlic shrimp","garlic prawns"],
 "pisto":["ratatouille","spanish vegetable stew"],
 "lentejas":["lentil stew","lentils"],
 "arroz con pollo":["chicken rice","chicken and rice"]
};
function recipeSearchTerms(query){
 const normalized=clean(query).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const aliases=MEALDB_ES_ALIASES[normalized]||[];
 const translated=normalized.split(/\s+/).map(w=>({
  marisco:"seafood",gamba:"shrimp",gambas:"shrimp",langostino:"prawn",langostinos:"prawns",
  pollo:"chicken",ternera:"beef",cerdo:"pork",pavo:"turkey",atun:"tuna",salmon:"salmon",
  arroz:"rice",patata:"potato",patatas:"potatoes",tomate:"tomato",tomates:"tomatoes",
  huevo:"egg",huevos:"eggs",queso:"cheese",garbanzos:"chickpeas",lentejas:"lentils",
  verduras:"vegetables",verdura:"vegetables",calabacin:"zucchini",berenjena:"eggplant",
  espinacas:"spinach",setas:"mushrooms",champinones:"mushrooms",pasta:"pasta"
 }[w]||w)).filter(w=>w.length>2&&!["de","del","con","la","el","los","las","una","un"].includes(w));
 return [...new Set([query,...aliases,translated.join(" "),...translated].map(x=>clean(x)).filter(x=>x.length>2))].slice(0,5);
}
function scoreMealDbResult(meal,query,terms){
 const text=clean([meal.strMeal,...Array.from({length:20},(_,i)=>meal["strIngredient"+(i+1)]||"")].join(" ")).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const tokens=[...new Set(terms.flatMap(t=>t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().split(/\s+/)).filter(w=>w.length>3&&!["with","from","the","spanish"].includes(w)))];
 const name=clean(meal.strMeal||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const hits=tokens.filter(w=>text.includes(w)).length;
 const nameHits=tokens.filter(w=>name.includes(w)).length;
 return {hits,nameHits,score:hits+nameHits*2};
}
async function searchMealDbFallback(query,servings,category){
 const terms=recipeSearchTerms(query),found=new Map();
 for(const term of terms){
  try{
   const url="https://www.themealdb.com/api/json/v1/1/search.php?s="+encodeURIComponent(term);
   const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"RUMBO/4.2 recipe lookup"},signal:AbortSignal.timeout(6500)});
   if(!response.ok)continue;
   const data=await response.json();
   for(const meal of data.meals||[])if(meal?.idMeal)found.set(String(meal.idMeal),meal);
   if(found.size>=12)break;
  }catch{}
 }
 const ranked=[...found.values()].map(meal=>({meal,...scoreMealDbResult(meal,query,terms)}))
  .filter(x=>x.hits>0).sort((a,b)=>b.score-a.score||a.meal.strMeal.localeCompare(b.meal.strMeal));
 return ranked.slice(0,2).map(({meal},index)=>{
  const ingredients=[];
  for(let i=1;i<=20;i++){const name=String(meal["strIngredient"+i]||"").trim(),measure=String(meal["strMeasure"+i]||"").trim();if(name)ingredients.push([name.slice(0,90),measure.slice(0,70)||"To taste",0,0,0,0])}
  const steps=String(meal.strInstructions||"").replace(/\r/g,"").split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>12).slice(0,14);
  if(ingredients.length<2||steps.length<2)return null;
  const image=String(meal.strMealThumb||"");
  return {id:"themealdb-"+String(meal.idMeal||index),name:String(meal.strMeal||query).slice(0,100),category,minutes:30,servings,image,imageVerified:/^https:\/\//i.test(image),ingredients,steps,origin:"web",sourceUrl:String(meal.strSource||meal.strYoutube||"https://www.themealdb.com/"),sourceTitle:"TheMealDB · "+String(meal.strMeal||query),sourceSnippet:"Receta recuperada de TheMealDB. La fuente no proporciona macros verificados; no se han inventado calorías ni nutrientes."};
 }).filter(Boolean);
}

function normalizeStructuredPage(page,index,requestedServings,requestedCategory){
 const name=String(page?.name||"").trim().slice(0,100),ingredients=Array.isArray(page?.ingredients)?page.ingredients.filter(Boolean).slice(0,24):[],steps=Array.isArray(page?.instructions)?page.instructions.filter(Boolean).slice(0,12):[];
 if(!name||ingredients.length<2||steps.length<2)return null;
 return {id:"web-fallback-"+Date.now()+"-"+index,name,category:requestedCategory,minutes:30,servings:requestedServings,image:typeof page.image==="string"?page.image:"",imageVerified:!!page.image,ingredients:ingredients.map(x=>[String(x).slice(0,100),"Cantidad según fuente",0,0,0,0]),steps:steps.map(x=>String(x).slice(0,400)),origin:"web",sourceUrl:page.url||"",sourceTitle:page.title||name,sourceSnippet:"Receta extraída de los datos estructurados publicados por la página. Información nutricional no disponible."};
}
function normalizeRecipe(r,index,source,requestedServings,requestedCategory){
 const name=String(r.name||"").trim().slice(0,100),ingredients=Array.isArray(r.ingredients)?r.ingredients.slice(0,24):[],steps=Array.isArray(r.steps)?r.steps.slice(0,12):[];
 if(!name||ingredients.length<2||steps.length<2)throw new Error("La receta recibida está incompleta.");
 return {id:"web-ai-"+Date.now()+"-"+index,name,category:requestedCategory,minutes:Math.max(5,Math.min(240,Number(r.minutes)||30)),servings:requestedServings,image:source.pageRecipe?.image||"",imageVerified:!!source.pageRecipe?.image,imageSearchTerm:String(r.imageSearchTerm||r.name||"").slice(0,120),ingredients:ingredients.map(x=>[String(x.name||"Ingrediente").slice(0,70),String(x.quantity||"al gusto").slice(0,70),Number(x.kcal)||0,Number(x.protein)||0,Number(x.carbs)||0,Number(x.fat)||0]),steps:steps.map(x=>String(x).slice(0,400)),origin:source.type,sourceUrl:source.url||"",sourceTitle:source.title||"",sourceSnippet:source.snippet||""};
}
module.exports = async function handler(req,res){
 const origin=String(req.headers.origin||"");
 if(req.method==="OPTIONS"){if(!ALLOWED_ORIGINS.has(origin))return send(res,403,{error:"Origen no autorizado."});res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");return res.status(204).end()}
 if(req.method!=="POST")return send(res,405,{error:"Método no permitido."});
 if(origin&&!ALLOWED_ORIGINS.has(origin))return send(res,403,{error:"Origen no autorizado."});
 if(origin){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin")}
 const ip=String(req.headers["x-forwarded-for"]||"unknown").split(",")[0].trim();if(limited(ip))return send(res,429,{error:"Has realizado varias búsquedas seguidas. Espera un minuto y vuelve a intentarlo."});
 const body=typeof req.body==="string"?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
 const query=String(body.query||"").trim().slice(0,MAX_QUERY),servings=Math.max(1,Math.min(12,Number(body.servings)||4)),category=["Breakfast","Lunch","Dinner"].includes(body.category)?body.category:"Lunch";
 if(query.length<3)return send(res,400,{error:"Escribe qué plato o ingrediente quieres buscar."});
 try{
  const webResults=await searchWeb(query).catch(()=>[]);
  const sourceContext=await Promise.all(webResults.slice(0,3).map(async(x,i)=>({id:i+1,...x,pageRecipe:await fetchRecipePage(x.url)})));
  const gatewayToken=getGatewayToken(req);
  if(!gatewayToken){
   const fallback=sourceContext.map((x,i)=>normalizeStructuredPage({...x.pageRecipe,url:x.url,title:x.title},i,servings,category)).filter(Boolean);
   const mealDb= fallback.length?[]:await searchMealDbFallback(query,servings,category);
   const recipes=fallback.length?fallback:mealDb;
   if(!recipes.length)return send(res,200,{recipes:[],webResults:sourceContext.map(x=>({title:x.title,url:x.url,snippet:x.snippet})),model:"public-recipe-search",notice:"No se ha encontrado una receta fiable para esa búsqueda. Prueba con el nombre del plato en inglés o con un ingrediente principal. La creación original con IA necesita configurar AI_GATEWAY_API_KEY."});
   return send(res,200,{recipes:recipes.slice(0,2),webResults:sourceContext.map(x=>({title:x.title,url:x.url,snippet:x.snippet})),model:fallback.length?"structured-recipe-fallback":"themealdb-fallback",notice:"Modo de compatibilidad: recetas publicadas recuperadas sin autenticación de IA. Las calorías y macros no están disponibles en la fuente y no se han inventado. La creación de recetas originales con IA se activará al configurar AI_GATEWAY_API_KEY."});
  }
  const system="Eres el asistente culinario de RUMBO. Devuelve exclusivamente JSON válido, sin Markdown. No inventes fuentes, enlaces ni datos de páginas. Usa el contexto web solo para la receta de origen web; crea además una receta original independiente. Devuelve imageSearchTerm en inglés con el nombre concreto del plato para localizar una fotografía. Ingredientes en cantidades para las raciones solicitadas, kcal/protein/carbs/fat aproximados por ingrediente. Recuerda que nutrición es estimada. Incluye pasos claros y seguros, temperaturas internas solo si son fiables. Categorías Breakfast, Lunch o Dinner.";
  const prompt={query,requestedServings:servings,preferredCategory:category,webResults:sourceContext,requiredOutput:{recipes:[{name:"",imageSearchTerm:"English dish name",category:"Breakfast|Lunch|Dinner",minutes:30,servings,ingredients:[{name:"",quantity:"",kcal:0,protein:0,carbs:0,fat:0}],steps:[""]}],webRecipeIndex:0,aiRecipeIndex:1}};
  const response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+gatewayToken,"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(prompt)}],temperature:.25,max_tokens:3200})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||"RUMBO AI no pudo preparar las recetas.");
  const parsed=parseJson(data?.choices?.[0]?.message?.content),raw=Array.isArray(parsed.recipes)?parsed.recipes:[];
  const candidates=[];
  if(raw[0]&&webResults[Number(parsed.webRecipeIndex)||0])candidates.push(normalizeRecipe(raw[0],0,{type:"web",...sourceContext[Number(parsed.webRecipeIndex)||0]},servings,category));
  if(raw[1])candidates.push(normalizeRecipe(raw[1],1,{type:"ai"},servings,category));
  if(!candidates.length)throw new Error("No se encontraron recetas completas para revisar.");
  await Promise.all(candidates.map(async r=>{if(r.imageVerified)return;const img=await commonsImage(r.imageSearchTerm||r.name);if(img){r.image=img.url;r.imageVerified=true;r.imageAttribution=img.description}}));
  return send(res,200,{recipes:candidates,webResults:sourceContext.map(x=>({title:x.title,url:x.url,snippet:x.snippet})),model:data.model||MODEL,notice:"Las cantidades y la información nutricional son estimaciones. Revisa siempre la receta y los ingredientes antes de confirmar."+(webResults.length?"":" No se encontró una fuente web utilizable; se ofrece la receta original de RUMBO AI.")});
 }catch(error){return send(res,502,{error:String(error?.message||error).slice(0,240),stage:"recipe-assistant"})}
};
