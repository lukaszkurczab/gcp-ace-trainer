import assert from "node:assert/strict";
import test from "node:test";
import { terminalWireFixture } from "../../testing/terminalWireFixture";
import { applyRemoteAccountData, buildAccountDataSnapshot, accountDataRecordFingerprint, assertValidAccountDataRecords, ensureAccountOutboxFromLocalDataset, saveAccountSyncState, getAccountSyncState } from "../repositories/accountDataRepository";
import { getActiveTrainingSession, getTrainingSessions, getTrainingAttempts, getReviewQueueItems, getTrainingSessionResult } from "../repositories";
import { productionLearningDataAdmissionContext as context } from "../../application/tracks/trackAdmissionContext";
import { projectCertificationPracticeReview } from "../../application/certification/certificationPracticeReviewProjection";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { projectTerminalSession } from "./terminalSessionWire";
import { bindGuestInstallationToAccount } from "../repositories/guestInstallationRepository";
import { STORAGE_KEYS } from "../keys";

const types = ["active_track", "goal", "learning_plan", "review_queue_entry", "training_attempt", "training_session_result", "training_session_summary"];
test("all seven records round trip with exact QLE first answers, assistance, plan and review", async () => {
  const f = await terminalWireFixture();
  assert.deepEqual([...new Set(f.snapshot.records.map(record => record.recordType))].sort(), types);
  const summary = f.snapshot.records.find(record => record.recordId === f.finalized.session.id)!;
  assert.equal(summary.state.schemaVersion, "terminal-session-v1");
  for (const key of ["currentItemIndex", "activeForegroundMs", "actualLength", "draft", "journal"]) assert.equal(Object.hasOwn(summary.state, key), false, key);
  const old = { ...summary, state: f.finalized.session };
  const priorFingerprint = accountDataRecordFingerprint(old);
  assert.notEqual(priorFingerprint, summary.fingerprint);
  assert.throws(() => assertValidAccountDataRecords([{ ...old, fingerprint: priorFingerprint }], context));
  const beforeReject = f.storage.snapshot();
  await assert.rejects(applyRemoteAccountData([{ ...old, fingerprint: priorFingerprint }], context));
  assert.deepEqual(f.storage.snapshot(), beforeReject);
  await applyRemoteAccountData(f.snapshot.records, context);
  assert.equal(await getActiveTrainingSession(context.trackAdmission), null);
  await assert.rejects(f.lifecycle.resumeActiveSession());
  const sessions = (await getTrainingSessions(context.trackAdmission)).value;
  const completed = sessions.find(s => s.id === f.finalized.session.id)!;
  assert.deepEqual(completed, f.finalized.session);
  const abandoned = sessions.find(s => s.id === f.abandoned.id)!;
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.currentItemIndex, abandoned.actualLength - 1);
  assert.deepEqual(projectTerminalSession(abandoned), projectTerminalSession(f.abandoned));
  assert.equal(await createContentSessionPlanFingerprint(completed as typeof completed & { taxonomyVersion: string }), completed.planFingerprint);
  assert.deepEqual((await getTrainingAttempts(context.trackAdmission)).value, f.attempts);
  assert.deepEqual((await getReviewQueueItems(context.trackAdmission)).value, f.reviews);
  assert.deepEqual(await getTrainingSessionResult(completed.id, context.trackAdmission), f.result);
  const project = (session: typeof completed) => projectCertificationPracticeReview({ session: session as never, result: f.finalized.result, attempts: f.attempts, resolveQuestion: async item => ({ question: f.family.catalog.getQuestion(item.questionId)!, interactions: f.family.presentation }) });
  assert.deepEqual(await project(completed), await project(f.finalized.session));
  assert.deepEqual((await buildAccountDataSnapshot(context)).records, f.snapshot.records);
});

test("DTO retry reuses exact fingerprints/IDs; obsolete queued summaries preserve bytes and fail closed", async () => {
  const f = await terminalWireFixture();
  const accountId = "55555555-5555-4555-8555-555555555555";
  await bindGuestInstallationToAccount(accountId);
  saveAccountSyncState({ ...await getAccountSyncState(context), accountId, status: "synced" }, context);
  const first = await ensureAccountOutboxFromLocalDataset(context);
  assert.deepEqual((await ensureAccountOutboxFromLocalDataset(context)).outbox, first.outbox);
  const summary = first.outbox.find(entry => entry.recordType === "training_session_summary" && entry.recordId === f.finalized.session.id)!;
  const oldRecord = { ...summary, state: f.finalized.session };
  const old = { ...oldRecord, fingerprint: accountDataRecordFingerprint(oldRecord) };
  const raw = f.storage.getString(STORAGE_KEYS.ACCOUNT_SYNC)!;
  const envelope = JSON.parse(raw);
  envelope.payload.outbox = first.outbox.map(entry => entry === summary ? old : entry);
  envelope.payload.syncPlan = null;
  f.storage.setString(STORAGE_KEYS.ACCOUNT_SYNC, JSON.stringify(envelope));
  const bytes = f.storage.snapshot();
  await assert.rejects(ensureAccountOutboxFromLocalDataset(context), { code: "account_sync_state_invalid" });
  assert.deepEqual(f.storage.snapshot(), bytes);
});


test("a real active QLE session stays device-owned and cannot be projected as a terminal fact", async () => {
  const f = await terminalWireFixture();
  const prepared = await f.lifecycle.startSession({ trackId: f.track.trackId, modeId: "certification-focus-practice", request: { preset: "single_case", caseId: f.finalized.session.caseState!.caseId, requestedLength: 3 } });
  const snapshot = await buildAccountDataSnapshot(context);
  assert.equal(snapshot.activeSession, true);
  assert.equal(snapshot.records.some(record => record.recordType === "training_session_summary" && record.recordId === prepared.session.id), false);
  assert.throws(() => projectTerminalSession(prepared.session), /active_session_not_syncable/u);
});
