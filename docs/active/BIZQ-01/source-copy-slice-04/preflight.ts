import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../../../src/content/canonical/runtimeCatalog";
import { prepareCanonicalOptionOrder } from "../../../../src/application/canonical/canonicalOptionOrder";
import { buildCanonicalInteractionViewModel } from "../../../../src/application/canonical/canonicalInteractionPresentation";

const questionId = "alg-contrast-binary-scan-correctness-006";
const trackPromise = loadCanonicalRuntimeCatalog().then((catalog) => catalog.getTrack("coding-interview-dsa-problem-solving"));

test("named strategy prompt remains clear when the saved choice order moves scan away from display A", async () => {
  const track = await trackPromise;
  const question = track.getQuestion(questionId)!;
  let displayOrder: readonly string[] = [];
  for (let index = 0; index < 24; index += 1) {
    const order = prepareCanonicalOptionOrder(question, `source-copy-preflight:${index}:occurrence:0`, track);
    if (order[0] !== "scan") { displayOrder = order; break; }
  }
  assert.ok(displayOrder.length > 0);
  const vm = buildCanonicalInteractionViewModel(question, null, displayOrder);
  assert.equal(vm.renderer.kind, "choice");
  if (vm.renderer.kind !== "choice") throw new Error("Expected actual choice view model.");
  const scanIndex = vm.renderer.options.findIndex((option) => option.id === "scan");
  // PracticeResponseControls derives this letter from index; this is source/VM proof, not a React/native render.
  console.log(JSON.stringify({ questionId, savedOrder: displayOrder, scanDisplayLetter: String.fromCharCode(65 + scanIndex), prompt: question.prompt, practicePoolMembership: track.modes.filter((mode) => track.getPool(mode.modeId).some((item) => item.questionId === questionId)).map((mode) => mode.modeId) }));
  assert.ok(scanIndex > 0);
  assert.doesNotMatch(question.prompt, /\bOption\s+[AB]\b/, "Name strategies by their meaning rather than display letters.");
});

test("authored Details use the same explicit strategy names independent of option positions", async () => {
  const track = await trackPromise;
  const question = track.getQuestion(questionId)!;
  const details = JSON.stringify(question.feedback.details);
  assert.doesNotMatch(details, /\bStrategy\s+[AB]\b|\bB(?:\\u2019|’)s\b|\bbecause\s+B\b/, "Keep strategy references independent of display letters.");
});
