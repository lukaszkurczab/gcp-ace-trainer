import assert from "node:assert/strict";
import test from "node:test";

import { createGuestTransitionLock, runWithGuestTransitionLock } from "./AccountSessionProvider";

test("guest transition lock admits one command and denies a concurrent command before side effects", async () => {
  const lock = createGuestTransitionLock();
  let releaseOperation!: () => void;
  const operationGate = new Promise<void>((resolve) => { releaseOperation = resolve; });
  let sideEffects = 0;

  const first = runWithGuestTransitionLock(lock, "denied", async () => {
    sideEffects += 1;
    await operationGate;
    return "completed";
  });
  const second = await runWithGuestTransitionLock(lock, "denied", async () => {
    sideEffects += 1;
    return "completed";
  });

  assert.equal(second, "denied");
  assert.equal(sideEffects, 1);
  releaseOperation();
  assert.equal(await first, "completed");
});

test("guest transition lock releases after both success and failure", async () => {
  const lock = createGuestTransitionLock();

  assert.equal(await runWithGuestTransitionLock(lock, "denied", async () => "success"), "success");
  await assert.rejects(
    runWithGuestTransitionLock(lock, "denied", async () => { throw new Error("expected"); }),
    /expected/,
  );
  assert.equal(await runWithGuestTransitionLock(lock, "denied", async () => "after-failure"), "after-failure");
});
