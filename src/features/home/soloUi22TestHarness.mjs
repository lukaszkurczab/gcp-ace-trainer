// Verification only: execute actual screen functions with controlled hooks/ports.
// This checks publication and UI callbacks, not a React mount or native layout.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);

export function subject(path, name, bindings) {
  const ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, `Actual subject ${name} must exist`);
  const code = ts.transpileModule(declaration.getText(ast), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require, ...bindings }, { filename: path });
  return module.exports[name];
}

export function controlledHooks() {
  const slots = [], pending = [];
  let cursor = 0, mounted = true, publications = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  function useMemo(factory, deps) {
    const i = cursor++;
    if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: factory() };
    return slots[i].value;
  }
  function useEffect(effect, deps) {
    const i = cursor++;
    if (!slots[i] || !same(slots[i].deps, deps)) {
      pending.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; });
    }
  }
  return {
    bindings: {
      useState(initial) {
        const i = cursor++;
        if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
        return [slots[i].value, next => { publications++; slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }];
      },
      useMemo, useCallback: (fn, deps) => useMemo(() => fn, deps), useEffect,
      useFocusEffect: fn => useEffect(fn, [fn]),
    },
    render(fn, props) {
      assert.ok(mounted);
      cursor = 0;
      const result = fn(props);
      pending.splice(0).forEach(run => run());
      return result;
    },
    unmount() { mounted = false; slots.forEach(slot => slot?.cleanup?.()); },
    get publications() { return publications; },
  };
}

export function nodes(element) {
  const result = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === 'object' && value.props) {
      result.push(value);
      for (const prop of ['children', 'ListHeaderComponent', 'ListFooterComponent', 'header', 'footer']) visit(value.props[prop]);
    }
  }
  visit(element);
  return result;
}
export const settle = () => new Promise(resolve => setImmediate(resolve));
export function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
