# BIZQ-01 Design choice-feedback controls — independent acceptance review

**Verdict: PASS WITH GAPS for the bounded saved-Q2 presentation fix.** The implementation reuses canonical per-option feedback state at the existing materialization boundary and passes it to the shared control builder with selection mode derived from the canonical interaction. The saved Q2 native evidence now exposes the selected option as “Selected, correct” without an answer resubmission.

## Findings

The source diff is limited to the Design facade, the Design screen adapter, and two focused regression tests. The facade adds projectCanonicalChoiceFeedbackControls only while constructing feedback from materializedAttempt; the committed-only fallback remains a response and cannot leak correctness state. The screen forwards projection.feedback?.controls and chooses “multiple” only for choice_multiple. The shared builder already maps those stable IDs to option states, and the native option component maps the mode to radio/checkbox semantics and state to correctness accessibility values. I found no content, scoring, persistence, auth, schema, or shared renderer changes. Source diff checking found one trailing blank line at EOF in designInterviewChoiceFeedback.test.ts; this is a non-blocking formatting nit.

The durable/rebind regression now checks keyed selected-correct and selected-incorrect states on real Design choice items, frozen control arrays, and recovery after committed-only materialization failure. The AST adapter regression evaluates the actual buildPracticeResponseControl call from the Design screen, verifies stable-ID state mapping including omitted-correct, verifies single/multiple mode mapping, and confirms pending feedback remains absent while the response is merely selected. This directly covers the former omission seam. The attempted authored multiple-choice fixture was not present in the actual Learn/Tradeoff pools and was removed; the adapter contract test is therefore synthetic for the multiple-mode branch and is not native multi-select evidence.

## Native and preservation evidence

I inspected the private Q2 screenshot and hierarchy. They show the same saved correct Q2 (2 of 10) with its correct option visually marked and an accessibility value containing “radio button, checked, Selected, correct”; the Details control remains present. This demonstrates the intended native feedback state on the saved answer. The hierarchy data's separate normalized checked field is false, but its native value string explicitly reports “radio button, checked”; the evidence supports the latter composed accessibility representation and does not justify asserting independent VoiceOver behavior.

I compared the private pre-fix (q2-after-submit.json) and post-fix (q2-after-control-fix.json) snapshots structurally without exposing raw values. Device/profile, key inventory, fences, notifications, and all records other than three timer/session records are unchanged. The differences are confined to active foreground timer accumulation/checkpoint metadata, the active-session record revision, and the session's activeForegroundMs; the stored answer-attempt record and selected response remain unchanged. This is consistent with foreground elapsed-time checkpointing during the ordinary native refresh, not a second answer. It is not byte-for-byte whole-store identity.

The private focused run log reports a fresh screenshot after the centerElement: true Details target positioning and no Next or submit command. Parent evidence reports the follow-up Details action completed without either action; this acceptance review does not claim a Q5 wrong response or full Details/content acceptance from that Q2 control screenshot. The separately rerun targeted tests passed 25/25, and npm run typecheck exited successfully.

## Remaining limits

- Actual native multi-select checkbox semantics were not demonstrated because these two Design pools have no choice_multiple fixture. The source/adapter contract test covers that branch, while real native Q2 covers the single-select saved-answer path.
- git diff --check reports a single trailing blank line at EOF in the touched durable-feedback test; it does not affect behavior or the passing targeted checks.
- This acceptance covers the saved-Q2 feedback-control correction only. It does not accept Q5 wrong feedback/Details, full Q12, full BIZQ-01, VoiceOver, provider entitlement, or release readiness.
- The allowed foreground timer/session timing changes mean the snapshots should be reported as scoped preservation, not exact byte equality or whole-store equality.

## Reviewed inputs

- docs/active/BIZQ-01/premium-completion-33/DESIGN-CONTROL-FIX-BRIEFING.md
- Diff in src/application/design-interview/designInterviewSessionFacade.ts and src/features/practice/DesignInterviewPracticeScreen.tsx
- src/application/design-interview/designInterviewChoiceFeedback.test.ts, src/features/practice/practiceFeedbackDelivery.test.ts, and existing src/features/practice/practiceSessionPresentation.test.ts
- Private native evidence under /private/tmp/bizq33-resume-2026-10-07/q2-control-fix/2026-10-07_101521/, q2-after-control-fix-hierarchy.json, and paired before/after snapshots q2-after-submit.json and q2-after-control-fix.json

This is bounded implementation acceptance. No simulator or app interaction was performed by this reviewer; native evidence was inspected read-only.
