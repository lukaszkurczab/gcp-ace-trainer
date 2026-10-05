# Native presentation 28 — temporary layout probe

## Purpose and status

Temporary development-only callbacks are now in `src/features/practice/PracticeFeedbackBlock.tsx` to measure the confirmed Q12 clipping on the existing completed review item. The probe does not modify the message, font cap, selection, details state, scoring, or session data. It is gated to development builds and question `gcp-ace-gcpace-n01-b03-001`; the text-layout callback is further restricted to the authored `wrong_option` message targeting option `D`. The probe records `fontScale` instead of gating on it so the native capture can establish the scale actually delivered to this component.

This reviewer did not operate the simulator or Metro. The change is ready for the root-owned run and capture. No layout cause or product fix is claimed yet.

## Logged observations

Each line has prefix `[native28-layout-probe]` and JSON payload:

- `feedback-card`, `details-section`, and `details`: `x`, `y`, `width`, `height` from `onLayout` (the first two can also appear before Details opens).
- `wrong-option-D-text`: target message `Text` frame from `onLayout`.
- `wrong-option-D-lines`: React Native `onTextLayout` line records, with `text`, `x`, `y`, `width`, `height`, `ascender`, and `descender`.
- Every record includes window `width`, `height`, `scale`, `fontScale`, the stable item ID, and surface label.

The line `text` values are the authored public learning explanation, not learner responses or account/session data. No storage, identifiers other than the fixed content item, or app state are emitted.

## Safe capture procedure

The root owns the device and Metro session. On the already completed item, open Details for the D wrong-option review at the target large text size. Capture only the new marker records from the existing Metro stream or the existing Hermes inspector connection by subscribing to `Runtime.consoleAPICalled`; do not evaluate application state through the debugger. Repeat in light and dark only if the existing root-owned run permits changing the appearance without disturbing its preserved state. Do not submit, restart, clear, or create a session for this probe.

React Native 0.86.3's `setUpDeveloperTools.js` forwards `console.info` through `HMRClient.log` when its development console is polyfilled. Expo's native HMR client serializes those logs as Metro `type: "log"` messages. The root also identified an existing Hermes inspector endpoint for this app, which can observe console API calls without adding a service or changing configuration. If the marker is absent, treat that as a capture-path failure, not as evidence about geometry; use the already available inspector connection rather than adding another logger.

## Reading the result

Compare all reported widths in logical points with the window width and the card/details widths. Concatenate or inspect the line `text` values to determine whether the complete authored sentence—including `attachment scope.`—was laid out. A parent frame wider than the available content points to a width constraint. A fitting frame with line geometry extending beyond it points to native text layout. Complete fitting line geometry with pixels still clipped points to ancestor rendering or clipping. Keep the source report at the observed layer; do not infer an unmeasured parent frame from the child alone.

The existing hierarchy-only probe found a baseline text frame of 328×66 points at the original Large setting. At the larger setting, its output contained no matching text frame and marked frame reading unsuccessful. That is a failed geometry read, not proof that the native text view had no frame. This callback probe is the limited next method because it observes the native layout events from the rendered `Text` itself.

After root capture, remove this temporary instrumentation before any product correction is proposed or accepted. The final visual acceptance remains the existing Q12 check: the complete authored diagnostic is readable at the supported large size in both themes while Details and navigation remain reachable. The probe is not an additional product gate.

## Capture attempt history

The first root-owned native attempt produced no marker events. The root then confirmed the running Metro bundle predated the source edit (`probeCompiled: false`), so the empty capture was a stale-bundle problem, not a native layout result and not evidence that the font-scale gate suppressed the callback. The probe now has no font-scale gate so it can report the value directly, and the root refreshed its existing Metro process with the project’s standard smoke-start command before a new cold-launch capture. Do not attribute any pre-refresh output to the current source.

## Changes and checks

Only `PracticeFeedbackBlock.tsx` was changed for this probe. The diff adds `useWindowDimensions` fields for the window geometry, one development/item/font-scale guard, and `onLayout`/`onTextLayout` callbacks on the card, Details containers, and D diagnostic. It retains the existing message text, key, shared typography, `maxFontSizeMultiplier={2}`, expansion behavior, sources, and report UI.

`npm run typecheck` passed after the temporary instrumentation was added. No simulator, Metro, native device, test suite, or persisted app data was touched by this reviewer. The parent will collect the live measurement.

## Bindings

- Prior layout preflight: `LAYOUT-PREFLIGHT.md`, SHA-256 `0e9d6cb19149ab0f27b6d2b3bffd5e3a57c9f4e9f6ed55b021b9d60e810974ff`.
- Prior source before probe: `PracticeFeedbackBlock.tsx`, SHA-256 `a0cd2b14e08d63260808727ac2fc775588f52b9e7101ce41e78cc604febbede5`.
- Instrumented `src/features/practice/PracticeFeedbackBlock.tsx`, SHA-256 recorded in the JSON binding (the font-scale condition was removed so the probe measures rather than assumes the component's scale; the first no-event capture was later attributed to a stale bundle, as detailed above).
- `node_modules/react-native/Libraries/Core/setUpDeveloperTools.js`, SHA-256 `9a5c7862b3b073d464ff638ba926f05ba39139767fa79aaf308a76f88eeeb83b`.
- `node_modules/expo/src/async-require/hmr.ts`, SHA-256 `05fe591a52558d9d3ebfbe61f79af17cdd84bd123c8403d0a162b9c905fe659f`.
- `node_modules/react-native/Libraries/Types/CoreEventTypes.d.ts`, SHA-256 `cf1e23408bb2e38cb90d109cf8027c829f19424ad7a611c74edf39e1f195fe22`.
- `node_modules/react-native/Libraries/Utilities/HMRClient.js`, SHA-256 `bd2a69acb30de0f8e6186641d6579f425f5b2f54372f61e82509d8d1731ac348`.
- Earlier root hierarchy probe: `ROOT-MESSAGE-FRAME-PROBE.json`, SHA-256 `74c54b4285b52e71db2e9cfde3d293ad2f38c2b28208af502311967782adc4f7`; baseline frame 328×66, large-size text-frame query unsuccessful. The root owns that native evidence and run.
