import assert from "node:assert/strict";
import test from "node:test";
import type { AccountDataSession, AccountSyncConflictPreview } from "../../application/account/accountDataService";
import { accountSyncAutomaticRetryAllowed, getAccountSyncConflictPresentation } from "./accountSyncConflictPresentation";

const accountData = (syncConflict: AccountDataSession["syncConflict"]): AccountDataSession => Object.freeze({
  status: syncConflict ? "conflict" : "synced",
  preview: null,
  lastSuccessfulSyncAt: null,
  pendingMutationCount: syncConflict ? 2 : 0,
  blockingConflictCode: syncConflict?.code ?? null,
  lastFailureCode: syncConflict?.code ?? null,
  activeSessionBlocked: false,
  guestAdoptionChoice: "transfer",
  syncConflict,
});
const conflict: NonNullable<AccountDataSession["syncConflict"]> = Object.freeze({
  schemaVersion: 1, conflictId: "conflict-1", code: "account_revision_conflict", planId: "plan-1", batchId: "batch-1", batchIndex: 0,
  expectedAccountRevision: 4, requestFingerprint: "a".repeat(64), mutationIds: Object.freeze(["mutation-1"]),
  recordKeys: Object.freeze(["goal-key"]), trackIds: Object.freeze(["coding-interview-dsa-problem-solving"]), occurredAt: "2026-10-09T00:00:00.000Z",
});
const preview = (kind: AccountSyncConflictPreview["kind"], conflictId = conflict.conflictId): AccountSyncConflictPreview => Object.freeze({
  conflictId, kind, remoteAccountRevision: 5, changedPairTrackIds: Object.freeze(["coding-interview-dsa-problem-solving"]), changedOtherRecordCount: kind === "unsupported_changes" ? 1 : 0,
});

test("a confirmed conflict disables automatic retry until a matching explicit inspection is available", () => {
  const state = accountData(conflict);
  assert.equal(accountSyncAutomaticRetryAllowed(state), false);
  assert.deepEqual(getAccountSyncConflictPresentation(state, null), { kind: "inspect" });
  assert.deepEqual(getAccountSyncConflictPresentation(state, preview("rebase_available", "stale-preview")), { kind: "inspect" });
  assert.equal(accountSyncAutomaticRetryAllowed(accountData(null)), true);
});

test("the latest inspection exposes only its safe resolution or whole-pair choices", () => {
  const state = accountData(conflict);
  assert.deepEqual(getAccountSyncConflictPresentation(state, preview("rebase_available")), { kind: "rebase" });
  assert.deepEqual(getAccountSyncConflictPresentation(state, preview("pair_choice_required")), { kind: "pair_choice", trackIds: ["coding-interview-dsa-problem-solving"] });
  assert.deepEqual(getAccountSyncConflictPresentation(state, preview("unsupported_changes")), { kind: "unsupported" });
});
