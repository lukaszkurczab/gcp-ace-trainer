import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("automatic session revocation keeps sign-in on loading and exposes pending recovery only on failure", () => {
  const source = readFileSync(new URL("./AccountSessionProvider.tsx", import.meta.url), "utf8");
  const start = source.indexOf("if (pendingRevocations.length > 0)");
  assert.notEqual(start, -1);
  const branch = source.slice(start, source.indexOf("const matchingLogoutBlock", start));
  const pending = branch.slice(0, branch.indexOf(".catch((error: unknown) => {"));
  assert.match(pending, /closeActiveProfileStorage\(\)/u);
  assert.match(pending, /setState\(\{ kind: "loading" \}\)/u);
  assert.doesNotMatch(pending, /kind: "signOutPending"/u);
  assert.match(branch, /\.catch\(\(error: unknown\) => \{\s*if \(!canContinue\(\)\) return;\s*setState\(pendingRevokeFailureState\(user, error, logoutControlSnapshotRef\.current\)\);[\s\S]*?eventDiagnostic\.failed\("session_revocation_gate"/u);
  assert.match(branch, /admitAuthenticatedBootstrap\(configuredAuth, client, user, generation, eventDiagnostic, canContinue\)/u);
});
