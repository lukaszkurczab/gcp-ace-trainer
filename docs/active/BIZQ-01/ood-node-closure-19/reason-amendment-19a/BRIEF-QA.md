# Independent design review — Reason-only amendment 19a

**Verdict: PASS for the bounded design.** The amended fixed, reason-only follow-up fits the existing §4.4 requirement and preserves the accepted question decisions and IDs. The briefing binds the independently confirmed 25-item scope across B02/B03/B08 and now distinguishes on-disk 19a bytes from the privately reconstructed immutable-v19 predecessor. This accepts the proposed approach for the exact scope; it does not accept authored Reasons or implementation.

## Scores

| Dimension | Score | Reason |
| --- | ---: | --- |
| Objective and architecture fit | 0.96 | Repairs the existing Reason contract without changing answers, question identity, pools, or runtime schema. |
| Simplicity | 0.84 | One fixed proof and a small private reconstruction context reuse the existing closed v19 validator and migration history rather than copying it. |
| Risk | 0.82 | The critical risk is bypassing current source checks while reconstructing the immutable v19 predecessor; fixed paths, byte bindings, and direct historical tests can contain it. |
| Maintainability | 0.80 | An additional immutable data-only proof is justified by existing immutable history, but the private validator context must remain narrowly fixed and internal. |

Minimum: **0.80**.

## Bound implementation contract

1. Preserve exactly the 25 findings in [`../REASON-QUALITY-REOPEN.json`](../REASON-QUALITY-REOPEN.json)—16 keyed-option repeats in B02, eight same-decision Reason paraphrases in B03, and one prompt echo in B08. Do not pull other items into this amendment.
2. Bind the descriptor to the three fixed source paths, each exact current 19a source hash, each affected item’s before/after Reason and whole-object fingerprints, and the immutable v19 predecessor identity. Only `feedback.reason` may differ; all other fields, IDs, answers, and non-target entries remain exact.
3. The briefing now states the two distinct byte checks correctly: actual on-disk B02/B03/B08 files match the new 19a descriptor’s current hashes; after regular-file, fixed-path, non-symlink, and current-hash checks pass, reconstruct the former v19 bytes using immutable proof19 `currentQuestion` objects and replace only the 25 Reasons with their fixed before-values. Require every reconstructed object to match its immutable predecessor except those authorized Reason fields, and require the reconstructed files to match the immutable v19 source hashes. The old hash is not expected of the new on-disk files. Run the unchanged closed-v19 proof against that private reconstructed predecessor context. Continue reading the other six unit files directly and validating them against their immutable v19 hashes.
4. Keep reconstruction internal and reachable only after the exact fixed 19a descriptor and all current source hashes validate. It must not be selectable through CLI input, proof data, arbitrary paths, or generalized identity/approval metadata. Preserve existing v17/v19 dispatch behavior and all source-path/symlink checks.
5. Tests should prove the identity invariant and failure boundaries across the three changed arrays: Reason-only changes retain the same question/option IDs and decision; tampered/missing/extra Reason entries, altered non-Reason fields, missing/extra item mappings, source-hash/path/version changes, and symlink substitutions fail. Reconstruct the exact pre-19a v19 files and run the unchanged v19→17→16→13→12→11 chain. Preserve immutable proof bytes and ordinary pool boundaries.

These are the already-agreed exact-scope/history contract, not new product requirements. Before source integration, freeze the descriptor and docs07 contract, then independently review all authored Reason text against the visible item facts and unchanged decision. Reuse package19’s matching consumer/provenance evidence where unchanged; rebind new source bytes through the existing candidate, consumer, and admission owners. No native, Premium, N03 eligibility, deployment, or full BIZQ-01 claim follows from this design review.

## Basis

I reviewed the amendment briefing and the existing BIZQ-01 §4.4 criterion. The bound scope comes from the independent whole-162 report; this design review does not approve future Reason wording or implementation. The proposal’s no-schema/no-pool/no-answer-change boundary and use of the existing migration proof chain are sound once the source scope and old/current-byte distinction above are made exact.
