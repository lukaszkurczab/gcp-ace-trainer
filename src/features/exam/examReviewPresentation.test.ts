import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const review = readFileSync("src/features/exam/ExamReviewScreen.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const resultScreenSource = readFileSync("src/features/exam/ResultScreen.tsx", "utf8");
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
  assert.match(review, /disabled=\{!previous\}[\s\S]*?previous && selectOccurrence\(previous\.occurrenceId\)[\s\S]*?t\("Previous"\)/);
  assert.match(review, /disabled=\{!next\}[\s\S]*?next && selectOccurrence\(next\.occurrenceId\)[\s\S]*?t\("Next"\)/);
  assert.doesNotMatch(review, /t\("Back"\)/);
});

test("Unanswered uses shared feedback with complete details expanded and reporting unchanged", () => {
  assert.match(review, /<PracticeFeedbackBlock feedback=\{\{ details: item\.details, messages: item\.messages, reason: item\.reason, result: item\.result, sources: item\.sources \}\}/);
  assert.match(review, /initiallyExpanded=\{isUnanswered\} showReport=\{!isUnanswered\}/);
  assert.doesNotMatch(review, /unansweredFeedback|detailLines/);
  assert.match(feedback, /initiallyExpanded = false/);
  assert.match(feedback, /showReport = true/);
  assert.match(feedback, /useState\(initiallyExpanded\)/);
  assert.match(feedback, /showReport \? <ContentReportSheet/);
});

test("manual review marking uses verified result identity and cannot turn an unavailable queue into an unmarked state", () => {
  assert.match(review, /loadReviewQueueItems\(\)[\s\S]*?setReviewMarkState\(\{ kind: "unavailable"/);
  assert.match(review, /item\.result !== "unanswered" && item\.sourceAttemptId !== undefined && item\.item\.trackId === "google-cloud-associate-cloud-engineer"/);
  assert.match(review, /setQuestionNeedsReview\(\{ sourceAttemptId: item\.sourceAttemptId!?[, ]+sourceItem: item\.item, sourceSessionId: projection\.sessionId \}, !isMarkedForReview\)/);
  assert.match(review, /resolvedContentRefsEqual\(entry\.sourceItem, item\.item\)/);
  assert.match(review, /accessibilityState=\{\{ selected: isMarkedForReview \}\}/);
  assert.match(review, /loading=\{isMarkPending\}/);
  assert.match(review, /t\("Review status could not be loaded"\)/);
  assert.match(review, /t\("Manual review is unavailable for this answer"\)/);
  assert.match(review, /commitManualReviewAndReadback\(\{[\s\S]*?onCommitted: \(\) => \{ if \(isCurrent\(\)\) setReviewMarkState\(\{ kind: "pending"/);
  assert.match(review, /result\.kind === "stale"[\s\S]*?setReviewMarkState\(\{ kind: "unavailable"/);
  assert.match(review, /captureProfileReadFence\(\)/);
  assert.match(review, /disabled=\{pendingMarkOccurrenceId !== null\}/);
  assert.doesNotMatch(review, /questionSnapshot|sourceAttemptId: item\.occurrenceId/);
  assert.match(resultScreenSource, /navigation\.navigate\(ROUTES\.EXAM_REVIEW, \{ sessionId: route\.params\.sessionId \}\)/);
});

test("related practice limitations appear only on completed certification results", () => {
  assert.match(resultScreenSource, /certificationPractice && summary\.certificationPracticeReview\?\.relatedPracticeLimitation/);
  assert.match(resultScreenSource, /t\("A related question pair — a near variant or condition contrast — appears in this session or in an earlier recorded attempt using this exact content version\. Treat it as related practice, not independent transfer evidence\."\)/);
  assert.doesNotMatch(resultScreenSource, /questionRelation.*accessibilityLabel|accessibilityLabel.*questionRelation/u);
});
