import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const bundle = readFileSync(process.argv[2]);
const directory = 'src/content/generated/canonical-content';
const files = readdirSync(directory).filter(name => name.endsWith('.json')).sort();
assert.equal(files.length, 10);
const text = bundle.toString('utf8');
const payloads = files.map(file => {
  const bytes = readFileSync(`${directory}/${file}`);
  return { file, sha256: createHash('sha256').update(bytes).digest('hex'), exactPayloadPresent: text.includes(bytes.toString('utf8').trim()) };
});
assert(payloads.every(entry => entry.exactPayloadPresent));
const result = { appHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), bundleBytes: bundle.length, bundleSha256: createHash('sha256').update(bundle).digest('hex'), payloads, interpretation: 'All nine canonical artifact payloads and runtime content-lock match actual Metro bundle. Candidate integration release.lock is separately checked and is not a runtime import.' };
writeFileSync(process.argv[3], `${JSON.stringify(result, null, 2)}\n`);
console.log('PASS: 10/10 exact runtime JSON payloads');
