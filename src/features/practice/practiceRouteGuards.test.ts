import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("practice screens turn unsupported package, topic, and mode reads into exits", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");

  assert.match(hub, /try \{[\s\S]*?getTrackDisplay\(activeTrackId\)[\s\S]*?getCanonicalFreePracticeNodeId\(activeTrack\.id\)[\s\S]*?\} catch \(error\) \{[\s\S]*?renderUnavailable\(/);
  assert.match(roadmap, /try \{[\s\S]*?getTrackDisplay\(activeTrackId\)[\s\S]*?buildTopicRoadmapNodes\([\s\S]*?\} catch \(error\) \{[\s\S]*?renderUnavailable\(/);
  assert.match(roadmap, /if \(route\.params\?\.topicId !== undefined && !topics\.some\(\(topic\) => topic\.id === route\.params\?\.topicId && topic\.status !== "locked"\)\) \{[\s\S]*?return renderUnavailable\(t\("This topic is not included in your free content\."\)\)/);
  assert.match(setup, /if \(route\.params\?\.topicId !== undefined && route\.params\.topicId !== canonicalNodeId\) \{[\s\S]*?return renderUnavailable\(t\("This topic is not included in your free content\."\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "coding_interview" && !isAlgorithmModeId\(requestedMode\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "certification" && !isCertificationPracticeModeId\(requestedMode\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "design_interview" && \(!isDesignInterviewModeId\(requestedMode\) \|\| requestedMode === "design-interview-simulation"\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.equal((setup.match(/canonicalTrack\.getMode\(selectedMode\)/g) ?? []).length, 1, "setup resolves the package mode once");
  assert.doesNotMatch(setup, /requestedMode === "certification-quick-review"/);
  assert.doesNotMatch(setup, /scenarioCompetencies|scenarioCompetencyId|setScenarioCompetencyId/);
});

test("Design simulation uses its dedicated result and cannot enter objective setup", () => {
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  const result = source("src/features/exam/ResultScreen.tsx");
  assert.match(setup, /requestedMode === "design-interview-simulation"/);
  assert.match(result, /session\.modeId === "design-interview-simulation"\)[\s\S]*?navigation\.replace\(ROUTES\.DESIGN_INTERVIEW_SIMULATION_RESULT/);
});

test("all selected Design modes require Premium admission before their canonical route", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  const modes = source("src/tracks/design-interview/designModes.ts");
  for (const mode of [
    "design-interview-learn-framework",
    "design-interview-tradeoff-practice",
    "design-interview-weak-area-review",
    "design-interview-simulation",
  ]) assert.match(modes, new RegExp(mode));
  assert.match(hub, /if \(isDesignInterviewModeId\(resolvedMode\)\)[\s\S]*?authorizePremiumSessionStart\(\)[\s\S]*?case "purchasePremium":[\s\S]*?ROUTES\.PREMIUM_PURCHASE/);
  assert.match(hub, /if \(resolvedMode !== "design-interview-simulation"\)[\s\S]*?ROUTES\.PRACTICE_SETUP[\s\S]*?ROUTES\.DESIGN_INTERVIEW_SIMULATION/);
  assert.match(hub, /setDesignAdmissionMode\(resolvedMode\)[\s\S]*?startSession\(designAdmissionMode\)/);
  assert.match(hub, /startSession\(primaryMode\.mode as PracticeSessionMode, "practiceHub"\)/);
});

test("practice route changes cannot submit stale setup controls and preserve track identity", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");

  assert.match(setup, /const routeFormIdentity = buildPracticeSetupRouteIdentity\(route\.params\)/);
  assert.match(setup, /const activeFormIdentity = readTrackId === null \? null : `\$\{readTrackId\}:\$\{routeFormIdentity\}`/);
  assert.match(setup, /function renderLoading\(\)[\s\S]*?<PracticeSetupLoadingSkeleton mode=\{route\.params\?\.mode\} \/>/);
  assert.match(setup, /if \(formIdentity !== activeFormIdentity\) return renderLoading\(\)/);
  assert.match(setup, /setSessionLength\(route\.params\?\.sessionLength \?\? null\)/);
  assert.match(setup, /const configuredSessionLength = resolvePracticeSessionLength\(sessionLength, selectedPackageMode\)/);
  assert.match(setup, /setFeedbackMode\(route\.params\?\.feedbackMode \?\? DEFAULT_FEEDBACK_MODE\)/);
  assert.match(setup, /setReviewBehaviorEnabled\(route\.params\?\.reviewBehaviorEnabled \?\? false\)/);
  assert.match(setup, /setFocusTopicId\(isCloudTopicId\(route\.params\?\.topicId \?\? ""\)/);
  assert.match(hub, /navigation\.navigate\(ROUTES\.TOPIC_ROADMAP, \{ topicId: topic\.id, trackId: activeTrack\.id \}\)/);
  assert.match(roadmap, /navigation\.navigate\(ROUTES\.PRACTICE_HUB, \{ topicId: resolvedSelectedTopicId \?\? undefined, trackId: activeTrack\.id \}\)/);
  assert.match(roadmap, /<Button onPress=\{returnToPracticeHub\} variant="primary">\{t\("Continue"\)\}<\/Button>/);
  assert.match(roadmap, /footerVariant="sticky"/);
  assert.match(hub, /const secondaryModes = modes\.filter\(\(mode\) => mode\.mode !== primaryMode\.mode && mode\.mode !== ALGORITHM_MODE_IDS\.customPractice\)/);
});

test("changing track returns through the Home root and drops practice route overrides", () => {
  const selectTrack = source("src/features/home/SelectTrackScreen.tsx");

  assert.match(selectTrack, /navigation\.navigate\(ROUTES\.HOME, \{ initialTab: "home" \}\)/);
  assert.doesNotMatch(selectTrack, /initialTab: "home"[^}]*trackId/);
});

test("Hub uses its displayed primary mode and package length defaults", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  assert.match(hub, /const resolvedMode = mode \?\? primaryMode\.mode/);
  assert.doesNotMatch(hub, /mode: resolvedMode, sessionLength: 10/);
});

test("Home practice navigation preserves track identity and unavailable topics keep their context", () => {
  const home = source("src/features/home/HomeScreen.tsx");
  const hub = source("src/features/practice/PracticeHubScreen.tsx");

  assert.match(home, /onStartLearning=\{\(topicId\) => navigation\.navigate\(ROUTES\.PRACTICE_HUB, \{ topicId, trackId: activeTrack\.id \}\)\}/);
  assert.match(hub, /if \(route\.params\?\.topicId !== undefined && route\.params\.topicId !== canonicalNodeId\) \{[\s\S]*?return renderUnavailable\([\s\S]*?requestedTopicTitle,[\s\S]*?\);/);
  assert.match(hub, /title = t\("Practice is unavailable"\)/);
  assert.match(hub, /<EmptyState[^>]*title=\{title\}[^>]*description=\{description\}/);
});

test("all practice runners prevent native removal and replay the exact action after leave confirmation", () => {
  const runners = [
    { source: source("src/features/practice/PracticeSessionScreen.tsx"), active: /state\?\.kind === "session"/ },
    { source: source("src/features/practice/CertificationPracticeSessionScreen.tsx"), active: /projection !== null/ },
    { source: source("src/features/practice/DesignInterviewPracticeScreen.tsx"), active: /projection !== null/ },
  ];

  for (const { source: runner, active } of runners) {
    assert.match(runner, /usePreventRemove\(!permitRouteExit\.current &&/);
    assert.match(runner, active);
    assert.match(runner, /\(\{ data \}\) => \{[\s\S]*?if \(permitRouteExit\.current\) \{[\s\S]*?navigation\.dispatch\(data\.action\)[\s\S]*?pendingRouteAction\.current = data\.action[\s\S]*?setExit\("leave"\)/);
    assert.match(runner, /pendingRouteAction\.current;[\s\S]*?pendingRouteAction\.current = null;[\s\S]*?navigation\.dispatch\(action\)/);
    assert.doesNotMatch(runner, /navigation\.addListener\("beforeRemove"/);
    assert.doesNotMatch(runner, /requestAnimationFrame|routeExitPermitted/);
    assert.match(runner, /onRequestLeave=\{\(\) => \{ pendingRouteAction\.current = null; setExit\("leave"\); \}\}/);
    assert.match(runner, /onDismissExit=\{\(\) => \{ pendingRouteAction\.current = null; setExit\("none"\); \}\}/);
  }
});

test("Certification and Design unlock actions only after the refreshed projection commits", () => {
  const runners = [
    source("src/features/practice/CertificationPracticeSessionScreen.tsx"),
    source("src/features/practice/DesignInterviewPracticeScreen.tsx"),
  ];

  for (const runner of runners) {
    assert.match(runner, /const actionPending = useRef\(false\)/);
    assert.match(runner, /const pendingActionProjection = useRef<[^>]+ \| null>\(null\)/);
    assert.match(runner, /useEffect\(\(\) => \{\s*if \(!projection \|\| pendingActionProjection\.current !== projection\) return;\s*pendingActionProjection\.current = null;\s*actionPending\.current = false;\s*\}, \[projection\]\)/);
    assert.match(runner, /pendingActionProjection\.current = next;\s*applyProjection\(next\)/);
    assert.match(runner, /pendingActionProjection\.current = null;\s*actionPending\.current = false;\s*setError\(describeOperationalFailure/);

    const submit = runner.match(/const submit = async \(\) => \{([\s\S]*?)\n  \};\n  const next/);
    assert.ok(submit, "runner has a separately guarded submit handler");
    assert.match(submit![1]!, /if \(actionPending\.current \|\|/);
    assert.match(submit![1]!, /actionPending\.current = true;[\s\S]*?await refreshAfterCommand/);
    assert.match(submit![1]!, /catch \{\s*pendingActionProjection\.current = null;\s*actionPending\.current = false;/);
    assert.doesNotMatch(submit![1]!, /finally \{[^}]*actionPending\.current = false/);

    const next = runner.match(/const next = async \(\) => \{([\s\S]*?)\n  \};\n  const (?:recover|applyCompletionResult)/);
    assert.ok(next, "runner has a separately guarded advance/finish handler");
    assert.match(next![1]!, /if \(actionPending\.current \|\| !canAdvance\) return;[\s\S]*?actionPending\.current = true/);
    assert.match(next![1]!, /actionPending\.current = true;[\s\S]*?await refreshAfterCommand/);
    assert.match(next![1]!, /applyCompletionResult\(result\);\s*if \(result\.kind !== "verified"\) actionPending\.current = false/);
    assert.match(next![1]!, /catch \(cause\) \{ actionPending\.current = false;/);
    assert.doesNotMatch(next![1]!, /finally \{[^}]*actionPending\.current = false/);
  }
});
