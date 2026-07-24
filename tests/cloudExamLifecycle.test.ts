import assert from "node:assert/strict";
import test from "node:test";

import {
  startCertificationExam,
} from "../src/application/certification";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { PublishedCertificationExamExperienceProfile } from "../src/content/contracts";
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
    new CertificationContentCatalog(sourceCatalog.getItems(), sourceCatalog.getContentVersion(), sourceCatalog.getDiagnosticBaseline(), examProfile),
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
