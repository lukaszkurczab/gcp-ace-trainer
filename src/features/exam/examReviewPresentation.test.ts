import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const review = readFileSync("src/features/exam/ExamReviewScreen.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const feedback = readFileSync("src/features/practice/PracticeFeedbackBlock.tsx", "utf8");

test("Exam Review has one local header owner and returns to the exact result session", () => {
  const route = /name=\{ROUTES\.EXAM_REVIEW\}[\s\S]*?component=\{ExamReviewScreen\}[\s\S]*?options=\{\{([^}]+)\}\}/.exec(navigator)?.[1];
  assert.ok(route);
  assert.match(route, /headerShown: false/);
  assert.match(review, /navigation\.popTo\(ROUTES\.RESULT, \{ sessionId: requestKey \}\)/);
  assert.match(review, /rootTestID=\{runtimeSelectors\.practiceReview\.root\(projection\.sessionId, item\.occurrenceId\)\}/);
  assert.match(review, /headerAction=\{headerAction\}/);
});

test("Previous and Next preserve their question navigation and boundary disabling", () => {
  assert.match(review, /disabled=\{!previous\}[\s\S]*?previous && setCurrentOccurrenceId\(previous\.occurrenceId\)[\s\S]*?t\("Previous"\)/);
  assert.match(review, /disabled=\{!next\}[\s\S]*?next && setCurrentOccurrenceId\(next\.occurrenceId\)[\s\S]*?t\("Next"\)/);
  assert.doesNotMatch(review, /t\("Back"\)/);
});

test("Unanswered uses shared feedback with complete details expanded and reporting unchanged", () => {
  assert.match(review, /<PracticeFeedbackBlock feedback=\{\{ details: item\.details, reason: item\.reason, result: item\.result, sources: item\.sources \}\}/);
  assert.match(review, /initiallyExpanded=\{isUnanswered\} showReport=\{!isUnanswered\}/);
  assert.doesNotMatch(review, /unansweredFeedback|detailLines/);
  assert.match(feedback, /initiallyExpanded = false/);
  assert.match(feedback, /showReport = true/);
  assert.match(feedback, /useState\(initiallyExpanded\)/);
  assert.match(feedback, /showReport \? <ContentReportSheet/);
});
