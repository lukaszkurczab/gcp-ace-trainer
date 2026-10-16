import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { subject, nodes } from '../home/soloUi22TestHarness.mjs';
const require = createRequire(import.meta.url);
const { TRACK_DENSITY_DESCRIPTORS, DEFAULT_TRACK_QUESTION_PRESENTATION, findTrackDescriptor, isSupportedTrackQuestionPresentation, resolveTrackDomainMetadata } = require('../../domain/tracks/trackAdmission.ts');
const { projectCertificationQuestionPresentation } = require('../../application/certification/certificationQuestionPresentation.ts');
const { runtimeSelectors } = require('../../testing/runtimeSelectors.ts');
const common = {
  View: 'View', Text: 'Text', createStyles: () => ({}),
  useThemedStyles: () => ({ prompt: 'defaultPrompt', structuredPrompt: 'structuredPrompt' }),
  useTranslation: () => ({ t: value => value }), useWindowDimensions: () => ({ fontScale: 1 }),
  runtimeSelectors, DEFAULT_TRACK_QUESTION_PRESENTATION, isSupportedTrackQuestionPresentation,
};
const Card = subject('src/features/practice/PracticeQuestionCard.tsx', 'PracticeQuestionCard', common);
const Surface = subject('src/features/practice/PracticeSessionSurface.tsx', 'PracticeSessionSurface', {
  ...common, useRef: current => ({ current }), allowsPracticeResponseEditing: () => true, allowsPracticeFeedback: () => true,
  PracticeQuestionCard: 'PracticeQuestionCard', PracticeResponseControls: 'PracticeResponseControls', SessionShell: 'SessionShell',
  PracticeFeedbackBlock: 'PracticeFeedbackBlock', ActionBar: 'ActionBar',
});
const question = { itemId: 'item', prompt: 'Authored question?', constraints: ['Authored constraint'], responseControl: {} };

test('usable prompt timing requires laid-out answerable content and emits once per mounted surface', () => {
  for (const [phase, editable, presentation, exit, expected] of [
    ['unanswered', true, DEFAULT_TRACK_QUESTION_PRESENTATION, 'none', 1],
    ['feedback', true, DEFAULT_TRACK_QUESTION_PRESENTATION, 'none', 0],
    ['unanswered', false, DEFAULT_TRACK_QUESTION_PRESENTATION, 'none', 0],
    ['unanswered', true, { ...DEFAULT_TRACK_QUESTION_PRESENTATION, variant: 'futureVariant' }, 'none', 0],
    ['unanswered', true, DEFAULT_TRACK_QUESTION_PRESENTATION, 'leave', 0],
  ]) {
    const stages = [];
    const measured = subject('src/features/practice/PracticeSessionSurface.tsx', 'PracticeSessionSurface', {
      ...common, useRef: current => ({ current }), markStartup: stage => stages.push(stage),
      allowsPracticeResponseEditing: () => true, allowsPracticeFeedback: () => false,
      PracticeQuestionCard: 'PracticeQuestionCard', PracticeResponseControls: 'PracticeResponseControls', SessionShell: 'SessionShell', ActionBar: 'ActionBar', ExitModal: 'ExitModal',
    });
    const tree = measured({ question: { ...question, presentation }, phase, responseEditable: editable, exit: { kind: exit },
      runtimeIdentity: { trackId: 'coding-interview-dsa-problem-solving', itemId: 'item', sessionId: 'session', ordinal: 2, actualLength: 10, modeId: 'practice', roadmapNodeId: 'node' } });
    const layout = nodes(tree).find(node => node.props.onLayout)?.props.onLayout;
    assert.equal(stages.length, 0);
    layout(); layout();
    assert.deepEqual(stages, Array(expected).fill('practice_usable_layout'));
  }
});
function render(presentation, trackId = 'test-provider-independent') {
  const tree = Surface({ question: { ...question, ...(presentation ? { presentation } : {}) }, phase: 'feedback', exit: { kind: 'none' }, feedback: {}, feedbackItem: {},
    runtimeIdentity: { trackId, itemId: 'item', sessionId: 'session', ordinal: 1, actualLength: 10, modeId: 'practice', roadmapNodeId: 'node', feedbackTiming: 'afterEachAnswer' },
  });
  const card = nodes(tree).find(node => node.type === 'PracticeQuestionCard');
  return { tree, card: Card(card.props), config: card.props.presentation, controls: nodes(tree).filter(node => node.type === 'PracticeResponseControls') };
}
function text(tree) { return nodes(tree).filter(node => node.type === 'Text').flatMap(node => node.props.children).filter(value => typeof value === 'string').join(' '); }

test('all nine descriptors render existing question layouts and constraints policy', () => {
  assert.equal(TRACK_DENSITY_DESCRIPTORS.length, 9);
  for (const descriptor of TRACK_DENSITY_DESCRIPTORS) {
    const config = projectCertificationQuestionPresentation(descriptor);
    const output = render(config, descriptor.trackId);
    assert.equal(output.controls.length, 1, descriptor.trackId);
    assert.ok(text(output.card).includes(question.prompt));
    assert.equal(text(output.card).includes(question.constraints[0]), config.constraints === 'show');
    assert.equal(text(output.card).includes('Key constraints'), config.constraints === 'show' && config.variant === 'structuredCertificationPrompt');
    assert.equal(!!output.tree.props.scrollFocus, config.focusFeedback);
    const prompt = nodes(output.card).find(node => node.props.children === question.prompt);
    assert.equal(prompt.props.style.includes('structuredPrompt'), config.variant === 'structuredCertificationPrompt');
  }
});

test('a new descriptor selects the supported layout without any provider-ID branch', () => {
  const descriptor = { presentation: { practiceQuestion: { variant: 'structuredCertificationPrompt', constraints: 'show', focusFeedback: true }, roadmapNodeIds: ['test_domain'], progressDomains: [{ id: 'test_domain', title: 'Test domain', description: 'Test description' }] } };
  const output = render(projectCertificationQuestionPresentation(descriptor), 'new-certification');
  assert.ok(text(output.card).includes('Key constraints'));
  assert.ok(text(output.card).includes('Authored constraint'));
  assert.equal(output.controls.length, 1);
  assert.equal(resolveTrackDomainMetadata(descriptor, 'test_domain').metadata.title, 'Test domain');
  // A familiar provider ID cannot override the supplied contract, including no config.
  const claude = 'claude-certified-architect-professional-certification';
  assert.equal(render(undefined, claude).config.variant, 'default');
  assert.equal(render(descriptor.presentation.practiceQuestion, 'google-cloud-associate-cloud-engineer').config.variant, 'structuredCertificationPrompt');
});

test('unsupported layouts render explicit unavailable without prompt, constraints, or response controls', () => {
  const invalid = { ...DEFAULT_TRACK_QUESTION_PRESENTATION, variant: 'futureVariant' };
  const output = render(invalid, 'claude-certified-architect-professional-certification');
  assert.equal(text(output.card), 'Practice interaction unavailable');
  assert.equal(output.controls.length, 0);
  assert.equal(output.tree.props.scrollFocus, undefined);
  assert.throws(() => projectCertificationQuestionPresentation({ presentation: { practiceQuestion: invalid } }), error => error.code === 'missing_content');
  assert.throws(() => projectCertificationQuestionPresentation(undefined), error => error.code === 'missing_content');
});

test('missing/cross-track metadata never becomes a GCP label', () => {
  for (const descriptor of [undefined, { presentation: undefined }, findTrackDescriptor('aws-certified-solutions-architect-associate'), findTrackDescriptor('claude-certified-architect-professional-certification')]) {
    assert.deepEqual(resolveTrackDomainMetadata(descriptor, 'operations'), { kind: 'unavailable', id: 'operations' });
  }
  assert.equal(resolveTrackDomainMetadata(findTrackDescriptor('google-cloud-associate-cloud-engineer'), 'operations').metadata.title, 'Ensuring successful operation of a cloud solution');
});

test('Certification admission checks the prepared package for GCP and a new configured track equally', () => {
  const checked = [];
  const resolve = subject('src/features/practice/practiceFlowModel.ts', 'resolvePracticeFlowRegistration', {
    contentPackageRuntimeOwner: { getPreparedDiscovery(id) { checked.push(id); if (id === 'missing') throw new Error('missing'); return {}; } },
    UnsupportedTrackError: class extends Error {},
  });
  for (const id of ['google-cloud-associate-cloud-engineer', 'new-certification']) assert.equal(resolve({ id, familyId: 'certification' }), 'certification');
  assert.deepEqual(checked, ['google-cloud-associate-cloud-engineer', 'new-certification']);
  assert.throws(() => resolve({ id: 'missing', familyId: 'certification' }));
});

test('Practice missing topic metadata cannot acquire GCP domain labels', () => {
  for (const kind of ['certification', 'design_interview']) {
    const topic = subject('src/features/practice/practiceFlowModel.ts', 'getCurrentPracticeTopic', {
      resolvePracticeFlowTrack: () => ({ kind, display: { shortTitle: 'Test track' } }),
      getCanonicalFreePracticeNodeId: () => 'operations', getTrackRoadmapCatalog: () => [],
    });
    assert.equal(topic({ id: 'new-track' }).title.value, 'Domain metadata unavailable');
  }
});
