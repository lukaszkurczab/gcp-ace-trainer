import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Approach Challenge is an independently registered route with direct hub and resume entries", () => {
  const routes = source("../../constants/routes.ts");
  const types = source("../../navigation/types.ts");
  const navigator = source("../../navigation/RootNavigator.tsx");
  const hub = source("./PracticeHubScreen.tsx");
  const home = source("../home/HomeScreen.tsx");
  const screen = source("./ApproachChallengeScreen.tsx");

  assert.match(routes, /APPROACH_CHALLENGE:\s*"ApproachChallenge"/u);
  assert.match(types, /\[ROUTES\.APPROACH_CHALLENGE\]:\s*\{ sessionId\?: string \} \| undefined/u);
  assert.match(navigator, /name=\{ROUTES\.APPROACH_CHALLENGE\}\s+component=\{AccountBackedApproachChallengeScreen\}/u);
  assert.match(hub, /navigation\.navigate\(ROUTES\.APPROACH_CHALLENGE\)/u);
  assert.ok(home.includes("session.modeId !== action.modeId"), "Home confirms the resumed durable mode matches its recommendation");
  assert.ok(home.includes('action.modeId === "coding-interview-approach-challenge"'), "Home recognizes the ACM lifecycle mode");
  assert.ok(home.includes("navigation.navigate(ROUTES.APPROACH_CHALLENGE)"), "Home continues ACM through its dedicated route");
  assert.match(screen, /resolveApproachChallengeEntry\(\{[\s\S]*?requestedSessionId: sessionId[\s\S]*?getExactHistory: getApproachChallengeDetailedHistory/u);
  assert.match(screen, /route\.params\?\.sessionId\s*\|\|\s*entryKindRef\.current !== "setup"/u);
  assert.match(screen, /entryKindRef\.current === "setup"/u);
  assert.match(screen, /disabled=\{busy \|\| noFamilies \|\| \(selection\.status !== "ready" && selection\.status !== "confirmation_required"\)\}/u);
});


test("ACM exact review has an independent typed route and a history-only reader", () => {
  assert.match(source("../../constants/routes.ts"), /APPROACH_CHALLENGE_REVIEW: "ApproachChallengeReview"/u);
  assert.match(source("../../navigation/types.ts"), /APPROACH_CHALLENGE_REVIEW\]: \{ sessionId: string; approachOccurrenceId: string \}/u);
  const review = source("./ApproachChallengeReviewScreen.tsx");
  assert.ok(review.includes("getApproachChallengeDetailedHistory(sessionId)"));
  assert.doesNotMatch(review, /loadActiveTrainingSession|resumeActiveTrainingSession|startApproachChallengeSession|submitApproachChallengeStage/u);
});
