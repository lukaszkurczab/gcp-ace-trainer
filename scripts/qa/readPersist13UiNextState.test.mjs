import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { buildNativeExpression, collectAndWriteObservation, isObservation, outputPathForRun, parseArgs, validateNativeResult } from "./readPersist13UiNextState.mjs";

const runId = "2e80bf94-ec48-4c07-a026-95743fb44e1e";
const hash = (value) => createHash("sha256").update(value).digest("hex");

function observation(overrides = {}) {
  const physical = (logical) => `patternly:profile:v1:${runId}:${encodeURIComponent(`patternly:canonical:v1:${logical}`)}`;
  const sessionKey = physical("training-session:session-1");
  const timerKey = physical("active-foreground-timer");
  const keys = [sessionKey, timerKey, physical("training-session-index"), physical("active-training-session")].sort();
  const snapshot = keys.map((key, index) => ({ key, sha256: hash(`raw-${index}`) }));
  return Object.freeze({
    schema: "patternly:persist13-practice-ui-next-observation.v1", owner: "persist13-reset-fixture", runId,
    scenario: "practice_ui_next", phase: "ui_armed", sessionIdSha256: hash("session-1"),
    sessionPhysicalKeySha256: hash(sessionKey), occurrenceIdSha256: hash("occurrence-1"), sessionStableSha256: hash("session-state"),
    otherSessionsSha256: hash("other-sessions"), attemptSetSha256: hash("attempts"), reviewSetSha256: hash("reviews"),
    resultSetSha256: hash("results"), timerIdentitySha256: hash("timer-identity"), sessionCount: 1, attemptCount: 1,
    reviewCount: 1, resultCount: 0, currentItemIndex: 1, projectionKind: "unanswered", sessionElapsedMs: 20,
    timerAccumulatedMs: 20, timerCheckpointRevision: 3, beforeSnapshot: snapshot, afterSnapshot: snapshot, authCold: true, ...overrides,
  });
}

function runtime({ leaseRunId = runId, leaseCurrent = true, initialized = true, observe = observation() } = {}) {
  const events = { controlOpened: 0, rootRead: 0, sdkRequired: 0, getApps: 0, providersRead: 0, authInitializedRead: 0 };
  const moduleEntries = new Map(); const exportsById = new Map();
  const add = (id, verboseName, value, isInitialized = true) => {
    moduleEntries.set(id, { verboseName, isInitialized }); exportsById.set(id, value);
  };
  const storage = {
    captureActiveProfileStorageLease: () => ({ profile: { id: leaseRunId, kind: "guest", accountId: null } }),
    isActiveProfileStorageLeaseCurrent: () => leaseCurrent,
  };
  const control = { getString: () => JSON.stringify({ runId, scenario: "practice_ui_next", phase: "ui_armed" }) };
  const mmkv = { existsMMKV: (id) => id === `patternly-persist13-control-${runId}`, createMMKV: () => { events.controlOpened += 1; return control; } };
  const protocol = { isPersist13PracticeUiNextSidecar: () => true, isPersist13PracticeUiNextObservationCore: (value) => isObservation({ ...value, authCold: true }, runId) };
  const root = { readPersist13PracticeUiNextObservation: () => { events.rootRead += 1; return observe; } };
  const sdk = { getApps: () => { events.getApps += 1; return [{ container: { getProviders: () => { events.providersRead += 1; return [{ name: "auth", isInitialized: () => { events.authInitializedRead += 1; return false; } }]; } } }]; } };
  add(1, "src/infrastructure/storage/mmkvClient.ts", storage);
  add(2, "src/application/runtimeAuditability/Persist13ResetFixtureRoot.tsx", root);
  add(3, "src/application/runtimeAuditability/persist13ResetFixtureProtocol.ts", protocol);
  add(4, "node_modules/react-native-mmkv/src/index.ts", mmkv);
  add(5, "src/application/account/AccountSessionProvider.tsx", {}, true);
  add(6, "src/infrastructure/firebase/firebaseAuthClient.ts", {}, true);
  add(7, "node_modules/@firebase/app/dist/index.cjs.js", sdk, initialized);
  const load = (id) => { events.sdkRequired += 1; return exportsById.get(id); };
  load.getModules = () => moduleEntries;
  return { context: { __DEV__: true, HermesInternal: {}, __r: load }, events };
}

test("Next reader arguments and private output are fixed to a UUID-scoped receipt", () => {
  assert.deepEqual(parseArgs(["--run-id", runId, "--output", `.agent/private/persist13-ui-next-state/next-observation-${runId}.json`]), {
    runId, output: `.agent/private/persist13-ui-next-state/next-observation-${runId}.json`,
  });
  assert.equal(outputPathForRun("/repo", runId), `/repo/.agent/private/persist13-ui-next-state/next-observation-${runId}.json`);
  for (const args of [[], ["--run-id", "bad", "--output", "x"], ["--run-id", runId, "--output", "x", "--extra", "y"]]) assert.throws(() => parseArgs(args));
});

test("closed observation requires Q2, stable adjacent snapshots and no journal", () => {
  const value = observation();
  assert.equal(isObservation(value, runId), true);
  assert.equal(isObservation({ ...value, extra: "raw" }, runId), false);
  assert.equal(isObservation({ ...value, currentItemIndex: 0 }, runId), false);
  assert.equal(isObservation({ ...value, afterSnapshot: [...value.afterSnapshot, { key: `patternly:profile:v1:${runId}:patternly%3Acanonical%3Av1%3Ajournal%3Aactive`, sha256: hash("journal") }] }, runId), false);
  assert.equal(isObservation({ ...value, afterSnapshot: value.afterSnapshot.map((row) => row.key.includes("active-training-session") ? { ...row, sha256: hash("changed") } : row) }, runId), false);
  assert.equal(validateNativeResult({ protocol: "patternly.persist13-practice-ui-next-observation-reader.v1", result: "observed", runId, observation: Object.fromEntries(Object.entries(value).filter(([key]) => key !== "authCold")), authCold: true, readOnly: true }, runId).authCold, true);
});

test("Hermes expression gates the fixture before initialized SDK inspection and never initializes Auth", () => {
  const current = runtime();
  const result = JSON.parse(runInNewContext(buildNativeExpression(runId), current.context));
  assert.equal(result.result, "observed");
  assert.equal(result.authCold, true);
  assert.equal(result.observation.currentItemIndex, 1);
  assert.deepEqual(current.events, { controlOpened: 1, rootRead: 1, sdkRequired: 5, getApps: 1, providersRead: 1, authInitializedRead: 1 });

  const foreign = runtime({ leaseRunId: "b6d6c87c-8103-4b4c-9af9-77a0d7f002bf" });
  const rejected = JSON.parse(runInNewContext(buildNativeExpression(runId), foreign.context));
  assert.equal(rejected.category, "scope_rejected");
  assert.equal(foreign.events.controlOpened, 0);
  assert.equal(foreign.events.getApps, 0);

  const coldModule = runtime({ initialized: false });
  const coldResult = JSON.parse(runInNewContext(buildNativeExpression(runId), coldModule.context));
  assert.equal(coldResult.result, "failed");
  assert.equal(coldModule.events.sdkRequired, 4);
  assert.equal(coldModule.events.getApps, 0);
});

test("pending observer sample is the only retryable reader outcome", () => {
  const pending = runtime({ observe: null });
  const value = JSON.parse(runInNewContext(buildNativeExpression(runId), pending.context));
  assert.deepEqual(validateNativeResult(value, runId), {
    protocol: "patternly.persist13-practice-ui-next-observation-reader.v1", result: "pending", runId,
    stage: "observe", category: "observation_pending", readOnly: true,
  });
});

test("collector recognizes the validated closed DTO as success and writes it exactly once", async () => {
  const dto = validateNativeResult({
    protocol: "patternly.persist13-practice-ui-next-observation-reader.v1", result: "observed", runId,
    observation: Object.fromEntries(Object.entries(observation()).filter(([key]) => key !== "authCold")),
    authCold: true, readOnly: true,
  }, runId);
  let inspectCount = 0; let reserveCount = 0; let writeCount = 0; let discardCount = 0; let waitCount = 0;
  const reserved = { id: "owned-test-reservation" };
  const result = await collectAndWriteObservation(runId, "/private/next.json", {
    inspect: async () => { inspectCount += 1; return dto; },
    reserve: (...args) => { reserveCount += 1; assert.equal(typeof args[0], "string"); assert.deepEqual(args.slice(1), [runId, "/private/next.json", "next"]); return reserved; },
    write: (target, value) => { writeCount += 1; assert.equal(target, reserved); assert.deepEqual(value, dto); },
    discard: (target) => { discardCount += 1; assert.equal(target, reserved); },
    wait: async () => { waitCount += 1; },
  });
  assert.deepEqual(result, dto);
  assert.deepEqual({ inspectCount, reserveCount, writeCount, discardCount, waitCount }, {
    inspectCount: 1, reserveCount: 1, writeCount: 1, discardCount: 0, waitCount: 0,
  });
});

test("collector bounds pending samples and never reserves output for pending or failed results", async () => {
  const pending = validateNativeResult({
    protocol: "patternly.persist13-practice-ui-next-observation-reader.v1", result: "pending", runId,
    stage: "observe", category: "observation_pending", readOnly: true,
  }, runId);
  let reserveCount = 0; let writeCount = 0; let discardCount = 0; let waitCount = 0;
  const dependencies = {
    inspect: async () => pending,
    reserve: () => { reserveCount += 1; return {}; },
    write: () => { writeCount += 1; },
    discard: () => { discardCount += 1; },
    wait: async () => { waitCount += 1; },
    maxSamples: 3,
  };
  await assert.rejects(collectAndWriteObservation(runId, "/private/next.json", dependencies), (error) => {
    assert.equal(error.stage, "observe"); assert.equal(error.category, "observation_pending"); return true;
  });
  assert.deepEqual({ reserveCount, writeCount, discardCount, waitCount }, { reserveCount: 0, writeCount: 0, discardCount: 0, waitCount: 2 });

  const failed = validateNativeResult({
    protocol: "patternly.persist13-practice-ui-next-observation-reader.v1", result: "failed", runId,
    stage: "scope", category: "scope_rejected", readOnly: true,
  }, runId);
  await assert.rejects(collectAndWriteObservation(runId, "/private/next.json", { ...dependencies, inspect: async () => failed }), (error) => {
    assert.equal(error.stage, "scope"); assert.equal(error.category, "scope_rejected"); return true;
  });
  assert.equal(reserveCount, 0);
  assert.equal(writeCount, 0);
  assert.equal(discardCount, 0);
});
