import assert from "node:assert/strict";
import test from "node:test";
import { createPatternlyApiClient, PatternlyApiClientError, validateProgressRecord, type ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { terminalWireFixture } from "../../testing/terminalWireFixture";
import { accountDataRecordFingerprint, ensureAccountOutboxFromLocalDataset } from "../repositories/accountDataRepository";
import { productionLearningDataAdmissionContext as context } from "../../application/tracks/trackAdmissionContext";
import { loadAccountDataSession, retryAccountDataSync } from "../../application/account/accountDataService";
import { getTrainingSessions, getTrainingAttempts, getReviewQueueItems, getTrainingSessionResult, getActiveTrainingSession } from "../repositories";

const ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
const NOW = "2026-10-17T12:00:00.000Z";

function remoteRecord(record: Awaited<ReturnType<typeof terminalWireFixture>>["snapshot"]["records"][number], index = 0): ProgressRecordDto {
  return { kind: record.recordType === "training_attempt" || record.recordType === "review_queue_entry" ? "item" : "node",
    recordType: record.recordType, trackId: record.trackId, targetId: record.recordId, state: record.state,
    version: 7, fingerprint: record.fingerprint, lastMutationId: `legacy_read_fixture_${index}`, updatedAt: NOW };
}

function client(records: readonly ProgressRecordDto[], writes: string[] = []) {
  return createPatternlyApiClient({ apiOrigin: "https://api.sandbox.patternly.invalid", getIdToken: async () => "fixture-token", getAppCheckToken: async () => "fixture-app-check",
    fetchImplementation: async (url, init) => {
      assert.equal(init?.method, "GET", "read compatibility must not cause a cloud mutation");
      writes.push(String(url));
      assert.ok(String(url).includes("/v1/progress?"));
      return new Response(JSON.stringify({ accountRevision: 32, generation: 0, records, nextPageToken: null }));
    } });
}

function legacyRecord(session: Awaited<ReturnType<typeof terminalWireFixture>>["abandoned"]): ProgressRecordDto {
  const record = { recordType: "training_session_summary" as const, trackId: session.trackId, recordId: session.id, state: session, version: 7 };
  return remoteRecord({ ...record, fingerprint: accountDataRecordFingerprint(record) });
}

test("GET projects completed and abandoned legacy summaries without modifying source or admitting legacy writes", async () => {
  const f = await terminalWireFixture();
  for (const session of [f.finalized.session, f.abandoned]) {
    const legacy = legacyRecord(session);
    const before = structuredClone(legacy);
    assert.throws(() => validateProgressRecord(legacy));
    const api = client([legacy]);
    const first = await api.getProgress();
    assert.equal(first.accountRevision, 32);
    assert.equal(first.generation, 0);
    const row = first.records[0]!;
    assert.equal(row.targetId, legacy.targetId);
    assert.equal(row.version, legacy.version);
    assert.equal(row.lastMutationId, legacy.lastMutationId);
    assert.equal(row.updatedAt, legacy.updatedAt);
    assert.equal(row.state.schemaVersion, "terminal-session-v1");
    assert.equal(row.state.durationMs, session.activeForegroundMs);
    for (const field of ["actualLength", "currentItemIndex", "activeForegroundMs"]) assert.equal(Object.hasOwn(row.state, field), false);
    assert.equal(validateProgressRecord(row), true);
    assert.notEqual(row.fingerprint, legacy.fingerprint);
    assert.deepEqual(await api.getProgress(), first, "normalization is stable across reads");
    assert.deepEqual(legacy, before);
    await assert.rejects(api.syncProgress({ canonicalVersion: "canonical-json-v1", expectedAccountRevision: 32,
      deviceId: "66666666-6666-4666-8666-666666666666", sessionId: "legacy-read-fixture", batchId: "legacy-read-fixture-batch", highWatermark: 1,
      mutations: [{ mutationId: "legacy_write_fixture_1", kind: "node", recordType: legacy.recordType, trackId: legacy.trackId, targetId: legacy.targetId,
        expectedVersion: legacy.version, fingerprint: legacy.fingerprint, state: legacy.state }] }),
    (error: unknown) => error instanceof PatternlyApiClientError && error.code === "invalid_response");
  }
});

test("GET rejects malformed legacy facts, original hashes, active state and extra fields", async () => {
  const f = await terminalWireFixture();
  for (const change of [
    (state: Record<string, unknown>) => { state.status = "active"; },
    (state: Record<string, unknown>) => { state.actualLength = 999; },
    (state: Record<string, unknown>) => { state.currentItemIndex = -1; },
    (state: Record<string, unknown>) => { state.currentItemIndex = 0; },
    (state: Record<string, unknown>) => { state.activeForegroundMs = -1; },
    (state: Record<string, unknown>) => { state.unrecognized = true; },
    (state: Record<string, unknown>) => { state.durationMs = 123; },
    (state: Record<string, unknown>) => { state.schemaVersion = "other"; },
    (state: Record<string, unknown>) => { delete state.actualLength; },
    (state: Record<string, unknown>) => { state.artifactSha256 = "b".repeat(64); },
  ]) {
    const row = structuredClone(legacyRecord(f.finalized.session));
    change(row.state as Record<string, unknown>);
    const fingerprint = accountDataRecordFingerprint({ recordId: row.targetId, recordType: row.recordType, trackId: row.trackId, state: row.state });
    await assert.rejects(client([{ ...row, fingerprint }]).getProgress(), (e: unknown) => e instanceof PatternlyApiClientError && e.code === "invalid_response");
  }
  const valid = legacyRecord(f.finalized.session);
  await assert.rejects(client([{ ...valid, fingerprint: "0".repeat(64) }]).getProgress(), (e: unknown) => e instanceof PatternlyApiClientError && e.code === "invalid_response");
});

test("real GET parser restores legacy terminal history then syncs with no phantom outbox or active session", async () => {
  const f = await terminalWireFixture();
  const sessions = new Map([[f.finalized.session.id, f.finalized.session], [f.abandoned.id, f.abandoned]]);
  const remote = f.snapshot.records.map((record, index) => record.recordType === "training_session_summary"
    ? legacyRecord(sessions.get(record.recordId)!) : remoteRecord(record, index));
  const requests: string[] = [];
  const api = client(remote, requests);
  const restored = await loadAccountDataSession(api, ACCOUNT_ID, { guestAdoption: "discard" });
  assert.equal(restored.status, "synced");
  assert.equal(restored.lastFailureCode, null);
  assert.equal(await getActiveTrainingSession(context.trackAdmission), null);
  const history = (await getTrainingSessions(context.trackAdmission)).value;
  assert.equal(history.length, f.sessions.length);
  const completed = history.find(session => session.id === f.finalized.session.id)!;
  assert.deepEqual(completed, f.finalized.session);
  const abandoned = history.find(session => session.id === f.abandoned.id)!;
  assert.equal(abandoned.status, f.abandoned.status);
  assert.equal(abandoned.activeForegroundMs, f.abandoned.activeForegroundMs);
  assert.deepEqual(abandoned.itemOrder, f.abandoned.itemOrder);
  assert.deepEqual((await getTrainingAttempts(context.trackAdmission)).value, f.attempts);
  assert.deepEqual((await getReviewQueueItems(context.trackAdmission)).value, f.reviews);
  assert.deepEqual(await getTrainingSessionResult(completed.id, context.trackAdmission), f.result);
  assert.equal((await ensureAccountOutboxFromLocalDataset(context)).outbox.length, 0);
  assert.equal((await retryAccountDataSync(api, ACCOUNT_ID)).status, "synced");
  assert.equal((await ensureAccountOutboxFromLocalDataset(context)).outbox.length, 0);
  assert.ok(requests.length >= 2);
});
