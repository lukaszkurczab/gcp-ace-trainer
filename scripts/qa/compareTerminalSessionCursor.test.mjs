import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { compareTerminalSessionCursor } from './compareTerminalSessionCursor.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const original = { id: 'session', trackId: 'track', modeId: 'practice', configurationSnapshot: {kind:'practice'},
  requestedLength: 2, actualLength: 2, currentItemIndex: 0, itemOrder: [{item:{questionId:'a'}},{item:{questionId:'b'}}],
  optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 123,
  contentVersion: 'version', artifactSha256: 'a'.repeat(64), taxonomyVersion: 'taxonomy', status:'abandoned',
  startedAt:'2026-10-24T10:00:00Z', planFingerprint:'b'.repeat(64), completedAt:'2026-10-24T10:01:00Z' };
test('reordered terminal record reproduces the exact original hash by cursor normalization alone', () => {
  const after = { ...Object.fromEntries(Object.entries(original).reverse()), currentItemIndex: 1 };
  assert.deepEqual(compareTerminalSessionCursor(after, hash(JSON.stringify(original)), hash),
    {preSyncHashReproduced:true,priorCursor:0,currentCursor:1,currentLength:2});
  for (const changed of [{...after,activeForegroundMs:124}, {...after,completedAt:'2026-10-24T10:02:00Z'},
    {...after,itemOrder:[{item:{questionId:'changed'}},after.itemOrder[1]]}]) {
    assert.equal(compareTerminalSessionCursor(changed, hash(JSON.stringify(original)), hash).preSyncHashReproduced, false);
  }
});
test('unknown fields and active/resumable records cannot be explained as terminal cursor normalization', () => {
  for (const session of [{...original,extra:true}, {...original,status:'active'}, original]) {
    assert.throws(() => compareTerminalSessionCursor(session, hash(JSON.stringify(original)), hash), /comparison_rejected/);
  }
});
