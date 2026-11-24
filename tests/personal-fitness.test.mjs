import { test } from "node:test";
import assert from "node:assert/strict";
import { FITNESS_JOURNEY_DEFAULTS, YMOVE_FREE_VIDEOS, PERSONAL_FITNESS_SESSIONS, fitnessJourneySummary, validateFitnessWeightEntry, fitnessWeekPlan, assessWorkoutPerformance } from "../rumbo-next/personal-fitness.js";

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
  assert.ok(YMOVE_FREE_VIDEOS.every(x => x.videoUrl.startsWith("https://cdn.jsdelivr.net/gh/ymove-app/exercise-api@main/free-videos/") && x.videoUrl.endsWith(".mp4")));
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


test("12-week programme contains four ordered sessions and clear progression phases", () => {
  const first = fitnessWeekPlan(1), middle = fitnessWeekPlan(6), final = fitnessWeekPlan(12);
  assert.equal(first.week, 1);
  assert.equal(first.days.length, 4);
  assert.deepEqual(first.days.map(x => x.day), [1,2,3,4]);
  assert.equal(first.days.filter(x => x.kind === "strength").length, 2);
  assert.equal(first.days.filter(x => x.kind === "cardio").length, 2);
  assert.equal(first.sets, 2);
  assert.equal(middle.sets, 3);
  assert.equal(final.phase, "Consolidación y revisión");
  assert.ok(first.days.filter(x => x.kind === "strength").every(x => x.exercises.every(e => e.videoId)));
});

test("Coach RUMBO recommends controlled progression after completed easy sets", () => {
  const result = assessWorkoutPerformance({ exercises: [{ sets: 2, setLog: [
    { reps: 12, weight: 15, rpe: 5 }, { reps: 12, weight: 15, rpe: 5 }
  ] }] });
  assert.equal(result.rating, "Progresión posible");
});

test("Coach RUMBO flags high effort and pain notes instead of recommending more load", () => {
  const pain = assessWorkoutPerformance({ exercises: [{ sets: 1, setLog: [{ reps: 8, weight: 20, rpe: 6, notes: "molestia en rodilla" }] }] });
  const effort = assessWorkoutPerformance({ exercises: [{ sets: 1, setLog: [{ reps: 8, weight: 20, rpe: 9 }] }] });
  assert.match(pain.rating, /Reducir/);
  assert.match(effort.rating, /Reducir/);
});

test("Coach RUMBO distinguishes a partially completed workout", () => {
  const result = assessWorkoutPerformance({ exercises: [{ sets: 3, setLog: [{ reps: 10, weight: 10, rpe: 6 }] }] });
  assert.equal(result.rating, "Sesión parcial");
});
