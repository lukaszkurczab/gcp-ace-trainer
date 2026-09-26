import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("Home presents a non-blocking recover-plan notice with durable dismissal", () => {
  const home = source("src/features/home/HomeScreen.tsx");
  const provider = source("src/application/account/AccountSessionProvider.tsx");

  assert.match(home, /learningPlanRecovery && !learningPlanRecovery\.dismissed/);
  assert.match(home, /learningPlanRecovery\.trackId === activeTrackId/);
  assert.match(home, /runtimeSelectors\.home\.learningPlanRecovery\(\)/);
  assert.match(home, /runtimeSelectors\.home\.learningPlanRecoveryCreate\(\)/);
  assert.match(home, /learningPlanProposalCoordinator\.create\(activeTrackId\)/);
  assert.match(home, /runtimeSelectors\.home\.learningPlanRecoveryDismiss\(\)/);
  assert.match(home, /account\.dismissLearningPlanRecovery\(learningPlanRecovery\.incidentId\)/);
  assert.match(provider, /dismissAccountLearningPlanRecovery\(current\.backendUser\.id, incidentId\)/);
  assert.match(provider, /learningPlanRecovery: \{ \.\.\.incident, dismissed: true \}/);
});
