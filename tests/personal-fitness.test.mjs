import { test } from "node:test";
import assert from "node:assert/strict";
import { FITNESS_JOURNEY_DEFAULTS, YMOVE_FREE_VIDEOS, PERSONAL_FITNESS_SESSIONS, fitnessJourneySummary, validateFitnessWeightEntry } from "../rumbo-next/personal-fitness.js";

test("personal Fitness defaults match the user's confirmed starting profile", () => {
  assert.equal(FITNESS_JOURNEY_DEFAULTS.startWeightKg, 114);
  assert.equal(FITNESS_JOURNEY_DEFAULTS.targetWeightKg, 80);
  assert.equal(FITNESS_JOURNEY_DEFAULTS.heightCm, 170);
  assert.equal(FITNESS_JOURNEY_DEFAULTS.sessionsPerWeek, 4);
  assert.equal(FITNESS_JOURNEY_DEFAULTS.strengthSessions, 2);
  assert.equal(FITNESS_JOURNEY_DEFAULTS.cardioSessions, 2);
});

test("the free Your Move library contains 25 distinct verified source clips", () => {
  assert.equal(YMOVE_FREE_VIDEOS.length, 25);
  assert.equal(new Set(YMOVE_FREE_VIDEOS.map(x => x.id)).size, 25);
  assert.ok(YMOVE_FREE_VIDEOS.every(x => x.sourceUrl === "https://ymove.app/free-exercise-videos" && x.thumbnailUrl.startsWith("https://ymove.app/api/free/")));
});

test("personal weekly plan has two strength and two low-impact cardio sessions", () => {
  assert.equal(PERSONAL_FITNESS_SESSIONS.length, 4);
  assert.equal(PERSONAL_FITNESS_SESSIONS.filter(x => x.kind === "strength").length, 2);
  assert.equal(PERSONAL_FITNESS_SESSIONS.filter(x => x.kind === "cardio").length, 2);
  assert.ok(PERSONAL_FITNESS_SESSIONS.filter(x => x.kind === "strength").every(x => x.exercises.every(e => YMOVE_FREE_VIDEOS.some(v => v.id === e.videoId))));
});

test("Fitness summary calculates weight loss, remaining weight and BMI", () => {
  const summary = fitnessJourneySummary(FITNESS_JOURNEY_DEFAULTS, [{date:"2026-11-16",weightKg:114}]);
  assert.equal(summary.currentWeightKg, 114);
  assert.equal(summary.remainingKg, 34);
  assert.equal(summary.totalLossKg, 0);
  assert.equal(summary.bmi, 39.4);
});

test("weight log validation rejects implausible weights and invalid dates", () => {
  assert.equal(validateFitnessWeightEntry({date:"2026-11-16",weightKg:114}).length, 0);
  assert.ok(validateFitnessWeightEntry({date:"2026-02-31",weightKg:114}).length > 0);
  assert.ok(validateFitnessWeightEntry({date:"bad",weightKg:114}).length > 0);
  assert.ok(validateFitnessWeightEntry({date:"2026-11-16",weightKg:900}).length > 0);
});
