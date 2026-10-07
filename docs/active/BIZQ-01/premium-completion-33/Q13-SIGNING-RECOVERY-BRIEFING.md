# Q13 simulator signing and regeneration recovery

## Cel

Recover the Q13 same-app run with a simulator Release artifact signed through Xcode's normal ad-hoc path and carrying the app's configured bundle identity. Reprepare the instrumented OOD23 source with a new nonce, then use a separately generated OOD24 artifact for the same-app install transition. Keep all changes in the Q13 test-build script/tooling; do not alter product entitlements, Keychain service/accessibility, storage, or signing certificates.

## Ustalenia

The installed OOD23 Release artifact launched and wrote its fresh entry receipt, but did not reach profile preparation or Q13 resume. Source tracing establishes that the displayed gate outcome came from the first local logout-control read; the underlying category remains `local_logout_control_corrupt` versus `local_logout_control_unavailable`. See [Q13-RELEASE-STORAGE-DIAGNOSIS.md](Q13-RELEASE-STORAGE-DIAGNOSIS.md). The signing result below is a concrete artifact defect to correct; it does **not** prove which of those two storage outcomes occurred or establish Keychain causality.

The private signature comparison reports that the existing Debug backup's code signature has identifier `com.lkurczab.patternly` and ad-hoc flags `0x2`, while the test Release artifact's identifier differs from the bundle identifier and its flags are `0x20002` (ad-hoc, linker-signed). The current isolated build script explicitly passes `CODE_SIGNING_ALLOWED=NO` (`q13-build-release.mjs:19`), even though both Xcode configurations declare `PRODUCT_BUNDLE_IDENTIFIER = com.lkurczab.patternly` and reference the same entitlements file. The project and Expo config do not require a signing certificate or store distribution for this simulator run.

The existing generator can reapply v1 instrumentation only. The installed and bound artifact is v2, whose patch owns five paths: `App.tsx`, `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts`, and the three files under `src/q13-test-attestation/`. The current v1 regeneration branch expects four old paths and a v1 binding, so it cannot safely recover this v2 checkout. Its guarded pattern is reusable, but the v2 branch must validate the actual v2 schema and exact five-path scope.

## Podejście

First update only the private Q13 build script to use normal simulator ad-hoc code signing. Remove the `CODE_SIGNING_ALLOWED=NO` override and use Xcode's simulator signing with `CODE_SIGNING_ALLOWED=YES` and ad-hoc identity `CODE_SIGN_IDENTITY=-` where the toolchain requires it. Keep `-configuration Release`, the existing simulator destination, architecture, environment validation, derived-data root, and private build log behavior. Do not change the project bundle identifier, entitlements, SecureStore options, provisioning settings, or Keychain configuration.

Before any install, inspect the produced app metadata and require all of the following: `CFBundleIdentifier` and the code-signature `Identifier` both equal `com.lkurczab.patternly`; the artifact is ad-hoc signed by Xcode rather than linker-signed; and `codesign --verify --deep --strict` succeeds. Compare the signature metadata to the existing Debug backup. Only proceed if the build artifact passes these checks. This validates the signing correction without treating the earlier storage failure as diagnosed.

Extend `generate.mjs` with a separate guarded v2-to-v2 regeneration path. Do not generalize or weaken the accepted v1 recovery path. Require an external private v2 binding with exact top-level keys, `schemaVersion` and `toolVersion` for v2, the exact admitted OOD23 ref/content identity, `patchState: "applied"`, a valid prior nonce, four exact v2 tool-source hash keys and SHA-256 values, the three exact source hash keys, the five exact patched-file hash keys, a valid patch hash, and `buildBinding` containing valid app-tree and embedded-JS SHA-256 values (`completed_bound`). Require a clean detached checkout at the bound ref and status containing exactly those five patch paths. Check every current patched file against its private bound hash and every source file, including the content lock, against both the binding and `git show HEAD`. Require the generated directory to contain exactly the three owned helpers.

Before mutating the checkout, generate a fresh nonce and reject if it equals the prior nonce; regeneration must not accept a caller-supplied nonce or rewrite either binding. After every check passes, restore only the two tracked source files from the exact `HEAD`, remove only the three generated helper files, remove their directory only when empty, verify that the checkout is clean, and apply the current v2 tool with that fresh nonce into a new external mode-0600 binding. Leave the prior binding and its app/build hash record intact. Do not use reset, clean, stash, or touch unrelated paths. Preserve the five-path ownership contract for the new patch and verify the new binding contains exactly those five hashes and the same admitted source/content identity.

Update `generate.test.mjs` with a v2-bound fixture that uses the actual five-path patch and app-build binding shape. Cover successful fresh-nonce reapply, identical-nonce refusal before the first mutation, stale source/ref/build binding refusal, changed/missing/extra/symlink patch-path refusal, generated-directory extras, existing external output binding refusal, and preservation of the old binding bytes. Keep the existing v1 historical `.ts`/`.txt` map tests. Update the README to distinguish prior v2 installed execution from newly regenerated v2 source and artifact bindings.

After independent review of this briefing and implementation, regenerate the OOD23 v2 checkout with a fresh nonce, build it with the corrected signing path, verify signature metadata, and bind its exact app/embedded-JS hashes. Install only on the existing simulator app identity. Complete the OOD23 normal-UI session creation and fresh entry/resume evidence before building/installing OOD24 from the other admitted ref with a second fresh nonce. Verify the OOD24 signature and app identity before the same-app install. Keep raw signing/build logs and runtime outputs private; receipts remain safe allowlisted facts and hashes. No data reset, duplicate simulator, production signing credential, or RevenueCat state is part of this plan.

## Checks and release limits

Focused generator tests must prove every v2 regeneration refusal occurs before any mutation, and that successful regeneration preserves only the intended source behavior while changing the nonce and patch/build binding. Run the focused Q13 test suite and `npm run typecheck`. The real build check must confirm the code-signature identifier, ad-hoc/no-linker flags, signature verification, app bundle identifier, and embedded-JS binding before install. Q13 acceptance still requires the actual old exact-resume success, new exact mismatch, preservation comparison, and ordinary UI evidence; passing signing checks alone establishes none of those.

Scores: objective/architecture fit **0.93**, simplicity **0.82**, risk **0.83**, maintainability **0.85**; minimum **0.82**. The plan confines signing changes to the test build driver and regeneration changes to the versioned Q13 tool. Residual risk is that a corrected app identity may not explain or resolve the existing local logout-control error; the plan explicitly retains that uncertainty and requires a real safe outcome before any storage diagnosis.

## File scope

- `docs/active/BIZQ-01/premium-completion-33/q13-build-release.mjs`: remove the unsigned-build override and use simulator ad-hoc signing; retain existing isolation and environment guards.
- `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs`: add separately guarded v2-to-v2 regeneration with fresh nonce enforcement and exact five-path binding checks.
- `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.test.mjs`: cover v2 prior bindings and pre-mutation refusal.
- `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/README.md`: document the corrected signing verification and v2 regeneration procedure.

No product source, schema, native configuration, entitlement, storage, content, or scoring file is in scope.
