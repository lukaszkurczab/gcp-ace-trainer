import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { subject, controlledHooks, nodes, settle } from './soloUi22TestHarness.mjs';
const require = createRequire(import.meta.url);
const { ROUTES } = require('../../constants/routes.ts');
const { getTrackDisplay } = require('../../domain/index.ts');
const { getSettingsAccountPresentation } = require('./tabs/settingsAccountPresentation.ts');
const { LearningProjectionUnavailableError, isLocalLearningProjectionFailure, requireHomePlanReadIntegrity } = require("../../application/learningProjectionFailure.ts");
const { runtimeSelectors } = require('../../testing/runtimeSelectors.ts');

function shell(overrides = {}) {
  const hooks = controlledHooks();
  const bindings = {
    ...Object.fromEntries(['View', 'Screen', 'EmptyState', 'AppShellHeader', 'AppBottomNavigation', 'HomeLoadingSkeleton', 'ProgressLoadingSkeleton', 'SettingsLoadingSkeleton', 'HomeTab', 'ProgressTab', 'SettingsTab'].map(name => [name, name])),
    ...hooks.bindings, useRef: current => ({ current }),
    usePatternlyAccount: () => ({ state: { kind: 'guest' }, readCurrentPremiumAccess: () => ({ kind: 'free' }) }),
    useHomeResumeUnavailable: () => null, useThemedStyles: () => ({}), createStyles: () => ({}),
    useTranslation: () => ({ t: key => key }), markStartup: () => {},
    getSettingsAccountPresentation, getTrackDisplay, runtimeSelectors, ROUTES,
    CODING_INTERVIEW_TRACK_ID: 'coding-interview-dsa-problem-solving',
    getActiveTrackId: async () => 'aws-certified-solutions-architect-associate',
    captureProfileReadFence: () => () => {}, captureHomeShellReadFence: () => () => {},
    projectHomePractice: () => ({ kind: "none" }),
    projectProgressEvidence: () => ({ capturedAt: "2026-10-15T10:00:00Z" }), isLocalLearningProjectionFailure, requireHomePlanReadIntegrity,
    getApplicationCurrentTime: () => '2026-10-15T10:00:00Z',
    getAttempts: async () => [], getPracticeHistory: async () => [], loadActiveTrainingSession: async () => null,
    getReviewQueueItems: async () => ({ ok: true, value: [] }),
    getTrainingAttempts: async () => ({ ok: true, value: [] }), loadActivitySessionRecords: async () => [],
    homePlanSnapshotReader: { read: async () => null }, loadGoal: async () => null, loadGoalOnboardingDismissed: () => true,
    describeOperationalFailure: (_error, fallback) => fallback,
    ...overrides,
  };
  const screen = subject('src/features/home/HomeScreen.tsx', 'HomeScreen', bindings);
  const render = initialTab => hooks.render(screen, { route: { params: { initialTab } }, navigation: { navigate() {} } });
  return { render };
}

test('Home shell retains global read error and Retry recovery', async () => {
  let reads = 0;
  const ui = shell({ getReviewQueueItems: async () => { if (++reads === 1) throw Error('corrupt_read'); return { ok: true, value: [] }; } });
  ui.render('home'); await settle();
  const failure = nodes(ui.render('home')).find(node => node.type === 'EmptyState');
  assert.equal(failure.props.title, 'Patternly is unavailable');
  assert.equal(failure.props.actionLabel, 'Try again');
  failure.props.onActionPress();
  ui.render('home'); await settle();
  assert.ok(nodes(ui.render('home')).some(node => node.type === 'HomeTab'));
  assert.equal(reads, 2);
});

test('Home shell retains local Coding Interview dashboard failure', async () => {
  const ui = shell({ getActiveTrackId: async () => 'coding-interview-dsa-problem-solving', loadCodingInterviewDashboard: async () => { throw new LearningProjectionUnavailableError('coding_dashboard'); } });
  ui.render('home'); await settle();
  const home = nodes(ui.render('home')).find(node => node.type === 'HomeTab');
  assert.equal(home.props.dashboardError, 'Coding Interview recommendation is unavailable.');
  assert.equal(home.props.algorithmsDashboard, null);
});

test('Home shell keeps Home, Progress and Settings reachable after read', async () => {
  for (const [tab, component] of [['home', 'HomeTab'], ['progress', 'ProgressTab'], ['settings', 'SettingsTab']]) {
    const ui = shell();
    ui.render(tab); await settle();
    assert.ok(nodes(ui.render(tab)).some(node => node.type === component));
  }
});

// ARCH-05/prompt24: distinguish positively classified optional projection failures
// from unverified profile/evidence reads in the actual shell and Progress component.
test('local Progress projection failure retains Settings, shows Retry and recovers', async () => {
  let projections = 0;
  const ui = shell({ projectProgressEvidence: () => {
    if (++projections === 1) throw new LearningProjectionUnavailableError('progress');
    return { capturedAt: '2026-10-15T10:00:00Z' };
  } });
  ui.render('progress'); await settle();
  const progress = nodes(ui.render('progress')).find(node => node.type === 'ProgressTab');
  assert.equal(progress.props.evidence, null);
  assert.equal(progress.props.evidenceError, 'Progress is unavailable');
  const actualProgress = subject('src/features/home/tabs/ProgressTab.tsx', 'ProgressTab', {
    EmptyState: 'EmptyState', useState: value => [value, () => {}],
    useThemedStyles: () => ({}), createStyles: () => ({}),
    useAppPreferences: () => ({ colors: {}, locale: 'en' }), useTranslation: () => ({ t: key => key }),
  });
  const unavailable = actualProgress(progress.props);
  assert.equal(unavailable.props.actionLabel, 'Try again');
  ui.render('settings'); await settle();
  assert.ok(nodes(ui.render('settings')).some(node => node.type === 'SettingsTab'));
  unavailable.props.onActionPress();
  ui.render('progress'); await settle();
  const recovered = nodes(ui.render('progress')).find(node => node.type === 'ProgressTab');
  assert.ok(recovered.props.evidence);
  assert.equal(recovered.props.evidenceError, null);
  assert.equal(projections, 2);
});

test('profile, storage, integrity and unknown dashboard failures block Settings', async () => {
  const { ProfileReadFenceChangedError } = require('../../application/profileReadFence.ts');
  const { CanonicalEvidenceIntegrityError, StorageReadError } = require('../../storage/errors.ts');
  const { TrainingApplicationFailure } = require('../../application/trainingLifecycle/contracts.ts');
  for (const error of [new ProfileReadFenceChangedError(), new CanonicalEvidenceIntegrityError(), new LearningProjectionUnavailableError('coding_dashboard', new CanonicalEvidenceIntegrityError()), new LearningProjectionUnavailableError('coding_dashboard', new ProfileReadFenceChangedError()), new StorageReadError('test-fixture'), new TrainingApplicationFailure('persistence_failure', 'fixture', new CanonicalEvidenceIntegrityError()), Error('unknown projection failure')]) {
    const ui = shell({ getActiveTrackId: async () => 'coding-interview-dsa-problem-solving', loadCodingInterviewDashboard: async () => { throw error; } });
    ui.render('settings'); await settle();
    const tree = nodes(ui.render('settings'));
    assert.ok(tree.some(node => node.type === 'EmptyState' && node.props.title === 'Patternly is unavailable'), error.name);
    assert.ok(!tree.some(node => node.type === 'SettingsTab' || node.type === 'AppBottomNavigation'), error.name);
  }
});

test('global snapshot failure values block the shell, local plan unavailability retains Settings', async () => {
  for (const reason of ['storage_error', 'corrupt_record', 'identity_mismatch', 'concurrent_change', 'unsupported_action']) {
    const ui = shell({ homePlanSnapshotReader: { read: async () => ({ kind: 'unavailable', trackId: 'aws-certified-solutions-architect-associate', reason }) } });
    ui.render('settings'); await settle();
    const tree = nodes(ui.render('settings'));
    assert.equal(tree.some(node => node.type === 'SettingsTab'), reason === 'unsupported_action', reason);
  }
});

test('a local projection failure cannot hide a final stale profile/source fence', async () => {
  for (const fence of ['captureProfileReadFence', 'captureHomeShellReadFence']) {
    const ui = shell({ [fence]: () => () => { throw Error('stale fixture'); }, projectProgressEvidence: () => { throw new LearningProjectionUnavailableError('progress'); } });
    ui.render('settings'); await settle();
    assert.ok(nodes(ui.render('settings')).some(node => node.type === 'EmptyState' && node.props.title === 'Patternly is unavailable'));
  }
});

test('Home shell supplies the same captured durable arrays and clock to Home and Progress projections', async () => {
  const attempts = [], reviews = [], captured = [];
  const ui = shell({
    getActiveTrackId: async () => 'coding-interview-dsa-problem-solving',
    getTrainingAttempts: async () => ({ ok: true, value: attempts }),
    getReviewQueueItems: async () => ({ ok: true, value: reviews }),
    homePlanSnapshotReader: { read: async input => { captured.push({ now: input.now }); return null; } },
    loadCodingInterviewDashboard: async input => { captured.push(input); return null; },
    projectHomePractice: input => { captured.push(input); return { kind: 'none' }; },
    projectProgressEvidence: input => { captured.push({ attempts: input.trainingAttempts, reviews: input.reviewQueueItems, now: input.now }); return { capturedAt: input.now }; },
  });
  ui.render('home'); await settle();
  assert.ok(nodes(ui.render('home')).some(node => node.type === 'HomeTab'));
  assert.equal(captured.length, 4);
  for (const read of captured) assert.equal(read.now, '2026-10-15T10:00:00Z');
  for (const read of captured.slice(1)) { assert.equal(read.attempts, attempts); assert.equal(read.reviews, reviews); }
});
