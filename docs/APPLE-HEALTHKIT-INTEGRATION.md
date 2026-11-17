# RUMBO · Apple Health / HealthKit native integration

## Current state
RUMBO is currently a browser PWA. A browser/PWA cannot read the HealthKit database directly. The bridge in this branch is a native iOS integration scaffold and will only work once packaged in a signed iOS app containing a WKWebView.

## Included in this branch
- `healthkit-bridge.js`: web-side request/response bridge and a connected-devices panel in Lifestyle.
- `ios/RumboHealthKit/RumboHealthKitBridge.swift`: native HealthKit message handler.
- HealthKit reads are limited to steps, active energy and walking/running distance in this first vertical slice. The permission declaration also includes heart rate, resting heart rate, sleep and workouts for the next implementation stage; those metrics are not yet aggregated by this initial reader.
- No health data is uploaded to Supabase or any third-party service by this bridge. The first phase is local read/display only.

## iOS host integration
1. Create an iOS app target with a WKWebView that loads the RUMBO web app from the trusted production origin.
2. Add `RumboHealthKitBridge.swift` to the iOS app target.
3. Register `RumboHealthKitBridge` on `WKUserContentController` as message handler `rumboHealthKit`, and retain the bridge for the WKWebView lifetime.
4. Add HealthKit capability in Xcode. Do not enable Clinical Health Records.
5. Add `NSHealthShareUsageDescription` explaining that RUMBO reads activity, sleep and recovery data to personalize fitness/nutrition tracking. No write permission is requested.
6. Enable HealthKit Background Delivery only in a later phase after observer queries and background behavior are implemented and tested.
7. Restrict WKWebView navigation to the RUMBO origin. Do not expose the bridge to arbitrary external pages.
8. Test authorization denial, limited history, no samples, timezone/day boundaries, app relaunch and offline behavior on a real iPhone.

## Important limitations
- The current PWA does not gain HealthKit access just by adding the JavaScript file.
- This initial native reader returns daily steps, active energy and walking/running distance. Sleep, heart-rate and workout aggregation, background delivery, persistence and cloud sync remain follow-up work.
- iOS controls background execution; this is not guaranteed continuous real-time sync.
- Apple health permissions are per data type and can be revoked at any time.
- Do not send health data to cloud storage until the user-facing cloud-sync consent, account ownership, retention and deletion controls are implemented and reviewed.


## Lifestyle dashboard integration (17 November 2026)

The Lifestyle & Recovery screen now contains the first native Apple Health activity dashboard.

- Connect Apple Health and refresh controls are rendered inside Lifestyle.
- Reads the existing native daily summary for steps, active energy and walking/running distance over the last seven days.
- Displays today's totals and a seven-day daily history.
- Keeps the latest returned summary in local device storage only (`rumbo_healthkit_daily_v1`) so the panel can show the last successful reading while offline.
- No HealthKit records are sent to Supabase or an AI service.
- The UI explicitly explains that iOS does not disclose read-permission status; an authorization request completing is not proof that access was granted.
- The browser/PWA version explains that native iOS is required and disables HealthKit actions.

Not included in this first Lifestyle delivery: sleep stages/duration, heart rate, resting heart rate, HRV, workout ingestion, recovery scoring, background delivery, Apple Watch companion app, and cross-module Fitness/Nutrition recommendations. These require additional HealthKit query types, validation against real device samples, and a separately documented scoring methodology. No medical interpretation is made.

Validation: GitHub Actions RUMBO 3.0 validation workflow run 44052976967 completed successfully (JavaScript syntax and required app-file checks). This is not an Xcode/iPhone build or physical HealthKit test.


## Expanded HealthKit implementation (17 November 2026)

The native reader and Lifestyle dashboard have been extended to include:
- Daily steps, active energy and walking/running distance.
- Daily average heart rate and resting heart rate, when samples are available.
- Daily average HRV (SDNN), when samples are available.
- Sleep duration from asleep category samples, attributed to the local date on which the sleep interval ends.
- Recent workouts (up to 100 samples in the selected 30-day window), including activity label, duration, energy, distance and HealthKit source name.
- Local-only cache of daily summaries and workouts for offline display.
- HealthKit observer queries with hourly background-delivery requests where supported by iOS. Delivery is opportunistic and is not guaranteed; the web dashboard refreshes when the native observer reports an update while the app is active.
- An experimental recovery trend is displayed only after at least 14 days with sleep, HRV and resting-heart-rate samples. It compares the latest available day with a 13-day personal baseline and is explicitly labelled non-medical.

Apple Watch data: the iPhone can read Apple Watch-originated measurements after Apple Health synchronizes them. Workout source names are included to help distinguish sources when HealthKit provides them. This branch does not yet contain a separately installable watchOS companion app or a live watch-to-phone messaging workflow.

## Remaining device validation and product work

- Build and sign the iOS target in Xcode on macOS; verify bundle resource inclusion and HealthKit capability.
- Test on a physical iPhone paired with Apple Watch, with actual Health permissions granted/denied, missing samples, timezone changes, app termination/relaunch and background delivery.
- Validate HRV/sleep data availability across devices and third-party sources. Not all Apple Watch models or sleep configurations provide every metric.
- Add the separate watchOS app target and decide which watch-specific interactions are useful (for example, a compact activity glance); this cannot be validated in the GitHub JavaScript workflow.
- Wire recovery context into RUMBO Fitness and Nutrition recommendations after reviewing their current state/data contracts. The current experimental score is only shown in Lifestyle and must not be treated as medical advice or as an automatic training prescription.

No health records are written to HealthKit or uploaded to Supabase in this implementation.
