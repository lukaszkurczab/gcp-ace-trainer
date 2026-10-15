/** Scoped native acceptance only; no regular auth/profile/Guest bootstrap. */
import { useEffect, useState } from "react";
import { NativeModules, Text, View } from "react-native";
import { registerRootComponent } from "expo";
import * as FileSystem from "expo-file-system";
import { createMMKV } from "react-native-mmkv";
import { createExpoNodePackageFilePort, createNodePackageStore } from "../../src/content/runtime/nodePackageStorage";
import { installNodePackage } from "../../src/content/runtime/nodeContentPackage";
import { contentHasher } from "../../src/infrastructure/identity/contentHasher";
import { sha256Utf8 } from "../../src/infrastructure/identity/sha256";
import { ContentPackageRuntimeOwner } from "../../src/application/contentPackageRuntimeOwner";
import { PREMIUM_NODE_OFFERS, findPremiumNodeOfferForIdentity, findPremiumNodeOfferForMode } from "../../src/content/application/premiumNodeOffers.release";
import { createPurchasesAdapter, createRevenueCatGateway, readRevenueCatLogCategory } from "../../src/infrastructure/purchases";

type Input = { apiKey: string; accountId: string; packageBytes: number[]; headers: Record<string, string> };
let step = "input";
const root = new FileSystem.Directory(FileSystem.Paths.cache, "patternly-privacy21-v1");
const offer = PREMIUM_NODE_OFFERS[0]!;
const key = sha256Utf8(`${offer.trackId}\u0000${offer.nodeId}\u0000${offer.contentVersion}\u0000${offer.artifactSha256}`);
const ownPaths = [`artifacts/${key}.bin`, `manifests/${key}.json`];
function check(value: unknown, stage: string): asserts value { if (!value) throw Error(stage); }
function storage() {
  root.create({ intermediates: true, idempotent: true });
  const mmkv = createMMKV({ id: "privacy21-pointers", path: root.uri.replace(/^file:\/\//u, ""), encryptionKey: "privacy21-test-only-key" });
  // Real Documents package path. Only pointer/session records use the isolated fixture namespace.
  const files = createExpoNodePackageFilePort();
  const store = createNodePackageStore({ files, pointers: { getString: (k) => mmkv.getString(k), setString: (k, v) => mmkv.set(k, v), remove: (k) => { mmkv.remove(k); }, getAllKeys: () => mmkv.getAllKeys() }, ids: { createId: () => `privacy21-${Date.now()}` } });
  return { mmkv, files, store };
}
function owner(store: ReturnType<typeof storage>["store"]) {
  return new ContentPackageRuntimeOwner(() => "privacy21-profile", () => store.listActive(), findPremiumNodeOfferForIdentity, findPremiumNodeOfferForMode);
}
async function revenueCat(input: Input) {
  check(/^test_[A-Za-z0-9]+$/u.test(input?.apiKey ?? "") && /^[0-9a-f-]{36}$/iu.test(input?.accountId ?? ""), "rc_input_rejected");
  step = "sdk_preflight";
  const native = NativeModules.RNPurchases;
  check(await native.isConfigured() === false, "rc_already_configured");
  const adapter = createPurchasesAdapter(createRevenueCatGateway(), { platform: "ios", config: { apiKey: input.apiKey, accountId: input.accountId }, checkoutEnabled: false });
  step = "sdk_configure";
  check((await adapter.configure()).status === "success", "rc_configure_failed");
  check(await native.getAppUserID() === input.accountId, "rc_identity_mismatch");
  step = "customer_info";
  const result = await adapter.getCustomerInfo();
  check(result.status === "success" && typeof result.hasActiveSubscription === "boolean", "rc_customer_info_failed");
  check(await native.getAppUserID() === input.accountId, "rc_identity_mismatch");
  return { status: result.status, hasActiveSubscription: result.hasActiveSubscription, category: readRevenueCatLogCategory(), identityMatches: true };
}
async function run(input: Input) {
  step = "package_preflight";
  check(!root.exists, "fixture_namespace_exists");
  const files = createExpoNodePackageFilePort();
  for (const path of ownPaths) check(await files.read(path) === null, "package_target_exists");
  const local = storage();
  local.mmkv.set("owned-paths", JSON.stringify(ownPaths));
  const runtime = owner(local.store);
  step = "package_install";
  const installed = await installNodePackage({ trackId: offer.trackId, nodeId: offer.nodeId, appVersion: "0.1.0", expectedContentVersion: offer.contentVersion, expectedArtifactSha256: offer.artifactSha256,
    hash: contentHasher, store: local.store, transport: { getNodePackage: async () => ({ status: 200, bytes: new Uint8Array(input.packageBytes), headers: new Headers(input.headers) }) },
    activateRuntime: (record) => runtime.registerInstalledNodePackage(record, "privacy21-profile"),
  });
  const resolved = await runtime.resolveForPreparation({ trackId: offer.trackId, familyId: offer.familyId, modeId: offer.mode.modeId, nodeId: offer.nodeId });
  step = "session_prepare";
  const prepared = await resolved.runtime.prepare({ trackId: offer.trackId, modeId: offer.mode.modeId, request: { sessionId: "privacy21-isolated-session", requestedLength: 10, nodeId: offer.nodeId }, attempts: [], reviews: [], now: "2026-10-15T12:00:00.000Z" });
  check(installed.payload.items.length === 123 && prepared.session.itemOrder.length === 10, "package_shape_failed");
  local.mmkv.set("session", JSON.stringify(prepared.session));
  const rc = await revenueCat(input);
  local.mmkv.set("complete", true);
  return { fixture: "privacy21", result: "PASS", installedItems: 123, sessionItems: 10, actualDocumentsRoot: true, revenueCat: rc };
}
async function restartRead(input: Input) {
  step = "restart_read";
  check(root.exists, "fixture_namespace_missing");
  const local = storage(); check(local.mmkv.getBoolean("complete") === true, "fixture_incomplete");
  const session = JSON.parse(local.mmkv.getString("session") ?? "null"); check(session, "session_missing");
  const runtime = owner(local.store);
  const exact = await runtime.resolveExactArtifact({ trackId: offer.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
  await exact.runtime.validateResume({ session, draft: null });
  check(session.itemOrder.length === 10 && session.itemOrder.every((item: any) => exact.track.getQuestion(item.item.questionId) && item.item.artifactSha256 === offer.artifactSha256), "exact_resume_failed");
  const rc = await revenueCat(input);
  return { fixture: "privacy21", result: "PASS", restartExact: true, sessionItems: 10, revenueCat: rc };
}
async function cleanup() {
  step = "cleanup";
  check(root.exists, "fixture_namespace_missing");
  const local = storage(); check(local.mmkv.getString("owned-paths") === JSON.stringify(ownPaths), "cleanup_ownership_missing");
  for (const path of ownPaths) await local.files.remove(path);
  for (const path of ownPaths) check(await local.files.read(path) === null, "cleanup_files_remaining");
  root.delete();
  return { fixture: "privacy21", result: "PASS", cleanup: !root.exists, removedOwnFiles: 2 };
}
function Fixture() {
  const [state, setState] = useState("ready");
  useEffect(() => {
    const wrap = (command: (input: Input) => Promise<unknown>) => async (input: Input) => {
      try { const result = await command(input); setState(JSON.stringify(result)); return result; }
      catch { setState(`privacy21_${step}_failed`); throw Error(`privacy21_${step}_failed`); }
    };
    (globalThis as any)[Symbol.for("patternly.privacy21.fixture")] = { run: wrap(run), restartRead: wrap(restartRead), cleanup: wrap(cleanup) };
  }, []);
  return <View style={{ padding: 30, paddingTop: 90 }}><Text testID="privacy21-status">{state}</Text></View>;
}
registerRootComponent(Fixture);
