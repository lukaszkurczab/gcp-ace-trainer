import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { subject, controlledHooks, nodes, settle, deferred } from './soloUi22TestHarness.mjs';
const require = createRequire(import.meta.url);
const { TARGET_LOCALES } = require('../../preferences/localeResolver.ts');
const { runtimeSelectors } = require('../../testing/runtimeSelectors.ts');
const domain = require('../../domain/index.ts');
const policies = require('../../domain/tracks/trackGoalPolicies.ts');
const { homePlanPlacement } = require('./tabs/homeTabModel.ts');
const { presentTargetDateGuidance } = require('../../application/learningPlan/targetDateGuidancePresentation.ts');
const trackId = 'aws-certified-solutions-architect-associate';
const track = domain.getTrackDisplay(trackId);
const goal = domain.createDefaultGoal(policies.requireGoalPolicy(trackId));
const guidance = {
  state: 'on_track', reason: 'on_track', tone: 'positive', messageKey: 'targetDateGuidance.onTrack',
  home: { primary: { kind: 'start_next_session', destination: 'Practice' } },
  progress: { primary: { kind: 'start_next_session', destination: 'Practice' }, secondary: null },
  facts: { requiredPace: { kind: 'numeric', value: 4, unit: 'questions_per_week' }, actualPace: { kind: 'numeric', value: 5, unit: 'questions_per_week' }, forecast: { kind: 'date', value: '2026-11-10' }, target: { kind: 'date', value: '2026-11-15' } },
};
const tags = Object.fromEntries(['Fragment','View','Text','Pressable','Button','Card','Icon','Screen','EmptyState','IconButton','KeyboardAvoidingView','SettingsBottomSheet','CreateGoalForm','ActiveGoalSummary','GoalLoadingSkeleton','MistakesReviewView','MistakesLoadingSkeleton','SectionList','SectionHeader','Badge','ReviewQueueDetail','ReviewPresentationRow'].map(name => [name, name]));
const common = {
  ...tags, runtimeSelectors, createStyles: () => ({}), useThemedStyles: () => ({}),
  useRef: current => ({ current }), markStartup: () => {},
  useWindowDimensions: () => ({ fontScale: 1, width: 400 }),
  useAppPreferences: () => ({ colors: {}, locale: 'en' }),
  useTranslation: () => ({ t: key => key, i18n: { language: 'en', resolvedLanguage: 'en' } }),
  describeOperationalFailure: (_error, fallback) => fallback,
};

// Execute the production fence against an opaque, controlled storage scope.
function profileFence() {
  let scope = {}, transitioning = false;
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync('src/application/profileReadFence.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: () => ({ readLearningPlanStorageScope: () => {
    if (transitioning) throw Error('transition');
    return scope;
  } }) });
  return { captureProfileReadFence: module.exports.captureProfileReadFence, switchProfile: () => { scope = {}; }, transition: () => { transitioning = true; } };
}

for (const locale of TARGET_LOCALES) for (const panel of ['primary', 'secondary']) {
  test(`Home ${panel} passes ${locale} from preferences to actual presenter and renders its label`, () => {
    const hooks = controlledHooks(), calls = [];
    const home = subject('src/features/home/tabs/HomeTab.tsx', 'HomeTab', {
      ...common, ...hooks.bindings, useAppPreferences: () => ({ colors: {}, locale }),
      // Deliberately leave i18n language at en: preferences is the canonical presenter input.
      presentTargetDateGuidance: input => { calls.push(input); return presentTargetDateGuidance(input); },
      homePlanPlacement, buildHomeTabModel: () => ({ recommendations: [], heroTitle: 'Focus', heroSubtitle: 'Practice', primaryLabel: 'Start', topicId: 'topic' }),
      contentPackageRuntimeOwner: { getPreparedDiscovery: () => ({ track: { trackId } }) },
      selectSingleCase: () => panel === 'secondary' ? { recipe: { caseId: 'case', title: 'Case', steps: [1], initialEstimatedSeconds: 60 }, nodeId: 'node' } : null,
      getApplicationCurrentTime: () => '2026-10-15T10:00:00Z',
      buildHomeOverviewMetrics: () => [], getTrackIconName: () => 'cloud', localizeHomePlanArea: () => 'Area',
      formatPracticeTopicTitle: value => value, formatPracticeTopicDetail: value => value,
      FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID: 'frontend-system-design-interview', modeLabel: () => 'Practice',
    });
    const homePlan = { kind: 'ready', guidance, plan: { timezone: 'Europe/Warsaw' }, chapterAccess: [], session: { sessionLength: 10 }, day: { status: 'scheduled' }, dueReviewCount: 0 };
    const element = hooks.render(home, { activeTrack: track, activeSession: null, homePlan, trainingAttempts: [], reviewQueueItems: [] });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].locale, locale);
    const expected = presentTargetDateGuidance({ guidance, locale, timezone: homePlan.plan.timezone });
    assert.ok(nodes(element).some(node => node.props.children === expected.stateLabel));
  });
}

function screen(kind, ports = {}) {
  const hooks = controlledHooks(), fence = profileFence();
  const bindings = { ...common, ...hooks.bindings, ...fence,
    getActiveTrackId: async () => trackId, loadActiveTrackId: async () => trackId,
    loadTrackReviewQueueViewModel: async () => ({ id: 'new' }),
    buildReviewQueueScreenModel: value => ({ ...value, dueRows: [], upcomingRows: [], unavailableRows: [] }),
    loadGoal: async () => goal, loadLearningPlan: async () => null,
    ...domain, ...policies, useNotificationSettings: () => ({ loading: false, trackId, status: 'disabled' }),
    ROUTES: { HOME: 'Home' }, Platform: { OS: 'ios' }, ...ports,
  };
  const fn = kind === 'review'
    ? subject('src/features/review/MistakesReviewScreen.tsx', 'MistakesReviewScreen', bindings)
    : subject('src/features/home/GoalCadenceScreen.tsx', 'GoalCadenceScreen', bindings);
  const props = { navigation: { canGoBack: () => false, navigate() {} }, route: { params: {} } };
  const render = () => hooks.render(fn, props);
  function errorAction(element) {
    if (kind === 'review') {
      const view = subject('src/features/review/MistakesReviewView.tsx', 'MistakesReviewView', { ...common, useMemo: fn => fn() });
      return nodes(view(element.props)).find(node => node.type === 'EmptyState' && node.props.actionLabel);
    }
    return nodes(element).find(node => node.type === 'EmptyState' && node.props.actionLabel);
  }
  return { hooks, fence, render, errorAction, props, ready: element => kind === 'review' ? element.props.model !== null : nodes(element).some(node => ['CreateGoalForm', 'ActiveGoalSummary'].includes(node.type)) };
}
for (const kind of ['review', 'cadence']) {
  test(`${kind}: read failure → actual EmptyState Retry → loading → success on same screen`, async () => {
    let attempts = 0;
    const retry = deferred();
    const port = async () => { if (++attempts === 1) throw Error('read failure'); return retry.promise; };
    const ui = screen(kind, kind === 'review' ? { loadTrackReviewQueueViewModel: port } : { loadGoal: port });
    ui.render(); await settle();
    const action = ui.errorAction(ui.render());
    assert.equal(action.props.actionLabel, 'Try again');
    action.props.onActionPress();
    ui.render();
    assert.equal(ui.errorAction(ui.render()), undefined, 'retry disappears while pending');
    await settle(); assert.equal(attempts, 2);
    retry.resolve(kind === 'review' ? { id: 'success' } : goal);
    await settle();
    assert.ok(ui.ready(ui.render()));
    assert.equal(attempts, 2, 'no automatic retry');
  });
  for (const stage of ['track', 'data']) for (const stale of ['unmount', 'profile_switch', 'transition']) for (const outcome of ['success', 'error']) {
    test(`${kind}: discards ${outcome} after ${stale} during ${stage} read`, async () => {
      const wait = deferred(); let downstream = 0;
      const ports = stage === 'track' ? {
        loadActiveTrackId: () => wait.promise, getActiveTrackId: () => wait.promise,
        loadGoal: async () => { downstream++; return goal; }, loadTrackReviewQueueViewModel: async () => { downstream++; return {}; },
      } : kind === 'review' ? { loadTrackReviewQueueViewModel: () => wait.promise } : { loadGoal: () => wait.promise };
      const ui = screen(kind, ports);
      ui.render(); await settle();
      if (stale === 'unmount') ui.hooks.unmount();
      else if (stale === 'profile_switch') ui.fence.switchProfile();
      else ui.fence.transition();
      const before = ui.hooks.publications;
      if (outcome === 'error') wait.reject(Error('private old failure'));
      else wait.resolve(stage === 'track' ? trackId : kind === 'review' ? { id: 'old' } : goal);
      await settle();
      assert.equal(ui.hooks.publications, before, 'no stale state publication');
      if (stage === 'track') assert.equal(downstream, 0, 'no next-profile data read');
    });
  }
  test(`${kind}: valid no-track state has no Retry`, async () => {
    const ui = screen(kind, { getActiveTrackId: async () => null, loadActiveTrackId: async () => null });
    ui.render(); await settle();
    assert.equal(ui.errorAction(ui.render()), undefined);
  });
}

for (const kind of ['review', 'cadence']) {
  test(`${kind}: a newer read owns publication when an older request finishes late`, async () => {
    const old = deferred(); let count = 0;
    const port = () => ++count === 1 ? old.promise : Promise.resolve(kind === 'review' ? { id: 'current' } : goal);
    const ui = screen(kind, kind === 'review' ? { loadTrackReviewQueueViewModel: port } : { loadGoal: port });
    const initial = ui.render(); await settle();
    if (kind === 'review') initial.props.onRetry();
    else ui.props.route.params = { trackId: 'google-cloud-associate-cloud-engineer' };
    ui.render(); await settle();
    assert.ok(ui.ready(ui.render()));
    const before = ui.hooks.publications;
    old.resolve(kind === 'review' ? { id: 'stale' } : goal);
    await settle();
    assert.equal(ui.hooks.publications, before);
    if (kind === 'review') assert.equal(ui.render().props.model.id, 'current');
  });
  test(`${kind}: failure to capture a profile fence exposes a safe error and explicit Retry`, async () => {
    let reads = 0;
    const ui = screen(kind, {
      captureProfileReadFence: () => { throw Error('profile transition'); },
      getActiveTrackId: async () => { reads++; return trackId; },
      loadActiveTrackId: async () => { reads++; return trackId; },
    });
    ui.render(); await settle();
    assert.ok(ui.errorAction(ui.render()));
    assert.equal(reads, 0);
  });
}
