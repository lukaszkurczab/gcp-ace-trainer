import assert from "node:assert/strict";
import test from "node:test";

import { getCodingInterviewDeclaredScopeOptions } from "../src/application/coding-interview";
import { validateBundledContent } from "../src/content/application";
import { ALGORITHM_MODE_IDS } from "../src/tracks/coding-interview";

test("Algorithms declared-scope options expose only validated structures with one roadmap topic", async () => {
  await validateBundledContent();
  const recognition = getCodingInterviewDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.recognizePatterns });
  const contrast = getCodingInterviewDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.contrastPractice });
  const independent = getCodingInterviewDeclaredScopeOptions({ modeId: ALGORITHM_MODE_IDS.independentPractice });

  assert.ok(recognition.length > 0);
  assert.ok(contrast.length > 0);
  assert.ok(independent.length > 0);
  assert.ok(recognition.every((option) => typeof option.scope.recognitionSetId === "string" && !option.scope.contrastRoadmapNodeId && !option.scope.interleavedScopeId && option.topicId.length > 0 && option.title.length > 0));
  assert.ok(contrast.every((option) => typeof option.scope.contrastRoadmapNodeId === "string" && !option.scope.recognitionSetId && !option.scope.interleavedScopeId && option.detail.length > 0));
  assert.ok(independent.every((option) => typeof option.scope.interleavedScopeId === "string" && !option.scope.recognitionSetId && !option.scope.contrastRoadmapNodeId && option.topicId.length > 0));
});
