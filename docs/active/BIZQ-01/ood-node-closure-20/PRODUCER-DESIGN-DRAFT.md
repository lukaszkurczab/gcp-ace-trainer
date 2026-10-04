# Packet20 producer design draft

**Status: proposed, not approved for implementation.** This is a code-grounded design for a future fixed N04 proof. The current 144 new-question-ID / 18 same-ID split is conditional on final semantic review and the root-owned exact map. No source, catalog, proof, verifier, fixture, or test code was changed for this draft.

## Objective and boundary

Bind the reviewed N04 objects in all nine files to the exact current `19a` inputs, then privately reconstruct the exact `19a` predecessor so the existing `19a → 19 → 17 → 16 → 13 → 12 → 11` proof chain can validate the historical evidence. Report semantic question replacements separately from same-ID whole-object corrections. Preserve question count and historical question membership.

This draft proposes neither an approved identity map nor an implementation authorization. It does not change the question schema, eligibility, admission, release, or publication policy.

## Repository facts

- `content/catalog.json` currently identifies OOD version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-19a`. The nine N04 files listed in the packet manifest each contain 18 questions. The manifest binds each current source-file SHA-256 and the full question-set hash. These files are separate from N03, the scope of the existing 19/19a proofs.
- In `scripts/content/verify-migration.mjs`, `loadCanonicalContent` reads canonical question files and records both `questionsByTrack` and `questionLocations`. `verifyMigration` then loads fixed evidence and calls `loadBizq01OodSemanticProof` (currently around lines 7304–7310).
- `loadBizq01OodSemanticProof` dispatches by the OOD catalog version. The 19a branch calls `validateBizq01OodReasonAmendment19a` (around 6900); the 19 branch calls `validateBizq01OodClosedCohortProof` with the fixed 19 descriptor. The 19a validator reads and hash-checks only its three fixed N03 files, restores its 25 Reason fields in memory, reconstructs byte-exact v19 source files without a trailing newline, and passes a private buffer map restricted to those three paths into the closed-v19 validator. The v19 validator independently reads only its nine fixed N03 files. It consumes the complete predecessor track/question set supplied through `canonical`; it does not reopen N04 source files.
- The 19a-to-19 handoff therefore needs a v20-created canonical predecessor with the N04 objects restored. No N04 source-buffer override is needed or appropriate. The existing 19a private-buffer guard must remain restricted to its three N03 paths.
- Current N04 source files have no final newline. The v20 reconstruction must serialize each predecessor array with `JSON.stringify` and no appended newline, then compare the raw-byte SHA to the fixed v19a source hash. Parsed-object equality alone is insufficient.
- Historical membership is checked by `compareTrackMembership` and `assertCanonicalHash` (around lines 803–825 and 599–607). Each historical evidence row binds both the full canonical question and its learner-facing projection. Restoring a same-ID correction’s old whole question is therefore required even though its ID remains in the current set.
- The current closed-cohort validators require each semantic replacement to remove the old ID and add a new ID; `verifyMigration` uses those replacement records both for current membership math and to reconstruct historical objects (around 7318–7340). Do not insert same-ID corrections into this replacement list: that would subtract an ID still present in current content, falsify the semantic-map report, or duplicate current membership.
- The packet’s `BEFORE-PRODUCTION.json` `immutableProofs` map binds eleven existing proof/evidence files. Ten are fixed verifier proof files: `bizq-01-besd-slice-01.json`, `bizq-01-besd-seed-cohort-14.json`, `bizq-01-coding-source-copy-04.json`, and OOD `bizq-01-ood-source-11.json`, `bizq-01-ood-source-12.json`, `bizq-01-ood-unit-cohort-13.json`, `bizq-01-ood-node-closure-16.json`, `bizq-01-ood-node-closure-17.json`, `bizq-01-ood-node-closure-19.json`, and `bizq-01-ood-reason-amendment-19a.json`. The eleventh is the separately preserved `bizq-01-source-copy-slice-04/REPOSITORIES-BEFORE.json` snapshot. Preserve all eleven bytes and all ten existing fixed descriptors; add v20 as a new proof/descriptor, never by replacing one of these records.
- The package contract in `docs/07-content-guidelines.md` §3.3 distinguishes unchanged accepted meaning from a semantic replacement and requires new option IDs where meanings change. The packet manifest fixes the exact current inputs; its SHA-256 is `74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0`.

## Proposed fixed proof shape

Add one fixed code descriptor and one proof file, `evidence/business-quality/bizq-01-ood-node-closure-20.json`. The exact descriptor values (commit/version transition, nine file paths and hashes, question-set hashes, taxonomy, objectives, accepted option IDs, identity action and approved item order) must be populated only after the final reviewed map is frozen.

The proof root should have an exact fixed key set. Because this cohort intentionally contains two item-level identity actions, do not put one misleading root-wide identity action on the mixed proof. Keep both identity classes explicit:

```json
{
  "schemaVersion": "patternly-bizq-semantic-replacement-v1",
  "scope": "fixed OOD N04 cohort20 scope",
  "trackId": "object-oriented-design-interview",
  "beforeProducerCommit": "fixed accepted baseline",
  "beforeContentVersion": "fixed 19a version",
  "contentVersion": "fixed v20 version",
  "beforeQuestionSetSha256": "fixed v19a question-set hash",
  "questionSetSha256": "fixed v20 question-set hash",
  "sourceFiles": [
    {"sourceFile":"fixed relative path","beforeSourceSha256":"...","sourceSha256":"...","nodeId":"...","mentalUnitId":"..."}
  ],
  "replacements": [
    {"sourceFile":"...","beforeQuestionId":"...","questionId":"...","nodeId":"...","mentalUnitId":"...","learningObjective":"...","identityAction":"replace_question_with_new_id","identityReason":"...","confirmedDefects":["..."],"acceptedOptionId":"...","sourceRefs":["..."],"beforeQuestion":{},"currentQuestion":{}}
  ],
  "sameIdCorrections": [
    {"sourceFile":"...","beforeQuestionId":"same fixed ID","questionId":"same fixed ID","nodeId":"...","mentalUnitId":"...","learningObjective":"...","identityAction":"preserve_question_id","identityReason":"...","confirmedDefects":["..."],"acceptedOptionId":"...","sourceRefs":["..."],"beforeQuestion":{},"currentQuestion":{}}
  ]
}
```

The root keys are exactly `schemaVersion`, `scope`, `trackId`, `beforeProducerCommit`, `beforeContentVersion`, `contentVersion`, `beforeQuestionSetSha256`, `questionSetSha256`, `sourceFiles`, `replacements`, and `sameIdCorrections`; no wildcard fields. The two item arrays use one exact item-key schema, with item-level `identityAction`. The arrays are fixed descriptors, not proof-selected scopes. The current whole objects in the proof must compare exactly with both canonical content and bytes read from each fixed source path. Historical whole objects must compare with the immutable evidence row hashes. The code descriptor must bind the approved mapping and values; exact key checks and exact set checks must reject missing, reordered-if-order-is-fixed, duplicate, or extra entries. It must not accept a generic caller-supplied descriptor, expected hash override, or arbitrary historical buffer.

For the same-ID array, enforce `beforeQuestionId === questionId`, the fixed `preserve_question_id` action, unique IDs, exactly the reviewed 18 entries, and current option/answer bindings from the fixed descriptor. Where an option’s meaning changed, the approved current object must use a new option ID; any unchanged option identity must be explicitly confirmed by the frozen review. The validator binds the exact reviewed objects and approved option IDs, but semantic meaning remains a reviewer decision, not something inferred from hashes.

## Proposed validation and reconstruction flow

1. Add one `BIZQ01_OOD_COHORT20_PROOF` descriptor and a version-dispatch branch for the fixed v20 version in `loadBizq01OodSemanticProof`, before the 19a branch. Keep the existing closed 19a and older branches unchanged. Add the new proof path to the wrong-version/stray-proof guard so a descriptor file cannot be silently ignored under an unrelated OOD version.
2. Validate the proof against the code descriptor: exact root/item/source keys; fixed version, commit, track and taxonomy; exact nine relative paths; current and predecessor source/question-set hashes; exactly 18 questions per file; complete ID/action membership; unique IDs; accepted option IDs and source references; and complete old/current object bindings. For each source, use `lstat`/symlink-ancestor rejection, regular-file validation and raw SHA comparison as existing validators do. Compare parsed disk objects to the canonical objects loaded by `loadCanonicalContent`.
3. Bind each `beforeQuestion` to its old evidence row with `assertCanonicalHash`. For each `currentQuestion`, require exact equality with the source object and current canonical object. New-ID replacement records must have disjoint old/new IDs and new option IDs relative to their own retired object. Same-ID correction records retain one ID and are checked against their own fixed reviewed object/option bindings rather than the semantic replacement disjoint-ID rule. Exact source hashes prevent changes outside the approved item map from being smuggled into a file.
4. Reconstruct each of the nine `19a` N04 source arrays in memory. Start from the current 18 canonical/source questions. For a semantic replacement, remove the new-ID object and insert its `beforeQuestion` under the old ID. For a same-ID correction, substitute `beforeQuestion` for the current object at the same ID. Sort by the existing canonical question-ID comparator, serialize as UTF-8 `JSON.stringify(array)` with no newline, and require the fixed `beforeSourceSha256`. Apply the same identity-aware substitutions to the complete sorted OOD track set and require `beforeQuestionSetSha256`. Do not write these bytes to disk.
5. Build a private predecessor canonical value: replace only the OOD track’s question array with the reconstructed v19a array, set only that track’s catalog version to the fixed `beforeContentVersion`, and update `questionLocations` only for IDs that actually changed. Same-ID entries keep their current location. Then call the existing OOD loader on this private view. Its existing 19a branch re-reads the three N03 sources, restores the 25 Reasons and enters the unchanged 19→17→16→13→12→11 chain. Do not widen or alter the 19a private-buffer allowance.
6. Return semantic replacements as `[..., previous.replacements, ...newReplacements]` and return same-ID corrections in a separate property such as `sameIdCorrections`; carry forward `reasonAmendmentQuestionIds` unchanged. In `verifyMigration`, compute current ID membership from semantic replacements only. To reconstruct historical track questions, remove current new IDs and append the old questions for semantic replacements, then replace the matching retained IDs with the old questions from same-ID corrections before `compareTrackMembership`. This restores the exact row/projection hashes without changing semantic mapping totals. Expose same-ID IDs in a separate report field; never present them as replacement pairs.

## Focused negative and regression tests

The v20 current fixture should positively exercise the actual fixed proof dispatch and the exact 19a-predecessor reconstruction. Add direct v20 mutations for concrete risks:

| Mutation | Risk and expected safe failure category |
|---|---|
| Omit v20 proof or either identity-class array | A version could be accepted without every reviewed change; `EVIDENCE_MEMBERSHIP`. |
| Remove, duplicate, or add a replacement/correction; change an item’s class or same-ID pair | Historical membership could be omitted, counted twice, or reclassified; `EVIDENCE_MEMBERSHIP` or `EVIDENCE_VALUE`. |
| Change any current object, answer ID, source reference, source hash, question-set hash, version, path, or fixed identity action | An unreviewed object or scope could enter the proof; `HASH_MISMATCH`, `EVIDENCE_VALUE`, or `EVIDENCE_MEMBERSHIP`. |
| Change a `beforeQuestion` or remove its current baseline evidence row | Historical row hashes/projection could be forged or omitted; `HASH_MISMATCH` or `EVIDENCE_MEMBERSHIP`. |
| Add an extra N04 source question or alter one of the 18 fixed IDs | Closed membership and exact source reconstruction fail; `EVIDENCE_MEMBERSHIP`. |
| Symlink a proof/source path or substitute a directory/non-regular file | Path traversal or non-file input; existing `PATH_ERROR`/path rejection behavior. |
| Keep same-ID question in current content but fail to restore its old object in the history assembly | Current membership may look correct while immutable evidence projections fail; assert the direct historical comparison rejects the mismatch. |

Keep exact-generation tests for v19a and 19/17/16/13/12/11. Add a v20 historical fixture that reverses only the nine approved N04 files to v19a and verifies their raw hashes, while retaining all older fixture expectations and failure cases unchanged. Do not weaken old expected counts/hashes or turn historical fixtures into synthetic current-generation success. Reuse matching prior focused evidence where inputs and execution conditions remain unchanged; run v20 actual producer schema/scoring/reversal tests and the historical chain tests. Full canonical/content-builder checks belong after the root-owned source checkpoint if clean-tree guards require it.

## Scope after independent design approval

Implementation should touch only the nine N04 source arrays/catalog version, `scripts/content/verify-migration.mjs`, one new fixed proof under `evidence/business-quality`, the packet20 historical/current tests, and existing fixture or version pins proven to bind the current OOD identity. Root owns app/web consumers, candidate/readiness/admission, checkpoint and release work. No changes to N03, accepted N01/N02, other tracks, schemas, selectors, runtime stores, publication or services.

## Design assessment

| Dimension | Score | Decisive reason |
|---|---:|---|
| Objective/architecture fit | 0.96 | A fixed v20 branch binds the reviewed cohort, reconstructs the accepted 19a predecessor and reuses the established chain. |
| Simplicity | 0.83 | Two explicit arrays make identity behavior auditable; a generalized migration abstraction would add wider policy and compatibility surface. |
| Risk | 0.84 | Whole-object, source-byte and historical-row checks contain migration risk; same-ID reconstruction is the sensitive behavior and receives a direct regression test. |
| Maintainability | 0.82 | Existing fixed descriptors, path checks and predecessor loaders remain canonical; the new branch does not alter old generation rules. |

## Unresolved before implementation

- The reviewed identity map, exact same-ID object diffs, source hashes and v20 question-set hash are not frozen here. The fixed descriptor and proof must not be authored from counts alone.
- The ten prior fixed proof files/descriptors and the separate reason-amendment diagnostics must remain byte-identical and continue validating. The new same-ID result field must not change the meaning or ordering of the existing 450 semantic replacement entries.
- The exact final fixture/pin dependencies remain to be checked by the implementation owner after the fixed semantic map is accepted. This proposal is not approval to edit them.
