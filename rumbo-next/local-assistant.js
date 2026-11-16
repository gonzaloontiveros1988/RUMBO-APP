// RUMBO Local Assistant · deterministic analysis over the user's own saved data.
// No API key, external inference service, or data transfer is required.
const fmtDate = value => {
  if (!value) return "fecha no indicada";
  const d = new Date(String(value) + "T12:00:00");
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("es-ES") : String(value);
};
const amount = value => Number(value || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 });
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const list = (rows, render, empty) => rows.length ? rows.map(render).join("\n") : empty;
export function answerLocally(question, state = {}, now = new Date()) {
  const q = norm(question);
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const next = (state.duties || []).filter(x => x.date >= today).sort((a,b) => a.date.localeCompare(b.date));
  const monthDuties = (state.duties || []).filter(x => String(x.date || "").startsWith(month));
  const monthFlights = monthDuties.filter(x => /flight|flt/i.test(String(x.kind || x.code || "")));
  const log = state.logbook || [];
  const loggedHours = log.reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const recentWorkouts = (state.workouts || []).slice().sort((a,b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0,5);
  const health = (state.healthDaily || []).slice().sort((a,b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0,7);
  const sleep = (state.sleepLogs || []).slice().sort((a,b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0,7);
  const meals = (state.mealPlan || []).filter(x => x.date >= today).sort((a,b) => a.date.localeCompare(b.date)).slice(0,8);
  const expenses = (state.expenses || []).filter(x => String(x.date || "").startsWith(month));
  const finance = new Map();
  for (const item of expenses) {
    const currency = item.currency || "QAR";
    finance.set(currency, (finance.get(currency) || 0) + Number(item.amount || 0));
  }
  if (/roster|duty|servicio|vuelo|horas de vuelo|dias libres|standby/.test(q)) {
    return "ROSTER · " + month + "\n" +
      "Registros este mes: " + monthDuties.length + ". Servicios clasificados como vuelo: " + monthFlights.length + ".\n" +
      "Próximos servicios:\n" + list(next.slice(0,10), x => "• " + fmtDate(x.date) + " · " + (x.code || x.kind || "Servicio") + (x.route ? " · " + x.route : "") + (x.time ? " · " + x.time : ""), "No hay servicios futuros guardados.") +
      "\n\nEstos datos proceden del roster importado; no son una predicción de cambios ni de asignaciones.";
  }
  if (/logbook|bitacora|sectores|block|horas totales|experiencia/.test(q)) {
    return "AVIATION & LOGBOOK\nSectores guardados: " + log.length + ". Horas sumadas desde los sectores guardados: " + amount(loggedHours) + ".\n" +
      list(log.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,8), x => "• " + fmtDate(x.date) + " · " + (x.from || "—") + " → " + (x.to || "—") + " · " + amount(x.hours) + " h", "Todavía no hay sectores en el logbook.") +
      "\nLas horas previas no fechadas se mantienen separadas y no se mezclan con esta suma.";
  }
  if (/fitness|entren|ejercicio|fuerza|musculo|recuperacion|recovery|sueno|dormir|pasos|fatiga/.test(q)) {
    const h = health[0];
    const s = sleep[0];
    return "FITNESS & LIFESTYLE\nEntrenamientos registrados: " + (state.workouts || []).length + ".\n" +
      list(recentWorkouts, x => "• " + fmtDate(x.date) + " · " + (x.type || "Entrenamiento") + " · " + Number(x.minutes || 0) + " min", "No hay entrenamientos guardados todavía.") +
      "\nÚltimo dato Apple Health importado: " + (h ? fmtDate(h.date) + (h.steps != null ? " · " + amount(h.steps) + " pasos" : "") + (h.sleepHours != null ? " · " + h.sleepHours + " h sueño" : "") : "ninguno") +
      "\nÚltimo registro manual de sueño: " + (s ? fmtDate(s.date) + " · " + s.hours + " h" : "ninguno") +
      "\nLa recomendación de intensidad debe tener en cuenta cómo te encuentras; estos registros no son una evaluación médica.";
  }
  if (/nutrition|nutricion|receta|comida|menu|dieta|compra|despensa|ingrediente/.test(q)) {
    return "NUTRITION\nRecetas en biblioteca: " + ((state.customRecipes || []).length) + " propias + catálogo base. Menús futuros guardados: " + meals.length + ". Elementos pendientes de compra: " + (state.shopping || []).filter(x => !x.done).length + ".\n" +
      list(meals, x => "• " + fmtDate(x.date) + " · " + (x.slot || "Comida") + " · " + (x.meal || x.name || "Plato guardado"), "No hay comidas futuras en el menú.") +
      "\nPara ampliar el recetario, utiliza el buscador de catálogo o la búsqueda web gratuita de Nutrition.";
  }
  if (/finanza|gasto|presupuesto|deuda|ingreso|dinero|currency|qar|eur/.test(q)) {
    return "HOME & FINANCE · " + month + "\nGastos registrados este mes por moneda:\n" +
      list([...finance.entries()], ([currency,total]) => "• " + currency + " " + amount(total), "No hay gastos registrados este mes.") +
      "\nPresupuestos guardados: " + Object.entries(state.budgets || {}).map(([c,v]) => c + " " + amount(v)).join(" · ") +
      "\nDeudas registradas: " + (state.debts || []).length + ". Ingresos guardados: " + (state.incomes || []).length + ".\nLas monedas se mantienen separadas; no se calcula un total convertido sin un tipo de cambio explícito.";
  }
  if (/crew|bid|preferencia|destino|layover|qatar airways/.test(q)) {
    const profile = state.crewBiddingProfile || {};
    const bids = (state.crewBids || []).filter(x => x.month === month);
    return "CREW BIDDING · " + month + "\nBids guardados este mes: " + bids.length + ".\nDestinos principales: " + (profile.primaryDestinations || []).join(", ") + ".\nAlternativas: " + (profile.secondaryDestinations || []).join(", ") + ".\n" +
      list(bids, x => "• " + x.destination + " · " + x.layoverHours + " h layover · " + x.blockHours + " h block · " + (x.outcome || "pending"), "No hay bids guardados para este mes.") +
      "\nEl ajuste de preferencias no representa una probabilidad de adjudicación.";
  }
  if (/familia|colegio|ninos|eventos|calendario/.test(q)) {
    const events = (state.events || []).filter(x => x.date >= today).sort((a,b) => a.date.localeCompare(b.date));
    return "FAMILY WEEK\nPróximos eventos guardados:\n" + list(events.slice(0,12), x => "• " + fmtDate(x.date) + " · " + x.title, "No hay eventos futuros guardados.");
  }
  return "ASISTENTE LOCAL DE RUMBO\nPuedo analizar los datos que ya están guardados en tus módulos, sin enviar información fuera de tu dispositivo y sin coste de API.\n\nPrueba a preguntar por tu roster y días libres, horas de logbook, entrenamientos y recuperación, recetas y menú, gastos por moneda, Crew Bidding o calendario familiar.\n\nEsta versión utiliza análisis local basado en reglas; no es un modelo generativo y no inventa datos que no estén registrados.";
}
