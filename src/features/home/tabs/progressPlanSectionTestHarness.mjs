// Verification only: execute the actual private JSX branch with controlled hooks
// and host identities. This is not a React mount, native layout or SDK test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import i18next from 'i18next';

const require = createRequire(import.meta.url);
const { runtimeSelectors } = require('../../../testing/runtimeSelectors.ts');
const { completionCopy } = require('../homePlanUiContract.ts');
const source = readFileSync(new URL('./ProgressTab.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('ProgressTab.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const subjects = ast.statements.filter(node => ts.isFunctionDeclaration(node) && ['ProgressPlanSection', 'planToneColor'].includes(node.name?.text));
assert.equal(subjects.length, 2, 'Actual Progress subject functions must exist');
const code = ts.transpileModule(subjects.map(node => node.getText(ast)).join('\n') + '\nmodule.exports = ProgressPlanSection;', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

export function renderProgressPlanSection(model, { locale = 'en', fontScale = 1, onAction, onRetry } = {}) {
  const i18n = i18next.createInstance();
  const resources = {};
  for (const language of new Set(['en', locale])) {
    resources[language] = {};
    for (const namespace of ['common', 'learningPlan']) resources[language][namespace] = JSON.parse(readFileSync(new URL(`../../../locales/${language}/${namespace}.json`, import.meta.url), 'utf8'));
  }
  void i18n.init({ initAsync: false, lng: locale, fallbackLng: 'en', keySeparator: false, resources, interpolation: { escapeValue: false } });
  const context = {
    module: { exports: {} }, exports: {}, require, runtimeSelectors, completionCopy,
    useThemedStyles: () => ({}), createStyles: () => ({}),
    useTranslation: namespace => ({ t: i18n.getFixedT(locale, namespace) }),
    useAppPreferences: () => ({ colors: {} }), useWindowDimensions: () => ({ fontScale }),
    View: 'View', Text: 'Text', Card: 'Card', Button: 'Button', InfoBlock: 'InfoBlock', ProgressBar: 'ProgressBar',
  };
  vm.runInNewContext(code, context, { filename: 'actual-ProgressPlanSection.cjs' });
  const element = context.module.exports({ model, onAction, onRetry });
  const nodes = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === 'object' && value.props) { nodes.push(value); visit(value.props.children); }
  }
  visit(element);
  function text(value) {
    if (Array.isArray(value)) return value.map(text).join('');
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    return value && typeof value === 'object' && value.props ? text(value.props.children) : '';
  }
  return { element, nodes, text: text(element), i18n, byTestId: id => nodes.find(node => node.props.testID === id), textOf: text };
}
