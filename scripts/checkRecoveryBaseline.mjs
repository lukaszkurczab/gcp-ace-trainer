import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const inventoryPath = join(root, "recovery/removal-inventory.json");
const fixturePath = join(root, "recovery/target-contract-fixtures.json");
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function projectFiles() {
  return ["src", "tests", "scripts", "data"]
    .filter((directory) => existsSync(join(root, directory)))
    .flatMap((directory) => walk(join(root, directory)))
    .filter((path) => /\.(?:ts|tsx|mjs|json|md)$/.test(path))
    .map((path) => relative(root, path));
}

const files = projectFiles();

for (const entry of inventory.searchTargets) {
  const matcher = new RegExp(entry.pattern, "m");
  const observed = files.filter((file) => matcher.test(readFileSync(join(root, file), "utf8"))).sort();
  const expected = [...entry.files].sort();
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    fail(`${entry.id}: inventory is stale. Expected ${JSON.stringify(expected)}; observed ${JSON.stringify(observed)}.`);
  }
}

const expectedTests = inventory.pathInventory.tests.files.slice().sort();
const observedTests = walk(join(root, "tests"))
  .map((path) => relative(root, path))
  .filter((path) => path.endsWith(".test.ts"))
  .sort();
if (JSON.stringify(observedTests) !== JSON.stringify(expectedTests)) {
  fail(`test inventory is stale. Expected ${JSON.stringify(expectedTests)}; observed ${JSON.stringify(observedTests)}.`);
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (packageJson.scripts.test !== inventory.pathInventory.tests.executedBy) {
  fail("npm test no longer matches the recorded active test command.");
}
for (const script of ["typecheck", "test", "validate:questions", "qa:static", "recovery:check", "baseline:report"]) {
  if (!packageJson.scripts[script]) fail(`package.json is missing the ${script} script.`);
}
if (!packageJson.scripts["qa:static"].includes("recovery:check")) {
  fail("qa:static must run the recovery inventory/documentation check before the existing quality commands.");
}

for (let index = 0; index <= 17; index += 1) {
  const document = `docs/${String(index).padStart(2, "0")}-${[
    "overview",
    "product-definition",
    "architecture",
    "navigation-and-flows",
    "data-model",
    "design-system",
    "branding-and-style-direction",
    "content-guidelines",
    "storage-and-offline",
    "security-and-privacy",
    "roadmap",
    "implementation-guidelines",
    "testing-strategy",
    "risk-register",
    "learning-effectiveness-model",
    "certification-track-learning-system",
    "leetcode-like-learning-system",
    "training-runtime-and-interaction-spec",
  ][index]}.md`;
  if (!existsSync(join(root, document))) fail(`required canonical document is missing: ${document}.`);
}
for (const source of fixture.sources) {
  if (!existsSync(join(root, source))) fail(`target contract fixture source is missing: ${source}.`);
}
for (const key of ["canonicalResultClassification", "adjacentOrdering", "complexityDimensions", "reviewSuccessRules", "journalIdempotency"]) {
  if (!Array.isArray(fixture[key]) || fixture[key].length === 0) fail(`target contract fixture ${key} is missing or empty.`);
}

const workflowDirectory = join(root, ".github/workflows");
const workflows = existsSync(workflowDirectory)
  ? readdirSync(workflowDirectory).filter((file) => /\.ya?ml$/.test(file)).sort()
  : [];
if (workflows.length !== 1) fail(`exactly one GitHub Actions workflow is required; found ${workflows.length}.`);
if (workflows.length === 1) {
  const workflow = readFileSync(join(workflowDirectory, workflows[0]), "utf8");
  for (const required of ["pull_request:", "push:", "- main", "npm ci", "npm run baseline:report"]) {
    if (!workflow.includes(required)) fail(`workflow ${workflows[0]} is missing ${required}.`);
  }
  const baselineReportPath = join(root, "scripts/recoveryBaselineReport.mjs");
  if (!packageJson.scripts["baseline:report"].includes("recoveryBaselineReport") || !existsSync(baselineReportPath)) {
    fail("CI workflow does not have the required baseline report command.");
  } else if (!readFileSync(baselineReportPath, "utf8").includes('"qa:static"')) {
    fail("CI baseline report must invoke qa:static.");
  }
}

for (const reference of inventory.designReferences.available) {
  if (!existsSync(join(root, reference))) fail(`design reference is missing: ${reference}.`);
}
if (!inventory.designReferences.requiredButMissing.length || !inventory.designReferences.rule.includes("blocker")) {
  fail("missing design references must be recorded as blockers.");
}
const expectedGates = ["G-01", "G-02", "G-03", "G-04", "G-05"];
if (JSON.stringify(inventory.gates.map((gate) => gate.id)) !== JSON.stringify(expectedGates)) {
  fail("gate inventory must contain G-01 through G-05 in order.");
}
for (const gate of inventory.gates) {
  if (gate.state !== "blocked" || !gate.owner || !gate.blocker) fail(`${gate.id} must have a blocker and owner.`);
}

for (const entry of inventory.baseline.commands) {
  if (typeof entry.exitCode !== "number" || !entry.owner || !entry.cause) {
    fail(`baseline command ${entry.command} must include exit code, owner, and cause.`);
  }
}

if (failures.length > 0) {
  console.error("RECOVERY_INVENTORY_CHECK=failed");
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log("RECOVERY_INVENTORY_CHECK=passed");
  console.log(`RECOVERY_INVENTORY_TARGETS=${inventory.searchTargets.length}`);
  console.log(`RECOVERY_GATES_BLOCKED=${inventory.gates.length}`);
  console.log(`RECOVERY_DESIGN_BLOCKERS=${inventory.designReferences.requiredButMissing.length}`);
}
