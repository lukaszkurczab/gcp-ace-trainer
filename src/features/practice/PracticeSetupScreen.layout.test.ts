import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./PracticeSetupScreen.tsx", import.meta.url), "utf8");

test("Premium offer stacks copy and actions instead of squeezing copy beside the action", () => {
  assert.match(source, /style=\{\[styles\.reviewCard, styles\.premiumOfferCard\]\}/u);
  assert.match(source, /premiumOfferCard:\s*\{[\s\S]*?alignItems: "stretch",[\s\S]*?flexDirection: "column",[\s\S]*?gap: spacing\.md,/u);
});

test("recommended learning-unit scope appears below setup context and before the topic list", () => {
  const intro = source.indexOf('{!compactCodingPractice ? <View style={styles.intro}>');
  const recommendation = source.indexOf('<Text key={`practice-setup-focused-unit-title-');
  const topicList = source.indexOf('focusTopics.map((focusTopic) =>');

  assert.ok(intro >= 0);
  assert.ok(recommendation > intro, "the recommendation follows the setup header and subtitle");
  assert.ok(topicList > recommendation, "the recommendation remains above the long topic list");
});
