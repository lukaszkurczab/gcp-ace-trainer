# Independent semantic review — OOD-N01-B04

## Verdict

**REVISE — visible-premise ambiguity in `i027` and `i033`, with two substantial cross-unit duplicate decisions in `i028` and `i031`.** Review is bound to [REVIEWED-B04-v1.json](./REVIEWED-B04-v1.json), SHA-256 `505ef100e4839d4ef0b5db2760a57d731e6cdd64cf604ca06997a6c2655a40bb`.

I reviewed each of the 17 complete objects, including prompt, key text, all options, Reason, all five Details fields, and wrong-option messages. The state-transition unit is generally coherent: each prompt says what invariant or precondition governs a proposed change, and the keyed choices usually follow those facts. Four exceptions below prevent acceptance: two prompts permit more than one legal transition, and two reuse an already-covered decision almost verbatim. These findings rely on BIZQ-01 §4.1's visible-premise/unique-answer contract and the concrete cross-unit duplication risk in this fixed 119-item closure batch; they do not impose a universal requirement that all questions use different concepts or prose.

## Required corrections

- **`ood-n01-b04-i027`:** The prompt says approval requires a passed control and that the control record is missing. It does not say the request must remain open, that the control may still arrive, or that incomplete controls cannot be a ground for permanent rejection. Therefore both “pending-controls” and “rejected permanently” can be legal policies under the visible facts. If pending is intended as the unique answer, state that the control is merely outstanding and may be supplied, and that unresolved requests remain pending; reserve terminal rejection for a failed control or another stated ground.
- **`ood-n01-b04-i033`:** The key rejects/holds the new overlapping reservation, but option C moves the existing 14:00–14:30 reservation to 14:00–14:20 so it no longer overlaps. The prompt prohibits overlaps; it does not prohibit rescheduling the existing reservation or state that operator consent is required. Thus C may satisfy the sole stated invariant. Add the missing no-move-without-consent premise (and state no consent is present), or replace C with an alternative that necessarily leaves an overlap.
- **`ood-n01-b04-i028` vs `ood-n01-b02-i018`:** Both ask about recording replacement when a stable-ID annotation has no matching segment, prohibit losing/orphaning it, and key to keeping the old revision/recording active until the mapping is resolved. The distinction between B02 “return a rejection” and B04 “keep the old revision active” is mainly a rephrasing of the same decision under the same concrete facts. Change B04's scenario and decisive transition so it exercises a different state rule, rather than counting the same unmatched-annotation replacement decision twice.
- **`ood-n01-b04-i031` vs `ood-n01-b02-i021`:** Both use the same trigger: a payout ID is already paid/released with a ledger reference and the release is repeated. Both key to preserving the completed effect and avoiding a second ledger entry. B02 asks the caller-visible `already-applied` result; B04 asks what domain state remains. That changes the requested surface but not the decision the learner must make. Replace B04's repeated-payout case with a different state transition if this closure is meant to add a distinct repaired decision.

## Per-item review

| Item | Result and decisive facts |
|---|---|
| `i018` | Pass. Parent ID and original delivery promise remain until all 12 units arrive; the 7+5 allocations conserve the quantity. |
| `i019` | Pass. Same plot and history persist, and Bo's acceptance precedes ending Ada's reservation. |
| `i020` | Pass. Published total is explicitly 30 + 20 − 5, so publication at 45 is the only option satisfying the invariant. |
| `i021` | Pass. An expired five-minute hold no longer consumes capacity; admission still checks active reservations at commit. |
| `i022` | Pass. Permanent asset identity and both source-provenance records survive; only curator-approved tags can be merged. |
| `i023` | Pass. Territory must be explicit and expiry future at activation; draft-time validity cannot satisfy activation later. |
| `i024` | Pass. One active aircraft assignment and preserved old/new history require a single move transition. |
| `i025` | Pass. Consent is revoked before the protected outbound send, and the prompt requires active consent at send time. |
| `i026` | Pass. The pinned revision/policy remain the attempt's context, and the explicit late rule leaves it incomplete without a score. |
| `i027` | **Revise.** Missing control blocks approval, but the prompt does not rule out permanent rejection as an alternative policy. |
| `i028` | **Revise for cross-unit duplication.** The no-orphan/old-revision decision duplicates B02 `i018` under the same annotation-replacement facts. Its internal key and targeted feedback otherwise follow the described invariant. |
| `i029` | Pass. Expiry itself removes authorization; extension requires new approval, not UI activity or a request. |
| `i030` | Pass with context overlap noted. The prompt tests state binding to a particular immutable digest: signer rejection leaves that revision unsealed. Its primary objective differs from B02 `i024`, which asks how to report a definitive rejection versus an unknown acknowledgement. |
| `i031` | **Revise for cross-unit duplication.** Same already-paid payout replay and no-second-effect decision as B02 `i021`, with the caller-result wording changed to a domain-state question. |
| `i032` | Pass. A correction must append after and link to the effective event; changing its timestamp or deleting it falsifies history. |
| `i033` | **Revise.** Option C can remove the overlap by moving the current reservation, and the prompt does not make that move unauthorized. |
| `i034` | Pass with context overlap noted. B01 `i019` defines the caller's success/failure contract for a provider switch; this item asks whether a ready provider may cut over before a chunk boundary. The explicit no-mixed-chunk condition adds a distinct state-transition precondition. |

The B04 examples of consent revocation, expiry, publication invariants, and handoff are derived from facts stated in the prompts. I did not infer that these are universal behaviors of real systems. No external source claim is needed to decide the keyed transition here.

The answer-length profile does not suggest “longest option is correct”: only 2 of 17 keyed choices tie or exceed the longest distractor by word count. Repeated transition-oriented language in Details is not itself a blocker where the following sentence explains the item's concrete state condition. This is a source-semantic review only; it does not establish implementation, admission, rendering, native-runner acceptance, or full BIZQ-01 closure.
