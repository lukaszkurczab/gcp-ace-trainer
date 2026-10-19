# Foreground clock owner

The clock capability has iOS and Android native owners over the original
encrypted MMKV handle. The first section describes the iOS lifecycle; Android
setup and diagnostic tooling are documented below.

The iOS Nitro object receives the original encrypted `HybridMMKVSpec` from
`encryptedStorageNative`. The profile router supplies the physical T key.
The object does not open storage, read keys, register MMKV listeners, or call
JavaScript from its serial queue.

`apply` compares exact expected bytes before writing and verifies readback for
raw T envelopes, serialized by the native owner. This is a conflict fence, not
an atomic MMKV compare-and-swap primitive. It requires
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
shared-handle ownership and native kill/resume remain separate checks tracked through the
[canonical documentation entry point](../../AGENTS.md).

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

## Android tooling

`android/` implements the same capability over the original encrypted
`HybridMMKVSpec`. The Expo plugin installs the Kotlin/JNI lifecycle observer
before React Native starts. One mutex serializes T reads, expected-byte checks,
writes/readback, lifecycle and a native one-second checkpoint thread. The
conflict fence is read-before-write under the native owner mutex, not an atomic
MMKV compare-and-swap primitive. Cold arm creates no elapsed segment.
The implementation neither opens another production store nor registers MMKV
value listeners. Registering such listeners requires a new concurrency review
of the pinned SDK's listener registry.

In a frozen source checkout, generate Android with the validated sandbox
environment and checked Expo plugins. Use the configured JDK/Android SDK, then
run from its generated `android` directory:

```sh
./gradlew :patternly-foreground-clock:externalNativeBuildRelease \
  :patternly-foreground-clock:compileReleaseKotlin \
  :patternly-foreground-clock:bundleReleaseAar \
  -PreactNativeArchitectures=arm64-v8a --max-workers=1 --no-parallel
```

This checks SDK compilation/linking and library packaging, not the time-loss
limit. Inspect the EAS source archive before an authorized build: native module
sources must be included; generated Android files, build outputs, credentials
and private runtime must be excluded. Verify the resulting APK's package,
signature, frozen probe UUID, embedded bundle and native library before an
authorized in-place update. Never uninstall or clear app data for this probe.

The `android-clock-probe` EAS profile is a one-shot pinned profile for the
2026-10-17 evidence run. A new independent run must use a fresh UUID and a
separate private evidence directory; do not reuse its fixed namespace.

The diagnostic host is enabled only by an explicit Android/sandbox UUID build.
Use `scripts/qa/androidForegroundClockKillProbe.mjs` with `--adb`, `--run-id`,
`--output` and `--mode`. `inventory` is observational; `snapshot` requires an
already running production session. `stall-kill` blocks JS callbacks for up to
12 seconds, confirms the same foreground PID/birth, performs API33 system
user-stop and waits for normal cold-before-sync readback. `--kill-delay-ms`
selects the requested offset; `--background-ms` adds Home/resume while JS is
blocked. Loss bounds use actual host intervals, including transport uncertainty.
An uncertain effect must not be retried automatically.

Production stalls first perform `prepare-stall`: full advancing-session validation
and inventory happen before the timed request. A matching, one-use preparation
expires after ten seconds (diagnostic freshness only; the product loss limit remains five seconds) and is invalidated by AppState changes. Consumption
rechecks profile lease, owner, journal, immutable S content and all other keys,
then samples the native clock last. The timed request uses an atomic rename of
a complete case/run/protocol JSON file in this run's private receipt directory,
written and renamed in one `run-as sh` stdin command. A bounded 50ms reader deletes and verifies the
matching request before consumption. It refuses malformed/mismatched files
without deleting them. This avoids the real background/active transition caused
by a second Android URI launch. Expiry or a changed scope refuses before
stalling; it never reconciles or retries a write. Fixed refusal categories distinguish request IO, scope ownership, session, keyset and value changes without copying data. The driver records both the
preparation ACK and actual timed intervals; the loss equation remains unchanged.
A wide transport interval is INCONCLUSIVE, never a relaxed five-second limit.
The earliest cold observer runs synchronously at profile-storage readiness,
before lifecycle composition can reconcile S or arm T. Its receipt records
`profile_ready_before_lifecycle`; a refused observation is explicit and does
not fall through to a later read. Diagnostic receipt failures cannot close the
production profile. Cold and cleanup receipts include old and fresh PID/birth.

`inventory` also observes validated account/profile/sync scope and paired stable
control slots without adopting, transferring, signing out or resetting. It emits
only named slot hashes and validated metadata, never credentials or record text.
An enabled private UUID may include bounded startup timings. Compare a fresh
baseline with the same actor and session; an older aggregate digest alone cannot
attribute historical changes.

For separate encrypted SDK fixtures, use `fixture-seed-elapsed` or
`fixture-seed-countdown`, then `fixture-enter`, followed
promptly by `stall-kill --subject fixture`. Seeding requires a production owner
with an explicitly paused T and two unchanged samples from its already armed
native owner, stable T/session/profile and no lifecycle transition. A cold arm
may retain `running=true` without a segment; that is insufficient for seeding;
the probe never pauses or rewrites production T. Cold launch restores only the owned
fixture; it never seeds a missing store. Other bounded commands are
`fixture-seed-cap`, `fixture-seed-overrun`, `fixture-pause`, `fixture-conflict`
and `fixture-cleanup`. Cleanup revokes the capability and writes an owned pending marker. The driver
confirms process death, then cold startup deletes the exact fixture ID before
opening any fixture handle and verifies its data/CRC pair is gone. This avoids
the pinned SDK's retained AppState callbacks calling a deleted MMKV instance.
Completion requires the case-scoped cold cleanup receipt; invalid markers refuse
both deletion and fixture restoration. Preserve original profile/control
inventories throughout. This fixture is not proof of production S/journal
finalization, SDK disk faults, power loss, or all Android/OEM variants.

For a local diagnostic correction, freeze the original source plus reviewed
overlay in a separate directory with real `node_modules` (external symlinks
change Android resource names). `scripts/qa/embedAndroidClockProbe.mjs` accepts
`--project`, a fresh private `--output`, private `--env-file`, explicit `--run-id`
and expected sandbox `--fingerprint`. It uses the pinned Expo/Hermes toolchain,
resolves App inside that snapshot and keeps logs/maps private. It calls no EAS
build and modifies no device.

`deriveAndroidClockProbeApk.py` accepts the original `--base-apk` and its
`--expected-base-sha256`, exported `--bundle`/`--assets`, the reviewed
`--expected-resource-count` and a new unsigned `--output`. It allows only the
Hermes bundle payload to change by default, verifies resource mapping (including equivalent
Android PNG crunching with pinned `pngjs`), and compares all other APK entry
bytes. It neither reads credentials nor installs. Use Android SDK `zipalign
-P 16 4`, then `apksigner sign` with the existing private keystore; pass passwords
through the tool's `env:` options. Verify alignment, signature/certificate, package,
manifest, native-library hashes and changed-entry scope again after signing.
Only then use an authorized `adb install -r`, without clearing data. The result
is a local diagnostic derivative of the named EAS artifact, with its own hash;
it is not the original EAS APK or a release artifact.

For a historical production countdown receipt missing only `countdownMs`, run
`node scripts/qa/adjudicateAndroidCountdownProbe.mjs <private-case-directory>`.
It requires an exact unchanged S envelope/content digest and matching configuration,
profile, run and start; confirmed controlled process death and early cold read; and
T-only inventory changes. It derives only the constant duration, writes a separate
0600 `adjudication.json`, and never edits original receipts or raises the loss limit.
New cold receipts contain the duration directly. Rejection cases are covered by
`node --test scripts/qa/adjudicateAndroidCountdownProbe.test.mjs`.

The Android fixture fault hook is absent by default. To compile both variants
locally against the matching frozen SDK prefabs, use:

```sh
python3 scripts/qa/buildAndroidClockFixtureOwner.py \
  --sdk <android-sdk> --prefab <matching-arm64-prefab-directory> \
  --output <new-private-output> --run-id <explicit-probe-uuid>
```

The pinned NDK/CMake recipe records source/library hashes and private compiler logs;
it does not install or sign. The UUID-gated variant permits five synchronous,
one-shot experiments under the owner mutex, only against the exact encrypted
fixture ID/key/session/generation and active segment. Use `fixture-fault-read`,
`fixture-fault-write-before`, `fixture-fault-write-after`, `fixture-fault-readback`
or `fixture-fault-backward` after an ordinary fixture seed/enter. The first small
real probe must establish device binding before running the remaining scenarios.
The driver verifies fault latch/no retry, original PID/birth through stop, fresh
cold process, exact post-fault T digest and unchanged production inventory.
For fault pairs only, a changed v2 Premium cache may be classified as
`premium_observation_refresh`: both full records must validate against the same
verified account/profile/UID, and every snapshot field except the two observation
timestamps must hash identically. Observation times and the wall-time fence must
not decrease; a fence increase is bounded by the prior maximum, server time or
captured wall time plus 1 second. Raw cache hashes remain in both receipts.
Invalid bindings fail even with identical inventory; normal verified binding
revision advances are reported separately. Every other key remains byte-strict.
Production prepared-stall guards and the general preservation comparator retain
their original strict checks. Run the diagnostic comparator/readiness tests before
using a new diagnostic derivative; a prior unannotated failure is not retroactively
reclassified. Fixture cold capture rechecks exact T after the async binding read.
Cleanup still requires its confirmed cold receipt. These are injected owner
call-boundary exceptions and an injected backward monotonic sample, not physical
MMKV disk failure, power loss or an observed hardware clock regression.

For that private fixture APK only, the derivative tool also accepts the all-or-none
`--native-library`, `--expected-native-sha256`, `--expected-base-native-sha256`, and
`--readelf` options. It permits only the fixed arm64 foreground-clock library,
checks ELF64/AArch64 identity and identical SONAME/dependencies, and preserves all
other entries and resources. An identical bundle is permitted only with an explicit
native replacement. Runtime ABI compatibility still requires the signed device
probe. Preserve the original library APK and restore it in place after cleanup.

For ordinary Exam/Design absolute-deadline sessions, the private observer also
records immutable start/config/deadline and a separate `deadlineSessions` result
projection. The early cold stage `absolute_deadline_before_lifecycle` requires no
T or journal and does not finalize anything. A later inventory and repeated cold
start must separately establish terminal-result idempotency.

After an actual small device capability probe has confirmed millisecond clock
setting and restoration, reproduce a bounded wall step with:

```sh
python3 scripts/qa/androidDeadlineWallClockProbe.py \
  --adb <adb> --run-id <explicit-probe-uuid> \
  --expected-apk-sha256 <installed-diagnostic-apk-sha256> \
  --output <new-private-case-directory> --offset-ms 1000
```

Repeat with `--offset-ms -1000` in a separate case. The tool accepts only those
steps, an ordinary active Exam/Design session over 60 seconds from deadline, and
an initially automatic clock. It checks both canonical/session projections,
observes the actual wall/uptime discontinuity, captures unchanged S/config/start/
deadline during the step, then restores projected prior wall time and automatic
time in `finally`. Inventory deltas outside that deadline proof remain explicit
for preservation review. Host termination or ADB loss can bypass restoration:
check wall time, `auto_time` and `auto_time_zone` immediately after interruption.
If only the final passive snapshot refuses while the clock has already been
verified restored, `--resume-restored` validates the preserved before/during
receipts and performs only the missing post-read. It writes a separate exclusive
`adjudication.json`, never repeats the clock step or rewrites the original proof.
Each controller sends one VIEW intent per observation. Inside that same request,
the app waits for correlated identity-refresh spans to settle and retries only
changed read observations against one captured lease/profile, sequentially within
five seconds. A stale lease/profile, malformed trace or SDK error refuses the
read; success at the read deadline also refuses. No VIEW retry reopens the proof
barrier.
No large jump, duration override, manual deadline edit or reset is part of this
recipe. Natural duration and two post-deadline cold observations are still needed.

For the natural absolute-deadline restart, use `androidDeadlineRecoveryProbe.py`
with the same adb/run/APK/output arguments, `--expected-occurrences <UI count>`
and `--action stop`. It requires an active ordinary Exam/Design session over one
minute from its unchanged deadline and confirms process death. After the real
deadline, `--action recover` cold-starts and verifies the early stored deadline,
then waits passively for 30 seconds before one terminal observation with zero
supplied answers and no S/D/T/journal. That delay is a test observation choice,
not a product latency guarantee. Use
`--action repeat` afterward for a second cold terminal-idempotency check. Reuse
the same private output for those two follow-up actions. The tool refuses early
recovery; it never changes time, duration or deadline and does not schedule a
wakeup. Raw inventory and binding metadata still require their scoped preservation
review. Canonical envelope revision/digest may rebase during account materialization;
semantic terminal/result identity must remain exact.

An `invalidated` account binding is not a timer verdict or proof of harmless
materialization. Preserve the failed receipt and use only the ordinary positive
identity-proof bootstrap; never write or restore a binding manually. If that
later cold verifies the same account/UID and retains the exact terminal result,
`node scripts/qa/adjudicateAndroidDeadlineRecovery.mjs <private-input.json>
<new-adjudication.json>` can correlate the existing receipts without device
operations. Input paths are `interruption`, `before`, `cold`, `firstTerminal`,
`firstFailure`, `reproofCold` and `reproofTerminal`; marker cases must retain their
APK-before/after receipts. `firstFailure` records the original recovered PID/birth,
APK, failure category, terminal rows and `noManualBindingWrite`; `reproofCold`
records the next ordinary cold receipt and fresh PID/birth. Keep those observations
private. The tool checks distinct processes, exact identities/deadline/result,
counts and absence of S/D/T/journal. It explicitly retains the first binding gap;
it does not establish continuous verified identity. A further guarded repeat can
use `--action repeat --prior-adjudication <path>` and retains that qualification.

For an authorized local JS correction, use the frozen diagnostic source and its
locked Expo/Hermes dependencies; preserve the sandbox environment fingerprint,
entry point and exact content/legal pins. Export with the existing Expo CLI
`export:embed --platform android --dev false --bytecode --max-workers 1`, explicit
private bundle/assets paths and `--sourcemap-output`. Review the source-map delta
before packaging. The non-secret packer makes the single runtime change explicit:

```sh
python3 scripts/qa/prepareAndroidClockJsDerivative.py \
  --base-apk <retained-signed-base.apk> --expected-apk-sha256 <exact-base-sha256> \
  --bundle <private-Hermes-bundle> --native-owner-sha256 <original-arm64-owner-sha256> \
  --output <new-unsigned.apk>
```

It retains every other ZIP entry except actual signature metadata and rejects a
changed native owner or bytecode format. Align with the pinned Android SDK's
`zipalign -P 16`, sign with the already approved private keystore, then run
`apksigner verify --verbose --print-certs` and compare the exact expected signer.
Do not print passwords or put credentials in this repository. Invoke the packer
again with the same base/bundle/owner arguments plus `--signed-apk <candidate.apk>`
and `--output <new-runtime-verification.json>` to verify all post-signing runtime
bytes. This second mode only reads APKs and writes the new receipt. These artifact
checks do not replace device acceptance or authorize another EAS build/install.

Current acceptance results and the sole plan/state follow [AGENTS](../../AGENTS.md).
