import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function fixture() {
  let resolveSetting, rejectSetting;
  const setting = new Promise((resolve, reject) => { resolveSetting = resolve; rejectSetting = reject; });
  const appListeners = new Set(), motionListeners = new Set();
  const timings = [], sequences = [];
  class Value {
    setValue() {}
    interpolate() { return new Value(); }
  }
  const animation = () => ({ start() {}, stop() {} });
  const native = {
    View: 'View',
    useWindowDimensions: () => ({ width: 402, height: 874 }),
    StyleSheet: { create: value => value, absoluteFill: {} },
    Easing: { sin: value => value, inOut: value => value },
    AppState: { currentState: 'active', addEventListener: (_event, listener) => {
      appListeners.add(listener); return { remove: () => appListeners.delete(listener) };
    } },
    AccessibilityInfo: { isReduceMotionEnabled: () => setting, addEventListener: (_event, listener) => {
      motionListeners.add(listener); return { remove: () => motionListeners.delete(listener) };
    } },
    Animated: {
      Value, View: 'AnimatedView', multiply: () => new Value(),
      timing: (_value, config) => { timings.push(config); return animation(); },
      delay: () => { throw new Error('Animated.delay claims interaction in the installed RN version'); },
      sequence: animation,
      parallel: () => {
        const sequence = { started: false, stopped: false, start() { this.started = true; }, stop() { this.stopped = true; } };
        sequences.push(sequence); return sequence;
      },
    },
  };
  const code = ts.transpileModule(readFileSync('src/components/AmbientBackdrop.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name === 'react-native') return native;
    if (name === 'react-native-svg') return { __esModule: true, default: 'Svg', Polyline: 'Polyline' };
    if (name.includes('appPreferencesContext')) return { useThemedStyles: factory => factory({ ambient: {}, effects: {} }) };
    return require(name);
  } });
  return {
    Component: module.exports.AmbientBackdrop, timings, sequences, resolveSetting, rejectSetting,
    appListeners, motionListeners,
    appState: value => appListeners.forEach(listener => listener(value)),
    reduceMotion: value => motionListeners.forEach(listener => listener(value)),
  };
}

test('ambient stops in background, resumes in foreground, and never claims user interaction', async () => {
  const f = fixture();
  let tree;
  await act(async () => { tree = create(React.createElement(f.Component)); });
  assert.equal(f.timings.length, 0, 'unknown accessibility preference stays static');
  await act(async () => { f.resolveSetting(false); });
  const running = f.sequences.filter(value => value.started);
  assert.equal(running.length, 1);
  assert.equal(f.timings.length, 3);
  assert.ok(f.timings.every(config => config.isInteraction === false && config.useNativeDriver === true));
  await act(async () => { f.appState('background'); });
  assert.equal(running[0].stopped, true);
  assert.equal(tree.root.findAllByType('AnimatedView').length, 0);
  await act(async () => { f.appState('active'); });
  assert.equal(f.sequences.filter(value => value.started).length, 2);
  await act(async () => { f.reduceMotion(true); });
  assert.ok(f.sequences.filter(value => value.started).every(value => value.stopped));
  await act(async () => { tree.unmount(); });
  assert.equal(f.appListeners.size + f.motionListeners.size, 0);
});

test('a live reduced-motion change wins over a stale initial read', async () => {
  const f = fixture();
  let tree;
  await act(async () => { tree = create(React.createElement(f.Component)); });
  await act(async () => { f.reduceMotion(true); f.resolveSetting(false); });
  assert.equal(f.timings.length, 0);
  await act(async () => { tree.unmount(); });
});

test('an unavailable accessibility setting leaves a static backdrop and can recover on an event', async () => {
  const f = fixture();
  let tree;
  await act(async () => { tree = create(React.createElement(f.Component)); });
  await act(async () => { f.rejectSetting(new Error('setting unavailable')); });
  assert.equal(f.timings.length, 0);
  await act(async () => { f.reduceMotion(false); });
  assert.equal(f.sequences.filter(value => value.started).length, 1);
  await act(async () => { tree.unmount(); });
  assert.ok(f.sequences.filter(value => value.started).every(value => value.stopped));
});
