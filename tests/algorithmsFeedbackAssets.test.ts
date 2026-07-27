import assert from "node:assert/strict";
import test from "node:test";

import { hasAlgorithmFeedbackAsset, resolveAlgorithmFeedbackAsset } from "../src/content/algorithmsFeedbackAssets";

test("generated local asset registry resolves the hash-pinned Algorithms feedback diagram", () => {
  const id = "algorithms/complexity-linear-vs-nested";
  assert.equal(hasAlgorithmFeedbackAsset(id), true);
  assert.equal(hasAlgorithmFeedbackAsset("algorithms/not-declared"), false);
  const asset = resolveAlgorithmFeedbackAsset(id);
  assert.equal(asset.sha256, "890413bf6613f20db0120a700511b5493eccad334619d006641662716f1708f5");
  assert.match(asset.xml, /Sequential scans add, nested scans multiply/);
  assert.doesNotMatch(asset.xml, /(?:href|src)=["']https?:\/\//);
  assert.throws(() => resolveAlgorithmFeedbackAsset("algorithms/not-declared"), /Unknown local Algorithms feedback asset/);
});
