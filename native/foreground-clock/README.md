# Foreground clock owner

The iOS Nitro object receives the original encrypted `HybridMMKVSpec` from
`encryptedStorageNative`. The profile router supplies the physical T key.
The object does not open storage, read keys, register MMKV listeners, or call
JavaScript from its serial queue.

`apply` owns exact before/after CAS and readback for raw T envelopes. It requires
a stopped segment and invalidates the runtime arm, including exact-after replay.
`arm` admits a specific session without restoring a monotonic segment from the
persisted running marker. The repository must validate track admission and date
semantics before arming or restoring a record. `enter` starts admitted work;
`checkpoint` persists it; `pause` stops it; `quiesce` also handles an unarmed or
absent T before journal/reset/backup capture. `revoke` drains and closes the grant,
even when acknowledgement is uncertain. The storage wrapper retains its fence
when revoke fails and refuses to repeat the effect.

Global UIKit observers record a single native cutoff/resume timestamp before
draining a snapshot of weak owners. The registry mutex is released before any
owner queue is entered. Background checkpoint preserves only volatile admitted
run intent; cold arm never infers elapsed work while the process was closed.

Elapsed work uses a monotonic clock. Checkpoint anchors retain fractional
milliseconds and synchronous write cost. Countdown limits new work while
preserving older durable overruns. A late checkpoint is an explicit fault;
detecting it does not prove the five-second data-loss requirement.

The local JSON podspec is declared by Expo build properties `extraPods`.
Do not edit generated Xcode files or SDK sources to integrate it. Pinned Nitro
and MMKV versions match the checked application dependencies.

Run the host codec/segment/router-key contract from the application root:

```sh
node --import tsx --test scripts/qa/nativeForegroundClockContract.test.ts
node --import tsx --test src/infrastructure/storage/foregroundClockCapability.test.ts src/infrastructure/storage/encryptedStorageNative.test.ts
```

The first test compiles and executes Foundation/C++ on macOS and explicitly
skips other hosts. These tests do not execute UIKit, Nitro, MMKV, the native
scheduler or recovery after process interruption. Actual pod target build,
shared-handle ownership and native kill/resume remain separate checks described
in [the PERSIST-11 report](../../docs/reports/persist11-probe-2026-10-12.md).

For the actual CocoaPods boundary, generate iOS in an isolated source checkout
using the existing application configuration, retain the checked dependency lock,
and run the following from that checkout's `ios` directory. Keep build output
and logs private, use the configured Node 22, and run one heavy check at a time.
This builds a simulator library; it does not install or launch an application.

```sh
pod install --no-repo-update
xcodebuild -project Pods/Pods.xcodeproj -target PatternlyForegroundClock \
  -configuration Debug -sdk iphonesimulator -jobs 2 \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO \
  COMPILER_INDEX_STORE_ENABLE=NO build
```

The toolchain needs its standard CocoaPods/React Native and Xcode session caches.
In restricted environments, grant access to those caches rather than changing
the dependency checks or generated SDK sources. A successful pod target build
checks public headers and compilation, but still does not establish application
link retention, runtime ownership, scheduler behavior or the five-second limit.

For a whole-application link check, use the same isolated checkout and validated
local smoke environment, then build from its `ios` directory without installing:

```sh
xcodebuild -workspace Patternly.xcworkspace -scheme Patternly \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -jobs 2 \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO \
  COMPILER_INDEX_STORE_ENABLE=NO build
```

Record source-overlay hashes and inspect the produced app and debug dylib for
the registration class. Debug JavaScript must come from that exact checkout;
this command alone does not freeze or run a JavaScript bundle. Compare actual
bundle identity, architecture, deployment target and keychain entitlements with
the existing app before proposing replacement. Absence of explicit entitlements
is an observation, not proof that SecureStore will remain readable.

The command above is a compile/link check only. `CODE_SIGNING_ALLOWED=NO`
omits Xcode's simulated entitlements in the app's Mach-O `__TEXT,__entitlements`
section. A subsequent manual ad hoc signature, even with an empty signature
entitlement document, does not restore that section. The 13 October candidate
failed Keychain access with `errSecMissingEntitlement`; copying the old empty
signature entitlement document did not fix it. Do not use this recipe as a
runtime candidate or infer Keychain continuity from `codesign` XML alone.

For a runtime candidate, let Xcode generate the simulator metadata and sign
locally, using the existing project identity and validated smoke environment:

```sh
xcodebuild -workspace Patternly.xcworkspace -scheme Patternly \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -jobs 2 \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=YES \
  CODE_SIGN_IDENTITY=- COMPILER_INDEX_STORE_ENABLE=NO build
```

Do not pass provisioning-update flags or introduce signing credentials. Inspect
both the actual signature and Mach-O simulated entitlement section. Compare the
application identifier and declared entitlements with the retained installed
app; do not invent access groups or add permissions. Verify the entire app with
`codesign --verify --deep --strict <app>` and record final hashes. Build and
metadata checks do not establish actual Keychain access or data preservation.
Installation and first launch still follow the authorized scope and preservation
procedure; no uninstall, reset, new Guest or data repair is part of this check.

When the isolated checkout shares a symlinked `node_modules`, SDK `expo/AppEntry`
can resolve `../../App` into the primary checkout. The observed bundle then had
two storage modules and included unrelated primary edits. Before any launch,
copy the pinned SDK entry into the isolated project and change only its App
import from `../../App` to `./App`; point that private package's `main` to it.
Retain `registerRootComponent(App)` exactly and leave production files alone.
Check the actual sourcemap: one frozen app/provider/storage owner, no primary
app sources. Keep sourcemaps and configuration private. A source provenance
check is separate from runtime acceptance.

A bounded read/bind/arm check on the normal initialized smoke application is:

```sh
node scripts/qa/nativeForegroundClockReadback.mjs http://127.0.0.1:8082
```

It requires the existing active session and timer to have equal accumulated
foreground time, uses initialized production owners, and returns only sanitized
status. It does not enter a segment, checkpoint, initialize a facade, or open a
second store. Success requires unchanged T, native authority, matching elapsed
time and zero clock metrics. Compare the complete protected inventory afterward.
This checks the actual encrypted-handle boundary; scheduler writes and recovery
require their own controlled interruption measurements.

For an explicitly authorized count-up interruption test on the existing Guest
session, compile a fresh UUID into the private smoke Metro environment as
`EXPO_PUBLIC_PATTERNLY_FOREGROUND_CLOCK_RUN_ID`. A normal cold start captures
one memory-only receipt from validated T/S immediately before reconciliation.
Read it with the current run, profile hash and session hash:

```sh
node scripts/qa/nativeForegroundClockColdReadback.mjs \
  http://127.0.0.1:8082 <run-uuid> <profile-sha256> <session-sha256>
```

The first pre-effect receipt must have equal T/S time. Keep complete private
before/after Guest and profile inventories. The following tool advances only
the current authorized Guest count-up timer, blocks JavaScript for up to 12 s,
and sends SIGKILL to the verified app process about 5.5 s after its native-enter
marker. It does not cold-launch the app or declare acceptance:

```sh
node scripts/qa/nativeForegroundClockKillProbe.mjs \
  <current-app-pid> <installed-binary-sha256> <run-uuid> \
  <profile-sha256> <session-sha256> --owner-authorized
```

Use only the existing iPhone 17 and the exact installed binary. The tool checks
PID/executable/hash immediately before signaling. A known refusal before enter
preserves the process; an uncertain enter gets at most one verified cleanup
kill. A failure is not timing evidence and must not be retried blindly. Save
receipts in a private 0700 folder with 0600 files, not tracked artifacts.

After confirmed death, normal cold-launch the same application once, without
Resume/enter, and read the new pre-sync receipt. Use `lossBounds` from the runner
with the killed-process measurement and recovered receipt. It includes host
request/event/kill/death uncertainty and native integer quantization; it requires
periodic checkpoints beyond enter, the original pre-sync session time, and a
persisted running marker. Only a conservative loss upper bound at most 5000 ms
and the authorized preservation comparison establish this bounded result.
Countdown, other interruption offsets, background/foreground, I/O failures and
ordinary UI projections remain separate checks. No clock-effect test is implied
by build, read/bind/arm or synthetic timing tests.

The standalone synthetic countdown fixture is a separate bounded SDK/driver
check. It uses one public test key and one `patternly-clock-fixture-<run-uuid>`
MMKV ID, never the protected profile store or Keychain. It cannot prove
production countdown configuration, expiry/facade wiring or key management.
The canonical SDK still uses `recover-on-error`; this is not a torn-file or CRC
recovery test. A partial data/CRC pair or any own-ID sidecar blocks opening.

With the owned app and Metro stopped, copy `fixtures/probe.js` into the frozen
private checkout and set only that checkout's `package.json.main` to
`./native/foreground-clock/fixtures/probe.js`. Save its prior package metadata
privately for restoration. Use a fresh UUID and separate 0700 evidence directory
for each phase; the launcher creates 0600 ownership metadata and logs.

```sh
node scripts/qa/startNativeForegroundClockFixture.mjs \
  seed countdown <run-uuid> <absolute-private-checkout> <absolute-private-phase-root>
node scripts/qa/nativeForegroundClockFixtureReadback.mjs seed countdown <run-uuid>
```

Before launching the same installed application, inspect the actual Metro
sourcemap: one fixture entry and canonical storage owner, no primary checkout
application sources, regular App/account providers or `mmkvClient` runtime.
Record binary hash and complete private before/after app-file hash inventories.
The first SDK probe is seed/read/arm only: encrypted storage, elapsed equals
durable time, zero checkpoint count and no enter. Require protected MMKV bytes
unchanged and exactly the fixture data/CRC pair added; classify other SDK/OS
file changes. Do not advance to a timed test after an uncertain result.

Cold `recover` and final `cleanup` require explicitly restarting owned Metro
with the same UUID/scenario and their respective mode. There is no missing-store
seed fallback. Cleanup verifies exact one-T-key ownership, revokes/drains the
clock, deletes only the synthetic store and checks SDK plus physical absence.
Restore the saved private package entry, return to the normal app and compare
the complete protected logical inventory against the post-countup baseline.
Neither fixture readiness nor successful cleanup establishes the five-second
requirement; interruption timing, cold recovery, cap/overrun and background
measurements need their own accepted evidence.

For a fresh cold fixture instance with an empty lifecycle buffer, run the bounded
AppState procedure with its current PID and verified installed binary hash:

```sh
node scripts/qa/nativeForegroundClockFixtureAppStateProbe.mjs \
  recover countdown <run-uuid> <current-pid> <binary-sha256> <absolute-private-phase-root>
```

It enters once, presses Home through the checked Maestro flow, waits in real
background, activates the same PID with simctl, waits read-only for the pending
JS active callback, and pauses explicitly. Two bounded read exchanges correlate
Hermes and host monotonic origins. Acceptance requires at least 5000 ms of
guaranteed background time, native stopped/resumed snapshots and a resume delta
within the conservative host foreground/read window. Extra or malformed events
fail; an uncertain effect gets one owned kill with confirmed death. Failure
receipts contain only fixed categories and sanitized event counts/states.

For the standalone countdown interruption driver:

```sh
node scripts/qa/nativeForegroundClockFixtureKillProbe.mjs \
  <current-pid> <binary-sha256> recover countdown <run-uuid> <kill-delay-ms>
```

Save the output privately, cold-launch once in explicit recover mode, then use
`fixtureLossBounds` with the new cold receipt. Delays are requested offsets;
report the actual marker-to-kill interval and native checkpoint count. The live
marker may be ahead of the durable enter checkpoint at an early kill. Longer
runs require a post-enter checkpoint. Use a separate fresh `cap` scenario to
verify exact duration and stopped cold state; this saturated case is not the
measured active countdown loss result. `overrun` is read/arm-only and is rejected
by the interruption runner. Never alter the protected Guest timer configuration.

The native IO harness compiles the delivered owner translation unit once with
a memory-only subclass of the pinned MMKV interface. Five injected read/write/
readback failures check exact uncertain effects, fault latching, no retry and
revocation. It does not open MMKV, filesystem data or Keychain. With existing
matching pod build outputs and their C++ response file, reproduce it as follows:

```sh
node scripts/qa/runNativeForegroundClockIoContract.mjs \
  <absolute-private-pod-build-root> <absolute-cxx-response-file> <absolute-private-phase-root>
```

Use a fresh 0700 output directory. The tool retains 0600 compiler logs and
source/hash/command receipts. It compiles pinned JSI source statically because
this executable does not need a JS engine; loading a separate Hermes framework
was rejected by the simulator loader. The test runs only on the existing iPhone
17 and installs no app. This models SDK exceptions in the actual native owner;
it does not claim physical disk faults, torn-write recovery or power-loss
durability of MMKV. The independent encrypted SDK interruption runs cover the
real process-death boundary separately.
