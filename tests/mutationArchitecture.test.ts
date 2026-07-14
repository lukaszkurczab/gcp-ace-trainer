import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
test("one journal contract", () => assert.match(read("src/storage/repositories/mutationJournalRepository.ts"), /export type MutationJournalRecord/));
test("one materializer", () => assert.match(read("src/application/learningMutations/mutationMaterializer.ts"), /export async function materializeMutation/));
test("one verifier", () => assert.match(read("src/application/learningMutations/mutationVerifier.ts"), /export async function verifyMutation/));
test("one commit coordinator", () => assert.match(read("src/application/learningMutations/commitMutation.ts"), /export async function commitMutation/));
test("one recovery coordinator", () => assert.match(read("src/application/learningMutations/recoverPendingMutation.ts"), /export async function recoverPendingMutation/));
test("feature modules call application commands", () => { assert.match(read("src/features/algorithms/AlgorithmsSessionScreen.tsx"), /commitTrainingOutcome/); assert.match(read("src/features/practice/practiceService.ts"), /commitTrainingOutcome/); assert.match(read("src/features/exam/examService.ts"), /commitCertificationExamFinalization/); });
test("feature modules do not import journal internals", () => { for (const path of ["src/features/algorithms/AlgorithmsSessionScreen.tsx", "src/features/practice/practiceService.ts", "src/features/exam/examService.ts"]) assert.doesNotMatch(read(path), /mutationJournalRepository|mutationMaterializer|mutationVerifier|persistMutationJournal|clearMutationJournal/); });
test("startup recovery uses canonical recovery", () => assert.match(read("src/content/application/ContentPreparationGate.tsx"), /recoverPendingMutation/));
test("no fallback direct-write orchestration remains", () => assert.doesNotMatch(read("src/application/learningMutations/commitMutation.ts"), /catch\s*\(/));
