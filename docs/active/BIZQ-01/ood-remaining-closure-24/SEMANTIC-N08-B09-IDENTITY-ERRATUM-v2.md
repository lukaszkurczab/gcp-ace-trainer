# Additive clarification: N08-B09 identity and presentation findings

This note supplements the first identity erratum. It does not replace the original reports or proposals.

## Temporal attribution

The v4 full review found an identity mismatch between the manifest before objects and the current questions. That mismatch did **not** first appear in v4. The v3 questions already asked which operation/request ID should identify a retry; v4 preserves that decision while rewriting prompts, options, Reason and feedback. The earlier v3 SAME_ID claim is the error. The v4 REVISE verdict remains, but the chronology is **before → v3**, not **v3 → v4**.

For i001, the before stem asks where the passenger-visible effective-order invariant belongs, and the accepted answer puts the retry key/idempotent transition in the object boundary whose owner can enforce it. V3 asks which retry identity to use after a lost acknowledgement; v4 asks the same operation-ID scope question with revised wording.

For i014, the before stem asks where the traceable invoice reissue/no-double-charge invariant belongs. V3 asks which identity should handle an issue ID after possible acceptance and a lost reply; v4 asks how to reconcile that issue ID while keeping a corrected reissue distinct. Retry/idempotency remains the protected facet. It does not make the primary decision identical, and none of these items claims that an ID guarantees exactly-once external delivery.

The canonical contract (`N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`) says to retain a question ID when its primary decision and accepted meaning remain, and to use the corresponding reserved identity for a genuine primary-semantic or archetype change. The per-item v4 report includes the exact before/v3/v4 whole-object hashes. It is evidence for identity review, not a source map or replacement quota.

## The v3 form finding is only partly resolved

V4 removes the all-items-shortest-key pattern: the key is shortest in 0 cases, intermediate in 10, and longest in 8. That fixes the length-rank cue, but it does not by itself resolve the separate qualitative form finding in the v3 review. Across v4, the key typically states the constructive recovery policy, while each wrong choice appends its own adverse outcome.

For i001, the accepted option says to replay by change ID and keep a later edit separate. Its alternatives explicitly say a fresh ID can publish the same change twice, platform-wide deduplication mistakes a later edit for the first, or treating silence as rejection can reverse an already published change. I014 has the same shape: the wrong options themselves say an accepted issue may be charged again, a correction may be suppressed, or a second chargeable issue may be submitted before reconciliation.

Those are recognizable misconceptions and the stated consequences are plausible. At the same time, the repeated pattern lets a learner reject choices from their explicit harmful wording instead of reasoning through the retry boundary. Under canonical §§4.2–4.3, I cannot mark the v3 qualitative cue fully resolved solely because key lengths now vary. This is a limited presentation concern, not a word-count rule: no equal-length requirement, automatic failure of every consequence-bearing distractor, or all-items uniqueness condition is inferred. An independent content judgment should decide whether these remain credible competing policies for this objective.

The original v3/v4 reports and first erratum remain intact. This supplement clarifies their identity chronology and the scope of the v4 presentation finding.
