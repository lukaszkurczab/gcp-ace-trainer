import assert from "node:assert/strict";
import test from "node:test";

import {
  installPersist13MaterializedJournalPauseHook,
  installPersist13AdvanceMaterializedPauseHook,
  installPersist13SubmitClearNextPauseHook,
  installPersist13VerifyClearPauseHook,
  isPersist13ResetPauseHookCold,
  pausePersist13ResetAfterMaterialization,
  pausePersist13BeforeJournalClear,
  pausePersist13AfterJournalClear,
  PERSIST13_RESET_PAUSE_STAGE,
  PERSIST13_VERIFY_CLEAR_PAUSE_STAGE,
  PERSIST13_SUBMIT_CLEAR_NEXT_STAGE,
  PERSIST13_ADVANCE_MATERIALIZED_STAGE,
} from "./persist13ResetPauseHook";

const RUN_ID = "4d753a2e-b95f-4cb2-a6b0-f6697b331730";

test("materialized journal pause is seed-only, scenario-bound and one-shot for submit outcomes", async () => {
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const original = Object.fromEntries([
    "EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE",
    "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE",
    "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID",
    "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO",
  ].map((name) => [name, process.env[name]]));
  const setEnvironment = (scenario: string | undefined, mode = "seed") => {
    process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = mode;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = RUN_ID;
    if (scenario === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO;
    else process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = scenario;
  };

  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  try {
    setEnvironment(undefined);
    assert.throws(() => installPersist13MaterializedJournalPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("journal_materialized", "recover");
    assert.throws(() => installPersist13MaterializedJournalPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("journal_materialized");

    let reached = 0;
    installPersist13MaterializedJournalPauseHook(async (stage) => {
      reached += 1;
      assert.equal(stage, PERSIST13_RESET_PAUSE_STAGE);
      throw new Error("persist13_materialized_test_pause");
    });
    assert.equal(isPersist13ResetPauseHookCold(), false);
    await pausePersist13ResetAfterMaterialization("complete_training_session");
    assert.equal(reached, 0);
    await assert.rejects(pausePersist13ResetAfterMaterialization("submit_training_outcome"), /persist13_materialized_test_pause/u);
    assert.equal(reached, 1);
    assert.equal(isPersist13ResetPauseHookCold(), true);
    await pausePersist13ResetAfterMaterialization("submit_training_outcome");
    assert.equal(reached, 1);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    for (const [name, value] of Object.entries(original)) {
      if (typeof value === "string") process.env[name] = value;
      else delete process.env[name];
    }
  }
});

test("submit-clear-next pause is seed-only, exact-operation and synchronously absent unless installed", async () => {
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const names = ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO"];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const setEnvironment = (mode: string, scenario: string) => {
    process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = mode;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = RUN_ID;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = scenario;
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  try {
    setEnvironment("recover", "submit_clear_next");
    assert.throws(() => installPersist13SubmitClearNextPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("seed", "submit_clear_next");
    assert.equal(pausePersist13AfterJournalClear("complete_training_session"), undefined);
    assert.equal(pausePersist13AfterJournalClear("submit_training_outcome"), undefined);
    let reached = 0;
    installPersist13SubmitClearNextPauseHook(async (stage) => {
      reached += 1;
      assert.equal(stage, PERSIST13_SUBMIT_CLEAR_NEXT_STAGE);
      throw new Error("persist13_submit_clear_next_test_pause");
    });
    assert.equal(isPersist13ResetPauseHookCold(), false);
    const pause = pausePersist13AfterJournalClear("submit_training_outcome");
    assert.ok(pause);
    await assert.rejects(pause, /persist13_submit_clear_next_test_pause/u);
    assert.equal(reached, 1);
    assert.equal(isPersist13ResetPauseHookCold(), true);
    assert.equal(pausePersist13AfterJournalClear("submit_training_outcome"), undefined);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    for (const [name, value] of Object.entries(original)) {
      if (typeof value === "string") process.env[name] = value;
      else delete process.env[name];
    }
  }
});

test("advance materialized pause is gated by the exact seed scenario and one-shot operation", async () => {
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const names = ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO"];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const setEnvironment = (mode: string, scenario: string) => {
    process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = mode;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = RUN_ID;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = scenario;
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  try {
    setEnvironment("seed", "submit_clear_next");
    assert.throws(() => installPersist13AdvanceMaterializedPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("recover", "advance_materialized");
    assert.throws(() => installPersist13AdvanceMaterializedPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("seed", "advance_materialized");
    let reached = 0;
    installPersist13AdvanceMaterializedPauseHook(async (stage) => {
      reached += 1;
      assert.equal(stage, PERSIST13_ADVANCE_MATERIALIZED_STAGE);
      throw new Error("persist13_advance_materialized_test_pause");
    });
    assert.equal(isPersist13ResetPauseHookCold(), false);
    await pausePersist13ResetAfterMaterialization("submit_training_outcome");
    assert.equal(reached, 0);
    await assert.rejects(pausePersist13ResetAfterMaterialization("advance_training_session"), /persist13_advance_materialized_test_pause/u);
    assert.equal(reached, 1);
    assert.equal(isPersist13ResetPauseHookCold(), true);
    await pausePersist13ResetAfterMaterialization("advance_training_session");
    assert.equal(reached, 1);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    for (const [name, value] of Object.entries(original)) {
      if (typeof value === "string") process.env[name] = value;
      else delete process.env[name];
    }
  }
});

test("verify-clear pause is synchronous no-op unless the exact seeded scenario installs it", async () => {
  const originalDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  const names = ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID", "EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO"];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const setEnvironment = (scenario: string, mode = "seed") => {
    process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = "smoke";
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE = mode;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID = RUN_ID;
    process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO = scenario;
  };
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
  try {
    setEnvironment("journal_materialized");
    assert.throws(() => installPersist13VerifyClearPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("verify_clear", "recover");
    assert.throws(() => installPersist13VerifyClearPauseHook(async () => new Promise<never>(() => undefined)), /persist13_fixture_disabled/u);
    setEnvironment("verify_clear");
    assert.equal(pausePersist13BeforeJournalClear("submit_training_outcome"), undefined);
    let reached = 0;
    installPersist13VerifyClearPauseHook(async (stage) => {
      reached += 1;
      assert.equal(stage, PERSIST13_VERIFY_CLEAR_PAUSE_STAGE);
      throw new Error("persist13_verify_clear_test_pause");
    });
    assert.equal(isPersist13ResetPauseHookCold(), false);
    assert.equal(pausePersist13BeforeJournalClear("complete_training_session"), undefined);
    const pause = pausePersist13BeforeJournalClear("submit_training_outcome");
    assert.ok(pause);
    await assert.rejects(pause, /persist13_verify_clear_test_pause/u);
    assert.equal(reached, 1);
    assert.equal(isPersist13ResetPauseHookCold(), true);
    assert.equal(pausePersist13BeforeJournalClear("submit_training_outcome"), undefined);
  } finally {
    if (originalDev) Object.defineProperty(globalThis, "__DEV__", originalDev);
    else Reflect.deleteProperty(globalThis, "__DEV__");
    for (const [name, value] of Object.entries(original)) {
      if (typeof value === "string") process.env[name] = value;
      else delete process.env[name];
    }
  }
});
