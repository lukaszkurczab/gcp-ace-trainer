# Q13 native provenance probe design review

**Verdict: PASS WITH GAPS.** The bounded LLDB probe is a reasonable way to establish whether this Expo Updates build exposes the native launch identity needed for Q13, before spending effort on historical Release builds or installs. It does not itself prove which OOD artifact is executing or establish Q13 acceptance.

Scores: objective/architecture fit **0.94**, simplicity **0.92**, risk **0.82**, maintainability **0.90**; minimum **0.82**.

The inspected Expo Updates source supports the proposed guarded access. `AppController.isInitialized()` only tests whether its singleton exists; `sharedInstance` asserts if accessed before initialization. The Debug Dev Launcher exposes optional `launchedUpdateId` and `embeddedUpdateId` UUIDs, while its module constants deliberately set `embeddedUpdate` to nil. Treat nil values as a valid diagnostic result, not proof of an embedded launch. Do not inspect constants, manifests, request headers, environment, paths, or storage.

For an Enabled Release controller, the two UUID getters read the launched update and embedded update identities. `UpdatesModuleConstants.toModuleConstantsMap()` defines `isEmbeddedLaunch` as `embeddedUpdate != nil && embeddedUpdate?.updateId == launchedUpdate?.updateId`. Thus equality is meaningful only with both UUIDs non-null. `embeddedUpdateId` calls `getEmbeddedUpdate()`, which reads and parses the app-bundled embedded manifest and caches the resulting update in a static in-memory property. The inspected path does not write the app database or profile storage. A missing or malformed embedded manifest raises a fatal error, so call the getter only after a successful normal launch and only after the singleton has passed the `EnabledAppController` type guard.

The Debug capability probe must wait until the max-text UI work has finished. Attach briefly, check `isInitialized()` before touching `sharedInstance`, require the expected `DevLauncherAppController` type, read only the two optional UUID getters, and detach in a `finally` path on success and failure. Confirm LLDB reports detachment and that the app continues running before proceeding. A crashed LLDB process or lost debugger connection cannot guarantee that cleanup path ran; if detach or app resumption is uncertain, stop and recover the foreground app before any further test. Do not issue `process kill`, mutate app state, or continue after an ambiguous detach.

The Release check requires an explicit configuration guard. `app.config.js` disables Expo Updates when `PATTERNLY_RUNTIME_MODE=release`; that configuration selects a disabled controller, not `EnabledAppController`. The local `smoke` profile configures an Updates URL without setting `enabled: false`, so an Xcode Release build made with the existing smoke profile is the candidate to verify. Require the initialized singleton to be exactly the expected Enabled controller; if it is disabled or another type, stop without overrides or configuration edits. Continue to require non-null UUID equality and bind the embedded UUID to the exact built `.app` embedded manifest and JS bundle hash for v23 or v24. UUID equality alone proves the SDK's embedded-launch predicate, not the source revision, artifact hash, or active-session pin.

No build, install, LLDB attach, device action, source/config edit, or profile read/write was performed for this review. Build/install remains gated on this review and a successful bounded Debug capability probe.

## Repository evidence

- `node_modules/expo-updates/ios/EXUpdates/AppController.swift:199-208, 217-228, 272-290` — `isInitialized()`, guarded singleton, Debug controller selection, and Enabled/Disabled controller creation.
- `node_modules/expo-updates/ios/EXUpdates/DevLauncherAppController.swift:46-56, 333-347` — optional IDs and no embedded update in Debug module constants.
- `node_modules/expo-updates/ios/EXUpdates/EnabledAppController.swift:216-222, 238-250, 325-327` — Release identity getters and embedded manifest access.
- `node_modules/expo-updates/ios/EXUpdates/AppController.swift:58-74` — the exact native `isEmbeddedLaunch` predicate.
- `node_modules/expo-updates/ios/EXUpdates/AppLoader/EmbeddedAppLoader.swift:52-56, 100-137` — embedded manifest read, validation, `Update` construction, and in-memory static cache; malformed content raises/fatals.
- `app.config.js:169-172` and `scripts/runLocalProfile.mjs` — release runtime disables Updates while smoke is the local profile candidate; runtime profile and Xcode build configuration must be recorded separately.
- `docs/active/BIZQ-01/premium-completion-33/Q13-BRIEFING.md` — Q13 scope, exact OOD23→24 pair, and no-build-before-provenance constraint.
- `docs/active/BIZQ-01/native-partial-29/Q13-ACTUAL-UPDATE-PREFLIGHT.md:11, 18, 48-64` — exact-pinned-session behavior, accepted build pair, same-app install feasibility, and remaining device/runtime uncertainty.
