import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const observed = new Set();
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  const resolved = Module._resolveFilename(request, parent, isMain);
  const result = originalLoad.apply(this, arguments);
  if (typeof resolved === "string" && resolved.startsWith(`${appRoot}${path.sep}`)) {
    observed.add(path.relative(appRoot, resolved).split(path.sep).join("/"));
  }
  return result;
};

try {
  const plan = require(path.join(appRoot, "src/domain/learning/learningPlan.ts"));
  const guards = require(path.join(appRoot, "src/storage/repositories/trainingModelGuards.ts"));
  assert.equal(typeof plan.isLearningPlanV1, "function");
  assert.equal(typeof guards.isTrainingSession, "function");
} finally {
  Module._load = originalLoad;
}

const modules = [...observed].sort();
const forbidden = modules.filter((modulePath) =>
  /^(?:src\/(?:content|infrastructure|features|tracks)\/|src\/domain\/tracks\/(?:trackRegistry|trackGoalPolicies)\.ts$)/u.test(modulePath),
);
assert.ok(modules.includes("src/domain/learning/learningPlan.ts"));
assert.ok(modules.includes("src/storage/repositories/trainingModelGuards.ts"));
assert.deepEqual(forbidden, [], "learning runtime guards must not load content, infrastructure, UI, track registries, or product policy");

process.stdout.write(`${JSON.stringify({ result: "passed", node: process.version, observedModuleCount: modules.length, forbiddenModuleCount: forbidden.length })}\n`);
