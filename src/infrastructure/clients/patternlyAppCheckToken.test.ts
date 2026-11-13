import assert from "node:assert/strict";
import test from "node:test";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "./patternlyAppCheckToken";

// T1.6 readiness barrier: a token read during native App Check composition waits for it.
test("token reads wait for an App Check composition in flight", async () => {
  configurePatternlyAppCheckTokenProvider(async () => "stale");
  const composing = composePatternlyNativeAppCheck({ appleProvider: "debug" });
  const token = getPatternlyAppCheckToken();
  // Node has no native Firebase, so the composition ends unavailable; the read must observe that
  // result rather than the provider that was installed before the composition started.
  assert.equal(await composing, "unavailable");
  assert.equal(await token, null);
});

test("an explicit provider supersedes a composition still in flight", async () => {
  const composing = composePatternlyNativeAppCheck({ appleProvider: "debug" });
  configurePatternlyAppCheckTokenProvider(async () => "local-token");
  assert.equal(await composing, "unavailable");
  assert.equal(await getPatternlyAppCheckToken(), "local-token");
  configurePatternlyAppCheckTokenProvider(null);
  assert.equal(await getPatternlyAppCheckToken(), null);
});

test("an absent configuration is unavailable without waiting", async () => {
  assert.equal(await composePatternlyNativeAppCheck({}), "unavailable");
  assert.equal(await getPatternlyAppCheckToken(), null);
});
