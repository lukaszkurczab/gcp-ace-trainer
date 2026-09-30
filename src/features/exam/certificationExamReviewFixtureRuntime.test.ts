import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createCertificationExamReviewFixture } from "../../testing/certificationExamReviewFixture";
import { CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID, CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID } from "./certificationExamReviewFixtureCommand";
import { createCertificationExamReviewFixtureRuntime as createSmokeRuntime } from "./certificationExamReviewFixtureRuntime.smoke";
import { createCertificationExamReviewFixtureRuntime as createDisabledRuntime } from "./certificationExamReviewFixtureRuntime.disabled";

const resultScreenSource = readFileSync("src/features/exam/ResultScreen.tsx", "utf8");
const reviewScreenSource = readFileSync("src/features/exam/ExamReviewScreen.tsx", "utf8");
const navigatorSource = readFileSync("src/features/exam/certificationExamReviewFixtureNavigator.tsx", "utf8");
const practicePreviewSource = readFileSync("src/features/exam/CertificationPracticeFeedbackPreview.tsx", "utf8");
const rootNavigatorSource = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("fixture readers are optional screen seams and production readers remain the default", () => {
  assert.match(resultScreenSource, /if \(readSummary\) return readSummary\(capturedRequestKey\)/);
  assert.match(resultScreenSource, /const useCases = getTrainingLifecycleUseCases\(\)/);
  assert.match(resultScreenSource, /<Screen>\s*\{fixtureNotice\}\s*<SessionResultOverview/);
  assert.match(resultScreenSource, /onFixtureExit \? onFixtureExit\(\) : navigation\.navigate\(ROUTES\.PRACTICE_HUB\)/);
  assert.match(reviewScreenSource, /if \(readReview\) return readReview\(capturedRequestKey\)/);
  assert.match(reviewScreenSource, /getCertificationExamReviewProjection\(capturedRequestKey\)/);
  assert.match(reviewScreenSource, /openSource=\{sourceOpener\}/);
  assert.match(reviewScreenSource, /<SessionShell[\s\S]*?headerAction=\{headerAction\}[\s\S]*?>\s*\{fixtureNotice\}\s*<PracticeQuestionCard/);
  assert.match(reviewScreenSource, /const headerAction = <Button[\s\S]*?t\("Back to results"\)/);
  assert.match(navigatorSource, /const openSource = useCallback\(async \(url: string\) => \{[\s\S]*?runtime\.openSource\(url\)[\s\S]*?finally \{ setSourceTrace\(runtime\.getSourceTrace\(\)\); \}/);
  assert.match(navigatorSource, /patternly:ui12:source-count:/);
  assert.match(navigatorSource, /patternly:ui12:source-url/);
  assert.match(navigatorSource, /NavigationIndependentTree/);
  assert.match(navigatorSource, /NavigationContainer key=\{launch\.launchId\} theme=\{navigationTheme\}/);
  assert.match(navigatorSource, /initialRouteName=\{ROUTES\.RESULT\}/);
  assert.match(navigatorSource, /patternly:ui12:fixture:label/);
  assert.match(navigatorSource, /patternly:ui12:fixture:exit/);
  assert.match(navigatorSource, /name=\{ROUTES.RESULT\} options=\{\{ headerShown: true, title: t\("Result"\) \}\}/);
  assert.match(rootNavigatorSource, /parseCertificationExamReviewFixtureUrl\(url, __DEV__ && isPatternlySmokeRuntime\(\)\)/);
  assert.match(rootNavigatorSource, /openUrl: \(url\) => Linking\.openURL\(url\)/);
  assert.match(rootNavigatorSource, /Linking\.getInitialURL\(\)/);
  assert.match(rootNavigatorSource, /key=\{auditExamReviewFixture\.launchId\}/);
  assert.match(navigatorSource, /launch\.scenario === "practice-answer-matrix"/);
  assert.match(practicePreviewSource, /allowLeave=\{false\}/);
  assert.match(practicePreviewSource, /phase="feedback"/);
  assert.doesNotMatch(practicePreviewSource, /primaryAction=/);
  assert.match(practicePreviewSource, /buildPracticeResponseControl/);
  assert.match(practicePreviewSource, /read-only preview/);
});

test("fixture creates validator-approved fixed-50 canonical evidence without partial or persistence shortcuts", async () => {
  const fixture = await createCertificationExamReviewFixture({ correctIndices: [0], incorrectIndices: [1] });
  assert.equal(fixture.session.id, CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  assert.equal(fixture.session.actualLength, 50);
  assert.equal(fixture.projection.items.length, 50);
  assert.deepEqual(fixture.projection.items.slice(0, 3).map((item) => item.result), ["correct", "incorrect", "unanswered"]);
  assert.equal(fixture.projection.items.every((item) => item.result !== "partial"), true);
  assert.ok(fixture.projection.items[49]?.sources.some((source) => source.url === "https://docs.cloud.google.com/iam/docs/overview"));
  assert.equal(fixture.projection.items[2]?.questionId, "gcp-ace-gcpace-n01-b02-003");
  assert.equal(fixture.projection.items[49]?.questionId, "gcp-ace-gcpace-n18-b01-010");
  assert.equal(fixture.sourceQuestionId, "gcp-ace-gcpace-n01-b02-003");
  assert.equal(fixture.sourceUrl, "https://docs.cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy");
  const source = readFileSync("src/testing/certificationExamReviewFixture.ts", "utf8");
  assert.doesNotMatch(source, /node:assert|node:test|storage\/repositories|TrainingLifecycleUseCases|Premium|entitlement/i);
});

test("memory readers require the fixture session identity and preserve read-only evidence", async () => {
  let externalOpenerCalls = 0;
  const runtime = createSmokeRuntime("exam-ready", { openUrl: async () => { externalOpenerCalls += 1; } });
  await assert.rejects(runtime.readSummary("invented-session"), /does not match/);
  await assert.rejects(runtime.readReview("invented-session"), /does not match/);
  const summary = await runtime.readSummary(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  const review = await runtime.readReview(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  assert.equal(summary.session.id, CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  assert.equal(summary.certificationExam, review);
  assert.equal(review.items.length, 50);
  const before = JSON.stringify({ summary, review });
  assert.equal(externalOpenerCalls, 0);
  assert.deepEqual(runtime.getSourceTrace(), { count: 0, url: null });
  assert.equal(JSON.stringify({ summary, review }), before);
});

test("ready fixture calls the supplied opener with each exact projected source URL", async () => {
  const calls: string[] = [];
  const runtime = createSmokeRuntime("exam-ready", { openUrl: async (url) => { calls.push(url); } });
  const review = await runtime.readReview(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  const source = (review.items[49]?.sources ?? []).find((entry) => entry.url === "https://docs.cloud.google.com/iam/docs/overview");
  assert.ok(source);
  await runtime.openSource(source.url);
  assert.deepEqual(calls, [source.url]);
  assert.deepEqual(runtime.getSourceTrace(), { count: 1, url: source.url });
});

test("source-failure fixture records exact opener attempt but never calls external URL opening", async () => {
  let externalOpenerCalls = 0;
  const runtime = createSmokeRuntime("source-failure", { openUrl: async () => { externalOpenerCalls += 1; } });
  const review = await runtime.readReview(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  const summary = await runtime.readSummary(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID);
  const url = (review.items[49]?.sources ?? []).find((source) => source.url === "https://docs.cloud.google.com/iam/docs/overview")!.url;
  const before = JSON.stringify({ result: summary.result, session: summary.session, review });
  await assert.rejects(runtime.openSource(url), /rejected/);
  assert.equal(externalOpenerCalls, 0);
  assert.deepEqual(runtime.getSourceTrace(), { count: 1, url });
  assert.equal(JSON.stringify({ result: summary.result, session: summary.session, review }), before);
});

test("practice answer matrix exposes actual completed summary, five feedback previews, and full review", async () => {
  const runtime = createSmokeRuntime("practice-answer-matrix", { openUrl: async () => undefined });
  await assert.rejects(runtime.readSummary(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID), /does not match/);
  const summary = await runtime.readSummary(CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID);
  const review = await runtime.readReview(CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID);
  const previews = await runtime.readPracticePreviews(CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID);
  assert.equal(summary.session.id, CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID);
  assert.equal(summary.session.status, "completed");
  assert.equal(summary.certificationExam, null);
  assert.deepEqual(previews.map((preview) => preview.feedback.result), ["correct", "incorrect", "correct", "partial", "incorrect"]);
  assert.deepEqual(review.items.slice(0, 5).map((item) => item.result), ["correct", "incorrect", "correct", "partial", "incorrect"]);
  await assert.rejects(runtime.readPracticePreviews(CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID), /does not match/);
});

test("Metro disabled runtime is explicitly unavailable outside smoke", () => {
  assert.throws(() => createDisabledRuntime("exam-ready", { openUrl: async () => undefined }), /unavailable in this runtime/);
});
