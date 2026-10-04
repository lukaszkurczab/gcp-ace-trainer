// Read-only preservation snapshot before any N05 source/proof activation.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const producer = fileURLToPath(new URL('../../../../../patternly-content/', packet));
const git = args => execFileSync('git', args, {cwd: producer, maxBuffer: 16 * 1024 * 1024});
const head = git(['rev-parse', 'HEAD']).toString().trim();
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), 'bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a');
const manifest = JSON.parse(manifestBytes);
const scoped = new Set(manifest.units.map(unit => unit.sourceFile));
const files = git(['ls-files', '-z', '--', 'content']).toString().split('\0').filter(Boolean);
const untouchedContentFiles = {};
for (const path of files) if (path !== 'content/catalog.json' && !scoped.has(path)) {
  untouchedContentFiles[path] = sha256(await readFile(new URL(`../../../../../patternly-content/${path}`, packet)));
}
assert.equal(Object.keys(untouchedContentFiles).length, 944);
const previous = JSON.parse(await readFile(new URL('../ood-node-closure-20/BEFORE-PRODUCTION.json', packet)));
const proofPaths = [...Object.keys(previous.immutableProofs), 'evidence/business-quality/bizq-01-ood-node-closure-20.json'];
const immutableProofs = {};
for (const path of proofPaths) {
  const hash = sha256(await readFile(new URL(`../../../../../patternly-content/${path}`, packet)));
  if (path in previous.immutableProofs) assert.equal(hash, previous.immutableProofs[path]);
  else assert.equal(hash, 'cb087c42a24d7a7f6ddbd922b05f379efab8f68e991587b30ee8bf51f0e1298d');
  immutableProofs[path] = hash;
}
const catalog = JSON.parse(await readFile(new URL('../../../../../patternly-content/content/catalog.json', packet)));
assert.equal(catalog.tracks.find(track => track.trackId === manifest.trackId).contentVersion, manifest.beforeContentVersion);
const verifierSha256 = sha256(await readFile(new URL('../../../../../patternly-content/scripts/content/verify-migration.mjs', packet)));
assert.equal(git(['rev-parse', 'HEAD']).toString().trim(), head, 'Producer HEAD changed during snapshot');
console.log(JSON.stringify({scope: 'Actual pre-N05 source/catalog/immutable-proof preservation snapshot; not source activation or semantic approval', head, sourceRepositoryCommit: git(['log', '-1', '--format=%H', '--', 'content']).toString().trim(), manifestSha256: sha256(manifestBytes), untouchedContentFiles, immutableProofs, catalog, verifierSha256}, null, 2));
