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
