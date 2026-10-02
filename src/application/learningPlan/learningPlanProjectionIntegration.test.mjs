import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { buildTrack, buildAll } from '../../../../patternly-content/scripts/build.mjs';
const { contentPackageRuntimeOwner } = require('../contentPackageRuntimeOwner.ts');
const { HomePlanSnapshotReader } = require('../homePlanSnapshotReader.ts');
const { createDefaultGoal, acceptedTargetFromGoal, normalizeLearningPlan } = require('../../domain/index.ts');
const { createLearningPlanSlotId } = require('../../domain/learning/slotIdentity.ts');
const { MemoryKeyValueStorage, installKeyValueStorageForTests } = require('../../infrastructure/storage/mmkvClient.ts');
const repositories = require('../../storage/repositories/index.ts');
const { readLearningPlanInputSnapshot } = require('../../storage/repositories/learningPlanInputSnapshot.ts');

const TRACK = 'aws-certified-solutions-architect-associate';
const CONTENT = fileURLToPath(new URL('../../../../patternly-content/', import.meta.url));
// Explicit transport test policy; never written into the authoritative nine tracks.
const RULE = { ruleVersion: 1, minimumAttemptCount: 20, rollingWindowSize: 10, qualityThreshold: 0.8 };

async function sourceWorkspace(t, rule = RULE) {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), 'patternly-bizq02-projection-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  await cp(path.join(CONTENT, 'content'), path.join(rootDirectory, 'content'), { recursive: true, filter: source => source === path.join(CONTENT, 'content') || source === path.join(CONTENT, 'content/catalog.json') || source.startsWith(path.join(CONTENT, 'content', TRACK)) });
  const catalogPath = path.join(rootDirectory, 'content/catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  if (rule !== undefined) catalog.tracks.find(track => track.trackId === TRACK).completionRule = rule;
  await writeFile(catalogPath, JSON.stringify(catalog));
  return { rootDirectory, outputRoot: path.join(rootDirectory, 'dist'), trackId: TRACK };
}

test('actual canonical producer preserves a versioned completion rule in the hashed artifact', async t => {
  const workspace = await sourceWorkspace(t);
  const built = await buildTrack(workspace);
  assert.deepEqual(built.artifact.completionRule, RULE);
});

test('Home rejects a goal change during exact package resolution instead of publishing an old generation', async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  const goal = await repositories.saveGoalSnapshot({ ...createDefaultGoal(TRACK), targetDate: '2026-10-31' }, null);
  const plan = normalizeLearningPlan({
    schemaVersion: 1, planId: 'projection-plan', trackId: TRACK, goalRevision: goal.revision, status: 'accepted',
    timezone: 'Europe/Warsaw', contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z',
    planRevision: 1, commandId: 'projection-command',
    slots: [{ slotId: createLearningPlanSlotId('projection-slot'), day: 'fri', localTime: '18:00', sessionLength: resolved.track.modes[0].defaultRequestedLength }],
  });
  repositories.saveLearningPlanAtomically({ plan, expectedGoalRevision: goal.revision, expectedPlanStorageRevision: null });
  const reader = new HomePlanSnapshotReader({
    readInputs: readLearningPlanInputSnapshot,
    getActiveTrainingSession: repositories.getActiveTrainingSession, getTrainingSessions: repositories.getTrainingSessions,
    resolveExactArtifact: async () => {
      await repositories.saveGoalSnapshot({ ...goal.record, targetDate: '2026-11-01' }, goal.revision);
      return resolved;
    },
  });
  assert.deepEqual(await reader.read({ trackId: TRACK, now: '2026-10-02T12:00:00.000Z' }), { kind: 'unavailable', trackId: TRACK, reason: 'concurrent_change' });
});

const { buildCanonicalRuntimeCatalog, loadCanonicalRuntimeCatalog } = require('../../content/canonical/runtimeCatalog.ts');
const { CanonicalTrainingRuntime } = require('../canonical/CanonicalTrainingRuntime.ts');
const { LearningPlanProposalCoordinator } = require('./LearningPlanProposalCoordinator.ts');
const { projectLearningEvidence } = require('./learningEvidenceProjection.ts');
const { createHash } = await import('node:crypto');
const { validatePackageCompletionRule } = await import('../../../../patternly-content/scripts/content/question-contract.mjs');
const { createPackageCompletionRuleV1 } = require('../../domain/learning/packageCompletionRule.ts');

async function verifiedProducerRuntime(t) {
  const built = await buildTrack(await sourceWorkspace(t));
  const bundleRoot = fileURLToPath(new URL('../../content/generated/canonical-content/', import.meta.url));
  const lock = JSON.parse(await readFile(path.join(bundleRoot, 'content-lock.json'), 'utf8'));
  const artifacts = await Promise.all(lock.tracks.map(async entry => entry.trackId === TRACK ? JSON.parse(built.artifactBytes) : JSON.parse(await readFile(path.join(bundleRoot, `${entry.trackId}.json`), 'utf8'))));
  const locks = lock.tracks.map(entry => entry.trackId === TRACK ? built.lockEntry : entry);
  const catalog = await buildCanonicalRuntimeCatalog({ artifacts, locks, sha256Utf8: async bytes => createHash('sha256').update(bytes).digest('hex') });
  const track = catalog.getTrack(TRACK);
  assert.deepEqual(track.completionRule, RULE);
  return { track, runtime: new CanonicalTrainingRuntime(track) };
}

async function learningFixture(resolved, install = true) {
  const trackId = resolved.track.trackId;
  const storage = new MemoryKeyValueStorage();
  if (install) installKeyValueStorageForTests(storage);
  const goal = await repositories.saveGoalSnapshot({ ...createDefaultGoal(trackId), targetDate: '2026-11-30' }, null);
  const plan = normalizeLearningPlan({
    schemaVersion: 1, planId: 'shared-projection-plan', trackId, goalRevision: goal.revision, status: 'accepted',
    timezone: 'Europe/Warsaw', contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z',
    planRevision: 1, commandId: 'shared-projection-command', slots: [{ slotId: createLearningPlanSlotId('shared-projection-slot'), day: 'fri', localTime: '18:00', sessionLength: resolved.track.modes[0].defaultRequestedLength }],
  });
  repositories.saveLearningPlanAtomically({ plan, expectedGoalRevision: goal.revision, expectedPlanStorageRevision: null });
  let sequence = 0;
  let now = '2026-10-02T12:00:00.000Z';
  const base = {
    readInputs: readLearningPlanInputSnapshot,
    getActiveTrainingSession: repositories.getActiveTrainingSession, getTrainingSessions: repositories.getTrainingSessions,
    resolveExactArtifact: async () => resolved,
  };
  const proposal = new LearningPlanProposalCoordinator({
    createProposalId: () => `shared-projection:${++sequence}`, getTimezone: () => 'Europe/Warsaw',
    readInputs: readLearningPlanInputSnapshot, peekPackage: () => resolved, now: () => now,
    resolvePackage: async () => resolved, resolveTrackFamily: () => 'certification',
  });
  return { trackId, storage, goal, plan, base, proposal, get now() { return now; }, setNow(value) { now = value; }, home: new HomePlanSnapshotReader(base) };
}

function durableAttempt(resolved, index, resultKind = 'incorrect', overrides = {}) {
  const trackId = resolved.track.trackId;
  const item = { trackId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, questionId: resolved.track.questions[0].questionId };
  const answeredAt = `2026-09-${String(Math.floor(index / 60) + 1).padStart(2, '0')}T12:00:${String(index % 60).padStart(2, '0')}.000Z`;
  return {
    id: `projection-attempt:${index}`, sessionId: 'projection-session', occurrenceId: `projection-occurrence:${index}`,
    trackId, modeId: resolved.track.modes[0].modeId, item, response: {},
    result: resultKind === 'correct' ? { kind: 'correct', earnedPoints: 1, maxPoints: 1 }
      : resultKind === 'partial' ? { kind: 'partial', earnedPoints: 0.5, maxPoints: 1 } : { kind: 'incorrect', earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt, ...overrides,
  };
}

async function assertShared(f, expected) {
  const home = await f.home.read({ trackId: f.trackId, now: f.now });
  assert.equal(home.kind, 'ready');
  const proposal = await f.proposal.create(f.trackId);
  assert.ok('proposal' in proposal, JSON.stringify(proposal));
  assert.deepEqual(home.completion, proposal.proposal.outcome.completionState);
  assert.equal(home.completion.kind, expected);
  return { home, proposal: proposal.proposal };
}

test('real producer → verified canonical runtime → persisted evidence → Home and proposal use the same rule', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const empty = await assertShared(f, 'in_progress');
  assert.equal(empty.home.completion.qualifyingAttemptCount, 0);
  assert.equal(empty.home.paceForecast.reason, 'insufficient_elapsed_evidence');
  for (let index = 0; index < 25; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, index < 20 ? 'correct' : 'incorrect'));
  const quality = await assertShared(f, 'in_progress');
  assert.equal(quality.home.completion.qualifyingAttemptCount, 25);
  assert.deepEqual(quality.home.paceForecast, { kind: 'unavailable', reason: 'quality_requirement_unmet' });
  assert.deepEqual(quality.proposal.outcome.targetAssessment, { kind: 'quality_requirement_unmet' });
  for (let index = 25; index < 33; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct'));
  const completed = await assertShared(f, 'completed');
  assert.equal(completed.home.completion.quality, 0.8);
  assert.equal(completed.home.guidance.state, 'completed');
  for (let index = 33; index < 38; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index));
  await assertShared(f, 'in_progress');
});

test('shared evidence is package-wide across plan revisions, exact by artifact, deduplicated, and partial is not correct', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  for (let index = 0; index < 20; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, index < 17 ? 'correct' : 'partial'));
  const old = durableAttempt(resolved, 20, 'correct');
  const oldItem = { ...old.item, contentVersion: 'historical-policy-content' };
  await repositories.addTrainingAttempt({ ...old, item: oldItem, reviewEvidence: { ...old.reviewEvidence, sourceItem: oldItem } });
  const savedPlan = repositories.getLearningPlanSnapshot(TRACK);
  repositories.saveLearningPlanAtomically({ plan: normalizeLearningPlan({ ...savedPlan.plan, planRevision: 2, updatedAt: f.now, commandId: 'revised-plan' }), expectedGoalRevision: f.goal.revision, expectedPlanStorageRevision: savedPlan.revision });
  const state = await assertShared(f, 'in_progress');
  assert.equal(state.home.completion.qualifyingAttemptCount, 20);
  const inputs = readLearningPlanInputSnapshot(TRACK);
  const duplicate = projectLearningEvidence({ profile: resolved.track, attempts: [...inputs.attempts, inputs.attempts[0]], reviews: [], now: f.now });
  assert.equal(duplicate.attempts.length, 20);
  assert.equal(duplicate.completedFacts.attempts.length, 20);
  assert.deepEqual(duplicate.completedFacts.sessions, []);
  const conflict = { ...inputs.attempts[0], response: { conflicting: true } };
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: [...inputs.attempts, conflict], reviews: [], now: f.now }), /conflicting/);
});

test('absent actual policies stay unknown in both actual Home and proposal for all nine current tracks', async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    assert.equal(Object.hasOwn(track, 'completionRule'), false);
    const resolved = { track, runtime: new CanonicalTrainingRuntime(track) };
    const f = await learningFixture(resolved);
    await repositories.addTrainingAttempt(durableAttempt(resolved, 0, 'correct'));
    const state = await assertShared(f, 'unknown');
    assert.deepEqual(state.home.paceForecast, { kind: 'unavailable', reason: 'unknown_completion_rule' });
  }
});

test('producer and actual consumer reject the same malformed v1 rule vectors and hash binds a valid rule', async t => {
  const workspace = await sourceWorkspace(t);
  const built = await buildTrack(workspace);
  const { createCanonicalQuestionCatalog } = require('../../content/canonical/questionCatalog.ts');
  const hash = async bytes => createHash('sha256').update(bytes).digest('hex');
  for (const invalid of [null, undefined, {}, { ...RULE, ruleVersion: 2 }, { ...RULE, extra: 1 }, { ...RULE, minimumAttemptCount: 9 }, { ...RULE, rollingWindowSize: 0 }, { ...RULE, minimumAttemptCount: Number.MAX_SAFE_INTEGER + 1 }, { ...RULE, qualityThreshold: 1.01 }, { ...RULE, qualityThreshold: NaN }]) {
    assert.equal(validatePackageCompletionRule(invalid).valid, false);
    assert.throws(() => createPackageCompletionRuleV1(invalid));
    const artifact = { ...built.artifact, completionRule: invalid };
    await assert.rejects(createCanonicalQuestionCatalog(artifact, built.lockEntry, TRACK, hash), /canonical contract/);
  }
  const changed = { ...JSON.parse(built.artifactBytes), completionRule: { ...RULE, qualityThreshold: 0.7 } };
  await assert.rejects(createCanonicalQuestionCatalog(changed, built.lockEntry, TRACK, hash), /SHA-256/);
});

test('Home rejects evidence changes and journal failure inside exact resolution', async t => {
  const resolved = await verifiedProducerRuntime(t);
  for (const effect of ['attempt', 'journal']) {
    const f = await learningFixture(resolved);
    const home = new HomePlanSnapshotReader({ ...f.base, resolveExactArtifact: async () => {
      if (effect === 'attempt') await repositories.addTrainingAttempt(durableAttempt(resolved, 0));
      if (effect === 'journal') {
        const { journal } = require('../../testing/journalTestSupport.ts');
        repositories.persistMutationJournal(journal([{ kind: 'clear_learning_state' }], 'reset_learning_state'));
      }
      return resolved;
    } });
    const result = await home.read({ trackId: TRACK, now: f.now });
    assert.deepEqual(result, { kind: 'unavailable', trackId: TRACK, reason: effect === 'journal' ? 'storage_error' : 'concurrent_change' });
  }
});

test('matching-package phantom question IDs fail instead of contributing fabricated progress', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const attempt = durableAttempt(resolved, 0, 'correct');
  const item = { ...attempt.item, questionId: 'question-not-in-verified-artifact' };
  await repositories.addTrainingAttempt({ ...attempt, item, reviewEvidence: { ...attempt.reviewEvidence, sourceItem: item } });
  const home = await f.home.read({ trackId: TRACK, now: f.now });
  assert.deepEqual(home, { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  const proposal = await f.proposal.create(TRACK);
  assert.equal(proposal.kind, 'generator_error');
});

test('actual profile router A/B/A rejects old Home snapshot even when account A learning data is unchanged', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const storageApi = require('../../infrastructure/storage/mmkvClient.ts');
  const { openProfileStorageRouter } = require('../../infrastructure/storage/profileStorageRouter.ts');
  const base = new MemoryKeyValueStorage();
  const values = new Map(); let sequence = 10;
  const control = { get: async key => values.get(key) ?? null, set: async (key, value) => { values.set(key, value); }, remove: async key => { values.delete(key); } };
  const identity = { create: async () => ({ installationId: '00000000-0000-4000-8000-000000000001', localDatasetId: `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` }) };
  storageApi.setProfileStoragePreparationFactoryForTests(async () => ({ base, router: await openProfileStorageRouter(base, control, { identity }) }));
  async function select(account) {
    storageApi.closeActiveProfileStorage(); await storageApi.prepareProfileStorage();
    const { profile } = await storageApi.selectPreparedAccountProfile(account);
    return storageApi.activatePreparedProfile(profile.id, profile.kind);
  }
  try {
    const oldLease = await select('projection-account-a');
    const f = await learningFixture(resolved, false);
    await repositories.addTrainingAttempt(durableAttempt(resolved, 0, 'correct'));
    const before = readLearningPlanInputSnapshot(TRACK);
    const home = new HomePlanSnapshotReader({ ...f.base, resolveExactArtifact: async () => {
      await select('projection-account-b');
      assert.equal((await f.home.read({ trackId: TRACK, now: f.now })).kind, 'none');
      const newLease = await select('projection-account-a');
      assert.notStrictEqual(newLease, oldLease);
      const after = readLearningPlanInputSnapshot(TRACK);
      assert.deepEqual(after.goal, before.goal); assert.deepEqual(after.plan, before.plan);
      return resolved;
    } });
    assert.deepEqual(await home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'concurrent_change' });
  } finally { storageApi.closeActiveProfileStorage(); storageApi.setProfileStoragePreparationFactoryForTests(null); }
});

test('actual persisted reviews share exact qualification and due cutoff; phantom matching review fails closed', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const attempt = durableAttempt(resolved, 0);
  await repositories.addTrainingAttempt(attempt);
  const review = {
    id: 'projection-review', trackId: TRACK, sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId,
    sourceItem: attempt.item, taxonomyOrSkillRefs: [], reasons: ['incorrect'], dueAt: f.now,
    createdAt: attempt.answeredAt, consecutiveAfterDueSuccesses: 0, persistent: true,
  };
  const futureItem = { ...attempt.item, questionId: resolved.track.questions[1].questionId };
  const futureAttempt = durableAttempt(resolved, 1, 'incorrect', { item: futureItem, reviewEvidence: { sourceItem: futureItem, taxonomyOrSkillRefs: [] } });
  await repositories.addTrainingAttempt(futureAttempt);
  await repositories.addReviewQueueItems([review, { ...review, id: 'projection-future-review', sourceItem: futureItem, sourceAttemptId: futureAttempt.id, dueAt: '2026-10-03T12:00:00.000Z' }]);
  const inputs = readLearningPlanInputSnapshot(TRACK);
  const projected = projectLearningEvidence({ profile: resolved.track, attempts: inputs.attempts, reviews: [...inputs.reviews, review], now: f.now });
  assert.equal(projected.reviews.length, 2); assert.equal(projected.dueReviews.length, 1);
  const state = await assertShared(f, 'in_progress');
  assert.equal(state.home.dueReviewCount, 1); assert.deepEqual(state.home.dueReviewIds, [review.id]);
  assert.deepEqual(state.proposal.outcome.materialPriority, { kind: 'due_review' });
  const phantom = { ...review, id: 'projection-phantom-review', sourceItem: { ...review.sourceItem, questionId: 'review-item-absent-from-current-package' } };
  await repositories.addReviewQueueItems([phantom]);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.equal((await f.proposal.create(TRACK)).kind, 'generator_error');
});

test('future exact-package evidence cannot complete proposal while Home rejects the same facts', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const future = '2026-10-03T12:00:00.000Z';
  for (let index = 0; index < RULE.minimumAttemptCount; index++) {
    await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', { answeredAt: future, committedAt: future }));
  }
  const before = readLearningPlanInputSnapshot(TRACK);
  const home = await f.home.read({ trackId: TRACK, now: f.now });
  const proposal = await f.proposal.create(TRACK);
  t.diagnostic(JSON.stringify({ home: home.kind, reason: home.reason, proposal: proposal.kind, completion: proposal.proposal?.outcome.completionState.kind }));
  assert.deepEqual(home, { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(proposal, { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before, 'failure must not alter evidence or the accepted goal/plan');
});

test('captured instant rejects same-day future answers by one millisecond without silently dropping them', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  for (let index = 0; index < 19; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct'));
  const future = '2026-10-02T12:00:00.001Z';
  await repositories.addTrainingAttempt(durableAttempt(resolved, 19, 'correct', { answeredAt: future, committedAt: future }));
  const before = readLearningPlanInputSnapshot(TRACK);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: before.attempts, reviews: [], now: f.now }), /answer time.*captured clock/);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(await f.proposal.create(TRACK), { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  assert.equal(before.attempts.length, 20);
  // Rebind the same persisted dataset: this is memory repository continuity, not SDK recovery.
  installKeyValueStorageForTests(f.storage);
  f.setNow(future);
  const valid = await assertShared(f, 'completed');
  assert.equal(valid.home.completion.qualifyingAttemptCount, 20);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK).attempts, before.attempts);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK).goal, before.goal);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK).plan, before.plan);
});

test('past and exactly captured answers remain eligible despite later materialization, duplicates and historical future evidence', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  for (let index = 0; index < 20; index++) {
    const record = durableAttempt(resolved, index, 'correct', { answeredAt: index === 19 ? f.now : '2026-10-02T11:59:59.999Z', committedAt: '2026-10-03T12:00:00.000Z' });
    await repositories.addTrainingAttempt(record);
    if (index === 19) await repositories.addTrainingAttempt(record);
  }
  const historical = durableAttempt(resolved, 20, 'correct', { answeredAt: '2026-10-03T12:00:00.000Z', committedAt: '2026-10-03T12:00:00.000Z' });
  const item = { ...historical.item, contentVersion: 'other-exact-package-version' };
  await repositories.addTrainingAttempt({ ...historical, item, reviewEvidence: { ...historical.reviewEvidence, sourceItem: item } });
  const before = readLearningPlanInputSnapshot(TRACK);
  const valid = await assertShared(f, 'completed');
  assert.equal(valid.home.completion.qualifyingAttemptCount, 20);
  const projected = projectLearningEvidence({ profile: resolved.track, attempts: [...before.attempts, before.attempts[0]], reviews: [], now: f.now });
  assert.equal(projected.attempts.length, 20);
  assert.equal(projected.completedFacts.attempts.length, 20);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: [ { ...before.attempts[0], answeredAt: 'not-an-instant' } ], reviews: [], now: f.now }), /invalid/);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: before.attempts, reviews: [], now: 'not-a-clock' }), /clock is invalid/);
});

test('absent production rule does not hide future exact-package facts as unknown', async () => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  assert.equal(Object.hasOwn(resolved.track, 'completionRule'), false);
  const f = await learningFixture(resolved);
  const future = '2026-10-02T12:00:00.001Z';
  await repositories.addTrainingAttempt(durableAttempt(resolved, 0, 'correct', { answeredAt: future, committedAt: future }));
  const before = readLearningPlanInputSnapshot(TRACK);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(await f.proposal.create(TRACK), { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  f.setNow(future);
  await assertShared(f, 'unknown');
});

test('clock rollback blocks real proposal resolve and acceptance before goal-plan CAS or reminders', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  for (let index = 0; index < 20; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', { answeredAt: f.now, committedAt: f.now }));
  const created = await f.proposal.create(TRACK);
  assert.equal(created.kind, 'ready');
  const id = created.proposal.proposalId;
  const { LearningPlanEditorCoordinator } = require('./LearningPlanEditorCoordinator.ts');
  const { LearningPlanMutationRuntimeCore } = require('./learningPlanMutationRuntimeCore.ts');
  const { readGoalSnapshot } = require('../../storage/repositories/goalRepository.ts');
  const { readLearningPlanStorageScope } = require('../../storage/repositories/learningPlanInputSnapshot.ts');
  const context = () => ({ contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, timezone: 'Europe/Warsaw' });
  let saves = 0; let reconciles = 0;
  const editor = new LearningPlanEditorCoordinator({
    proposalCoordinator: f.proposal, readStorageScope: readLearningPlanStorageScope, readGoalSnapshot,
    loadGoalSnapshot: repositories.getGoalSnapshot, loadLearningPlanSnapshot: repositories.getLearningPlanSnapshot,
    loadContentContext: async () => context(), peekContentContext: context, createEditorId: () => 'clock-editor', now: () => f.now,
    saveLearningPlan: input => { saves++; return repositories.saveLearningPlanAtomically(input); },
  });
  const mutation = new LearningPlanMutationRuntimeCore({
    acceptProposal: (...args) => editor.acceptProposal(...args), commit: (...args) => editor.commit(...args),
    reconcile: async () => { reconciles++; return { kind: 'disabled', status: 'disabled' }; },
    retry: async () => { throw new Error('retry is not part of this operation'); },
  });
  const before = readLearningPlanInputSnapshot(TRACK);
  f.setNow('2026-10-02T11:59:59.999Z');
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(await f.proposal.resolve(id, TRACK), { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(f.proposal.resolveForCommit(id, TRACK), { kind: 'generator_error', classification: 'retryable' });
  assert.deepEqual(await mutation.acceptProposal(id, TRACK, { title: 'fixture', body: 'fixture' }), { kind: 'storage_error' });
  assert.equal(saves, 0); assert.equal(reconciles, 0);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  f.setNow('2026-10-02T12:00:00.000Z');
  assert.equal((await f.proposal.resolve(id, TRACK)).kind, 'ready');
});

test('current producer rebuild preserves all nine rule-free artifact bytes and exact app lock', async t => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'patternly-bizq02-current-parity-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const built = await buildAll({ rootDirectory: CONTENT, outputRoot });
  const bundleRoot = fileURLToPath(new URL('../../content/generated/canonical-content/', import.meta.url));
  const bundledLock = JSON.parse(await readFile(path.join(bundleRoot, 'content-lock.json'), 'utf8'));
  assert.deepEqual(built.lock, bundledLock);
  assert.equal(built.artifacts.length, 9);
  for (const artifact of built.artifacts) {
    const expected = await readFile(path.join(bundleRoot, `${artifact.trackId}.json`), 'utf8');
    const bytes = await readFile(path.join(outputRoot, `${artifact.trackId}.json`), 'utf8');
    assert.equal(bytes, expected);
    assert.equal(Object.hasOwn(JSON.parse(bytes), 'completionRule'), false);
  }
});
