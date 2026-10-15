/** Isolated native acceptance entry; no production account/profile/Guest bootstrap. */
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { registerRootComponent } from "expo";
import { fetch as expoFetch } from "expo/fetch";
import * as FileSystem from "expo-file-system";
import { createMMKV } from "react-native-mmkv";
import { createPatternlyApiClient } from "../../src/infrastructure/clients/PatternlyApiClientAdapter";
import { createExpoNodePackageFilePort, createNodePackageStore } from "../../src/content/runtime/nodePackageStorage";
import { installNodePackage, NodePackageError } from "../../src/content/runtime/nodeContentPackage";
import { contentHasher } from "../../src/infrastructure/identity/contentHasher";
import { ContentPackageRuntimeOwner } from "../../src/application/contentPackageRuntimeOwner";
import { PREMIUM_NODE_OFFERS, findPremiumNodeOfferForIdentity, findPremiumNodeOfferForMode } from "../../src/content/application/premiumNodeOffers.release";
const KEY = Symbol.for("patternly.content19.fixture");
const origin = "http://127.0.0.1:29119";
const fixtureRoot = new FileSystem.Directory(FileSystem.Paths.cache, "patternly-content19-residual-v1");
const offer = PREMIUM_NODE_OFFERS[0]!;
function check(value: unknown, stage: string): asserts value { if (!value) throw Error(`content19_${stage}_failed`); }
function storage() {
  fixtureRoot.create({ intermediates: true, idempotent: true });
  const directory = new FileSystem.Directory(fixtureRoot, "mmkv"); directory.create({ intermediates: true, idempotent: true });
  const mmkv = createMMKV({ id: "content19-pointer-a", path: directory.uri.replace(/^file:\/\//u, ""), encryptionKey: "content19-test-only-key" });
  // Only the root is isolated; File/Directory methods below are the installed native Expo implementation.
  const fs = { ...FileSystem, Paths: { ...FileSystem.Paths, document: fixtureRoot } } as unknown as typeof FileSystem;
  const files = createExpoNodePackageFilePort(fs);
  let current = true, sequence = 0;
  const assertCurrent = () => { if (!current) throw new NodePackageError("profile_changed"); };
  const pointers = { getString: (key: string) => mmkv.getString(key), setString: (key: string, value: string) => mmkv.set(key, value), remove: (key: string) => { mmkv.remove(key); }, getAllKeys: () => mmkv.getAllKeys() };
  const makeStore = () => createNodePackageStore({ files, pointers, ids: { createId: () => `native19-${Date.now()}-${++sequence}` }, assertActivationAllowed: assertCurrent });
  return { mmkv, store: makeStore(), makeStore, assertCurrent, isCurrent: () => current, setCurrent: (value: boolean) => { current = value; } };
}
async function probe() {
  const regular = await fetch(`${origin}/probe`), streamed = await expoFetch(`${origin}/probe`);
  return { fixture: "content19", hermes: Boolean((globalThis as any).HermesInternal), globalReader: typeof regular.body?.getReader === "function", expoReader: typeof streamed.body?.getReader === "function", expoFile: typeof FileSystem.File === "function", nativeMMKVFactory: typeof createMMKV === "function", bytes: [...new Uint8Array(await streamed.arrayBuffer())] };
}
async function run() {
  const config = await (await fetch(`${origin}/fixture/config`)).json();
  check(config.manifest.artifactSha256 === offer.artifactSha256, "offer_binding");
  const local = storage();
  const owner = new ContentPackageRuntimeOwner(() => "native19-profile", () => local.store.listActive(), findPremiumNodeOfferForIdentity, findPremiumNodeOfferForMode);
  let behavior = "normal", activations = 0;
  const client = createPatternlyApiClient({ apiOrigin: origin, allowLocalHttpForSimulator: true, getIdToken: async () => config.idToken, getAppCheckToken: async () => config.appCheckToken, timeoutMs: 20000,
    fetchImplementation: async (url, init) => {
      const parsed = new URL(String(url));
      if (parsed.hostname !== "storage.googleapis.com") return fetch(url, init);
      check(init?.headers === undefined && init?.credentials === "omit" && init?.redirect === "error", "object_credentials");
      if (behavior === "offline" || behavior === "interrupted") throw Error("fixture_offline");
      const result = await fetch(`${origin}/fixture/object?mode=${behavior}`, init);
      if (behavior === "profile") local.setCurrent(false);
      return result;
    },
  });
  const install = () => installNodePackage({ trackId: offer.trackId, nodeId: offer.nodeId, appVersion: "0.1.0", expectedContentVersion: offer.contentVersion, expectedArtifactSha256: offer.artifactSha256,
    hash: contentHasher, store: local.store, transport: { getNodePackage: (trackId, nodeId) => client.getContentPackage(trackId, nodeId, local.isCurrent) }, assertActivationAllowed: local.assertCurrent,
    activateRuntime: (record) => { activations++; owner.registerInstalledNodePackage(record, "native19-profile"); },
  });
  await fetch(`${origin}/fixture/access?allowed=true`, { method: "POST" });
  const installed = await install(); check(installed.payload.items.length === 123, "whole_node");
  const resolved = await owner.resolveForPreparation({ trackId: offer.trackId, familyId: offer.familyId, modeId: offer.mode.modeId, nodeId: offer.nodeId });
  const prepared = await resolved.runtime.prepare({ trackId: offer.trackId, modeId: offer.mode.modeId, request: { sessionId: "content19-native-exact-session", requestedLength: 10, nodeId: offer.nodeId }, attempts: [], reviews: [], now: "2026-10-15T12:00:00.000Z" });
  check(prepared.session.itemOrder.length === 10 && prepared.session.artifactSha256 === offer.artifactSha256 && prepared.session.contentVersion === offer.contentVersion, "session_pin");
  local.mmkv.set("content19-session", JSON.stringify(prepared.session));
  const before = JSON.stringify(await local.store.getActive(offer.trackId, offer.nodeId));
  const failures: string[] = [];
  for (const [mode, code] of [["hash", "package_corrupt"], ["offline", "package_unavailable"], ["interrupted", "package_unavailable"], ["profile", "profile_changed"], ["access", "entitlement_required"]]) {
    behavior = mode!; local.setCurrent(true);
    await fetch(`${origin}/fixture/access?allowed=${mode !== "access"}`, { method: "POST" });
    let actual = "success";
    try { await install(); } catch (error) { actual = error instanceof NodePackageError ? error.code : "unexpected"; }
    check(actual === code, `negative_${mode}_${actual}`);
    check(JSON.stringify(await local.store.getActive(offer.trackId, offer.nodeId)) === before && activations === 1, `pointer_${mode}`);
    failures.push(`${mode}:${actual}`);
  }
  local.setCurrent(true);
  await fetch(`${origin}/fixture/access?allowed=true`, { method: "POST" });
  local.mmkv.set("content19-complete", "true");
  return { fixture: "content19", result: "PASS", native: true, packageItems: 123, mentalUnits: new Set(installed.payload.items.map((item) => item.mentalUnitId)).size, sessionItems: 10, artifactSha256: offer.artifactSha256, activations, failures, storage: "real Expo FileSystem + native encrypted MMKV in isolated cache namespace", provider: "modeled GCS and RC; real isolated Auth/Firestore route" };
}
async function restartRead() {
  const local = storage(); check(local.mmkv.getString("content19-complete") === "true", "durable_marker");
  const session = JSON.parse(local.mmkv.getString("content19-session") ?? "null"); check(session, "durable_session");
  const owner = new ContentPackageRuntimeOwner(() => "native19-profile", () => local.store.listActive(), findPremiumNodeOfferForIdentity, findPremiumNodeOfferForMode);
  const exact = await owner.resolveExactArtifact({ trackId: offer.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
  await exact.runtime.validateResume({ session, draft: null });
  check(session.itemOrder.every((item: any) => exact.track.getQuestion(item.item.questionId) && item.item.artifactSha256 === offer.artifactSha256), "durable_exact_items");
  return { fixture: "content19", result: "PASS", restartExact: true, sessionItems: session.itemOrder.length, artifactSha256: exact.track.artifactSha256 };
}
function cleanup() { if (fixtureRoot.exists) fixtureRoot.delete(); return { fixture: "content19", cleanup: !fixtureRoot.exists }; }
function Fixture() {
  const [state, setState] = useState("ready");
  useEffect(() => {
    const wrap = (command: () => any) => async () => { try { const result = await command(); setState(JSON.stringify(result)); return result; } catch (error) { const stage = error instanceof Error ? error.message : "unknown"; setState(stage); throw Error(stage); } };
    (globalThis as any)[KEY] = { probe: wrap(probe), run: wrap(run), restartRead: wrap(restartRead), cleanup: wrap(cleanup) };
  }, []);
  return <View style={{ padding: 30, paddingTop: 90 }}><Text testID="content19-status">{state}</Text></View>;
}
registerRootComponent(Fixture);
