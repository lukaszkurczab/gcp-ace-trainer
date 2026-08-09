import assert from "node:assert/strict";
import test from "node:test";

import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import {
  commitTrainingSessionAdvance,
  commitTrainingSessionFinalization,
  commitTrainingSessionStart,
} from "../src/application/learningMutations";
import {
  TrainingApplicationFailure,
  TrainingLifecycleUseCases,
  type SimulationFinalization,
  type TrainingLifecyclePorts,
} from "../src/application/trainingLifecycle";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { PublishedCertificationExamExperienceProfile } from "../src/content/contracts";
import { getTrackRegistration, type TrainingSession } from "../src/domain";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessionResult,
  getTrainingSessions,
  saveTrainingSessionDraft,
} from "../src/storage/repositories";
import { CertificationContentCatalog } from "../src/tracks/certification/certificationContentCatalog";
import { installMemoryStorage } from "./journalTestSupport";

class MutableClock {
  constructor(private value: string) {}
  now = () => this.value;
  set(value: string) { this.value = value; }
}

function profile(): PublishedCertificationExamExperienceProfile {
  return {
    schemaVersion: "exam-experience-profile-v2",
    profileId: "certification-profile-regression",
    profileVersion: "1",
    source: { url: "https://example.test/certification-profile", checkedDate: "2026-07-24", guideVersion: "1" },
    durationMinutes: 30,
    questionCount: { kind: "range", minimum: 4, maximum: 4 },
    blueprint: { kind: "weighted_sections", sections: [
      { id: "setup_environment", contentDomainId: "setup_environment", weightPercent: 25 },
      { id: "planning_implementation", contentDomainId: "planning_implementation", weightPercent: 25 },
      { id: "access_security", contentDomainId: "access_security", weightPercent: 25 },
      { id: "operations", contentDomainId: "operations", weightPercent: 25 },
    ] },
    interactionPolicy: { schemaVersion: "patternly-certification-simulation-policy-v1", policyId: "patternly-certification-simulation-v1", policyVersion: "1", owner: "patternly_product", navigation: "free", answerChanges: "until_final_submission", flagging: "available", navigator: "available", sections: "blueprint_visible", timeout: "absolute_deadline", feedbackTiming: "after_verified_finalization" },
  };
}

function createProfileRegressionHarness(clock: MutableClock) {
  const sourceCatalog = getCertificationContentCatalog();
  const catalog = new CertificationContentCatalog(
    sourceCatalog.getItems(),
    sourceCatalog.getContentVersion(),
    sourceCatalog.getDiagnosticBaseline(),
    sourceCatalog.getFocusPractice(),
    profile(),
  );
  const runtime = new CertificationFamilyRuntime(catalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  let finalizationCount = 0;

  const assertProfileSession = (session: TrainingSession) => {
    if (session.trackId !== "google-cloud-associate-cloud-engineer" || session.modeId !== "certification-exam-simulation" || session.contentVersion !== catalog.getContentVersion()) {
      throw new Error("Certification profile regression accepted a session outside its installed profile.");
    }
  };

  const finalize = async (input: SimulationFinalization) => {
    const existingById = new Map((await getReviewQueueItems()).value.map((review) => [review.id, review]));
    await commitTrainingSessionFinalization({
      session: input.session,
      attempts: input.attempts,
      reviewMutations: input.reviewMutations.map((mutation) => ({
        action: mutation.kind === "remove" ? "delete" as const : existingById.has(mutation.entry.id) ? "update" as const : "put" as const,
        record: mutation.entry,
        transitionAttemptId: mutation.transitionAttemptId ?? mutation.entry.sourceAttemptId,
      })),
      result: input.result,
      cleanup: { kind: "training_session_draft", draft: input.frozenDraft, submittedOccurrenceIds: input.attempts.map((attempt) => attempt.occurrenceId) },
      createdAt: input.session.completedAt ?? clock.now(),
    });
    finalizationCount += 1;
  };

  const ports: TrainingLifecyclePorts = {
    clock,
    sessionIds: { async create({ trackId, modeId }) { return `${trackId}:${modeId}:00000000-0000-4000-8000-000000000001`; } },
    tracks: { getTrackRegistration },
    runtimes: {
      resolve(familyId) {
        if (familyId !== "certification") throw new Error(`Unexpected family ${familyId}.`);
        return runtime;
      },
    },
    content: {
      async requireAvailable(trackId, modeId) {
        if (trackId !== "google-cloud-associate-cloud-engineer" || modeId !== "certification-exam-simulation") {
          throw new Error("Certification profile regression exposes only its declared exam mode.");
        }
      },
      async assertPreparedSession(session) { assertProfileSession(session); },
      async assertActiveSession(session) { assertProfileSession(session); },
    },
    repositories: {
      async getActiveSession() { return getActiveTrainingSession(); },
      async getSession(sessionId) { return (await getTrainingSessions()).value.find((session) => session.id === sessionId) ?? null; },
      async getHistory() { return (await getTrainingSessions()).value; },
      async getAttempts() { return (await getTrainingAttempts()).value; },
      async getReviews() { return (await getReviewQueueItems()).value; },
      async getDraft(sessionId) {
        const draft = await getActiveTrainingSessionDraft();
        return draft?.sessionId === sessionId ? draft : null;
      },
      async getResult(sessionId) { return getTrainingSessionResult(sessionId); },
      async saveDraft(input) { await saveTrainingSessionDraft(input.draft, input.expectedPreviousRevision); },
    },
    mutations: {
      async start(input) { await commitTrainingSessionStart({ session: input.session, draft: input.draft, createdAt: input.session.startedAt }); },
      async submitPractice() { throw new Error("Certification profile regression does not submit per-item practice responses."); },
      async advance(session) { await commitTrainingSessionAdvance(session, clock.now()); },
      async completeWithResult() { throw new Error("Certification profile regression finalizes its simulation through the canonical finalization mutation."); },
      finalize,
      async abandon() { throw new Error("Certification profile regression does not abandon its active simulation."); },
      async recover() { throw new Error("Certification profile regression does not install a recoverable mutation."); },
      async reset() { throw new Error("Certification profile regression does not reset canonical learning state."); },
    },
  };

  return {
    catalog,
    createLifecycle: () => new TrainingLifecycleUseCases(ports),
    finalizationCount: () => finalizationCount,
  };
}

function responseFor(catalog: CertificationContentCatalog, occurrence: TrainingSession["itemOrder"][number], correct: boolean) {
  const question = catalog.getItemById(occurrence.item.itemId);
  const selectedOptionIds = correct
    ? question.correctOptionIds
    : [question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id];
  return { kind: "option_selection" as const, selectedOptionIds };
}

test("Certification profile lifecycle resumes early, mid, and late; rejects plan mismatch; expires once with correct review and unanswered evidence", async () => {
  await validateBundledContent();
  installMemoryStorage();
  const clock = new MutableClock("2026-07-24T10:00:00.000Z");
  const harness = createProfileRegressionHarness(clock);
  const lifecycle = harness.createLifecycle();
  const started = await lifecycle.startSession({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "certification-exam-simulation",
    request: { requestedLength: 4 },
  });
  const sessionId = started.session.id;
  assert.equal(started.session.actualLength, 4);

  const early = await harness.createLifecycle().resumeActiveSession();
  assert.equal(early.id, sessionId);
  assert.equal((await getActiveTrainingSessionDraft())?.revision, 1);

  const first = started.session.itemOrder[0]!;
  const initialDraft = (await getActiveTrainingSessionDraft())!;
  await lifecycle.saveSimulationDraft({
    draft: {
      ...initialDraft,
      revision: initialDraft.revision + 1,
      updatedAt: clock.now(),
      responsesByOccurrenceId: { [first.occurrenceId]: responseFor(harness.catalog, first, true) },
      flaggedOccurrenceIds: [first.occurrenceId],
    },
    expectedPreviousRevision: initialDraft.revision,
  });

  const mid = await harness.createLifecycle().resumeActiveSession();
  assert.equal(mid.currentItemIndex, 0);
  assert.deepEqual(Object.keys((await getActiveTrainingSessionDraft())!.responsesByOccurrenceId), [first.occurrenceId]);

  await lifecycle.moveSimulationSessionTo(3);
  const last = (await getActiveTrainingSession())!.itemOrder[3]!;
  const draftBeforeMismatch = (await getActiveTrainingSessionDraft())!;
  await assert.rejects(
    () => lifecycle.saveSimulationDraft({
      draft: {
        ...draftBeforeMismatch,
        revision: draftBeforeMismatch.revision + 1,
        updatedAt: clock.now(),
        responsesByOccurrenceId: { ...draftBeforeMismatch.responsesByOccurrenceId, "outside-immutable-plan": responseFor(harness.catalog, last, false) },
      },
      expectedPreviousRevision: draftBeforeMismatch.revision,
    }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "invalid_response",
  );
  assert.deepEqual(Object.keys((await getActiveTrainingSessionDraft())!.responsesByOccurrenceId), [first.occurrenceId]);

  await lifecycle.saveSimulationDraft({
    draft: {
      ...draftBeforeMismatch,
      revision: draftBeforeMismatch.revision + 1,
      updatedAt: clock.now(),
      responsesByOccurrenceId: { ...draftBeforeMismatch.responsesByOccurrenceId, [last.occurrenceId]: responseFor(harness.catalog, last, false) },
    },
    expectedPreviousRevision: draftBeforeMismatch.revision,
  });
  const late = harness.createLifecycle();
  assert.equal((await late.resumeActiveSession()).currentItemIndex, 3);
  assert.deepEqual(Object.keys((await getActiveTrainingSessionDraft())!.responsesByOccurrenceId), [first.occurrenceId, last.occurrenceId]);

  const activeBeforeExpiry = (await getActiveTrainingSession())!;
  if (activeBeforeExpiry.configurationSnapshot.timer !== "absoluteDeadline") {
    throw new Error("Certification profile regression requires an absolute-deadline simulation.");
  }
  const deadline = activeBeforeExpiry.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") {
    throw new Error("Certification profile regression requires a persisted absolute deadline.");
  }
  clock.set(deadline);
  const [expiredSessionId] = await Promise.all([late.finalizeExpiredSimulationIfDue(), late.finalizeSimulation()]);
  assert.equal(expiredSessionId, sessionId);
  assert.equal(harness.finalizationCount(), 1);
  assert.equal(await late.finalizeExpiredSimulationIfDue(), null);
  assert.equal(await getActiveTrainingSession(), null);

  const result = await late.loadSummary(sessionId);
  assert.deepEqual(result.answeredOccurrenceIds, [first.occurrenceId, last.occurrenceId]);
  assert.deepEqual(result.unansweredOccurrenceIds, started.session.itemOrder.slice(1, 3).map((occurrence) => occurrence.occurrenceId));
  assert.equal((result.evidence.details as { maxPoints: number }).maxPoints, started.session.actualLength);
  const attempts = (await getTrainingAttempts()).value.filter((attempt) => attempt.sessionId === sessionId);
  assert.equal(attempts.length, 2);
  assert.equal(attempts.find((attempt) => attempt.occurrenceId === first.occurrenceId)?.reviewEvidence.taxonomyOrSkillRefs.some((ref) => ref.axisId === "exam-state" && ref.nodeId === "flagged"), true);
  const reviews = (await getReviewQueueItems()).value.filter((review) => review.sourceSessionId === sessionId);
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0]!.sourceAttemptId, attempts.find((attempt) => attempt.occurrenceId === last.occurrenceId)!.id);
  assert.equal((await getTrainingSessions()).value.filter((session) => session.id === sessionId).length, 1);
});
