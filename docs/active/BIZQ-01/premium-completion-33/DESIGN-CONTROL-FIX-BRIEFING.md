# BIZQ-01 — Design answer control presentation

## Cel
Correct actual Design choice feedback and accessibility semantics, preserving the saved Q2 and canonical scoring/materialization boundaries.

## Ustalenia
Native submitted Q2 exposes “Selected” rather than “Selected, correct”. DesignInterviewPracticeScreen supplies neither feedbackControls nor choiceSelectionMode to the shared response builder. The facade exposes messages but no canonical choice controls. Coding already wires both. Design choice_multiple supports multiple selections but the shared builder defaults to radio semantics.

## Podejście
Reuse projectCanonicalChoiceFeedbackControls in the Design facade, only inside materialized feedback. Pass those controls and the interaction-derived single/multiple mode to the existing screen response builder. No content, score, persistence, AnswerOption, auth, provider or schema changes. Non-choice controls remain empty. Extend existing durable-submit/rebind and committed-only tests with keyed feedback states; add a representative multiple-choice contract test. Verify shared presentation states and native saved Q2 after refresh without resubmitting; then continue wrong-response/Details acceptance. Screens and raw evidence remain private.

Ownership: root implements the facade, screen and relevant regression tests; independent Luna High reviews design and acceptance. Preserve all foreign work. Stop if the saved session/attempts change unexpectedly.

Fit 0.98: fixes a witnessed presentation defect in the canonical flow. Simplicity 0.97: reuse existing control projection and builder. Risk 0.94: feedback remains gated by materialization; no writes or scoring changes. Maintainability 0.97: same canonical pattern as Coding. Minimum 0.94.

Acceptance: selected correct/incorrect and omitted correct map by stable option IDs; no feedback before materialization; multiple choices expose checkbox semantics; saved native Q2 retains its response and gains correct feedback semantics. Existing ordering/matrix behavior stays unchanged. This slice alone is not full BIZQ-01 or release.
