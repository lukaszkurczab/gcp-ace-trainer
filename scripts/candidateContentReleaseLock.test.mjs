import assert from "node:assert/strict";
import test from "node:test";
import { parseCandidateContentReleaseLockArgs, verifyCandidateContentAdmission } from "./candidateContentReleaseLock.mjs";

const appRoot = process.cwd();
const contentRoot = new URL("../../patternly-content", import.meta.url).pathname;

test("current-source check accepts only explicit roots and check mode", () => {
  assert.deepEqual(parseCandidateContentReleaseLockArgs(["check", "--content-root", "/tmp/content"]), { appRoot, contentRoot: "/tmp/content" });
  assert.throws(() => parseCandidateContentReleaseLockArgs(["--purpose", "publishing"]), /Usage:/u);
  assert.throws(() => parseCandidateContentReleaseLockArgs(["--content-root", "/tmp/one", "--content-root", "/tmp/two"]), /Duplicate --content-root/u);
  assert.throws(() => parseCandidateContentReleaseLockArgs(["write"]), /Usage:/u);
});

test("current-source check verifies the installed app bank against all source tracks", async () => {
  const result = await verifyCandidateContentAdmission({ appRoot, contentRoot });
  assert.match(result.sourceInputFingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(result.trackIds.length, 9);
});
