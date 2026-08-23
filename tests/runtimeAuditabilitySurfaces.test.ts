import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("passive runtime selectors are attached to visible content rather than containers with interactive descendants", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");

  assert.match(home, /<Card variant="layered" style=\{styles\.decisionCard\}>/);
  assert.match(home, /<Text style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
  assert.match(home, /onPress=\{isRecommendationSettingsAction \? onOpenSettings : onChooseTopic\}/);
  assert.match(home, /t\(isRecommendationSettingsAction \? "Manage settings" : "Choose another topic"\)/);
  assert.match(home, /hasActiveSession \? null : \(/);
  assert.match(home, /t\("Open Practice"\)/);
  assert.doesNotMatch(home, /<Card[^>]*testID=\{runtimeSelectors\.home\.trackCard/);
  assert.match(feedback, /<Text style=\{styles\.result\} testID=\{runtimeSelectors\.session\.result\(itemId, feedback\.result\)\}>/);
  assert.doesNotMatch(feedback, /<View style=\{styles\.container\} testID=\{runtimeSelectors\.session\.result/);
});

test("active-session resume uses the single recommendation card and a separate continue control", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");

  assert.match(home, /const resumeSessionId = recommendation\?\.action\.kind === "resume_active_session" \|\| recommendation\?\.action\.kind === "resume_certification_practice"[\s\S]*?\? recommendation\.action\.sessionId[\s\S]*?: undefined;/);
  assert.doesNotMatch(home, /<Card[^>]*onPress=/);
  assert.equal((home.match(/<Card variant="layered" style=\{styles\.decisionCard\}>/g) ?? []).length, 1);
  for (const helper of ["card", "title", "status", "continue"] as const) {
    assert.equal((home.match(new RegExp(`runtimeSelectors\\.resume\\.${helper}\\(resumeSessionId\\)`, "g")) ?? []).length, 1);
  }
  assert.match(home, /<Button[\s\S]*?testID=\{resumeSessionId[\s\S]*?runtimeSelectors\.resume\.continue\(resumeSessionId\)[\s\S]*?<\/Button>/);
});

test("Home uses the approved compact presentation without changing recommendation ownership", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");

  assert.match(home, /trackIconContainer:[\s\S]*?height:\s*22/);
  assert.match(home, /decisionCard:[\s\S]*?borderColor:\s*palette\.navigation\.active[\s\S]*?borderRadius:\s*22/);
  assert.match(home, /decisionIconTile:[\s\S]*?backgroundColor:\s*palette\.surfaceInput[\s\S]*?height:\s*44[\s\S]*?width:\s*44/);
  assert.match(home, /startButton:[\s\S]*?minHeight:\s*49/);
  assert.match(home, /<Button[\s\S]*?testID=\{resumeSessionId[\s\S]*?runtimeSelectors\.resume\.continue\(resumeSessionId\)/);
  assert.match(home, /<Text style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
  assert.match(home, /onChooseTopic/);
});

test("progress, simulation, and simulation summary selectors use canonical identities", () => {
  const progress = source("src/features/home/tabs/ProgressTab.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const summary = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");

  assert.match(progress, /testID=\{runtimeSelectors\.progress\.node\(node\.id\)\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.root\(runtimeIdentity\.sessionId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.question\(itemId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.option\(itemId, optionId\)/);
  assert.doesNotMatch(simulation, /value:\$\{index \+ 1\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.action\(sessionId, action\.id\)/);
  assert.match(summary, /runtimeSelectors\.summary\.root\(sessionId\)/);
  assert.match(progress, /screenTitle:[\s\S]*?fontSize:\s*30[\s\S]*?lineHeight:\s*36/);
  assert.match(progress, /root:\s*\{\s*gap:\s*28\s*\}/);
  assert.match(progress, /attentionCard:[\s\S]*?borderWidth:\s*0[\s\S]*?borderRadius:\s*14/);
  assert.match(progress, /const focusActionLabel = model\.algorithmsProgress \? "Open Practice"/);
});
