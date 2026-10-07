# Q13 test-build attestation tool v2

This versioned tool prepares disclosed, test-instrumented source copies for the admitted OOD23→24 same-app acceptance run. The only admitted source refs are `ea4f3d61b39bab6b9f12ace73b34721d0d6e717a` (OOD23) and `fa95d027076e970d71dacf0d1fd7976fa0ba8f60` (OOD24). The CLI edits only a clean detached exact-ref checkout and an external private binding. It does not build, install, upload, clear app data, or inspect app storage. The generated test helper reads published canonical storage only after the original resume resolver settles.

The cache capability prerequisite is recorded as PASS in `../Q13-CACHE-CAPABILITY-2026-10-07-03.json`. That was a Debug-only Expo FileSystem create/write/read/delete probe. It does not establish Release behavior, storage-read capability, preservation, or Q13 acceptance.

## Prepare and bind each build

Create each source copy as a clean detached checkout at one exact ref. The generator verifies the exact ref, full checkout cleanliness, owned source and content-lock hashes, and generated patch scope. It patches only `App.tsx`, the exact `resumeActiveSession` resolver observation, and the three generated test-helper files. It verifies that the content lock remains byte-identical. Use separate private bindings and fresh nonces for v23 and v24.

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs apply \
  --repo /path/to/detached-ood23-checkout \
  --binding /private/tmp/q13-ood23-v2-binding.json

node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs bind-build \
  --binding /private/tmp/q13-ood23-v2-binding.json \
  --app /path/to/Patternly.app \
  --embedded-js /path/to/Patternly.app/main.jsbundle
```

Repeat `apply` and `bind-build` with a separate OOD24 checkout and binding. `apply` can accept a fixed 64-character lowercase hex nonce for offline deterministic tests; device runs must use an automatically generated fresh nonce and must never reuse one. `bind-build` hashes an already-built app tree and embedded JavaScript. It does not build or validate Xcode configuration, bundle ID, Expo Updates selection, installation identity, or execution.

Bindings and comparator inputs must live under `/private/tmp` or the system temporary directory. The tool creates bindings with mode `0600` and rejects host evidence files that expose group/world permissions.

## Runtime receipts and preservation comparison

The app writes a v2 receipt to its own Expo cache. The entry receipt contains the nonce, current public OOD catalog version/hash, and `js_bundle_entry`. At the existing resolver observer only, old exact success and new exact mismatch receipts also include a `bizq01-q13-preservation-v1` snapshot. The observer reads through `getKeyValueStorage().getAllKeys()` and `.getString()` after checking the already-published account profile and that no profile transition is active. It never initializes storage, calls bootstrap or migration, or writes canonical state.

Receipt state contains only hashes and safe facts: hashed key inventory and raw-value hashes, semantic payload hashes for the known learning, settings, goal/plan, reminder, and learning-history categories, account profile kind, public OOD pin, item/option order digests, position/count facts, active-journal presence, and attempt/draft-response counts. It never emits key names, record values, answer data, occurrence/item IDs, account/profile IDs, UID, credentials, manifest data, or native constants. Account lifecycle, Guest/profile metadata, outbox values, and notification APIs are outside this scoped preservation claim. Any unclassified canonical key, invalid envelope, unavailable published storage, active transition, missing active one-item OOD23 session, nonzero answer/draft count, pending journal, or receipt I/O failure leaves the required receipt absent and fails closed. Console messages contain only a fixed stage and safe failure category.

Semantic digests use the existing `canonicalSerialize` with projection `canonicalSerialize-envelope-v1-timer-exceptions-v1`. They omit only the envelope's top-level `revision`, the active foreground timer payload fields `accumulatedForegroundMs`, `checkpointRevision`, `lastCheckpointAt`, and `activeForegroundMs` only on `training-session:<id>` payloads. Raw-value hashes remain available in the private receipt to explain these timer differences. No other field is projected away. Item and option vectors use the same canonical serializer; arrays preserve order and each option vector is bound to its occurrence within the item vector.

Compare only after both actual runtime receipts exist and each fresh nonce has been matched to that same build's private source/patch/app-tree/embedded-JS binding. Confirm the expected receipt path was absent before each device run. The comparator prints only a safe result/category; it does not print receipt paths or hashes:

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs compare-preservation \
  --old-binding /private/tmp/q13-ood23-v2-binding.json \
  --new-binding /private/tmp/q13-ood24-v2-binding.json \
  --old-receipt /private/tmp/q13-ood23-preservation.json \
  --new-receipt /private/tmp/q13-ood24-preservation.json
```

It requires distinct nonces, exact admitted refs, each binding's build hashes, the OOD23 `exact_resume_success` receipt and OOD24 `identity_mismatch` receipt, the exact old persisted session pin in both, one item at index zero, no answers or draft responses, no active journal, equal item/option digests, identical key inventory, and equal semantic hashes across all required categories. Missing, malformed, stale, or unbound evidence is a failure. Cache loss across install means the baseline is unavailable; never recreate it from the new build or mutate storage to recover it.

This snapshot proves only the exact resolver boundary, which runs before the remaining resume draft retrieval and runtime validation. Ordinary UI evidence must separately show the old unanswered item and the new fail-closed screen. Instrumented builds are disclosed test artifacts; this is not a claim that an unmodified Release binary executed.

## Metro Debug execution comparison

When the Release smoke path cannot establish an authenticated app session, use the same already-installed Debug app and an owned Metro server for each exact source ref. This is evidence that the two instrumented JavaScript sources executed in the same native Debug app; it is not a packaged-OTA comparison, a Release result, or an OS binary upgrade. Do not bypass the app's auth or storage gates to create the receipts.

## Profile-gate exception probe

**Current runtime status (07 October 2026): experimental/unavailable.** The exact reviewed capability attempt returned `inspector_connect_failed` before arming; no observation or diagnostic reload ran. See `../RESUME-CAPABILITY-2026-10-07-02.json`. Offline tests establish modeled refusal/cleanup contracts only. Do not automatically execute the commands below; a future attempt needs a concrete reviewed connection correction and fresh source/runtime binding.

`probe-profile-gate.mjs` is a bounded diagnostic for the generic profile-storage-unavailable screen. It requires the exact OOD23 v2 source binding, its detached checkout, and the private `js_bundle_entry` receipt created by that binding's fresh nonce. Before connecting, it checks exact source, patched-file, and current-tool hashes against the binding and verifies the checkout ref and unchanged `ProfileStoragePreparationGate.tsx`. The operator must first verify that the sole Metro listener's process working directory is this checkout. The probe accepts only the unique React Native Inspector `node` target with app ID `com.lkurczab.patternly` and device name `iPhone 17` on loopback. Through `__r.getModules()` it reads only registry metadata and requires one initialized entry each for App, the attestation helper, storage, logout control, and the profile gate. It examines bundle source in memory and accepts the gate catch only from a loaded script that also contains the binding nonce. It never reads module exports, calls app storage, loads modules, or writes canonical state.

After independent tool QA, run `capability` first. It connects to the one iOS Inspector page at `[::1]:8081`, validates a unique loaded catch, sets and removes its breakpoint, then detaches. It does not reload or wait for the gate:

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/probe-profile-gate.mjs capability \
  --binding /private/tmp/q13-ood23-v2-binding.json \
  --checkout /path/to/instrumented-ood23-checkout \
  --entry-receipt /private/tmp/q13-ood23-entry.json
```

Only if capability succeeds and the diagnostic is still warranted, start `observe`. After validating and setting the breakpoint, the CLI writes the fixed `q13_profile_gate_probe_armed` signal to stderr. The operator may then perform one ordinary reload separately. This is one observation of ordinary profile preparation and can run its normal effects. The probe waits up to 60 seconds for the existing catch and accepts a diagnostic only from a well-formed allowlisted exception class with a non-null own allowlisted `code`. A safe but incomplete class/code pair may be recorded as `inconclusive`; it is not a cause and ends the attempt. The probe then resumes, waits for a fresh resume acknowledgement, removes the breakpoint, disables the debugger, and closes the connection. Each debugger cleanup action is attempted even if an earlier one fails. The observation receipt is written only after the Inspector operation and connection close both succeed. Any cleanup or close failure leaves the receipt absent and requires restoring the main runtime. Its mode-0600 receipt path must be new and under `/private/tmp`:

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/probe-profile-gate.mjs observe \
  --binding /private/tmp/q13-ood23-v2-binding.json \
  --checkout /path/to/instrumented-ood23-checkout \
  --entry-receipt /private/tmp/q13-ood23-entry.json \
  --receipt /private/tmp/q13-profile-gate-diagnostic.json
```

Never evaluate message/stack/state, call `Page.reload`, or use the probe to retry, bypass, clear, initialize, or change profile data. A missing or ambiguous nonce-bearing script, missing/stale entry receipt, wrong app/device target, or non-unique/uninitialized module metadata is a hard stop. A malformed evaluation result produces no receipt. An unknown class or null/unknown code can produce only an `inconclusive` safe-facts receipt; do not infer a cause from it. After any inconclusive result or cleanup failure, restore the current main runtime and do not make a second attempt. Keep binding inputs, entry receipt, diagnostic receipt, and all Inspector/protocol output private. This probe establishes only a gate failure category, not Q13 acceptance or a storage repair.

Keep the exact source-only v2 bindings created by `generate.mjs apply`; `buildBinding` must remain `null`. For each source run, the root evidence collector creates one mode-0600 JSON context receipt outside the checkout with exactly this schema:

```json
{
  "schemaVersion": "bizq01-q13-metro-execution-context-v1",
  "executionMode": "metro_debug",
  "sourceRef": "<exact admitted ref>",
  "bindingFileSha256": "<SHA-256 of the exact binding file bytes>",
  "nonce": "<that binding's fresh nonce>",
  "catalogIdentity": { "contentVersion": "<public catalog version>", "artifactSha256": "<public catalog hash>" },
  "appIdentity": {
    "bundleIdentifier": "com.lkurczab.patternly",
    "signatureIdentifier": "com.lkurczab.patternly",
    "signatureKind": "ad_hoc",
    "signatureVerified": true,
    "baseAppSha256": "<same native Debug app bundle hash for both runs>"
  },
  "device": { "model": "iPhone 17", "fingerprintSha256": "<same simulator fingerprint hash>" },
  "metro": {
    "host": "::1", "port": 8081, "pid": 12345,
    "cwd": "/private/path/to/the/exact-instrumented-checkout",
    "sourceRoot": "/private/path/to/the/exact-instrumented-checkout",
    "listenerCount": 1, "inspectorTargetCount": 1, "processObserved": true,
    "startedAt": "2026-10-07T10:00:00.000Z", "stoppedAt": "2026-10-07T10:01:00.000Z"
  }
}
```

The context receipt records observations made by the evidence collector. The comparator cannot independently inspect a past process, simulator, app signature, or installed source; it validates that the supplied private context is complete and agrees with the source binding and runtime receipts. Capture the PID, canonical working directory, single-listener/inspector-target counts, app bundle/signature identity, and base app hash from the actual run before stopping Metro. Do not fill fields from a plan or infer them from a receipt. Run the OOD23 Metro interval first and stop it before starting OOD24 on the same loopback port. The timestamps must prove non-overlap.

Collect four runtime files: each source's `js_bundle_entry` receipt and its resolver receipt (`exact_resume_success` for OOD23, `identity_mismatch` for OOD24). The two context receipts must point to the exact binding-file byte hashes and the same nonce as their corresponding entry/resume receipts. The source and catalog identities must match the exact admitted refs; the entry and resume stages cannot be substituted. The native bundle identifier, signature identifier, base app hash, and simulator fingerprint must match across runs. No embedded JavaScript hash or fabricated app-tree binding is accepted in this mode.

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/metro-compare.mjs compare-metro-debug \
  --old-binding /private/tmp/q13-ood23-source-binding.json \
  --new-binding /private/tmp/q13-ood24-source-binding.json \
  --old-context /private/tmp/q13-ood23-metro-context.json \
  --new-context /private/tmp/q13-ood24-metro-context.json \
  --old-entry /private/tmp/q13-ood23-entry.json \
  --new-entry /private/tmp/q13-ood24-entry.json \
  --old-resume /private/tmp/q13-ood23-resume.json \
  --new-resume /private/tmp/q13-ood24-resume.json
```

The Metro comparator accepts only source-only bindings with the exact current v2 tool/source/patched-file hashes and `buildBinding: null`. It checks binding byte hashes against the root-created contexts, distinct fresh nonces, exact old/new catalog identities and stage vectors, the same native app/device identity, a single observed `::1:8081` Metro listener and inspector target per sequential run, and the existing preservation contract: unchanged one-item/order digests, zero attempts/responses, no active journal, identical key inventory, and equal semantic digests for every required category. Raw value hashes may differ where the existing semantic projection explicitly permits timer and envelope-revision drift. The comparator does not print paths, source hashes, device identifiers, storage values, or receipt contents.

All eight input files must be regular mode-0600 files under `/private/tmp` or the system temporary directory. A `pass` means the supplied evidence satisfies this Metro-specific comparison; it does not prove an unmodified app binary, Release execution, a network/authenticated session, or OS-level app update behavior. Keep the source bindings, contexts, and receipts private and out of Git.

## Regenerate a legacy v1 patch

Do not touch an isolated checkout while its build is running. Use this path only for a prior binding with the v1 schema. Once the prior outcome is known, regenerate only its own instrumentation with a fresh v2 binding. `completed_bound` requires a v1 binding with app-tree and embedded-JS hashes. `failed_no_install` is for a build that failed before an installable app/embedded bundle existed; `unbuilt_no_install` is for a source copy that was never built. Both no-install outcomes require the v1 source ref, content identity, source-file hashes, patch hashes for exactly the four owned files, and an explicit `buildBinding: null`; they do not invent app or embedded-JS hashes or claim executable/runtime evidence.

Use the outcome matching the private build record. `failed_no_install` and `unbuilt_no_install` allow only source-level instrumentation regeneration; neither establishes that the old patch executed.

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs regenerate \
  --repo /path/to/old-instrumented-detached-checkout \
  --previous-binding /private/tmp/q13-ood23-v1-binding.json \
  --previous-build-outcome failed_no_install \
  --binding /private/tmp/q13-ood23-v2-binding.json
```

The command checks the exact detached source ref, the selected outcome against the presence or absence of app hashes, exact old tool/binding schema, source/content hashes, all four prior instrumented file hashes, content lock, and that the checkout has exactly those four owned changes. It accepts the two exact historical v1 tool-source maps (`generate.mjs`, `attestation-policy.ts`, and either `attestation-runtime.template.ts` or `.txt`), validating all three SHA-256 values; extra, missing, or mixed keys are rejected. It restores only the original `App.tsx` and lifecycle bytes from `git show HEAD`, removes only the two previously generated helper files, confirms the checkout is clean, and reapplies v2 with a fresh nonce. It never calls `git reset`, `git clean`, or stash, and stops if any foreign or unexpected file is present. The prior v1 binding remains truthful only for its old patch; `completed_bound` also binds that old build, while either `*_no_install` outcome makes no app/build/runtime claim. None of these v1 outcomes bind v2 receipts or builds. Rebuild only the JS bundle when the reviewed build process confirms that the native binary is unchanged.

## Regenerate an existing v2 build

Use this path only after the old v2 Release build has completed and its mode-0600 binding is `completed_bound`. The earlier v2 nonce already has an entry receipt, so regeneration always creates and checks a different nonce before modifying the checkout. Do not pass or reuse a caller-supplied nonce.

```sh
node docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs regenerate \
  --repo /path/to/old-instrumented-detached-checkout \
  --previous-binding /private/tmp/q13-ood23-v2-installed-binding.json \
  --previous-build-outcome completed_bound \
  --binding /private/tmp/q13-ood23-v2-fresh-binding.json
```

For v2 regeneration the tool requires the exact v2 binding schema, admitted source/content identity, four tool-source hashes, three source hashes, a complete app-tree/embedded-JS build binding, and hashes for exactly the five patched paths (`App.tsx`, the resume lifecycle file, and the three generated helpers). It verifies the detached `HEAD`, exact five-path working-tree scope, every patched file, the tracked source hashes against `git show HEAD`, and the three-file generated directory. It then restores only `App.tsx` and the lifecycle source, removes only those three generated helpers, verifies a clean checkout, and reapplies v2 with the fresh nonce. It leaves the old binding bytes untouched and stops before any mutation if a ref, hash, scope, or nonce check fails.

The Q13 simulator Release driver uses Xcode simulator ad-hoc signing. Before installing a resulting app, confirm both `CFBundleIdentifier` and the code-signature `Identifier` equal `com.lkurczab.patternly`, verify the signature, and confirm the app was not linker-signed. This signing correction does not establish the cause of the earlier local sign-out-control read failure. It does not change the app's bundle ID, entitlements, Keychain service/accessibility, provisioning, or production signing setup.

## Focused verification

```sh
node --check docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs
node --check docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/metro-compare.mjs
node --import tsx --test docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/*.test.*
npm run typecheck
```

The focused tests cover exact-ref and hash refusal, patch scope, v1-to-v2 guarded regeneration, receipt/build binding, published-storage and profile-transition refusal, valid envelope reads, category/key inventory, exact timer-only normalization, item and option order digests, zero-answer facts, fail-closed unknown/unreadable data, and preservation of the original application result/error when observation fails. These checks do not establish Release execution, cache survival across installs, installed-app identity, or Q13 runtime acceptance.
