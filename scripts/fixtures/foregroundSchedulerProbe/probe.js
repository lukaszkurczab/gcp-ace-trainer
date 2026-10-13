import React from "react";
import { AppRegistry, Text, View } from "react-native";

const PROTOCOL = "patternly-hermes-capability-v1";
const STALL_MS = 6_000;
const WALL_GUARD_MS = 8_000;
const CALLBACK_MS = 1_000;
const MAX_ITERATIONS = 30_000_000;

let stage = "ready";
let measurement = null;
const hermes = typeof HermesInternal === "object";

function read() {
  return {
    protocol: PROTOCOL,
    hermes,
    stage,
    measurement,
  };
}

// Explicit diagnostic only: constructing an unbound owner never receives a
// storage handle or calls any clock/storage method. Default readiness does not
// even load Nitro. Runtime evidence is still required for this SDK boundary.
function readNativeRegistration() {
  const result = {
    protocol: "patternly-native-clock-registration-v1",
    registered: false,
    hybridObject: false,
    methodSurfaceComplete: false,
    error: null,
  };
  try {
    const { NitroModules } = require("react-native-nitro-modules");
    result.registered = NitroModules.hasHybridObject("PatternlyForegroundClock");
    if (!result.registered) return result;
    const owner = NitroModules.createHybridObject("PatternlyForegroundClock");
    result.hybridObject = NitroModules.isHybridObject(owner);
    result.methodSurfaceComplete = ["bind", "read", "apply", "arm", "enter", "checkpoint", "pause", "quiesce", "elapsed", "metrics", "revoke"]
      .every((method) => typeof owner[method] === "function");
    return result;
  } catch {
    return { ...result, error: "native_clock_probe_failed" };
  }
}

function startMeasurement() {
  if (stage !== "ready") return { accepted: false, error: "measurement_already_used" };
  if (!hermes || typeof globalThis.performance?.now !== "function") {
    stage = "unavailable";
    return { accepted: false, error: "runtime_unavailable" };
  }

  stage = "measurement_running";
  const startMonotonic = performance.now();
  const startWall = Date.now();
  let stall = null;
  setTimeout(() => {
    const actualCallbackMs = performance.now() - startMonotonic;
    const completed = stall.terminationReason === "monotonic_elapsed"
      && stall.monotonicMs >= STALL_MS;
    measurement = {
      requestedCallbackMs: CALLBACK_MS,
      actualCallbackMs,
      callbackLatenessMs: actualCallbackMs - CALLBACK_MS,
      wallElapsedMs: Date.now() - startWall,
      stall: { ...stall, completed },
    };
    stage = "complete";
  }, CALLBACK_MS);

  let iterations = 0;
  let terminationReason;
  while (true) {
    if (performance.now() - startMonotonic >= STALL_MS) {
      terminationReason = "monotonic_elapsed";
      break;
    }
    if (Date.now() - startWall >= WALL_GUARD_MS) {
      terminationReason = "wall_guard";
      break;
    }
    if (iterations >= MAX_ITERATIONS) {
      terminationReason = "iteration_limit";
      break;
    }
    iterations += 1;
  }
  stall = {
    requestedMs: STALL_MS,
    monotonicMs: performance.now() - startMonotonic,
    wallMs: Date.now() - startWall,
    iterations,
    terminationReason,
  };
  stage = "awaiting_callback";
  return { accepted: true, stage };
}

globalThis.__patternlyForegroundSchedulerProbe = { read, readNativeRegistration, startMeasurement };

function ProbeApp() {
  return React.createElement(
    View,
    { style: { padding: 32 } },
    React.createElement(Text, null, "Patternly — isolated Hermes capability probe"),
  );
}

AppRegistry.registerComponent("main", () => ProbeApp);
