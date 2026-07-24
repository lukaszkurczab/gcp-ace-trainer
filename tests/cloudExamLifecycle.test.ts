import assert from "node:assert/strict";
import test from "node:test";

import {
  completeCertificationPracticeSession,
  getCertificationPracticeProjection,
  startCertificationExam,
  startCertificationSession,
  submitCertificationPracticeResponse,
} from "../src/application/certification";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { PublishedCertificationExamExperienceProfile } from "../src/content/contracts";
import { CertificationFamilyRuntime } from "../src/application/certification/CertificationFamilyRuntime";
import { CertificationContentCatalog } from "../src/tracks/cloud-certification/certificationContentCatalog";
import type { CertificationQuestion } from "../src/tracks/cloud-certification";
import { getActiveTrainingSession, getReviewQueueItems } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

class MutableClock {
  constructor(private value: string) {}
  now = () => this.value;
  set(value: string) { this.value = value; }
}

function response(question: CertificationQuestion, correct: boolean) {
  const selectedOptionIds = correct
    ? question.correctOptionIds
    : [question.options.find((option) => !question.correctOptionIds.includes(option.id))?.id ?? (() => { throw new Error(`No explicitly incorrect option exists for ${question.id}.`); })()];
  return { kind: "option_selection" as const, selectedOptionIds };
}

async function prepare(clock = new MutableClock("2026-07-23T10:00:00.000Z")) {
  await validateBundledContent();
  installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({ wallClock: clock });
  return { clock, lifecycle };
}

test("Cloud Exam refuses the installed GCP profile instead of inventing undocumented interaction rules", async () => {
  await prepare();
  await assert.rejects(
    () => startCertificationExam("undocumented-profile"),
    (error: unknown) => error instanceof Error && (error as Error & { cause?: unknown }).cause instanceof Error && /does not document every required interaction rule/.test(String((error as Error & { cause: Error }).cause.message)),
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
    new CertificationContentCatalog(sourceCatalog.getItems(), sourceCatalog.getContentVersion(), examProfile),
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

test("Cloud Due Review removes a due entry only after a correct due response and retains it after failure", async () => {
  const { clock } = await prepare();
  const first = await startCertificationSession({ modeId: "cloud-practice", requestedLength: 1, source: "due-review-test" });
  const firstProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(firstProjection.question, false));
  await completeCertificationPracticeSession();
  const dueAt = (await getReviewQueueItems()).value[0]?.dueAt;
  assert.ok(dueAt);
  clock.set(dueAt!);

  const dueSuccess = await startCertificationSession({ modeId: "cloud-review", source: "due-review-success" });
  const successProjection = await getCertificationPracticeProjection();
  assert.equal(successProjection.question.id, firstProjection.question.id);
  await submitCertificationPracticeResponse(response(successProjection.question, true));
  await completeCertificationPracticeSession();
  assert.equal((await getReviewQueueItems()).value.some((entry) => entry.sourceItem.itemId === firstProjection.question.id), false);

  const failedSource = await startCertificationSession({ modeId: "cloud-practice", requestedLength: 1, source: "due-review-failure" });
  const failedSourceProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(failedSourceProjection.question, false));
  await completeCertificationPracticeSession();
  const failedDueAt = (await getReviewQueueItems()).value.find((entry) => entry.sourceSessionId === failedSource.session.id)?.dueAt;
  assert.ok(failedDueAt);
  clock.set(failedDueAt!);
  const dueFailure = await startCertificationSession({ modeId: "cloud-review", source: "due-review-failure-run" });
  const failureProjection = await getCertificationPracticeProjection();
  await submitCertificationPracticeResponse(response(failureProjection.question, false));
  await completeCertificationPracticeSession();
  assert.equal(dueFailure.session.modeId, "cloud-review");
  assert.equal((await getReviewQueueItems()).value.some((entry) => entry.sourceItem.itemId === failedSourceProjection.question.id), true);
});
