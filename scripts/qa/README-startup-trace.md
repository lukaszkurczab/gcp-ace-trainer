# PERF-01 native startup trace

Use the existing iPhone 17 and installed Patternly development binary. No build,
install, reset, profile change or content swap is part of this measurement.
Preserve current profiles and active work. Keep private receipts out of Git.

From the application root, after checking that port 8082 is free, start a separate
operator-owned Metro with the existing smoke configuration and watch/HMR disabled:

```sh
CI=1 EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE=1 npm run start:smoke -- --port 8082
```

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
  http://localhost:8082 http://127.0.0.1:8082 > "$PRIVATE_TRACE_FILE"
```

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
`content_ready_commit` alone does not prove Home loaded. Do not press Resume just
to create a timer benchmark: a real active-session resume is separately scoped.

Pair spans with `span` when present; gate attempts can overlap/cancel. A closed
span does not imply success: use the corresponding fixed ready/blocking event.
Catalog spans are nested inside gate/materialization, so do not sum them as
independent costs. `regular_root_module` starts in `App()` around its dynamic
require; it excludes earlier App/Expo/bundle evaluation and native launch. Clock
values are process-monotonic, not wall timestamps. `Runtime.getHeapUsage` is one
observed JS heap sample (no forced GC); unsupported results are explicit, never
zero. Native RSS, peak heap, release HBC and total bundle evaluation remain
separate measurements. A bytecode query flag does not prove the response is HBC:
inspect its actual bytes. Do not infer release performance from this dev/smoke,
lazy Metro envelope, or use these measurements to weaken validation/durability.

Tests:

```sh
node --import tsx --test src/infrastructure/diagnostics/startupTrace.test.ts \
  scripts/qa/readNativeStartupTrace.test.mjs
```

Mock CDP tests establish collector guards/cleanup only. Actual Hermes readback is
required for a native measurement claim. After measurements, stop only the owned
app/Metro processes after checking identity; retain protected data and private
receipts. Disable the trace flag for ordinary development/release.
