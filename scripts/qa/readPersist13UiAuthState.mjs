import { createRequire } from "node:module";
import { chmodSync, closeSync, fchmodSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = realpathSync(resolve(dirname(SCRIPT_PATH), "../.."));
const APP_PRIVATE_ROOT = join(PROJECT_ROOT, ".agent", "private");
const OUTPUT_DIRECTORY = join(APP_PRIVATE_ROOT, "persist13-ui-auth-state");
const APP_ID = "com.lkurczab.patternly";
export const NATIVE_TRANSPORT = Object.freeze({
  discoveryOrigin: parseOrigin("http://localhost:8082"),
  websocketOrigin: parseOrigin("http://127.0.0.1:8082"),
});
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const PROTOCOL = "patternly.persist13-ui-auth-state.v1";
const CORE_PATHS = Object.freeze([
  "node_modules/@firebase/app/dist/index.cjs.js",
  "node_modules/@firebase/app/dist/esm/index.esm.js",
]);

class ProbeFailure extends Error {
  constructor(stage, category) {
    super("persist13_ui_auth_state_probe_failed");
    this.stage = stage;
    this.category = category;
  }
}

export function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.length !== 4) throw new ProbeFailure("preflight", "arguments_rejected");
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!["--run-id", "--output"].includes(flag) || values.has(flag) || typeof value !== "string" || !value || value.startsWith("--")) {
      throw new ProbeFailure("preflight", "arguments_rejected");
    }
    values.set(flag, value);
  }
  const runId = values.get("--run-id");
  const output = values.get("--output");
  if (!UUID_V4.test(runId ?? "") || !output) throw new ProbeFailure("preflight", "arguments_rejected");
  return Object.freeze({ runId: runId.toLowerCase(), output });
}

export function nativeDiscoveryUrl() {
  return new URL("/json/list", NATIVE_TRANSPORT.discoveryOrigin);
}

export function selectNativeTarget(targets) {
  return Object.freeze({
    endpoint: selectTarget(targets, NATIVE_TRANSPORT.discoveryOrigin, APP_ID),
    websocketOrigin: NATIVE_TRANSPORT.websocketOrigin.origin,
  });
}

function requireOwnedDirectory(path, mode) {
  let metadata;
  try { metadata = lstatSync(path); } catch { throw new ProbeFailure("preflight", "private_path_rejected"); }
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || metadata.uid !== process.getuid()
    || (mode !== undefined && (metadata.mode & 0o777) !== mode)) {
    throw new ProbeFailure("preflight", "private_path_rejected");
  }
  try { if (realpathSync(path) !== path) throw new ProbeFailure("preflight", "private_path_rejected"); }
  catch { throw new ProbeFailure("preflight", "private_path_rejected"); }
}

function isReservedOutputPath(reserved) {
  if (!reserved?.identity) return false;
  try {
    const metadata = lstatSync(reserved.path);
    return metadata.isFile() && !metadata.isSymbolicLink() && metadata.uid === process.getuid()
      && metadata.dev === reserved.identity.dev && metadata.ino === reserved.identity.ino;
  } catch { return false; }
}

function unlinkReservedOutput(reserved) {
  if (!isReservedOutputPath(reserved)) return false;
  try { unlinkSync(reserved.path); return true; }
  catch { return false; }
}

export function outputPathForProbe(projectRoot, runId, kind = "auth") {
  if (!UUID_V4.test(runId ?? "") || !["auth", "next"].includes(kind)) throw new ProbeFailure("preflight", "output_path_rejected");
  const directory = join(resolve(projectRoot), ".agent", "private", kind === "auth" ? "persist13-ui-auth-state" : "persist13-ui-next-state");
  return join(directory, kind === "auth" ? `auth-state-${runId.toLowerCase()}.json` : `next-observation-${runId.toLowerCase()}.json`);
}

export function reservePrivateOutput(projectRoot, runId, outputArgument, kind = "auth") {
  if (!UUID_V4.test(runId ?? "") || !outputArgument || typeof outputArgument !== "string") {
    throw new ProbeFailure("preflight", "output_path_rejected");
  }
  if (!["auth", "next"].includes(kind)) throw new ProbeFailure("preflight", "output_path_rejected");
  const root = resolve(projectRoot);
  const appPrivateRoot = join(root, ".agent", "private");
  const outputDirectory = join(appPrivateRoot, kind === "auth" ? "persist13-ui-auth-state" : "persist13-ui-next-state");
  const outputPath = resolve(root, outputArgument);
  const expectedBasename = kind === "auth" ? `auth-state-${runId.toLowerCase()}.json` : `next-observation-${runId.toLowerCase()}.json`;
  if (dirname(outputPath) !== outputDirectory || basename(outputPath) !== expectedBasename
    || relative(outputDirectory, outputPath).startsWith("..")) {
    throw new ProbeFailure("preflight", "output_path_rejected");
  }
  requireOwnedDirectory(root);
  requireOwnedDirectory(join(root, ".agent"));
  requireOwnedDirectory(appPrivateRoot);
  try { lstatSync(outputDirectory); }
  catch {
    try {
      mkdirSync(outputDirectory, { mode: 0o700 });
      chmodSync(outputDirectory, 0o700);
    } catch {
      throw new ProbeFailure("preflight", "private_path_rejected");
    }
  }
  requireOwnedDirectory(outputDirectory, 0o700);
  let descriptor;
  let reserved;
  try {
    descriptor = openSync(outputPath, "wx", 0o600);
    const openedMetadata = fstatSync(descriptor);
    reserved = { descriptor, path: outputPath, identity: { dev: openedMetadata.dev, ino: openedMetadata.ino }, written: false };
    if (!openedMetadata.isFile() || openedMetadata.uid !== process.getuid() || !isReservedOutputPath(reserved)) {
      throw new ProbeFailure("preflight", "output_path_rejected");
    }
    fchmodSync(descriptor, 0o600);
    const outputMetadata = fstatSync(descriptor);
    if (!outputMetadata.isFile() || outputMetadata.uid !== process.getuid() || (outputMetadata.mode & 0o777) !== 0o600) {
      throw new ProbeFailure("preflight", "output_path_rejected");
    }
    return reserved;
  } catch (error) {
    if (descriptor !== undefined) {
      if (reserved) discardReservedOutput(reserved);
      else { try { closeSync(descriptor); } catch { /* close only this invocation's descriptor */ } }
    }
    if (error instanceof ProbeFailure) throw error;
    throw new ProbeFailure("preflight", error?.code === "EEXIST" ? "output_exists" : "output_path_rejected");
  }
}

export function buildNativeExpression(runId) {
  if (!UUID_V4.test(runId ?? "")) throw new ProbeFailure("preflight", "arguments_rejected");
  const expected = Object.freeze({
    runId: runId.toLowerCase(),
    controlStoreId: `patternly-persist13-control-${runId.toLowerCase()}`,
  });
  return `JSON.stringify((()=>{
    const expected=${JSON.stringify(expected)};
    const failed=(stage,category)=>({protocol:${JSON.stringify(PROTOCOL)},result:'failed',runId:expected.runId,stage,category,readOnly:true});
    try {
      if(typeof __DEV__==='undefined'||!__DEV__||!globalThis.HermesInternal||typeof __r!=='function'||typeof __r.getModules!=='function')return failed('runtime','runtime_rejected');
      const modules=Array.from(__r.getModules().entries());
      const initializedOwner=path=>{
        const matches=modules.filter(([,module])=>module.verboseName?.endsWith(path));
        if(matches.length!==1||matches[0][1].isInitialized!==true)return null;
        return __r(matches[0][0]);
      };
      const storage=initializedOwner('src/infrastructure/storage/mmkvClient.ts');
      if(!storage||typeof storage.captureActiveProfileStorageLease!=='function'||typeof storage.isActiveProfileStorageLeaseCurrent!=='function')return failed('scope','runtime_owner_unavailable');
      const lease=storage.captureActiveProfileStorageLease();
      if(!lease||lease.profile?.id!==expected.runId||lease.profile.kind!=='guest'||lease.profile.accountId!==null||!storage.isActiveProfileStorageLeaseCurrent(lease))return failed('scope','scope_rejected');
      if(!initializedOwner('src/application/runtimeAuditability/Persist13PracticeUiHost.tsx'))return failed('scope','host_not_initialized');
      const mmkv=initializedOwner('node_modules/react-native-mmkv/src/index.ts');
      const protocol=initializedOwner('src/application/runtimeAuditability/persist13ResetFixtureProtocol.ts');
      if(!mmkv||typeof mmkv.existsMMKV!=='function'||typeof mmkv.createMMKV!=='function'||!protocol||typeof protocol.isPersist13PracticeUiProbeSidecar!=='function')return failed('scope','runtime_owner_unavailable');
      if(!mmkv.existsMMKV(expected.controlStoreId))return failed('scope','control_missing');
      const control=mmkv.createMMKV({id:expected.controlStoreId});
      const sidecar=JSON.parse(control.getString(protocol.PERSIST13_SCENARIO_SIDECAR_KEY)??'null');
      if(!protocol.isPersist13PracticeUiProbeSidecar(sidecar,expected.runId)||sidecar.phase!=='ui_armed')return failed('scope','host_phase_unverified');
      const auth=${buildInitializedAuthInspectionExpression()};
      if(auth.kind==='failed')return failed(auth.stage,auth.category);
      const {kind:authKind,...authResult}=auth;
      return {protocol:${JSON.stringify(PROTOCOL)},result:'observed',runId:expected.runId,scopeVerified:true,phase:'ui_armed',hostModuleInitialized:true,
        ...authResult,readOnly:true};
    }catch{return failed('inspection','inspection_failed');}
  })())`;
}

/** One canonical read-only SDK inspector shared by the host probe and real-Next observer. */
export function buildInitializedAuthInspectionExpression() {
  return `(()=>{
    const accountModules=modules.filter(([,module])=>module.verboseName?.endsWith('src/application/account/AccountSessionProvider.tsx'));
    const authClientModules=modules.filter(([,module])=>module.verboseName?.endsWith('src/infrastructure/firebase/firebaseAuthClient.ts'));
    if([...accountModules,...authClientModules].some(([,module])=>typeof module.isInitialized!=='boolean'))return {kind:'failed',stage:'inspection',category:'module_metadata_unavailable'};
    const coreModules=modules.filter(([,module])=>${JSON.stringify(CORE_PATHS)}.some(path=>module.verboseName?.endsWith(path)));
    const sdkOwners=[];let sdkCoreRead=coreModules.length>0;
    for(const [id,module] of coreModules){
      const source=module.verboseName.endsWith(${JSON.stringify(CORE_PATHS[0])})?${JSON.stringify("@firebase/app/dist/index.cjs.js")}:${JSON.stringify("@firebase/app/dist/esm/index.esm.js")};
      if(typeof module.isInitialized!=='boolean')return {kind:'failed',stage:'inspection',category:'module_metadata_unavailable'};
      if(!module.isInitialized){sdkCoreRead=false;sdkOwners.push({path:source,initialized:false,appCount:0,initializedAuthProviders:0});continue;}
      const sdk=__r(id);if(typeof sdk.getApps!=='function')return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};
      const apps=sdk.getApps();if(!Array.isArray(apps))return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};
      let initializedAuthProviders=0;
      for(const app of apps){const container=app?.container;if(typeof container?.getProviders!=='function')return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};const providers=container.getProviders();if(!Array.isArray(providers))return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};for(const provider of providers){if(provider?.name!=='auth')continue;if(typeof provider.isInitialized!=='function')return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};const ready=provider.isInitialized();if(typeof ready!=='boolean')return {kind:'failed',stage:'inspection',category:'sdk_contract_unavailable'};if(ready)initializedAuthProviders++;}}
      sdkOwners.push({path:source,initialized:true,appCount:apps.length,initializedAuthProviders});
    }
    if(!storage.isActiveProfileStorageLeaseCurrent(lease))return {kind:'failed',stage:'scope',category:'scope_changed'};
    const authCold=sdkCoreRead&&sdkOwners.length>0&&sdkOwners.every(owner=>owner.initialized&&owner.initializedAuthProviders===0);
    return {kind:'observed',accountModuleInitialized:accountModules.some(([,module])=>module.isInitialized),authClientModuleInitialized:authClientModules.some(([,module])=>module.isInitialized),sdkCoreRead,sdkOwners,authCold};
  })()`;
}

const FAILURE_STAGES = new Set(["runtime", "scope", "inspection"]);
const FAILURE_CATEGORIES = new Set(["runtime_rejected", "runtime_owner_unavailable", "scope_rejected", "host_not_initialized", "control_missing", "host_phase_unverified", "scope_changed", "module_metadata_unavailable", "sdk_contract_unavailable", "inspection_failed"]);
const SDK_OWNER_PATHS = new Set(["@firebase/app/dist/index.cjs.js", "@firebase/app/dist/esm/index.esm.js"]);

export function validateNativeResult(value, runId) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.protocol !== PROTOCOL || value.runId !== runId) {
    throw new ProbeFailure("readback", "receipt_rejected");
  }
  if (value.result === "failed") {
    const keys = ["category", "protocol", "readOnly", "result", "runId", "stage"].sort();
    if (Object.keys(value).sort().join("\0") !== keys.join("\0") || value.readOnly !== true
      || !FAILURE_STAGES.has(value.stage) || !FAILURE_CATEGORIES.has(value.category)) throw new ProbeFailure("readback", "receipt_rejected");
    return Object.freeze({ protocol: PROTOCOL, result: "failed", runId, stage: value.stage, category: value.category, readOnly: true });
  }
  const keys = ["accountModuleInitialized", "authClientModuleInitialized", "authCold", "hostModuleInitialized", "phase", "protocol", "readOnly", "result", "runId", "scopeVerified", "sdkCoreRead", "sdkOwners"].sort();
  if (Object.keys(value).sort().join("\0") !== keys.join("\0") || value.result !== "observed" || value.readOnly !== true
    || value.scopeVerified !== true || value.phase !== "ui_armed" || value.hostModuleInitialized !== true
    || typeof value.accountModuleInitialized !== "boolean" || typeof value.authClientModuleInitialized !== "boolean"
    || typeof value.sdkCoreRead !== "boolean" || typeof value.authCold !== "boolean" || !Array.isArray(value.sdkOwners)
    || value.sdkOwners.length > CORE_PATHS.length) throw new ProbeFailure("readback", "receipt_rejected");
  for (const owner of value.sdkOwners) {
    const ownerKeys = ["appCount", "initialized", "initializedAuthProviders", "path"].sort();
    if (!owner || typeof owner !== "object" || Object.keys(owner).sort().join("\0") !== ownerKeys.join("\0")
      || !SDK_OWNER_PATHS.has(owner.path) || typeof owner.initialized !== "boolean"
      || !Number.isSafeInteger(owner.appCount) || owner.appCount < 0
      || !Number.isSafeInteger(owner.initializedAuthProviders) || owner.initializedAuthProviders < 0) {
      throw new ProbeFailure("readback", "receipt_rejected");
    }
  }
  const sdkCoreRead = value.sdkOwners.length > 0 && value.sdkOwners.every((owner) => owner.initialized);
  const authCold = sdkCoreRead && value.sdkOwners.every((owner) => owner.initializedAuthProviders === 0);
  if (value.sdkCoreRead !== sdkCoreRead || value.authCold !== authCold) throw new ProbeFailure("readback", "receipt_rejected");
  return Object.freeze({
    protocol: PROTOCOL, result: "observed", runId, scopeVerified: true, phase: "ui_armed", hostModuleInitialized: true,
    accountModuleInitialized: value.accountModuleInitialized, authClientModuleInitialized: value.authClientModuleInitialized,
    sdkCoreRead, sdkOwners: Object.freeze(value.sdkOwners.map((owner) => Object.freeze({ ...owner }))), authCold, readOnly: true,
  });
}

export function isAuthColdObservation(value) {
  return value?.result === "observed" && value.scopeVerified === true && value.hostModuleInitialized === true
    && value.phase === "ui_armed" && value.sdkCoreRead === true && value.authCold === true;
}

export function exitCodeForObservation(value) {
  return isAuthColdObservation(value) ? 0 : 1;
}

export function writeReservedOutput(reserved, value) {
  const contents = `${JSON.stringify(value, null, 2)}\n`;
  try {
    if (!isReservedOutputPath(reserved) || reserved.descriptor === null || reserved.written) {
      throw new ProbeFailure("private_output", "output_write_failed");
    }
    writeFileSync(reserved.descriptor, contents);
    fsyncSync(reserved.descriptor);
    if (!isReservedOutputPath(reserved)) throw new ProbeFailure("private_output", "output_write_failed");
    closeSync(reserved.descriptor);
    reserved.descriptor = null;
    reserved.written = true;
  } catch {
    if (reserved.descriptor !== null) {
      try { closeSync(reserved.descriptor); } catch { /* only close this invocation's descriptor */ }
      reserved.descriptor = null;
    }
    unlinkReservedOutput(reserved);
    throw new ProbeFailure("private_output", "output_write_failed");
  }
}

export function discardReservedOutput(reserved) {
  if (!reserved || reserved.written) return;
  if (reserved.descriptor !== null) {
    try { closeSync(reserved.descriptor); } catch { /* only close this invocation's descriptor */ }
    reserved.descriptor = null;
  }
  unlinkReservedOutput(reserved);
}

function safeFailure(error) {
  if (error instanceof ProbeFailure) return { stage: error.stage, category: error.category };
  const category = new Set(["target_rejected", "transport_closed", "read_timeout", "connect_failed", "discovery_failed"]);
  if (category.has(error?.message)) return { stage: "transport", category: error.message };
  return { stage: "transport", category: "readback_failed" };
}

async function inspectNative(runId) {
  const response = await fetch(nativeDiscoveryUrl(), { signal: AbortSignal.timeout(5_000), redirect: "error" });
  if (!response.ok) throw new ProbeFailure("transport", "discovery_failed");
  const body = await response.text();
  if (body.length > 64 * 1024) throw new ProbeFailure("transport", "target_rejected");
  let targets;
  try { targets = JSON.parse(body); } catch { throw new ProbeFailure("transport", "target_rejected"); }
  let target;
  try { target = selectNativeTarget(targets); }
  catch { throw new ProbeFailure("transport", "target_rejected"); }
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(target.endpoint, { origin: target.websocketOrigin, handshakeTimeout: 5_000, maxPayload: 128 * 1024, followRedirects: false });
  try {
    await new Promise((accept, reject) => {
      socket.once("open", accept);
      socket.once("error", () => reject(new ProbeFailure("transport", "connect_failed")));
    });
    let reply;
    try {
      reply = await request(socket, 1, "Runtime.evaluate", {
        expression: buildNativeExpression(runId), returnByValue: true, silent: true,
      });
    } catch (error) { throw error; }
    if (reply?.error || reply?.result?.exceptionDetails) throw new ProbeFailure("readback", "native_eval_failed");
    let value;
    try { value = JSON.parse(reply?.result?.result?.value ?? "null"); }
    catch { throw new ProbeFailure("readback", "receipt_rejected"); }
    return validateNativeResult(value, runId);
  } finally { socket.terminate(); }
}

async function main(argv) {
  let reserved;
  try {
    const args = parseArgs(argv);
    const output = resolve(PROJECT_ROOT, args.output);
    const expectedOutput = outputPathForProbe(PROJECT_ROOT, args.runId, "auth");
    if (output !== expectedOutput) throw new ProbeFailure("preflight", "output_path_rejected");
    reserved = reservePrivateOutput(PROJECT_ROOT, args.runId, output);
    const observation = await inspectNative(args.runId);
    writeReservedOutput(reserved, observation);
    process.stdout.write(`${JSON.stringify(observation)}\n`);
    process.exitCode = exitCodeForObservation(observation);
  } catch (error) {
    discardReservedOutput(reserved);
    const failure = safeFailure(error);
    process.stderr.write(`${JSON.stringify({ result: "failed", ...failure })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === SCRIPT_PATH) void main(process.argv.slice(2));
