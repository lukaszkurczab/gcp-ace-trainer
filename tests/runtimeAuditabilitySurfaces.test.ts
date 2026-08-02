import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("passive runtime selectors are attached to visible content rather than containers with interactive descendants", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");

  assert.match(home, /<Card variant="layered" style=\{styles\.decisionCard\}>/);
  assert.match(home, /<Text style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
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
});
