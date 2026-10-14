import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as guardModule from "./environmentGuard";
import type { EnvironmentIdentity } from "./environmentIdentity";

type Element = { type: unknown; props: Record<string, unknown> };
const jsx = (type: unknown, props: Record<string, unknown>): Element => ({ type, props });
const identity: EnvironmentIdentity = { fingerprint: "a".repeat(64), mode: "smoke", apiOrigin: "http://127.0.0.1:8080", firebaseProjectId: "demo-a" };
const compile = (path: URL, require: (name: string) => unknown) => {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require, process: { env: {} }, __DEV__: true });
  return module.exports as { default: (props: Record<string, unknown>) => Element };
};

/** Real App/Gate code with synthetic React scheduler and native marker port.
 * Exercises the provider load boundary; does not establish native Keychain durability. */
function entry(rawMarker: string | null, configMatches = true) {
  let raw = rawMarker, writes = 0, rootLoads = 0, hookIndex = 0;
  const hooks: unknown[] = [];
  let effect: (() => unknown) | null = null;
  const alerts: Array<{ onPress?: () => void }[]> = [];
  const react = {
    useState(initial: unknown) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (value: unknown) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
    },
    useEffect(callback: () => unknown, dependencies: unknown[]) {
      const index = hookIndex++;
      if (JSON.stringify(hooks[index]) !== JSON.stringify(dependencies)) { hooks[index] = dependencies; effect = callback; }
    },
  };
  const gate = compile(new URL("./EnvironmentGate.tsx", import.meta.url), (name) => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "react-native") return { ActivityIndicator: "spinner", SafeAreaView: "safe", Text: "text", View: "view", Pressable: "button", Alert: { alert: (_title: string, _body: string, buttons: Array<{ onPress?: () => void }>) => alerts.push(buttons) } };
    if (name === "./environmentGuard") return { ...guardModule, createNativeEnvironmentMarkerStore: () => ({ get: async () => raw, set: async (value: string) => { writes++; raw = value; } }) };
    if (name === "./environmentIdentity") return { readEnvironmentIdentity: () => identity };
    if (name === "expo-constants") return { default: { expoConfig: { extra: { patternlyEnvironmentFingerprint: configMatches ? identity.fingerprint : "b".repeat(64) } } } };
    return assert.fail(`Unexpected pre-gate dependency: ${name}`);
  }).default;
  const app = compile(new URL("../../../App.tsx", import.meta.url), (name) => {
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "./src/testing/perf06Entry") return { resolvePerf06Entry: () => ({ kind: "regular" }) };
    if (name === "./src/application/runtimeAuditability/persist13Entry") return { resolvePersist13Entry: () => ({ kind: "regular" }) };
    if (name === "./src/infrastructure/diagnostics/startupTrace") return { markStartup() {} };
    if (name === "./src/infrastructure/runtime/EnvironmentGate") return { default: gate };
    if (name === "./src/RegularApplicationRoot") { rootLoads++; return { default: "regular" }; }
    return assert.fail(`Unexpected app dependency: ${name}`);
  }).default({});
  assert.equal(rootLoads, 0);
  const render = () => { hookIndex = 0; return gate(app.props); };
  const settle = async () => { const callback = effect; effect = null; callback?.(); for (let index = 0; index < 10; index++) await Promise.resolve(); return render(); };
  return { render, settle, writes: () => writes, rootLoads: () => rootLoads, alerts };
}

function findButton(element: Element): Element | undefined {
  if (element.type === "button") return element;
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children.flat() : [children]) {
    if (typeof child === "object" && child !== null) { const found = findButton(child as Element); if (found) return found; }
  }
  return undefined;
}

test("actual App/Gate never require regular providers for unassigned, mismatch, corrupt or config mismatch", async () => {
  for (const [marker, configMatches] of [[null, true], [JSON.stringify({ version: 1, fingerprint: "b".repeat(64) }), true], ["corrupt", true], [JSON.stringify({ version: 1, fingerprint: identity.fingerprint }), false]] as const) {
    const state = entry(marker, configMatches);
    state.render(); await state.settle();
    assert.equal(state.rootLoads(), 0);
    assert.equal(state.writes(), 0);
  }
});

test("explicit assignment needs confirmation, verified write and reinspection before the regular require", async () => {
  const state = entry(null);
  state.render();
  const surface = await state.settle();
  (findButton(surface)!.props.onPress as () => void)();
  assert.equal(state.writes(), 0); assert.equal(state.rootLoads(), 0);
  state.alerts[0]![1]!.onPress!();
  await state.settle();
  assert.equal(state.writes(), 1); assert.equal(state.rootLoads(), 0);
  await state.settle();
  assert.equal(state.rootLoads(), 1);
});

test("matching stored fingerprint opens regular providers after inspection without rewriting data", async () => {
  const state = entry(JSON.stringify({ version: 1, fingerprint: identity.fingerprint }));
  state.render(); await state.settle();
  assert.equal(state.rootLoads(), 1); assert.equal(state.writes(), 0);
});
