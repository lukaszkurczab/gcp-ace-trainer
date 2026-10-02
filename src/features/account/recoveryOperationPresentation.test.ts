import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getRecoveryOperationPresentation } from "./recoveryOperationPresentation";
import type { RecoveryOperationSnapshot } from "../../application/account/recoveryOperationCoordinator";

const issueSnapshot = (overrides: Partial<Extract<RecoveryOperationSnapshot, { kind: "issue" }>> = {}): Extract<RecoveryOperationSnapshot, { kind: "issue" }> => ({
  kind: "issue",
  operationId: "operation-1",
  status: "result_available",
  firebaseUid: "firebase-user-1",
  authorizationGeneration: 3,
  generationId: "generation-1",
  codes: ["A1B2-C3D4"],
  savedIntent: false,
  deferredFor: null,
  accountResolution: null,
  failure: null,
  needsAccountResolution: false,
  replacementPending: false,
  blocksProfilePreparation: false,
  ...overrides,
});

test("a recovery-code operation for a different account keeps codes hidden and offers explicit sign-in resolution", () => {
  const presentation = getRecoveryOperationPresentation(issueSnapshot({ needsAccountResolution: true }));

  assert.equal(presentation.showCodes, false);
  assert.equal(presentation.showRetry, false);
  assert.equal(presentation.showResume, true);
  assert.equal(presentation.resumeKind, "issue");
  assert.equal(presentation.issueBlocksReplacement, true);
});

test("a confirmed account mismatch offers a separately explicit current-account transition", () => {
  const presentation = getRecoveryOperationPresentation(issueSnapshot({ needsAccountResolution: true, accountResolution: "different_uid" }));
  assert.equal(presentation.showCodes, false);
  assert.equal(presentation.showDefer, true);
  assert.equal(presentation.showResume, true);
});

test("missing generation does not offer a defer action and deferred codes remain hidden", () => {
  const missing = getRecoveryOperationPresentation(issueSnapshot({ needsAccountResolution: true, accountResolution: "missing_generation" }));
  assert.equal(missing.showDefer, false);
  const deferred = getRecoveryOperationPresentation(issueSnapshot({ deferredFor: { firebaseUid: "current-user", authorizationGeneration: 9 }, accountResolution: null }));
  assert.equal(deferred.deferred, true);
  assert.equal(deferred.showCodes, false);
  assert.equal(deferred.showRetry, false);
  assert.equal(deferred.showResume, true);
  assert.equal(deferred.showDefer, false);
});

test("unconfirmed delivery keeps unsaved codes available and offers an explicit status retry", () => {
  const presentation = getRecoveryOperationPresentation(issueSnapshot({ status: "delivery_unconfirmed" }));

  assert.equal(presentation.showCodes, true);
  assert.equal(presentation.showRetry, true);
  assert.equal(presentation.showResume, false);
  assert.equal(presentation.issueBlocksReplacement, true);
});

test("available result with persisted saved intent hides codes and offers an explicit ACK retry", () => {
  const presentation = getRecoveryOperationPresentation(issueSnapshot({ savedIntent: true, codes: null }));

  assert.equal(presentation.showCodes, false);
  assert.equal(presentation.showRetry, true);
  assert.equal(presentation.issueBlocksReplacement, true);
  assert.equal(presentation.savedAcknowledgementPending, true);
});

test("unconfirmed or blocked saved intent does not promise an available ACK", () => {
  for (const overrides of [
    { status: "delivery_unconfirmed" },
    { status: "in_progress" },
    { status: "provider_retryable" },
    { status: "acknowledged" },
    { status: "superseded" },
    { status: "expired_or_invalid" },
    { needsAccountResolution: true },
    { deferredFor: { firebaseUid: "current-user", authorizationGeneration: 9 } },
  ] as const) {
    const presentation = getRecoveryOperationPresentation(issueSnapshot({ savedIntent: true, codes: null, ...overrides }));
    assert.equal(presentation.savedAcknowledgementPending, false);
    assert.equal(presentation.showCodes, false);
  }
  assert.equal(getRecoveryOperationPresentation(issueSnapshot({ status: "delivery_unconfirmed", savedIntent: true, codes: null })).showRetry, true);
});

test("acknowledged issue is terminal and no longer blocks a replacement chosen by the user", () => {
  const presentation = getRecoveryOperationPresentation(issueSnapshot({ status: "acknowledged", codes: null }));

  assert.equal(presentation.showCodes, false);
  assert.equal(presentation.showRetry, false);
  assert.equal(presentation.issueBlocksReplacement, false);
  assert.equal(presentation.acknowledged, true);
});

test("server-confirmed non-acknowledged terminal status requires an explicit continue action", () => {
  const snapshot: RecoveryOperationSnapshot = {
    kind: "terminal",
    operationId: "operation-3",
    status: "expired_or_invalid",
    blocksProfilePreparation: false,
  };
  const presentation = getRecoveryOperationPresentation(snapshot);

  assert.equal(presentation.showResume, true);
  assert.equal(presentation.resumeKind, "terminal");
  assert.equal(presentation.issueBlocksReplacement, true);
});

test("a consume operation for another account offers explicit resume without an automatic retry", () => {
  const snapshot: RecoveryOperationSnapshot = {
    kind: "consume",
    operationId: "operation-2",
    status: "result_available",
    expectedFirebaseUid: "firebase-user-2",
    expectedAuthorizationGeneration: 4,
    needsAccountResolution: true,
    signInInFlight: false,
    failure: null,
    blocksProfilePreparation: true,
  };
  const presentation = getRecoveryOperationPresentation(snapshot);

  assert.equal(presentation.showPanel, true);
  assert.equal(presentation.showRetry, false);
  assert.equal(presentation.showResume, true);
  assert.equal(presentation.resumeKind, "consume");
});

test("loading or unavailable vault state blocks code issuance until recovery state is known", () => {
  for (const snapshot of [
    { kind: "loading", blocksProfilePreparation: true },
    { kind: "unavailable", reason: "vault_unavailable", blocksProfilePreparation: true },
  ] as const satisfies readonly RecoveryOperationSnapshot[]) {
    const presentation = getRecoveryOperationPresentation(snapshot);
    assert.equal(presentation.showPanel, true);
    assert.equal(presentation.issueBlocksReplacement, true);
  }
});

test("all account locales provide the recovery operation states and explicit mismatch actions", () => {
  const locales = ["en", "pl", "de", "fr", "es", "it", "et"].map((locale) => JSON.parse(readFileSync(`src/locales/${locale}/account.json`, "utf8")) as Record<string, unknown>);
  for (const locale of locales) {
    for (const key of ["recoveryOperationTitle", "recoveryOperationLoading", "recoveryOperationUnavailableTitle", "recoveryOperationPendingTitle", "recoveryOperationResume", "recoveryOperationResumeIssue", "recoveryOperationContinue", "recoveryOperationDeliveryUnconfirmed", "recoveryOperationMismatchDescription", "recoveryOperationIssueMismatchDescription", "recoveryOperationContinueCurrent", "recoveryOperationDeferredTitle", "recoveryOperationDeferredDescription", "recoveryOperationGenerationMissingDescription", "recoveryOperationCodesHidden", "recoveryOperationCodesShow"]) {
      assert.equal(typeof locale[key], "string", `${key} must be translated`);
    }
    for (const group of ["recoveryOperationStatus", "recoveryOperationConsumeStatus", "recoveryOperationFailure", "recoveryOperationUnavailable"]) {
      assert.equal(typeof locale[group], "object", `${group} must be translated`);
    }
    assert.equal(Object.keys(locale.recoveryOperationConsumeStatus as object).length, 7);
  }
});
