import assert from "node:assert/strict";
import test from "node:test";
import {
  DEVELOPMENT_INTERRUPT_GOAL_PLAN_ACCEPTANCE_URL,
  handleGoalPlanAcceptanceInterruptionUrl,
  parseGoalPlanAcceptanceInterruptionCommand,
} from "./goalPlanAcceptanceInterruptionCommand";

const commandUrl = `${DEVELOPMENT_INTERRUPT_GOAL_PLAN_ACCEPTANCE_URL}?nonce=abcdefghijklmnop123456&proposalId=proposal%3A123&trackId=coding-interview-dsa-problem-solving`;

test("goal-plan interruption command accepts only its exact smoke URL fields", () => {
  assert.deepEqual(parseGoalPlanAcceptanceInterruptionCommand(commandUrl), {
    nonce: "abcdefghijklmnop123456", proposalId: "proposal:123", trackId: "coding-interview-dsa-problem-solving",
  });
  assert.equal(parseGoalPlanAcceptanceInterruptionCommand(`${commandUrl}&reset=true`), null);
  assert.equal(parseGoalPlanAcceptanceInterruptionCommand(`${commandUrl}&nonce=another_nonce_123456`), null);
  assert.equal(parseGoalPlanAcceptanceInterruptionCommand(commandUrl.replace("trackId=coding-interview-dsa-problem-solving", "trackId=unknown")), null);
  assert.equal(parseGoalPlanAcceptanceInterruptionCommand(`${commandUrl}#fragment`), null);
});

test("the interruption arm is unavailable in production and rejects an unauthenticated smoke actor", async () => {
  const unavailable = await handleGoalPlanAcceptanceInterruptionUrl(commandUrl, {
    development: false, smoke: true, authenticated: true, accountSynced: true,
    firebaseUid: "uid", accountId: "account", captureActorFence: () => null,
  });
  assert.equal(unavailable, "unavailable_in_production");
  const rejected = await handleGoalPlanAcceptanceInterruptionUrl(commandUrl, {
    development: true, smoke: true, authenticated: false, accountSynced: true,
    firebaseUid: null, accountId: null, captureActorFence: () => null,
  });
  assert.equal(rejected, "rejected");
});

test("the interruption arm rejects an unsynced account and a stale authenticated actor before probing storage", async () => {
  let captured = 0;
  const base = {
    development: true, smoke: true, authenticated: true, accountSynced: false,
    firebaseUid: "uid", accountId: "account", captureActorFence: () => { captured++; return null; },
  };
  assert.equal(await handleGoalPlanAcceptanceInterruptionUrl(commandUrl, base), "rejected");
  assert.equal(captured, 0, "unsynced state rejects before actor or storage inspection");

  assert.equal(await handleGoalPlanAcceptanceInterruptionUrl(commandUrl, {
    ...base, accountSynced: true,
    captureActorFence: () => ({ isCurrent: () => false, isCurrentSdkUid: () => false }),
  }), "rejected");
});
