import assert from "node:assert/strict";
import test from "node:test";

import {
  DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL,
  DEVELOPMENT_RESET_LEARNING_STATE_URL,
  handleRuntimeAuditabilityUrl,
  parseRuntimeAuditabilityCommand,
} from "../src/application/runtimeAuditability/developmentResetCommand";
import { installTrainingLifecycleUseCases, type TrainingLifecycleUseCases } from "../src/application/trainingLifecycle";
import { installMemoryStorage } from "./journalTestSupport";

const developmentFlag = globalThis as typeof globalThis & { __DEV__?: boolean };

function installLifecycleThatCountsResets() {
  let resetCalls = 0;
  let advancedMilliseconds = 0;
  installTrainingLifecycleUseCases({
    async resetLearningState() { resetCalls += 1; },
    advanceRuntimeAuditabilityClock(milliseconds: number) { advancedMilliseconds += milliseconds; return "2026-07-29T00:00:00.000Z"; },
  } as TrainingLifecycleUseCases);
  return { advancedMilliseconds: () => advancedMilliseconds, resetCalls: () => resetCalls };
}

function setDevelopment(value: boolean | undefined) {
  if (value === undefined) delete developmentFlag.__DEV__;
  else developmentFlag.__DEV__ = value;
}

test("runtime-audit parser recognizes only documented reset and clock-advance commands", () => {
  const obsoleteScheme = `com.lkurczab.${["gcp", "ace", "trainer"].join("")}`;

  assert.deepEqual(parseRuntimeAuditabilityCommand(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "reset_learning_state" });
  assert.deepEqual(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=604800000`), { kind: "advance_clock", milliseconds: 604800000 });
  assert.equal(parseRuntimeAuditabilityCommand("com.lkurczab.patternly:/audit/reset-learning-state"), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${obsoleteScheme}://audit/reset-learning-state`), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_RESET_LEARNING_STATE_URL}?again=true`), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=0`), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=604800000&again=true`), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=604800000#fragment`), null);
  assert.equal(parseRuntimeAuditabilityCommand("https://example.test/audit/reset-learning-state"), null);
  assert.equal(parseRuntimeAuditabilityCommand(null), null);
});

test("unsupported and malformed runtime-audit URLs do not invoke reset", async () => {
  const previous = developmentFlag.__DEV__;
  setDevelopment(true);
  try {
    const lifecycle = installLifecycleThatCountsResets();
    assert.deepEqual(await handleRuntimeAuditabilityUrl("com.lkurczab.patternly://audit/reset-learning-state#bad"), { kind: "ignored" });
    assert.deepEqual(await handleRuntimeAuditabilityUrl("com.lkurczab.patternly://audit/other"), { kind: "ignored" });
    assert.equal(lifecycle.resetCalls(), 0);
    assert.equal(lifecycle.advancedMilliseconds(), 0);
  } finally {
    setDevelopment(previous);
  }
});

test("runtime-audit reset is unavailable in production and reaches only the lifecycle facade in development", async () => {
  const previous = developmentFlag.__DEV__;
  try {
    const lifecycle = installLifecycleThatCountsResets();
    setDevelopment(false);
    assert.deepEqual(await handleRuntimeAuditabilityUrl(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "unavailable_in_production" });
    assert.deepEqual(await handleRuntimeAuditabilityUrl(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=604800000`), { kind: "unavailable_in_production" });
    assert.equal(lifecycle.resetCalls(), 0);
    assert.equal(lifecycle.advancedMilliseconds(), 0);

    setDevelopment(true);
    assert.deepEqual(await handleRuntimeAuditabilityUrl(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "reset_learning_state" });
    assert.deepEqual(await handleRuntimeAuditabilityUrl(`${DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL}?milliseconds=604800000`), { kind: "advance_clock", now: "2026-07-29T00:00:00.000Z" });
    assert.equal(lifecycle.resetCalls(), 1);
    assert.equal(lifecycle.advancedMilliseconds(), 604800000);
  } finally {
    setDevelopment(previous);
  }
});

test("development reset still restores a clean baseline when an interrupted journal cannot recover", async () => {
  const previous = developmentFlag.__DEV__;
  setDevelopment(true);
  try {
    installMemoryStorage();
    installTrainingLifecycleUseCases({
      async resetLearningState() { throw new Error("interrupted journal cannot recover"); },
    } as unknown as TrainingLifecycleUseCases);
    assert.deepEqual(await handleRuntimeAuditabilityUrl(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "reset_learning_state" });
  } finally {
    setDevelopment(previous);
  }
});
