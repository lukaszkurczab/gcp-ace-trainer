import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
function files(path: string): string[] {
  return readdirSync(join(root, path), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(path, entry.name)) : [join(path, entry.name)],
  );
}

test("one journal contract, materializer, verifier, and coordinator remain", () => {
  assert.match(read("src/storage/repositories/mutationJournalRepository.ts"), /export type MutationJournalRecord/);
  assert.match(read("src/application/learningMutations/mutationMaterializer.ts"), /export async function materializeMutation/);
  assert.match(read("src/application/learningMutations/mutationVerifier.ts"), /export async function verifyMutation/);
  assert.match(read("src/application/learningMutations/commitMutation.ts"), /export async function commitMutation/);
  assert.match(read("src/application/learningMutations/recoverPendingMutation.ts"), /export async function recoverPendingMutation/);
});

test("mutation failure has one boundary owner and presentation cannot recreate durable state", () => {
  const source = files("src").map(read).join("\n");
  assert.equal((source.match(/class MutationCommitFailure/g) ?? []).length, 1);
  assert.doesNotMatch(read("src/application/trainingLifecycle/contracts.ts"), /MutationCommitFailure|MutationCommitPhase|journalDurable/);
  assert.doesNotMatch(read("src/application/learningMutations/commitMutation.ts"), /trainingLifecycle\/contracts/);
  const screen = read("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  assert.doesNotMatch(screen, /type Operation|setOperation|finalizationFailure|abandonmentFailure|unavailableState|message\.toLowerCase|message\.includes|error\.message ===/);
  assert.doesNotMatch(screen, /OperationProjectionStore/);
  for (const path of files("src/features")) assert.doesNotMatch(read(path), /from\s+["'][^"']*(?:storage\/repositories|infrastructure\/storage)[^"']*["']/);
});

test("features and track semantics cannot import storage or repository implementations", () => {
  for (const path of [...files("src/features"), ...files("src/tracks")]) {
    const source = read(path);
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:\/storage(?:\/|["'])|storage\/repositories)[^"']*["']/, `direct persistence import in ${path}`);
  }
});

test("Algorithms runtime composition has no persistence binding", () => {
  const runtime = read("src/application/algorithms/AlgorithmsFamilyRuntime.ts");
  const composition = read("src/application/algorithms/createAlgorithmsRuntime.ts");
  assert.doesNotMatch(runtime, /storage\/repositories|react-native-mmkv|from\s+["']react/);
  assert.doesNotMatch(runtime, /\b(commit|save|getActive|recover|materialize|verify)[A-Z]/);
  assert.doesNotMatch(composition, /storage|repositories|saveTrainingSession|saveTrainingSessionDraft|getActiveTrainingSession|commitMutation/);
});

test("Algorithms timer persistence is bound only in application composition, never in presentation", () => {
  const timer = read("src/application/algorithms/AlgorithmsSimulationTimerFacade.ts");
  const composition = read("src/application/bootstrap/trainingLifecycleComposition.ts");
  assert.doesNotMatch(timer, /storage\/repositories|getActiveForegroundTimer|saveActiveForegroundTimer/);
  assert.match(composition, /getActiveForegroundTimer/);
  assert.match(composition, /saveActiveForegroundTimer/);
  for (const path of files("src/features")) {
    const source = read(path);
    assert.doesNotMatch(source, /getActiveForegroundTimer|saveActiveForegroundTimer|checkpointForExpiry|checkpointSimulationForegroundTime/,
      `presentation owns timer persistence or expiry in ${path}`);
  }
  const screen = read("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  assert.doesNotMatch(screen, /setInterval|setTimeout|Date\.now|remainingForegroundMs\s*[-+]/,
    "simulation screen must not own a countdown source");
});

test("old active exam persistence owner and feature services are deleted", () => {
  assert.equal(existsSync(join(root, "src/storage/repositories/activeSessionRuntimeRepository.ts")), false);
  assert.equal(existsSync(join(root, "src/features/exam/examService.ts")), false);
  assert.equal(existsSync(join(root, "src/features/practice/practiceService.ts")), false);
  const source = files("src").map(read).join("\n");
  assert.doesNotMatch(source, /ACTIVE_SESSION_RUNTIME|clear_active_exam|saveActiveSessionRuntime|getActiveSessionRuntime/);
});

test("presentation routes use application ports without persistence internals", () => {
  const features = files("src/features").map(read).join("\n");
  assert.doesNotMatch(features, /mutationJournalRepository|mutationMaterializer|mutationVerifier|persistMutationJournal|clearMutationJournal/);
  assert.match(read("src/features/practice/PracticeSessionScreen.tsx"), /application\/algorithms/);
  assert.match(read("src/features/simulation\/AlgorithmsInterviewSimulationScreen.tsx"), /application\/algorithms/);
});

test("startup recovery uses canonical bootstrap recovery", () => assert.match(read("src/content/application/ContentPreparationGate.tsx"), /bootstrapApplication/));
