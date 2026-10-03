# BIZQ-01 Design ordering feedback09 — independent source acceptance

**Verdict: PASS** for the bounded existing `broken_relation` feedback path in Design practice. The materialized ordering response now controls which authored adjacent-relation messages reach the existing Details renderer. This is not full BIZQ-01 acceptance.

## Criteria checked

- `projectCanonicalOrderingFeedbackMessages` returns only authored `broken_relation` messages whose stable `left->right` relation is absent from the submitted adjacent pairs. It keeps authored order/text and returns a frozen array. It does not infer `wrong_element`, choice, or dimension explanations, and does not rescore.
- The projector calls the existing `isCanonicalResponseComplete` owner before deriving messages when authored ordering messages are present. The accepted sparse-array correction adds the existing private `isDenseArray` check to the ordering branch, so own holes and inherited holes cannot masquerade as a full permutation. Runtime validation rejects them before an attempt or review write.
- The Design facade adds optional messages only from a materialized attempt. A committed-but-unmaterialized response, sparse invalid submit, and failed journal write expose no new feedback. Recovery after attempt materialization exposes the exact authored relation message. Existing later-operation feedback phases and scoring remain on their prior owners.
- `DesignInterviewPracticeScreen` passes `projection.feedback.messages` through unchanged to `PracticeSessionSurface`; the existing shared Details branch remains the only renderer. The source JSX harness confirms the Design adapter forwards only existing feedback and the expanded branch renders the message while the collapsed branch does not. The renderer and other family adapters were not changed in this slice.
- The concrete shifted-block case `[expose, recover, observe, preserve]` preserves `expose->recover` and `observe->preserve` at new positions, scores 2/3, and emits only `preserve->expose`. Swapping the final elements scores 1/3 and emits the other two authored relations. Correct order scores 3/3 and emits none.

## Independent checks

From `patternly/`:

```text
node --import tsx --test src/application/canonical/canonicalOrderingFeedbackPresentation.test.ts src/content/canonical/questionCore.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts src/features/practice/practiceFeedbackDelivery.test.ts src/features/practice/practiceSessionPresentation.test.ts
56/56 passed

node --import tsx docs/active/BIZQ-01/design-ordering-feedback-slice-09/preflight.ts --expect-delivered
exit 0; all 7 cases passed; expectedRed=[]

npm run typecheck
passed (`tsc --noEmit`)

git diff --check -- <owned production and test paths>
passed
```

The versioned preflight uses the current locked Frontend Design artifact and actual Design family facade. It prepares and resume-validates a canonical session, submits through the existing facade and journal-backed memory repositories, then rebinds lifecycle composition before reading the projection. The seven cases cover correct order, two partial orders (including shifted preserved relations), sparse and inherited-hole rejection with zero attempts/reviews, journal-write failure with no feedback, and attempt-write failure followed by recovery to one attempt and the exact authored message. Fault injection is in memory after the real facade checkpoint; it is not evidence of native SDK interruption. The separate Premium lifecycle test preserves existing denied-before-resolution behavior; its injected authorizer is not proof of provider authorization.

## Scope limits

This acceptance does not claim native rendering, VoiceOver, provider Premium authorization, other diagnostic kinds, post-session review delivery, or full BIZQ-01. No content, scoring algorithm, content pin, session mode, selection, persistence schema, service, or configuration change was part of this slice. The foreground-time checkpoint may persist on an invalid-submit attempt; the preflight explicitly makes no whole-store preservation claim.
