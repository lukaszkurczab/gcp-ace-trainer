# Design choice feedback10 — Implementation evidence

The Design practice facade now projects authored choice messages for a materialized choice attempt by calling the existing stable-ID helper. Ordering messages continue through the existing ordering projector. Feedback remains absent before materialization; result, response source, reason, details, sources, selection, mode gates, and timing are unchanged. The Design screen already passed optional messages through, so only a focused JSX assertion was added there.

The new memory-backed integration tests use real canonical prepared sessions and currently eligible questions from all three Design N01 pools. For each track, a selected authored wrong option yields its exact helper message after submit and lifecycle rebind; a correct response yields a frozen empty message array and a correct result. Tests also verify feedback stays null before submit, a failed outcome-journal write creates no attempt/review/response/feedback, and a failed attempt materialization exposes only a committed response with no feedback until journal recovery materializes exactly one attempt and the authored message.

The root-owned actual preflight report `ROOT-PREFLIGHT-GREEN.json` covers wrong and correct submissions across all three tracks through runtime preparation, exact option order/fingerprint, resume validation, a memory-backed journal, the Design facade, and lifecycle rebind. It reports six cases and `expectedRed: []`. The root-owned `ROOT-ORDERING-REGRESSION.json` confirms the existing ordering branch still passes its seven cases, including malformed-response and journal-recovery boundaries. These are in-memory application/lifecycle checks; they do not claim native UI, a Premium provider, or whole-store preservation.

Verification passed:

- `node --import tsx --test src/application/design-interview/designInterviewChoiceFeedback.test.ts src/application/canonical/canonicalChoiceFeedbackPresentation.test.ts src/application/canonical/canonicalOrderingFeedbackPresentation.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts src/application/design-interview/designInterviewSimulationPolicy.test.ts src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts src/features/practice/practiceFeedbackDelivery.test.ts src/tracks/design-interview/designModes.test.ts src/features/practice/practiceRouteGuards.test.ts scripts/architectureBoundaries.test.ts scripts/mutationArchitecture.test.ts` — 67/67.
- `npm run typecheck`.
- `node --import tsx docs/active/BIZQ-01/design-choice-feedback-slice-10/preflight.ts --expect-delivered` — passed with `expectedRed: []`.

This consumer slice does not add multiple-choice/omitted-option content, expand pools to include the admitted Backend N02/N04 replacements, change the Premium boundary, or close full BIZQ-01.
