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

Optional native registration check on a specifically approved, already installed
candidate that includes `PatternlyForegroundClock`:

```sh
node scripts/nativeForegroundSchedulerProbe.mjs \
  --metro-origin http://127.0.0.1:8082 \
  --app-id com.lkurczab.patternly \
  --device-target "$PATTERNLY_METRO_LOGICAL_DEVICE_ID" \
  --native-registration
```

This mode uses the pinned Nitro registry and constructs one **unbound** clock
object to inspect its method surface. It never supplies an MMKV handle, binds
a profile, calls a clock method or reads/writes storage. Default readiness does
not load Nitro. Registration and stall modes cannot be combined. Missing or
invalid registration exits nonzero with a closed error category; no native
exceptions or registry/target contents are printed. This is not evidence of
shared-handle identity, timing, IO, preservation or recovery. The protocol tests
model the SDK boundary; actual Nitro/Hermes execution remains a separate check.
The flag authorizes no install, launch or process-management action.

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

## Static archive registration/link-retention check

`nativeRegistrationLinkProbe.mm` adds a diagnostic hand-written HybridObject and an Objective-C `+load` registration. Its method accepts two existing MMKV handles and compares identity; it does not open, read or write storage. This fixture is never imported by production or installed on a device. Compiling and linking it does not execute the method or prove runtime identity.

First check available disk space and that no other heavy local build is running. Select the actual existing NitroMmkv response file, the corresponding Xcode `XCBuildData/*.xcbuilddata/manifest.json`, and a new private output directory. Do not generate guessed linker flags or alter project/Pod/vendor files. From the repository root:

```sh
umask 077
mkdir -m 700 "$PRIVATE_PROBE_OUTPUT"
xcrun --sdk iphonesimulator clang++ @"$NITRO_MMKV_COMMON_ARGS" \
  -x objective-c++ -c \
  -fmodules-cache-path="$PRIVATE_PROBE_OUTPUT/module-cache" \
  scripts/fixtures/foregroundSchedulerProbe/nativeRegistrationLinkProbe.mm \
  -o "$PRIVATE_PROBE_OUTPUT/registration.o"
xcrun ar rcs "$PRIVATE_PROBE_OUTPUT/libPatternlyForegroundRegistrationProbe.a" \
  "$PRIVATE_PROBE_OUTPUT/registration.o"
```

Export `PRIVATE_PROBE_OUTPUT` and `NATIVE_APP_BUILD_MANIFEST` for this closed replay. It requires one existing arm64 simulator dynamic-library app link recipe, keeps its library/search/ABI options, redirects every declared output to the private directory, disables ad-hoc signing, and adds the archive through the file list. It never uses the manifest's environment or executes arbitrary build tasks:

```sh
python3 - <<'PY'
import json, os, subprocess
from pathlib import Path
os.umask(0o077)
out = Path(os.environ['PRIVATE_PROBE_OUTPUT']).resolve()
assert out.is_dir() and (out / 'registration.o').is_file()
manifest = json.loads(Path(os.environ['NATIVE_APP_BUILD_MANIFEST']).read_text())
matches = [r for r in manifest['commands'].values()
           if isinstance(r.get('args'), list)
           and any(x.endswith('/Patternly.LinkFileList') for x in r['args'])]
assert len(matches) == 1
recipe = matches[0]
original = recipe['args']
assert Path(original[0]).name == 'clang' and '-ObjC' in original and '-dynamiclib' in original
assert original[original.index('-target') + 1].endswith('-simulator')
assert original.count('-filelist') == 1
filelist = Path(original[original.index('-filelist') + 1])
objects = filelist.read_text().splitlines()
assert objects and all(Path(x).is_file() for x in objects)
archive = out / 'libPatternlyForegroundRegistrationProbe.a'
assert archive.is_file()
for variant in ['baseline', 'archive']:
    args = original.copy()
    for flag, suffix in [('-o', '.debug.dylib'), ('-object_path_lto', '_lto.o'),
                         ('-dependency_info', '_dependency.dat')]:
        assert args.count(flag) == 1
        i = args.index(flag) + 1
        if args[i] == '-Xlinker': i += 1
        target = out / (variant + suffix)
        assert not target.exists()
        args[i] = str(target)
    if variant == 'archive':
        copied = out / 'archive.LinkFileList'
        copied.write_text('\n'.join(objects + [str(archive)]) + '\n')
        args[args.index('-filelist') + 1] = str(copied)
    args += ['-Xlinker', '-map', '-Xlinker', str(out / (variant + '.map')),
             '-Xlinker', '-no_adhoc_codesign']
    (out / (variant + '-command.json')).write_text(json.dumps(args, indent=2))
    with (out / (variant + '-link.log')).open('wb') as log:
        result = subprocess.run(args, cwd=recipe['working-directory'],
                                stdout=log, stderr=subprocess.STDOUT, timeout=60)
    assert result.returncode == 0, variant + '_link_failed'
symbols = subprocess.run(['xcrun', 'nm', str(out / 'archive.debug.dylib')],
                         capture_output=True, timeout=30, check=True).stdout
(out / 'archive-symbols.log').write_bytes(symbols)
mapping = (out / 'archive.map').read_bytes()  # symbol bytes need not be UTF-8
assert any(b'libPatternlyForegroundRegistrationProbe.a' in line and b'registration.o' in line
           for line in mapping.splitlines())
assert b'_OBJC_CLASS_$_PatternlyForegroundHandleLinkRegistration' in symbols
assert b'+[PatternlyForegroundHandleLinkRegistration load]' in symbols
print('baseline_and_static_archive_registration_retention_pass')
PY
```

Preserve source/response/manifest hashes, original app object hashes before/after, exit codes, command modifications and output hashes in a private receipt. The 13 October check emitted the object, linked the baseline and archive variants successfully, and retained the registration class, `+load`, and HybridObject method; original app objects were unchanged. The map contained non-UTF-8 symbol bytes, so its fixed ASCII names were inspected as bytes after the completed link, without repeating that effect. No signing, install, launch or storage access occurred.

This establishes only linker/static-archive registration retention with the already verified **NitroMmkv consumer compile settings**. It does not establish public-header settings for a newly generated app-owned pod, Expo/CocoaPods discovery, Hermes execution/shared identity, thread safety, profile/session fences, checkpoint durability or the five-second recovery requirement. Those remain explicit next checks; there is no JS timer fallback or production integration in this fixture.
