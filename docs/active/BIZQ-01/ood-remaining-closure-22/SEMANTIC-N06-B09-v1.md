# Independent semantic review — N06-B09 v1

**Verdict: REVISE.** The keyed responses and retained identities generally preserve the accepted domain-event decision, and the visible scenarios support the stated owner-side invariants. The unit still has a material §4.3 assessment cue: all 18 correct options are the sole longest, and they are consistently the only complete, case-specific workflow among four short, near-stock distractors. A learner can select the most detailed contract-shaped option without distinguishing event from command or deciding which invariant belongs to the event producer.

## Frozen evidence

- Proposal input: [`review-inputs/N06-B09-v1.json`](review-inputs/N06-B09-v1.json), SHA-256 `1418a98fc46496a70f680214422f1bfea50e043663de73791ce392e26b61ea61`.
- Frozen receipt: [`ROOT-FROZEN-N06-B09-v1.json`](ROOT-FROZEN-N06-B09-v1.json), which binds the same proposal bytes and 18 questions.
- Baseline: producer commit `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`; source question IDs and keyed answers were read from the actual predecessor file. Whole-object fingerprints use SHA-256 over compact insertion-order JSON (`ensure_ascii=False`, separators `(',', ':')`).
- Applicable requirement: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, especially §§4.1–4.4, 5B–5C. The source states options should be comparable in concreteness and that systematic “longest is correct” cues should be removed; it does not set a word-count threshold.
- The existing Microsoft domain-events reference supports the distinction between an accepted domain fact and command/invariant handling, and allows dispatch before or after commit and synchronous or asynchronous handling. It does not establish durable delivery or exactly-once behavior. The prompts explicitly supply retry/lag/ordering facts where used; this review does not infer extra guarantees.

## Item findings

| Item | Keyed-answer / decision review | Disposition |
|---|---|---|
| i001 | The accepted completion, exercise version, and score policy stay with the completion owner; a later event serves badge/analytics consumers. The answer aligns with the visible success-before-event boundary. | REVISE only for the cohort-level option cue below. |
| i002 | The approval owner validates and records the bounded, attributed exception before emitting the event; index/notice are delayed projections. | REVISE only for the cohort-level option cue below. |
| i003 | The replacement owner validates and switches the stable segment mapping; search refresh consumes the accepted reference event. | REVISE only for the cohort-level option cue below. |
| i004 | The grant records approval and expiry; request-time authorization checks expiry even if cleanup is late. The event does not replace access enforcement. | REVISE only for the cohort-level option cue below. |
| i005 | The notary records a seal for one exact immutable revision before the public-index refresh. | REVISE only for the cohort-level option cue below. |
| i006 | Settlement and idempotency govern payout release at the payout owner; a report can retry/deduplicate by payout ID. No exactly-once network guarantee is claimed. | REVISE only for the cohort-level option cue below. |
| i007 | The prompt assigns an effective-time sequence at acceptance and requires displays to use that sequence. The answer correctly carries the sequence in the accepted event rather than relying on arrival order. This is a scenario contract, not a guarantee of the event mechanism. | REVISE only for the cohort-level option cue below. |
| i008 | The schedule owner checks and records no-overlap before responding; notices are retryable and deduplicate by reservation ID. | REVISE only for the cohort-level option cue below. |
| i009 | The stream owner validates the provider timing/error contract; monitoring is downstream. | REVISE only for the cohort-level option cue below. |
| i010 | The roster owner validates both assignments and applies the paired swap before emitting an audit fact. | REVISE only for the cohort-level option cue below. |
| i011 | The route owner commits geometry, conflicts, and provenance together; search is a projection and cannot resolve conflicts. | REVISE only for the cohort-level option cue below. |
| i012 | The campaign owner validates legal state and records the reward ledger transition; summaries retry by reward ID. | REVISE only for the cohort-level option cue below. |
| i013 | Temperature/receiver validation and shipment hand-off remain with the shipment owner; tracking consumes the accepted revision. | REVISE only for the cohort-level option cue below. |
| i014 | The ledger applies a repayment only after the nonnegative-balance check; report/notice consumers deduplicate the accepted allocation. | REVISE only for the cohort-level option cue below. |
| i015 | The bracket owner validates a legal forfeit and advances the bracket as one transition; standings/notices are projections. | REVISE only for the cohort-level option cue below. |
| i016 | Inspection records a classification from condition facts; refund eligibility remains a separate decision. The event does not convert a class into refund approval. | REVISE only for the cohort-level option cue below. |
| i017 | The notebook owner records a snapshot ID bound to immutable inputs and code version; catalog/retention views consume that identity. | REVISE only for the cohort-level option cue below. |
| i018 | The review owner persists author and document revision with one comment before notification; retry/deduplication is by comment ID. | REVISE only for the cohort-level option cue below. |

For all 18 items, `answer.optionId` resolves to `owner_preserves_contract`; I checked the keyed text, not option position. The predecessor used that same ID for the same response meaning: publish a domain event to decouple downstream effects while keeping the scenario’s synchronous invariant with its owner. The current wording applies that accepted decision to specific events and facts; it does not change it into a different decision or archetype. Preserving the question and correct-option IDs is therefore justified. The current alternatives use fresh IDs.

Reason and Details generally explain the case-specific condition, the owner/event boundary, the closest event-before-validation or projection-owns-the-rule error, and the lag/retry tradeoff. Wrong-option messages target the corresponding option IDs and diagnose the selected misconception. The repeated explanatory sentence about an event communicating an accepted change is repetitive, but alone is not the blocker; the concrete issue is the recurring answer-shape cue in the choices.

## Required correction

The console’s frozen warning receipt flags `correct_option_sole_longest` for all 18 items. Inspection of the actual choices confirms a unit-wide pattern, not an isolated length difference: each correct answer is a compound implementation recipe naming the owner, validation/persistence, event, and consumers. The four distractors are much shorter and repeatedly use the same four forms: emit before validation, delegate the invariant to a consumer, synchronously wait for projections, or broadcast a command so each consumer writes its own state. Several prompts already make those errors explicit (for example, i001 requires validation and persistence before success, while its wrong choices put validation in the delayed handler). This combination provides a systematic selection cue and weakens the required decision practice under §4.3.

Revise the affected choice sets as a coherent unit so the alternatives express complete and credible competing event contracts with comparable concreteness. Distinguish the wrong models by their actual mistaken boundary or consequence; keep the scenario facts and correct invariant. Do not pad distractors, impose identical lengths, or change IDs unless an option’s meaning changes. The correct answer’s current meaning and IDs may remain if its meaning is retained.

No unsupported delivery or transaction guarantee was found. This proposal review does not accept the canonical source, runtime reachability, or any broader N06/full-BIZQ closure.
