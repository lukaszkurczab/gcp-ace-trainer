import { setTimeout as delay } from "node:timers/promises";

export async function waitForChildReadiness(child, readinessProbe, { timeoutMs = 60_000, intervalMs = 200, delayFn = delay } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.spawnError || child.exitCode !== null || child.signalCode !== null) {
      throw new Error("The owned AUD-02D child exited before backend readiness.");
    }
    const result = await Promise.race([
      Promise.resolve().then(readinessProbe).then((value) => ({ kind: "readiness", value }), () => ({ kind: "retry" })),
      child.completion.then((outcome) => ({ kind: "exit", outcome })),
    ]);
    if (result.kind === "exit") throw childFailure(result.outcome, "The owned AUD-02D child exited before backend readiness.");
    if (result.kind === "readiness" && result.value) return result.value;
    await delayFn(intervalMs);
  }
  throw new Error(`The owned AUD-02D child did not report backend readiness within ${timeoutMs}ms.`);
}

export function childFailure(outcome, failureMessage) {
  if (outcome.error) return new Error(`${failureMessage} ${outcome.error.message}`);
  if (outcome.code !== 0) return new Error(`${failureMessage} Exit status: ${outcome.code ?? outcome.signal ?? "unknown"}.`);
  return undefined;
}

export function addCleanupContext(original, context) {
  const error = original instanceof Error ? original : new Error(String(original));
  error.message = `${error.message} Cleanup context: ${context}`;
  return error;
}

export async function verifyProcessOwnership(listenerPid, ownerPid, inspectProcess) {
  const visited = new Set();
  let currentPid = listenerPid;
  let listenerInfo;
  while (true) {
    if (!Number.isInteger(currentPid) || currentPid <= 0) throw new Error("Process ancestry contains a missing or invalid PID.");
    if (visited.has(currentPid)) throw new Error("Process ancestry contains a cycle.");
    visited.add(currentPid);
    const info = await inspectProcess(currentPid);
    if (!info || !Number.isInteger(info.parentPid) || !Number.isInteger(info.groupId)) throw new Error(`Could not inspect process ancestry for PID ${currentPid}.`);
    listenerInfo ??= info;
    if (currentPid === ownerPid) return listenerInfo;
    if (info.parentPid === 1 || info.parentPid === 0) throw new Error(`Listener PID ${listenerPid} is not a descendant of owned runner PID ${ownerPid}.`);
    currentPid = info.parentPid;
  }
}

export async function awaitChildWithCleanup(child, {
  completionTimeoutMs = 15_000,
  cleanupTimeoutMs = 10_000,
  prepareOwnedBackendStop,
  stopChild,
  stopOwnedBackend,
  confirmPortFree,
} = {}) {
  const settled = await raceTimeout(child.completion.then((outcome) => ({ kind: "completed", outcome })), completionTimeoutMs);
  if (settled.kind === "completed") return { outcome: settled.outcome, timedOut: false, cleanupErrors: [] };

  const cleanupErrors = [];
  let backendStopTarget;
  let backendOwnershipVerified = !prepareOwnedBackendStop;
  if (prepareOwnedBackendStop) {
    const prepared = await raceTimeout(Promise.resolve().then(prepareOwnedBackendStop).then((value) => ({ kind: "completed", value }), (error) => ({ kind: "error", error })), cleanupTimeoutMs);
    if (prepared.kind === "completed") {
      backendStopTarget = prepared.value;
      backendOwnershipVerified = true;
    } else if (prepared.kind === "timeout") cleanupErrors.push(`verify backend ownership timed out after ${cleanupTimeoutMs}ms`);
    else cleanupErrors.push(`verify backend ownership failed: ${prepared.error instanceof Error ? prepared.error.message : String(prepared.error)}`);
  }
  const operations = [["stop child", stopChild]];
  if (backendOwnershipVerified && backendStopTarget !== null) operations.push(["stop owned backend", () => stopOwnedBackend?.(backendStopTarget)]);
  operations.push(["confirm backend port release", confirmPortFree]);
  for (const [label, operation] of operations) {
    if (!operation) continue;
    const result = await raceTimeout(Promise.resolve().then(operation).then(() => ({ kind: "completed" }), (error) => ({ kind: "error", error })), cleanupTimeoutMs);
    if (result.kind === "timeout") cleanupErrors.push(`${label} timed out after ${cleanupTimeoutMs}ms`);
    else if (result.kind === "error") cleanupErrors.push(`${label} failed: ${result.error instanceof Error ? result.error.message : String(result.error)}`);
  }
  return { timedOut: true, cleanupErrors };
}

function raceTimeout(promise, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ kind: "timeout" }), timeoutMs);
    Promise.resolve(promise).then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, (error) => {
      clearTimeout(timer);
      resolve({ kind: "error", error });
    });
  });
}
