import assert from "node:assert/strict";
import test from "node:test";

import { getAlgorithmsDeclaredScopeOptions } from "../src/application/algorithms";
import { validateBundledContent } from "../src/content/application";
import { ALGORITHM_MODE_IDS } from "../src/tracks/algorithms";

test("Algorithms declared-scope options expose only validated structures with one roadmap topic", async () => {
  await validateBundledContent();
  const recognition = getAlgorithmsDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.recognizePatterns });
  const contrast = getAlgorithmsDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.contrastPractice });
  const independent = getAlgorithmsDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.independentPractice });

  assert.ok(recognition.length > 0);
  assert.ok(contrast.length > 0);
  assert.ok(independent.length > 0);
  assert.ok(recognition.every((option) => typeof option.scope.recognitionSetId === "string" && !option.scope.contrastSetId && !option.scope.interleavedScopeId && option.topicId.length > 0 && option.title.length > 0));
  assert.ok(contrast.every((option) => typeof option.scope.contrastSetId === "string" && !option.scope.recognitionSetId && !option.scope.interleavedScopeId && option.detail.length > 0));
  assert.ok(independent.every((option) => typeof option.scope.interleavedScopeId === "string" && !option.scope.recognitionSetId && !option.scope.contrastSetId && option.topicId.length > 0));
});
