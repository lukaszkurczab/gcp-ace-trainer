import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => (
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]
  ));
}

const sourcePaths = walk(join(root, "src")).filter((path) => /\.(?:ts|tsx)$/.test(path));
const testPaths = walk(join(root, "tests")).filter((path) => path.endsWith(".test.ts"));
const testCaseCount = testPaths.reduce(
  (count, path) => count + (readFileSync(path, "utf8").match(/\btest\s*\(\s*["']/g)?.length ?? 0),
  0,
);
const packageScripts = Object.keys(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts ?? {}).sort();
const activeContent = {
  contentBoundary: relative(root, join(root, "src/content")),
  productionContentPresent: existsSync(join(root, "src/tracks/coding-interview/content")) || existsSync(join(root, "data/question-bank")),
  certificationCatalog: relative(root, join(root, "src/tracks/certification/certificationContentCatalog.ts")),
};

const commands = [
  ["npm", ["run", "qa:static"]],
];

const results = commands.map(([command, args]) => {
  const result = spawnSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
  return {
    command: [command, ...args].join(" "),
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
  };
});

console.log("RECOVERY_BASELINE_REPORT=" + JSON.stringify({
  activeContent,
  activeTests: { files: testPaths.length, cases: testCaseCount },
  commands: results,
  packageScripts,
  sourceFiles: sourcePaths.length,
}));
process.exitCode = results.some((result) => result.exitCode !== 0) ? 1 : 0;
