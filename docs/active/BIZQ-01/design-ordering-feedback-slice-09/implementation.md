# Design ordering feedback09 — Implementation evidence

The existing authored `broken_relation` messages now reach Design interview practice feedback. The canonical projection validates a complete ordering response, then retains authored relations absent from its submitted adjacency set in authored order and text. It does not score, infer positional `wrong_element` meaning, or change choice behavior. Ordering completeness now also rejects sparse and inherited-hole arrays through the existing `isDenseArray` helper.

The Design facade adds messages only for a materialized attempt; its prior pending and committed-only feedback boundary remains in place. The Design screen forwards the optional array unchanged to the shared practice surface. Existing Details rendering and expansion behavior are reused from slice 08.

Evidence includes the real pinned frontend Design question `fesd-n01-b01-i003`: all 24 valid permutations preserve existing adjacent-pair scoring and message selection; correct order has no broken relation, the swapped ending and shifted block expose only their authored missing relation, and reversing the order exposes the three authored relations. Direct canonical runtime coverage rejects malformed sparse submission before creating an outcome. The root-owned facade preflight (`ROOT-PREFLIGHT-GREEN-FINAL.json`) exercises actual correct/swapped/shifted materialization and rebind, and verifies sparse and inherited-hole submissions fail as `invalid_response` before attempts, reviews, outcome journal, committed response, or feedback are written. Foreground time checkpointing remains possible; this evidence does not claim whole-store preservation.

The focused Design adapter test executes the JSX attribute expression and verifies the same message-array identity is forwarded, including the null-feedback case. Shared Details rendering behavior is covered by the reused slice 08 test; this slice does not claim a native React mount, layout, or accessibility-device run.

Verification passed:

- `node --import tsx --test src/application/canonical/canonicalOrderingFeedbackPresentation.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts src/content/canonical/questionCore.test.ts src/features/practice/practiceFeedbackDelivery.test.ts src/application/design-interview/designInterviewSimulationPolicy.test.ts src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts src/tracks/design-interview/designModes.test.ts src/features/practice/practiceRouteGuards.test.ts scripts/architectureBoundaries.test.ts scripts/mutationArchitecture.test.ts` — 68/68.
- `npm run typecheck`.
- `node --import tsx docs/active/BIZQ-01/design-ordering-feedback-slice-09/preflight.ts --expect-delivered` — passed; see root-owned `ROOT-PREFLIGHT-GREEN-FINAL.json`.

The existing Premium-mode denial test remains green and no Premium gate was changed. It exercises the test authorizer, not a store provider or native purchase flow. This slice does not separately exercise a Design failed-journal/no-materialization projection path; pending feedback remains null by the existing `materializedAttempt` condition. Other ordering diagnostics, decision-matrix delivery, post-session review, full BIZQ-01 acceptance, and native UI behavior remain outside this slice.
