import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { buildEnvironmentProbeExpression } from "./probeEnvironmentGuardIos.mjs";

const fingerprint = "a".repeat(64);
function runtime({ state = "ready", rootInitialized = true, storageInitialized = true, changed = false } = {}) {
  let reads = 0;
  const loaded = [];
  const pointerSources = [{ profileIdSha256: "b".repeat(64), entries: [{ key: "private-pointer", value: "private-pointer-payload" }] }];
  const owners = new Map();
  const add = (name, exports, isInitialized = true) => owners.set(owners.size, { verboseName: name, exports, isInitialized });
  add("src/infrastructure/runtime/environmentIdentity.ts", { readEnvironmentIdentity: () => ({ mode: "smoke", fingerprint }) });
  add("node_modules/expo-constants/build/Constants.js", { default: { expoConfig: { extra: { patternlyEnvironmentFingerprint: fingerprint } } } });
  add("src/infrastructure/runtime/environmentGuard.ts", { createNativeEnvironmentMarkerStore: () => ({}), createEnvironmentGuard: () => ({ inspect: async () => state }) });
  add("src/RegularApplicationRoot.tsx", {}, rootInitialized);
  add("src/infrastructure/storage/mmkvClient.ts", { inspectPreparedQ13StorageInventory: async () => {
    reads++;
    return { kind: "observed", complete: true, physicalInventorySha256: changed && reads > 1 ? "changed" : "stable", registryChecksumSha256: "registry", packagePointerSources: pointerSources };
  } }, storageInitialized);
  add("src/infrastructure/firebase/firebaseAuthClient.ts", {});
  add("src/infrastructure/security/recoveryOperationVault.ts", { inspectQ13RecoveryOperationVault: async () => ({ kind: "observed", record: "absent", recordSha256: null }) });
  add("src/infrastructure/purchases/index.ts", {});
  add("src/content/runtime/nodePackageStorage.ts", { inspectExpoNodePackageInventory: async (sources) => {
    assert.equal(sources, pointerSources);
    return { kind: "observed", physicalFileCount: 0 };
  } });
  add("src/infrastructure/firebase/secureAuthPersistence.ts", { inspectQ13SecureAuthPersistence: async () => ({ kind: "observed", userRecord: "absent", userRecordSha256: null }) });
  const require = (id) => { const owner = owners.get(id); loaded.push(owner.verboseName); return owner.exports; };
  require.getModules = () => owners;
  return { context: { HermesInternal: {}, __DEV__: true, __r: require }, reads: () => reads, loaded };
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
