const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};
const buckets = new Map<string, number[]>();
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
function limited(ip: string) {
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter(t => now - t < 60_000);
  if (recent.length >= 10) return true;
  recent.push(now);
  buckets.set(ip, recent);
  return false;
}
function cleanSteps(raw: string) {
  return String(raw || "").replace(/\r/g, "").split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(x => x.length > 12).slice(0, 18);
}

const SOCIAL_HOSTS = new Set(["instagram.com","www.instagram.com","m.instagram.com","tiktok.com","www.tiktok.com","vm.tiktok.com","youtube.com","www.youtube.com","m.youtube.com","youtu.be"]);
function meta(html: string, key: string) {
  const patterns = [
    new RegExp('<meta[^>]+(?:property|name)="' + key + '"[^>]+content="([^"]*)"[^>]*>', "i"),
    new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="' + key + '"[^>]*>', "i")
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match) return decodeHtml(match[1]); }
  return "";
}
function decodeHtml(value: string) {
  return value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&nbsp;/g," ").trim();
}
function findRecipeJson(html: string) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const data = JSON.parse(block[1].replace(/<!--|-->/g,""));
      const nodes: any[] = [];
      const walk = (v: any) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") { const type = v["@type"]; if ((Array.isArray(type) ? type : [type]).some((t: any) => String(t).toLowerCase() === "recipe")) nodes.push(v); Object.values(v).forEach(walk); } };
      walk(data);
      const r = nodes[0]; if (!r) continue;
      const ingredients = Array.isArray(r.recipeIngredient) ? r.recipeIngredient.slice(0,24) : [];
      const instructions: string[] = [];
      const readSteps = (v: any) => { if (Array.isArray(v)) v.forEach(readSteps); else if (typeof v === "string") instructions.push(v); else if (v && typeof v === "object") { if (v.text) instructions.push(String(v.text)); else if (v.name) instructions.push(String(v.name)); else if (v.itemListElement) readSteps(v.itemListElement); } };
      readSteps(r.recipeInstructions);
      const img = Array.isArray(r.image) ? (typeof r.image[0] === "string" ? r.image[0] : r.image[0]?.url) : (typeof r.image === "string" ? r.image : r.image?.url);
      if (r.name && ingredients.length >= 2 && instructions.length >= 2) return {name:String(r.name),ingredients,instructions,image:img||"",servings:String(r.recipeYield||"4")};
    } catch {}
  }
  return null;
}
async function importSocialUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Pega un enlace completo de Instagram, TikTok o YouTube."); }
  if (url.protocol !== "https:" || !SOCIAL_HOSTS.has(url.hostname.toLowerCase())) throw new Error("Solo se admiten enlaces HTTPS de Instagram, TikTok o YouTube.");
  let response: Response | null = null, current = url;
  for (let hop=0; hop<4; hop++) {
    response = await fetch(current.href, {headers:{Accept:"text/html,application/xhtml+xml", "User-Agent":"Mozilla/5.0 (compatible; RUMBOKitchen/1.0)"}, signal:AbortSignal.timeout(9000), redirect:"manual"});
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location"); if (!location) break;
      const next = new URL(location,current);
      if (next.protocol !== "https:" || !SOCIAL_HOSTS.has(next.hostname.toLowerCase())) throw new Error("La plataforma redirigió a un dominio no admitido.");
      current = next; continue;
    }
    break;
  }
  if (!response || !response.ok) throw new Error("La red social no permite leer esta publicación ahora. La privacidad o el inicio de sesión pueden bloquearla.");
  const html = (await response.text()).slice(0,1200000);
  const title = meta(html,"og:title") || meta(html,"twitter:title") || meta(html,"title");
  const description = meta(html,"og:description") || meta(html,"description") || meta(html,"twitter:description");
  const image = meta(html,"og:image") || meta(html,"twitter:image");
  const recipe = findRecipeJson(html);
  const platform = /instagram/i.test(current.hostname)?"Instagram":/tiktok/i.test(current.hostname)?"TikTok":"YouTube";
  return {platform,sourceUrl:url.href,title,description,image,recipe};
}

const aliases: [RegExp, string][] = [
  [/paella|marisco|seafood|gamba|langostino|camar[oó]n|shrimp|prawn/i, "shrimp"],
  [/mejill[oó]n|almeja|calamar|pulpo|mussel|squid|octopus/i, "squid"],
  [/pollo|pechuga|chicken/i, "chicken"], [/arroz|rice/i, "rice"],
  [/pasta|espagueti|macarr[oó]n|spaghetti|carbonara/i, "pasta"],
  [/salm[oó]n|salmon/i, "salmon"], [/at[uú]n|tuna/i, "tuna"],
  [/ternera|carne|beef/i, "beef"], [/garbanzo|chickpea/i, "chickpeas"],
  [/lenteja|lentil/i, "lentils"], [/huevo|egg/i, "egg"],
  [/patata|papa|potato/i, "potato"], [/verdura|vegetal|vegetable/i, "vegetable"]
];
const areaMap: Record<string, string[]> = {
  Mediterranean: ["Spanish", "Italian", "Greek", "Turkish", "Moroccan"],
  Asian: ["Chinese", "Japanese", "Thai", "Vietnamese", "Indian", "Malaysian"],
  Japanese: ["Japanese"], Indian: ["Indian"], Thai: ["Thai"], Greek: ["Greek"],
  Spanish: ["Spanish"], Italian: ["Italian"], German: ["German"], American: ["American"]
};
async function getJson(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "RUMBO/4.0 recipe search" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Recipe catalogue unavailable (" + response.status + ")");
  return await response.json();
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return json(429, { error: "Has alcanzado el límite temporal de búsquedas. Espera un minuto." });
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 6000) return json(413, { error: "Request too large" });
    body = JSON.parse(raw);
  } catch { return json(400, { error: "JSON inválido." }); }
  const action = String(body.action || "search");
  if (action === "import-url") {
    try { const url = String(body.url || "").trim(); if (!url || url.length > 1500) return json(400,{error:"Enlace vacío o demasiado largo."}); const imported = await importSocialUrl(url); return json(200,{...imported,notice:imported.recipe?"Receta estructurada detectada. Revisa cantidades y macros.":"Enlace reconocido. La plataforma solo ha expuesto metadatos públicos; revisa la descripción antes de calcular macros."}); }
    catch(error) { return json(422,{error:String((error as Error)?.message||error).slice(0,300)}); }
  }
  const query = String(body.query || "").trim().slice(0, 180);
  const servings = Number(body.servings || 4);
  const category = String(body.category || "Lunch").slice(0, 24);
  const cuisine = String(body.cuisine || "").slice(0, 32);
  if (query.length < 2) return json(400, { error: "Escribe un plato o ingrediente (mínimo 2 caracteres)." });
  if (!Number.isInteger(servings) || servings < 1 || servings > 12) return json(400, { error: "Las raciones deben estar entre 1 y 12." });
  const base = "https://www.themealdb.com/api/json/v1/1/";
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = new Set<string>([query]);
  if (/carbonara/.test(normalized)) { terms.add("spaghetti"); terms.add("carbonara"); }
  if (/bolognesa|bolognese/.test(normalized)) terms.add("bolognese");
  if (/paella/.test(normalized)) terms.add("paella");
  const ingredients = [...new Set(aliases.filter(([re]) => re.test(query)).map(([, term]) => term))].slice(0, 4);
  const areas = areaMap[cuisine] || [];
  const requests: Promise<any>[] = [
    ...[...terms].map(term => getJson(base + "search.php?s=" + encodeURIComponent(term))),
    ...ingredients.map(term => getJson(base + "filter.php?i=" + encodeURIComponent(term))),
    ...areas.map(area => getJson(base + "filter.php?a=" + encodeURIComponent(area)))
  ];
  const responses = await Promise.allSettled(requests);
  const found = new Map<string, any>();
  for (const result of responses) if (result.status === "fulfilled") {
    for (const meal of result.value?.meals || []) if (meal?.idMeal && !found.has(meal.idMeal)) found.set(meal.idMeal, meal);
  }
  const candidates = [...found.values()].slice(0, 14);
  const details = await Promise.allSettled(candidates.map(meal => getJson(base + "lookup.php?i=" + encodeURIComponent(meal.idMeal))));
  const recipes: any[] = [];
  for (const result of details) {
    if (result.status !== "fulfilled") continue;
    const meal = result.value?.meals?.[0];
    if (!meal) continue;
    const ingredientsList: any[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = String(meal["strIngredient" + i] || "").trim();
      const measure = String(meal["strMeasure" + i] || "").trim();
      if (name) ingredientsList.push([name, measure || "Al gusto", 0, 0, 0, 0]);
    }
    const steps = cleanSteps(meal.strInstructions || "");
    if (ingredientsList.length < 2 || !steps.length) continue;
    recipes.push({
      id: "themealdb-" + meal.idMeal, name: String(meal.strMeal || "Recipe"), category,
      minutes: null, servings, image: meal.strMealThumb || "", imageVerified: !!meal.strMealThumb,
      ingredients: ingredientsList, steps, origin: "web",
      sourceUrl: meal.strSource || ("https://www.themealdb.com/meal/" + meal.idMeal),
      sourceTitle: "TheMealDB · " + String(meal.strMeal || "Recipe"),
      sourceSnippet: "Receta del catálogo público. Los valores nutricionales no están verificados y no se inventan."
    });
    if (recipes.length >= 8) break;
  }
  return json(200, {
    recipes, model: "TheMealDB",
    notice: recipes.length
      ? recipes.length + " recetas recuperadas del catálogo público. Revisa ingredientes y preparación; los macros no disponibles se muestran como no verificados."
      : "No hay coincidencias en el catálogo público. Prueba con un nombre más corto, un ingrediente principal o cambia la cocina."
  });
});
