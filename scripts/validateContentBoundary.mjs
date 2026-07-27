import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const sourceRoot = join(root, "src");
const contentReleasesRoot = join(root, "..", "patternly-content", "artifacts", "releases");
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
const source = walk(sourceRoot).filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
for (const path of ["src/tracks/algorithms/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) failures.push(`Production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /HttpContentSource/, /ContentCacheRepository/, /loadTrackContent/, /RemoteQuestionAdapter/, /ContentCompatibilityLayer/, /\bfetch\s*\(/, /XMLHttpRequest/, /axios/, /as unknown as/, /@ts-ignore/, /@ts-expect-error/]) if (pattern.test(source)) failures.push(`Forbidden application content architecture remains: ${pattern}`);
if (!source.includes("validateBundledContent")) failures.push("The explicit bundled-content validation gate is missing.");
if (!source.includes("GENERATED_BUNDLED_CONTENT_RELEASE")) failures.push("The build-time generated artifact boundary is missing.");
const canonicalReleaseId = existsSync(contentReleasesRoot)
  ? readdirSync(contentReleasesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^patternly-core-\d{4}$/.test(entry.name)).map((entry) => entry.name).sort().at(-1)
  : undefined;
const generatedBundle = readFileSync(join(root, "src", "content", "bundled", "generatedArtifacts.ts"), "utf8");
if (!canonicalReleaseId) failures.push("The canonical multi-track release is unavailable beside the application repository.");
else if (!generatedBundle.includes(`BUNDLED_CONTENT_RELEASE_ID = ${JSON.stringify(canonicalReleaseId)}`)) failures.push("The generated bundle does not pin the canonical multi-track release.");
if (/approvalCoverage|approvalActivationIdentity/.test(generatedBundle)) failures.push("The generated bundle retains retired approval or activation fields.");
if (/from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/.test(source)) failures.push("Production bundle imports a test fixture.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("CONTENT_BOUNDARY_CHECK=passed");
