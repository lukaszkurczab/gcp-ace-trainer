import "tsx/cjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { legalVariables } = require("../src/legal/legalVariables.ts");
const { validateLegalVariables } = require("../src/legal/legalVariablesSchema.ts");

const args = process.argv.slice(2);
const unknownArgs = args.filter((argument) => argument !== "--release");
if (unknownArgs.length > 0) {
  console.error(`Unknown argument: ${unknownArgs[0]}`);
  process.exit(2);
}

const mode = args.includes("--release") ? "release" : "test";
const issues = validateLegalVariables(legalVariables, mode);
if (issues.length > 0) {
  console.error(`LEGAL_VARIABLES_CHECK=failed mode=${mode}`);
  for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
  process.exit(1);
}

console.log(`LEGAL_VARIABLES_CHECK=passed mode=${mode}`);
