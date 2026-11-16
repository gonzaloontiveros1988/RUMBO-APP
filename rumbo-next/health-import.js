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

const parseAppleHealthDate = value => {
  const raw = String(value || "");
  const normalized = raw.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{4})$/, "$1T$2$3");
  const date = new Date(normalized);
  return Number.isFinite(date.getTime()) ? date : null;
};
const xmlAttributes = source => {
  const attrs = {};
  for (const match of String(source || "").matchAll(/([A-Za-z][\w:-]*)="([^"]*)"/g)) attrs[match[1]] = match[2];
  return attrs;
};
export function normalizeAppleHealthXml(xml) {
  const source = String(xml || "");
  if (!source.includes("<HealthData") || source.length > 100 * 1024 * 1024) throw new Error("No parece un export.xml válido de Apple Health o supera 100 MB.");
  const days = new Map();
  const getDay = date => {
    const key = String(date || "").slice(0, 10);
    if (!validDate(key)) return null;
    if (!days.has(key)) days.set(key, { date: key, steps: 0, activeEnergyKcal: 0, walkingRunningKm: 0, _sleep: [] });
    return days.get(key);
  };
  for (const match of source.matchAll(/<Record\b([^>]*)\/?\s*>/g)) {
    const attrs = xmlAttributes(match[1]);
    const type = attrs.type || "";
    const end = parseAppleHealthDate(attrs.endDate);
    if (!end) continue;
    const day = getDay(attrs.endDate);
    if (!day) continue;
    const value = Number(attrs.value);
    if (type === "HKQuantityTypeIdentifierStepCount" && Number.isFinite(value) && value >= 0) day.steps += value;
    else if (type === "HKQuantityTypeIdentifierActiveEnergyBurned" && Number.isFinite(value) && value >= 0) day.activeEnergyKcal += value;
    else if (type === "HKQuantityTypeIdentifierDistanceWalkingRunning" && Number.isFinite(value) && value >= 0) {
      const unit = String(attrs.unit || "").toLowerCase();
      day.walkingRunningKm += unit === "m" ? value / 1000 : unit === "mi" ? value * 1.609344 : value;
    } else if (type === "HKCategoryTypeIdentifierSleepAnalysis" && /Asleep/i.test(attrs.value || "")) {
      const start = parseAppleHealthDate(attrs.startDate);
      if (start && end > start) day._sleep.push([start.getTime(), end.getTime()]);
    }
  }
  const result = [];
  for (const day of days.values()) {
    const intervals = day._sleep.sort((a,b)=>a[0]-b[0]);
    let asleepMs = 0, start = null, end = null;
    for (const [a,b] of intervals) {
      if (start === null) { start = a; end = b; }
      else if (a <= end) end = Math.max(end, b);
      else { asleepMs += end - start; start = a; end = b; }
    }
    if (start !== null) asleepMs += end - start;
    const steps = metric(day.steps, 150000);
    const energy = metric(day.activeEnergyKcal, 10000);
    const distance = metric(day.walkingRunningKm, 150);
    const sleepHours = metric(asleepMs / 3600000, 24);
    if ([steps, energy, distance, sleepHours].every(value => value === null || value === 0)) continue;
    result.push({
      date: day.date,
      ...(steps === null ? {} : { steps: Math.round(steps) }),
      ...(energy === null ? {} : { activeEnergyKcal: energy }),
      ...(distance === null ? {} : { walkingRunningKm: distance }),
      ...(sleepHours === null || sleepHours === 0 ? {} : { sleepHours }),
      source: "apple-health-export",
      importedAt: new Date().toISOString()
    });
  }
  if (!result.length) throw new Error("No se encontraron muestras compatibles de pasos, sueño, energía activa o distancia.");
  return result.sort((a,b)=>a.date.localeCompare(b.date));
}
