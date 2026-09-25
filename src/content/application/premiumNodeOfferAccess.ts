import { hasPremiumTestingAccess } from "../../application/premiumTesting";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";
import { findPremiumNodeOffer, findPremiumNodeOfferForMode, PREMIUM_NODE_OFFERS, type PremiumNodeOffer } from "./premiumNodeOffers";

export function getAvailablePremiumNodeOffer(offerId: string): PremiumNodeOffer | undefined {
  const offer = findPremiumNodeOffer(offerId);
  return offer && isAvailable(offer) ? offer : undefined;
}

export function getAvailablePremiumNodeOfferForMode(trackId: string, modeId: string): PremiumNodeOffer | undefined {
  const offer = findPremiumNodeOfferForMode(trackId, modeId);
  return offer && isAvailable(offer) ? offer : undefined;
}

export function listAvailablePremiumNodeOffers(trackId?: string): readonly PremiumNodeOffer[] {
  return Object.freeze(PREMIUM_NODE_OFFERS.filter((offer) => (trackId === undefined || offer.trackId === trackId) && isAvailable(offer)));
}

function isAvailable(offer: PremiumNodeOffer): boolean {
  if (offer.source === "authenticated_backend") return true;
  if (offer.source !== "local_smoke_fixture" || !isPatternlySmokeRuntime()) return false;
  try { return hasPremiumTestingAccess(); } catch { return false; }
}
