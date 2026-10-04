# Independent semantic review — N06-B10 v1

**Verdict: REVISE.** The case facts and keyed workflow answers generally align with the accepted orchestration/compensation objective, and I found no claim that a Saga guarantees cross-service atomicity or exactly-once delivery. The 18 choice sets nevertheless disclose the workflow through their answer shape: the key restates the prompt as a full step-by-step solution, while the same four short, obviously invalid alternatives recur. The exact frozen console warning also flags the correct choice as sole longest on every item. This conflicts with the existing §4.2 meaningful-decision and §4.3 comparable-options requirements.

## Frozen evidence

- Proposal: [`review-inputs/N06-B10-v1.json`](review-inputs/N06-B10-v1.json), SHA-256 `16b91e2845748d26aef9f509af728d952d5e2f6918c95a5d0af730f9b9e4ce9b`.
- Unit notes: [`review-inputs/N06-B10-v1-NOTES.json`](review-inputs/N06-B10-v1-NOTES.json), SHA-256 `e50c6e20c264a845c7581298c3d2a42b9b50c5ef2ece0b36efe84842f549c12b`.
- Frozen warning receipt: [`ROOT-REVISED-WARNINGS-v2.json`](ROOT-REVISED-WARNINGS-v2.json) binds the exact B10 v1 SHA above and flags `correct_option_sole_longest` on all 18. This is advisory evidence, not an automatic verdict. I independently compared current question/answer text with the predecessor at `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`.
- Applicable source: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §§4.1–4.4 and 5B–5C.
- The actual-read Microsoft Saga reference describes coordination, compensation, and retry; it says compensation can fail and Saga does not provide built-in cross-service isolation. I applied no implied exactly-once, atomic-commit, or guaranteed-compensation claim.

## Per-item semantic dispositions

In every case, the keyed response was resolved by `answer.optionId`. The local workflow facts are explicit enough to support the proposed sequence/compensation decision. The repeated disposition below refers to the same concrete answer-shape defect, not a numeric warning threshold.

| Item | Keyed decision checked | Disposition |
|---|---|---|
| i001 | Temporary charger hold, authorize, confirm; release on decline/expiry. | REVISE choice set for recipe cue. |
| i002 | Commit canonical metadata; retry a derived index without undoing the accepted merge. | REVISE choice set for recipe cue. |
| i003 | Finish irreversible rights/recipient checks before delivery. | REVISE choice set for recipe cue. |
| i004 | Hold battery, acquire aircraft slot, commit paired plan; release the hold if the second claim fails. | REVISE choice set for recipe cue. |
| i005 | Verify consent/specialty/recipient before one irreversible referral send. | REVISE choice set for recipe cue. |
| i006 | Validate version-bound score and record completion before retryable badge/analytics work. | REVISE choice set for recipe cue. |
| i007 | Complete both approval controls before recording the attributed decision; no partial approval. | REVISE choice set for recipe cue. |
| i008 | Validate segment mapping before canonical recording switch; leave old reference on failure. | REVISE choice set for recipe cue. |
| i009 | Validate grant/expiry before persistence; keep request-time authorization independent of late cleanup. | REVISE choice set for recipe cue. |
| i010 | Seal an exact immutable revision; retry indexing without undoing the authoritative seal. | REVISE choice set for recipe cue. |
| i011 | Reserve funds; release only on bank confirmation; free the hold on confirmed rejection; retry reporting by payout ID. | REVISE choice set for recipe cue; keep the stated ID scoped to reporting and avoid implying bank-side idempotency. |
| i012 | Reserve a platform, validate/assign its sequence, notify only after acceptance, release on failed validation. | REVISE choice set for recipe cue. |
| i013 | Enforce meter non-overlap once; retry notification by reservation ID without allocating again. | REVISE choice set for recipe cue. |
| i014 | Stage and test a new provider; preserve the known-good one on failure and refresh monitoring after success. | REVISE choice set for recipe cue. |
| i015 | Hold both assignments, validate both participants, commit the paired swap or release both holds. | REVISE choice set for recipe cue. |
| i016 | Commit geometry/conflicts/provenance as the accepted revision; retry search after commit. | REVISE choice set for recipe cue. |
| i017 | Reserve item, validate and commit consumption with reward, restore only the pre-commit reservation on failure, then retry summaries. | REVISE choice set for recipe cue. |
| i018 | Reserve receiving carrier, validate temperature, record hand-off on success; release candidate reservation and preserve old carrier on failure. | REVISE choice set for recipe cue. |

## Why the choice sets need another pass

The correct responses are detailed, ordered recipes that restate almost every step already listed in the stems. The recurring distractors are much shorter and repeat the same handful of mistakes: do a required check after the effect, leave a failed reservation in place, roll back an accepted fact because a projection is late, or let a projection decide canonical state. The warning for B10 v1 flags sole-longest on all 18; inspection confirms the corresponding content signal. This makes the keyed answer selectable by completeness and length before the learner reasons about orchestration, compensation, irreversible effects, or post-commit retry.

Retain the case outcomes and workflow distinctions, but make the decision require the learner to distinguish a reversible pre-commit reservation from a non-reversible effect or a retryable post-commit projection. Use credible alternative workflows that differ in a specific mistaken boundary, rather than the same stock choices. Do not pad, enforce equal word counts, or require a unique story per question.

## Identity and limits

All 18 QIDs remain aligned with the predecessor’s workflow-orchestration objective. The former keyed option meant to keep sequencing, compensation, and cross-object invariants at the coordinating boundary. The current workflow options apply that same broad decision to the visible cases; their specific wording does not by itself prove an ID-semantic change. Current workflow options use their own IDs, so no old option meaning is reused. The separate approved conservative key-ID rotation, if applied, is metadata-only and does not address the choice-quality finding.

The i011 prompt assigns the stable payout ID to retryable report updates, not a guarantee that a bank transfer is idempotent. The answer does not claim such a guarantee; the distractor/message should keep this scope clear. No distributed transaction or exactly-once property is inferred elsewhere.

This is proposal-only semantic review. It does not accept canonical source, runtime reachability, producer/consumer/admission, native behavior, or full-N06 closure.
