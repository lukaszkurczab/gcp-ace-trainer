import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { mock } from "node:test";

const require = createRequire(import.meta.url);

/** Real Firebase client adapter/SDK against Auth emulator, memory SecureStore port. */
export function createCost02FirebaseAuthClient({ projectId, authOrigin, onRpc }) {
  const origin = new URL(authOrigin);
  assert.match(projectId, /^demo-[a-z0-9-]+$/u, "cost02_auth_demo_required");
  assert.equal(origin.protocol, "http:");
  assert.equal(origin.hostname, "127.0.0.1");
  const secureStorePath = require.resolve("../../src/infrastructure/firebase/secureAuthPersistence.ts");
  const store = new Map();
  const secureStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    async getItemAsync(key) { return store.get(key) ?? null; },
    async setItemAsync(key, value) { store.set(key, value); },
    async deleteItemAsync(key) { store.delete(key); },
  };
  // The installed Node Auth SDK captures fetch during module initialization.
  // Its exported internal test port observes that actual captured transport;
  // replacing global.fetch alone can silently miss SDK restore requests.
  const { FetchProvider } = require("@firebase/auth/internal");
  const originalSdkFetch = FetchProvider.fetch();
  const originalSdkHeaders = FetchProvider.headers();
  const originalSdkResponse = FetchProvider.response();
  const guardedFetch = async (url, options) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.origin, origin.origin, "cost02_auth_external_request_forbidden");
    onRpc?.({ route: parsed.pathname, method: options?.method ?? "GET" });
    return originalSdkFetch(url, options);
  };
  FetchProvider.initialize(guardedFetch, originalSdkHeaders, originalSdkResponse);
  let auth;
  const build = () => {
    const originalLoad = Module._load;
    Module._load = function (request, parent, ...args) {
      if (parent?.filename === secureStorePath) {
        if (request === "expo-secure-store") return secureStore;
        if (request === "react-native") return { Platform: { OS: "ios" } };
      }
      return Reflect.apply(originalLoad, this, [request, parent, ...args]);
    };
    try {
      const { createFirebaseAuthClient } = require("../../src/infrastructure/firebase/firebaseAuthClient.ts");
      return createFirebaseAuthClient({ config: { projectId, apiKey: "cost02-emulator", appId: "cost02-local", authDomain: `${projectId}.invalid` },
        authActionOrigin: origin.origin, authEmulatorOrigin: origin.origin });
    } finally { Module._load = originalLoad; }
  };
  const deleteFixtureApp = async () => {
    const { getApps, deleteApp } = require("firebase/app");
    for (const app of getApps().filter((item) => item.name === "patternly" && item.options.projectId === projectId)) await deleteApp(app);
  };
  try { auth = build(); }
  catch (error) { FetchProvider.initialize(originalSdkFetch, originalSdkHeaders, originalSdkResponse); throw error; }
  return { get auth() { return auth; }, async restart() {
    await deleteFixtureApp();
    auth = build();
    let unsubscribe;
    let timer;
    try {
      return await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error("cost02_auth_restore_timeout")), 15_000);
        unsubscribe = auth.onUserChanged((user) => resolve(user));
      });
    } finally { clearTimeout(timer); unsubscribe?.(); }
  }, async close() {
    try {
      await deleteFixtureApp();
    } finally { FetchProvider.initialize(originalSdkFetch, originalSdkHeaders, originalSdkResponse); store.clear(); }
  } };
}

/**
 * Executes the production sidecar's real React effects. Only its platform event
 * sources and account-context port are substituted. Supply real measured client
 * callbacks from the isolated backend harness to join both evidence boundaries.
 * This is JS lifecycle evidence, not an OS launch or native SDK measurement.
 */
export async function runCost02LifecycleTriggers(input) {
  assert.equal(typeof input.measure, "function");
  for (const key of ["identity", "premium", "recovery", "coldStart"]) assert.equal(typeof input[key], "function", key);
  const React = require("react");
  const { act, create } = require("react-test-renderer");
  const sidecarPath = require.resolve("../../src/application/account/AccountForegroundRefreshSidecar.tsx");
  const appListeners = new Set();
  const networkListeners = new Set();
  const pending = new Set();
  const counts = { identity: 0, premium: 0, recovery: 0 };
  const snapshots = [];
  const AppState = {
    currentState: "active",
    addEventListener(_event, listener) { appListeners.add(listener); return { remove: () => appListeners.delete(listener) }; },
  };
  const NetInfo = {
    async fetch() { return { isInternetReachable: true }; },
    addEventListener(listener) { networkListeners.add(listener); return () => networkListeners.delete(listener); },
  };
  const track = (work, fallback) => {
    const task = Promise.resolve().then(work).catch(() => fallback);
    pending.add(task);
    void task.finally(() => pending.delete(task));
    return task;
  };
  const accountState = { kind: "authenticated", user: { uid: "cost02-lifecycle-actor" }, backendUser: { id: input.accountId ?? "cost02-lifecycle-account" }, accountData: {} };
  let account = {
    state: accountState,
    refreshAccountIdentity: () => { counts.identity++; return track(input.identity, { kind: "failure", failure: "backendUnavailable" }); },
    refreshPremiumEntitlement: () => { counts.premium++; return track(input.premium, "pending"); },
    retryLearningPlanRecovery: () => { counts.recovery++; return track(input.recovery, null); },
    capturePremiumPurchaseActor: () => null,
  };
  const originalLoad = Module._load;
  let Sidecar;
  // Limit substitutions to imports owned by the sidecar itself. All application
  // schedulers/reconnect helpers and React hook machinery remain production code.
  Module._load = function (request, parent, ...args) {
    if (parent?.filename === sidecarPath) {
      if (request === "react-native") return { AppState, Platform: { OS: "ios" } };
      if (request === "@react-native-community/netinfo") return { __esModule: true, default: NetInfo };
      if (request === "./AccountSessionProvider") return { usePatternlyAccount: () => account };
      if (request === "../../infrastructure/purchases") return { readPurchaseConfig: () => null, createRevenueCatGateway: () => { throw new Error("cost02_external_purchase_sdk_forbidden"); } };
    }
    return Reflect.apply(originalLoad, this, [request, parent, ...args]);
  };
  try {
    delete require.cache[sidecarPath];
    Sidecar = require(sidecarPath).AccountForegroundRefreshSidecar;
  } finally { Module._load = originalLoad; }
  let renderer;
  const previousAct = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  mock.timers.enable({ apis: ["setInterval"] });
  const settle = async () => {
    await act(async () => {
      for (let pass = 0; pass < 8; pass++) {
        await Promise.resolve();
        await Promise.all([...pending]);
      }
    });
  };
  const event = async (next) => {
    await act(async () => { AppState.currentState = next; for (const listener of appListeners) listener(next); });
    await settle();
  };
  const row = async (name, work, expected, details = {}) => {
    const before = { ...counts };
    await input.measure(name, async () => { await work(); await settle(); });
    const delta = Object.fromEntries(Object.keys(counts).map((key) => [key, counts[key] - before[key]]));
    assert.deepEqual(delta, expected, `${name}: unexpected production sidecar callbacks`);
    snapshots.push({ name, callbackCounts: delta, ...details });
  };
  try {
    await row("cold_start_account", async () => {
      await input.coldStart();
      await act(async () => { renderer = create(React.createElement(Sidecar)); });
    }, { identity: 0, premium: 1, recovery: 1 }, { boundary: "new React sidecar mount after measured application bootstrap; not native process startup" });
    await row("warm_start_account", async () => {
      account = { ...account, state: { ...accountState } };
      await act(async () => renderer.update(React.createElement(Sidecar)));
    }, { identity: 0, premium: 0, recovery: 0 }, { boundary: "rerender of mounted foreground tree, persisted account unchanged" });
    await row("idle_foreground_account", async () => { await act(async () => mock.timers.tick(60_000)); },
      { identity: 0, premium: 0, recovery: 0 }, { simulatedIntervalMs: 60_000, learningPlanRecoveryIncident: false });
    await row("background_foreground_account", async () => { await event("background"); await event("active"); },
      { identity: 1, premium: 1, recovery: 1 });
    await row("reconnect_account", async () => {
      await act(async () => { for (const listener of networkListeners) listener({ isInternetReachable: false }); });
      await act(async () => { for (const listener of networkListeners) listener({ isInternetReachable: true }); });
    }, { identity: 0, premium: 1, recovery: 1 });
    await row("reconnect_online_duplicate_account", async () => {
      await act(async () => { for (const listener of networkListeners) listener({ isInternetReachable: true }); });
    }, { identity: 0, premium: 0, recovery: 0 });
    await row("cold_start_guest", async () => {
      await act(async () => renderer.unmount());
      account = { ...account, state: { kind: "guest" } };
      await act(async () => { renderer = create(React.createElement(Sidecar)); });
    }, { identity: 0, premium: 0, recovery: 0 }, { boundary: "guest React sidecar mount; guest local-storage bootstrap measured separately" });
    await row("background_foreground_guest", async () => { await event("background"); await event("active"); },
      { identity: 0, premium: 0, recovery: 0 });
    await row("reconnect_guest", async () => {
      await act(async () => { for (const listener of networkListeners) listener({ isInternetReachable: false }); });
      await act(async () => { for (const listener of networkListeners) listener({ isInternetReachable: true }); });
    }, { identity: 0, premium: 0, recovery: 0 });
    await row("idle_foreground_guest", async () => { await act(async () => mock.timers.tick(60_000)); },
      { identity: 0, premium: 0, recovery: 0 }, { simulatedIntervalMs: 60_000 });
    await act(async () => renderer.unmount());
    renderer = null;
    assert.equal(appListeners.size, 0);
    assert.equal(networkListeners.size, 0);
    return { schema: "cost02-react-lifecycle-v1", source: "src/application/account/AccountForegroundRefreshSidecar.tsx", rows: snapshots,
      scope: "production React effects/scheduler/reconnect helpers with simulated platform events, account-context port and no configured native purchase subscription; callbacks connected by backend harness; no native startup timings, Firebase client RPC or RevenueCat SDK proof" };
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    mock.timers.reset();
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousAct;
    delete require.cache[sidecarPath];
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runCost02LifecycleTriggers({
    measure: async (_name, work) => work(), coldStart: async () => undefined,
    identity: async () => ({ kind: "success", next: "authenticated" }), premium: async () => "denied", recovery: async () => null,
  });
  console.log(JSON.stringify({ ...result, standalone: "callback contract probe only; use isolated backend matrix for remote counts" }));
}
