import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, chmodSync, closeSync, lstatSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";

import {
  buildNativeExpression,
  discardReservedOutput,
  exitCodeForObservation,
  isAuthColdObservation,
  nativeDiscoveryUrl,
  outputPathForProbe,
  parseArgs,
  reservePrivateOutput,
  selectNativeTarget,
  validateNativeResult,
  writeReservedOutput,
} from "./readPersist13UiAuthState.mjs";

const runId = "e90296b2-2584-4656-b6b0-30679881d485";
const expectedOutputName = `auth-state-${runId}.json`;

test("CLI accepts only the closed run-id/output flag pair and a UUIDv4", () => {
  assert.deepEqual(parseArgs(["--run-id", runId, "--output", `.agent/private/persist13-ui-auth-state/${expectedOutputName}`]), {
    runId, output: `.agent/private/persist13-ui-auth-state/${expectedOutputName}`,
  });
  for (const args of [
    [], ["--run-id", "bad", "--output", "file"],
    ["--run-id", runId, "--output", "file", "--extra", "x"],
    ["--run-id", runId, "--output", "file", "--output", "other"],
    ["--wrong", runId, "--output", "file"], ["--run-id", runId, "--output"],
  ]) assert.throws(() => parseArgs(args));
});

function createPrivateTestRoot() {
  const root = realTempDirectory();
  mkdirSync(join(root, ".agent"), { mode: 0o700 });
  mkdirSync(join(root, ".agent", "private"), { mode: 0o700 });
  return root;
}

function realTempDirectory() {
  return realpathSync(mkdtempSync(join(tmpdir(), "persist13-auth-cli-")));
}

function expectedOutput(root) {
  return join(root, ".agent", "private", "persist13-ui-auth-state", expectedOutputName);
}

test("private output is exclusively reserved at 0700 directory and 0600 file modes", () => {
  const root = createPrivateTestRoot();
  try {
    const output = reservePrivateOutput(root, runId, expectedOutput(root));
    closeSync(output.descriptor);
    assert.equal(lstatSync(dirname(output.path)).mode & 0o777, 0o700);
    assert.equal(lstatSync(output.path).mode & 0o777, 0o600);
    assert.throws(() => reservePrivateOutput(root, runId, expectedOutput(root)));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("shared private output owner reserves an isolated Next observation path", () => {
  const root = createPrivateTestRoot();
  try {
    const outputPath = outputPathForProbe(root, runId, "next");
    assert.equal(outputPath, join(root, ".agent", "private", "persist13-ui-next-state", `next-observation-${runId}.json`));
    const reserved = reservePrivateOutput(root, runId, outputPath, "next");
    closeSync(reserved.descriptor);
    assert.equal(lstatSync(dirname(reserved.path)).mode & 0o777, 0o700);
    assert.equal(lstatSync(reserved.path).mode & 0o777, 0o600);
    assert.throws(() => reservePrivateOutput(root, runId, outputPath, "next"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("exclusive output reservation preserves the winner after a competing open fails", () => {
  const root = createPrivateTestRoot();
  try {
    const reserved = reservePrivateOutput(root, runId, expectedOutput(root));
    assert.throws(() => reservePrivateOutput(root, runId, expectedOutput(root)));
    const value = { result: "observed", runId, readOnly: true };
    writeReservedOutput(reserved, value);
    assert.deepEqual(JSON.parse(readFileSync(reserved.path, "utf8")), value);
    assert.equal(lstatSync(reserved.path).mode & 0o777, 0o600);
    assert.equal(reserved.descriptor, null);
    assert.equal(reserved.written, true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("failed write and discard leave a replacement path untouched", () => {
  const root = createPrivateTestRoot();
  try {
    const reserved = reservePrivateOutput(root, runId, expectedOutput(root));
    unlinkSync(reserved.path);
    writeFileSync(reserved.path, "replacement receipt", { mode: 0o600 });
    assert.throws(() => writeReservedOutput(reserved, { result: "observed", runId }));
    discardReservedOutput(reserved);
    assert.equal(readFileSync(reserved.path, "utf8"), "replacement receipt");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("discovery uses localhost while the debugger handshake keeps the native-tested IPv4 origin", () => {
  const target = {
    type: "node", appId: "com.lkurczab.patternly", deviceName: "iPhone 17", id: "local-1",
    reactNative: { logicalDeviceId: "local" },
    webSocketDebuggerUrl: "ws://localhost:8082/inspector/debug?device=local&page=1",
  };
  assert.equal(nativeDiscoveryUrl().origin, "http://localhost:8082");
  assert.deepEqual(selectNativeTarget([target]), {
    endpoint: target.webSocketDebuggerUrl,
    websocketOrigin: "http://127.0.0.1:8082",
  });
});

test("private output rejects outside paths, existing files, file symlinks and directory symlinks", () => {
  const outsideRoot = createPrivateTestRoot();
  try {
    assert.throws(() => reservePrivateOutput(outsideRoot, runId, join(outsideRoot, "outside.json")));
  } finally { rmSync(outsideRoot, { recursive: true, force: true }); }

  const existingRoot = createPrivateTestRoot();
  try {
    const directory = join(existingRoot, ".agent", "private", "persist13-ui-auth-state");
    mkdirSync(directory, { mode: 0o700 });
    chmodSync(directory, 0o700);
    writeFileSync(expectedOutput(existingRoot), "existing", { mode: 0o600 });
    assert.throws(() => reservePrivateOutput(existingRoot, runId, expectedOutput(existingRoot)));
  } finally { rmSync(existingRoot, { recursive: true, force: true }); }

  const symlinkFileRoot = createPrivateTestRoot();
  try {
    const directory = join(symlinkFileRoot, ".agent", "private", "persist13-ui-auth-state");
    mkdirSync(directory, { mode: 0o700 });
    chmodSync(directory, 0o700);
    const target = join(directory, "target.json");
    writeFileSync(target, "private", { mode: 0o600 });
    symlinkSync(target, expectedOutput(symlinkFileRoot));
    assert.throws(() => reservePrivateOutput(symlinkFileRoot, runId, expectedOutput(symlinkFileRoot)));
  } finally { rmSync(symlinkFileRoot, { recursive: true, force: true }); }

  const symlinkDirectoryRoot = createPrivateTestRoot();
  try {
    const target = join(symlinkDirectoryRoot, "target");
    mkdirSync(target, { mode: 0o700 });
    const outputDirectory = join(symlinkDirectoryRoot, ".agent", "private", "persist13-ui-auth-state");
    symlinkSync(target, outputDirectory, "dir");
    assert.throws(() => reservePrivateOutput(symlinkDirectoryRoot, runId, expectedOutput(symlinkDirectoryRoot)));
  } finally { rmSync(symlinkDirectoryRoot, { recursive: true, force: true }); }
});

function executeGeneratedExpression({ leaseRunId = runId, phase = "ui_armed", sdkInitialized = true, authInitialized = false, leaseStillCurrent = true } = {}) {
  const events = { controlOpened: 0, sdkRequired: 0, getApps: 0, providersRead: 0, authInitializedRead: 0, forbiddenLookup: 0, leaseCurrent: 0 };
  const modules = new Map();
  const exportsById = new Map();
  const add = (id, verboseName, exports, isInitialized = true) => {
    modules.set(id, { verboseName, isInitialized });
    exportsById.set(id, exports);
  };
  const storage = {
    captureActiveProfileStorageLease: () => ({ profile: { id: leaseRunId, kind: "guest", accountId: null } }),
    isActiveProfileStorageLeaseCurrent: () => { events.leaseCurrent += 1; return leaseStillCurrent || events.leaseCurrent < 2; },
  };
  const control = { getString: () => JSON.stringify({ runId, scenario: "practice_ui_probe", phase }) };
  const mmkv = {
    existsMMKV: (id) => id === `patternly-persist13-control-${runId}`,
    createMMKV: () => { events.controlOpened += 1; return control; },
  };
  const protocol = {
    PERSIST13_SCENARIO_SIDECAR_KEY: "scenario-sidecar",
    isPersist13PracticeUiProbeSidecar: (value, id) => value?.scenario === "practice_ui_probe" && value?.runId === id,
  };
  add(1, "src/infrastructure/storage/mmkvClient.ts", storage);
  add(2, "src/application/runtimeAuditability/Persist13PracticeUiHost.tsx", {});
  add(3, "node_modules/react-native-mmkv/src/index.ts", mmkv);
  add(4, "src/application/runtimeAuditability/persist13ResetFixtureProtocol.ts", protocol);
  add(5, "src/application/account/AccountSessionProvider.tsx", {}, true);
  add(6, "src/infrastructure/firebase/firebaseAuthClient.ts", {}, true);
  const provider = { name: "auth", isInitialized: () => { events.authInitializedRead += 1; return authInitialized; } };
  const sdk = {
    getApps: () => {
      events.getApps += 1;
      return [{ container: { getProviders: () => { events.providersRead += 1; return [provider]; } } }];
    },
    getAuth: () => { events.forbiddenLookup += 1; throw new Error("forbidden_getAuth"); },
    getProvider: () => { events.forbiddenLookup += 1; throw new Error("forbidden_getProvider"); },
  };
  add(7, "node_modules/@firebase/app/dist/index.cjs.js", sdk, sdkInitialized);
  const nativeRequire = (id) => {
    if (id === 7) events.sdkRequired += 1;
    return exportsById.get(id);
  };
  nativeRequire.getModules = () => modules;
  const raw = runInNewContext(buildNativeExpression(runId), { __DEV__: true, HermesInternal: {}, __r: nativeRequire });
  return { value: validateNativeResult(JSON.parse(raw), runId), events };
}

test("generated native expression rejects a foreign lease before opening control or reading Firebase", () => {
  const { value, events } = executeGeneratedExpression({ leaseRunId: "12345678-1234-4234-8234-123456789abc" });
  assert.deepEqual({ result: value.result, stage: value.stage, category: value.category }, { result: "failed", stage: "scope", category: "scope_rejected" });
  assert.equal(events.controlOpened, 0);
  assert.equal(events.sdkRequired, 0);
  assert.equal(events.getApps, 0);
});

test("generated native expression rejects a non-armed sidecar before reading Firebase", () => {
  const { value, events } = executeGeneratedExpression({ phase: "ready" });
  assert.deepEqual({ result: value.result, stage: value.stage, category: value.category }, { result: "failed", stage: "scope", category: "host_phase_unverified" });
  assert.equal(events.sdkRequired, 0);
  assert.equal(events.getApps, 0);
});

test("generated native expression rechecks the active lease after SDK inspection", () => {
  const { value, events } = executeGeneratedExpression({ leaseStillCurrent: false });
  assert.deepEqual({ result: value.result, stage: value.stage, category: value.category }, { result: "failed", stage: "scope", category: "scope_changed" });
  assert.equal(events.leaseCurrent, 2);
  assert.equal(events.getApps, 1);
});

test("generated native expression never requires an uninitialized Firebase SDK module", () => {
  const { value, events } = executeGeneratedExpression({ sdkInitialized: false });
  assert.equal(value.result, "observed");
  assert.equal(value.sdkCoreRead, false);
  assert.equal(value.authCold, false);
  assert.equal(isAuthColdObservation(value), false);
  assert.equal(exitCodeForObservation(value), 1);
  assert.equal(events.sdkRequired, 0);
  assert.equal(events.getApps, 0);
});

test("generated native expression reads existing Firebase auth initialization without lookup APIs", () => {
  const { value, events } = executeGeneratedExpression();
  assert.equal(value.result, "observed");
  assert.equal(value.sdkCoreRead, true);
  assert.equal(value.sdkOwners[0]?.appCount, 1);
  assert.equal(value.sdkOwners[0]?.initializedAuthProviders, 0);
  assert.equal(value.authCold, true);
  assert.equal(isAuthColdObservation(value), true);
  assert.equal(exitCodeForObservation(value), 0);
  assert.equal(events.sdkRequired, 1);
  assert.equal(events.getApps, 1);
  assert.equal(events.providersRead, 1);
  assert.equal(events.authInitializedRead, 1);
  assert.equal(events.forbiddenLookup, 0);
  assert.equal(events.leaseCurrent, 2);
});

test("initialized Auth provider is reported non-cold and cannot pass", () => {
  const { value } = executeGeneratedExpression({ authInitialized: true });
  assert.equal(value.authCold, false);
  assert.equal(isAuthColdObservation(value), false);
});

test("native receipt validator rejects unscoped, malformed, and extra private payloads", () => {
  const { value } = executeGeneratedExpression();
  assert.throws(() => validateNativeResult({ ...value, runId: "12345678-1234-4234-8234-123456789abc" }, runId));
  assert.throws(() => validateNativeResult({ ...value, raw: "private" }, runId));
  assert.throws(() => validateNativeResult({ ...value, sdkOwners: [{ ...value.sdkOwners[0], path: "/private/user/path" }] }, runId));
});
