import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.[cm]?[jt]sx?$/.test(entry.name) && !entry.name.includes(".test.")
        ? [path]
        : [];
  });
}

test("shared visual effects have one theme-token owner", () => {
  const tokens = source("src/theme/tokens.ts");
  const appSource = sourceFiles("src")
    .filter((path) => !path.endsWith("src/theme/tokens.ts") && !path.endsWith("src/domain/tracks/trackRegistry.ts"))
    .map(source)
    .join("\n");

  assert.match(tokens, /light:\s*\{[\s\S]*?ambient:\s*\{[\s\S]*?canvas:[\s\S]*?effects:\s*\{[\s\S]*?reviewScrim:[\s\S]*?subtleBorder:/);
  assert.match(tokens, /dark:\s*\{[\s\S]*?ambient:\s*\{[\s\S]*?canvas:[\s\S]*?effects:\s*\{[\s\S]*?reviewScrim:[\s\S]*?subtleBorder:/);
  assert.doesNotMatch(appSource, /rgba\(/);
  assert.doesNotMatch(appSource, /shadowColor:\s*"#/);
  assert.doesNotMatch(appSource, /backgroundColor:\s*"#081328"/);
});

test("screens and components resolve colors exclusively through the active theme", () => {
  const presentationSource = ["src/components", "src/features", "src/navigation"]
    .flatMap(sourceFiles)
    .map(source)
    .join("\n");

  assert.doesNotMatch(presentationSource, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(presentationSource, /rgba?\(/i);
  assert.doesNotMatch(presentationSource, /(?:themeColors|colors)\.(?:dark|light)\b/);
});

test("all branded navigation headers use the one AppShellHeader path", () => {
  const files = sourceFiles("src");
  const combined = files.map(source).join("\n");
  const rootNavigator = source("src/navigation/RootNavigator.tsx");

  assert.equal(existsSync("src/features/navigation/AppStackHeader.tsx"), false);
  assert.doesNotMatch(combined, /AppStackHeader/);
  assert.match(rootNavigator, /header:\s*\(\{ back, navigation, options \}\) => \([\s\S]*?<AppShellHeader/);
  assert.match(rootNavigator, /backAction=\{back \? \{ onPress: \(\) => navigation\.goBack\(\) \} : undefined\}/);
  assert.match(rootNavigator, /context=\{options\.title\}/);
  assert.match(rootNavigator, /placement="stack"/);
  assert.doesNotMatch(rootNavigator, /headerTitleStyle|headerTintColor|headerStyle/);
});

test("route coverage has one native or inline shell owner and preserves active-session specialization", () => {
  const rootNavigator = source("src/navigation/RootNavigator.tsx");
  const routeIds = [...rootNavigator.matchAll(/<Stack\.Screen\s+\n?\s*name=\{ROUTES\.([A-Z_]+)\}/g)].map((match) => match[1]);
  const headerlessRouteIds = [...rootNavigator.matchAll(/<Stack\.Screen\s+\n?\s*name=\{ROUTES\.([A-Z_]+)\}[\s\S]*?options=\{\{([^}]*)\}\}\s*\/>/g)]
    .filter((match) => /headerShown:\s*false/.test(match[2] ?? ""))
    .map((match) => match[1]);

  assert.equal(routeIds.length, 25);
  assert.equal(new Set(routeIds).size, 25);
  assert.deepEqual(headerlessRouteIds, [
    "HOME",
    "ACTIVITY",
    "APPEARANCE_SETTINGS",
    "YOUR_DATA",
    "LEGAL_INFORMATION",
    "NOTIFICATION_SETTINGS",
    "SELECT_TRACK",
    "GOAL_CADENCE",
    "PRACTICE_HUB",
    "ALGORITHMS_SCOPE_SELECTION",
    "TOPIC_ROADMAP",
    "ANSWER_REVIEW",
    "PRACTICE_SETUP",
    "PRACTICE_SESSION",
    "ALGORITHMS_PRACTICE_REVIEW",
    "ALGORITHMS_PRACTICE_SUMMARY",
    "ALGORITHMS_INTERVIEW_SIMULATION",
    "ACCOUNT_ENTRY",
  ]);

  for (const path of [
    "src/features/home/HomeScreen.tsx",
    "src/features/home/SelectTrackScreen.tsx",
    "src/features/practice/PracticeHubScreen.tsx",
    "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
    "src/features/practice/TopicRoadmapScreen.tsx",
    "src/features/practice/PracticeSetupScreen.tsx",
  ]) {
    assert.match(source(path), /<AppShellHeader\b/);
  }
  assert.match(source("src/features/home/NotificationSettingsScreen.tsx"), /<ScreenHeader\b/);
  assert.match(source("src/features/home/LegalInformationScreen.tsx"), /screenHeader=\{\{ context: text\.settings/);

  assert.match(source("src/features/coding-interview/session/SessionShell.tsx"), /<Screen[\s\S]*edges=\{\["top", "bottom"\]\}/);
  assert.match(source("src/features/practice/PracticeSessionSurface.tsx"), /<SessionShell\b/);
  assert.match(source("src/features/simulation/SimulationSessionSurface.tsx"), /<SessionShell\b/);
});

test("the headerless practice route owns every Algorithms and Certification render branch", () => {
  const algorithms = source("src/features/practice/PracticeSessionScreen.tsx");
  const certification = source("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const sharedBackHeader = /<AppShellHeader backAction=\{\{ onPress: \(\) => navigation\.navigate\(ROUTES\.PRACTICE_HUB\) \}\} context=\{t\("Practice Session"\)\} \/>/;
  const branch = (file: string, start: string, end: string) => {
    const startIndex = file.indexOf(start);
    assert.ok(startIndex >= 0);
    const endIndex = file.indexOf(end, startIndex + start.length);
    assert.ok(endIndex >= 0);
    return file.slice(startIndex, endIndex);
  };

  assert.equal(algorithms.match(/<AppShellHeader\b/g)?.length, 4);
  assert.match(branch(algorithms, "if (!algorithmsMode)", "if (algorithmsMode ==="), sharedBackHeader, "Algorithms unsupported/misroute");
  assert.match(branch(algorithms, "if (algorithmsMode ===", "if (!state)"), sharedBackHeader, "Interview Simulation misroute");
  assert.match(branch(algorithms, 'if (state.kind === "active_session_conflict")', 'if (state.kind === "unavailable")'), sharedBackHeader, "active-session conflict");
  assert.match(branch(algorithms, 'if (state.kind === "unavailable")', "const sessionState"), sharedBackHeader, "Algorithms unavailable");
  assert.match(algorithms, /if \(!state\) return <PracticeSessionSurface[\s\S]*?phase="preparing" \/>/);
  assert.match(algorithms, /return \(\s*<PracticeSessionSurface[\s\S]*?phase=\{phase\}/);
  assert.match(practiceSurface, /return \(\s*<SessionShell/);

  assert.equal(certification.match(/<AppShellHeader\b/g)?.length, 4);
  assert.match(branch(certification, "if (!mode)", "if (conflict)"), sharedBackHeader, "Certification invalid mode");
  assert.match(branch(certification, "if (conflict)", "if (error)"), sharedBackHeader, "Certification active-session conflict");
  assert.match(branch(certification, "if (error)", "if (!projection)"), sharedBackHeader, "Certification error");
  assert.match(branch(certification, "if (!projection)", "const multiple"), sharedBackHeader, "Certification loading");
  const activeCertification = certification.slice(certification.indexOf("const multiple"));
  assert.doesNotMatch(activeCertification, /<AppShellHeader\b/);
  assert.match(activeCertification, /return <PracticeSessionSurface[\s\S]*?phase=\{phase\}/);
});

test("the shared header owns accessible back geometry and long-copy reflow without navigation fallback", () => {
  const header = source("src/components/AppShellHeader.tsx");
  const backFallback = source("src/navigation/goBackOrHome.ts");

  assert.match(header, /backAction\?: Readonly<\{/);
  assert.match(header, /accessibilityLabel=\{backAction\.accessibilityLabel \?\? t\("Go back"\)\}/);
  assert.match(header, /<IconButton[\s\S]*icon="chevron-left"/);
  const iconButton = source("src/components/IconButton.tsx");
  assert.match(iconButton, /accessibilityRole="button"/);
  assert.match(iconButton, /height:\s*44,[\s\S]*?width:\s*44,/);
  assert.match(iconButton, /visual:\s*\{[\s\S]*?borderWidth:\s*1,[\s\S]*?height:\s*36,[\s\S]*?width:\s*36,/);
  assert.match(iconButton, /pressedSurface/);
  assert.match(header, /headerCopy:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
  assert.match(header, /brandTitle:\s*\{[\s\S]*?flexShrink:\s*1,/);
  assert.match(header, /headerMeta:\s*\{[\s\S]*?flexShrink:\s*1,/);
  assert.match(header, /placement === "back"[\s\S]*?backNavigation:/);
  assert.match(header, /backChevron:\s*\{[\s\S]*?height: 36,[\s\S]*?width: 36,/);
  assert.match(header, /maxFontSizeMultiplier=\{2\}/);
  assert.doesNotMatch(header, /numberOfLines|ROUTES|canGoBack|navigate\(/);
  assert.match(backFallback, /if \(navigation\.canGoBack\(\)\)[\s\S]*navigation\.goBack\(\)[\s\S]*navigation\.navigate\(ROUTES\.HOME, \{ initialTab: "home" \}\)/);

  const screenHeader = source("src/components/ScreenHeader.tsx");
  assert.match(screenHeader, /<IconButton[\s\S]*icon="chevron-left"/);
  assert.match(screenHeader, /title: string/);
  assert.match(screenHeader, /description\?: string/);
  assert.match(screenHeader, /container:\s*\{\s*gap:\s*spacing\.lg/);
  assert.match(screenHeader, /contextRow:\s*\{[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(screenHeader, /description:\s*\{[\s\S]*?color:\s*palette\.textMuted/);
  assert.match(screenHeader, /context:\s*\{[\s\S]*\.\.\.typography\.bodyStrong[\s\S]*?color:\s*palette\.textMuted/);
  assert.match(screenHeader, /practiceSetupDescription:\s*\{[\s\S]*?color:\s*palette\.textSecondary/);
  assert.match(screenHeader, /contextRow:[\s\S]*minHeight:\s*44/);
  assert.match(screenHeader, /title:\s*\{[\s\S]*\.\.\.typography\.title/);
  assert.match(screenHeader, /maxFontSizeMultiplier=\{2\}/);
  assert.match(screenHeader, /activityContainer:[\s\S]*gap:\s*spacing\.sm/);
  const activity = source("src/features/home/ActivityScreen.tsx");
  assert.match(activity, /groupLabel:[\s\S]*fontSize:\s*12[\s\S]*lineHeight:\s*15/);
  assert.doesNotMatch(activity, /groupLabel:[^\n]*textTransform/);
  assert.match(activity, /filterText:\s*\{\s*\.\.\.typography\.bodyStrong/);
  assert.match(activity, /filterTrigger:\s*\{\s*flex:\s*1[\s\S]*minWidth:\s*0/);
  assert.match(activity, /filterClear\(\)/);
  assert.match(activity, /filterSelectedText:\s*\{\s*color:\s*palette\.textPrimary\s*\}/);
  assert.match(activity, /function ActivityEmptyState/);
  assert.match(activity, /Completed sessions and reviews will appear here\./);
  assert.match(activity, /onPress=\{onShowAll\}/);
  assert.match(activity, /onPress=\{onOpenPractice\}/);
  assert.match(activity, /empty:\s*\{[\s\S]*?paddingBottom:\s*80/);
  assert.match(activity, /emptyActivityState:\s*\{[\s\S]*?gap:\s*16/);
  assert.match(activity, /filteredEmptyActivityState:\s*\{[\s\S]*?paddingHorizontal:\s*40/);
  assert.match(activity, /emptyActivityBarTall:\s*\{\s*backgroundColor:\s*palette\.success/);
  assert.match(activity, /emptyActivityTitle:\s*\{[\s\S]*?fontSize:\s*17/);
  assert.match(activity, /row:\s*\{[\s\S]*?borderBottomWidth:\s*1[\s\S]*?gap:\s*10[\s\S]*?minHeight:\s*73/);
  assert.match(activity, /detail:\s*\{[\s\S]*?fontSize:\s*11[\s\S]*?lineHeight:\s*15\.4/);
  assert.match(activity, /statusDetail:\s*\{\s*color:\s*palette\.warning\s*\}/);
});

test("Screen and SessionShell remain the only general and active-session page owners", () => {
  const featureFiles = sourceFiles("src/features");
  const safeAreaOwners = featureFiles.filter((path) => /SafeAreaView/.test(source(path)));
  const scrollViewOwners = featureFiles.filter((path) => /\bScrollView\b/.test(source(path)));
  const screen = source("src/components/Screen.tsx");
  const header = source("src/components/AppShellHeader.tsx");

  assert.deepEqual(safeAreaOwners, []);
  assert.deepEqual(scrollViewOwners, [
    "src/features/reports/ContentReportSheet.tsx",
    "src/features/simulation/SimulationSessionSurface.tsx",
    "src/features/simulation/navigator/SimulationQuestionNavigator.tsx",
  ]);
  assert.match(screen, /<SafeAreaView[\s\S]*<ScrollView/);
  assert.match(screen, /content:\s*\{[\s\S]*?gap:\s*spacing\.xl/);
  assert.match(screen, /contentCompact:\s*\{[\s\S]*?gap:\s*spacing\.md/);
  assert.match(screen, /content:\s*\{[\s\S]*?paddingTop:\s*spacing\.xl/);
  assert.match(screen, /footer:\s*\{[\s\S]*?paddingVertical:\s*spacing\.lg/);
  assert.match(screen, /footerSticky:\s*\{[\s\S]*?paddingBottom:\s*spacing\.md[\s\S]*?paddingTop:\s*spacing\.md/);
  assert.match(screen, /footerSession:\s*\{[\s\S]*?paddingVertical:\s*spacing\.md/);
  assert.doesNotMatch(screen, /footerSession:\s*\{[\s\S]*?minHeight:\s*228/);
  assert.match(screen, /footerSimulation:\s*\{[\s\S]*?minHeight:\s*361/);
  assert.match(screen, /header\?: ReactNode/);
  assert.match(header, /placement === "stack"[\s\S]*<SafeAreaView edges=\{\["top"\]\}/);
  assert.doesNotMatch(source("src/features/coding-interview/session/SessionShell.tsx"), /SafeAreaView|ScrollView/);
});

test("representative Home, Settings, setup, session, and result routes keep canonical ownership", () => {
  const rootNavigator = source("src/navigation/RootNavigator.tsx");
  const home = source("src/features/home/HomeScreen.tsx");
  const homeTab = source("src/features/home/tabs/HomeTab.tsx");
  const button = source("src/components/Button.tsx");
  const settings = source("src/features/home/AppearanceSettingsScreen.tsx");
  const preferenceSelection = source("src/features/home/PreferenceSelectionScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  const session = source("src/features/coding-interview/session/SessionShell.tsx");
  const result = source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx");
  const simulationSummary = source("src/features/simulation/SimulationSessionSurface.tsx");

  assert.match(home, /<Screen[\s\S]*<AppShellHeader \/>/);
  assert.match(homeTab, /isReviewRecommendation[\s\S]*?Review due items before they become stale\./);
  assert.match(home, /activeTab === "home" \? styles\.homeScreenContent/);
  assert.match(home, /activeTab === "progress" \? styles\.progressScreenContent/);
  assert.match(home, /homeScreenContent:\s*\{[\s\S]*?gap:\s*18[\s\S]*?paddingTop:\s*12/);
  assert.match(home, /progressScreenContent:\s*\{[\s\S]*?paddingTop:\s*16/);
  assert.match(homeTab, /decisionCard:[\s\S]*?gap:\s*spacing\.lg[\s\S]*?overflow:\s*"hidden"/);
  assert.match(homeTab, /decisionTitle:[\s\S]*?letterSpacing:\s*-0\.3/);
  assert.match(homeTab, /sectionLabel:[\s\S]*?fontSize:\s*13/);
  assert.match(homeTab, /overviewValueGroup:[\s\S]*?gap:\s*spacing\.sm/);
  assert.match(homeTab, /overviewValue:\s*\{[\s\S]*\.\.\.typography\.bodyStrong/);
  assert.match(homeTab, /currentFocusTitle:[\s\S]*?fontSize:\s*15[\s\S]*?fontWeight:\s*"500"[\s\S]*?lineHeight:\s*18/);
  assert.match(homeTab, /activityDetail:[\s\S]*?fontSize:\s*12[\s\S]*?fontWeight:\s*"400"/);
  assert.match(homeTab, /<View style=\{styles\.activityRow\}>[\s\S]*?recentAttempt\.modeId[\s\S]*?runtimeSelectors\.home\.activity\(\)/);
  assert.doesNotMatch(homeTab, /activityList/);
  assert.match(homeTab, /activityRow:\s*\{[\s\S]*?justifyContent:\s*"space-between"[\s\S]*?minHeight:\s*44/);
  assert.match(homeTab, /activityAction:\s*\{[\s\S]*?flexShrink:\s*0[\s\S]*?minHeight:\s*44/);
  assert.match(homeTab, /secondaryActionText:[\s\S]*?color:\s*palette\.primary[\s\S]*?lineHeight:\s*18/);
  assert.match(homeTab, /activityActionText:[\s\S]*?color:\s*palette\.primary[\s\S]*?lineHeight:\s*18/);
  assert.match(button, /labelStyle\?: StyleProp<TextStyle>/);
  assert.match(button, /label:\s*\{[\s\S]*\.\.\.typography\.button/);
  assert.match(button, /styles\.label, styles\[`\$\{variant\}Label`\], labelStyle/);
  assert.match(button, /primaryDisabled:\s*\{[\s\S]*backgroundColor:\s*palette\.surfaceInput[\s\S]*borderColor:\s*palette\.textMuted/);
  assert.match(button, /secondaryDisabled:\s*\{[\s\S]*backgroundColor:\s*palette\.surfaceInput[\s\S]*borderColor:\s*palette\.border/);
  assert.match(button, /destructiveDisabled:\s*\{[\s\S]*backgroundColor:\s*palette\.danger[\s\S]*borderColor:\s*palette\.danger/);
  assert.match(button, /ghostDisabledLabel:\s*\{[\s\S]*color:\s*palette\.textSecondary[\s\S]*opacity:\s*0\.55/);
  assert.match(button, /isDisabled \? disabledStyle : null/);
  assert.match(button, /style,\s*isDisabled \? disabledStyle : null/);
  assert.match(button, /isDisabled \? disabledLabelStyle : null/);
  assert.match(home, /if \(!hasLoadedActiveTrack\) return <Screen edges=\{\["top"\]\} scroll=\{false\}><AppShellHeader \/><LoadingState/);
  assert.match(settings, /<PreferenceSelectionScreen/);
  assert.match(preferenceSelection, /<Screen\b/);
  assert.match(rootNavigator, /name=\{ROUTES\.APPEARANCE_SETTINGS\}[\s\S]*?options=\{\{ headerShown: false, title: t\("Appearance"\) \}\}/);
  assert.match(setup, /<Screen edges=\{\["top", "bottom"\]\}>[\s\S]*<AppShellHeader/);
  assert.match(source("src/features/practice/AlgorithmsScopeSelectionScreen.tsx"), /state\.kind === "unavailable"[\s\S]*?<Screen edges=\{\["top"\]\}><AppShellHeader[\s\S]*?onActionPress=\{\(\) => goBackOrHome\(navigation\)\}/);
  assert.match(session, /return \([\s\S]*<Screen[\s\S]*footer=/);
  assert.match(result, /<Screen/);
  assert.match(result, /<Screen edges=\{\["top", "bottom"\]\}>/);
  assert.match(result, /<SessionResultOverview/);
  assert.match(result, /configurationTestID=\{runtimeSelectors\.summary\.configuration\(result\.sessionId, result\.configuration\.actualLength, result\.configuration\.feedbackTiming\)\}/);
  assert.match(result, /result\.feedbackItems\.map/);
  assert.match(result, /review=\{feedbackAvailable \?/);
  assert.match(result, /secondaryNote=\{configurationNote \?/);
  assert.doesNotMatch(result, /<ScrollView|summaryShell|summaryContent|statsCard|summaryFooter|SummaryStat|reviewBanner/);
  assert.match(rootNavigator, /name=\{ROUTES\.ALGORITHMS_PRACTICE_SUMMARY\}[\s\S]*?options=\{\{ headerShown: false, title: t\("Session result"\) \}\}/);
  assert.doesNotMatch(result, /scoreLine|pointsEarned|points\)/);
  assert.match(simulationSummary, /<Text maxFontSizeMultiplier=\{2\} style=\{styles\.summaryTitle\}>\{t\(projection\.title\)\}<\/Text>/);
  assert.match(simulationSummary, /<Text maxFontSizeMultiplier=\{2\} style=\{styles\.sectionTitle\}>\{t\("Results"\)\}<\/Text>/);
  assert.match(simulationSummary, /summaryHeaderBar:\s*\{\s*height:\s*52\s*\}/);
  assert.match(simulationSummary, /summaryMetrics:\s*\{\s*gap:\s*spacing\.lg\s*\}/);
  assert.match(simulationSummary, /summarySeparator:\s*\{[\s\S]*?height:\s*1/);
  assert.match(simulationSummary, /summaryStat:\s*\{[\s\S]*?flexDirection:\s*"row"[\s\S]*?paddingVertical:\s*spacing\.md/);
  assert.match(simulationSummary, /summaryStatLabel:\s*\{[\s\S]*?flex:\s*1[\s\S]*?minWidth:\s*0/);
  assert.match(simulationSummary, /summaryValue:\s*\{[\s\S]*?flexShrink:\s*1[\s\S]*?marginLeft:\s*spacing\.sm[\s\S]*?textAlign:\s*"right"/);
  assert.match(simulationSummary, /function SummaryStat[\s\S]*?<Text maxFontSizeMultiplier=\{2\} style=\{styles\.summaryStatLabel\}>[\s\S]*?<Text maxFontSizeMultiplier=\{2\} style=\{styles\.summaryValue\}>/);
  assert.match(simulationSummary, /function OutcomeStat[\s\S]*?<Text maxFontSizeMultiplier=\{2\} style=\{styles\.outcomeLabel\}>[\s\S]*?<Text maxFontSizeMultiplier=\{2\} style=\{styles\.outcomeValue\}>/);
  assert.doesNotMatch(simulationSummary, /completion\.earnedPoints|completion\.maxPoints|missedCount/);
  assert.doesNotMatch(simulationSummary, /summaryStats|reviewBanner|configuration\?:/);
});

test("Progress follows the current Figma section copy and 200% text contract", () => {
  const progress = source("src/features/home/tabs/ProgressTab.tsx");
  const textNodes = [...progress.matchAll(/<Text\b[^>]*>/g)].map((match) => match[0]);

  assert.match(progress, /t\("Recent activity"\)/);
  assert.match(progress, /t\("Across this track"\)/);
  assert.match(progress, /t\("Effectiveness trend"\)/);
  assert.match(progress, /Evidence is building/);
  assert.match(progress, /<Svg[\s\S]*<Polyline/);
  assert.equal(textNodes.length > 0, true);
  assert.equal(textNodes.every((node) => node.includes("maxFontSizeMultiplier={2}")), true);
});

test("Activity rows preserve the variable-height Figma copy at large text", () => {
  const activity = source("src/features/home/ActivityScreen.tsx");
  const row = activity.slice(activity.indexOf("function ActivityRow"), activity.indexOf("function activityCountLabel"));

  assert.doesNotMatch(row, /numberOfLines/);
  assert.match(row, /maxFontSizeMultiplier=\{2\} style=\{styles\.title\}/);
  assert.match(row, /maxFontSizeMultiplier=\{2\} style=\{styles\.detail\}/);
  assert.match(activity, /row:\s*\{[\s\S]*?minHeight:\s*73/);
});

test("simulation review owns the Figma review shell and keeps navigator outcomes explicit", () => {
  const review = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");
  const sharedReviewShell = source("src/components/ReviewShell.tsx");
  const sharedReviewNavigator = source("src/components/ReviewNavigator.tsx");
  const sharedUnavailableSurface = source("src/components/ReviewUnavailableSurface.tsx");
  const facade = source("src/application/coding-interview/codingInterviewSessionFacade.ts");

  assert.match(sharedReviewShell, /<IconButton[\s\S]*icon="chevron-left"/);
  assert.match(sharedReviewShell, /filterShell:/);
  assert.match(sharedReviewShell, /filterRow:\s*\{[\s\S]*paddingHorizontal:\s*spacing\.xl[\s\S]*paddingVertical:\s*spacing\.sm/);
  assert.match(review, /<AnswerOption/);
  assert.match(review, /<ReviewFeedbackBlock/);
  assert.match(review, /<Text maxFontSizeMultiplier=\{2\} style=\{styles\.questionEyebrow\}/);
  assert.match(review, /<ReviewNavigator/);
  assert.match(review, /<ReviewUnavailableSurface/);
  assert.match(sharedUnavailableSurface, /name="warning"/);
  assert.match(sharedUnavailableSurface, /borderRadius:\s*18/);
  assert.match(sharedUnavailableSurface, /maxWidth:\s*289/);
  assert.match(review, /contentVariant="unavailable"/);
  assert.match(review, /Result unavailable/);
  assert.match(review, /This question was added after your session completed\. No answer was recorded\./);
  assert.match(review, /unavailableSurface:\s*\{[\s\S]*top:\s*185[\s\S]*width:\s*353/);
  assert.match(sharedReviewNavigator, /fontScale >= 1\.8/);
  assert.match(sharedReviewNavigator, /<Modal animationType=\{reduceMotion \? "none" : "slide"\}/);
  assert.match(facade, /interaction: buildAlgorithmInteractionViewModel/);
  assert.match(facade, /controls: feedback\.controls/);
  const reviewFeedback = source("src/features/review/ReviewFeedbackBlock.tsx");
  assert.match(reviewFeedback, /feedbackCard:\s*\{[\s\S]*?borderRadius:\s*radius\.xl[\s\S]*?borderWidth:\s*1/);
  assert.match(reviewFeedback, /detailsDivider:/);
  assert.match(reviewFeedback, /colorWithOpacity\(palette\.ambient\.review, 0\.6\)/);
  assert.match(reviewFeedback, /reason:\s*\{[^}]*\.\.\.typography\.body[^}]*fontWeight:\s*"500"/);
  assert.doesNotMatch(reviewFeedback, /reasonPanel|result:/);
});

test("answer review uses the shared Figma review shell and preserves review marking", () => {
  const review = source("src/features/review/AnswerReviewScreen.tsx");
  const sharedReviewShell = source("src/components/ReviewShell.tsx");

  assert.match(review, /<ReviewShell[\s\S]*onNavigator=/);
  assert.match(review, /<AnswerOption/);
  assert.match(review, /<ReviewNavigator/);
  assert.match(review, /setQuestionNeedsReview/);
  assert.match(review, /questionOptionsSpacer:\s*\{\s*height:\s*22\s*\}/);
  assert.match(review, /questionBlock:\s*\{\s*gap:\s*6\s*\}/);
  assert.match(review, /optionsFeedbackSpacer:\s*\{\s*height:\s*28\s*\}/);
  assert.match(review, /<ReviewFeedbackBlock/);
  assert.match(review, /questionEyebrow:\s*\{[^}]*color:\s*palette\.ambient\.review/);
  assert.match(sharedReviewShell, /filterShell:/);
  assert.match(sharedReviewShell, /footerVariant="review"/);
  assert.match(sharedReviewShell, /footer:\s*\{[\s\S]*flexDirection:\s*"row"/);
  assert.match(sharedReviewShell, /footerButton:\s*\{[\s\S]*flex:\s*1/);
  assert.match(sharedReviewShell, /backgroundColor:\s*palette\.surfaceInput/);
});

test("simulation active shell uses the Figma question and action-footer variant", () => {
  const shell = source("src/features/coding-interview/session/SessionShell.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const screen = source("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");

  assert.match(shell, /layout\?: "practice" \| "simulation" \| "simulationSaved" \| "simulationConfirmation"/);
  assert.match(shell, /onPositionPress\?: \(\) => void/);
  assert.match(shell, /header=\{/);
  assert.match(shell, /sessionContent:\s*\{\s*gap:\s*spacing\.md,?\s*\}/);
  assert.match(shell, /progressTrackSimulation:\s*\{\s*backgroundColor:\s*palette\.surfaceInput/);
  assert.match(simulation, /operationNotice \? <SimulationRecoverySurface/);
  assert.doesNotMatch(simulation, /footerVariant=\{operationNotice/);
  assert.match(simulation, /layout=\{projection\.confirmation \? "simulationConfirmation" : savedResponse \? "simulationSaved" : "simulation"\}/);
  assert.match(simulation, /variant=\{savedResponse \? "simulationSaved" : "simulation"\}/);
  assert.match(simulation, /simulationPrompt: \{[\s\S]*fontSize: 22[\s\S]*lineHeight: 28/);
  assert.match(simulation, /actionBar: \{[\s\S]*width: "100%"/);
  assert.match(screen, /label: "Leave simulation"[\s\S]*variant: "ghost"/);
});

test("Practice setup keeps one canonical back action and recovery copy names learner-visible consequences", () => {
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  const session = source("src/features/practice/PracticeSessionScreen.tsx");
  const choiceRow = source("src/components/ChoiceRow.tsx");
  const screen = source("src/components/Screen.tsx");
  const screenHeader = source("src/components/ScreenHeader.tsx");

  assert.equal((setup.match(/\{t\("Back"\)\}/g) ?? []).length, 0);
  assert.match(setup, /<AppShellHeader[\s\S]*backAction=\{\{ onPress: \(\) => goBackOrHome\(navigation\) \}\}/);
  assert.match(setup, /compactCodingPractice = algorithmMode\?\.id === ALGORITHM_MODE_IDS\.customPractice/);
  assert.match(setup, /footerVariant=\{compactCodingPractice \|\| focusPractice \? "sticky" : "default"\}/);
  assert.match(setup, /<ScreenHeader[\s\S]*variant="practiceSetup"/);
  assert.match(setup, /<ChoiceRow[\s\S]*density="compact"/);
  assert.match(setup, /compactLengthGrid:[\s\S]*?backgroundColor:\s*palette\.surfaceInput[\s\S]*?minHeight:\s*54[\s\S]*?padding:\s*spacing\.xs/);
  assert.match(setup, /compactLengthOption:[\s\S]*?borderRadius:\s*10[\s\S]*?minHeight:\s*44/);
  assert.match(setup, /compactSelectedMeta:\s*\{\s*color:\s*palette\.onPrimary\s*,?\s*\}/);
  assert.match(setup, /compactSectionTitle:[\s\S]*?textTransform:\s*"uppercase"/);
  assert.match(choiceRow, /density\?:\s*"comfortable" \| "compact"/);
  assert.match(choiceRow, /compactRow:\s*\{[\s\S]*?minHeight:\s*48/);
  assert.match(screen, /footerVariant\?:\s*"default" \| "review" \| "session" \| "simulation" \| "sticky"/);
  assert.match(screen, /import \{ spacing \} from "\.\.\/theme"/);
  assert.match(screen, /footerSticky:\s*\{[\s\S]*?borderColor: palette\.effects\.subtleBorder/);
  assert.match(screenHeader, /variant\?: "default" \| "activity" \| "practiceSetup"/);
  assert.match(screenHeader, /practiceSetupDescription:\s*\{[\s\S]*?fontSize:\s*13\.5[\s\S]*?lineHeight:\s*19/);
  assert.doesNotMatch(setup, /Focus areas|Save settings/);
  assert.match(session, /This ends the active \{\{mode\}\} session\. You won't be able to resume it\. Your saved answers remain available\./);
  assert.doesNotMatch(session, /durable records stay available/);
});
