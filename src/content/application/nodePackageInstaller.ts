import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { createProfileNodePackageStore, getActiveNodePackageScopeKey } from "./nodePackageStoreComposition";
import { installNodePackage } from "../runtime/nodeContentPackage";
import { findPremiumNodeOfferForIdentity, getLocalSmokePremiumNodePackageTransport } from "./premiumNodeOffers";
import { getAvailablePremiumNodeOffer } from "./premiumNodeOfferAccess";

export async function installPremiumNodeOffer(input: Readonly<{ api: Pick<PatternlyApiClient, "getContentPackage">; offerId: string; appVersion: string; assertActivationAllowed?: () => void }>) {
  const offer = getAvailablePremiumNodeOffer(input.offerId);
  if (!offer) throw new Error("premium_node_offer_unavailable");
  const localTransport = offer.source === "local_smoke_fixture" ? getLocalSmokePremiumNodePackageTransport() : null;
  if (offer.source === "local_smoke_fixture" && !localTransport) throw new Error("local_smoke_package_transport_unavailable");
  const scopeKey = getActiveNodePackageScopeKey();
  if (!scopeKey) throw new Error("encrypted_storage_not_initialized");
  const store = createProfileNodePackageStore();
  const active = await store.getActive(offer.trackId, offer.nodeId);
  if (active?.contentVersion === offer.contentVersion && active.artifactSha256 === offer.artifactSha256) {
    const installed = await store.read(active);
    if (installed) {
      if (getActiveNodePackageScopeKey() !== scopeKey) throw new Error("node_package_profile_scope_changed");
      contentPackageRuntimeOwner.registerInstalledNodePackage(installed, scopeKey);
      return installed;
    }
  }
  return installNodePackage({
    trackId: offer.trackId,
    nodeId: offer.nodeId,
    appVersion: input.appVersion,
    expectedContentVersion: offer.contentVersion,
    expectedArtifactSha256: offer.artifactSha256,
    assertActivationAllowed: () => { if (getActiveNodePackageScopeKey() !== scopeKey) throw new Error("node_package_profile_scope_changed"); input.assertActivationAllowed?.(); },
    transport: localTransport ?? { getNodePackage: (trackId, nodeId) => input.api.getContentPackage(trackId, nodeId) },
    hash: contentHasher,
    store,
    activateRuntime: (record) => {
      if (!findPremiumNodeOfferForIdentity(record.identity)) throw new Error("premium_node_offer_identity_mismatch");
      contentPackageRuntimeOwner.registerInstalledNodePackage(record, scopeKey);
    },
  });
}
