import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { renderProgressPlanSection } from '../../features/home/tabs/progressPlanSectionTestHarness.mjs';
const require = createRequire(import.meta.url);
import { buildTrack, buildAll } from '../../../../patternly-content/scripts/build.mjs';
const { contentPackageRuntimeOwner } = require('../contentPackageRuntimeOwner.ts');
const { HomePlanSnapshotReader } = require('../homePlanSnapshotReader.ts');
const { createDefaultGoal, acceptedTargetFromGoal, normalizeLearningPlan } = require('../../domain/index.ts');
const { createLearningPlanSlotId } = require('../../domain/learning/slotIdentity.ts');
const { MemoryKeyValueStorage, installKeyValueStorageForTests } = require('../../infrastructure/storage/mmkvClient.ts');
const repositories = require('../../storage/repositories/index.ts');
const { readLearningPlanInputSnapshot } = require('../../storage/repositories/learningPlanInputSnapshot.ts');
const { buildProgressPlanPresentationModel } = require('../../features/home/progressPlanPresentationModel.ts');
const { buildHomePlanPracticeSetupParams } = require('../../features/home/homePlanUiContract.ts');
const { runtimeSelectors } = require('../../testing/runtimeSelectors.ts');
const { recommendLearningPlanMode } = require('./learningPlanModeRecommendation.ts');
const { getTrackRegistration } = require('../../domain/tracks/trackRegistry.ts');
const LOCALES = ['en', 'pl', 'de', 'fr', 'es', 'it', 'et'];

const TRACK = 'aws-certified-solutions-architect-associate';
const CONTENT = fileURLToPath(new URL('../../../../patternly-content/', import.meta.url));
const RULE = JSON.parse(readFileSync(path.join(CONTENT, 'content/catalog.json'), 'utf8')).tracks.find(track => track.trackId === TRACK).completionRule;

async function sourceWorkspace(t) {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), 'patternly-bizq02-projection-'));
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  await cp(path.join(CONTENT, 'content'), path.join(rootDirectory, 'content'), { recursive: true });
  await cp(path.join(CONTENT, 'config'), path.join(rootDirectory, 'config'), { recursive: true });
  return { rootDirectory, outputRoot: path.join(rootDirectory, 'dist'), trackId: TRACK };
}

function executionPolicyFor(resolved, sessions = [], dueReviewCount = 0) {
  return recommendLearningPlanMode({
    familyId: getTrackRegistration(resolved.track.trackId).familyId,
    trackId: resolved.track.trackId,
    modes: resolved.track.modes,
    sessions,
    dueReviewCount,
  }).executionPolicy;
}

test('actual canonical producer preserves a versioned completion rule in the hashed artifact', async t => {
  const workspace = await sourceWorkspace(t);
  const built = await buildTrack(workspace);
  assert.deepEqual(built.artifact.completionRule, RULE);
});

test('Home rejects a goal change during exact package resolution instead of publishing an old generation', async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  assert.ok(resolved.planningPolicyIdentity);
  const executionPolicy = executionPolicyFor(resolved);
  const goal = await repositories.saveGoalSnapshot({ ...createDefaultGoal(TRACK), targetDate: '2026-10-31' }, null);
  const plan = normalizeLearningPlan({
    schemaVersion: 2, planId: 'projection-plan', trackId: TRACK, goalRevision: goal.revision, status: 'accepted',
    timezone: 'Europe/Warsaw', contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    minutesPerStudyDay: 60, executionPolicy, planningPolicyIdentity: resolved.planningPolicyIdentity,
    acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: '2026-10-01T12:00:00.000Z', updatedAt: '2026-10-01T12:00:00.000Z',
    planRevision: 1, commandId: 'projection-command',
    slots: [{ slotId: createLearningPlanSlotId('projection-slot'), day: 'fri', localTime: '18:00', sessionLength: executionPolicy.practice.requestedLength }],
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

const { loadCanonicalRuntimeCatalog } = require('../../content/canonical/runtimeCatalog.ts');
const { LearningPlanProposalCoordinator } = require('./LearningPlanProposalCoordinator.ts');
const { projectLearningEvidence } = require('./learningEvidenceProjection.ts');
const { createHash } = await import('node:crypto');
const { validatePackageCompletionRule } = await import('../../../../patternly-content/scripts/content/question-contract.mjs');

async function verifiedProducerRuntime(t) {
  const built = await buildTrack(await sourceWorkspace(t));
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  assert.ok(resolved.planningPolicyIdentity);
  assert.equal(resolved.planningPolicyIdentity.contentVersion, built.lockEntry.contentVersion);
  assert.equal(resolved.planningPolicyIdentity.artifactSha256, built.lockEntry.sha256);
  assert.equal(resolved.planningPolicyIdentity.policyVersion, built.artifact.planningPolicy.policyVersion);
  assert.ok(resolved.track.trainingIdentity);
  assert.deepEqual(resolved.track.completionRule, RULE);
  return resolved;
}

async function learningFixture(resolved, install = true, goalOverrides = {}) {
  const trackId = resolved.track.trackId;
  assert.ok(resolved.planningPolicyIdentity, 'the exact current policy pin is independent from the training identity');
  const executionPolicy = executionPolicyFor(resolved);
  const storage = new MemoryKeyValueStorage();
  if (install) installKeyValueStorageForTests(storage);
  const goal = await repositories.saveGoalSnapshot({ ...createDefaultGoal(trackId), targetDate: '2026-11-30', ...goalOverrides }, null);
  const plan = normalizeLearningPlan({
    schemaVersion: 2, planId: 'shared-projection-plan', trackId, goalRevision: goal.revision, status: 'accepted',
    timezone: 'Europe/Warsaw', contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    minutesPerStudyDay: 60, executionPolicy, planningPolicyIdentity: resolved.planningPolicyIdentity,
    acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T12:00:00.000Z',
    planRevision: 1, commandId: 'shared-projection-command', slots: [{ slotId: createLearningPlanSlotId('shared-projection-slot'), day: 'fri', localTime: '18:00', sessionLength: executionPolicy.practice.requestedLength }],
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
    resolvePackage: async () => resolved, resolveTrackFamily: () => getTrackRegistration(trackId).familyId,
  });
  return { trackId, storage, goal, plan, base, proposal, get now() { return now; }, setNow(value) { now = value; }, home: new HomePlanSnapshotReader(base) };
}

function durableAttempt(resolved, index, resultKind = 'incorrect', overrides = {}, question = resolved.track.questions[0]) {
  const trackId = resolved.track.trackId;
  const item = { trackId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, questionId: question.questionId };
  const answeredAt = new Date(Date.parse('2026-09-01T12:00:00.000Z') + index * 1000).toISOString();
  return {
    id: `projection-attempt:${index}`, sessionId: 'projection-session', occurrenceId: `projection-occurrence:${index}`,
    trackId, modeId: resolved.track.modes[0].modeId, item, response: {},
    result: resultKind === 'correct' ? { kind: 'correct', earnedPoints: 1, maxPoints: 1 }
      : resultKind === 'partial' ? { kind: 'partial', earnedPoints: 0.5, maxPoints: 1 } : { kind: 'incorrect', earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt, ...overrides,
  };
}

async function completeAllButFirstChapter(f, resolved) {
  let index = 1000;
  let qualifyingAttemptCount = 0;
  for (const chapter of RULE.chapters.slice(1)) {
    const question = resolved.track.questions.find(candidate => candidate.nodeId === chapter.nodeId);
    assert.ok(question, `chapter ${chapter.nodeId} has a canonical question`);
    for (let count = 0; count < chapter.minimumAttemptCount; count++) {
      await repositories.addTrainingAttempt(durableAttempt(resolved, index++, 'correct', {}, question));
      qualifyingAttemptCount++;
    }
  }
  return qualifyingAttemptCount;
}

async function assertShared(f, expected) {
  const home = await f.home.read({ trackId: f.trackId, now: f.now });
  assert.equal(home.kind, 'ready');
  const proposal = await f.proposal.create(f.trackId);
  assert.ok('proposal' in proposal, `${f.trackId}: ${JSON.stringify(proposal)}`);
  assert.deepEqual(home.completion, proposal.proposal.outcome.completionState);
  assert.equal(home.completion.kind, expected);
  return { home, proposal: proposal.proposal };
}

test('real producer → verified canonical runtime → persisted evidence → Home and proposal use the same rule', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const otherChapterAttempts = await completeAllButFirstChapter(f, resolved);
  const empty = await assertShared(f, 'in_progress');
  assert.equal(empty.home.completion.qualifyingAttemptCount, otherChapterAttempts);
  assert.equal(empty.home.paceForecast.reason, 'insufficient_elapsed_evidence');
  const firstChapter = RULE.chapters[0];
  const question = resolved.track.questions.find(candidate => candidate.nodeId === firstChapter.nodeId);
  assert.ok(question);
  for (let index = 0; index < firstChapter.minimumAttemptCount; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, index >= firstChapter.minimumAttemptCount - 15 ? 'correct' : 'incorrect', {}, question));
  const quality = await assertShared(f, 'in_progress');
  assert.equal(quality.home.completion.qualifyingAttemptCount, otherChapterAttempts + firstChapter.minimumAttemptCount);
  assert.equal(quality.home.completion.chapters[0].qualifyingAttemptCount, firstChapter.minimumAttemptCount);
  assert.deepEqual(quality.home.paceForecast, { kind: 'unavailable', reason: 'quality_requirement_unmet' });
  assert.deepEqual(quality.proposal.outcome.targetAssessment, { kind: 'quality_requirement_unmet' });
  for (let index = firstChapter.minimumAttemptCount; index < firstChapter.minimumAttemptCount + 5; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', {}, question));
  const completed = await assertShared(f, 'completed');
  assert.equal(completed.home.completion.chapters[0].quality, 1);
  assert.equal(completed.home.guidance.state, 'completed');
  for (let index = firstChapter.minimumAttemptCount + 5; index < firstChapter.minimumAttemptCount + 10; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'incorrect', {}, question));
  await assertShared(f, 'in_progress');
});

test('Progress consumes actual shared evidence without claiming completion from minimum attempt volume', async t => {
  const resolved = await verifiedProducerRuntime(t);
  for (const goalOverrides of [{}, { goalType: 'learn_at_own_pace', targetDate: null }]) await t.test(goalOverrides.goalType ?? 'targeted', async () => {
    const f = await learningFixture(resolved, true, goalOverrides);
    const otherChapterAttempts = await completeAllButFirstChapter(f, resolved);
    const firstChapter = RULE.chapters[0];
    const question = resolved.track.questions.find(candidate => candidate.nodeId === firstChapter.nodeId);
    assert.ok(question);
    await assertProgressCompletion(await assertShared(f, 'in_progress'), otherChapterAttempts);
    for (let index = 0; index < 19; index++) {
      await repositories.addTrainingAttempt(durableAttempt(resolved, index, index < 15 ? 'correct' : 'incorrect', {}, question));
      if ([8, 15, 18, 19].includes(index + 1)) await assertProgressCompletion(await assertShared(f, 'in_progress'), otherChapterAttempts + index + 1);
    }
    await repositories.addTrainingAttempt(durableAttempt(resolved, 19, 'incorrect', {}, question));
    await assertProgressCompletion(await assertShared(f, 'in_progress'), otherChapterAttempts + 20);
    for (let index = 20; index < 20 + firstChapter.minimumAttemptCount - 20; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'incorrect', {}, question));
    const quality = await assertShared(f, 'in_progress');
    const reachedMinimum = 20 + (firstChapter.minimumAttemptCount - 20);
    await assertProgressCompletion(quality, otherChapterAttempts + reachedMinimum);
    for (const surface of ['home', 'progress']) assert.equal(runtimeSelectors.targetDateGuidance.reason(surface, 'quality_requirement_unmet'), `patternly:target-date-guidance:reason:${surface}:quality-requirement-unmet`);
    assert.throws(() => runtimeSelectors.targetDateGuidance.reason('progress', 'quality_unmet'), /Unknown target date guidance reason/);
    const before = readLearningPlanInputSnapshot(f.trackId);
    await assertProgressCompletion(quality, otherChapterAttempts + reachedMinimum);
    assert.deepEqual(readLearningPlanInputSnapshot(f.trackId), before, 'Presentation cannot change attempts, reviews, goal or accepted plan');
    for (let index = reachedMinimum; index < reachedMinimum + 16; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', {}, question));
    const completed = await assertShared(f, 'completed');
    await assertProgressCompletion(completed, otherChapterAttempts + reachedMinimum + 16);
    assert.equal(completed.home.completion.chapters[0].quality, 0.8);
    for (let index = reachedMinimum + 16; index < reachedMinimum + 21; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'incorrect', {}, question));
    await assertProgressCompletion(await assertShared(f, 'in_progress'), otherChapterAttempts + reachedMinimum + 21);
  });
});

async function assertProgressCompletion(state, count) {
  for (const locale of LOCALES) {
    const model = buildProgressPlanPresentationModel({ snapshot: state.home, activeTrackId: state.home.trackId, locale });
    assert.equal(model.kind, 'ready');
    assert.deepEqual(model.completion, state.home.completion);
    assert.equal('ratio' in model.completion, false);
    const rendered = renderProgressPlanSection(model, { locale, fontScale: 2 });
    const block = rendered.byTestId(runtimeSelectors.progressPlan.completion(model.completion.kind));
    assert.ok(block);
    const text = rendered.textOf(block);
    const translate = rendered.i18n.getFixedT(locale, 'learningPlan');
    assert.ok(text.startsWith(translate('Completion rule')));
    assert.doesNotMatch(text, /%|Completed scope|\{\{|\}\}/);
    assert.equal(rendered.nodes.some(node => node.type === 'ProgressBar'), false);
    if (model.completion.kind === 'unknown') {
      assert.ok(text.includes(translate('The package does not define a completion rule.')));
    } else {
      assert.equal(model.completion.qualifyingAttemptCount, count);
      assert.ok(text.includes(translate('{{count}} qualifying attempt', { count })));
      if (model.completion.kind === 'completed') {
        assert.ok(text.includes(translate('The package completion rule is currently met.')));
        assert.equal(model.primaryAction, null);
      } else if (model.completion.remainingAttemptCount === 0) {
        const message = translate('All chapter attempt minimums are met, but recent accuracy in at least one chapter is below the required level. Keep practising; completion timing is not predictable yet.');
        assert.ok(rendered.text.includes(message));
        assert.equal(rendered.nodes.filter(node => node.type === 'Text' && rendered.textOf(node) === message).length, 1, 'Keep quality status visible once, without repeating identical guidance');
        assert.ok(!text.includes(translate('The package completion rule is currently met.')));
      } else {
        const remaining = model.completion.remainingAttemptCount;
        assert.ok(text.includes(translate('attemptsRemaining', { count: remaining, remaining })));
        if (locale === 'en') assert.match(text, /to reach the minimum number of attempts/);
      }
    }
    for (const node of rendered.nodes.filter(node => node.type === 'Text')) assert.equal(node.props.maxFontSizeMultiplier, 2);
  }
}

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

test('P01: all nine verified current artifacts report zero attempts and the full chapter minimum', async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
  let verifiedChapterCount = 0;
  for (const trackId of catalog.tracks) {
    const familyId = getTrackRegistration(trackId).familyId;
    const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId);
    assert.ok(resolved.planningPolicyIdentity);
    const track = resolved.track;
    assert.equal(track.completionRule.ruleVersion, 2);
    const expectedNodes = [...new Set(track.questions.map(question => question.nodeId))].sort();
    assert.deepEqual(track.completionRule.chapters.map(chapter => chapter.nodeId).sort(), expectedNodes);
    verifiedChapterCount += expectedNodes.length;
    for (const chapter of track.completionRule.chapters) {
      const mentalUnitCount = new Set(track.questions.filter(question => question.nodeId === chapter.nodeId).map(question => question.mentalUnitId)).size;
      assert.equal(chapter.mentalUnitCount, mentalUnitCount);
      assert.ok(chapter.minimumAttemptCount >= 20);
    }
    const f = await learningFixture(resolved);
    const minimumTotal = track.completionRule.chapters.reduce((sum, chapter) => sum + chapter.minimumAttemptCount, 0);
    const empty = await assertShared(f, 'in_progress');
    const initialMode = track.getMode(empty.home.session.modeId);
    const setupParams = buildHomePlanPracticeSetupParams(empty.home, trackId);
    assert.equal(setupParams.mode, empty.home.session.modeId);
    assert.equal(setupParams.sessionLength, empty.home.session.sessionLength);
    assert.equal(setupParams.expectedContentVersion, empty.home.identity.contentVersion);
    assert.equal(setupParams.expectedArtifactSha256, empty.home.identity.artifactSha256);
    if (initialMode.selection.kind === 'node') {
      assert.equal(empty.home.session.topicId, initialMode.selection.nodeId, `${trackId} retains its exact canonical node scope`);
      assert.equal(setupParams.topicId, initialMode.selection.nodeId);
    } else {
      assert.equal(empty.home.session.topicId, undefined, `${trackId}/${initialMode.modeId} has no node topic`);
      assert.equal(Object.hasOwn(setupParams, 'topicId'), false, 'a non-node request omits topicId instead of bridging an empty string');
      assert.throws(() => buildHomePlanPracticeSetupParams({ ...empty.home, session: { ...empty.home.session, topicId: '' } }, trackId), /node scope is empty/u);
    }
    assert.equal(empty.home.completion.qualifyingAttemptCount, 0);
    assert.equal(empty.home.completion.requiredChapterCount, expectedNodes.length);
    assert.equal(empty.home.completion.requiredAttemptCount, minimumTotal);
    assert.equal(empty.home.completion.remainingAttemptCount, minimumTotal);
    await assertProgressCompletion(empty, 0);
    const question = track.questions[0];
    await repositories.addTrainingAttempt(durableAttempt(resolved, 0, 'correct', {}, question));
    const state = await assertShared(f, 'in_progress');
    assert.equal(state.home.completion.requiredChapterCount, expectedNodes.length);
    assert.equal(state.home.completion.remainingAttemptCount, track.completionRule.chapters.reduce((sum, chapter) => sum + chapter.minimumAttemptCount, 0) - 1);
    await assertProgressCompletion(state, 1);
  }
  assert.equal(verifiedChapterCount, 117);
});

test('actual Home none and Progress unavailable preserve honest status, actions and retry semantics', async () => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  const f = await learningFixture(resolved);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  for (const goalState of ['no_goal', 'no_plan', 'goal_paused']) {
    if (goalState === 'no_plan') await repositories.saveGoalSnapshot(createDefaultGoal(TRACK), null);
    if (goalState === 'goal_paused') {
      const current = await repositories.getGoalSnapshot(TRACK);
      await repositories.saveGoalSnapshot({ ...current.record, status: 'paused' }, current.revision);
    }
    const snapshot = await f.home.read({ trackId: TRACK, now: f.now });
    assert.equal(snapshot.kind, 'none');
    const model = buildProgressPlanPresentationModel({ snapshot, activeTrackId: TRACK, locale: 'en' });
    assert.equal(model.kind, 'none');
    assert.equal(model.guidance.state, goalState);
    for (const locale of LOCALES) {
      const actions = [];
      const localizedModel = buildProgressPlanPresentationModel({ snapshot, activeTrackId: TRACK, locale });
      const rendered = renderProgressPlanSection(localizedModel, { locale, onAction: action => actions.push(action) });
      const block = rendered.byTestId(runtimeSelectors.progressPlan.completion('unknown'));
      const translate = rendered.i18n.getFixedT(locale, 'learningPlan');
      assert.equal(rendered.textOf(block), translate('Completion rule') + translate('Completion scope unavailable'));
      assert.ok(!rendered.textOf(block).includes(translate('The package does not define a completion rule.')));
      assert.equal(rendered.nodes.some(node => node.type === 'ProgressBar'), false);
      const action = rendered.byTestId(runtimeSelectors.targetDateGuidance.primary('progress'));
      assert.ok(action);
      action.props.onPress();
      assert.deepEqual(actions, [localizedModel.primaryAction]);
    }
  }
  const model = buildProgressPlanPresentationModel({ snapshot: null, activeTrackId: TRACK, locale: 'en' });
  assert.equal(model.kind, 'unavailable');
  for (const locale of LOCALES) {
    let retries = 0;
    const rendered = renderProgressPlanSection(model, { locale, onRetry: () => retries++ });
    assert.equal(rendered.nodes.find(node => node.type === 'InfoBlock').props.accessibilityAlert, true);
    assert.equal(rendered.byTestId(runtimeSelectors.progressPlan.completion('unknown')), undefined);
    rendered.byTestId(runtimeSelectors.targetDateGuidance.primary('progress')).props.onPress();
    assert.equal(retries, 1);
    assert.doesNotMatch(rendered.text, /\{\{|\}\}/);
  }
});

test('producer and actual consumer reject the same malformed v2 rule vectors and hash binds a valid rule', async t => {
  const workspace = await sourceWorkspace(t);
  const built = await buildTrack(workspace);
  const { createCanonicalQuestionCatalog } = require('../../content/canonical/questionCatalog.ts');
  const hash = async bytes => createHash('sha256').update(bytes).digest('hex');
  for (const invalid of [null, {}, { ...RULE, ruleVersion: 1 }, { ...RULE, extra: 1 }, { ...RULE, chapters: [] }, { ...RULE, chapters: [{ ...RULE.chapters[0], minimumAttemptCount: 20 }] }, { ...RULE, chapters: [{ ...RULE.chapters[0], nodeId: 'foreign-node' }] }, { ...RULE, chapters: [{ ...RULE.chapters[0], mentalUnitCount: Number.MAX_SAFE_INTEGER }] }, { ...RULE, chapters: [{ ...RULE.chapters[0], qualityThreshold: 1.01 }] }, { ...RULE, chapters: [{ ...RULE.chapters[0], qualityThreshold: NaN }] }]) {
    assert.equal(validatePackageCompletionRule(invalid, undefined, built.artifact.questions).valid, false);
    const artifact = { ...built.artifact, completionRule: invalid };
    await assert.rejects(createCanonicalQuestionCatalog(artifact, built.lockEntry, TRACK, hash), /canonical contract/);
  }
  const changed = JSON.parse(built.artifactBytes);
  changed.questions[0].prompt = `${changed.questions[0].prompt} Changed without updating the artifact hash.`;
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
  const reviewSetup = buildHomePlanPracticeSetupParams(state.home, TRACK);
  assert.equal(state.home.session.modeId, 'certification-weak-area-review');
  assert.equal(state.home.session.reviewSource, 'due_queue');
  assert.equal(reviewSetup.reviewSource, 'due_queue');
  assert.equal(Object.hasOwn(reviewSetup, 'topicId'), false, 'due review uses its canonical request source without a fabricated node');
  const phantom = { ...review, id: 'projection-phantom-review', sourceItem: { ...review.sourceItem, questionId: 'review-item-absent-from-current-package' } };
  await repositories.addReviewQueueItems([phantom]);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.equal((await f.proposal.create(TRACK)).kind, 'generator_error');
});

test('future exact-package evidence cannot complete proposal while Home rejects the same facts', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const future = '2026-10-03T12:00:00.000Z';
  for (let index = 0; index < RULE.chapters[0].minimumAttemptCount; index++) {
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
  const otherChapterAttempts = await completeAllButFirstChapter(f, resolved);
  const firstChapter = RULE.chapters[0];
  const question = resolved.track.questions.find(candidate => candidate.nodeId === firstChapter.nodeId);
  assert.ok(question);
  for (let index = 0; index < 19; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', {}, question));
  const future = '2026-10-02T12:00:00.001Z';
  await repositories.addTrainingAttempt(durableAttempt(resolved, 19, 'correct', { answeredAt: future, committedAt: future }, question));
  const before = readLearningPlanInputSnapshot(TRACK);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: before.attempts, reviews: [], now: f.now }), /answer time.*captured clock/);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(await f.proposal.create(TRACK), { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  assert.equal(before.attempts.length, otherChapterAttempts + 20);
  // Rebind the same persisted dataset: this is memory repository continuity, not SDK recovery.
  installKeyValueStorageForTests(f.storage);
  f.setNow(future);
  for (let index = 20; index < firstChapter.minimumAttemptCount; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', { answeredAt: future, committedAt: future }, question));
  const valid = await assertShared(f, 'completed');
  assert.equal(valid.home.completion.qualifyingAttemptCount, otherChapterAttempts + firstChapter.minimumAttemptCount);
  const after = readLearningPlanInputSnapshot(TRACK);
  assert.equal(after.attempts.length, otherChapterAttempts + firstChapter.minimumAttemptCount);
  const afterIds = new Set(after.attempts.map(attempt => attempt.id));
  assert.ok(before.attempts.every(attempt => afterIds.has(attempt.id)));
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK).goal, before.goal);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK).plan, before.plan);
});

test('past and exactly captured answers remain eligible despite later materialization, duplicates and historical future evidence', async t => {
  const resolved = await verifiedProducerRuntime(t);
  const f = await learningFixture(resolved);
  const otherChapterAttempts = await completeAllButFirstChapter(f, resolved);
  const firstChapter = RULE.chapters[0];
  const question = resolved.track.questions.find(candidate => candidate.nodeId === firstChapter.nodeId);
  assert.ok(question);
  for (let index = 0; index < 20; index++) {
    const record = durableAttempt(resolved, index, 'correct', { answeredAt: index === 19 ? f.now : '2026-10-02T11:59:59.999Z', committedAt: '2026-10-03T12:00:00.000Z' }, question);
    await repositories.addTrainingAttempt(record);
    if (index === 19) await repositories.addTrainingAttempt(record);
  }
  const historical = durableAttempt(resolved, 20, 'correct', { answeredAt: '2026-10-03T12:00:00.000Z', committedAt: '2026-10-03T12:00:00.000Z' }, question);
  const item = { ...historical.item, contentVersion: 'other-exact-package-version' };
  await repositories.addTrainingAttempt({ ...historical, item, reviewEvidence: { ...historical.reviewEvidence, sourceItem: item } });
  for (let index = 100; index < 100 + firstChapter.minimumAttemptCount - 20; index++) await repositories.addTrainingAttempt(durableAttempt(resolved, index, 'correct', { answeredAt: f.now, committedAt: '2026-10-03T12:00:00.000Z' }, question));
  const before = readLearningPlanInputSnapshot(TRACK);
  const valid = await assertShared(f, 'completed');
  assert.equal(valid.home.completion.qualifyingAttemptCount, otherChapterAttempts + firstChapter.minimumAttemptCount);
  const projected = projectLearningEvidence({ profile: resolved.track, attempts: [...before.attempts, before.attempts[0]], reviews: [], now: f.now });
  assert.equal(projected.attempts.length, otherChapterAttempts + firstChapter.minimumAttemptCount);
  assert.equal(projected.completedFacts.attempts.length, otherChapterAttempts + firstChapter.minimumAttemptCount);
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: [ { ...before.attempts[0], answeredAt: 'not-an-instant' } ], reviews: [], now: f.now }), /invalid/);
  assert.throws(() => projectLearningEvidence({ profile: resolved.track, attempts: before.attempts, reviews: [], now: 'not-a-clock' }), /clock is invalid/);
});

test('future exact-package evidence remains unavailable until the captured clock reaches it', async () => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, 'certification');
  assert.equal(resolved.track.completionRule.ruleVersion, 2);
  const f = await learningFixture(resolved);
  const future = '2026-10-02T12:00:00.001Z';
  await repositories.addTrainingAttempt(durableAttempt(resolved, 0, 'correct', { answeredAt: future, committedAt: future }));
  const before = readLearningPlanInputSnapshot(TRACK);
  assert.deepEqual(await f.home.read({ trackId: TRACK, now: f.now }), { kind: 'unavailable', trackId: TRACK, reason: 'calculation_error' });
  assert.deepEqual(await f.proposal.create(TRACK), { kind: 'generator_error', classification: 'unclassified' });
  assert.deepEqual(readLearningPlanInputSnapshot(TRACK), before);
  f.setNow(future);
  const available = await assertShared(f, 'in_progress');
  assert.equal(available.home.completion.qualifyingAttemptCount, 1);
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

test('current producer rebuild preserves all nine v2 artifact bytes and exact app lock', async t => {
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
    const parsedArtifact = JSON.parse(bytes);
    assert.equal(parsedArtifact.completionRule.ruleVersion, 2);
    assert.ok(parsedArtifact.completionRule.chapters.length > 0);
  }
});

test('P13: production lifecycle submit materializes one exact attempt into fresh Home and proposal in the same process', async () => {
  const trackId = 'coding-interview-dsa-problem-solving';
  const familyId = 'coding_interview';
  const descriptor = require('../../domain/tracks/trackAdmission.ts').TRACK_DENSITY_DESCRIPTORS.find(entry => entry.trackId === trackId);
  assert.ok(descriptor);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId);
  const f = await learningFixture(resolved);
  const lifecycle = require('../bootstrap/trainingLifecycleComposition.ts').composeTrainingLifecycleUseCases({
    wallClock: { now: () => f.now },
    sessionIds: { create: async () => 'bizq02-p13-production-session' },
  });

  const prepared = await lifecycle.startSession({
    trackId,
    modeId: 'coding-interview-learn-approach',
    request: { nodeId: descriptor.freeNodeId, requestedLength: 10 },
  });
  const item = prepared.session.itemOrder[0].item;
  assert.equal(item.trackId, trackId);
  assert.equal(item.contentVersion, resolved.track.contentVersion);
  assert.equal(item.artifactSha256, resolved.track.artifactSha256);
  const question = await contentPackageRuntimeOwner.resolveItem(item);
  assert.equal(question.nodeId, descriptor.freeNodeId);

  await lifecycle.submitPracticeResponse(question.answer);

  const attempts = (await repositories.getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].sessionId, prepared.session.id);
  assert.equal(attempts[0].occurrenceId, prepared.session.itemOrder[0].occurrenceId);
  assert.deepEqual(attempts[0].item, item);
  assert.equal(attempts[0].result.kind, 'correct');
  assert.equal(await repositories.getActiveMutationJournal(), null, 'the submit journal is materialized and cleared before Home reads');

  const home = new HomePlanSnapshotReader({
    readInputs: readLearningPlanInputSnapshot,
    getActiveTrainingSession: repositories.getActiveTrainingSession,
    getTrainingSessions: repositories.getTrainingSessions,
    resolveExactArtifact: identity => contentPackageRuntimeOwner.resolveExactArtifact(identity),
  });
  const snapshot = await home.read({ trackId, now: f.now });
  assert.equal(snapshot.kind, 'ready');
  assert.equal(snapshot.completion.kind, 'in_progress');
  assert.equal(snapshot.completion.qualifyingAttemptCount, 1);
  assert.equal(snapshot.completion.chapters.find(chapter => chapter.nodeId === descriptor.freeNodeId)?.qualifyingAttemptCount, 1);

  const proposal = new LearningPlanProposalCoordinator({
    createProposalId: () => 'bizq02-p13-production-proposal',
    getTimezone: () => 'Europe/Warsaw',
    readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => contentPackageRuntimeOwner.getPreparedDiscovery(trackId),
    now: () => f.now,
    resolvePackage: () => contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId),
    resolveTrackFamily: () => familyId,
  });
  const projectedProposal = await proposal.create(trackId);
  assert.ok('proposal' in projectedProposal, JSON.stringify(projectedProposal));
  assert.deepEqual(projectedProposal.proposal.outcome.completionState, snapshot.completion);
});

test('P20: completed Free chapter remains complete while every required Premium chapter stays locked in Progress', async () => {
  const trackId = 'coding-interview-dsa-problem-solving';
  const familyId = 'coding_interview';
  const descriptor = require('../../domain/tracks/trackAdmission.ts').TRACK_DENSITY_DESCRIPTORS.find(entry => entry.trackId === trackId);
  assert.ok(descriptor);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId);
  const f = await learningFixture(resolved);
  const rule = resolved.track.completionRule;
  const freeChapter = rule.chapters.find(chapter => chapter.nodeId === descriptor.freeNodeId);
  assert.ok(freeChapter);
  const freeQuestion = resolved.track.questions.find(question => question.nodeId === descriptor.freeNodeId);
  assert.ok(freeQuestion);
  for (let index = 0; index < freeChapter.minimumAttemptCount; index++) {
    await repositories.addTrainingAttempt(durableAttempt(resolved, 3000 + index, 'correct', {}, freeQuestion));
  }

  const home = new HomePlanSnapshotReader({
    readInputs: readLearningPlanInputSnapshot,
    getActiveTrainingSession: repositories.getActiveTrainingSession,
    getTrainingSessions: repositories.getTrainingSessions,
    resolveExactArtifact: identity => contentPackageRuntimeOwner.resolveExactArtifact(identity),
  });
  const snapshot = await home.read({ trackId, now: f.now, premiumAccess: 'denied' });
  assert.equal(snapshot.kind, 'ready');
  assert.equal(snapshot.completion.kind, 'in_progress');
  assert.equal(snapshot.completion.requiredChapterCount, rule.chapters.length);
  assert.equal(snapshot.completion.completedChapterCount, 1);
  assert.equal(snapshot.completion.chapters.find(chapter => chapter.nodeId === freeChapter.nodeId)?.status, 'completed');
  assert.equal(snapshot.completion.remainingAttemptCount, rule.chapters.filter(chapter => chapter.nodeId !== freeChapter.nodeId).reduce((sum, chapter) => sum + chapter.minimumAttemptCount, 0));
  assert.deepEqual(snapshot.chapterAccess.find(chapter => chapter.nodeId === freeChapter.nodeId), { nodeId: freeChapter.nodeId, access: 'free' });
  const lockedChapterIds = rule.chapters.filter(chapter => chapter.nodeId !== freeChapter.nodeId).map(chapter => chapter.nodeId);
  assert.ok(lockedChapterIds.length > 0);
  assert.deepEqual(snapshot.chapterAccess.filter(chapter => chapter.access === 'locked').map(chapter => chapter.nodeId).sort(), [...lockedChapterIds].sort());

  const model = buildProgressPlanPresentationModel({ snapshot, activeTrackId: trackId, locale: 'en' });
  assert.equal(model.kind, 'ready');
  assert.equal(model.completion.kind, 'in_progress');
  assert.equal(model.chapterAccess.filter(chapter => chapter.access === 'locked').length, lockedChapterIds.length);
  const rendered = renderProgressPlanSection(model, { locale: 'en' });
  const chapterList = rendered.byTestId(runtimeSelectors.progressPlan.chapterList());
  assert.ok(chapterList, 'Progress renders the required chapter inventory');
  const chapterText = rendered.textOf(chapterList);
  const lockedCopy = rendered.i18n.getFixedT('en', 'learningPlan')('Premium access required');
  assert.equal(chapterText.split(lockedCopy).length - 1, lockedChapterIds.length);
  assert.ok(chapterText.includes(`1 of ${rule.chapters.length} chapters complete`));
});
