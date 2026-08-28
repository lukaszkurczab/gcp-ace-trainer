import assert from "node:assert/strict";
import test from "node:test";

import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { hasPremiumTestingAccess, setPremiumTestingAccess } from "./premiumTestingRepository";

test("Premium testing override is unavailable outside sandbox and local development runtimes", () => {
  const originalMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "release";
  installKeyValueStorageForTests(new MemoryKeyValueStorage());

  try {
    assert.equal(hasPremiumTestingAccess(), false);
    assert.throws(() => setPremiumTestingAccess(true), /unavailable/u);
  } finally {
    if (originalMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = originalMode;
  }
});

test("Premium testing override persists only for a sandbox or local development runtime", () => {
  const originalMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "sandbox";
  installKeyValueStorageForTests(new MemoryKeyValueStorage());

  try {
    assert.equal(hasPremiumTestingAccess(), false);
    setPremiumTestingAccess(true);
    assert.equal(hasPremiumTestingAccess(), true);
    setPremiumTestingAccess(false);
    assert.equal(hasPremiumTestingAccess(), false);
  } finally {
    if (originalMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
    else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = originalMode;
  }
});
