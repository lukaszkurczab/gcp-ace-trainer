import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React from "react";
import { act } from "react";
import test from "node:test";

import { useSettingsRecoveryReturn } from "./useSettingsRecoveryReturn";

type Props = Parameters<typeof useSettingsRecoveryReturn>[0];
type Renderer = Readonly<{ update: (element: React.ReactElement) => void; unmount: () => void }>;
const { create } = createRequire(`${process.cwd()}/package.json`)("react-test-renderer") as Readonly<{ create: (element: React.ReactElement) => Renderer }>;
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });

function Probe(props: TestProps) {
  const markRetry = useSettingsRecoveryReturn(props);
  props.exposeRetry?.(markRetry);
  return null;
}

type TestProps = Props & Readonly<{ exposeRetry?: (markRetry: () => void) => void }>;

function mount(initial: TestProps): Readonly<{ update: (next: TestProps) => void; markRetry: () => void; unmount: () => void }> {
  let renderer!: Renderer;
  let markRetry: () => void = () => {};
  act(() => { renderer = create(React.createElement(Probe, { ...initial, exposeRetry: (mark) => { markRetry = mark; } })); });
  return {
    update(next) { act(() => { renderer.update(React.createElement(Probe, { ...next, exposeRetry: (mark) => { markRetry = mark; } })); }); },
    markRetry() { act(() => markRetry()); },
    unmount() { act(() => renderer.unmount()); },
  };
}

test("Settings recovery returns once after the same actor and storage lease become healthy", () => {
  const scope = {};
  let returns = 0;
  const goBack = () => { returns += 1; };
  const props = (healthy: boolean): Props => ({
    account: { healthy, scope, uid: "actor-a" },
    enabled: true,
    focused: true,
    goBack,
    previousRouteName: "Home",
  });
  const mounted = mount(props(false));
  mounted.markRetry();
  mounted.update(props(true));
  mounted.update(props(true));
  assert.equal(returns, 1);
  mounted.unmount();
});

test("initial healthy state, failed recovery, background state, another actor, or another route never returns", () => {
  const scope = {};
  let returns = 0;
  const goBack = () => { returns += 1; };
  const base: Props = { account: { healthy: true, scope, uid: "actor-a" }, enabled: true, focused: true, goBack, previousRouteName: "Home" };
  const initialHealthy = mount(base);
  initialHealthy.update({ ...base, focused: false });
  initialHealthy.update({ ...base, focused: true });
  initialHealthy.unmount();
  assert.equal(returns, 0);

  const recovering: Props = { ...base, account: { healthy: false, scope, uid: "actor-a" } };
  const failed = mount(recovering);
  failed.update({ ...base, account: { healthy: false, scope, uid: "actor-a" } });
  failed.unmount();

  const background = mount({ ...recovering, focused: true });
  background.markRetry();
  background.update({ ...recovering, focused: false });
  background.update({ ...recovering, focused: false });
  background.update({ ...base, account: { healthy: true, scope, uid: "actor-a" }, focused: false });
  background.update({ ...base, focused: true });
  background.unmount();

  const actorChange = mount(recovering);
  actorChange.update({ ...base, account: { healthy: true, scope, uid: "actor-b" } });
  actorChange.unmount();

  const scopeChange = mount(recovering);
  scopeChange.update({ ...base, account: { healthy: true, scope: {}, uid: "actor-a" } });
  scopeChange.unmount();

  const crossedActor = mount(recovering);
  crossedActor.markRetry();
  crossedActor.update({ ...base, account: { healthy: false, scope, uid: "actor-b" } });
  crossedActor.update(base);
  crossedActor.unmount();

  const routeChange = mount({ ...recovering, previousRouteName: "Home" });
  routeChange.update({ ...base, previousRouteName: "PracticeHub" });
  routeChange.unmount();
  assert.equal(returns, 0);
});
