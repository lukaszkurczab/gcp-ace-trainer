import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  complexityValueAccessibilityLabel,
  orderingMoveAccessibilityLabel,
} from "../src/features/coding-interview/session/sessionAccessibility";

const source = (path: string) => readFileSync(path, "utf8");

test("session control labels identify the dimension, ordering position, and command", () => {
  assert.equal(orderingMoveAccessibilityLabel("Partition around the pivot", 2, 5, "up"), "Move Partition around the pivot, position 3 of 5, up");
  assert.equal(orderingMoveAccessibilityLabel("Merge the runs", 4, 5, "down"), "Move Merge the runs, position 5 of 5, down");
  assert.equal(complexityValueAccessibilityLabel("Worst case time", "O(n log n)"), "Worst case time: O(n log n)");
});

test("interactive Algorithms session controls use real 48-point minimum geometry without hit-area substitutes", () => {
  const answerOption = source("src/components/AnswerOption.tsx");
  const button = source("src/components/Button.tsx");
  const practiceControls = source("src/features/practice/PracticeResponseControls.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");
  const detailsDisclosure = source("src/components/DetailsDisclosure.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const surfaces = `${answerOption}\n${practiceControls}\n${feedback}`;

  assert.match(answerOption, /option: \{[^}]*borderWidth:\s*1\.5[^}]*minHeight:\s*54[^}]*padding:/);
  assert.match(answerOption, /letterBadge:\s*\{[^}]*minHeight:\s*24[^}]*minWidth:\s*24/);
  assert.match(answerOption, /letterText:\s*\{[^}]*fontSize:\s*12[^}]*lineHeight:\s*16/);
  assert.match(answerOption, /<Text maxFontSizeMultiplier=\{2\}/);
  assert.match(button, /base:\s*\{[\s\S]*?minHeight:\s*48[\s\S]*?minWidth:\s*48/);
  assert.match(practiceControls, /moveButton:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(practiceControls, /valueOption:\s*\{[^}]*minHeight:\s*48[^}]*minWidth:\s*48/);
  assert.match(feedback, /<DetailsDisclosure expanded=\{detailsOpen\}/);
  assert.match(detailsDisclosure, /toggle:\s*\{[^}]*minHeight:\s*48/);
  assert.match(detailsDisclosure, /label:\s*\{[^}]*color:\s*palette\.textSecondary/);
  assert.match(feedback, /details:\s*\{[^}]*borderTopColor:\s*palette\.border[^}]*paddingTop:\s*spacing\.md/);
  assert.match(simulation, /layout=\{savedResponse \? "simulationSaved" : "simulation"\}/);
  assert.match(simulation, /variant=\{savedResponse \? "simulationSaved" : "simulation"\}/);
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
  const shell = source("src/features/coding-interview/session/SessionShell.tsx");
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
  assert.match(practiceSurface, /name="alert-triangle"/);
  assert.match(practiceSurface, /noticeError:\s*\{[\s\S]*?backgroundColor:\s*palette\.elevatedSurface[\s\S]*?gap:\s*spacing\.md[\s\S]*?padding:\s*spacing\.lg/);
  assert.match(practiceSurface, /props\.phase === "completing" \? <CompletingNotice \/> : null/);
  assert.match(practiceSurface, /<View style=\{styles\.asyncStatusRow\}>\s*<View accessible accessibilityLabel=\{t\("Finishing this session…"\)\} style=\{styles\.asyncIcon\}>[\s\S]*?name="rotate-ccw"[\s\S]*?<Text style=\{styles\.asyncStatusLabel\}>\{t\("LOADING"\)\}<\/Text>/);
  assert.match(practiceSurface, /function PreparingNotice\(\)[\s\S]*?styles\.asyncState[\s\S]*?Preparing the session plan and first item\./);
  assert.match(practiceSurface, /asyncIcon:\s*\{[\s\S]*?backgroundColor:\s*palette\.surfaceInput[\s\S]*?borderRadius:\s*radius\.lg[\s\S]*?height:\s*44[\s\S]*?width:\s*44/);
  assert.match(practiceSurface, /asyncStatusLabel:\s*\{[\s\S]*?fontSize:\s*12[\s\S]*?fontWeight:\s*"600"[\s\S]*?lineHeight:\s*16/);
  assert.match(practiceSurface, /asyncState:\s*\{[\s\S]*?backgroundColor:\s*palette\.surface[\s\S]*?borderRadius:\s*radius\.button[\s\S]*?gap:\s*spacing\.lg[\s\S]*?padding:\s*spacing\.xl/);
  assert.match(practiceSurface, /completingActions:\s*\{\s*minHeight:\s*48\s*\}/);
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
  assert.match(practiceSurface, /<View accessibilityViewIsModal style=\{styles\.exitModalStack\}>[\s\S]*?<View style=\{styles\.exitSheetActions\}>[\s\S]*?Keep learning[\s\S]*?Pause and resume later[\s\S]*?<\/View>[\s\S]*?<View style=\{styles\.exitDestructiveAction\}>[\s\S]*?variant="destructive"/);
  assert.match(practiceSurface, /exitDestructiveAction:\s*\{[\s\S]*?backgroundColor:\s*palette\.background[\s\S]*?paddingHorizontal:\s*spacing\.xl/);
  assert.match(practiceSurface, /<Button onPress=\{onLeave\} testID=\{sessionId \? runtimeSelectors\.session\.leaveAndResume\(sessionId\) : undefined\} variant="secondary">\{t\("Pause and resume later"\)\}<\/Button>/);
  assert.match(practiceSurface, /<Button onPress=\{onAbandon\} testID=\{sessionId \? runtimeSelectors\.session\.abandon\(sessionId\) : undefined\} variant="destructive">\{t\(copy\.destructiveLabel\)\}<\/Button>/);
  assert.match(practiceSurface, /variant=\{props\.retryVariant \?\? "secondary"\}/);
  assert.match(practiceSurface, /trackId === "coding-interview-dsa-problem-solving"[\s\S]*?description: "Pause to resume later, or end the session and view a partial summary\. Saved answers remain available\.", destructiveLabel: "End and view summary"/);
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
  const shell = source("src/features/coding-interview/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeResponseControls.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");

  assert.match(shell, /topBar:\s*\{[\s\S]*?minHeight:\s*49/);
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
  assert.match(bottomNavigation, /maxFontSizeMultiplier=\{2\}/);
  assert.match(bottomNavigation, /height:\s*2/);
  assert.match(bottomNavigation, /width:\s*20/);
  assert.match(bottomNavigation, /tabButtonPressed/);
});

test("bottom navigation uses the Figma surface-overlay separator in both themes", () => {
  const tokens = source("src/theme/tokens.ts");
  const bottomNavigation = source("src/components/BottomTabBar.tsx");
  assert.match(tokens, /light:[\s\S]*?navigation:\s*\{[\s\S]*?border:\s*"#F1F5F9"/);
  assert.match(tokens, /dark:[\s\S]*?navigation:\s*\{[\s\S]*?border:\s*"#F1F5F9"/);
  assert.match(bottomNavigation, /borderColor:\s*palette\.navigation\.border/);
});

test("Practice Hub keeps the quiet-layered recommendation readable at large text and removes the competing stats card", () => {
  const practiceHub = source("src/features/practice/PracticeHubScreen.tsx");

  assert.match(practiceHub, /<Card variant="layered" style=\{styles\.heroCard\}>/);
  assert.match(practiceHub, /heroHeadingLargeText:\s*\{[^}]*flexDirection:\s*"column"/);
  assert.doesNotMatch(practiceHub, /statsHeader|statsMetric/);
});

test("Practice Hub geometry follows live Figma while keeping canonical mode ownership", () => {
  const practiceHub = source("src/features/practice/PracticeHubScreen.tsx");
  const listRow = source("src/components/ListRow.tsx");

  assert.match(practiceHub, /screenContent:\s*\{[\s\S]*?gap:\s*18/);
  assert.match(practiceHub, /pageIntro:\s*\{[\s\S]*?gap:\s*18/);
  assert.match(practiceHub, /topicContext:\s*\{[\s\S]*?gap:\s*6/);
  assert.match(practiceHub, /heroCard:\s*\{[\s\S]*?borderColor:\s*colorWithOpacity\(palette\.primary, 0\.28\)[\s\S]*?gap:\s*spacing\.xl[\s\S]*?shadowOpacity:\s*0\.22[\s\S]*?shadowRadius:\s*40/);
  assert.match(practiceHub, /heroText:\s*\{[\s\S]*?gap:\s*6/);
  assert.match(practiceHub, /heroHeading:\s*\{[\s\S]*?minHeight:\s*24/);
  assert.match(practiceHub, /heroTitle:\s*\{[\s\S]*?fontSize:\s*20[\s\S]*?lineHeight:\s*24/);
  assert.match(practiceHub, /heroDetail:\s*\{[\s\S]*?fontSize:\s*13\.5[\s\S]*?lineHeight:\s*19/);
  assert.match(practiceHub, /heroActions:\s*\{[\s\S]*?gap:\s*spacing\.xl/);
  assert.match(practiceHub, /cardRail:\s*\{[\s\S]*?height:\s*44[\s\S]*?top:\s*19/);
  assert.match(practiceHub, /modeList:\s*\{[\s\S]*?borderRadius:\s*18[\s\S]*?backgroundColor:\s*palette\.elevatedSurface/);
  assert.match(practiceHub, /<IconTile iconSize=\{24\} name=\{mode\.icon\} size=\{32\} tone=\{mode\.enabled \? \(isCodingInterviewTrack \? "settings" : mode\.tone\) : "muted"\} \/>/);
  assert.match(practiceHub, /<Icon color=\{palette\.textMuted\} name="chevron-right" size=\{20\} \/>/);
  assert.match(practiceHub, /<ListRow[\s\S]*?variant="grouped"/);
  assert.match(listRow, /groupedCopy:\s*\{[\s\S]*?gap:\s*spacing\.xxs/);
  assert.match(listRow, /groupedDetail:\s*\{[\s\S]*?typography\.listRowDetail/);
  assert.match(practiceHub, /settingsActionText:\s*\{[\s\S]*?color:\s*palette\.primary[\s\S]*?fontSize:\s*13[\s\S]*?fontWeight:\s*"500"[\s\S]*?lineHeight:\s*16/);
  assert.match(practiceHub, /buildPracticeModes\(activeTrack, data\.hasReviewEvidence\)/);
});

test("Practice Question Shell keeps the Figma prompt-to-answer rhythm", () => {
  const surface = source("src/features/practice/PracticeSessionSurface.tsx");

  assert.match(surface, /questionCard:\s*\{[\s\S]*?gap:\s*spacing\.md/);
  assert.match(surface, /questionAndResponse:\s*\{\s*gap:\s*spacing\.md\s*\}/);
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
  assert.match(feedback, /reasonLabel:\s*\{[^}]*fontSize:\s*12[^}]*lineHeight:\s*16/);
  assert.doesNotMatch(feedback, /reasonLabel:\s*\{[^}]*typography\.caption/);
  assert.doesNotMatch(`${surface}\n${controls}\n${feedback}`, /accessibilityLabel=\{[^}]*runtimeSelectors/);
});

test("rich feedback renders semantic blocks with accessible code, headings, lists, callouts, and local images", () => {
  const document = source("src/features/practice/AlgorithmFeedbackDocumentBlock.tsx");
  const assets = source("src/application/contentPackageRuntimeOwner.ts");

  assert.match(document, /accessibilityRole="header"/);
  assert.match(document, /accessibilityLabel=\{`Code sample in \$\{block\.language\}`\}/);
  assert.match(document, /<Text selectable style=\{styles\.code\}>/);
  assert.match(document, /accessibilityLabel=\{block\.alt\}/);
  assert.match(document, /CALLOUT_LABEL\[block\.kind\]/);
  assert.match(document, /resolveTextAsset\(item, block\.assetId\)/);
  assert.match(document, /paragraph:\s*\{[^}]*fontSize:\s*13[^}]*lineHeight:\s*20/);
  assert.match(document, /listText:\s*\{[^}]*fontSize:\s*13[^}]*lineHeight:\s*20/);
  assert.match(assets, /Asset \$\{assetId\} is unavailable in the exact verified package/);
  assert.doesNotMatch(document, /dangerouslySetInnerHTML|WebView|HTML/);
});
