import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

test("practice screens turn unsupported package, topic, and mode reads into exits", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");

  assert.match(hub, /try \{[\s\S]*?getTrackDisplay\(activeTrackId\)[\s\S]*?getPreparedDiscovery\(activeTrack\.id\)[\s\S]*?\} catch \(error\) \{[\s\S]*?renderUnavailable\(/);
  assert.match(roadmap, /try \{[\s\S]*?getTrackDisplay\(activeTrackId\)[\s\S]*?buildTopicRoadmapNodes\([\s\S]*?\} catch \(error\) \{[\s\S]*?renderUnavailable\(/);
  assert.match(roadmap, /if \(route\.params\?\.topicId !== undefined && !topics\.some\(\(topic\) => topic\.id === route\.params\?\.topicId && topic\.status !== "locked"\)\) \{[\s\S]*?return renderUnavailable\(t\("This topic is not included in your free content\."\)\)/);
  assert.match(setup, /if \(route\.params\?\.topicId !== undefined && route\.params\.topicId !== packageProfile\.freeNodeId\) \{[\s\S]*?return renderUnavailable\(t\("This topic is not included in your free content\."\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "coding_interview" && !isAlgorithmModeId\(requestedMode\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "certification" && !isCertificationPracticeModeId\(requestedMode\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.match(setup, /if \(activeTrack\.familyId === "design_interview" && !isDesignInterviewModeId\(requestedMode\)\) return renderUnavailable\(t\("This practice mode is unavailable\."\)\)/);
  assert.equal((setup.match(/packageProfile\.getMode\(selectedMode\)/g) ?? []).length, 1, "setup resolves the package mode once");
  assert.doesNotMatch(setup, /requestedMode === "certification-quick-review"/);
  assert.doesNotMatch(setup, /scenarioCompetencies|scenarioCompetencyId|setScenarioCompetencyId/);
});

test("practice route changes cannot submit stale setup controls and preserve track identity", () => {
  const hub = source("src/features/practice/PracticeHubScreen.tsx");
  const roadmap = source("src/features/practice/TopicRoadmapScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");

  assert.match(setup, /const routeFormIdentity = buildPracticeSetupRouteIdentity\(route\.params\)/);
  assert.match(setup, /const activeFormIdentity = readTrackId === null \? null : `\$\{readTrackId\}:\$\{routeFormIdentity\}`/);
  assert.match(setup, /function renderLoading\(\)[\s\S]*?<PracticeSetupLoadingSkeleton mode=\{route\.params\?\.mode\} \/>/);
  assert.match(setup, /if \(formIdentity !== activeFormIdentity\) return renderLoading\(\)/);
  assert.match(setup, /setSessionLength\(route\.params\?\.sessionLength \?\? DEFAULT_PRACTICE_SESSION_LENGTH\)/);
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
