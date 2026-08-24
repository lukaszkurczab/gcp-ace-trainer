import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");

test("active simulation surface fills the viewport and keeps navigator presentation outside the approved active screen", () => {
  assert.match(source, /<View style=\{styles\.root\} testID=/);
  assert.match(source, /root: \{ flex: 1 \}/);
  assert.match(source, /layout=\{projection\.confirmation \? "simulationConfirmation" : savedResponse \? "simulationSaved" : "simulation"\}/);
  assert.match(source, /onPositionPress=\{projection\.state === "editable"/);
  assert.match(source, /actionBar: \{ gap: spacing\.sm, width: "100%" \}/);
  assert.match(source, /questionCard: \{ backgroundColor: "transparent", borderWidth: 0, padding: 0 \}/);
  assert.match(source, /styles\.questionLabel[\s\S]*t\("QUESTION"\)/);
  assert.match(source, /<SimulationQuestionNavigator onDismiss=/);
  assert.match(source, /visible=\{navigatorVisible\}/);
  assert.match(source, /<Modal animationType=\{reduceMotion \? "none" : "slide"\}/);
  assert.match(source, /confirmationSheet:/);
});

test("simulation confirmation reuses the session chrome owner with its Figma frozen-state geometry", () => {
  assert.match(source, /layout=\{projection\.confirmation \? "simulationConfirmation"/);
  const shell = readFileSync("src/features/coding-interview/session/SessionShell.tsx", "utf8");
  assert.match(shell, /layout\?: "practice" \| "simulation" \| "simulationSaved" \| "simulationConfirmation"/);
  assert.match(shell, /topBarLargeSimulation:\s*\{[\s\S]*?minHeight:\s*48[\s\S]*?paddingVertical:\s*spacing\.lg/);
  assert.match(shell, /topTextLargeSimulation:\s*\{[\s\S]*?fontSize:\s*13[\s\S]*?fontWeight:\s*"600"/);
  assert.match(shell, /modeTextLargeSimulation:\s*\{[\s\S]*?fontSize:\s*13[\s\S]*?fontWeight:\s*"700"/);
  assert.match(shell, /progressTrackConfirmation:\s*\{\s*backgroundColor:\s*palette\.border\s*,?/);
});
