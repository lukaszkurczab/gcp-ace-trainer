import assert from "node:assert/strict";
import test from "node:test";

import { requiresPremiumProductMode } from "./premiumProductModePolicy";

test("only declared Premium simulation product modes bypass node-based admission", () => {
  assert.equal(requiresPremiumProductMode("certification-exam-simulation"), true);
  assert.equal(requiresPremiumProductMode("coding-interview-simulation"), true);
  assert.equal(requiresPremiumProductMode("coding-interview-guided-practice"), false);
  assert.equal(requiresPremiumProductMode("design-interview-simulation"), false);
});
