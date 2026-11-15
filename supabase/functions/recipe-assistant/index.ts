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
  return String(raw || "").replace(/\\r/g, "").split(/(?<=[.!?])\\s+|\\n+/).map(x => x.trim()).filter(x => x.length > 12).slice(0, 18);
}
const aliases: [RegExp, string][] = [
  [/paella|marisco|seafood|gamba|langostino|camar[oó]n|shrimp|prawn/i, "shrimp"],
  [/mejill[oó]n|almeja|calamar|pulpo|mussel|squid|octopus/i, "squid"],
  [/pollo|pechuga|chicken/i, "chicken"],
  [/arroz|rice/i, "rice"],
  [/pasta|espagueti|macarr[oó]n|spaghetti|carbonara/i, "pasta"],
  [/salm[oó]n|salmon/i, "salmon"],
  [/at[uú]n|tuna/i, "tuna"],
  [/ternera|carne|beef/i, "beef"],
  [/garbanzo|chickpea/i, "chickpeas"],
  [/lenteja|lentil/i, "lentils"],
  [/huevo|egg/i, "egg"],
  [/patata|papa|potato/i, "potato"],
  [/verdura|vegetal|vegetable/i, "vegetable"]
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
  const query = String(body.query || "").trim().slice(0, 180);
  const servings = Number(body.servings || 4);
  const category = String(body.category || "Lunch").slice(0, 24);
  const cuisine = String(body.cuisine || "").slice(0, 32);
  if (query.length < 2) return json(400, { error: "Escribe un plato o ingrediente (mínimo 2 caracteres)." });
  if (!Number.isInteger(servings) || servings < 1 || servings > 12) return json(400, { error: "Las raciones deben estar entre 1 y 12." });

  const base = "https://www.themealdb.com/api/json/v1/1/";
  const normalized = query.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
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
  for (const result of responses) {
    if (result.status !== "fulfilled") continue;
    for (const meal of result.value?.meals || []) if (meal?.idMeal && !found.has(meal.idMeal)) found.set(meal.idMeal, meal);
  }
  const candidates = [...found.values()].slice(0, 14);
  const details = await Promise.allSettled(candidates.map(meal => getJson(base + "lookup.php?i=" + encodeURIComponent(meal.idMeal))));
  const recipes: any[] = [];
  for (const result of details) {
    if (result.status !== "fulfilled") continue;
    const meal = result.value?.meals?.[0];
    if (!meal) continue;
    const list: any[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = String(meal["strIngredient" + i] || "").trim();
      const measure = String(meal["strMeasure" + i] || "").trim();
      if (name) list.push([name, measure || "Al gusto", 0, 0, 0, 0]);
    }
    const steps = cleanSteps(meal.strInstructions || "");
    if (list.length < 2 || !steps.length) continue;
    recipes.push({
      id: "themealdb-" + meal.idMeal,
      name: String(meal.strMeal || "Recipe"),
      category,
      minutes: 30,
      servings,
      image: meal.strMealThumb || "",
      imageVerified: !!meal.strMealThumb,
      ingredients: list,
      steps,
      origin: "web",
      sourceUrl: meal.strSource || ("https://www.themealdb.com/meal/" + meal.idMeal),
      sourceTitle: "TheMealDB · " + String(meal.strMeal || "Recipe"),
      sourceSnippet: "Receta del catálogo público. Los valores nutricionales no están verificados y no se inventan."
    });
    if (recipes.length >= 8) break;
  }
  return json(200, {
    recipes,
    model: "TheMealDB",
    notice: recipes.length
      ? recipes.length + " recetas recuperadas del catálogo público. Revisa ingredientes y preparación; los macros no disponibles se muestran como no verificados."
      : "No hay coincidencias en el catálogo público. Prueba con un nombre más corto, un ingrediente principal o cambia la cocina."
  });
});
