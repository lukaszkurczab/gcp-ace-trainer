import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const answerOptionSource = readFileSync(new URL("../../components/AnswerOption.tsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("./PracticeResponseControls.tsx", import.meta.url), "utf8");
const surfaceSource = readFileSync(new URL("./PracticeSessionSurface.tsx", import.meta.url), "utf8");
const certificationPracticeSource = readFileSync(new URL("./CertificationPracticeSessionScreen.tsx", import.meta.url), "utf8");
const designPracticeSource = readFileSync(new URL("./DesignInterviewPracticeScreen.tsx", import.meta.url), "utf8");
const reviewSource = readFileSync(new URL("../exam/ExamReviewScreen.tsx", import.meta.url), "utf8");

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
  assert.match(reviewSource, /<PracticeResponseControls control=\{buildCertificationReviewControl\(item\)\} editable=\{false\}/u);
  assert.doesNotMatch(reviewSource, /statusLabel/u);
});

test("Certification and Design pass frozen-response edit state through to disabled response controls while keeping exact retry separate", () => {
  for (const screen of [certificationPracticeSource, designPracticeSource]) {
    assert.match(screen, /frozenPracticeResponse = projection\.operation\.kind === "submit_journal_failed" && projection\.operation\.error\.allowedAction !== "submit_again"/u);
    assert.match(screen, /responseEditable=\{editable\}/u);
    assert.match(screen, /hasLocalResponse: editable \|\| retryFrozenResponse \?/u);
    assert.match(screen, /retryFrozenResponse \? submit\(\) : frozenPracticeResponse \? undefined/u);
    assert.doesNotMatch(screen, /responseEditable=\{editable \|\| retryFrozenResponse\}/u);
  }
  assert.match(surfaceSource, /const editable = props\.responseEditable \?\? allowsPracticeResponseEditing\(props\.phase\)/u);
  assert.match(surfaceSource, /<PracticeResponseControls[\s\S]*?editable=\{editable\}/u);
  assert.match(controlsSource, /disabled=\{!editable\}/u);
  assert.match(controlsSource, /accessibilityState=\{\{ checked: selected, disabled: !editable \}\}/u);
});
