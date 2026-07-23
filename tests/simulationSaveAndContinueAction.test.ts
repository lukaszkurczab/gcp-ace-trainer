import assert from "node:assert/strict";
import test from "node:test";

import { simulationPrimaryAction } from "../src/features/simulation/simulationProjection";

test("non-final simulation CTA labels, disables, and invokes only save-and-continue", () => {
  let saves = 0;
  let saveAndContinues = 0;
  const incomplete = simulationPrimaryAction({ complete: false, finalOccurrence: false, responseChanged: true, onSave: () => { saves += 1; }, onSaveAndContinue: () => { saveAndContinues += 1; }, onFinish: () => undefined });
  assert.deepEqual({ id: incomplete.id, label: incomplete.label, disabled: incomplete.disabled }, { id: "save-and-continue", label: "Save and continue", disabled: true });

  const complete = simulationPrimaryAction({ complete: true, finalOccurrence: false, responseChanged: true, onSave: () => { saves += 1; }, onSaveAndContinue: () => { saveAndContinues += 1; }, onFinish: () => undefined });
  complete.onPress();
  assert.equal(saves, 0);
  assert.equal(saveAndContinues, 1);
});
