import {
  createAttemptResult,
  createForegroundTimerState,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionResult,
  type TrackId,
  type TrainingSession,
} from "../../domain";
import { REVIEW_CYCLE_POLICY_VERSION } from "../../domain/learning/reviewQueueEntry";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getProductSimulationModeConfig } from "../../content/canonical/productModeConfig";
import {
  addReviewQueueItems,
  addTrainingAttempt,
  captureLearningStateResetTargetPlan,
  getGuestInstallation,
  saveActiveForegroundTimer,
  saveDeviceReminderSettings,
  saveSettings,
  saveTrainingSession,
  saveTrainingSessionDraft,
  saveTrainingSessionResult,
} from "../../storage/repositories";

export async function seedPersist13ResetFixtureState(runId: string) {
  const trackId = "coding-interview-dsa-problem-solving" as TrackId;
  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId,
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
  });
  const { profile } = getProductSimulationModeConfig(resolved.track.trackId, resolved.track.simulationProfiles);
  if (profile.familyId !== "coding_interview" || profile.modeId !== "coding-interview-simulation") {
    throw new Error("persist13_registered_coding_simulation_unavailable");
  }
  const now = new Date().toISOString();
  const activeId = fixtureId(runId, 2);
  const completedId = fixtureId(runId, 3);
  const attemptId = fixtureId(runId, 4);
  const reviewId = fixtureId(runId, 5);
  const prepared = await resolved.runtime.prepare({
    trackId,
    modeId: profile.modeId,
    request: { sessionId: activeId, scope: { simulationProfileId: profile.profileId } },
    attempts: [],
    reviews: [],
    now,
  });
  if (!prepared.draft || prepared.session.status !== "active") throw new Error("persist13_registered_simulation_draft_unavailable");
  await saveTrainingSession(prepared.session);
  await saveTrainingSessionDraft(prepared.draft, null);
  await saveActiveForegroundTimer(createForegroundTimerState({
    schemaVersion: 1,
    timerVersion: 1,
    familyId: "coding_interview",
    sessionId: prepared.session.id,
    trackId,
    accumulatedForegroundMs: 4_000,
    checkpointRevision: 1,
    lastCheckpointAt: now,
    running: false,
  }), null);

  const completedAt = new Date(Date.now() - 60_000).toISOString();
  const occurrenceId = `persist13-${runId}`;
  const question = resolved.track.questions[0];
  if (!question) throw new Error("persist13_bundled_question_unavailable");
  const identity = resolved.track.trainingIdentity ?? {
    contentVersion: resolved.track.contentVersion,
    artifactSha256: resolved.track.artifactSha256,
  };
  const ref = Object.freeze({
    trackId,
    questionId: question.questionId,
    contentVersion: identity.contentVersion,
    artifactSha256: identity.artifactSha256,
  });
  const practiceModeId = resolved.track.modes[0]?.modeId;
  if (!practiceModeId) throw new Error("persist13_bundled_mode_unavailable");
  const completedSession = makeFixtureSession(completedId, trackId, practiceModeId, ref, occurrenceId, completedAt, "completed", completedAt);
  await saveTrainingSession(completedSession);
  await saveTrainingSessionResult(createTrainingSessionResult({
    id: `result:${completedId}`,
    sessionId: completedId,
    trackId,
    totalOccurrences: 1,
    answeredOccurrenceIds: [occurrenceId],
    unansweredOccurrenceIds: [],
    completedAt,
    evidence: { familyId: "coding_interview", details: { fixture: "persist13" } },
  }));
  const evidence = Object.freeze({ sourceItem: ref, taxonomyOrSkillRefs: Object.freeze([{ axisId: "fixture", nodeId: question.nodeId }]) });
  await addTrainingAttempt(createTrainingAttempt({
    id: attemptId,
    sessionId: completedId,
    trackId,
    modeId: practiceModeId,
    occurrenceId,
    item: ref,
    response: { kind: "fixture_answer" },
    result: createAttemptResult({ kind: "incorrect", earnedPoints: 0, maxPoints: 1 }),
    reviewEvidence: evidence,
    answeredAt: completedAt,
    committedAt: completedAt,
  }));
  await addReviewQueueItems([{
    ...evidence,
    id: reviewId,
    trackId,
    sourceAttemptId: attemptId,
    sourceSessionId: completedId,
    reasons: ["incorrect"],
    dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: completedAt,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    policyVersion: REVIEW_CYCLE_POLICY_VERSION,
    stage: "repair24",
    status: "active",
  }]);
  await saveSettings({ appearance: "dark", language: "en" });
  saveDeviceReminderSettings({ schemaVersion: 1, enabled: false, identity: null, schedules: [], legacyNotificationIds: [], pending: null });
  const installation = await getGuestInstallation();
  if (!installation || installation.localDatasetId !== runId || installation.bindingState !== "guest") {
    throw new Error("persist13_fixture_guest_identity_missing");
  }
  const plan = captureLearningStateResetTargetPlan();
  return Object.freeze({
    profile: plan.profile,
    targets: Object.freeze([...plan.targets]),
    preserved: Object.freeze([...plan.preserved]),
  });
}

function makeFixtureSession(id: string, trackId: TrackId, modeId: string, ref: Readonly<{ trackId: string; questionId: string; contentVersion: string; artifactSha256: string }>, occurrenceId: string, startedAt: string, status: TrainingSession["status"], completedAt?: string): TrainingSession {
  return createTrainingSession({
    id,
    trackId,
    modeId,
    configurationSnapshot: { kind: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId, item: ref }],
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: ref.contentVersion,
    artifactSha256: ref.artifactSha256,
    status,
    startedAt,
    ...(completedAt ? { completedAt } : {}),
  });
}

function fixtureId(runId: string, offset: number): string {
  const first = Number.parseInt(runId[0]!, 16);
  return `${((first + offset) % 16).toString(16)}${runId.slice(1).toLowerCase()}`;
}
