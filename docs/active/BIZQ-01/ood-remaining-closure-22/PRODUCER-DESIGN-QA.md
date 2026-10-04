# Independent producer design review — N06 source22

**Verdict: PASS; the reviewed implementation may proceed within this fixed scope.** The design reuses the existing fixed-proof and history chain, reconstructing exact v21 privately before invoking the unchanged v21 verifier. I found no conflict with the accepted N06 identity map or the closed migration contract. This is design approval only; it is not source, producer, consumer, runtime, admission, native, Premium, full-bank, or full BIZQ-01 acceptance.

## Bound inputs

- Producer brief [`PRODUCER-BRIEFING.md`](PRODUCER-BRIEFING.md), SHA-256 `b20aa77ae5c1753f944fe69bb1d84a76db6e9ac2cd57b5bd6b00742d295a209b`.
- Exact accepted map [`ROOT-N06-PRODUCER-MAP.json`](ROOT-N06-PRODUCER-MAP.json), SHA-256 `9369a886d8c091b4ee68bbb34818ec2001f1ff42698e59721548074729ef9e68`; semantic report SHA-256 `3ddac680b864069af4295ac5c2f90d8a83564431b996188b85bdc49effe84ff8` and registry SHA-256 `fe693c44f41e3f923764d44eb587ad97ce95a9fc3e1293b96c08bfd72e046a9c`.
- Prepared fixed proof [`PREPARED-FIXED-PROOF22.json`](PREPARED-FIXED-PROOF22.json), SHA-256 `5987128d427d0362b2fe83f6ab62bf2483169374c51941bf23fc3b192f0e089c`. It remains packet evidence, not an activated canonical proof.
- Source baseline [`ROOT-N06-BASELINE.json`](ROOT-N06-BASELINE.json), SHA-256 `fecaa5dc403753a21653865960d96a1516e280a3ff51b8683ca336a0ae5641ef`; existing predecessor byte receipt [`ROOT-N06-PREDECESSOR-BYTES.json`](ROOT-N06-PREDECESSOR-BYTES.json), SHA-256 `503fbd6360556e61f6dcb89d13466a1eefaf6bddb4b2ba2c834ba71c6db5b989`; previous descriptor/guard receipt [`ROOT-PREVIOUS-GUARDS-PREFLIGHT.json`](ROOT-PREVIOUS-GUARDS-PREFLIGHT.json), SHA-256 `f5914e13afba6a32388814cb900d1b955dd30977a330c8c5bf87e6726f08f3cb`.
- N06 contract `N06-CONTRACT.json`, SHA-256 `c6b5612e21fb66a540eba31514510df49b302f8f1089cf474f2ac5880b4205fb`.

The map and proof agree on ten fixed N06 source arrays, 180 same-question-ID corrections, zero replacements, exact v21 source/object hashes, and accepted-option identities. The source transition is v21 `6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12` to v22 `c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e`. The source-bearing v21 commit `19364f9a1167946f0b3d299a59b27864893ae01c` is distinct from the older proof provenance commit, and the brief explains that distinction.

## Design assessment

| Assessment | Score | Decisive reason |
|---|---:|---|
| Objective and architecture fit | 0.94 | A literal v22 descriptor and private validator extend the existing closed-generation chain without changing the content schema, selectors, or authority. |
| Simplicity | 0.87 | It adds one fixed proof generation and one restoration step, then reuses the existing v21-to-earlier validators and normal test/build/admission path. |
| Risk | 0.89 | Exact proof/source/object hashes and private byte reconstruction prevent a current source from bypassing immutable predecessor evidence; earlier guards stay closed. |
| Maintainability | 0.84 | The added fixture branch is bounded but touches every historical restoration path that can begin from current v22; explicit version assertions and exact prior-target checks contain that cost. |

**Minimum: 0.84.**

The prepared proof supplies the full before/current object pairs needed to reconstruct the predecessor. The fixed descriptor can pin proof bytes, exact ordered source metadata and source hashes, QIDs, same-ID action, accepted-option IDs, and `replacements: []` without duplicating every full object in source code. The new guard should check the literal proof SHA and exact keys/order/values, verify the current catalog version and QSet, validate each raw source path/hash/taxonomy and canonical full object, and confirm each before object against its fixed historical question evidence. It can then privately substitute the before objects, serialize the ten arrays in the demonstrated no-final-newline byte form, and require the exact v21 source hashes/QSet. The brief correctly routes that private v21 view through the unchanged v21 validator and existing 20→19a→19→17→16→13→12→11 chain.

The history arithmetic is consistent: 594 prior replacements stay unchanged; 171 existing same-ID corrections become 351; the 25 Reason amendments remain unchanged. The new cohort contributes no replacement IDs. `sameIdCorrections` is distinct from replacement history, so the resulting proof can report the new cohort accurately without changing past meanings or reclassifying same-ID edits as replacements.

The predecessor preservation plan is appropriately closed. The prepared baseline has 13 existing proof files; the guard preflight binds 12 existing descriptors and four private validator bodies byte-for-byte to the baseline. The implementation must keep those descriptors, proof bytes, and private bodies unchanged, add one literal v22 descriptor/guard/dispatch, and avoid a caller-supplied map, public override, generic waiver, or alternate migration path. The 180 proof records are fixed to the reviewed source files and current whole objects; no broad historical map is needed.

The fixture plan is the one coupled implementation risk. Add a narrowly named v21 restore helper that verifies current v22 raw source hashes and full current objects, replaces each fixed ID with its proof `beforeQuestion`, confirms the exact v21 source bytes, changes only the fixture catalog version, then removes proof22 from that temporary fixture. Have `restoreOodSource20Fixture` invoke this step before applying unchanged proof21. Ensure the existing 19a/19/17/16 restoration paths recognize v22 and follow the same descending sequence; keep the v21 test explicitly testing the v21 proof and its original counts. Copy proof22 only into fixtures that start from v22 and need to restore a predecessor. These changes are already enumerated in the brief, so they do not require a broader fixture rewrite.

The canonical test command lists files explicitly. Register only the new v22 test in `test:canonical`; that is necessary for its fixed proof and historical-fixture assertions to run in the required suite, not a new gate. Preserve all existing test commands and historical assertions. The app-side `bizq01OodNodeClosure21.test.ts` has a current runtime assertion pinned to the v21 map. Advance only that loaded-runtime version assertion to exact v22; retain the v21 map/proof assertions and all 153 unchanged N05 object checks. The new v22 consumer test binds the complete current N06 version/QSet. The brief also keeps source writes, generated app artifacts, locks, readiness/admission, web provenance, and final acceptance under their current owners, and preserves the 1,233 other OOD items, 765 accepted N01–N05 items, 8 non-OOD artifacts, and ordinary N01 pools.

## Decision boundary

The design PASS permits the root-owned source/proof writes and producer implementation described in the briefing for verification. Those writes do not themselves accept the source or deliver the package: fixed-map/proof conformance, preservation and migration checks, independent producer QA, and the existing candidate/readiness, app-sync, consumer, local-admission, provenance, and final-package steps remain subsequent acceptance work. No native/Premium eligibility or full BIZQ-01 completion is claimed.
