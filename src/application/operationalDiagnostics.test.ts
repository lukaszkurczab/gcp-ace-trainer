import assert from "node:assert/strict";
import test from "node:test";

import { StorageReadError } from "../storage/errors";
import {
  ApplicationBootstrapStage,
  BootstrapInvariantError,
  clearDevelopmentBootstrapDiagnostic,
  describeOperationalFailure,
  observeBootstrapFailure,
  operationalDiagnosticCode,
  type BootstrapDiagnosticEvent,
} from "./operationalDiagnostics";

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

test("a throwing diagnostic observer cannot alter the operation", () => {
  assert.doesNotThrow(() => observeBootstrapFailure(
    () => { throw new Error("observer payload=session-456"); },
    ApplicationBootstrapStage.OpeningStorage,
    new Error("operation failed"),
  ));
});
