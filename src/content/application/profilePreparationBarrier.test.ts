import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { prepareLifecycleAfterProfileCompletion } from "./profilePreparationBarrier";

test("profile completion settles before lifecycle composition and resume authorization", async () => {
  const events: string[] = [];
  const result = await prepareLifecycleAfterProfileCompletion(
    async () => {
      await Promise.resolve();
      events.push("profile-complete");
    },
    async () => {
      events.push("lifecycle-composed");
      events.push("resume-authorized");
      return "ready";
    },
  );

  assert.equal(result, "ready");
  assert.deepEqual(events, ["profile-complete", "lifecycle-composed", "resume-authorized"]);
});

test("application bootstrap wires account completion ahead of lifecycle composition", () => {
  const app = readFileSync("App.tsx", "utf8");
  const gate = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");

  assert.match(app, /<ContentPreparationGate completeAccountPreparation=\{completeProfilePreparation\}>/);
  assert.match(gate, /prepareLifecycleAfterProfileCompletion\(completeAccountPreparation, async \(\) => composeTrainingLifecycleUseCases/);
  assert.match(gate, /authorize: \(\) => accountRef\.current\.authorizePremiumSessionStart\(\)/);
});
