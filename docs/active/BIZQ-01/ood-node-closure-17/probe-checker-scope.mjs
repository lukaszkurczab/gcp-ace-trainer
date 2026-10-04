import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, symlink, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const packet = dirname(fileURLToPath(import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const manifest = JSON.parse(await readFile(join(packet, 'PREFLIGHT-MANIFEST.json'), 'utf8'));
const scratch = await mkdtemp(join(tmpdir(), 'patternly-bizq01-checker17-'));
const cases = [
  { name: 'exact baseline reaches missing-proposal stage', mutate: () => {}, expected: /ENOENT.*PROPOSED-B01/u },
  { name: 'missing accepted N01 pin rejected', mutate: m => m.acceptedN01Sources.pop(), expected: /AssertionError/u },
  { name: 'changed fixed new mapping rejected', mutate: m => { m.units[0].items[0].newItemId = 'ood-n02-b01-i021'; }, expected: /AssertionError/u },
  { name: 'changed historical whole object rejected', mutate: m => { m.units[0].items[0].oldObject.prompt += ' tampered'; }, expected: /AssertionError/u },
  { name: 'duplicate unit rejected', mutate: m => { m.units[1] = structuredClone(m.units[0]); }, expected: /AssertionError/u },
];
const results = [];
try {
  for (const [index, check] of cases.entries()) {
    const root = join(scratch, String(index));
    const target = join(root, 'patternly/docs/active/BIZQ-01/ood-node-closure-17');
    await mkdir(target, { recursive: true });
    await symlink(producer, join(root, 'patternly-content'), 'dir'); // read-only real module/source inputs; no writes to checkout
    await copyFile(join(packet, 'check-proposals.mjs'), join(target, 'check-proposals.mjs'));
    const input = structuredClone(manifest); check.mutate(input);
    await writeFile(join(target, 'PREFLIGHT-MANIFEST.json'), JSON.stringify(input));
    const run = spawnSync(process.execPath, [join(target, 'check-proposals.mjs'), join(target, 'result.json')], { encoding: 'utf8' });
    assert.equal(run.status, 1, check.name);
    assert.match(run.stderr, check.expected, check.name);
    results.push({ name: check.name, status: 'PASS', exitCode: run.status });
  }
  await writeFile(join(packet, 'ROOT-CHECKER-SCOPE.json'), JSON.stringify({ status: 'PASS', results, boundary: 'Actual unchanged checker executable on isolated manifests with real read-only producer modules/source. Baseline assertions pass then missing proposal rejects; no proposal semantic/source/admission acceptance.' }, null, 2) + '\n');
  console.log(`${results.length}/${cases.length} fixed-scope probes PASS`);
} finally { await rm(scratch, { recursive: true, force: true }); }
