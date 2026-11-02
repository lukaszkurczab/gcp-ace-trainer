import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { subject, controlledHooks, nodes, settle, deferred } from './soloUi22TestHarness.mjs';
const require = createRequire(import.meta.url);
const { getTrackDisplays, CODING_INTERVIEW_TRACK_ID } = require('../../domain/index.ts');
const ood = 'object-oriented-design-interview';

function screen({ snapshot = ood, read = async () => snapshot, onboarding = false, initialError = false } = {}) {
  const hooks = controlledHooks();
  const account = { state: { kind: 'authenticated', accountData: { lastSuccessfulSyncAt: '2026-10-31T10:00:00Z' } } };
  const saved = [];
  const fn = subject('src/features/home/SelectTrackScreen.tsx', 'SelectTrackScreen', {
    ...hooks.bindings, useRef: value => hooks.bindings.useMemo(() => ({ current: value }), []),
    usePatternlyAccount: () => account,
    useThemedStyles: () => ({}), createStyles: () => ({}), useWindowDimensions: () => ({ fontScale: 1 }),
    useAppPreferences: () => ({ colors: {} }), useTranslation: () => ({ t: key => key }),
    captureProfileReadFence: () => () => {},
    readActiveTrackId: () => { if (initialError) throw Error('corrupt'); return snapshot; },
    getActiveTrackId: read, getTrackDisplays, CODING_INTERVIEW_TRACK_ID,
    saveActiveTrackId: async id => { saved.push(id); },
    reconcileDeviceReminder: async () => ({ kind: 'disabled', status: 'disabled' }), reminderNeedsAttention: () => false,
    View: 'View', Screen: 'Screen', Text: 'Text', Icon: 'Icon', Button: 'Button', TrackChoiceCard: 'TrackChoiceCard',
    colorWithOpacity: () => '', goBackOrHome() {}, ROUTES: { HOME: 'home' },
    runtimeSelectors: { home: { selectTrackContinue: () => 'continue' } },
  });
  const render = () => hooks.render(fn, { onboarding, navigation: { canGoBack: () => true, navigate() {} } });
  return { render, account, saved, unmount: () => hooks.unmount() };
}
const cards = tree => nodes(tree).filter(node => node.type === 'TrackChoiceCard');
const selected = tree => cards(tree).filter(node => node.props.selected).map(node => node.props.track.id);

test('OOD is selected on the first render, while pending cards cannot change it', async () => {
  const pending = deferred(), ui = screen({ read: () => pending.promise });
  const first = ui.render();
  assert.deepEqual(selected(first), [ood]);
  assert.ok(cards(first).every(node => node.props.disabled));
  cards(first).find(node => node.props.track.id === CODING_INTERVIEW_TRACK_ID).props.onPress();
  assert.deepEqual(selected(ui.render()), [ood]);
  pending.resolve(ood); await settle();
  assert.deepEqual(selected(ui.render()), [ood]);
  assert.ok(cards(ui.render()).every(node => !node.props.disabled));
  assert.deepEqual(ui.saved, [], 'reading/selecting presentation never writes the active track');
  ui.unmount();
});

test('only confirmed empty onboarding gets the Coding default', async () => {
  for (const onboarding of [false, true]) {
    const pending = deferred(), ui = screen({ snapshot: null, read: () => pending.promise, onboarding });
    assert.deepEqual(selected(ui.render()), [], 'unknown or transient absence has no placeholder selection');
    pending.resolve(null); await settle();
    assert.deepEqual(selected(ui.render()), onboarding ? [CODING_INTERVIEW_TRACK_ID] : []);
    ui.unmount();
  }
});

test('a completed sync refreshes the active choice, preserving a manual draft', async () => {
  for (const edited of [false, true]) {
    let active = ood;
    const ui = screen({ read: async () => active });
    ui.render(); await settle();
    if (edited) cards(ui.render()).find(node => node.props.track.id === 'backend-system-design-interview').props.onPress();
    active = CODING_INTERVIEW_TRACK_ID;
    ui.account.state.accountData = { lastSuccessfulSyncAt: '2026-10-31T11:00:00Z' };
    ui.render(); await settle();
    assert.deepEqual(selected(ui.render()), [edited ? 'backend-system-design-interview' : CODING_INTERVIEW_TRACK_ID]);
    assert.deepEqual(ui.saved, []);
    ui.unmount();
  }
});

test('failed local reads stay explicit and retry without inventing a selection', async () => {
  let attempts = 0;
  const ui = screen({ snapshot: null, initialError: true, read: async () => { if (++attempts === 1) throw Error('storage'); return ood; } });
  const first = ui.render();
  assert.equal(cards(first).length, 0);
  await settle();
  const error = nodes(ui.render());
  assert.ok(error.some(node => node.props.testID === 'patternly:home:select-track:unavailable'));
  error.find(node => node.props.testID === 'patternly:home:select-track:retry').props.onPress();
  ui.render(); await settle();
  assert.deepEqual(selected(ui.render()), [ood]);
  ui.unmount();
});

test('a manual draft is saved only by the explicit Start track action', async () => {
  const ui = screen();
  ui.render(); await settle();
  cards(ui.render()).find(node => node.props.track.id === CODING_INTERVIEW_TRACK_ID).props.onPress();
  assert.deepEqual(ui.saved, []);
  nodes(ui.render()).find(node => node.type === 'Button' && node.props.testID === 'continue').props.onPress();
  await settle();
  assert.deepEqual(ui.saved, [CODING_INTERVIEW_TRACK_ID]);
  ui.unmount();
});
