# Foreground scheduler capability probe

This fixture asks the already approved Hermes event-loop capability question in a separate run; it is not the same timing profile as the earlier manual probe, which began its stall at about t=200 ms. This versioned fixture begins the stall synchronously at command time (t=0). Both runs concern callback scheduling only, and this fixture adds no native evidence. It does not implement a foreground timer, import Patternly storage/lifecycle/account code, or establish PERSIST-11 acceptance. The read-only readiness mode is the default. The one-shot measurement deliberately blocks the JS thread for 6 seconds to see how late a 1-second callback runs; use it only with explicit owner authorization.

Requirements: Node.js 22.13+; the repository's already installed dependencies; an isolated Metro server started by the operator; and the exact app ID and Metro logical device ID of the single intended target. No install step is needed.

Before opening the app or measuring:

1. Obtain explicit owner permission for this specific run and device. Do not infer permission from an earlier run.
2. Confirm the existing app/device target and the local Metro port. Check port ownership first (for example, `lsof -nP -iTCP:8082 -sTCP:LISTEN`). Do not stop another process or take over its port. Use a different free loopback port only if the operator deliberately configures both Metro and this probe to that port.
3. From this fixture directory, start its isolated Metro server in an operator-owned terminal:

   ```sh
   cd scripts/fixtures/foregroundSchedulerProbe
   ../../../node_modules/.bin/expo start --localhost --port 8082
   ```

   This command starts Metro only. It does not launch, install, stop, reset, or modify the app or its storage. Launching the app is a separate operator action and requires the specific permission above. Keep the same existing device and preserve its app data.
4. Supply the exact `appId` and `reactNative.logicalDeviceId` for that device. The probe rejects zero or multiple Metro targets, a mismatch, a non-loopback origin, and a WebSocket URL outside the same local origin. It never prints target IDs, names, URLs, or Metro response bodies.

Read-only readiness (no owner authorization flag and no stall):

```sh
node scripts/nativeForegroundSchedulerProbe.mjs \
  --metro-origin http://127.0.0.1:8082 \
  --app-id com.lkurczab.patternly \
  --device-target "$PATTERNLY_METRO_LOGICAL_DEVICE_ID"
```

Only after explicit permission, request the single bounded measurement:

```sh
node scripts/nativeForegroundSchedulerProbe.mjs \
  --metro-origin http://127.0.0.1:8082 \
  --app-id com.lkurczab.patternly \
  --device-target "$PATTERNLY_METRO_LOGICAL_DEVICE_ID" \
  --measure-stall --owner-authorized
```

The marker refuses a second measurement in the same app runtime. The synchronous loop ends successfully only when its monotonic clock reaches 6 seconds. An independent 8-second wall-clock guard and a 30-million-iteration cap end the loop as `wall_guard` or `iteration_limit`; those outcomes are incomplete measurements, never successful stalls. The CLI requires the reported monotonic duration and termination reason to prove completion, and checks callback timing against the completed stall. Wall-clock elapsed values are diagnostic metadata only and may jump forward or backward after a civil-clock adjustment; the wall guard is an independent early-stop safety bound, not proof of a 6-second stall. The CLI's separate 8-second monotonic deadline bounds the complete measurement/readback window while it polls a small read-only result instead of relying on CDP `awaitPromise`. A timeout or incomplete result is inconclusive: do not retry against the same runtime. Close the probe app and Metro only through their respective operator-owned controls after checking process ownership; this script never manages either process.

Output is restricted to a versioned protocol/stage, a bounded termination reason, booleans, timing and iteration fields, and a bounded monotonic measurement window. Civil wall-clock timing is finite signed metadata and has no upper bound, so it may be negative or large after clock adjustments. An early cap, wall guard, or invalid monotonic duration exits nonzero with `measurement_incomplete`; inconsistent callback timing is rejected with a safe result error. The script does not emit exceptions, target metadata, storage contents, or secrets. The local CLI mock tests verify protocol guards and safe output only; they do not emulate Hermes. A measured callback delay demonstrates only scheduler behavior for that runtime. It does not demonstrate checkpoint loss/recovery, foreground eligibility, storage preservation, or PERSIST-11 PASS.

## Reproducing the dependent-target C++ capability check

`nativeHandleCompileProbe.mm` is the exact small source used for the successful compile-only check against the installed `NitroMmkv` CocoaPods target. It tests conversion of an existing `std::shared_ptr<HybridMMKVSpec>` handle through Nitro's `JSIConverter`; it neither constructs an MMKV instance nor touches storage. In this checkout the measured dependency versions were `react-native-mmkv` 4.3.2 and `react-native-nitro-modules` 0.36.1.

To repeat the capability check, an operator must first locate the response file emitted by the actual `NitroMmkv` dependent pod target and provide its path as `NITRO_MMKV_COMMON_ARGS`. Use a private temporary module cache path as `PRIVATE_MODULE_CACHE`. From the repository root, run:

```sh
xcrun clang++ @"$NITRO_MMKV_COMMON_ARGS" \
  -x objective-c++ -fsyntax-only \
  -fmodules-cache-path="$PRIVATE_MODULE_CACHE" \
  scripts/fixtures/foregroundSchedulerProbe/nativeHandleCompileProbe.mm
```

This reads the operator-selected Xcode response file and uses the compile settings CocoaPods generated for that dependent pod target. It does not patch Pod files or search paths, build/link the app, install or launch anything, or run the app. Keep response files, compiler logs, derived-data paths, and module caches private; only the source fixture is versioned here. Compile success establishes only that this installed dependent target can compile the handle conversion. It does not prove runtime object identity, profile lease correctness, thread safety, timer semantics, or app wiring, and it is coupled to the installed Nitro/MMKV versions and CocoaPods target setup.
