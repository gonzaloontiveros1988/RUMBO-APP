# RUMBO iOS app

The Xcode project is now included at:

`ios/RumboAppProject/RUMBO.xcodeproj`

## Open and run

1. In Finder, open the single working copy of `RUMBO-APP`.
2. Open `ios/RumboAppProject`.
3. Double-click `RUMBO.xcodeproj`.
4. In Xcode, choose an iPhone simulator in the run destination menu.
5. Select the `RUMBO` scheme and press Run (▶).

For a physical iPhone, connect it by cable or pair it wirelessly, select it as the run destination, and set a Personal Team under **Signing & Capabilities**. A free Apple Account can be used for local development; paid membership is not needed for the first device build. The free provisioning profile expires periodically.

## Project wiring

The project includes:
- SwiftUI app entry point and root view from `../RumboApp`.
- WKWebView host with the HealthKit script message handler from `../RumboHealthKit`.
- The existing `../../rumbo-next` directory as a blue folder reference copied into the app bundle.
- HealthKit entitlement and read-purpose string.

The bundle identifier is `com.rumbo.app`. Change it to a unique identifier you control if Xcode reports a conflict.

## Important current limits

This is a first native shell, not a finished or App Store-ready product. It has not been compiled or tested on a physical iPhone in this development environment. The initial HealthKit reader reads steps, active energy and walking/running distance only. iOS deliberately does not disclose whether read permission was denied; a completed authorization callback is not proof that access was granted. HealthKit data is not uploaded to a server. Sleep, heart rate, workouts, background refresh, robust offline handling, and watchOS companion app remain future work.
