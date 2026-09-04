import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");

test("simulation routes retain one review header and a neutral result title before verification", () => {
  const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
  const summary = navigator.match(/name=\{ROUTES\.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY\}[\s\S]*?\/>/)?.[0];
  const review = navigator.match(/name=\{ROUTES\.ALGORITHMS_INTERVIEW_SIMULATION_REVIEW\}[\s\S]*?\/>/)?.[0];
  assert.ok(summary);
  assert.ok(review);
  assert.match(summary, /title: t\("Simulation result"\)/);
  assert.doesNotMatch(summary, /Simulation complete/);
  assert.match(review, /headerShown: false/);
  const result = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx", "utf8");
  assert.match(result, /state: "completed",\s*title: "Simulation complete"/);
  assert.match(source, /styles\.summaryTitle\}>\{t\(projection\.title\)\}/);
});

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

test("simulation preparation owns neutral question and response geometry", () => {
  assert.match(source, /export function SimulationLoadingSkeleton\(\)/);
  assert.match(source, /projection\.state === "preparing"/);
  assert.match(source, /<SimulationLoadingSkeleton \/>/);
  assert.match(source, /accessibilityLabel=\{t\("Preparing Interview Simulation"\)\}/);
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /simulation-loading-question/);
  assert.match(source, /simulation-loading-response/);
  assert.match(source, /accessible=\{false\}[\s\S]*?accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?pointerEvents="none"/);
  assert.equal((source.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1);
});

test("simulation statuses localize their projection copy and expose pending operation semantics", () => {
  assert.match(source, /modeLabel=\{projection\.modeLabel \? t\(projection\.modeLabel\) : undefined\}/);
  assert.match(source, /const message = t\(notice\.message\)/);
  const operation = readFileSync("src/features/simulation/operation/SimulationOperationPanel.tsx", "utf8");
  assert.match(operation, /accessibilityRole=\{pending \? "progressbar" : "alert"\}/);
  assert.match(operation, /accessibilityState=\{pending \? \{ busy: true \} : undefined\}/);
});
