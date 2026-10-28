import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { buildInitializedAuthInspectionExpression, outputPathForProbe, reservePrivateOutput, writeReservedOutput, discardReservedOutput, nativeDiscoveryUrl, selectNativeTarget } from "./readPersist13UiAuthState.mjs";
import { request } from "./readNativeStartupTrace.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(SCRIPT_PATH), "../..");
const PROTOCOL = "patternly.persist13-practice-ui-next-observation-reader.v1";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const FAILURE_STAGES = new Set(["preflight", "runtime", "scope", "inspection", "readback", "transport", "private_output", "observe"]);
const FAILURE_CATEGORIES = new Set(["arguments_rejected", "output_path_rejected", "output_exists", "runtime_rejected", "root_not_initialized", "runtime_owner_unavailable", "scope_rejected", "scope_changed", "control_missing", "sidecar_invalid", "host_phase_unverified", "observation_pending", "observation_invalid", "sdk_contract_unavailable", "module_metadata_unavailable", "inspection_failed", "target_rejected", "transport_closed", "read_timeout", "connect_failed", "discovery_failed", "native_eval_failed", "receipt_rejected", "readback_failed", "output_write_failed"]);
const MAX_SAMPLES = 32;
const SAMPLE_DELAY_MS = 1_000;

class ProbeFailure extends Error {
  constructor(stage, category) { super("persist13_ui_next_reader_failed"); this.stage = stage; this.category = category; }
}

export function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length !== 4) throw new ProbeFailure("preflight", "arguments_rejected");
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]; const value = argv[index + 1];
    if (!["--run-id", "--output"].includes(flag) || values.has(flag) || typeof value !== "string" || !value || value.startsWith("--")) {
      throw new ProbeFailure("preflight", "arguments_rejected");
    }
    values.set(flag, value);
  }
  const runId = values.get("--run-id"); const output = values.get("--output");
  if (!UUID_V4.test(runId ?? "") || !output) throw new ProbeFailure("preflight", "arguments_rejected");
  return Object.freeze({ runId: runId.toLowerCase(), output });
}

export function outputPathForRun(projectRoot, runId) { return outputPathForProbe(projectRoot, runId, "next"); }

export function buildNativeExpression(runId) {
  if (!UUID_V4.test(runId ?? "")) throw new ProbeFailure("preflight", "arguments_rejected");
  const expected = Object.freeze({ runId: runId.toLowerCase(), controlStoreId: `patternly-persist13-control-${runId.toLowerCase()}` });
  return `JSON.stringify((()=>{
    const expected=${JSON.stringify(expected)};
    const failed=(stage,category)=>({protocol:${JSON.stringify(PROTOCOL)},result:'failed',runId:expected.runId,stage,category,readOnly:true});
    try {
      if(typeof __DEV__==='undefined'||!__DEV__||!globalThis.HermesInternal||typeof __r!=='function'||typeof __r.getModules!=='function')return failed('runtime','runtime_rejected');
      const modules=Array.from(__r.getModules().entries());
      const initializedOwner=path=>{const matches=modules.filter(([,module])=>module.verboseName?.endsWith(path));if(matches.length!==1||matches[0][1].isInitialized!==true)return null;return __r(matches[0][0]);};
      const storage=initializedOwner('src/infrastructure/storage/mmkvClient.ts');
      const root=initializedOwner('src/application/runtimeAuditability/Persist13ResetFixtureRoot.tsx');
      const protocol=initializedOwner('src/application/runtimeAuditability/persist13ResetFixtureProtocol.ts');
      const mmkv=initializedOwner('node_modules/react-native-mmkv/src/index.ts');
      if(!storage||typeof storage.captureActiveProfileStorageLease!=='function'||typeof storage.isActiveProfileStorageLeaseCurrent!=='function')return failed('scope','runtime_owner_unavailable');
      if(!root||typeof root.readPersist13PracticeUiNextObservation!=='function')return failed('scope','root_not_initialized');
      if(!protocol||typeof protocol.isPersist13PracticeUiNextSidecar!=='function'||typeof protocol.isPersist13PracticeUiNextObservationCore!=='function')return failed('scope','runtime_owner_unavailable');
      if(!mmkv||typeof mmkv.existsMMKV!=='function'||typeof mmkv.createMMKV!=='function')return failed('scope','runtime_owner_unavailable');
      const lease=storage.captureActiveProfileStorageLease();
      if(!lease||lease.profile?.id!==expected.runId||lease.profile.kind!=='guest'||lease.profile.accountId!==null||!storage.isActiveProfileStorageLeaseCurrent(lease))return failed('scope','scope_rejected');
      if(!mmkv.existsMMKV(expected.controlStoreId))return failed('scope','control_missing');
      const control=mmkv.createMMKV({id:expected.controlStoreId});
      const sidecar=JSON.parse(control.getString('patternly:persist13:scenario:v1')??'null');
      if(!protocol.isPersist13PracticeUiNextSidecar(sidecar,expected.runId))return failed('scope','sidecar_invalid');
      if(sidecar.phase!=='ui_armed')return failed('scope','host_phase_unverified');
      const observation=root.readPersist13PracticeUiNextObservation(expected.runId);
      if(observation===null)return {protocol:${JSON.stringify(PROTOCOL)},result:'pending',runId:expected.runId,stage:'observe',category:'observation_pending',readOnly:true};
      if(!protocol.isPersist13PracticeUiNextObservationCore(observation,expected.runId))return failed('readback','observation_invalid');
      const auth=${buildInitializedAuthInspectionExpression()};
      if(auth.kind==='failed')return failed(auth.stage,auth.category);
      if(!auth.authCold)return failed('inspection','sdk_contract_unavailable');
      return {protocol:${JSON.stringify(PROTOCOL)},result:'observed',runId:expected.runId,observation,authCold:auth.authCold,readOnly:true};
    }catch{return failed('inspection','inspection_failed');}
  })())`;
}

export function validateNativeResult(value, runId) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.protocol !== PROTOCOL || value.runId !== runId) throw new ProbeFailure("readback", "receipt_rejected");
  if (value.result === "failed" || value.result === "pending") {
    const keys = value.result === "pending" ? ["category", "protocol", "readOnly", "result", "runId", "stage"] : ["category", "protocol", "readOnly", "result", "runId", "stage"];
    if (Object.keys(value).sort().join("\0") !== keys.sort().join("\0") || value.readOnly !== true || !FAILURE_STAGES.has(value.stage) || !FAILURE_CATEGORIES.has(value.category)
      || (value.result === "pending" && (value.stage !== "observe" || value.category !== "observation_pending"))) throw new ProbeFailure("readback", "receipt_rejected");
    return Object.freeze({ protocol: PROTOCOL, result: value.result, runId, stage: value.stage, category: value.category, readOnly: true });
  }
  const keys = ["authCold", "observation", "protocol", "readOnly", "result", "runId"].sort();
  if (Object.keys(value).sort().join("\0") !== keys.join("\0") || value.result !== "observed" || value.authCold !== true || value.readOnly !== true
    || !isObservationCore(value.observation, runId)) throw new ProbeFailure("readback", "receipt_rejected");
  const observation = Object.freeze({ ...value.observation, authCold: true });
  if (!isObservation(observation, runId)) throw new ProbeFailure("readback", "receipt_rejected");
  return observation;
}

function isSnapshot(value) {
  if (!Array.isArray(value)) return false;
  const seen = new Set(); let previous = "";
  return value.every((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).sort().join("\0") !== ["key", "sha256"].join("\0")
      || typeof row.key !== "string" || !row.key || row.key <= previous || seen.has(row.key) || !/^[a-f0-9]{64}$/u.test(row.sha256 ?? "")) return false;
    previous = row.key; seen.add(row.key); return true;
  });
}

export function isObservation(value, runId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.authCold !== true) return false;
  const { authCold, ...core } = value;
  return isObservationCore(core, runId);
}

function isObservationCore(value, runId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = ["afterSnapshot", "attemptCount", "attemptSetSha256", "beforeSnapshot", "currentItemIndex", "occurrenceIdSha256", "otherSessionsSha256", "owner", "phase", "projectionKind", "resultCount", "resultSetSha256", "reviewCount", "reviewSetSha256", "runId", "scenario", "schema", "sessionCount", "sessionElapsedMs", "sessionIdSha256", "sessionPhysicalKeySha256", "sessionStableSha256", "timerAccumulatedMs", "timerCheckpointRevision", "timerIdentitySha256"].sort();
  if (Object.keys(value).sort().join("\0") !== keys.join("\0") || value.schema !== "patternly:persist13-practice-ui-next-observation.v1"
    || value.owner !== "persist13-reset-fixture" || value.runId !== runId || value.scenario !== "practice_ui_next" || value.phase !== "ui_armed"
    || value.currentItemIndex !== 1 || value.projectionKind !== "unanswered"
    || !["sessionIdSha256", "sessionPhysicalKeySha256", "occurrenceIdSha256", "sessionStableSha256", "otherSessionsSha256", "attemptSetSha256", "reviewSetSha256", "resultSetSha256", "timerIdentitySha256"].every((key) => /^[a-f0-9]{64}$/u.test(value[key] ?? ""))
    || !["sessionCount", "attemptCount", "reviewCount", "resultCount", "sessionElapsedMs", "timerAccumulatedMs", "timerCheckpointRevision"].every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0)
    || value.timerCheckpointRevision < 1 || !isSnapshot(value.beforeSnapshot) || !isSnapshot(value.afterSnapshot)) return false;
  const prefix = `patternly:profile:v1:${runId}:patternly%3Acanonical%3Av1%3Atraining-session%3A`;
  const sessionKeys = value.afterSnapshot.filter((row) => row.key.startsWith(prefix) && sha256Text(row.key) === value.sessionPhysicalKeySha256);
  if (sessionKeys.length !== 1) return false;
  const timerKey = `patternly:profile:v1:${runId}:patternly%3Acanonical%3Av1%3Aactive-foreground-timer`;
  const journalKey = `patternly:profile:v1:${runId}:patternly%3Acanonical%3Av1%3Ajournal%3Aactive`;
  const stableKeys = (snapshot) => snapshot.filter((row) => row.key !== sessionKeys[0].key && row.key !== timerKey);
  return value.beforeSnapshot.every((row) => row.key !== journalKey) && value.afterSnapshot.every((row) => row.key !== journalKey)
    && value.afterSnapshot.some((row) => row.key === timerKey)
    && stableKeys(value.beforeSnapshot).length === stableKeys(value.afterSnapshot).length
    && stableKeys(value.beforeSnapshot).every((row, index) => row.key === stableKeys(value.afterSnapshot)[index]?.key && row.sha256 === stableKeys(value.afterSnapshot)[index]?.sha256);
}

function sha256Text(value) {
  return createRequire(import.meta.url)("node:crypto").createHash("sha256").update(value, "utf8").digest("hex");
}

function delay(ms) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }

async function inspectOnce(runId, sample) {
  const response = await fetch(nativeDiscoveryUrl(), { signal: AbortSignal.timeout(5_000), redirect: "error" });
  if (!response.ok) throw new ProbeFailure("transport", "discovery_failed");
  const body = await response.text(); if (body.length > 64 * 1024) throw new ProbeFailure("transport", "target_rejected");
  let targets; try { targets = JSON.parse(body); } catch { throw new ProbeFailure("transport", "target_rejected"); }
  let target; try { target = selectNativeTarget(targets); } catch { throw new ProbeFailure("transport", "target_rejected"); }
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(target.endpoint, { origin: target.websocketOrigin, handshakeTimeout: 5_000, maxPayload: 128 * 1024, followRedirects: false });
  try {
    await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(new ProbeFailure("transport", "connect_failed"))); });
    const reply = await request(socket, sample, "Runtime.evaluate", { expression: buildNativeExpression(runId), returnByValue: true, silent: true });
    if (reply?.error || reply?.result?.exceptionDetails) throw new ProbeFailure("readback", "native_eval_failed");
    let value; try { value = JSON.parse(reply?.result?.result?.value ?? "null"); } catch { throw new ProbeFailure("readback", "receipt_rejected"); }
    return validateNativeResult(value, runId);
  } finally { socket.terminate(); }
}

export async function collectAndWriteObservation(runId, outputPath, dependencies = {}) {
  const inspect = dependencies.inspect ?? inspectOnce;
  const reserve = dependencies.reserve ?? reservePrivateOutput;
  const write = dependencies.write ?? writeReservedOutput;
  const discard = dependencies.discard ?? discardReservedOutput;
  const wait = dependencies.wait ?? delay;
  const maxSamples = dependencies.maxSamples ?? MAX_SAMPLES;
  let reserved;
  try {
    let observation = null;
    for (let sample = 1; sample <= maxSamples; sample += 1) {
      const result = await inspect(runId, sample);
      if (result?.result === "failed") throw new ProbeFailure(result.stage, result.category);
      if (isObservation(result, runId)) { observation = result; break; }
      if (result?.result !== "pending" || result.stage !== "observe" || result.category !== "observation_pending") {
        throw new ProbeFailure("readback", "receipt_rejected");
      }
      if (sample < maxSamples) await wait(SAMPLE_DELAY_MS);
    }
    if (!observation) throw new ProbeFailure("observe", "observation_pending");
    reserved = reserve(PROJECT_ROOT, runId, outputPath, "next");
    write(reserved, observation);
    return observation;
  } catch (error) {
    if (reserved) discard(reserved);
    throw error;
  }
}

function safeFailure(error) {
  if (error instanceof ProbeFailure) return { stage: error.stage, category: error.category };
  const category = new Set(["target_rejected", "transport_closed", "read_timeout", "connect_failed", "discovery_failed"]);
  return { stage: "transport", category: category.has(error?.message) ? error.message : "readback_failed" };
}

async function main(argv) {
  try {
    const args = parseArgs(argv);
    const expected = outputPathForRun(PROJECT_ROOT, args.runId);
    if (resolve(PROJECT_ROOT, args.output) !== expected) throw new ProbeFailure("preflight", "output_path_rejected");
    const observation = await collectAndWriteObservation(args.runId, expected);
    process.stdout.write(`${JSON.stringify({ result: "observed", runId: args.runId, phase: observation.phase, currentItemIndex: observation.currentItemIndex, sessionElapsedMs: observation.sessionElapsedMs, timerAccumulatedMs: observation.timerAccumulatedMs, timerCheckpointRevision: observation.timerCheckpointRevision, authCold: observation.authCold, readOnly: true })}\n`);
    process.exitCode = 0;
  } catch (error) {
    const failure = safeFailure(error);
    process.stderr.write(`${JSON.stringify({ result: "failed", ...failure })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) main(process.argv.slice(2));
