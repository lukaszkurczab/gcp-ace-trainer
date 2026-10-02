import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
import * as reads from "./learningReadModels";
import { loadActivitySessionRecords } from "./activityReadModels";
import { captureProfileReadFence } from "./profileReadFence";
import { homePlanSnapshotReader } from "./homePlanSnapshotReader";
import { describeOperationalFailure } from "./operationalDiagnostics";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { createTrainingAttempt, CODING_INTERVIEW_TRACK_ID, type TrainingAttempt } from "../domain";
import { addTrainingAttempt, saveActiveTrackId } from "../storage/repositories";
import * as storageApi from "../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../infrastructure/storage/profileStorageRouter";

// The actual nested Home load command cannot be imported in Node with React Native.
// Compile its AST span unchanged; bind real application reads and capture only UI setters.
// This establishes source-pipeline publication, not React rendering or native SDK fidelity.
function commandSource() {
  const baseline = process.env.BIZQ_HOME_COMMAND_SHA;
  if (baseline) assert.match(baseline, /^[a-f0-9]{40}$/);
  const source = baseline
    ? execFileSync("git", ["show", `${baseline}:src/features/home/HomeScreen.tsx`], { encoding: "utf8" })
    : readFileSync("src/features/home/HomeScreen.tsx", "utf8");
  const ast = ts.createSourceFile("HomeScreen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let command: ts.FunctionDeclaration | undefined;
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "loadShellData") command = node;
    ts.forEachChild(node, visit);
  }
  visit(ast); assert.ok(command);
  return ts.transpileModule(command.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

async function runHome(changeProfile: () => Promise<void>) {
  const outcome: { published: { trainingAttempts: readonly TrainingAttempt[] } | null; readError: string | null } = { published: null, readError: null };
  const context = {
    isActive: true, accountRef: { current: { state: { kind: "guest" } } },
    getActiveTrackId: reads.loadActiveTrackId, getAttempts: reads.loadExamSummaries, getPracticeHistory: reads.loadPracticeHistory,
    loadActiveTrainingSession: reads.loadActiveTrainingSession, loadCloudCertificationProgressViewModel: reads.loadCloudCertificationProgress,
    getReviewQueueItems: reads.loadReviewQueueItems, getTrainingAttempts: reads.loadTrainingAttempts,
    loadActivitySessionRecords, homePlanSnapshotReader, captureProfileReadFence,
    loadGoal: async (trackId: string) => { const result = await reads.loadGoal(trackId); await changeProfile(); return result; },
    loadGoalOnboardingDismissed: reads.loadGoalOnboardingDismissed,
    loadCodingInterviewDashboard: reads.loadCodingInterviewDashboard, describeOperationalFailure, CODING_INTERVIEW_TRACK_ID,
    setActiveTrackId: () => {}, setData: (value: typeof outcome.published) => { outcome.published = value; },
    setHasLoadedActiveTrack: () => {}, setShellReadError: (value: string) => { outcome.readError = value; },
  };
  await vm.runInNewContext(`${commandSource()}; loadShellData();`, context);
  return outcome;
}

test("actual Home command rejects profile changes after Activity reads and before publication, including A/B/A", async t => {
  const base = new storageApi.MemoryKeyValueStorage(); const values = new Map<string, string>(); let sequence = 70;
  const control = { get: async (key: string) => values.get(key) ?? null, set: async (key: string, value: string) => { values.set(key, value); }, remove: async (key: string) => { values.delete(key); } };
  const identity = { create: async () => ({ installationId: "00000000-0000-4000-8000-000000000001", localDatasetId: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}` }) };
  storageApi.setProfileStoragePreparationFactoryForTests(async () => ({ base, router: await openProfileStorageRouter(base, control, { identity }) }));
  async function select(account: string) {
    storageApi.closeActiveProfileStorage(); await storageApi.prepareProfileStorage();
    const { profile } = await storageApi.selectPreparedAccountProfile(account);
    storageApi.activatePreparedProfile(profile.id, profile.kind);
    await saveActiveTrackId(CODING_INTERVIEW_TRACK_ID);
  }
  try {
    await select("home-read-fixture-a"); await contentPackageRuntimeOwner.verifyBundledPackages();
    const track = contentPackageRuntimeOwner.getPreparedDiscovery(CODING_INTERVIEW_TRACK_ID).track;
    const item = { trackId: CODING_INTERVIEW_TRACK_ID, questionId: track.questions[0]!.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
    await addTrainingAttempt(createTrainingAttempt({ id: "a-answer", sessionId: "a-answer", trackId: CODING_INTERVIEW_TRACK_ID, modeId: track.modes[0]!.modeId, occurrenceId: "a-answer", item,
      response: { answer: "fixture" }, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-10-01T10:00:00.000Z", committedAt: "2026-10-01T10:00:00.000Z" }));
    await t.test("same profile publishes actual persisted answers", async () => {
      const unchanged = await runHome(async () => {});
      assert.equal(unchanged.readError, null);
      assert.equal(unchanged.published?.trainingAttempts[0]?.id, "a-answer");
    });
    await t.test("A→B after Activity read rejects publication", async () => {
      const switched = await runHome(() => select("home-read-fixture-b"));
      assert.equal(switched.published, null, "Home must not publish account A answers after switching to B");
      assert.ok(switched.readError);
    });
    await t.test("A→B→A after Activity read rejects publication", async () => {
      await select("home-read-fixture-a");
      const roundTrip = await runHome(async () => { await select("home-read-fixture-b"); await select("home-read-fixture-a"); });
      assert.equal(roundTrip.published, null, "the returned account A still has a different published storage lease");
      assert.ok(roundTrip.readError);
    });
    await t.test("active transition at entry prevents reads and publication", async () => {
      await select("home-read-fixture-a");
      storageApi.beginProfileTransition();
      let reachedGoal = false;
      const pending = await runHome(async () => { reachedGoal = true; });
      assert.equal(reachedGoal, false);
      assert.equal(pending.published, null);
      assert.ok(pending.readError);
      // Isolate the next probe; only app reload normally ends this transition.
      storageApi.installKeyValueStorageForTests(new storageApi.MemoryKeyValueStorage());
    });
    await t.test("transition starts during the last read and prevents publication", async () => {
      await select("home-read-fixture-a");
      const pending = await runHome(async () => { storageApi.beginProfileTransition(); });
      assert.equal(pending.published, null);
      assert.ok(pending.readError);
    });
  } finally {
    storageApi.closeActiveProfileStorage();
    storageApi.setProfileStoragePreparationFactoryForTests(null);
    storageApi.installKeyValueStorageForTests(new storageApi.MemoryKeyValueStorage());
  }
});
