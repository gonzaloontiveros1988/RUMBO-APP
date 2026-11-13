# RUMBO 4.0 — Functional and technical implementation plan

Status: approved product direction; phased implementation in progress.
Branch: `redesign/rumbo-os-v4`.

## Product decisions
- Fitness: hybrid gym / home / travel coaching, with progressive multi-week programs.
- Nutrition: adaptive meal planning and food logging, coordinated with activity.
- Household economy: family income, expenses, budgets, debts, savings, assets and cash-flow forecasts.
- Architecture: a central RUMBO AI orchestrator coordinating specialist domain engines.

## Current repository baseline (audited 2026-11-13)
- Single-page modular frontend under `rumbo-next/`.
- Local persistence in `localStorage` under `rumbo3_local_v1`; no cross-device sync.
- Fitness: seven routine templates and a 14-day candidate generator. Previous logic over-selected mobility for moderate readiness and had no structured exercise-level records.
- Nutrition: 31 recipes, weekly 21-meal planner, shopping list, pantry and recipe-assistant API. The deployed recipe endpoint can run without AI Gateway credentials only after the compatibility fallback introduced in this release.
- Household finance: manual expenses, currency-separated summaries, budgets and client-side receipt OCR. No household income/debt/assets/cash-flow model yet.
- AI: `api/rumbo-ai.js` summarizes local context and calls Vercel AI Gateway. The Vercel project was inspected and currently has no project environment variables; live AI generation therefore needs an AI Gateway key or working Vercel OIDC injection.
- Supabase account has an existing project containing AppDeck / Family Office market and portfolio data. RUMBO data must not be mixed into those tables. A separate RUMBO project or explicit isolated database decision is required before provisioning persistent user data.

## Target architecture
1. Responsive frontend: retain current app shell and migrate module-by-module.
2. Domain layer: independent Fitness, Nutrition, Lifestyle and Household Finance engines.
3. Backend: Vercel Functions with typed/validated request and response contracts.
4. Persistence: dedicated Supabase project, PostgreSQL, Auth, Storage and RLS. Do not reuse the existing Family Office/AppDeck project without explicit approval.
5. AI orchestration: central coordinator routes requests to deterministic domain engines; AI interprets and explains, but deterministic code owns calculations and validation.
6. Auditability: every AI proposal and user-approved state-changing action records input context, timestamp, result and actor.
7. Privacy: only send the minimum required context to the model; no service-role secrets in the browser.

## Domain specifications

### Fitness — hybrid
- Profile: goals, experience, preferred training locations, schedule, equipment and user-declared constraints.
- Multi-week program blocks (initially 6–8 weeks), with a rolling 14-day schedule.
- Exercise catalogue: stable ID, movement pattern, muscles, equipment, coaching cues, substitutions and reviewed demonstration media.
- Session logging: date, duration, setting, exercise, sets, reps, load, RPE/RIR and optional notes.
- Progression: use exercise history and effort; increase load only after repeatable target performance, hold or reduce after high effort or missed reps.
- Roster-aware scheduling: imported duty dates are unavailable; unassigned dates are not assumed OFF. Post-duty intensity is conservative.
- Dashboard: adherence, volume, exercise progression, personal records and cycle review.
- Safety: readiness is self-reported, not a medical assessment; user can skip or override.

### Nutrition — adaptive
- Profile, preferences, allergens/intolerances, goal and household serving sizes.
- Food log by manual search, recipe, image-assisted draft and barcode integration where a licensed/verified source exists.
- Nutrient calculations retain serving quantity, source and estimation status.
- Weekly menu, substitutions, pantry reconciliation and shopping basket optimization.
- Adapt goals only from trends, never one isolated weigh-in. Nutrition outputs are estimates, not clinical prescriptions.
- Coordinate training load and meal planning without pretending exercise calories are exact.

### Lifestyle
- Daily check-in, sleep duration/quality, fatigue, recovery, habits, steps/activity and agenda.
- Daily briefing and weekly review.
- Future Apple Health / Health Connect / wearable connectors behind explicit user consent.
- Distinguish manually entered data, imported device data and estimates.

### Household economy
- Income streams (fixed, variable, extraordinary), expenses, recurring commitments, category budgets, debt schedules, savings goals, accounts and assets.
- Preserve native currency on every record. Conversion requires a dated FX rate and must never silently sum unlike currencies.
- Forecast cash flow and scenario comparisons.
- Receipt OCR creates a draft only; user confirms before saving.
- Separate household finance from the official Family Office investment register. Read-only references or export proposals only; no autonomous trades or edits.

### RUMBO AI Core
- Orchestration pipeline: intent → authorized context retrieval → deterministic domain calculations → AI interpretation → structured proposal → explicit approval → audited action.
- Each specialist engine exposes narrow operations with validated schemas.
- AI must label observed facts, calculations, estimates and recommendations.
- No direct arbitrary database writes from model-generated text.
- User approval required for activating plans, changing financial assumptions, or committing important records.

## Data model (target, dedicated RUMBO database)
- Identity: profiles, preferences, goals, consent_records.
- Fitness: fitness_profiles, exercise_library, training_programs, program_sessions, workout_logs, exercise_sets, readiness_logs.
- Nutrition: nutrition_profiles, foods, recipes, meal_plans, meal_logs, food_entries, pantry_items, shopping_items.
- Lifestyle: daily_checkins, sleep_logs, recovery_logs, habit_definitions, habit_logs.
- Finance: financial_accounts, income_entries, expense_entries, budgets, debts, assets, savings_goals, exchange_rates.
- AI/audit: ai_conversations, ai_insights, ai_proposals, ai_action_logs, audit_logs.
- All user-owned rows require owner scoping and RLS. Private secrets stay server-side. Storage paths are scoped by user ID.

## Migration and data safety
- Export a versioned backup before any migration.
- Map current local arrays into domain entities without fabricating missing historical values.
- Preserve source IDs and original currency/units.
- Validate row counts, foreign keys, duplicate handling and checksums.
- Keep local backup/restore available until cloud sync is proven.
- Never modify the Family Office V4 workbook or its investment classifications.

## Phased delivery and acceptance
0. Foundation: audit, backup, architecture contracts, auth decision, dedicated persistence environment, migration design and security review.
1. Fitness 2.0: exercise catalogue, structured set logging, varied hybrid program engine, progressive overload rules, tests and mobile/desktop QA.
2. Nutrition adaptive: food diary, verified nutrition source model, adaptive menus, ingredient-level totals and shopping optimization.
3. Lifestyle: sleep/recovery/habits, daily briefing and consent-based wearable integration.
4. Household Finance: income, recurring expenses, budgets, debts, assets, savings, FX and forecast scenarios.
5. AI Core: central orchestration, cross-domain reasoning, proposal/approval workflow, audit log and observability.

A phase is complete only when behavior, persistence, validation, automated tests, error handling, responsive QA and data recovery are verified. A visual mockup alone does not count.

## Immediate release notes
- Recipe search: when AI Gateway credentials are absent, attempt to return real published recipes extracted from page Recipe JSON-LD; do not fabricate nutrition. AI-generated original recipes remain unavailable until credentials are configured.
- AI assistant: supports `AI_GATEWAY_API_KEY` or Vercel OIDC. The Vercel project currently has no configured project environment variables, so a key must be added securely in Vercel before live model calls can succeed.
- Fitness: moderate readiness no longer forces all sessions to mobility; strength, conditioning and travel options are rotated. Added exercise-level logging and a starter exercise catalogue.
