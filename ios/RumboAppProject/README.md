# RUMBO iOS app

Native project: `ios/RumboAppProject/RUMBO.xcodeproj`.

## Run in Xcode
1. Open `RUMBO.xcodeproj`.
2. Select the `RUMBO` scheme.
3. Choose an iPhone simulator and press Run.
4. For a physical iPhone, select the device and configure your Personal Team under **Signing & Capabilities**.

A free Apple Account is sufficient for local development and device testing; paid membership is required for App Store/TestFlight distribution. Free provisioning profiles expire periodically.

## Project architecture
- SwiftUI entry point: `../RumboApp`.
- WKWebView host: `../RumboApp/RumboWebView.swift`.
- Native HealthKit reader: `../RumboHealthKit/RumboHealthKitBridge.swift`.
- Bundled offline-first web app: `../../rumbo-next`.
- HealthKit entitlement and read-purpose description are included.
- Bundle identifier: `com.rumbo.app`.

## HealthKit and Apple Watch
RUMBO reads steps, walking/running distance, active energy, average/resting heart rate, HRV SDNN, sleep and recent workouts. Apple Watch records are available after they synchronize into Apple Health on the paired iPhone and subject to the user's permissions. Connect and refresh in Lifestyle. Fitness and Nutrition display local cached context after a successful read. No HealthKit write access or health-data upload to Supabase/RUMBO AI is enabled.

This is an iPhone HealthKit integration, not a separate watchOS companion app.

## Platform behavior
- iOS does not disclose whether read permission was denied; authorization callback completion is not proof of access.
- Observer queries/background delivery are opportunistic; iOS does not guarantee hourly or real-time refresh.
- Health summaries are cached locally for offline display.
- No Clinical Health Records access is requested.

## Validation
GitHub Actions validates JavaScript and builds the iOS target on a macOS runner without signing. Physical iPhone and paired Apple Watch testing is still required for real permission flows, sample availability, Watch synchronization, revocation, offline relaunch and background behavior. See `docs/APPLE-HEALTHKIT-INTEGRATION.md`.
