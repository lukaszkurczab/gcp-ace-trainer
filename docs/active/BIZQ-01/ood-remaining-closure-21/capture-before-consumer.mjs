// Exact admitted v20 artifact/lock snapshot before the N05 app synchronization.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const app = new URL('../../../../', packet);
const web = new URL('../../../../../patternly-web/', packet);
const head = root => execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(root)}).toString().trim();
const applicationBefore = head(app);
const webBefore = head(web);
const previous = JSON.parse(await readFile(new URL('../ood-node-closure-20/BEFORE-CONSUMER.json', packet)));
assert.equal(previous.files.length, 12);
const files = [];
for (const entry of previous.files) {
  const bytes = await readFile(new URL(entry.path, app));
  if (entry.path.endsWith('/object-oriented-design-interview.json')) {
    assert.equal(sha256(bytes),'fa015cbcdb5b4a0865c39ce7958a4832a08e8b10811dd7f396dc12cc79c6de82');
  }
  files.push({path:entry.path, sha256:sha256(bytes)});
}
const release = JSON.parse(await readFile(new URL('integration/contracts/content-release/release.lock.json',app)));
assert.equal(release.candidateId,'3001b254f9a1c4f9d15a01577f5457b8cb4ad79723f9958ecbdb7c8c5658417b');
const demoPath = 'src/generated/demoQuestions.json';
const demoBytes = await readFile(new URL(demoPath,web));
assert.equal(head(app),applicationBefore); assert.equal(head(web),webBefore);
console.log(JSON.stringify({applicationBefore, webBefore, files,
  webDemo:{path:demoPath,sha256:sha256(demoBytes)},
  scope:'Actual admitted20 artifacts/locks and two-demo file before21 synchronization; matching code evidence reusable, source21 requires its own admission'},null,2));
