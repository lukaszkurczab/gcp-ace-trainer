import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { act, create } = require('react-test-renderer');
const { contentPackageRuntimeOwner } = require('../../../application/contentPackageRuntimeOwner.ts');
const { projectProgressEvidence } = require('../../../application/learningPlan/progressReadProjection.ts');
const { createTrainingAttempt, getTrackDisplay } = require('../../../domain/index.ts');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const coding = 'coding-interview-dsa-problem-solving';
const cloud = 'google-cloud-associate-cloud-engineer';
const now = '2026-10-25T12:00:00.000Z';

// Real React mounts the complete production module. Only native/UI ports are
// replaced; presentation, activity sorting and weekly serialization stay real.
function loadProgress() {
  const counts = { present: 0, weekly: 0, weeklyRecords: 0 };
  let lastModel, locale = 'en';
  function load(path, replace) {
    const filename = resolve(path), localRequire = createRequire(filename), module = { exports: {} };
    const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    }}).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: name => replace(name, localRequire) }, { filename });
    return module.exports;
  }
  const model = load('src/features/home/tabs/progressTabModel.ts', (name, req) => {
    const actual = req(name);
    if (name !== '../../../application/activityReadModels') return actual;
    return { ...actual, projectWeeklySessionActivity(records, context) {
      counts.weekly++; counts.weeklyRecords += records.length;
      return actual.projectWeeklySessionActivity(records, context);
    } };
  });
  const hosts = names => Object.fromEntries(names.split(' ').map(name => [name, name]));
  const ui = load('src/features/home/tabs/ProgressTab.tsx', (name, req) => {
    if (name === './progressTabModel') return { ...model, presentProgressEvidence(...args) {
      counts.present++; lastModel = model.presentProgressEvidence(...args); return lastModel;
    } };
    if (name === 'react-native') return { ...hosts('View Text Pressable'), StyleSheet: { create: value => value }, useWindowDimensions: () => ({ fontScale: 1 }) };
    if (name === 'react-native-svg') return { default: 'Svg', ...hosts('Circle Polyline') };
    if (name === '../../../components') return { ...hosts('Button Card EmptyState Icon IconTile InfoBlock ProgressBar SkeletonShape'), useSkeletonGlassMotion: () => ({}) };
    if (name === '../../../preferences') return { useThemedStyles: () => ({ activityChevron: {} }), useAppPreferences: () => ({ colors: {}, locale }) };
    if (name === 'react-i18next') return { useTranslation: () => ({ t: value => value }) };
    if (name === '../../../theme') return {};
    return req(name);
  });
  return { Progress: ui.ProgressTab, counts, model: () => lastModel, locale: value => { locale = value; } };
}

function records(count, trackId = coding) {
  return Array.from({ length: count }, (_, index) => ({
    attemptCount: 1, latestAttemptAt: null, result: null, scopeRefs: [],
    session: {
      id: `history:${index}`, trackId: index % 4 === 3 ? cloud : trackId,
      modeId: 'coding-interview-guided-practice', status: index % 5 === 4 ? 'abandoned' : 'completed',
      startedAt: '2026-10-24T09:00:00.000Z', completedAt: '2026-10-24T10:00:00.000Z',
      actualLength: 1, activeForegroundMs: 1000, configurationSnapshot: {},
    },
  }));
}
function evidence(trackId = coding, capturedAt = now, activityRecords = []) {
  const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track, question = track.questions[0];
  const item = { trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  const attempt = createTrainingAttempt({ id: 'render-attempt', sessionId: 'render-session', trackId, modeId: 'practice', occurrenceId: 'render-occurrence', item,
    response: {}, result: { kind: 'correct', earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: now, committedAt: now });
  return projectProgressEvidence({ activeTrackId: trackId, activityRecords, trainingAttempts: [attempt], reviewQueueItems: [], now: capturedAt });
}
async function mounted(port, props) {
  let tree, current = props;
  await act(async () => { tree = create(React.createElement(port.Progress, current)); });
  return {
    tree,
    async update(next) { current = { ...current, ...next }; await act(async () => tree.update(React.createElement(port.Progress, current))); },
    async toggle(label) {
      const button = tree.root.findAllByType('Button').find(node => node.props.children === label);
      assert.ok(button, `diagnostics toggle ${label} exists`);
      await act(async () => button.props.onPress());
    },
    async unmount() { await act(async () => tree.unmount()); },
  };
}

for (const count of [0, 1, 12, 13, 2000]) test(`diagnostics toggles twice with N=${count} do not repeat full Progress or weekly projections`, async t => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const port = loadProgress(), history = records(count), before = JSON.stringify(history);
  const ui = await mounted(port, { activeTrack: getTrackDisplay(coding), evidence: evidence(), activityRecords: history, onChangeTrack() {} });
  const projected = port.model(), baseline = { ...port.counts };
  await ui.toggle(projected.algorithmsProgress.diagnostics.showActionLabel);
  await ui.toggle(projected.algorithmsProgress.diagnostics.hideActionLabel);
  const delta = Object.fromEntries(Object.keys(baseline).map(key => [key, port.counts[key] - baseline[key]]));
  t.diagnostic(JSON.stringify({ count, mount: baseline, toggles: delta }));
  assert.deepEqual(delta, { present: 0, weekly: 0, weeklyRecords: 0 });
  assert.equal(port.model(), projected);
  assert.equal(JSON.stringify(history), before);
  assert.equal(projected.activity.length, Math.min(12, history.filter(row => row.session.trackId === coding).length));
  assert.deepEqual(projected.activity.map(row => row.id), history.filter(row => row.session.trackId === coding).slice(0, 12).map(row => row.session.id), 'equal timestamps retain original ordering');
  await ui.unmount();
});

test('parent updates remain fresh across history, evidence, profile, track, time, timezone and unavailable transitions', async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const oldTimezone = process.env.TZ;
  try {
    process.env.TZ = 'UTC';
    const port = loadProgress();
    const ui = await mounted(port, { activeTrack: getTrackDisplay(coding), evidence: evidence(), activityRecords: records(1), onChangeTrack() {} });
    const labels = port.model().algorithmsProgress.diagnostics;
    await ui.toggle(labels.showActionLabel);
    let previous = port.counts.present;
    const update = async props => { await ui.update(props); assert.equal(port.counts.present, ++previous); };
    await update({ activityRecords: records(13) });
    assert.ok(ui.tree.root.findAllByType('Button').some(node => node.props.children === labels.hideActionLabel), 'same mounted section retains disclosure');
    await update({ evidence: evidence(coding, '2026-11-02T12:00:00.000Z') });
    assert.equal(port.model().weeklyActivity.completedSessionCount, 0, 'new capture enters another week');
    assert.equal(port.model().capturedAt, '2026-11-02T12:00:00.000Z');
    process.env.TZ = 'America/New_York';
    await update({});
    assert.equal(port.model().weeklyActivity.timezone, 'America/New_York');
    port.locale('pl'); await update({});
    // Home's existing profile fence supplies a new snapshot/history; no profile cache lives here.
    await update({ evidence: evidence(), activityRecords: [] });
    assert.equal(port.model().activity.length, 0);
    await update({ activeTrack: getTrackDisplay(cloud), evidence: evidence(cloud), activityRecords: records(2, cloud) });
    assert.equal(port.model().identity.trackId, cloud);
    assert.equal(port.model().activity.length, 2);
    await ui.update({ evidence: null });
    assert.equal(port.counts.present, previous);
    assert.equal(ui.tree.root.findAllByType('EmptyState').length, 1);
    await update({ activeTrack: getTrackDisplay(coding), evidence: evidence(), activityRecords: records(1) });
    assert.ok(ui.tree.root.findAllByType('Button').some(node => node.props.children === labels.showActionLabel), 'unmount clears ephemeral disclosure');
    await ui.update({ evidenceError: 'unavailable' });
    assert.equal(port.counts.present, previous);
    await update({ evidenceError: null });
    await ui.unmount();
  } finally { if (oldTimezone === undefined) delete process.env.TZ; else process.env.TZ = oldTimezone; }
});
