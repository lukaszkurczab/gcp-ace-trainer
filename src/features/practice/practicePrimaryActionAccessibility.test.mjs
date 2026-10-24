import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const polish = JSON.parse(readFileSync(new URL('../../locales/pl/common.json', import.meta.url), 'utf8'));
const native = {
  ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text', View: 'View',
  StyleSheet: { create: value => value }, useWindowDimensions: () => ({ fontScale: 1 }),
};
const preferences = { useThemedStyles: () => ({}), useAppPreferences: () => ({ colors: {} }) };

function loadComponent(path, dependencies) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'react-native') return native;
    if (name.includes('preferences')) return preferences;
    if (name.endsWith('/theme')) return {};
    if (name in dependencies) return dependencies[name];
    return require(name);
  } });
  return module.exports;
}

const { Button } = loadComponent('../../components/Button.tsx', { './Icon': { Icon: 'Icon' } });
const { PracticeSessionSurface } = loadComponent('./PracticeSessionSurface.tsx', {
  './PracticeQuestionCard': {}, '../../infrastructure/diagnostics/startupTrace': {},
  './practiceSessionExitCopy': {}, 'react-native-safe-area-context': {},
  'react-i18next': { useTranslation: () => ({ t: label => polish[label] ?? label }) },
  '../../components': { Button },
  '../coding-interview/session/SessionShell': { SessionShell: ({ actionBar, children }) => React.createElement('SessionShell', null, actionBar, children) },
  './PracticeFeedbackBlock': {}, './PracticeResponseControls': {},
  '../../testing/runtimeSelectors': {},
  '../../domain/tracks/trackAdmission': require('../../domain/tracks/trackAdmission.ts'),
  './practiceSessionPresentation': require('./practiceSessionPresentation.ts'),
});

// Host props prove JS wiring; Android content-description updates need native acceptance.
test('primary action keeps its current translated accessible name when busy clears and its action changes', async () => {
  let tree;
  const element = (phase, label, loading, enabled = true) => React.createElement(PracticeSessionSurface, {
    allowLeave: false, exit: { kind: 'none' }, isFinalPosition: false, phase,
    primaryAction: { enabled, label, loading }, onPrimaryAction() {},
  });
  const expectAction = (label, busy, disabled) => {
    const control = tree.root.findByType('Pressable');
    assert.equal(control.props.accessibilityLabel, polish[label]);
    assert.equal(control.props.accessibilityState.busy, busy);
    assert.equal(control.props.accessibilityState.disabled, disabled);
    assert.equal(control.props.disabled, disabled);
    assert.equal(control.findByType('Text').props.children, polish[label]);
    assert.equal(control.findAllByType('ActivityIndicator').length, busy ? 1 : 0);
    return control;
  };
  await act(async () => { tree = create(element('submitting_before_journal', 'Check answer', true)); });
  try {
    const busyControl = expectAction('Check answer', true, true);
    await act(async () => { tree.update(element('feedback', 'Next', false)); });
    assert.equal(expectAction('Next', false, false), busyControl, 'same native control receives the cleared state and new name');
    for (const [phase, label] of [['feedback', 'Finish session'], ['advance_failed', 'Try again']]) {
      await act(async () => { tree.update(element(phase, label, false)); });
      expectAction(label, false, false);
    }
    await act(async () => { tree.update(element('unanswered', 'Check answer', false, false)); });
    expectAction('Check answer', false, true);
  } finally {
    await act(async () => { tree.unmount(); });
  }
});
