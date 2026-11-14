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
  // T0.2b: S4 ends on the quiz exit destination; S4-T is the Home tab switch.
  | "practice_hub_interactive" | "home_tab_press"
  | `recovery:${BootstrapRecoveryPendingStep | "idle"}`
  // T2.0: why the content gate blocked (diagnostic code or TIMEOUT:<phase>).
  | `blocking_cause:${string}`
  | "repository:interrupted_materialization_recovered"
  | "account_sync:unchanged" | "account_sync:applied"
  // T2.6: the unchanged sync ended on the recorded baseline (no snapshots).
  | "account_sync:baseline"
  // T2.3: parallel start, deferred revalidation, repeated integrity pass, Today projection source.
  | "startup:local_first" | "startup_revalidation:start" | "startup_revalidation:end"
  | "evidence_integrity:repeated" | "evidence_integrity:skipped"
  | "home_projection:computed" | "home_projection:memory" | "home_projection:persisted"
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

/** True only where markers record (perf build, opted-in smoke trace, Android clock probe). */
export function startupTraceEnabled(): boolean {
  return enabled();
}

/** Monotonic trace clock (`atMs` base), or null when tracing is off so callers skip all work. */
export function startupTraceNow(): number | null {
  if (!enabled()) return null;
  try {
    const atMs = globalThis.performance.now();
    return Number.isFinite(atMs) && atMs >= 0 ? atMs : null;
  } catch { return null; }
}

/** RAM-only observation; failure must never affect the operation being measured. */
export function markStartup(stage: StartupTraceStage, edge: StartupTraceEvent["edge"] = "event", span?: number): void {
  markStartupAt(stage, null, edge, span);
}

/**
 * Records `stage` at an earlier monotonic time `atMs` (same base as
 * `performance.now()`), e.g. a start edge that is known only once the work
 * turns out to be measurable. `epochMs` is shifted by the same amount.
 */
export function markStartupAt(stage: StartupTraceStage, at: number | null, edge: StartupTraceEvent["edge"] = "event", span?: number): void {
  if (!enabled()) return;
  try {
    if (events.length >= MAX_EVENTS && !sink) { truncated = true; return; }
    const nowMs = globalThis.performance.now();
    const epochNow = Date.now();
    const atMs = at ?? nowMs;
    if (!Number.isFinite(atMs) || atMs < 0 || atMs > nowMs) return;
    const event = Object.freeze({ stage, edge, atMs, epochMs: Math.round(epochNow - (nowMs - atMs)), ...(span === undefined ? {} : { span }) });
    // The file sink keeps every event; the RAM snapshot stays capped for the inspector.
    sink?.push(event);
    if (events.length >= MAX_EVENTS) { truncated = true; return; }
    events.push(event);
  } catch { /* Optional diagnostics never change startup. */ }
}

/** "visible" (Plan §1): call from `useLayoutEffect`; marks after a double requestAnimationFrame. */
export function markVisible(stage: StartupTraceStage, onMarked?: () => void): void {
  if (!enabled()) return;
  try {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(() => {
      markStartup(stage);
      onMarked?.();
    }));
  } catch { /* Optional diagnostics never change rendering. */ }
}

/** `visible` (double rAF), then `interactive` at the first idle JS loop probe after it (Plan §1). */
export function markVisibleThenInteractive(visible: StartupTraceStage, interactive: StartupTraceStage): void {
  markVisible(visible, () => markInteractive(interactive));
}

/** "interactive" without its own visible marker: double rAF after the commit, then the loop probe. */
export function markInteractiveAfterFrame(interactive: StartupTraceStage): void {
  if (!enabled()) return;
  try {
    globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(() => markInteractive(interactive)));
  } catch { /* Optional diagnostics never change rendering. */ }
}

let firstUsableFrameMarked = false;
/**
 * S1a end marker (Plan §1): the first frame of a screen the user can work on
 * (Today from local state or the sign-in entry). Only the first call per JS
 * runtime records; call it from `useLayoutEffect` of that screen.
 */
export function markFirstUsableFrame(): void {
  if (firstUsableFrameMarked || !enabled()) return;
  firstUsableFrameMarked = true;
  markVisible("first_usable_frame");
}

// Wall clock at the trace clock's origin; later epochs are from this JS runtime.
let traceOriginEpochMs: number | null = null;
/** True when `epochMs` is not earlier than this JS runtime's start (e.g. a sync done in this launch). */
export function isEpochFromThisLaunch(epochMs: number): boolean {
  if (!enabled()) return false;
  try {
    traceOriginEpochMs ??= Date.now() - globalThis.performance.now();
    return Number.isFinite(epochMs) && epochMs >= traceOriginEpochMs;
  } catch { return false; }
}

const RN_STARTUP_POLL_MS = 100;
const RN_STARTUP_MAX_POLLS = 100;
let rnStartupEndRequested = false;
/**
 * JS-start (Plan §1): records `rn_startup_end` at
 * `performance.rnStartupTiming.endTime` once React Native publishes it.
 * Polls off the critical path; nothing is recorded if it never appears.
 */
export function markRnStartupEnd(): void {
  if (rnStartupEndRequested || !enabled()) return;
  rnStartupEndRequested = true;
  let polls = 0;
  const poll = () => {
    try {
      const endTime = (globalThis.performance as { rnStartupTiming?: { endTime?: unknown } }).rnStartupTiming?.endTime;
      if (typeof endTime === "number" && Number.isFinite(endTime) && endTime > 0) { markStartupAt("rn_startup_end", endTime); return; }
      if (++polls < RN_STARTUP_MAX_POLLS) setTimeout(poll, RN_STARTUP_POLL_MS);
    } catch { /* Optional diagnostics never change startup. */ }
  };
  setTimeout(poll, 0);
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
