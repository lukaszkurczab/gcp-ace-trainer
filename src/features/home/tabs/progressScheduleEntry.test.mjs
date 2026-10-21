import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { renderProgressPlanSection } from './progressPlanSectionTestHarness.mjs';

const require = createRequire(import.meta.url);
const { buildProgressPlanPresentationModel } = require('../progressPlanPresentationModel.ts');
const { projectTargetDateGuidance } = require('../../../application/learningPlan/index.ts');
const { createDefaultGoal } = require('../../../domain/index.ts');
const { requireGoalPolicy } = require('../../../domain/tracks/trackGoalPolicies.ts');
const { runtimeSelectors } = require('../../../testing/runtimeSelectors.ts');

const selector = 'patternly:progress-plan:edit-schedule';
const edit = { kind: 'adjust_schedule', destination: 'LearningPlanEditor' };
const resume = { kind: 'resume_plan', destination: 'LearningPlanEditor' };
const primary = { kind: 'continue_plan', destination: 'Practice' };
function ready(overrides = {}) {
  return {
    kind: 'ready', trackId: 'google-cloud-associate-cloud-engineer',
    guidance: { state: 'open_ended', reason: 'no_target', tone: 'neutral', stateLabel: 'Open-ended', message: 'Keep learning at your own pace.', facts: [], primaryLabel: 'Continue plan', secondaryLabel: null },
    completion: { kind: 'unknown', reason: 'missing_rule' },
    day: { status: 'scheduled' }, activeSession: null,
    session: { areaLabel: 'Track', sessionLength: 40 },
    primaryAction: primary, secondaryAction: null,
    ...overrides,
  };
}

test('verified ready plan exposes existing edit action in all seven locales, independent of completion rule', () => {
  for (const locale of ['en', 'pl', 'de', 'es', 'fr', 'it', 'et']) {
    const actions = [];
    const rendered = renderProgressPlanSection(ready(), { locale, onAction: action => actions.push(action), fontScale: 2 });
    const button = rendered.byTestId(selector);
    assert.ok(button, `${locale}: missing saved schedule entry`);
    assert.equal(button.type, 'Button');
    assert.equal(rendered.textOf(button), rendered.i18n.t('Edit schedule', { ns: 'learningPlan' }));
    assert.ok(rendered.i18n.exists('Edit schedule', { ns: 'learningPlan', lng: locale }));
    assert.ok(rendered.byTestId('patternly:progress-plan:completion:unknown'));
    assert.ok(rendered.text.includes(rendered.i18n.t('The package’s full completion contract is unavailable.', { ns: 'learningPlan' })));
    button.props.onPress();
    assert.deepEqual(JSON.parse(JSON.stringify(actions)), [edit]);
  }
});

test('no goal and no plan retain one explanation and their action without empty facts or completion in all locales', () => {
  const trackId = 'coding-interview-dsa-problem-solving';
  const goal = { record: createDefaultGoal(requireGoalPolicy(trackId)), revision: 1 };
  for (const currentGoal of [null, goal]) for (const locale of ['en', 'pl', 'de', 'es', 'fr', 'it', 'et']) {
    const guidance = projectTargetDateGuidance({
      currentGoal, acceptedPlan: null, currentVerifiedArtifactSha256: 'a'.repeat(64),
      c3Result: 'in_progress', today: '2026-10-17',
      completedFacts: { sessions: [], attempts: [] }, paceForecast: { kind: 'unavailable', reason: 'no_target' },
    });
    const model = buildProgressPlanPresentationModel({ activeTrackId: trackId, locale, snapshot: { kind: 'none', trackId, goal: currentGoal, guidance } });
    assert.equal(model.kind, 'none');
    const actions = [];
    const rendered = renderProgressPlanSection(model, { locale, fontScale: 2, onAction: action => actions.push(action) });
    const message = rendered.byTestId(runtimeSelectors.targetDateGuidance.reason('progress', model.guidance.reason));
    assert.ok(message);
    assert.equal(rendered.textOf(message), model.guidance.message);
    assert.equal(rendered.text.split(model.guidance.message).length - 1, 1);
    assert.equal(rendered.nodes.filter(node => node.props.testID?.startsWith('patternly:progress-plan:completion:')).length, 0);
    for (const fact of ['required-pace', 'actual-pace', 'forecast', 'target']) {
      assert.equal(rendered.byTestId(runtimeSelectors.targetDateGuidance.fact(fact)), undefined);
    }
    const button = rendered.byTestId('patternly:target-date-guidance:primary:progress');
    assert.ok(button);
    button.props.onPress();
    assert.deepEqual(actions, [model.primaryAction]);
    assert.equal(actions[0].kind, currentGoal ? 'create_plan' : 'set_goal');
    assert.equal(actions[0].destination, currentGoal ? 'LearningPlanProposal' : 'GoalCadence');
  }
});

test('existing editor/resume guidance actions are never duplicated', () => {
  for (const action of [edit, resume]) for (const position of ['primaryAction', 'secondaryAction']) {
    const rendered = renderProgressPlanSection(ready({ [position]: action }), { onAction: () => {} });
    assert.equal(rendered.byTestId(selector), undefined);
    assert.ok(rendered.byTestId(position === 'primaryAction' ? 'patternly:target-date-guidance:primary:progress' : 'patternly:target-date-guidance:secondary'));
  }
});

test('absent/unavailable plan or absent handler does not expose the editor entry', () => {
  const none = ready({ kind: 'none', completion: { kind: 'unknown', reason: 'missing_rule' } });
  assert.equal(renderProgressPlanSection(none, { onAction: () => {} }).byTestId(selector), undefined);
  for (const reason of ['identity_mismatch', 'calculation_error', 'invalid_request']) {
    assert.equal(renderProgressPlanSection({ kind: 'unavailable', reason }, { onAction: () => {} }).byTestId(selector), undefined);
  }
  assert.equal(renderProgressPlanSection(ready()).byTestId(selector), undefined);
});

test('opening editor from Progress does not mutate model, active session or primary guidance', () => {
  const activeSession = Object.freeze({ id: 'active:existing' });
  const model = ready({ activeSession, primaryAction: null });
  const before = JSON.stringify(model), actions = [];
  const rendered = renderProgressPlanSection(model, { onAction: action => actions.push(action) });
  const button = rendered.byTestId(selector);
  assert.ok(button);
  button.props.onPress();
  assert.equal(JSON.stringify(model), before);
  assert.equal(model.activeSession, activeSession);
  assert.deepEqual(JSON.parse(JSON.stringify(actions)), [edit]);
  assert.equal(rendered.byTestId('patternly:target-date-guidance:primary:progress'), undefined);
});

test('Progress chapter rows show missing metadata explicitly and keep curated titles first', () => {
  const rendered = renderProgressPlanSection(ready({
    trackId: 'backend-system-design-interview',
    completion: {
      kind: 'in_progress',
      completedChapterCount: 0,
      requiredChapterCount: 1,
      qualifyingAttemptCount: 0,
      requiredAttemptCount: 20,
      remainingAttemptCount: 20,
      coverageDeficit: 0,
      minimumAdditionalAttemptCount: 20,
      chapters: [
        { nodeId: 'api_contracts_service_boundaries_and_request_flows', mentalUnitCount: 1, status: 'in_progress', reason: 'minimum_attempts_unmet', qualifyingAttemptCount: 0, requiredAttemptCount: 20,
          remainingAttemptCount: 20, coverageDeficit: 0, minimumAdditionalAttemptCount: 20, coverage: [], qualityRequirementUnmet: null, rollingWindowSize: 20, qualityThreshold: 0.8, quality: null },
      ],
    },
    chapterAccess: [
      { nodeId: 'api_contracts_service_boundaries_and_request_flows', access: 'free' },
    ],
  }));
  const chapterList = rendered.byTestId('patternly:progress-plan:chapter-list');
  assert.ok(chapterList);
  const chapterText = rendered.textOf(chapterList);
  assert.ok(chapterText.includes('Domain metadata unavailable'));
  assert.ok(!chapterText.includes('API Contracts Service Boundaries And Request Flows'));
  assert.ok(!chapterText.includes('api_contracts_service_boundaries_and_request_flows'));

  const curated = renderProgressPlanSection(ready({
    trackId: 'coding-interview-dsa-problem-solving',
    completion: { kind: 'in_progress', completedChapterCount: 0, requiredChapterCount: 1, qualifyingAttemptCount: 0, requiredAttemptCount: 20, remainingAttemptCount: 20, coverageDeficit: 0, minimumAdditionalAttemptCount: 20,
      chapters: [{ nodeId: 'complexity_and_constraints', mentalUnitCount: 1, status: 'in_progress', reason: 'minimum_attempts_unmet', qualifyingAttemptCount: 0, requiredAttemptCount: 20, remainingAttemptCount: 20,
        coverageDeficit: 0, minimumAdditionalAttemptCount: 20, coverage: [], qualityRequirementUnmet: null, rollingWindowSize: 20, qualityThreshold: 0.8, quality: null }] },
    chapterAccess: [{ nodeId: 'complexity_and_constraints', access: 'free' }],
  }));
  const curatedList = curated.byTestId('patternly:progress-plan:chapter-list');
  assert.ok(curatedList);
  assert.ok(curated.textOf(curatedList).includes('Complexity and constraints'));
  assert.ok(!curated.textOf(curatedList).includes('Complexity And Constraints'));
});

test('Progress shows an explicit unit-coverage deficit and keeps unmeasured quality distinct', () => {
  const coverage = renderProgressPlanSection(ready({
    trackId: 'coding-interview-dsa-problem-solving',
    completion: {
      kind: 'in_progress', completedChapterCount: 0, requiredChapterCount: 1, qualifyingAttemptCount: 20,
      requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 1, minimumAdditionalAttemptCount: 1,
      chapters: [{ nodeId: 'complexity_and_constraints', mentalUnitCount: 1, status: 'in_progress', reason: 'coverage_unmet',
        qualifyingAttemptCount: 20, requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 1, minimumAdditionalAttemptCount: 1,
        coverage: [{ mentalUnitId: 'private-internal-unit-id', requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 3, deficit: 1 }],
        rollingWindowSize: 20, qualityThreshold: 0.8, quality: null, qualityRequirementUnmet: null }],
    },
    chapterAccess: [{ nodeId: 'complexity_and_constraints', access: 'free' }],
  }));
  const chapterText = coverage.textOf(coverage.byTestId('patternly:progress-plan:chapter-list'));
  assert.match(chapterText, /Required topic questions remaining: 1/u);
  assert.doesNotMatch(chapterText, /Chapter attempts remaining: 0/u);
  assert.doesNotMatch(chapterText, /private-internal-unit-id/u);

  const unknownQuality = renderProgressPlanSection(ready({
    completion: {
      kind: 'in_progress', completedChapterCount: 0, requiredChapterCount: 1, qualifyingAttemptCount: 20,
      requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 0, minimumAdditionalAttemptCount: 0,
      chapters: [{ nodeId: 'chapter', mentalUnitCount: 1, status: 'in_progress', reason: 'quality_unmet',
        qualifyingAttemptCount: 20, requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 0, minimumAdditionalAttemptCount: 0,
        coverage: [], rollingWindowSize: 20, qualityThreshold: 0.8, quality: null, qualityRequirementUnmet: null }],
    }, chapterAccess: [{ nodeId: 'chapter', access: 'free' }],
  }));
  const unknownText = unknownQuality.textOf(unknownQuality.byTestId('patternly:progress-plan:chapter-list'));
  assert.match(unknownText, /Recent accuracy is not yet measurable/u);
  assert.doesNotMatch(unknownText, /Recent chapter accuracy is below/u);
});
