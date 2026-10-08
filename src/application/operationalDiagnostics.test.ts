import assert from "node:assert/strict";
import test from "node:test";

import { StorageReadError } from "../storage/errors";
import {
  ApplicationBootstrapStage,
  BootstrapInvariantError,
  clearDevelopmentBootstrapDiagnostic,
  createBootstrapProgressObserver,
  describeOperationalFailure,
  observeBootstrapFailure,
  operationalDiagnosticCode,
  readDevelopmentBootstrapPendingStep,
  readDevelopmentBootstrapDiagnostic,
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
