import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { classifyAccountFailure, classifyEmailChangeFailure } from "./AccountSessionProvider";

test("requestEmailChange preserves the global classifier and exposes only the email conflict locally", () => {
  const emailConflict = { code: "auth/email-already-in-use", message: "private provider detail" };

  assert.equal(classifyAccountFailure(emailConflict), "invalidCredential");
  assert.equal(classifyEmailChangeFailure(emailConflict), "emailUnavailable");
  assert.equal(classifyEmailChangeFailure({ code: "auth/invalid-credential" }), "reauthenticationRequired");
  assert.equal(classifyEmailChangeFailure({ code: "auth/wrong-password" }), "reauthenticationRequired");
  assert.equal(classifyEmailChangeFailure({ code: "auth/user-not-found" }), "reauthenticationRequired");
});

test("requestEmailChange keeps operational failures in their existing categories", () => {
  assert.equal(classifyEmailChangeFailure({ code: "auth/network-request-failed" }), "offline");
  assert.equal(classifyEmailChangeFailure({ code: "auth/too-many-requests" }), "rateLimited");
  assert.equal(classifyEmailChangeFailure({ code: "auth/provider-unavailable" }), "providerUnavailable");
  assert.equal(classifyEmailChangeFailure({ code: "auth/credential-already-in-use" }), "duplicate");
});

test("requestEmailChange owns the contextual mapper without changing the Firebase client contract", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const start = provider.indexOf("    requestEmailChange: (credentials, email) =>");
  const end = provider.indexOf("prepareDeletion:", start);
  assert.ok(start >= 0 && end > start);
  const operation = provider.slice(start, end);

  assert.match(operation, /auth\.requestEmailChange\(credentials, nextEmail\)/u);
  assert.match(operation, /classifyEmailChangeFailure\(error\)/u);
  assert.doesNotMatch(operation, /classifyAccountFailure\(error\)/u);
});
