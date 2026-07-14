import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
function fail(message) { failures.push(message); }
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
function text(paths) { return paths.map((path) => readFileSync(path, "utf8")).join("\n"); }

const sourcePaths = walk(join(root, "src")).filter((path) => /\.(?:ts|tsx)$/.test(path));
const activeSource = text(sourcePaths);
const guardPath = join(root, "src/storage/repositories/trainingModelGuards.ts");
const activeSourceWithoutDenyList = text(sourcePaths.filter((path) => path !== guardPath));
const kernel = text(walk(join(root, "src/domain/learning")));
const registry = text(walk(join(root, "src/domain/tracks")));
const algorithms = text(walk(join(root, "src/tracks/algorithms")));
const certification = text(walk(join(root, "src/tracks/cloud-certification")));

for (const path of ["src/types/question.ts", "src/types/attempt.ts", "src/tracks/trackAdapters.ts", "src/tracks/types.ts"]) {
  if (existsSync(join(root, path))) fail(`replaced owner still exists: ${path}`);
}
for (const path of ["src/domain/training", "src/domain/sessions"]) {
  if (existsSync(join(root, path)) && walk(join(root, path)).length > 0) fail(`replaced owner still contains files: ${path}`);
}

const forbiddenSourcePatterns = [
  ["global item contract", /\bTraining(?:Content)?Item(?:Type)?\b/],
  ["global response/result contract", /\bTrainingAttempt(?:Response|Result|Confidence)\b/],
  ["old review contract", /\bReviewQueueItemKind\b|\bgetReviewQueueItemKind\b|\blow_confidence\b/],
  ["old result variants", /kind:\s*["'](?:correctness|partial_credit|mixed)["']/],
  ["shared mode taxonomy", /\b(?:SessionModeType|FeedbackTiming|ScoringType|supportedItemTypes)\b/],
  ["old feature records", /\b(?:ActiveExamSession|PracticeAnswerRecord|QuestionReviewState)\b/],
  ["replacement bridge", /\b(?:Legacy|Adapter|Compatibility|toCanonical|fromLegacy)\b/],
  ["validation suppression", /as unknown as|@ts-ignore|@ts-expect-error/],
  ["removed persistence engine", /AsyncStorage|localStorage|getStorageReadKeys|getStorageClearKeys|readLocalJson|writeLocalJson|AsyncStorageContentCache/],
];
for (const [label, pattern] of forbiddenSourcePatterns) if (pattern.test(activeSource)) fail(`${label} is present in active source.`);
if (/\bconfidence\b|\bretentionPassedAt\b/.test(activeSourceWithoutDenyList)) fail("removed attempt/review fields are present outside the repository deny-list.");
if (/type\s+TrackId\s*=\s*["']/.test(activeSource)) fail("TrackId is a closed concrete union.");
if (sourcePaths.some((path) => /Adapter|Compatibility/.test(path))) fail("an adapter or compatibility source path remains.");
const mmkvConsumers = sourcePaths.filter((path) => /react-native-mmkv/.test(readFileSync(path, "utf8")));
if (mmkvConsumers.length !== 1 || !mmkvConsumers[0].endsWith("src/infrastructure/storage/mmkvClient.ts")) fail("MMKV must have one infrastructure-only client.");
if ((activeSource.match(/createMMKV\s*\(/g) ?? []).length !== 1) fail("MMKV must have one production instance.");

const implementationChecks = [
  ["MutationJournalRecord", /export\s+type\s+MutationJournalRecord\b/g],
  ["materializeMutation", /export\s+async\s+function\s+materializeMutation\b/g],
  ["verifyMutation", /export\s+async\s+function\s+verifyMutation\b/g],
  ["commitMutation", /export\s+async\s+function\s+commitMutation\b/g],
  ["recoverPendingMutation", /export\s+async\s+function\s+recoverPendingMutation\b/g],
];
for (const [name, pattern] of implementationChecks) {
  const count = (activeSource.match(pattern) ?? []).length;
  if (count !== 1) fail(`${name} must have exactly one implementation; found ${count}.`);
}

const journalInternals = /(?:mutationJournalRepository|mutationMaterializer|mutationVerifier|persistMutationJournal|clearMutationJournal)/;
for (const path of sourcePaths.filter((path) => /src\/features\/(?:algorithms|practice|exam)\//.test(path))) {
  if (journalInternals.test(readFileSync(path, "utf8"))) fail(`feature imports journal internals: ${path}`);
}

if (/tracks\/algorithms|cloud-certification|AlgorithmQuestion|CertificationQuestion/.test(kernel)) fail("learning kernel imports family semantics.");
if (/algorithmContent|questionBank|AlgorithmQuestion|CertificationQuestion/.test(registry)) fail("track registry imports content or concrete items.");
if (/cloud-certification/.test(algorithms)) fail("Algorithms imports Certification.");
if (/tracks\/algorithms/.test(certification)) fail("Certification imports Algorithms.");

const testPaths = walk(join(root, "tests")).filter((path) => path.endsWith(".test.ts"));
const testSource = text(testPaths);
if (testPaths.length === 0) fail("no active tests are present.");
if (/\.(?:skip|only)\s*\(/.test(testSource)) fail("a skipped or exclusive test is present.");
const observedTestCount = (testSource.match(/\btest\s*\(\s*["']/g) ?? []).length;
if (observedTestCount === 0) fail("no active test cases are present.");

for (const path of ["src/tracks/algorithms/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) fail(`production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /BundledContentSource/, /LocalContentSource/]) if (pattern.test(activeSource)) fail(`forbidden content source remains: ${pattern}`);
if (!activeSource.includes("HttpContentSource")) fail("HTTP content source is missing.");

if (failures.length) {
  console.error("RECOVERY_INVENTORY_CHECK=failed");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log("RECOVERY_INVENTORY_CHECK=passed");
  console.log(`RECOVERY_ACTIVE_SOURCE_FILES=${sourcePaths.length}`);
  console.log(`RECOVERY_ACTIVE_TESTS=${testPaths.length}`);
  console.log(`RECOVERY_TEST_CASES=${observedTestCount}`);
  console.log("RECOVERY_STAGE_1_BOUNDARIES=passed");
}
