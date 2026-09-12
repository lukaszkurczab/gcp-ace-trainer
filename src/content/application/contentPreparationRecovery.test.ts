import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");

test("lost-key recovery keeps retry safe and requires a separate destructive confirmation", () => {
  assert.match(source, /storageFailureCode === "encrypted_storage_key_missing"/);
  assert.match(source, /setConfirmUnavailableDataRemoval\(true\)/);
  assert.match(source, /removeUnavailableEncryptedStorage\(\)/);
  assert.match(source, /variant="destructive"/);
  assert.match(source, /Firebase|cloud|Account data previously saved in the cloud will remain/);
  assert.doesNotMatch(source, /clearPatternlyLocalHistory/);
});

test("unavailable active content is a typed gate with explicit abandon and retry paths", () => {
  assert.match(source, /kind: "content_identity_unavailable"/);
  assert.match(source, /abandonUnavailableActiveTrainingSession\(sessionId\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActive\(\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActiveConfirm\(\)/);
  assert.match(source, /runtimeSelectors\.content\.unavailableActiveRetry\(\)/);
  assert.match(source, /An active session uses content that is no longer available/);
  assert.match(source, /setBootstrapRevision\(\(revision\) => revision \+ 1\)/);
  assert.doesNotMatch(source, /contentIdentityUnavailableRepository/);
});
