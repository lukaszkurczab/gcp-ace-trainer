# Independent semantic review — N06-B09 v2

**Verdict: REVISE one item.** The revised option sets provide substantially more complete, case-specific competing event contracts. The previous unit-wide answer-shape finding is resolved: the wrong choices now express distinct, intelligible mistakes (request-as-fact, projection-owned validation, projection acknowledgment as a gate, and fan-out write commands). Thirteen correct choices still trigger the longest-option advisory, but inspection shows the alternatives now have comparable operational detail; the advisory alone is not a defect or a count-based gate. One changed distractor no longer matches the existing `errorCorrection` field in i001.

## Frozen evidence

- Proposal: [`review-inputs/N06-B09-v2.json`](review-inputs/N06-B09-v2.json), SHA-256 `6cdbac47db537da135533c8cbaba250bc9b7d0b2e52fee1ed03c864f5a245d16`.
- Unit notes: [`review-inputs/N06-B09-v2-NOTES.json`](review-inputs/N06-B09-v2-NOTES.json), SHA-256 `470e0b34f45e0f352831544545d2995eb856334a287e8769635f1e17f9e50e7c`.
- Frozen warning receipt: [`ROOT-B09-v2-WARNINGS.json`](ROOT-B09-v2-WARNINGS.json) binds that proposal and flags 13 sole-longest answers. I assessed those flags against the actual choice content, not as an automatic threshold.
- Baseline: producer commit `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`; all keyed answers were resolved by `answer.optionId`. Fingerprints in the JSON use SHA-256 over compact insertion-order JSON (`ensure_ascii=False`, separators `(',', ':')`).
- Applicable source: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §§4.1–4.4 and 5B–5C.
- The Microsoft domain-events reference allows synchronous or asynchronous handling before or after commit and does not establish delivery durability or exactly-once guarantees. Scenario-specific ordering and retry statements are treated as authored facts, not general framework guarantees.

## Item assessment

| Item | Decision and feedback | Result |
|---|---|---|
| i001 | The owner validates and persists the version-bound completion before emitting an event; the four alternatives now distinguish false attempt/completion, subscriber ownership, projection gating, and fan-out writes. However, `errorCorrection` still says alt1 publishes “completed”; alt1 now publishes `ExerciseAttempted`. | **REVISE:** align `errorCorrection` with the current alt1. |
| i002 | The approval owner validates and records attribution/scope; request event, projection decision, projection gate, and fan-out commands are distinct wrong models. | PASS |
| i003 | Stable segment mapping stays with source replacement; search consumes the accepted reference. The nearest projection-owned mapping error is diagnosed. | PASS |
| i004 | Approval and expiry remain on the grant; per-request expiry checks protect against late cleanup. | PASS |
| i005 | The notary binds the exact immutable revision; indexing cannot choose it or gate acceptance. | PASS |
| i006 | Settlement/idempotency checks stay with payout release; the report deduplicates by payout ID. The response makes no provider-side exactly-once claim. | PASS |
| i007 | The board assigns the effective sequence; displays apply that supplied order rather than delivery order. This is stated scenario behavior, not an event-system guarantee. | PASS |
| i008 | The schedule owns no-overlap and reservation; notices deduplicate the accepted reservation. | PASS |
| i009 | The stream owner validates and switches provider; monitoring is a delayed view. | PASS |
| i010 | The roster owner validates and applies the paired swap; audit follows with a stable swap ID. | PASS |
| i011 | The route owner commits geometry/conflicts/provenance; search does not resolve source conflicts. | PASS |
| i012 | The campaign owner validates the legal transition and reward ledger; summaries retry by reward ID. | PASS |
| i013 | The shipment owner checks temperature/receiver constraints and records hand-off; tracking is downstream. | PASS |
| i014 | The ledger checks nonnegative balance before allocation; report/notice consume one allocation ID. | PASS |
| i015 | The bracket owner validates match state and advancement; projections retry by match ID. | PASS |
| i016 | Classification remains distinct from refund authorization; the route projection does not authorize refund. | PASS |
| i017 | The notebook owner binds snapshot identity to immutable inputs/code; catalog and retention views consume it. | PASS |
| i018 | The review owner persists comment author/revision before emitting a notification event; retry is by comment ID. | PASS |

The prompt and correct-answer decisions preserve the existing domain-event objective and QIDs. All 18 current accepted options now use case-specific IDs; those IDs accurately identify the rewritten current responses. Reason and Details are generally causal and case-specific, and wrong-option messages target the current IDs.

## Narrow correction

For i001, replace the stale “publishes ‘completed’” phrase with the actual mistake: an `ExerciseAttempted` event delegates score validation and completion awarding to subscribers before the completion owner has accepted the result. Do not alter the case facts or the keyed event-boundary decision.

The 13 remaining longest-option flags are nonblocking on this snapshot: the distractors now state complete alternatives with a specific boundary error, and no single length rule establishes which choice is correct. Keep the content under the existing qualitative §4.3 review; do not add word-count parity.

This proposal-only review makes no source, runtime, producer, consumer, admission, native, or full-N06 acceptance claim.
