import assert from "node:assert/strict";
import test from "node:test";
import { ContentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { PREMIUM_NODE_OFFERS as smokeOffers } from "../content/application/premiumNodeOffers.smoke";
import { PREMIUM_NODE_OFFERS as releaseOffers } from "../content/application/premiumNodeOffers.disabled";
import { getLocalSmokePremiumNodePackageTransport } from "../content/application/premiumNodeOffers.smoke";
import { contentHasher } from "../infrastructure/identity/contentHasher";
import { createMemoryNodePackageStore, installNodePackage } from "../content/runtime/nodeContentPackage";

test("release offer map is empty and the local smoke offer is explicit and isolated", () => {
  assert.deepEqual(releaseOffers, []);
  assert.equal(smokeOffers.length, 1);
  assert.equal(smokeOffers[0]?.offerId, "aud-04-local-smoke-package-fixture");
  assert.equal(smokeOffers[0]?.source, "local_smoke_fixture");
});

test("exact installed offer composes app-owned mode in the shared runtime without entering Free discovery", async () => {
  const offer = smokeOffers[0]!;
  const store = createMemoryNodePackageStore();
  const owner = new ContentPackageRuntimeOwner(
    () => "profile-a",
    async () => store.listActive(),
    (identity) => smokeOffers.find((candidate) => candidate.trackId === identity.trackId && candidate.nodeId === identity.nodeId && candidate.contentVersion === identity.contentVersion && candidate.artifactSha256 === identity.artifactSha256),
    (trackId, modeId) => smokeOffers.find((candidate) => candidate.trackId === trackId && candidate.mode.modeId === modeId),
  );
  const free = await owner.resolveForDiscovery(offer.trackId, offer.familyId);
  const freeMode = free.track.modes.find((mode) => mode.modeId === offer.mode.modeId)!;
  const fixtureTransport = getLocalSmokePremiumNodePackageTransport();
  const installed = await installNodePackage({
    trackId: offer.trackId,
    nodeId: offer.nodeId,
    appVersion: "0.1.0",
    expectedContentVersion: offer.contentVersion,
    expectedArtifactSha256: offer.artifactSha256,
    transport: fixtureTransport,
    hash: contentHasher,
    store,
    activateRuntime: (record) => owner.registerInstalledNodePackage(record, "profile-a"),
  });
  assert.equal(await store.getActive(offer.trackId, offer.nodeId) && installed.identity.nodeId, offer.nodeId);

  const prepared = await owner.resolveForPreparation({ trackId: offer.trackId, familyId: offer.familyId, modeId: offer.mode.modeId, nodeId: offer.nodeId });
  assert.equal(prepared.track.contentVersion, offer.contentVersion);
  assert.equal(prepared.track.artifactSha256, offer.artifactSha256);
  assert.equal(prepared.track.getMode(offer.mode.modeId), offer.mode);
  assert.deepEqual(prepared.track.getPool(offer.mode.modeId).map((question) => question.questionId), installed.payload.items.map((question) => question.questionId));
  await assert.rejects(owner.resolveForPreparation({ trackId: offer.trackId, familyId: offer.familyId, modeId: offer.mode.modeId, nodeId: "different_unpublished_node" }), /Product node .* is unavailable/);

  const unchangedFree = owner.getPreparedDiscovery(offer.trackId);
  assert.equal(unchangedFree.track.contentVersion, free.track.contentVersion);
  assert.equal(unchangedFree.track.getMode(offer.mode.modeId), freeMode);
  assert.equal(unchangedFree.track.questions.some((question) => question.nodeId === offer.nodeId), false);
  const exact = await owner.resolveExactArtifact({ trackId: offer.trackId, contentVersion: offer.contentVersion, artifactSha256: offer.artifactSha256 });
  assert.equal(exact.track, prepared.track);
});
