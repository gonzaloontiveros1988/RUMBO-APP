# RUMBO · Apple Health and Apple Watch integration

## Implemented
The native iOS app hosts the offline-first RUMBO web app in a bundled WKWebView and exposes a restricted HealthKit bridge. Read categories: steps, walking/running distance, active energy, average heart rate, resting heart rate, HRV SDNN, sleep analysis and workouts (activity, duration, energy, distance and source). No HealthKit write access or Clinical Health Records access is requested.

## Apple Watch data flow
Apple Watch measurements and workouts can be read after they synchronize into Apple Health on the paired iPhone, subject to permissions and sample availability. This is an iPhone HealthKit reader; there is no separately installable watchOS companion app or live watch-to-phone messaging in this repository.

## RUMBO screens
- **Lifestyle:** connect/refresh controls, daily summary, seven-day history, recent workouts and experimental recovery trend.
- **Fitness:** cached sleep, HRV and resting-heart-rate context. These values do not automatically alter a workout or training load.
- **Nutrition:** cached sleep, steps and active-energy context. These values do not automatically alter calorie targets, meal plans or food recommendations.

Connect or refresh in Lifestyle, then open Fitness and Nutrition to see the latest local cache.

## Privacy and offline use
Health records remain in local device storage and are not sent to Supabase, RUMBO AI, analytics or third parties by this integration. The latest daily summary and workout list are cached for offline display. The message handler is registered only in the bundled native WKWebView. No HealthKit data is written back.

## Recovery estimate
The recovery trend is experimental and non-medical. It is shown only after at least 14 days contain sleep, HRV SDNN and resting-heart-rate values. It compares the latest day with the preceding 13-day personal baseline, weighting sleep 40%, HRV 30% and resting heart rate 30%. It is not a diagnosis, medical measurement or automatic training prescription. Missing samples are not interpreted as zero.

## Permissions and background delivery
HealthKit observer queries and hourly background-delivery requests are enabled where supported. iOS controls background execution; delivery is opportunistic, not guaranteed or real-time. Apple does not disclose read-permission status to apps, so a completed authorization callback is not proof of access.

## Build and physical acceptance
Open `ios/RumboAppProject/RUMBO.xcodeproj`, select the `RUMBO` scheme and run on an iPhone simulator or physical iPhone. GitHub Actions checks JavaScript and builds the iOS target on a macOS runner without code signing; this does not validate real HealthKit permissions or Watch synchronization.

Physical-device checklist: install on iPhone; connect in Lifestyle; grant chosen categories; refresh and verify metrics/workouts; verify Fitness and Nutrition panels; confirm unavailable categories are not shown as zero; sync a paired Apple Watch to Apple Health and refresh; relaunch offline; revoke a category and confirm the UI does not claim access; observe background behavior without assuming an hourly guarantee.

## Explicit limitations
Physical iPhone/Watch acceptance testing remains necessary. Background delivery timing is controlled by iOS. There is no separate watchOS app, health-data cloud sync, HealthKit write access or medical-grade recovery assessment.
