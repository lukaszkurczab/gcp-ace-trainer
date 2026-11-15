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
  // T2.5: the button and a tap queued on the native first screen share one named handler.
  assert.match(primaryButton, /onPrimary=\{runPrimary\}/);
  const primaryHandler = source.match(/function runPrimary\(\): void \{[\s\S]*?\n  \}\n/)?.[0];
  assert.ok(primaryHandler, "the primary handler remains present");
  assert.match(primaryHandler, /onHomePlanAction\(readyHomePlan\.guidance\.home\.primary\)/);
  assert.match(primaryHandler, /onRetryHomePlan\(\)/);
  assert.match(primaryHandler, /onRecommendationAction\(recommendation\.action\)/);
  assert.match(primaryHandler, /onStartLearning\(model\.topicId\)/);
});
