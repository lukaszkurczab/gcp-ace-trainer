import assert from "node:assert/strict";
import test from "node:test";

import { getCodingInterviewDeclaredScopeOptions } from "../src/application/coding-interview";
import { ALGORITHM_MODE_IDS } from "../src/tracks/coding-interview";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

test("direct entry to excluded Algorithms declared-scope modes fails without substitution", async () => {
  await prepareBundledTestPackages();
  for (const modeId of [ALGORITHM_MODE_IDS.recognizePatterns, ALGORITHM_MODE_IDS.contrastPractice, ALGORITHM_MODE_IDS.independentPractice]) {
    assert.throws(() => getCodingInterviewDeclaredScopeOptions({ modeId }), /unavailable in package/u);
  }
});
