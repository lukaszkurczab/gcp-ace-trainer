import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("recovery-code issuance preserves invalid credentials from reauthentication", () => {
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  const start = provider.indexOf("issueRecoveryCodes: (credentials) =>");
  const end = provider.indexOf("    revokeDeletionAuthorization,", start);
  const issueRecoveryCodes = provider.slice(start, end);

  assert.ok(start >= 0);
  assert.ok(end > start);
  assert.match(issueRecoveryCodes, /const failure = classifyAccountFailure\(result\.error\);/u);
  assert.match(issueRecoveryCodes, /return \{ kind: "failure", failure \};/u);
  assert.doesNotMatch(issueRecoveryCodes, /invalidCredential" \? "reauthenticationRequired/u);
});
