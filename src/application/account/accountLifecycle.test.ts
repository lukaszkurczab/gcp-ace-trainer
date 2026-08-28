import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { PatternlyApiClientError, type PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { deleteBoundAccount, prepareAccountSignOut } from "./accountDataService";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { getAccountSyncState } from "../../storage/repositories/accountDataRepository";
import {
  getAccountDeletionState,
  getAccountSignOutState,
} from "../../storage/repositories/accountLifecycleRepository";
import { bindGuestInstallationToAccount, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";

const accountId = "55555555-5555-4555-8555-555555555555";
const uid = "firebase-fixture-uid";

function api(overrides: Partial<PatternlyApiClient> = {}): PatternlyApiClient {
  return {
    availability: "available",
    getHealth: async () => ({ status: "ok", service: "patternly-backend" }),
    getReady: async () => ({ status: "ready", checks: { database: true, authentication: true } }),
    getOpenApi: async () => ({ openapi: "3.0.3", paths: {} }),
    getMe: async () => ({ user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", identity: { provider: "firebase", subject: uid, email: null, emailVerified: true } } }),
    getEntitlements: async () => ({ entitlements: [] }),
    getProgress: async () => ({ accountRevision: 0, records: [] }),
    syncProgress: async () => ({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }),
    previewAccountAdoption: async () => { throw new Error("unused"); },
    confirmAccountAdoption: async () => { throw new Error("unused"); },
    issueRecoveryCodes: async () => ({ generationId: "generation-fixture", codes: [] }),
    consumeRecoveryCode: async () => ({ customToken: "custom-token-fixture" }),
    revokeSessions: async (operationId) => ({ status: "revoked", operationId }),
    deleteAccount: async (operationId) => ({ status: "deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    requestPublicDeletion: async () => ({ status: "accepted" }),
    confirmPublicDeletion: async () => ({ status: "deleted", operationId: "operation-fixture", proofId: "proof_fixture_12345678901234567890" }),
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: "operation-fixture", proofId }),
    getDeletionOperationStatus: async (operationId) => ({ status: "remote_deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    getTracks: async () => ({ tracks: [] }),
    getContentVersions: async () => ({ versions: [] }),
    createContentReport: async () => { throw new Error("unused"); },
    getAdminContentReports: async () => ({ reports: [] }),
    transitionAdminContentReport: async () => { throw new Error("unused"); },
    ...overrides,
  };
}

beforeEach(async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(accountId);
});

test("sign-out keeps the account bound and exposes a durable pending state when revocation fails", async () => {
  let revokeFails = true;
  const client = api({
    revokeSessions: async (operationId) => {
      if (revokeFails) throw new PatternlyApiClientError("server_error", 503, "session_revocation_pending");
      return { status: "revoked", operationId };
    },
  });

  const first = await prepareAccountSignOut(client, accountId);
  assert.deepEqual(first, { ok: false, failure: "signOutPending" });
  assert.equal(getAccountSignOutState()?.status, "pending");
  assert.equal((await getGuestInstallation())?.accountId, accountId);

  revokeFails = false;
  const retry = await prepareAccountSignOut(client, accountId);
  assert.deepEqual(retry, { ok: true });
  assert.equal(getAccountSignOutState(), null);
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal((await getAccountSyncState()).accountId, null);
});

test("deletion retries after a revoked or stale session and leaves a verified local tombstone", async () => {
  let deleteCalls = 0;
  let statusCalls = 0;
  let observedOperationId = "";
  const client = api({
    deleteAccount: async () => {
      deleteCalls += 1;
      throw new PatternlyApiClientError("server_error", 401, "account_deleted");
    },
    getDeletionOperationStatus: async (operationId, accountUidHash) => {
      statusCalls += 1;
      observedOperationId = operationId;
      assert.equal(accountUidHash, sha256Utf8(uid));
      return { status: "remote_deleted", operationId, proofId: "proof_fixture_12345678901234567890" };
    },
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: observedOperationId, proofId }),
  });

  const result = await deleteBoundAccount(client, accountId, uid);
  assert.deepEqual(result, { ok: true, proofId: "proof_fixture_12345678901234567890" });
  assert.equal(deleteCalls, 1);
  assert.equal(statusCalls, 1);
  assert.equal(getAccountDeletionState()?.status, "complete");
  assert.equal(getAccountDeletionState()?.accountUidHash, sha256Utf8(uid));
  assert.equal((await getGuestInstallation())?.accountId, null);
  assert.equal((await getAccountSyncState()).accountId, null);

  // A later app start can identify this UID as deleted without relying on a stale bearer token.
  assert.equal(getAccountDeletionState()?.status, "complete");
});
