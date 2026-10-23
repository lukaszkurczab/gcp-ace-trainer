import assert from "node:assert/strict";
import { createRequire } from "node:module";
import React, { act } from "react";
import test from "node:test";

import { useScopedReadSnapshot } from "./useScopedReadSnapshot";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
type Props = Readonly<{ owner: object | null; expose: (refresh: (read: () => Promise<string>) => Promise<void>) => void }>;
type Renderer = Readonly<{ update: (element: React.ReactElement) => void; unmount: () => void; toJSON: () => unknown }>;
const { create } = createRequire(`${process.cwd()}/package.json`)("react-test-renderer") as Readonly<{ create: (element: React.ReactElement) => Renderer }>;

function Probe({ owner, expose }: Props) {
  const { snapshot, refresh } = useScopedReadSnapshot<string, string>({ owner, classifyError: (error) => String(error) });
  expose(refresh);
  return React.createElement("snapshot", { state: snapshot.kind, value: snapshot.kind === "ready" ? snapshot.value : undefined });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

test("mounted scoped snapshot retains same-owner content, surfaces refresh errors and retry, and hides it on owner change", async () => {
  const firstOwner = {};
  const secondOwner = {};
  let refresh!: (read: () => Promise<string>) => Promise<void>;
  const element = (owner: object | null) => React.createElement(Probe, { owner, expose: (next) => { refresh = next; } });
  let renderer!: Renderer;
  await act(async () => { renderer = create(element(firstOwner)); });
  const value = () => (renderer.toJSON() as { props: { state: string; value?: string } }).props;
  assert.equal(value().state, "loading");

  const initial = deferred<string>();
  let initialDone!: Promise<void>;
  await act(async () => { initialDone = refresh(() => initial.promise); initial.resolve("history A"); await initialDone; });
  assert.deepEqual(value(), { state: "ready", value: "history A" });

  const failedRefresh = deferred<string>();
  let failedDone!: Promise<void>;
  await act(async () => { failedDone = refresh(() => failedRefresh.promise); });
  assert.deepEqual(value(), { state: "ready", value: "history A" });
  await act(async () => { failedRefresh.reject(new Error("offline")); await failedDone; });
  assert.deepEqual(value(), { state: "unavailable", value: undefined });

  const retry = deferred<string>();
  let retryDone!: Promise<void>;
  await act(async () => { retryDone = refresh(() => retry.promise); retry.resolve("history refreshed"); await retryDone; });
  assert.deepEqual(value(), { state: "ready", value: "history refreshed" });

  const ownerRefresh = deferred<string>();
  let ownerRefreshDone!: Promise<void>;
  await act(async () => { ownerRefreshDone = refresh(() => ownerRefresh.promise); });
  await act(async () => { renderer.update(element(secondOwner)); });
  assert.equal(value().state, "loading");
  await act(async () => { ownerRefresh.resolve("private history A"); await ownerRefreshDone; });
  assert.equal(value().state, "loading", "a read started under the former owner cannot publish after the switch");
  await act(async () => renderer.unmount());
});
