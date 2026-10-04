# Independent semantic review — OOD-N02-B05 v6 option-shape correction

**Verdict: PASS for the two changed options; the B05 option-length warning is resolved in this frozen input.** Reviewed `REVIEWED-B05-v6.json`, SHA-256 `ac6e20b5eb4d2602ddf294185809d49465de9444d1f725330e5793dcfe4b455c`. `ROOT-B05-STYLE-DIFF.json` identifies only the correct-option text leaves for i032 and i034 as changed from v5. I re-read the changed options against their full prompts and unchanged alternatives. Prior whole-object semantic PASS conclusions for the other 17 exact objects remain applicable.

## Changed choices

- **i032:** “Validate cross-entry conflicts across the full set; publish an immutable replacement only when coherent.” This retains the needed distinction between checking the set as a whole and independent per-row validation, and the conditional immutable publication. It remains meaningfully different from alternatives that publish rows immediately, mutate the active collection during validation, allow conflicts to be resolved at runtime, or validate each row independently. The revised wording is shorter without dropping the cross-entry rule.
- **i034:** “Review the immutable proposal using captured destination, attendee count, capacity, and cancellation policy.” This answers the prompt’s question about what review uses and preserves all four captured facts. It is no longer the uniquely longest choice; the most concrete wrong option about rereading a live attendee count is longer. The omitted “room” before capacity is not a lost fact: the prompt says the proposal contains the destination, attendee count, and room capacity, and the key retains destination and capacity.

## Unit-level style check

I rechecked current B05 options across all 19 items using the advisory as a locator, not as a threshold. Eight keys are strictly longer than every distractor. In the remaining 11, a distractor is longer or the key ties. The remaining longer keys (i021, i023, i026, i029, i031, i035, i036, i038) are not built from one repeated “enumerate every favorable fact” template: they cover different decisions such as copying a mutable nested graph, preserving a final result, separating delivery state, or retaining a reader-held immutable snapshot. Their nearest alternatives also express recognizable competing assumptions, and some exceed or tie the key length.

After the i032/i034 revisions, the choice lengths no longer provide a consistent shortcut to the answer. This judgment does not require equal lengths or treat eight as a passing quota; it rests on the changed unit-wide pattern and content of the alternatives. The accepted keys still contain the specific decision being tested.

The other 17 whole-object semantic conclusions remain reused from the exact-match v5 review; this is not a new cross-unit or 152-item acceptance. No source, consumer, runtime, or native readiness claim follows.
