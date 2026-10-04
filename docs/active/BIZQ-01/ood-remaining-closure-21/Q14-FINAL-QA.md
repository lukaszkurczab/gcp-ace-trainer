# Independent Q14 tooling acceptance

**Verdict: PASS for the warning-only Q14 console behavior.** This does not certify N05 questions, device/native behavior, Premium eligibility, or full BIZQ-01 closure.

## Scope and requirement

Q14 in `docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md` requires one synthetic unusually long correct single-choice option to produce a qualitative review warning without making the answer invalid. Existing §5B requires textual heuristics to remain warning-only. The implementation is confined to the existing content-review console risk flag and its existing `test:canonical` test.

Reviewed current implementation:

- `patternly-content/scripts/review/content-review-console.mjs` — SHA-256 `98d5f3048a5de916f892d0461e83736c9fd356ccb0a4f901c6dc1557bbed24c2`
- `patternly-content/tests/contentReviewConsole.test.mjs` — SHA-256 `3139944064ed95ad490cc4332d7908db3777a6a747ae36b42dc0a110d2f3e43f`

The predicate is strictly comparative: the keyed option must have more whitespace-separated words than every distractor. It is limited to a single-choice answer whose nonempty, trim-clean option IDs are unique and whose option texts are nonempty. Ties, long-wrong options, missing/duplicate/malformed IDs, malformed option lists, and non-single interactions do not receive this flag. The existing question validator and scorer remain authoritative.

## Evidence

I independently ran the focused console and source-slice tests in `patternly-content`:

```text
node --test tests/contentReviewConsole.test.mjs tests/bizq01-source-slice.test.mjs
11 passed, 0 failed
```

The new fixture confirms that the valid synthetic case is found in `riskOnly`, remains `unreviewed`, and does not create an outcomes file. It validates the synthetic question and scores every option in both original and reversed order, with only the correct option earning the point. Controls cover tied lengths, a longer wrong option, null options, missing key, duplicate option IDs, empty/whitespace/padded IDs, and a multi-choice item. Existing constraint-risk assertions now count that specific warning, preserving their former meaning instead of counting the newly added Q14 flag.

I also ran an isolated temporary-source probe for an empty keyed ID. Before the guard correction, the schema-invalid item produced `correct_option_sole_longest`; this exposed that the original guard accepted empty IDs. The current implementation rejects that ID shape for this heuristic. Repeating the probe after correction produced `validateQuestion(...).valid === false` and no Q14 flag. The test suite now covers the empty, whitespace-only, and padded forms. The temporary fixture was removed; no source or outcome was written.

The required canonical suite completed after the correction: [`Q14-ROOT-CANONICAL-CORRECTION.log`](Q14-ROOT-CANONICAL-CORRECTION.log) reports 159 tests, 159 passed, 0 failed, 0 skipped. `git diff --check` also passed in `patternly-content`.

## Result and boundary

The warning is advisory only: it neither rejects the question nor records an outcome, and the actual contract validator/scorer retain answer-ID behavior under option reversal. No question source, score contract, admission, runtime, or publication behavior changed. The isolated integration fixture uses short distractors to exercise the warning condition; it demonstrates this heuristic path only and is not a semantic acceptance of authored questions.

The initial focused run before the nonempty-ID guard passed its existing tests but missed the malformed empty-ID case. The guard and test were corrected within the reviewed approach; the final focused run, isolated probe, and post-correction canonical run all pass. No additional app, native, artifact, or service checks were required for this console-only change.
