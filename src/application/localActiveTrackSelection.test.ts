import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { loadLocalActiveTrackId } from './learningReadModels';
import { loadPracticeReadData } from './practiceReadModels';
import { withLocalLearningWriteOperation } from './learningMutations/localLearningWriteOperation';
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from '../infrastructure/storage/mmkvClient';
import { clearActiveTrackId, saveActiveTrackId } from '../storage/repositories/activeTrackRepository';
import { STORAGE_KEYS } from '../storage/keys';
import { contentPackageRuntimeOwner } from './contentPackageRuntimeOwner';
import { createTrainingAttempt, type ReviewQueueEntry } from '../domain';
import { addTrainingAttempt, clearTrainingAttempts } from '../storage/repositories/trainingAttemptRepository';
import { addReviewQueueItems, clearReviewQueueItems } from '../storage/repositories/reviewQueueRepository';
import { productionTrackAdmissionContext as admission } from './tracks/trackAdmissionContext';

const ood = 'object-oriented-design-interview';
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(accept => { resolve = accept; });
  return { promise, resolve };
}

test('selection waits through local clear/restore and never publishes transient absence', async () => {
  await saveActiveTrackId(ood);
  const cleared = deferred(), release = deferred();
  const materialization = withLocalLearningWriteOperation(async () => {
    await clearActiveTrackId(); cleared.resolve(); await release.promise;
    await saveActiveTrackId(ood);
  });
  await cleared.promise;
  let published = false;
  const read = Promise.all([loadLocalActiveTrackId(), loadPracticeReadData({})]).then(values => { published = true; return values; });
  await new Promise<void>(accept => setImmediate(accept));
  assert.equal(published, false);
  release.resolve(); await materialization;
  const [selection, practice] = await read;
  assert.equal(selection, ood);
  assert.equal(practice.activeTrackId, ood);
});

test('selection rejects a changed profile while queued on local materialization', async () => {
  const release = deferred();
  const write = withLocalLearningWriteOperation(() => release.promise);
  const read = loadLocalActiveTrackId();
  const rejected = assert.rejects(read, /Profile changed/);
  const practiceRejected = assert.rejects(loadPracticeReadData({}), /Profile changed/);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  release.resolve(); await write; await rejected; await practiceRejected;
});

test('corrupt selection stays an error, distinct from confirmed empty storage', async () => {
  assert.equal(await loadLocalActiveTrackId(), null);
  const corrupt = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(corrupt);
  corrupt.setString(STORAGE_KEYS.ACTIVE_TRACK, '{');
  await assert.rejects(loadLocalActiveTrackId(), /corrupt/i);
  await assert.rejects(loadPracticeReadData({}), /corrupt/i);
});

test('Practice reads the entire post-materialization snapshot, including attempts and reviews', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const trackId = 'coding-interview-dsa-problem-solving';
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  const item = { trackId, questionId: track.questions[0]!.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  const attempt = (id: string) => createTrainingAttempt({
    id, sessionId: id, trackId, modeId: track.modes[0]!.modeId, occurrenceId: id, item,
    response: { answer: 'fixture' }, result: { kind: 'correct', earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: '2026-01-01T00:00:00.000Z', committedAt: '2026-01-01T00:00:00.000Z',
  });
  const review: ReviewQueueEntry = {
    id: 'restored-review', trackId, sourceItem: item, sourceSessionId: 'restored', sourceAttemptId: 'restored',
    createdAt: '2026-01-01T00:00:00.000Z', dueAt: '2026-01-02T00:00:00.000Z',
    consecutiveAfterDueSuccesses: 0, persistent: true, reasons: ['incorrect'], taxonomyOrSkillRefs: [],
  };
  await saveActiveTrackId(ood);
  await addTrainingAttempt(attempt('old'), admission);
  const cleared = deferred(), release = deferred();
  const write = withLocalLearningWriteOperation(async () => {
    await clearActiveTrackId();
    await clearTrainingAttempts(admission);
    await clearReviewQueueItems(admission);
    cleared.resolve(); await release.promise;
    await addTrainingAttempt(attempt('restored'), admission);
    await addReviewQueueItems([review], admission);
    await saveActiveTrackId(trackId);
  });
  await cleared.promise;
  let published = false;
  const read = loadPracticeReadData({ includeReviews: true, now: Date.parse('2026-01-03T00:00:00.000Z') })
    .then(data => { published = true; return data; });
  try {
    await new Promise<void>(accept => setImmediate(accept));
    assert.equal(published, false);
  } finally { release.resolve(); await write; }
  const data = await read;
  assert.equal(data.activeTrackId, trackId);
  assert.deepEqual(data.trainingAttempts.map(value => value.id), ['restored']);
  assert.equal(data.reviewSource, 'due_queue');
});
