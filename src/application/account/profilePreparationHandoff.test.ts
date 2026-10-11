import assert from "node:assert/strict";
import test from "node:test";

import { createProfilePreparationHandoffOwner, ProfilePreparationHandoffSupersededError } from "./profilePreparationHandoff";

test("one frozen token deduplicates in-flight and completed profile handoff calls", async () => {
  const owner = createProfilePreparationHandoffOwner<string>();
  const token = owner.begin();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let operations = 0;

  const first = owner.run(token, async () => { operations += 1; await pending; return "done"; });
  const concurrent = owner.run(token, async () => { operations += 1; return "wrong"; });
  assert.strictEqual(concurrent, first);
  await Promise.resolve();
  assert.equal(operations, 1);
  release();
  assert.equal(await first, "done");
  assert.strictEqual(owner.run(token, async () => { operations += 1; return "wrong"; }), first);
  assert.equal(operations, 1);
});

test("a newer profile attempt invalidates stale completion before its callback runs", async () => {
  const owner = createProfilePreparationHandoffOwner<void>();
  const first = owner.begin();
  assert.equal(Object.isFrozen(first), true);
  const second = owner.begin();
  let staleOperations = 0;

  await assert.rejects(owner.run(first, async () => { staleOperations += 1; }), ProfilePreparationHandoffSupersededError);
  assert.equal(staleOperations, 0);
  assert.equal(first.isCurrent(), false);
  assert.equal(second.isCurrent(), true);
});
