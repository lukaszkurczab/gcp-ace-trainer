import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, chmodSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const reader = fileURLToPath(new URL('./nativeGoalPlanPairReadback.mjs', import.meta.url));

// CLI routing only: discovery returns no target, so these tests cannot reach a
// native runtime or provide evidence for account/storage/SDK behavior.
function fixture(run) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'patternly-pair-reader-cli-')));
  chmodSync(root, 0o700);
  const trace = join(root, 'discovery.json');
  const preload = join(root, 'discovery-only.mjs');
  writeFileSync(join(root, 'manifest.json'), JSON.stringify({ schemaVersion: 1, stage: 'registered', projectId: 'patternly-app-sandbox', uidSha256: 'a'.repeat(64) }), { mode: 0o600 });
  writeFileSync(preload, `import {writeFileSync} from 'node:fs';
globalThis.fetch=async(url,options)=>{
  writeFileSync(${JSON.stringify(trace)},JSON.stringify({url:String(url),redirect:options.redirect,timeoutSignal:options.signal instanceof AbortSignal}));
  return {ok:true,text:async()=>'[]'};
};`, { mode: 0o600 });
  const invoke = (track, extra = []) => spawnSync(process.execPath, ['--import', preload, reader, '--private-root', root, '--manifest', 'manifest.json', '--track', track, '--output', 'snapshot.json', ...extra], { encoding: 'utf8', timeout: 5000 });
  try { run({ root, trace, invoke }); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('legacy tracks retain the default discovery origin; explicit localhost enables AWS', () => {
  for (const [track, args, url] of [
    ['google-cloud-associate-cloud-engineer', [], 'http://127.0.0.1:8081/json/list'],
    ['coding-interview-dsa-problem-solving', [], 'http://127.0.0.1:8081/json/list'],
    ['aws-certified-solutions-architect-associate', ['--metro-origin', 'http://localhost:8083'], 'http://localhost:8083/json/list'],
  ]) fixture(({ root, trace, invoke }) => {
    const result = invoke(track, args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(JSON.parse(result.stderr).category, 'target_rejected');
    assert.deepEqual(JSON.parse(readFileSync(trace, 'utf8')), { url, redirect: 'error', timeoutSignal: true });
    assert.equal(existsSync(join(root, 'snapshot.json')), false);
  });
});

test('invalid origins fail before private filesystem or network access', () => {
  for (const origin of ['http://remote.invalid:8083', 'http://localhost:8083/?query=1', 'http://localhost:8083/#fragment', 'http://user@localhost:8083']) {
    const result = spawnSync(process.execPath, [reader, '--private-root', '/nonexistent/pair-reader-fixture', '--manifest', 'missing.json', '--track', 'aws-certified-solutions-architect-associate', '--output', 'missing.json', '--metro-origin', origin], { encoding: 'utf8', timeout: 5000 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.deepEqual(JSON.parse(result.stderr), { stage: 'native_pair_readback_stopped', category: 'origin_rejected', storageMutationAttempted: false });
  }
});

test('unreviewed tracks still fail before discovery', () => fixture(({ trace, invoke }) => {
  const result = invoke('frontend-system-design-interview', ['--metro-origin', 'http://localhost:8083']);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).category, 'controlled_track_rejected');
  assert.equal(existsSync(trace), false);
}));
