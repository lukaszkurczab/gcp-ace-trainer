import { createHash } from "node:crypto";
import WebSocket from "ws";
import { lstatSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { APPROVED_REFS, TOOL_VERSION, sha256 as generatorSha256 } from "./generate.mjs";

const require = createRequire(import.meta.url);
const { parse } = require("@babel/parser");
const OLD_REF = "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a";
const GATE_PATH = "src/application/account/ProfileStoragePreparationGate.tsx";
const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const SOURCE_PATHS = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/content/generated/canonical-content/content-lock.json"];
const PATCHED_PATHS = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/q13-test-attestation/attestation-policy.ts", "src/q13-test-attestation/attestation-runtime.ts", "src/q13-test-attestation/preservation.ts"];
const TOOL_PATHS = ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"];
const APP_ID = "com.lkurczab.patternly";
const DEVICE_NAME = "iPhone 17";
const INITIALIZED_MODULES = ["App.tsx", "src/q13-test-attestation/attestation-runtime.ts", "src/infrastructure/storage/mmkvClient.ts", "src/infrastructure/storage/localLogoutControl.ts", "src/application/account/ProfileStoragePreparationGate.tsx"];
const FALLBACK = "Local profile storage could not be prepared.";
const SAFE_CLASSES = new Set(["Error", "TypeError", "ReferenceError", "LocalLogoutControlError", "EncryptedStorageBootstrapError", "ProfileStorageError", "ProfileTransitionActiveError"]);
const SAFE_CODES = new Set([
  "local_logout_control_corrupt", "local_logout_control_unavailable", "local_logout_control_verification_failed",
  "secure_store_temporarily_unavailable", "encrypted_storage_key_missing", "encrypted_storage_unavailable",
  "storage_manifest_corrupt", "storage_migration_incomplete", "legacy_cleanup_failed",
  "profile_registry_corrupt", "legacy_profile_unidentified", "profile_scope_unavailable",
  "profile_transition_cancelled", "prepared_guest_choice_required",
]);

export function locateGateCatch(source) {
  let ast;
  try { ast = parse(source, { sourceType: "unambiguous", errorRecovery: true, plugins: ["jsx", "typescript"] }); }
  catch { throw new Error("loaded_gate_source_parse_failed"); }
  if (ast.errors?.length) throw new Error("loaded_gate_source_parse_failed");
  const candidates = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "CallExpression" && node.callee?.type === "MemberExpression"
      && !node.callee.computed && node.callee.property?.name === "catch") {
      const callback = node.arguments?.[0];
      if (callback && ["ArrowFunctionExpression", "FunctionExpression"].includes(callback.type)
        && callback.body?.type === "BlockStatement" && callback.body.body.length > 0) {
        const bodySource = source.slice(callback.body.start, callback.body.end);
        if (bodySource.includes(FALLBACK) && bodySource.includes("LocalLogoutControlError")) {
          const first = callback.body.body[0];
          const errorParameter = callback.params?.[0];
          if (first?.loc?.start && errorParameter?.type === "Identifier") {
            candidates.push({ lineNumber: first.loc.start.line - 1, columnNumber: first.loc.start.column, errorName: errorParameter.name });
          }
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "loc" || key === "start" || key === "end" || key === "leadingComments" || key === "trailingComments") continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
  if (candidates.length !== 1) throw new Error(candidates.length ? "loaded_gate_catch_ambiguous" : "loaded_gate_catch_missing");
  return candidates[0];
}

export function safeErrorFacts(className, ownCode) {
  const name = SAFE_CLASSES.has(className) ? className : "OtherError";
  const code = typeof ownCode === "string" && SAFE_CODES.has(ownCode) ? ownCode : null;
  return Object.freeze({ className: name, code });
}

export function validateRegistryMetadata(value) {
  if (!value || value.ok !== true || !hasExactKeys(value, ["ok", "modules"])
    || !hasExactKeys(value.modules, INITIALIZED_MODULES)) throw new Error("loaded_module_metadata_invalid");
  for (const name of INITIALIZED_MODULES) {
    const entry = value.modules[name];
    if (!hasExactKeys(entry, ["count", "initialized"]) || entry.count !== 1 || entry.initialized !== true) throw new Error("loaded_module_metadata_invalid");
  }
  return true;
}

export function validateObservedError(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== "className|code"
    || typeof value.className !== "string" || (!SAFE_CLASSES.has(value.className) && value.className !== "OtherError")
    || (value.code !== null && (typeof value.code !== "string" || !SAFE_CODES.has(value.code)))) {
    throw new Error("safe_exception_result_invalid");
  }
  const facts = safeErrorFacts(value.className, value.code);
  return Object.freeze({ ...facts, diagnostic: SAFE_CLASSES.has(facts.className) && facts.code !== null });
}

export function validateEntryReceipt(entryReceipt, nonce) {
  const approved = APPROVED_REFS[OLD_REF];
  if (!hasExactKeys(entryReceipt, ["schemaVersion", "nonce", "contentVersion", "artifactSha256", "stage"])
    || entryReceipt.schemaVersion !== "bizq01-q13-runtime-receipt-v2" || entryReceipt.nonce !== nonce
    || entryReceipt.contentVersion !== approved.contentVersion || entryReceipt.artifactSha256 !== approved.artifactSha256
    || entryReceipt.stage !== "js_bundle_entry") throw new Error("entry_receipt_binding_invalid");
  return true;
}

export function assertLoadedSourceNonce(source, nonce) {
  if (typeof source !== "string" || !/^[a-f0-9]{64}$/u.test(nonce ?? "") || !source.includes(nonce)) throw new Error("loaded_nonce_gate_script_missing");
  return true;
}

export async function cleanupDebugger(cdp, { paused, breakpointId }) {
  const errors = [];
  if (paused) {
    const resumedEventStart = cdp.events.length;
    try { await cdp.command("Debugger.resume"); } catch { errors.push("resume"); }
    try { await cdp.waitEvent("Debugger.resumed", 2000, resumedEventStart); } catch { errors.push("resume_ack"); }
  }
  if (breakpointId) { try { await cdp.command("Debugger.removeBreakpoint", { breakpointId }); } catch { errors.push("breakpoint_remove"); } }
  try { await cdp.command("Debugger.disable"); } catch { errors.push("debugger_disable"); }
  return errors;
}

export function selectInspectorTarget(targets) {
  if (!Array.isArray(targets)) throw new Error("inspector_target_count_invalid");
  const matches = targets.filter((target) => target && target.appId === APP_ID && target.deviceName === DEVICE_NAME);
  if (matches.length !== 1) throw new Error("inspector_target_count_invalid");
  const target = matches[0];
  if (target.type !== "node" || typeof target.webSocketDebuggerUrl !== "string"
    || !target.webSocketDebuggerUrl.startsWith("ws://[::1]:8081/")) throw new Error("inspector_target_identity_invalid");
  return target;
}

export async function afterInspectorClosed(runInspector, writeReceipt) {
  const result = await runInspector();
  if (result && writeReceipt) writeReceipt(result);
  return result;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function gitRaw(repo, args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (result.status !== 0) throw new Error("source_checkout_unavailable");
  return result.stdout;
}
function git(repo, args) { return gitRaw(repo, args).trim(); }
function validateReceiptDestination(path) {
  if (!path) return;
  const absolute = resolve(path);
  if (!absolute.startsWith("/private/tmp/") || (() => { try { lstatSync(absolute); return true; } catch (error) { return error?.code !== "ENOENT"; } })()) {
    throw new Error("receipt_path_invalid");
  }
}
function hasExactKeys(value, keys) { return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|"); }
function hasExactShaMap(value, keys) { return hasExactKeys(value, keys) && keys.every((key) => /^[a-f0-9]{64}$/u.test(value[key] ?? "")); }
export function changedPatchPaths(status) { return status.split("\n").filter(Boolean).map((line) => line.slice(3)).sort(); }
function privatePath(path) {
  const absolute = resolve(path);
  const roots = ["/private/tmp", process.env.TMPDIR].filter(Boolean).map((root) => resolve(root));
  if (!roots.some((root) => absolute.startsWith(`${root}/`))) throw new Error("private_binding_path_invalid");
  return absolute;
}
function readPrivateJson(path) {
  const absolute = privatePath(path);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || (stat.mode & 0o077) !== 0) throw new Error("private_binding_permissions_invalid");
  try { return JSON.parse(readFileSync(absolute, "utf8")); } catch { throw new Error("private_binding_invalid"); }
}
export function verifyBinding(binding, checkout, entryReceipt) {
  const approved = APPROVED_REFS[OLD_REF];
  const valid = binding?.schemaVersion === "bizq01-q13-test-build-binding-v2"
    && hasExactKeys(binding, ["schemaVersion", "toolVersion", "nonce", "sourceRef", "content", "toolSourceSha256", "sourceFilesSha256", "patchedFilesSha256", "patchSha256", "patchState", "buildBinding"])
    && binding.toolVersion === TOOL_VERSION && binding.sourceRef === OLD_REF
    && /^[a-f0-9]{64}$/u.test(binding.nonce ?? "") && binding.patchState === "applied" && binding.buildBinding === null
    && hasExactKeys(binding.content, ["contentVersion", "artifactSha256"])
    && binding.content.contentVersion === approved.contentVersion && binding.content.artifactSha256 === approved.artifactSha256
    && hasExactShaMap(binding.sourceFilesSha256, SOURCE_PATHS) && hasExactShaMap(binding.patchedFilesSha256, PATCHED_PATHS)
    && SOURCE_PATHS.every((path) => binding.sourceFilesSha256[path] === approved.files[path])
    && hasExactShaMap(binding.toolSourceSha256, TOOL_PATHS)
    && TOOL_PATHS.every((path) => binding.toolSourceSha256[path] === generatorSha256(readFileSync(resolve(TOOL_DIRECTORY, path))))
    && /^[a-f0-9]{64}$/u.test(binding.patchSha256 ?? "");
  if (!valid) {
    throw new Error("old_source_binding_invalid");
  }
  const head = git(checkout, ["rev-parse", "HEAD"]);
  if (head !== OLD_REF) throw new Error("source_ref_mismatch");
  for (const path of SOURCE_PATHS) {
    const committedSource = spawnSync("git", ["show", `HEAD:${path}`], { cwd: checkout, encoding: null, stdio: ["ignore", "pipe", "ignore"] });
    if (committedSource.status !== 0 || sha256(committedSource.stdout) !== binding.sourceFilesSha256[path]) throw new Error("source_binding_mismatch");
  }
  for (const path of PATCHED_PATHS) {
    if (sha256(readFileSync(resolve(checkout, path))) !== binding.patchedFilesSha256[path]) throw new Error("patched_source_mismatch");
  }
  const status = gitRaw(checkout, ["status", "--porcelain", "--untracked-files=all"]);
  const changedPaths = changedPatchPaths(status);
  if (changedPaths.length !== PATCHED_PATHS.length || changedPaths.some((path, index) => path !== [...PATCHED_PATHS].sort()[index])) throw new Error("patched_source_scope_invalid");
  const source = readFileSync(resolve(checkout, GATE_PATH));
  const committed = spawnSync("git", ["show", `HEAD:${GATE_PATH}`], { cwd: checkout, encoding: null, stdio: ["ignore", "pipe", "ignore"] });
  if (committed.status !== 0 || !source.equals(committed.stdout)) throw new Error("gate_source_modified");
  validateEntryReceipt(entryReceipt, binding.nonce);
  return { sourceRef: head, nonce: binding.nonce };
}

class Cdp {
  constructor(socket) { this.socket = socket; this.nextId = 0; this.pending = new Map(); this.events = []; this.eventWaiters = new Map(); }
  async command(method, params = {}) {
    const id = ++this.nextId;
    const promise = new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`cdp_${method.replaceAll(".", "_")}_timeout`)); }, 5000);
      this.pending.set(id, { resolve: (value) => { clearTimeout(timeout); resolvePromise(value); }, reject: (error) => { clearTimeout(timeout); reject(error); } });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    const result = await promise;
    if (result.error) throw new Error(`cdp_${method.replaceAll(".", "_")}_failed`);
    return result.result;
  }
  receive(message) {
    let packet;
    try { packet = JSON.parse(String(message)); } catch { return; }
    if (packet.id && this.pending.has(packet.id)) {
      const handlers = this.pending.get(packet.id); this.pending.delete(packet.id); handlers.resolve(packet); return;
    }
    if (packet.method) {
      this.events.push(packet);
      for (const waiter of this.eventWaiters.get(packet.method) ?? []) waiter(packet);
      this.eventWaiters.delete(packet.method);
    }
  }
  waitEvent(method, timeoutMs, afterIndex = 0) {
    const existing = this.events.find((event, index) => index >= afterIndex && event.method === method);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolvePromise, reject) => {
      const waiters = this.eventWaiters.get(method) ?? [];
      const listener = (event) => { clearTimeout(timeout); resolvePromise(event); };
      const timeout = setTimeout(() => {
        const current = this.eventWaiters.get(method) ?? [];
        this.eventWaiters.set(method, current.filter((waiter) => waiter !== listener));
        reject(new Error("profile_gate_pause_timeout"));
      }, timeoutMs);
      waiters.push(listener);
      this.eventWaiters.set(method, waiters);
    });
  }
}

async function openTarget() {
  let response;
  try { response = await fetch("http://[::1]:8081/json/list", { signal: AbortSignal.timeout(2500) }); }
  catch { throw new Error("inspector_target_unavailable"); }
  if (!response.ok) throw new Error("inspector_target_unavailable");
  const targets = await response.json();
  return selectInspectorTarget(targets);
}

async function withInspector(url, callback) {
  const socket = new WebSocket(url, { origin: "http://127.0.0.1:8081" });
  await new Promise((resolvePromise, reject) => {
    const timeout = setTimeout(() => { try { socket.close(); } catch { /* best effort */ } reject(new Error("inspector_connect_timeout")); }, 5000);
    socket.addEventListener("open", () => { clearTimeout(timeout); resolvePromise(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("inspector_connect_failed")); }, { once: true });
  });
  const cdp = new Cdp(socket);
  socket.addEventListener("message", (event) => cdp.receive(event.data));
  try { return await callback(cdp); }
  finally {
    if (socket.readyState !== WebSocket.CLOSED) {
      await new Promise((resolvePromise, reject) => {
        const timeout = setTimeout(() => reject(new Error("inspector_close_timeout")), 2000);
        socket.addEventListener("close", () => { clearTimeout(timeout); resolvePromise(); }, { once: true });
        try { socket.close(1000); } catch { clearTimeout(timeout); reject(new Error("inspector_close_failed")); }
      });
    }
  }
}

const registryMetadataExpression = `(() => { const r = globalThis.__r; if (typeof r !== "function" || typeof r.getModules !== "function") return { ok: false }; const all = [...r.getModules().values()]; const names = ${JSON.stringify(INITIALIZED_MODULES)}; const modules = {}; for (const name of names) { const found = all.filter((m) => m && m.verboseName === name); modules[name] = { count: found.length, initialized: found.length === 1 && found[0].isInitialized === true }; } return { ok: true, modules }; })()`;

async function verifyLoadedModules(cdp) {
  await cdp.command("Runtime.enable");
  const result = await cdp.command("Runtime.evaluate", { expression: registryMetadataExpression, returnByValue: true, silent: true });
  if (result.exceptionDetails) throw new Error("loaded_module_metadata_invalid");
  validateRegistryMetadata(result.result?.value);
}

async function findLoadedGate(cdp, nonce) {
  await cdp.command("Debugger.enable");
  const scripts = cdp.events.filter((event) => event.method === "Debugger.scriptParsed")
    .map((event) => event.params).filter((script) => /(?:ProfileStoragePreparationGate|index\.bundle|\.bundle(?:\?|$))/iu.test(script.url ?? ""));
  const matches = [];
  for (const script of scripts) {
    const loaded = await cdp.command("Debugger.getScriptSource", { scriptId: script.scriptId });
    if (typeof loaded.scriptSource !== "string") throw new Error("loaded_gate_source_unavailable");
    try { assertLoadedSourceNonce(loaded.scriptSource, nonce); } catch { continue; }
    try {
      const location = locateGateCatch(loaded.scriptSource);
      matches.push({ scriptId: script.scriptId, location, sourceSha256: sha256(loaded.scriptSource) });
    } catch (error) {
      if (!(error instanceof Error) || !new Set(["loaded_gate_catch_missing", "loaded_gate_source_parse_failed"]).has(error.message)) throw error;
    }
  }
  if (matches.length !== 1) throw new Error(matches.length ? "loaded_gate_script_ambiguous" : "loaded_nonce_gate_script_missing");
  return { ...matches[0], url: scripts.find((script) => script.scriptId === matches[0].scriptId)?.url };
}

export async function runProbe({ bindingPath, checkoutPath, mode, receiptPath, entryReceiptPath }) {
  if (!new Set(["capability", "observe"]).has(mode)) throw new Error("probe_mode_invalid");
  if (mode === "observe") validateReceiptDestination(receiptPath);
  const binding = readPrivateJson(bindingPath);
  if (!entryReceiptPath) throw new Error("entry_receipt_required");
  const entryReceipt = readPrivateJson(entryReceiptPath);
  const bindingIdentity = verifyBinding(binding, resolve(checkoutPath), entryReceipt);
  const target = await openTarget();
  const url = target.webSocketDebuggerUrl;
  let observation;
  return afterInspectorClosed(() => withInspector(url, async (cdp) => {
    let breakpointId;
    let paused = false;
    try {
      await verifyLoadedModules(cdp);
      const gate = await findLoadedGate(cdp, bindingIdentity.nonce);
      if (typeof gate.url !== "string" || gate.url.length === 0) throw new Error("loaded_gate_url_missing");
      const set = await cdp.command("Debugger.setBreakpointByUrl", { url: gate.url, lineNumber: gate.location.lineNumber, columnNumber: gate.location.columnNumber });
      if (!set || typeof set.breakpointId !== "string" || set.breakpointId.length === 0) throw new Error("breakpoint_set_failed");
      breakpointId = set.breakpointId;
      if (mode === "capability") {
        return { schemaVersion: "bizq01-q13-profile-gate-probe-v1", result: "capability_ok", stage: "breakpoint_set_removed", sourceRef: bindingIdentity.sourceRef, nonce: bindingIdentity.nonce, loadedSourceSha256: gate.sourceSha256 };
      }
      process.stderr.write("q13_profile_gate_probe_armed\n");
      const pausedPacket = await cdp.waitEvent("Debugger.paused", 60_000);
      paused = true;
      if (!pausedPacket.params.hitBreakpoints?.includes(breakpointId)) throw new Error("unexpected_debugger_pause");
      const frame = pausedPacket.params.callFrames?.[0];
      if (!frame || frame.location?.lineNumber !== gate.location.lineNumber) throw new Error("paused_frame_mismatch");
      const pausedSource = await cdp.command("Debugger.getScriptSource", { scriptId: frame.location.scriptId });
      if (sha256(pausedSource.scriptSource) !== gate.sourceSha256) throw new Error("paused_source_mismatch");
      const pausedCatch = locateGateCatch(pausedSource.scriptSource);
      if (pausedCatch.lineNumber !== gate.location.lineNumber || pausedCatch.errorName !== gate.location.errorName) throw new Error("paused_catch_mismatch");
      const errorName = gate.location.errorName;
      const allowedClasses = JSON.stringify([...SAFE_CLASSES]);
      const allowedCodes = JSON.stringify([...SAFE_CODES]);
      const expression = `(() => { const e = ${errorName}; const p = e && Object.getPrototypeOf(e); const d = p && Object.getOwnPropertyDescriptor(p, "constructor"); const n = d && d.value && Object.getOwnPropertyDescriptor(d.value, "name"); const c = e && Object.getOwnPropertyDescriptor(e, "code"); const classes = ${allowedClasses}; const codes = ${allowedCodes}; return { className: n && classes.includes(n.value) ? n.value : "OtherError", code: c && Object.prototype.hasOwnProperty.call(c, "value") && codes.includes(c.value) ? c.value : null }; })()`;
      const evaluated = await cdp.command("Debugger.evaluateOnCallFrame", { callFrameId: frame.callFrameId, expression, returnByValue: true, silent: true });
      if (evaluated.exceptionDetails) throw new Error("safe_exception_evaluation_failed");
      const facts = validateObservedError(evaluated.result?.value);
      observation = {
        schemaVersion: "bizq01-q13-profile-gate-probe-v1",
        result: facts.diagnostic ? "observed" : "inconclusive",
        stage: facts.diagnostic ? "profile_gate_catch" : "safe_facts_incomplete",
        sourceRef: bindingIdentity.sourceRef,
        nonce: bindingIdentity.nonce,
        loadedSourceSha256: gate.sourceSha256,
        className: facts.className,
        code: facts.code,
      };
      return observation;
    } finally {
      const cleanupErrors = await cleanupDebugger(cdp, { paused: paused || cdp.events.some((event) => event.method === "Debugger.paused"), breakpointId });
      if (cleanupErrors.length) throw new Error("debugger_cleanup_incomplete");
    }
  }), (result) => {
    if (mode === "observe" && observation && receiptPath) {
      const receipt = resolve(receiptPath);
      writeFileSync(receipt, `${JSON.stringify(observation)}\n`, { mode: 0o600, flag: "wx" });
    }
  });
}

function parseArgs(args) {
  if (args.length < 1) throw new Error("invalid_arguments");
  const [mode, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]; const value = rest[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--") || options[key]) throw new Error("invalid_arguments");
    options[key] = value;
  }
  const expected = mode === "capability" ? ["--binding", "--checkout", "--entry-receipt"] : ["--binding", "--checkout", "--entry-receipt", "--receipt"];
  if (Object.keys(options).sort().join("|") !== expected.sort().join("|")) throw new Error("invalid_arguments");
  return { mode, bindingPath: options["--binding"], checkoutPath: options["--checkout"], entryReceiptPath: options["--entry-receipt"], receiptPath: options["--receipt"] };
}
async function main(args) {
  const result = await runProbe(parseArgs(args));
  process.stdout.write(`${JSON.stringify({ result: result.result, stage: result.stage, sourceRef: result.sourceRef, loadedSourceSha256: result.loadedSourceSha256, ...(result.className ? { className: result.className, code: result.code } : {}) })}\n`);
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    const category = error instanceof Error && /^[a-z][a-z0-9_]*$/u.test(error.message) ? error.message : "profile_gate_probe_failed";
    process.stderr.write(`q13_profile_gate_probe_failed:${category}\n`);
    process.exitCode = 2;
  });
}
