import assert from "node:assert/strict";
import test from "node:test";

import {
  DEVELOPMENT_RESET_LEARNING_STATE_URL,
  handleRuntimeAuditabilityUrl,
  parseRuntimeAuditabilityCommand,
} from "../src/application/runtimeAuditability/developmentResetCommand";
import { installTrainingLifecycleUseCases, type TrainingLifecycleUseCases } from "../src/application/trainingLifecycle";

const developmentFlag = globalThis as typeof globalThis & { __DEV__?: boolean };

function installLifecycleThatCountsResets() {
  let resetCalls = 0;
  installTrainingLifecycleUseCases({
    async resetLearningState() { resetCalls += 1; },
  } as TrainingLifecycleUseCases);
  return () => resetCalls;
}

function setDevelopment(value: boolean | undefined) {
  if (value === undefined) delete developmentFlag.__DEV__;
  else developmentFlag.__DEV__ = value;
}

test("runtime-audit reset parser recognizes only the documented command", () => {
  assert.deepEqual(parseRuntimeAuditabilityCommand(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "reset_learning_state" });
  assert.equal(parseRuntimeAuditabilityCommand("com.lkurczab.gcpacetrainer:/audit/reset-learning-state"), null);
  assert.equal(parseRuntimeAuditabilityCommand(`${DEVELOPMENT_RESET_LEARNING_STATE_URL}?again=true`), null);
  assert.equal(parseRuntimeAuditabilityCommand("https://example.test/audit/reset-learning-state"), null);
  assert.equal(parseRuntimeAuditabilityCommand(null), null);
});

test("unsupported and malformed runtime-audit URLs do not invoke reset", async () => {
  const previous = developmentFlag.__DEV__;
  setDevelopment(true);
  try {
    const resetCalls = installLifecycleThatCountsResets();
    assert.deepEqual(await handleRuntimeAuditabilityUrl("com.lkurczab.gcpacetrainer://audit/reset-learning-state#bad"), { kind: "ignored" });
    assert.deepEqual(await handleRuntimeAuditabilityUrl("com.lkurczab.gcpacetrainer://audit/other"), { kind: "ignored" });
    assert.equal(resetCalls(), 0);
  } finally {
    setDevelopment(previous);
  }
});

test("runtime-audit reset is unavailable in production and reaches only the lifecycle facade in development", async () => {
  const previous = developmentFlag.__DEV__;
  try {
    const resetCalls = installLifecycleThatCountsResets();
    setDevelopment(false);
    assert.deepEqual(await handleRuntimeAuditabilityUrl(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "unavailable_in_production" });
    assert.equal(resetCalls(), 0);

    setDevelopment(true);
    assert.deepEqual(await handleRuntimeAuditabilityUrl(DEVELOPMENT_RESET_LEARNING_STATE_URL), { kind: "reset_learning_state" });
    assert.equal(resetCalls(), 1);
  } finally {
    setDevelopment(previous);
  }
});
