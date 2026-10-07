# Q13 test-build attestation design review

**Verdict: PASS WITH GAPS.** The isolated test-build attestation is a proportionate alternative to native Expo Updates getters. A unique compile-time nonce in a private cache receipt binds the JavaScript that actually ran to the exact-ref test build; a wrapper at the existing active-session resolver can record the expected v23 pin failure while preserving the original thrown object. This resolves the two gaps in the prior behavioral-only candidate: a cached OTA without the fresh nonce cannot create the receipt, and the receipt can distinguish the exact resolver's mismatch from a generic Release bootstrap failure.

This is acceptance evidence for explicitly disclosed, test-instrumented builds. It does not claim execution provenance for an unmodified release binary. No current product source, build, install, simulator, or profile state was changed during this review. The requested FileSystem runtime probe has not run, so implementation and old/new Release builds remain gated on its PASS.

Scores: objective/architecture fit **0.94**, simplicity **0.86**, risk **0.82**, maintainability **0.85**; minimum **0.82**. The remaining risk is concentrated in unproven `Paths.cache` runtime behavior and the test patch's execution-time I/O. The bounded probe, fail-closed receipt requirement, strict allowlist, and source-identity guard address those risks without changing the admitted app contract.

## Source-backed method contract

The versioned test tool should create a fresh CSPRNG nonce for each exact-ref build and apply one small patch to detached copies of the admitted v23 and v24 commits. Keep a private host-side build record that maps the nonce to the base commit, patch/helper SHA, built `.app` tree hash, embedded JavaScript hash, and expected content-lock identity. Do not embed a self-referential final build hash in JavaScript. Do not upload the test build or its bundle to an OTA service.

The app patch has two runtime touch points and one test-only helper:

- `App.tsx`: import a side-effect helper whose module execution creates one receipt in the app's own `Paths.cache` directory. The receipt contains exactly the fresh nonce, the public OOD `contentVersion`, the public OOD `artifactSha256`, and a fixed stage (`js_bundle_entry`). Read those identity fields from the versioned generated `content-lock.json`; independently validate the lock/artifact with the repository content-release check. The filename includes the nonce and stage. It contains no track/session/user ID, response, error string, environment value, credential, native manifest, or storage value.
- `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts`, method `resumeActiveSession`: wrap only the existing `resolveRuntimeForSession(session)` await. On return for the exact OOD v23 session pin, write a second allowlisted receipt with stage `exact_resume_success`. On throw, write stage `identity_mismatch` only when the session's track/version/hash equal the admitted OOD v23 identity and the thrown value is `TrainingApplicationFailure` with code `resume_unavailable` whose `cause` is the exact resolver's current fixed error, `Exact canonical artifact identity does not match the verified catalog or retained node packages.` Rethrow the original object. Catch only receipt-write errors so they cannot change the original return/throw; a missing second receipt makes the test inconclusive.
- A test-only helper under `scripts/q13-test-attestation/` owns the allowlisted stage enum and receipt writer. It uses `File`, `Paths`, `File.create`, and `File.write` from the already installed `expo-file-system` module. It writes no application store keys and reads no canonical or account storage. The helper and patch are versioned and private device receipts/raw paths are retained only in the task's private evidence area.

The hook at `resumeActiveSession` is the right boundary: repository bootstrap calls the lifecycle resume callback only after content verification and active-session validation. That method obtains the active session, reauthorizes the local Premium mode, calls `resolveRuntimeForSession`, and only then validates its draft. `resolveRuntimeForSession` calls `resolveExactArtifact` with the persisted session pin. The current exact resolver emits the fixed error above only after no exact bundled or retained package match exists. The same method and wrapper location exist at both admitted app commits; the relevant source diff is limited to generated OOD lock content.

The fresh nonce answers the OTA question directly. An old embedded or cached OTA cannot know a nonce generated after it was built. Since the test runner never uploads its instrumented bundle, a receipt containing the current v24 nonce can only be written by JavaScript from the instrumented v24 test build. If no nonce receipt appears, if the catalog identity differs, or if the second-stage receipt is missing or has another stage, classify the run as inconclusive and stop; do not infer the executing bundle from the native app identity or embedded bundle hash alone.

## FileSystem evidence and required probe

`expo-file-system@~57.0.6` is already a declared dependency. Its installed API exports `Paths`, `File`, and `Directory`; `Paths.cache` returns the cache directory; `Directory.create`, `File.create`, and synchronous `File.write` are part of the installed native API. The app's existing node-package adapter already uses this same API family to create directories/files, write bytes, read, move, and remove app-owned files. Those uses establish project integration, but the existing adapter writes under `Paths.document`, not `Paths.cache`; actual cache-directory behavior has not been demonstrated on the current iPhone 17.

Before creating the versioned patch or any historical Release build, use the existing initialized Debug app and its already-approved read-only JS console mechanism for one bounded capability probe: create a dedicated nonce-named file directly under `Paths.cache`, write a minimal allowlisted receipt, read that exact file back, validate exact keys and values, then delete only that exact file. Record only pass/fail stage, byte count, read-back equality, and own-file deletion result. Do not inspect or snapshot account/canonical storage as part of this probe. If the console mechanism is unavailable, the write/read/delete differs, or cleanup is uncertain, stop; source typings alone are not a runtime PASS.

## Exact-ref build and acceptance verification

After the probe passes, the execution plan is:

1. Verify the versioned patch applies cleanly to each exact admitted commit and that the only app-source differences are the helper import and the bounded `resumeActiveSession` wrapper. `git diff` must show no app config, native project, dependency, generated content, lock, schema, scoring, selection, or persistent-store changes. Verify the build record maps each fresh nonce to its exact base and patch hashes.
2. Run the existing content-release integrity check against each isolated checkout and record the admitted OOD v23 and v24 content identities. Build Xcode Release apps with embedded JS from the exact checkout and local smoke runtime. Confirm no Metro process serves either launch. The native bundle identifier must remain `com.lkurczab.patternly`.
3. Install the instrumented v23 app normally. Use the ordinary UI and local Premium testing authorization to create one minimal OOD session, expose the first item, leave it unanswered, and confirm a v23 `exact_resume_success` receipt with the fresh v23 nonce. Record the visible prompt and the existing session's exact pin through the app's ordinary safe evidence path; do not seed or edit storage.
4. Install instrumented v24 over the same app identity without uninstall or app-data clearing. Extract only the two known nonce receipt paths from the app's own cache. Require a fresh v24 `js_bundle_entry` receipt for the v24 version/hash and `identity_mismatch` receipt for the exact v23 session pin. Confirm the UI remains fail-closed with no answer, occurrence, or item substitution. A ready/resumed state, unavailable-active-session state, generic block without the receipt, old nonce, or missing receipt is not a PASS.
5. Preserve the user's Guest baseline categories, finish or abandon only the disposable own-account session through ordinary UI after evidence is secured, restore the current app, and verify the final categories and required environment/API state. Keep all screenshots and raw/private paths private.

Required focused tests for the versioned helper/patch are: receipt schema/allowlist and stage validation; identity mismatch classification requires all three exact v23 pin fields plus the exact wrapped error code/cause; nonmatching errors produce no mismatch receipt; and wrappers preserve identical resolved value or thrown object. Run the content-release check and confirm generated artifact/version/hash are byte-identical to each admitted ref. These tests validate the patch's contract; the on-device fresh-nonce receipt remains the execution proof.

## Limits

- The probe and later Release receipt are not complete; this review is design-only.
- A cache file can be evicted by iOS, so missing evidence fails closed. Use a unique filename per nonce and read only those exact paths; never clear the cache directory.
- Synchronous receipt writes add a small startup/resume delay in these instrumented test builds. The code must write only tiny fixed JSON, and the wrapper must not replace or suppress the original lifecycle result.
- Do not describe the result as an unmodified release-build test. Do not infer correctness from the receipt alone: the source/build binding, OOD lock, normal v23 session, exact v24 resolver error, fail-closed UI, and preservation checks are all required.

## Repository evidence

- `package.json:62` — Expo FileSystem is already installed as `expo-file-system@~57.0.6`.
- `node_modules/expo-file-system/src/index.ts`, `Paths.ts`, `File.ts`, `Directory.ts`, `File.types.ts`, `internal/NativeFileSystem.types.ts` — current API exports cache path and native create/write/read/delete operations.
- `src/content/runtime/nodePackageStorage.ts:106-118` — existing app integration uses `Paths.document`, `Directory.create`, `File.create`, `File.write`, and `File.delete`.
- `App.tsx:1-18` — source root imported by Expo app entry; safe location for the test-only entry receipt import.
- `src/content/generated/canonical-content/content-lock.json` — generated public OOD version/hash for the current admitted v24 build; exact v23 and v24 locks are present at their admitted Git refs.
- `src/content/canonical/runtimeCatalog.ts:45-96` — runtime catalog validates generated artifacts against the versioned content lock and exposes each track's actual `contentVersion`/`artifactSha256`.
- `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts:429-445, 566-578, 631-632` — `resumeActiveSession`, exact resolver call, unchanged returned session, and `run` wrapper/cause behavior.
- `src/application/trainingLifecycle/contracts.ts:48-52` — `TrainingApplicationFailure` exposes the fixed failure code and original cause.
- `src/application/contentPackageRuntimeOwner.ts:60-79` — exact artifact lookup and fixed no-match error; no latest-version fallback.
- `src/application/bootstrap/applicationBootstrap.ts:84-110` and `src/content/application/ContentPreparationGate.tsx:103-124` — content verification precedes active-session callback, which invokes `lifecycle.resumeActiveSession()`.
- `git diff ea4f3d61b39bab6b9f12ace73b34721d0d6e717a fa95d027076e970d71dacf0d1fd7976fa0ba8f60 -- <reviewed source files>` — reviewed lifecycle, bootstrap, app-root, and catalog-runtime source are the same at both refs; the reviewed diff is the OOD entry in generated `content-lock.json`.

