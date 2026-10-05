# Independent N09-B07 v6 correction review

**Verdict: PASS for the bounded correction.** The v6 wording makes i027’s processing order explicit. That resolves the only remaining finding from v5; i021’s visible supported-size and storage-budget facts were already resolved in v5.

## Scope and evidence

This is a narrow v5-to-v6 review of the five changed leaves in i027. The other 17 complete objects are exact matches to v5, and the previous review of the i027 facts, options, answer, scoring, and diagnostic alignment remains applicable because none changed. I also reran the production validation/scoring checks across all 18 items.

- Frozen v5: `review-inputs/N09-B07-v5.json`, SHA-256 `8114a839b8c3c62a7214cd185412f4229fb313a35f25d3a22633f319b465cfef`.
- Frozen v6: `review-inputs/N09-B07-v6.json`, SHA-256 `04f755252b1c41c6137f171a8d757ea9299b051910762d2ec03d13a1e8ccf734`.
- Before-object manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- The v5 review being resolved: `SEMANTIC-N09-B07-v5-CORRECTION-QA.json`, SHA-256 `b922b453d98a2e9929c2be688ba947e18c7bc922abb7e0e387d5e92d35ed6ffd`.

The only v5→v6 changes are `constraints[0]`, `feedback.reason`, `feedback.details.errorCorrection`, `feedback.details.boundaryOrTradeoff`, and the parallel-request feedback message in i027. The new constraint says the profile service processes single-author requests one at a time, while its batch interface handles the fixed candidate set with one setup and the same reputations. The key and parallel-read alternative therefore have a visible, concrete discriminator: individual calls retain repeated setup under one-at-a-time handling, while the batch call pays setup once. The Reason, Details, and wrong-option message all state that same fact. The wording no longer depends on the ambiguous verb “serializes.”

Production `validateQuestion` and `scoreQuestion` checks pass for all 18 questions: all accepted answers score correct, all 72 wrong options score incorrect, all 18 remain correct after reversing option order, and all 18 feedback target sets match the distractor IDs. The five-leaf v5→v6 diff is independently verified and the original manifest before-object binding passes.

This accepts only the bounded N09-B07 v6 correction. It does not accept source migration/activation, producer/runtime/admission, native/Premium, or the full BIZQ-01 package.

## Reproducible check

`SEMANTIC-N09-B07-v6-CHECK.mjs` (SHA-256 `2f1febbf95e7c290dce89741c888adfda14528a7c0060bb966a1f1ec324ee93a`) binds the v5/v6 inputs and manifest, verifies the exact five changed leaves, and runs production validation/scoring for all 18 questions. Its receipt is `SEMANTIC-N09-B07-v6-CHECK.json` (SHA-256 `0a015035d668e165a7f1810c0acc6d204d2f420acabdd393597dedf15e206d16`).
