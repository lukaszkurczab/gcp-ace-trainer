import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { ApplicationBootstrapStage, bootstrapApplication } from "./applicationBootstrap";
import { ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { createTrainingAttempt, createTrainingSession } from "../../domain";
import { composeTrainingLifecycleUseCases } from "./trainingLifecycleComposition";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";
import { commitTrainingOutcome } from "../learningMutations/commitTrainingOutcome";
import { captureExactMissingActorAnchor, captureExactMissingActorFenceAtConfirmation } from "../exactMissingActorFence";
import { MemoryKeyValueStorage, getKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../storage/keys";
import { createContentIdentityUnavailableActiveRecord, saveUnavailableActiveRecord } from "../../storage/repositories/contentIdentityUnavailableRepository";
import { CanonicalRepositoryBootstrapStep } from "../../storage/repositories/canonicalRepositories";
import {
  addTrainingAttempt,
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getTrainingAttempts,
  getTrainingSessions,
  getGuestInstallation,
  grantGuestAccess,
  hasGuestAccess,
  provisionGuestInstallation,
  saveTrainingSession,
  saveTrainingSessionDraft,
} from "../../storage/repositories";

const TRACK_ID = "coding-interview-dsa-problem-solving";

let testStorage: MemoryKeyValueStorage;
beforeEach(() => {
  testStorage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(testStorage);
});

test("bootstrap surfaces unavailable active sessions before content preparation or resume", async () => {
  const sessionId = "unavailable-active-session";
  await saveUnavailableActiveRecord(createContentIdentityUnavailableActiveRecord({
    schemaVersion: 1,
    kind: "unavailable_active",
    sessionId,
    session: {
      id: sessionId,
      itemOrder: [{
        occurrenceId: `${sessionId}:0`,
        item: {
          kind: "unavailable_active",
          trackId: TRACK_ID,
          questionId: "question-1",
          contentVersion: "content-v0",
          reason: "unknown_artifact_hash",
          sessionId,
        },
      }],
      status: "active",
      trackId: TRACK_ID,
    },
    attempts: [],
    results: [],
  }));

  const events: string[] = [];
  const result = await bootstrapApplication(
    async () => { events.push("content"); },
    async () => { events.push("resume"); },
    async () => { events.push("recovery"); },
  );

  assert.deepEqual(result, { kind: "content_identity_unavailable", sessionIds: [sessionId] });
  assert.deepEqual(events, []);
});

test("bootstrap stays pending until verified content preparation finishes", async () => {
  const events: string[] = [];
  let releaseContent!: () => void;
  let markContentStarted!: () => void;
  const contentBarrier = new Promise<void>((resolve) => { releaseContent = resolve; });
  const contentStarted = new Promise<void>((resolve) => { markContentStarted = resolve; });
  let settled = false;

  const pending = bootstrapApplication(
    async () => {
      events.push("content-started");
      markContentStarted();
      await contentBarrier;
      events.push("content-ready");
    },
    async () => { events.push("resume"); },
    undefined,
  );
  void pending.then(() => { settled = true; });

  // Wait until canonical repository opening and lifecycle recovery reach content preparation.
  await contentStarted;
  assert.deepEqual(events, ["content-started"]);
  assert.equal(settled, false, "bootstrap cannot publish ready while content verification is pending");

  releaseContent();
  const result = await pending;
  assert.deepEqual(result, { kind: "ready", activeSessionId: null });
  assert.deepEqual(events, ["content-started", "content-ready"]);
});

test("recovery-step observer reports only the current await and clears it after successful bootstrap", async () => {
  const steps: (string | null)[] = [];
  let releaseProfile!: () => void;
  let markProfilePending!: () => void;
  const profileBarrier = new Promise<void>((resolve) => { releaseProfile = resolve; });
  const profilePending = new Promise<void>((resolve) => { markProfilePending = resolve; });
  let settled = false;
  const pending = bootstrapApplication(
    async () => undefined,
    async () => undefined,
    async (observeStep) => {
      observeStep?.("profile_completion");
      markProfilePending();
      await profileBarrier;
      observeStep?.("lifecycle_composition");
      composeTrainingLifecycleUseCases();
      await Promise.resolve();
      observeStep?.(null);
    },
    { recoveryStepObserver: (step) => { steps.push(step); } },
  );
  void pending.then(() => { settled = true; });

  await profilePending;
  assert.deepEqual(steps, ["profile_completion"]);
  assert.equal(settled, false);
  releaseProfile();
  assert.deepEqual(await pending, { kind: "ready", activeSessionId: null });
  assert.deepEqual(steps, [
    "profile_completion",
    "lifecycle_composition",
    null,
    "pending_journal_recovery",
    null,
    "active_session_read",
    null,
    null,
  ]);
});

test("a failed recovery await is reported through the bounded observer and cleared on settlement", async () => {
  const steps: (string | null)[] = [];
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    async (observeStep) => {
      observeStep?.("actor_anchor_capture");
      throw new Error("private account payload");
    },
    {
      recoveryStepObserver: (step) => { steps.push(step); },
      diagnosticObserver: (event) => { diagnostics.push(event); },
    },
  );
  assert.equal(result.kind, "blocking");
  assert.deepEqual(steps, ["actor_anchor_capture", null]);
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.RecoveringLearningState,
    operationalCode: "LOCAL_OPERATION_FAILED",
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /private account payload/u);
});

test("verified Premium sessions remain available in Home when resume admission is denied or unavailable", async () => {
  for (const decision of ["denied", "unavailable"] as const) {
    testStorage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(testStorage);
    const owner = new ContentPackageRuntimeOwner(() => "premium-resume-home-test", async () => []);
    const empty = await bootstrapApplication(
      () => owner.verifyBundledPackages(),
      async () => assert.fail("The fixture has no active session yet."),
    );
    assert.deepEqual(empty, { kind: "ready", activeSessionId: null });
    const track = owner.getPreparedDiscovery("object-oriented-design-interview").track;
    const simulationProfile = track.simulationProfiles?.find((profile) => profile.modeId === "design-interview-simulation");
    assert.ok(simulationProfile);
    const question = track.getQuestion("ood-n01-b01-i018");
    assert.ok(question);
    const sessionId = `premium-resume-home-${decision}`;
    const active = createTrainingSession({
      id: sessionId,
      trackId: track.trackId,
      modeId: "design-interview-simulation",
      configurationSnapshot: {
        kind: "designInterviewSimulation",
        feedbackMode: "atSessionEnd",
        answerChanges: "untilFinalSubmission",
        navigation: "free",
        submission: "manualOrForegroundTimeout",
        timer: "absoluteDeadline",
        timerDurationMs: 2_700_000,
        timerDeadlineAt: "2030-01-01T00:00:00.000Z",
        simulationProfileId: simulationProfile.profileId,
        simulationProfileVersion: simulationProfile.profileVersion,
        simulationCaseId: simulationProfile.familyConfig.caseId,
        simulationCaseVersion: simulationProfile.familyConfig.caseVersion,
      },
      requestedLength: 1,
      actualLength: 1,
      currentItemIndex: 0,
      itemOrder: [{ occurrenceId: `${sessionId}:0`, item: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 } }],
      optionOrderByOccurrence: {},
      activeForegroundMs: 0,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      taxonomyVersion: "canonical-content-v1",
      planFingerprint: "a".repeat(64),
      status: "active",
      startedAt: "2026-10-08T08:00:00.000Z",
    });
    await saveTrainingSession(active);
    await saveTrainingSessionDraft({
      schemaVersion: 1,
      familyId: "design_interview",
      draftVersion: 1,
      revision: 1,
      sessionId,
      trackId: active.trackId,
      responsesByOccurrenceId: {},
      flaggedOccurrenceIds: [],
      updatedAt: active.startedAt,
    }, null);
    const before = testStorage.snapshot();
    let exactResolutions = 0;
    let admissions = 0;
    let timerRestores = 0;
    let lifecycle!: ReturnType<typeof composeTrainingLifecycleUseCases>;
    const result = await bootstrapApplication(
      () => owner.verifyBundledPackages(),
      async (expectedSessionId) => {
        assert.equal(expectedSessionId, active.id);
        try {
          const resumed = await lifecycle.resumeActiveSession();
          if (resumed.configurationSnapshot.timer === "countdownForeground" || resumed.configurationSnapshot.timer === "elapsedForeground") timerRestores += 1;
        } catch (error) {
          if (error instanceof TrainingApplicationFailure
            && (error.code === "premium_entitlement_denied" || error.code === "premium_entitlement_unavailable")) {
            return { kind: "premium_resume_unavailable", reason: error.code } as const;
          }
          throw error;
        }
        return;
      },
      async () => {
        lifecycle = composeTrainingLifecycleUseCases({
          packages: {
            resolveForPreparation: (input) => owner.resolveForPreparation(input),
            resolveExactArtifact: async (input) => { exactResolutions += 1; return owner.resolveExactArtifact(input); },
            resolveForDiscovery: (trackId, familyId) => owner.resolveForDiscovery(trackId, familyId),
          },
          premiumSessionAdmission: { async authorize() { admissions += 1; return decision; } },
        });
      },
    );

    assert.deepEqual(result, { kind: "home_ready_resume_unavailable", activeSessionId: active.id, reason: `premium_entitlement_${decision}` });
    assert.equal(admissions, 1);
    assert.equal(exactResolutions, 0, "Premium admission precedes exact package resolution");
    assert.equal(timerRestores, 0, "a denied resume never restores the foreground timer");
    assert.deepEqual(testStorage.snapshot(), before, "Home readiness does not mutate the active session, draft, journal, or history");
    assert.deepEqual(await getActiveTrainingSession(), active);
    const currentDraft = await getActiveTrainingSessionDraft();
    assert.equal(currentDraft?.sessionId, active.id);

    if (decision === "denied") {
      assert.ok(currentDraft);
      const stale = await bootstrapApplication(
        () => owner.verifyBundledPackages(),
        async () => {
          try { await lifecycle.resumeActiveSession(); }
          catch (error) {
            if (error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied") {
              await saveTrainingSessionDraft({ ...currentDraft, revision: currentDraft.revision + 1, updatedAt: "2026-10-08T08:01:00.000Z" }, currentDraft.revision);
              return { kind: "premium_resume_unavailable", reason: error.code } as const;
            }
            throw error;
          }
          return;
        },
        async () => { lifecycle = composeTrainingLifecycleUseCases({ packages: owner, premiumSessionAdmission: { async authorize() { return "denied"; } } }); },
      );
      assert.deepEqual(stale, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" }, "a changed draft blocks Home readiness even when Premium denial is typed");
      assert.equal(exactResolutions, 0);
    }
  }
});

test("bootstrap emits a bounded diagnostic for a content-stage failure", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => { throw new Error("content payload=session-123"); },
    async () => undefined,
    undefined,
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{ stage: ApplicationBootstrapStage.VerifyingContent, operationalCode: "LOCAL_OPERATION_FAILED", errorKind: "error" }]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /payload|session-123/u);
});

test("bootstrap reports the last canonical repository step for a repository failure", async () => {
  const diagnostics: unknown[] = [];
  const result = await bootstrapApplication(
    async () => undefined,
    async () => undefined,
    undefined,
    {
      diagnosticObserver: (event) => { diagnostics.push(event); },
      repositories: {
        guestInstallationIdentity: {
          async create() { throw new Error("identity payload=session-123"); },
        },
      },
    },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(diagnostics, [{
    stage: ApplicationBootstrapStage.OpeningStorage,
    operationalCode: "LOCAL_OPERATION_FAILED",
    repositoryStepCode: CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
    errorKind: "error",
  }]);
});

test("bootstrap remains blocking when a terminal session pointer has no recovery journal", async () => {
  const terminal = createTrainingSession({
    id: "terminal-session-stale-pointer",
    trackId: TRACK_ID,
    modeId: "practice",
    configurationSnapshot: { kind: "practice", mode: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "terminal-session-stale-pointer:0", item: { trackId: TRACK_ID, questionId: "question-1", contentVersion: "v1", artifactSha256: "a".repeat(64) } }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "v1",
    artifactSha256: "a".repeat(64),
    status: "abandoned",
    startedAt: "2026-10-07T12:00:00.000Z",
    completedAt: "2026-10-07T12:00:01.000Z",
  });
  await saveTrainingSession(terminal);
  testStorage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, JSON.stringify(terminal.id));
  const diagnostics: unknown[] = [];

  const result = await bootstrapApplication(
    async () => assert.fail("A stale terminal pointer must block before content preparation."),
    async () => assert.fail("A stale terminal pointer must not reach session resume."),
    async () => { composeTrainingLifecycleUseCases(); },
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(result, { kind: "blocking", reason: "Application bootstrap failed. [STORAGE_RECORD_INVALID]" });
  assert.deepEqual(diagnostics, [{ stage: ApplicationBootstrapStage.RecoveringLearningState, operationalCode: "STORAGE_RECORD_INVALID", errorKind: "error" }]);
  assert.equal(testStorage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true, "bootstrap must not silently clear a stale pointer without a journal");
  assert.deepEqual((await getTrainingSessions()).value, [terminal]);
});

test("bootstrap reconstructs a still-active session after replaying a pending submit", async () => {
  const artifactSha256 = "b".repeat(64);
  const active = createTrainingSession({
    id: "bootstrap-pending-submit",
    trackId: TRACK_ID,
    modeId: "practice",
    configurationSnapshot: { kind: "practice", mode: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "bootstrap-pending-submit:0", item: { trackId: TRACK_ID, questionId: "question-1", contentVersion: "v1", artifactSha256 } }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "v1",
    artifactSha256,
    status: "active",
    startedAt: "2026-10-07T12:00:00.000Z",
  });
  const attempt = createTrainingAttempt({
    id: "bootstrap-pending-submit-attempt",
    sessionId: active.id,
    trackId: active.trackId,
    modeId: active.modeId,
    occurrenceId: active.itemOrder[0]!.occurrenceId,
    item: active.itemOrder[0]!.item,
    response: { choice: "incorrect-choice" },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder[0]!.item, taxonomyOrSkillRefs: [] },
    answeredAt: active.startedAt,
    committedAt: active.startedAt,
  });
  await saveTrainingSession(active);
  testStorage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(attempt.id) });
  await assert.rejects(commitTrainingOutcome({ attempt, session: active, reviews: [], createdAt: active.startedAt }));
  testStorage.setFailurePlan(null);
  assert.equal((await getTrainingAttempts()).value.length, 0);

  let lifecycle!: ReturnType<typeof composeTrainingLifecycleUseCases>;
  const result = await bootstrapApplication(
    async () => undefined,
    async (sessionId) => { assert.equal(sessionId, active.id); },
    async () => { lifecycle = composeTrainingLifecycleUseCases(); },
  );

  assert.deepEqual(result, { kind: "ready", activeSessionId: active.id });
  assert.deepEqual(await getActiveTrainingSession(), active);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.deepEqual((await getTrainingAttempts()).value[0]?.result, attempt.result, "bootstrap recovery preserves the committed outcome without rescoring");
  assert.equal(lifecycle.getOperationProjection(active.id)?.kind, "feedback", "active-session projection is reconstructed from the replayed attempt");
});

test("a local Free Guest can confirm exact-missing abandonment and recover its real journal on bootstrap", async () => {
  grantGuestAccess();
  const installation = await provisionGuestInstallation({ async create() {
    return {
      installationId: "11111111-1111-4111-8111-111111111111",
      localDatasetId: "22222222-2222-4222-8222-222222222222",
    };
  } });
  const profile = Object.freeze({ id: installation.localDatasetId, kind: "guest" as const, accountId: null });
  const storage = getKeyValueStorage();
  const guestAnchor = await captureExactMissingActorAnchor({
    profile,
    storage,
    readGuestInstallation: getGuestInstallation,
    hasGuestAccess,
  });
  assert.ok(guestAnchor);

  const owner = new ContentPackageRuntimeOwner(() => profile.id, async () => []);
  const currentCatalog = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("The Guest profile has no session before the historical fixture is written."),
  );
  assert.deepEqual(currentCatalog, { kind: "ready", activeSessionId: null });
  const currentTrack = owner.getPreparedDiscovery(TRACK_ID).track;
  const currentQuestion = currentTrack.getQuestion("alg-arrays-duplicate-handling-001");
  assert.ok(currentQuestion);
  const oldRef = {
    trackId: TRACK_ID as typeof currentTrack.trackId,
    questionId: currentQuestion.questionId,
    contentVersion: `${currentTrack.contentVersion}-removed-fixture`,
    artifactSha256: "c".repeat(64),
  };
  const active = createTrainingSession({
    id: "guest-free-exact-missing",
    trackId: oldRef.trackId,
    modeId: "coding-interview-guided-practice",
    configurationSnapshot: { kind: "practice", mode: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "guest-free-exact-missing:0", item: oldRef }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 7_000,
    contentVersion: oldRef.contentVersion,
    artifactSha256: oldRef.artifactSha256,
    status: "active",
    startedAt: "2026-10-07T12:00:00.000Z",
  });
  const attempt = createTrainingAttempt({
    id: "guest-free-exact-missing-attempt",
    sessionId: active.id,
    trackId: active.trackId,
    modeId: active.modeId,
    occurrenceId: active.itemOrder[0]!.occurrenceId,
    item: oldRef,
    response: { choice: "incorrect-choice" },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: oldRef, taxonomyOrSkillRefs: [{ axisId: "skill", nodeId: currentQuestion.nodeId }] },
    answeredAt: active.startedAt,
    committedAt: active.startedAt,
    durationMs: 7_000,
  });
  await saveTrainingSession(active);
  await addTrainingAttempt(attempt);
  const beforeUnavailableStorage = testStorage.snapshot();
  let premiumAdmissionCalls = 0;
  let lifecycle!: ReturnType<typeof composeTrainingLifecycleUseCases>;
  const dependencies = {
    packages: owner,
    premiumSessionAdmission: { async authorize() { premiumAdmissionCalls += 1; return "denied" as const; } },
  };
  const unavailable = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => { await lifecycle.resumeActiveSession(); },
    async () => { lifecycle = composeTrainingLifecycleUseCases(dependencies); },
  );
  assert.deepEqual(unavailable, {
    kind: "content_identity_unavailable",
    sessionIds: [active.id],
    exactMissingIdentity: { trackId: oldRef.trackId, contentVersion: oldRef.contentVersion, artifactSha256: oldRef.artifactSha256 },
  });
  assert.equal(premiumAdmissionCalls, 0, "a Free Guest path does not invoke Premium admission");
  assert.deepEqual(await getActiveTrainingSession(), active);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.equal(await lifecycle.getPendingMutationProjection(active.id), null, "bootstrap and unavailable presentation do not create an abandonment journal");
  assert.deepEqual(testStorage.snapshot(), beforeUnavailableStorage, "no canonical bytes change before explicit confirmation");

  const guestFence = await captureExactMissingActorFenceAtConfirmation({
    anchor: guestAnchor,
    actorKind: "guest",
    currentActorKind: () => "guest",
    currentProfile: () => profile,
    currentStorage: () => getKeyValueStorage(),
    readGuestInstallation: getGuestInstallation,
    hasGuestAccess,
  });
  assert.ok(guestFence, "the local Guest actor fence is captured only at explicit confirmation");
  assert.deepEqual(testStorage.snapshot(), beforeUnavailableStorage, "capturing confirmation reads the existing actor but does not write storage");

  testStorage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION });
  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: active.id, identity: oldRef, isCurrent: guestFence.isCurrent }));
  assert.equal((await getTrainingSessions()).value[0]?.status, "abandoned");
  assert.equal(testStorage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true);
  assert.equal(premiumAdmissionCalls, 0);
  testStorage.setFailurePlan(null);

  const recovered = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("Guest abandonment recovery must clear the active pointer before resume."),
    async () => { lifecycle = composeTrainingLifecycleUseCases(dependencies); },
  );
  assert.deepEqual(recovered, { kind: "ready", activeSessionId: null });
  const abandoned = (await getTrainingSessions()).value[0];
  assert.ok(abandoned);
  assert.equal(abandoned.status, "abandoned");
  assert.deepEqual(abandoned.itemOrder, active.itemOrder);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(premiumAdmissionCalls, 0);
});

test("current OOD v24 verifies, exact OOD v23 resume becomes typed unavailable, and explicit abandonment preserves its history", async () => {
  const owner = new ContentPackageRuntimeOwner(() => "test-profile", async () => []);
  const currentOnly = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("No session should be resolved before the historical fixture is persisted."),
  );
  assert.deepEqual(currentOnly, { kind: "ready", activeSessionId: null });

  const current = owner.getPreparedDiscovery("object-oriented-design-interview").track;
  assert.equal(current.contentVersion, "object-oriented-design-interview-authoring-v2026.10.05-bizq01-24-bizq02-v2");
  assert.equal(current.artifactSha256, "015e21db498465602857d1461aa84ddd26546e665cd9225997e121eca790efe0");
  const questionId = "ood-n01-b01-i018";
  const question = current.getQuestion(questionId);
  assert.ok(question, "The current artifact must contain the exact historical session question.");

  const oldRef = {
    trackId: "object-oriented-design-interview" as const,
    questionId,
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  };
  const session = createTrainingSession({
    id: "q13-ood-v23-resume-repro",
    trackId: oldRef.trackId,
    modeId: "design-interview-simulation",
    configurationSnapshot: {
      kind: "designInterviewSimulation",
      answerChanges: "untilFinalSubmission",
      feedbackMode: "atSessionEnd",
      submission: "manualOrForegroundTimeout",
      timer: "absoluteDeadline",
      timerDeadlineAt: "2030-01-01T00:00:00.000Z",
    },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "q13-ood-v23-resume-repro:0", item: oldRef }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 12_000,
    contentVersion: oldRef.contentVersion,
    artifactSha256: oldRef.artifactSha256,
    status: "active",
    startedAt: "2026-10-07T12:00:00.000Z",
  });
  await saveTrainingSession(session);

  const attempt = createTrainingAttempt({
    id: "q13-ood-v23-resume-repro-answer",
    sessionId: session.id,
    trackId: session.trackId,
    modeId: session.modeId,
    occurrenceId: "q13-ood-v23-resume-repro:0",
    item: oldRef,
    response: { kind: "free_text", text: "Incorrect relay_actor answer preserved for resume reproduction." },
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: oldRef, taxonomyOrSkillRefs: [{ axisId: "skill", nodeId: question.nodeId }] },
    answeredAt: "2026-10-07T12:00:12.000Z",
    committedAt: "2026-10-07T12:00:12.000Z",
    durationMs: 12_000,
  });
  await addTrainingAttempt(attempt);
  const draftInput = {
    schemaVersion: 1 as const,
    familyId: "design_interview",
    draftVersion: 1 as const,
    revision: 1,
    sessionId: session.id,
    trackId: session.trackId,
    responsesByOccurrenceId: { "q13-ood-v23-resume-repro:0": { text: "Incorrect relay_actor answer preserved for resume reproduction." } },
    flaggedOccurrenceIds: [] as const,
    updatedAt: "2026-10-07T12:00:12.000Z",
  };
  await saveTrainingSessionDraft(draftInput, null);

  const before = {
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  };
  assert.deepEqual(before.session, session);
  assert.deepEqual(before.attempts, [attempt]);
  assert.deepEqual(before.draft?.responsesByOccurrenceId["q13-ood-v23-resume-repro:0"], { text: "Incorrect relay_actor answer preserved for resume reproduction." });

  let lifecycle!: ReturnType<typeof composeTrainingLifecycleUseCases>;
  const diagnostics: unknown[] = [];
  const resumed = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async (sessionId) => {
      assert.equal(sessionId, session.id);
      await lifecycle.resumeActiveSession();
    },
    async () => {
      lifecycle = composeTrainingLifecycleUseCases({
        packages: owner,
        premiumSessionAdmission: { authorize: async () => "allowed" },
      });
    },
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );

  assert.deepEqual(diagnostics, [{ stage: ApplicationBootstrapStage.ResumingSession, operationalCode: "LOCAL_OPERATION_FAILED", errorKind: "error" }]);
  assert.deepEqual(resumed, {
    kind: "content_identity_unavailable",
    sessionIds: [session.id],
    exactMissingIdentity: { trackId: oldRef.trackId, contentVersion: oldRef.contentVersion, artifactSha256: oldRef.artifactSha256 },
  });
  assert.deepEqual({
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  }, before);

  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: oldRef, isCurrent: () => false }));
  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: { ...oldRef, artifactSha256: "f".repeat(64) }, isCurrent: () => true }));
  let actorFenceReads = 0;
  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: oldRef, isCurrent: () => ++actorFenceReads < 5 }));
  assert.equal(actorFenceReads, 5, "the actor/profile fence is checked again after exact-package resolution under the journal lane");
  assert.deepEqual({
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  }, before);

  const unreadableLifecycle = composeTrainingLifecycleUseCases({
    packages: {
      resolveForPreparation: (input) => owner.resolveForPreparation(input),
      resolveExactArtifact: async () => { throw new Error("retained package inventory unreadable"); },
      resolveForDiscovery: (trackId, familyId) => owner.resolveForDiscovery(trackId, familyId),
    },
    premiumSessionAdmission: { authorize: async () => "allowed" },
  });
  const unreadable = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => { await unreadableLifecycle.resumeActiveSession(); },
    async () => undefined,
  );
  assert.deepEqual(unreadable, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual({
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  }, before);

  const availableLifecycle = composeTrainingLifecycleUseCases({
    packages: {
      resolveForPreparation: (input) => owner.resolveForPreparation(input),
      resolveExactArtifact: async () => {
        const resolved = await owner.resolveExactArtifact({ trackId: oldRef.trackId, contentVersion: current.contentVersion, artifactSha256: current.artifactSha256 });
        return { ...resolved, track: { ...resolved.track, contentVersion: oldRef.contentVersion, artifactSha256: oldRef.artifactSha256 } as typeof resolved.track };
      },
      resolveForDiscovery: (trackId, familyId) => owner.resolveForDiscovery(trackId, familyId),
    },
    premiumSessionAdmission: { authorize: async () => "allowed" },
  });
  await assert.rejects(availableLifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: oldRef, isCurrent: () => true }), /available again/u);
  assert.deepEqual({
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  }, before);

  testStorage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: oldRef, isCurrent: () => true }));
  testStorage.setFailurePlan(null);
  const beforeJournalState = lifecycle.getOperationProjection(session.id);
  assert.ok(beforeJournalState?.kind === "abandonment_failed_before_journal");
  assert.equal(beforeJournalState.error.allowedAction, "retry_same_command");
  assert.deepEqual({
    session: await getActiveTrainingSession(),
    attempts: (await getTrainingAttempts()).value,
    draft: await getActiveTrainingSessionDraft(),
  }, before);

  testStorage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION });
  await assert.rejects(lifecycle.abandonUnavailableExactActiveSession({ sessionId: session.id, identity: oldRef, isCurrent: () => true }));
  const afterJournalState = lifecycle.getOperationProjection(session.id);
  assert.ok(afterJournalState?.kind === "abandonment_recovery_required");
  assert.equal(afterJournalState.error.durableState, "journal_durable");
  assert.equal(afterJournalState.error.allowedAction, "recover");
  assert.equal(testStorage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true, "the interrupted terminal write leaves the old active pointer in place");
  assert.equal((await getTrainingSessions()).value[0]?.status, "abandoned", "the terminal session write completed before active-pointer removal failed");
  assert.notEqual(await lifecycle.getPendingMutationProjection(session.id), null);

  const failedRecoveryDiagnostics: unknown[] = [];
  const failedRecovery = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("A failed journal replay must stop before session resume."),
    async () => {
      lifecycle = composeTrainingLifecycleUseCases({
        packages: owner,
        premiumSessionAdmission: { authorize: async () => "allowed" },
      });
    },
    { diagnosticObserver: (event) => { failedRecoveryDiagnostics.push(event); } },
  );
  assert.deepEqual(failedRecovery, { kind: "blocking", reason: "Application bootstrap failed. [LOCAL_OPERATION_FAILED]" });
  assert.deepEqual(failedRecoveryDiagnostics, [{ stage: ApplicationBootstrapStage.RecoveringLearningState, operationalCode: "LOCAL_OPERATION_FAILED", errorKind: "error" }]);
  assert.equal(testStorage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), true);
  assert.equal((await getTrainingSessions()).value[0]?.status, "abandoned");
  assert.notEqual(await lifecycle.getPendingMutationProjection(session.id), null, "failed recovery retains its immutable journal for another launch");
  testStorage.setFailurePlan(null);

  const recoveryDiagnostics: unknown[] = [];
  const recoveredBootstrap = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("The journal recovery must clear active ownership before bootstrap attempts resume."),
    async () => {
      lifecycle = composeTrainingLifecycleUseCases({
        packages: owner,
        premiumSessionAdmission: { authorize: async () => "allowed" },
      });
    },
    { diagnosticObserver: (event) => { recoveryDiagnostics.push(event); } },
  );
  assert.deepEqual(recoveryDiagnostics, []);
  assert.deepEqual(recoveredBootstrap, { kind: "ready", activeSessionId: null });
  const abandoned = (await getTrainingSessions()).value[0];
  assert.ok(abandoned);
  assert.equal(abandoned.status, "abandoned");
  assert.deepEqual(abandoned.itemOrder, session.itemOrder);
  assert.deepEqual(abandoned.optionOrderByOccurrence, session.optionOrderByOccurrence);
  assert.equal(abandoned.activeForegroundMs, session.activeForegroundMs);
  assert.equal(await getActiveTrainingSession(), null);
  assert.deepEqual((await getTrainingSessions()).value, [abandoned]);
  assert.deepEqual((await getTrainingAttempts()).value, [attempt]);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  const replayBootstrap = await bootstrapApplication(
    () => owner.verifyBundledPackages(),
    async () => assert.fail("A completed recovery replay must not resurrect or resume the session."),
    async () => {
      lifecycle = composeTrainingLifecycleUseCases({
        packages: owner,
        premiumSessionAdmission: { authorize: async () => "allowed" },
      });
    },
  );
  assert.deepEqual(replayBootstrap, { kind: "ready", activeSessionId: null });
  assert.deepEqual((await getTrainingSessions()).value, [abandoned]);
});
