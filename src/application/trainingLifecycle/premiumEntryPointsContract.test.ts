import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve("src");

function productionSources(directory = ROOT): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : productionSources(absolute);
    if (!entry.isFile() || !/\.tsx?$/u.test(entry.name) || /\.test\.tsx?$/u.test(entry.name)) return [];
    return [path.relative(process.cwd(), absolute)];
  });
}

function filesMatching(pattern: RegExp): string[] {
  return productionSources().filter((file) => pattern.test(readFileSync(file, "utf8"))).sort();
}

test("new training sessions have one application entry and no prepare-only bypass", () => {
  assert.deepEqual(filesMatching(/startTrainingSession\s*\(/u), [
    "src/application/certification/certificationSessionFacade.ts",
    "src/application/coding-interview/codingInterviewSessionFacade.ts",
    "src/application/design-interview/designInterviewSessionFacade.ts",
    "src/application/trainingLifecycle/applicationLifecycle.ts",
  ]);
  assert.deepEqual(filesMatching(/getTrainingLifecycleUseCases\(\)\.startSession\s*\(/u), [
    "src/application/trainingLifecycle/applicationLifecycle.ts",
  ]);
  assert.equal(readFileSync("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "utf8").includes("async prepareSession("), false);
});

test("Premium package download has one account-owned application entry", () => {
  assert.deepEqual(filesMatching(/installPremiumNodeOffer\s*\(/u), [
    "src/application/account/AccountSessionProvider.tsx",
    "src/content/application/nodePackageInstaller.ts",
  ]);
  assert.deepEqual(filesMatching(/\.getContentPackage\s*\(/u), [
    "src/content/application/nodePackageInstaller.ts",
  ]);
  assert.equal(readFileSync("src/content/application/nodePackageInstaller.ts", "utf8").includes("installAuthenticatedNodePackage"), false);
});
