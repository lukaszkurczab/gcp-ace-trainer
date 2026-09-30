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

test("primary session CTA routes activations through the phase-identity carry-over guard", () => {
  assert.match(surface, /lastPrimaryActionActivation = useRef<PracticePrimaryActionActivation \| null>\(null\)/);
  assert.match(surface, /buildPracticePrimaryActionIdentity\(\{[\s\S]*?actionLabel: props\.primaryAction\.label[\s\S]*?itemId: displayedQuestionId[\s\S]*?phase: props\.phase[\s\S]*?sessionId: props\.runtimeIdentity\?\.sessionId/);
  assert.match(surface, /acceptPracticePrimaryActionActivation\(lastPrimaryActionActivation\.current, identity, Date\.now\(\)\)/);
  assert.match(surface, /if \(!activation\.accepted\) return;\s*lastPrimaryActionActivation\.current = activation\.lastAccepted;\s*props\.onPrimaryAction\(\)/);
  assert.match(surface, /<ActionBar \{\.\.\.props\} onPrimaryAction=\{handlePrimaryAction\} \/>/);
  assert.match(surface, /onPress=\{props\.onPrimaryAction \?\? noop\}/);
  assert.doesNotMatch(surface, /setTimeout|requestAnimationFrame/);
});

test("fixture chrome reuses the Practice shell slots without adding a nested scroll owner", () => {
  assert.match(surface, /actionBar=\{props\.phase === "preparing" \? undefined : props\.actionBar \?\? <ActionBar \{\.\.\.props\} onPrimaryAction=\{handlePrimaryAction\} \/>\}/);
  assert.match(surface, /headerAction=\{props\.headerAction\}/);

  const preview = readFileSync("src/features/exam/CertificationPracticeFeedbackPreview.tsx", "utf8");
  assert.match(preview, /<PracticeSessionSurface[\s\S]*?actionBar=\{actionBar\}[\s\S]*?headerAction=\{headerAction\}/);
  assert.doesNotMatch(preview, /return <Screen key=\{preview\.question\.questionId\}/);
  assert.match(preview, /accessibilityLabel="Back to results"/);
  assert.match(preview, /accessibilityLabel="Exit fixture"/);
  assert.match(preview, /practice-preview:previous/);
  assert.match(preview, /practice-preview:next/);
  assert.doesNotMatch(preview, /primaryAction=|onPrimaryAction=/);
});
