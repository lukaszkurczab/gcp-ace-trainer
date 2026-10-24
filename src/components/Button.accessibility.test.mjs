import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(`${process.cwd()}/package.json`);
const React = require('react');
const ts = require('typescript');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const native = {
  ActivityIndicator: 'ActivityIndicator', Pressable: 'Pressable', Text: 'Text',
  StyleSheet: { create: value => value }, useWindowDimensions: () => ({ fontScale: 1 }),
};
const preferences = { useThemedStyles: () => ({}), useAppPreferences: () => ({ colors: {} }) };
const code = ts.transpileModule(readFileSync('src/components/Button.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, require: name => {
  if (name === 'react-native') return native;
  if (name.includes('preferences')) return preferences;
  if (name.endsWith('/theme')) return {};
  if (name === './Icon') return { Icon: 'Icon' };
  return require(name);
} });
const { Button } = module.exports;
const noop = () => {};

// Rendered host props prove JS wiring; native content-description refresh needs device acceptance.
async function exerciseButton(children, expectedLabel, overrides = {}) {
  let tree;
  const element = loading => React.createElement(Button, { onPress: noop, loading, ...overrides }, children);
  await act(async () => { tree = create(element(false)); });
  try {
    const initialControl = tree.root.findByType('Pressable');
    for (const loading of [false, true, false]) {
      await act(async () => { tree.update(element(loading)); });
      const control = tree.root.findByType('Pressable');
      assert.equal(control, initialControl, 'the same host receives each label and busy-state update');
      assert.equal(control.props.accessibilityLabel, expectedLabel);
      assert.equal(control.props.accessibilityState.busy, loading);
      assert.equal(control.props.accessibilityState.disabled, loading);
      assert.equal(control.props.disabled, loading);
      assert.equal(control.findAllByType('ActivityIndicator').length, loading ? 1 : 0);
      assert.equal(control.findByType('Text').props.children, children);
    }
  } finally {
    await act(async () => { tree.unmount(); });
  }
}

test('plain localized button text supplies its accessible name through idle, loading and idle', async () => {
  for (const locale of ['pl', 'en', 'de', 'fr', 'es', 'it', 'et']) {
    const labels = JSON.parse(readFileSync(`src/locales/${locale}/learningPlan.json`, 'utf8'));
    const label = labels['Review your learning plan'];
    assert.equal(typeof label, 'string', `${locale} must provide the translated goal action`);
    assert.ok(label.trim().length > 0, `${locale} must provide a nonempty translated goal action`);
    await exerciseButton(label, label);
  }
});

test('an explicit accessible name, including an empty name, takes precedence over visible text', async () => {
  await exerciseButton('Visible action', 'Specific action description', { accessibilityLabel: 'Specific action description' });
  await exerciseButton('Visible action', '', { accessibilityLabel: '' });
});

test('numeric button labels include zero and update when the visible action changes', async () => {
  await exerciseButton(0, '0');
  let tree;
  await act(async () => { tree = create(React.createElement(Button, { onPress: noop }, 42)); });
  try {
    const control = tree.root.findByType('Pressable');
    assert.equal(control.props.accessibilityLabel, '42');
    await act(async () => { tree.update(React.createElement(Button, { onPress: noop, loading: true }, 'Saving schedule')); });
    assert.equal(tree.root.findByType('Pressable'), control);
    assert.equal(control.props.accessibilityLabel, 'Saving schedule');
    await act(async () => { tree.update(React.createElement(Button, { onPress: noop }, 'Review your learning plan')); });
    assert.equal(control.props.accessibilityLabel, 'Review your learning plan');
    assert.equal(control.props.accessibilityState.busy, false);
  } finally {
    await act(async () => { tree.unmount(); });
  }
});

test('complex children keep native label inference unless the caller supplies a name', async () => {
  const child = React.createElement('NestedText', null, 'Nested label');
  await exerciseButton(child, undefined);
  await exerciseButton(['Part one', 'Part two'], undefined);
  await exerciseButton(child, 'Explicit complex action', { accessibilityLabel: 'Explicit complex action' });
});
