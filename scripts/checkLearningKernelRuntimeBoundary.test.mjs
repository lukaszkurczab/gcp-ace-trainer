import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("learning plan and runtime guards load without content, infrastructure, UI, registry, or product policy", () => {
  const probe = spawnSync(process.execPath, ["--import", "tsx", "scripts/checkLearningKernelRuntimeBoundary.mjs"], {
    cwd: appRoot,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
    timeout: 15_000,
  });
  assert.equal(probe.error, undefined, probe.error?.message);
  assert.equal(probe.status, 0, probe.stderr.trim());
  const result = JSON.parse(probe.stdout);
  assert.equal(result.result, "passed");
  assert.equal(result.node, process.version);
  assert.ok(result.observedModuleCount >= 2);
  assert.equal(result.forbiddenModuleCount, 0);
});

test("coding-interview track production source does not depend on feature presentation", () => {
  const root = path.join(appRoot, "src/tracks/coding-interview");
  const productionFiles = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (/\.tsx?$/u.test(entry.name) && !/\.test\.[^.]+$/u.test(entry.name)) {
        productionFiles.push(entryPath);
      }
    }
  };
  visit(root);

  const featureImport = /(?:\bfrom\s*|\bimport\s*\()\s*["'](?:[^"']*\/)?features\//u;
  const dependencies = productionFiles.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return featureImport.test(source) ? [path.relative(appRoot, file)] : [];
  });

  assert.deepEqual(dependencies, [], "track production source must not depend on feature presentation, including type-only imports");
});

test("application practice contracts do not depend on feature types", () => {
  const contractFiles = [
    "src/application/coding-interview/codingInterviewContracts.ts",
    "src/application/practice/practiceModeContract.ts",
  ];
  const featureImport = /(?:\bfrom\s*|\bimport\s*\()\s*["'](?:[^"']*\/)?features\//u;

  for (const file of contractFiles) {
    assert.doesNotMatch(readFileSync(path.join(appRoot, file), "utf8"), featureImport, `${file} must use domain contracts rather than feature types`);
  }
});
