import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { buildCanonicalRuntimeCatalog, type CanonicalContentLockRecord } from "../../content/canonical";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import type { ReviewQueueEntry } from "../../domain";

type CurrentProducerBuilder = Readonly<{
  buildTrack(options: Readonly<{ rootDirectory: string; outputRoot: string; trackId: string }>): Promise<Readonly<{
    artifact: unknown;
    artifactBytes: string;
    lockEntry: CanonicalContentLockRecord;
  }>>;
}>;

const AWS_TRACK_ID = "aws-certified-solutions-architect-associate";
const AWS_NODE_ID = "aws_secure_architecture_foundations";
const NOW = "2026-09-21T12:00:00.000Z";

test("ODK-096 AWS Free focus selects unique 10/20/40 question plans from the current canonical node", async () => {
  const appRoot = process.cwd();
  const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
  const generatedRoot = resolve(appRoot, "src/content/generated/canonical-content");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-odk096-session-selection-"));
  try {
    const builder = await import(pathToFileURL(join(contentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const current = await builder.buildTrack({ rootDirectory: contentRoot, outputRoot, trackId: AWS_TRACK_ID });
    const currentArtifact = JSON.parse(current.artifactBytes) as unknown;
    const lock = JSON.parse(readFileSync(join(generatedRoot, "content-lock.json"), "utf8")) as { tracks: CanonicalContentLockRecord[] };
    const historicalArtifacts = lock.tracks.map((entry) => JSON.parse(readFileSync(join(generatedRoot, `${entry.trackId}.json`), "utf8")) as unknown);
    const artifacts = historicalArtifacts.map((artifact) => (artifact && typeof artifact === "object" && "trackId" in artifact && artifact.trackId === AWS_TRACK_ID ? currentArtifact : artifact));
    const locks = lock.tracks.map((entry) => entry.trackId === AWS_TRACK_ID ? current.lockEntry : entry);
    const catalog = await buildCanonicalRuntimeCatalog({ artifacts, locks });
    const track = catalog.getTrack(AWS_TRACK_ID);
    const runtime = new CanonicalTrainingRuntime(track);
    const focus = track.getMode("certification-focus-practice");
    assert.deepEqual(focus.requestedLengths, [10, 20, 40]);
    assert.equal(focus.selection.kind, "node");
    if (focus.selection.kind !== "node") throw new Error("AWS focus must use node selection.");
    assert.equal(focus.selection.nodeId, AWS_NODE_ID);

    for (const requestedLength of [10, 20, 40] as const) {
      const prepared = await runtime.prepare({
        trackId: AWS_TRACK_ID,
        modeId: focus.modeId,
        request: { sessionId: `odk096-focus-${requestedLength}`, requestedLength },
        attempts: [],
        reviews: [],
        now: NOW,
      });
      const questionIds = prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId);
      assert.equal(prepared.session.requestedLength, requestedLength);
      assert.equal(prepared.session.actualLength, requestedLength);
      assert.equal(new Set(questionIds).size, requestedLength);
      assert.ok(questionIds.every((questionId) => track.getQuestion(questionId)?.nodeId === AWS_NODE_ID));
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("ODK-096 AWS evidence-conditioned review truthfully shortens to due evidence and fails closed without it", async () => {
  const appRoot = process.cwd();
  const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
  const generatedRoot = resolve(appRoot, "src/content/generated/canonical-content");
  const outputRoot = await mkdtemp(join(tmpdir(), "patternly-odk096-evidence-selection-"));
  try {
    const builder = await import(pathToFileURL(join(contentRoot, "scripts/build.mjs")).href) as unknown as CurrentProducerBuilder;
    const current = await builder.buildTrack({ rootDirectory: contentRoot, outputRoot, trackId: AWS_TRACK_ID });
    const currentArtifact = JSON.parse(current.artifactBytes) as unknown;
    const lock = JSON.parse(readFileSync(join(generatedRoot, "content-lock.json"), "utf8")) as { tracks: CanonicalContentLockRecord[] };
    const historicalArtifacts = lock.tracks.map((entry) => JSON.parse(readFileSync(join(generatedRoot, `${entry.trackId}.json`), "utf8")) as unknown);
    const artifacts = historicalArtifacts.map((artifact) => (artifact && typeof artifact === "object" && "trackId" in artifact && artifact.trackId === AWS_TRACK_ID ? currentArtifact : artifact));
    const locks = lock.tracks.map((entry) => entry.trackId === AWS_TRACK_ID ? current.lockEntry : entry);
    const catalog = await buildCanonicalRuntimeCatalog({ artifacts, locks });
    const track = catalog.getTrack(AWS_TRACK_ID);
    const runtime = new CanonicalTrainingRuntime(track);
    const reviewMode = track.getMode("certification-weak-area-review");
    assert.equal(reviewMode.selection.kind, "evidence_conditioned");
    if (reviewMode.selection.kind !== "evidence_conditioned") throw new Error("AWS weak review must be evidence-conditioned.");
    const question = track.getPool(reviewMode.modeId)[0];
    assert.ok(question);
    const sourceItem = { trackId: AWS_TRACK_ID, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 } as const;
    const dueReview: ReviewQueueEntry = {
      id: "review:odk096-evidence",
      trackId: AWS_TRACK_ID,
      sourceAttemptId: "attempt:odk096-evidence",
      sourceSessionId: "session:odk096-evidence",
      sourceItem,
      taxonomyOrSkillRefs: [],
      reasons: ["scheduled_retrieval"],
      dueAt: NOW,
      createdAt: NOW,
      consecutiveAfterDueSuccesses: 0,
      persistent: true,
    };
    const shortened = await runtime.prepare({
      trackId: AWS_TRACK_ID,
      modeId: reviewMode.modeId,
      request: { sessionId: "odk096-evidence-due", requestedLength: 20 },
      attempts: [],
      reviews: [dueReview],
      now: NOW,
    });
    assert.equal(shortened.session.requestedLength, 20);
    assert.equal(shortened.session.actualLength, 1);
    assert.deepEqual(shortened.session.itemOrder.map((occurrence) => occurrence.item.questionId), [question.questionId]);
    await assert.rejects(() => runtime.prepare({
      trackId: AWS_TRACK_ID,
      modeId: reviewMode.modeId,
      request: { sessionId: "odk096-evidence-empty", requestedLength: 20 },
      attempts: [],
      reviews: [],
      now: NOW,
    }), /insufficient eligible content/u);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
