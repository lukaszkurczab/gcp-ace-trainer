import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { getTrackDisplay } from "../../domain";
import { session } from "../../testing/journalTestSupport";
import { ROUTES } from "../../constants/routes";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";
import { projectCodingHomeRecommendation } from "./codingHomeRecommendation";

const trackId = "coding-interview-dsa-problem-solving", modeId = "coding-interview-approach-challenge";
const active = { ...session(), trackId, modeId };
function recommendation(current = active, dashboardId = active.id) {
  return projectCodingHomeRecommendation({ activeTrack: getTrackDisplay(trackId), activeSession: current,
    dashboardError: null, algorithmsDashboard: { trackId, activeSessionId: dashboardId, attemptCount: 1, dueReviewCount: 0, manualReviewCount: 0 } }, "complexity_and_constraints")[0]!;
}

test("Home resumes exactly recognized ACM while unknown and mismatched sessions remain blocked", () => {
  const result = recommendation(); assert.equal(result.enabled, true);
  assert.deepEqual(result.action, { kind: "resume_active_practice", trackId, modeId, sessionId: active.id });
  assert.equal(recommendation({ ...active, modeId: "coding-interview-unknown" }).enabled, false);
  assert.equal(recommendation(active, "ordinary-dashboard-only").enabled, true, "ACM uses its own exact artifact rather than the ordinary dashboard pin");
  assert.equal(recommendation({ ...active, modeId: "coding-interview-guided-practice" }, "different-session").enabled, false);
});

test("actual Home action validates the durable session identity before routing ACM", async () => {
  const source = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  const ast = ts.createSourceFile("HomeScreen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let command: ts.FunctionDeclaration | undefined;
  const visit = (node: ts.Node) => { if (ts.isFunctionDeclaration(node) && node.name?.text === "handleRecommendationAction") command = node; ts.forEachChild(node, visit); };
  visit(ast); assert.ok(command);
  const code = ts.transpileModule(`(${command.getText(ast)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const current of [active, { ...active, id: "changed" }, { ...active, modeId: "coding-interview-guided-practice" }]) {
    const routes: unknown[] = [], alerts: unknown[] = [];
    const run = vm.runInNewContext(code, { markStartup() {}, resumeActiveTrainingSession: async () => current,
      homeResumeContext: null, navigation: { navigate: (name: string) => routes.push(name) }, ROUTES,
      Alert: { alert: (...args: unknown[]) => alerts.push(args) }, TrainingApplicationFailure, describeOperationalFailure: (_: unknown, fallback: string) => fallback });
    await run(recommendation().action);
    assert.deepEqual(routes, current === active ? [ROUTES.APPROACH_CHALLENGE] : []);
    assert.equal(alerts.length, current === active ? 0 : 1);
  }
});
