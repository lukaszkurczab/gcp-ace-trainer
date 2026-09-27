import { spawnSync } from "node:child_process";

const CONTENT_GATE_STATES = Object.freeze([
  "patternly:content:preparing:opening-storage",
  "patternly:content:preparing:recovering-learning-state",
  "patternly:content:preparing:verifying-content",
  "patternly:content:preparing:resuming-session",
  "patternly:content:ready",
  "patternly:content:unavailable-active",
  "patternly:content:unavailable",
]);

export function observedContentPreparationState(hierarchy) {
  return CONTENT_GATE_STATES.find((state) => hierarchy.includes(`resource-id=${state};`));
}

export async function waitForContentPreparationState({
  readHierarchy = readMaestroHierarchy,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  now = Date.now,
  timeoutMs = 90_000,
  pollIntervalMs = 500,
} = {}) {
  const deadline = now() + timeoutMs;
  let lastError;
  while (now() < deadline) {
    try {
      const state = observedContentPreparationState(readHierarchy());
      if (state) return state;
    } catch (error) {
      lastError = error;
    }
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - now())));
  }
  const detail = lastError instanceof Error ? ` Last hierarchy error: ${lastError.message}` : "";
  throw new Error(`Timed out waiting for a recognized ContentPreparationGate hierarchy state after ${timeoutMs} ms.${detail}`);
}

function readMaestroHierarchy() {
  const result = spawnSync("maestro", ["hierarchy", "--compact", "--no-reinstall-driver"], {
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || "maestro hierarchy failed").trim());
  return result.stdout;
}
