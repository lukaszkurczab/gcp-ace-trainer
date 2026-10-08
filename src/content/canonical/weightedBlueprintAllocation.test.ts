import assert from "node:assert/strict";
import test from "node:test";

import { allocateWeightedBlueprintQuotas } from "./weightedBlueprintAllocation";

const section = (id: string, weightPercent: number, contentDomainId = `domain-${id}`) => ({ id, contentDomainId, weightPercent });
const counts = (total: number, sections: Parameters<typeof allocateWeightedBlueprintQuotas>[1]) =>
  allocateWeightedBlueprintQuotas(total, sections).map(({ questionCount }) => questionCount);

test("allocates synthetic BIZQ05 D02 and D03 weights by exact largest remainders", () => {
  assert.deepEqual(counts(40, [section("a", 25), section("b", 25), section("c", 20), section("d", 20), section("e", 10)]), [10, 10, 8, 8, 4]);
  assert.deepEqual(counts(7, [section("a", 40), section("b", 30), section("c", 20), section("d", 10)]), [3, 2, 1, 1]);
});

test("stable section ID breaks equal remainder ties regardless of blueprint input order", () => {
  const forward = allocateWeightedBlueprintQuotas(1, [section("z", 50), section("a", 50)]);
  const reversed = allocateWeightedBlueprintQuotas(1, [section("a", 50), section("z", 50)]);
  assert.deepEqual(Object.fromEntries(forward.map(({ id, questionCount }) => [id, questionCount])), { z: 0, a: 1 });
  assert.deepEqual(Object.fromEntries(reversed.map(({ id, questionCount }) => [id, questionCount])), { a: 1, z: 0 });
  assert.equal(Object.isFrozen(forward), true);
  assert.ok(forward.every(Object.isFrozen));
});

test("rejects malformed identities, weights, totals, and unsafe products", () => {
  const valid = [section("a", 50), section("b", 50)];
  for (const [total, blueprint] of [
    [0, valid], [-1, valid], [1.5, valid], [1, []],
    [1, [section("a", 40), section("b", 40)]],
    [1, [section("a", -1), section("b", 101)]],
    [1, [section("a", 50.5), section("b", 49.5)]],
    [1, [section("a", 50), section("a", 50, "other")]],
    [1, [section("a", 50), section("b", 50, "domain-a")]],
    [Number.MAX_SAFE_INTEGER, [section("a", 50), section("b", 50)]],
    [1, [section(" ", 50), section("b", 50)]],
    [1, [section("a", 50, " "), section("b", 50)]],
  ] as const) {
    assert.throws(() => allocateWeightedBlueprintQuotas(total, blueprint as Parameters<typeof allocateWeightedBlueprintQuotas>[1]));
  }
});
