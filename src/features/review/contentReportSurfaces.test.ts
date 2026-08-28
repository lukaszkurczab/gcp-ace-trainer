import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("content reports are reachable from practice details and answer review", () => {
  const practice = source("src/features/practice/PracticeFeedbackBlock.tsx");
  const review = source("src/features/review/ReviewFeedbackBlock.tsx");
  const session = source("src/features/practice/PracticeSessionSurface.tsx");
  const answerReview = source("src/features/review/AnswerReviewScreen.tsx");

  assert.match(practice, /<ContentReportSheet item=\{item\} surface=\{reportSurface\} \/>/);
  assert.match(review, /<ContentReportSheet item=\{item\} surface=\{reportSurface\} \/>/);
  assert.match(session, /modeRoute: "practice_feedback_details"/);
  assert.match(answerReview, /modeRoute: "answer_review"/);
});

test("report input is intentionally content-free beyond bounded item context", () => {
  const reportSheet = source("src/features/reports/ContentReportSheet.tsx");
  const reportDomain = source("src/domain/contentReports.ts");
  assert.doesNotMatch(reportSheet, /learnerResponse|fullPrompt|fullFeedback/);
  assert.doesNotMatch(reportDomain, /learnerResponse|fullPrompt|fullFeedback/);
  assert.match(reportSheet, /Your answer and the full explanation are not sent automatically/);
});
