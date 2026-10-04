// Parse the real JS syntax to compare old fixed descriptors and private guards.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '../../../../node_modules/typescript/lib/typescript.js';
import { sha256 } from '../../../../../patternly-content/scripts/build.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const file = 'scripts/content/verify-migration.mjs';
const baseline = '95b7e07f33d7808b9c879db37f11e63e25abcb01';
const oldBytes = execFileSync('git', ['show', `${baseline}:${file}`], { cwd: producer, maxBuffer: 16 * 1024 * 1024 });
const currentBytes = await readFile(resolve(producer, file));
function syntax(bytes) {
  const source = ts.createSourceFile(file, bytes.toString('utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.equal(source.parseDiagnostics.length, 0, 'Verifier must parse before guard comparison');
  const descriptors = new Map();
  const functions = new Map();
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
      const name = declaration.name.getText(source);
      const init = declaration.initializer;
      if (name.startsWith('BIZQ01_') && init && ts.isCallExpression(init)
          && init.expression.getText(source) === 'Object.freeze' && ts.isObjectLiteralExpression(init.arguments[0])) {
        descriptors.set(name, declaration.getText(source));
      }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) functions.set(statement.name.text, statement.getText(source));
  }
  return { descriptors, functions };
}
const before = syntax(oldBytes);
const after = syntax(currentBytes);
assert.equal(before.descriptors.size, 11, 'Baseline fixed proof descriptor inventory changed');
for (const [name, declaration] of before.descriptors) assert.equal(after.descriptors.get(name), declaration, `Prior descriptor changed: ${name}`);
const guardedFunctions = ['validateBizq01OodClosedCohortProof', 'validateBizq01OodReasonAmendment19a', 'validateBizq01OodCohort20Proof'];
for (const name of guardedFunctions) assert.equal(after.functions.get(name), before.functions.get(name), `Prior private guard changed: ${name}`);
console.log(JSON.stringify({ verdict: 'PASS', scope: 'Actual AST-selected existing11 descriptors and closed17/19/19a/20 private-guard bytes versus accepted baseline; additive21 dispatch and global history assembly reviewed separately',
  baselineCommit: baseline, currentVerifierSha256: sha256(currentBytes),
  unchangedDescriptors: [...before.descriptors.keys()], unchangedPrivateGuardFunctions: guardedFunctions }, null, 2));
