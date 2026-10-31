import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { advanceTrainingSession } from "../../domain";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import type { ApproachChallengeProblem } from "../../content/canonical/approachChallengeProblem";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createTrainingCatalog, createTrainingInteractionPort } from "../canonicalTrainingFamilyComposition";
import { CodingInterviewTrainingRuntime } from "./codingInterviewTrainingRuntime";
import { confirmApproachChallengeShortening, selectApproachChallengeProblems, type ApproachChallengeSelection } from "./approachChallengeSelection";
import { decodeApproachChallengeManifest, projectApproachChallengeManifestIntegrity, projectApproachChallengeMethodReveal } from "./approachChallengeSession";

const fixturesRoot = path.resolve(process.cwd(), "../patternly-content/tests/fixtures/approach-challenge");
const fixture = (name = "W01.json"): ApproachChallengeProblem => JSON.parse(readFileSync(path.join(fixturesRoot, name), "utf8")) as ApproachChallengeProblem;
const now = "2026-10-30T12:00:00.000Z";

async function harness(problem: ApproachChallengeProblem = fixture()) {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const base = createTrainingCatalog(track);
  const catalog = Object.freeze({ ...base, getApproachChallengeProblem: (id: string, version: string) => id === problem.problemId && version === problem.problemVersion ? problem : undefined });
  const runtime = new CodingInterviewTrainingRuntime(catalog, createTrainingInteractionPort(track));
  const selected = selectApproachChallengeProblems({
    sources: [{ problem }], contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as never, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"], selectedFamilyIds: [...problem.requiredFamilyIds] },
  });
  assert.equal(selected.status, "confirmation_required");
  const selection = confirmApproachChallengeShortening(selected, true) as ApproachChallengeSelection;
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID,
    request: { sessionId: "acm5-runtime-test", selection }, attempts: [], reviews: [], now });
  return { track, catalog, runtime, problem, selection, prepared };
}

test("Approach Challenge prepares a pinned two-occurrence task in the existing session model", async () => {
  const { runtime, problem, prepared } = await harness();
  assert.equal(prepared.session.modeId, APPROACH_CHALLENGE_MODE_ID);
  assert.equal(prepared.session.actualLength, 2);
  assert.equal(prepared.session.requestedLength, 10);
  assert.deepEqual(prepared.session.itemOrder.map(({ item }) => item.questionId), [problem.approachQuestion.questionId, problem.complexityQuestion.questionId]);
  const manifest = decodeApproachChallengeManifest(prepared.session.configurationSnapshot.approachChallengeManifestV1, prepared.session);
  assert.equal(manifest.entries[0]?.problemRef.analyzedApproachId, problem.analyzedApproachId);
  await runtime.validateResume({ session: prepared.session, draft: null });
});

test("stage two rejects out-of-order submission and finalization rejects an incomplete pair", async () => {
  const { runtime, problem, prepared } = await harness();
  const q2Session = advanceTrainingSession(prepared.session);
  await assert.rejects(runtime.submitPractice({ session: q2Session, response: problem.complexityQuestion.answer, attempts: [], reviews: [], now }), /durable result|accepted stage one|in order/u);
  await assert.rejects(runtime.finalizePractice({ session: prepared.session, attempts: [], now }), /exactly one accepted result/u);
});

test("accepted Q1 reveals one fixed method, Q2 and retry remain tied to the same pair, with no legacy review mutations", async () => {
  const { runtime, problem, prepared } = await harness();
  const partial = problem.approachQuestion.interaction.options.find(({ grade }) => grade === "partial")!;
  const first = await runtime.submitPractice({ session: prepared.session, response: { type: "approach_choice", optionId: partial.optionId }, attempts: [], reviews: [], now });
  assert.deepEqual(first.reviewMutations, []);
  assert.deepEqual([first.attempt.result.kind, first.attempt.result.earnedPoints, first.attempt.result.maxPoints], ["partial", 0, 1]);
  const manifest = decodeApproachChallengeManifest(first.session.configurationSnapshot.approachChallengeManifestV1, first.session);
  assert.equal(manifest.entries[0]?.problemRef.analyzedApproachId, problem.analyzedApproachId);
  const secondSession = advanceTrainingSession(first.session);
  const second = await runtime.submitPractice({ session: secondSession, response: problem.complexityQuestion.answer, attempts: [first.attempt], reviews: [], now });
  assert.deepEqual(second.reviewMutations, []);
  assert.equal(second.attempt.result.kind, "correct");
  assert.equal(decodeApproachChallengeManifest(second.session.configurationSnapshot.approachChallengeManifestV1, second.session).entries[0]?.problemRef.analyzedApproachId, problem.analyzedApproachId);
  const finalized = await runtime.finalizePractice({ session: second.session, attempts: [first.attempt, second.attempt], now });
  const details = finalized.result.evidence.details as Record<string, unknown>;
  assert.equal(finalized.result.totalOccurrences, 2);
  assert.equal(details.partialCount, 1);
  assert.equal(details.pointsEarned, 1);
});

test("exact artifact absence fails closed without legacy question fallback", async () => {
  const { track, problem, prepared } = await harness();
  const base = createTrainingCatalog(track);
  const noApproachSource = new CodingInterviewTrainingRuntime(base, createTrainingInteractionPort(track));
  await assert.rejects(noApproachSource.validateResume({ session: prepared.session, draft: null }), /exact pinned|unavailable/u);
});

test("the analyzed method stays hidden until durable Q1 and remains visible on cold Q2 resume", () => {
  const problem = fixture("W01.json");
  assert.equal(projectApproachChallengeMethodReveal(problem, false), null, "Q1 before its durable answer reveals no method");
  const afterColdQ2Resume = projectApproachChallengeMethodReveal(problem, true);
  assert.equal(afterColdQ2Resume?.analyzedApproachId, problem.analyzedApproachId);
  assert.deepEqual(afterColdQ2Resume?.methodReveal, problem.methodReveal);
});

test("history does not turn a missing or corrupt manifest into a zero-task result", () => {
  const pin = { contentVersion: "content-v1", artifactSha256: "a".repeat(64) };
  assert.deepEqual(projectApproachChallengeManifestIntegrity(undefined, pin), { manifestIntegrity: "unavailable", problemCount: null });
  assert.deepEqual(projectApproachChallengeManifestIntegrity("{bad json", pin), { manifestIntegrity: "unavailable", problemCount: null });
});
