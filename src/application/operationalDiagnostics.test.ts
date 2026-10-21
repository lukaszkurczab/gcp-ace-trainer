import assert from "node:assert/strict";
import test from "node:test";

import { StorageReadError } from "../storage/errors";
import { EncryptedStorageBootstrapError } from "../infrastructure/storage/encryptedStorageBootstrap";
import { LocalLogoutControlError } from "../infrastructure/storage/localLogoutControl";
import { ProfileStorageError } from "../infrastructure/storage/profileStorageRouter";
import { NodePackageStorageIntegrityError, NodePackageStorageUnavailableError } from "../content/runtime/nodeContentPackage";
import {
  ApplicationBootstrapStage,
  BootstrapInvariantError,
  clearDevelopmentBootstrapDiagnostic,
  createBootstrapProgressObserver,
  createAccountStartupDiagnosticWriter,
  createProfileStoragePreparationDiagnosticWriter,
  describeOperationalFailure,
  observeBootstrapFailure,
  operationalDiagnosticCode,
  readDevelopmentBootstrapPendingStep,
  readDevelopmentBootstrapDiagnostic,
  readDevelopmentProfileStoragePreparationDiagnostic,
  readDevelopmentAccountStartupDiagnostic,
  readAccountStartupFailureTestID,
  recordAccountStartupFailure,
  type BootstrapDiagnosticEvent,
} from "./operationalDiagnostics";

function withDevelopmentSmokeRuntime<T>(run: () => T): T {
  const global = globalThis as typeof globalThis & { __DEV__?: boolean };
  const hadDev = Object.prototype.hasOwnProperty.call(global, "__DEV__");
  const previousDev = global.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  Object.defineProperty(global, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  try { return run(); }
  finally {
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previousMode;
    if (hadDev) Object.defineProperty(global, "__DEV__", { configurable: true, value: previousDev });
    else Reflect.deleteProperty(global, "__DEV__");
  }
}

test("operational diagnostics classify failures without exposing raw details", () => {
  const error = new StorageReadError("secret-key", "raw=session-123");
  assert.equal(operationalDiagnosticCode(error), "STORAGE_READ_FAILED");
  assert.equal(describeOperationalFailure(error, "Bootstrap failed."), "Bootstrap failed. [STORAGE_READ_FAILED]");
});

test("Premium storage diagnostics distinguish integrity from uncertain writes without leaking details", () => {
  const corrupt = new NodePackageStorageIntegrityError("corrupt", "manifest_decode");
  assert.equal(operationalDiagnosticCode(corrupt), "NODE_PACKAGE_STORAGE_CORRUPT");
  const corruptCopy = describeOperationalFailure(corrupt, "Bootstrap failed.");
  assert.equal(corruptCopy, "Patternly couldn't verify saved Premium content on this device. The operation is blocked and the stored files were left in place.");
  assert.doesNotMatch(corruptCopy, /manifest_decode|secret|payload|nodeId/u);

  const identityMismatchCopy = describeOperationalFailure(new NodePackageStorageIntegrityError("identity_mismatch", "pointer_identity"), "Bootstrap failed.");
  assert.equal(identityMismatchCopy, "Saved Premium content doesn't match this topic. The operation is blocked and the stored files were left in place.");

  const unknown = new NodePackageStorageUnavailableError("pointer_readback", "unknown");
  assert.equal(operationalDiagnosticCode(unknown), "NODE_PACKAGE_STORAGE_UNAVAILABLE");
  const unknownCopy = describeOperationalFailure(unknown, "Bootstrap failed.");
  assert.match(unknownCopy, /couldn't confirm/u);
  assert.match(unknownCopy, /operation is blocked/u);
  assert.doesNotMatch(unknownCopy, /pointer_readback|secret|payload/u);
});

test("bootstrap observers receive only the canonical bounded event", () => {
  const events: BootstrapDiagnosticEvent[] = [];
  observeBootstrapFailure(
    (event) => { events.push(event); },
    ApplicationBootstrapStage.ValidatingActiveSession,
    new BootstrapInvariantError("active_session_draft_missing", "secret payload=session-123"),
  );

  assert.deepEqual(events, [{
    stage: ApplicationBootstrapStage.ValidatingActiveSession,
    operationalCode: "LOCAL_OPERATION_FAILED",
    invariantCode: "active_session_draft_missing",
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(events), /secret|session-123/u);
  clearDevelopmentBootstrapDiagnostic();
});

test("resume-time canonical changes have a bounded invariant code", () => {
  const events: BootstrapDiagnosticEvent[] = [];
  observeBootstrapFailure(
    (event) => { events.push(event); },
    ApplicationBootstrapStage.ResumingSession,
    new BootstrapInvariantError("active_session_changed_during_resume", "session payload=session-123"),
  );

  assert.deepEqual(events, [{
    stage: ApplicationBootstrapStage.ResumingSession,
    operationalCode: "LOCAL_OPERATION_FAILED",
    invariantCode: "active_session_changed_during_resume",
    errorKind: "error",
  }]);
  assert.doesNotMatch(JSON.stringify(events), /payload|session-123/u);
});

test("a throwing diagnostic observer cannot alter the operation", () => {
  assert.doesNotThrow(() => observeBootstrapFailure(
    () => { throw new Error("observer payload=session-456"); },
    ApplicationBootstrapStage.OpeningStorage,
    new Error("operation failed"),
  ));
});

test("dev-smoke recovery diagnostics expose only the current enumerated await step", () => withDevelopmentSmokeRuntime(() => {
  const first = createBootstrapProgressObserver();
  first.observeStep("pending_journal_recovery");
  assert.equal(readDevelopmentBootstrapPendingStep(), "pending_journal_recovery");
  assert.deepEqual(JSON.parse(JSON.stringify({ pendingStep: readDevelopmentBootstrapPendingStep() })), { pendingStep: "pending_journal_recovery" });
  first.observeStep("operation_projection_reconstruction");
  assert.equal(readDevelopmentBootstrapPendingStep(), "operation_projection_reconstruction");
  first.observeStep(null);
  assert.equal(readDevelopmentBootstrapPendingStep(), null);
  first.dispose();
}));

test("a newer attempt fences late step updates and disposal from an older bootstrap", () => withDevelopmentSmokeRuntime(() => {
  const first = createBootstrapProgressObserver();
  first.observeStep("profile_completion");
  const second = createBootstrapProgressObserver();
  second.observeStep("active_session_read");
  first.observeStep("pending_journal_recovery");
  first.dispose();
  assert.equal(readDevelopmentBootstrapPendingStep(), "active_session_read");
  second.dispose();
  assert.equal(readDevelopmentBootstrapPendingStep(), null);
}));

test("bootstrap failure clears only pending progress and keeps the V1 event shape", () => withDevelopmentSmokeRuntime(() => {
  const progress = createBootstrapProgressObserver();
  progress.observeStep("actor_anchor_capture");
  progress.observeFailure(Object.freeze({
    stage: ApplicationBootstrapStage.RecoveringLearningState,
    operationalCode: "STORAGE_READ_FAILED",
    errorKind: "error",
  }));
  assert.equal(readDevelopmentBootstrapPendingStep(), null);
  assert.deepEqual(readDevelopmentBootstrapDiagnostic(), {
    stage: ApplicationBootstrapStage.RecoveringLearningState,
    operationalCode: "STORAGE_READ_FAILED",
    errorKind: "error",
  });
  progress.dispose();
  clearDevelopmentBootstrapDiagnostic();
}));

test("a new recovery attempt preserves the existing V1 failure receipt", () => withDevelopmentSmokeRuntime(() => {
  clearDevelopmentBootstrapDiagnostic();
  const previousEvent = Object.freeze({
    stage: ApplicationBootstrapStage.RecoveringLearningState,
    operationalCode: "STORAGE_READ_FAILED" as const,
    errorKind: "error" as const,
  });
  const first = createBootstrapProgressObserver();
  first.observeFailure(previousEvent);
  first.dispose();

  const retry = createBootstrapProgressObserver();
  retry.observeStep("pending_journal_recovery");
  assert.deepEqual(readDevelopmentBootstrapDiagnostic(), previousEvent);
  assert.equal(readDevelopmentBootstrapPendingStep(), "pending_journal_recovery");
  retry.dispose();
  clearDevelopmentBootstrapDiagnostic();
}));

test("profile preparation receipt is frozen, enum-bounded, and classifies only safe error categories", () => withDevelopmentSmokeRuntime(() => {
  const writer = createProfileStoragePreparationDiagnosticWriter();
  writer.pending("logout_control_read");
  const pending = readDevelopmentProfileStoragePreparationDiagnostic();
  assert.deepEqual(pending, { schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "pending", stage: "logout_control_read" });
  assert.ok(Object.isFrozen(pending));
  writer.failed("profile_storage_prepare", new Error("secret profile id and key"));
  assert.deepEqual(readDevelopmentProfileStoragePreparationDiagnostic(), {
    schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "failed", stage: "profile_storage_prepare", errorCategory: "LOCAL_OPERATION_FAILED",
  });
  assert.doesNotMatch(JSON.stringify(readDevelopmentProfileStoragePreparationDiagnostic()), /secret|profile id|key/u);
  writer.ready();
  assert.deepEqual(readDevelopmentProfileStoragePreparationDiagnostic(), { schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "ready", stage: "complete" });
  writer.dispose();
  assert.deepEqual(readDevelopmentProfileStoragePreparationDiagnostic(), { schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "ready", stage: "complete" });
}));

test("profile preparation classifies only allowlisted encrypted, logout-control, and profile errors", () => withDevelopmentSmokeRuntime(() => {
  const writer = createProfileStoragePreparationDiagnosticWriter();
  writer.failed("logout_control_read", new LocalLogoutControlError("local_logout_control_corrupt"));
  assert.equal(readDevelopmentProfileStoragePreparationDiagnostic()?.errorCategory, "local_logout_control_corrupt");
  writer.failed("profile_storage_prepare", new ProfileStorageError("profile_registry_corrupt"));
  assert.equal(readDevelopmentProfileStoragePreparationDiagnostic()?.errorCategory, "profile_registry_corrupt");
  writer.failed("profile_storage_prepare", new EncryptedStorageBootstrapError("storage_manifest_corrupt"));
  assert.equal(readDevelopmentProfileStoragePreparationDiagnostic()?.errorCategory, "storage_manifest_corrupt");
  writer.dispose();
}));

test("profile preparation receipt fences stale owners and removes only its own pending receipt", () => withDevelopmentSmokeRuntime(() => {
  const first = createProfileStoragePreparationDiagnosticWriter();
  first.pending("logout_control_create");
  const second = createProfileStoragePreparationDiagnosticWriter();
  second.pending("profile_state_inspect");
  first.failed("logout_control_read", new Error("stale"));
  first.dispose();
  assert.deepEqual(readDevelopmentProfileStoragePreparationDiagnostic(), { schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "pending", stage: "profile_state_inspect" });
  second.dispose();
  assert.equal(readDevelopmentProfileStoragePreparationDiagnostic(), null);

  const settled = createProfileStoragePreparationDiagnosticWriter();
  settled.failed("logout_control_read", { message: "do not expose" });
  settled.dispose();
  assert.deepEqual(readDevelopmentProfileStoragePreparationDiagnostic(), { schema: "patternly.profile-storage-preparation-diagnostic.v1", status: "failed", stage: "logout_control_read", errorCategory: "unknown" });
}));

test("profile preparation receipt is inert outside the combined dev-smoke gate", () => {
  const global = globalThis as typeof globalThis & { __DEV__?: boolean };
  const previousDev = global.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  Object.defineProperty(global, "__DEV__", { configurable: true, value: true });
  delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  try {
    const writer = createProfileStoragePreparationDiagnosticWriter();
    writer.pending("logout_control_create");
    assert.equal(readDevelopmentProfileStoragePreparationDiagnostic(), null);
  } finally {
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previousMode;
    if (previousDev === undefined) Reflect.deleteProperty(global, "__DEV__");
    else Object.defineProperty(global, "__DEV__", { configurable: true, value: previousDev });
  }
});

test("account startup receipt is frozen, closed, and contains only bounded account state kinds", () => withDevelopmentSmokeRuntime(() => {
  const writer = createAccountStartupDiagnosticWriter();
  writer.pending("profile_completion", "profilePreparing");
  const pending = readDevelopmentAccountStartupDiagnostic();
  assert.deepEqual(pending, {
    schema: "patternly.account-startup-diagnostic.v1", status: "pending", stage: "profile_completion", accountStateKind: "profilePreparing",
  });
  assert.equal(Object.isFrozen(pending), true);
  assert.deepEqual(Object.keys(pending!).sort(), ["accountStateKind", "schema", "stage", "status"]);
  assert.doesNotMatch(JSON.stringify(pending), /secret|uid|profile id|raw error|password/u);
  writer.failed("guest_state_inspect", new ProfileStorageError("profile_registry_corrupt"), "unavailable");
  assert.deepEqual(readDevelopmentAccountStartupDiagnostic(), {
    schema: "patternly.account-startup-diagnostic.v1", status: "failed", stage: "guest_state_inspect",
    accountStateKind: "unavailable", errorCategory: "profile_registry_corrupt",
  });
  writer.ready("guest");
  assert.deepEqual(readDevelopmentAccountStartupDiagnostic(), {
    schema: "patternly.account-startup-diagnostic.v1", status: "ready", stage: "complete", accountStateKind: "guest",
  });
  writer.dispose();
  assert.deepEqual(readDevelopmentAccountStartupDiagnostic(), {
    schema: "patternly.account-startup-diagnostic.v1", status: "ready", stage: "complete", accountStateKind: "guest",
  });
}));

test("account startup receipt fences replaced attempts and cleanup removes only its own pending receipt", () => withDevelopmentSmokeRuntime(() => {
  const first = createAccountStartupDiagnosticWriter();
  first.pending("auth_observer_wait", "loading");
  const second = createAccountStartupDiagnosticWriter();
  second.pending("guest_scope_prepare", "loading");
  first.failed("auth_event", new Error("stale uid secret"), "signedOut");
  first.dispose();
  assert.deepEqual(readDevelopmentAccountStartupDiagnostic(), {
    schema: "patternly.account-startup-diagnostic.v1", status: "pending", stage: "guest_scope_prepare", accountStateKind: "loading",
  });
  second.dispose();
  assert.equal(readDevelopmentAccountStartupDiagnostic(), null);

  const settled = createAccountStartupDiagnosticWriter();
  settled.failed("account_profile_prepare", new Error("payload uid=secret"), "backendUnavailable");
  settled.dispose();
  assert.deepEqual(readDevelopmentAccountStartupDiagnostic(), {
    schema: "patternly.account-startup-diagnostic.v1", status: "failed", stage: "account_profile_prepare",
    accountStateKind: "backendUnavailable", errorCategory: "LOCAL_OPERATION_FAILED",
  });
}));

test("account startup receipt rejects malformed fields and is inert outside the combined dev-smoke gate", () => {
  const global = globalThis as typeof globalThis & { __DEV__?: boolean };
  const previousDev = global.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  Object.defineProperty(global, "__DEV__", { configurable: true, value: true });
  delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  try {
    const inactive = createAccountStartupDiagnosticWriter();
    inactive.pending("auth_event", "loading");
    assert.equal(readDevelopmentAccountStartupDiagnostic(), null);
    inactive.dispose();
  } finally {
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previousMode;
    if (previousDev === undefined) Reflect.deleteProperty(global, "__DEV__");
    else Object.defineProperty(global, "__DEV__", { configurable: true, value: previousDev });
  }
  withDevelopmentSmokeRuntime(() => {
    const symbol = Symbol.for("patternly.account-startup-diagnostic.v1");
    Object.defineProperty(globalThis, symbol, { configurable: true, value: Object.freeze({ schema: "patternly.account-startup-diagnostic.v1", status: "pending", stage: "auth_event", accountStateKind: "loading", uid: "secret" }) });
    assert.equal(readDevelopmentAccountStartupDiagnostic(), null);
    Reflect.deleteProperty(globalThis, symbol);
  });
});

test("progress diagnostics are absent outside development smoke and cleanup removes the owned step", () => {
  const global = globalThis as typeof globalThis & { __DEV__?: boolean };
  const hadDev = Object.prototype.hasOwnProperty.call(global, "__DEV__");
  const previousDev = global.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  Object.defineProperty(global, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "release";
  try {
    const progress = createBootstrapProgressObserver();
    progress.observeStep("profile_completion");
    assert.equal(readDevelopmentBootstrapPendingStep(), null);
    progress.dispose();
  } finally {
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previousMode;
    if (hadDev) Object.defineProperty(global, "__DEV__", { configurable: true, value: previousDev });
    else Reflect.deleteProperty(global, "__DEV__");
  }
});


test("sandbox account failure bridge is bounded and release stays inert", () => {
  const host = globalThis as typeof globalThis & { __DEV__?: boolean };
  const previousDev = host.__DEV__;
  const previousMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  try {
    Object.defineProperty(host, "__DEV__", { configurable: true, value: false });
    process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "sandbox";
    const writer = createAccountStartupDiagnosticWriter();
    writer.pending("auth_event", "loading");
    assert.equal(readAccountStartupFailureTestID(), undefined);
    writer.ready("authenticated");
    assert.equal(readAccountStartupFailureTestID(), undefined);
    const error = Object.assign(new Error("uid secret token response password"), { name: "FirebaseError", code: "auth/user-token-expired" });
    recordAccountStartupFailure("revoke_replacement_claim", error, "signOutPending");
    writer.failed("session_revocation_gate", new Error("obsolete"), "signOutPending");
    assert.equal(readAccountStartupFailureTestID(), "account-failure:revoke_replacement_claim:auth_token_expired");
    assert.doesNotMatch(JSON.stringify(readDevelopmentAccountStartupDiagnostic()), /secret|token response|password|uid/u);
    for (const [name, code, status, expected] of [
      ["FirebaseError", "auth/unknown-secret", undefined, "auth_other"],
      ["PatternlyApiClientError", "invalid_response", undefined, "api_invalid_response"],
      ["PatternlyApiClientError", "transport_failed", undefined, "api_transport"],
      ["PatternlyApiClientError", "server_error", 429, "api_rate_limited"],
    ] as const) {
      recordAccountStartupFailure("account_identity_proof", Object.assign(new Error("secret"), { name, code, status }), "backendUnavailable");
      assert.equal(readAccountStartupFailureTestID(), `account-failure:account_identity_proof:${expected}`);
    }
    assert.equal(readDevelopmentProfileStoragePreparationDiagnostic(), null);
    for (const mode of ["release", "invalid", undefined]) {
      if (mode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
      else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
      Object.defineProperty(host, "__DEV__", { configurable: true, value: true });
      recordAccountStartupFailure("auth_event", error, "backendUnavailable");
      assert.equal(readDevelopmentAccountStartupDiagnostic(), null);
      assert.equal(readAccountStartupFailureTestID(), undefined);
    }
  } finally {
    if (previousMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previousMode;
    if (previousDev === undefined) Reflect.deleteProperty(host, "__DEV__");
    else Object.defineProperty(host, "__DEV__", { configurable: true, value: previousDev });
    Reflect.deleteProperty(globalThis, Symbol.for("patternly.account-startup-diagnostic.v1"));
  }
});
