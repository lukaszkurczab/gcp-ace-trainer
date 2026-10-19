import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import type { CanonicalContentLockRecord, CanonicalArtifact, Question } from "../../content/canonical/questionTypes";
import { buildCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { CanonicalQuestionValidationError } from "../../content/canonical/questionValidation";
import { contentHasher } from "../../infrastructure/identity/contentHasher";
import { createTrainingAttempt, type TrainingAttempt } from "../../domain/learning/trainingAttempt";
import type { TrackId } from "../../domain/learning/trackIdentity";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";
import coverageData from "../../testing/claudeCoverageFixtureData.json";

const TRACK_ID = "claude-certified-architect-professional-certification";
const NOW = "2026-10-11T12:00:00.000Z";
const appRoot = process.cwd();
const generatedRoot = resolve(appRoot, "src/content/generated/canonical-content");
const trackIds = [
  "aws-certified-solutions-architect-associate",
  "backend-system-design-interview",
  TRACK_ID,
  "coding-interview-dsa-problem-solving",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "object-oriented-design-interview",
] as const;

type CandidateLockFile = Readonly<{ tracks: readonly CanonicalContentLockRecord[] }>;
type FixtureIdentity = Readonly<{ questionId: string; nodeId: string; mentalUnitId: string }>;

function sourceArtifact(trackId: string): unknown {
  return JSON.parse(readFileSync(join(generatedRoot, `${trackId}.json`), "utf8"));
}

function sourceLocks(): CanonicalContentLockRecord[] {
  const lockFile = JSON.parse(readFileSync(join(generatedRoot, "content-lock.json"), "utf8")) as CandidateLockFile;
  return [...lockFile.tracks];
}

function buildArtifactFromCoverageFixture(): CanonicalArtifact {
  const original = sourceArtifact(TRACK_ID) as CanonicalArtifact;
  const template = original.questions[0];
  assert.ok(template, "bundled Claude artifact must provide a canonical question template");
  const { questionRelation: _questionRelation, ...templateWithoutRelation } = structuredClone(template);
  const identities = [...(coverageData.questions as readonly FixtureIdentity[])];
  // The existing Focus product mode still advertises a 40-question node pool.
  // Add one reachable item to four D01 units while retaining the four-question
  // minimum and exact 53-unit completion inventory.
  const expandedUnits = new Set<string>();
  for (const identity of identities) {
    if (identity.nodeId !== "solution_design_and_architecture" || expandedUnits.has(identity.mentalUnitId)) continue;
    expandedUnits.add(identity.mentalUnitId);
    identities.push({ ...identity, questionId: `${identity.questionId}-capacity-extra` });
    if (expandedUnits.size === 4) break;
  }
  const questions = identities.map((identity) => {
    return { ...templateWithoutRelation, ...identity, trackId: TRACK_ID } as Question;
  });
  return {
    schemaVersion: "patternly-content-artifact-v1",
    trackId: TRACK_ID,
    contentVersion: coverageData.contentVersion,
    questions,
    completionRule: coverageData.completionRule as CanonicalArtifact["completionRule"],
  };
}

async function buildCatalog(candidate: unknown, candidateLock: CanonicalContentLockRecord) {
  const artifacts = trackIds.map((trackId) => trackId === TRACK_ID ? candidate : sourceArtifact(trackId));
  const locks = sourceLocks().map((entry) => entry.trackId === TRACK_ID ? candidateLock : entry);
  return buildCanonicalRuntimeCatalog({ artifacts, locks });
}

async function syntheticCandidate() {
  const artifact = buildArtifactFromCoverageFixture();
  const sha256 = await contentHasher.sha256(JSON.stringify(artifact));
  const lock: CanonicalContentLockRecord = { trackId: TRACK_ID, contentVersion: artifact.contentVersion, questionCount: artifact.questions.length, sha256 };
  return { artifact, lock, catalog: await buildCatalog(artifact, lock) };
}

function questionIdsForUnit(questions: readonly Question[], nodeId: string, mentalUnitId: string): string[] {
  return questions.filter((question) => question.nodeId === nodeId && question.mentalUnitId === mentalUnitId).map((question) => question.questionId);
}

function attemptFor(track: Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>, questionId: string, id: string, kind: "correct" | "incorrect", answeredAt: string): TrainingAttempt<unknown> {
  const item = { trackId: track.trackId as TrackId, questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  return createTrainingAttempt({
    id,
    sessionId: `session:${id}`,
    occurrenceId: `occurrence:${id}`,
    trackId: track.trackId as TrackId,
    modeId: "certification-focus-practice",
    item,
    response: {},
    result: kind === "correct" ? { kind, earnedPoints: 1, maxPoints: 1 } : { kind, earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt,
    committedAt: answeredAt,
  });
}

test("CC04 v3 artifact reaches every required Claude unit through a truthfully shortened focused session", async () => {
  const { catalog } = await syntheticCandidate();
  const track = catalog.getTrack(TRACK_ID);
  const completionRule = track.completionRule;
  assert.equal(completionRule?.ruleVersion, 3);
  if (completionRule?.ruleVersion !== 3) throw new Error("Claude coverage fixture requires CompletionRule v3.");
  const requiredUnits = completionRule.chapters.flatMap((chapter) => chapter.units.map((unit) => ({ nodeId: chapter.nodeId, mentalUnitId: unit.mentalUnitId })));
  assert.equal(track.questions.length, 216);
  assert.equal(requiredUnits.length, 53);
  const focus = track.getMode("certification-focus-practice");
  assert.equal(focus.minimumActualLength, 10);
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  assert.ok(requiredUnits.some((unit) => questionIdsForUnit(track.questions, unit.nodeId, unit.mentalUnitId).length === 4), "fixture must exercise a unit whose capacity is below the nominal mode minimum");

  for (const [index, unit] of requiredUnits.entries()) {
    const expectedIds = questionIdsForUnit(track.questions, unit.nodeId, unit.mentalUnitId);
    assert.ok(expectedIds.length >= 4 && expectedIds.length <= 5, `${unit.mentalUnitId} fixture capacity`);
    const prepared = await runtime.prepare({
      trackId: TRACK_ID,
      modeId: focus.modeId,
      request: { sessionId: `cc04-unit-${index}`, requestedLength: 10, mentalUnitId: unit.mentalUnitId },
      attempts: [],
      reviews: [],
      now: NOW,
    });
    const selectedIds = prepared.session.itemOrder.map((entry) => entry.item.questionId);
    assert.equal(prepared.session.requestedLength, 10);
    assert.equal(prepared.session.actualLength, expectedIds.length, `${unit.mentalUnitId} must report the reachable capacity`);
    assert.equal(new Set(selectedIds).size, expectedIds.length, `${unit.mentalUnitId} cannot repeat question IDs`);
    assert.deepEqual(new Set(selectedIds), new Set(expectedIds));
    await runtime.validateResume({ session: prepared.session, draft: null });
  }

  const target = requiredUnits[0]!;
  const targetIds = questionIdsForUnit(track.questions, target.nodeId, target.mentalUnitId);
  const otherUnit = requiredUnits.find((unit) => unit.mentalUnitId !== target.mentalUnitId)!;
  const foreignQuestion = track.questions.find((question) => question.mentalUnitId === otherUnit.mentalUnitId)!;
  const attempts = [
    attemptFor(track, targetIds[0]!, "cc04-covered", "correct", "2026-10-11T11:00:00.000Z"),
    attemptFor(track, targetIds[1]!, "cc04-regressed", "incorrect", "2026-10-11T11:01:00.000Z"),
  ];
  const shortened = await runtime.prepare({
    trackId: TRACK_ID,
    modeId: focus.modeId,
    request: { sessionId: "cc04-current-deficit", requestedLength: 10, mentalUnitId: target.mentalUnitId },
    attempts,
    reviews: [],
    now: NOW,
  });
  const deficitIds = shortened.session.itemOrder.map((entry) => entry.item.questionId);
  assert.equal(shortened.session.actualLength, targetIds.length, "focused sessions retain the approved four-item minimum when the unit pool allows it");
  assert.equal(new Set(deficitIds).size, targetIds.length);
  assert.deepEqual(new Set(deficitIds.slice(0, targetIds.length - 1)), new Set(targetIds.slice(1)), "all uncovered questions are prioritized before same-unit padding");
  assert.equal(deficitIds.at(-1), targetIds[0], "same-unit padding may include an already-correct question to meet the session minimum");
  await runtime.validateResume({ session: shortened.session, draft: null });

  const forged = {
    ...shortened.session,
    itemOrder: shortened.session.itemOrder.map((entry, index) => index === 0 ? { ...entry, item: { ...entry.item, questionId: foreignQuestion.questionId } } : entry),
  };
  await assert.rejects(() => runtime.validateResume({ session: forged, draft: null }), /session scope or minimum length is invalid/u);

  await assert.rejects(() => runtime.prepare({
    trackId: TRACK_ID,
    modeId: focus.modeId,
    request: { sessionId: "cc04-stale-pin", requestedLength: 10, mentalUnitId: target.mentalUnitId, expectedContentVersion: `${track.contentVersion}-old`, expectedArtifactSha256: track.artifactSha256 },
    attempts: [],
    reviews: [],
    now: NOW,
  }), /content identity is unavailable/u);
});

test("CC04 v3 rejects an ambiguous required-unit mapping before runtime selection", async () => {
  const { artifact, lock } = await syntheticCandidate();
  const duplicated = structuredClone(artifact) as unknown as Record<string, unknown>;
  const completionRule = structuredClone(artifact.completionRule) as unknown as { chapters: Array<{ mentalUnitCount: number; units: Array<{ mentalUnitId: string; requiredCorrectQuestionCount: number }> }> };
  const firstUnit = completionRule.chapters[0]!.units[0]!;
  completionRule.chapters[1]!.units.push({ ...firstUnit });
  completionRule.chapters[1]!.mentalUnitCount += 1;
  duplicated.completionRule = completionRule;
  await assert.rejects(
    () => buildCatalog(duplicated, lock),
    (error: unknown) => error instanceof CanonicalQuestionValidationError && error.errors.some((entry) => entry.includes("completionRule: invalid versioned completion rule")),
  );
});

test("current installed Claude bank reaches every completion unit through production Focus and resume", async () => {
  const artifact = sourceArtifact(TRACK_ID) as CanonicalArtifact;
  const candidateLock = sourceLocks().find((entry) => entry.trackId === TRACK_ID);
  assert.ok(candidateLock, "candidate content lock must contain Claude");
  const catalog = await buildCatalog(artifact, candidateLock);
  const track = catalog.getTrack(TRACK_ID);
  assert.equal(track.questions.length, candidateLock.questionCount, "all current locked questions reach the catalog");
  assert.equal(track.completionRule?.ruleVersion, 3);
  if (track.completionRule?.ruleVersion !== 3) throw new Error("CC04 candidate does not expose v3 unit coverage.");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const requiredUnits = track.completionRule.chapters.flatMap((chapter) => chapter.units.map((unit) => ({ nodeId: chapter.nodeId, mentalUnitId: unit.mentalUnitId })));
  const unitKey = (unit: { nodeId: string; mentalUnitId: string }) => `${unit.nodeId}/${unit.mentalUnitId}`;
  const currentUnits = new Set(requiredUnits.map(unitKey));
  const establishedUnits = new Set((coverageData.questions as readonly FixtureIdentity[]).map(unitKey));
  assert.equal(currentUnits.size, requiredUnits.length, "current completion units are unique");
  for (const expected of establishedUnits) assert.ok(currentUnits.has(expected), `established completion unit remains reachable: ${expected}`);
  for (const [index, unit] of requiredUnits.entries()) {
    const expectedIds = questionIdsForUnit(track.questions, unit.nodeId, unit.mentalUnitId);
    assert.ok(expectedIds.length >= 4, `${unit.mentalUnitId} must have at least four reachable questions`);
    const prepared = await runtime.prepare({ trackId: TRACK_ID, modeId: "certification-focus-practice", request: { sessionId: `cc04-source-${index}`, requestedLength: 10, mentalUnitId: unit.mentalUnitId }, attempts: [], reviews: [], now: NOW });
    const selectedIds = prepared.session.itemOrder.map((entry) => entry.item.questionId);
    assert.equal(prepared.session.actualLength, Math.min(10, expectedIds.length));
    assert.equal(new Set(selectedIds).size, selectedIds.length);
    assert.ok(selectedIds.every((questionId) => expectedIds.includes(questionId)));
    await runtime.validateResume({ session: prepared.session, draft: null });
  }
});
