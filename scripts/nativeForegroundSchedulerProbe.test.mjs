import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { once } from "node:events";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = resolve(ROOT, "scripts/nativeForegroundSchedulerProbe.mjs");
const require = createRequire(resolve(ROOT, "node_modules/@react-native/dev-middleware/package.json"));
const WebSocketServer = require("ws").Server;
const APP_ID = "com.example.probe-secret";
const DEVICE_ID = "device-17-secret";
const PAGE_ID = "42";

function marker(stage, measurement = null) {
  return { protocol: "patternly-hermes-capability-v1", hermes: true, stage, measurement };
}

function completedMeasurement(overrides = {}) {
  const {
    actualCallbackMs = 6_100,
    callbackLatenessMs = 5_100,
    wallElapsedMs = 6_100,
    ...stallOverrides
  } = overrides;
  return {
    requestedCallbackMs: 1_000,
    actualCallbackMs,
    callbackLatenessMs,
    wallElapsedMs,
    stall: {
      requestedMs: 6_000,
      monotonicMs: 6_000,
      wallMs: 6_001,
      iterations: 100_000,
      terminationReason: "monotonic_elapsed",
      completed: true,
      ...overrides,
    },
  };
}

async function createProtocolServer({ scenario = "complete", identity = APP_ID, nativeRegistration = {
  protocol: "patternly-native-clock-registration-v1", registered: true, hybridObject: true, methodSurfaceComplete: true, error: null,
} } = {}) {
  let origin;
  let targetRequests = 0;
  let readCount = 0;
  let measurementStarted = false;
  const server = createServer((request, response) => {
    if (request.url !== "/json/list") {
      response.writeHead(404).end();
      return;
    }
    targetRequests += 1;
    const target = {
      id: `${DEVICE_ID}-${PAGE_ID}`,
      type: "node",
      appId: identity,
      title: "sensitive target title",
      webSocketDebuggerUrl: `${origin.replace("http:", "ws:")}/inspector/debug?page=${PAGE_ID}&device=${DEVICE_ID}`,
      reactNative: { logicalDeviceId: DEVICE_ID },
    };
    const body = JSON.stringify([target]);
    response.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
    response.end(body);
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  server.on("upgrade", (request, socket, head) => {
    if (request.headers.origin !== origin || request.url !== `/inspector/debug?page=${PAGE_ID}&device=${DEVICE_ID}`) {
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (client) => sockets.emit("connection", client, request));
  });
  sockets.on("connection", (socket) => {
    socket.on("message", (raw) => {
      const request = JSON.parse(raw.toString());
      let value;
      if (request.method !== "Runtime.evaluate") return;
      if (request.params.expression.includes("readNativeRegistration")) {
        value = nativeRegistration;
      } else if (request.params.expression.includes("startMeasurement")) {
        measurementStarted = true;
        value = { accepted: true, stage: "awaiting_callback" };
      } else if (!measurementStarted) {
        value = marker("ready");
      } else {
        readCount += 1;
        value = marker("complete", scenario === "complete"
          ? completedMeasurement()
          : scenario === "earlycap"
            ? completedMeasurement({ monotonicMs: 500, wallMs: 520, iterations: 30_000_000,
              terminationReason: "iteration_limit", completed: false })
            : scenario === "wallguard"
              ? completedMeasurement({ monotonicMs: 5_000, wallMs: 8_000, actualCallbackMs: 5_001,
                callbackLatenessMs: 4_001, wallElapsedMs: 8_000,
                terminationReason: "wall_guard", completed: false })
              : scenario === "clockjump"
                ? completedMeasurement({ monotonicMs: 6_000, wallMs: -20_000, wallElapsedMs: -20_000 })
                : scenario === "clockforward"
                  ? completedMeasurement({ monotonicMs: 6_000, wallMs: 20_000, wallElapsedMs: 20_000 })
                : scenario === "callback_early"
                  ? completedMeasurement({ actualCallbackMs: 5_000, callbackLatenessMs: 4_000 })
                  : scenario === "callback_lateness_invalid"
                    ? completedMeasurement({ callbackLatenessMs: -1 })
                : completedMeasurement());
      }
      socket.send(JSON.stringify({ id: request.id, result: { result: { type: "object", value } } }));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  origin = `http://127.0.0.1:${address.port}`;
  return {
    origin,
    get targetRequests() { return targetRequests; },
    get readCount() { return readCount; },
    close: async () => {
      for (const client of sockets.clients) client.terminate();
      await new Promise((resolvePromise) => sockets.close(resolvePromise));
      await new Promise((resolvePromise) => server.close(resolvePromise));
    },
  };
}

function runProbe(origin, extraArgs = []) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [
      CLI,
      "--metro-origin", origin,
      "--app-id", APP_ID,
      "--device-target", DEVICE_ID,
      ...extraArgs,
    ], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 10_000);
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.once("error", rejectPromise);
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      resolvePromise({ code, signal, stdout, stderr });
    });
  });
}

function parseOutput(output) {
  const line = output.trim().split("\n").at(-1);
  return JSON.parse(line);
}

const authorizedArgs = ["--measure-stall", "--owner-authorized"];

test("readiness uses exact local target and emits no target data", async () => {
  const mock = await createProtocolServer();
  try {
    const result = await runProbe(mock.origin);
    assert.equal(result.code, 0);
    assert.deepEqual(parseOutput(result.stdout), {
      schema: "patternly-foreground-scheduler-probe-v1",
      stage: "ready",
      hermes: true,
      mode: "readiness",
    });
    assert.equal(mock.targetRequests, 1);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret|sensitive|webSocketDebuggerUrl/);
  } finally {
    await mock.close();
  }
});

test("only monotonic_elapsed at the requested duration is successful", async () => {
  const mock = await createProtocolServer();
  try {
    const result = await runProbe(mock.origin, authorizedArgs);
    assert.equal(result.code, 0);
    const output = parseOutput(result.stdout);
    assert.equal(output.stage, "complete");
    assert.equal(output.terminationReason, "monotonic_elapsed");
    assert.equal(output.stallMonotonicMs, 6_000);
    assert.equal(output.stallWallMs, 6_001);
    assert.equal(mock.readCount, 1);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret|sensitive|webSocketDebuggerUrl/);
  } finally {
    await mock.close();
  }
});

test("iteration-cap exit is safe nonzero incomplete, not a completed stall", async () => {
  const mock = await createProtocolServer({ scenario: "earlycap" });
  try {
    const result = await runProbe(mock.origin, authorizedArgs);
    assert.notEqual(result.code, 0);
    assert.deepEqual(parseOutput(result.stderr), {
      schema: "patternly-foreground-scheduler-probe-v1",
      stage: "error",
      error: "measurement_incomplete",
    });
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret|sensitive|30_000_000|500/);
  } finally {
    await mock.close();
  }
});

test("wall guard is independently bounded and never proves the stall", async () => {
  const mock = await createProtocolServer({ scenario: "wallguard" });
  try {
    const result = await runProbe(mock.origin, authorizedArgs);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "measurement_incomplete");
  } finally {
    await mock.close();
  }
});

test("civil-clock jumps are metadata and do not invalidate monotonic completion", async () => {
  for (const [scenario, expectedWall] of [["clockjump", -20_000], ["clockforward", 20_000]]) {
    const mock = await createProtocolServer({ scenario });
    try {
      const result = await runProbe(mock.origin, authorizedArgs);
      assert.equal(result.code, 0);
      const output = parseOutput(result.stdout);
      assert.equal(output.terminationReason, "monotonic_elapsed");
      assert.equal(output.stallMonotonicMs, 6_000);
      assert.equal(output.stallWallMs, expectedWall);
      assert.equal(output.wallElapsedMs, expectedWall);
    } finally {
      await mock.close();
    }
  }
});

test("callback earlier than the completed stall is rejected safely", async () => {
  const mock = await createProtocolServer({ scenario: "callback_early" });
  try {
    const result = await runProbe(mock.origin, authorizedArgs);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "measurement_result_invalid");
  } finally {
    await mock.close();
  }
});

test("negative or inconsistent callback lateness is rejected safely", async () => {
  const mock = await createProtocolServer({ scenario: "callback_lateness_invalid" });
  try {
    const result = await runProbe(mock.origin, authorizedArgs);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "measurement_result_invalid");
  } finally {
    await mock.close();
  }
});

test("identity mismatch is rejected before opening a debugger socket", async () => {
  const mock = await createProtocolServer({ identity: "other.app" });
  try {
    const result = await runProbe(mock.origin);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "target_identity_mismatch");
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /other\.app|device-17-secret|sensitive/);
  } finally {
    await mock.close();
  }
});

test("measurement requires explicit owner authorization before network access", async () => {
  const mock = await createProtocolServer();
  try {
    const result = await runProbe(mock.origin, ["--measure-stall"]);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "measurement_not_authorized");
    assert.equal(mock.targetRequests, 0);
  } finally {
    await mock.close();
  }
});

test("native registration emits only the closed capability facts", async () => {
  const mock = await createProtocolServer();
  try {
    const result = await runProbe(mock.origin, ["--native-registration"]);
    assert.equal(result.code, 0);
    assert.deepEqual(parseOutput(result.stdout), {
      schema: "patternly-foreground-scheduler-probe-v1", stage: "complete", hermes: true,
      mode: "native_registration", registered: true, hybridObject: true, methodSurfaceComplete: true,
    });
    assert.equal(mock.readCount, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret|sensitive|webSocketDebuggerUrl/);
  } finally { await mock.close(); }
});

test("missing, failed or malformed native registration cannot become success or expose payloads", async () => {
  const valid = { protocol: "patternly-native-clock-registration-v1", registered: true, hybridObject: true, methodSurfaceComplete: true, error: null };
  for (const [nativeRegistration, error] of [
    [{ ...valid, registered: false, hybridObject: false, methodSurfaceComplete: false }, "native_clock_unregistered"],
    [{ ...valid, methodSurfaceComplete: false }, "native_clock_registration_invalid"],
    [{ ...valid, error: "native_clock_probe_failed" }, "native_clock_probe_failed"],
    [{ ...valid, privateData: "sensitive-payload" }, "native_clock_registration_invalid"],
  ]) {
    const mock = await createProtocolServer({ nativeRegistration });
    try {
      const result = await runProbe(mock.origin, ["--native-registration"]);
      assert.notEqual(result.code, 0);
      assert.equal(parseOutput(result.stderr).error, error);
      assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret|sensitive|privateData/);
    } finally { await mock.close(); }
  }
});

test("registration and stall modes cannot be combined", async () => {
  const mock = await createProtocolServer();
  try {
    const result = await runProbe(mock.origin, ["--native-registration", ...authorizedArgs]);
    assert.notEqual(result.code, 0);
    assert.equal(parseOutput(result.stderr).error, "arguments_invalid");
    assert.equal(mock.targetRequests, 0);
  } finally { await mock.close(); }
});

test("actual fixture's explicit registration probe constructs only an unbound owner and calls no clock methods", () => {
  // A modeled SDK contract, not a Nitro/Hermes runtime proof. Execute the actual
  // fixture body with an owner whose persistent/runtime methods are tripwires.
  const source = readFileSync(resolve(ROOT, "scripts/fixtures/foregroundSchedulerProbe/probe.js"), "utf8");
  const imports = source.match(/^import .*;$/gmu);
  assert.deepEqual(imports, ['import React from "react";', 'import { AppRegistry, Text, View } from "react-native";']);
  const calls = [];
  const owner = new Proxy({}, { get(_target, key) { return () => { calls.push(String(key)); throw new Error("clock_method_forbidden"); }; } });
  const context = vm.createContext({
    HermesInternal: {}, AppRegistry: { registerComponent() {} },
    require(name) {
      assert.equal(name, "react-native-nitro-modules"); calls.push("loadNitro");
      return { NitroModules: {
        hasHybridObject(name) { assert.equal(name, "PatternlyForegroundClock"); calls.push("has"); return true; },
        createHybridObject(name) { assert.equal(name, "PatternlyForegroundClock"); calls.push("create"); return owner; },
        isHybridObject(value) { assert.equal(value, owner); calls.push("isHybrid"); return true; },
      } };
    },
  });
  vm.runInContext(source.replace(/^import .*;$/gmu, ""), context);
  context.__patternlyForegroundSchedulerProbe.read();
  assert.deepEqual(calls, [], "default readiness must not initialize Nitro");
  const result = context.__patternlyForegroundSchedulerProbe.readNativeRegistration();
  assert.equal(result.methodSurfaceComplete, true);
  assert.equal(result.error, null);
  assert.deepEqual(calls, ["loadNitro", "has", "create", "isHybrid"]);
});
