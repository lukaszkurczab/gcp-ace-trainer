import assert from "node:assert/strict";
import test from "node:test";

import { describeOperationalFailure, operationalDiagnosticCode } from "./operationalDiagnostics";
import { StorageWriteError } from "../storage/errors";

test("operational diagnostics retain a bounded category without exposing an injected learner payload", () => {
  const payload = "answer=secret-option draft=session-123 item=question-456";
  const error = new StorageWriteError(payload, new Error(payload));
  assert.equal(operationalDiagnosticCode(error), "STORAGE_WRITE_FAILED");
  const message = describeOperationalFailure(error, "Learning data could not be saved locally.");
  assert.equal(message, "Learning data could not be saved locally. [STORAGE_WRITE_FAILED]");
  assert.doesNotMatch(message, /secret-option|session-123|question-456|answer=|draft=/);
});
