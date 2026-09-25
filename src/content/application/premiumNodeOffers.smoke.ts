import type { ProductModeConfig, Question } from "../canonical";
import type { TrackFamilyId, TrackId } from "../../domain";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import type { NodePackageTransport } from "../runtime/nodeContentPackage";
import { gzipSync } from "fflate";

export type PremiumNodeOffer = Readonly<{
  offerId: string;
  trackId: TrackId;
  familyId: TrackFamilyId;
  nodeId: string;
  contentVersion: string;
  artifactSha256: string;
  mode: ProductModeConfig;
  source: "authenticated_backend" | "local_smoke_fixture";
}>;

const smokeFixtureMode: ProductModeConfig = Object.freeze({
  trackId: "aws-certified-solutions-architect-associate",
  modeId: "certification-focus-practice",
  availability: "immediate",
  requestedLengths: Object.freeze([1]),
  minimumActualLength: 1,
  defaultRequestedLength: 1,
  feedbackTiming: Object.freeze({ kind: "fixed", value: "after_each_durable_submit" }),
  timer: Object.freeze({ kind: "elapsed_foreground" }),
  reinsertPolicy: "disabled",
  selection: Object.freeze({ kind: "node", nodeId: "aud04_local_smoke_fixture" }),
});

/** Explicitly local acceptance fixture. It is selected by Metro only for PATTERNLY_RUNTIME_MODE=smoke. */
export const PREMIUM_NODE_OFFERS: readonly PremiumNodeOffer[] = Object.freeze([Object.freeze({
  offerId: "aud-04-local-smoke-package-fixture",
  trackId: "aws-certified-solutions-architect-associate" as TrackId,
  familyId: "certification" as TrackFamilyId,
  nodeId: "aud04_local_smoke_fixture",
  contentVersion: "aud04-local-fixture-v1",
  artifactSha256: "cab88ae60938984308e535b5265bcd487a42f375a860df1bbd6b99012ca4c27b",
  mode: smokeFixtureMode,
  source: "local_smoke_fixture",
})]);

const localOffer = PREMIUM_NODE_OFFERS[0]!;
const fixtureQuestion = Object.freeze({
  questionId: "aud04-smoke-fixture-question",
  trackId: localOffer.trackId,
  nodeId: localOffer.nodeId,
  mentalUnitId: "aud04-smoke-fixture-unit",
  prompt: "Which statement is true about this local package test?",
  interaction: Object.freeze({ type: "choice_single", scoringMethod: "exact_selected_set", options: Object.freeze([{ optionId: "local_only", text: "It is a local test fixture." }, { optionId: "published", text: "It is published Premium content." }]) }),
  answer: Object.freeze({ type: "choice_single", optionId: "local_only" }),
  feedback: Object.freeze({ type: "choice_single", reason: "The package exists only to exercise local installation and exact runtime resolution.", details: Object.freeze({ boundary: "smoke_only" }) }),
  difficulty: null,
}) as Question;

export function getLocalSmokePremiumNodePackageTransport(): NodePackageTransport {
  return Object.freeze({
    async getNodePackage(trackId, nodeId) {
      if (trackId !== localOffer.trackId || nodeId !== localOffer.nodeId) throw new Error("local_smoke_package_not_found");
      const artifactBytes = new TextEncoder().encode(JSON.stringify({
        schemaVersion: "patternly-content-node-payload-v1",
        trackId: localOffer.trackId,
        nodeId: localOffer.nodeId,
        contentVersion: localOffer.contentVersion,
        contentReleaseId: "aud04-local-smoke-fixture",
        items: [fixtureQuestion],
      }));
      const packageBytes = gzipSync(artifactBytes);
      const [artifactSha256, packageSha256] = await Promise.all([contentHasher.sha256Bytes(artifactBytes), contentHasher.sha256Bytes(packageBytes)]);
      if (artifactSha256 !== localOffer.artifactSha256) throw new Error("local_smoke_package_fixture_hash_mismatch");
      return Object.freeze({
        status: 200,
        headers: new Headers({
          "content-type": "application/gzip",
          "content-length": String(packageBytes.length),
          "x-content-package-sha256": packageSha256,
          "x-content-artifact-sha256": artifactSha256,
          "x-content-version": localOffer.contentVersion,
          "x-content-release-id": "aud04-local-smoke-fixture",
          "x-content-minimum-app-version": "0.1.0",
          "x-content-artifact-size-bytes": String(artifactBytes.length),
        }),
        bytes: packageBytes,
      });
    },
  });
}

export function findPremiumNodeOffer(offerId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.offerId === offerId);
}

export function findPremiumNodeOfferForMode(trackId: string, modeId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === trackId && offer.mode.modeId === modeId);
}

export function findPremiumNodeOfferForIdentity(identity: Readonly<{ trackId: string; nodeId: string; contentVersion: string; artifactSha256: string }>): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === identity.trackId && offer.nodeId === identity.nodeId && offer.contentVersion === identity.contentVersion && offer.artifactSha256 === identity.artifactSha256);
}
