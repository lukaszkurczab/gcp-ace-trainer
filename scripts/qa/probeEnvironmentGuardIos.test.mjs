import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { buildEnvironmentProbeExpression } from "./probeEnvironmentGuardIos.mjs";

const fingerprint = "a".repeat(64);
const isolatedAppId = "com.lkurczab.patternly.sec03";
function runtime({ state = "ready", rootInitialized = true, storageInitialized = true, changed = false,
  bundleId = isolatedAppId, configFingerprint = fingerprint, allProtectedClosed = false,
  nativeConfigured = false, nativeInitialized = true, bridgeAvailable = true } = {}) {
  let reads = 0;
  let nativeReads = 0;
  const loaded = [];
  const pointerSources = [{ profileIdSha256: "b".repeat(64), entries: [{ key: "private-pointer", value: "private-pointer-payload" }] }];
  const owners = new Map();
  const add = (name, exports, isInitialized = true) => owners.set(owners.size, { verboseName: name, exports, isInitialized });
  add("src/infrastructure/runtime/environmentIdentity.ts", { readEnvironmentIdentity: () => ({ mode: "smoke", fingerprint }) });
  add("node_modules/expo-constants/build/Constants.js", { default: { expoConfig: { ios: { bundleIdentifier: bundleId }, extra: { patternlyEnvironmentFingerprint: configFingerprint } } } });
  add("src/infrastructure/runtime/environmentGuard.ts", { createNativeEnvironmentMarkerStore: () => ({}), createEnvironmentGuard: () => ({ inspect: async () => state }) });
  add("src/RegularApplicationRoot.tsx", {}, rootInitialized);
  add("src/infrastructure/storage/mmkvClient.ts", { inspectPreparedQ13StorageInventory: async () => {
    reads++;
    return { kind: "observed", complete: true, physicalInventorySha256: changed && reads > 1 ? "changed" : "stable", registryChecksumSha256: "registry", packagePointerSources: pointerSources };
  } }, storageInitialized && !allProtectedClosed);
  add("src/infrastructure/firebase/firebaseAuthClient.ts", {}, !allProtectedClosed);
  add("src/infrastructure/security/recoveryOperationVault.ts", { inspectQ13RecoveryOperationVault: async () => ({ kind: "observed", record: "absent", recordSha256: null }) }, !allProtectedClosed);
  add("src/infrastructure/purchases/index.ts", {}, !allProtectedClosed);
  add("src/content/runtime/nodePackageStorage.ts", { inspectExpoNodePackageInventory: async (sources) => {
    assert.equal(sources, pointerSources);
    return { kind: "observed", physicalFileCount: 0 };
  } }, !allProtectedClosed);
  add("node_modules/react-native/Libraries/BatchedBridge/NativeModules.js", { default: bridgeAvailable ? { RNPurchases: {
    isConfigured: async () => { nativeReads++; return nativeConfigured; },
    getAppUserID: () => { throw Error("identity_accessor_must_not_run"); },
    getCustomerInfo: () => { throw Error("customer_accessor_must_not_run"); },
  } } : {} }, nativeInitialized);
  add("src/infrastructure/firebase/secureAuthPersistence.ts", { inspectQ13SecureAuthPersistence: async () => ({ kind: "observed", userRecord: "absent", userRecordSha256: null }) });
  const require = (id) => { const owner = owners.get(id); loaded.push(owner.verboseName); return owner.exports; };
  require.getModules = () => owners;
  return { context: { HermesInternal: {}, __DEV__: true, __r: require }, reads: () => reads, nativeReads: () => nativeReads, loaded };
}

test("blocked B inventory cannot load protected owners or read their data", async () => {
  for (const options of [{ state: "mismatch" }, { rootInitialized: false }]) {
    const fixture = runtime(options);
    await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("inventory", fingerprint), fixture.context), /inventory_precondition_rejected/);
    assert.equal(fixture.reads(), 0);
    assert.deepEqual(fixture.loaded, ["src/infrastructure/runtime/environmentIdentity.ts", "node_modules/expo-constants/build/Constants.js", "src/infrastructure/runtime/environmentGuard.ts"]);
  }
});

test("A inventory strips raw pointer payloads, checks stability and reports purchase proof unavailable", async () => {
  const fixture = runtime();
  const receipt = await vm.runInNewContext(buildEnvironmentProbeExpression("inventory", fingerprint), fixture.context);
  assert.equal(fixture.reads(), 2);
  assert.equal(receipt.inventory.storage.complete, true);
  assert.equal("packagePointerSources" in receipt.inventory.storage, false);
  assert.equal(JSON.stringify(receipt).includes("private-pointer"), false);
  assert.equal(receipt.inventory.purchases.kind, "unavailable");
  for (const [options, error] of [[{ changed: true }, /inventory_changed/], [{ storageInitialized: false }, /owner_closed/]]) {
    await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("inventory", fingerprint), runtime(options).context), error);
  }
});

test("inventory requires an exact authorized fingerprint", async () => {
  assert.throws(() => buildEnvironmentProbeExpression("inventory"), /arguments_rejected/);
  const fixture = runtime();
  await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("inventory", "c".repeat(64)), fixture.context), /inventory_precondition_rejected/);
  assert.equal(fixture.reads(), 0);
});

const blockedIsolated = { state: "mismatch", rootInitialized: false, allProtectedClosed: true };
test("SDK status requires an explicit isolated target and exact blocked preconditions before any native read", async () => {
  assert.throws(() => buildEnvironmentProbeExpression("sdk-status", fingerprint), /arguments_rejected/);
  assert.throws(() => buildEnvironmentProbeExpression("sdk-status", undefined, isolatedAppId), /arguments_rejected/);
  for (const overrides of [{ state: "ready" }, { rootInitialized: true }, { allProtectedClosed: false }, { bundleId: "com.lkurczab.patternly" }, { configFingerprint: "b".repeat(64) }]) {
    const fixture = runtime({ ...blockedIsolated, ...overrides });
    await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("sdk-status", fingerprint, isolatedAppId), fixture.context), /sdk_status_precondition_rejected/);
    assert.equal(fixture.nativeReads(), 0);
    assert.equal(fixture.reads(), 0);
    assert.deepEqual(fixture.loaded, ["src/infrastructure/runtime/environmentIdentity.ts", "node_modules/expo-constants/build/Constants.js", "src/infrastructure/runtime/environmentGuard.ts"]);
  }
  const wrongFingerprint = runtime(blockedIsolated);
  await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("sdk-status", "c".repeat(64), isolatedAppId), wrongFingerprint.context), /sdk_status_precondition_rejected/);
  assert.equal(wrongFingerprint.nativeReads(), 0);
});

test("SDK status reads native singleton presence once and surfaces both boolean outcomes without protected loads", async () => {
  for (const configured of [false, true]) {
    const fixture = runtime({ ...blockedIsolated, nativeConfigured: configured });
    const receipt = await vm.runInNewContext(buildEnvironmentProbeExpression("sdk-status", fingerprint, isolatedAppId), fixture.context);
    assert.equal(receipt.nativeSDKStatus.revenueCatConfigured, configured);
    assert.equal(fixture.nativeReads(), 1);
    assert.equal(fixture.reads(), 0);
    assert.deepEqual(fixture.loaded, ["src/infrastructure/runtime/environmentIdentity.ts", "node_modules/expo-constants/build/Constants.js", "src/infrastructure/runtime/environmentGuard.ts", "node_modules/react-native/Libraries/BatchedBridge/NativeModules.js"]);
  }
});

test("uninitialized, unavailable or invalid native status remains explicit unavailable", async () => {
  for (const overrides of [{ nativeInitialized: false }, { bridgeAvailable: false }, { nativeConfigured: null }]) {
    const fixture = runtime({ ...blockedIsolated, ...overrides });
    await assert.rejects(vm.runInNewContext(buildEnvironmentProbeExpression("sdk-status", fingerprint, isolatedAppId), fixture.context), /native_sdk_status_unavailable/);
    assert.equal(fixture.reads(), 0);
    if (overrides.nativeInitialized === false) assert.equal(fixture.nativeReads(), 0);
  }
});
