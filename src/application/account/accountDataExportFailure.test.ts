import assert from "node:assert/strict";
import test from "node:test";

import { PatternlyApiClientError } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { classifyAccountDataExportFailure } from "./AccountSessionProvider";

test("account export distinguishes recent authentication, revoked sessions, transport, limits, and 5xx", () => {
  assert.deepEqual(classifyAccountDataExportFailure(new PatternlyApiClientError("server_error", 401, "recent_reauthentication_required")), { kind: "failure", failure: "authenticationRequired" });
  assert.deepEqual(classifyAccountDataExportFailure(new PatternlyApiClientError("server_error", 401, "invalid_token")), { kind: "failure", failure: "sessionRevoked" });
  assert.deepEqual(classifyAccountDataExportFailure({ code: "auth/user-token-expired" }), { kind: "failure", failure: "sessionRevoked" });
  assert.deepEqual(classifyAccountDataExportFailure({ code: "auth/uid-changed" }), { kind: "failure", failure: "sessionRevoked" });
  assert.deepEqual(classifyAccountDataExportFailure({ code: "auth/network-request-failed" }), { kind: "failure", failure: "offline" });
  assert.deepEqual(classifyAccountDataExportFailure(new PatternlyApiClientError("server_error", 429, "data_export_rate_limited", 90)), { kind: "failure", failure: "rateLimited", retryAfterSeconds: 90 });
  assert.deepEqual(classifyAccountDataExportFailure(new PatternlyApiClientError("server_error", 503)), { kind: "failure", failure: "serverFailure" });
});
