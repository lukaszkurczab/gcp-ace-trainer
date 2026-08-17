import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

function tsxFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? tsxFiles(path) : entry.name.endsWith(".tsx") ? [path] : [];
  });
}

const genericPendingPaths = [
  "src/content/application/ContentPreparationGate.tsx",
  "src/features/exam/ExamReviewScreen.tsx",
  "src/features/exam/ExamScreen.tsx",
  "src/features/exam/ResultScreen.tsx",
  "src/features/home/HomeScreen.tsx",
  "src/features/practice/AlgorithmsPracticeSummaryScreen.tsx",
  "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
  "src/features/practice/CertificationPracticeSessionScreen.tsx",
  "src/features/practice/PracticeHubScreen.tsx",
  "src/features/practice/PracticeSetupScreen.tsx",
  "src/features/practice/TopicRoadmapScreen.tsx",
  "src/features/review/AnswerReviewScreen.tsx",
  "src/features/review/MistakesReviewScreen.tsx",
] as const;

test("LoadingState is the one accessible and reflowing generic pending primitive", () => {
  const loadingState = source("src/components/LoadingState.tsx");
  const exports = source("src/components/index.ts");

  assert.match(exports, /export \* from "\.\/LoadingState"/);
  assert.match(loadingState, /<Card style=\{styles\.card\}>/);
  assert.match(loadingState, /<ActivityIndicator[\s\S]*color=\{colors\.primary\}/);
  assert.match(loadingState, /accessibilityRole="progressbar"/);
  assert.match(loadingState, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(loadingState, /accessibilityLiveRegion="polite"/);
  assert.match(loadingState, /accessibilityLabel=\{description \? `\$\{title\}\. \$\{description\}` : title\}/);
  assert.match(loadingState, /description\?: string/);
  assert.match(loadingState, /maxFontSizeMultiplier=\{2\}/);
  assert.match(loadingState, /copy:\s*\{[\s\S]*?minWidth:\s*0,[\s\S]*?width:\s*"100%"/);
  assert.match(loadingState, /title:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.match(loadingState, /description:\s*\{[\s\S]*?flexShrink:\s*1/);
  assert.doesNotMatch(loadingState, /numberOfLines/);
});

test("exactly the thirteen inventoried generic pending branches use LoadingState", () => {
  const consumers = tsxFiles("src")
    .filter((path) => /<LoadingState\b/.test(source(path)))
    .sort();

  assert.deepEqual(consumers, [...genericPendingPaths].sort());
  for (const path of genericPendingPaths) assert.match(source(path), /<LoadingState\b/, path);

  assert.match(source(genericPendingPaths[0]), /state\.kind === "loading"[\s\S]*?<LoadingState title="Preparing content…"/);
  assert.match(source("src/features/home/HomeScreen.tsx"), /if \(!hasLoadedActiveTrack\) return <Screen[\s\S]*?<LoadingState/);
  assert.match(source("src/features/practice/AlgorithmsScopeSelectionScreen.tsx"), /state\.kind === "loading"[\s\S]*?<LoadingState/);
  assert.match(source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx"), /state\.kind === "loading"[\s\S]*?<LoadingState/);
  assert.match(source("src/features/practice/CertificationPracticeSessionScreen.tsx"), /if \(!projection\) return <Screen[\s\S]*?<LoadingState/);
  assert.match(source("src/features/exam/ResultScreen.tsx"), /if \(!summary\) return <Screen><LoadingState/);
  assert.match(source("src/features/exam/ExamReviewScreen.tsx"), /readState\.requestKey !== requestKey \|\| readState\.kind === "pending"[\s\S]*?<LoadingState/);
  assert.match(source("src/features/exam/ExamScreen.tsx"), /if \(!projection\) return <Screen><LoadingState/);
  assert.match(source("src/features/review/MistakesReviewScreen.tsx"), /\{loading \? \(\s*<LoadingState/);
});

test("pending data is distinct from true empty and onboarding outcomes", () => {
  for (const [path, loadedState, emptyBoundary] of [
    ["src/features/practice/PracticeHubScreen.tsx", "hasLoadedData", "if (!activeTrackId)"],
    ["src/features/review/AnswerReviewScreen.tsx", "hasLoadedReviewData", "return <Screen>{attempt ?"],
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
  assert.match(home, /catch \(error\) \{[\s\S]*?if \(isActive\) \{[\s\S]*?setShellReadError\(describeOperationalFailure\(error, "Patternly data is unavailable\."\)\);[\s\S]*?setHasLoadedActiveTrack\(true\)/);
  assert.match(home, /if \(shellReadError\)[\s\S]*?<EmptyState title=\{t\("Patternly is unavailable"\)\}/);
  assert.notEqual(home.indexOf("if (shellReadError)"), -1);
  assert.ok(home.indexOf("if (shellReadError)") < home.indexOf("if (!activeTrackId)"));

  for (const [path, defaultMessage, finishPending, unavailableTitle] of [
    ["src/features/practice/PracticeHubScreen.tsx", "Practice data is unavailable.", "setHasLoadedData(true)", "Practice is unavailable"],
    ["src/features/review/MistakesReviewScreen.tsx", "Review queue data is unavailable.", "setLoading(false)", "Review queue is unavailable"],
  ] as const) {
    const file = source(path);
    assert.match(file, new RegExp(`catch \\(error\\) \\{[\\s\\S]*?describeOperationalFailure\\(error, "${defaultMessage.replace(".", "\\.")}\"\\)[\\s\\S]*?${finishPending.replace(/[()]/g, "\\$&")}`), `${path} ends rejected pending state`);
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
  assert.match(roadmap, /useCallback\(\(\) => \{[\s\S]*?\}, \[requestKey\]\)/);
  assert.match(setup, /useCallback\(\(\) => \{[\s\S]*?\}, \[requestKey\]\)/);
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
});

test("queue reads clear stale resolved data before pending or unavailable", () => {
  const mistakesReview = source("src/features/review/MistakesReviewScreen.tsx");
  assert.match(mistakesReview, /setLoading\(true\);\s*setReadError\(null\);\s*setModel\(null\);\s*setSelectedRowId\(null\)/);
  assert.match(mistakesReview, /catch \(error\) \{[\s\S]*?setReadError\([\s\S]*?setLoading\(false\)/);
});

test("specialized session preparation and operations remain outside LoadingState", () => {
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulationScreen = source("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  const simulationSurface = source("src/features/simulation/SimulationSessionSurface.tsx");
  const operationPanel = source("src/features/simulation/operation/SimulationOperationPanel.tsx");

  assert.match(practiceSurface, /phase === "preparing"[\s\S]*?<PreparingNotice/);
  assert.match(practiceSurface, /<SessionShell/);
  assert.match(simulationScreen, /state: "preparing", title: "Preparing Interview Simulation"/);
  assert.match(simulationSurface, /<SessionShell/);
  assert.match(simulationSurface, /<SimulationOperationPanel operation=\{projection\.operation\}/);
  assert.match(operationPanel, /<ActivityIndicator/);
  assert.doesNotMatch(`${practiceSurface}\n${simulationScreen}\n${simulationSurface}\n${operationPanel}`, /LoadingState/);
});

test("Interview Simulation result distinguishes pending reads from failed verification", () => {
  const result = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");

  assert.match(result, /setResult\(null\);\s*setFailure\(null\);\s*try \{ setResult\(await getAlgorithmsPracticeResultProjection\(sessionId\)\); \}\s*catch \(error\) \{ setFailure\(messageFor\(error\)\); \}/);
  assert.match(result, /: failure \? \{\s*state: "verification_failed"[\s\S]*?notice: \{ tone: "error", message: failure \}/);
  assert.match(result, /\} : \{\s*state: "preparing",\s*title: "Preparing Interview Simulation result",\s*notice: \{ tone: "neutral", message: "Reading the verified session result\." \}/);
  assert.doesNotMatch(result, /failure \?\? "The session result is not available/);
  assert.doesNotMatch(result, /LoadingState/);
  assert.match(result, /<SimulationSessionSurface projection=\{projection\}/);
});
