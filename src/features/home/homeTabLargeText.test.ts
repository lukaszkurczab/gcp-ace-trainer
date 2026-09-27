import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");

test("Home stacks quiet-layered context and decision metadata at large text sizes", () => {
  assert.match(source, /const \{ fontScale(?:, width)? \} = useWindowDimensions\(\)/);
  assert.match(source, /const largeText = fontScale >= 1\.3/);
  assert.match(source, /largeText \? styles\.trackContextLargeText : null/);
  assert.match(source, /largeText \? styles\.decisionHeadingLargeText : null/);
  assert.match(source, /decisionHeading:\s*\{\s*alignItems:\s*"flex-start",\s*flexDirection:\s*"row"/);
  assert.match(source, /decisionHeadingLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);
  assert.match(source, /decisionHeadingLargeText:\s*\{\s*alignItems:\s*"flex-start",\s*flexDirection:\s*"column"/);
  assert.match(source, /largeText \? styles\.goalOnboardingHeadingLargeText : null/);
  assert.match(source, /goalOnboardingHeadingLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);

  const primaryButton = source.match(/<Button\s+disabled=\{!decisionEnabled\}[\s\S]*?style=\{styles\.startButton\}[\s\S]*?<\/Button>/)?.[0];
  assert.ok(primaryButton, "the primary decision button remains present");
  assert.match(primaryButton, /onHomePlanAction\(readyHomePlan\.guidance\.home\.primary\)/);
  assert.match(primaryButton, /onRetryHomePlan\(\)/);
  assert.match(primaryButton, /onRecommendationAction\(recommendation\.action\)/);
  assert.match(primaryButton, /onStartLearning\(model\.topicId\)/);
});
