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

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const descriptor = TRACK_DENSITY_DESCRIPTORS.find((candidate) => candidate.trackId === TRACK_ID)!;

async function lifecycleForNodes(nodeIds: readonly string[], decision: "allowed" | "denied" | "unavailable") {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const items = nodeIds.map((nodeId) => {
    const question = track.questions.find((candidate) => candidate.nodeId === nodeId);
    assert.ok(question, `expected question in node ${nodeId}`);
    return Object.freeze({
      trackId: TRACK_ID,
      questionId: question.questionId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
    });
  });
  const session = createTrainingSession({
    id: "session-1",
    trackId: TRACK_ID,
    modeId: "coding-interview-guided-practice",
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
    familyId: getTrackRegistration(TRACK_ID).familyId,
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
    packages: { resolveForPreparation: async () => ({ track: track as CanonicalTrackRuntime, runtime }) },
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
  const identity = { accountId: "p20-free-denial-fixture", entitlement: "premium" as const, productId: "p20-product-fixture" };
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
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal((await getTrainingSessions()).value.length, 0);
  assert.equal((await getTrainingAttempts()).value.length, 0);
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual(storage.snapshot(), before, "the denied start persists no session or journal state");
});
