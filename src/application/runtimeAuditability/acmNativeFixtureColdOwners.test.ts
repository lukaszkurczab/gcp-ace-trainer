import assert from "node:assert/strict";
import test from "node:test";
import { isACMNativeFixtureLifecycleOwnerCold } from "../trainingLifecycle/applicationLifecycle";
import { isACMNativeFixtureTimerOwnerCold } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { isACMNativeFixtureStorageOwnerCold } from "../../infrastructure/storage/mmkvClient";

const runUUID = "123e4567-e89b-42d3-a456-426614174000";

test("native ACM cold-owner guards require the same development smoke run before any owner is initialized", () => {
  const original = {
    development: (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__,
    mode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    enabled: process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE,
    runUUID: process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID,
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
  process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE = "1";
  process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID = runUUID;
  try {
    for (const guard of [isACMNativeFixtureStorageOwnerCold, isACMNativeFixtureLifecycleOwnerCold, isACMNativeFixtureTimerOwnerCold]) {
      assert.equal(guard(runUUID), true);
      assert.equal(guard("123e4567-e89b-42d3-a456-426614174001"), false);
    }
    Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: false });
    assert.equal(isACMNativeFixtureStorageOwnerCold(runUUID), false);
    assert.equal(isACMNativeFixtureLifecycleOwnerCold(runUUID), false);
    assert.equal(isACMNativeFixtureTimerOwnerCold(runUUID), false);
  } finally {
    if (original.development === undefined) delete (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
    else Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: original.development });
    for (const [name, value] of [
      ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", original.mode],
      ["EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE", original.enabled],
      ["EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID", original.runUUID],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
