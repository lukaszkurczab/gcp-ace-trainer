import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx", "utf8");
const panel = readFileSync("src/features/simulation/operation/SimulationOperationPanel.tsx", "utf8");
const lifecycle = readFileSync("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "utf8");
const facade = readFileSync("src/application/coding-interview/codingInterviewSessionFacade.ts", "utf8");

test("simulation operation surface renders only declared state actions and never a generic retry", () => {
  assert.match(screen, /operation\.kind === "saving"/);
  assert.match(screen, /operation\.kind === "save_failed" \|\| operation\.kind === "stale_revision"/);
  assert.match(screen, /operation\.kind === "navigation_failed" \|\| operation\.kind === "save_and_continue_advance_recovery"/);
  assert.match(screen, /operation\.kind === "finalization_journal_failed" \|\| operation\.kind === "materialization_failed"/);
  assert.match(screen, /id: "simulation-keep-editing", label: "Keep editing"/);
  assert.match(screen, /tertiary: \{ id: "simulation-leave-resumable", label: "Leave simulation", onPress: callbacks\.onLeave, variant: "ghost" \}/);
  assert.match(screen, /noticeMessage: "Couldn't save this response\. Your current answer is still here\."/);
  assert.match(screen, /noticeMessage: "Navigation restored\. Your saved response is ready to continue\."/);
  assert.match(screen, /id: operation\.error\.allowedAction === "retry_same_command" \? "simulation-finish" : "simulation-recover"/);
  assert.doesNotMatch(screen, /id: "retry"/);
  assert.doesNotMatch(screen, /label: "Try again", onPress: retry/);
  assert.match(panel, /accessibilityLiveRegion="polite"/);
  assert.match(panel, /name="alert-triangle"/);
  assert.match(panel, /notice:\s*\{[\s\S]*?borderRadius:\s*radius\.lg[\s\S]*?gap:\s*spacing\.md[\s\S]*?padding:\s*spacing\.lg/);
  assert.match(readFileSync("src/features/practice/PracticeSessionSurface.tsx", "utf8"), /noticeError:\s*\{[\s\S]*?borderRadius:\s*radius\.lg[\s\S]*?gap:\s*spacing\.md[\s\S]*?padding:\s*spacing\.lg/);
  assert.match(panel, /ActivityIndicator/);
  assert.match(lifecycle, /resumeEditableSimulationAfterSaveFailure/);
  assert.match(lifecycle, /operation\.kind !== "save_failed" && operation\.kind !== "stale_revision"/);
  assert.match(facade, /operation\.error\.allowedAction !== "recover"/);
  assert.match(readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8"), /isSimulationOperationNotice\(projection\.operation\)/);
  const surface = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");
  assert.match(surface, /SimulationRecoverySurface/);
  assert.match(surface, /recoveryRegion:\s*\{[\s\S]*?gap:\s*spacing\.lg[\s\S]*?paddingBottom:\s*spacing\.lg[\s\S]*?paddingHorizontal:\s*spacing\.xl[\s\S]*?paddingTop:\s*spacing\.xl/);
  assert.match(surface, /recoveryActions:\s*\{\s*gap:\s*spacing\.md[\s\S]*?width:\s*"100%"\s*\}/);
  assert.doesNotMatch(surface, /actionBarOperation/);
});

test("simulation pause/end uses one Figma action sheet and keeps the destructive command reachable", () => {
  assert.match(screen, /overlay === "pause_end"/);
  assert.match(screen, /title: "Action required"/);
  assert.match(screen, /description: "Review this action before continuing\."/);
  assert.match(screen, /label: "Keep working"/);
  assert.match(screen, /label: "Leave and resume later"/);
  assert.match(screen, /label: "End simulation"/);
  assert.match(screen, /destructive:/);
  assert.doesNotMatch(screen, /overlay === "abandon"/);
  const surface = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");
  assert.match(surface, /confirmationDestructive/);
  assert.match(surface, /confirmationSheet:\s*\{[^}]*borderTopLeftRadius:\s*radius\.sheet[^}]*borderTopRightRadius:\s*radius\.sheet/);
});

test("simulation finish confirmation uses the Figma action-required copy and review dismissal", () => {
  assert.match(screen, /title: "Action required"/);
  assert.match(screen, /description: "Review this action before continuing\."/);
  assert.match(screen, /label: "Finish simulation"/);
  assert.match(screen, /label: "Keep reviewing"/);
  const surface = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");
  assert.match(surface, /accessibilityLabel=\{t\(dismiss\.label\)\}/);
  assert.match(surface, /confirmationTitle:\s*\{[^}]*fontSize:\s*22[^}]*fontWeight:\s*"600"[^}]*letterSpacing:\s*-0\.3[^}]*lineHeight:\s*28/);
  assert.match(surface, /layout=\{projection\.confirmation \? "simulationConfirmation"/);
});
