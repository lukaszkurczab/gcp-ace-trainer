# Independent producer design review — N07/23

**Decision: PASS for the bounded producer design.** The proposed fixed v23 verifier can use the existing migration chain without weakening earlier proofs or introducing a parallel history mechanism. This review covers design only; it does not accept implementation, source/proof contents, consumer integration, admission, or release readiness.

The review is bound to the frozen 144-item map (`ROOT-N07-PRODUCER-MAP.json`, SHA-256 `f64e82bdf4a997d28a30c44774cd1280beec303620bda3e758150638b2ba9414`), prepared fixed proof (`PREPARED-FIXED-PROOF23.json`, SHA-256 `f1f69a22382dd3acac3e1b0ec8122693265e31a21e2997e467b22985b3831d76`), and exact implementation briefing (`PRODUCER-N07-23-BRIEFING.json`, SHA-256 `5e6c18a36589c729305482beb4c54afbfd62af53dcdca77a9a4a9e6679bef6b6`; compact companion MD SHA-256 `383e3c2ed23a466dd4c5a0784bbf2cc5f3bcd36c9c8eff3548d69784c0853100`). The briefing’s source scope and proposed test/fixture changes match the accepted N07 contract.

The design has a sound, closed restoration path: bind the exact proof and fixed eight source paths; validate the 34 replacement and 110 same-ID rows against their complete before/current objects and existing canonical evidence; reconstruct the eight v22 arrays with the verified compact JSON encoding (no trailing newline); verify the full v22 question-set hash; then call the unchanged v22 validator on a private canonical view. Because the N07 paths are disjoint from v22’s ten N06 paths, the fixed v22 disk-source checks still read their accepted bytes. The existing v22→v21→v20→v19a→v19→v17→v16→v13→v12→v11 dispatch can therefore remain intact.

Preserve all 13 existing literal proof descriptors, five private guard bodies, and 14 immutable proof files byte-for-byte. Add only the fixed v23 descriptor, validator/dispatch, proof, current v23 tests and the documented historical fixture ingress/pin updates. The v22 historical test must keep its original fixed v22 identities and assertions while running against an isolated v22 reconstruction. Tests should exercise both v23 current proof acceptance and representative missing/tampered/extra/misplaced/symlink rejection, then rerun the existing history chain and verify the reported 16,077 current / 16,041 historical totals. These are verification of the accepted design, not new product gates.

One implementation detail keeps the private historical view internally coherent: when restoring the 34 replaced question IDs, restore their `questionLocations` entries along with the question objects. The existing v13 branch does this when reconstructing replaced IDs. Current v22’s ten source checks do not overlap N07, so this is a consistency detail rather than a design blocker.

| Assessment | Score | Reason |
| --- | ---: | --- |
| Objective fit | 0.95 | Closes the accepted N07 scope using the existing producer and proof chain. |
| Simplicity | 0.86 | One explicit generation and one v23→v22 ingress reuse the established chain. |
| Risk | 0.84 | Fixed hashes, complete objects and byte-exact restoration bound identity and history risk. |
| Maintainability | 0.84 | Closed version-specific validation preserves prior guards without a generic override or second pipeline. |

Minimum score: **0.84** (above the required 0.80). Proceed to implementation and actual producer QA under the reviewed scope. This PASS grants no deployment, publication, candidate/admission, native/Premium, or full BIZQ-01 acceptance.
