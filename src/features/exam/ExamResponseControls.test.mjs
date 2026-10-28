import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
const require = createRequire(`${process.cwd()}/package.json`);
const React = require('react'), ts = require('typescript');
const { act, create } = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const module = { exports: {} };
const code = ts.transpileModule(readFileSync('src/features/exam/ExamResponseControls.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
vm.runInNewContext(code, { module, exports: module.exports, require: name => {
  if (name === 'react-native') return { Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: value => value } };
  if (name === 'react-i18next') return { useTranslation: () => ({ t: (key, data) => key.replace('{{count}}', String(data?.count)) }) };
  if (name.endsWith('/components')) return { AnswerOption: 'AnswerOption', Button: 'Button' };
  if (name.endsWith('/preferences')) return { useThemedStyles: () => ({}) };
  if (name.endsWith('/theme')) return {};
  if (name.endsWith('/runtimeSelectors')) return { runtimeSelectors: { simulation: { option: (item, option) => `${item}:${option}` } } };
  if (name === './examResponseSelection') return { toggleExamOption: (selected, id, count) => selected.includes(id) ? selected.filter(value => value !== id) : selected.length >= count ? selected : [...selected, id] };
  return require(name);
} });
const { ExamResponseControls } = module.exports;
async function mount(props) {
  let tree; const changes = [];
  function Harness() {
    const [response, setResponse] = React.useState(props.response ?? null);
    return React.createElement(ExamResponseControls, { ...props, response, onChange: next => { changes.push(next); setResponse(next); } });
  }
  await act(async () => { tree = create(React.createElement(Harness)); });
  return { tree, changes, close: async () => act(async () => tree.unmount()) };
}
test('checkboxes retain partial choices and never replace earlier stable IDs at N', async () => {
  const { tree, changes, close } = await mount({ interactionType: 'choice_multiple', itemId: 'multi', requiredSelectionCount: 2, renderer: { kind: 'choice', options: ['a', 'b', 'c'].map(id => ({ id, text: id })) } });
  try {
    const options = tree.root.findAllByType('AnswerOption');
    assert.equal(options[0].props.accessibilityRole, 'checkbox');
    for (const index of [2, 0, 1]) await act(async () => options[index].props.onPress());
    assert.deepEqual(Array.from(changes.at(-1).optionIds), ['c', 'a']);
    assert.equal(options[1].props.accessibilityState.checked, false);
    await act(async () => options[0].props.onPress());
    assert.deepEqual(Array.from(changes.at(-1).optionIds), ['c']);
  } finally { await close(); }
});
test('single answer changes and clears without a navigation callback', async () => {
  const { tree, changes, close } = await mount({ interactionType: 'choice_single', itemId: 'single', renderer: { kind: 'choice', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] } });
  try {
    const options = tree.root.findAllByType('AnswerOption');
    for (const index of [0, 1, 1]) await act(async () => options[index].props.onPress());
    assert.equal(changes[1].optionId, 'b'); assert.equal(changes[2], null);
  } finally { await close(); }
});
test('statement lists distinguish empty from false/no and clear only the chosen row', async () => {
  const { tree, changes, close } = await mount({ interactionType: 'decision_matrix', itemId: 'rows', renderer: { kind: 'complexity', dimensions: [{ id: 's1', label: 'Statement one', values: [{ id: 'false', text: 'False' }, { id: 'true', text: 'True' }] }, { id: 's2', label: 'Statement two', values: [{ id: 'no', text: 'No' }, { id: 'yes', text: 'Yes' }] }] } });
  try {
    const combo = tree.root.findAllByType('Pressable').filter(node => node.props.accessibilityRole === 'combobox');
    assert.equal(combo[0].props.accessibilityLabel, 'Statement one: Choose');
    const press = async id => act(async () => tree.root.findByProps({ testID: id }).props.onPress());
    await press('exam-statement-value-rows-s1-false');
    assert.equal(changes.at(-1).selectedValueIdsByDimension.s1[0], 'false');
    assert.equal(Object.hasOwn(changes.at(-1).selectedValueIdsByDimension, 's2'), false);
    await press('exam-statement-value-rows-s2-no');
    await press('exam-statement-value-rows-s1-empty');
    assert.equal(Object.hasOwn(changes.at(-1).selectedValueIdsByDimension, 's1'), false);
    assert.equal(changes.at(-1).selectedValueIdsByDimension.s2[0], 'no');
  } finally { await close(); }
});

test('completed review shows every row explanation, including correct rows, beside the saved answer', async () => {
  const exported = { exports: {} };
  const source = ts.transpileModule(readFileSync('src/features/exam/ExamStatementReview.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { module: exported, exports: exported.exports, require: name => {
    if (name === 'react-native') return { Text: 'Text', View: 'View', StyleSheet: { create: value => value } };
    if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key }) };
    if (name.endsWith('/preferences')) return { useThemedStyles: () => ({}) };
    if (name.endsWith('/theme')) return {};
    return require(name);
  } });
  let tree;
  await act(async () => { tree = create(React.createElement(exported.exports.ExamStatementReview, { rows: [{ dimensionId: 'r1', label: 'Already authorized', selectedValueIds: ['no'], correctValueIds: ['no'], values: [{ valueId: 'no', text: 'No' }], explanation: 'The agreed scope excludes this action.' }, { dimensionId: 'r2', label: 'Evidence required', selectedValueIds: [], correctValueIds: ['yes'], values: [{ valueId: 'yes', text: 'Yes' }], explanation: 'The comparison has not been run.', messages: [{ text: 'Use representative cases first.' }] }] })); });
  try {
    const texts = tree.root.findAllByType('Text').flatMap(node => [node.props.children].flat(Infinity)).join(' ');
    assert.match(texts, /Your answer.*No.*Correct answer.*No.*Correct.*The agreed scope excludes this action/);
    assert.match(texts, /Unanswered.*The comparison has not been run.*Use representative cases first/);
  } finally { await act(async () => tree.unmount()); }
});


test('practice statements show row diagnostics only in the locked feedback phase', async () => {
  const exported = { exports: {} };
  const source = ts.transpileModule(readFileSync('src/features/practice/CertificationStatementControls.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { module: exported, exports: exported.exports, require: name => {
    if (name.endsWith('/ExamResponseControls')) return { ExamResponseControls: 'ExamResponseControls' };
    if (name.endsWith('/ExamStatementReview')) return { ExamStatementReview: 'ExamStatementReview' };
    return require(name);
  } });
  const props = { control: { model: { dimensions: [{ id: 's1', label: 'Decision', selectedValues: ['no'] }] } }, itemId: 'matrix', onInteractionResponseChange() {} };
  const rows = [{ dimensionId: 's1', label: 'Decision', selectedValueIds: ['no'], correctValueIds: ['yes'], explanation: 'Authorize before the read.' }];
  const render = exported.exports.CertificationStatementControls;
  assert.equal(render({ ...props, editable: true, interactionResponse: { statementRows: rows } }).type, 'ExamResponseControls');
  assert.equal(render({ ...props, editable: false, interactionResponse: null }).type, 'ExamResponseControls');
  const review = render({ ...props, editable: false, interactionResponse: { statementRows: rows } });
  assert.equal(review.type, 'ExamStatementReview');
  assert.equal(review.props.rows, rows);
});
