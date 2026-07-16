import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
test("one journal contract", () => assert.match(read("src/storage/repositories/mutationJournalRepository.ts"), /export type MutationJournalRecord/));
test("one materializer", () => assert.match(read("src/application/learningMutations/mutationMaterializer.ts"), /export async function materializeMutation/));
test("one verifier", () => assert.match(read("src/application/learningMutations/mutationVerifier.ts"), /export async function verifyMutation/));
test("one commit coordinator", () => assert.match(read("src/application/learningMutations/commitMutation.ts"), /export async function commitMutation/));
test("one recovery coordinator", () => assert.match(read("src/application/learningMutations/recoverPendingMutation.ts"), /export async function recoverPendingMutation/));
test("Algorithms presentation calls only its application controller", () => {
  const screen = read("src/features/algorithms/AlgorithmsPracticeSessionScreen.tsx");
  assert.match(screen, /createAlgorithmsImmediatePracticeController/);
  assert.doesNotMatch(screen, /from\s+["'][^"']*(?:storage|repositories|scoring|learningMutations|trainingSessions)[^"']*["']/);
  assert.doesNotMatch(screen, /scoreAlgorithmQuestion|createTrainingAttempt|commitTrainingOutcome|commitMutation/);
});
test("feature modules do not import journal internals", () => { for (const path of ["src/features/algorithms/AlgorithmsPracticeSessionScreen.tsx", "src/features/practice/practiceService.ts", "src/features/exam/examService.ts"]) assert.doesNotMatch(read(path), /mutationJournalRepository|mutationMaterializer|mutationVerifier|persistMutationJournal|clearMutationJournal/); });
test("obsolete Algorithms runner and feature scoring model are deleted", () => {
  assert.equal(existsSync(join(root, "src/features/algorithms/AlgorithmsSessionScreen.tsx")), false);
  assert.equal(existsSync(join(root, "src/features/algorithms/algorithmsSessionModel.ts")), false);
});
test("startup recovery uses canonical bootstrap recovery", () => assert.match(read("src/content/application/ContentPreparationGate.tsx"), /bootstrapApplication/));
test("no fallback direct-write orchestration remains", () => assert.doesNotMatch(read("src/application/learningMutations/commitMutation.ts"), /catch\s*\(/));
