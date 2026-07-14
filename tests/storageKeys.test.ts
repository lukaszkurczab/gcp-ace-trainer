import assert from "node:assert/strict";
import test from "node:test";

import {
  STORAGE_KEYS,
  getStorageClearKeys,
  getStorageReadKeys,
} from "../src/constants/storage";

test("active storage namespace uses Patternly v1 keys", () => {
  assert.equal(
    Object.values(STORAGE_KEYS).every((key) => key.startsWith("patternly:v1:")),
    true,
  );
  assert.equal(
    Object.values(STORAGE_KEYS).some((key) => key.includes("gcpAceTrainer")),
    false,
  );
});

test("storage reads and clears only the canonical key", () => {
  assert.deepEqual(getStorageReadKeys("QUESTIONS"), [STORAGE_KEYS.QUESTIONS]);
  assert.deepEqual(getStorageClearKeys("ATTEMPTS"), [STORAGE_KEYS.ATTEMPTS]);
});
