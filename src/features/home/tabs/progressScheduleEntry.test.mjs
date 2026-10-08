import assert from 'node:assert/strict';
import test from 'node:test';
import { renderProgressPlanSection } from './progressPlanSectionTestHarness.mjs';

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
    button.props.onPress();
    assert.deepEqual(JSON.parse(JSON.stringify(actions)), [edit]);
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

test('Progress chapter rows humanize unknown IDs and keep curated titles first', () => {
  const rendered = renderProgressPlanSection(ready({
    trackId: 'backend-system-design-interview',
    completion: {
      kind: 'in_progress',
      completedChapterCount: 0,
      requiredChapterCount: 1,
      qualifyingAttemptCount: 0,
      requiredAttemptCount: 20,
      remainingAttemptCount: 20,
      chapters: [
        { nodeId: 'api_contracts_service_boundaries_and_request_flows', status: 'in_progress', reason: 'minimum_attempts_unmet', qualifyingAttemptCount: 0, requiredAttemptCount: 20 },
      ],
    },
    chapterAccess: [
      { nodeId: 'api_contracts_service_boundaries_and_request_flows', access: 'free' },
    ],
  }));
  const chapterList = rendered.byTestId('patternly:progress-plan:chapter-list');
  assert.ok(chapterList);
  const chapterText = rendered.textOf(chapterList);
  assert.ok(chapterText.includes('API Contracts Service Boundaries And Request Flows'));
  assert.ok(!chapterText.includes('api_contracts_service_boundaries_and_request_flows'));

  const curated = renderProgressPlanSection(ready({
    trackId: 'coding-interview-dsa-problem-solving',
    completion: { kind: 'in_progress', completedChapterCount: 0, requiredChapterCount: 1, qualifyingAttemptCount: 0, requiredAttemptCount: 20, remainingAttemptCount: 20, chapters: [{ nodeId: 'complexity_and_constraints', status: 'in_progress', reason: 'minimum_attempts_unmet', qualifyingAttemptCount: 0, requiredAttemptCount: 20 }] },
    chapterAccess: [{ nodeId: 'complexity_and_constraints', access: 'free' }],
  }));
  const curatedList = curated.byTestId('patternly:progress-plan:chapter-list');
  assert.ok(curatedList);
  assert.ok(curated.textOf(curatedList).includes('Complexity and constraints'));
  assert.ok(!curated.textOf(curatedList).includes('Complexity And Constraints'));
});
