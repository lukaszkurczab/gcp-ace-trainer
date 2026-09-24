import assert from "node:assert/strict";
import test from "node:test";
import { canStartManualRetry, createManualRetryLimit, MANUAL_RETRY_FAILURE_LIMIT, reserveManualRetry, settleManualRetry } from "./manualRetryLimit";

test("counts only settled failed manual attempts and hides retry after five failures", () => {
  const episode = createManualRetryLimit();
  assert.equal(canStartManualRetry(episode), true, "automatic bootstrap does not reserve a manual retry");

  for (let failedAttempt = 1; failedAttempt <= MANUAL_RETRY_FAILURE_LIMIT; failedAttempt += 1) {
    assert.equal(reserveManualRetry(episode), true);
    assert.equal(reserveManualRetry(episode), false, "duplicate taps during a retry are ignored");
    assert.equal(episode.failedAttempts, failedAttempt - 1, "in-flight retries are not counted before failure");
    settleManualRetry(episode, false);
    settleManualRetry(episode, false);
    assert.equal(episode.failedAttempts, failedAttempt, "a settled failure is counted exactly once");
    assert.equal(canStartManualRetry(episode), failedAttempt < MANUAL_RETRY_FAILURE_LIMIT);
  }

  assert.equal(reserveManualRetry(episode), false, "the sixth retry is never started");
});

test("success closes the recovery episode and re-enables retries", () => {
  const episode = createManualRetryLimit();
  for (let i = 0; i < MANUAL_RETRY_FAILURE_LIMIT - 1; i += 1) {
    assert.equal(reserveManualRetry(episode), true);
    settleManualRetry(episode, false);
  }
  assert.equal(reserveManualRetry(episode), true);
  settleManualRetry(episode, true);
  assert.equal(episode.failedAttempts, 0);
  assert.equal(episode.inFlight, false);
  assert.equal(canStartManualRetry(episode), true);
});

test("background and rerender do not reset the process-local episode state", () => {
  const episode = createManualRetryLimit();
  assert.equal(reserveManualRetry(episode), true);
  settleManualRetry(episode, false);
  assert.equal(episode.failedAttempts, 1);
  assert.equal(canStartManualRetry(episode), true);
});
