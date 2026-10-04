# Independent semantic review — OOD-N02-B02 v4 option-shape correction

**Verdict: the two changed choices pass; the unit-level systematic answer-length warning remains unresolved.** Reviewed frozen `REVIEWED-B02-v4.json`, SHA-256 `2ced673eaf719825c816a382e4e6c0811634759f504cd4a4347865381935e62d`. `ROOT-B02-STYLE-DIFF.json` records only three leaves: i022’s keyed choice and matching Reason sentence, plus i023’s keyed choice. I rechecked those meanings against the complete prompts and alternatives. The other 17 whole objects remain unchanged from the semantic PASS review and are reused.

## Changed choices — PASS

- **i022:** “Stay Closing and retry; close only after a complete export.” This directly expresses the prompt’s required failed-export state and the condition for later closure. It remains distinct from both alternatives: reopening would admit new strokes, while closing before success would discard a failed export. The matching Reason sentence uses the same concise decision.
- **i023:** “Apply only a response for the current pending proposal; mark delayed P1 stale.” The prompt supplies the replacement of pending P1 by P2 and says a stale response cannot publish its old package or clear P2. The shorter key keeps the needed correlation and stale-result handling without replacing it with an ambiguous blanket rejection; the matching-acceptance alternative remains plausible but wrong under the separate “current pending proposal” condition.

## Remaining answer-shape pattern — REVISE

The two edits remove the largest verbosity outliers, but the broad pattern remains visible in current B02: 11 keys are strictly longer than every distractor. I did not treat that count as a threshold. I inspected what makes the key longer. In many of those items the correct choice alone combines the intended transition with the preserved state, while each distractor is a short single-step failure. For example:

- **i021** keys “Have Booking propose the new room and time, then replace the confirmed slot only after both acceptances succeed” (18 words) against 15- and 14-word choices. Both accepted inputs and retention of the previous slot on rejection are central to the prompt; the alternatives state partial-write failures.
- **i035** keys cancellation plus the separate pending refund workflow (14 words) against 9- and 10-word alternatives that either delay cancellation or delete history. The complete key is the only option that states both parts of the desired outcome.
- **i036** keys denial, audit retention, and non-activation (17 words) against 14- and 9-word choices that each violate one of those consequences.

Other longest-key cases are close—often one or two words—and several wrong options in the unit tie or exceed the key, so no individual item should be rewritten merely to equalize prose. The issue is that a learner can still repeatedly choose the option that bundles the requested state and all its favorable consequences; that strategy matches the keyed choice in more than half of this unit. The existing requirement is to remove systematic length cues, not to hit a particular percentage. The remaining pattern is therefore a real residual cue, not a numeric-gate finding.

**Minimum correction:** improve the remaining answer/distractor pairs where the key alone bundles every preserved consequence and its wrong choices describe only one obvious omission. Keep each choice plausible and anchored to its specific misconception; do not pad distractors or impose equal word counts. Then recheck the unit qualitatively. No change is requested to the two corrected choices.

This report is limited to B02’s answer-shape warning. It reuses prior semantic findings for the 17 unchanged whole objects and does not reopen their correctness or claim final cross-unit acceptance.
