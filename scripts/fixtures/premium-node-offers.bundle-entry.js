import { PREMIUM_NODE_OFFERS } from "../../src/content/application/premiumNodeOffers";
import { getLocalSmokePremiumNodePackageTransport } from "../../src/content/application/premiumNodeOfferSmokeTransport";

globalThis.__PATTERNLY_PREMIUM_NODE_BUNDLE_PROBE__ = {
  offers: PREMIUM_NODE_OFFERS,
  transport: getLocalSmokePremiumNodePackageTransport(),
};
