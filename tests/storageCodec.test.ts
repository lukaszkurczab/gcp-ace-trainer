import assert from "node:assert/strict";
import test from "node:test";

import { decodeLocalJson, getStorageErrorMessage } from "../src/storage/storageCodec";

test("decodes missing local JSON as a valid fallback", () => {
  const result = decodeLocalJson("patternly.test", null, { enabled: true });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { enabled: true });
});

test("reports corrupt local JSON instead of hiding parse failure", () => {
  const result = decodeLocalJson("patternly.test", "{", []);

  assert.equal(result.ok, false);
  assert.deepEqual(result.value, []);

  if (!result.ok) {
    assert.equal(result.issue.key, "patternly.test");
    assert.equal(result.issue.operation, "parse");
    assert.equal(result.issue.message, "Stored local data is not valid JSON.");
  }
});

test("formats unknown storage errors safely", () => {
  assert.equal(getStorageErrorMessage(new Error("Disk unavailable")), "Disk unavailable");
  assert.equal(getStorageErrorMessage("bad"), "Unknown local storage error.");
});
