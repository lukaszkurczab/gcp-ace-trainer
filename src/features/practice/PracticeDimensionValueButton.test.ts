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
  const expectedValueIds = { auxiliary_space: ["O(1)"], time: ["O(n)"] } as const;
  assert.equal(question.answer.type, "complexity");
  if (question.answer.type !== "complexity") throw new Error("Expected authored complexity answer data.");
  assert.deepEqual(question.answer.selectedValueIdsByDimension, expectedValueIds, "the current fixed-alphabet frequency question has constant auxiliary space and linear scan time");

  let selected: Readonly<Record<string, readonly string[]>> = {};
  const pressValue = (dimensionId: string, valueId: string) => {
    const element = PracticeDimensionValueButton({
      PressableComponent: PressableHost,
      TextComponent: TextHost,
      accessibilityLabel: `${dimensionId} ${valueId}`,
      checked: selected[dimensionId]?.includes(valueId) ?? false,
      editable: true,
      onPress: () => { selected = toggleDimensionSelection(selected, dimensionId, valueId); },
      style: undefined,
      text: valueId,
      textStyle: undefined,
    });
    const pressable = element.props as Readonly<{ disabled: boolean; onPress: () => void }>;
    assert.equal(pressable.disabled, false);
    pressable.onPress();
  };

  pressValue("auxiliary_space", "O(1)");
  pressValue("auxiliary_space", "O(n)");
  assert.deepEqual(selected.auxiliary_space, ["O(1)", "O(n)"]);
  const overselectedResponse = { type: "complexity" as const, selectedValueIdsByDimension: { ...selected, time: expectedValueIds.time } };
  const partial = track.interactions.evaluate(question, overselectedResponse);
  assert.equal(partial.complete, true);
  assert.equal(partial.result?.kind, "partial", "the selected IDs survive the checkbox callback and canonical scoring recognizes the extra dimension value");

  pressValue("auxiliary_space", "O(n)");
  pressValue("time", "O(n)");
  assert.deepEqual(selected, expectedValueIds);
  const evaluation = track.interactions.evaluate(question, { type: "complexity", selectedValueIdsByDimension: selected });
  assert.equal(evaluation.complete, true);
  assert.equal(evaluation.result?.kind, "correct");

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
