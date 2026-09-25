import assert from "node:assert/strict";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { buildCertificationPracticeStartCommand } from "./certificationSessionFacade";
import { TrainingApplicationFailure, TrainingLifecycleUseCases, type TrainingLifecyclePorts } from "../trainingLifecycle";
import { PREMIUM_NODE_OFFERS } from "../../content/application/premiumNodeOffers.smoke";
import { getLocalSmokePremiumNodePackageTransport } from "../../content/application/premiumNodeOfferSmokeTransport.smoke";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { createMemoryNodePackageStore, installNodePackage } from "../../content/runtime/nodeContentPackage";
import { getTrackRegistration } from "../../domain";
import { buildCertificationPracticeTarget, buildPremiumNodePracticeSessionConfig } from "../../features/practice/sessionConfig";

test("Certification route preserves domains and sends an exact Premium node through facade to Gate A before mutation", async () => {
  const offer = PREMIUM_NODE_OFFERS[0]!;
  const store = createMemoryNodePackageStore();
  const runtimeOwner = new ContentPackageRuntimeOwner(
    () => "profile-premium-route",
    async () => store.listActive(),
    (identity) => PREMIUM_NODE_OFFERS.find((candidate) => candidate.trackId === identity.trackId && candidate.nodeId === identity.nodeId && candidate.contentVersion === identity.contentVersion && candidate.artifactSha256 === identity.artifactSha256),
    (trackId, modeId) => PREMIUM_NODE_OFFERS.find((candidate) => candidate.trackId === trackId && candidate.mode.modeId === modeId),
  );
  const fixtureTransport = getLocalSmokePremiumNodePackageTransport();
  await installNodePackage({
    trackId: offer.trackId,
    nodeId: offer.nodeId,
    appVersion: "0.1.0",
    expectedContentVersion: offer.contentVersion,
    expectedArtifactSha256: offer.artifactSha256,
    transport: fixtureTransport,
    hash: contentHasher,
    store,
    activateRuntime: (record) => runtimeOwner.registerInstalledNodePackage(record, "profile-premium-route"),
  });

  const ordinaryTarget = buildCertificationPracticeTarget("provider_specific_domain");
  assert.deepEqual(ordinaryTarget, { domain: "provider_specific_domain" });
  assert.equal("nodeId" in ordinaryTarget, false);
  const premiumRoute = buildPremiumNodePracticeSessionConfig(offer);
  assert.equal(premiumRoute.mode, offer.mode.modeId);
  assert.equal(premiumRoute.nodeId, offer.nodeId);
  const exactTarget = buildCertificationPracticeTarget(premiumRoute.topicId, premiumRoute.nodeId);
  assert.deepEqual(exactTarget, { nodeId: offer.nodeId });
  assert.equal("domain" in exactTarget, false);
  const command = buildCertificationPracticeStartCommand({
    modeId: "certification-focus-practice",
    trackId: premiumRoute.trackId,
    requestedLength: premiumRoute.sessionLength,
    ...exactTarget,
    feedbackMode: premiumRoute.feedbackMode,
    source: premiumRoute.source,
  });

  const events: string[] = [];
  const resolverInputs: Array<{ modeId: string; nodeId?: string }> = [];
  let admissionDecision: "allowed" | "denied" = "denied";
  let activeSession: Awaited<ReturnType<TrainingLifecycleUseCases["startSession"]>>["session"] | null = null;
  const ports = {
    clock: { now: () => "2026-09-25T00:00:00.000Z" },
    sessionIds: { create: async () => "premium-route-session" },
    tracks: { getTrackRegistration },
    packages: {
      resolveForPreparation: async (input: { trackId: string; familyId: string; modeId: string; nodeId?: string }) => {
        resolverInputs.push({ modeId: input.modeId, nodeId: input.nodeId });
        events.push("resolve-package");
        return runtimeOwner.resolveForPreparation(input as Parameters<typeof runtimeOwner.resolveForPreparation>[0]);
      },
      resolveExactArtifact: (identity: Parameters<typeof runtimeOwner.resolveExactArtifact>[0]) => runtimeOwner.resolveExactArtifact(identity),
      resolveForDiscovery: (trackId: Parameters<typeof runtimeOwner.resolveForDiscovery>[0], familyId: Parameters<typeof runtimeOwner.resolveForDiscovery>[1]) => runtimeOwner.resolveForDiscovery(trackId, familyId),
    },
    repositories: {
      getActiveSession: async () => activeSession,
      getAttempts: async () => [],
      getReviews: async () => [],
    },
    mutations: { start: async (prepared: Awaited<ReturnType<TrainingLifecycleUseCases["startSession"]>>) => { events.push("mutation"); activeSession = prepared.session; } },
    premiumSessionAdmission: { authorize: async () => { events.push("authorize"); return admissionDecision; } },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await assert.rejects(
    lifecycle.startSession(command),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied",
  );
  assert.deepEqual(resolverInputs, [{ modeId: offer.mode.modeId, nodeId: offer.nodeId }]);
  assert.deepEqual(events, ["resolve-package", "authorize"]);
  assert.equal(activeSession, null);

  admissionDecision = "allowed";
  events.length = 0;
  const started = await lifecycle.startSession(command);
  assert.deepEqual(events, ["resolve-package", "authorize", "mutation"]);
  assert.equal(started.session.contentVersion, offer.contentVersion);
  assert.equal(started.session.artifactSha256, offer.artifactSha256);
  assert.equal(started.session.itemOrder[0]?.item.questionId, "aud04-smoke-fixture-question");
});
