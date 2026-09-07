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
