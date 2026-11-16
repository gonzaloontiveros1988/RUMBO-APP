// RUMBO personal Fitness journey. The exercise video catalogue is the verified free 25-clip set from Your Move.
export const FITNESS_JOURNEY_DEFAULTS = Object.freeze({
  age: 38, sex: "male", heightCm: 170, startWeightKg: 114, targetWeightKg: 80,
  sessionsPerWeek: 4, strengthSessions: 2, cardioSessions: 2,
  phase: "fat-loss", setting: "hotel-or-gym", level: "beginner",
  kneeNote: "Chronic bilateral knee discomfort; avoid painful ranges and loaded squat/lunge patterns pending clinical assessment."
});
export const YMOVE_FREE_VIDEO_PAGE = "https://ymove.app/free-exercise-videos";
export const YMOVE_CREDIT_URL = "https://ymove.app/exercise-api";
export const YMOVE_FREE_VIDEOS = [
  {
    "id": "barbell-back-squat",
    "name": "Barbell Back Squat",
    "muscle": "Quadriceps",
    "equipment": "Barbell",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/fd0eaa34-d14b-4421-b41c-1669f93253b3?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "barbell-bench-press",
    "name": "Barbell Bench Press",
    "muscle": "Chest",
    "equipment": "Barbell + bench",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/dd7e706c-2086-4f4b-867f-d7fece2f720d?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "barbell-deadlift",
    "name": "Barbell Deadlift",
    "muscle": "Full body",
    "equipment": "Barbell",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/b59952ca-1551-4c07-835d-ab78bfe9953c?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "dumbbell-lateral-raise",
    "name": "Dumbbell Lateral Raise",
    "muscle": "Shoulders",
    "equipment": "Dumbbells",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/a16f0235-20eb-4306-b9cc-c01ae51b3b9b?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "hammer-curls",
    "name": "Hammer Curls",
    "muscle": "Biceps",
    "equipment": "Dumbbells",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/b11e6c6f-b2e8-44ca-95dc-adf0dcd34426?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "single-arm-dumbbell-row",
    "name": "Single Arm Dumbbell Row - Legs apart",
    "muscle": "Back",
    "equipment": "Dumbbell + bench",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/d3fece95-c7e2-4794-ba8f-65a5b3e30a28?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "dumbbell-goblet-squat",
    "name": "Dumbbell Goblet Squat",
    "muscle": "Quadriceps",
    "equipment": "Dumbbell",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/a2a797d0-f6f6-436e-8616-6c1d93e73d67?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "kettlebell-swing",
    "name": "Kettlebell swing",
    "muscle": "Full body",
    "equipment": "Kettlebell",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/13263f92-5fe2-4d92-bec0-808f8b315620?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "kettlebell-push-press",
    "name": "Kettlebell Push Press",
    "muscle": "Shoulders",
    "equipment": "Kettlebell",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/3880aaa4-e1c0-4153-95d0-da44ea01e099?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "kettlebell-romanian-deadlift",
    "name": "Kettlebell Romanian Deadlift",
    "muscle": "Hamstrings / glutes",
    "equipment": "Kettlebell",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/e7175536-9d7d-4f5d-8d49-26c3411eac80?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "goblet-squat-kettlebell",
    "name": "Goblet Squat with Kettlebell",
    "muscle": "Quadriceps",
    "equipment": "Kettlebell",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/198d4a7d-bc23-41f8-ad67-4fe9ab876b89?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-crossover-mid",
    "name": "Cable Crossover (Mid)",
    "muscle": "Chest",
    "equipment": "Cable machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/e2b1d801-055a-4dc5-ad6e-486e3dbfcfb7?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "lying-cable-leg-curl",
    "name": "Lying Cable Leg Curl",
    "muscle": "Hamstrings",
    "equipment": "Cable machine",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/856b4128-b57d-4b08-b0de-7f19b4553020?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-woodchop-high-low",
    "name": "Cable Woodchop (High to Low)",
    "muscle": "Core",
    "equipment": "Cable machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/02f17b45-d37d-4452-9082-4679e06f8c03?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "lat-pulldown",
    "name": "Lat Pulldown",
    "muscle": "Back",
    "equipment": "Cable machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/5971eaa2-5264-49cc-99c2-1310305c5342?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "seated-cable-row",
    "name": "Seated Cable Row close V bar",
    "muscle": "Back",
    "equipment": "Cable machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/77976f52-b13a-4fd0-addf-f4404e3a8e95?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "seated-machine-chest-press",
    "name": "Seated Machine Chest Press",
    "muscle": "Chest",
    "equipment": "Chest press machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/20cc4825-dd52-4887-99db-c492546741dc?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-lateral-raise",
    "name": "Cable Lateral Raise",
    "muscle": "Shoulders",
    "equipment": "Cable machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/710d4aa4-e4ea-4fad-8930-a7b9bf582cae?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-rope-face-pull",
    "name": "Cable Rope Face Pull",
    "muscle": "Rear delts / upper back",
    "equipment": "Cable rope",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/d9b9cf47-c5ff-4672-b8a8-2fe5f4845231?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-bicep-curl-rope",
    "name": "Cable Bicep Curl rope",
    "muscle": "Biceps",
    "equipment": "Cable rope",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/f32940f7-7da6-4741-a72f-13e52c56a79c?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "cable-tricep-pushdown",
    "name": "Cable Tricep Pushdown",
    "muscle": "Triceps",
    "equipment": "Cable rope",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/3875dae4-14a6-4533-84d3-ef9acbadbaea?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "overhead-cable-rope-extension",
    "name": "Overhead Cable Rope Extension",
    "muscle": "Triceps",
    "equipment": "Cable rope",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/a1c3384e-62db-4595-9b97-df2e7f131234?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "leg-extension",
    "name": "Leg Extension",
    "muscle": "Quadriceps",
    "equipment": "Leg extension machine",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/af0c3d19-5ee2-4a19-8688-f8504bb33e3c?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "muscle": "Quadriceps / glutes",
    "equipment": "Leg press machine",
    "kneeCaution": true,
    "thumbnailUrl": "https://ymove.app/api/free/d0bc669e-0d78-46f0-95f1-86503ab746e1?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  },
  {
    "id": "glute-kickback-machine",
    "name": "Glute Kickback Machine",
    "muscle": "Glutes",
    "equipment": "Glute machine",
    "kneeCaution": false,
    "thumbnailUrl": "https://ymove.app/api/free/5611abf4-57f7-4153-b29d-a17cd7e2907d?type=thumbnail",
    "sourceUrl": "https://ymove.app/free-exercise-videos"
  }
];
export const PERSONAL_FITNESS_SESSIONS = [
  {
    id: "strength-a", kind: "strength", title: "Fuerza A · Empuje y tirón", durationMinutes: 45,
    summary: "Sesión de cuerpo superior con máquinas/cables y cargas controladas.",
    sets: 2, reps: "10–12", rpe: 6, restSeconds: 90,
    exercises: [
      { exerciseId: "seated-machine-chest-press", name: "Seated Machine Chest Press", videoId: "seated-machine-chest-press" },
      { exerciseId: "lat-pulldown", name: "Lat Pulldown", videoId: "lat-pulldown" },
      { exerciseId: "row", name: "Seated Cable Row", videoId: "seated-cable-row" },
      { exerciseId: "lateral-raise", name: "Dumbbell Lateral Raise", videoId: "dumbbell-lateral-raise" },
      { exerciseId: "hammer-curl", name: "Hammer Curls", videoId: "hammer-curls" },
      { exerciseId: "triceps-pushdown", name: "Cable Tricep Pushdown", videoId: "cable-tricep-pushdown" }
    ]
  },
  {
    id: "cardio-a", kind: "cardio", title: "Cardio A · Aeróbico suave", durationMinutes: 25,
    summary: "Bicicleta reclinada/estática a baja resistencia o natación suave, solo si no provoca dolor.",
    intensity: "RPE 3–4/10", note: "Ritmo conversacional; distancia opcional si la máquina o el reloj la registra."
  },
  {
    id: "strength-b", kind: "strength", title: "Fuerza B · Cadena posterior y espalda", durationMinutes: 45,
    summary: "Bisagra de cadera y tren superior; evita flexión de rodilla dolorosa.",
    sets: 2, reps: "10–12", rpe: 6, restSeconds: 90,
    exercises: [
      { exerciseId: "rdl", name: "Kettlebell Romanian Deadlift", videoId: "kettlebell-romanian-deadlift" },
      { exerciseId: "one-arm-row", name: "Single Arm Dumbbell Row", videoId: "single-arm-dumbbell-row" },
      { exerciseId: "face-pull", name: "Cable Rope Face Pull", videoId: "cable-rope-face-pull" },
      { exerciseId: "chest-fly", name: "Cable Crossover (Mid)", videoId: "cable-crossover-mid" },
      { exerciseId: "overhead-cable-extension", name: "Overhead Cable Rope Extension", videoId: "overhead-cable-rope-extension" }
    ]
  },
  {
    id: "cardio-b", kind: "cardio", title: "Cardio B · Aeróbico progresivo", durationMinutes: 30,
    summary: "Bicicleta reclinada/estática a baja resistencia o natación suave, solo si no provoca dolor.",
    intensity: "RPE 3–4/10", note: "Aumenta primero unos minutos, no la intensidad; registra tiempo, distancia y esfuerzo."
  }
];
export function normalizeFitnessJourneyProfile(profile = {}) {
  const p = { ...FITNESS_JOURNEY_DEFAULTS, ...(profile && typeof profile === "object" ? profile : {}) };
  p.age = Math.max(18, Math.min(100, Number(p.age) || 38));
  p.heightCm = Math.max(100, Math.min(230, Number(p.heightCm) || 170));
  p.startWeightKg = Math.max(30, Math.min(350, Number(p.startWeightKg) || 114));
  p.targetWeightKg = Math.max(30, Math.min(250, Number(p.targetWeightKg) || 80));
  p.sessionsPerWeek = 4; p.strengthSessions = 2; p.cardioSessions = 2;
  return p;
}
export function validateFitnessWeightEntry(entry = {}) {
  const errors = [];
  const date = String(entry.date || "");
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T12:00:00Z") : null;
  if (!parsedDate || parsedDate.toISOString().slice(0, 10) !== date) errors.push("Introduce una fecha válida.");
  const weight = Number(entry.weightKg);
  if (!Number.isFinite(weight) || weight < 30 || weight > 350) errors.push("El peso debe estar entre 30 y 350 kg.");
  if (entry.waistCm !== "" && entry.waistCm != null) {
    const waist = Number(entry.waistCm);
    if (!Number.isFinite(waist) || waist < 40 || waist > 200) errors.push("El perímetro de cintura debe estar entre 40 y 200 cm.");
  }
  return errors;
}
export function fitnessJourneySummary(profile = FITNESS_JOURNEY_DEFAULTS, logs = []) {
  const p = normalizeFitnessJourneyProfile(profile);
  const valid = (logs || []).filter(x => { const date = String(x.date || ""); const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T12:00:00Z") : null; return !!parsed && parsed.toISOString().slice(0, 10) === date && Number.isFinite(Number(x.weightKg)) && Number(x.weightKg) >= 30 && Number(x.weightKg) <= 350; }).slice().sort((a,b) => a.date.localeCompare(b.date));
  const currentWeightKg = valid.length ? Number(valid[valid.length - 1].weightKg) : p.startWeightKg;
  const totalLossKg = Math.max(0, p.startWeightKg - currentWeightKg);
  const totalToLoseKg = Math.max(0, p.startWeightKg - p.targetWeightKg);
  const progressPct = totalToLoseKg ? Math.max(0, Math.min(100, totalLossKg / totalToLoseKg * 100)) : 100;
  const bmi = currentWeightKg / Math.pow(p.heightCm / 100, 2);
  return {
    currentWeightKg, targetWeightKg: p.targetWeightKg, startWeightKg: p.startWeightKg,
    remainingKg: Math.max(0, currentWeightKg - p.targetWeightKg), totalLossKg,
    totalToLoseKg, progressPct: Math.round(progressPct * 10) / 10,
    bmi: Math.round(bmi * 10) / 10, weightEntries: valid.length,
    phase: currentWeightKg <= p.targetWeightKg ? "review-phase-2" : "fat-loss"
  };
}
