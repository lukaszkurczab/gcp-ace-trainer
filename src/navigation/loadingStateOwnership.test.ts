import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");
const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function tsxFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? tsxFiles(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const genericPendingPaths = ["src/navigation/RootNavigator.tsx"] as const;

test("LoadingState is the compact accessible generic pending status", () => {
  const loadingState = source("src/components/LoadingState.tsx");
  const exports = source("src/components/index.ts");

  assert.match(exports, /export \* from "\.\/LoadingState"/);
  assert.match(loadingState, /const motion = useSkeletonGlassMotion\(\)/);
  assert.match(loadingState, /<SkeletonShape motion=\{motion\} style=\{styles\.statusBand\}/);
  assert.match(loadingState, /accessibilityRole="progressbar"/);
  assert.match(loadingState, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(loadingState, /accessibilityLiveRegion="polite"/);
  assert.match(loadingState, /accessibilityLabel=\{description \? `\$\{title\}\. \$\{description\}` : title\}/);
  assert.match(loadingState, /description\?: string/);
  assert.match(loadingState, /statusBand:\s*\{[\s\S]*?backgroundColor:\s*palette\.progress\.loadingTrack,[\s\S]*?borderColor:\s*palette\.border,[\s\S]*?height:\s*8,[\s\S]*?width:\s*104/);
  assert.match(loadingState, /processingTitle/);
  assert.match(loadingState, /processingDescription/);
  assert.match(loadingState, /maxFontSizeMultiplier=\{2\}/);
  assert.match(loadingState, /copy:\s*\{[\s\S]*?minWidth:\s*0,[\s\S]*?width:\s*"100%"/);
  assert.match(loadingState, /title:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.match(loadingState, /description:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.doesNotMatch(loadingState, /numberOfLines/);
  assert.doesNotMatch(loadingState, /ActivityIndicator|processing\.icon/);
});

test("EmptyState is the centered retained-content/unavailable status primitive", () => {
  const emptyState = source("src/components/EmptyState.tsx");
  assert.match(emptyState, /alignItems:\s*"center"/);
  assert.match(emptyState, /paddingHorizontal:\s*20/);
  assert.match(emptyState, /paddingVertical:\s*spacing\.xxxl/);
  assert.match(emptyState, /statusTitle/);
  assert.match(emptyState, /statusDescription/);
  assert.match(emptyState, /textAlign:\s*"center"/);
  assert.match(emptyState, /style=\{styles\.action\}/);
  assert.doesNotMatch(emptyState, /backgroundColor: palette\.elevatedSurface|borderRadius: radius/);
});

test("exactly the one remaining generic pending branch uses LoadingState", () => {
  const consumers = tsxFiles("src")
    .filter((path) => path !== "src/features/practice/PracticeSessionSurface.tsx" && /<LoadingState\b/.test(source(path)))
    .sort();

  assert.deepEqual(consumers, [...genericPendingPaths].sort());
  for (const path of genericPendingPaths) assert.match(source(path), /<LoadingState\b/, path);

  assert.match(source("src/navigation/RootNavigator.tsx"), /state\.kind === "loading"[\s\S]*?<LoadingState[^>]*title=\{t\("Restoring session"\)\}/);
  assert.match(source("src/features/practice/PracticeSessionSurface.tsx"), /<LoadingState description=\{t\("Preparing your summary\."\)\}/);
});

test("C1 screens own local review and exam loading geometry", () => {
  const goal = source("src/features/home/GoalCadenceScreen.tsx");
  assert.match(goal, /export function GoalLoadingSkeleton\(\{ onBack \}/);
  assert.match(goal, /if \(loading\) return <GoalLoadingSkeleton onBack=\{\(\) => navigation\.goBack\(\)\} \/>/);
  assert.match(goal, /accessibilityLabel=\{t\("Loading goal"\)\}/);
  assert.match(goal, /header=\{\([\s\S]*?<IconButton accessibilityLabel=\{t\("Go back"\)/);
  assert.match(goal, /loadingPanel/);
  assert.match(goal, /loadingField/);
  assert.doesNotMatch(goal, /LoadingState/);

  const exam = source("src/features/exam/ExamScreen.tsx");
  assert.match(exam, /export function ExamLoadingSkeleton\(\)/);
  assert.match(exam, /if \(readState\.requestKey !== requestKey \|\| readState\.kind === "pending"\) return <ExamLoadingSkeleton \/>/);
  assert.match(exam, /accessibilityLabel=\{t\("Preparing exam simulation…"\)\}/);
  assert.match(exam, /exam-loading-question/);
  assert.match(exam, /exam-loading-response/);
  assert.match(exam, /exam-loading-actions/);
  assert.match(exam, /createExamReadOwner/);
  assert.match(exam, /readOwner\.invalidate\(token\)/);
  assert.doesNotMatch(exam, /LoadingState/);

  const algorithmsReview = source("src/features/practice/AlgorithmsPracticeReviewScreen.tsx");
  assert.match(algorithmsReview, /export function AlgorithmsPracticeReviewLoadingSkeleton\(\)/);
  assert.match(algorithmsReview, /<AlgorithmsPracticeReviewLoadingSkeleton \/>/);
  assert.match(algorithmsReview, /algorithms-practice-review-loading-question/);
  assert.match(algorithmsReview, /algorithms-practice-review-loading-response/);
  assert.match(algorithmsReview, /<SessionShell headerAction=\{headerAction\} modeLabel=\{t\("Answer review"\)\}/);
  assert.doesNotMatch(algorithmsReview, /LoadingState/);

  const answerReview = source("src/features/review/AnswerReviewScreen.tsx");
  const reviewSkeleton = source("src/components/ReviewLoadingSkeleton.tsx");
  const exports = source("src/components/index.ts");
  assert.match(exports, /export \* from "\.\/ReviewLoadingSkeleton"/);
  assert.match(answerReview, /if \(!hasLoadedReviewData\) return <ReviewLoadingSkeleton onBack=\{\(\) => navigation\.goBack\(\)\} \/>/);
  assert.match(reviewSkeleton, /export function ReviewLoadingSkeleton\(\{ onBack \}/);
  assert.match(reviewSkeleton, /accessibilityLabel=\{t\("Loading review…"\)\}/);
  assert.match(reviewSkeleton, /review-loading-header/);
  assert.match(reviewSkeleton, /review-loading-filter/);
  assert.match(reviewSkeleton, /review-loading-question/);
  assert.match(reviewSkeleton, /review-loading-feedback/);
  assert.match(reviewSkeleton, /footerVariant="review"/);
  assert.doesNotMatch(answerReview, /LoadingState/);
});

test("bootstrap, roadmap, and setup own their phase or screen loading geometry", () => {
  const bootstrap = source("src/content/application/ContentPreparationGate.tsx");
  assert.match(bootstrap, /export function ContentBootstrapLoadingSkeleton\(\{ phase \}/);
  assert.match(bootstrap, /<ContentBootstrapLoadingSkeleton phase=\{state\.phase\} \/>/);
  assert.match(bootstrap, /accessibilityLabel=\{`\$\{title\}\. \$\{phaseCopy\}`\}/);
  assert.match(bootstrap, /<PatternlyMark decorative/);
  assert.match(bootstrap, /bootstrapShapes/);
  assert.equal((bootstrap.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1);
  assert.match(bootstrap, /Math\.min\(fontScale, 2\)/);
  assert.match(bootstrap, /palette\.progress\.loadingTrack/);
  assert.match(bootstrap, /palette\.border/);

  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  assertLocalSkeletonDefinition("src/features/practice/TopicRoadmapScreen.tsx", "TopicRoadmapLoadingSkeleton", /accessibilityLabel=\{t\("Loading topic roadmap"\)\}/, ["roadmapLoadingCanvas", "roadmapLoadingCircle", "roadmapLoadingVerticalConnector"]);
  assert.match(roadmap, /<TopicRoadmapLoadingSkeleton \/>[\s\S]*?<AppBottomNavigation activeId="practice"/);
  assert.match(roadmap, /styles\.roadmapLoadingNode, split \? styles\.roadmapLoadingSplitNode/);
  assert.match(roadmap, /roadmapLoadingSplitNode:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0/);
  assert.doesNotMatch(roadmap, /styles\.splitNode\b/);
  assert.match(roadmap, /node:\s*\{[\s\S]*?maxWidth:\s*144/);
  assert.doesNotMatch(roadmap, /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<LoadingState/);

  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  assertLocalSkeletonDefinition("src/features/practice/PracticeSetupScreen.tsx", "PracticeSetupLoadingSkeleton", /accessibilityLabel=\{t\("Loading practice setup"\)\}/, ["practiceSetupLoadingLengthGrid", "practiceSetupLoadingPanel", "practiceSetupLoadingAction"]);
  assert.match(setup, /function resolvePracticeSetupLoadingVariant[\s\S]*?certification-diagnostic-baseline.*?return "diagnostic"[\s\S]*?certification-focus-practice.*?return "selector"[\s\S]*?ALGORITHM_MODE_IDS\.customPractice.*?return "customCoding"/);
  assert.match(setup, /const showIntro = variant !== "customCoding" && variant !== "unknown"/);
  assert.match(setup, /const showLength = variant !== "diagnostic" && variant !== "unknown"/);
  assert.match(setup, /variant === "design" \? <SkeletonShape[\s\S]*?practiceSetupLoadingFeedbackStrip/);
  assert.match(setup, /variant === "unknown" \? <View style=\{styles\.practiceSetupLoadingUnknown\}/);
  assert.match(setup, /const compactCodingPractice = route\.params\?\.mode === ALGORITHM_MODE_IDS\.customPractice/);
  assert.match(setup, /<PracticeSetupLoadingSkeleton mode=\{route\.params\?\.mode\} \/>/);
  assert.doesNotMatch(setup, /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<LoadingState/);
});

function assertSkeletonSource(path: string, functionName: string, label: string, geometry: readonly string[]) {
  const file = source(path);
  const functionStart = file.indexOf(`export function ${functionName}`);
  assert.ok(functionStart >= 0, `${path} exports ${functionName}`);
  const functionEnd = file.indexOf("\nfunction ", functionStart + 1);
  const functionBody = file.slice(functionStart, functionEnd >= 0 ? functionEnd : undefined);
  assert.match(file, new RegExp(`<${escapeForRegExp(functionName)}\\s*/>`), `${path} owns its pending branch`);
  assert.match(file, new RegExp(`accessibilityLabel=\\{t\\("${escapeForRegExp(label)}"\\)\\}`), `${path} has a localized loading label`);
  assert.match(file, /accessibilityRole="progressbar"/);
  assert.match(file, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(file, /accessibilityLiveRegion="polite"/);
  assert.match(file, /accessible\s*$/m);
  assert.match(file, /accessible=\{false\}[\s\S]*?accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?pointerEvents="none"/);
  assert.match(file, /Math\.min\(fontScale, 2\)/);
  assert.match(file, /palette\.progress\.loadingTrack/);
  assert.match(file, /palette\.border/);
  assert.equal((file.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1, `${path} owns one motion controller per region`);
  assert.match(file, /<SkeletonShape motion=\{motion\}/, `${path} applies shared glass motion to its leaf shapes`);
  assert.doesNotMatch(functionBody, /LoadingState|ActivityIndicator|Animated/);
  for (const shape of geometry) assert.match(file, new RegExp(shape), `${path} includes ${shape}`);
}

function assertLocalSkeletonDefinition(path: string, functionName: string, labelExpression: RegExp, geometry: readonly string[]) {
  const file = source(path);
  const functionStart = file.indexOf(`export function ${functionName}`);
  assert.ok(functionStart >= 0, `${path} exports ${functionName}`);
  const functionEnd = file.indexOf("\nfunction ", functionStart + 1);
  const functionBody = file.slice(functionStart, functionEnd >= 0 ? functionEnd : undefined);
  assert.match(file, labelExpression, `${path} has a localized loading label`);
  assert.match(file, /accessibilityRole="progressbar"/);
  assert.match(file, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(file, /accessibilityLiveRegion="polite"/);
  assert.match(file, /accessible\s*$/m);
  assert.match(file, /accessible=\{false\}[\s\S]*?accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?pointerEvents="none"/);
  assert.match(file, /Math\.min\(fontScale, 2\)/);
  assert.match(file, /palette\.progress\.loadingTrack/);
  assert.match(file, /palette\.border/);
  assert.equal((file.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1, `${path} owns one motion controller per region`);
  assert.match(file, /<SkeletonShape motion=\{motion\}/, `${path} applies shared glass motion to its leaf shapes`);
  assert.doesNotMatch(functionBody, /LoadingState|ActivityIndicator|Animated/);
  for (const shape of geometry) assert.match(file, new RegExp(shape), `${path} includes ${shape}`);
}

test("Home shell owns tab-specific glass loading geometry and keeps navigation usable", () => {
  const home = source("src/features/home/HomeScreen.tsx");

  assert.match(home, /useState<HomeShellTab>\(route\.params\?\.initialTab \?\? "home"\)/);
  assert.match(home, /if \(!hasLoadedActiveTrack\) return \([\s\S]*?<HomeLoadingSkeleton \/>[\s\S]*?<ProgressLoadingSkeleton \/>[\s\S]*?<SettingsLoadingSkeleton \/>[\s\S]*?<AppBottomNavigation activeId=\{activeTab\}/);
  const pendingBranch = home.slice(home.indexOf("if (!hasLoadedActiveTrack)"), home.indexOf("if (shellReadError)"));
  assert.doesNotMatch(pendingBranch, /scroll=\{false\}/);
  assert.match(home, /navigation\.setParams\(\{ initialTab: tab \}\)/);
  assert.match(home, /onOpenSettings=\{\(\) => handleHomeTabChange\("settings"\)\}/);
  assert.doesNotMatch(home, /LoadingState/);

  assertLocalSkeletonDefinition("src/features/home/tabs/HomeTab.tsx", "HomeLoadingSkeleton", /accessibilityLabel=\{t\("Loading Home"\)\}/, ["homeLoadingTrackContext", "homeLoadingDecisionCard", "homeLoadingOverviewRow"]);
  assertLocalSkeletonDefinition("src/features/home/tabs/ProgressTab.tsx", "ProgressLoadingSkeleton", /accessibilityLabel=\{t\("Loading progress"\)\}/, ["progressLoadingTrackSelector", "progressLoadingWeekCard", "progressLoadingFocusCard"]);
  assertLocalSkeletonDefinition("src/features/home/tabs/SettingsTab.tsx", "SettingsLoadingSkeleton", /accessibilityLabel=\{tCommon\("Loading settings"\)\}/, ["settingsLoadingGroup", "settingsLoadingCard", "settingsLoadingRow"]);
});

test("Practice Hub owns its pending geometry and keeps the bottom navigation mounted", () => {
  const practiceHub = source("src/features/practice/PracticeHubScreen.tsx");

  assert.match(practiceHub, /if \(!hasLoadedData\) return \([\s\S]*?<AppShellHeader[\s\S]*?<PracticeHubLoadingSkeleton \/>[\s\S]*?<AppBottomNavigation activeId="practice"/);
  assert.doesNotMatch(practiceHub, /if \(!hasLoadedData\) return \([\s\S]*?<LoadingState/);
  assertLocalSkeletonDefinition("src/features/practice/PracticeHubScreen.tsx", "PracticeHubLoadingSkeleton", /accessibilityLabel=\{t\("Preparing practice"\)\}/, ["practiceHubLoadingIntro", "practiceHubLoadingHeroCard", "practiceHubLoadingModeRow"]);
});

test("specialized practice sessions share one neutral question and response loading skeleton", () => {
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const certification = source("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const design = source("src/features/practice/DesignInterviewPracticeScreen.tsx");

  assertLocalSkeletonDefinition("src/features/practice/PracticeSessionSurface.tsx", "PracticeSessionLoadingSkeleton", /accessibilityLabel=\{t\("Preparing session"\)\}/, ["practiceSessionLoadingQuestion", "practiceSessionLoadingResponse"]);
  assert.match(practiceSurface, /props\.phase === "preparing" \? <PracticeSessionLoadingSkeleton \/> : null/);
  assert.match(certification, /if \(!projection\) return <Screen[\s\S]*?<PracticeSessionLoadingSkeleton \/>/);
  assert.match(design, /if \(!projection\) return <Screen[\s\S]*?<PracticeSessionLoadingSkeleton \/>/);
  assert.doesNotMatch(`${certification}\n${design}`, /LoadingState/);
  assert.doesNotMatch(practiceSurface, /PreparingNotice/);
  assert.match(practiceSurface, /<LoadingState description=\{t\("Preparing your summary\."\)\}/);
});

test("Activity owns its glass loading skeleton", () => {
  const path = "src/features/home/ActivityScreen.tsx";
  assertSkeletonSource(path, "ActivityLoadingSkeleton", "Loading activity", ["loadingFilterShape", "loadingGroupCard", "loadingActivityRow"]);
  assert.match(source(path), /state\.kind === "loading"[\s\S]*?<ActivityLoadingSkeleton\s*\/>/);
});

test("Coding Interview scope owns its glass loading skeleton", () => {
  const path = "src/features/practice/AlgorithmsScopeSelectionScreen.tsx";
  assertSkeletonSource(path, "ScopeLoadingSkeleton", "Loading topics…", ["scopeLoadingSection", "scopeLoadingRow", "scopeLoadingIcon"]);
  assert.match(source(path), /state\.kind === "loading"[\s\S]*?<ScopeLoadingSkeleton\s*\/>/);
});

test("exam review owns its glass loading skeleton", () => {
  const path = "src/features/exam/ExamReviewScreen.tsx";
  assertSkeletonSource(path, "ExamReviewLoadingSkeleton", "Loading review…", ["examReviewLoadingResult", "examReviewLoadingFeedbackCard", "examReviewLoadingReturn"]);
  assert.match(source(path), /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<ExamReviewLoadingSkeleton\s*\/>/);
  assert.doesNotMatch(source(path), /examReviewLoadingHeading/);
});

test("exam result owns its glass loading skeleton", () => {
  const path = "src/features/exam/ResultScreen.tsx";
  assertSkeletonSource(path, "ExamResultLoadingSkeleton", "Loading session result", ["examResultLoadingContext", "examResultLoadingHeading", "examResultLoadingScoreCard", "examResultLoadingOutcome", "examResultLoadingMetrics", "examResultLoadingReview", "examResultLoadingAction"]);
  assert.match(source(path), /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<ExamResultLoadingSkeleton\s*\/>/);
});

test("coding practice result owns its glass loading skeleton", () => {
  const path = "src/features/practice/AlgorithmsPracticeSummaryScreen.tsx";
  assertSkeletonSource(path, "PracticeResultLoadingSkeleton", "Loading session result", ["practiceResultLoadingContext", "practiceResultLoadingHeading", "practiceResultLoadingScoreCard", "practiceResultLoadingOutcome", "practiceResultLoadingMetrics", "practiceResultLoadingAction"]);
  assert.match(source(path), /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<PracticeResultLoadingSkeleton\s*\/>/);
  assert.doesNotMatch(source(path), /practiceResultLoadingReview/);
});

test("mistakes review owns its glass loading skeleton", () => {
  const path = "src/features/review/MistakesReviewScreen.tsx";
  assertSkeletonSource(path, "MistakesLoadingSkeleton", "Loading review queue", ["mistakesLoadingSection", "mistakesLoadingRow", "mistakesLoadingBadge"]);
  assert.match(source(path), /\{loading \? \(\s*<MistakesLoadingSkeleton\s*\/>/);
  assert.doesNotMatch(source(path), /mistakesLoadingDetailCard/);
});

test("SkeletonShape owns the shared clipped glass primitive", () => {
  const skeletonShape = source("src/components/SkeletonShape.tsx");
  const exports = source("src/components/index.ts");

  assert.match(exports, /export \* from "\.\/SkeletonShape"/);
  assert.match(skeletonShape, /export function useSkeletonGlassMotion\(\): Animated\.Value \| null/);
  assert.match(skeletonShape, /type SkeletonShapeProps = Readonly<\{[\s\S]*motion: Animated\.Value \| null;[\s\S]*style: StyleProp<ViewStyle>/);
  assert.match(skeletonShape, /export function SkeletonShape\(\{ motion, style \}: SkeletonShapeProps\)/);
  assert.match(skeletonShape, /style=\{\[style, styles\.base\]\}/);
  assert.match(skeletonShape, /onLayout=\{handleLayout\}/);
  assert.match(skeletonShape, /overflow: "hidden"/);
  assert.match(skeletonShape, /position: "absolute"/);
  assert.match(skeletonShape, /<LinearGradient[\s\S]*x2="100%"/);
  assert.match(skeletonShape, /<Stop offset="0\.5" stopColor="white" stopOpacity=\{peakOpacity\}/);
  assert.match(skeletonShape, /outputRange: \[-width, width\]/);
  assert.equal((skeletonShape.match(/<Animated\.View/g) ?? []).length, 1);
  assert.match(skeletonShape, /accessibilityElementsHidden[\s\S]*?accessible=\{false\}[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?pointerEvents="none"/);
});

test("Skeleton glass motion uses one native driver loop and resets on lifecycle changes", () => {
  const skeletonShape = source("src/components/SkeletonShape.tsx");

  assert.match(skeletonShape, /const GLASS_MOTION_DURATION_MS = 1_800/);
  assert.match(skeletonShape, /Animated\.loop\([\s\S]*?Animated\.timing\([\s\S]*?duration: GLASS_MOTION_DURATION_MS[\s\S]*?easing: Easing\.linear[\s\S]*?isInteraction: false[\s\S]*?useNativeDriver: true/);
  assert.match(skeletonShape, /const shouldAnimate = appState === "active" && reduceMotion === false/);
  assert.match(skeletonShape, /AccessibilityInfo\.isReduceMotionEnabled\(\)/);
  assert.match(skeletonShape, /AccessibilityInfo\.addEventListener\("reduceMotionChanged"/);
  assert.match(skeletonShape, /AppState\.addEventListener\("change", setAppState\)/);
  assert.match(skeletonShape, /reduceMotion === false[\s\S]*?return shouldAnimate \? motion : null/);
  assert.match(skeletonShape, /animation\.stop\(\);[\s\S]*?motion\.stopAnimation\(\);[\s\S]*?motion\.setValue\(0\)/);
  assert.match(skeletonShape, /appStateSubscription\.remove\(\);[\s\S]*?reduceMotionSubscription\.remove\(\)/);
  assert.match(skeletonShape, /let observedEvent = false/);
  assert.match(skeletonShape, /if \(!active \|\| observedEvent\) return;/);
});

test("Skeleton glass motion stays static while Reduce Motion is unresolved or fails", () => {
  const skeletonShape = source("src/components/SkeletonShape.tsx");

  assert.match(skeletonShape, /const \[reduceMotion, setReduceMotion\] = useState<boolean \| null>\(null\)/);
  assert.match(skeletonShape, /\.catch\(\(error: unknown\) => \{[\s\S]*?setReduceMotion\(null\);[\s\S]*?console\.warn\("\[SkeletonShape\] Reduce Motion preference could not be read; glass motion remains static\.", error\)/);
  assert.match(skeletonShape, /if \(!shouldAnimate\) return undefined/);
  assert.match(skeletonShape, /return shouldAnimate \? motion : null/);
});

test("pending data is distinct from true empty and onboarding outcomes", () => {
  for (const [path, loadedState, emptyBoundary] of [
    ["src/features/practice/PracticeHubScreen.tsx", "hasLoadedData", "if (!activeTrackId)"],
    ["src/features/review/AnswerReviewScreen.tsx", "hasLoadedReviewData", "if (!attempt) return"],
  ] as const) {
    const file = source(path);
    assert.match(file, new RegExp(`useState\\(false\\)`), `${path} initializes ${loadedState}`);
    assert.match(file, new RegExp(`set${loadedState[0]!.toUpperCase()}${loadedState.slice(1)}\\(false\\)`), `${path} starts pending`);
    assert.match(file, new RegExp(`set${loadedState[0]!.toUpperCase()}${loadedState.slice(1)}\\(true\\)`), `${path} finishes pending`);
    assert.ok(file.indexOf(`if (!${loadedState})`) < file.indexOf(emptyBoundary), `${path} resolves pending before empty/onboarding`);
  }

  for (const [path, emptyBoundary] of [
    ["src/features/practice/TopicRoadmapScreen.tsx", "if (!activeTrackId)"],
    ["src/features/practice/PracticeSetupScreen.tsx", "if (!resolvedTrackId)"],
  ] as const) {
    const file = source(path);
    const keyGuard = 'if (readState.requestKey !== requestKey || readState.kind === "pending")';
    assert.ok(file.indexOf(keyGuard) < file.indexOf(emptyBoundary), `${path} blocks mismatched or pending reads before onboarding`);
  }
});

test("the six read owners end rejected reads in explicit unavailable EmptyStates", () => {
  const home = source("src/features/home/HomeScreen.tsx");
  assert.match(home, /catch \(error\) \{[\s\S]*?if \(isActive\) \{[\s\S]*?setShellReadError\("We couldn't load your Patternly data\. Check your connection and try again\."\);[\s\S]*?setHasLoadedActiveTrack\(true\)/);
  assert.match(home, /if \(shellReadError\)[\s\S]*?<EmptyState actionLabel=\{t\("Try again"\)\}[\s\S]*?onActionPress=\{\(\) => setShellReload\(\(reload\) => reload \+ 1\)\}[\s\S]*?title=\{t\("Patternly is unavailable"\)\}/);
  assert.notEqual(home.indexOf("if (shellReadError)"), -1);
  assert.ok(home.indexOf("if (shellReadError)") < home.indexOf("if (!activeTrackId)"));

  for (const [path, defaultArgument, finishPending, unavailableTitle] of [
    ["src/features/practice/PracticeHubScreen.tsx", "t(\"We couldn’t load your practice options.\")", "setHasLoadedData(true)", "Practice is unavailable"],
    ["src/features/review/MistakesReviewScreen.tsx", "\"Review queue data is unavailable.\"", "setLoading(false)", "Review queue is unavailable"],
  ] as const) {
    const file = source(path);
    assert.match(file, new RegExp(`catch \\(error\\) \\{[\\s\\S]*?describeOperationalFailure\\(error, ${escapeForRegExp(defaultArgument)}\\)[\\s\\S]*?${finishPending.replace(/[()]/g, "\\$&")}`), `${path} ends rejected pending state`);
    assert.match(file, new RegExp(`<EmptyState[\\s\\S]*?title=\\{t\\("${unavailableTitle}"\\)\\}`), `${path} renders unavailable EmptyState`);
  }
});

test("resolved track reads apply null without overriding explicit route authority", () => {
  const practiceHub = source("src/features/practice/PracticeHubScreen.tsx");
  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");

  assert.match(practiceHub, /setActiveTrackId\(savedTrackId \?\? null\)/);
  assert.doesNotMatch(practiceHub, /if \(savedTrackId\) setActiveTrackId/);
  for (const file of [roadmap, setup]) {
    assert.match(file, /activeTrackId: capturedRequestKey === STORED_TRACK_REQUEST_KEY \? savedTrackId \?\? null : capturedRequestKey/);
    assert.doesNotMatch(file, /if \(nextTrackId\)|if \(savedTrackId\) setActiveTrackId/);
    assert.match(file, /const requestKey:[^=]+ = route\.params\?\.trackId \?\? STORED_TRACK_REQUEST_KEY/);
  }
  assert.match(roadmap, /useCallback\(\(\) => \{[\s\S]*?\}, \[requestKey, t\]\)/);
  assert.match(setup, /useCallback\(\(\) => \{[\s\S]*?\}, \[requestKey, t\]\)/);
});

test("route-keyed read states block A under B and publish only their captured request", () => {
  type KeyedFixture = Readonly<{ kind: "pending" | "ready" | "unavailable"; requestKey: string }>;
  const visibleKind = (currentRequestKey: string, state: KeyedFixture) => state.requestKey === currentRequestKey ? state.kind : "pending";
  assert.equal(visibleKind("B", { kind: "ready", requestKey: "A" }), "pending");
  assert.equal(visibleKind("B", { kind: "unavailable", requestKey: "A" }), "pending");
  assert.equal(visibleKind("B", { kind: "ready", requestKey: "B" }), "ready");
  assert.equal(visibleKind("B", { kind: "unavailable", requestKey: "B" }), "unavailable");

  const examReview = source("src/features/exam/ExamReviewScreen.tsx");
  assert.match(examReview, /type ExamReviewReadState =[\s\S]*?kind: "pending"; requestKey: string[\s\S]*?kind: "ready"; requestKey: string; rows:[\s\S]*?kind: "unavailable"; requestKey: string; reason:/);
  assert.match(examReview, /const requestKey = route\.params\.sessionId/);
  assert.match(examReview, /const capturedRequestKey = requestKey;[\s\S]*?setReadState\(\{ kind: "pending", requestKey: capturedRequestKey \}\)/);
  assert.match(examReview, /setReadState\(\{ kind: "ready", requestKey: capturedRequestKey, rows \}\)/);
  assert.match(examReview, /kind: "unavailable",\s*requestKey: capturedRequestKey,\s*reason:/);
  assert.equal((examReview.match(/if \(!live\) return;/g) ?? []).length, 3);
  assert.match(examReview, /return \(\) => \{ live = false; \}/);
  const examGuard = examReview.indexOf('if (readState.requestKey !== requestKey || readState.kind === "pending")');
  assert.ok(examGuard < examReview.indexOf('if (readState.kind === "unavailable")'));
  assert.ok(examGuard < examReview.indexOf("const rows = readState.rows"));

  for (const [path, stateName] of [
    ["src/features/practice/TopicRoadmapScreen.tsx", "RoadmapReadState"],
    ["src/features/practice/PracticeSetupScreen.tsx", "PracticeSetupReadState"],
  ] as const) {
    const file = source(path);
    assert.match(file, new RegExp(`type ${stateName} =[\\s\\S]*?kind: "pending"; requestKey:[\\s\\S]*?kind: "ready"; requestKey:[\\s\\S]*?activeTrackId: TrackId \\| null; trainingAttempts:[\\s\\S]*?kind: "unavailable"; requestKey:[\\s\\S]*?reason:`));
    assert.match(file, /const capturedRequestKey = requestKey;[\s\S]*?setReadState\(\{ kind: "pending", requestKey: capturedRequestKey \}\)/);
    assert.match(file, /kind: "ready",\s*requestKey: capturedRequestKey,[\s\S]*?activeTrackId:/);
    assert.match(file, /kind: "unavailable",\s*requestKey: capturedRequestKey,\s*reason:/);
    assert.equal((file.match(/if \(isActive\) \{/g) ?? []).length, 2, `${path} guards ready and unavailable publication`);
    assert.match(file, /return \(\) => \{\s*isActive = false;\s*\}/);
    const guard = file.indexOf('if (readState.requestKey !== requestKey || readState.kind === "pending")');
    assert.ok(guard < file.indexOf('if (readState.kind === "unavailable")'), `${path} mismatch guard precedes error rendering`);
    assert.ok(guard < file.indexOf("const { activeTrackId"), `${path} mismatch guard precedes ready derivation`);
  }

  const result = source("src/features/exam/ResultScreen.tsx");
  assert.match(result, /type ResultReadState =[\s\S]*?kind: "pending"; requestKey: string[\s\S]*?kind: "ready"; requestKey: string; summary:[\s\S]*?kind: "unavailable"; requestKey: string; reason:/);
  assert.match(result, /const requestKey = route\.params\.sessionId/);
  assert.match(result, /const capturedRequestKey = requestKey;[\s\S]*?setReadState\(\{ kind: "pending", requestKey: capturedRequestKey \}\)/);
  assert.match(result, /kind: "ready", requestKey: capturedRequestKey, summary:/);
  assert.match(result, /kind: "unavailable", requestKey: capturedRequestKey, reason:/);
  assert.match(result, /return \(\) => \{ live = false; \}/);
  const resultGuard = result.indexOf('if (readState.requestKey !== requestKey || readState.kind === "pending")');
  assert.ok(resultGuard >= 0);
  assert.ok(resultGuard < result.indexOf('if (readState.kind === "unavailable")'));
  assert.ok(resultGuard < result.indexOf("const summary = readState.summary"));

  const algorithmsSummary = source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx");
  assert.match(algorithmsSummary, /type SummaryReadState =[\s\S]*?kind: "pending"; requestKey: string[\s\S]*?kind: "ready"; requestKey: string; result:[\s\S]*?kind: "unavailable"; reason: string; requestKey: string/);
  assert.match(algorithmsSummary, /const requestKey = route\.params\.sessionId/);
  assert.match(algorithmsSummary, /const capturedRequestKey = requestKey;[\s\S]*?setReadState\(\{ kind: "pending", requestKey: capturedRequestKey \}\)/);
  assert.match(algorithmsSummary, /getAlgorithmsPracticeSummaryProjection\(capturedRequestKey\)/);
  assert.match(algorithmsSummary, /kind: "ready", requestKey: capturedRequestKey, result/);
  assert.match(algorithmsSummary, /kind: "unavailable", requestKey: capturedRequestKey, reason:/);
  assert.match(algorithmsSummary, /setShowReview\(false\)/);
  assert.match(algorithmsSummary, /return \(\) => \{ live = false; \}/);
  const algorithmsGuard = algorithmsSummary.indexOf('if (readState.requestKey !== requestKey || readState.kind === "pending")');
  assert.ok(algorithmsGuard >= 0);
  assert.ok(algorithmsGuard < algorithmsSummary.indexOf('if (readState.kind === "unavailable")'));
  assert.ok(algorithmsGuard < algorithmsSummary.indexOf("const { result } = readState"));
});

test("queue reads clear stale resolved data before pending or unavailable", () => {
  const mistakesReview = source("src/features/review/MistakesReviewScreen.tsx");
  assert.match(mistakesReview, /setLoading\(true\);\s*setReadError\(null\);\s*setModel\(null\);\s*setSelectedRowId\(null\)/);
  assert.match(mistakesReview, /catch \(error\) \{[\s\S]*?setReadError\([\s\S]*?setLoading\(false\)/);
});

test("specialized session preparation stays local while completion uses the generic status", () => {
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulationScreen = source("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  const simulationSurface = source("src/features/simulation/SimulationSessionSurface.tsx");
  const operationPanel = source("src/features/simulation/operation/SimulationOperationPanel.tsx");

  assert.match(practiceSurface, /phase === "preparing"[\s\S]*?<PracticeSessionLoadingSkeleton/);
  assert.match(practiceSurface, /<SessionShell/);
  assert.match(simulationScreen, /state: "preparing", title: "Preparing Interview Simulation"/);
  assert.match(simulationSurface, /<SessionShell/);
  assert.match(simulationSurface, /<SimulationOperationPanel operation=\{projection\.operation\}/);
  assert.match(operationPanel, /<ActivityIndicator/);
  assert.match(practiceSurface, /<LoadingState description=\{t\("Preparing your summary\."\)\}/);
  assert.doesNotMatch(`${simulationScreen}\n${simulationSurface}\n${operationPanel}`, /LoadingState/);
});

test("Interview Simulation result keeps pending, scoreless, and failed reads explicit", () => {
  const result = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");
  const surface = source("src/features/simulation/SimulationSessionSurface.tsx");
  const operation = source("src/features/simulation/operation/SimulationOperationPanel.tsx");

  assert.match(result, /useSimulationResultRead\(sessionId\)/);
  assert.match(result, /if \(resolution === "pending"\) return <SimulationResultLoadingSkeleton \/>/);
  assert.match(result, /export function SimulationResultLoadingSkeleton\(\)/);
  assert.match(result, /resolveSimulationResultResolution\(result, failure\)/);
  assert.match(result, /failure \?\? "The session result is not available because verification did not complete\."/);
  assert.match(result, /Reading the verified session result\./);
  assert.match(result, /resolveSimulationResultResolution/);
  assert.doesNotMatch(result, /LoadingState/);
  assert.match(result, /<SimulationSessionSurface projection=\{projection\}/);
  assert.match(surface, /export function SimulationLoadingSkeleton\(\)/);
  assert.match(surface, /projection\.state === "preparing"/);
  assert.match(operation, /accessibilityRole=\{pending \? "progressbar" : "alert"\}/);
  assert.match(operation, /accessibilityState=\{pending \? \{ busy: true \} : undefined\}/);
});
