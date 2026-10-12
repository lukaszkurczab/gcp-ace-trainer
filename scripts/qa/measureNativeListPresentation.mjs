import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parseOrigin, selectTarget, request, heapResult } from "./readNativeStartupTrace.mjs";

const KEY = 'Symbol.for("patternly.perf06.list-measurement.v1")';
const TIME_WINDOW_MS = 5000;

export function validateListMeasurement(value, configuration) {
  const keys = ["schema", "configuration", "startedAt", "stoppedAt", "mountedRows", "peakMountedRows", "rowMounts", "rowUnmounts", "commits", "renderDurationMs", "longTasks", "frameGaps", "truncated", "frameSource"];
  if (!value || Object.keys(value).length !== keys.length || Object.keys(value).some((key) => !keys.includes(key))
    || value.schema !== "patternly.perf06.list-measurement.v1" || JSON.stringify(value.configuration) !== JSON.stringify(configuration)
    || value.truncated !== false || value.frameSource !== "JS requestAnimationFrame callbacks; not native frame presentation"
    || !Number.isFinite(value.startedAt) || !Number.isFinite(value.stoppedAt) || value.stoppedAt < value.startedAt) throw Error("measurement_rejected");
  for (const key of ["mountedRows", "peakMountedRows", "rowMounts", "rowUnmounts", "commits"]) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) throw Error("measurement_rejected");
  }
  if (!Number.isFinite(value.renderDurationMs) || value.renderDurationMs < 0 || value.mountedRows <= 0 || value.commits <= 0
    || value.rowMounts - value.rowUnmounts !== value.mountedRows || value.peakMountedRows < value.mountedRows
    || !Array.isArray(value.longTasks) || value.longTasks.length > 512 || !Array.isArray(value.frameGaps) || value.frameGaps.length === 0 || value.frameGaps.length > 2400
    || [...value.longTasks, ...value.frameGaps].some((duration) => !Number.isFinite(duration) || duration < 0)) throw Error("measurement_rejected");
  return value;
}

async function evaluate(socket, id, expression) {
  const result = await request(socket, id, "Runtime.evaluate", { expression, returnByValue: true, silent: true });
  if (result.error || result.result?.exceptionDetails) throw Error("fixture_command_failed");
  return result.result?.result?.value;
}

export async function measureNativeListPresentation(metroUrl, originUrl, screen, size) {
  const metro = parseOrigin(metroUrl);
  const origin = parseOrigin(originUrl);
  if (metro.port !== origin.port) throw Error("origin_rejected");
  if (!["activity", "review-due", "review-upcoming"].includes(screen) || !(screen === "activity" ? [50, 500, 1000] : [100, 500, 1000]).includes(size)) throw Error("configuration_rejected");
  const response = await fetch(new URL("/json/list", metro), { signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!response.ok) throw Error("discovery_failed");
  const body = await response.text();
  if (body.length > 65536) throw Error("target_rejected");
  const endpoint = selectTarget(JSON.parse(body), metro);
  const WebSocket = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url))("ws");
  const socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: 5000, maxPayload: 131072, followRedirects: false });
  const configuration = { screen, size };
  const heapSamples = [];
  let started = false;
  let id = 0;
  try {
    await new Promise((accept, reject) => { socket.once("open", accept); socket.once("error", () => reject(Error("connect_failed"))); });
    const capability = await evaluate(socket, ++id, `JSON.stringify({hermes:!!globalThis.HermesInternal,fixture:!!globalThis[${KEY}]})`);
    const capabilities = JSON.parse(capability ?? "null");
    if (capabilities?.hermes !== true || capabilities?.fixture !== true) throw Error("fixture_unavailable");
    if (await evaluate(socket, ++id, `globalThis[${KEY}].run(${JSON.stringify(configuration)})`) !== "started") throw Error("fixture_command_failed");
    started = true;
    const deadline = Date.now() + TIME_WINDOW_MS;
    do {
      const heap = heapResult(await request(socket, ++id, "Runtime.getHeapUsage"));
      if (heap.kind !== "observed") throw Error("heap_unavailable");
      heapSamples.push(heap.usedBytes);
      await new Promise((done) => setTimeout(done, 250));
    } while (Date.now() < deadline);
    await evaluate(socket, ++id, `globalThis[${KEY}].stop()`);
    started = false;
    const measurement = validateListMeasurement(JSON.parse(await evaluate(socket, ++id, `JSON.stringify(globalThis[${KEY}].read())`)), configuration);
    const fixtureSource = readFileSync(new URL("../../src/testing/perf06PresentationFixtures.ts", import.meta.url));
    return { schema: "patternly.perf06.native-list-readback.v1", fixtureSourceSha256: createHash("sha256").update(fixtureSource).digest("hex"),
      measurement, heap: { kind: "sampled", samples: heapSamples.length, intervalMs: 250, sampledPeakUsedBytes: Math.max(...heapSamples), finalUsedBytes: heapSamples.at(-1) },
      scope: "isolated synthetic canonical UI on existing native binary; JS callback frames, not native presentation frames; sampled heap can miss peaks during stalls" };
  } finally {
    if (started && socket.readyState === WebSocket.OPEN) {
      try { await evaluate(socket, ++id, `globalThis[${KEY}].stop()`); } catch { /* Fixture auto-stops after 20 seconds. */ }
    }
    socket.terminate();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [metro, origin, screen, rawSize, ...extra] = process.argv.slice(2);
  if (!metro || !origin || !screen || !rawSize || extra.length) { console.error(JSON.stringify({ error: "arguments_rejected" })); process.exitCode = 1; }
  else measureNativeListPresentation(metro, origin, screen, Number(rawSize)).then((receipt) => console.log(JSON.stringify(receipt))).catch((error) => {
    const categories = new Set(["origin_rejected", "target_rejected", "configuration_rejected", "discovery_failed", "connect_failed", "fixture_unavailable", "fixture_command_failed", "heap_unavailable", "measurement_rejected", "read_timeout", "transport_closed"]);
    console.error(JSON.stringify({ error: categories.has(error?.message) ? error.message : "measurement_failed" })); process.exitCode = 1;
  });
}
