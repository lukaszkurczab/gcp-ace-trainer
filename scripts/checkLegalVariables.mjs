import "tsx/cjs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { legalVariablesLocalFixture } = require("../src/legal/legalVariablesLocalFixture.ts");
const { validateLegalVariables } = require("../src/legal/legalVariablesSchema.ts");
const releaseLegalVariablesPath = resolve(dirname(fileURLToPath(import.meta.url)), "../config/public-legal.release.json");

export function resolveLegalVariables(mode, releasePath = releaseLegalVariablesPath) {
  if (mode === "test") return legalVariablesLocalFixture;
  if (mode !== "release") throw new Error(`Unsupported legal variable mode: ${mode}`);

  let encoded;
  try {
    encoded = readFileSync(releasePath, "utf8");
  } catch (error) {
    throw new Error(`Release legal variables could not be read from ${releasePath}: ${error.message}`);
  }
  try {
    return JSON.parse(encoded);
  } catch (error) {
    throw new Error(`Release legal variables at ${releasePath} are not valid JSON: ${error.message}`);
  }
}

export function runCheck(args = process.argv.slice(2)) {
  const unknownArgs = args.filter((argument) => argument !== "--release");
  if (unknownArgs.length > 0) {
    console.error(`Unknown argument: ${unknownArgs[0]}`);
    return 2;
  }

  const mode = args.includes("--release") ? "release" : "test";
  let legalVariables;
  try {
    legalVariables = resolveLegalVariables(mode);
  } catch (error) {
    console.error(`LEGAL_VARIABLES_CHECK=failed mode=${mode}`);
    console.error(error.message);
    return 1;
  }

  const issues = validateLegalVariables(legalVariables, mode);
  if (issues.length > 0) {
    console.error(`LEGAL_VARIABLES_CHECK=failed mode=${mode}`);
    for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
    return 1;
  }

  console.log(`LEGAL_VARIABLES_CHECK=passed mode=${mode}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCheck();
}
