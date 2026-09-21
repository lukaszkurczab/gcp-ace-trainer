import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  PatternlyApiClientError,
  type AdoptionConfirmationDto,
  type GuestMergeSnapshotRequestDto,
  type PatternlyApiClient,
  type ProgressRecordV4Dto,
  type SyncRequestV4Dto,
} from "../../infrastructure/clients/PatternlyApiClientAdapter";
import {
  CONTENT_IDENTITY_SCHEMA,
  accountDataRecordFingerprint,
  getAccountSyncState,
  saveAccountSyncState,
} from "../../storage/repositories/accountDataRepository";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { bindGuestInstallationToAccount, getGuestInstallation, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import {
  confirmAccountDataAdoption,
  loadAccountDataSession,
  retryAccountDataSync,
} from "./accountDataService";

const accountId = "55555555-5555-4555-8555-555555555555";
const guestInstallationId = "66666666-6666-4666-8666-666666666666";
const trackId = "coding-interview-dsa-problem-solving" as const;

async function bindSyncedAccount(): Promise<void> {
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(), accountId, status: "synced" });
}

function v4Record(version = 1): ProgressRecordV4Dto {
  const state = { trackId };
  return {
    kind: "node",
    recordType: "active_track",
    trackId,
    targetId: "current",
    version,
    fingerprint: accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state, trackId, contentIdentitySchema: CONTENT_IDENTITY_SCHEMA }),
    state,
    lastMutationId: "mutation-remote-v4-0001",
    updatedAt: "2026-09-12T10:00:00.000Z",
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
  };
}

function v4MergeRecord() {
  const record = v4Record();
  return {
    fingerprint: record.fingerprint,
    recordId: record.targetId,
    recordType: record.recordType,
    state: record.state,
    trackId: record.trackId,
    version: record.version,
    contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
  } as const;
}

function api(overrides: Partial<PatternlyApiClient> = {}): PatternlyApiClient {
  return {
    availability: "available",
    accountDataProtocolMode: "v4",
    getHealth: async () => ({ status: "ok", service: "patternly-backend" }),
    getReady: async () => ({ status: "ready", checks: { database: true, authentication: true } }),
    getOpenApi: async () => ({ openapi: "3.0.3", paths: {} }),
    getMe: async () => ({ user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", acceptedTermsVersion: "1", identity: { provider: "firebase", subject: "uid", email: null, emailVerified: true } } }),
    registerAccount: async () => ({ registration: { created: true, user: { id: accountId, createdAt: "2026-01-01T00:00:00.000Z", acceptedTermsVersion: "1", identity: { provider: "firebase", subject: "uid", email: null, emailVerified: true } }, acceptance: null } }),
    recordLegalAcceptance: async (termsVersion) => ({ acceptance: { termsVersion, acceptedAt: "2026-01-01T00:00:00.000Z" } }),
    recordPurchaseConfirmation: async (input) => ({ confirmation: { confirmationId: input.confirmationId, acceptedAt: "2026-01-01T00:00:00.000Z" } }),
    getEntitlements: async () => ({ entitlements: [] }),
    getProgress: async () => ({ accountRevision: 1, records: [v4Record()] }),
    exportAccountData: async () => { throw new Error("unused"); },
    createPrivacyRequest: async () => { throw new Error("unused"); },
    getPrivacyRequests: async () => ({ requests: [] }),
    getPrivacyRequest: async () => { throw new Error("unused"); },
    createGuestPrivacyRequest: async () => { throw new Error("unused"); },
    resendGuestPrivacyCode: async () => { throw new Error("unused"); },
    verifyGuestPrivacyCode: async () => { throw new Error("unused"); },
    readGuestPrivacyResponse: async () => { throw new Error("unused"); },
    createLegalRequest: async () => { throw new Error("unused"); },
    createPublicLegalRequest: async () => { throw new Error("unused"); },
    getLegalRequests: async () => ({ requests: [] }),
    getLegalRequest: async () => { throw new Error("unused"); },
    syncProgress: async () => ({ accountRevision: 1, applied: [], duplicates: [], conflicts: [] }),
    previewAccountAdoption: async () => { throw new Error("unused"); },
    confirmAccountAdoption: async () => { throw new Error("unused"); },
    issueRecoveryCodes: async () => ({ generationId: "generation", codes: [] }),
    consumeRecoveryCode: async () => ({ customToken: "token" }),
    revokeSessions: async (operationId) => ({ status: "revoked", operationId }),
    deleteAccount: async (operationId) => ({ status: "deleted", operationId, proofId: "proof_fixture_12345678901234567890" }),
    getDeletionProof: async (proofId) => ({ status: "deleted", operationId: "operation", proofId }),
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
  await provisionGuestInstallation({ async create() { return { installationId: guestInstallationId, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
});

test("v4 bound sync emits schema-bound mutation metadata and hydrates schema-bound remote records", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  let request: SyncRequestV4Dto | null = null;
  const client = api({
    syncProgress: async (input) => {
      if (input.protocolVersion === 4) request = input;
      return { accountRevision: 1, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] };
    },
  });

  const result = await loadAccountDataSession(client, accountId);
  assert.equal(result.status, "synced");
  const sent = request!;
  assert.equal(sent.protocolVersion, 4);
  assert.equal(sent.planVersion, 4);
  assert.equal(sent.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
  assert.equal(sent.mutations[0]?.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
  const state = await getAccountSyncState();
  assert.equal(state.protocolVersion, 4);
  assert.equal(state.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
  assert.equal(state.acknowledged[Object.keys(state.acknowledged)[0] ?? ""]?.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
});

test("v4 offline retry reuses the same mutation and plan without changing the durable outbox", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  let shouldFail = true;
  const requests: Array<Parameters<PatternlyApiClient["syncProgress"]>[0]> = [];
  const client = api({
    syncProgress: async (input) => {
      requests.push(input);
      if (shouldFail) throw new PatternlyApiClientError("transport_failed");
      return { accountRevision: 1, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] };
    },
  });

  const first = await loadAccountDataSession(client, accountId);
  const pending = await getAccountSyncState();
  const mutationId = pending.outbox[0]?.mutationId;
  const planId = pending.syncPlan?.planId;
  assert.equal(first.status, "offlinePending");
  assert.equal(pending.lastFailureCode, "offline");
  assert.ok(mutationId);
  assert.ok(planId);

  shouldFail = false;
  const second = await retryAccountDataSync(client, accountId);
  assert.equal(second.status, "synced");
  assert.equal(requests.length, 2);
  assert.equal(requests[0]?.mutations[0]?.mutationId, requests[1]?.mutations[0]?.mutationId);
  assert.equal((requests[0] as SyncRequestV4Dto).sessionId, (requests[1] as SyncRequestV4Dto).sessionId);
  assert.equal((await getAccountSyncState()).outbox.length, 0);
  assert.equal((await getAccountSyncState()).syncPlan, null);
  assert.equal(mutationId, requests[1]?.mutations[0]?.mutationId);
  assert.equal(planId, (requests[1] as SyncRequestV4Dto).sessionId);
});

test("v3 rejects an inbound schema record and preserves the pending outbox and plan", async () => {
  await bindSyncedAccount();
  await saveActiveTrackId(trackId);
  const client = api({
    accountDataProtocolMode: "v3",
    syncProgress: async (input) => ({ accountRevision: 1, applied: [], duplicates: input.mutations.map((mutation) => mutation.mutationId), conflicts: [] }),
    getProgress: async () => ({ accountRevision: 1, records: [v4Record()] }),
  });

  const result = await loadAccountDataSession(client, accountId);
  const state = await getAccountSyncState();
  assert.equal(result.status, "conflict");
  assert.equal(result.lastFailureCode, "content_identity_schema_conflict");
  assert.equal(state.status, "conflict");
  assert.equal(state.lastFailureCode, "content_identity_schema_conflict");
  assert.equal(state.outbox.length, 1);
  assert.ok(state.syncPlan);
});

test("v4 adoption sends a schema-bound snapshot and confirmation", async () => {
  await saveActiveTrackId(trackId);
  const operationId = "00000000-0000-4000-8000-000000000009";
  const preview = {
    preview: {
      accountSnapshotVersion: 1,
      accountUserId: accountId,
      conflicts: [],
      fingerprint: "f".repeat(64),
      guestSnapshotVersion: 1,
      guestUserId: guestInstallationId,
      operationId,
      protocolVersion: 4 as const,
      contentIdentitySchema: CONTENT_IDENTITY_SCHEMA,
      goalPlanConflictGroups: [],
    },
    plan: { caseId: "populatedLocalEmptyRemote" as const, localRecordCount: 1, remoteRecordCount: 0, uploadRecordIds: ["current"], restoreRecordIds: [], deduplicatedRecordIds: [], conflictRecordIds: [], blockingReason: null },
    remoteRecords: [],
  };
  let snapshotProtocol: number | null = null;
  let confirmationProtocol: number | null = null;
  const client = api({
    previewAccountAdoption: async (snapshot) => {
      snapshotProtocol = snapshot.protocolVersion;
      const v4Snapshot = snapshot as Extract<GuestMergeSnapshotRequestDto, { protocolVersion: 4 }>;
      assert.equal(v4Snapshot.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
      assert.equal(v4Snapshot.records[0]?.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
      return preview;
    },
    confirmAccountAdoption: async (input) => {
      confirmationProtocol = input.confirmation.protocolVersion;
      const v4Confirmation = input.confirmation as Extract<AdoptionConfirmationDto, { protocolVersion: 4 }>;
      assert.equal(v4Confirmation.contentIdentitySchema, CONTENT_IDENTITY_SCHEMA);
      assert.equal(input.snapshot.protocolVersion, 4);
      return { accountRevision: 1, operationId, mutationIds: [], records: [v4MergeRecord()] };
    },
  });

  const ready = await loadAccountDataSession(client, accountId);
  assert.equal(ready.status, "previewReady");
  const completed = await confirmAccountDataAdoption(client, accountId, ready.preview!, [], []);
  assert.equal(completed.status, "synced");
  assert.equal(snapshotProtocol, 4);
  assert.equal(confirmationProtocol, 4);
  assert.equal((await getGuestInstallation())?.accountId, accountId);
  assert.equal((await getAccountSyncState()).protocolVersion, 4);
});
