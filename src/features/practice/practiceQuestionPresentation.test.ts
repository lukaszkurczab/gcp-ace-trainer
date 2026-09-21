import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const card = readFileSync("src/features/practice/PracticeQuestionCard.tsx", "utf8");
const surface = readFileSync("src/features/practice/PracticeSessionSurface.tsx", "utf8");

test("Claude structured question presentation is selected only from canonical track identity", () => {
  assert.match(surface, /trackId === CLAUDE_CERTIFIED_ARCHITECT_PROFESSIONAL_CERTIFICATION_TRACK_ID/);
  assert.match(surface, /\? "structuredCertificationPrompt" : "default"/);
  assert.doesNotMatch(surface, /prompt\.(includes|match)|constraints\.(includes|some)/);
});

test("structured presentation preserves authored prompt and constraint strings", () => {
  assert.match(card, />\{question\.prompt\}<\/Text>/);
  assert.match(card, />• \{constraint\}<\/Text>/);
  assert.match(card, /variant = "default"/);
  assert.match(card, /fontSize: 20[\s\S]*?lineHeight: 28/);
});

test("structured constraints have localized semantics and stable identity", () => {
  assert.match(card, /accessibilityRole="header"[\s\S]*?t\("Key constraints"\)/);
  assert.match(card, /runtimeSelectors\.session\.question\(question\.itemId\)\}:constraints/);
  assert.match(card, /maxFontSizeMultiplier=\{2\}/);
});
