# Answer-time review progression test evidence

## Reproduction

Before the runtime correction, `node --import tsx --test src/application/canonical/CanonicalReviewAnswerTime.test.ts` reached the expected behavior assertion after preparing and finalizing a real bundled GCP simulation, persisting its active session/draft and exact-reference review, and committing the finalization through the journal-backed finalization repository. The correct draft answer time was `2026-10-02T09:59:00.000Z`, the older persistent review was due at `10:00:00Z` with one prior due success, and finalization committed at `10:05:00Z`. The old behavior emitted a review `remove`, incorrectly counting commit time as a second due success. Raw TAP output is in [actual-red.log](./actual-red.log).

The failure was in the review mutation assertion after runtime finalization and durable repository commit. Fixture preparation, draft/session persistence, canonical answer validation and commit all completed. The attempt retained `answeredAt=09:59`, `committedAt=10:05`, and a correct score.

## Current verification

After the runtime correction, `node --import tsx --test src/application/canonical/CanonicalReviewAnswerTime.test.ts` passes **10 tests, 0 failures**. The suite covers answer times before, exactly at, and after due time with prior counters 0 and 1; the same-session persistent exact-reference guard; durable review queue state after commit; and attempt ID, timestamps and scored result preservation. Increment branches retain the review ID and due time while setting the next success count and `lastReviewedAt` from answer time; second due successes still remove the review.

The recovery case injects failure at removal of the persisted active draft after finalization journal materialization. It recovers the durable journal twice, confirms the journal clears, and verifies the eligible first success remains exactly one transition (`consecutiveAfterDueSuccesses=1`, answer-time `lastReviewedAt`, original review ID and due time) with exactly one persisted attempt.

`npx tsc --noEmit` passes.

These scenarios use the actual canonical GCP catalog/runtime, persisted domain-validated session and draft, review repository, and journal-backed finalization. The draft has one `updatedAt` timestamp shared by all its responses; this establishes the persisted aggregate time available to the current runtime, not an independent per-occurrence answer clock. The tests do not specify a new review interval or a first-due scheduling policy.
