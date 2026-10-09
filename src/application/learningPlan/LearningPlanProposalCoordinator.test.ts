import assert from "node:assert/strict";
import test from "node:test";
import { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { acceptedTargetFromGoal, createDefaultGoal, createLearningPlanSlotId, normalizeGoalRecord, normalizeLearningPlan, createResolvedContentRef, createTrainingAttempt, createTrainingSession, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { saveGoalSnapshot } from "../../storage/repositories/goalRepository";
import { readLearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";
import { addReviewQueueItems } from "../../storage/repositories/reviewQueueRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { saveLearningPlanAtomically } from "../../storage/repositories/learningPlanRepository";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";
import { STORAGE_KEYS } from "../../storage/keys";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { journal } from "../../testing/journalTestSupport";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { homePlanSnapshotReader } from "../homePlanSnapshotReader";
import { estimatePlanningWork } from "../../domain/learning/planningWorkEstimate";
import { estimateNextSessionTime } from "./nextSessionTimeEstimate";

const TRACK = "google-cloud-associate-cloud-engineer" as const;

async function fixture() {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await saveGoalSnapshot(createDefaultGoal(TRACK), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, "certification");
  let now = "2026-10-02T12:00:00.000Z";
  let timezone = "Europe/Warsaw";
  let afterPackage: (() => void) | null = null;
  let sequence = 0;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => `clock-test:${++sequence}`,
    getTimezone: () => timezone,
    readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved,
    now: () => now,
    resolvePackage: async () => {
      const hook = afterPackage;
      afterPackage = null;
      hook?.();
      return resolved;
    },
    resolveTrackFamily: () => "certification",
  });
  return {
    coordinator,
    resolved,
    storage,
    setNow(value: string) { now = value; },
    setTimezone(value: string) { timezone = value; },
    setAfterPackage(hook: () => void) { afterPackage = hook; },
  };
}

function attempt(f: Awaited<ReturnType<typeof fixture>>, id: string, questionIndex = 0): TrainingAttempt {
  const item = {
    trackId: TRACK,
    questionId: f.resolved.track.questions[questionIndex]!.questionId,
    contentVersion: f.resolved.track.contentVersion,
    artifactSha256: f.resolved.track.artifactSha256,
  };
  return createTrainingAttempt({
    id, sessionId: `session:${id}`, trackId: TRACK, modeId: f.resolved.track.modes[0]!.modeId,
    occurrenceId: `occurrence:${id}`, item, response: {},
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-10-02T11:00:00.000Z", committedAt: "2026-10-02T11:00:00.000Z",
  });
}

function createProposal(f: Awaited<ReturnType<typeof fixture>>, coordinator = f.coordinator) {
  const goal = createDefaultGoal(TRACK);
  return coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
}

function review(f: Awaited<ReturnType<typeof fixture>>, source: TrainingAttempt, dueAt: string, id = `review:${source.id}`): ReviewQueueEntry {
  return {
    id, trackId: TRACK, sourceAttemptId: source.id, sourceSessionId: source.sessionId,
    sourceItem: source.item, taxonomyOrSkillRefs: [], reasons: ["incorrect"], dueAt,
    createdAt: "2026-10-02T11:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true,
  };
}

test("proposal creation rejects a local-day change during package resolution", async () => {
  const f = await fixture();
  f.setAfterPackage(() => f.setNow("2026-10-03T12:00:00.000Z"));
  assert.deepEqual(await createProposal(f), { kind: "stale" });
});

test("the development interruption proposal snapshot rejects every existing session lifecycle state", async () => {
  for (const status of ["active", "completed", "abandoned"] as const) {
    const f = await fixture();
    f.storage.remove(STORAGE_KEYS.goal(TRACK));
    await saveActiveTrackId(TRACK);
    const question = f.resolved.track.questions[0]!;
    const session = createTrainingSession({
      id: `interruption-history:${status}`, trackId: TRACK, modeId: f.resolved.track.modes[0]!.modeId,
      configurationSnapshot: { kind: "test_history" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0,
      itemOrder: [{ occurrenceId: `history:${status}`, item: createResolvedContentRef({ trackId: TRACK,
        questionId: question.questionId, contentVersion: f.resolved.track.contentVersion, artifactSha256: f.resolved.track.artifactSha256 }) }],
      optionOrderByOccurrence: {}, activeForegroundMs: 1, contentVersion: f.resolved.track.contentVersion,
      artifactSha256: f.resolved.track.artifactSha256, status, startedAt: "2026-10-02T10:00:00.000Z",
      ...(status === "completed" ? { completedAt: "2026-10-02T10:01:00.000Z" } : {}),
    });
    const coordinator = new LearningPlanProposalCoordinator({
      createProposalId: () => `interruption-history:${status}`, getTimezone: () => "Europe/Warsaw",
      readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), goal: null, sessions: [session] }),
      peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
      resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
    });
    const created = await coordinator.create(TRACK, { goal: createDefaultGoal(TRACK), minutesPerStudyDay: 60 });
    if (status === "active") {
      assert.deepEqual(created, { kind: "active_session_unavailable", reason: "active_session_not_indexed" }, "an unindexed active record never becomes a new-session recommendation");
      continue;
    }
    assert.equal(created.kind, "ready", `proposal can still be reviewed for ${status} history`);
    if (!("proposal" in created)) throw new Error("Expected an actual proposal.");
    assert.equal(coordinator.readDevelopmentGoalPlanFaultProposalSnapshot(created.proposal.proposalId, TRACK), null,
      `interruption arm must reject ${status} session history`);
  }
});

test("proposal resolution rejects a timezone change during package resolution", async () => {
  const f = await fixture();
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");

  f.setAfterPackage(() => f.setTimezone("America/Los_Angeles"));
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("proposal becomes stale when the accepted-day session window closes at its local scheduled time", async () => {
  const f = await fixture();
  f.setNow("2026-10-02T15:59:00.000Z"); // 17:59 in the selected Europe/Warsaw timezone.
  const goal = { ...createDefaultGoal(TRACK), preferredDays: ["fri"] as const, weeklySessionTarget: 1 };
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  f.setNow("2026-10-02T16:01:00.000Z"); // 18:01, after the calendar's fixed local start time.
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("editing a proposal's local time recomputes its calendar before acceptance", async () => {
  const f = await fixture();
  const goal = { ...createDefaultGoal(TRACK), preferredDays: ["fri"] as const, weeklySessionTarget: 1 };
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  assert.equal(created.proposal.nextSessionCalendar.kind, "available");
  if (created.proposal.nextSessionCalendar.kind !== "available") throw new Error("Expected an available next-session calendar.");
  assert.ok(created.proposal.nextSessionCalendar.calendar.availableDays.some((day) => day.localDate === "2026-10-02"));
  assert.ok(created.proposal.nextSessionCalendar.calendar.availableDays.every((day) => day.selectedSession === null), "the fixed 40-question diagnostic is not silently replaced by a shorter request to fit 60 minutes");
  const editedSlots = created.proposal.outcome.slots.map((slot) => ({ ...slot, localTime: "13:00" }));
  assert.equal(f.coordinator.updateSchedule(created.proposal.proposalId, TRACK, editedSlots), true);
  const resolved = await f.coordinator.resolve(created.proposal.proposalId, TRACK);
  assert.equal(resolved.kind, "ready");
  if (!("proposal" in resolved)) throw new Error("Expected a revalidated proposal.");
  assert.equal(resolved.proposal.nextSessionCalendar.kind, "available");
  if (resolved.proposal.nextSessionCalendar.kind === "available") {
    assert.equal(resolved.proposal.nextSessionCalendar.calendar.availableDays.some((day) => day.localDate === "2026-10-02"), false);
    assert.ok(resolved.proposal.nextSessionCalendar.calendar.availableDays.every((day) => day.selectedSession === null), "rescheduling does not shorten the fixed diagnostic");
  }
});

test("unchanged persisted GCP inputs stay ready through the synchronous commit guard", async () => {
  const f = await fixture();
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  assert.equal(created.proposal.outcome.nextSession.kind, "diagnosis");
  assert.equal(created.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (created.proposal.nextSessionTimeEstimate.kind === "estimated") {
    assert.equal(created.proposal.nextSessionTimeEstimate.newResponses, created.proposal.outcome.nextSession.requestedLength);
    assert.equal(created.proposal.nextSessionTimeEstimate.provenance, "authored");
    assert.ok(created.proposal.nextSessionTimeEstimate.minMinutes <= created.proposal.nextSessionTimeEstimate.typicalMinutes);
    assert.ok(created.proposal.nextSessionTimeEstimate.typicalMinutes <= created.proposal.nextSessionTimeEstimate.maxMinutes);
  }
  assert.equal(f.coordinator.resolveForCommit(created.proposal.proposalId, TRACK).kind, "ready");
});

test("proposal accepts a goal whose optional target date was explicitly cleared by the UI", async () => {
  const f = await fixture();
  const goal = normalizeGoalRecord({ ...createDefaultGoal(TRACK), targetDate: undefined });
  assert.equal(Object.hasOwn(goal, "targetDate"), false);
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
  assert.equal(created.kind, "ready");
});

test("real GCP proposals schedule one exact diagnostic across short and long 20-minute horizons without repeating it", async () => {
  const f = await fixture();
  const goal = { ...createDefaultGoal(TRACK), preferredDays: ["mon", "wed", "sat"] as const, weeklySessionTarget: 3, targetDate: "2026-10-09" };
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 20 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a GCP proposal.");
  const { fullGoalWorkload, fullGoalCalendar } = created.proposal;
  assert.equal(fullGoalWorkload.sessionDemands[0]?.phase, "diagnosis");
  assert.equal(fullGoalWorkload.sessionDemands[0]?.responseCount, 40);
  assert.equal(fullGoalWorkload.sessionDemands[1]?.phase, "practice", "one bounded next practice step follows the fixed diagnostic without claiming C3 credit");
  assert.equal(fullGoalWorkload.nextPractice?.kind, "estimated");
  assert.equal(fullGoalWorkload.chapters.reduce((sum, chapter) => sum + chapter.diagnosticResponses, 0), 40);
  assert.equal(fullGoalWorkload.newResponses, fullGoalWorkload.requiredResponses! - fullGoalWorkload.dueReviewResponses - 40);
  assert.equal(fullGoalCalendar.kind, "available");
  if (fullGoalCalendar.kind === "available") {
    const calendar = fullGoalCalendar.calendar;
    assert.notEqual(calendar.kind, "open_ended");
    assert.notEqual(calendar.kind, "preview");
    assert.ok(calendar.availableDays.some((day) => day.selectedWork?.phase === "diagnosis") || calendar.unscheduledWorkDemandIds.includes(fullGoalWorkload.sessionDemands[0]!.id));
  }
  const longer = await f.coordinator.create(TRACK, { goal: { ...goal, targetDate: "2026-12-01" }, minutesPerStudyDay: 20 });
  assert.equal(longer.kind, "ready");
  if (!("proposal" in longer)) throw new Error("Expected a longer-horizon GCP proposal.");
  const longerCalendar = longer.proposal.fullGoalCalendar;
  assert.equal(longerCalendar.kind, "available");
  if (longerCalendar.kind === "available") {
    assert.notEqual(longerCalendar.calendar.kind, "open_ended");
    assert.notEqual(longerCalendar.calendar.kind, "preview");
    assert.ok(longerCalendar.calendar.totalTypicalPlannedMinutes > (fullGoalCalendar.kind === "available" ? fullGoalCalendar.calendar.totalTypicalPlannedMinutes : 0),
      `expected a longer target horizon to schedule more work (${longerCalendar.calendar.totalTypicalPlannedMinutes} vs ${fullGoalCalendar.kind === "available" ? fullGoalCalendar.calendar.totalTypicalPlannedMinutes : "unavailable"})`);
    const plannedDiagnosisWindows = longerCalendar.calendar.availableDays.filter((day) => day.selectedWork?.phase === "diagnosis");
    assert.equal(longer.proposal.nextSessionTimeEstimate.kind, "estimated");
    const immediateDiagnosticMinutes = longer.proposal.nextSessionTimeEstimate.kind === "estimated" ? longer.proposal.nextSessionTimeEstimate.typicalMinutes : 0;
    assert.equal(plannedDiagnosisWindows.length, Math.ceil(immediateDiagnosticMinutes / 20), "the actual diagnostic duration resumes across only the windows its authored per-response estimate needs");
    assert.equal(plannedDiagnosisWindows[0]?.selectedWork?.continuation, false);
    assert.ok(plannedDiagnosisWindows.slice(1).every((day) => day.selectedWork?.continuation));
    assert.deepEqual(longerCalendar.calendar.unscheduledWorkDemandIds, []);
    assert.ok(longerCalendar.calendar.availableDays.some((day) => day.selectedWork?.phase === "practice"), "the canonical next practice stage follows the completed forecast diagnostic");
    assert.ok(longer.proposal.fullGoalWorkload.unknownChapterIds.length > 0, "unavailable Premium scopes remain explicit instead of being filled with invented practice requests");
  }
});

test("an active diagnostic resumes its persisted legal 40-question session with only unanswered items remaining", async () => {
  const f = await fixture();
  const diagnostic = f.resolved.track.getMode("certification-diagnostic-baseline");
  if (diagnostic.selection.kind !== "exact_ordered_questions") throw new Error("Expected the canonical exact diagnostic pool.");
  const prepared = await new CanonicalTrainingRuntime(f.resolved.track).prepare({ trackId: TRACK, modeId: diagnostic.modeId,
    request: { sessionId: "active-gcp-diagnostic", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  const activeSession = createTrainingSession({ ...prepared.session, currentItemIndex: 4, activeForegroundMs: 10 * 60_000 });
  const ordered = activeSession.itemOrder;
  await saveTrainingSession(activeSession);
  for (const occurrence of ordered.slice(0, 5)) await addTrainingAttempt(createTrainingAttempt({ id: `attempt:${occurrence.occurrenceId}`, sessionId: activeSession.id, trackId: TRACK,
    modeId: diagnostic.modeId, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: { kind: "correct" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-10-02T10:10:00.000Z", committedAt: "2026-10-02T10:10:00.000Z" }));

  const goal = { ...createDefaultGoal(TRACK), preferredDays: ["fri", "sat"] as const, weeklySessionTarget: 2, targetDate: "2026-10-09" };
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 20 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal with the exact active diagnostic.");
  assert.equal(created.proposal.outcome.nextSession.kind, "continue_existing");
  assert.equal(created.proposal.outcome.nextSession.requestedLength, 40);
  assert.equal(created.proposal.outcome.nextSession.sessionId, activeSession.id);
  assert.equal(created.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (created.proposal.nextSessionTimeEstimate.kind === "estimated") assert.equal(created.proposal.nextSessionTimeEstimate.newResponses, 35, "immediate estimate excludes already committed answers in the active session");
  const demand = created.proposal.fullGoalWorkload.sessionDemands.find((entry) => entry.phase === "diagnosis");
  assert.equal(demand?.responseCount, 35);
  assert.equal(demand?.legalOptions[0]?.sessionLength, 40, "remaining answers do not become a new illegal 35-question session");
  if (created.proposal.nextSessionTimeEstimate.kind === "estimated") {
    assert.deepEqual(demand?.legalOptions[0], { sessionLength: 40, minMinutes: created.proposal.nextSessionTimeEstimate.minMinutes,
      typicalMinutes: created.proposal.nextSessionTimeEstimate.typicalMinutes, maxMinutes: created.proposal.nextSessionTimeEstimate.maxMinutes },
    "both projections charge only the exact unanswered diagnostic items, not the future reserve");
  }
  assert.equal(demand?.isExistingSession, true);
  const scheduled = created.proposal.fullGoalCalendar.kind === "available" ? created.proposal.fullGoalCalendar.calendar.availableDays.find((day) => day.selectedWork?.phase === "diagnosis") : undefined;
  assert.equal(scheduled?.selectedSession?.sessionLength, 40);
  assert.equal(scheduled?.selectedWork?.responsesRemaining, 35);
  assert.equal(scheduled?.selectedWork?.continuation, true);
});

test("the same GCP goal moves from its exact initial diagnosis pool to history-conditioned practice scopes", async () => {
  const f = await fixture();
  const goal = createDefaultGoal(TRACK);
  const first = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
  assert.equal(first.kind, "ready");
  if (!("proposal" in first)) throw new Error("Expected the initial proposal.");
  const diagnostic = f.resolved.track.getMode("certification-diagnostic-baseline");
  assert.equal(first.proposal.outcome.nextSession.kind, "diagnosis");
  const questionIds = diagnostic.selection.kind === "exact_ordered_questions" ? diagnostic.selection.questionIds : [];
  assert.equal(questionIds.length, 40);
  const occurrences = questionIds.map((questionId, index) => ({ occurrenceId: `diag-occurrence-${index}`, item: createResolvedContentRef({ trackId: TRACK, questionId, contentVersion: f.resolved.track.contentVersion, artifactSha256: f.resolved.track.artifactSha256 }) }));
  const session = createTrainingSession({ id: "completed-gcp-diagnostic", trackId: TRACK, modeId: diagnostic.modeId,
    configurationSnapshot: { kind: "diagnosis" }, requestedLength: 40, actualLength: 40, currentItemIndex: 39, itemOrder: occurrences,
    optionOrderByOccurrence: {}, activeForegroundMs: 40 * 60_000, contentVersion: f.resolved.track.contentVersion, artifactSha256: f.resolved.track.artifactSha256,
    status: "completed", startedAt: "2026-10-02T10:00:00.000Z", completedAt: "2026-10-02T10:40:00.000Z" });
  await saveTrainingSession(session);
  for (const occurrence of occurrences) {
    await addTrainingAttempt(createTrainingAttempt({ id: `diag-attempt:${occurrence.occurrenceId}`, sessionId: session.id, trackId: TRACK, modeId: diagnostic.modeId,
      occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: { kind: "correct" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] }, answeredAt: session.completedAt!, committedAt: session.completedAt! }));
}

  const replanned = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 60 });
  assert.equal(replanned.kind, "ready");
  if (!("proposal" in replanned)) throw new Error("Expected the history-conditioned proposal.");
  assert.equal(replanned.proposal.outcome.nextSession.kind, "practice");
  const practiceMode = f.resolved.track.getMode(replanned.proposal.outcome.nextSession.modeId);
  const practiceQuestions = selectPracticeQuestions(f.resolved.track.getPool(practiceMode.modeId), (await readLearningPlanInputSnapshot(TRACK)).attempts, f.resolved.track, replanned.proposal.outcome.nextSession.requestedLength);
  assert.ok(practiceQuestions.length > 0);
  if (practiceMode.selection.kind !== "node") throw new Error("Expected the canonical node-scoped practice mode.");
  const practiceNodeId = practiceMode.selection.nodeId;
  assert.ok(practiceQuestions.every((question) => question.nodeId === practiceNodeId));
  assert.notDeepEqual(practiceQuestions.map((question) => question.questionId), questionIds.slice(0, practiceQuestions.length));
  assert.equal(replanned.proposal.fullGoalWorkload.sessionDemands.some((demand) => demand.phase === "diagnosis"), false);
});

test("an active Coding session resumes its exact 10-question pin and does not count its committed response twice", async () => {
  const trackId = "coding-interview-dsa-problem-solving" as const;
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await saveGoalSnapshot(createDefaultGoal(trackId), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  const mode = resolved.track.getMode("coding-interview-guided-practice");
  const prepared = await new CanonicalTrainingRuntime(resolved.track, "coding_interview").prepare({
    trackId, modeId: mode.modeId, request: { sessionId: "active-coding-session", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z",
  });
  const activeSession = prepared.session;
  await saveTrainingSession(activeSession);
  const first = activeSession.itemOrder[0]!;
  await addTrainingAttempt(createTrainingAttempt({
    id: "active-coding-answer-1", sessionId: activeSession.id, trackId, modeId: activeSession.modeId,
    occurrenceId: first.occurrenceId, item: first.item, response: { answer: "committed" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: first.item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-10-02T10:10:00.000Z", committedAt: "2026-10-02T10:10:00.000Z",
  }));
  let sequence = 0;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => `active-coding:${++sequence}`, getTimezone: () => "Europe/Warsaw", readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved, now: () => "2026-10-02T12:00:00.000Z", resolvePackage: async () => resolved,
    resolveTrackFamily: () => "coding_interview",
  });
  const created = await coordinator.create(trackId, { goal: createDefaultGoal(trackId), minutesPerStudyDay: 60 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected the active canonical session proposal.");
  assert.deepEqual(created.proposal.outcome.nextSession, { kind: "continue_existing", modeId: mode.modeId, requestedLength: 10, sessionId: activeSession.id });
  assert.equal(created.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (created.proposal.nextSessionTimeEstimate.kind === "estimated") assert.equal(created.proposal.nextSessionTimeEstimate.newResponses, 9);
  assert.deepEqual(created.proposal.fullGoalWorkload.activeContinuation, {
    kind: "continue_existing", sessionId: activeSession.id, modeId: mode.modeId, requestedLength: 10, responseCount: 9, phase: "practice", reviewEntryIds: [],
  });
  const continuation = created.proposal.fullGoalWorkload.sessionDemands.filter((demand) => demand.kind === "continue_existing");
  assert.equal(continuation.length, 1);
  assert.equal(continuation[0]?.responseCount, 9);
  assert.equal(continuation[0]?.legalOptions[0]?.sessionLength, 10, "the remaining nine answers never become an illegal nine-question session");
  const policy = resolved.planningPolicy;
  const policyIdentity = resolved.planningPolicyIdentity;
  assert.ok(policy && policyIdentity);
  const remainingScopeCounts = new Map<string, { nodeId: string; mentalUnitId: string; responses: number }>();
  for (const occurrence of activeSession.itemOrder.slice(1)) {
    const question = resolved.track.getQuestion(occurrence.item.questionId);
    assert.ok(question);
    const key = `${question.nodeId}\0${question.mentalUnitId}`;
    const scope = remainingScopeCounts.get(key) ?? { nodeId: question.nodeId, mentalUnitId: question.mentalUnitId, responses: 0 };
    scope.responses += 1;
    remainingScopeCounts.set(key, scope);
  }
  const exactSessionEstimate = estimatePlanningWork({ policy, modeId: mode.modeId, contentVersion: resolved.track.contentVersion,
    artifactSha256: resolved.track.artifactSha256, planningPolicyIdentity: policyIdentity, plannedWork: [...remainingScopeCounts.values()],
    includeReviewReserve: false });
  assert.equal(exactSessionEstimate.kind, "estimated");
  assert.equal(created.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (exactSessionEstimate.kind === "estimated" && created.proposal.nextSessionTimeEstimate.kind === "estimated") {
    assert.deepEqual([created.proposal.nextSessionTimeEstimate.minMinutes, created.proposal.nextSessionTimeEstimate.typicalMinutes, created.proposal.nextSessionTimeEstimate.maxMinutes],
      [exactSessionEstimate.minMinutes, exactSessionEstimate.typicalMinutes, exactSessionEstimate.maxMinutes]);
    assert.deepEqual(continuation[0]?.legalOptions[0], { sessionLength: 10, minMinutes: exactSessionEstimate.minMinutes,
      typicalMinutes: exactSessionEstimate.typicalMinutes, maxMinutes: exactSessionEstimate.maxMinutes }, "calendar duration excludes future review reserve");
  }
  assert.ok(policy.workEstimates.some((estimate) => estimate.modeId === mode.modeId && estimate.reviewReserve.kind === "authored_estimate" && estimate.reviewReserve.typicalAdditionalResponsesPerNewResponse > 0),
    "the canonical policy provides a nonzero future reserve, so the equality above proves the continuation duration excludes it");
  const selected = created.proposal.nextSessionCalendar.kind === "available"
    ? created.proposal.nextSessionCalendar.calendar.availableDays.find((day) => day.selectedWork?.demandId === continuation[0]?.id)?.selectedWork : undefined;
  assert.equal(selected?.responsesRemaining, 9);
  assert.equal(selected?.continuation, true);
});

test("an indexed active session without the canonical continuation decision is unavailable", async () => {
  const f = await fixture();
  const diagnostic = f.resolved.track.getMode("certification-diagnostic-baseline");
  const prepared = await new CanonicalTrainingRuntime(f.resolved.track, "certification").prepare({ trackId: TRACK, modeId: diagnostic.modeId,
    request: { sessionId: "unresolved-active-diagnostic", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  const recommendation = recommendLearningPlanMode({ familyId: "certification", trackId: TRACK, modes: f.resolved.track.modes, sessions: [], dueReviewCount: 0 });
  const estimate = estimateNextSessionTime({ track: f.resolved.track, planningPolicy: f.resolved.planningPolicy,
    planningPolicyIdentity: f.resolved.planningPolicyIdentity, recommendation, sessions: [prepared.session], attempts: [], reviews: [], now: "2026-10-02T12:00:00.000Z" });
  assert.deepEqual(estimate, { kind: "unavailable", reason: "invalid_response_count", scopeRefs: [] });
});

test("a session active on another track blocks a new recommendation without changing that session", async () => {
  const f = await fixture();
  const diagnostic = f.resolved.track.getMode("certification-diagnostic-baseline");
  const prepared = await new CanonicalTrainingRuntime(f.resolved.track).prepare({ trackId: TRACK, modeId: diagnostic.modeId,
    request: { sessionId: "active-gcp-other-track", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  await saveTrainingSession(prepared.session);
  const codingTrack = "coding-interview-dsa-problem-solving" as const;
  const codingPackage = await contentPackageRuntimeOwner.resolveForDiscovery(codingTrack, "coding_interview");
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "other-track-active", getTimezone: () => "Europe/Warsaw", readInputs: readLearningPlanInputSnapshot,
    peekPackage: (trackId) => trackId === TRACK ? f.resolved : codingPackage,
    now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async (trackId) => trackId === TRACK ? f.resolved : codingPackage,
    resolveTrackFamily: (trackId) => trackId === TRACK ? "certification" : "coding_interview",
  });
  const result = await coordinator.create(codingTrack, { goal: createDefaultGoal(codingTrack), minutesPerStudyDay: 60 });
  assert.deepEqual(result, { kind: "active_session_unavailable", reason: "another_track_active" });
  const snapshot = readLearningPlanInputSnapshot(codingTrack);
  assert.equal(snapshot.activeSession?.id, prepared.session.id);
  assert.equal(snapshot.sessions?.filter((session) => session.status === "active").length, 1);
  assert.equal(snapshot.goal, null);
  assert.equal(snapshot.plan, null);
});

test("an active session with a stale exact artifact pin is explicitly unavailable and never falls back to a new session", async () => {
  const f = await fixture();
  const diagnostic = f.resolved.track.getMode("certification-diagnostic-baseline");
  const prepared = await new CanonicalTrainingRuntime(f.resolved.track).prepare({ trackId: TRACK, modeId: diagnostic.modeId,
    request: { sessionId: "active-gcp-stale-pin", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  const staleSession = createTrainingSession({ ...prepared.session, contentVersion: "stale-training-version",
    itemOrder: prepared.session.itemOrder.map((occurrence) => ({ ...occurrence, item: createResolvedContentRef({ ...occurrence.item, contentVersion: "stale-training-version" }) })) });
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "stale-active-pin", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), activeSession: staleSession, sessions: [staleSession] }),
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z", resolvePackage: async () => f.resolved,
    resolveTrackFamily: () => "certification",
  });
  const result = await coordinator.create(TRACK, { goal: createDefaultGoal(TRACK), minutesPerStudyDay: 60 });
  assert.deepEqual(result, { kind: "active_session_unavailable", reason: "active_session_mode_unavailable" });
  const actual = readLearningPlanInputSnapshot(TRACK);
  assert.equal(actual.activeSession, null);
  assert.deepEqual(actual.sessions, []);
});

test("an active due-review continuation coalesces its queue entry and preserves its exact due source", async () => {
  const trackId = "coding-interview-dsa-problem-solving" as const;
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveGoalSnapshot(createDefaultGoal(trackId), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  const runtime = new CanonicalTrainingRuntime(resolved.track, "coding_interview");
  const practiceMode = resolved.track.getMode("coding-interview-guided-practice");
  const reviewMode = resolved.track.getMode("coding-interview-weak-area-review");
  const sourcePrepared = await runtime.prepare({ trackId, modeId: practiceMode.modeId,
    request: { sessionId: "coding-review-source", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  const sourceOccurrence = sourcePrepared.session.itemOrder[0]!;
  const sourceAttempts = sourcePrepared.session.itemOrder.map((occurrence, index) => createTrainingAttempt({
    id: `coding-review-source-attempt-${index}`, sessionId: sourcePrepared.session.id, trackId, modeId: practiceMode.modeId,
    occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: { answer: index === 0 ? "miss" : "correct" },
    result: index === 0 ? { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } : { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-10-02T10:05:00.000Z", committedAt: "2026-10-02T10:05:00.000Z",
  }));
  const completedSource = await runtime.finalizePractice({ session: sourcePrepared.session, attempts: sourceAttempts, now: "2026-10-02T10:10:00.000Z" });
  await saveTrainingSession(completedSource.session);
  for (const attempt of sourceAttempts) await addTrainingAttempt(attempt);
  const sourceAttempt = sourceAttempts[0]!;
  const queueEntry: ReviewQueueEntry = {
    id: "coding-active-due-review", trackId, sourceAttemptId: sourceAttempt.id, sourceSessionId: sourcePrepared.session.id,
    sourceItem: sourceAttempt.item, taxonomyOrSkillRefs: [], reasons: ["incorrect"], dueAt: "2026-10-02T11:00:00.000Z",
    createdAt: "2026-10-02T10:05:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true,
  };
  await addReviewQueueItems([queueEntry]);
  const reviewPrepared = await runtime.prepare({ trackId, modeId: reviewMode.modeId,
    request: { sessionId: "coding-active-review", requestedLength: 10, reviewSource: "due_queue" }, attempts: sourceAttempts, reviews: [queueEntry], now: "2026-10-02T12:00:00.000Z" });
  assert.equal(reviewPrepared.session.itemOrder.length, 1);
  await saveTrainingSession(reviewPrepared.session);
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "coding-active-review-proposal", getTimezone: () => "Europe/Warsaw", readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved, now: () => "2026-10-02T12:00:00.000Z", resolvePackage: async () => resolved,
    resolveTrackFamily: () => "coding_interview",
  });
  const result = await coordinator.create(trackId, { goal: createDefaultGoal(trackId), minutesPerStudyDay: 60 });
  assert.equal(result.kind, "ready");
  if (!("proposal" in result)) throw new Error("Expected the active review continuation proposal.");
  assert.deepEqual(result.proposal.outcome.nextSession, { kind: "continue_existing", modeId: reviewMode.modeId, requestedLength: 10, sessionId: reviewPrepared.session.id });
  assert.deepEqual(result.proposal.fullGoalWorkload.activeContinuation, {
    kind: "continue_existing", sessionId: reviewPrepared.session.id, modeId: reviewMode.modeId, requestedLength: 10,
    responseCount: 1, phase: "review", reviewEntryIds: [queueEntry.id],
  });
  assert.equal(result.proposal.fullGoalWorkload.dueReviews.filter((review) => review.id === queueEntry.id).length, 1);
  assert.equal(result.proposal.fullGoalWorkload.sessionDemands.filter((demand) => demand.kind === "continue_existing" && demand.reviewEntryIds?.includes(queueEntry.id)).length, 1);
  assert.equal(result.proposal.nextSessionCalendar.kind, "available");
});

test("Home keeps the exact active training pin after an accepted plan revision", async () => {
  const trackId = "coding-interview-dsa-problem-solving" as const;
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const goalSnapshot = await saveGoalSnapshot(createDefaultGoal(trackId), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  if (!resolved.planningPolicyIdentity) throw new Error("Expected the current planning policy identity.");
  const executionPolicy = recommendLearningPlanMode({ familyId: "coding_interview", trackId, modes: resolved.track.modes, sessions: [], dueReviewCount: 0 }).executionPolicy;
  const createdAt = "2026-10-01T12:00:00.000Z";
  const firstPlan = normalizeLearningPlan({ schemaVersion: 2, planId: "active-session-replan", trackId, goalRevision: goalSnapshot.revision, status: "accepted",
    timezone: "Europe/Warsaw", contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, minutesPerStudyDay: 60,
    executionPolicy, planningPolicyIdentity: resolved.planningPolicyIdentity, acceptedTarget: acceptedTargetFromGoal(goalSnapshot.record), createdAt, updatedAt: createdAt,
    planRevision: 1, commandId: "active-session-replan:first", slots: [{ slotId: createLearningPlanSlotId("active-session-replan:first-slot"), day: "fri", localTime: "18:00", sessionLength: 10 }] });
  const firstPlanSnapshot = saveLearningPlanAtomically({ plan: firstPlan, expectedGoalRevision: goalSnapshot.revision, expectedPlanStorageRevision: null });
  const mode = resolved.track.getMode("coding-interview-guided-practice");
  const prepared = await new CanonicalTrainingRuntime(resolved.track, "coding_interview").prepare({ trackId, modeId: mode.modeId,
    request: { sessionId: "pinned-across-plan-revisions", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-02T10:00:00.000Z" });
  await saveTrainingSession(prepared.session);
  const firstOccurrence = prepared.session.itemOrder[0]!;
  await addTrainingAttempt(createTrainingAttempt({ id: "active-replan-answer", sessionId: prepared.session.id, trackId, modeId: mode.modeId,
    occurrenceId: firstOccurrence.occurrenceId, item: firstOccurrence.item, response: { answer: "committed" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: firstOccurrence.item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-10-02T10:10:00.000Z", committedAt: "2026-10-02T10:10:00.000Z" }));
  const revisedPlan = normalizeLearningPlan({ ...firstPlan, planRevision: 2, commandId: "active-session-replan:second", updatedAt: "2026-10-02T11:00:00.000Z",
    slots: [{ slotId: createLearningPlanSlotId("active-session-replan:second-slot"), day: "sat", localTime: "18:00", sessionLength: 10 }] });
  saveLearningPlanAtomically({ plan: revisedPlan, expectedGoalRevision: goalSnapshot.revision, expectedPlanStorageRevision: firstPlanSnapshot.revision });
  const home = await homePlanSnapshotReader.read({ trackId, now: "2026-10-02T12:00:00.000Z", premiumAccess: "denied" });
  assert.equal(home.kind, "ready");
  if (home.kind !== "ready") throw new Error("Expected the accepted plan and active session to remain readable.");
  assert.equal(home.activeSession?.id, prepared.session.id);
  assert.equal(home.session.modeId, prepared.session.modeId);
  assert.equal(home.session.sessionLength, prepared.session.requestedLength);
  assert.equal(home.identity.planRevision, 2);
  assert.equal(home.activeSession?.artifactSha256, resolved.track.trainingIdentity?.artifactSha256 ?? resolved.track.artifactSha256);
});

test("an actual due queue selects the canonical review request and estimates only its due responses", async () => {
  const f = await fixture();
  const source = attempt(f, "gcp-due-review-source");
  await addReviewQueueItems([review(f, source, "2026-10-02T11:00:00.000Z")]);
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  assert.equal(created.proposal.outcome.nextSession.kind, "review");
  assert.equal(created.proposal.outcome.nextSession.modeId, "certification-weak-area-review");
  assert.equal(created.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (created.proposal.nextSessionTimeEstimate.kind === "estimated") {
    assert.equal(created.proposal.nextSessionTimeEstimate.dueReviewResponses, 1);
    assert.equal(created.proposal.nextSessionTimeEstimate.newResponses, 0);
  }
  assert.equal(created.proposal.fullGoalCalendar.kind, "available");
  if (created.proposal.fullGoalCalendar.kind === "available") {
    assert.ok(created.proposal.fullGoalCalendar.calendar.availableDays.some((day) => day.reviewObligationIds.includes("review:gcp-due-review-source")));
  }
  assert.equal(created.proposal.fullGoalWorkload.dueReviews[0]?.modeId, "certification-weak-area-review");
});

test("a 19-item GCP review backlog previews the recommended 10-request session while retaining all due work", async () => {
  const f = await fixture();
  f.setNow("2026-10-10T07:00:00.000Z"); // 09:00 Saturday in Europe/Warsaw.
  const dueIds: string[] = [];
  for (let index = 0; index < 19; index += 1) {
    const source = attempt(f, `gcp-due-review-backlog-${index}`, index);
    const entry = review(f, source, "2026-10-02T11:00:00.000Z");
    dueIds.push(entry.id);
    await addTrainingAttempt(source);
    await addReviewQueueItems([entry]);
  }
  const goal = { ...createDefaultGoal(TRACK), preferredDays: ["mon", "wed", "fri", "sat"] as const, weeklySessionTarget: 4, targetDate: "2026-10-13" };
  const created = await f.coordinator.create(TRACK, { goal, minutesPerStudyDay: 180 });
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a GCP backlog proposal.");

  const proposal = created.proposal;
  assert.equal(proposal.outcome.nextSession.kind, "review");
  assert.equal(proposal.outcome.nextSession.requestedLength, 10);
  assert.equal(proposal.nextSessionTimeEstimate.kind, "estimated");
  assert.equal(proposal.nextSessionCalendar.kind, "available");
  if (proposal.nextSessionTimeEstimate.kind !== "estimated" || proposal.nextSessionCalendar.kind !== "available") return;
  assert.equal(proposal.nextSessionTimeEstimate.dueReviewResponses, 10);
  assert.equal(proposal.nextSessionTimeEstimate.newResponses, 0);
  assert.equal(proposal.nextSessionTimeEstimate.minMinutes, 10);
  assert.equal(proposal.nextSessionTimeEstimate.maxMinutes, 40);
  const selectedDay = proposal.nextSessionCalendar.calendar.availableDays.find((day) => day.selectedSession !== null);
  assert.equal(selectedDay?.selectedSession?.sessionLength, 10);
  assert.equal(selectedDay?.selectedSession?.minMinutes, proposal.nextSessionTimeEstimate.minMinutes);
  assert.equal(selectedDay?.selectedSession?.maxMinutes, proposal.nextSessionTimeEstimate.maxMinutes);
  const representedDueIds = proposal.fullGoalCalendar.kind === "available"
    ? [...proposal.fullGoalCalendar.calendar.availableDays.flatMap((day) => day.reviewObligationIds),
      ...proposal.fullGoalCalendar.calendar.unscheduledReviewObligationIds,
      ...proposal.fullGoalCalendar.calendar.unknownReviewObligationIds].sort()
    : [];
  assert.deepEqual(representedDueIds, dueIds.sort(), "the separate full-plan calendar retains every real due review");
});

test("a newly persisted exact-package attempt stales the proposal; immutable replay adds no evidence", async () => {
  const f = await fixture();
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  const record = attempt(f, "gcp-attempt-one");
  await addTrainingAttempt(record);
  const replay = await addTrainingAttempt(record);
  assert.deepEqual(replay.value, record);
  assert.equal(readLearningPlanInputSnapshot(TRACK).attempts.length, 1);
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("a persisted review becoming due within the same local day stales its proposal", async () => {
  const f = await fixture();
  const source = attempt(f, "gcp-review-source");
  await addTrainingAttempt(source);
  await addReviewQueueItems([review(f, source, "2026-10-02T17:00:00.000Z")]);
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  f.setNow("2026-10-02T18:00:00.000Z"); // Still 2026-10-02 in Europe/Warsaw.
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("a persisted goal revision change stales its proposal", async () => {
  const f = await fixture();
  const created = await createProposal(f);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  const before = readLearningPlanInputSnapshot(TRACK).goal!;
  await saveGoalSnapshot({ ...before.record, weeklySessionTarget: before.record.weeklySessionTarget + 1 }, before.revision);
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("corrupt, dangling, and journaled evidence reads are errors, never empty histories", async (t) => {
  const cases = ["corrupt-index", "dangling-attempt", "active-journal"] as const;
  for (const scenario of cases) await t.test(scenario, async () => {
    const f = await fixture();
    if (scenario === "corrupt-index") f.storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "not-json");
    if (scenario === "dangling-attempt") f.storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: ["missing-attempt"] }));
    if (scenario === "active-journal") await persistMutationJournal(journal([{ kind: "clear_learning_state" }], "reset_learning_state"));
    assert.deepEqual(await createProposal(f), { kind: "generator_error", classification: "retryable" });
  });
});

test("storage profile replacement during package resolution stales creation", async () => {
  const f = await fixture();
  f.setAfterPackage(() => {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  });
  assert.deepEqual(await createProposal(f), { kind: "stale" });
});

test("an injected canonical-package artifact change stales the synchronous guard", async () => {
  const f = await fixture();
  let current = f.resolved;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "artifact-change-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: readLearningPlanInputSnapshot, peekPackage: () => current,
    now: () => "2026-10-02T12:00:00.000Z", resolvePackage: async () => current,
    resolveTrackFamily: () => "certification",
  });
  const created = await createProposal(f, coordinator);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  current = { ...f.resolved, track: { ...f.resolved.track, artifactSha256: "f".repeat(64) } };
  assert.deepEqual(coordinator.resolveForCommit(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("exact duplicate evidence preserves order and conflicting duplicate IDs fail closed", async () => {
  const f = await fixture();
  const first = attempt(f, "ordered-one");
  const second = attempt(f, "ordered-two");
  let records: readonly TrainingAttempt[] = [first, second, first];
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "ordered-evidence-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), attempts: records }),
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  const created = await createProposal(f, coordinator);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  records = [first, second];
  assert.equal(coordinator.resolveForCommit(created.proposal.proposalId, TRACK).kind, "ready");

  records = [second, first];
  assert.deepEqual(coordinator.resolveForCommit(created.proposal.proposalId, TRACK), { kind: "stale" });

  const conflicting = new LearningPlanProposalCoordinator({
    createProposalId: () => "conflicting-evidence-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), attempts: [first, { ...first, committedAt: "2026-10-02T11:01:00.000Z" }] }),
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  assert.deepEqual(await createProposal(f, conflicting), { kind: "generator_error", classification: "unclassified" });
});


test("a repository read failure after package await remains retryable", async () => {
  const f = await fixture(); let reads = 0;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "read-failure", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => { reads++; if (reads === 2) throw new Error("read unavailable"); return readLearningPlanInputSnapshot(trackId); },
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  assert.deepEqual(await createProposal(f, coordinator), { kind: "generator_error", classification: "retryable" });
});
