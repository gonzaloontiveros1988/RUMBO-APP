# RUMBO iOS native shell — Xcode setup

This folder contains the first SwiftUI host shell for the existing RUMBO web app. It is not yet a signed, built, or tested iOS application. Complete the steps below on a Mac with Xcode.

## Files added

- `RumboApp.swift`: SwiftUI application entry point.
- `ContentView.swift`: root view.
- `RumboWebView.swift`: local bundled RUMBO web app in a WKWebView, with the `rumboHealthKit` message handler registered and external navigation opened outside the web view.
- `Info-HealthKit.plist`: HealthKit read permission explanation.
- `RumboApp.entitlements`: HealthKit entitlement.

The existing native reader is in `../RumboHealthKit/RumboHealthKitBridge.swift`.

## Create the Xcode project

1. Open Xcode and choose **Create a new Xcode project**.
2. Choose **iOS → App**.
3. Product Name: `RUMBO`; Interface: **SwiftUI**; Language: **Swift**. Use your own organization identifier (for example, a reverse-DNS identifier you control).
4. Save the project inside the downloaded repository at `ios/RumboAppProject`. Do not overwrite the source folders.
5. Remove the starter `ContentView.swift` and app entry point created by Xcode from the target (or replace their contents with the files from this folder).
6. Add all files from `ios/RumboApp` and `ios/RumboHealthKit` to the app target. Ensure **Copy items if needed** is selected if Xcode asks.
7. Drag the entire `rumbo-next` folder into the project navigator. In the import dialog choose **Create folder references** (blue folder), and tick the RUMBO app target. This is important: the app expects `rumbo-next/index.html` to be present in the app bundle.
8. In the app target **Build Phases → Copy Bundle Resources**, verify that the `rumbo-next` folder reference is included.
9. In **Build Settings**, set **Info.plist Values** / custom Info.plist configuration so the app includes the `NSHealthShareUsageDescription` value from `Info-HealthKit.plist`. Alternatively add that key and its Spanish explanation directly to the generated app Info.plist. Do not create any HealthKit write usage description; this app requests read-only access.
10. In **Signing & Capabilities**, add **HealthKit**. Use the entitlements file `RumboApp.entitlements` as the target's Code Signing Entitlements file. Do not enable Clinical Health Records.
11. Set the deployment target to iOS 17 or later.
12. Select an iPhone simulator and build. The simulator is useful for checking the UI, but HealthKit data and Apple Watch integration must ultimately be tested on a real iPhone paired with an Apple Watch.

## Current limitations

- The host loads the bundled `rumbo-next/index.html` locally. Browser-only capabilities such as service workers/PWA installation do not apply inside this native shell.
- HealthKit currently reads daily steps, active energy and walking/running distance only.
- HealthKit read permission is privacy-preserving: iOS does not tell an app whether read access was denied. A successful authorization request callback must not be displayed as proof that permission was granted. Empty results can mean no samples or no read access.
- Heart rate, resting heart rate, sleep, workouts, background delivery, durable health-data storage, and cloud sync are not implemented.
- No health data is uploaded by this native shell.
- Do not expose the `rumboHealthKit` script message handler to external websites. The current host only loads local bundled files and opens non-file links outside the WKWebView.
- This source scaffold has not yet been compiled or validated on a physical device. Do not distribute it until signing, permissions, navigation, privacy behavior and real-device tests are complete.
