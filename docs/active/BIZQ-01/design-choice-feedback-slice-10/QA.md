# Independent source acceptance — Design choice feedback (slice 10)

**Verdict: PASS WITH ISSUES — bounded source slice.** The Design facade now returns the existing stable-ID choice helper output only for a materialized attempt. The ordinary choice feedback path, durable-submission boundary, and the existing Design presentation adapter meet the slice criteria. One currently eligible OOD explanation is malformed learner-facing content, described below; it is pre-existing bundled content and was not changed by this slice.

## Acceptance evidence

- The implementation diff is confined to importing and calling `projectCanonicalChoiceFeedbackMessages` in `designInterviewSessionFacade.ts`, selecting it only for single/multiple choice inside the existing `materializedAttempt` branch, and extending the existing Design adapter test to assert pass-through of choice messages. The ordering helper remains the non-choice path. The shared helper, Design screen, Details renderer, scoring, content artifacts, runtime, storage, and Premium gates are unchanged.
- The new family test exercises eligible wrong-option and correct responses for Backend, Frontend, and Object-oriented Design. It prepares and resume-validates a canonical runtime session, submits through the actual Design facade, then checks persisted attempts and the projection after lifecycle rebind. It also checks that feedback is absent before submit, correct responses do not gain an explanation, a journal-write failure yields no feedback or attempt, and committed-only response stays hidden until recovery materializes exactly one attempt and the authored message.
- I ran this focused command from `patternly/`:

  ```sh
  node --import tsx --test \
    src/application/design-interview/designInterviewChoiceFeedback.test.ts \
    src/application/canonical/canonicalChoiceFeedbackPresentation.test.ts \
    src/application/canonical/canonicalOrderingFeedbackPresentation.test.ts \
    src/application/canonical/CanonicalTrainingRuntime.test.ts \
    src/application/design-interview/designInterviewSimulationPolicy.test.ts \
    src/application/trainingLifecycle/premiumProductModeLifecycle.test.ts \
    src/features/practice/practiceFeedbackDelivery.test.ts \
    src/tracks/design-interview/designModes.test.ts \
    src/features/practice/practiceRouteGuards.test.ts \
    scripts/architectureBoundaries.test.ts \
    scripts/mutationArchitecture.test.ts
  ```

  Result: **67/67 passed, 0 failed, 0 skipped**.
- `node --import tsx docs/active/BIZQ-01/design-choice-feedback-slice-10/preflight.ts --expect-delivered` exited 0 with `expectedRed: []`. Its six actual-pool cases cover wrong and correct answers in all three Design tracks; each persisted one attempt and cleared the journal. The probe’s in-memory Premium authorizer is test setup only, not evidence of provider authorization.
- I reran the prior ordering boundary with `node --import tsx docs/active/BIZQ-01/design-ordering-feedback-slice-09/preflight.ts --expect-delivered`; it exited 0 with `expectedRed: []`, including ordering correct/partial responses and sparse/inherited-hole rejection, plus journal failure and materialization recovery.
- `npm run typecheck` exited 0. `git diff --check` on the two changed tracked source/test files exited 0. The repository-wide check reports trailing whitespace in concurrently maintained `docs/PATTERNLY-WORKING-PLAN.md`; that file is outside this slice and was not modified by this review.
- The slice-10 preflight hashes show unchanged `CanonicalTrainingRuntime.ts`, canonical interaction helper, Design screen, product mode config, and all three generated track artifacts relative to its recorded baseline. Only the intended facade source hash differs among those inputs.

## Issue and limits

The probe’s currently eligible Object-oriented Design item `ood-n01-b01-i001`, wrong-option target `coordinator_exports_state`, contains this sentence splice:

> It moves actors, goals, use cases, and system boundary is the primary decision; the decisive pressure is the option must diagnose the mechanism, not name a slogan. into caller discipline and makes over-allocation possible when a different caller forgets the sequence.

This is from the unchanged OOD artifact `613e5113e9d88caad18757d6167c781d2a19532b7654c7d0a28c493933ab8f9b`, content version `object-oriented-design-interview-candidate-v2026.08.15`. The new path faithfully delivers the existing helper result, as required, but displaying this message will confuse learners. This is a source-content quality defect, not a failure of the delivery implementation; it should be corrected by the content owner in a separate authorized content slice.

This verdict covers source behavior and memory-backed lifecycle evidence only. It does not claim native/VoiceOver rendering or Premium-provider authorization. The current Design pools have no multiple-choice omitted-option examples, and the two BIZQ replacement items are outside those pools, so this does not establish their session reachability, omitted-option delivery, post-session feedback, or completion of the broader BIZQ work.
