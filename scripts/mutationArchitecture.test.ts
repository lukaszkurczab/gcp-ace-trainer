import assert from "node:assert/strict";
import test from "node:test";
import { checkRepository, formatViolations } from "./architecture/checkBoundaries";

const { violations } = checkRepository(process.cwd(), "typescript");

test("resolved persistence and scoring owners exclude presentation, family semantics and lifecycle", () => {
  const mutationViolations = violations.filter(({ rule }) => /UI delegates|family isolation|lifecycle consumes|journal uses|public storage/u.test(rule));
  assert.deepEqual(mutationViolations, [], formatViolations(mutationViolations));
});


test("Premium purchase composition leaves UI without a persistence implementation dependency", () => {
  const premium = violations.filter(({ path }) => path[0] === "src/features/premium/PremiumPurchaseScreen.tsx");
  assert.deepEqual(premium, [], formatViolations(premium));
});
