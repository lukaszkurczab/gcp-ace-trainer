# Current shared multiple-choice scoring preflight

This read-only check separates the historical FCA-SCORE-01 wrong-selection finding from the still-pending valid-partial point denominator. It does not authorize a scorer or contract change.

## Current behavior and evidence

Canonical docs/17 §7 says a non-empty proper correct-only subset is `partial`, any selected wrong option is `incorrect`, and an incorrect multiple-choice answer earns zero. Docs/16, “Interaction contracts / Multiple choice,” gives the same status rules. Their full-file SHA-256 values are recorded in the JSON receipt.

The current producer scorer at `patternly-content/scripts/content/question-contract.mjs` rejects scoring points when a selection is empty or contains any option outside the answer set. The current app scorer at `patternly/src/content/canonical/questionScoring.ts` follows the same rule. Against the current pinned content, the existing audit reproduction command:

```sh
node patternly-content/evidence/business-quality/full-content-audit-2026-10-02/scoring-probe.mjs patternly-content
```

reports both wrong-containing examples—`alg-arrays-duplicate-handling-003` and `alg-arrays-duplicate-handling-011`—as `incorrect`, `earnedPoints: 0`, `contractViolated: false`. The checked-in `scoring-probe-result.json` records earlier `partial` / 3-of-4 results. It is historical evidence of the prior behavior, not the result of the current command.

The current source contract suite passed 23/23 with:

```sh
cd patternly-content && /opt/homebrew/opt/node@22/bin/node --test tests/shared-contract.test.mjs
```

The app integration suite passed 3/3 with:

```sh
cd patternly && /opt/homebrew/opt/node@22/bin/node --import tsx --test src/application/canonical/multipleChoiceScoringIntegration.test.ts
```

That app test checks all 440 actual multiple-choice questions across 8,960 response subsets, verifies every wrong-containing subset scores zero, checks source/app parity, and exercises persisted practice and simulation outcomes plus selected/omitted feedback.

## Remaining policy dependency

For a non-empty correct-only proper subset, both current scorers award one point for each option classified correctly, which includes wrong options the learner left unselected. The shared-contract test currently expects a one-correct-option response on its four-option fixture to earn 2/4. Docs/16 and docs/17 establish the valid-partial state and permit partial points but do not specify their denominator.

The canonical plan's FCA-SCORE-01 says to establish the partial-points denominator from the owning contract before changing it and not to silently retain per-option classification. The current working state records the PO decision on the valid-partial denominator as pending. Therefore this preflight finds no current wrong-selected-option mismatch to repair, but it also does not resolve or change the valid-partial denominator. Do not change the scorer or its expected partial points until that owner decision is recorded.

## Scope and limits

This is current-code evidence for the shared scorer only. It does not claim the old full-content audit inventory is semantically re-reviewed, close the pending PO decision, or accept the remainder of BIZQ-01. Exact source, app, contract, test, probe, audit-result, plan, and state hashes are in [SCORE-CURRENT24-PREFLIGHT.json](SCORE-CURRENT24-PREFLIGHT.json).
