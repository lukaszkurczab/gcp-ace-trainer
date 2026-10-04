# N05 / package 21 consumer preflight

**Status: read-only dependency map.** The 153-item N05 proposal set has semantic and identity PASS, but the canonical source, app artifact, and locks remain at version 20. This note maps the consumer work after the source/proof owner completes the reviewed package. It does not approve source activation, candidate admission, expanded eligibility, or release.

## Current binding and exact consumer gap

The current app artifact is `object-oriented-design-interview-authoring-v2026.10.04-bizq01-20`: 1,413 questions, question-set SHA-256 `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`, artifact SHA-256 `fa015cbcdb5b4a0865c39ce7958a4832a08e8b10811dd7f396dc12cc79c6de82`. Its `content-lock.json` is SHA-256 `81696237c0f1f87d17bd7d0f56b24a8b70cf89670d306831f55fa0666f74efd4`; the current app `release.lock.json` is SHA-256 `28046b47ae03d6f089ac95b2c5a8feb96ffbbc040a4dcc663fc1e460e336e2c0`. The release lock points to candidate `3001b254f9a1c4f9d15a01577f5457b8cb4ad79723f9958ecbdb7c8c5658417b` and binds every artifact checksum and content version to the app content lock. These are current v20 bindings, not proposed v21 values.

The source remains v20. The N05 baseline manifest binds 153 old objects in nine 17-question arrays; the reviewed proposal registry binds nine current arrays and preserves all 153 question IDs. The app has no N05-specific consumer test today (`rg` over app source tests found no N05 IDs or closure-21 test). The proposal acceptance and app parity are therefore separate evidence.

Add one focused app test, following the existing `bizq01OodNodeClosure20.test.ts` pattern—for example, `src/content/bizq01OodNodeClosure21.test.ts`. Bind its nine proposal files to the final frozen producer/source map and check all 153 objects against both canonical source and the loaded runtime artifact. Because this package retains question IDs, assert the exact 153-ID set and the correct new object at each existing ID; do not expect those IDs to disappear as if this were a replacement-ID cohort. Exercise each option through real app scoring in original and reversed option order, verify every wrong-option diagnostic targets its current option ID, and check the existing pre-answer projection keeps answer and feedback hidden. Assert N05 remains 153 items and none of its IDs enter the ordinary N01 pools.

The test script in `patternly/package.json` already discovers `src/**/*.test.ts`, so a new TypeScript test needs no package-script entry. The fixed proposal hashes and source hashes must come from the root-frozen final N05 bindings after the producer commit; do not pin the present v20 source bytes as the expected current N05 objects.

## Existing preservation consumers

The current tests already cover adjacent accepted content and ordinary selection:

- `bizq01OodNodeClosure19.test.ts` checks exact N01 source/runtime objects and 136-item count, accepted N02 source/runtime objects and 152-item count, plus the three ordinary N01 pools.
- `bizq01OodNodeClosure20.test.ts` checks all 162 N04 current objects, scoring/presentation behavior, and the same exact 136-item N01 pools; it also asserts the current N02/N03 counts.
- The v17, v16, v13, and `bizq01OodReasonAmendment19a.test.ts` fixtures preserve the prior N01–N03 and exact 25-item 19a Reason-only history. Keep their fixed hashes/history expectations; do not repin them to v21.
- `canonical/runtimeCatalog.test.ts` validates the loaded artifacts against `content-lock.json`; `canonical/productModeConfig.test.ts` and `odk097DesignSessionSelection.test.ts` preserve the OOD N01 free-node mapping and 136-item pool; `runtimeAdmissionLaunchTracks.test.ts` compares each release-lock artifact checksum/version to `content-lock.json` and pins the current candidate ID.

Run the new 153-item consumer test with the unchanged N01–N04 and historical OOD consumer tests, then the runtime catalog, product-mode/ODK-097, runtime-admission, and `npm run check:content-release` checks. The N01 controls are existing contracts, not a new N05 rule: preserve all accepted N01–N04 content and keep the three ordinary OOD pools exactly N01/136. Presence of N05 in the canonical artifact does not grant it mode eligibility.

After the app artifact is synchronized, the narrow app checks are:

```sh
node --import tsx --test \
  src/content/bizq01OodNodeClosure21.test.ts \
  src/content/bizq01OodNodeClosure20.test.ts \
  src/content/bizq01OodNodeClosure19.test.ts \
  src/content/bizq01OodReasonAmendment19a.test.ts \
  src/content/bizq01OodNodeClosure17.test.ts \
  src/content/bizq01OodNodeClosure16.test.ts \
  src/content/bizq01OodUnitCohort13.test.ts \
  src/content/bizq01OodSourceReplacement.test.ts \
  src/content/bizq01OodSourceReplacement12.test.ts
npm run typecheck
node --import tsx --test \
  src/content/canonical/runtimeCatalog.test.ts \
  src/content/canonical/productModeConfig.test.ts \
  src/application/canonical/odk097DesignSessionSelection.test.ts \
  src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts
npm run check:content-release
```

The producer owner should run the fixed package-21 migration and relevant historical-proof tests before candidate construction. The candidate/readiness, source/app sync, delegated admission, and release-gate tools remain the existing owners’ checks; this preflight does not add another gate.

## Version identity and prior attempts

This is a same-question-ID content revision: old and new question objects share IDs, while the N05 answers/options/explanations may differ under the reviewed proposal. A question ID by itself is therefore insufficient to identify which content was used. `ResolvedContentRef` includes `trackId`, `questionId`, `contentVersion`, and `artifactSha256`; a training session requires every item reference to match its own track/version/artifact identity (`domain/learning/resolvedContentRef.ts`, `domain/learning/trainingSession.ts`). `ContentPackageRuntimeOwner.resolveExactArtifact()` returns only an exact currently bundled artifact or a verified installed node package; a same-ID question from a different artifact is not an exact match (`application/contentPackageRuntimeOwner.ts`).

Accordingly, the new content must use the next producer-approved immutable content version and resulting artifact hash. Because the identity is track-wide, even unchanged N01–N04 questions receive a different resolved reference under the new artifact. Keep old attempt/session refs intact. Do not resolve an old attempt by question ID alone, rescore its stored response against the new N05 object, claim that a v20 session resumes under v21, or add historical-artifact fallback behavior. The existing resolver may report an exact old artifact unavailable when it is neither the current artifact nor retained as a verified package. This preflight makes no claim that the app retains a global archive of old OOD artifacts; no such archive is exposed by the inspected resolver.

## Integration order and narrow checks

After final source bindings are frozen, the existing sequence is:

1. The source owner activates the approved N05 arrays and fixed proof under the producer-approved next content version, preserving N01–N04, the other 1,260 OOD objects, other-track artifact bytes, and existing proof history. Run the producer validation, migration/historical tests, and canonical producer tests for this fixed scope.
2. Build the canonical artifacts and prepare the candidate from that exact source. Run candidate draft/readiness against the built artifacts and their source/question-set bindings.
3. Synchronize the app artifact and generated content lock from the candidate release through the existing `sync:content-release` path; update the app release lock and its current candidate pin from the same candidate/release evidence. Do not hand-edit a generated OOD artifact or derive a new version/hash by assumption.
4. Run the focused N05 source-to-runtime consumer test, the existing OOD preservation tests, app typecheck/static checks required by the owning integration, and `check:content-release`. Keep the three N01 pools unchanged.
5. The delegated admission owner issues current admission/runtime evidence for the exact artifact and app locks. Then run the candidate release gate and app release gate against those exact receipts.
6. Once app admission and its locks are current, regenerate the existing demo snapshot with `patternly` `npm run export:demo` (or the equivalent `patternly-web` `npm run prepare:demo`), verify it with `npm run export:demo -- --check`, then run the web build/bundle check and demo browser tests.

The package-20 implementation and consumer records are the current examples: [`update-consumer-lock.mjs`](../ood-node-closure-20/update-consumer-lock.mjs), [`CONSUMER-SCOPE-PREFLIGHT.md`](../ood-node-closure-20/CONSUMER-SCOPE-PREFLIGHT.md), and [`CONSUMER-IMPLEMENTATION.md`](../ood-node-closure-20/CONSUMER-IMPLEMENTATION.md). The packet-21 [`PIPELINE-PREFLIGHT.md`](./PIPELINE-PREFLIGHT.md) maps producer proof/history dependencies. App artifact, lock, candidate pin, admission, and release-lock edits remain with the owning release integration; this document does not change them.

## Web demos and boundary

`patternly/scripts/exportPublicDemo.mjs` selects only Coding `alg-complexity-time-005` and AWS `aws-saa-c03-architecture-001-odk096`. An OOD-only change leaves both demo questions, source files, node/mode selections, and question payloads untouched, but the exporter records whole-app content-lock, release-lock, candidate, admission, and runtime provenance. After the app bindings are current, regenerate through `npm run export:demo` or `patternly-web` `npm run prepare:demo`; the web build's `check-canonical-demo.mjs` and `verify-demo-bundle.mjs` then check the refreshed snapshot. Confirm that only provenance changes in the two generated records; do not add an OOD demo or alter either selected question. The existing exporter/bundle tests and demo browser tests check that boundary.

CH01 commits `95b7e07` / `8784966e` are pushed and CH05 is received; neither introduces a dependency in this N05 consumer slice. The delivery boundary remains `local_verified_artifacts_no_deployment`: no mobile run, native/Premium/full-BIZQ claim, external publication, deployment, or new eligibility is part of this preflight. No tests or runtimes were run, and no code, artifact, lock, demo, or plan file was changed.
