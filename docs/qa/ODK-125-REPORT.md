# ODK-125 — explicit answer feedback states

Date: 2026-09-21  
Status: `VERIFIED_CLOSED`

## Outcome

Choice feedback now preserves four explicit post-submit states across Certification Practice and completed Review: selected-correct, selected-incorrect, correct-not-selected, and remaining not-selected. Each state has visible text, a glyph, a distinct outlined/surface treatment, and localized accessibility label/value semantics. Native `checked` is derived only from the learner's actual selection; a correct answer that was not selected remains `checked=false`.

The scoring function, authored correct key, durable response and content schema are unchanged. A single canonical application projection derives feedback states from authored answer evidence plus the durable learner response. Deferred sessions still return no feedback projection before completion.

## Exact runtime evidence

- Track: `claude-certified-architect-professional-certification`
- Mode: `certification-focus-practice`
- Item: `CCARP-D01-O01-boundary`
- Submitted response: option `b` (incorrect)
- Correct response: option `c`
- Viewport: iPhone 17 simulator, 402 × 874 pt (943 × 2048 px capture)

Accessibility tree after `Check answer`:

- option `a`: `unchecked, Not selected`
- option `b`: `checked, Selected, incorrect`
- option `c`: `unchecked, Correct answer, not selected`
- option `d`: `unchecked, Not selected`

Evidence:

- [Light](evidence/ODK-125/feedback-light.png)
- [Light — scrolled states](evidence/ODK-125/feedback-light-scrolled.png)
- [Dark — scrolled states](evidence/ODK-125/feedback-dark-scrolled.png)
- [Accessibility Large](evidence/ODK-125/feedback-large-text.png)
- [Accessibility Large — scrolled states](evidence/ODK-125/feedback-large-text-scrolled.png)
- [Increase Contrast — scrolled states](evidence/ODK-125/feedback-increased-contrast-scrolled.png)

The paired large-text captures demonstrate that the prompt and feedback options remain reachable through the scroll container while the action footer remains available. Light, Dark and Increase Contrast retain text/glyph/outline distinctions rather than relying on color alone.

## Implementation

- `projectCanonicalChoiceFeedbackControls` is the single answer-evidence projection for single- and multi-select choices.
- Certification immediate feedback now carries those controls across the application boundary; deferred feedback remains absent.
- `CertificationPracticeSessionScreen` consumes application-owned states instead of reconstructing correctness in UI.
- `PracticeResponseControls` maps `checked` only from actual learner selection.
- `AnswerOption` renders localized state badges with glyph, text, soft surface and explicit outline; omitted-correct has a separate dashed outline.
- completed Review uses the same component and the same localized state semantics.
- pre-submit `neutral` remains distinct from post-submit `not_selected`.

## Verification

| Gate | Result |
| --- | --- |
| Independent approach validation | **APPROVE**, minimum 0.86 |
| Independent implementation QA | **PASS**, no P0–P2; consistency 0.95, simplicity 0.90, risk 0.86, maintainability 0.88 |
| Focused application/presentation/accessibility tests | **74/74 PASS** |
| App typecheck | **PASS** |
| Runtime privacy boundary | **PASS** |
| Content boundary | **PASS** |
| `git diff --check` | **PASS** |
| Simulator Light/Dark/Large Text/Increase Contrast | **PASS**, exact item and viewport above |
| Accessibility tree | **PASS**, exact checked/value matrix above |

The repository-wide suite was not used as evidence because the working tree intentionally contains the sequential bootstrap, ODK-124 and ODK-125 release-candidate changes; release-manifest cleanliness checks remain expected until the candidate is frozen.

## Removed/replaced paths

- Replaced Certification Practice's `selected/neutral` reconstruction that discarded application feedback controls.
- Replaced `omitted_correct => checked` with selection-only checked semantics.
- Replaced color-dominant correct/incorrect fills with text, glyph, outline and soft-surface state treatments.
- Removed no scoring, correct-answer, response, schema or content path.

## Remaining limitations

- Device evidence uses one single-select item to show incorrect selection, omitted correct and remaining options together. Multi-select state combinations are covered by canonical and completed-review tests, not a separate device capture.
- The app exposes localized status text in English and Polish. Other planned release locales remain owned by the later release-localization task.
- Some component assertions are source-contract tests rather than renderer-level tests; exact device screenshots and the accessibility tree cover the resulting layout and semantic risk.
