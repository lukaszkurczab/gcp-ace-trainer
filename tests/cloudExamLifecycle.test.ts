import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  startCertificationExam,
} from "../src/application/certification";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { PublishedCertificationExamExperienceProfile } from "../src/content/contracts";
import type { ReviewQueueEntry } from "../src/domain";
import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import { CertificationContentCatalog } from "../src/tracks/cloud-certification/certificationContentCatalog";
import { getActiveTrainingSession } from "../src/storage/repositories";
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

test("Cloud Exam remains explicitly unavailable when its mode is absent from the installed artifact", async () => {
  await prepare();
  await assert.rejects(
    () => startCertificationExam("undocumented-profile"),
    (error: unknown) => error instanceof Error && (error as Error & { cause?: unknown }).cause instanceof Error && /declared_mode_unsupported/.test(String((error as Error & { cause: Error }).cause.message)),
  );
  assert.equal(await getActiveTrainingSession(), null);
});

test("Cloud Exam runtime derives duration, length, and domain selection from a changed profile fixture", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const profile = (durationMinutes: number, requestedMaximum: number) => ({
    schemaVersion: "exam-experience-profile-v1",
    profileId: "fixture-profile",
    profileVersion: "1",
    source: { url: "https://example.test/exam-guide", checkedDate: "2026-07-24", guideVersion: "fixture" },
    durationMinutes,
    questionCount: { kind: "range", minimum: 4, maximum: requestedMaximum },
    blueprint: { kind: "weighted_sections", sections: [
      { id: "setup_environment", weightPercent: 25 },
      { id: "planning_implementation", weightPercent: 25 },
      { id: "access_security", weightPercent: 25 },
      { id: "operations", weightPercent: 25 },
    ] },
    navigation: "free",
    answerChanges: "until_final_submission",
    flagging: "available",
    navigator: "available",
    sections: "available",
    timeout: "absolute_deadline",
  } satisfies PublishedCertificationExamExperienceProfile);
  const prepareFrom = async (examProfile: PublishedCertificationExamExperienceProfile, requestedLength: number) => new CertificationFamilyRuntime(
    new CertificationContentCatalog(sourceCatalog.getItems(), sourceCatalog.getContentVersion(), sourceCatalog.getDiagnosticBaseline(), sourceCatalog.getFocusPractice(), examProfile),
    "fixture-taxonomy",
  ).prepare({ trackId: "cloud-certification", modeId: "cloud-exam-simulation", request: { sessionId: `profile-${requestedLength}`, requestedLength }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });

  const first = await prepareFrom(profile(30, 4), 4);
  assert.equal(first.session.actualLength, 4);
  assert.equal(first.session.configurationSnapshot.timerDurationMs, 30 * 60 * 1000);
  assert.deepEqual(first.session.itemOrder.map((occurrence) => occurrence.item.itemId).map((id) => sourceCatalog.getItemById(id).domain), ["setup_environment", "planning_implementation", "access_security", "operations"]);

  const changed = await prepareFrom(profile(45, 8), 8);
  assert.equal(changed.session.actualLength, 8);
  assert.equal(changed.session.configurationSnapshot.timerDurationMs, 45 * 60 * 1000);
  assert.deepEqual(changed.session.itemOrder.map((occurrence) => sourceCatalog.getItemById(occurrence.item.itemId).domain), ["setup_environment", "setup_environment", "planning_implementation", "planning_implementation", "access_security", "access_security", "operations", "operations"]);
});

test("Certification Diagnostic Baseline uses its immutable 40-item blueprint and rejects selectors", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "cloud-certification-taxonomy-v1");
  const prepared = await runtime.prepare({ trackId: "cloud-certification", modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic-baseline" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(prepared.session.actualLength, 40);
  assert.equal(prepared.session.configurationSnapshot.timer, "elapsedForeground");
  assert.equal(prepared.session.configurationSnapshot.feedbackMode, "afterEachAnswer");
  assert.equal(new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, 40);
  assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.itemId), sourceCatalog.getDiagnosticBaseline().itemIds);
  await assert.rejects(
    () => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-diagnostic-baseline", request: { sessionId: "diagnostic-with-selector", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /does not accept selectors/,
  );
});

test("Certification Focus Practice requires a selected domain and never fills from a sibling domain", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "cloud-certification-taxonomy-v1");
  await assert.rejects(
    () => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-focus-practice", request: { sessionId: "focus-without-domain", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires an explicit topic/,
  );
  const selected = await runtime.prepare({ trackId: "cloud-certification", modeId: "certification-focus-practice", request: { sessionId: "focus-operations", requestedLength: 40, domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
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
  const shortened = await new CertificationFamilyRuntime(withinTopicOnly, "cloud-certification-taxonomy-v1").prepare({ trackId: "cloud-certification", modeId: "certification-focus-practice", request: { sessionId: "focus-shortened", requestedLength: 40, domain: "setup_environment" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(shortened.session.requestedLength, 40);
  assert.equal(shortened.session.actualLength, 12);
  assert.deepEqual(new Set(shortened.session.itemOrder.map((occurrence) => withinTopicOnly.getItemById(occurrence.item.itemId).domain)), new Set(["setup_environment"]));
});

test("Certification Scenario Practice requires a competency and never widens its approved scenario scope", async () => {
  await validateBundledContent();
  const sourceCatalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(sourceCatalog, "cloud-certification-taxonomy-v1");
  await assert.rejects(
    () => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-scenario-practice", request: { sessionId: "scenario-without-competency", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires exactly one explicit competency/,
  );
  await assert.rejects(
    () => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-scenario-practice", request: { sessionId: "scenario-with-domain", requestedLength: 10, competency: "iam", domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }),
    /requires exactly one explicit competency/,
  );
  const competency = sourceCatalog.getScenarioPractice().competencies.find((entry) => entry.id === "cloud-storage")!;
  const selected = await runtime.prepare({ trackId: "cloud-certification", modeId: "certification-scenario-practice", request: { sessionId: "scenario-storage", requestedLength: 40, competency: competency.id }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
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
  const shortened = await new CertificationFamilyRuntime(withinCompetencyOnly, "cloud-certification-taxonomy-v1").prepare({ trackId: "cloud-certification", modeId: "certification-scenario-practice", request: { sessionId: "scenario-shortened", requestedLength: 40, competency: competency.id }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  assert.equal(shortened.session.requestedLength, 40);
  assert.equal(shortened.session.actualLength, 12);
  assert.ok(shortened.session.itemOrder.every((occurrence) => shortenedIds.includes(occurrence.item.itemId)));
});

test("Certification Weak Area Review uses only eligible due evidence and resolves it after two due successes", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "cloud-certification-taxonomy-v1");
  const now = "2026-07-24T10:00:00.000Z";
  const review = (itemId: string, id: string, dueAt: string): ReviewQueueEntry => {
    const question = catalog.getItemById(itemId);
    return {
      id,
      trackId: "cloud-certification",
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
  const prepareWeakReview = (sessionId: string, reviews: readonly ReviewQueueEntry[], requestedLength = 10, currentNow = now) => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-weak-area-review", request: { sessionId, requestedLength }, attempts: [], reviews, now: currentNow });

  await assert.rejects(() => prepareWeakReview("weak-empty", []), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => prepareWeakReview("weak-future", [review("ace-q-0001", "future", "2026-07-25T10:00:00.000Z")]), /no eligible due items; no substitute practice session was created/);
  await assert.rejects(() => prepareWeakReview("weak-invalid-length", [review("ace-q-0001", "due", "2026-07-24T09:00:00.000Z")], 40), /supports only its installed 10 or 20 item lengths/);
  await assert.rejects(
    () => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-weak-area-review", request: { sessionId: "weak-selector", requestedLength: 10, domain: "operations" }, attempts: [], reviews: [review("ace-q-0001", "selector", "2026-07-24T09:00:00.000Z")], now }),
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

test("Certification Mixed Practice uses a deterministic unique interleaved blueprint and may shorten only within it", async () => {
  await validateBundledContent();
  const catalog = getCertificationContentCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "cloud-certification-taxonomy-v1");
  const prepare = (sessionId: string, requestedLength = 20) => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-mixed-practice", request: { sessionId, requestedLength }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
  const [first, second] = await Promise.all([prepare("mixed-first"), prepare("mixed-second")]);
  const blueprint = catalog.getMixedPractice();
  assert.equal(first.session.actualLength, 20);
  assert.equal(first.session.configurationSnapshot.kind, "certificationMixedPractice");
  assert.deepEqual(first.session.itemOrder.map((occurrence) => occurrence.item.itemId), blueprint.itemIds.slice(0, 20));
  assert.deepEqual(second.session.itemOrder.map((occurrence) => occurrence.item.itemId), first.session.itemOrder.map((occurrence) => occurrence.item.itemId));
  assert.equal(new Set(first.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, first.session.actualLength);
  await assert.rejects(() => prepare("mixed-invalid-length", 5), /supports only its installed 10, 20, or 40 item lengths/);
  await assert.rejects(() => runtime.prepare({ trackId: "cloud-certification", modeId: "certification-mixed-practice", request: { sessionId: "mixed-selector", requestedLength: 10, domain: "operations" }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" }), /does not accept selectors/);

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
  const shortened = await new CertificationFamilyRuntime(shortenedCatalog, "cloud-certification-taxonomy-v1").prepare({ trackId: "cloud-certification", modeId: "certification-mixed-practice", request: { sessionId: "mixed-shortened", requestedLength: 40 }, attempts: [], reviews: [], now: "2026-07-24T10:00:00.000Z" });
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
