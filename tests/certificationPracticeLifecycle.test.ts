import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { loadActiveTrainingSession } from "../src/application/learningReadModels";
import {
  abandonCertificationSession,
  advanceCertificationPracticeSession,
  completeCertificationPracticeSession,
  enterCertificationPracticeForeground,
  getCertificationPracticeProjection,
  leaveCertificationPracticeForeground,
  openCertificationPracticeSession,
  recoverCertificationPracticeAbandonment,
  recoverCertificationPracticeCompletionCheckpoint,
  recoverCertificationPracticeOperation,
  recoverCertificationPreAbandonmentCheckpoint,
  retryCertificationAbandonmentAfterCheckpointFailure,
  submitCertificationPracticeResponse,
} from "../src/application/certification";
import { getForegroundSessionTimerFacade, installTrainingLifecycleUseCases, resumeActiveTrainingSession, TrainingApplicationFailure, type TrainingLifecycleUseCases } from "../src/application/trainingLifecycle";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { getCertificationPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import { getTrackDisplay } from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import {
  getActiveMutationJournal,
  getActiveForegroundTimer,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessionResult,
  getTrainingSessions,
  saveTrainingSession,
} from "../src/storage/repositories";
import type { CertificationQuestion } from "../src/tracks/certification";
import { buildCertificationPracticeResumeRoute, getCertificationTopicIdForRoute } from "../src/features/practice/sessionConfig";
import { installMemoryStorage } from "./journalTestSupport";
import { STORAGE_KEYS } from "../src/storage/keys";

class MutableClock {
  constructor(private value: string) {}
  now = () => this.value;
  set(value: string) { this.value = value; }
}

const GCP_FREE_NODE_ID = "organization_projects_policies_services_quotas_and_assets";

function incorrectResponse(question: CertificationQuestion) {
  const wrong = question.options.find((option) => !question.correctOptionIds.includes(option.id));
  assert.ok(wrong);
  return { kind: "option_selection" as const, selectedOptionIds: [wrong.id] };
}

function correctResponse(question: CertificationQuestion) {
  return { kind: "option_selection" as const, selectedOptionIds: [...question.correctOptionIds] };
}

test("Certification family lifecycle journals one typed attempt and retains remediation identity", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  const clock = new MutableClock("2026-07-24T10:00:00.000Z");
  let identitySequence = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: clock,
    sessionIds: {
      async create({ trackId, modeId }) {
        identitySequence += 1;
        return `${trackId}:${modeId}:00000000-0000-4000-8000-${String(identitySequence).padStart(12, "0")}`;
      },
    },
  });
  const catalog = getCertificationPackageTestCatalog();
  const question = catalog.getItems().find((item) => item.nodeId === GCP_FREE_NODE_ID);
  assert.ok(question);

  const first = await lifecycle.startSession({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "certification-focus-practice",
    request: {
      requestedLength: 10,
      domain: GCP_FREE_NODE_ID,
    },
  });
  const firstQuestion = catalog.getItemById(first.firstOccurrence.itemId);
  await lifecycle.submitPracticeResponse(incorrectResponse(firstQuestion));

  const firstAttempts = (await getTrainingAttempts()).value;
  const firstReviews = (await getReviewQueueItems()).value;
  assert.equal(firstAttempts.length, 1);
  assert.deepEqual(firstAttempts[0]?.response, incorrectResponse(firstQuestion));
  assert.equal(firstAttempts[0]?.sessionId, first.session.id);
  assert.equal(firstReviews.length, 1);
  assert.equal(firstReviews[0]?.sourceAttemptId, firstAttempts[0]?.id);
  assert.equal(firstReviews[0]?.sourceSessionId, first.session.id);
  assert.equal(await getActiveMutationJournal(), null);
  const remediationIdentity = {
    id: firstReviews[0]!.id,
    sourceAttemptId: firstReviews[0]!.sourceAttemptId,
    sourceSessionId: firstReviews[0]!.sourceSessionId,
  };

  clock.set("2026-07-24T10:01:00.000Z");
  await lifecycle.abandonActiveSession();
  clock.set("2026-07-24T10:02:00.000Z");
  const second = await lifecycle.startSession({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "certification-focus-practice",
    request: {
      requestedLength: 10,
    domain: GCP_FREE_NODE_ID,
    },
  });
  assert.equal(second.firstOccurrence.itemId, firstQuestion.id);
  await lifecycle.submitPracticeResponse(incorrectResponse(firstQuestion));

  const attempts = (await getTrainingAttempts()).value;
  const reviews = (await getReviewQueueItems()).value;
  assert.equal(attempts.length, 2);
  assert.equal(new Set(attempts.map((attempt) => attempt.id)).size, 2);
  assert.equal(reviews.length, 1);
  assert.deepEqual({
    id: reviews[0]!.id,
    sourceAttemptId: reviews[0]!.sourceAttemptId,
    sourceSessionId: reviews[0]!.sourceSessionId,
  }, remediationIdentity);
  assert.equal(await getActiveMutationJournal(), null);
});

test("Certification open starts once, resumes the exact mode, and never starts for a resume-only disappearance", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  let identitySequence = 0;
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:00:00.000Z"),
    sessionIds: { async create() { identitySequence += 1; return `certification-open-${identitySequence}`; } },
  });
  const first = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(first.kind, "ready");
  if (first.kind !== "ready") return;
  assert.equal(first.projection.session.configurationSnapshot.domain, GCP_FREE_NODE_ID);
  assert.equal(identitySequence, 1);
  const resumed = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(resumed.kind, "ready");
  if (resumed.kind === "ready") assert.equal(resumed.projection.session.id, first.projection.session.id);
  assert.equal(identitySequence, 1);
  const mismatch = await openCertificationPracticeSession({ modeId: "certification-diagnostic-baseline", expectedSessionId: first.projection.session.id });
  assert.equal(mismatch.kind, "active_session_conflict");
  if (mismatch.kind === "active_session_conflict") assert.equal(mismatch.session.id, first.projection.session.id);
  assert.equal(identitySequence, 1);
  await abandonCertificationSession(first.projection.session.id);
  await assert.rejects(
    openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID, expectedSessionId: first.projection.session.id }),
    (cause: unknown) => cause instanceof TrainingApplicationFailure && cause.code === "resume_unavailable",
  );
  assert.equal(identitySequence, 1);
});

test("Certification pause checkpoints and resumes the exact active session", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:15:00.000Z"),
    sessionIds: { async create() { return "certification-pause-resume"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  await enterCertificationPracticeForeground();
  const beforePause = await getCertificationPracticeProjection();

  await leaveCertificationPracticeForeground();
  const homeSession = await loadActiveTrainingSession();
  assert.ok(homeSession);
  const homeModel = buildHomeTabModel({
    activeSession: homeSession,
    activeTrack: getTrackDisplay("google-cloud-associate-cloud-engineer"),
    algorithmsDashboard: null,
    analytics: buildAnalyticsData([], []),
    dashboardError: null,
    trainingAttempts: [],
  });
  assert.equal(homeModel.recommendations.length, 1);
  const action = homeModel.recommendations[0]?.action;
  assert.deepEqual(action, {
    kind: "resume_certification_practice",
    modeId: "certification-focus-practice",
    sessionId: beforePause.session.id,
  });
  if (action?.kind !== "resume_certification_practice") return;

  const resumedSession = await resumeActiveTrainingSession();
  assert.equal(resumedSession.id, action.sessionId);
  assert.equal(resumedSession.modeId, action.modeId);
  const route = buildCertificationPracticeResumeRoute(resumedSession);
  assert.equal(route.mode, action.modeId);
  assert.equal(route.expectedSessionId, action.sessionId);
  const resumed = await openCertificationPracticeSession({
    domain: getCertificationTopicIdForRoute(route.topicId),
    expectedSessionId: route.expectedSessionId,
    modeId: action.modeId,
    requestedLength: route.sessionLength,
  });

  assert.equal(resumed.kind, "ready");
  if (resumed.kind !== "ready") return;
  assert.equal(resumed.projection.session.id, beforePause.session.id);
  assert.equal(resumed.projection.occurrenceId, beforePause.occurrenceId);
  assert.equal(resumed.projection.ordinal, beforePause.ordinal);
  assert.deepEqual(resumed.projection.response, beforePause.response);
});

test("Certification resume rejects an old Focus record without its immutable domain", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:16:00.000Z"),
    sessionIds: { async create() { return "certification-stale-focus"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;

  const key = STORAGE_KEYS.trainingSession(opened.projection.session.id);
  const raw = storage.getString(key);
  assert.ok(raw);
  const envelope = JSON.parse(raw) as { payload: { configurationSnapshot: Record<string, unknown> } };
  delete envelope.payload.configurationSnapshot.domain;
  storage.setString(key, JSON.stringify(envelope));

  await assert.rejects(
    resumeActiveTrainingSession(),
    (cause: unknown) => cause instanceof TrainingApplicationFailure && cause.code === "resume_unavailable",
  );
});

test("Certification end classifies a failed timer checkpoint before it reaches abandonment", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:18:00.000Z"),
    sessionIds: { async create() { return "certification-abandon-timer-retry"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  const sessionId = opened.projection.session.id;

  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  const retry = await abandonCertificationSession(sessionId);
  assert.equal(retry.kind, "retry_same_command");
  if (retry.kind === "retry_same_command") {
    assert.equal(retry.retry, "foreground_checkpoint");
    assert.equal(retry.session.id, sessionId);
  }
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true);
  assert.equal(await getActiveMutationJournal(), null);

  storage.setFailurePlan(null);
  const abandoned = await retryCertificationAbandonmentAfterCheckpointFailure(sessionId);
  assert.equal(abandoned.kind, "abandoned");
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.equal((await getTrainingSessions()).value.find((session) => session.id === sessionId)?.status, "abandoned");
});

test("Certification end recovers a durable timer checkpoint before abandonment remains available", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:19:00.000Z"),
    sessionIds: { async create() { return "certification-abandon-timer-recovery"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  const sessionId = opened.projection.session.id;
  await submitCertificationPracticeResponse(incorrectResponse(opened.projection.question));
  const materialized = await getCertificationPracticeProjection();
  assert.equal(materialized.operation.kind, "feedback");
  assert.equal(materialized.response?.source, "materialized");
  assert.ok(materialized.feedback);
  assert.equal((await getTrainingAttempts()).value.length, 1);

  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(sessionId) });
  const recovery = await abandonCertificationSession(sessionId);
  assert.equal(recovery.kind, "recovery_required");
  if (recovery.kind === "recovery_required") assert.equal(recovery.recovery, "active_operation");
  assert.equal((await getActiveMutationJournal())?.operation, "advance_training_session");
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true);

  storage.setFailurePlan(null);
  await recoverCertificationPreAbandonmentCheckpoint(sessionId);
  assert.equal(await getActiveMutationJournal(), null);
  const recovered = await getCertificationPracticeProjection();
  assert.equal(recovered.session.id, sessionId);
  assert.equal(recovered.response?.source, "materialized");
  assert.ok(recovered.feedback);
  assert.equal(recovered.operation.kind, "feedback");
  assert.equal((await getTrainingAttempts()).value.length, 1);
  const abandoned = await abandonCertificationSession(sessionId);
  assert.equal(abandoned.kind, "abandoned");
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});

test("Certification abandonment boundaries retry only before durability and otherwise replay the exact journal", async () => {
  const boundaries = [
    { name: "journal_write", failure: (_sessionId: string) => ({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL } as const), expected: "retry" },
    { name: "materialization", failure: (sessionId: string) => ({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(sessionId) } as const), expected: "recover" },
    { name: "active_clear", failure: (_sessionId: string) => ({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION } as const), expected: "recover" },
    { name: "verification", failure: (_sessionId: string) => ({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 3 } as const), expected: "recover" },
    { name: "journal_clear", failure: (_sessionId: string) => ({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL } as const), expected: "recover" },
  ] as const;

  for (const boundary of boundaries) {
    await prepareBundledTestPackages();
    const storage = installMemoryStorage();
    const lifecycle = composeTrainingLifecycleUseCases({
      wallClock: new MutableClock("2026-07-24T12:20:00.000Z"),
      sessionIds: { async create() { return `certification-abandon-${boundary.name}`; } },
    });
    const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
    assert.equal(opened.kind, "ready", boundary.name);
    if (opened.kind !== "ready") continue;
    const sessionId = opened.projection.session.id;
    storage.resetCounters();
    storage.setFailurePlan(boundary.failure(sessionId));

    let abandonCommands = 0;
    let recoveryReplays = 0;
    let routeChanges = 0;
    const abandon = async () => { abandonCommands += 1; return lifecycle.abandonActiveSession(); };
    const recoverAbandonment = async () => { recoveryReplays += 1; return recoverCertificationPracticeAbandonment(sessionId); };
    await assert.rejects(abandon, boundary.name);
    assert.equal(routeChanges, 0, boundary.name);
    storage.setFailurePlan(null);

    const pending = await getActiveMutationJournal();
    if (boundary.expected === "retry") {
      assert.equal(pending, null, boundary.name);
      const active = await getCertificationPracticeProjection();
      assert.equal(active.session.id, sessionId, boundary.name);
      assert.equal(active.operation.kind, "abandonment_failed_before_journal", boundary.name);
      await abandon();
    } else {
      assert.equal(pending?.operation, "abandon_training_session", boundary.name);
      assert.equal(pending?.sessionId, sessionId, boundary.name);
      await recoverAbandonment();
    }
    routeChanges += 1;

    assert.equal(abandonCommands, boundary.expected === "retry" ? 2 : 1, boundary.name);
    assert.equal(recoveryReplays, boundary.expected === "recover" ? 1 : 0, boundary.name);
    assert.equal(routeChanges, 1, boundary.name);
    assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false, boundary.name);
    assert.equal((await getTrainingSessions()).value.find((session) => session.id === sessionId)?.status, "abandoned", boundary.name);
    assert.equal(await getActiveMutationJournal(), null, boundary.name);
  }
});

test("Certification open handles a typed start race with one start and one authoritative resumed result", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T12:30:00.000Z"),
    sessionIds: { async create() { return "raced-certification-session"; } },
  });
  const prepared = await lifecycle.startSession({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", request: { requestedLength: 10, domain: GCP_FREE_NODE_ID } });
  installMemoryStorage();
  let starts = 0;
  lifecycle.startSession = async () => {
    starts += 1;
    await saveTrainingSession(prepared.session);
    await getForegroundSessionTimerFacade().initialize(prepared.session);
    throw new TrainingApplicationFailure("active_session_conflict", "Race installed an authoritative active session.");
  };
  installTrainingLifecycleUseCases(lifecycle);
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(starts, 1);
  assert.equal(opened.kind, "ready");
  if (opened.kind === "ready") assert.equal(opened.projection.session.id, prepared.session.id);
});

test("Certification feedback projects exact materialized attempt results and canonical authored copy", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T10:30:00.000Z"),
    sessionIds: { async create() { return "certification-feedback-boundary"; } },
  });
  const feedbackOpen = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(feedbackOpen.kind, "ready");
  const observed = new Set<"correct" | "incorrect">();

  for (let index = 0; index < 10 && observed.size < 2; index += 1) {
    const before = await getCertificationPracticeProjection();
    assert.equal(before.response, null);
    assert.equal(before.feedback, null);
    const expected = !observed.has("incorrect") ? "incorrect" as const : "correct" as const;
    const response = expected === "incorrect"
      ? incorrectResponse(before.question)
      : correctResponse(before.question);

    await submitCertificationPracticeResponse(response);
    const after = await getCertificationPracticeProjection();
    const attempt = (await getTrainingAttempts()).value.find((candidate) => candidate.sessionId === after.session.id && candidate.occurrenceId === after.occurrenceId);
    assert.ok(attempt);
    assert.equal(attempt.result.kind, expected);
    assert.equal(after.feedback?.result, attempt.result.kind);
    assert.equal(after.feedback?.reason, after.question.feedback.reason);
    assert.deepEqual(after.feedback?.details, after.question.feedback.details);
    assert.equal(after.response?.source, "materialized");
    assert.deepEqual(after.response?.value, attempt.response);
    if (expected === "incorrect") {
      assert.notDeepEqual(correctResponse(after.question), after.response?.value);
      assert.equal(after.feedback?.result, "incorrect");
    }
    observed.add(expected);
    if (observed.size < 2 && after.ordinal < after.total) await advanceCertificationPracticeSession();
  }

  assert.deepEqual([...observed].sort(), ["correct", "incorrect"]);
});

test("Certification pre-journal failure preserves an editable response and resubmits exactly once", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T13:00:00.000Z"),
    sessionIds: { async create() { return "certification-pre-journal"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  const response = incorrectResponse(opened.projection.question);
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(lifecycle.submitPracticeResponse(response));
  storage.setFailurePlan(null);

  const failed = await getCertificationPracticeProjection();
  assert.equal(failed.operation.kind, "submit_journal_failed");
  assert.equal("error" in failed.operation ? failed.operation.error.allowedAction : null, "submit_again");
  assert.equal(failed.response, null);
  assert.equal(failed.feedback, null);
  assert.equal((await getTrainingAttempts()).value.length, 0);

  await lifecycle.submitPracticeResponse(response);
  const recovered = await getCertificationPracticeProjection();
  assert.equal(recovered.operation.kind, "feedback");
  assert.equal(recovered.response?.source, "materialized");
  assert.deepEqual(recovered.response?.value, response);
  assert.equal((await getTrainingAttempts()).value.length, 1);
});

test("Certification journal-committed response locks without feedback and recovers without a duplicate attempt", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T13:30:00.000Z"),
    sessionIds: { async create() { return "certification-materialization-boundary"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  const response = incorrectResponse(opened.projection.question);
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX });
  await assert.rejects(lifecycle.submitPracticeResponse(response));
  storage.setFailurePlan(null);

  const pending = await getCertificationPracticeProjection();
  assert.equal(pending.operation.kind, "commit_materialization_failed");
  assert.equal("error" in pending.operation ? pending.operation.error.allowedAction : null, "recover");
  assert.equal(pending.response?.source, "committed");
  assert.deepEqual(pending.response?.value, response);
  assert.equal(pending.feedback, null);
  assert.notEqual(await getActiveMutationJournal(), null);
  assert.equal((await getTrainingAttempts()).value.length, 0);

  await recoverCertificationPracticeOperation();
  const recovered = await getCertificationPracticeProjection();
  assert.equal(recovered.operation.kind, "feedback");
  assert.equal(recovered.response?.source, "materialized");
  assert.deepEqual(recovered.response?.value, response);
  assert.equal(recovered.feedback?.result, "incorrect");
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal((await getTrainingAttempts()).value.length, 1);
});

test("Certification materialized response and feedback win through verification and journal-clear recovery", async () => {
  for (const boundary of ["verification", "journal_clear"] as const) {
    await prepareBundledTestPackages();
    const storage = installMemoryStorage();
    const lifecycle = composeTrainingLifecycleUseCases({
      wallClock: new MutableClock("2026-07-24T14:00:00.000Z"),
      sessionIds: { async create() { return `certification-${boundary}`; } },
    });
    const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
    assert.equal(opened.kind, "ready");
    if (opened.kind !== "ready") continue;
    const response = incorrectResponse(opened.projection.question);
    storage.resetCounters();
    storage.setFailurePlan(boundary === "verification"
      ? { kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: 3 }
      : { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL });
    await assert.rejects(lifecycle.submitPracticeResponse(response));
    storage.setFailurePlan(null);

    const pending = await getCertificationPracticeProjection();
    assert.equal(pending.operation.kind, boundary === "verification" ? "commit_verification_failed" : "verified_pending_clear");
    assert.equal("error" in pending.operation ? pending.operation.error.allowedAction : null, "recover");
    assert.equal(pending.response?.source, "materialized");
    assert.deepEqual(pending.response?.value, response);
    assert.equal(pending.feedback?.result, "incorrect");
    assert.equal((await getTrainingAttempts()).value.length, 1);

    await recoverCertificationPracticeOperation();
    const recovered = await getCertificationPracticeProjection();
    assert.equal(recovered.operation.kind, "feedback");
    assert.equal(recovered.response?.source, "materialized");
    assert.equal(await getActiveMutationJournal(), null);
    assert.equal((await getTrainingAttempts()).value.length, 1);
  }
});

test("Certification advance failure retries only advance and never resubmits the materialized answer", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T14:30:00.000Z"),
    sessionIds: { async create() { return "certification-advance-retry"; } },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  await submitCertificationPracticeResponse(incorrectResponse(opened.projection.question));
  assert.equal((await getTrainingAttempts()).value.length, 1);
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(advanceCertificationPracticeSession());
  storage.setFailurePlan(null);

  const failed = await getCertificationPracticeProjection();
  assert.equal(failed.operation.kind, "advance_failed");
  assert.equal("error" in failed.operation ? failed.operation.error.allowedAction : null, "retry_same_command");
  assert.equal(failed.response?.source, "materialized");
  assert.equal((await getTrainingAttempts()).value.length, 1);

  await advanceCertificationPracticeSession();
  const advanced = await getCertificationPracticeProjection();
  assert.equal(advanced.ordinal, 2);
  assert.equal(advanced.operation.kind, "unanswered");
  assert.equal(advanced.response, null);
  assert.equal((await getTrainingAttempts()).value.length, 1);
});

test("ordinary Certification facade owns timer start, response and final checkpoints without involving Exam", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  let identitySequence = 0;
  composeTrainingLifecycleUseCases({
    wallClock: new MutableClock("2026-07-24T11:00:00.000Z"),
    sessionIds: {
      async create({ trackId, modeId }) {
        identitySequence += 1;
        return `${trackId}:${modeId}:00000000-0000-4000-8000-${String(identitySequence).padStart(12, "0")}`;
      },
    },
  });

  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;
  const initialized = await getActiveForegroundTimer();
  assert.equal(initialized?.familyId, "certification");
  assert.equal(initialized?.sessionId, opened.projection.session.id);

  let projection = await getCertificationPracticeProjection();
  assert.equal(projection.elapsedForegroundMs, 0);
  await submitCertificationPracticeResponse(incorrectResponse(projection.question));
  const responseCheckpoint = await getActiveForegroundTimer();
  assert.ok((responseCheckpoint?.checkpointRevision ?? 0) > (initialized?.checkpointRevision ?? 0));

  while (projection.ordinal < projection.total) {
    await advanceCertificationPracticeSession();
    projection = await getCertificationPracticeProjection();
    await submitCertificationPracticeResponse(incorrectResponse(projection.question));
  }
  projection = await getCertificationPracticeProjection();
  assert.equal(projection.operation.kind, "feedback");
  assert.equal(projection.response?.source, "materialized");
  assert.equal((await getTrainingAttempts()).value.length, projection.total);
  assert.equal(await getTrainingSessionResult(projection.session.id), null);

  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(projection.session.id) });
  const checkpointFailure = await completeCertificationPracticeSession();
  assert.deepEqual(checkpointFailure, { expectedSessionId: projection.session.id, kind: "recover_final_checkpoint" });
  assert.equal((await getActiveMutationJournal())?.operation, "advance_training_session");
  assert.equal(await getTrainingSessionResult(projection.session.id), null);
  storage.setFailurePlan(null);
  const recoveredFeedback = await recoverCertificationPracticeCompletionCheckpoint(projection.session.id);
  assert.equal(recoveredFeedback.session.id, projection.session.id);
  assert.equal(recoveredFeedback.operation.kind, "feedback");
  assert.equal(recoveredFeedback.response?.source, "materialized");
  assert.ok(recoveredFeedback.feedback);
  assert.equal((await getTrainingAttempts()).value.length, projection.total);

  const completed = await completeCertificationPracticeSession();
  assert.equal(completed.kind, "verified");
  if (completed.kind === "verified") assert.equal(completed.value.result.sessionId, projection.session.id);
  assert.equal(await getActiveForegroundTimer(), null);

  const restarted = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: GCP_FREE_NODE_ID });
  assert.equal(restarted.kind, "ready");
  if (restarted.kind === "ready") await abandonCertificationSession(restarted.projection.session.id);
  assert.equal(await getActiveForegroundTimer(), null);
});
