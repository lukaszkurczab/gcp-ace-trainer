import { readFile, lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

function requireEqual(a, b, category) { if (!isDeepStrictEqual(a, b)) throw Error(category); }
function requireCondition(condition, category) { if (!condition) throw Error(category); }
export function compareForegroundClockPreservation(before, after) {
  requireEqual(before.registry, after.registry, 'registry_changed');
  requireCondition(before.registry?.selectedProfileKind === 'guest' && before.registry.guestCount === 1, 'guest_scope_rejected');
  requireEqual(before.rawUserReports, after.rawUserReports, 'reports_changed');
  const left = structuredClone(before.canonicalExportInputs);
  const right = structuredClone(after.canonicalExportInputs);
  const oldLearning = left.learning;
  const newLearning = right.learning;
  requireCondition(oldLearning?.activeSessionId && oldLearning.activeSessionId === newLearning?.activeSessionId, 'session_scope_changed');
  const oldSessions = oldLearning.sessions.filter(s => s.id === oldLearning.activeSessionId);
  const newSessions = newLearning.sessions.filter(s => s.id === oldLearning.activeSessionId);
  requireCondition(oldSessions.length === 1 && newSessions.length === 1, 'session_scope_changed');
  const oldSession = oldSessions[0]; const newSession = newSessions[0];
  const oldTimer = oldLearning.foregroundTimer; const newTimer = newLearning.foregroundTimer;
  requireCondition(oldSession.status === 'active' && oldSession.configurationSnapshot.timer === 'elapsedForeground'
    && oldTimer?.sessionId === oldSession.id && newTimer?.sessionId === oldSession.id, 'timer_scope_rejected');
  const delta = newTimer.accumulatedForegroundMs - oldTimer.accumulatedForegroundMs;
  requireCondition(Number.isSafeInteger(delta) && delta > 0 && delta <= 30_000
    && oldSession.activeForegroundMs === oldTimer.accumulatedForegroundMs
    && newSession.activeForegroundMs === newTimer.accumulatedForegroundMs
    && Number.isSafeInteger(newTimer.checkpointRevision) && newTimer.checkpointRevision > oldTimer.checkpointRevision
    && newTimer.running === true && Number.isFinite(Date.parse(newTimer.lastCheckpointAt))
    && Date.parse(newTimer.lastCheckpointAt) >= Date.parse(oldTimer.lastCheckpointAt), 'timer_delta_rejected');
  newSession.activeForegroundMs = oldSession.activeForegroundMs;
  for (const key of ['accumulatedForegroundMs', 'checkpointRevision', 'lastCheckpointAt', 'running']) newTimer[key] = oldTimer[key];
  requireEqual(left, right, 'unexpected_guest_data_change');
  const oldSource = structuredClone(before.source); const newSource = structuredClone(after.source);
  newSource.fingerprintSha256 = oldSource.fingerprintSha256;
  requireEqual(oldSource, newSource, 'source_metadata_changed');
  // The fingerprint and physical inventory cover the authorized S/T changes.
  const a = structuredClone(before.inventory); const b = structuredClone(after.inventory);
  const guestHash = before.registry.selectedProfileIdSha256;
  const oldProfiles = a.profileInventories.filter(p => p.profileIdSha256 === guestHash);
  const newProfiles = b.profileInventories.filter(p => p.profileIdSha256 === guestHash);
  requireCondition(oldProfiles.length === 1 && newProfiles.length === 1, 'guest_inventory_rejected');
  const oldProfile = oldProfiles[0]; const newProfile = newProfiles[0];
  requireCondition(oldProfile.kind === 'guest' && newProfile.kind === 'guest', 'guest_inventory_rejected');
  const oldCategories = oldProfile.categoryInventories.filter(c => c.category === 'learningProgress');
  const newCategories = newProfile.categoryInventories.filter(c => c.category === 'learningProgress');
  requireCondition(oldCategories.length === 1 && newCategories.length === 1, 'guest_inventory_rejected');
  newCategories[0].inventorySha256 = oldCategories[0].inventorySha256;
  newProfile.inventorySha256 = oldProfile.inventorySha256;
  b.physicalInventorySha256 = a.physicalInventorySha256;
  requireEqual(a, b, 'unexpected_inventory_change');
  return { stage: 'foreground_clock_preservation', profiles: before.registry.profileCount, guests: 1,
    physicalKeys: before.inventory.physicalKeyCount, activeTimeDeltaMs: delta,
    changedProfileCount: 1, changedCategory: 'learningProgress', otherCategoriesPreserved: true };
}
async function readPrivateSnapshot(path) {
  if (!isAbsolute(path)) throw Error('private_snapshot_rejected');
  const metadata = await lstat(path); const parent = await lstat(dirname(path));
  if (!metadata.isFile() || metadata.uid !== process.getuid() || (metadata.mode & 0o777) !== 0o600
    || !parent.isDirectory() || parent.uid !== process.getuid() || (parent.mode & 0o777) !== 0o700
    || await realpath(path) !== path) throw Error('private_snapshot_rejected');
  return JSON.parse(await readFile(path, 'utf8'));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [beforePath, afterPath, ...extra] = process.argv.slice(2);
  if (!beforePath || !afterPath || extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    Promise.all([readPrivateSnapshot(beforePath), readPrivateSnapshot(afterPath)]).then(([before, after]) => {
      console.log(JSON.stringify(compareForegroundClockPreservation(before, after)));
    }).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'preservation_comparison_failed' })); process.exitCode = 1;
    });
  }
}
