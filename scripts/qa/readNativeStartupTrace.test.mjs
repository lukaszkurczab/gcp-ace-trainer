import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { parseOrigin, selectTarget, validateTrace, validateStartupTiming, heapResult, request } from "./readNativeStartupTrace.mjs";

test("optional native startup timestamps retain unavailable boundaries and reject false numbers/payloads", () => {
  const timing = { bundlePreludeMs: 10, nativeBeforeMs: 20, performanceMs: 20, nativeAfterMs: 21, startTime: null, initializeRuntimeStart: 1, executeJavaScriptBundleEntryPointStart: 2, endTime: 15 };
  assert.deepEqual(validateStartupTiming(timing), timing);
  assert.equal(validateStartupTiming({ ...timing, endTime: null }).endTime, null);
  for (const bad of [{ ...timing, endTime: NaN }, { ...timing, endTime: -1 }, { ...timing, endTime: undefined }, { ...timing, payload: "private" }, {}]) assert.throws(() => validateStartupTiming(bad), /timing_rejected/);
});

test("origins must be loopback with explicit port and no extra URL capabilities", () => {
  for (const value of ["https://localhost:8082", "http://remote.test:8082", "http://user@localhost:8082", "http://localhost:8082/path", "http://localhost:8082/?query=1"]) assert.throws(() => parseOrigin(value));
  assert.equal(parseOrigin("http://localhost:8082").port, "8082");
  assert.equal(parseOrigin("http://127.0.0.1:8082").hostname, "127.0.0.1");
});
const target = { type: "node", appId: "com.lkurczab.patternly", deviceName: "iPhone 17", id: "local-1", reactNative: { logicalDeviceId: "local" }, webSocketDebuggerUrl: "ws://localhost:8082/inspector/debug?device=local&page=1" };
test("target is exact and rejects ambiguity, other devices and cross-origin sockets", () => {
  const origin = parseOrigin("http://localhost:8082");
  assert.equal(selectTarget([target], origin), target.webSocketDebuggerUrl);
  for (const values of [[], [target, target], [{ ...target, deviceName: "iPhone 16" }], [{ ...target, webSocketDebuggerUrl: "ws://remote.test:8082/inspector/debug?device=local&page=1" }], [{ ...target, id: "wrong" }]]) assert.throws(() => selectTarget(values, origin));
});
test("isolated SEC03 target requires an explicit exact allowlisted app ID with no fallback", () => {
  const origin = parseOrigin("http://localhost:8082");
  const testId = "com.lkurczab.patternly.sec03";
  const isolated = { ...target, appId: testId };
  assert.throws(() => selectTarget([isolated], origin), /target_rejected/);
  assert.throws(() => selectTarget([target], origin, testId), /target_rejected/);
  assert.throws(() => selectTarget([isolated, target], origin, testId), /target_rejected/);
  assert.throws(() => selectTarget([{ ...isolated, deviceName: "iPhone 16" }], origin, testId), /target_rejected/);
  assert.throws(() => selectTarget([isolated], origin, "another.app"), /target_rejected/);
  assert.equal(selectTarget([isolated], origin, testId), isolated.webSocketDebuggerUrl);
});
const trace = { hermes: true, trace: { schema: "patternly.startup-trace.v1", truncated: false, events: [{ stage: "content_gate", edge: "begin", atMs: 12, span: 1 }] } };
test("trace rejects missing runtime, payloads, invalid clocks and unbounded buffers", () => {
  assert.equal(validateTrace(trace), trace.trace);
  assert.throws(() => validateTrace({ ...trace, hermes: false }));
  for (const event of [{ stage: "ready", edge: "event", atMs: -1 }, { stage: "ready", edge: "event", atMs: NaN }, { stage: "ready", edge: "event", atMs: 1, payload: "private" }, { stage: "ready", edge: "event", atMs: 1, span: 0 }]) assert.throws(() => validateTrace({ hermes: true, trace: { ...trace.trace, events: [event] } }));
  assert.throws(() => validateTrace({ hermes: true, trace: { ...trace.trace, events: Array(513).fill(trace.trace.events[0]) } }));
});
test("unsupported heap is explicit and invalid observed values fail", () => {
  assert.equal(heapResult({ error: { code: -32601 } }).kind, "unavailable");
  assert.deepEqual(heapResult({ result: { usedSize: 100, totalSize: 200 } }), { kind: "observed", usedBytes: 100, totalBytes: 200 });
  assert.throws(() => heapResult({ result: { usedSize: 201, totalSize: 200 } }));
});
test("CDP close rejects promptly and releases request listeners", async () => {
  const socket = new EventEmitter(); socket.send = () => queueMicrotask(() => socket.emit("close"));
  await assert.rejects(request(socket, 1, "Runtime.evaluate"), /transport_closed/u);
  assert.equal(socket.listenerCount("message"), 0);
});
test("CDP matches response IDs and cleans up after success", async () => {
  const socket = new EventEmitter(); socket.send = () => queueMicrotask(() => {
    socket.emit("message", Buffer.from('{"id":2,"result":{}}'));
    socket.emit("message", Buffer.from('{"id":1,"result":{"value":1}}'));
  });
  assert.deepEqual(await request(socket, 1, "Runtime.evaluate"), { id: 1, result: { value: 1 } });
  assert.equal(socket.listenerCount("message"), 0);
});

test("native trace accepts versioned stage names emitted by the current producer", () => {
  const value = { hermes: true, trace: { ...trace.trace, events: [{ stage: "premium:response_v2", edge: "event", atMs: 1 }] } };
  assert.equal(validateTrace(value), value.trace);
  for (const stage of ["2private", "premium:response v2", "premium:response_v2?payload"]) {
    assert.throws(() => validateTrace({ ...value, trace: { ...value.trace, events: [{ stage, edge: "event", atMs: 1 }] } }));
  }
});
