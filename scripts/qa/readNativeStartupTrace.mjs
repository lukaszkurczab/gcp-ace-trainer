import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TIMEOUT_MS = 5_000;
const SCHEMA = "patternly.startup-trace.v1";

export function parseOrigin(value) {
  const origin = new URL(value);
  if (origin.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
    || !origin.port || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw Error("origin_rejected");
  return origin;
}

export function selectTarget(targets, metroOrigin, expectedAppId = "com.lkurczab.patternly") {
  if (!["com.lkurczab.patternly", "com.lkurczab.patternly.sec03"].includes(expectedAppId)
    || !Array.isArray(targets) || targets.length !== 1) throw Error("target_rejected");
  const target = targets[0];
  if (target.type !== "node" || target.appId !== expectedAppId || target.deviceName !== "iPhone 17") throw Error("target_rejected");
  const url = new URL(target.webSocketDebuggerUrl);
  if (url.protocol !== "ws:" || url.host !== metroOrigin.host || url.pathname !== "/inspector/debug"
    || url.username || url.password || url.hash || [...url.searchParams].length !== 2
    || !url.searchParams.get("page") || url.searchParams.get("device") !== target.reactNative?.logicalDeviceId
    || target.id !== `${target.reactNative.logicalDeviceId}-${url.searchParams.get("page")}`) throw Error("target_rejected");
  return url.href;
}

export function validateTrace(value) {
  if (value?.hermes !== true || value.trace?.schema !== SCHEMA || typeof value.trace.truncated !== "boolean"
    || !Array.isArray(value.trace.events) || value.trace.events.length === 0 || value.trace.events.length > 512) throw Error("trace_rejected");
  for (const event of value.trace.events) {
    if (!event || Object.keys(event).some((key) => !["stage", "edge", "atMs", "span"].includes(key))
      || typeof event.stage !== "string" || !/^[a-z][a-z_:-]{0,79}$/u.test(event.stage)
      || !["begin", "end", "event"].includes(event.edge) || !Number.isFinite(event.atMs) || event.atMs < 0
      || (event.span !== undefined && (!Number.isSafeInteger(event.span) || event.span <= 0))) throw Error("trace_rejected");
  }
  return value.trace;
}

export function heapResult(message) {
  if (message.error) return { kind: "unavailable", category: "protocol_unsupported" };
  const { usedSize, totalSize } = message.result ?? {};
  if (!Number.isFinite(usedSize) || usedSize < 0 || !Number.isFinite(totalSize) || totalSize < usedSize) throw Error("heap_rejected");
  return { kind: "observed", usedBytes: usedSize, totalBytes: totalSize };
}

export function request(socket, id, method, params = {}) {
  return new Promise((accept, reject) => {
    const finish = (result, error) => {
      clearTimeout(timer);
      socket.off("message", onMessage); socket.off("close", onClose); socket.off("error", onClose);
      if (error) reject(Error(error)); else accept(result);
    };
    const onClose = () => finish(null, "transport_closed");
    const onMessage = (bytes) => {
      let value;
      try { value = JSON.parse(bytes.toString()); } catch { return; }
      if (value.id === id) finish(value);
    };
    const timer = setTimeout(() => finish(null, "read_timeout"), TIMEOUT_MS);
    socket.on("message", onMessage); socket.once("close", onClose); socket.once("error", onClose);
    socket.send(JSON.stringify({ id, method, params }), (error) => { if (error) onClose(); });
  });
}

export async function readNativeStartupTrace(metroUrl, debuggerUrl) {
  const metro = parseOrigin(metroUrl);
  const debuggerOrigin = parseOrigin(debuggerUrl);
  if (metro.port !== debuggerOrigin.port) throw Error("origin_rejected");
  const response = await fetch(new URL("/json/list", metro), { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error" });
  if (!response.ok) throw Error("discovery_failed");
  const body = await response.text();
  if (body.length > 64 * 1024) throw Error("target_rejected");
  const endpoint = selectTarget(JSON.parse(body), metro);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(endpoint, { origin: debuggerOrigin.origin, handshakeTimeout: TIMEOUT_MS, maxPayload: 128 * 1024, followRedirects: false });
  try {
    await new Promise((accept, reject) => {
      socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed")));
    });
    const result = await request(socket, 1, "Runtime.evaluate", {
      expression: 'JSON.stringify({hermes:!!globalThis.HermesInternal,trace:globalThis[Symbol.for("patternly.startup-trace.v1")]?.read()})',
      returnByValue: true, silent: true,
    });
    if (result.error || result.result?.exceptionDetails) throw Error("trace_rejected");
    const trace = validateTrace(JSON.parse(result.result?.result?.value ?? "null"));
    const heap = heapResult(await request(socket, 2, "Runtime.getHeapUsage"));
    return { schema: "patternly.native-startup-readback.v1", trace, heap };
  } finally { socket.terminate(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [metro, debuggerOrigin, ...extra] = process.argv.slice(2);
  const safeErrors = new Set(["origin_rejected", "target_rejected", "trace_rejected", "heap_rejected", "transport_closed", "read_timeout", "connect_failed", "discovery_failed"]);
  if (!metro || !debuggerOrigin || extra.length) {
    console.error(JSON.stringify({ error: "arguments_rejected" })); process.exitCode = 1;
  } else {
    readNativeStartupTrace(metro, debuggerOrigin).then((value) => {
      console.log(JSON.stringify(value));
      if (value.trace.truncated) process.exitCode = 1;
    }).catch((error) => {
      console.error(JSON.stringify({ error: safeErrors.has(error?.message) ? error.message : "readback_failed" })); process.exitCode = 1;
    });
  }
}
