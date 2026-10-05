# Independent semantic review: N08-B08 v3

**Verdict: REVISE.** The 18 keyed outcomes still express the unit’s exception-safety and partial-effects objective, and all question IDs and accepted option IDs match their before objects. The v3 option set is no longer systematically longest-correct. However, a shared `Details` boundary claim contradicts at least three cases, and i003 contains a stale allocation-domain phrase.

## Frozen inputs and method

- Current proposal and frozen review copy: `proposals/N08-B08-v3.json`, SHA-256 `c8e7e4fab99c5d297c07a5dc497df0c541f2cd1ae13c15e9f1162e9fff3d47a1`; the `review-inputs` copy is byte-identical.
- Before objects and source bytes: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; source `content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B08.json`, SHA-256 `b222555c7a79b975fde1a321c045b516733612f8f88b483c9c329a1438f5785c`. The current source bytes match the manifest.
- Contract: `N08-N09-CONTRACT.json`, SHA-256 `00c20d8c74d8e4dfec3ffb9211865642a5ae72d218bdd7473b8f41e52bfa5471`.
- The canonical content validator and scorer were run on every whole object, the keyed choice, each of the 54 distractors, and the keyed choice after reversing option order. Stable feedback targets were checked against the actual option IDs. All18 validate, all18 keys score correct, all54 distractors score incorrect, all18 reversed keys score correct, and all feedback targets match.
- I compared every current prompt, option, answer, feedback message, Reason, Details field, taxonomy and source reference with its manifest before object and reviewed all 18 current whole objects. Each retains its question ID and `owner_preserves_contract` answer ID. The old identity map and accepted meaning therefore remain reusable; this is not acceptance of the full N08/N09 cohort or producer/source/runtime admission.

## Findings

### F1 — The common boundary explanation asserts a prior commit when the case does not

The `boundaryOrTradeoff` and `transfer` fields repeatedly explain the tempting rollback choice with the claim that the prompt says “an earlier local or external effect has already committed.” That rationale is false for three explicit cases:

- **i003:** entry validation fails *before* the local transaction commits, and neither the balance change nor repayment entry is visible. Its boundary text nevertheless says a prior effect committed; its transfer warns against rollback of an already-occurring effect. The explanation must instead contrast atomic pre-commit failure with inventing a compensating change.
- **i009:** the exchange outcome is unknown until reconciliation. Calling a prior effect committed overstates what the prompt establishes; the learner must preserve uncertainty and reconcile the same invoice issue.
- **i014:** mapping validation fails *before publication*, leaving the existing lesson visible. No new catalog effect has committed. The boundary explanation should address retaining the old published revision until mapping validation succeeds.

These are visible premise contradictions in a shared instructional field, not a requirement for new technical guarantees. Correct the case-specific explanation and transfer boundary while preserving the accepted partial-effects decision.

### F2 — i003 has a stale, unrelated “allocation” error

i003’s prompt is a cooperative lending ledger and its keyed outcome is a retryable pre-commit validation error. `feedback.details.scenarioApplication` instead says “return a retryable allocation error.” Allocation is not part of the case. This is a case-fidelity defect under §4.4; describe the repayment-entry validation failure without the unrelated allocation label.

## Resolved v1 findings and scope

The prior v1 review found the answer first and longest in all18 items and an unstated access-check mechanism in i010. In v3, the keyed answer remains first in the stored arrays, but current ordering is covered by the separately accepted app presentation correction; this review does not reopen that source-level issue. Correct answers are strictly longest in9 items and tied/middle in9, rather than systematically longest. The i010 key now only says to keep the authority revocation committed and report door propagation pending until confirmed, matching the visible case. No remaining finding rests on a numeric length target or a new presentation rule.

## Per-item identity review

All18 items were read as whole objects and compared to their frozen manifest before objects. Each retains its prior primary decision and accepted option ID `owner_preserves_contract`; fingerprints and scorer/feedback checks are in `INDEPENDENT-CHECK-N08-B08-B09-v3.json`.

The concrete finding IDs are `ood-n08-b08-i003`, `ood-n08-b08-i009`, and `ood-n08-b08-i014` for F1, plus `ood-n08-b08-i003` for F2. Other items’ visible commit, pending, retryable or unknown states support their accepted key. This is a scoped unit review only; it does not certify N08/N09 as a whole or any source activation, admission, native, Premium or full-BIZQ outcome.
