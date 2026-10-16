import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { subject, nodes } from '../soloUi22TestHarness.mjs';
const require = createRequire(import.meta.url);
const { contentPackageRuntimeOwner } = require('../../../application/contentPackageRuntimeOwner.ts');
const { projectProgressEvidence } = require('../../../application/learningPlan/progressReadProjection.ts');
const { presentProgressEvidence } = require('./progressTabModel.ts');
const { getTrackDisplay, LAUNCH_TRACK_IDS } = require('../../../domain/index.ts');
const { runtimeSelectors } = require('../../../testing/runtimeSelectors.ts');
const Progress = subject('src/features/home/tabs/ProgressTab.tsx', 'ProgressTab', {
  ...Object.fromEntries(['View', 'Text', 'Button', 'Pressable', 'Icon', 'Card', 'ProgressPlanSection', 'ActivitySection'].map(name => [name, name])),
  useThemedStyles: () => ({}), createStyles: () => ({}), useAppPreferences: () => ({ colors: {}, locale: 'en' }), useState: () => [false, () => {}],
  useTranslation: () => ({ t: value => value }), presentProgressEvidence, runtimeSelectors, buildProgressPlanPresentationModel: () => ({ kind: 'unavailable' }),
});
const claude = 'claude-certified-architect-professional-certification';
const gcp = 'google-cloud-associate-cloud-engineer';
const project = (trackId, activityRecords = []) => projectProgressEvidence({ activeTrackId: trackId, activityRecords, trainingAttempts: [], reviewQueueItems: [], now: '2026-10-15T12:00:00.000Z' });
function text(tree) { return nodes(tree).filter(node => ['Text', 'Button'].includes(node.type)).flatMap(node => node.props.children).filter(value => typeof value === 'string').join(' '); }
const render = (trackId, evidence, onProgressAction = () => {}) => Progress({ activeTrack: getTrackDisplay(trackId), evidence, activityRecords: [], onProgressAction, onOpenPractice: () => {} });

test('all nine empty Progress screens consume their projected copy and action config', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  for (const trackId of LAUNCH_TRACK_IDS) {
    const evidence = project(trackId);
    const tree = render(trackId, evidence);
    assert.ok(text(tree).includes(evidence.emptyState.title), trackId);
    assert.ok(text(tree).includes(evidence.emptyState.description), trackId);
    assert.ok(text(tree).includes('Open Practice'), trackId);
    assert.equal(evidence.emptyState.reviewAction, false);
  }
});

test('captured historical activity is scoped to the selected track before empty copy is projected', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const foreign = project(claude, [{ session: { trackId: gcp } }]);
  assert.equal(foreign.hasRecordedActivity, false);
  assert.equal(foreign.emptyState.description, 'Complete a Practice session to begin building Progress.');
  const own = project(claude, [{ session: { trackId: claude } }]);
  assert.equal(own.hasRecordedActivity, true);
  assert.equal(own.emptyState.description, 'Earlier activity and reviews remain available.');
  assert.ok(text(render(claude, own)).includes('Earlier activity and reviews remain available.'));
});

test('shared Progress renders a supplied configured review action independently of provider ID', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const action = { kind: 'canonicalReviewQueue' };
  const base = project(gcp);
  const evidence = { ...base, emptyState: { title: 'Configured empty title', description: 'Configured empty description', reviewAction: true }, reviewAction: action, reviewActionLabel: 'Configured review' };
  const invoked = [];
  const tree = render(gcp, evidence, value => invoked.push(value));
  assert.ok(text(tree).includes('Configured empty title'));
  assert.ok(text(tree).includes('Configured empty description'));
  const button = nodes(tree).find(node => node.type === 'Button' && node.props.children === 'Configured review');
  assert.ok(button);
  button.props.onPress();
  assert.deepEqual(invoked, [action]);
  assert.ok(text(render(claude, { ...evidence, emptyState: { ...evidence.emptyState, reviewAction: false } })).includes('Open Practice'));
});
