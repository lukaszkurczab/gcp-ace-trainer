import assert from "node:assert/strict";
import test from "node:test";

import {
  createRecoveryOperationVault,
  RECOVERY_OPERATION_VAULT_KEY,
  RecoveryOperationVaultError,
  type RecoveryOperationSecureStore,
} from "./recoveryOperationVault";

const operationId = "4f8508d5-10b0-4db2-886d-1a4a88ab1d56";
const codes = ["AAAA-BBBB-CCCC-DDDD", "EEEE-FFFF-GGGG-HHHH", "JJJJ-KKKK-MMMM-NNNN", "PPPP-QQQQ-RRRR-SSSS", "TTTT-UUUU-VVVV-WWWW", "XXXX-YYYY-ZZZZ-2222", "3333-4444-5555-6666", "7777-8888-9999-AAAA", "BBBB-CCCC-DDDD-EEEE", "FFFF-GGGG-HHHH-JJJJ"];

function memoryStore(initial: string | null = null) {
  let value = initial;
  const store: RecoveryOperationSecureStore = {
    getItemAsync: async (key) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); return value; },
    setItemAsync: async (key, next) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); value = next; },
    deleteItemAsync: async (key) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); value = null; },
  };
  return { store, read: () => value };
}

test("vault round-trips only the versioned recovery record and clears it", async () => {
  const memory = memoryStore();
  const vault = createRecoveryOperationVault(memory.store, { keychainService: "test" });
  await vault.save({ version: 1, kind: "issue", operationId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes, savedIntent: false });
  const serialized = memory.read();
  assert.ok(serialized);
  assert.equal(JSON.parse(serialized).version, 1);
  assert.deepEqual(await vault.load(), { version: 1, kind: "issue", operationId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes, savedIntent: false });
  await vault.clear();
  assert.equal(await vault.load(), null);
});

test("vault persists a strict current-account defer marker in the retained issue record", async () => {
  const memory = memoryStore();
  const vault = createRecoveryOperationVault(memory.store);
  const deferredFor = { firebaseUid: "current-account", authorizationGeneration: 9 };
  const issue = { version: 1 as const, kind: "issue" as const, operationId, firebaseUid: "original-account", authorizationGeneration: 4, status: "result_available" as const, generationId: "generation-4", codes, savedIntent: false, deferredFor };
  await vault.save(issue);
  assert.deepEqual(await vault.load(), issue);

  for (const invalid of [
    { ...issue, deferredFor: { firebaseUid: "current-account", authorizationGeneration: null } },
    { ...issue, deferredFor: { firebaseUid: "current-account", authorizationGeneration: 0 } },
    { ...issue, deferredFor: { firebaseUid: "original-account", authorizationGeneration: 4 } },
    { ...issue, deferredFor: { firebaseUid: "current-account", authorizationGeneration: 9, extra: true } },
  ]) {
    const corrupt = memoryStore(JSON.stringify(invalid));
    await assert.rejects(createRecoveryOperationVault(corrupt.store).load(), RecoveryOperationVaultError);
    assert.notEqual(corrupt.read(), null);
  }
});

test("vault rejects malformed records without leaking parser errors or deleting evidence", async () => {
  const serialized = JSON.stringify({ version: 1, kind: "consume", operationId, code: codes[0], status: "result_available", expectedFirebaseUid: "firebase-user-1", expectedAuthorizationGeneration: 4, unexpected: "extra-field" });
  const memory = memoryStore(serialized);
  const vault = createRecoveryOperationVault(memory.store);
  await assert.rejects(vault.load(), (error: unknown) => error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_corrupt" && !error.message.includes("extra-field"));
  assert.equal(memory.read(), serialized);
  assert.match(memory.read() ?? "", /extra-field/u); // Corrupt evidence is retained for explicit recovery, not silently erased.
});

test("vault rejects duplicate or malformed recovery codes before storage", async () => {
  const memory = memoryStore();
  const vault = createRecoveryOperationVault(memory.store);
  await assert.rejects(vault.save({ version: 1, kind: "issue", operationId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: Array(10).fill(codes[0]), savedIntent: false }), RecoveryOperationVaultError);
  assert.equal(memory.read(), null);
});

test("vault round-trips exactly one same-account replacement backup without recursive lineage", async () => {
  const memory = memoryStore();
  const vault = createRecoveryOperationVault(memory.store);
  const previousIssue = { version: 1 as const, kind: "issue" as const, operationId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "delivery_unconfirmed" as const, generationId: "generation-4", codes, savedIntent: false };
  const replacementId = "785d953b-029e-47d5-89d1-2d4055fb5221";
  await vault.save({ version: 1, kind: "issue", operationId: replacementId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "provider_retryable", generationId: null, codes: null, savedIntent: false, previousIssue });
  const loaded = await vault.load();
  assert.deepEqual(loaded, { version: 1, kind: "issue", operationId: replacementId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "provider_retryable", generationId: null, codes: null, savedIntent: false, previousIssue });
  assert.ok(loaded?.kind === "issue" && loaded.previousIssue);
  if (loaded?.kind === "issue" && loaded.previousIssue) assert.equal(Object.hasOwn(loaded.previousIssue, "previousIssue"), false);
});

test("vault rejects replacement backups with mismatched identity, operation ID, or recursive/extended shape", async () => {
  const replacementId = "785d953b-029e-47d5-89d1-2d4055fb5221";
  const previousIssue = { version: 1, kind: "issue", operationId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "delivery_unconfirmed", generationId: "generation-4", codes, savedIntent: false };
  const replacement = { version: 1, kind: "issue", operationId: replacementId, firebaseUid: "firebase-user-1", authorizationGeneration: 4, status: "provider_retryable", generationId: null, codes: null, savedIntent: false, previousIssue };
  const malformed = [
    { ...replacement, previousIssue: { ...previousIssue, operationId: replacementId } },
    { ...replacement, previousIssue: { ...previousIssue, firebaseUid: "other-user" } },
    { ...replacement, previousIssue: { ...previousIssue, authorizationGeneration: 5 } },
    { ...replacement, previousIssue: { ...previousIssue, status: "result_available" } },
    { ...replacement, previousIssue: { ...previousIssue, extra: true } },
    { ...replacement, previousIssue: { ...previousIssue, previousIssue } },
    { ...replacement, codes },
    { ...replacement, savedIntent: true },
  ];
  for (const value of malformed) {
    const serialized = JSON.stringify(value);
    const vault = createRecoveryOperationVault(memoryStore(serialized).store);
    await assert.rejects(vault.load(), (error: unknown) => error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_corrupt");
  }
});

test("vault reports write and clear failures explicitly", async () => {
  const failing: RecoveryOperationSecureStore = {
    getItemAsync: async () => null,
    setItemAsync: async () => { throw new Error("raw secret-bearing platform error"); },
    deleteItemAsync: async () => { throw new Error("raw secret-bearing platform error"); },
  };
  const vault = createRecoveryOperationVault(failing);
  await assert.rejects(vault.save({ version: 1, kind: "consume", operationId, code: codes[0]!, status: "in_progress", expectedFirebaseUid: null, expectedAuthorizationGeneration: null }), (error: unknown) => error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_write_failed");
  await assert.rejects(vault.clear(), (error: unknown) => error instanceof RecoveryOperationVaultError && error.code === "recovery_operation_vault_clear_failed");
});
