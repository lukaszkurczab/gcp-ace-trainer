import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateBundledContent } from "../src/content/application";
import { runtimeSelectors } from "../src/testing/runtimeSelectors";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
} from "../src/tracks/algorithms";
import { selectAlgorithmSessionPlan } from "../src/tracks/algorithms/algorithmSessionSelection";

const flow = readFileSync(".maestro/user-testing/algorithms-core-journey.yaml", "utf8");
const sessionId = "algorithms:algorithms-independent-practice:1";

test("user-testing core journey executes the exact representative session, resume, summary, and progress evidence", async () => {
  await validateBundledContent();
  const selection = selectAlgorithmSessionPlan({
    mode: "algorithms-independent-practice",
    sessionLength: 10,
    scope: { interleavedScopeId: "hash-map-and-set-node-v1" },
  });

  assert.equal(selection.items.length, 10);
  assert.match(flow, new RegExp(escape(runtimeSelectors.practice.modeCard("algorithms-independent-practice"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.practice.declaredScope("hash_map_and_set"))));
  assert.match(flow, /assertVisible: "Question 1 of 10"/);

  let priorQuestionIndex = -1;
  for (const item of selection.items) {
    const questionSelector = runtimeSelectors.session.question(item.id);
    const questionIndex = flow.indexOf(questionSelector);
    assert.ok(questionIndex > priorQuestionIndex, `${item.id} must appear in canonical session order`);
    priorQuestionIndex = questionIndex;

    assert.match(flow, new RegExp(escape(runtimeSelectors.session.submit(item.id))));
    assert.match(flow, new RegExp(escape(runtimeSelectors.session.result(item.id, "correct"))));
    assert.match(flow, new RegExp(escape(runtimeSelectors.session.continue(item.id))));

    if (isAlgorithmChoiceQuestion(item)) {
      for (const acceptedOptionId of item.interaction.acceptedOptionIds) {
        assert.match(flow, new RegExp(escape(runtimeSelectors.session.option(item.id, acceptedOptionId))));
      }
    } else if (isAlgorithmComplexityQuestion(item)) {
      for (const dimensionId of item.interaction.checkedDimensions) {
        const acceptedValue = item.interaction.acceptedValuesByDimension[dimensionId]?.[0];
        assert.ok(acceptedValue, `${item.id} must declare an accepted ${dimensionId} value`);
        assert.match(flow, new RegExp(escape(runtimeSelectors.session.complexityValue(item.id, dimensionId, acceptedValue))));
      }
    } else {
      assert.equal(isAlgorithmOrderingQuestion(item), true);
      assert.match(flow, new RegExp(escape(runtimeSelectors.session.option(item.id, item.interaction.elements[0]!.id))));
    }
  }

  assert.ok(
    flow.indexOf(runtimeSelectors.session.question(selection.items[0]!.id))
      < flow.indexOf(runtimeSelectors.session.leave(sessionId)),
  );
  assert.ok(
    flow.indexOf(runtimeSelectors.session.leave(sessionId))
      < flow.indexOf(runtimeSelectors.resume.card(sessionId)),
  );
  assert.ok(
    flow.indexOf(runtimeSelectors.resume.continue(sessionId))
      < flow.lastIndexOf(runtimeSelectors.session.question(selection.items[1]!.id)),
  );
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.root(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.configuration(sessionId, 10, "afterEachAnswer"))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.backToPractice(sessionId))));
  assert.match(flow, new RegExp(escape(runtimeSelectors.progress.root())));
  assert.match(flow, new RegExp(escape(runtimeSelectors.progress.node("hash_map_and_set"))));
});

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
