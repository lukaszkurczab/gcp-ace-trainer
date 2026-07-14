import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

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

if (failures.length) {
  console.error("RECOVERY_INVENTORY_CHECK=failed");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exitCode = 1;
} else {
  console.log("RECOVERY_INVENTORY_CHECK=passed");
  console.log(`RECOVERY_ACTIVE_SOURCE_FILES=${sourcePaths.length}`);
  console.log(`RECOVERY_ACTIVE_TESTS=${observedTests.length}`);
  console.log("RECOVERY_STAGE_1_BOUNDARIES=passed");
}
