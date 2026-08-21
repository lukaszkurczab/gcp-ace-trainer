# QA-02 — current-head iOS simulator evidence — 2026-08-21

## Scope and result

This is a local, capture-only verification of the current app HEAD. It does
not establish a signed release candidate, Figma parity, store/provider
readiness, or Product Owner GO approval. Physical-device testing is optional
for the current launch scope and is not a gate blocker.

| Field | Evidence |
| --- | --- |
| App commit | `19b6601e19e1888ffce1449dd5e54ca5df4f8996` |
| Device | `Maestro_IOS_iPhone-16-Pro_18`, iOS 18.6, simulator UDID `00B8F5B5-DF44-4621-8E30-56927604FA96` |
| Debug build | `npx expo run:ios --device Maestro_IOS_iPhone-16-Pro_18` completed with 0 errors and 2 build warnings |
| Debug visual flow | Dark 6/6 checkpoints; Light 6/6 checkpoints |
| Release build | `npx expo run:ios --configuration Release --no-bundler --device Maestro_IOS_iPhone-16-Pro_18` completed with 0 errors and 2 build warnings; the resulting `Patternly.app` was installed/launched directly with `simctl` to avoid Expo CLI opening Metro/dev-client URL |
| Release visual flow | Release-compatible embedded flow completed Dark 6/6 and Light 6/6 checkpoints |

## Physical-device discovery — 2026-08-21

Read-only device discovery found one paired physical iPhone, but it is not
currently a valid capture target:

| Check | Result |
| --- | --- |
| Device | iPhone 11, iOS 26.2.1, UDID `00008030-001E159A3620C02E` |
| Pairing / boot | paired, booted, local-network tunnel connected |
| Developer Mode | enabled |
| Developer Disk Image services | unavailable because the device is locked; `kAMDMobileImageMounterDeviceLocked` / CoreDevice error `12040` |
| Maestro target | not listed by `maestro list-devices` |
| Android | `adb devices -l` returned no attached devices |

`xcrun devicectl device info details` confirmed the hardware is physical and
paired. A bundle-specific read-only app inspection then failed while enabling
DDI services because the device was locked; the system reported
`kAMDMobileImageMounterDeviceLocked` and CoreDevice error `12040`. Maestro can
read the current hierarchy, but that does not identify the installed build or
prove a signed release flow. No app was installed, launched, or captured on
this device. This records an unavailable optional capture target; it is not a
launch-readiness blocker.

## Debug capture

The existing capture-only flow passed all six checkpoints in both themes:

1. Home ready;
2. Custom Practice setup ready;
3. Algorithms active session ready;
4. Partial session summary ready;
5. Settings root ready;
6. Appearance ready.

Local output directories:

- `artifacts/maestro-screen-capture/current-head/2026-08-21-ios-dark/`
- `artifacts/maestro-screen-capture/current-head/2026-08-21-ios-light/`

Manual inspection of the Home and Practice captures found no observed
clipping or broken primary layout in the sampled states. The debug-client
captures include the Expo development overlay, so they are not clean product
screenshots and cannot serve as final visual or store evidence.

## Release capture boundary

The first Release attempt exposed a capture-flow contract mismatch. Its clean
failure screenshot is retained at:

`artifacts/maestro-screen-capture/current-head/2026-08-21-ios-release-dark/2026-08-21_010804/screenshot-❌-1787267322056-(visual-shell.yaml).png`

The original `visual-shell.yaml` began with the development-only
`audit/reset-learning-state` deep link and asserted
`patternly:content:ready-after-audit-reset`. `ContentPreparationGate` only
publishes that marker from its `__DEV__` audit-reset path; Release exposes the
normal `patternly:content:ready` marker instead. The capture contract was
split into a development-reset entry point, a release-compatible entry point,
and one shared learner journey. The shared journey now waits on stable question
and learner-visible controls rather than assuming the debug-only `:1` session
identity; embedded Release correctly uses a UUID session identity.

Release-compatible outputs:

- Dark: `artifacts/maestro-screen-capture/current-head/2026-08-21-ios-release-compatible-dark-embedded/`
- Light: `artifacts/maestro-screen-capture/current-head/2026-08-21-ios-release-compatible-light-embedded/`

## Verification and limits

- iOS Debug build: pass, 0 errors.
- iOS Debug visual-shell: pass, 6/6 Dark and 6/6 Light.
- iOS Release build/install: pass, 0 errors.
- iOS Release-compatible embedded visual-shell: pass, 6/6 Dark and 6/6
  Light, after direct `simctl` launch of the built app.
- Release capture-flow regression test: pass, 1/1.
- Physical iOS/Android flows: not evidenced; this is acceptable for the current
  launch scope. One paired iPhone is currently
  blocked because it is locked and DDI services cannot mount; Android has no
  attached device.
- The simulator artifact is unsigned/non-distribution evidence; Figma owner
  approval/parity, provider/store records, and Product Owner GO remain
  unevidenced. Physical-device evidence is optional.

The app remains `not_ready`; this report closes only the bounded current-head
simulator slice.
