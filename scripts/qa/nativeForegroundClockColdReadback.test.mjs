import test from 'node:test';
import assert from 'node:assert/strict';
import { validateColdReceipt, validateIdentity } from './nativeForegroundClockColdReadback.mjs';
const identity = ['12345678-1234-4234-8234-123456789abc', 'a'.repeat(64), 'b'.repeat(64)];
const receipt = () => ({ protocol: 'patternly.foreground-clock-cold-receipt.v1', runId: identity[0], profileIdSha256: identity[1], sessionIdSha256: identity[2], durableElapsedMs: 900, sessionElapsedMs: 0, checkpointRevision: 3, running: true });
test('rejects missing, mismatched, malformed and extra receipt data', () => {
  assert.deepEqual(validateColdReceipt(receipt(), ...identity), receipt());
  for (const patch of [{ runId: 'stale' }, { profileIdSha256: 'c'.repeat(64) }, { sessionIdSha256: 'c'.repeat(64) }, { raw: 'private' }, { durableElapsedMs: -1 }, { checkpointRevision: 0 }, { running: 'true' }]) {
    assert.throws(() => validateColdReceipt({ ...receipt(), ...patch }, ...identity));
  }
  assert.throws(() => validateColdReceipt(null, ...identity));
  assert.throws(() => validateIdentity('invalid', identity[1], identity[2]));
});
