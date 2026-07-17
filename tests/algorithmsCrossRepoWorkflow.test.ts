import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/qa.yml", "utf8");

test("Algorithms cross-repository workflow uses clean sibling checkouts and a locked SHA", () => {
  assert.match(workflow, /name: Checkout application[\s\S]*?uses: actions\/checkout@v4[\s\S]*?path: app/);
  assert.match(workflow, /id: content-lock[\s\S]*?working-directory: app[\s\S]*?shell: bash/);
  assert.match(workflow, /process\.stdout\.write\(`commit=\$\{lock\.commit\}\\n`\);[\s\S]*?' >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /repository: lukaszkurczab\/patternly-content[\s\S]*?ref: \$\{\{ steps\.content-lock\.outputs\.commit \}\}[\s\S]*?path: patternly-content/);
  assert.match(workflow, /cache-dependency-path: app\/package-lock\.json/);
  assert.match(workflow, /name: Install application dependencies[\s\S]*?working-directory: app/);
  assert.match(workflow, /name: Run pinned cross-repository round-trip[\s\S]*?working-directory: app[\s\S]*?PATTERNLY_CONTENT_ROOT: \$\{\{ github\.workspace \}\}\/patternly-content/);
  assert.doesNotMatch(workflow, /continue-on-error/);
  assert.doesNotMatch(workflow, /console\.log\([^\n]*>>\s*process\.env\.GITHUB_OUTPUT/);
});
