import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { CERTIFICATION_MODE_IDS, CERTIFICATION_MODES, CERTIFICATION_PRACTICE_MODE_IDS, getCertificationMode } from "../src/tracks/cloud-certification";

const legacyModeIds = ["cloud" + "-practice", "cloud" + "-review", "cloud" + "-exam-simulation"];
const expectedPracticeModeIds = [
  "certification-diagnostic-baseline",
  "certification-focus-practice",
  "certification-scenario-practice",
  "certification-weak-area-review",
  "certification-mixed-practice",
  "certification-quick-review",
];

test("Certification cutover exposes exactly seven canonical modes and rejects the retired exam id", async () => {
  assert.deepEqual(CERTIFICATION_PRACTICE_MODE_IDS, expectedPracticeModeIds);
  assert.deepEqual(CERTIFICATION_MODE_IDS, [...expectedPracticeModeIds, "certification-exam-simulation"]);
  assert.deepEqual(CERTIFICATION_MODES.map((mode) => mode.id), CERTIFICATION_MODE_IDS);
  assert.equal(getCertificationMode("certification-exam-simulation").enabled, false);
  assert.throws(() => getCertificationMode("cloud-exam-simulation"), /Unknown Certification mode id/);

  for (const file of await sourceFiles(["src", ".maestro"])) {
    const source = await readFile(file, "utf8");
    for (const legacyModeId of legacyModeIds) {
      assert.equal(source.includes(legacyModeId), false, `${file} still references ${legacyModeId}`);
    }
  }
});

async function sourceFiles(paths: readonly string[]): Promise<string[]> {
  const files: string[] = [];
  for (const path of paths) await collect(path, files);
  return files;
}

async function collect(path: string, files: string[]): Promise<void> {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name);
    if (entry.isDirectory()) await collect(target, files);
    else if (entry.isFile() && /\\.(ts|tsx|yaml)$/.test(entry.name)) files.push(target);
  }
}
