import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReadback } from './nativeForegroundClockReadback.mjs';
const valid = () => ({ stage: 'bound_read_only', authority: 'ios-native', unchanged: true, elapsedMatches: true,
  metrics: { checkpointCount: 0, maxOutstandingMs: 0, maxWriteMs: 0 } });
test('accepts only an unchanged, stopped native owner with no checkpoint', () => {
  assert.deepEqual(validateReadback(valid()), valid());
  for (const patch of [{ authority: 'android-js' }, { unchanged: false }, { elapsedMatches: false },
    { metrics: { ...valid().metrics, checkpointCount: 1 } }, { stage: 'failed' }]) {
    assert.throws(() => validateReadback({ ...valid(), ...patch }), /native_binding_rejected/);
  }
});
test('rejects private or unexpected result fields instead of emitting them', () => {
  assert.throws(() => validateReadback({ ...valid(), raw: 'private' }), /native_binding_rejected/);
  assert.throws(() => validateReadback({ ...valid(), metrics: { ...valid().metrics, token: 'private' } }), /native_binding_rejected/);
  for (const value of [undefined, null, {}, []]) assert.throws(() => validateReadback(value));
});
