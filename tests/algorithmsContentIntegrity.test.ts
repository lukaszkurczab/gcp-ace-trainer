import assert from "node:assert/strict";
import test from "node:test";
import { algorithmContentGroups, algorithmContentItems, algorithmContentManifest, validateAlgorithmQuestion } from "../src/tracks/algorithms/content";

const approvedPreStage1Removals = [
  "alg-complexity-big-o-basics-011-check",
  "alg-complexity-big-o-basics-017-check",
  "alg-complexity-big-o-basics-018-check",
  "alg-complexity-big-o-basics-020-check",
  "alg-complexity-big-o-basics-021-check",
  "alg-complexity-big-o-basics-022-check",
  "alg-complexity-big-o-basics-023-check",
  "alg-complexity-big-o-basics-024-check",
  "alg-complexity-big-o-basics-025-check",
];

test("Algorithms canonical manifest locks the approved 1,683-item Stage 1 baseline", () => {
  assert.equal(algorithmContentItems.length, 1_683);
  assert.equal(algorithmContentManifest.itemCount, 1_683);
  assert.equal(algorithmContentManifest.groups.reduce((sum, group) => sum + group.itemCount, 0), 1_683);
  assert.equal(new Set(algorithmContentManifest.itemOrder).size, 1_683);
});

test("the nine apparent missing items are documented pre-Stage 1 content-review removals", () => {
  const activeIds = new Set(algorithmContentItems.map((item) => item.id));
  assert.equal(approvedPreStage1Removals.every((id) => !activeIds.has(id)), true);
});

test("all active Algorithms items retain canonical schema and group ownership", () => {
  for (const group of algorithmContentGroups) for (const item of group.questions) validateAlgorithmQuestion(item);
  assert.equal(algorithmContentGroups.every((group) => group.questions.length > 0), true);
});
