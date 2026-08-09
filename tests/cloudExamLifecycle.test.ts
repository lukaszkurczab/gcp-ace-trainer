import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CertificationExamExpiredError,
  resumeExpectedCertificationExam,
  startCertificationExam,
} from "../src/application/certification";
import { TrainingApplicationFailure } from "../src/application/trainingLifecycle";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { PublishedCertificationExamExperienceProfile } from "../src/content/contracts";
import type { ReviewQueueEntry } from "../src/domain";
import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import { CertificationContentCatalog } from "../src/tracks/certification/certificationContentCatalog";
import { buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";
import { getActiveForegroundTimer, getActiveTrainingSession, getTrainingSessionResult } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

class MutableClock {
  constructor(private value: string) {}
  now = () => this.value;
  set(value: string) { this.value = value; }
}

async function prepare(clock = new MutableClock("2026-07-23T10:00:00.000Z")) {
  await validateBundledContent();
  installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({ wallClock: clock });
  return { clock, lifecycle };
}

test("Cloud Exam starts from the installed, validated simulation profile", async () => {
  await prepare();
  const prepared = await startCertificationExam("installed-profile");
  assert.equal(prepared.session.modeId, "certification-exam-simulation");
  assert.equal(prepared.session.actualLength, 50);
  assert.equal(prepared.session.configurationSnapshot.simulationPolicyId, "patternly-certification-simulation-v1");
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
  assert.equal(await getActiveForegroundTimer(), null);
});

test("Cloud Exam expected-session handoff resumes only the exact active exam and never starts a replacement", async () => {
  const { lifecycle } = await prepare();
  const prepared = await startCertificationExam("expected-handoff");
  const resumed = await resumeExpectedCertificationExam(prepared.session.id);
  assert.equal(resumed.kind, "ready");
  if (resumed.kind === "ready") assert.equal(resumed.projection.session.id, prepared.session.id);

  await lifecycle.abandonActiveSession();
  await assert.rejects(
    resumeExpectedCertificationExam(prepared.session.id),
    (cause: unknown) => cause instanceof TrainingApplicationFailure && cause.code === "resume_unavailable",
  );
  assert.equal(await getActiveTrainingSession(), null);

  const ordinary = await lifecycle.startSession({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-diagnostic-baseline", request: {} });
  const conflict = await resumeExpectedCertificationExam(prepared.session.id);
  assert.equal(conflict.kind, "active_session_conflict");
  if (conflict.kind === "active_session_conflict") assert.equal(conflict.session.id, ordinary.session.id);
  assert.equal((await getActiveTrainingSession())?.id, ordinary.session.id);
});

test("Cloud Exam expected-session handoff finalizes an expired exact exam into its verified result", async () => {
  const clock = new MutableClock("2026-07-23T10:00:00.000Z");
  await prepare(clock);
  const prepared = await startCertificationExam("expired-expected-handoff");
  const deadline = prepared.session.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") assert.fail("Expected Exam deadline is unavailable.");
  clock.set(new Date(Date.parse(deadline) + 1).toISOString());

  await assert.rejects(
    resumeExpectedCertificationExam(prepared.session.id),
    (cause: unknown) => cause instanceof CertificationExamExpiredError && cause.sessionId === prepared.session.id,
  );
  assert.equal(await getActiveTrainingSession(), null);
  const result = await getTrainingSessionResult(prepared.session.id);
  assert.ok(result);
  assert.equal(result.sessionId, prepared.session.id);
  assert.equal(result.totalOccurrences, prepared.session.actualLength);
});

test("Cloud Exam does not poll before its initial session projection exists", () => {
  const source = readFileSync("src/features/exam/ExamScreen.tsx", "utf8");
  assert.match(source, /useEffect\(\(\) => \{\n    if \(!projection\) return;/);
  assert.match(source, /\}, \[projection\]\);/);
  assert.match(source, /if \(expectedSessionId\)[\s\S]*?resumeExpectedCertificationExam\(expectedSessionId\)[\s\S]*?return;[\s\S]*?startCertificationExam\(\)/);
  const expectedBranch = source.slice(source.indexOf("if (expectedSessionId)"), source.indexOf("try { await refresh(); }"));
  const expiredCheck = expectedBranch.indexOf("cause instanceof CertificationExamExpiredError");
  const resultNavigation = expectedBranch.indexOf("navigation.replace(ROUTES.RESULT, { sessionId: cause.sessionId })");
  const genericError = expectedBranch.indexOf('setError(describeOperationalFailure(cause, "The expected Cloud exam is unavailable."))');
  assert.ok(expiredCheck >= 0 && resultNavigation > expiredCheck && genericError > resultNavigation);
  assert.match(expectedBranch, /if \(!active\) return;[\s\S]*?navigation\.replace\(ROUTES\.RESULT, \{ sessionId: cause\.sessionId \}\); return;/);
  assert.doesNotMatch(expectedBranch, /startCertificationExam/);
  const practiceSource = readFileSync("src/features/practice/CertificationPracticeSessionScreen.tsx", "utf8");
  assert.match(practiceSource, /openCertificationPracticeSession/);
  assert.match(practiceSource, /navigation\.replace\(ROUTES\.EXAM, \{ expectedSessionId: conflict\.id \}\)/);
  assert.match(practiceSource, /navigation\.replace\(ROUTES\.PRACTICE_SESSION, \{ \.\.\.route\.params, mode: conflict\.modeId, expectedSessionId: conflict\.id \}\)/);
  assert.doesNotMatch(practiceSource, /getCertificationPracticeProjection\(\)\.catch\(\(\) => null\)|if \(!active\) await startCertificationSession/);
});

test("Cloud Exam runtime derives duration, length, and domain selection from a changed profile fixture", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const profile = (durationMinutes: number, requestedMaximum: number) => ({
    schemaVersion: "exam-experience-profile-v2",
    profileId: "fixture-profile",
    profileVersion: "1",
    source: { url: "https://example.test/exam-guide", checkedDate: "2026-07-24", guideVersion: "fixture" },
    durationMinutes,
    questionCount: { kind: "range", minimum: 4, maximum: requestedMaximum },
    blueprint: { kind: "weighted_sections", sections: [
      { id: "setup_environment", contentDomainId: "setup_environment", weightPercent: 25 },
      { id: "planning_implementation", contentDomainId: "planning_implementation", weightPercent: 25 },
      { id: "access_security", contentDomainId: "access_security", weightPercent: 25 },
      { id: "operations", contentDomainId: "operations", weightPercent: 25 },
    ] },
    interactionPolicy: { schemaVersion: "patternly-certification-simulation-policy-v1", policyId: "patternly-certification-simulation-v1", policyVersion: "1", owner: "patternly_product", navigation: "free", answerChanges: "until_final_submission", flagging: "available", navigator: "available", sections: "blueprint_visible", timeout: "absolute_deadline", feedbackTiming: "after_verified_finalization" },
  } satisfies PublishedCertificationExamExperienceProfile);
  const prepareFrom = async (examProfile: PublishedCertificationExamExperienceProfile, requestedLength: number) => new CertificationFamilyRuntime(
    new CertificationContentCatalog(sourceCatalog.getItems(), sourceCatalog.getContentVersion(), sourceCatalog.getDiagnosticBaseline(), sourceCatalog.getFocusPractice(), examProfile),
    "fixture-taxonomy",
  ).prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-exam-simulation", request: { sessionId: `profile-${requestedLength}`, requestedLength }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });

  const first = await prepareFrom(profile(30, 4), 4);
  assert.equal(first.session.actualLength, 4);
  assert.equal(first.session.configurationSnapshot.timerDurationMs, 30 * 60 * 1000);
  assert.deepEqual(first.session.itemOrder.map((occurrence) => occurrence.item.itemId).map((id) => sourceCatalog.getItemById(id).domain), ["setup_environment", "planning_implementation", "access_security", "operations"]);

  const changed = await prepareFrom(profile(45, 8), 8);
  assert.equal(changed.session.actualLength, 8);
  assert.equal(changed.session.configurationSnapshot.timerDurationMs, 45 * 60 * 1000);
  assert.deepEqual(changed.session.itemOrder.map((occurrence) => sourceCatalog.getItemById(occurrence.item.itemId).domain), ["setup_environment", "setup_environment", "planning_implementation", "planning_implementation", "access_security", "access_security", "operations", "operations"]);
});

test("Cloud Exam allocates the published 60-item blueprint without reusing planning questions", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const prepared = await new CertificationFamilyRuntime(catalog, "google-cloud-associate-cloud-engineer-taxonomy-v1").prepare({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "certification-exam-simulation",
    request: { sessionId: "published-profile-60", requestedLength: 60 },
    attempts: [],
    reviews: [],
    now: "2026-07-24T10:00:00.000Z",
  });
  const questions = prepared.session.itemOrder.map((occurrence) => catalog.getItemById(occurrence.item.itemId));
  assert.equal(new Set(questions.map((question) => question.id)).size, 60);
  assert.deepEqual(
    questions.reduce<Record<string, number>>((counts, question) => ({ ...counts, [question.domain]: (counts[question.domain] ?? 0) + 1 }), {}),
    { setup_environment: 12, planning_implementation: 26, operations: 12, access_security: 10 },
  );
});

test("Certification Diagnostic Baseline uses its immutable 40-item blueprint and rejects selectors", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  const prepared = await runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic-baseline" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(prepared.session.actualLength, 40);
  assert.equal(prepared.session.configurationSnapshot.timer, "elapsedForeground");
  assert.equal(prepared.session.configurationSnapshot.feedbackMode, "afterEachAnswer");
  assert.equal(new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, 40);
  assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.itemId), sourceCatalog.getDiagnosticBaseline().itemIds);
  await assert.rejects(
    () => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic-with-selector", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /does not accept selectors/,
  );
});

test("Certification Focus Practice requires a selected domain and never fills from a sibling domain", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  await assert.rejects(
    () => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", request: { sessionId: "focus-without-domain", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires an explicit topic/,
  );
  const selected = await runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", request: { sessionId: "focus-operations", requestedLength: 40, domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(selected.session.requestedLength, 40);
  assert.equal(selected.session.actualLength, 40);
  assert.deepEqual(new Set(selected.session.itemOrder.map((occurrence) => sourceCatalog.getItemById(occurrence.item.itemId).domain)), new Set(["operations"]));

  const withinTopicOnly = new CertificationContentCatalog(
    sourceCatalog.getItems().filter((question) => question.domain === "setup_environment").slice(0, 12),
    "focus-shortening-fixture",
    sourceCatalog.getDiagnosticBaseline(),
    { ...sourceCatalog.getFocusPractice(), topicIds: ["setup_environment"] },
    sourceCatalog.getExamExperienceProfile(),
  );
  const shortened = await new CertificationFamilyRuntime(withinTopicOnly, "google-cloud-associate-cloud-engineer-taxonomy-v1").prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-focus-practice", request: { sessionId: "focus-shortened", requestedLength: 40, domain: "setup_environment" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(shortened.session.requestedLength, 40);
  assert.equal(shortened.session.actualLength, 12);
  assert.deepEqual(new Set(shortened.session.itemOrder.map((occurrence) => withinTopicOnly.getItemById(occurrence.item.itemId).domain)), new Set(["setup_environment"]));
});

test("Certification Scenario Practice requires a competency and never widens its approved scenario scope", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  await assert.rejects(
    () => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-scenario-practice", request: { sessionId: "scenario-without-competency", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires exactly one explicit competency/,
  );
  await assert.rejects(
    () => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-scenario-practice", request: { sessionId: "scenario-with-domain", requestedLength: 10, competency: "iam", domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires exactly one explicit competency/,
  );
  const competency = sourceCatalog.getScenarioPractice().competencies.find((entry) => entry.id === "cloud-storage")!;
  const selected = await runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-scenario-practice", request: { sessionId: "scenario-storage", requestedLength: 40, competency: competency.id }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(selected.session.requestedLength, 40);
  assert.equal(selected.session.actualLength, competency.scenarioItemIds.length);
  assert.equal(selected.session.configurationSnapshot.competencyId, competency.id);
  assert.ok(selected.session.itemOrder.every((occurrence) => competency.scenarioItemIds.includes(occurrence.item.itemId)));
  assert.ok(selected.session.itemOrder.every((occurrence) => sourceCatalog.getItemById(occurrence.item.itemId).tags.includes(competency.id)));

  const shortenedIds = competency.scenarioItemIds.slice(0, 12);
  const withinCompetencyOnly = new CertificationContentCatalog(
    shortenedIds.map((itemId) => sourceCatalog.getItemById(itemId)),
    "scenario-shortening-fixture",
    sourceCatalog.getDiagnosticBaseline(),
    sourceCatalog.getFocusPractice(),
    sourceCatalog.getExamExperienceProfile(),
    { ...sourceCatalog.getScenarioPractice(), competencies: [{ ...competency, scenarioItemIds: shortenedIds }] },
  );
  const shortened = await new CertificationFamilyRuntime(withinCompetencyOnly, "google-cloud-associate-cloud-engineer-taxonomy-v1").prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-scenario-practice", request: { sessionId: "scenario-shortened", requestedLength: 40, competency: competency.id }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(shortened.session.requestedLength, 40);
  assert.equal(shortened.session.actualLength, 12);
  assert.ok(shortened.session.itemOrder.every((occurrence) => shortenedIds.includes(occurrence.item.itemId)));
});

test("Certification Weak Area Review uses only eligible due evidence and resolves it after two due successes", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  const now = "2026-07-24T10:00:00.000Z";
  const review = (itemId: string, id: string, dueAt: string): ReviewQueueEntry => {
    const question = catalog.getItemById(itemId);
    return {
      id,
      trackId: "google-cloud-associate-cloud-engineer",
      sourceAttemptId: `${id}:attempt`,
      sourceSessionId: `${id}:source-session`,
      reasons: ["incorrect"],
      dueAt,
      createdAt: "2026-07-20T10:00:00.000Z",
      consecutiveAfterDueSuccesses: 0,
      persistent: true,
      sourceItem: catalog.toContentItemRef(question),
      taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }],
    };
  };
  const prepareWeakReview = (sessionId: string, reviews: readonly ReviewQueueEntry[], requestedLength = 10, currentNow = now) => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-weak-area-review", request: { sessionId, requestedLength }, attempts: [], reviews, now: currentNow });

  await assert.rejects(() => prepareWeakReview("weak-empty", []), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => prepareWeakReview("weak-future", [review("ace-q-0001", "future", "2026-07-25T10:00:00.000Z")]), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => prepareWeakReview("weak-invalid-length", [review("ace-q-0001", "due", "2026-07-24T09:00:00.000Z")], 40), /supports only its installed 10 or 20 item lengths/);
  await assert.rejects(
    () => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-weak-area-review", request: { sessionId: "weak-selector", requestedLength: 10, domain: "operations" }, attempts: [], reviews: [review("ace-q-0001", "selector", "2026-07-24T09:00:00.000Z")], now }),
    /does not accept selectors/,
  );

  const earliest = review("ace-q-0003", "earliest", "2026-07-24T08:00:00.000Z");
  const later = review("ace-q-0001", "later", "2026-07-24T09:00:00.000Z");
  const stale = { ...review("ace-q-0002", "stale", "2026-07-24T07:00:00.000Z"), sourceItem: { ...catalog.toContentItemRef(catalog.getItemById("ace-q-0002")), contentVersion: "gcp-ace-0005" } } satisfies ReviewQueueEntry;
  const shortened = await prepareWeakReview("weak-shortened", [later, stale, earliest], 20);
  assert.equal(shortened.session.requestedLength, 20);
  assert.equal(shortened.session.actualLength, 2);
  assert.deepEqual(shortened.session.itemOrder.map((occurrence) => occurrence.item.itemId), ["ace-q-0003", "ace-q-0001"]);
  assert.equal(shortened.session.configurationSnapshot.kind, "certificationWeakAreaReview");
  assert.equal(shortened.session.configurationSnapshot.timer, "elapsedForeground");

  const firstEntry = review("ace-q-0004", "resolve", "2026-07-24T09:00:00.000Z");
  const first = await prepareWeakReview("weak-success-one", [firstEntry]);
  const firstQuestion = catalog.getItemById(first.firstOccurrence.itemId);
  const firstSubmission = await runtime.submitPractice({ session: first.session, response: { kind: "option_selection", selectedOptionIds: firstQuestion.correctOptionIds }, attempts: [], reviews: [firstEntry], now });
  assert.equal(firstSubmission.reviewMutations[0]?.kind, "upsert");
  const afterFirst = firstSubmission.reviewMutations[0]!.entry;
  assert.equal(afterFirst.consecutiveAfterDueSuccesses, 1);
  const second = await prepareWeakReview("weak-success-two", [afterFirst], 10, "2026-07-24T11:00:00.000Z");
  const secondQuestion = catalog.getItemById(second.firstOccurrence.itemId);
  const secondSubmission = await runtime.submitPractice({ session: second.session, response: { kind: "option_selection", selectedOptionIds: secondQuestion.correctOptionIds }, attempts: [firstSubmission.attempt], reviews: [afterFirst], now: "2026-07-24T11:00:00.000Z" });
  assert.equal(secondSubmission.reviewMutations[0]?.kind, "remove");
});

test("Certification Quick Review selects only up to ten current due items and never substitutes content", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  const now = "2026-07-24T10:00:00.000Z";
  const review = (itemId: string, id: string, dueAt: string): ReviewQueueEntry => {
    const question = catalog.getItemById(itemId);
    return {
      id,
      trackId: "google-cloud-associate-cloud-engineer",
      sourceAttemptId: `${id}:attempt`,
      sourceSessionId: `${id}:source-session`,
      reasons: ["incorrect"],
      dueAt,
      createdAt: "2026-07-20T10:00:00.000Z",
      consecutiveAfterDueSuccesses: 0,
      persistent: true,
      sourceItem: catalog.toContentItemRef(question),
      taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }],
    };
  };
  const prepareQuickReview = (sessionId: string, reviews: readonly ReviewQueueEntry[]) => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-quick-review", request: { sessionId }, attempts: [], reviews, now });

  assert.deepEqual(buildPracticeSessionConfig({ mode: "certification-quick-review", topicId: "", trackId: "google-cloud-associate-cloud-engineer" }), { feedbackMode: "afterEachAnswer", mode: "certification-quick-review", reviewBehaviorEnabled: false, sessionLength: 10, source: "practiceHub", topicId: "", trackId: "google-cloud-associate-cloud-engineer" });
  assert.throws(() => buildPracticeSessionConfig({ mode: "certification-quick-review", sessionLength: 10, topicId: "", trackId: "google-cloud-associate-cloud-engineer" }), /does not render or accept optional setup controls/);

  await assert.rejects(() => prepareQuickReview("quick-empty", []), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => prepareQuickReview("quick-future", [review("ace-q-0001", "future", "2026-07-25T10:00:00.000Z")]), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-quick-review", request: { sessionId: "quick-selector", requestedLength: 10 }, attempts: [], reviews: [review("ace-q-0001", "due", "2026-07-24T09:00:00.000Z")], now }), /fixed maximum of ten due items and does not accept selectors/);

  const earliest = review("ace-q-0003", "earliest", "2026-07-24T08:00:00.000Z");
  const later = review("ace-q-0001", "later", "2026-07-24T09:00:00.000Z");
  const stale = { ...review("ace-q-0002", "stale", "2026-07-24T07:00:00.000Z"), sourceItem: { ...catalog.toContentItemRef(catalog.getItemById("ace-q-0002")), contentVersion: "gcp-ace-obsolete" } } satisfies ReviewQueueEntry;
  const partial = await prepareQuickReview("quick-partial", [later, stale, earliest]);
  assert.equal(partial.session.requestedLength, 10);
  assert.equal(partial.session.actualLength, 2);
  assert.equal(partial.session.configurationSnapshot.kind, "certificationQuickReview");
  assert.deepEqual(partial.session.itemOrder.map((occurrence) => occurrence.item.itemId), ["ace-q-0003", "ace-q-0001"]);

  const dueItemIds = Array.from({ length: 12 }, (_, index) => `ace-q-${String(index + 1).padStart(4, "0")}`);
  const fullDueQueue = dueItemIds.map((itemId, index) => review(itemId, `full-${index}`, `2026-07-24T09:${String(index).padStart(2, "0")}:00.000Z`));
  const full = await prepareQuickReview("quick-full", [...fullDueQueue, review("ace-q-0020", "future-not-fill", "2026-07-25T10:00:00.000Z")]);
  assert.equal(full.session.actualLength, 10);
  assert.deepEqual(full.session.itemOrder.map((occurrence) => occurrence.item.itemId), dueItemIds.slice(0, 10));
});

test("Certification Mixed Practice uses a deterministic unique interleaved blueprint and may shorten only within it", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "google-cloud-associate-cloud-engineer-taxonomy-v1");
  const prepare = (sessionId: string, requestedLength = 20) => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-mixed-practice", request: { sessionId, requestedLength }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  const [first, second] = await Promise.all([prepare("mixed-first"), prepare("mixed-second")]);
  const blueprint = catalog.getMixedPractice();
  assert.equal(first.session.actualLength, 20);
  assert.equal(first.session.configurationSnapshot.kind, "certificationMixedPractice");
  assert.deepEqual(first.session.itemOrder.map((occurrence) => occurrence.item.itemId), blueprint.itemIds.slice(0, 20));
  assert.deepEqual(second.session.itemOrder.map((occurrence) => occurrence.item.itemId), first.session.itemOrder.map((occurrence) => occurrence.item.itemId));
  assert.equal(new Set(first.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, first.session.actualLength);
  await assert.rejects(() => prepare("mixed-invalid-length", 5), /supports only its installed 10, 20, or 40 item lengths/);
  await assert.rejects(() => runtime.prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-mixed-practice", request: { sessionId: "mixed-selector", requestedLength: 10, domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }), /does not accept selectors/);

  const shortenedIds = blueprint.itemIds.slice(0, 12);
  const shortenedCatalog = new CertificationContentCatalog(
    shortenedIds.map((itemId) => catalog.getItemById(itemId)),
    "mixed-shortening-fixture",
    catalog.getDiagnosticBaseline(),
    catalog.getFocusPractice(),
    catalog.getExamExperienceProfile(),
    catalog.getScenarioPractice(),
    catalog.getWeakAreaReview(),
    { ...blueprint, itemIds: shortenedIds },
  );
  const shortened = await new CertificationFamilyRuntime(shortenedCatalog, "google-cloud-associate-cloud-engineer-taxonomy-v1").prepare({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-mixed-practice", request: { sessionId: "mixed-shortened", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(shortened.session.requestedLength, 40);
  assert.equal(shortened.session.actualLength, 12);
  assert.deepEqual(shortened.session.itemOrder.map((occurrence) => occurrence.item.itemId), shortenedIds);
});

test("Certification Scenario Practice is routed to the Certification runner", () => {
  const screen = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
  assert.match(screen, /route\.params\.mode === "certification-scenario-practice"/);
  assert.match(screen, /certification-scenario-practice[\s\S]*?return <CertificationPracticeSessionScreen/);
});

test("Certification Mixed Practice is routed to the Certification runner", () => {
  const screen = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
  assert.match(screen, /route\.params\.mode === "certification-mixed-practice"/);
  assert.match(screen, /certification-mixed-practice[\s\S]*?return <CertificationPracticeSessionScreen/);
});

test("Certification Quick Review is routed to the Certification runner", () => {
  const screen = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
  assert.match(screen, /route\.params\.mode === "certification-quick-review"/);
  assert.match(screen, /certification-quick-review[\s\S]*?return <CertificationPracticeSessionScreen/);
});

test("Certification Exam Simulation is reachable from Practice Hub through the canonical exam route", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  assert.match(hub, /resolvedMode === "certification-exam-simulation"[\s\S]*?navigation\.navigate\(ROUTES\.EXAM\)/);
});
