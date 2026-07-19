import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, ".audit/ux-ui/audit.config.json");
const config = readJson(configPath);
const errors = [];

requireString("auditId", config.auditId);
requireString("projectName", config.projectName);
requireEqual("executor", config.executor, "maestro");
requireEqual("app.type", config.app?.type, "mobile");
requireString("app.appId", config.app?.appId);
requireNonEmptyArray("platforms", config.platforms);
requireNonEmptyArray("themes", config.themes);
requireNonEmptyArray("devices", config.devices);
requireString("outputDir", config.outputDir);
requireString("flowsDir", config.flowsDir);
requireNonEmptyArray("checklists", config.checklists);
requireNonEmptyArray("forbiddenTerms.terms", config.forbiddenTerms?.terms);
requireNonEmptyArray("flows", config.flows);
requireNonEmptyArray("screens", config.screens);
requireString("coveragePacket", config.coveragePacket);

if (config.outputDir !== `docs/audits/ux-ui/${config.auditId}`) {
  errors.push(
    `outputDir must resolve to docs/audits/ux-ui/<auditId>; got ${config.outputDir}`,
  );
}

assertDirectory(config.flowsDir, "flowsDir");

if (config.helpersDir) {
  assertDirectory(config.helpersDir, "helpersDir");
}

for (const checklistPath of config.checklists ?? []) {
  assertFile(checklistPath, "checklist");
}
assertFile(config.coveragePacket, "coveragePacket");

const flowIds = new Set();
for (const flow of config.flows ?? []) {
  requireString("flows[].id", flow.id);
  requireString(`flows[${flow.id}].path`, flow.path);
  flowIds.add(flow.id);
  assertFile(flow.path, `flow ${flow.id}`);
}

for (const screen of config.screens ?? []) {
  requireString("screens[].id", screen.id);
  requireNonEmptyArray(`screens[${screen.id}].states`, screen.states);

  for (const state of screen.states ?? []) {
    requireString(`screens[${screen.id}].states[].id`, state.id);
    if (state.capturedBy && !flowIds.has(state.capturedBy)) {
      errors.push(
        `screens[${screen.id}].states[${state.id}] references unknown flow ${state.capturedBy}`,
      );
    }
    if (!state.capturedBy && !state.manualCapture) errors.push(`screens[${screen.id}].states[${state.id}] needs capturedBy or manualCapture`);
    if (state.manualCapture) assertFile(state.manualCapture, `screens[${screen.id}].states[${state.id}].manualCapture`);
  }

  const stateIds = new Set((screen.states ?? []).map((state) => state.id));
  if (screen.scrollCapture?.enabled) {
    for (const stateId of screen.scrollCapture.states ?? []) {
      if (!stateIds.has(stateId)) {
        errors.push(
          `screens[${screen.id}].scrollCapture references missing state ${stateId}`,
        );
      }
    }
  }
}

const expectedStateIds = [...Array.from({ length: 15 }, (_, index) => `P-${String(index + 1).padStart(2, "0")}`), ...Array.from({ length: 29 }, (_, index) => `S-${String(index + 1).padStart(2, "0")}`)];
const configuredStateIds = config.screens.flatMap((screen) => screen.states.map((state) => state.id));
if (configuredStateIds.length !== expectedStateIds.length || new Set(configuredStateIds).size !== expectedStateIds.length || expectedStateIds.some((id) => !configuredStateIds.includes(id))) errors.push("coverage packet must enumerate exactly P-01…P-15 and S-01…S-29");
for (const flow of config.flows ?? []) {
  const source = readFileSync(path.join(root, flow.path), "utf8");
  for (const term of config.forbiddenTerms?.terms ?? []) if (source.includes(term)) errors.push(`active flow ${flow.id} contains retired selector ${term}`);
}

mkdirSync(path.join(root, config.outputDir), { recursive: true });

if (errors.length > 0) {
  console.error("UX/UI audit config validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`UX/UI audit config OK: ${config.auditId}`);
console.log(`Output directory: ${path.join(root, config.outputDir)}`);

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Could not read JSON ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${name} must be a non-empty string`);
  }
}

function requireEqual(name, value, expected) {
  if (value !== expected) {
    errors.push(`${name} must be ${expected}`);
  }
}

function requireNonEmptyArray(name, value) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${name} must be a non-empty array`);
  }
}

function assertFile(relativePath, label) {
  const absolutePath = path.join(root, relativePath);
  try {
    if (!statSync(absolutePath).isFile()) {
      errors.push(`${label} is not a file: ${relativePath}`);
    }
  } catch {
    errors.push(`${label} does not exist: ${relativePath}`);
  }
}

function assertDirectory(relativePath, label) {
  const absolutePath = path.join(root, relativePath);
  try {
    if (!statSync(absolutePath).isDirectory()) {
      errors.push(`${label} is not a directory: ${relativePath}`);
    }
  } catch {
    errors.push(`${label} does not exist: ${relativePath}`);
  }
}
