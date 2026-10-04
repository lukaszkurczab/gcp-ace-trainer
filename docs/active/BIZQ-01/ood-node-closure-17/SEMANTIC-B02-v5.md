# Independent semantic review — OOD-N02-B02 v5 option-shape correction

**Verdict: PASS.** Reviewed frozen `REVIEWED-B02-v5.json`, SHA-256 `2990cbe047af3761b107b19460346b8020747a0b5621521c08f32a5d6189b8bf`. The exact diff changes only three keyed choices and their matching Reason tails (i021, i035, i036). I read each changed whole object against its prompt, alternatives, stable-ID feedback, and Details. The other 16 objects are unchanged from v4 and retain their prior semantic conclusions.

## Changed choices

- **i021:** “Keep the confirmed slot and reject the move.” The scenario asks for the result when one room/time input is rejected and explicitly requires the previous confirmed slot to remain. This concise answer states both required outcomes. The alternatives respectively expose a mixed room/time slot or clear the valid prior booking. The Reason’s concrete application now repeats the selected behavior accurately.
- **i035:** “Mark the booking Cancelled; track any refund separately.” The prompt says cancellation frees the room immediately and the payment provider may still be processing a refundable amount. The answer correctly separates the booking transition from the financial follow-up; it no longer wraps both into a longer explanatory sentence. The alternatives delay cancellation or delete the booking/history, and the Reason and Details retain the explanation of the separate pending workflow.
- **i036:** “Mark it Denied and retain the audit record.” The prompt makes approval the sole path to Active and requires an audit record on denial. This answer names the terminal state and preserved record. Its wrong alternatives delete the decision or briefly grant unauthorized access before revoking it. The Reason and Details correctly explain those consequences.

## Unit-level style reassessment

The revised choices remove the former long-key outliers in these three objects without losing their contract. In the current 19 items, eight keys remain strictly longer than all distractors, but the remaining margins are generally close (five are longer by a single word), while 11 items have a longer distractor or a tie. The longer-key examples express different decisions and are not a repeated “list every favorable condition” construction; for instance, i033 must distinguish a late submission that keeps its pinned revisions from either rejection or rescore under a current policy, while i038 must distinguish retrying the same payout request from creating a duplicate or claiming success before settlement.

I treat those counts as descriptive evidence, not a threshold. Across the unit, answer lengths and positions now vary, distractors often tie or exceed the key, and the remaining longer keys state the specific action or invariant each prompt asks about. I no longer find a reliable “choose the most comprehensive/longest” shortcut. No equal-length or target-count requirement is added.

This bounded review reuses the earlier semantic PASS conclusions for the 16 unchanged objects; it does not imply final 152-item cross-unit acceptance, source activation, or runtime readiness.
