# Q14 warning implementation

Implemented the reviewed warning-only path in the existing content review console. For a well-formed `choice_single` with at least two nonempty authored options, unique option IDs, and exactly one option matching the single-choice answer ID, `riskFlags` now adds `correct_option_sole_longest` when the keyed option has strictly more whitespace-separated words than every distractor. Tied lengths, a longer distractor, non-single interactions, missing/ambiguous key IDs, and malformed option collections do not produce this signal. It remains an advisory risk flag: it does not validate or reject content, change answers or scoring, or write an outcome.

The focused test builds an isolated nine-track source fixture from real question shapes, replaces one coding item with a schema-valid synthetic long-key case, and exercises the actual console projections and `riskOnly` query. It checks tied, long-wrong, multi-choice, and malformed controls; verifies the warning remains unreviewed and no outcome file is written; and runs `validateQuestion` plus `scoreQuestion` for every option in original and reversed option order. The existing constraint-warning assertions still count only `author_instruction_in_constraints`, so the new advisory cannot change their meaning.

## Verification

The pre-implementation RED is recorded in [`Q14-WORKER-RED.log`](Q14-WORKER-RED.log): the synthetic item was valid but had no `correct_option_sole_longest` flag. After implementation:

- Focused Q14 test: 1/1 passed ([log](Q14-WORKER-FOCUSED-GREEN.log)).
- Console and source-slice tests: 11/11 passed ([log](Q14-WORKER-CONSUMER.log)).

The first combined run after adding the signal exposed that the old constraint-only test asserted the total number of all risk-only rows. I narrowed that assertion to count only its existing constraint flag, preserving its prior intent; the rerun passed. No full `test:canonical` run was performed here; root owns that gate and actual diff/source preservation review.

Changed files are `patternly-content/scripts/review/content-review-console.mjs` and `patternly-content/tests/contentReviewConsole.test.mjs`, plus these owned Q14 evidence files. Unrelated untracked `dist/` and `evidence/business-quality/full-content-audit-2026-10-02/` were present in the content worktree and were left untouched. No question sources, scoring implementation, review outcomes, artifacts, proofs, catalogs, or release state were modified. Any resulting `riskOnly` list volume is a set of advisory candidates for human review, not a defect or rejection count; a flagged item still requires contextual assessment under BIZQ-01 §4.3.
