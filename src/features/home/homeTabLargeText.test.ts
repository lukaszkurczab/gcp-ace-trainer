import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const card = readFileSync("src/features/home/tabs/HomeDecisionCard.tsx", "utf8");
const source = readFileSync("src/features/home/tabs/HomeTab.tsx", "utf8");

test("Home stacks quiet-layered context and decision metadata at large text sizes", () => {
  assert.match(source, /const \{ fontScale(?:, width)? \} = useWindowDimensions\(\)/);
  assert.match(source, /const largeText = fontScale >= 1\.3/);
  assert.match(source, /largeText \? styles\.trackContextLargeText : null/);
  assert.match(card, /largeText \? styles\.decisionHeadingLargeText : null/);
  assert.match(card, /decisionHeading:\s*\{\s*alignItems:\s*"flex-start",\s*flexDirection:\s*"row"/);
  assert.match(card, /decisionHeadingLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);
  assert.match(card, /decisionHeadingLargeText:\s*\{\s*alignItems:\s*"flex-start",\s*flexDirection:\s*"column"/);
  assert.match(source, /largeText \? styles\.goalOnboardingHeadingLargeText : null/);
  assert.match(source, /goalOnboardingHeadingLargeText:\s*\{[\s\S]*flexDirection:\s*"column"/);

  const primaryButton = source.match(/<HomeDecisionCard[\s\S]*?onPrimary=\{[\s\S]*?\n      \/>/)?.[0];
  assert.match(card, /<Button disabled=\{!enabled\} onPress=\{onPrimary\}/);
  assert.ok(primaryButton, "the primary decision button remains present");
  assert.match(primaryButton, /onHomePlanAction\(readyHomePlan\.guidance\.home\.primary\)/);
  assert.match(primaryButton, /onRetryHomePlan\(\)/);
  assert.match(primaryButton, /onRecommendationAction\(recommendation\.action\)/);
  assert.match(primaryButton, /onStartLearning\(model\.topicId\)/);
});
