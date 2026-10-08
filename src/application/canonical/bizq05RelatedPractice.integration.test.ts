import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { buildCanonicalRuntimeCatalog, type CanonicalContentLockRecord, type Question } from "../../content/canonical";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { selectPracticeQuestions } from "./practiceQuestionSelector";
import { createTrainingSession, type CompletedTrainingSession, type TrainingAttempt, type TrainingSession } from "../../domain";
import { projectCertificationPracticeReview } from "../certification/certificationPracticeReviewProjection";

type CurrentProducerBuilder = Readonly<{
  buildTrack(options: Readonly<{ rootDirectory: string; outputRoot: string; trackId: string }>): Promise<Readonly<{
    artifact: unknown;
    artifactBytes: string;
    lockEntry: CanonicalContentLockRecord;
  }>>;
}>;

const GCP_TRACK_ID = "google-cloud-associate-cloud-engineer";
const GCP_FOCUS_MODE_ID = "certification-focus-practice";
const NODE_ID = "organization_projects_policies_services_quotas_and_assets";
const NEW_GCP_CONTENT_VERSION = "google-cloud-associate-cloud-engineer-authoring-v2026.10.08-bizq05-v1";
const NEW_GCP_ARTIFACT_SHA256 = "9a14f1d185c3717ec118fc817dee458a3e6a33c1de145805c9d76093c77e2fa5";
const PREVIOUS_GCP_CONTENT_VERSION = "google-cloud-associate-cloud-engineer-authoring-v2026.08.11-bizq02-v2";
const PREVIOUS_GCP_ARTIFACT_SHA256 = "b88d542f742be3de3a023b1c87b20c6416dc48f30aa53a223987a161edfcb609";
const PAIRS = Object.freeze([
  Object.freeze({ leftId: "gcp-ace-gcpace-n01-b04-006", rightId: "gcp-ace-gcpace-n01-b04-007", kind: "condition_contrast" as const }),
  Object.freeze({ leftId: "gcp-ace-gcpace-n01-b04-019", rightId: "gcp-ace-gcpace-n01-b04-020", kind: "near_variant" as const }),
]);
const NOW = "2026-10-08T12:00:00.000Z";
const TAXONOMY_VERSION = "canonical-content-v1";

test("BIZQ-05 GCP candidate relation metadata reaches actual Focus selection, immutable resume, and completed practice review", async () => {
  const appRoot = process.cwd();
  const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
  const generatedRoot = resolve(appRoot, "src/content/generated/canonical-content");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-bizq05-related-practice-"));
  try {
    const builder = await import(pathToFileURL(join(contentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const current = await builder.buildTrack({ rootDirectory: contentRoot, outputRoot, trackId: GCP_TRACK_ID });
    const candidateArtifact = JSON.parse(current.artifactBytes) as unknown;
    const lockFile = JSON.parse(readFileSync(join(generatedRoot, "content-lock.json"), "utf8")) as { tracks: CanonicalContentLockRecord[] };
    const bundledGcpLock = lockFile.tracks.find((entry) => entry.trackId === GCP_TRACK_ID);
    assert.ok(bundledGcpLock, "the bundled candidate needs its existing GCP lock record");
    assert.equal(current.lockEntry.contentVersion, NEW_GCP_CONTENT_VERSION, "candidate producer must assign the reviewed new GCP content version");
    assert.equal(current.lockEntry.sha256, NEW_GCP_ARTIFACT_SHA256, "candidate producer must produce the reviewed new artifact pin");
    assert.equal(bundledGcpLock.contentVersion, current.lockEntry.contentVersion, "the shipped bundle must contain the exact candidate version");
    assert.equal(bundledGcpLock.sha256, current.lockEntry.sha256, "the shipped bundle must contain the exact candidate pin");
    assert.notEqual(PREVIOUS_GCP_ARTIFACT_SHA256, current.lockEntry.sha256, "the preserved prior artifact pin must remain foreign to the candidate");

    const historicalArtifacts = lockFile.tracks.map((entry) => JSON.parse(readFileSync(join(generatedRoot, `${entry.trackId}.json`), "utf8")) as unknown);
    assert.equal(historicalArtifacts.length, 9);
    const artifacts = historicalArtifacts.map((artifact) => artifact && typeof artifact === "object" && "trackId" in artifact && artifact.trackId === GCP_TRACK_ID ? candidateArtifact : artifact);
    const locks = lockFile.tracks.map((entry) => entry.trackId === GCP_TRACK_ID ? current.lockEntry : entry);
    const catalog = await buildCanonicalRuntimeCatalog({ artifacts, locks });
    const track = catalog.getTrack(GCP_TRACK_ID);
    const runtime = new CanonicalTrainingRuntime(track);
    const focus = track.getMode(GCP_FOCUS_MODE_ID);
    assert.equal(focus.selection.kind, "node");
    if (focus.selection.kind !== "node") throw new Error("GCP Focus must use the existing node selection.");
    assert.equal(focus.selection.nodeId, NODE_ID);

    const pairQuestions = new Map<string, Question>();
    for (const pair of PAIRS) {
      const left = track.getQuestion(pair.leftId);
      const right = track.getQuestion(pair.rightId);
      assert.ok(left && right, `current producer candidate must include ${pair.leftId} and ${pair.rightId}`);
      assert.equal(left.nodeId, NODE_ID);
      assert.equal(right.nodeId, NODE_ID);
      assert.equal(left.mentalUnitId, right.mentalUnitId);
      assert.ok(left.questionRelation);
      assert.equal(left.questionRelation.counterpartQuestionId, right.questionId);
      assert.equal(left.questionRelation.kind, pair.kind);
      assert.ok(left.questionRelation?.changedCondition.trim());
      assert.ok(left.questionRelation?.decisionBoundary.trim());
      assert.equal(right.questionRelation?.counterpartQuestionId, left.questionId);
      assert.equal(right.questionRelation?.kind, pair.kind);
      assert.equal(right.questionRelation?.changedCondition, left.questionRelation?.changedCondition);
      assert.equal(right.questionRelation?.decisionBoundary, left.questionRelation?.decisionBoundary);
      pairQuestions.set(left.questionId, left);
      pairQuestions.set(right.questionId, right);
    }

    const nearVariantPair = PAIRS[1]!;
    const mentalUnitId = track.getQuestion(PAIRS[0]!.leftId)!.mentalUnitId;
    const focusPool = track.getPool(focus.modeId).filter((question) => question.mentalUnitId === mentalUnitId);
    assert.equal(focusPool.length, 22, "the exact N01-B04 Focus unit remains the authored 22-question pool");
    assert.ok([...pairQuestions.keys()].every((questionId) => focusPool.some((question) => question.questionId === questionId)));
    const scopedRequest = (sessionId: string, requestedLength: number) => ({
      sessionId,
      requestedLength,
      mentalUnitId,
      expectedContentVersion: track.contentVersion,
      expectedArtifactSha256: track.artifactSha256,
    });

    const historyPlan = await runtime.prepare({
      trackId: track.trackId,
      modeId: focus.modeId,
      request: scopedRequest("bizq05-related-history", 40),
      attempts: [],
      reviews: [],
      now: NOW,
    });
    assert.equal(historyPlan.session.requestedLength, 40);
    assert.equal(historyPlan.session.actualLength, 22, "Focus keeps its existing truthful short-plan behavior");
    const historyIndex = historyPlan.session.itemOrder.findIndex((occurrence) => occurrence.item.questionId === nearVariantPair.leftId);
    assert.ok(historyIndex >= 0, "the actual prepared plan must include the near-variant history item");
    const historySession = await positionSession(historyPlan.session, historyIndex);
    await runtime.validateResume({ session: historySession, draft: null });
    const historyQuestion = track.getQuestion(nearVariantPair.leftId)!;
    const historySubmission = await runtime.submitPractice({ session: historySession, response: historyQuestion.answer, attempts: [], reviews: [], now: NOW });
    const samePinHistory = [historySubmission.attempt];
    const samePinSelected = selectPracticeQuestions(focusPool, samePinHistory, {
      trackId: track.trackId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
    }, 20);
    assert.equal(samePinSelected.length, 20);
    assert.equal(samePinSelected.some((question) => question.questionId === nearVariantPair.rightId), false, "an exact-pin peer history must defer the near variant from a full 22-item pool");

    const samePinPrepared = await runtime.prepare({
      trackId: track.trackId,
      modeId: focus.modeId,
      request: scopedRequest("bizq05-related-same-pin", 20),
      attempts: samePinHistory,
      reviews: [],
      now: NOW,
    });
    assert.deepEqual(samePinPrepared.session.itemOrder.map((occurrence) => occurrence.item.questionId), samePinSelected.map((question) => question.questionId));

    const foreignPinHistory = [{
      ...historySubmission.attempt,
      item: {
        ...historySubmission.attempt.item,
        contentVersion: PREVIOUS_GCP_CONTENT_VERSION,
        artifactSha256: PREVIOUS_GCP_ARTIFACT_SHA256,
      },
    }] as readonly TrainingAttempt<unknown>[];
    const foreignPinSelected = selectPracticeQuestions(focusPool, foreignPinHistory, {
      trackId: track.trackId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
    }, 20);
    assert.deepEqual(
      foreignPinSelected.map((question) => question.questionId),
      selectPracticeQuestions(focusPool, [], { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 }, 20).map((question) => question.questionId),
      "history from a previous artifact pin must not affect candidate selection",
    );

    const prepared = await runtime.prepare({
      trackId: track.trackId,
      modeId: focus.modeId,
      request: scopedRequest("bizq05-related-completed", 40),
      attempts: [],
      reviews: [],
      now: NOW,
    });
    assert.equal(prepared.session.actualLength, 22);
    const preparedOrder = prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId);
    assert.equal(new Set(preparedOrder).size, 22);
    assert.ok([...pairQuestions.keys()].every((questionId) => preparedOrder.includes(questionId)));
    await runtime.validateResume({ session: prepared.session, draft: null });
    assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId), preparedOrder, "resume preserves the original prepared order");

    const attempts: TrainingAttempt<unknown>[] = [];
    for (let index = 0; index < prepared.session.actualLength; index += 1) {
      const session = await positionSession(prepared.session, index);
      await runtime.validateResume({ session, draft: null });
      const occurrence = session.itemOrder[index]!;
      const question = track.getQuestion(occurrence.item.questionId)!;
      const submitted = await runtime.submitPractice({ session, response: question.answer, attempts, reviews: [], now: new Date(Date.parse(NOW) + index * 1_000).toISOString() });
      attempts.push(submitted.attempt);
    }
    const finalSession = await positionSession(prepared.session, prepared.session.actualLength - 1);
    const completed = await runtime.finalizePractice({ session: finalSession, attempts, now: new Date(Date.parse(NOW) + prepared.session.actualLength * 1_000).toISOString() });
    assert.equal(completed.session.status, "completed");
    const review = await projectCertificationPracticeReview({
      attempts,
      resolveQuestion: async (item) => {
        assert.equal(item.trackId, track.trackId);
        assert.equal(item.contentVersion, track.contentVersion);
        assert.equal(item.artifactSha256, track.artifactSha256);
        return track.getQuestion(item.questionId)!;
      },
      result: completed.result,
      session: completed.session as CompletedTrainingSession,
    });
    assert.equal(review.modeId, GCP_FOCUS_MODE_ID);
    assert.equal(review.total, 22);
    assert.equal(review.diagnosticReport, undefined, "normal Focus practice does not produce a diagnostic report");
    assert.equal(review.relatedPracticeLimitation, "related_question_pair", "both authored relation kinds remain related practice, not an independent transfer claim");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

async function positionSession(session: TrainingSession, currentItemIndex: number): Promise<TrainingSession> {
  const base = createTrainingSession({ ...session, currentItemIndex, planFingerprint: undefined, taxonomyVersion: undefined });
  const taxonomyVersion = TAXONOMY_VERSION;
  const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion });
  return createTrainingSession({ ...base, taxonomyVersion, planFingerprint });
}
