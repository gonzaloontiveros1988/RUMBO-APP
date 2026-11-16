// RUMBO Health bridge · validates daily aggregates exported by an iOS Shortcut.
// Safari/PWA cannot read HealthKit directly; this import keeps the bridge explicit and user-controlled.
const validDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const d = new Date(String(value) + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
};
const metric = (value, max) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : null;
};
export function normalizeAppleHealthExport(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("El archivo debe contener un objeto JSON.");
  const rows = Array.isArray(payload.days) ? payload.days : Array.isArray(payload.records) ? payload.records : null;
  if (!rows || !rows.length) throw new Error("No se encontraron días en el archivo. Se espera una lista «days».");
  const byDate = new Map();
  for (const row of rows) {
    if (!row || !validDate(row.date)) continue;
    const steps = metric(row.steps, 150000);
    const sleepHours = metric(row.sleepHours, 24);
    const activeEnergyKcal = metric(row.activeEnergyKcal, 10000);
    const walkingRunningKm = metric(row.walkingRunningKm, 150);
    if ([steps, sleepHours, activeEnergyKcal, walkingRunningKm].every(value => value === null)) continue;
    byDate.set(row.date, {
      date: row.date,
      ...(steps === null ? {} : { steps }),
      ...(sleepHours === null ? {} : { sleepHours }),
      ...(activeEnergyKcal === null ? {} : { activeEnergyKcal }),
      ...(walkingRunningKm === null ? {} : { walkingRunningKm }),
      source: "apple-health-shortcuts",
      importedAt: new Date().toISOString()
    });
  }
  if (!byDate.size) throw new Error("No hay registros diarios válidos. Comprueba las fechas y los valores.");
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
