# Independent semantic review — OOD-N01-B02

## Verdict

**REVISE — one required feedback correction in `i018`; the other 16 decisions are semantically supported by their visible prompts.** This review is bound to [REVIEWED-B02-v3.json](./REVIEWED-B02-v3.json), SHA-256 `6c09f9223ceb8f7a57251b002bf767e8734e839aa4fddf438251041d88d7ae57`.

I reviewed all 17 whole objects: prompt, keyed option text, every distractor, Reason, five Details fields, and each option-ID-targeted message. The unit has one coherent caller-outcome objective, and the items exercise distinct result distinctions such as stale preconditions, duplicate effects, explicit rejection, unknown outcomes, conflicts, partial progress, and pending side effects. The facts stated in each prompt are sufficient to choose the keyed result; these are scenario guarantees, not claims that a transport, signer, ledger, or service universally provides the behavior.

## Required correction

`ood-n01-b02-i018` is keyed correctly: the prompt says only complete replacement revisions become active, so the replacement with an unmatched annotation must be rejected while the current recording remains active. But option `b` explicitly retains the unmatched annotation for manual follow-up and says the new recording becomes active with a warning. It violates the **no-partial-revision-active** premise; it does not lose the annotation. The message targeted to `b` currently says, “Partial application loses one annotation despite the explicit no-loss promise.” That diagnoses a different failure and contradicts the option. Change that targeted feedback to explain that activating a partial replacement violates the complete-revision acceptance rule and leaves an unresolved annotation within an active revision. This is required by BIZQ-01 §§4.1 and 4.4 and Q05, because the selected wrong answer currently teaches an inaccurate reason.

## Per-item decision review

| Item | Result and decisive visible premise |
|---|---|
| `i018` | **REVISE feedback only.** Complete revisions alone become active; the key rejects and preserves current state. The `b` message incorrectly claims annotation loss although the option queues it for follow-up. |
| `i019` | Pass. Consent was revoked before processing; the correct result rejects the grant and identifies the revoked approval. A short unauthorized grant would still violate the prerequisite. |
| `i020` | Pass. Timeout leaves acceptance unknown, and the same request ID is queryable; neither a fresh-ID failure nor endpoint delivery resolves signer acceptance. The key preserves uncertainty and avoids an ungrounded duplicate. |
| `i021` | Pass. The stable payout key already has a paid ledger record; `already-applied` distinguishes recognition from a second transfer. |
| `i022` | Pass. An already accepted effective change cannot be reordered, and the controller must resolve the conflict; returning both proposals without changing the board is uniquely supported. |
| `i023` | Pass. The meter permits one committed window and the service lacks consent to move it; returning conflict without a reservation preserves operator control. |
| `i024` | Pass. This is materially distinct from timeout in `i020`: the signer definitively rejected and confirmed no seal, so `signing-rejected` is accurate rather than unknown/pending. |
| `i025` | Pass. The assignment changed before commit and half-swaps are forbidden; the stale whole swap must be rejected without changing either assignment. |
| `i026` | Pass. The endpoint touches a deleted segment, and both branches must remain available; a conflict preserves author intent rather than guessing by clock or geometry. |
| `i027` | Pass. The command is read-only with respect to quest completion and the quest is incomplete; a specific ineligible result explains why no reward was issued. |
| `i028` | Pass. Temperature compatibility alone is insufficient: the new carrier declined custody, and the prompt requires retaining the current carrier until acceptance. |
| `i029` | Pass. The command is debt-only, full-amount-or-no-change, and excess credit requires a separate command; rejecting 140 against a 120 balance is the only supported atomic result. |
| `i030` | Pass. The match is finalized, the bracket already advanced, and no correction authority accompanies the command; report the existing result without repeating progression. |
| `i031` | Pass. The requested operation only records inspection classification; refund review is separate, so recording damage without deciding eligibility respects the boundary. |
| `i032` | Pass. Publication requires an explicit immutable code-version reference, which is missing; rejecting and naming it avoids inventing provenance. |
| `i033` | Pass. Comment acceptance is complete, while notification is independently retryable; the response reports accepted comment and pending notification without rolling back or claiming delivery. |
| `i034` | Pass. Three sections are persisted independently but all four are required for completion; show partial sync, retain accepted sections, and keep the inspection incomplete. |

## Distinctness and style

Compared with accepted B01, this batch asks what result the caller observes, while B01's decisions model actor, goal, participant, or subject. The reviewed B03 identity/value and domain-operation questions share a few contexts (annotations, signing, payout, transit, meter reservation, volunteer swap, route edits, shipment reassignment, repayment) but ask which concepts have identity or where behavior belongs. B02 asks the caller-facing result. For example, B02 `i023` returns a no-move collision outcome; B03 `i028` classifies reservation identity versus normalized interval equality. B05's vocabulary objective is also separate. These are contextual overlaps, not duplicate primary decisions.

There is no longest-answer shortcut signal in this proposal: only 4 of 17 correct options tie or exceed the longest distractor by word count. I did not treat equal prose length or unique wording as a requirement. The shared alternate-outcome mechanism language is acceptable where the scenario-specific sentence names the actual uncertainty, conflict, or state transition; the surrounding Reason and other Details fields generally apply the mechanism to the exact facts.

The external references are not used to claim universal idempotency, atomicity, retry, or delivery guarantees. Each such behavior is explicitly stated in the learner-visible scenario; the key is evaluated against those authored premises. This is a source-quality review only and does not establish source admission, consumer rendering, native-runner acceptance, or full BIZQ-01 closure.
