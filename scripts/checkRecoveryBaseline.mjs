import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

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

for (const path of [
  "recovery/stage-1-kernel-inventory.json",
  "recovery/removal-inventory.json",
  "recovery/stage-1-kernel-cutover-report.json",
  "recovery/stage-1-test-coverage-map.json",
  "recovery/stage-1-contract-decisions.json",
  "recovery/stage-1-algorithms-content-diff.json",
  "recovery/stage-1-scope-audit.json",
  "recovery/required-behavior-coverage.json",
]) if (!existsSync(join(root, path))) fail(`required recovery artifact is missing: ${path}`);

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
];
for (const [label, pattern] of forbiddenSourcePatterns) if (pattern.test(activeSource)) fail(`${label} is present in active source.`);
if (/\bconfidence\b|\bretentionPassedAt\b/.test(activeSourceWithoutDenyList)) fail("removed attempt/review fields are present outside the repository deny-list.");
if (/type\s+TrackId\s*=\s*["']/.test(activeSource)) fail("TrackId is a closed concrete union.");
if (sourcePaths.some((path) => /Adapter|Compatibility/.test(path))) fail("an adapter or compatibility source path remains.");

if (/tracks\/algorithms|cloud-certification|AlgorithmQuestion|CertificationQuestion/.test(kernel)) fail("learning kernel imports family semantics.");
if (/algorithmContent|questionBank|AlgorithmQuestion|CertificationQuestion/.test(registry)) fail("track registry imports content or concrete items.");
if (/cloud-certification/.test(algorithms)) fail("Algorithms imports Certification.");
if (/tracks\/algorithms/.test(certification)) fail("Certification imports Algorithms.");

const removalInventory = JSON.parse(readFileSync(join(root, "recovery/removal-inventory.json"), "utf8"));
const observedTests = walk(join(root, "tests")).filter((path) => path.endsWith(".test.ts")).map((path) => relative(root, path)).sort();
const expectedTests = [...removalInventory.activeTests].sort();
if (JSON.stringify(observedTests) !== JSON.stringify(expectedTests)) fail("removal inventory activeTests is stale.");

const testSourceByPath = new Map(observedTests.map((path) => [path, readFileSync(join(root, path), "utf8")]));
const testSource = [...testSourceByPath.values()].join("\n");
if (/\.(?:skip|only)\s*\(/.test(testSource)) fail("a skipped or exclusive test is present.");

const behaviorCoverage = JSON.parse(readFileSync(join(root, "recovery/required-behavior-coverage.json"), "utf8"));
const behaviorIds = behaviorCoverage.behaviors.map((behavior) => behavior.id);
if (new Set(behaviorIds).size !== behaviorIds.length) fail("required behavior IDs are not unique.");
for (const behavior of behaviorCoverage.behaviors) {
  if (!behavior.required) fail(`required behavior inventory contains a non-required entry: ${behavior.id}`);
  if (!Array.isArray(behavior.testFiles) || behavior.testFiles.length === 0) fail(`required behavior has no test file: ${behavior.id}`);
  for (const testFile of behavior.testFiles ?? []) {
    const source = testSourceByPath.get(testFile);
    if (!source) fail(`required behavior points to a missing test file: ${behavior.id} -> ${testFile}`);
    for (const testName of behavior.testNames ?? []) if (source && !source.includes(testName)) fail(`required behavior test name is missing: ${behavior.id} -> ${testName}`);
  }
}
const observedTestCount = [...testSourceByPath.values()].reduce((count, source) => count + (source.match(/\btest\s*\(\s*["']/g)?.length ?? 0), 0);
if (observedTestCount < behaviorCoverage.approvedMinimumTestCount) fail(`test count ${observedTestCount} is below the approved Stage 1F floor ${behaviorCoverage.approvedMinimumTestCount}.`);

const coverageMap = JSON.parse(readFileSync(join(root, "recovery/stage-1-test-coverage-map.json"), "utf8"));
const requiredDeletedTestPaths = [
  "tests/sessionEngine.test.ts", "tests/storageRepositories.test.ts", "tests/cloudCertificationSelectors.test.ts",
  "tests/cloudCertificationWriteThrough.test.ts", "tests/cloudCertificationBridge.test.ts", "tests/progressTabModel.test.ts",
  "tests/algorithmsSessionModel.test.ts", "tests/reviewQueueModel.test.ts", "tests/algorithmProgress.test.ts",
  "tests/algorithmsScoring.test.ts", "tests/trainingContracts.test.ts", "tests/trackRegistry.test.ts",
  "tests/trackAdapters.test.ts", "tests/homeTabModel.test.ts", "tests/practiceFlowModel.test.ts", "tests/analytics.test.ts",
  "tests/algorithmSelectionArchitecture.test.ts", "tests/algorithmContentModel.test.ts",
].sort();
const mappedDeletedTestPaths = coverageMap.deletedTestFiles.map((entry) => entry.oldPath).sort();
if (JSON.stringify(requiredDeletedTestPaths) !== JSON.stringify(mappedDeletedTestPaths)) fail("deleted test coverage map is incomplete.");
if (coverageMap.deletedTestFiles.reduce((sum, entry) => sum + entry.oldTestCount, 0) !== 144) fail("deleted test coverage map no longer accounts for all 144 removed tests.");
for (const entry of coverageMap.deletedTestFiles) for (const behavior of entry.oldBehaviors) {
  if (behavior.coverageStatus === "missing") fail(`deleted behavior remains missing: ${behavior.id}`);
  if (behavior.coverageStatus === "obsolete" && (!behavior.reasonIfObsolete || !/(?:docs\/|Architecture Recovery Plan)/.test(behavior.reasonIfObsolete))) fail(`obsolete behavior lacks an approved source citation: ${behavior.id}`);
  if (behavior.stillRequired && behavior.coverageStatus !== "covered") fail(`still-required behavior is not covered: ${behavior.id}`);
  for (const testFile of behavior.replacementTestPaths ?? []) {
    const source = testSourceByPath.get(testFile);
    if (!source) fail(`coverage map points to a missing replacement test: ${behavior.id} -> ${testFile}`);
    for (const testName of behavior.replacementTestNames ?? []) if (![...(behavior.replacementTestPaths ?? [])].some((path) => testSourceByPath.get(path)?.includes(testName))) fail(`coverage map replacement test name is missing: ${behavior.id} -> ${testName}`);
  }
}

const contentDiff = JSON.parse(readFileSync(join(root, "recovery/stage-1-algorithms-content-diff.json"), "utf8"));
if (contentDiff.afterCount !== behaviorCoverage.expectedAlgorithmsItemCount) fail("Algorithms content diff and required behavior inventory disagree on expected count.");
if (contentDiff.removedItemIds.some((item) => item.disposition !== "restored" && item.disposition !== "approved_removal")) fail("Algorithms content diff contains an unresolved removal.");
try {
  const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", "import { algorithmContentGroups, algorithmContentItems, algorithmContentManifest } from './src/tracks/algorithms/content/index.ts'; console.log(JSON.stringify({ count: algorithmContentItems.length, groups: algorithmContentGroups.length, manifest: algorithmContentManifest.itemCount }));"], { cwd: root, encoding: "utf8" }).trim();
  const observedContent = JSON.parse(output);
  if (observedContent.count !== behaviorCoverage.expectedAlgorithmsItemCount || observedContent.manifest !== observedContent.count) fail("Algorithms active content or manifest count changed silently.");
  if (observedContent.groups !== behaviorCoverage.expectedAlgorithmsGroupCount) fail("Algorithms content group count changed silently.");
} catch (error) {
  fail(`Algorithms content enforcement could not run: ${error instanceof Error ? error.message : String(error)}`);
}

if (failures.length) {
  console.error("RECOVERY_INVENTORY_CHECK=failed");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log("RECOVERY_INVENTORY_CHECK=passed");
  console.log(`RECOVERY_ACTIVE_SOURCE_FILES=${sourcePaths.length}`);
  console.log(`RECOVERY_ACTIVE_TESTS=${observedTests.length}`);
  console.log(`RECOVERY_TEST_CASES=${observedTestCount}`);
  console.log(`RECOVERY_REQUIRED_BEHAVIORS=${behaviorCoverage.behaviors.length}`);
  console.log(`RECOVERY_ALGORITHMS_ITEMS=${behaviorCoverage.expectedAlgorithmsItemCount}`);
  console.log("RECOVERY_STAGE_1_BOUNDARIES=passed");
}
