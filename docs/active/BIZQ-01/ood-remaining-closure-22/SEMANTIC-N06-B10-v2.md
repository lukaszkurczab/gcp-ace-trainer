# Independent semantic review — N06-B10 v2

**Verdict: REVISE three narrowly scoped fields.** The new choices present concrete, case-specific sequencing, compensation, and post-commit retry alternatives, and the console reports no longest-choice flags. I found no exactly-once, atomic-commit, or guaranteed-compensation claim in the answers. Three explanations/constraints nevertheless exceed or blur the facts stated in their scenarios.

## Frozen evidence

- Proposal: [`review-inputs/N06-B10-v2.json`](review-inputs/N06-B10-v2.json), SHA-256 `e28bbec531913c2015a2ee18bbd219670bb848db5aa2e3505634a31b3b7fd690`.
- Unit notes: [`review-inputs/N06-B10-v2-NOTES.json`](review-inputs/N06-B10-v2-NOTES.json), SHA-256 `d6de3cdbe2a120652b551540e8d747d8e5e9279de3ffaa5e2295ec30daa60935`.
- Frozen warning receipt: `ROOT-B10-v2-WARNINGS.json` binds this proposal and reports zero sole-longest-choice flags. I still assessed option plausibility and the specific feedback rather than treating the receipt as approval.
- Baseline: producer commit `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`; each current key was resolved with `answer.optionId`. The predecessor and current keys both teach orchestration/compensation across owners, supporting the 18 QIDs. Current keyed options use fresh IDs for their scenario-specific response meanings.
- Applicable criteria: BIZQ-01 §§4.1–4.4 and 5B–5C. The cited Saga reference does not establish cross-service exactly-once, isolation, or guaranteed compensation; none is assumed here.

## Blocking item findings

| Item and field | Finding and smallest correction |
|---|---|
| i001 `feedback.details.errorCorrection` | Alt2 authorizes payment before securing a slot. The explanation says this may “debit” the driver, but the stem distinguishes payment authorization from charging and does not say authorization captures funds. Diagnose the risk of an authorization with no capacity instead; retain the separate hold-stranding diagnosis for alt3. |
| i005 `feedback.details.scenarioApplication` | The stem requires pre-send consent/specialty/recipient checks and notes that disclosure cannot be undone. It does not describe delayed receipts or a way to determine whether the clinic received a send. “The ID can be checked against the prior send” adds that missing delivery-knowledge premise. Keep the primary irreversible-disclosure decision; explain that a retry retains the local referral identity and that the identifier alone does not prove delivery or deduplication. |
| i011 `constraints` and keyed text | The stem says the order is already settled but unpaid if the transfer is rejected; the key “Settle only on bank confirmation” can contradict that state. It also reads ambiguously against the separate payout outcome. Say explicitly to record payout completion/release only after bank confirmation. The constraint “delayed response retries use the same payout ID” is broader than the stem and messages, which assign that ID only to report-update retries. Narrow it to report-update retries; do not imply bank-side deduplication. |

## Remaining item dispositions

| Items | Result |
|---|---|
| i001 | REVISE only `errorCorrection`; the key's reversible hold/confirm-on-authorization decision is supported. |
| i002–i004 | PASS: canonical commit vs projection retry, irreversible delivery preconditions, and paired resource claims are visible and correctly explained. |
| i005 | REVISE only `scenarioApplication`; the pre-send privacy decision is supported. |
| i006–i010 | PASS: version-bound completion, two-control approval, validated source switch, per-request grant expiry, and immutable notarization are distinguished from retryable projections. |
| i011 | REVISE `constraints` and clarify the keyed completion wording; report-only ID scope is otherwise represented accurately in the wrong-option message. |
| i012–i018 | PASS: authoritative sequencing, non-overlapping reservation, tested provider cutover, paired swap, route commit, pre-commit item compensation, and carrier hand-off are supported by visible facts. |

The v2 alternatives are more complete than v1: each wrong choice describes a specific order, ownership, compensation, or post-commit mistake. Their varied lengths do not create a systematic answer-shape cue, and the exact warning receipt records none. This is a proposal-only review; source integration, producer/consumer readiness, admission, native behavior, and full N06/BIZQ-01 acceptance are not claimed.
