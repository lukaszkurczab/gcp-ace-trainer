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

/** Production and sandbox do not discover Premium nodes until a producer/admission entry is accepted. */
export const PREMIUM_NODE_OFFERS: readonly PremiumNodeOffer[] = Object.freeze([]);

export function findPremiumNodeOffer(offerId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.offerId === offerId);
}

export function findPremiumNodeOfferForMode(trackId: string, modeId: string): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === trackId && offer.mode.modeId === modeId);
}

export function findPremiumNodeOfferForIdentity(identity: Readonly<{ trackId: string; nodeId: string; contentVersion: string; artifactSha256: string }>): PremiumNodeOffer | undefined {
  return PREMIUM_NODE_OFFERS.find((offer) => offer.trackId === identity.trackId && offer.nodeId === identity.nodeId && offer.contentVersion === identity.contentVersion && offer.artifactSha256 === identity.artifactSha256);
}
