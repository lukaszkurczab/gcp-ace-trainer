import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/qa.yml"), "utf8");

test("QA installs the frontend lock before native and root verification", () => {
  assert.equal((workflow.match(/node-version: 22\.13\.1/g) ?? []).length, 2);
  assert.equal((workflow.match(/app\/package-lock\.json/g) ?? []).length, 2);
  const rootBaseline = workflow.indexOf("- name: Run recovery baseline (includes qa:static)");
  const nativePrebuild = workflow.indexOf("- name: Verify clean generated native platform contract");
  assert.equal(workflow.includes("app/server"), false);
  assert.ok(nativePrebuild >= 0 && rootBaseline > nativePrebuild);
  assert.match(workflow, /git archive HEAD \| tar -x -C "\$prebuild_root"/);
  assert.match(workflow, /npx expo prebuild --no-install --clean/);
  assert.match(workflow, /android\.minSdkVersion=28/);
  assert.match(workflow, /android\.compileSdkVersion=36/);
  assert.match(workflow, /android\.targetSdkVersion=36/);
  assert.match(workflow, /ios\.deploymentTarget/);
  assert.match(workflow, /UIInterfaceOrientationPortrait/);
  assert.match(workflow, /UIUserInterfaceStyle/);
  assert.match(workflow, /TARGETED_DEVICE_FAMILY/);
  assert.match(workflow, /appendingPathComponent/);
  assert.match(workflow, /values\.isExcludedFromBackup/);
  assert.match(workflow, /android:allowBackup/);
  assert.match(workflow, /android:dataExtractionRules/);
  assert.match(workflow, /android:fullBackupContent/);
  assert.match(workflow, /backup_rules\.xml/);
  assert.match(workflow, /data_extraction_rules\.xml/);
});
