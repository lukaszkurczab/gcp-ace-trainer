import assert from "node:assert/strict";
import test from "node:test";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../infrastructure/storage/mmkvClient";
import { hasPremiumTestingAccess, setPremiumTestingAccess } from "./premiumTesting";

const key = "patternly:test-runtime:v1:premium-access";
function runtime(mode: string | undefined, run: (storage: MemoryKeyValueStorage) => void): void {
  const previous = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  if (mode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  try { run(storage); }
  finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = previous;
  }
}

for (const mode of ["release", undefined, "unknown"] as const) test(`Premium test control refuses ${mode ?? "missing"} runtime without storage access`, () => {
  runtime(mode, storage => {
    storage.setString(key, "enabled");
    storage.resetCounters();
    const before = storage.snapshot();
    assert.equal(hasPremiumTestingAccess(), false);
    for (const value of [true, false]) assert.throws(() => setPremiumTestingAccess(value), { message: "Premium testing access is unavailable in this runtime." });
    assert.deepEqual(storage.operations, []);
    assert.deepEqual(storage.snapshot(), before);
  });
});

for (const mode of ["sandbox", "smoke"] as const) test(`Premium test control preserves persistence in ${mode}`, () => {
  runtime(mode, storage => {
    storage.setString("unrelated", "preserved");
    assert.equal(hasPremiumTestingAccess(), false);
    setPremiumTestingAccess(true);
    assert.equal(hasPremiumTestingAccess(), true);
    assert.deepEqual(storage.snapshot(), new Map([["unrelated", "preserved"], [key, "enabled"]]));
    setPremiumTestingAccess(false);
    assert.equal(hasPremiumTestingAccess(), false);
    assert.deepEqual(storage.snapshot(), new Map([["unrelated", "preserved"]]));
  });
});

test("permitted Premium control propagates storage failures and preserves the prior marker", () => {
  runtime("smoke", storage => {
    storage.setString(key, "enabled");
    const before = storage.snapshot();
    storage.setFailurePlan({ kind: "fail_on_key_read", key });
    assert.throws(() => hasPremiumTestingAccess(), /Injected read failure/);
    storage.setFailurePlan({ kind: "fail_on_key_write", key });
    assert.throws(() => setPremiumTestingAccess(true), /Injected write failure/);
    storage.setFailurePlan({ kind: "fail_on_key_remove", key });
    assert.throws(() => setPremiumTestingAccess(false), /Injected remove failure/);
    assert.deepEqual(storage.snapshot(), before);
  });
});
