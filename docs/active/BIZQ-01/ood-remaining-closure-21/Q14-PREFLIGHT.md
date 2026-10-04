# Q14 warning-path preflight

Read-only trace of the existing BIZQ-01 qualitative-warning paths and the remaining Q14 evidence gap. This is not an implementation, semantic judgment, or new product gate.

## Contract and current evidence

BIZQ-01 §5B says schema and mapping failures block QA, while textual heuristics create warnings for human resolution; any chosen length/similarity heuristic must be tested as a heuristic, not used to accept or reject questions ([spec lines 119–129](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md:119)). Q14 asks for one synthetic unusually long correct choice that causes a quality warning without making that answer invalid ([spec line 174](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md:174)). The current evidence matrix correctly calls Q14 partial: the existing OOD option review is qualitative but no specific warning-only synthetic fixture is established ([acceptance matrix Q14](../closure-review-18/ACCEPTANCE-MATRIX.md:20)).

There are three related mechanisms, with different scope:

1. The canonical source review console calculates risk flags in [`content-review-console.mjs`](../../../../../patternly-content/scripts/review/content-review-console.mjs:62). Current flags cover missing identity/prompt/interaction/feedback/Reason, an author instruction in learner-visible constraints, and duplicate identity. `riskOnly` filters those flags for manual review; recording an outcome is a separate explicit action. It does **not** calculate option-length or answer-position warnings.
2. [`contentReviewConsole.test.mjs`](../../../../../patternly-content/tests/contentReviewConsole.test.mjs:33) has valid-shape advisory fixtures across interaction types. It verifies that its current constraint warning is surfaced and remains unreviewed; it does not add a length-cue fixture. [`bizq01-source-slice.test.mjs`](../../../../../patternly-content/tests/bizq01-source-slice.test.mjs:119) also verifies that repaired items leave the constraint warning while the remaining warnings stay visible.
3. OOD17’s [`check-proposals.mjs`](../ood-node-closure-17/check-proposals.mjs:148) computes `soleLongestCorrect` by comparing word counts and emits it under per-unit `advisory`. Its output expressly describes schema/scoring/reversal as the PASS scope and style counts as warnings, not semantic verdicts or numeric gates ([lines 163–166](../ood-node-closure-17/check-proposals.mjs:163)). This is real evidence for a comparative heuristic, but it is a fixed OOD17 proposal checker, not the general source-review console or a synthetic warning-only test.

The OOD17 independent option review is also real qualitative evidence, not the missing fixture. It read actual answer shapes for B01–B05, diagnosed comprehensive-key cues in B02/B05, and expressly says counts are advisory rather than cutoffs ([`SEMANTIC-OPTION-WARNINGS-v1.md`](../ood-node-closure-17/SEMANTIC-OPTION-WARNINGS-v1.md)). Later targeted B02/B05 reviews resolved those specific frozen-input warnings; they do not demonstrate a synthetic option being emitted as a review warning.

## Gap and smallest useful probe

What is confirmed: a comparative “correct option is strictly longer than every distractor” statistic already runs for the fixed OOD17 proposal shape; a general source-review console already supports advisory risk flags; the canonical question contract/scorer are separate from those warnings.

What is not confirmed: a synthetic long-correct single-choice item passes through the current reviewer-warning path, is discoverable as a warning, stays valid under the actual question contract/scorer, and is not rejected or assigned a bad answer as a result. No repository test found establishes that end-to-end case.

The smallest coherent follow-up is one synthetic, schema-valid single-choice case in the existing review-console advisory test path. Give the keyed option a conspicuously longer explanation than its plausible distractors, add the existing comparative predicate to that console’s advisory risk flags, then verify the item appears in `riskOnly` as unreviewed. Separately verify that [`validateQuestion` and `scoreQuestion`](../../../../../patternly-content/scripts/content/question-contract.mjs:392) accept the item and still mark only the fixed correct option correct in original and reversed order. Keep the item unreviewed unless a human records an outcome. This requires no numeric cutoff, length parity rule, score override, or automatic semantic conclusion. The narrow implementation/test surface would be `content-review-console.mjs` and `contentReviewConsole.test.mjs`; the current OOD17 proposal checker may remain a scoped warning producer rather than becoming a product-wide dependency.

This probe would establish one warning-only behavior, not that every long option is suspicious, that every source track is scanned by that checker, or that an option-length heuristic detects semantic ambiguity. Human review must still decide whether extra wording contains necessary decision information or gives away the key. The existing semantic review remains the authority for that judgment.

No implementation or tests were run for this read-only preflight. No question, review outcome, source, artifact, or release state was changed.
