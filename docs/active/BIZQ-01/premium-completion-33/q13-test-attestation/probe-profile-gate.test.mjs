import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { afterInspectorClosed, assertLoadedSourceNonce, changedPatchPaths, cleanupDebugger, locateGateCatch, safeErrorFacts, selectInspectorTarget, validateEntryReceipt, validateObservedError, validateRegistryMetadata } from "./probe-profile-gate.mjs";

const gateSource = readFileSync(fileURLToPath(new URL("../../../../../src/application/account/ProfileStoragePreparationGate.tsx", import.meta.url)), "utf8");

test("locates the existing profile-gate catch entry without evaluating application code", () => {
  const location = locateGateCatch(gateSource);
  const line = gateSource.split("\n")[location.lineNumber];
  assert.equal(location.errorName, "error");
  assert.match(line, /^\s*if \(active\)/u);
});

test("fails closed when gate markers are absent or ambiguous", () => {
  assert.throws(() => locateGateCatch("const x = 1;"), /loaded_gate_catch_missing/u);
  const candidate = (name) => `const ${name} = (promise) => promise.catch((error) => { if (active) { if (error instanceof LocalLogoutControlError) return error; return "Local profile storage could not be prepared."; } });`;
  const duplicate = `${candidate("first")}\n${candidate("second")}`;
  assert.throws(() => locateGateCatch(duplicate), /loaded_gate_catch_ambiguous/u);
});

test("keeps only allowlisted exception classes and own codes", () => {
  assert.deepEqual(safeErrorFacts("LocalLogoutControlError", "local_logout_control_unavailable"), {
    className: "LocalLogoutControlError", code: "local_logout_control_unavailable",
  });
  assert.deepEqual(safeErrorFacts("FirebaseAuthError", "auth/network-request-failed"), { className: "OtherError", code: null });
  assert.deepEqual(safeErrorFacts("ProfileStorageError", "not_a_profile_code"), { className: "ProfileStorageError", code: null });
});

test("requires the exact private entry receipt identity and nonce", () => {
  const nonce = "a".repeat(64);
  const receipt = {
    schemaVersion: "bizq01-q13-runtime-receipt-v2",
    nonce,
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
    stage: "js_bundle_entry",
  };
  assert.equal(validateEntryReceipt(receipt, nonce), true);
  assert.throws(() => validateEntryReceipt(receipt, "b".repeat(64)), /entry_receipt_binding_invalid/u);
  assert.throws(() => validateEntryReceipt({ ...receipt, extra: true }, nonce), /entry_receipt_binding_invalid/u);
});

test("requires the observed nonce in the loaded source and refuses malformed error facts", () => {
  const nonce = "a".repeat(64);
  assert.equal(assertLoadedSourceNonce(`bundle; const nonce = "${nonce}";`, nonce), true);
  assert.throws(() => assertLoadedSourceNonce("bundle without current entry marker", nonce), /loaded_nonce_gate_script_missing/u);
  assert.deepEqual(validateObservedError({ className: "ProfileStorageError", code: "profile_scope_unavailable" }), {
    className: "ProfileStorageError", code: "profile_scope_unavailable", diagnostic: true,
  });
  assert.deepEqual(validateObservedError({ className: "OtherError", code: null }), { className: "OtherError", code: null, diagnostic: false });
  assert.deepEqual(validateObservedError({ className: "ProfileStorageError", code: null }), { className: "ProfileStorageError", code: null, diagnostic: false });
  assert.throws(() => validateObservedError({ className: "ProfileStorageError" }), /safe_exception_result_invalid/u);
  assert.throws(() => validateObservedError({ className: "ProfileStorageError", code: "profile_scope_unavailable", message: "private" }), /safe_exception_result_invalid/u);
});

test("accepts only unique initialized app and gate registry metadata", () => {
  const names = [
    "App.tsx", "src/q13-test-attestation/attestation-runtime.ts", "src/infrastructure/storage/mmkvClient.ts",
    "src/infrastructure/storage/localLogoutControl.ts", "src/application/account/ProfileStoragePreparationGate.tsx",
  ];
  const value = { ok: true, modules: Object.fromEntries(names.map((name) => [name, { count: 1, initialized: true }])) };
  assert.equal(validateRegistryMetadata(value), true);
  assert.throws(() => validateRegistryMetadata({ ...value, modules: { ...value.modules, "App.tsx": { count: 2, initialized: true } } }), /loaded_module_metadata_invalid/u);
  assert.throws(() => validateRegistryMetadata({ ...value, modules: { ...value.modules, unexpected: { count: 1, initialized: true } } }), /loaded_module_metadata_invalid/u);
});

test("parses porcelain paths without dropping the first filename character", () => {
  assert.deepEqual(changedPatchPaths(" M App.tsx\n M src/application/trainingLifecycle/TrainingLifecycleUseCases.ts\n?? src/q13-test-attestation/attestation-policy.ts\n?? src/q13-test-attestation/attestation-runtime.ts\n?? src/q13-test-attestation/preservation.ts\n"), [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
    "src/q13-test-attestation/preservation.ts",
  ]);
});

test("selects only the unique known iPhone Inspector node on loopback", () => {
  const target = { type: "node", appId: "com.lkurczab.patternly", deviceName: "iPhone 17", webSocketDebuggerUrl: "ws://[::1]:8081/inspector" };
  assert.equal(selectInspectorTarget([target]), target);
  assert.throws(() => selectInspectorTarget([{ ...target, appId: "other.app" }]), /inspector_target_count_invalid/u);
  assert.throws(() => selectInspectorTarget([{ ...target, deviceName: "other device" }]), /inspector_target_count_invalid/u);
  assert.throws(() => selectInspectorTarget([{ ...target, webSocketDebuggerUrl: "ws://127.0.0.1:8081/inspector" }]), /inspector_target_identity_invalid/u);
  assert.throws(() => selectInspectorTarget([target, { ...target, webSocketDebuggerUrl: "ws://[::1]:8081/other" }]), /inspector_target_count_invalid/u);
});

test("writes an observation only after the Inspector operation and close complete", async () => {
  let writes = 0;
  await assert.rejects(() => afterInspectorClosed(async () => { throw new Error("inspector_close_timeout"); }, () => { writes += 1; }), /inspector_close_timeout/u);
  assert.equal(writes, 0);
  const result = await afterInspectorClosed(async () => ({ result: "observed" }), () => { writes += 1; });
  assert.deepEqual(result, { result: "observed" });
  assert.equal(writes, 1);
});

test("attempts later debugger cleanup even when an earlier cleanup operation fails", async () => {
  const attempts = [];
  const cdp = {
    events: [{ method: "Debugger.resumed" }],
    async command(method) { attempts.push(method); if (method === "Debugger.resume") throw new Error("private"); },
    async waitEvent(method, _timeoutMs, afterIndex) { attempts.push(`${method}:${afterIndex}`); throw new Error("private"); },
  };
  const errors = await cleanupDebugger(cdp, { paused: true, breakpointId: "bp" });
  assert.deepEqual(errors, ["resume", "resume_ack"]);
  assert.deepEqual(attempts, ["Debugger.resume", "Debugger.resumed:1", "Debugger.removeBreakpoint", "Debugger.disable"]);
});

test("attempts all debugger cleanup operations when removing the breakpoint fails", async () => {
  const attempts = [];
  const cdp = {
    events: [],
    async command(method) { attempts.push(method); if (method === "Debugger.removeBreakpoint") throw new Error("private"); },
    async waitEvent(method, _timeoutMs, afterIndex) { attempts.push(`${method}:${afterIndex}`); },
  };
  const errors = await cleanupDebugger(cdp, { paused: true, breakpointId: "bp" });
  assert.deepEqual(errors, ["breakpoint_remove"]);
  assert.deepEqual(attempts, ["Debugger.resume", "Debugger.resumed:0", "Debugger.removeBreakpoint", "Debugger.disable"]);
});
