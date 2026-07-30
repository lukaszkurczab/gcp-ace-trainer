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
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const surfaces = `${practiceControls}\n${feedback}`;

  assert.match(button, /base:\s*\{[\s\S]*?minHeight:\s*52[\s\S]*?minWidth:\s*48/);
  assert.match(practiceControls, /moveButton:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(practiceControls, /valueOption:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(feedback, /detailsToggle:\s*\{[^}]*minHeight:\s*48/);
  assert.match(simulation, /heading:\s*\{[^}]*minHeight:\s*48/);
  assert.doesNotMatch(surfaces, /hitSlop/);
  assert.doesNotMatch(surfaces, /(?:moveButton|valueOption|detailsToggle|position):\s*\{[^}]*(?:height|width):\s*(?:32|36|40)\b/);
});

test("simulation accessibility respects motion, focus, and touch-target constraints", () => {
  const navigator = source("src/features/simulation/navigator/SimulationQuestionNavigator.tsx");

  assert.match(navigator, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(navigator, /AccessibilityInfo\.addEventListener\("reduceMotionChanged", setReduceMotion\)/);
  assert.match(navigator, /<Modal animationType=\{reduceMotion \? "none" : "slide"\}/);
  assert.match(navigator, /<View accessibilityViewIsModal style=\{styles\.sheet\}>/);
  assert.match(navigator, /<View accessible accessibilityLiveRegion="polite" accessibilityRole="alert" style=\{styles\.feedbackMessage\}>/);
  assert.doesNotMatch(navigator, /<View accessibilityLiveRegion="polite" accessibilityRole="alert" style=\{\[styles\.feedback[\s\S]*?<Button/);
});

test("canonical session surfaces expose deterministic state and do not group interactive descendants", () => {
  const button = source("src/components/Button.tsx");
  const shell = source("src/features/algorithms/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeResponseControls.tsx");
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");

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
  assert.doesNotMatch(practice, /<View[^>]*(?:accessible|accessibilityRole|accessibilityLabel)[^>]*style=\{styles\.stack\}/);
  assert.doesNotMatch(simulation, /<View[^>]*(?:accessible|accessibilityRole|accessibilityLabel)[^>]*style=\{styles\.controls\}/);
});

test("practice exit makes abandonment a single explicit decision in a modal", () => {
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");

  assert.match(practiceSurface, /<Modal animationType="fade" onRequestClose=\{onDismiss\} transparent visible>/);
  assert.match(practiceSurface, /<Pressable accessibilityLabel=\{t\("Keep learning"\)\} accessibilityRole="button" onPress=\{onDismiss\} style=\{styles\.modalDismissArea\} \/>/);
  assert.match(practiceSurface, /<Text style=\{styles\.exitTitle\}>\{t\("Pause or end this session\?"\)\}<\/Text>/);
  assert.match(practiceSurface, /<Button onPress=\{onLeave\} testID=\{sessionId \? runtimeSelectors\.session\.leaveAndResume\(sessionId\) : undefined\}>\{t\("Pause and resume later"\)\}<\/Button>/);
  assert.match(practiceSurface, /<Button onPress=\{onAbandon\} testID=\{sessionId \? runtimeSelectors\.session\.abandon\(sessionId\) : undefined\} variant="destructive">\{t\("End and view summary"\)\}<\/Button>/);
  assert.doesNotMatch(practiceSurface, /abandon_confirmation|onRequestAbandon|AbandonSurface/);
});

test("standalone practice conflict and unavailable states respect both safe-area edges", () => {
  const screen = source("src/features/practice/PracticeSessionScreen.tsx");
  const standaloneScreens = [...screen.matchAll(/<Screen\b([^>]*)>/g)].map((match) => match[1] ?? "");

  assert.equal(standaloneScreens.length, 4);
  for (const attributes of standaloneScreens) {
    assert.match(attributes, /edges=\{\["top", "bottom"\]\}/);
  }
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

test("bottom navigation preserves one-line visual labels while keeping every tab semantically named", () => {
  const bottomNavigation = source("src/components/BottomTabBar.tsx");
  assert.match(bottomNavigation, /accessibilityRole="tab"/);
  assert.match(bottomNavigation, /accessibilityLabel=\{item\.label\}/);
  assert.match(bottomNavigation, /numberOfLines=\{1\}/);
  assert.match(bottomNavigation, /adjustsFontSizeToFit/);
  assert.match(bottomNavigation, /maxFontSizeMultiplier=\{1\.2\}/);
});

test("Practice Hub keeps the quiet-layered recommendation readable at large text and removes the competing stats card", () => {
  const practiceHub = source("src/features/practice/PracticeHubScreen.tsx");

  assert.match(practiceHub, /<Card variant="layered" style=\{styles\.heroCard\}>/);
  assert.match(practiceHub, /heroHeadingLargeText:\s*\{[^}]*flexDirection:\s*"column"/);
  assert.doesNotMatch(practiceHub, /MetricCard|statsHeader|statsMetric/);
});

test("certification exam stacks descriptive actions so large text cannot clip flagging or navigation", () => {
  const exam = source("src/features/exam/ExamScreen.tsx");

  assert.match(exam, /<View style=\{styles\.examActions\}>[\s\S]*Question navigator[\s\S]*Flag question/);
  assert.match(exam, /examActions:\s*\{\s*gap:\s*spacing\.sm\s*\}/);
  assert.match(exam, /navigationActions:\s*\{\s*flexDirection:\s*"row"/);
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
  assert.match(controls, /runtimeSelectors\.session\.complexityValue\(itemId, dimension\.id, value\)/);
  assert.match(feedback, /runtimeSelectors\.session\.result\(itemId, feedback\.result\)/);
  assert.match(feedback, /accessibilityLabel=\{`\$\{t\("Verified answer explanation\."\)\} \$\{feedback\.reason\}`\}/);
  assert.doesNotMatch(`${surface}\n${controls}\n${feedback}`, /accessibilityLabel=\{[^}]*runtimeSelectors/);
});

test("rich feedback renders semantic blocks with accessible code, headings, lists, callouts, and local images", () => {
  const document = source("src/features/practice/AlgorithmFeedbackDocumentBlock.tsx");
  const assets = source("src/content/algorithmsFeedbackAssets.ts");

  assert.match(document, /accessibilityRole="header"/);
  assert.match(document, /accessibilityLabel=\{`Code sample in \$\{block\.language\}`\}/);
  assert.match(document, /<Text selectable style=\{styles\.code\}>/);
  assert.match(document, /accessibilityLabel=\{block\.alt\}/);
  assert.match(document, /CALLOUT_LABEL\[block\.kind\]/);
  assert.match(assets, /Unknown local Algorithms feedback asset/);
  assert.doesNotMatch(document, /dangerouslySetInnerHTML|WebView|HTML/);
});
