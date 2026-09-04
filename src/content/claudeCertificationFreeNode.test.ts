import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { advanceTrainingSession, contentPackagePinsEqual, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession } from "../domain";
import type { CertificationQuestion } from "../tracks/certification";

const TRACK_ID = "claude-certified-architect-professional-certification" as const;
const FREE_NODE_ID = "solution_design_and_architecture";
const FOCUS_MODE_ID = "certification-focus-practice";
const NOW = "2026-09-03T12:00:00.000Z";

test("Claude Free node completes ten authored answers with exact result and review identity", async () => {
  const discovered = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK_ID, "certification");

  assert.equal(discovered.package.trackId, TRACK_ID);
  assert.equal(discovered.package.familyId, "certification");
  assert.equal(discovered.profile.freeNodeId, FREE_NODE_ID);
  assert.equal(discovered.profile.primaryEntry.modeId, FOCUS_MODE_ID);
  assert.deepEqual(discovered.profile.modes.map((mode) => mode.modeId), [
    "certification-focus-practice",
    "certification-weak-area-review",
    "certification-quick-review",
  ]);
  assert.deepEqual(discovered.profile.getMode(FOCUS_MODE_ID).requestedLengths, [10, 20, 40]);

  const prepared = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId: TRACK_ID,
    familyId: "certification",
    modeId: FOCUS_MODE_ID,
  });
  const preparedSession = await prepared.runtime.prepare({
    trackId: TRACK_ID,
    modeId: FOCUS_MODE_ID,
    request: { sessionId: "claude-free-node-ten", requestedLength: 10, domain: FREE_NODE_ID },
    attempts: [],
    reviews: [],
    now: NOW,
  });

  let activeSession: TrainingSession = preparedSession.session;
  assert.equal(activeSession.actualLength, 10);
  assert.equal(activeSession.packagePin.packageIdentity, prepared.package.packagePin.packageIdentity);
  assert.equal(preparedSession.firstOccurrence.packagePin.packageIdentity, prepared.package.packagePin.packageIdentity);

  let attempts: TrainingAttempt<unknown>[] = [];
  let reviews: ReviewQueueEntry[] = [];
  for (let index = 0; index < 10; index += 1) {
    const occurrence = activeSession.itemOrder[activeSession.currentItemIndex]!;
    const question = discovered.profile.getItemById(occurrence.item.itemId) as CertificationQuestion;
    const wrongOption = question.options.find((option) => !question.correctOptionIds.includes(option.id));
    assert.ok(wrongOption, `Claude question ${question.id} must have a wrong option for review coverage.`);
    const response = {
      kind: "option_selection" as const,
      selectedOptionIds: index === 0 ? [wrongOption.id] : [...question.correctOptionIds],
    };
    const submission = await prepared.runtime.submitPractice({
      session: activeSession,
      response,
      attempts,
      reviews,
      now: NOW,
    });
    assert.equal(submission.attempt.trackId, TRACK_ID);
    assert.equal(submission.attempt.item.trackId, TRACK_ID);
    assert.equal(submission.attempt.item.contentVersion, prepared.package.contentVersion);
    assert.equal(submission.attempt.item.packagePin.packageIdentity, prepared.package.packagePin.packageIdentity);
    attempts = [...attempts, submission.attempt];
    for (const mutation of submission.reviewMutations) {
      if (mutation.kind === "upsert") {
        reviews = [...reviews.filter((entry) => entry.id !== mutation.entry.id), mutation.entry];
      } else {
        reviews = reviews.filter((entry) => entry.id !== mutation.entry.id);
      }
    }
    if (index < 9) activeSession = advanceTrainingSession(submission.session);
  }

  assert.equal(attempts.length, 10);
  assert.equal(reviews.length, 1);
  assert.equal(attempts[0]!.result.kind, "incorrect");
  assert.equal(attempts.slice(1).every((attempt) => attempt.result.kind === "correct"), true);
  const review = reviews[0]!;
  assert.equal(review.trackId, TRACK_ID);
  assert.equal(review.sourceAttemptId, attempts[0]!.id);
  assert.equal(review.sourceItem.itemId, attempts[0]!.item.itemId);
  assert.equal(review.sourceItem.contentVersion, prepared.package.contentVersion);
  assert.equal(contentPackagePinsEqual(review.sourceItem.packagePin, prepared.package.packagePin), true);

  const finalized = await prepared.runtime.finalizePractice({ session: activeSession, attempts, now: NOW });
  assert.equal(finalized.session.status, "completed");
  assert.equal(finalized.result.trackId, TRACK_ID);
  assert.equal(finalized.result.totalOccurrences, 10);
  assert.equal(finalized.result.answeredOccurrenceIds.length, 10);
  const details = finalized.result.evidence.details as Record<string, number>;
  assert.equal(details.correctCount, 9);
  assert.equal(details.incorrectCount, 1);
  const pointsEarned = details.pointsEarned;
  const maxPoints = details.maxPoints;
  if (pointsEarned === undefined || maxPoints === undefined) {
    throw new Error("Claude result details must include pointsEarned and maxPoints.");
  }
  assert.equal(pointsEarned < maxPoints, true);
  assert.equal(finalized.session.packagePin.packageIdentity, prepared.package.packagePin.packageIdentity);

  for (const modeId of ["certification-scenario-practice", "certification-mixed-practice", "certification-exam-simulation"]) {
    await assert.rejects(
      () => contentPackageRuntimeOwner.resolveForPreparation({ trackId: TRACK_ID, familyId: "certification", modeId }),
      (error: unknown) => (error as { code?: string }).code === "package_mode_unavailable",
    );
  }
});
