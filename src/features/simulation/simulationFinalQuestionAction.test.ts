import assert from "node:assert/strict";
import test from "node:test";

import { simulationPrimaryAction } from "./simulationProjection";

test("final simulation action saves an answered response before finish and lets an unanswered final occurrence finish", () => {
  let saves = 0;
  let saveAndContinues = 0;
  let finishes = 0;
  const callbacks = { onSave: () => { saves += 1; }, onSaveAndContinue: () => { saveAndContinues += 1; }, onFinish: () => { finishes += 1; } };

  const answeredFinal = simulationPrimaryAction({ complete: true, finalOccurrence: true, responseChanged: true, ...callbacks });
  assert.deepEqual({ id: answeredFinal.id, label: answeredFinal.label, disabled: answeredFinal.disabled }, { id: "save-response", label: "Save response", disabled: false });
  answeredFinal.onPress();
  assert.deepEqual({ saves, saveAndContinues, finishes }, { saves: 1, saveAndContinues: 0, finishes: 0 });

  const savedFinal = simulationPrimaryAction({ complete: true, finalOccurrence: true, responseChanged: false, ...callbacks });
  assert.deepEqual({ id: savedFinal.id, label: savedFinal.label, disabled: savedFinal.disabled }, { id: "finish-simulation", label: "Finish simulation", disabled: false });
  savedFinal.onPress();

  const unansweredFinal = simulationPrimaryAction({ complete: false, finalOccurrence: true, responseChanged: false, ...callbacks });
  assert.deepEqual({ id: unansweredFinal.id, label: unansweredFinal.label, disabled: unansweredFinal.disabled }, { id: "finish-simulation", label: "Finish simulation", disabled: false });
  unansweredFinal.onPress();
  assert.deepEqual({ saves, saveAndContinues, finishes }, { saves: 1, saveAndContinues: 0, finishes: 2 });
});
