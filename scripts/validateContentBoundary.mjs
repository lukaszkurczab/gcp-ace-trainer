import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const sourceRoot = join(root, "src");
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
const source = walk(sourceRoot).filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
for (const path of ["src/tracks/algorithms/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) failures.push(`Production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /BundledContentSource/, /LocalContentSource/, /RemoteQuestionAdapter/, /ContentCompatibilityLayer/, /as unknown as/, /@ts-ignore/, /@ts-expect-error/]) if (pattern.test(source)) failures.push(`Forbidden application content architecture remains: ${pattern}`);
if (!source.includes("HttpContentSource")) failures.push("HttpContentSource is missing.");
if (!source.includes("EXPO_PUBLIC_PATTERNLY_CONTENT_BASE_URL")) failures.push("Explicit content base URL configuration is missing.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("CONTENT_BOUNDARY_CHECK=passed");
