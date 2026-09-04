import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runtimeSelectors } from "./runtimeSelectors";
import { selectAlgorithmSessionPlan } from "../tracks/coding-interview";
import { getCodingPackageTestCatalog, prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

const flow = readFileSync(".maestro/m2-custom-10-at-session-end.yaml", "utf8").replace(
  "- runFlow: completed-practice-result-review.yaml",
  readFileSync(".maestro/completed-practice-result-review.yaml", "utf8"),
);
const resumeFlow = readFileSync(".maestro/m4-custom-after-each-answer.yaml", "utf8");
const manifest = JSON.parse(readFileSync(".maestro/m2-custom-10-at-session-end.expected-session.json", "utf8")) as Readonly<{
  session: Readonly<{ modeId: "coding-interview-custom-practice"; roadmapNodeId: string; sessionId: string }>;
  items: readonly Readonly<{ itemId: string }>[];
}>;

test("user-testing core journey preserves durable leave-and-resume alongside summary, progress, and terminal relaunch evidence", async () => {
  await prepareBundledTestPackages();
  const catalog = getCodingPackageTestCatalog();
  const selection = selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: manifest.session.modeId, sessionLength: 10, scope: { roadmapNodeId: manifest.session.roadmapNodeId } });
  assert.deepEqual(selection.items.map((item) => item.id), manifest.items.map((item) => item.itemId));
  assert.match(flow, new RegExp(escape(runtimeSelectors.practice.customEntry())));
  const sessionId = manifest.session.sessionId;
  const leaveIndex = resumeFlow.indexOf(runtimeSelectors.session.leave(sessionId));
  const leaveAndResumeIndex = resumeFlow.indexOf(runtimeSelectors.session.leaveAndResume(sessionId));
  const resumeCardIndex = resumeFlow.indexOf(runtimeSelectors.resume.card(sessionId));
  const resumeContinueIndex = resumeFlow.indexOf(runtimeSelectors.resume.continue(sessionId));
  const resumedSessionIndex = resumeFlow.lastIndexOf(runtimeSelectors.session.root(sessionId));
  assert.ok(leaveIndex >= 0 && leaveAndResumeIndex > leaveIndex, "the durable leave choice must follow the session leave command");
  assert.ok(resumeCardIndex > leaveAndResumeIndex && resumeContinueIndex > resumeCardIndex, "relaunch must expose the exact resumable session before continuation");
  assert.ok(resumedSessionIndex > resumeContinueIndex, "the exact session must be restored after the Resume CTA");
  assert.match(flow, new RegExp(escape(runtimeSelectors.summary.root(manifest.session.sessionId))));
  assert.match(flow, new RegExp(`assertNotVisible:\\s+id: "${escape(runtimeSelectors.resume.card(manifest.session.sessionId))}"`));
  assert.match(flow, new RegExp(escape(runtimeSelectors.progress.root())));
});

function escape(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
