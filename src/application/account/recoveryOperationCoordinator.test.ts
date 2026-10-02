import assert from "node:assert/strict";
import test from "node:test";

import {
  createRecoveryOperationCoordinator,
  type RecoveryConsumeResponse,
  type RecoveryIssueResponse,
  type RecoveryOperationApi,
} from "./recoveryOperationCoordinator";
import { createRecoveryOperationVault, RECOVERY_OPERATION_VAULT_KEY, type RecoveryOperationSecureStore } from "../../infrastructure/security/recoveryOperationVault";

const operationId = "4f8508d5-10b0-4db2-886d-1a4a88ab1d56";
const replacementOperationId = "785d953b-029e-47d5-89d1-2d4055fb5221";
const laterOperationId = "a8bc4c04-2828-4de5-a2a3-8374b73845b3";
const recoveryCode = "AAAA-BBBB-CCCC-DDDD";
const issueCodes = ["AAAA-BBBB-CCCC-DDDD", "EEEE-FFFF-GGGG-HHHH", "JJJJ-KKKK-MMMM-NNNN", "PPPP-QQQQ-RRRR-SSSS", "TTTT-UUUU-VVVV-WWWW", "XXXX-YYYY-ZZZZ-2222", "3333-4444-5555-6666", "7777-8888-9999-AAAA", "BBBB-CCCC-DDDD-EEEE", "FFFF-GGGG-HHHH-JJJJ"];

function harness() {
  const events: string[] = [];
  const storedValues: string[] = [];
  let serialized: string | null = null;
  let failWrites = false;
  let afterSave: (() => void) | null = null;
  let identity: { uid: string } | null = null;
  let generation: number | null = null;
  let generatedOperationId = operationId;
  let issueResponder: ((id: string) => Promise<RecoveryIssueResponse>) | null = null;
  let issueStatusResponder: ((id: string) => Promise<RecoveryIssueResponse>) | null = null;
  const calls = { issue: 0, issueStatus: 0, issueAck: 0, consume: 0, consumeStatus: 0, consumeAck: 0, signIn: 0, issueIds: [] as string[], issueStatusIds: [] as string[] };
  const store: RecoveryOperationSecureStore = {
    getItemAsync: async (key) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); return serialized; },
    setItemAsync: async (key, value) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); if (failWrites) throw new Error("sensitive platform failure"); events.push("vault.save"); storedValues.push(value); serialized = value; afterSave?.(); },
    deleteItemAsync: async (key) => { assert.equal(key, RECOVERY_OPERATION_VAULT_KEY); events.push("vault.clear"); serialized = null; },
  };
  const api: RecoveryOperationApi = {
    issueRecoveryCodes: async (id) => { calls.issue += 1; calls.issueIds.push(id); events.push("api.issue"); return issueResponder ? issueResponder(id) : { operationId: id, status: "result_available", generationId: "generation-4", authorizationGeneration: 4, codes: issueCodes }; },
    getRecoveryCodeIssueStatus: async (id) => { calls.issueStatus += 1; calls.issueStatusIds.push(id); events.push("api.issueStatus"); return issueStatusResponder ? issueStatusResponder(id) : { operationId: id, status: "result_available", generationId: "generation-4", authorizationGeneration: 4, codes: issueCodes }; },
    acknowledgeRecoveryCodesSaved: async (id) => { calls.issueAck += 1; events.push("api.issueAck"); return { operationId: id, status: "acknowledged", authorizationGeneration: 4 }; },
    consumeRecoveryCode: async (id, code) => { calls.consume += 1; events.push("api.consume"); assert.equal(id, operationId); assert.equal(code, recoveryCode); return consumeResult(id); },
    getRecoveryCodeConsumeStatus: async (id, code) => { calls.consumeStatus += 1; events.push("api.consumeStatus"); assert.equal(code, recoveryCode); return consumeResult(id); },
    acknowledgeRecoveryCodeConsumption: async (id) => { calls.consumeAck += 1; events.push("api.consumeAck"); return { operationId: id, status: "acknowledged", authorizationGeneration: 8 }; },
  };
  const coordinator = createRecoveryOperationCoordinator({
    api,
    auth: {
      getSnapshot: () => identity,
      getAuthorizationGeneration: async () => generation,
      signInWithRecoveryToken: async (token) => { calls.signIn += 1; events.push("auth.signIn"); assert.equal(token, "secret-custom-token"); identity = { uid: "restored-user" }; generation = 8; return identity; },
    },
    newOperationId: () => generatedOperationId,
    vault: createRecoveryOperationVault(store),
  });
  return {
    coordinator, events, calls, storedValues,
    serialized: () => serialized,
    setIdentity: (uid: string | null, authGeneration: number | null) => { identity = uid ? { uid } : null; generation = authGeneration; },
    setOperationId: (id: string) => { generatedOperationId = id; },
    setFailWrites: (next: boolean) => { failWrites = next; },
    setAfterSave: (callback: (() => void) | null) => { afterSave = callback; },
    setIssueResponder: (responder: (id: string) => Promise<RecoveryIssueResponse>) => { issueResponder = responder; },
    setIssueStatusResponder: (responder: (id: string) => Promise<RecoveryIssueResponse>) => { issueStatusResponder = responder; },
    seed: async (record: unknown) => { serialized = JSON.stringify(record); },
  };
}

function consumeResult(id: string): RecoveryConsumeResponse {
  return { operationId: id, status: "result_available", firebaseUid: "restored-user", authorizationGeneration: 8, customToken: "secret-custom-token" };
}

function unavailableStatus(id: string): RecoveryIssueResponse {
  return { operationId: id, status: "delivery_unconfirmed", authorizationGeneration: 4 };
}

function oldUnavailableIssue(operationIdValue = operationId) {
  return { version: 1, kind: "issue", operationId: operationIdValue, firebaseUid: "issue-user", authorizationGeneration: 4, status: "delivery_unconfirmed", generationId: "old-generation", codes: issueCodes, savedIntent: false };
}

function pendingReplacement(previousIssue = oldUnavailableIssue(), operationIdValue = replacementOperationId, status: "in_progress" | "provider_retryable" = "provider_retryable") {
  return { version: 1, kind: "issue", operationId: operationIdValue, firebaseUid: "issue-user", authorizationGeneration: 4, status, generationId: null, codes: null, savedIntent: false, previousIssue };
}

test("issue persists operation identity before POST and blocks profile preparation until saved ACK", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 });
  assert.deepEqual(state.events.slice(0, 2), ["vault.save", "api.issue"]);
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind !== "issue") return;
  assert.equal(snapshot.blocksProfilePreparation, true);
  assert.equal(snapshot.codes?.length, 10);
  const saved = await state.coordinator.confirmRecoveryCodesSaved();
  assert.equal(saved.kind, "terminal");
  assert.deepEqual(state.events.slice(-3), ["vault.save", "api.issueAck", "vault.clear"]);
});

test("vault persistence failure prevents both issue and consume requests", async () => {
  const issue = harness();
  issue.setIdentity("issue-user", 4);
  issue.setFailWrites(true);
  assert.equal((await issue.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 })).kind, "unavailable");
  assert.equal(issue.calls.issue, 0);

  const consume = harness();
  consume.setFailWrites(true);
  assert.equal((await consume.coordinator.startConsume(recoveryCode)).kind, "unavailable");
  assert.equal(consume.calls.consume, 0);
});

test("restored issue with an authenticated UID but missing generation remains blocked and hides codes", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "pinned-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: true });
  await state.coordinator.load();
  state.setIdentity("pinned-user", null);
  const snapshot = await state.coordinator.reconcilePending({ firebaseUid: "pinned-user", authorizationGeneration: null });
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind !== "issue") return;
  assert.equal(snapshot.needsAccountResolution, true);
  assert.equal(snapshot.codes, null);
  assert.equal(snapshot.blocksProfilePreparation, true);
  assert.equal(state.calls.issueAck, 0);
  assert.equal(state.calls.issueStatus, 0);
});

test("defer requires a valid proven mismatch and retains a hidden issue after restart without remote effects", async () => {
  const state = harness();
  const issue = { version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false } as const;
  await state.seed(issue);
  await state.coordinator.load();
  state.setIdentity("original-user", null);
  const missingGeneration = await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "original-user", authorizationGeneration: null });
  assert.equal(missingGeneration.kind, "issue");
  if (missingGeneration.kind === "issue") {
    assert.equal(missingGeneration.blocksProfilePreparation, true);
    assert.equal(missingGeneration.codes, null);
    assert.equal(missingGeneration.deferredFor, null);
  }
  assert.deepEqual(JSON.parse(state.serialized() ?? "null"), issue);

  state.setIdentity("current-user", 9);
  const deferred = await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "current-user", authorizationGeneration: 9 });
  assert.equal(deferred.kind, "issue");
  if (deferred.kind !== "issue") return;
  assert.equal(deferred.blocksProfilePreparation, false);
  assert.equal(deferred.codes, null);
  assert.deepEqual(deferred.deferredFor, { firebaseUid: "current-user", authorizationGeneration: 9 });
  assert.deepEqual(JSON.parse(state.serialized() ?? "null").codes, issueCodes);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);

  const restarted = harness();
  await restarted.seed(JSON.parse(state.serialized() ?? "null"));
  restarted.setIdentity("current-user", 9);
  const loaded = await restarted.coordinator.load();
  assert.equal(loaded.kind, "issue");
  if (loaded.kind !== "issue") return;
  assert.equal(loaded.blocksProfilePreparation, true, "a cold record stays gated until the SDK identity is revalidated");
  const reconciled = await restarted.coordinator.reconcilePending({ firebaseUid: "current-user", authorizationGeneration: 9 });
  assert.equal(reconciled.kind, "issue");
  if (reconciled.kind !== "issue") return;
  assert.equal(reconciled.blocksProfilePreparation, false);
  assert.equal(reconciled.codes, null);
  assert.equal(restarted.calls.issueStatus, 0);
  assert.equal(restarted.calls.issueAck, 0);
  assert.equal(restarted.events.includes("vault.clear"), false);

  restarted.setIdentity("another-user", 10);
  const changedIdentity = await restarted.coordinator.reconcilePending({ firebaseUid: "another-user", authorizationGeneration: 10 });
  assert.equal(changedIdentity.kind, "issue");
  if (changedIdentity.kind === "issue") assert.equal(changedIdentity.blocksProfilePreparation, true);
  assert.equal(restarted.calls.issueStatus, 0);
  assert.equal(restarted.calls.issueAck, 0);
});

test("durably deferred issue permits signed-out preparation without changing the retained operation", async () => {
  const state = harness();
  const retained = { version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false, deferredFor: { firebaseUid: "current-user", authorizationGeneration: 9 } };
  await state.seed(retained);
  state.setIdentity(null, null);
  const loaded = await state.coordinator.load();
  assert.equal(loaded.blocksProfilePreparation, true);
  for (const result of [await state.coordinator.reconcilePending(null), await state.coordinator.retryRecoveryOperation()]) {
    assert.equal(result.kind, "issue");
    if (result.kind !== "issue") continue;
    assert.equal(result.blocksProfilePreparation, false);
    assert.equal(result.codes, null);
    assert.equal(result.generationId, null);
  }
  assert.deepEqual(JSON.parse(state.serialized() ?? "null"), retained);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);
  assert.equal(state.events.includes("vault.clear"), false);
  state.setIdentity("another-user", 10);
  assert.equal((await state.coordinator.reconcilePending(null)).blocksProfilePreparation, true, "caller-provided null cannot override live SDK authentication");
  assert.equal((await state.coordinator.retryRecoveryOperation()).blocksProfilePreparation, true);
});

test("signed-out preparation remains blocked before durable defer", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false });
  state.setIdentity(null, null);
  assert.equal((await state.coordinator.reconcilePending(null)).blocksProfilePreparation, true);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);
});

test("defer accepts a same-UID generation mismatch only after the live claim proves it", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "same-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false });
  await state.coordinator.load();
  state.setIdentity("same-user", 5);
  const deferred = await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "same-user", authorizationGeneration: 5 });
  assert.equal(deferred.kind, "issue");
  if (deferred.kind !== "issue") return;
  assert.equal(deferred.blocksProfilePreparation, false);
  assert.deepEqual(deferred.deferredFor, { firebaseUid: "same-user", authorizationGeneration: 5 });
  assert.equal(deferred.codes, null);
});

test("old issue codes return only after an explicit resume on the original identity", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false, deferredFor: { firebaseUid: "current-user", authorizationGeneration: 9 } });
  await state.coordinator.load();
  state.setIdentity("original-user", 4);
  const resumed = await state.coordinator.resumePendingRecovery();
  assert.equal(resumed.kind, "issue");
  if (resumed.kind !== "issue") return;
  assert.equal(resumed.deferredFor, null);
  assert.equal(resumed.codes?.length, 10);
  assert.equal(resumed.blocksProfilePreparation, true);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);
  assert.deepEqual(JSON.parse(state.serialized() ?? "null").codes, issueCodes);
});

test("identity change during defer persistence keeps the marker but leaves profile preparation blocked", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false });
  await state.coordinator.load();
  state.setIdentity("current-user", 9);
  state.setAfterSave(() => state.setIdentity("changed-during-save", 10));
  const deferred = await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "current-user", authorizationGeneration: 9 });
  assert.equal(deferred.kind, "issue");
  if (deferred.kind !== "issue") return;
  assert.equal(deferred.blocksProfilePreparation, true);
  assert.equal(deferred.codes, null);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);
  assert.deepEqual(JSON.parse(state.serialized() ?? "null").deferredFor, { firebaseUid: "current-user", authorizationGeneration: 9 });
});

test("deferred issue cannot be overwritten by new issue or consume and write failure retains the old record", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "original-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false });
  await state.coordinator.load();
  state.setIdentity("current-user", 9);
  state.setFailWrites(true);
  const failedDefer = await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "current-user", authorizationGeneration: 9 });
  assert.equal(failedDefer.kind, "issue");
  if (failedDefer.kind === "issue") assert.equal(failedDefer.blocksProfilePreparation, true);
  const original = JSON.parse(state.serialized() ?? "null");
  assert.equal(Object.hasOwn(original, "deferredFor"), false);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);

  state.setFailWrites(false);
  await state.coordinator.deferIssueToIdentity(operationId, { firebaseUid: "current-user", authorizationGeneration: 9 });
  const deferredRaw = state.serialized();
  const newIssue = await state.coordinator.startIssue({ firebaseUid: "current-user", authorizationGeneration: 9 });
  const consume = await state.coordinator.startConsume(recoveryCode);
  assert.equal(newIssue.kind, "issue");
  assert.equal(consume.kind, "issue");
  assert.equal(state.serialized(), deferredRaw);
  assert.equal(state.calls.issue, 0);
  assert.equal(state.calls.consume, 0);
  assert.equal(state.calls.issueStatus, 0);
  assert.equal(state.calls.issueAck, 0);
});

test("synchronous identity suspension redacts an in-flight status result and preserves durable codes", async () => {
  const state = harness();
  state.setIdentity("pinned-user", 4);
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "pinned-user", authorizationGeneration: 4, status: "result_available", generationId: "generation-4", codes: issueCodes, savedIntent: false });
  await state.coordinator.load();
  let enterStatus!: () => void;
  let resolveStatus!: (response: RecoveryIssueResponse) => void;
  const statusEntered = new Promise<void>((resolve) => { enterStatus = resolve; });
  const pendingStatus = new Promise<RecoveryIssueResponse>((resolve) => { resolveStatus = resolve; });
  state.setIssueStatusResponder(async () => { enterStatus(); return pendingStatus; });

  const reconciliation = state.coordinator.reconcilePending({ firebaseUid: "pinned-user", authorizationGeneration: 4 });
  await statusEntered;
  const beforeSuspension = state.serialized();
  const suspended = state.coordinator.suspendPendingIdentity();
  assert.equal(suspended.kind, "issue");
  if (suspended.kind === "issue") {
    assert.equal(suspended.needsAccountResolution, true);
    assert.equal(suspended.codes, null);
  }
  assert.equal(state.serialized(), beforeSuspension);
  state.setIdentity("different-user", 5);
  resolveStatus({ operationId, status: "result_available", generationId: "generation-4", authorizationGeneration: 4, codes: issueCodes });

  const final = await reconciliation;
  assert.equal(final.kind, "issue");
  if (final.kind === "issue") {
    assert.equal(final.needsAccountResolution, true);
    assert.equal(final.codes, null);
  }
  assert.equal(state.calls.issueAck, 0);
  assert.deepEqual(JSON.parse(state.serialized() ?? "null").codes, issueCodes);
});

test("identity swap during initial issue POST persists codes but never exposes or ACKs them", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  let enterIssue!: () => void;
  let resolveIssue!: (response: RecoveryIssueResponse) => void;
  const issueEntered = new Promise<void>((resolve) => { enterIssue = resolve; });
  const pendingIssue = new Promise<RecoveryIssueResponse>((resolve) => { resolveIssue = resolve; });
  state.setIssueResponder(async (id) => { enterIssue(); return pendingIssue.then((response) => ({ ...response, operationId: id })); });

  const issuing = state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 });
  await issueEntered;
  state.setIdentity("different-user", 5);
  state.coordinator.suspendPendingIdentity();
  resolveIssue({ operationId, status: "result_available", generationId: "generation-4", authorizationGeneration: 4, codes: issueCodes });
  const final = await issuing;
  assert.equal(final.kind, "issue");
  if (final.kind === "issue") {
    assert.equal(final.needsAccountResolution, true);
    assert.equal(final.codes, null);
  }
  assert.equal(state.calls.issueAck, 0);
  assert.deepEqual(JSON.parse(state.serialized() ?? "null").codes, issueCodes);
});

test("consume persists code before POST, keeps custom token out of durable and visible state, then ACKs the matching SDK identity", async () => {
  const state = harness();
  const snapshot = await state.coordinator.startConsume(recoveryCode);
  assert.equal(snapshot.kind, "terminal");
  assert.deepEqual(state.events.slice(0, 4), ["vault.save", "api.consume", "vault.save", "auth.signIn"]);
  assert.equal(state.calls.consumeAck, 1);
  assert.ok(state.storedValues.length > 0);
  assert.ok(state.storedValues.every((value) => !value.includes("secret-custom-token")));
  assert.doesNotMatch(JSON.stringify(snapshot), /secret-custom-token/u);
});

test("signed-in UID with a malformed generation is not treated as signed out for pending consume", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "consume", operationId, code: recoveryCode, status: "result_available", expectedFirebaseUid: "restored-user", expectedAuthorizationGeneration: 8 });
  await state.coordinator.load();
  state.setIdentity("restored-user", null);
  const snapshot = await state.coordinator.reconcilePending({ firebaseUid: "restored-user", authorizationGeneration: null });
  assert.equal(snapshot.kind, "consume");
  if (snapshot.kind !== "consume") return;
  assert.equal(snapshot.needsAccountResolution, true);
  assert.equal(snapshot.blocksProfilePreparation, true);
  assert.equal(state.calls.consumeAck, 0);
  assert.equal(state.calls.consumeStatus, 0);
  assert.equal(state.calls.signIn, 0);
});

test("cold matching consume identity ACKs without another SDK sign-in", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "consume", operationId, code: recoveryCode, status: "result_available", expectedFirebaseUid: "restored-user", expectedAuthorizationGeneration: 8 });
  await state.coordinator.load();
  state.setIdentity("restored-user", 8);
  const snapshot = await state.coordinator.reconcilePending({ firebaseUid: "restored-user", authorizationGeneration: 8 });
  assert.equal(snapshot.kind, "terminal");
  assert.equal(state.calls.signIn, 0);
  assert.equal(state.calls.consumeAck, 1);
});

test("signed-out restart first records server result, then explicit resume signs in and ACKs", async () => {
  const state = harness();
  await state.seed({ version: 1, kind: "consume", operationId, code: recoveryCode, status: "in_progress", expectedFirebaseUid: null, expectedAuthorizationGeneration: null });
  await state.coordinator.load();
  const initial = await state.coordinator.reconcilePending(null);
  assert.equal(initial.kind, "consume");
  assert.equal(state.calls.consumeStatus, 1);
  assert.equal(state.calls.signIn, 0);
  assert.equal(state.calls.consumeAck, 0);

  const resumed = await state.coordinator.resumePendingRecovery();
  assert.equal(resumed.kind, "terminal");
  assert.equal(state.calls.consumeStatus, 2);
  assert.equal(state.calls.signIn, 1);
  assert.equal(state.calls.consumeAck, 1);
});

test("an issue provider retry reuses its saved operation ID rather than allocating a new one", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId("785d953b-029e-47d5-89d1-2d4055fb5221");
  await state.seed({ version: 1, kind: "issue", operationId, firebaseUid: "issue-user", authorizationGeneration: 4, status: "provider_retryable", generationId: null, codes: null, savedIntent: false });
  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 });
  assert.equal(snapshot.kind, "issue");
  assert.equal(state.calls.issue, 1);
  assert.equal(state.calls.issueStatus, 0);
});

test("explicit replacement confirms delivery_unconfirmed, saves one backup before POST, and exposes only the durable new result", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(replacementOperationId);
  await state.seed(oldUnavailableIssue());
  state.setIssueStatusResponder(async (id) => unavailableStatus(id));
  state.setIssueResponder(async (id) => {
    const durable = JSON.parse(state.serialized() ?? "null");
    assert.equal(durable.operationId, replacementOperationId);
    assert.deepEqual(durable.previousIssue.codes, issueCodes);
    assert.equal(durable.codes, null);
    return { operationId: id, status: "result_available", generationId: "generation-new", authorizationGeneration: 4, codes: issueCodes.slice().reverse() };
  });

  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.deepEqual(state.events.slice(0, 3), ["api.issueStatus", "vault.save", "api.issue"]);
  assert.deepEqual(state.calls.issueStatusIds, [operationId]);
  assert.deepEqual(state.calls.issueIds, [replacementOperationId]);
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind !== "issue") return;
  assert.equal(snapshot.replacementPending, false);
  assert.deepEqual(snapshot.codes, issueCodes.slice().reverse());
  const durable = JSON.parse(state.serialized() ?? "null");
  assert.equal(Object.hasOwn(durable, "previousIssue"), false);
  assert.deepEqual(durable.codes, issueCodes.slice().reverse());
});

test("replacement vault write failure prevents POST and retains the old operation and codes", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(replacementOperationId);
  await state.seed(oldUnavailableIssue());
  const before = state.serialized();
  state.setIssueStatusResponder(async (id) => unavailableStatus(id));
  state.setFailWrites(true);

  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.equal(snapshot.kind, "issue");
  assert.equal(state.calls.issue, 0);
  assert.equal(state.serialized(), before);
  assert.equal(state.calls.issueStatus, 1);
});

test("lost replacement POST and exact missing-status response preserve both records and the same new ID", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(replacementOperationId);
  await state.seed(oldUnavailableIssue());
  state.setIssueStatusResponder(async (id) => unavailableStatus(id));
  state.setIssueResponder(async () => { throw Object.assign(new Error("offline"), { status: 0, code: "network_unavailable" }); });

  const afterLostPost = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.equal(afterLostPost.kind, "issue");
  assert.equal(state.calls.issue, 1);
  const savedAfterLostPost = JSON.parse(state.serialized() ?? "null");
  assert.equal(savedAfterLostPost.operationId, replacementOperationId);
  assert.deepEqual(savedAfterLostPost.previousIssue.codes, issueCodes);

  state.setIssueStatusResponder(async () => { throw Object.assign(new Error("missing"), { status: 404, serverCode: "recovery_operation_unavailable" }); });
  const missing = await state.coordinator.retryRecoveryOperation();
  assert.equal(missing.kind, "issue");
  if (missing.kind === "issue") {
    assert.equal(missing.replacementPending, true);
    assert.equal(missing.failure, "unavailable");
    assert.equal(missing.codes, null);
  }
  assert.equal(state.calls.issue, 1);
  assert.deepEqual(state.calls.issueIds, [replacementOperationId]);
  const stillSaved = JSON.parse(state.serialized() ?? "null");
  assert.equal(stillSaved.operationId, replacementOperationId);
  assert.deepEqual(stillSaved.previousIssue.codes, issueCodes);
});

test("explicit retry of a persisted replacement GETs first and reuses its saved ID", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(laterOperationId);
  await state.seed(pendingReplacement());
  state.setIssueStatusResponder(async (id) => ({ operationId: id, status: "provider_retryable", authorizationGeneration: 4 }));
  state.setIssueResponder(async (id) => ({ operationId: id, status: "result_available", generationId: "generation-new", authorizationGeneration: 4, codes: issueCodes }));

  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.deepEqual(state.events.slice(0, 3), ["api.issueStatus", "vault.save", "api.issue"]);
  assert.deepEqual(state.calls.issueStatusIds, [replacementOperationId]);
  assert.deepEqual(state.calls.issueIds, [replacementOperationId]);
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind === "issue") assert.equal(snapshot.replacementPending, false);
});

test("generic retry, restart reconciliation, and unconfirmed start are status-only for pending replacements", async () => {
  for (const entry of ["retry", "restart", "start"] as const) {
    const state = harness();
    state.setIdentity("issue-user", 4);
    state.setOperationId(laterOperationId);
    await state.seed(pendingReplacement());
    state.setIssueStatusResponder(async (id) => ({ operationId: id, status: "provider_retryable", authorizationGeneration: 4 }));
    if (entry === "retry") await state.coordinator.retryRecoveryOperation();
    else if (entry === "restart") await state.coordinator.reconcilePending({ firebaseUid: "issue-user", authorizationGeneration: 4 });
    else await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 });
    assert.equal(state.calls.issue, 0, entry);
    assert.deepEqual(state.calls.issueStatusIds, [replacementOperationId], entry);
    assert.equal(JSON.parse(state.serialized() ?? "null").operationId, replacementOperationId, entry);
  }
});

test("replacement refuses a malformed or cross-generation result and keeps the old backup durable", async () => {
  for (const invalid of [
    { operationId: laterOperationId, status: "result_available", generationId: "generation-new", authorizationGeneration: 4, codes: issueCodes },
    { operationId: replacementOperationId, status: "result_available", generationId: "generation-new", authorizationGeneration: 5, codes: issueCodes },
  ]) {
    const state = harness();
    state.setIdentity("issue-user", 4);
    await state.seed(pendingReplacement());
    state.setIssueStatusResponder(async () => ({ operationId: replacementOperationId, status: "provider_retryable", authorizationGeneration: 4 }));
    state.setIssueResponder(async () => invalid as RecoveryIssueResponse);
    const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
    assert.equal(snapshot.kind, "issue");
    if (snapshot.kind === "issue") {
      assert.equal(snapshot.replacementPending, true);
      assert.equal(snapshot.codes, null);
      assert.equal(snapshot.failure, "invalid_response");
    }
    const durable = JSON.parse(state.serialized() ?? "null");
    assert.deepEqual(durable.previousIssue.codes, issueCodes);
  }
});

test("authoritative delivery_unconfirmed ends the current replacement backup without allocating another ID", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(laterOperationId);
  await state.seed(pendingReplacement());
  state.setIssueStatusResponder(async (id) => ({ operationId: id, status: "provider_retryable", authorizationGeneration: 4 }));
  state.setIssueResponder(async (id) => ({ operationId: id, status: "delivery_unconfirmed", authorizationGeneration: 4 }));

  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.equal(state.calls.issue, 1);
  assert.deepEqual(state.calls.issueIds, [replacementOperationId]);
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind === "issue") {
    assert.equal(snapshot.status, "delivery_unconfirmed");
    assert.equal(snapshot.replacementPending, false);
    assert.equal(snapshot.codes, null);
  }
  const durable = JSON.parse(state.serialized() ?? "null");
  assert.equal(Object.hasOwn(durable, "previousIssue"), false);
  assert.equal(durable.operationId, replacementOperationId);
});

test("a separate explicit confirmation after confirmed replacement expiry starts a new backed-up ID", async () => {
  const expiredReplacement = pendingReplacement(oldUnavailableIssue(), replacementOperationId, "in_progress");
  const state = harness();
  state.setIdentity("issue-user", 4);
  state.setOperationId(laterOperationId);
  await state.seed({ ...expiredReplacement, status: "expired_or_invalid" });
  state.setIssueStatusResponder(async (id) => ({ operationId: id, status: "expired_or_invalid", authorizationGeneration: 4 }));
  state.setIssueResponder(async (id) => ({ operationId: id, status: "result_available", generationId: "next-generation", authorizationGeneration: 4, codes: issueCodes.slice().reverse() }));

  const snapshot = await state.coordinator.startIssue({ firebaseUid: "issue-user", authorizationGeneration: 4 }, { replaceUnavailable: true });
  assert.deepEqual(state.calls.issueStatusIds, [replacementOperationId]);
  assert.deepEqual(state.calls.issueIds, [laterOperationId]);
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind === "issue") assert.deepEqual(snapshot.codes, issueCodes.slice().reverse());
  const durable = JSON.parse(state.serialized() ?? "null");
  assert.equal(durable.operationId, laterOperationId);
  assert.equal(Object.hasOwn(durable, "previousIssue"), false);
});

test("replacement status auth and service errors retain the old backup without POST", async () => {
  for (const failure of [
    Object.assign(new Error("unauthorized"), { status: 401 }),
    Object.assign(new Error("unavailable"), { status: 503 }),
  ]) {
    const state = harness();
    state.setIdentity("issue-user", 4);
    await state.seed(pendingReplacement());
    const before = state.serialized();
    state.setIssueStatusResponder(async () => { throw failure; });
    const snapshot = await state.coordinator.retryRecoveryOperation();
    assert.equal(snapshot.kind, "issue");
    assert.equal(state.calls.issue, 0);
    assert.equal(state.serialized(), before);
  }
});

test("confirmed ACK and superseded replacement statuses resolve the backup as terminal", async () => {
  for (const status of ["acknowledged", "superseded"] as const) {
    const state = harness();
    state.setIdentity("issue-user", 4);
    await state.seed(pendingReplacement());
    state.setIssueStatusResponder(async (id) => ({ operationId: id, status, authorizationGeneration: 4 }));
    const snapshot = await state.coordinator.retryRecoveryOperation();
    assert.deepEqual(snapshot, { kind: "terminal", operationId: replacementOperationId, status, blocksProfilePreparation: false });
    assert.equal(state.serialized(), null);
    assert.equal(state.calls.issueAck, 0);
  }
});

test("confirmed replacement expiry stays explicit and retains prior codes until separate confirmation", async () => {
  const state = harness();
  state.setIdentity("issue-user", 4);
  await state.seed(pendingReplacement());
  state.setIssueStatusResponder(async (id) => ({ operationId: id, status: "expired_or_invalid", authorizationGeneration: 4 }));
  const snapshot = await state.coordinator.retryRecoveryOperation();
  assert.equal(snapshot.kind, "issue");
  if (snapshot.kind === "issue") {
    assert.equal(snapshot.status, "expired_or_invalid");
    assert.equal(snapshot.replacementPending, true);
    assert.equal(snapshot.failure, "unavailable");
    assert.equal(snapshot.codes, null);
  }
  const durable = JSON.parse(state.serialized() ?? "null");
  assert.equal(durable.operationId, replacementOperationId);
  assert.deepEqual(durable.previousIssue.codes, issueCodes);
});
