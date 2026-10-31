import { createHash, randomBytes } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const EXPO_VERSION = "57.0.17";
export const EXPO_MESSAGE_SOCKET_PATH = "src/async-require/messageSocket.native.ts";
export const EXPO_MESSAGE_SOCKET_BEFORE_SHA256 = "659a610d229243c9c1a96fc1376611e432271c833aeb12100565b01adc5a7940";
export const EXPO_MESSAGE_SOCKET_AFTER_SHA256 = "472dbe19a44dcbf51ce1579c54f4139a0aa2e2cdd9032b92d79cc878762c0848";
export const PATCH_SCHEMA = "patternly.acm-native-fixture-expo-debug-socket-patch.v1";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ORIGINAL_GUARD = `    if (!devServer.bundleLoadedFromServer) {
      throw new Error('Cannot create devtools websocket connections in embedded environments.');
    }`;
const PATCHED_GUARD = `    if (!devServer.bundleLoadedFromServer) {
      const fixtureSocketSkip = process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE === '1'
        && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === 'smoke'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID ?? ''
        )
        && ['create', 'resume'].includes(process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION ?? '');
      if (!fixtureSocketSkip) {
        throw new Error('Cannot create devtools websocket connections in embedded environments.');
      }
      return null;
    }`;

const ORIGINAL_SOCKET_DECLARATION = "  const socket: WebSocket = (() => {";
const PATCHED_SOCKET_DECLARATION = "  const socket: WebSocket | null = (() => {";
const ORIGINAL_HANDLER = "  socket.onmessage = (message: { data: any }) => {";
const PATCHED_HANDLER = "  if (socket) socket.onmessage = (message: { data: any }) => {";

export function patchSource(source) {
  if (typeof source !== "string") throw new Error("Expo SDK source must be text.");
  for (const [name, anchor] of [
    ["embedded guard", ORIGINAL_GUARD],
    ["WebSocket declaration", ORIGINAL_SOCKET_DECLARATION],
    ["RSC message handler", ORIGINAL_HANDLER],
  ]) {
    if (count(source, anchor) !== 1) throw new Error(`Expo SDK patch shape mismatch: expected one ${name}.`);
  }
  return source
    .replace(ORIGINAL_GUARD, PATCHED_GUARD)
    .replace(ORIGINAL_SOCKET_DECLARATION, PATCHED_SOCKET_DECLARATION)
    .replace(ORIGINAL_HANDLER, PATCHED_HANDLER);
}

export function applyExpoDebugSocketPatch({ workspace, privateRoot, canonicalNodeModules, runUUID, operation }) {
  if (!UUID_V4.test(runUUID ?? "") || !["create", "resume"].includes(operation)) {
    throw new Error("Expo SDK patch identity must contain a UUIDv4 and create/resume operation.");
  }
  const workspaceAbsolute = path.resolve(workspace);
  const privateRootAbsolute = path.resolve(privateRoot);
  const expectedWorkspace = path.join(privateRootAbsolute, runUUID.toLowerCase(), "workspace", operation);
  if (workspaceAbsolute !== expectedWorkspace) throw new Error("Expo SDK patch workspace is outside the exact private run phase.");

  const privateRootReal = realpathSync(privateRootAbsolute);
  const workspaceReal = realpathSync(workspaceAbsolute);
  if (!workspaceReal.startsWith(`${privateRootReal}${path.sep}`)) throw new Error("Expo SDK patch workspace resolves outside private staging.");

  const stagedNodeModules = path.join(workspaceReal, "node_modules");
  const canonicalModulesReal = realpathSync(canonicalNodeModules);
  const stagedModulesReal = realpathSync(stagedNodeModules);
  const stagedModulesStat = lstatSync(stagedNodeModules);
  if (!stagedModulesStat.isDirectory() || stagedModulesStat.isSymbolicLink()
    || stagedModulesReal === canonicalModulesReal
    || !stagedModulesReal.startsWith(`${workspaceReal}${path.sep}`)) {
    throw new Error("Expo SDK patch requires a private, non-symlink node_modules copy-on-write directory.");
  }

  const packageRoot = path.join(stagedModulesReal, "expo");
  const packageJson = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  if (packageJson.version !== EXPO_VERSION) throw new Error(`Expo SDK patch requires exactly Expo ${EXPO_VERSION}.`);
  const sourcePath = path.join(packageRoot, EXPO_MESSAGE_SOCKET_PATH);
  const sourceReal = realpathSync(sourcePath);
  if (!sourceReal.startsWith(`${packageRoot}${path.sep}`)) throw new Error("Expo SDK patch target resolves outside the staged Expo package.");
  const before = readFileSync(sourceReal);
  const beforeSha256 = sha256(before);
  if (beforeSha256 !== EXPO_MESSAGE_SOCKET_BEFORE_SHA256) throw new Error("Expo SDK patch source SHA does not match the reviewed pristine Expo 57.0.17 file.");
  const canonicalSource = path.join(canonicalModulesReal, "expo", EXPO_MESSAGE_SOCKET_PATH);
  const canonicalSourceReal = realpathSync(canonicalSource);
  if (!canonicalSourceReal.startsWith(`${canonicalModulesReal}${path.sep}`)
    || sha256(readFileSync(canonicalSourceReal)) !== EXPO_MESSAGE_SOCKET_BEFORE_SHA256) {
    throw new Error("Canonical Expo SDK source is not the reviewed pristine version; refusing private patching.");
  }
  const patched = Buffer.from(patchSource(before.toString("utf8")));
  const afterSha256 = sha256(patched);
  if (afterSha256 !== EXPO_MESSAGE_SOCKET_AFTER_SHA256) throw new Error("Expo SDK patch output SHA does not match the reviewed fixture-scoped patch.");

  const temporary = path.join(path.dirname(sourceReal), `.messageSocket.native.ts.${process.pid}.${randomSuffix()}.tmp`);
  try {
    writeFileSync(temporary, patched, { mode: statSync(sourceReal).mode & 0o777, flag: "wx" });
    renameSync(temporary, sourceReal);
  } finally {
    try { unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  if (sha256(readFileSync(sourceReal)) !== EXPO_MESSAGE_SOCKET_AFTER_SHA256) {
    throw new Error("Expo SDK patch post-write SHA verification failed.");
  }
  const canonicalAfterSha256 = sha256(readFileSync(canonicalSourceReal));
  if (canonicalAfterSha256 !== EXPO_MESSAGE_SOCKET_BEFORE_SHA256) throw new Error("Canonical Expo SDK source changed during private patching.");
  return Object.freeze({
    schema: PATCH_SCHEMA,
    expoVersion: EXPO_VERSION,
    target: "node_modules/expo/src/async-require/messageSocket.native.ts",
    runUUID: runUUID.toLowerCase(),
    operation,
    sourceScope: "private-cow-workspace-only",
    canonicalSourceSha256: canonicalAfterSha256,
    beforeSha256,
    afterSha256,
    appliedAt: new Date().toISOString(),
  });
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function randomSuffix() {
  return `${os.hostname().replace(/[^a-z0-9]/giu, "")}-${randomBytes(8).toString("hex")}`;
}
