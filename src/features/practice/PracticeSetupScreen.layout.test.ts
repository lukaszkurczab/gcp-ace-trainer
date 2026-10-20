import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./PracticeSetupScreen.tsx", import.meta.url), "utf8");

test("Practice setup shows one selected topic and leaves topic preparation to Choose topic", () => {
  assert.match(source, /testID=\{runtimeSelectors\.practice\.selectedTopic\(\)\}/u);
  assert.match(source, /testID=\{runtimeSelectors\.practice\.changeTopic\(\)\}/u);
  assert.doesNotMatch(source, /focusTopics\.map\(/u);
  assert.doesNotMatch(source, /premiumOfferCard/u);
  const chooser = readFileSync(new URL("./TopicRoadmapScreen.tsx", import.meta.url), "utf8");
  assert.match(chooser, /listAvailablePremiumNodeOffers\(activeTrack\.id\)/u);
  assert.match(chooser, /installPremiumNodePackage\(offer\.offerId/u);
});

test("recommended learning-unit scope appears before the selected-topic row", () => {
  const intro = source.indexOf('{focusPractice ? <ScreenHeader');
  const recommendation = source.indexOf('<Text key={`practice-setup-focused-unit-title-');
  const selectedTopic = source.indexOf('testID={runtimeSelectors.practice.selectedTopic()}');

  assert.ok(intro >= 0);
  assert.ok(recommendation > intro, "the recommendation follows the setup header and subtitle");
  assert.ok(selectedTopic > recommendation, "the recommendation remains above the selected topic");
});
