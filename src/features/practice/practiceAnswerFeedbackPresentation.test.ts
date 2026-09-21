import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const answerOptionSource = readFileSync(new URL("../../components/AnswerOption.tsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("./PracticeResponseControls.tsx", import.meta.url), "utf8");
const reviewSource = readFileSync(new URL("../review/AnswerReviewScreen.tsx", import.meta.url), "utf8");

test("answer feedback uses visible text, an icon and distinct outlined surfaces", () => {
  assert.match(answerOptionSource, /statusLabel \? \(/u);
  assert.match(answerOptionSource, /statusIcon\(state\)/u);
  assert.match(answerOptionSource, /omittedCorrect: \{[^}]*borderStyle: "dashed"/u);
  assert.match(answerOptionSource, /statusTextCorrect/u);
  assert.match(answerOptionSource, /statusTextIncorrect/u);
  assert.match(answerOptionSource, /statusTextNeutral/u);
  assert.match(answerOptionSource, /statusBadge: \{[^}]*flexWrap: "wrap"[^}]*maxWidth: "100%"/u);
  assert.match(answerOptionSource, /statusText: \{[^}]*flexShrink: 1/u);
});

test("practice and review expose localized status through label, value and visible badge", () => {
  assert.match(controlsSource, /accessibilityLabel=\{correctness \? `\$\{option\.text\}\. \$\{t\(correctness\)\}` : option\.text\}/u);
  assert.match(controlsSource, /accessibilityValue=\{correctness \? \{ text: t\(correctness\) \} : undefined\}/u);
  assert.match(controlsSource, /statusLabel=\{correctness \? t\(correctness\) : undefined\}/u);
  assert.match(reviewSource, /accessibilityState=\{\{ checked: selected\.has\(option\.optionId\), disabled: true \}\}/u);
  assert.match(reviewSource, /accessibilityValue=\{\{ text: t\(status\) \}\}/u);
  assert.match(reviewSource, /statusLabel=\{t\(status\)\}/u);
});
