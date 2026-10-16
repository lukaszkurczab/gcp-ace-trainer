import assert from "node:assert/strict";
import test from "node:test";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { readPremiumTestingAccess, writePremiumTestingAccess } from "./premiumTestingRepository";

const key = "patternly:test-runtime:v1:premium-access";
test("device-local Premium flag preserves its exact key/value and unrelated records", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  storage.setString("unrelated", "preserved");
  assert.equal(readPremiumTestingAccess(), false);
  writePremiumTestingAccess(true);
  assert.deepEqual(storage.snapshot(), new Map([["unrelated", "preserved"], [key, "enabled"]]));
  assert.equal(readPremiumTestingAccess(), true);
  writePremiumTestingAccess(false);
  assert.deepEqual(storage.snapshot(), new Map([["unrelated", "preserved"]]));
  assert.equal(readPremiumTestingAccess(), false);
});
test("the stored flag grants only the exact enabled value", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  for (const value of ["true", "disabled", "ENABLED", "enabled ", ""]) {
    storage.setString(key, value);
    assert.equal(readPremiumTestingAccess(), false);
  }
});
