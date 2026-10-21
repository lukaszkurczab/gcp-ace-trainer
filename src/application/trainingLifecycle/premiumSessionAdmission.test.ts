import assert from "node:assert/strict";
import test from "node:test";
import { createTrainingSession, getTrackRegistration, type TrackId } from "../../domain";
import { TRACK_DENSITY_DESCRIPTORS } from "../../domain/tracks/trackAdmission";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { TrainingApplicationFailure, TrainingLifecycleUseCases, type TrainingFamilyRuntime, type TrainingLifecyclePorts } from "./";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { resolvePremiumSessionAdmission } from "../account/premiumSessionAdmission";
import { hasOfflinePremiumAccess } from "../../storage/repositories/premiumEntitlementCacheRepository";
import { getActiveMutationJournal, getActiveTrainingSession, getTrainingAttempts, getTrainingSessions } from "../../storage/repositories";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import { getReviewQueueItems, getTrainingSessionResult } from "../../storage/repositories";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";


const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const descriptor = TRACK_DENSITY_DESCRIPTORS.find((candidate) => candidate.trackId === TRACK_ID)!;

async function lifecycleForNodes(nodeIds: readonly string[], decision: "allowed" | "denied" | "unavailable", requestedTrackId: TrackId = TRACK_ID, modeId = "coding-interview-guided-practice") {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(requestedTrackId);
  const items = nodeIds.map((nodeId) => {
    const question = track.questions.find((candidate) => candidate.nodeId === nodeId);
    assert.ok(question, `expected question in node ${nodeId}`);
    return Object.freeze({
      trackId: requestedTrackId,
      questionId: question.questionId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
    });
  });
  const session = createTrainingSession({
    id: "session-1",
    trackId: requestedTrackId,
    modeId,
    configurationSnapshot: { kind: "practice" },
    requestedLength: items.length,
    actualLength: items.length,
    currentItemIndex: 0,
    itemOrder: items.map((item, index) => ({ occurrenceId: `occurrence-${index + 1}`, item })),
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    status: "active",
    startedAt: "2026-09-25T00:00:00.000Z",
  });
  const prepared = Object.freeze({ session, firstOccurrence: items[0]!, draft: null });
  const runtime = {
    familyId: getTrackRegistration(requestedTrackId).familyId,
    prepare: async () => prepared,
  } as unknown as TrainingFamilyRuntime;
  let active: typeof session | null = null;
  let starts = 0;
  let authorizations = 0;
  const events: string[] = [];
  const ports = {
    clock: { now: () => "2026-09-25T00:00:00.000Z" },
    sessionIds: { create: async () => "session-1" },
    tracks: { getTrackRegistration },
    packages: {
      resolveForPreparation: async () => ({ track: track as CanonicalTrackRuntime, runtime }),
      resolveForDiscovery: async () => ({ track: track as CanonicalTrackRuntime, runtime }),
    },
    repositories: {
      getActiveSession: async () => active,
      getAttempts: async () => [],
      getReviews: async () => [],
    },
    mutations: { start: async () => { events.push("start"); starts += 1; active = session; } },
    premiumSessionAdmission: { authorize: async () => { events.push("authorize"); authorizations += 1; return decision; } },
  } as unknown as TrainingLifecyclePorts;
  return { lifecycle: new TrainingLifecycleUseCases(ports), events, get starts() { return starts; }, get authorizations() { return authorizations; } };
}

test("Free node starts without consulting Premium admission", async () => {
  const setup = await lifecycleForNodes([descriptor.freeNodeId], "unavailable");
  await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-guided-practice", request: {} });
  assert.equal(setup.authorizations, 0);
  assert.equal(setup.starts, 1);
});

test("Premium plans require admission before durable session start", async () => {
  const premiumNode = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID).questions.find((question) => question.nodeId !== descriptor.freeNodeId)?.nodeId;
  assert.ok(premiumNode);

  for (const decision of ["denied", "unavailable"] as const) {
    const setup = await lifecycleForNodes([premiumNode], decision);
    await assert.rejects(
      setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-guided-practice", request: {} }),
      (error: unknown) => error instanceof TrainingApplicationFailure
        && error.code === (decision === "denied" ? "premium_entitlement_denied" : "premium_entitlement_unavailable"),
    );
    assert.equal(setup.authorizations, 1);
    assert.equal(setup.starts, 0);
  }

  const allowed = await lifecycleForNodes([premiumNode], "allowed");
  await allowed.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-guided-practice", request: {} });
  assert.equal(allowed.authorizations, 1);
  assert.equal(allowed.starts, 1);
});

test("a Free-first mixed plan checks every item before durable start", async () => {
  const premiumNode = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID).questions.find((question) => question.nodeId !== descriptor.freeNodeId)?.nodeId;
  assert.ok(premiumNode);
  const setup = await lifecycleForNodes([descriptor.freeNodeId, premiumNode], "allowed");
  await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-guided-practice", request: {} });
  assert.equal(setup.authorizations, 1);
  assert.equal(setup.starts, 1);
  assert.deepEqual(setup.events, ["authorize", "start"]);
});

test("P20: actual offline Premium policy denial leaves session, attempts, and journal untouched", async () => {
  const storage = installMemoryStorage();
  const before = storage.snapshot();
  const identity = { accountId: "p20-free-denial-fixture", entitlement: "premium" as const, productId: "p20-product-fixture", projectId: "fixture-project", mapVersion: "premium-map-fixture-v1", environment: "SANDBOX" as const };
  let sessionIdentityCalls = 0;
  let refreshCalls = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    sessionIds: { create: async () => { sessionIdentityCalls += 1; return "p20-must-not-be-created"; } },
    premiumSessionAdmission: {
      authorize: () => resolvePremiumSessionAdmission({
        isConfirmedOffline: async () => true,
        hasOfflineAccess: () => hasOfflinePremiumAccess(identity, Date.now()),
        refresh: async () => { refreshCalls += 1; throw new Error("confirmed-offline denial must not refresh"); },
      }),
    },
  });

  await assert.rejects(
    lifecycle.startSession({
      trackId: TRACK_ID,
      modeId: "coding-interview-simulation",
      request: { scope: { simulationProfileId: "algorithms-interview-simulation-v1" } },
    }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied",
  );

  assert.equal(sessionIdentityCalls, 0, "denial occurs before a session identity is allocated");
  assert.equal(refreshCalls, 0, "confirmed-offline denial does not fall through to a network refresh");
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.length, 0);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 0);
  assert.equal(await getActiveMutationJournal(productionLearningDataAdmissionContext), null);
  assert.deepEqual(storage.snapshot(), before, "the denied start persists no session or journal state");
});


const DESIGN_TRACKS = TRACK_DENSITY_DESCRIPTORS.filter((track) => track.internalFamily === "design_interview");
const DESIGN_PRACTICE_MODES = ["design-interview-learn-framework", "design-interview-tradeoff-practice", "design-interview-weak-area-review"] as const;

test("all Design practice modes admit only entirely Free prepared plans; paid and mixed plans stay gated", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const descriptor of DESIGN_TRACKS) {
    const track = catalog.getTrack(descriptor.trackId);
    const paid = track.questions.find((question) => question.nodeId !== descriptor.freeNodeId)!.nodeId;
    for (const modeId of DESIGN_PRACTICE_MODES) {
      for (const decision of ["denied", "unavailable"] as const) {
        const free = await lifecycleForNodes([descriptor.freeNodeId], decision, descriptor.trackId, modeId);
        await free.lifecycle.startSession({ trackId: descriptor.trackId, modeId, request: {} });
        assert.equal(free.authorizations, 0);
        assert.equal(free.starts, 1);
        for (const nodes of [[paid], [descriptor.freeNodeId, paid]]) {
          const denied = await lifecycleForNodes(nodes, decision, descriptor.trackId, modeId);
          await assert.rejects(denied.lifecycle.startSession({ trackId: descriptor.trackId, modeId, request: {} }),
            (error: unknown) => error instanceof TrainingApplicationFailure && error.code === (decision === "denied" ? "premium_entitlement_denied" : "premium_entitlement_unavailable"));
          assert.equal(denied.starts, 0);
          assert.deepEqual(denied.events, ["authorize"]);
        }
      }
    }
  }
});

test("production Design Free practice survives answer, completion, and storage rebind without Premium refresh", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const descriptor of DESIGN_TRACKS) for (const profileKind of ["guest", "account"] as const) {
    const storage = installMemoryStorage();
    const lease = { id: `design-free-${profileKind}`, kind: profileKind, accountId: profileKind === "account" ? "design-free-account" : null };
    setActiveProfileLeaseForTests(lease);
    let now = "2026-10-21T12:00:00.000Z";
    let authorizations = 0;
    let nextId = 0;
    const dependencies = {
      wallClock: { now: () => now },
      sessionIds: { create: async () => `design-free-${descriptor.trackId}-${profileKind}-${++nextId}` },
      premiumSessionAdmission: { authorize: async (): Promise<"denied"> => { authorizations++; throw Error("Free practice must never refresh Premium"); } },
    };
    let lifecycle = composeTrainingLifecycleUseCases(dependencies);
    const track = catalog.getTrack(descriptor.trackId);
    const beforeReview = storage.snapshot();
    await assert.rejects(lifecycle.startSession({ trackId: descriptor.trackId, modeId: "design-interview-weak-area-review", request: { requestedLength: 1 } }),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_mode");
    assert.deepEqual(storage.snapshot(), beforeReview, "empty review must not write or fill from paid content");
    for (const modeId of DESIGN_PRACTICE_MODES) {
      if (modeId === "design-interview-weak-area-review") {
        const due = (await getReviewQueueItems(productionTrackAdmissionContext)).value.filter((review) => review.trackId === descriptor.trackId && review.dueAt);
        assert.ok(due.length > 0, "ordinary committed practice must produce real review evidence");
        now = new Date(Math.max(...due.map((review) => Date.parse(review.dueAt!))) + 1_000).toISOString();
      }
      const prepared = await lifecycle.startSession({ trackId: descriptor.trackId, modeId, request: { requestedLength: modeId === "design-interview-tradeoff-practice" ? 10 : 1 } });
      assert.ok(prepared.session.itemOrder.every(({ item }) => item.trackId === descriptor.trackId && track.getQuestion(item.questionId)?.nodeId === descriptor.freeNodeId));
      for (const [index, occurrence] of prepared.session.itemOrder.entries()) {
        await lifecycle.submitPracticeResponse(track.getQuestion(occurrence.item.questionId)!.answer);
        if (index < prepared.session.itemOrder.length - 1) await lifecycle.advancePracticeSession();
      }
      const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter((attempt) => attempt.sessionId === prepared.session.id);
      assert.equal(attempts.length, prepared.session.actualLength);
      installKeyValueStorageForTests(storage);
      setActiveProfileLeaseForTests(lease);
      lifecycle = composeTrainingLifecycleUseCases(dependencies);
      const resumed = await lifecycle.resumeActiveSession();
      assert.equal(resumed.id, prepared.session.id);
      assert.deepEqual(resumed.itemOrder, prepared.session.itemOrder);
      await lifecycle.completeActivePracticeSession(prepared.session.id);
      const result = await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext);
      assert.equal(result?.sessionId, prepared.session.id);
      assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
      installKeyValueStorageForTests(storage);
      setActiveProfileLeaseForTests(lease);
      lifecycle = composeTrainingLifecycleUseCases(dependencies);
      assert.deepEqual(await getTrainingSessionResult(prepared.session.id, productionTrackAdmissionContext), result);
      assert.equal((await getTrainingSessions(productionTrackAdmissionContext)).value.find((session) => session.id === prepared.session.id)?.status, "completed");
    }
    assert.equal(authorizations, 0, `${descriptor.trackId}:${profileKind}`);
  }
});
