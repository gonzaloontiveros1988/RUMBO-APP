# RUMBO 4.0 — Pilot & Family OS

Canonical RUMBO 4.0 development line on `redesign/rumbo-os-v4`. The former app entry point is only a compatibility redirect; this directory is the active product. The app keeps its personal operating data in browser-local storage unless an explicitly configured integration is used.

## RUMBO 4.0 product modules
1. Command Center — monthly overview, next-week agenda and all-time flight map.
2. Roster & Duty Planning — Qatar roster PDF / CSV / ICS import, review and editable duties.
3. Aviation & Logbook — manual sector entry, Wader CSV import, flight-hour summaries, airport map and export.
4. Training Intelligence — training log, exercise library and draft suggestions around roster entries.
5. Nutrition & Meals — meal suggestions, pantry and shopping list.
6. Family Week — family events, school planning and reminders.
7. Home & Finance — household expenses and currency-aware summaries.
8. RUMBO AI — contextual assistant through `/api/rumbo-ai` and Vercel AI Gateway.

## City scene catalogue
- `city-scenes.js` maps the 77 ICAO airports present in the supplied Wader logbook export to their cities.
- It also includes a curated set of major Qatar Airways destinations for future trips.
- The CITY selector loads a city image and descriptive title from Wikipedia's public REST summary endpoint; the selected city is saved locally. Auto mode uses the latest recorded logbook destination when available, otherwise Doha.
- City photography therefore requires an internet connection. The existing illustrated/country scene remains the fallback if a city image cannot be retrieved.

## Data and safety boundaries
- Roster, logbook, training, shopping, family events and household expenses are stored in the browser. They are not automatically synchronized between devices.
- Imported data is previewed/parsed in the browser; verify it before relying on it.
- Training suggestions are drafts, not confirmation of rest or fitness to exercise.
- RUMBO is a personal organization tool, not an operational flight tool. Do not use it for dispatch, flight planning, SOP interpretation or safety-critical decisions.
- RUMBO AI analyses only the context sent by the browser. The API requires Vercel AI Gateway authentication via `VERCEL_OIDC_TOKEN`; if the deployment lacks this token, AI requests return a clear unavailable response.
- The app is not currently connected to the legacy Firebase project, HealthKit, live METAR/TAF feeds or external calendar accounts.

## Validation
GitHub Actions validates the active RUMBO 4.0 source and preview. Production remains separate until explicit release approval. Preview publication is handled by `.github/workflows/rumbo-preview-pages.yml`.

## Nutrition, fitness and household receipt reader
- Recipe nutrition is an estimate based on ingredient quantities in the recipe catalogue. RUMBO displays kcal, protein, carbohydrates and fat per serving and kcal per ingredient; actual values vary by brand, preparation and measured portion.
- A user-entered nutrition profile estimates a daily energy reference. It is optional and is not a medical or dietetic prescription.
- Fitness suggestions use roster entries and logged workouts to draft candidate sessions. Users must review and accept them; an unassigned roster date is not proof of adequate rest or readiness.
- Household finance accepts image receipts through in-browser Tesseract OCR and text-based PDF invoices through PDF.js. Merchant, date, amount, currency and category are prefilled as a draft; the user must verify and explicitly save. Scanned/image-only PDFs and Arabic-only OCR may need a photo or manual correction. No receipt is auto-booked.
