import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("automatic session revocation keeps sign-in on loading and exposes pending recovery only on failure", () => {
  const source = readFileSync(new URL("./AccountSessionProvider.tsx", import.meta.url), "utf8");
  const start = source.indexOf("if (pendingRevocations.length > 0)");
  assert.notEqual(start, -1);
  const branch = source.slice(start, source.indexOf("const matchingLogoutBlock", start));
  const pending = branch.slice(0, branch.indexOf("void (async () =>"));
  assert.match(pending, /closeActiveProfileStorage\(\)/u);
  assert.match(pending, /setState\(\{ kind: "loading" \}\)/u);
  assert.doesNotMatch(pending, /kind: "signOutPending"/u);
  const failure = branch.slice(branch.indexOf("} catch {"), branch.indexOf("} finally {"));
  assert.match(failure, /if \(canContinue\(\)\) setState\(\{ kind: "signOutPending"/u);
  assert.match(branch, /startAuthenticatedProfilePreparation\(configuredAuth, client, currentUser, generation\)/u);
});
