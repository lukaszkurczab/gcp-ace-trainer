import generated from "../generated/premium-node-offer.json";
import { getProductModeConfig } from "../canonical/productModeConfig";
import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";
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

const row = generated.offer;
if (!isRegisteredTrackId(row.trackId) || row.familyId !== "certification" || row.source !== "authenticated_backend"
  || generated.derivation.boundary !== "local_derivation_from_granted_candidate_no_deployment"
  || generated.derivation.artifactSha256 !== row.artifactSha256 || generated.derivation.nodeId !== row.nodeId
  || generated.derivation.trackId !== row.trackId) throw new Error("premium_node_offer_admission_invalid");
const baseMode = getProductModeConfig(row.trackId, row.modeId);
const mode: ProductModeConfig = Object.freeze({ ...baseMode, selection: Object.freeze({ kind: "node", nodeId: row.nodeId }) });

/** Metadata only. Deployment requires the admitted backend object; missing objects fail explicitly. */
export const PREMIUM_NODE_OFFERS: readonly PremiumNodeOffer[] = Object.freeze([Object.freeze({
  offerId: row.offerId, trackId: row.trackId, familyId: "certification", nodeId: row.nodeId,
  contentVersion: row.contentVersion, artifactSha256: row.artifactSha256, mode, source: "authenticated_backend",
})]);

export function getLocalSmokePremiumNodePackageTransport(): null {
  return null;
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
