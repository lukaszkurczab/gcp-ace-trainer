#!/usr/bin/env node

import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { performance } from "node:perf_hooks";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "patternly-foreground-scheduler-probe-v1";
const DEFAULT_ORIGIN = "http://127.0.0.1:8082";
const MAX_BODY_BYTES = 64 * 1024;
const MIN_STALL_MONOTONIC_MS = 6_000;
const MAX_MEASUREMENT_WALL_MS = 8_000;
const CALLBACK_ROUNDING_TOLERANCE_MS = 2;
const READBACK_INTERVAL_MS = 100;
const MAX_READBACK_ATTEMPTS = 16;
const MARKER_EXPRESSION = `(() => {
  const marker = globalThis.__patternlyForegroundSchedulerProbe;
  return marker && typeof marker.read === "function" ? marker.read() : null;
})()`;
const START_EXPRESSION = `(() => {
  const marker = globalThis.__patternlyForegroundSchedulerProbe;
  return marker && typeof marker.startMeasurement === "function"
    ? marker.startMeasurement()
    : null;
})()`;
const NATIVE_REGISTRATION_EXPRESSION = `(() => {
  const marker = globalThis.__patternlyForegroundSchedulerProbe;
  return marker && typeof marker.readNativeRegistration === "function"
    ? marker.readNativeRegistration()
    : null;
})()`;

const SAFE_ERRORS = new Set([
  "arguments_invalid",
  "origin_invalid",
  "dependency_unavailable",
  "discovery_failed",
  "target_cardinality_invalid",
  "target_identity_mismatch",
  "target_url_invalid",
  "websocket_connect_failed",
  "cdp_protocol_failed",
  "readiness_marker_missing",
  "readiness_marker_invalid",
  "measurement_not_authorized",
  "measurement_already_used",
  "measurement_start_rejected",
  "measurement_timeout",
  "measurement_incomplete",
  "measurement_result_invalid",
  "native_clock_probe_failed",
  "native_clock_unregistered",
  "native_clock_registration_invalid",
]);

function emit(value, stream = process.stdout) {
  stream.write(`${JSON.stringify({ schema: SCHEMA, ...value })}\n`);
}

function fail(code) {
  emit({ stage: "error", error: SAFE_ERRORS.has(code) ? code : "probe_failed" }, process.stderr);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const result = {
    origin: DEFAULT_ORIGIN,
    appId: null,
    deviceTarget: null,
    measureStall: false,
    ownerAuthorized: false,
    nativeRegistration: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--measure-stall") result.measureStall = true;
    else if (arg === "--native-registration") result.nativeRegistration = true;
    else if (arg === "--owner-authorized") result.ownerAuthorized = true;
    else if (["--metro-origin", "--app-id", "--device-target"].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("arguments_invalid");
      index += 1;
      if (arg === "--metro-origin") result.origin = value;
      if (arg === "--app-id") result.appId = value;
      if (arg === "--device-target") result.deviceTarget = value;
    } else {
      throw new Error("arguments_invalid");
    }
  }
  if (!result.appId || !result.deviceTarget || result.appId.length > 160 || result.deviceTarget.length > 160) {
    throw new Error("arguments_invalid");
  }
  if (result.ownerAuthorized && !result.measureStall) throw new Error("arguments_invalid");
  if (result.nativeRegistration && result.measureStall) throw new Error("arguments_invalid");
  if (result.measureStall && !result.ownerAuthorized) throw new Error("measurement_not_authorized");
  return result;
}

function parseLoopbackOrigin(value) {
  let origin;
  try {
    origin = new URL(value);
  } catch {
    throw new Error("origin_invalid");
  }
  if (origin.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
      || !origin.port || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("origin_invalid");
  }
  return origin;
}

function loadWebSocket() {
  try {
    const devMiddlewarePackage = resolve(ROOT, "node_modules/@react-native/dev-middleware/package.json");
    return createRequire(devMiddlewarePackage)("ws");
  } catch {
    throw new Error("dependency_unavailable");
  }
}

async function fetchTargets(origin) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);
  try {
    const response = await fetch(new URL("/json/list", origin), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      redirect: "error",
    });
    if (!response.ok) throw new Error("discovery_failed");
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) throw new Error("discovery_failed");
    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) throw new Error("discovery_failed");
    const targets = JSON.parse(body);
    if (!Array.isArray(targets)) throw new Error("discovery_failed");
    return targets;
  } catch {
    throw new Error("discovery_failed");
  } finally {
    clearTimeout(timeout);
  }
}

function selectTarget(targets, origin, appId, deviceTarget) {
  if (targets.length !== 1) throw new Error("target_cardinality_invalid");
  const target = targets[0];
  if (!target || target.type !== "node" || target.appId !== appId
      || target.reactNative?.logicalDeviceId !== deviceTarget) {
    throw new Error("target_identity_mismatch");
  }
  let socketUrl;
  try {
    socketUrl = new URL(target.webSocketDebuggerUrl);
  } catch {
    throw new Error("target_url_invalid");
  }
  const params = [...socketUrl.searchParams.entries()];
  const pageId = socketUrl.searchParams.get("page");
  const deviceId = socketUrl.searchParams.get("device");
  if (!(["ws:", "wss:"].includes(socketUrl.protocol)) || socketUrl.host !== origin.host
      || socketUrl.pathname !== "/inspector/debug" || socketUrl.username || socketUrl.password
      || socketUrl.hash || params.length !== 2 || !pageId || deviceId !== deviceTarget
      || target.id !== `${deviceTarget}-${pageId}`) {
    throw new Error("target_url_invalid");
  }
  return socketUrl.toString();
}

function connectWebSocket(WebSocket, socketUrl, origin) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const socket = new WebSocket(socketUrl, {
      origin: origin.origin,
      handshakeTimeout: 1_500,
      maxPayload: MAX_BODY_BYTES,
      perMessageDeflate: false,
      followRedirects: false,
    });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.terminate();
      rejectPromise(new Error("websocket_connect_failed"));
    }, 1_750);
    socket.once("open", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(socket);
    });
    socket.once("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rejectPromise(new Error("websocket_connect_failed"));
    });
  });
}

function sendCdp(socket, id, method, params, timeoutMs) {
  return new Promise((resolvePromise, rejectPromise) => {
    const finish = (handler, value) => {
      clearTimeout(timeout);
      socket.off("message", onMessage);
      socket.off("close", onClose);
      socket.off("error", onClose);
      handler(value);
    };
    const onMessage = (data) => {
      let message;
      try { message = JSON.parse(data.toString()); } catch { return; }
      if (message?.id === id) finish(resolvePromise, message);
    };
    const onClose = () => finish(rejectPromise, new Error("cdp_protocol_failed"));
    const timeout = setTimeout(onClose, timeoutMs);
    socket.on("message", onMessage);
    socket.once("close", onClose);
    socket.once("error", onClose);
    try {
      socket.send(JSON.stringify({ id, method, params }), (error) => { if (error) onClose(); });
    } catch {
      onClose();
    }
  });
}

async function evaluate(socket, id, expression, timeoutMs) {
  const response = await sendCdp(socket, id, "Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: false, silent: true,
  }, timeoutMs);
  if (response.error || response.result?.exceptionDetails) throw new Error("cdp_protocol_failed");
  const value = response.result?.result?.value;
  if (!value || typeof value !== "object") throw new Error("readiness_marker_missing");
  return value;
}

function validateReadyMarker(marker) {
  if (marker.protocol !== "patternly-hermes-capability-v1" || typeof marker.hermes !== "boolean") {
    throw new Error("readiness_marker_invalid");
  }
  if (!marker.hermes || !["ready", "measurement_running", "awaiting_callback", "complete"].includes(marker.stage)) {
    throw new Error("readiness_marker_invalid");
  }
}

function normalizeMeasurement(marker) {
  const result = marker.measurement;
  const numbers = [
    result?.requestedCallbackMs,
    result?.actualCallbackMs,
    result?.callbackLatenessMs,
    result?.wallElapsedMs,
    result?.stall?.requestedMs,
    result?.stall?.monotonicMs,
    result?.stall?.wallMs,
    result?.stall?.iterations,
  ];
  if (marker.stage !== "complete" || !numbers.every(Number.isFinite)
      || result.stall.requestedMs !== MIN_STALL_MONOTONIC_MS || result.requestedCallbackMs !== 1_000
      || result.stall.iterations < 0 || result.stall.iterations > 30_000_000
      || result.actualCallbackMs < 0 || result.callbackLatenessMs < 0
      || result.actualCallbackMs > MAX_MEASUREMENT_WALL_MS
      || result.callbackLatenessMs > MAX_MEASUREMENT_WALL_MS
      || result.actualCallbackMs + CALLBACK_ROUNDING_TOLERANCE_MS < result.stall.monotonicMs
      || Math.abs(result.callbackLatenessMs - (result.actualCallbackMs - result.requestedCallbackMs))
        > CALLBACK_ROUNDING_TOLERANCE_MS) {
    throw new Error("measurement_result_invalid");
  }
  if (!["monotonic_elapsed", "iteration_limit", "wall_guard"].includes(result.stall.terminationReason)
      || typeof result.stall.completed !== "boolean") {
    throw new Error("measurement_result_invalid");
  }
  if (result.stall.terminationReason !== "monotonic_elapsed" || result.stall.completed !== true
      || result.stall.monotonicMs < MIN_STALL_MONOTONIC_MS
      || result.stall.monotonicMs > MAX_MEASUREMENT_WALL_MS) {
    throw new Error("measurement_incomplete");
  }
  return {
    stage: "complete",
    hermes: true,
    requestedStallMs: result.stall.requestedMs,
    stallMonotonicMs: round(result.stall.monotonicMs),
    stallWallMs: round(result.stall.wallMs),
    stallIterations: Math.trunc(result.stall.iterations),
    terminationReason: result.stall.terminationReason,
    requestedCallbackMs: result.requestedCallbackMs,
    actualCallbackMs: round(result.actualCallbackMs),
    callbackLatenessMs: round(result.callbackLatenessMs),
    wallElapsedMs: round(result.wallElapsedMs),
  };
}

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}

async function run() {
  let args;
  let origin;
  try {
    args = parseArgs(process.argv.slice(2));
    origin = parseLoopbackOrigin(args.origin);
  } catch (error) {
    throw new Error(error?.message === "measurement_not_authorized" ? "measurement_not_authorized"
      : error?.message === "origin_invalid" ? "origin_invalid" : "arguments_invalid");
  }

  const WebSocket = loadWebSocket();
  const targets = await fetchTargets(origin);
  const socketUrl = selectTarget(targets, origin, args.appId, args.deviceTarget);
  const socket = await connectWebSocket(WebSocket, socketUrl, origin);
  let cdpId = 0;
  try {
    const initial = await evaluate(socket, ++cdpId, MARKER_EXPRESSION, 1_500);
    validateReadyMarker(initial);
    if (args.nativeRegistration) {
      const result = await evaluate(socket, ++cdpId, NATIVE_REGISTRATION_EXPRESSION, 1_500);
      const keys = ["protocol", "registered", "hybridObject", "methodSurfaceComplete", "error"];
      if (Object.keys(result).length !== keys.length || !keys.every((key) => Object.hasOwn(result, key))
          || result.protocol !== "patternly-native-clock-registration-v1"
          || ![result.registered, result.hybridObject, result.methodSurfaceComplete].every((value) => typeof value === "boolean")
          || ![null, "native_clock_probe_failed"].includes(result.error)) throw new Error("native_clock_registration_invalid");
      if (result.error) throw new Error("native_clock_probe_failed");
      if (!result.registered) throw new Error("native_clock_unregistered");
      if (!result.hybridObject || !result.methodSurfaceComplete) throw new Error("native_clock_registration_invalid");
      emit({ stage: "complete", hermes: initial.hermes, mode: "native_registration", registered: true, hybridObject: true, methodSurfaceComplete: true });
      return;
    }
    if (!args.measureStall) {
      emit({ stage: initial.stage, hermes: initial.hermes, mode: "readiness" });
      return;
    }
    if (initial.stage !== "ready") throw new Error("measurement_already_used");

    const deadline = performance.now() + MAX_MEASUREMENT_WALL_MS;
    const remaining = () => Math.max(1, Math.floor(deadline - performance.now()));
    const start = await evaluate(socket, ++cdpId, START_EXPRESSION, remaining());
    if (start.accepted !== true || start.stage !== "awaiting_callback") {
      throw new Error(start.error === "measurement_already_used" ? "measurement_already_used" : "measurement_start_rejected");
    }

    let lastMarker = null;
    for (let attempt = 0; attempt < MAX_READBACK_ATTEMPTS && performance.now() < deadline; attempt += 1) {
      lastMarker = await evaluate(socket, ++cdpId, MARKER_EXPRESSION, remaining());
      validateReadyMarker(lastMarker);
      if (lastMarker.stage === "complete") break;
      await delay(Math.min(READBACK_INTERVAL_MS, remaining()));
    }
    emit({ mode: "measurement", ...normalizeMeasurement(lastMarker ?? {}) });
  } finally {
    try { socket.close(); } catch { /* private diagnostic connection */ }
  }
}

run().catch((error) => {
  const code = SAFE_ERRORS.has(error?.message) ? error.message : "probe_failed";
  fail(code);
});
