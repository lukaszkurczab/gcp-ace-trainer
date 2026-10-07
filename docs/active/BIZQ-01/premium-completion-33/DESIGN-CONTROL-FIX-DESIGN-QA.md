# BIZQ-01 Design choice feedback controls — independent design review

**Verdict: PASS WITH GAPS for the proposed fix and verification plan.** The witnessed defect is in the Design presentation adapter: the canonical feedback projection already knows per-option correctness, but the Design screen never supplies those controls to the shared response builder. The saved response should remain untouched.

## Source assessment

`designInterviewSessionFacade.ts:31-34, 75-90` exposes the current question, response, authored messages, and feedback only after a materialized attempt exists. A committed-but-unmaterialized attempt appears only as `response.source === "committed"`; `feedback` stays `null`. That is the correct materialization boundary to preserve.

The canonical helper `canonicalInteractionPresentation.ts:42-60` already maps stable option IDs to `correct`, `incorrect`, `omitted_correct`, or `neutral`, validates that response and interaction types agree, and returns frozen controls. The Design screen currently calls `buildPracticeResponseControl` at `DesignInterviewPracticeScreen.tsx:178-183` with only local response and the canonical renderer, then adapts feedback separately at lines 315-320. This explains why a saved correct selection is projected as plain `selected`. The shared builder at `practiceSessionPresentation.ts:194-213` already consumes feedback by stable ID and maps neutral feedback to `not_selected`; its default selection mode is `single`. The shared native control at `PracticeResponseControls.tsx:35-48` derives radio versus checkbox from that selection mode, and `:102-125` provides the correctness accessibility value. Thus the proposed facade-to-screen-to-builder wiring reuses existing ownership and renderer behavior; no scoring, response, persistence, or content logic belongs in the view.

The adapter should expose choice feedback controls only from the facade's already-materialized feedback. Use `projectCanonicalChoiceFeedbackControls(question, materializedAttempt.response)` in that branch; do not compute controls from the committed-only response fallback. Derive selection mode from the canonical interaction (`choice_multiple` → `multiple`, `choice_single` → `single`), not from response length or local selection. Non-choice interactions must continue to supply no choice feedback controls. Preserve existing stable option IDs/order and authored feedback messages.

## Verification adequacy and gaps

The existing `designInterviewChoiceFeedback.test.ts` exercises actual Design pools, correct/wrong choice feedback, durable submission, rebind, journal-write failure, committed-only state, and recovery. It currently asserts authored `messages`, not per-option controls. Extend these durable-boundary cases to assert keyed states for selected correct, selected incorrect, and omitted correct options, plus that controls remain absent with no materialized attempt and appear after recovery. Add a representative `choice_multiple` contract case so the canonical helper's multi-select output is exercised through the Design projection.

The existing `practiceFeedbackDelivery.test.ts` extracts the actual JSX adapter expressions with TypeScript AST. Reuse that strategy for the `buildPracticeResponseControl` input so the new screen wiring is tested, rather than only testing the helper and builder in isolation. The standalone builder tests already prove single/multiple state mapping; the adapter test must also establish that actual Design code passes both feedback controls and interaction-derived selection mode. This is the important regression seam because the current omission is at that call site.

For native acceptance, refresh/resume the same saved Q2 and assert the identical selected option, session/index, and one existing attempt, while its accessibility projection now reads “Selected, correct” (and other options retain their correct non-selected state). Do not submit Q2 again. This confirms the actual saved-response path and prevents a memory-only test from standing in for native behavior. Then continue the already-authorized wrong-answer/Details flow, verifying its authored message only after expansion. A native multi-choice screen assertion is useful if an existing upcoming question supports it without creating/replacing a session; otherwise the representative shared-builder plus actual Design-adapter contract test is adequate for this narrowly scoped wiring fix. Do not broaden into a new answer/session fixture merely to obtain it.

No regression is expected for ordering or decision-matrix questions: the new control projection is choice-only, and the shared builder ignores choice-only inputs for the other renderer kinds. Keep ordering messages, matrix controls, lifecycle retry behavior, option ordering, scoring, and persistence unchanged. This slice does not close BIZQ-01 or establish provider/release acceptance.

## Scores

| Dimension | Score | Reason |
| --- | ---: | --- |
| Objective and architecture fit | 0.98 | Repairs the witnessed adapter omission using the existing canonical feedback contract and shared screen model. |
| Simplicity | 0.96 | Adds projection data and forwards it at one existing builder call; no duplicate scoring or rendering path. |
| Risk | 0.92 | Materialized-only controls preserve the durability boundary; stable IDs avoid order-dependent marking. |
| Maintainability | 0.95 | Aligns Design with existing Coding behavior and reusable canonical helpers. |
| **Minimum** | **0.92** | Above the required 0.8 threshold. |

## Reviewed inputs

- `docs/active/BIZQ-01/premium-completion-33/DESIGN-CONTROL-FIX-BRIEFING.md`
- `src/application/design-interview/designInterviewSessionFacade.ts`
- `src/features/practice/DesignInterviewPracticeScreen.tsx`
- `src/features/practice/practiceSessionPresentation.ts`
- `src/features/practice/PracticeResponseControls.tsx`
- `src/application/canonical/canonicalInteractionPresentation.ts`
- `src/application/design-interview/designInterviewChoiceFeedback.test.ts`
- `src/features/practice/practiceSessionPresentation.test.ts`
- `src/features/practice/practiceFeedbackDelivery.test.ts`

This review assesses the design and its proposed checks only. No source implementation, test execution, app state, or runtime was changed or evaluated here.
