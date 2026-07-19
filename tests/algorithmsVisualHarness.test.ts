import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { APPROVED_ALGORITHMS_AUDIT_STATES, buildAlgorithmsVisualFixtures } from "../audit/algorithms-ui/fixtureCatalog";

test("Algorithms visual harness is complete, artifact-backed, and isolated from production", () => {
  const fixtures = buildAlgorithmsVisualFixtures();
  assert.equal(fixtures.length, 44);
  assert.deepEqual(fixtures.map((fixture) => fixture.id), APPROVED_ALGORITHMS_AUDIT_STATES);
  assert.deepEqual(new Set(fixtures.map((fixture) => fixture.interaction)), new Set(["choice", "ordering", "complexity"]));
  const production = ["App.tsx", "src/navigation/RootNavigator.tsx", "src/application/bootstrap/applicationBootstrap.ts", "src/application/bootstrap/trainingLifecycleComposition.ts"]
    .map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(production, /audit\/algorithms-ui|AlgorithmsVisualHarness|fixtureCatalog/);
  assert.equal(JSON.parse(readFileSync("package.json", "utf8")).main, "expo/AppEntry");
  assert.match(readFileSync("audit/algorithms-ui/App.tsx", "utf8"), /AlgorithmsVisualHarness/);
  assert.match(readFileSync("audit/algorithms-ui/index.ts", "utf8"), /registerRootComponent/);
  assert.match(readFileSync("audit/algorithms-ui/metro.config.js", "utf8"), /projectRoot/);
  assert.doesNotMatch(readFileSync("audit/algorithms-ui/fixtureCatalog.ts", "utf8"), /mmkv|storage\/repositories|writeCanonical|save[A-Z]/);
});

test("active UX/UI packet rejects the historical core-flow selectors and assigns every state", () => {
  const config = JSON.parse(readFileSync(".audit/ux-ui/audit.config.json", "utf8"));
  assert.equal(config.auditId, "algorithms-stage3-visual-harness-v1");
  for (const retired of ["Close practice session", "ITEM 1 OF 10", "Correct answer", "Needs review", "Explanation heading", "Cloud Certification"]) {
    for (const flow of config.flows) assert.equal(readFileSync(flow.path, "utf8").includes(retired), false, retired);
  }
  const states = config.screens.flatMap((screen: { states: readonly { id: string; capturedBy?: string; manualCapture?: string }[] }) => screen.states);
  assert.equal(states.length, 44);
  assert.ok(states.every((state: { capturedBy?: string; manualCapture?: string }) => state.capturedBy || state.manualCapture));
});
