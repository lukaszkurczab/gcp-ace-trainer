import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createForegroundClockCapability } from "./foregroundClockCapability";
import type { ForegroundClockScope } from "./foregroundClockCapability";
import type * as NativeStorageModule from "./encryptedStorageNative";

// Executes the actual wrapper with synthetic SDK ports. This verifies grant
// ownership and uncertain-revoke fencing, not the native SDK or durability.
function runtime(revokeFails: boolean) {
  const values = new Map<string, string>();
  values.set("router-derived-timer-key", "durable");
  let writes = 0, revokes = 0, binds = 0;
  const instance = {
    id: "synthetic-storage", isEncrypted: true,
    getString: (key: string) => values.get(key),
    set: (key: string, value: string) => { writes++; values.set(key, value); },
    remove: (key: string) => { writes++; values.delete(key); },
    getAllKeys: () => [...values.keys()], clearAll: () => { writes++; values.clear(); },
    encrypt: () => { writes++; }, trim() {},
  };
  const native = {
    bind(handle: typeof instance, key: string, profileId: string, token: string) {
      assert.equal(handle, instance);
      assert.equal(key, "router-derived-timer-key");
      assert.equal(profileId, "profile");
      assert.match(token, /^3:synthetic-nonce$/);
      binds++;
    },
    read: () => "durable", apply: (_token: string, _before: string | undefined, after: string | undefined) => after,
    arm() {}, enter: () => "durable", checkpoint: () => "durable", pause: () => "durable", quiesce: () => "durable", elapsed: () => 0,
    metrics: () => '{"maxOutstandingMs":0,"maxWriteMs":0,"checkpointCount":0}',
    revoke() { revokes++; if (revokeFails) throw new Error("foreground_clock_write_unknown"); },
  };
  const source = readFileSync(new URL("./encryptedStorageNative.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const require = (name: string) => {
    if (name === "./foregroundClockCapability") return { createForegroundClockCapability };
    if (name === "../identity/sha256") return { sha256Utf8: () => "synthetic-digest" };
    if (name === "expo-secure-store") return { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "synthetic", getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} };
    if (name === "expo-crypto") return { randomUUID: () => "synthetic-nonce" };
    if (name === "react-native-mmkv") return { createMMKV: () => instance };
    if (name === "react-native-nitro-modules") return { NitroModules: { createHybridObject: () => native } };
    throw new Error("unexpected synthetic module");
  };
  vm.runInNewContext(compiled, { module, exports: module.exports, require, process: { env: {} } }, { timeout: 2000 });
  const api = module.exports as typeof NativeStorageModule;
  const slot = api.createNativeEncryptedStoragePlatform().open("synthetic-storage");
  const scope: ForegroundClockScope = { physicalKey: "router-derived-timer-key", profileId: "profile", generation: 3, isCurrent: () => true };
  return { api, slot, scope, writes: () => writes, revokes: () => revokes, binds: () => binds };
}
test("native storage grants one owner for the original slot and blocks generic timer writes", () => {
  const state = runtime(false);
  assert.throws(() => state.api.claimNativeForegroundClock({ ...state.slot }, state.scope), /storage_owner_unavailable/);
  assert.throws(() => state.api.claimNativeForegroundClock(state.slot, { ...state.scope, isCurrent: () => false }), /lease_stale/);
  const capability = state.api.claimNativeForegroundClock(state.slot, state.scope);
  assert.equal(state.binds(), 1);
  assert.throws(() => state.api.claimNativeForegroundClock(state.slot, state.scope), /owner_already_claimed/);
  assert.equal(state.slot.getString(state.scope.physicalKey), "durable");
  assert.throws(() => state.slot.setString(state.scope.physicalKey, "stale"), /mutation_requires_owner/);
  assert.throws(() => state.slot.remove(state.scope.physicalKey), /mutation_requires_owner/);
  assert.equal(state.writes(), 0);
  state.slot.setString("other-key", "other-value");
  assert.equal(state.writes(), 1);
  capability.revoke();
  capability.revoke();
  assert.equal(state.revokes(), 1);
  assert.throws(() => capability.enter(), /lease_stale/);
});
test("unknown native revoke retains timer and destructive-operation fences without retrying the effect", () => {
  const state = runtime(true);
  const capability = state.api.claimNativeForegroundClock(state.slot, state.scope);
  assert.throws(() => capability.revoke(), /write_unknown/);
  assert.throws(() => capability.revoke(), /revoke_unknown/);
  assert.equal(state.revokes(), 1);
  assert.throws(() => state.slot.getString(state.scope.physicalKey), /lease_stale/);
  assert.throws(() => state.slot.setString(state.scope.physicalKey, "stale"), /mutation_requires_owner/);
  assert.throws(() => state.slot.remove(state.scope.physicalKey), /mutation_requires_owner/);
  assert.throws(() => state.slot.clearAll(), /requires_revoke/);
  assert.throws(() => state.slot.encrypt("synthetic-key"), /requires_revoke/);
  assert.throws(() => state.api.claimNativeForegroundClock(state.slot, state.scope), /owner_already_claimed/);
  assert.equal(state.writes(), 0);
});
