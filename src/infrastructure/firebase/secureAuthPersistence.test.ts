import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

import { AUTH_USER_STORAGE_KEY, clearPersistedFirebaseAuthUser, createSecureAuthPersistence, inspectQ13SecureAuthPersistence, type SecureAuthPersistenceStore } from "./secureAuthPersistence";
import type { SecureStoreOptions } from "expo-secure-store";
import { sha256Utf8 } from "../identity/sha256";
import type * as SecureAuthModule from "./secureAuthPersistence";

for (const platform of ["ios", "android"] as const) {
  test(`default ${platform} auth adapter respects the installed native module's constant availability`, async () => {
    const stored = new Map<string, string>();
    const calls: SecureStoreOptions[] = [];
    const nativeModule: SecureAuthPersistenceStore = {
      ...(platform === "ios" ? { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 731 } : {}),
      getItemAsync: async (key, options) => { calls.push(options); return stored.get(key) ?? null; },
      setItemAsync: async (key, value, options) => { calls.push(options); stored.set(key, value); },
      deleteItemAsync: async (key, options) => { calls.push(options); stored.delete(key); },
    };
    const compiled = ts.transpileModule(readFileSync(new URL("./secureAuthPersistence.ts", import.meta.url), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const module = { exports: {} };
    const require = (name: string) => {
      if (name === "expo-secure-store") return nativeModule;
      if (name === "react-native") return { Platform: { OS: platform } };
      if (name === "../identity/sha256") return { sha256Utf8 };
      throw new Error("unexpected_auth_test_module");
    };
    vm.runInNewContext(compiled, { module, exports: module.exports, require }, { timeout: 2000 });
    const api = module.exports as typeof SecureAuthModule;
    const persistence = new (api.createSecureAuthPersistence())();
    const key = "firebase:authUser:platform-test";
    await persistence._set(key, { uid: "user", emailVerified: true, isAnonymous: false, stsTokenManager: { refreshToken: "synthetic" } });
    assert.equal((await persistence._get<{ uid: string }>(key))?.uid, "user");
    await api.inspectQ13SecureAuthPersistence();
    await api.clearPersistedFirebaseAuthUser();
    await persistence._remove(key);
    for (const options of calls) assert.deepEqual(JSON.parse(JSON.stringify(options)), {
      ...(platform === "ios" ? { keychainAccessible: nativeModule.WHEN_UNLOCKED_THIS_DEVICE_ONLY } : {}),
      requireAuthentication: false,
    });
    if (platform === "ios") {
      delete (nativeModule as { WHEN_UNLOCKED_THIS_DEVICE_ONLY?: number }).WHEN_UNLOCKED_THIS_DEVICE_ONLY;
      assert.throws(() => api.createSecureAuthPersistence(), /secure_store_unavailable/);
    }
  });
}

test("every auth persistence path passes device-only options without changing the existing service", async () => {
  const stored = new Map<string, string>();
  const calls: { operation: string; key: string; options: SecureStoreOptions }[] = [];
  const store: SecureAuthPersistenceStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 731,
    getItemAsync: async (key, options) => { calls.push({ operation: "get", key, options }); return stored.get(key) ?? null; },
    setItemAsync: async (key, value, options) => { calls.push({ operation: "set", key, options }); stored.set(key, value); },
    deleteItemAsync: async (key, options) => { calls.push({ operation: "delete", key, options }); stored.delete(key); },
  };
  const Persistence = createSecureAuthPersistence(store);
  const persistence = new Persistence();
  const userKey = "firebase:authUser:key:patternly";
  const metadataKey = "firebase:persistence:key:patternly";
  const user = { uid: "user", emailVerified: true, isAnonymous: false, stsTokenManager: { refreshToken: "synthetic-refresh" } };
  await persistence._set(userKey, user);
  await persistence._get(userKey);
  await persistence._set(metadataKey, "LOCAL");
  await persistence._get(metadataKey);
  await persistence._remove(metadataKey);
  await persistence._set(metadataKey, null);
  await persistence._remove(userKey);
  await persistence._set(userKey, {});
  // Corrupt user and ancillary records are cleared with the same options too.
  stored.set(AUTH_USER_STORAGE_KEY, "{");
  await persistence._get(userKey);
  await persistence._set(metadataKey, "LOCAL");
  const ancillaryKey = [...stored.keys()][0]!;
  stored.set(ancillaryKey, "{");
  await persistence._get(metadataKey);
  stored.set(ancillaryKey, "{}");
  await persistence._get(metadataKey);

  const adapterCalls = calls.length;
  for (const call of calls) assert.equal(call.options, calls[0]!.options);
  await persistence._set(userKey, user);
  await inspectQ13SecureAuthPersistence(store);
  await clearPersistedFirebaseAuthUser(store);
  assert.equal(stored.has(AUTH_USER_STORAGE_KEY), false);
  assert.ok(calls.length > adapterCalls);
  assert.deepEqual(new Set(calls.map((call) => call.operation)), new Set(["get", "set", "delete"]));
  for (const { options } of calls) {
    assert.deepEqual(options, { keychainAccessible: store.WHEN_UNLOCKED_THIS_DEVICE_ONLY, requireAuthentication: false });
    assert.ok(Object.isFrozen(options));
    assert.equal("keychainService" in options, false);
  }
  await assert.rejects(clearPersistedFirebaseAuthUser({ ...store, deleteItemAsync: async () => undefined, getItemAsync: async () => "retained" }), /firebase_auth_persistence_clear_failed/);
});

test("Q13 secure auth receipt reads only the exact user slot and does not expose its token record", async () => {
  const secret = JSON.stringify({ uid: "private-user", refreshToken: "private-refresh-token" });
  const reads: string[] = [];
  let mutations = 0;
  const store: SecureAuthPersistenceStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
    getItemAsync: async (key) => { reads.push(key); return secret; },
    setItemAsync: async () => { mutations += 1; },
    deleteItemAsync: async () => { mutations += 1; },
  };

  const receipt = await inspectQ13SecureAuthPersistence(store, (uid) => uid === "private-user");

  assert.deepEqual(reads, [AUTH_USER_STORAGE_KEY]);
  assert.equal(receipt.kind, "observed");
  assert.equal(receipt.userRecord, "present");
  assert.equal(receipt.userRecordAffinity, "matches_current_sdk_uid");
  assert.equal(receipt.userRecordSha256?.length, 64);
  assert.equal(receipt.dynamicFirebaseNamespace, "unavailable");
  assert.equal(JSON.stringify(receipt).includes("private-refresh-token"), false);
  assert.equal(JSON.stringify(receipt).includes("private-user"), false);
  assert.equal(mutations, 0);
});
