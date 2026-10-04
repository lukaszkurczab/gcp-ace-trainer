# Consumer scope preflight — OOD N04 / package 20

**Status:** read-only dependency map. This is not semantic approval, source activation, release admission, or runtime/native acceptance. The proposal binding is provisional pending the independent package-20 review.

## Bound inputs

`ROOT-FINAL-BINDINGS-v2.json` binds the current app OOD question set (`6f493ddd…f1f53`, version `…-19a`, 1,413 questions) to the proposed set (`5b552f93…f0fe72`, 1,413 questions). It describes 162 N04 objects across `B01`–`B09`, with 144 replacements and 18 retained identities. The source files are in `patternly-content/content/object-oriented-design-interview/interfaces_polymorphism_substitution_and_extensibility/`; the binding records exact proposal/source hashes and the intended old-to-new ID map. Use those explicit identity actions rather than assuming every `i001`–`i018` is retired.

## App consumer dependencies

| Consumer | What it actually binds | Package-20 implication |
| --- | --- | --- |
| `patternly/src/content/generated/canonical-content/object-oriented-design-interview.json` and `content-lock.json` | Current OOD artifact bytes, version, 1,413-item count and digest. The current lock entry is `object-oriented-design-interview-authoring-v2026.10.04-bizq01-19a`. | Regenerate through the canonical producer/sync path after approval; do not hand-edit. The artifact digest and version will change. |
| `patternly/src/content/bizq01OodNodeClosure19.test.ts` | Fixed hashes for the nine N03 proposal files; N03 source/runtime parity and old-ID retirement; accepted N01 (136) and N02 (152) preservation; the three N01 ordinary pools remain exact N01. Its IDs are generated with `ood-n03-…` (`lines 30–41, 74–94`) and its pool assertions are N03-scoped (`253–264`). | This is a preservation fixture, not an N04 pin. Keep its N03 proposal hashes and assertions unchanged. Run it after integration. Add a separate current N04 consumer test using the package-20 bindings. |
| `patternly/src/content/bizq01OodReasonAmendment19a.test.ts` | The fixed 19a amendment bytes and three N03 proposal files, proving 25 N03 `feedback.reason` overlays and source/runtime parity (`lines 16–25, 67–90`). | Historical N03 fixture; keep unchanged. It does not pin the whole OOD artifact hash/version. |
| `patternly/src/content/canonical/runtimeCatalog.test.ts` | Nine locked tracks, 29 modes, each loaded artifact's hash, mode/pool consistency and item lookups (`lines 16–38`). | No fixed OOD content version or qset digest. Rerun against regenerated artifact and lock. |
| `patternly/src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` | Current app release lock must exactly match generated content-lock SHA and each artifact's checksum/version (`lines 9–23`), then all launch tracks have a nonempty runtime pool (`24–31`). | Its lock assertions necessarily consume the new OOD digest/version. The test itself has no OOD-specific literal to replace; root owns synchronized release/candidate/admission updates. |
| `patternly/src/content/canonical/productModeConfig.test.ts` | OOD's ordinary free-node selection stays on N01 and the expected free pool remains 136 (`lines 30–33, 168–180`). `odk097DesignSessionSelection.test.ts` also uses the N01 free node (`line 11`). | Preserve these existing pool contracts. Package 20 should not silently make N04 eligible or expand ordinary pools. Rerun the mode and selection tests; do not change their expectations unless an explicitly approved product contract changes. |
| N04-specific consumer pin | Search of app `src` tests/TS/MJS outside generated content found no existing `ood-n04`/`OOD-N04` fixed consumer binding. | A new N04 test is needed to bind the nine frozen arrays and exercise all 162 current objects. It should assert exact source/artifact parity, the manifest's 144 replacements and 18 retained identities, retired IDs absent, stable option-ID answer/feedback mapping under original and reversed ordering, and pre-answer projection/control/accessibility behavior. Also assert N04 remains outside the three current N01 pools. Reuse the existing N03 test's tested helpers rather than changing runtime code. |

The N03 tests are **historical fixtures to preserve**, not fixtures to retarget to N04. Their exact source and proposal hashes prove the N03 contract; changing those bindings to N04 would erase that evidence. The lock and release artifacts are **current derived outputs** and therefore must be regenerated from the approved canonical source and synchronized by the owning release/admission workflow.

## Web demo provenance

The exporter at `patternly/scripts/exportPublicDemo.mjs` selects only two demos (`lines 19–35`): Coding `alg-complexity-time-005` from `complexity_and_constraints/derive_time_complexity.json`, and AWS `aws-saa-c03-architecture-001-odk096` from `aws_secure_architecture_foundations/architecture_review.json`. It checks each selected source item against the app runtime, content lock and release lock, and validates current app admission/candidate/runtime receipts (`lines 54–95, 102–131`). Each projection records the **global** app `contentLockSha256` and `releaseLockSha256`, alongside admission, candidate, release and runtime evidence hashes.

Therefore the N04 source change does not select or alter either demo question, its source file, node, or mode. After root updates the app content/release/admission bindings, both generated demo records' provenance becomes stale because it embeds whole-app hashes. Regenerate `patternly-web/src/generated/demoQuestions.json` with the existing exporter; do not edit the demo questions or add an OOD demo. The current generated file confirms both records carry the same global app/release hashes (`lines 9–25` and `100–115`).

The export contract is protected by `patternly/scripts/exportPublicDemo.test.mjs` (`17–28, 55–78`) and `patternly-web/scripts/verify-demo-bundle.mjs` (`7–10, 14–29`). The web browser coverage reads that same two-entry generated catalog in `patternly-web/scripts/demo-question.browser.test.mjs` and `demo-site.browser.test.mjs`. Keep the selected IDs fixed; rerun those checks after provenance regeneration. The web's `scripts/check-canonical-demo.mjs` invokes the app exporter in `--check` mode; `npm run prepare:demo` regenerates it and the web build checks it before bundling.

CH05's web privacy/legal/security transport and `adminRequestLifecycle` files/tests/docs are outside this dependency map and remain with their current owner; no edits there are indicated by this N04 content change.

## Minimal post-approval consumer verification

After semantic approval and source activation, root-owned integration should regenerate the OOD artifact/lock and bind the new release/admission/candidate/runtime evidence. Then run:

1. The new N04 consumer test against all nine fixed payloads and the actual loaded runtime artifact.
2. Existing `bizq01OodNodeClosure19.test.ts` and `bizq01OodReasonAmendment19a.test.ts` to preserve N03 and the 19a Reason-only history.
3. `runtimeCatalog.test.ts`, `runtimeAdmissionLaunchTracks.test.ts`, OOD `productModeConfig.test.ts` and `odk097DesignSessionSelection.test.ts` to verify generated catalog, release lock and unchanged pool contracts.
4. In `patternly`, `npm run export:demo -- --check` after app admission is current; then in `patternly-web`, `npm run prepare:demo`, the two-demo exporter/bundle checks (`npm run build` includes both), and `npm run test:demo:browser` plus `demo-site.browser.test.mjs` if the built-site browser contract is part of the final check.

These checks establish app/web consumer parity for the admitted artifacts and current two-demo projection. They do not establish full BIZQ-01 acceptance, native behavior, Premium eligibility, or that all N04 questions should enter a learner pool. Stop/reconcile if the accepted identity map, final qset hash, artifact version, or ordinary pool scope differs from the provisional v2 binding before updating consumers.
