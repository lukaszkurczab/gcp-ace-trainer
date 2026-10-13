import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFixtureReceipt} from './nativeForegroundClockFixtureReadback.mjs';
const runId = '12345678-1234-4234-8234-123456789abc';
const ready = () => ({ protocol: 'patternly.native-clock-fixture.v1', stage: 'ready', runId, mode: 'seed', scenario: 'countdown', errorCategory: null, cleanupVerified: false,
  countdownMs: 60000, initialElapsedMs: 0, durableElapsedMs: 0, checkpointRevision: 1, running: false, elapsedMs: 0, metrics: { checkpointCount: 0, maxOutstandingMs: 0, maxWriteMs: 0 }, encrypted: true });
test('fixture readback rejects missing, foreign, unencrypted or private fields', () => {
  assert.deepEqual(validateFixtureReceipt(ready(), 'seed', 'countdown', runId), ready());
  for (const patch of [{ publicTestKey: 'private' }, { mode: 'recover' }, { runId: 'stale' }, { encrypted: false }, { stage: 'failed' }, { elapsedMs: 1 }, { metrics: { ...ready().metrics, checkpointCount: 1 } }, { metrics: { ...ready().metrics, raw: 'private' } }]) assert.throws(() => validateFixtureReceipt({ ...ready(), ...patch }, 'seed', 'countdown', runId));
  assert.throws(() => validateFixtureReceipt(null, 'seed', 'countdown', runId));
});
test('cleanup requires its exact completed receipt and no clock data', () => {
  const complete = { protocol: ready().protocol, stage: 'complete', runId, mode: 'cleanup', scenario: 'countdown', errorCategory: null, cleanupVerified: true };
  assert.deepEqual(validateFixtureReceipt(complete, 'cleanup', 'countdown', runId), complete);
  assert.throws(() => validateFixtureReceipt({ ...complete, cleanupVerified: false }, 'cleanup', 'countdown', runId));
  assert.throws(() => validateFixtureReceipt({ ...complete, raw: 'private' }, 'cleanup', 'countdown', runId));
});
