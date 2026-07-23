import assert from "node:assert/strict";
import test from "node:test";

import { simulationSaveAndContinueAction } from "../src/features/simulation/simulationProjection";

test("non-final simulation CTA labels, disables, and invokes only save-and-continue", () => {
  let saves = 0;
  let saveAndContinues = 0;
  const incomplete = simulationSaveAndContinueAction({ complete: false, finalOccurrence: false, onSave: () => { saves += 1; }, onSaveAndContinue: () => { saveAndContinues += 1; } });
  assert.deepEqual({ id: incomplete.id, label: incomplete.label, disabled: incomplete.disabled }, { id: "save-and-continue", label: "Save and continue", disabled: true });

  const complete = simulationSaveAndContinueAction({ complete: true, finalOccurrence: false, onSave: () => { saves += 1; }, onSaveAndContinue: () => { saveAndContinues += 1; } });
  complete.onPress();
  assert.equal(saves, 0);
  assert.equal(saveAndContinues, 1);
});
