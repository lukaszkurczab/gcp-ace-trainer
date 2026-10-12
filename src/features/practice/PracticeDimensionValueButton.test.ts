import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";

import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain/tracks/trackRegistry";
import { PracticeDimensionValueButton } from "./PracticeDimensionValueButton";
import { toggleDimensionSelection } from "./practiceSessionPresentation";

test("the production dimension checkbox callback retains every selected ID through canonical scoring", async () => {
  const PressableHost = (props: Record<string, unknown>) => createElement("pressable", props);
  const TextHost = (props: Record<string, unknown>) => createElement("text", props);
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(CODING_INTERVIEW_TRACK_ID);
  const question = track.getQuestion("alg-arrays-frequency-state-016");
  assert.ok(question);
  assert.equal(question.interaction.type, "complexity");
  if (question.interaction.type !== "complexity") throw new Error("Expected the authored complexity item.");

  let selected: Readonly<Record<string, readonly string[]>> = {};
  const pressValue = (valueId: string) => {
    const element = PracticeDimensionValueButton({
      PressableComponent: PressableHost,
      TextComponent: TextHost,
      accessibilityLabel: `Auxiliary space ${valueId}`,
      checked: selected.auxiliary_space?.includes(valueId) ?? false,
      editable: true,
      onPress: () => { selected = toggleDimensionSelection(selected, "auxiliary_space", valueId); },
      style: undefined,
      text: valueId,
      textStyle: undefined,
    });
    const pressable = element.props as Readonly<{ disabled: boolean; onPress: () => void }>;
    assert.equal(pressable.disabled, false);
    pressable.onPress();
  };

  pressValue("O(1)");
  pressValue("O(26)");
  assert.deepEqual(selected.auxiliary_space, ["O(1)", "O(26)"]);
  if (question.answer.type !== "complexity") throw new Error("Expected authored complexity answer data.");
  const timeAnswer = question.answer.selectedValueIdsByDimension.time;
  assert.ok(timeAnswer);
  const fullResponse = { type: "complexity" as const, selectedValueIdsByDimension: { ...selected, time: timeAnswer } };
  const evaluation = track.interactions.evaluate(question, fullResponse);
  assert.equal(evaluation.complete, true);
  assert.equal(evaluation.result?.kind, "correct");

  const oneSelected = { type: "complexity" as const, selectedValueIdsByDimension: { auxiliary_space: ["O(1)"], time: timeAnswer } };
  const partial = track.interactions.evaluate(question, oneSelected);
  assert.equal(partial.complete, true);
  assert.equal(partial.result?.kind, "partial", "one accepted value remains a legal partial answer; the UI does not infer exact cardinality");

  const disabledElement = PracticeDimensionValueButton({
    PressableComponent: PressableHost,
    TextComponent: TextHost,
    accessibilityLabel: "Locked value",
    checked: false,
    editable: false,
    onPress: () => assert.fail("A locked checkbox must not emit a response event"),
    style: undefined,
    text: "O(26)",
    textStyle: undefined,
  });
  assert.equal((disabledElement.props as { disabled: boolean }).disabled, true);
});
