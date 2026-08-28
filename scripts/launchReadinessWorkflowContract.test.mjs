import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/launch-readiness.yml"), "utf8");

test("launch readiness CI is an explicit exact-SHA enforced gate", () => {
  assert.match(workflow, /^name: Launch readiness/m);
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:/);
  assert.match(workflow, /application_commit:[\s\S]*?required: true[\s\S]*?type: string/);
  assert.match(workflow, /content_commit:[\s\S]*?required: true[\s\S]*?type: string/);
  assert.match(workflow, /ref: \$\{\{ inputs\.application_commit \}\}\n\s+path: app\n\s+fetch-depth: 0/);
  assert.match(workflow, /repository: lukaszkurczab\/patternly-content\n\s+ref: \$\{\{ inputs\.content_commit \}\}\n\s+path: patternly-content\n\s+fetch-depth: 0/);
  assert.match(workflow, /git -C app rev-parse HEAD/);
  assert.match(workflow, /git -C patternly-content rev-parse HEAD/);
  assert.match(workflow, /\[\[ "\$APPLICATION_COMMIT" =~ \^\[0-9a-f\]\{40\}\$ \]\]/);
  assert.match(workflow, /\[\[ "\$CONTENT_COMMIT" =~ \^\[0-9a-f\]\{40\}\$ \]\]/);
  assert.match(workflow, /node-version: 22\.13\.1/);
  assert.match(workflow, /working-directory: app\n\s+run: npm ci/);
  assert.match(workflow, /working-directory: patternly-content\n\s+run: npm ci/);
  assert.match(workflow, /name: Validate exact content checkout[\s\S]*?npm test[\s\S]*?npm run authoring:validate[\s\S]*?npm run audit:aws-workbook-source/);
  assert.match(workflow, /node scripts\/releaseGate\.mjs --enforce > launch-readiness-report\.json/);
  assert.doesNotMatch(workflow, /npm run release:gate > launch-readiness-report\.json/);
  assert.match(workflow, /gate_status=\$\?/);
  assert.match(workflow, /JSON\.parse\(fs\.readFileSync\("launch-readiness-report\.json", "utf8"\)\)/);
  assert.match(workflow, /exit "\$gate_status"/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$EXPECTED_APPLICATION_COMMIT"/);
  assert.doesNotMatch(workflow, /npm run launch:readiness/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /name: launch-readiness-report-\$\{\{ inputs\.application_commit \}\}/);
  assert.match(workflow, /path: app\/launch-readiness-report\.json/);
  assert.doesNotMatch(workflow, /ref: master/);
  assert.doesNotMatch(workflow, /launch-readiness-report-\$\{\{ github\.sha \}\}/);
});
