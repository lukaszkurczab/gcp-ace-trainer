# PERF-01 native startup trace

Use the existing iPhone 17 and installed Patternly development binary. No build,
install, reset, profile change or content swap is part of this measurement.
Preserve current profiles and active work. Keep private receipts out of Git.

From the application root, after checking that port 8082 is free, start a separate
operator-owned Metro with the existing smoke configuration and watch/HMR disabled:

```sh
CI=1 EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE=1 npm run start:smoke -- --port 8082
```

The standard smoke launcher requires already-running local Auth/API dependencies.
For a local startup measurement with unavailable dependencies, do not start
services merely to satisfy that launcher precheck. Load the validated matching
environment privately, set `EXPO_NO_DOTENV=1`, and
invoke the same Expo CLI directly with `CI=1`, trace=1, watchman disabled,
`start --localhost --port 8082`. This changes only the operator's launch precheck;
all in-app environment/storage/account guards remain active. Never overwrite the
normal local profile or assign its data to a different fingerprint for this test.

Read the local Expo manifest before launch and record its entry/configuration.
Use the existing binary with `-RCT_jsLocation localhost:8082`; launch/terminate
only within the authorized device/app scope and verify process ownership first.
Record the current app source diff/hash, content lock, dependency locks, binary
hash, manifest and served bundle hash/bytes. A Metro cache warmed by a bundle
request must be distinguished from a cold application process. Capture private
container hashes before and after; classify all changes. For semantic inventories
use existing read-only storage owners; this collector never opens storage.

Once the single intended app target is ready, read the trace:

```sh
node scripts/qa/readNativeStartupTrace.mjs \
  http://localhost:8082 http://127.0.0.1:8082 \
  com.lkurczab.patternly.sec03 > "$PRIVATE_TRACE_FILE"
```

The optional third argument is the exact installed app ID; omission expects
`com.lkurczab.patternly`. Both IDs are explicitly allowlisted; there is no fallback.
Use a configuration whose fingerprint matches the installed binary and data.
If the regular local smoke file differs, use the retained matching configuration;
do not reassign data, bypass the fence or reinstall to obtain a measurement.
The first argument is the actual listening Metro origin. The second must match
Expo's `serverBaseUrl` Origin guard (the launch asset in the manifest shows
127.0.0.1 in the measured local environment). Both must be loopback HTTP origins
with the same explicit port. Do not disable Origin protection. The collector
rejects multiple targets, another app/device, remote inspector URLs, invalid
trace data and transport failure. It closes its private debugger connection and
does not launch, reload, mutate storage/lifecycle or terminate the application.
The bounded inspector read copies and serializes up to 512 entries on the JS
thread after readiness; it can briefly occupy that thread. Set the output
file/directory to 0600/0700 before use; only bounded stages, numeric times/spans,
and heap sizes are emitted. No profile data, IDs, raw errors or credentials.
A truncated trace exits nonzero and cannot establish complete timings.

Cold: terminate only the owned process, launch the same binary and read after
Home data commit. Warm: send the app to background (for example by opening the
existing Settings app), then foreground the same PID without reload and read the
same trace; `app:background`/`app:active` identify lifecycle delivery. They do not
measure OS animation/first paint latency. `home_data_commit` is the successful
Home data React effect; corroborate visible Home with a private screenshot.
`content_ready_commit` alone does not prove Home loaded. `home_usable_layout`
observes the loaded Home's Change control with an available primary action and
no dashboard/plan error. Use the later of this event and `home_data_commit` for
the measured Home readiness boundary; corroborate actual visibility separately.
It does not measure native presentation/first paint. A real Resume measurement
must be explicitly scoped: preserve the current actor, use an existing session
or one normal unanswered Free session, never reset/newGuest or submit for setup.
`resume_action` is Home's real dispatch; the next `practice_usable_layout` observes
an unanswered, editable, supported prompt with runtime identity and no exit modal.
Check visible answer controls for the exact route; this event alone does not prove
every custom response renderer works. Pause through normal UI and retain the
session. Record allowed session/timer changes separately from prior progress.

Pair spans with `span` when present; gate attempts can overlap/cancel. A closed
span does not imply success: use the corresponding fixed ready/blocking event.
Catalog spans are nested inside gate/materialization, so do not sum them as
independent costs. `regular_root_module` starts in `App()` around its dynamic
require. The readback also includes existing RN native startup getters,
`__BUNDLE_START_TIME__`, and a native-before/performance/native-after clock bracket.
Each unavailable timestamp is `null`. Compare clocks only after the real bracket
has confirmed their relation; never subtract a Date.now fallback from native time.
RN execute-start → prelude is an inclusive engine-entry interval, not isolated
compile time. Prelude → RN end includes initial registration/polyfills/Expo/App
evaluation. RN end → regular-root begin is later environment/React scheduling;
regular-root begin/end includes imported modules and dev lazy requests. These
boundaries do not isolate individual JSON modules or exclusive CPU. RN startup
getters belong to the original cold process and remain unchanged during warm. Clock
values are process-monotonic, not wall timestamps. `Runtime.getHeapUsage` is one
observed JS heap sample (no forced GC); unsupported results are explicit, never
zero. Native RSS, peak heap and release HBC remain separate measurements.
A bytecode query flag does not prove the response is HBC:
inspect its actual bytes. Do not infer release performance from this dev/smoke,
lazy Metro envelope, or use these measurements to weaken validation/durability.
If Metro listens on IPv6 localhost while its launch URL advertises 127.0.0.1,
fetch the same path/query through the actual listening origin and record both
URLs. Keep the inspector's manifest Origin guard unchanged.

After timing collection, a separate preservation probe uses only already
initialized canonical storage/content owners, a current profile lease, and their
complete Q13 census. It emits fingerprints, static families and public content
pins, without raw profile IDs/keys/answers. It never opens another store:

```sh
node scripts/qa/readPerf01Preservation.mjs \
  http://localhost:8082 http://127.0.0.1:8082 \
  com.lkurczab.patternly.sec03 > "$PRIVATE_PRESERVATION_FILE"
```

This probe requires the scoped active session. Compare per-key hashes and the
canonical attempts/reviews/session proof; a changed aggregate learningProgress
hash alone cannot distinguish allowed active-time writes from lost progress.
`pinsSha256` hashes the whole session except `activeForegroundMs`, including item
and option order, exact content refs, status and current position. Unknown keys,
unavailable owners/inventory or profile cutover fail explicitly. Capture file
hashes before opening the app and after stopping it as a separate physical check.

Tests:

```sh
node --import tsx --test src/infrastructure/diagnostics/startupTrace.test.ts \
  scripts/qa/readNativeStartupTrace.test.mjs
```

Mock CDP tests establish collector guards/cleanup only. Actual Hermes readback is
required for a native measurement claim. After measurements, stop only the owned
app/Metro processes after checking identity; retain protected data and private
receipts. Disable the trace flag for ordinary development/release.

For the measured `catalog_tracks` cost, `planning_policy` and `pool_construction`
separate its two synchronous components (nine begin/end pairs per startup).
They remain nested timings. Reproduce the CPU-only validator benchmark from the
app root with Node22 and the existing tsx dependency:

```sh
node --import tsx scripts/qa/measureCanonicalPlanningPolicy.mjs
```

It uses all nine current locked artifacts and actual validated product modes,
three warmups and fifteen samples. It checks input immutability and stable exact
output hashes, and reports per-track samples plus total median/p95. Compare
before/after input and all output hashes. This does not measure Hermes startup,
storage, heap or native UI, and never writes device data.

`mode_artifact_questions` isolates the existing question-identity scan inside
product-mode validation. Counts correspond to actual scans, once per exact
artifact object per validation call (nine for the current catalog); its total is
nested in `catalog_projection`. Every per-mode pool check still runs.

For a CPU-only comparison of this boundary on all nine current locked artifacts:

```sh
node --import tsx scripts/qa/measureProductModeValidation.mjs
```

The runner uses the runtime projection shape, three warmups and fifteen samples,
and reports scan/whole-validator times, scan counts, dataset/input/output hashes
and the validator source hash. Compare identical inputs and outputs before/after.
It checks input immutability and never accesses device data. Node timings do not
establish Hermes startup, heap, offline UI or native Resume behavior.
