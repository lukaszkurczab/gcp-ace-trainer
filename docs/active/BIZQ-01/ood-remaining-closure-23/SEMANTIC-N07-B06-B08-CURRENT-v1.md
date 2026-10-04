# Independent current semantic review — OOD-N07-B06 through B08

**Verdict: REVISE.** I reviewed the exact frozen current inputs, all 54 before/current whole-object bindings, prompts and constraints, every key and alternative, Reason, all five Details fields, option-ID messages, and per-item identity action. The three mechanical receipts each pass 18 objects / 90 options; those checks establish schema/scoring and binding, not answer uniqueness.

## Unit results

- **B06 v7: PASS.** The 17 repeated conditional tails have been removed from `errorCorrection`; each remaining diagnosis is distinct from `boundaryOrTradeoff`. The wrong_4 message for i014 now matches the signed-delta option and explains the reversal-operation distinction. i016 now states that the saved return retains the scanner observation, which rules out the previously valid “store only refund amount” alternative. The 18 original item identities remain supported by the exact old/current keys and case contracts.
- **B07 v5: REVISE.** i001’s added transfer/query bounds resolve the prior ambiguity. Five blockers remain: i002 lazy gardener access may fit through shared/batched reads; i003 can aggregate a joined query server-side and materialize only its summary; i004 can load a broader graph before closing without a scope bound and contains a constraint inconsistent with upload-after-close; i011 can load all returns in one query because no row/scope limit excludes that plan; i013’s third constraint states the answer’s separate-view retrieval rule, while eager history loading is not otherwise prohibited. Exact option IDs and smallest corrections are recorded per item in the JSON. The other 13 items reuse the v4 PASS conclusions only for fields unchanged in v5.
- **B08 v5: PASS.** All 18 content reviews from v4 remain valid because the v5 whole-object changes are only `questionId` fields. Each new item now uses its corresponding reserved ID i019–i036, matching the previously documented item-level meaning change. The exact v4 original review copies are preserved at `review-inputs/SEMANTIC-N07-B08-v4-QA-original.md` and `.json`; the additive fidelity receipt remains unchanged.

## Evidence and limits

The JSON binds all current proposal SHA-256 values, all before/current object hashes, per-item accepted IDs and identities, and the changed-field scope. Prior semantic work is reused only where the serialized fields match; the new changes were read directly. The alternatives at issue are possible under the authored case facts; this does not claim any measured Patternly query behavior.

This is a bounded content review. It does not accept source activation, producer integration, runtime, admission/release, native, Premium, or full BIZQ-01.
