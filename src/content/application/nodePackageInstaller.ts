import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { createProfileNodePackageStore, getActiveNodePackageScopeKey } from "./nodePackageStoreComposition";
import { installNodePackage } from "../runtime/nodeContentPackage";

/** Installs an exact node package through the authenticated Patternly API path. It does not add the node to discovery or offer a mode. */
export function installAuthenticatedNodePackage(input: Readonly<{ api: Pick<PatternlyApiClient, "getContentPackage">; trackId: string; nodeId: string; appVersion: string }>) {
  const scopeKey = getActiveNodePackageScopeKey();
  if (!scopeKey) throw new Error("encrypted_storage_not_initialized");
  return installNodePackage({
    trackId: input.trackId,
    nodeId: input.nodeId,
    appVersion: input.appVersion,
    transport: { getNodePackage: (trackId, nodeId) => input.api.getContentPackage(trackId, nodeId) },
    hash: contentHasher,
    store: createProfileNodePackageStore(),
    activateRuntime: (record) => contentPackageRuntimeOwner.registerInstalledNodePackage(record, scopeKey),
  });
}
