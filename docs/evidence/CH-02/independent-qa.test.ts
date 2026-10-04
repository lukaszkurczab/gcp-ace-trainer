import assert from "node:assert/strict";
import test from "node:test";

import { createPatternlyApiClient, PatternlyApiClientError, type PatternlyApiClient } from "../../../src/infrastructure/clients/PatternlyApiClientAdapter";
import { getMeWithExchangedSession } from "../../../src/application/account/accountSessionExchange";
import { prepareAuthenticatedProfileScope } from "../../../src/application/account/profileStartupCoordination";
import { deleteBoundAccount, retryPendingAccountDeletion } from "../../../src/application/account/accountDataService";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../../src/infrastructure/storage/mmkvClient";
import type { FirebaseAuthUserSnapshot } from "../../../src/infrastructure/firebase/firebaseAuthClient";
import { createTrainingSession } from "../../../src/domain";
import { beginAccountDeletion, getAccountDeletionState, updateAccountDeletionState } from "../../../src/storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, getGuestInstallation, provisionGuestInstallation } from "../../../src/storage/repositories/guestInstallationRepository";
import { getTrainingSessions, saveTrainingSession } from "../../../src/storage/repositories/trainingSessionRepository";
import type { StorageProfile } from "../../../src/infrastructure/storage/profileStorageRouter";

const accountId = "55555555-5555-4555-8555-555555555555";
const uid = "independent-qa-firebase-uid";
const operationId = "00000000-0000-4000-8000-000000000202";
const proofId = "proof_abcdefghijklmnopqrstuvwx";
const wrongOperationId = "00000000-0000-4000-8000-000000000299";
const artifactSha256 = "a".repeat(64);

function retainedSession() {
  return createTrainingSession({
    id: "independent-qa-retained-session",
    trackId: "coding-interview-dsa-problem-solving",
    modeId: "guided",
    configurationSnapshot: { kind: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "one", item: { trackId: "coding-interview-dsa-problem-solving", questionId: "two-sum-001", contentVersion: "qa-fixture", artifactSha256 } }],
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "qa-fixture",
    artifactSha256,
    status: "abandoned",
    startedAt: "2026-01-01T00:00:00.000Z",
  });
}

async function resetDeletionFixture(status: "remotePending" | "remoteDeleted") {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
  await saveTrainingSession(retainedSession());
  const pending = beginAccountDeletion(accountId, uid);
  return status === "remotePending"
    ? pending
    : updateAccountDeletionState(pending, { status: "remoteDeleted", proofId, lastFailureCode: null });
}

function client(fetchImplementation: typeof fetch) {
  return createPatternlyApiClient({
    apiOrigin: "https://api.sandbox.patternly.invalid",
    getIdToken: async () => "qa-id-token",
    getAppCheckToken: async () => "qa-app-check-token",
    fetchImplementation,
  });
}

test("malformed /me through the production exchange/profile chain cannot select or activate an account", async () => {
  const operations: string[] = [];
  const user: FirebaseAuthUserSnapshot = { uid, email: null, emailVerified: false, providers: ["password"] };
  const auth = {
    getAuthorizationGeneration: async () => 1,
    getSnapshot: () => user,
    signInWithSessionToken: async () => { throw new Error("unexpected session exchange"); },
  };
  const transport = client(async (input) => {
    operations.push(`fetch:${new URL(String(input)).pathname}`);
    return new Response(JSON.stringify({ user: { id: "not-a-backend-uuid" } }), { status: 200 });
  });

  await assert.rejects(() => prepareAuthenticatedProfileScope({
    canContinue: () => true,
    prepareStorage: async () => { operations.push("prepare-storage"); },
    getMe: () => getMeWithExchangedSession({
      api: transport,
      auth,
      canContinue: () => true,
      onExchangeStarting: () => { operations.push("exchange-started"); },
      user,
    }),
    selectAccount: async (id) => {
      operations.push(`select:${id}`);
      return { profile: { id: "account-profile", kind: "account", accountId: id } as StorageProfile };
    },
    activate: () => { operations.push("activate"); },
  }), (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");

  assert.deepEqual(operations, ["prepare-storage", "fetch:/v1/me"]);
});

test("malformed public deletion proof retains the verified remoteDeleted stage and never starts local cleanup", async () => {
  const seeded = await resetDeletionFixture("remoteDeleted");
  const progressBefore = (await getTrainingSessions()).value;
  const installationBefore = await getGuestInstallation();
  let proofCalls = 0;
  let statusCalls = 0;
  let cleanupPreparationCalls = 0;
  const transport = client(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === `/v1/public/deletion-proofs/${proofId}`) {
      proofCalls += 1;
      return new Response(JSON.stringify({ status: "deleted", operationId, proofId: 17 }), { status: 200 });
    }
    throw new Error(`unexpected request ${url.pathname}`);
  });
  const api = {
    getDeletionProof: transport.getDeletionProof,
    getDeletionOperationStatus: async () => { statusCalls += 1; throw new Error("unexpected status request"); },
    deleteAccount: async () => { throw new Error("unexpected delete request"); },
  } as unknown as PatternlyApiClient;

  assert.deepEqual(await retryPendingAccountDeletion(api, accountId, uid, async () => { cleanupPreparationCalls += 1; return true; }), { ok: false, failure: "remoteDeletionPending" });
  const retained = getAccountDeletionState();
  assert.equal(proofCalls, 1);
  assert.equal(statusCalls, 0);
  assert.equal(cleanupPreparationCalls, 0);
  assert.equal(retained?.status, "remoteDeleted");
  assert.equal(retained?.accountId, seeded.accountId);
  assert.equal(retained?.accountUidHash, seeded.accountUidHash);
  assert.equal(retained?.operationId, seeded.operationId);
  assert.equal(retained?.operationSecret, seeded.operationSecret);
  assert.equal(retained?.proofId, proofId);
  assert.equal(retained?.lastFailureCode, "invalid_response");
  assert.deepEqual(await getGuestInstallation(), installationBefore);
  assert.deepEqual((await getTrainingSessions()).value, progressBefore);
});

test("malformed deletion status retains remotePending and cannot authorize proof or local cleanup", async () => {
  const seeded = await resetDeletionFixture("remotePending");
  const progressBefore = (await getTrainingSessions()).value;
  const installationBefore = await getGuestInstallation();
  let statusCalls = 0;
  let proofCalls = 0;
  let cleanupPreparationCalls = 0;
  const transport = client(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/v1/public/deletion-operations/status") {
      statusCalls += 1;
      return new Response(JSON.stringify({ status: "remote_deleted", operationId: wrongOperationId, proofId }), { status: 200 });
    }
    if (url.pathname === `/v1/public/deletion-proofs/${proofId}`) {
      proofCalls += 1;
      return new Response(JSON.stringify({ status: "deleted", operationId, proofId }), { status: 200 });
    }
    throw new Error(`unexpected request ${url.pathname}`);
  });
  const api = {
    getDeletionOperationStatus: transport.getDeletionOperationStatus,
    getDeletionProof: transport.getDeletionProof,
    deleteAccount: async () => { throw new PatternlyApiClientError("server_error", 500); },
  } as unknown as PatternlyApiClient;

  assert.deepEqual(await deleteBoundAccount(api, accountId, uid, async () => { cleanupPreparationCalls += 1; return true; }), { ok: false, failure: "remoteDeletionPending" });
  const retained = getAccountDeletionState();
  assert.equal(statusCalls, 1);
  assert.equal(proofCalls, 0);
  assert.equal(cleanupPreparationCalls, 0);
  assert.equal(retained?.status, "remotePending");
  assert.equal(retained?.accountId, seeded.accountId);
  assert.equal(retained?.accountUidHash, seeded.accountUidHash);
  assert.equal(retained?.operationId, seeded.operationId);
  assert.equal(retained?.operationSecret, seeded.operationSecret);
  assert.equal(retained?.proofId, null);
  assert.deepEqual(await getGuestInstallation(), installationBefore);
  assert.deepEqual((await getTrainingSessions()).value, progressBefore);
});
