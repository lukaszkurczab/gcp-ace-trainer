import type { AccountStartupDiagnosticStage, BootstrapRecoveryPendingStep, ProfileStoragePreparationDiagnosticStage } from "../../application/operationalDiagnostics";
import type { CanonicalRepositoryBootstrapStep } from "../../storage/repositories/canonicalRepositories";
import { androidClockProbeEnabled } from "./androidClockProbeGate";

export type StartupTraceStage =
  | "app:active" | "app:background" | "app:inactive" | "app:unknown" | "app:extension" | "home_data_commit"
  | "home_usable_layout" | "resume_action" | "practice_usable_layout"
  | "regular_root_module" | "content_gate" | "content_ready_commit"
  | "claude_case_start" | "claude_prompt_layout"
  | "opening-storage" | "recovering-learning-state" | "verifying-content" | "resuming-session"
  | "bundled_materialization" | "installed_inventory"
  | "loading" | "ready" | "home_ready_resume_unavailable" | "content_identity_unavailable" | "blocking"
  | "catalog_build" | "artifact_validate" | "artifact_stringify" | "artifact_hash" | "artifact_index"
  | "predecessor_clone_stringify" | "predecessor_hash" | "catalog_projection" | "catalog_tracks"
  | "planning_policy" | "pool_construction"
  | "mode_artifact_questions"
  | "premium:response_v2" | "premium:response_missing_v2" | "premium:response_rejected" | "premium:refresh_failed"
  | "premium:actor_denied" | "premium:scope_unavailable" | "premium:allowed" | "premium:denied" | "premium:unavailable"
  | "account_foreground_refresh" | "account_foreground_refresh:success" | "account_foreground_refresh:failure"
  | `recovery:${BootstrapRecoveryPendingStep | "idle"}`
  | `repository:${CanonicalRepositoryBootstrapStep}`
  | `account:${AccountStartupDiagnosticStage}`
  | `profile_storage:${ProfileStoragePreparationDiagnosticStage}`;
export type StartupTraceEvent = Readonly<{ stage: StartupTraceStage; edge: "begin" | "end" | "event"; atMs: number; span?: number }>;
const MAX_EVENTS = 512;
const KEY = Symbol.for("patternly.startup-trace.v1");
const events: StartupTraceEvent[] = [];
let truncated = false;
let nextSpan = 0;

function enabled(): boolean {
  const smoke = typeof __DEV__ !== "undefined" && __DEV__
    && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE === "1";
  if (smoke) return true;
  if (process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== "sandbox" || !process.env.EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID) return false;
  try {
    return androidClockProbeEnabled(process.env.EXPO_PUBLIC_PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID,
      process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, (require("react-native") as typeof import("react-native")).Platform.OS);
  } catch { return false; }
}

/** RAM-only observation; failure must never affect the operation being measured. */
export function markStartup(stage: StartupTraceStage, edge: StartupTraceEvent["edge"] = "event", span?: number): void {
  if (!enabled()) return;
  try {
    if (events.length >= MAX_EVENTS) { truncated = true; return; }
    const atMs = globalThis.performance.now();
    if (!Number.isFinite(atMs) || atMs < 0) return;
    events.push(Object.freeze({ stage, edge, atMs, ...(span === undefined ? {} : { span }) }));
  } catch { /* Optional diagnostics never change startup. */ }
}

/** Numeric correlation for overlapping gate attempts; cancellation closes the same span. */
export function beginStartupSpan(stage: StartupTraceStage): () => void {
  if (!enabled()) return () => undefined;
  const span = ++nextSpan;
  markStartup(stage, "begin", span);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    markStartup(stage, "end", span);
  };
}

export function readStartupTrace() {
  if (!enabled()) return null;
  return Object.freeze({ schema: "patternly.startup-trace.v1", truncated, events: Object.freeze([...events]) });
}

// A read-only bridge for the local inspector; no operation or storage capability.
if (enabled()) {
  try {
    Object.defineProperty(globalThis, KEY, { configurable: true, enumerable: false, value: Object.freeze({ read: readStartupTrace }) });
  } catch { /* An unavailable inspector bridge is not an application failure. */ }
}
