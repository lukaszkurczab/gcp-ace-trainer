import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  complexityValueAccessibilityLabel,
  orderingMoveAccessibilityLabel,
} from "../src/features/algorithms/session/sessionAccessibility";

const source = (path: string) => readFileSync(path, "utf8");

test("session control labels identify the dimension, ordering position, and command", () => {
  assert.equal(orderingMoveAccessibilityLabel("Partition around the pivot", 2, 5, "up"), "Move Partition around the pivot, position 3 of 5, up");
  assert.equal(orderingMoveAccessibilityLabel("Merge the runs", 4, 5, "down"), "Move Merge the runs, position 5 of 5, down");
  assert.equal(complexityValueAccessibilityLabel("Worst case time", "O(n log n)"), "Worst case time: O(n log n)");
});

test("interactive Algorithms session controls use real 48-point minimum geometry without hit-area substitutes", () => {
  const button = source("src/components/Button.tsx");
  const practiceControls = source("src/features/practice/PracticeResponseControls.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");
  const navigator = source("src/features/simulation/SimulationNavigator.tsx");
  const surfaces = `${practiceControls}\n${feedback}\n${navigator}`;

  assert.match(button, /base:\s*\{[\s\S]*?minHeight:\s*48[\s\S]*?minWidth:\s*48/);
  assert.match(practiceControls, /moveButton:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(practiceControls, /valueOption:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(feedback, /detailsToggle:\s*\{[^}]*minHeight:\s*48/);
  assert.match(navigator, /position:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.doesNotMatch(surfaces, /hitSlop/);
  assert.doesNotMatch(surfaces, /(?:moveButton|valueOption|detailsToggle|position):\s*\{[^}]*(?:height|width):\s*(?:32|36|40)\b/);
});

test("canonical session surfaces expose deterministic state and do not group interactive descendants", () => {
  const button = source("src/components/Button.tsx");
  const shell = source("src/features/algorithms/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeResponseControls.tsx");
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const navigator = source("src/features/simulation/SimulationNavigator.tsx");

  assert.match(button, /accessibilityState=\{\{ \.\.\.accessibilityState, busy: loading, disabled: isDisabled \}\}/);
  assert.match(practice, /orderingMoveAccessibilityLabel\(elementLabel, index, total, direction\)/);
  assert.match(practice, /accessibilityLabel=\{option\.text\}/);
  assert.match(practice, /accessibilityState=\{\{ checked: selected, disabled: !editable \}\}/);
  assert.match(practice, /accessibilityValue=\{correctness \? \{ text: correctness \} : undefined\}/);
  assert.match(simulation, /accessibilityLabel=\{option\.label\} accessibilityRole=\{role\} accessibilityState=\{\{ checked: option\.selected \}\}/);
  assert.match(simulation, /accessibilityRole="radio" accessibilityState=\{\{ checked: selected \}\}/);
  assert.match(practiceSurface, /accessible accessibilityLabel=\{notice\.message\} accessibilityLiveRegion="polite" accessibilityRole="alert"/);
  assert.match(simulation, /accessible accessibilityLabel=\{notice\.message\} accessibilityLiveRegion="polite" accessibilityRole="alert"/);
  assert.match(shell, /accessibilityLabel=\{timer\?\.accessibilityLabel\} accessibilityRole=\{timer \? "timer" : undefined\}/);
  assert.match(shell, /accessibilityLabel=\{position\?\.accessibilityLabel\}/);
  assert.match(shell, /accessibilityLabel=\{verifiedProgress === null \? undefined : "Session progress"\}/);
  assert.match(shell, /accessibilityRole=\{verifiedProgress === null \? undefined : "progressbar"\}/);
  assert.doesNotMatch(navigator, /accessibilityRole="summary"|Interview Simulation navigator/);
  assert.match(navigator, /accessibilityState=\{\{ selected: position\.state === "current" \}\}/);
  assert.doesNotMatch(practice, /<View[^>]*(?:accessible|accessibilityRole|accessibilityLabel)[^>]*style=\{styles\.stack\}/);
  assert.doesNotMatch(simulation, /<View[^>]*(?:accessible|accessibilityRole|accessibilityLabel)[^>]*style=\{styles\.controls\}/);
  assert.doesNotMatch(navigator, /<View[^>]*(?:accessible|accessibilityRole|accessibilityLabel)[^>]*style=\{styles\.grid\}/);
});

test("practice exit makes abandonment a single explicit decision in a modal", () => {
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");

  assert.match(practiceSurface, /<Modal animationType="fade" onRequestClose=\{onDismiss\} transparent visible>/);
  assert.match(practiceSurface, /<Pressable accessibilityLabel=\{t\("Keep learning"\)\} accessibilityRole="button" onPress=\{onDismiss\} style=\{styles\.modalDismissArea\} \/>/);
  assert.match(practiceSurface, /<Text style=\{styles\.exitTitle\}>\{t\("End this session\?"\)\}<\/Text>/);
  assert.match(practiceSurface, /<Button onPress=\{onAbandon\} testID=\{sessionId \? runtimeSelectors\.session\.abandon\(sessionId\) : undefined\} variant="destructive">\{t\("Abandon session"\)\}<\/Button>/);
  assert.doesNotMatch(practiceSurface, /abandon_confirmation|onRequestAbandon|AbandonSurface/);
});

test("large text can grow session chrome and controls without fixed interactive heights", () => {
  const shell = source("src/features/algorithms/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeResponseControls.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");

  assert.match(shell, /topBar:\s*\{[\s\S]*?minHeight:\s*56/);
  assert.doesNotMatch(shell, /numberOfLines=\{?1\}?/);
  assert.doesNotMatch(shell, /topBar:\s*\{[^}]*\bheight:\s*56/);
  assert.match(practice, /orderRow:\s*\{[^}]*alignItems:\s*"flex-start"/);
  assert.match(practice, /orderRow:\s*\{[^}]*flexWrap:\s*"wrap"/);
  assert.match(simulation, /orderRow:\s*\{[^}]*alignItems:\s*"flex-start"/);
  assert.match(simulation, /orderRow:\s*\{[^}]*flexWrap:\s*"wrap"/);
});

test("practice runtime selectors are derived from the canonical session projection without entering speech labels", () => {
  const screen = source("src/features/practice/PracticeSessionScreen.tsx");
  const surface = source("src/features/practice/PracticeSessionSurface.tsx");
  const controls = source("src/features/practice/PracticeResponseControls.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");

  assert.match(screen, /itemId: projection\.item\.itemId/);
  assert.match(screen, /actualLength: projection\.session\.actualLength/);
  assert.match(screen, /feedbackTiming: feedbackTiming\(projection\.session\.configurationSnapshot\.feedbackMode\)/);
  assert.match(screen, /ordinal: projection\.position\.current/);
  assert.match(screen, /roadmapNodeId: projection\.roadmapNodeId/);
  assert.doesNotMatch(screen, /itemId:\s*projection\.prompt/);

  assert.match(surface, /runtimeSelectors\.session\.root\(props\.runtimeIdentity\.sessionId\)/);
  assert.match(surface, /runtimeSelectors\.session\.counter\(props\.runtimeIdentity\.sessionId, props\.runtimeIdentity\.ordinal, props\.runtimeIdentity\.actualLength\)/);
  assert.match(surface, /runtimeSelectors\.session\.configuration\(props\.runtimeIdentity\.sessionId, props\.runtimeIdentity\.actualLength, props\.runtimeIdentity\.feedbackTiming\)/);
  assert.match(surface, /runtimeSelectors\.session\.question\(question\.itemId\)/);
  assert.match(surface, /runtimeSelectors\.session\.submit\(props\.runtimeIdentity\.itemId\)/);
  assert.match(surface, /runtimeSelectors\.session\.continue\(props\.runtimeIdentity\.itemId\)/);
  assert.match(surface, /runtimeSelectors\.session\.leaveAndResume\(sessionId\)/);
  assert.match(controls, /runtimeSelectors\.session\.option\(itemId, option\.id\)/);
  assert.match(feedback, /runtimeSelectors\.session\.result\(itemId, feedback\.result\)/);
  assert.match(feedback, /accessibilityLabel=\{`\$\{t\("Verified answer explanation\."\)\} \$\{feedback\.reason\}`\}/);
  assert.doesNotMatch(`${surface}\n${controls}\n${feedback}`, /accessibilityLabel=\{[^}]*runtimeSelectors/);
});
