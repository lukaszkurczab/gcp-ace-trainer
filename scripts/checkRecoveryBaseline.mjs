import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
function fail(message) { failures.push(message); }
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
function text(paths) { return paths.map((path) => readFileSync(path, "utf8")).join("\n"); }

const sourcePaths = walk(join(root, "src")).filter((path) => /\.(?:ts|tsx)$/.test(path));
const generatedArtifactPath = join(root, "src/content/bundled/generatedArtifacts.ts");
const sourceCodePaths = sourcePaths.filter((path) => path !== generatedArtifactPath);
const activeSource = text(sourceCodePaths);
const guardPath = join(root, "src/storage/repositories/trainingModelGuards.ts");
const activeSourceWithoutDenyList = text(sourceCodePaths.filter((path) => path !== guardPath));
const kernel = text(walk(join(root, "src/domain/learning")));
const registry = text(walk(join(root, "src/domain/tracks")));
const algorithms = text(walk(join(root, "src/tracks/coding-interview")));
const certification = text(walk(join(root, "src/tracks/certification")));

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
  ["replacement bridge", /\b(?:Legacy|Adapter|toCanonical|fromLegacy)\b/],
  ["validation suppression", /as unknown as|@ts-ignore|@ts-expect-error/],
  ["removed persistence engine", /AsyncStorage|localStorage|getStorageReadKeys|getStorageClearKeys|readLocalJson|writeLocalJson|AsyncStorageContentCache/],
];
for (const [label, pattern] of forbiddenSourcePatterns) if (pattern.test(activeSource)) fail(`${label} is present in active source.`);
if (/\bconfidence\b|\bretentionPassedAt\b/.test(activeSourceWithoutDenyList)) fail("removed attempt/review fields are present outside the repository deny-list.");
if (/type\s+TrackId\s*=\s*["']/.test(activeSource)) fail("TrackId is a closed concrete union.");
if (/type\s+TrackFamilyId\s*=\s*["']/.test(activeSource)) fail("TrackFamilyId is a closed concrete union.");
if (sourcePaths.some((path) => /Adapter|Compatibility/.test(path))) fail("an adapter or compatibility source path remains.");
const mmkvConsumers = sourcePaths.filter((path) => /react-native-mmkv/.test(readFileSync(path, "utf8")));
if (mmkvConsumers.length !== 1 || !mmkvConsumers[0].endsWith("src/infrastructure/storage/mmkvClient.ts")) fail("MMKV must have one infrastructure-only client.");
if ((activeSource.match(/createMMKV\s*\(/g) ?? []).length !== 1) fail("MMKV must have one production instance.");
for (const path of sourcePaths) {
  const source = readFileSync(path, "utf8");
  if (/infrastructure\/storage\/mmkvClient/.test(source) && !/src\/storage\/repositories\//.test(path)) {
    fail(`only repository implementations may import the MMKV client: ${path}`);
  }
}
for (const path of ["src/storage/storageCodec.ts", "src/storage/repositories/certificationExamRepository.ts", "src/content/cache", "src/content/source"]) {
  if (existsSync(join(root, path))) fail(`obsolete persistence or remote-content path remains: ${path}`);
}
if (/patternly:v1:|HttpContentSource|ContentCacheRepository|loadTrackContent/.test(activeSource)) fail("old namespace, remote-content cache, or compatibility content path remains in production source.");

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
for (const path of sourcePaths.filter((path) => /src\/features\/(?:coding-interview|practice|exam)\//.test(path))) {
  if (journalInternals.test(readFileSync(path, "utf8"))) fail(`feature imports journal internals: ${path}`);
}

// Canonical Algorithms routes render application projections only; feature code
// must not retain the historical runner or a blocking placeholder.
for (const path of [
  "src/features/coding-interview/AlgorithmsSessionScreen.tsx",
  "src/features/coding-interview/algorithmsSessionModel.ts",
]) {
  if (existsSync(join(root, path))) fail(`obsolete Algorithms runner remains: ${path}`);
}
const algorithmsPresentationPaths = sourcePaths.filter((path) => /src\/features\/coding-interview\/.+\.(?:ts|tsx)$/.test(path));
const prohibitedAlgorithmsPresentation = /from\s+["'][^"']*(?:storage|repositories|scoring|learningMutations|trainingSessions)[^"']*["']|\b(?:scoreAlgorithmQuestion|createTrainingAttempt|commitTrainingOutcome|commitMutation)\b/;
for (const path of algorithmsPresentationPaths) {
  if (prohibitedAlgorithmsPresentation.test(readFileSync(path, "utf8"))) fail(`Algorithms presentation bypasses its application controller: ${path}`);
}
const practiceSessionPath = join(root, "src/features/practice/PracticeSessionScreen.tsx");
const practiceSessionSource = readFileSync(practiceSessionPath, "utf8");
if (!/from\s+["'][^"']*application\/coding-interview["']/.test(practiceSessionSource)) fail("Practice route must use the canonical Coding Interview application facade.");
const rootNavigator = readFileSync(join(root, "src/navigation/RootNavigator.tsx"), "utf8");
if (/CanonicalRuntimeUnavailableScreen/.test(rootNavigator)) fail("Algorithms routes retain the obsolete canonical-runtime blocking screen.");
if (!/AlgorithmsInterviewSimulationScreen/.test(rootNavigator)) fail("Algorithms Simulation route must use its canonical runner.");
if (/createAlgorithms(?:ImmediatePractice|InterviewSimulation)Controller|createCodingInterviewFamilyRuntime/.test(rootNavigator)) fail("Algorithms route retains a persistence-owning runner.");

if (/tracks\/coding-interview|google-cloud-associate-cloud-engineer|AlgorithmQuestion|CertificationQuestion|ValidatedBank/.test(kernel)) fail("learning kernel imports family semantics.");
for (const path of walk(join(root, "src/domain/learning"))) {
  const source = readFileSync(path, "utf8");
  if (/from\s+["'][^"']*(?:tracks\/|react(?:-native)?|mmkv|storage\/repositories)[^"']*["']/.test(source)) {
    fail(`learning kernel imports a forbidden owner: ${path}`);
  }
}
if (/algorithmContent|questionBank|AlgorithmQuestion|CertificationQuestion/.test(registry)) fail("track registry imports content or concrete items.");
if (/certification/.test(algorithms)) fail("Algorithms imports Certification.");
if (/tracks\/coding-interview/.test(certification)) fail("Certification imports Algorithms.");

const testPaths = walk(join(root, "tests")).filter((path) => path.endsWith(".test.ts"));
const testSource = text(testPaths);
if (testPaths.length === 0) fail("no active tests are present.");
if (/\.(?:skip|only)\s*\(/.test(testSource)) fail("a skipped or exclusive test is present.");
const observedTestCount = (testSource.match(/\btest\s*\(\s*["']/g) ?? []).length;
if (observedTestCount === 0) fail("no active test cases are present.");

for (const path of ["src/tracks/coding-interview/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) fail(`production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /HttpContentSource/, /ContentCacheRepository/, /loadTrackContent/]) if (pattern.test(activeSource)) fail(`obsolete content storage path remains: ${pattern}`);

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
