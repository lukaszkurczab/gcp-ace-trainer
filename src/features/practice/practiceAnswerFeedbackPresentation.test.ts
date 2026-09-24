import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const answerOptionSource = readFileSync(new URL("../../components/AnswerOption.tsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("./PracticeResponseControls.tsx", import.meta.url), "utf8");
const reviewSource = readFileSync(new URL("../review/AnswerReviewScreen.tsx", import.meta.url), "utf8");

test("answer cards show state through the card and letter without a redundant status row", () => {
  assert.doesNotMatch(answerOptionSource, /statusLabel|statusBadge|statusIcon|statusText|statusCorrect|statusIncorrect|statusNeutral|statusSelected/u);
  assert.match(answerOptionSource, /omittedCorrect: \{[^}]*borderStyle: "dashed"/u);
  assert.match(answerOptionSource, /notSelected: \{[^}]*borderColor: palette\.borderStrong/u);
  assert.match(answerOptionSource, /correct: \{[^}]*borderColor: palette\.success[^}]*borderWidth: 2/u);
  assert.match(answerOptionSource, /incorrect: \{[^}]*borderColor: palette\.danger[^}]*borderWidth: 2/u);
  assert.match(answerOptionSource, /selected: \{[^}]*borderColor: palette\.primary/u);
});

test("practice and review keep correctness and selection in accessibility semantics", () => {
  assert.match(controlsSource, /accessibilityLabel=\{correctness \? `\$\{option\.text\}\. \$\{t\(correctness\)\}` : option\.text\}/u);
  assert.match(controlsSource, /accessibilityState=\{\{ checked: selected, disabled: !editable \}\}/u);
  assert.match(controlsSource, /accessibilityValue=\{correctness \? \{ text: t\(correctness\) \} : undefined\}/u);
  assert.doesNotMatch(controlsSource, /statusLabel/u);
  assert.match(reviewSource, /accessibilityLabel=\{`\$\{option\.text\}\. \$\{t\(status\)\}`\}/u);
  assert.match(reviewSource, /accessibilityState=\{\{ checked: selected\.has\(option\.optionId\), disabled: true \}\}/u);
  assert.match(reviewSource, /accessibilityValue=\{\{ text: t\(status\) \}\}/u);
  assert.doesNotMatch(reviewSource, /statusLabel/u);
});
