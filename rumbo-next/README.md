# RUMBO 3.0 — Functional foundation

This is an isolated development build in `redesign/rumbo-os-v4`. It does not replace the legacy app or write to its Firebase project.

## Included in this increment
- Responsive aviation-first navigation for all eight product modules.
- Local browser persistence for roster, logbook, training, shopping, family events and household expenses.
- CSV/ICS roster import with preview-by-review workflow (imported rows remain editable through subsequent iterations).
- Manual roster and logbook entry.
- Draft planning recommendations generated from imported duties.
- JSON export of this build's local state.
- Explicit separation between implemented local interactions and integrations still pending.

## Important limitations
- This is not yet connected to legacy `rumbo_v1`, Firebase, HealthKit, calendars, live METAR/TAF providers or an AI model.
- No real flight routes, hours, weather or family data are fabricated.
- Do not use as an operational flight tool.
- Next engineering steps: legacy state inventory and migration adapter, validation/import formats, test suite, secure Firebase staging, domain modules and real integrations.
