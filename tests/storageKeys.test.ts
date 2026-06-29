import assert from "node:assert/strict";
import test from "node:test";

import {
  LEGACY_STORAGE_KEYS,
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

test("legacy keys are explicit read and reset fallbacks", () => {
  assert.deepEqual(getStorageReadKeys("QUESTIONS"), [
    STORAGE_KEYS.QUESTIONS,
    LEGACY_STORAGE_KEYS.QUESTIONS,
  ]);
  assert.deepEqual(getStorageClearKeys("ATTEMPTS"), [
    STORAGE_KEYS.ATTEMPTS,
    LEGACY_STORAGE_KEYS.ATTEMPTS,
  ]);
});
