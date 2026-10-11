import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createProfilePreparationHandoffOwner } from "../../application/account/profilePreparationHandoff";
import { prepareLifecycleAfterProfileCompletion } from "./profilePreparationBarrier";

test("profile completion settles before lifecycle composition and resume authorization", async () => {
  const events: string[] = [];
  const pendingSteps: (string | null)[] = [];
  const owner = createProfilePreparationHandoffOwner<void>();
  const handoff = owner.begin();
  const result = await prepareLifecycleAfterProfileCompletion(
    handoff,
    (token) => owner.run(token, async () => { await Promise.resolve(); events.push("profile-complete"); }),
    async () => {
      events.push("lifecycle-composed");
      events.push("resume-authorized");
      return "ready";
    },
    (step) => { pendingSteps.push(step); },
  );

  assert.equal(result, "ready");
  assert.deepEqual(events, ["profile-complete", "lifecycle-composed", "resume-authorized"]);
  assert.deepEqual(pendingSteps, ["profile_completion", "lifecycle_composition", null]);
});

test("a superseded profile handoff cannot compose the shared lifecycle after completion", async () => {
  const owner = createProfilePreparationHandoffOwner<void>();
  const first = owner.begin();
  let release!: () => void;
  let completionStarted!: () => void;
  const started = new Promise<void>((resolve) => { completionStarted = resolve; });
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let compositions = 0;

  const preparation = prepareLifecycleAfterProfileCompletion(first, (token) => owner.run(token, async () => {
    completionStarted();
    await pending;
  }), async () => { compositions += 1; });
  await started;
  const second = owner.begin();
  release();

  await assert.rejects(preparation, /superseded/u);
  assert.equal(first.isCurrent(), false);
  assert.equal(second.isCurrent(), true);
  assert.equal(compositions, 0);
});

test("a ready profile without a pending handoff composes without a completion call", async () => {
  let completions = 0;
  let compositions = 0;
  const result = await prepareLifecycleAfterProfileCompletion(null, async () => { completions += 1; }, async () => {
    compositions += 1;
    return "ready";
  });
  assert.equal(result, "ready");
  assert.equal(completions, 0);
  assert.equal(compositions, 1);
});

test("application bootstrap wires account completion ahead of lifecycle composition", () => {
  const app = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  const gate = readFileSync("src/content/application/ContentPreparationGate.tsx", "utf8");

  assert.match(app, /<ContentPreparationGate completeAccountPreparation=\{completeProfilePreparation\} handoffToken=\{profilePreparationHandoffToken\}>/);
  assert.match(gate, /prepareLifecycleAfterProfileCompletion\(activeHandoffToken, \(token\) => completeAccountPreparationRef\.current\(token\), async \(\) => composeTrainingLifecycleUseCases/);
  assert.match(gate, /\}, \[activeHandoffToken, bootstrapRevision, t\]\)/);
  assert.match(gate, /authorize: \(\) => accountRef\.current\.authorizePremiumSessionStart\(\)/);
});
