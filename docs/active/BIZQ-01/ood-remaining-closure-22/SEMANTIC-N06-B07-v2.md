# Independent semantic review — N06-B07 v2

**Verdict: REVISE.** The v2 explanations and option-target feedback are materially cleaner than v1, and the original Template Method QIDs remain justified. However, the revised questions still fail to distinguish the intended Template Method decision from a reasonable Strategy/composition design, and the stem supplies nearly the same fixed-step/variable-step recipe as the keyed option.

## Frozen evidence

- Proposal: [`review-inputs/N06-B07-v2.json`](review-inputs/N06-B07-v2.json), SHA-256 `8b2d6da8201b0093809c5f608606867c28ca78c0bfafaeaf70ec4e2557016b13`.
- Unit notes: [`review-inputs/N06-B07-v2-NOTES.json`](review-inputs/N06-B07-v2-NOTES.json), SHA-256 `d76803c8e7c6a32927f57a01a11c1056ea9b6d8687c5a6d6c722c6b122dc0b54`.
- Frozen receipt: [`ROOT-FROZEN-N06-B07-v2.json`](ROOT-FROZEN-N06-B07-v2.json).
- Baseline: producer commit `b7034f16bb77db4dde2ae27c13ef706b0301f6bb`; option answers were resolved by `answer.optionId`, not array position. Whole-object fingerprints use SHA-256 over compact insertion-order JSON (`ensure_ascii=False`, separators `(',', ':')`).
- Applicable source: `../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, §§4.1–4.4 and 5B–5C. The Template Method primary-source note records only Microsoft’s description of an algorithm skeleton with steps deferred to subclasses; it does not make a composed Strategy incorrect where the prompt permits one.

## Whole-unit assessment

All 18 items (i001–i018) now present a case-specific invariant, a named varying concern, and a keyed response that preserves the shared steps while varying that concern. Their Reason/Details and wrong-option messages mostly align with the actual cases; the prior malformed message grammar has been repaired. The revised prompts also correct the visible ordering facts in i010 and i012.

The unresolved issue is that the stems repeatedly state the answer’s organizing distinction, then ask how to accommodate it. For example, i001 says the accepted merge contract must remain while source formats change the conflict-summary format; its keyed option says to keep the merge sequence fixed and vary the conflict-summary hook. Similar prompt/key mirrors recur through i018. The remaining alternatives mostly prescribe a separate full workflow, replace the entire operation, move logic into callers, or copy the workflow. Those are not the nearest reasonable competing design: a Strategy/composed policy can preserve the same common checks and state transition while varying the calculation or adapter. Since the prompt does not state why variation must be a subclass-deferred step in a base-owned skeleton, the current key is not uniquely supported as a Template Method choice. That is a concrete §4.1 ambiguity and §4.2 recipe/disclosure concern, rather than a demand for unique stories or a ban on naming a design approach.

The console flags `correct_option_sole_longest` on all 18 items. This is not an automatic length-based rejection. Here it reinforces the substantive cue: the key is consistently the only concise complete policy, while the distractors repeat four shorter, broad anti-patterns. Together with the mirrored stem, learners can identify the answer form without deciding why Template Method is preferable to composition.

## Smallest coherent correction

Preserve the visible business invariants, but provide a scenario fact that makes the Template Method tradeoff decisive: a base-owned operation already fixes the required sequence, and one bounded step is intentionally deferred to subclasses. Then make the options distinguish that arrangement from a viable composed strategy and other realistic alternatives. Avoid spelling the exact answer in the stem, filler distractors, or equal-length rules. Keep the QIDs because the accepted and proposed primary objective remains Template Method; a mechanical new case-specific correct-option ID may be used as the approved conservative identity correction without changing content or scoring.

This proposal-only review makes no source, runtime, producer, consumer, admission, native, or full-N06 acceptance claim.
