import assert from "node:assert/strict";
import test from "node:test";
import { createContentPreparationAttempt } from "./contentPreparationAttempt";

test("timeout permits one later validated success from the same live attempt", () => {
  const attempt = createContentPreparationAttempt(() => true, () => true);
  assert.equal(attempt.timeout(), true);
  assert.equal(attempt.pending(), false);
  assert.equal(attempt.timeout(), false);
  assert.equal(attempt.complete(false), false);
  assert.equal(attempt.complete(true), true);
  assert.equal(attempt.complete(true), false);
});

test("late completion cannot cross retry, handoff, profile or unmount boundaries", () => {
  for (const boundary of ["retry", "handoff", "profile", "unmount"] as const) {
    let generation = 1, handoffCurrent = true, profileCurrent = true;
    const attempt = createContentPreparationAttempt(() => generation === 1 && handoffCurrent, () => profileCurrent);
    assert.equal(attempt.timeout(), true);
    if (boundary === "retry") generation++; // before effect cleanup
    if (boundary === "handoff") handoffCurrent = false;
    if (boundary === "profile") profileCurrent = false;
    if (boundary === "unmount") attempt.cancel();
    assert.equal(attempt.complete(true), false, boundary);
  }
});

test("ordinary completion remains terminal and does not require a late-success lease", () => {
  for (const successful of [true, false]) {
    const attempt = createContentPreparationAttempt(() => true, () => false);
    assert.equal(attempt.pending(), true);
    assert.equal(attempt.complete(successful), true);
    assert.equal(attempt.timeout(), false);
    assert.equal(attempt.complete(true), false);
  }
});
