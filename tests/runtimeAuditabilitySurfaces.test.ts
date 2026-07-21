import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("passive runtime selectors are attached to visible content rather than containers with interactive descendants", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");
  const feedback = source("src/features/practice/PracticeFeedbackBlock.tsx");

  assert.match(home, /<Card style=\{styles\.focusStrip\}>/);
  assert.match(home, /<Text style=\{styles\.focusTitle\} testID=\{runtimeSelectors\.home\.trackCard\(activeTrack\.id\)\}>/);
  assert.doesNotMatch(home, /<Card style=\{styles\.focusStrip\} testID=/);
  assert.match(feedback, /<Text style=\{styles\.result\} testID=\{runtimeSelectors\.session\.result\(itemId, feedback\.result\)\}>/);
  assert.doesNotMatch(feedback, /<View style=\{styles\.container\} testID=\{runtimeSelectors\.session\.result/);
});

test("active-session resume has a non-interactive container and a separate continue control", () => {
  const home = source("src/features/home/tabs/HomeTab.tsx");
  const resume = home.slice(home.indexOf("function ResumeRecommendation"));

  assert.match(home, /item\.action\.kind === "resume_active_session"/);
  assert.match(resume, /<Card style=\{style \? \{ \.\.\.styles\.resumeCard, \.\.\.style \} : styles\.resumeCard\} testID=\{runtimeSelectors\.resume\.card\(action\.sessionId\)\}>/);
  assert.doesNotMatch(resume, /<Card[^>]*onPress=/);
  assert.match(resume, /runtimeSelectors\.resume\.title\(action\.sessionId\)/);
  assert.match(resume, /runtimeSelectors\.resume\.status\(action\.sessionId\)/);
  assert.match(resume, /runtimeSelectors\.resume\.continue\(action\.sessionId\)/);
});

test("progress, simulation, and simulation summary selectors use canonical identities", () => {
  const progress = source("src/features/home/tabs/ProgressTab.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const navigator = source("src/features/simulation/SimulationNavigator.tsx");
  const summary = source("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx");

  assert.match(progress, /testID=\{runtimeSelectors\.progress\.node\(node\.id\)\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.root\(runtimeIdentity\.sessionId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.question\(itemId\)/);
  assert.match(simulation, /runtimeSelectors\.simulation\.option\(itemId, optionId\)/);
  assert.doesNotMatch(simulation, /value:\$\{index \+ 1\}/);
  assert.match(simulation, /runtimeSelectors\.simulation\.action\(sessionId, action\.id\)/);
  assert.match(navigator, /runtimeSelectors\.simulation\.navigator\(position\.occurrenceId\)/);
  assert.doesNotMatch(navigator, /simulation-navigator-position-/);
  assert.match(summary, /runtimeSelectors\.summary\.root\(sessionId\)/);
});
