import test from 'node:test';
import assert from 'node:assert/strict';
import {compareForegroundClockPreservation} from './compareForegroundClockPreservation.mjs';
function pair() {
  const before = {
    registry: { selectedProfileKind: 'guest', guestCount: 1, profileCount: 2, selectedProfileIdSha256: 'guest' }, rawUserReports: ['retained-report'],
    canonicalExportInputs: { settings: { locale: 'pl' }, learning: { activeSessionId: 'session', attempts: [{ answer: 'A' }],
      sessions: [{ id: 'session', status: 'active', activeForegroundMs: 100, configurationSnapshot: { timer: 'elapsedForeground' } }],
      foregroundTimer: { sessionId: 'session', accumulatedForegroundMs: 100, checkpointRevision: 1, lastCheckpointAt: '2026-10-13T00:00:00Z', running: false } } },
    source: { fingerprintSha256: 'before', reminderRevision: 1, goalOnboardingRevision: 1 },
    inventory: { physicalKeyCount: 8, physicalInventorySha256: 'before', control: 'retained', secureControl: 'retained', globalInventories: ['retained'],
      profileInventories: [{ profileIdSha256: 'guest', kind: 'guest', keyCount: 5, inventorySha256: 'before', categoryInventories: [
        { category: 'learningProgress', keyCount: 4, inventorySha256: 'before' }, { category: 'settings', keyCount: 1, inventorySha256: 'retained' }] },
        { profileIdSha256: 'account', kind: 'account', keyCount: 3, inventorySha256: 'retained', categoryInventories: ['retained'] }] },
  };
  const after = structuredClone(before);
  after.canonicalExportInputs.learning.sessions[0].activeForegroundMs = 5100;
  Object.assign(after.canonicalExportInputs.learning.foregroundTimer, { accumulatedForegroundMs: 5100, checkpointRevision: 7, lastCheckpointAt: '2026-10-13T00:00:05Z', running: true });
  after.source.fingerprintSha256 = 'after'; after.inventory.physicalInventorySha256 = 'after';
  after.inventory.profileInventories[0].inventorySha256 = 'after'; after.inventory.profileInventories[0].categoryInventories[0].inventorySha256 = 'after';
  return [before, after];
}
test('accepts only authorized timer/session metadata and the Guest learning inventory hash', () => {
  const [before, after] = pair();
  assert.equal(compareForegroundClockPreservation(before, after).activeTimeDeltaMs, 5000);
});
test('rejects unrelated progress/settings/control/profile and unknown metadata changes', () => {
  for (const mutate of [
    a => { a.canonicalExportInputs.learning.attempts[0].answer = 'B'; },
    a => { a.canonicalExportInputs.settings.locale = 'en'; },
    a => { a.inventory.secureControl = 'changed'; },
    a => { a.inventory.profileInventories[1].inventorySha256 = 'changed'; },
    a => { a.inventory.profileInventories[0].categoryInventories[0].keyCount += 1; },
    a => { a.source.unknown = 'changed'; },
    a => { a.registry.guestCount = 2; },
  ]) {
    const [before, after] = pair(); mutate(after);
    assert.throws(() => compareForegroundClockPreservation(before, after));
  }
});
test('rejects unbounded time, stopped timer and unsynchronized recovered session', () => {
  for (const mutate of [
    a => { a.canonicalExportInputs.learning.foregroundTimer.accumulatedForegroundMs = 31001; a.canonicalExportInputs.learning.sessions[0].activeForegroundMs = 31001; },
    a => { a.canonicalExportInputs.learning.foregroundTimer.running = false; },
    a => { a.canonicalExportInputs.learning.sessions[0].activeForegroundMs = 100; },
  ]) { const [before, after] = pair(); mutate(after); assert.throws(() => compareForegroundClockPreservation(before, after)); }
});
