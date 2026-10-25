import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { subject } from '../home/soloUi22TestHarness.mjs';

const require = createRequire(import.meta.url);
const React = require('react');
const { act, create } = require('react-test-renderer');
const { contentPackageRuntimeOwner } = require('../../application/contentPackageRuntimeOwner.ts');
const { buildTrackReviewQueueViewModel } = require('../../application/reviewQueueQueries.ts');
const { buildReviewQueueScreenModel } = require('./reviewQueueModel.ts');
const { runtimeSelectors } = require('../../testing/runtimeSelectors.ts');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mount the actual view using React, with SectionList as an inspectable native
// host. This verifies sections/keys/row callbacks, not native windowing/layout.
const View = subject('src/features/review/MistakesReviewView.tsx', 'MistakesReviewView', {
  ...Object.fromEntries('Screen SectionList View Text Card SectionHeader Badge EmptyState MistakesLoadingSkeleton ReviewQueueDetail ReviewPresentationRow'.split(' ').map(name => [name, name])),
  useThemedStyles: () => ({}), createStyles: () => ({}),
  useAppPreferences: () => ({ locale: 'en' }), useTranslation: () => ({ t: value => value }),
  formatReviewTaxonomyLabel: value => value.value, formatDueAt: value => value,
  formatStatus: value => value, getStatusTone: () => 'neutral', runtimeSelectors,
});

test('built material flows through the real Review view SectionList without moving unavailable or manual rows', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const { track } = await contentPackageRuntimeOwner.resolveForDiscovery('google-cloud-associate-cloud-engineer', 'certification');
  const question = track.questions[0];
  const entry = {
    id: 'due', trackId: track.trackId, sourceAttemptId: 'attempt', sourceSessionId: 'session',
    sourceItem: { trackId: track.trackId, questionId: 'removed-A', contentVersion: 'old', artifactSha256: 'e'.repeat(64) },
    taxonomyOrSkillRefs: [{ axisId: 'node', nodeId: question.nodeId }, { axisId: 'mental_unit', nodeId: question.mentalUnitId }],
    reasons: ['incorrect'], dueAt: '2026-10-24T00:00:00.000Z', createdAt: '2026-10-23T00:00:00.000Z',
    consecutiveAfterDueSuccesses: 0, persistent: true, policyVersion: 'bizq04-v1', stage: 'repair24', status: 'active',
  };
  const queue = await buildTrackReviewQueueViewModel({ trackId: track.trackId, now: '2026-10-25T12:00:00.000Z', reviewQueueItems: [
    entry,
    { ...entry, id: 'manual', reasons: ['manual_mark'], manualRequestId: `manual:${'b'.repeat(64)}`, dueAt: '2026-10-27T00:00:00.000Z' },
    { ...entry, id: 'upcoming', dueAt: '2026-10-26T00:00:00.000Z' },
    { ...entry, id: 'unavailable', taxonomyOrSkillRefs: [] },
  ] });
  const model = buildReviewQueueScreenModel(queue), selected = [], confirms = [];
  const props = { model, visibleRows: model.dueRows, selectedRow: null, loading: false, readError: null, hasActiveTrack: true,
    confirmRemoveUnavailable: false, removingUnavailable: false, onSelectRow: id => selected.push(id), onConfirmRemoveChange: value => confirms.push(value), onRemoveUnavailable() {}, onRetry() {} };
  let tree;
  await act(async () => { tree = create(React.createElement(View, props)); });
  const list = tree.root.findByType('SectionList').props;
  assert.deepEqual(Array.from(list.sections, section => section.key), ['available', 'unavailable']);
  assert.deepEqual(Array.from(list.sections[0].data, row => row.id), ['due', 'manual']);
  assert.deepEqual(Array.from(list.sections[1].data, row => row.id), ['unavailable']);
  assert.deepEqual(model.upcomingRows.map(row => row.id), ['upcoming']);
  assert.equal(queue.dueItems[0].questionId, question.questionId);
  assert.equal(queue.dueItems[0].prompt, question.prompt);
  assert.equal(model.dueRows[1].status, 'requested');
  for (const section of list.sections) for (const row of section.data) {
    assert.equal(list.keyExtractor(row), row.id);
    const rendered = list.renderItem({ item: row, section });
    assert.equal(rendered.props.testID, section.unavailable ? runtimeSelectors.review.unavailableRow(row.id) : undefined);
    rendered.props.onPress();
  }
  assert.deepEqual(selected, ['due', 'manual', 'unavailable']);
  assert.deepEqual(confirms, [false, false, false]);
  await act(async () => tree.update(React.createElement(View, { ...props, visibleRows: model.upcomingRows })));
  assert.deepEqual(Array.from(tree.root.findByType('SectionList').props.sections[0].data, row => row.id), ['upcoming']);
  await act(async () => tree.update(React.createElement(View, { ...props, readError: 'unavailable' })));
  assert.equal(tree.root.findByType('SectionList').props.sections.length, 0);
  await act(async () => tree.unmount());
});
