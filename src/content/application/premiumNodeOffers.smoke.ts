import type { ProductModeConfig } from "../canonical";
import type { TrackFamilyId, TrackId } from "../../domain";

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

export function findPremiumNodeOffer(offerId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.offerId === offerId);
}

export function findPremiumNodeOfferForMode(trackId: string, modeId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === trackId && offer.mode.modeId === modeId);
}

export function findPremiumNodeOfferForIdentity(identity: Readonly<{ trackId: string; nodeId: string; contentVersion: string; artifactSha256: string }>): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === identity.trackId && offer.nodeId === identity.nodeId && offer.contentVersion === identity.contentVersion && offer.artifactSha256 === identity.artifactSha256);
}
