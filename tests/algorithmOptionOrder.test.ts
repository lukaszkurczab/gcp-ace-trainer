import assert from "node:assert/strict";
import test from "node:test";

import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { getCodingPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import {
  buildAlgorithmInteractionViewModel,
  createAlgorithmOptionOrder,
  isAlgorithmChoiceQuestion,
} from "../src/tracks/coding-interview";

test("choice display order is shuffled once from stable IDs and remains reproducible for resume", async () => {
  await prepareBundledTestPackages();
  const question = getCodingPackageTestCatalog().getItemById("alg-complexity-amortized-001");
  assert.ok(isAlgorithmChoiceQuestion(question));
  const authoredOrder = question.interaction.options.map((option) => option.id);
  const orders = Array.from({ length: 8 }, (_, index) =>
    createAlgorithmOptionOrder(question, `session:occurrence:${index}`),
  );

  assert.deepEqual(orders[0], createAlgorithmOptionOrder(question, "session:occurrence:0"));
  assert.ok(orders.some((order) => order.join("|") !== authoredOrder.join("|")));
  for (const order of orders) assert.deepEqual([...order].sort(), [...authoredOrder].sort());
});

test("interaction rendering follows the persisted order while correctness remains keyed by option ID", async () => {
  await prepareBundledTestPackages();
  const question = getCodingPackageTestCatalog().getItemById("alg-complexity-amortized-001");
  assert.ok(isAlgorithmChoiceQuestion(question));
  const reversed = question.interaction.options.map((option) => option.id).reverse();
  const selectedOptionIds = [...question.interaction.acceptedOptionIds];
  const projection = buildAlgorithmInteractionViewModel(
    question,
    { kind: "choice", selectedOptionIds },
    reversed,
  );

  assert.equal(projection.renderer.kind, "choice");
  if (projection.renderer.kind !== "choice") return;
  assert.deepEqual(projection.renderer.options.map((option) => option.id), reversed);
  assert.deepEqual(
    projection.renderer.options.filter((option) => option.selected).map((option) => option.id),
    selectedOptionIds,
  );
});
