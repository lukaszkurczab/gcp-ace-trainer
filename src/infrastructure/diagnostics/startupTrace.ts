import type { AccountStartupDiagnosticStage, BootstrapRecoveryPendingStep, ProfileStoragePreparationDiagnosticStage } from "../../application/operationalDiagnostics";
import type { CanonicalRepositoryBootstrapStep } from "../../storage/repositories/canonicalRepositories";
import { androidClockProbeEnabled } from "./androidClockProbeGate";
import { isPatternlyPerfBuild } from "../runtime/runtimeMode";
import type { StartupTraceSink } from "./startupTraceSink";

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
  | "practice_submit_handler" | "practice_advance_handler" | "practice_response_checkpoint"
  | "practice_answer_command" | "practice_advance_command" | "practice_command_projection"
  | "premium:response_v2" | "premium:response_missing_v2" | "premium:response_rejected" | "premium:refresh_failed"
  | "premium:actor_denied" | "premium:scope_unavailable" | "premium:allowed" | "premium:denied" | "premium:unavailable"
  | "account_foreground_refresh" | "account_foreground_refresh:success" | "account_foreground_refresh:failure"
  // SLA markers (Plan §1, T0.1); the screens place them in T0.2.
  | "first_usable_frame" | "rn_startup_end" | "home_fresh_commit"
  | "option_press" | "option_visible" | "submit_press" | "feedback_visible"
  | "continue_press" | "question_visible" | "quiz_command"
  | "summary_exit_press" | "session_finalized" | "today_visible" | "today_interactive"
  | "sync_start" | "sync_end" | "js_loop_probe"
  | `recovery:${BootstrapRecoveryPendingStep | "idle"}`
  | `repository:${CanonicalRepositoryBootstrapStep}`
  | `account:${AccountStartupDiagnosticStage}`
  | `profile_storage:${ProfileStoragePreparationDiagnosticStage}`;
export type StartupTraceEvent = Readonly<{ stage: StartupTraceStage; edge: "begin" | "end" | "event"; atMs: number; epochMs: number; span?: number }>;
const MAX_EVENTS = 512;
/** "interactive": the first `setTimeout(0)` loop probe that returns in under this many ms (Plan §1). */
export const JS_LOOP_PROBE_IDLE_MS = 50;
const MAX_LOOP_PROBES = 400;
const KEY = Symbol.for("patternly.startup-trace.v1");
const events: StartupTraceEvent[] = [];
let truncated = false;
let nextSpan = 0;

// Release perf build only: the direct flag read lets production bundles drop the sink module.
let sink: StartupTraceSink | null = null;
if (process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD === "1" && isPatternlyPerfBuild()) {
  try {
    sink = (require("./startupTraceSink") as typeof import("./startupTraceSink")).createExpoStartupTraceSink();
  } catch { sink = null; }
}

function enabled(): boolean {
  if (isPatternlyPerfBuild()) return true;
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
    if (events.length >= MAX_EVENTS && !sink) { truncated = true; return; }
    const atMs = globalThis.performance.now();
    if (!Number.isFinite(atMs) || atMs < 0) return;
    const event = Object.freeze({ stage, edge, atMs, epochMs: Date.now(), ...(span === undefined ? {} : { span }) });
    // The file sink keeps every event; the RAM snapshot stays capped for the inspector.
    sink?.push(event);
    if (events.length >= MAX_EVENTS) { truncated = true; return; }
    events.push(event);
  } catch { /* Optional diagnostics never change startup. */ }
}

/** "visible" (Plan §1): call from `useLayoutEffect`; marks after a double requestAnimationFrame. */
export function markVisible(stage: StartupTraceStage): void {
  if (!enabled()) return;
  try {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(() => markStartup(stage)));
  } catch { /* Optional diagnostics never change rendering. */ }
}

/**
 * "interactive" (Plan §1): call once the matching `*_visible` was marked. Marks
 * `stage` at the first `setTimeout(0)` probe that returns in under 50 ms.
 */
export function markInteractive(stage: StartupTraceStage, schedule: (callback: () => void) => void = (callback) => { setTimeout(callback, 0); }): void {
  if (!enabled()) return;
  let probes = 0;
  const probe = () => {
    if (probes++ >= MAX_LOOP_PROBES) return;
    const startedAt = globalThis.performance.now();
    try {
      schedule(() => {
        if (globalThis.performance.now() - startedAt < JS_LOOP_PROBE_IDLE_MS) markStartup(stage);
        else probe();
      });
    } catch { /* Optional diagnostics never change scheduling. */ }
  };
  probe();
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
