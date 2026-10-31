import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {
  applyExpoDebugSocketPatch,
  EXPO_MESSAGE_SOCKET_AFTER_SHA256,
  EXPO_MESSAGE_SOCKET_BEFORE_SHA256,
  EXPO_MESSAGE_SOCKET_PATH,
  EXPO_VERSION,
  patchSource,
} from "./acmNativeFixtureExpoDebugSocketPatch.mjs";

const CANONICAL_NODE_MODULES = path.resolve("node_modules");
const SOURCE = readFileSync(path.join(CANONICAL_NODE_MODULES, "expo", EXPO_MESSAGE_SOCKET_PATH), "utf8");
const RUN_UUID = "6fdc3f31-a4f0-4dd5-8f18-b73559987756";

test("the fixture patch has an exact Expo-version source shape and stable hashes", () => {
  const patched = patchSource(SOURCE);
  assert.equal(EXPO_VERSION, "57.0.17");
  assert.equal(hash(SOURCE), EXPO_MESSAGE_SOCKET_BEFORE_SHA256);
  assert.equal(hash(patched), EXPO_MESSAGE_SOCKET_AFTER_SHA256);
  assert.match(patched, /if \(!fixtureSocketSkip\) \{[\s\S]*?throw new Error\('Cannot create devtools websocket connections in embedded environments\.'\);/u);
  assert.match(patched, /if \(socket\) socket\.onmessage/u);
  assert.throws(() => patchSource(SOURCE.replace("const socket: WebSocket", "const socket: any")), /shape mismatch/u);
});

test("only private COW Expo 57.0.17 source is patched and the real SDK module skips only the embedded fixture RSC socket", (t) => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "patternly-expo-debug-patch-"));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const privateRoot = path.join(sandbox, "private");
  const canonicalNodeModules = path.join(sandbox, "canonical-node_modules");
  const runDirectory = path.join(privateRoot, RUN_UUID);
  const workspace = path.join(runDirectory, "workspace", "create");
  const stagedModules = path.join(workspace, "node_modules");
  const stagedExpo = path.join(stagedModules, "expo");
  const canonicalExpo = path.join(canonicalNodeModules, "expo");
  mkdirSync(path.join(stagedExpo, "src/async-require"), { recursive: true });
  mkdirSync(path.join(canonicalExpo, "src/async-require"), { recursive: true });
  writeFileSync(path.join(stagedExpo, "package.json"), JSON.stringify({ version: EXPO_VERSION }));
  writeFileSync(path.join(canonicalExpo, "package.json"), JSON.stringify({ version: EXPO_VERSION }));
  writeFileSync(path.join(stagedExpo, EXPO_MESSAGE_SOCKET_PATH), SOURCE);
  writeFileSync(path.join(canonicalExpo, EXPO_MESSAGE_SOCKET_PATH), SOURCE);

  const patch = applyExpoDebugSocketPatch({ workspace, privateRoot, canonicalNodeModules, runUUID: RUN_UUID, operation: "create" });
  assert.equal(patch.beforeSha256, EXPO_MESSAGE_SOCKET_BEFORE_SHA256);
  assert.equal(patch.afterSha256, EXPO_MESSAGE_SOCKET_AFTER_SHA256);
  assert.equal(patch.canonicalSourceSha256, EXPO_MESSAGE_SOCKET_BEFORE_SHA256);
  assert.equal(hash(readFileSync(path.join(canonicalExpo, EXPO_MESSAGE_SOCKET_PATH))), EXPO_MESSAGE_SOCKET_BEFORE_SHA256);
  assert.equal(hash(readFileSync(path.join(stagedExpo, EXPO_MESSAGE_SOCKET_PATH))), EXPO_MESSAGE_SOCKET_AFTER_SHA256);

  const patchedSource = readFileSync(path.join(stagedExpo, EXPO_MESSAGE_SOCKET_PATH), "utf8");
  const compiled = ts.transpileModule(patchedSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const fixtureEnv = {
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE: "1",
    EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID: RUN_UUID,
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION: "create",
  };
  assert.deepEqual(runPatchedModule(compiled, { env: fixtureEnv, bundleLoadedFromServer: false }).webSocketUrls, []);
  assert.deepEqual(runPatchedModule(compiled, {
    env: { ...fixtureEnv, EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION: "resume" },
    bundleLoadedFromServer: false,
  }).webSocketUrls, []);

  for (const env of [
    {},
    { ...fixtureEnv, EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE: "true" },
    { ...fixtureEnv, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" },
    { ...fixtureEnv, EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID: "not-a-uuid" },
    { ...fixtureEnv, EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION: "delete" },
  ]) {
    assert.throws(
      () => runPatchedModule(compiled, { env, bundleLoadedFromServer: false }),
      /Cannot create devtools websocket connections in embedded environments\./u,
    );
  }

  const serverLoaded = runPatchedModule(compiled, { env: fixtureEnv, bundleLoadedFromServer: true, url: "https://metro.example:8081/" });
  assert.deepEqual(serverLoaded.webSocketUrls, ["wss://metro.example:8081/message"]);
  assert.equal(serverLoaded.getDevServerCalls, 1);
  const ordinaryServerLoaded = runPatchedModule(compiled, { env: {}, bundleLoadedFromServer: true, url: "http://127.0.0.1:8081/" });
  assert.deepEqual(ordinaryServerLoaded.webSocketUrls, ["ws://127.0.0.1:8081/message"]);
});

test("patch rejects a wrong SDK version, an escaped workspace, and a symlinked module tree", (t) => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "patternly-expo-debug-patch-reject-"));
  t.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const privateRoot = path.join(sandbox, "private");
  const canonicalNodeModules = path.join(sandbox, "canonical-node_modules");
  const runDirectory = path.join(privateRoot, RUN_UUID);
  const workspace = path.join(runDirectory, "workspace", "create");
  const expo = path.join(workspace, "node_modules/expo");
  mkdirSync(path.join(expo, "src/async-require"), { recursive: true });
  mkdirSync(path.join(canonicalNodeModules, "expo/src/async-require"), { recursive: true });
  writeFileSync(path.join(expo, "package.json"), JSON.stringify({ version: "57.0.18" }));
  writeFileSync(path.join(expo, EXPO_MESSAGE_SOCKET_PATH), SOURCE);
  writeFileSync(path.join(canonicalNodeModules, "expo/package.json"), JSON.stringify({ version: EXPO_VERSION }));
  writeFileSync(path.join(canonicalNodeModules, "expo", EXPO_MESSAGE_SOCKET_PATH), SOURCE);
  assert.throws(() => applyExpoDebugSocketPatch({ workspace, privateRoot, canonicalNodeModules, runUUID: RUN_UUID, operation: "create" }), /exactly Expo/u);
  assert.throws(() => applyExpoDebugSocketPatch({ workspace: path.join(sandbox, "elsewhere"), privateRoot, canonicalNodeModules, runUUID: RUN_UUID, operation: "create" }), /exact private run phase/u);

  const linkedWorkspace = path.join(privateRoot, RUN_UUID, "workspace", "resume");
  mkdirSync(linkedWorkspace, { recursive: true });
  mkdirSync(path.join(sandbox, "outside"), { recursive: true });
  cpSync(canonicalNodeModules, path.join(sandbox, "outside/node_modules"), { recursive: true });
  symlinkSync(path.join(sandbox, "outside/node_modules"), path.join(linkedWorkspace, "node_modules"), "dir");
  assert.throws(() => applyExpoDebugSocketPatch({ workspace: linkedWorkspace, privateRoot, canonicalNodeModules, runUUID: RUN_UUID, operation: "resume" }), /private, non-symlink/u);
});

function runPatchedModule(code, { env, bundleLoadedFromServer, url = "http://127.0.0.1:8081/" }) {
  const webSocketUrls = [];
  class ControlledWebSocket {
    constructor(value) { webSocketUrls.push(value); }
  }
  let getDevServerCalls = 0;
  const context = {
    __DEV__: true,
    process: { env },
    URL,
    WebSocket: ControlledWebSocket,
    require(specifier) {
      assert.equal(specifier, "./getDevServer");
      return { __esModule: true, default: () => {
        getDevServerCalls += 1;
        return { bundleLoadedFromServer, url };
      } };
    },
    exports: {},
    module: { exports: {} },
  };
  vm.runInNewContext(code, context, { filename: "node_modules/expo/src/async-require/messageSocket.native.ts" });
  return { webSocketUrls, getDevServerCalls };
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

