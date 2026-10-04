# Independent semantic review — N06-B02 v2

**Verdict: PASS for this frozen proposal.** All 18 items now ask a State/lifecycle decision supported by visible state-specific outcomes. The answer keys, Reason, Details, and option-target messages align with their stated transitions, terminal outcomes, and retry behavior. The prompt corrections address the prior ambiguity around shared entry points, archived state, and repeated results. This is proposal review only, not source or N06-wide acceptance.

## Frozen evidence

- Proposal: [`review-inputs/N06-B02-v2.json`](review-inputs/N06-B02-v2.json), SHA-256 `2bcb129d105b26b8b84ed9c2898df5a85e062a650103995ab4264952868e674e`.
- Unit notes: [`review-inputs/N06-B02-v2-NOTES.json`](review-inputs/N06-B02-v2-NOTES.json), SHA-256 `1ffd34047ea06f62001bf549bca42762369a45eb2ac2ce32d2d7daad1d40ad72`.
- Frozen structure/scoring and current warning receipts were inspected for this exact snapshot; the warning receipt has one sole-longest flag. That flag is advisory and not a rejection criterion.
- Baseline: producer commit `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`; original and current answer meanings were compared by `answer.optionId`. Whole-object fingerprints use SHA-256 over compact insertion-order JSON (`ensure_ascii=False`, separators `(',', ':')`).
- Applicable source: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §§4.1–4.4 and 5B–5C.

## Item findings

| Item | Visible contract and keyed response | Result |
|---|---|---|
| i001 | Shared API and retry worker call the same request; consent gates disclosure. The owner-local transition retains `received` before consent and records handoff afterward. | PASS |
| i002 | The full stage/operation matrix is visible; one lifecycle rule prevents operations outside their stages. The Reason and Details explain the matrix and mutually exclusive stages. | PASS |
| i003 | Only `decided` archives; `archived` returns its existing record. The prompt now exposes the terminal repeat outcome. | PASS |
| i004 | `scanning` permits cancellation; `published` preserves the asset. Feedback distinguishes a no-change result from a transition. | PASS |
| i005 | Trial activation, active renewal, and expired reactivation have separate prerequisites; renewal cannot bypass eligibility. | PASS |
| i006 | Only prepared samples may be measured; discarded is terminal; the shared operation owner enforces stage behavior. | PASS |
| i007 | Confirmed permits check-in; held/released do not; a successful retry returns the existing result. The Details explicitly avoid network-level exactly-once claims. | PASS |
| i008 | Resolved permits reopen but not response until reopening; the same API makes the stage boundary visible. | PASS |
| i009 | Queued removal, running cooperative stop request, and succeeded-output preservation are distinct outcomes. The explanation does not claim a worker has stopped before acknowledgment. | PASS |
| i010 | Edit/sign operations depend on mutually exclusive editable/submitted/signed stages; signed is terminal. | PASS |
| i011 | Capture follows approval; captured retries return the stored result; decline cannot become capture. Details bound retry semantics locally and disclaim remote exactly-once behavior. | PASS |
| i012 | Check-out is only from available; return is permitted from checked-out/overdue; returned repeats the existing receipt. | PASS |
| i013 | Evidence, one appeal, and terminal dismissal are visible; lifecycle rules are distinguished from caller authorization. | PASS |
| i014 | Configuration precedes execution, retry follows failure, and success is immutable; the shared API includes scheduler and other callers. | PASS |
| i015 | Address edits stop at carrier acceptance; a separate exception is required afterward; delivery is terminal. Details do not promise carrier acceptance of an exception. | PASS |
| i016 | Confirmation requires a seat and waitlist-offer acceptance; withdrawn is terminal across registration/support entry points. | PASS |
| i017 | Authorization precedes receipt; receipt precedes refund; refunded repeats its stored result. The question separates local lifecycle handling from remote settlement guarantees. | PASS |
| i018 | Confirmation requires a valid hold; canceled remains terminal and repeats its original result. The Details avoid ungrounded clock/distributed-expiry guarantees. | PASS |

The proposal preserves the 18 existing question IDs because each retains the State/lifecycle learning objective. Correct options now have case-specific IDs rather than reusing the predecessor’s generic `owner_preserves_contract` ID for the newly authored response text; wrong-option IDs and messages also bind to the current options. The one longest-option advisory in this snapshot does not form a systematic cue on inspection: the competing options present concrete, distinct lifecycle violations and the correct answer is not selected by answer shape alone.

No unsupported external framework guarantee was used to establish correctness; the state, retry, and terminal outcomes are supplied by the scenario. No implementation, source, runtime, producer, consumer, admission, native, or full-N06 acceptance is claimed.
