import type { ContentItemRef, GoalDay, LearningPlanSlotId, TrackId } from "../domain";
import type { AlgorithmFeedbackMode } from "../tracks/coding-interview/domain/algorithmModes";
import type { TargetDateGuidanceReason, TargetDateGuidanceState } from "../application/learningPlan/targetDateGuidance";
import type { HomePlanDayStatus, HomePlanUnavailableReason } from "../application/homePlanSnapshotReader";
export type { TargetDateGuidanceReason, TargetDateGuidanceState } from "../application/learningPlan/targetDateGuidance";

/**
 * Stable native identifiers for observing product runtime state in development
 * and end-to-end tests. Identifiers are deliberately separate from learner
 * copy and accessibility labels.
 *
 * Grammar: patternly:<surface>:<element>[:<stable-identity>...]
 */
const PREFIX = "patternly";
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/;

declare const runtimeSelectorId: unique symbol;

export type RuntimeSelectorId = string & Readonly<{ [runtimeSelectorId]: "RuntimeSelectorId" }>;
export type ResponseResult = "correct" | "incorrect" | "partial";
export type LearningPlanPrimaryState =
  | "loading"
  | "stale"
  | "no_goal"
  | "goal_paused"
  | "package_error"
  | "package_unavailable"
  | "generator_error"
  | "shortfall"
  | "shortened"
  | "ready"
  | "accepted";
export type LearningPlanActionErrorKind = "accept-validation" | "accept-storage" | "open-proposal-storage" | "open-existing-storage";
export type LearningPlanEditorErrorKind = "validation" | "storage" | "start-existing-storage";
export type LearningPlanEditorRetryKind = "save" | "start-existing";

type ItemId = ContentItemRef["itemId"];

export const runtimeSelectors = Object.freeze({
  content: Object.freeze({
    preparing: (phase: string) => selector("content", "preparing", phase),
    unavailable: () => selector("content", "unavailable"),
    ready: () => selector("content", "ready"),
    readyAfterAuditReset: () => selector("content", "ready-after-audit-reset"),
    auditCommandListener: () => selector("content", "audit-command-listener", "ready"),
  }),
  home: Object.freeze({
    root: () => selector("home", "root"),
    trackCard: (trackId: TrackId) => selector("home", "track-card", trackId),
    changeTrack: () => selector("home", "change-track"),
    primaryAction: () => selector("home", "primary-action"),
    activity: () => selector("home", "activity"),
    selectTrack: (trackId: TrackId) => selector("home", "select-track", trackId),
    selectTrackContinue: () => selector("home", "select-track", "continue"),
  }),
  homePlan: Object.freeze({
    reason: (reason: HomePlanUnavailableReason) => selector("home-plan", "reason", homePlanUnavailableReasonSegment(reason)),
  }),
  practice: Object.freeze({
    hubRoot: () => selector("practice", "hub", "root"),
    modeCard: (modeId: string) => selector("practice", "mode-card", modeId),
    declaredScope: (topicId: string) => selector("practice", "declared-scope", topicId),
    openSetup: () => selector("practice", "open-setup"),
    customEntry: () => selector("practice", "custom-entry"),
    setup: () => selector("practice", "setup"),
    setupRoot: () => selector("practice", "setup", "root"),
    customSetupTitle: () => selector("practice", "custom-setup-title"),
    focusTopic: (topicId: string) => selector("practice", "focus-topic", topicId),
    scenarioCompetency: (competencyId: string) => selector("practice", "scenario-competency", competencyId),
    sessionLength: (length: number) => selector("practice", "session-length", positiveInteger(length, "session length")),
    feedbackTiming: (timing: AlgorithmFeedbackMode) => selector("practice", "feedback-timing", feedbackTimingSegment(timing)),
    startSession: () => selector("practice", "start-session"),
  }),
  session: Object.freeze({
    root: (sessionId: string) => selector("session", "root", sessionId),
    track: (trackId: TrackId) => selector("session", "track", trackId),
    mode: (modeId: string) => selector("session", "mode", modeId),
    roadmapNode: (roadmapNodeId: string) => selector("session", "roadmap-node", roadmapNodeId),
    question: (itemId: ItemId) => selector("session", "question", itemId),
    option: (itemId: ItemId, optionId: string) => selector("session", "option", itemId, optionId.toLowerCase()),
    complexityValue: (itemId: ItemId, dimensionId: string, value: string) => selector(
      "session",
      "complexity-value",
      itemId,
      dimensionId,
      encodedTextSegment(value, "complexity value"),
    ),
    submit: (itemId: ItemId) => selector("session", "submit", itemId),
    continue: (itemId: ItemId) => selector("session", "continue", itemId),
    feedback: (itemId: ItemId) => selector("session", "feedback", itemId),
    reason: (itemId: ItemId) => selector("session", "reason", itemId),
    detailsToggle: (itemId: ItemId) => selector("session", "details-toggle", itemId),
    details: (itemId: ItemId) => selector("session", "details", itemId),
    counter: (sessionId: string, ordinal: number, length: number) => {
      const position = sessionPosition(ordinal, length);
      return selector("session", "counter", sessionId, "ordinal", position.ordinal, "length", position.length);
    },
    configuration: (sessionId: string, length: number, feedbackTiming: AlgorithmFeedbackMode) => selector(
      "session",
      "configuration",
      sessionId,
      "length",
      positiveInteger(length, "session length"),
      "feedback-timing",
      feedbackTimingSegment(feedbackTiming),
    ),
    timer: (sessionId: string) => selector("session", "timer", sessionId),
    leave: (sessionId: string) => selector("session", "leave", sessionId),
    leaveAndResume: (sessionId: string) => selector("session", "leave-and-resume", sessionId),
    keepLearning: (sessionId: string) => selector("session", "keep-learning", sessionId),
    abandon: (sessionId: string) => selector("session", "abandon", sessionId),
    result: (itemId: ItemId, result: ResponseResult) => selector("session", "result", itemId, result),
  }),
  resume: Object.freeze({
    card: (sessionId: string) => selector("resume", "card", sessionId),
    continue: (sessionId: string) => selector("resume", "continue", sessionId),
    status: (sessionId: string) => selector("resume", "status", sessionId),
    title: (sessionId: string) => selector("resume", "title", sessionId),
  }),
  summary: Object.freeze({
    root: (sessionId: string) => selector("summary", "root", sessionId),
    backToPractice: (sessionId: string) => selector("summary", "back-to-practice", sessionId),
    reviewAnswers: (sessionId: string) => selector("summary", "review-answers", sessionId),
    configuration: (sessionId: string, length: number, feedbackTiming: AlgorithmFeedbackMode) => selector("summary", "configuration", sessionId, String(length), feedbackTimingSegment(feedbackTiming)),
    feedbackItem: (sessionId: string, occurrenceId: string) => selector("summary", "feedback-item", sessionId, occurrenceId),
  }),
  practiceReview: Object.freeze({
    root: (sessionId: string, occurrenceId: string) => selector("practice-review", "root", sessionId, occurrenceId),
    previous: () => selector("practice-review", "previous"),
    next: () => selector("practice-review", "next"),
    result: () => selector("practice-review", "result"),
  }),
  progress: Object.freeze({
    root: () => selector("progress", "root"),
    goal: () => selector("progress", "goal"),
    activitySection: () => selector("progress", "activity-section"),
    node: (roadmapNodeId: string) => selector("progress", "node", roadmapNodeId),
    activity: () => selector("progress", "activity"),
  }),
  progressPlan: Object.freeze({
    root: () => selector("progress-plan", "root"),
    completion: (state: ProgressPlanCompletionState) => selector("progress-plan", "completion", progressPlanCompletionStateSegment(state)),
    day: (status: HomePlanDayStatus) => selector("progress-plan", "day", progressPlanDayStatusSegment(status)),
    session: () => selector("progress-plan", "session"),
    activeSession: () => selector("progress-plan", "active-session"),
    unavailable: (reason: HomePlanUnavailableReason) => selector("progress-plan", "unavailable", homePlanUnavailableReasonSegment(reason)),
  }),
  targetDateGuidance: Object.freeze({
    root: (surface: TargetDateGuidanceSurface) => selector("target-date-guidance", "root", guidanceSurfaceSegment(surface)),
    state: (surface: TargetDateGuidanceSurface, state: TargetDateGuidanceState) => selector("target-date-guidance", "state", guidanceSurfaceSegment(surface), guidanceStateSegment(state)),
    reason: (surface: TargetDateGuidanceSurface, reason: TargetDateGuidanceReason) => selector("target-date-guidance", "reason", guidanceSurfaceSegment(surface), guidanceReasonSegment(reason)),
    fact: (kind: TargetDateGuidanceFactKind) => selector("target-date-guidance", "fact", guidanceFactSegment(kind)),
    primary: (surface: TargetDateGuidanceSurface) => selector("target-date-guidance", "primary", guidanceSurfaceSegment(surface)),
    secondary: () => selector("target-date-guidance", "secondary"),
  }),
  goal: Object.freeze({
    root: () => selector("goal", "root"),
    save: () => selector("goal", "save"),
    goalType: (goalType: string) => selector("goal", "type", goalType),
    day: (day: string) => selector("goal", "day", day),
  }),
  learningPlan: Object.freeze({
    root: () => selector("learning-plan", "root"),
    create: () => selector("learning-plan", "create"),
    state: (state: LearningPlanPrimaryState) => selector("learning-plan", "state", learningPlanStateSegment(state)),
    slot: (slotId: LearningPlanSlotId) => selector("learning-plan", "slot", slotId),
    update: () => selector("learning-plan", "update"),
    adjustGoal: () => selector("learning-plan", "adjust-goal"),
    backToPractice: () => selector("learning-plan", "back-to-practice"),
    persisted: () => selector("learning-plan", "persisted"),
    editSchedule: () => selector("learning-plan", "edit-schedule"),
    accept: () => selector("learning-plan", "accept"),
    editorRoot: (editorId: string) => selector("learning-plan", "editor", "root", editorId),
    editorState: (state: LearningPlanEditorSelectorState) => selector("learning-plan", "editor", "state", state),
    editorDay: (day: GoalDay) => selector("learning-plan", "editor", "day", day),
    editorTime: (day: GoalDay) => selector("learning-plan", "editor", "time", day),
    editorCommit: () => selector("learning-plan", "editor", "commit"),
    editorRetry: (kind: LearningPlanEditorRetryKind = "save") => selector("learning-plan", "editor", kind === "save" ? "retry-save" : "retry-start-existing"),
    editorStale: () => selector("learning-plan", "editor", "stale"),
    editorError: (kind: LearningPlanEditorErrorKind) => selector("learning-plan", "editor", "error", kind),
    actionError: (kind: LearningPlanActionErrorKind) => selector("learning-plan", "action-error", kind),
  }),
  goalOnboarding: Object.freeze({
    root: () => selector("home", "guest-goal-onboarding", "root"),
    setGoal: () => selector("home", "guest-goal-onboarding", "set-goal"),
    notNow: () => selector("home", "guest-goal-onboarding", "not-now"),
    error: () => selector("home", "guest-goal-onboarding", "error"),
  }),
  activity: Object.freeze({
    root: () => selector("activity", "root"),
    filter: () => selector("activity", "filter"),
    filterClear: () => selector("activity", "filter-clear"),
    row: (sessionId: string) => selector("activity", "row", sessionId),
  }),
  simulation: Object.freeze({
    root: (sessionId: string) => selector("simulation", "root", sessionId),
    question: (itemId: ItemId) => selector("simulation", "question", itemId),
    option: (itemId: ItemId, optionId: string) => selector("simulation", "option", itemId, optionId.toLowerCase()),
    action: (sessionId: string, actionId: string) => selector("simulation", "action", sessionId, actionId),
    navigator: (occurrenceId: string) => selector("simulation", "navigator", occurrenceId),
  }),
  examReview: Object.freeze({
    root: (sessionId: string) => selector("exam-review", "root", sessionId),
    backToPractice: (sessionId: string) => selector("exam-review", "back-to-practice", sessionId),
  }),
});

export type LearningPlanEditorSelectorState = "loading" | "ready" | "stale" | "validation-error" | "storage-error" | "saved";
export type TargetDateGuidanceSurface = "home" | "progress";
export type TargetDateGuidanceFactKind = "required-pace" | "actual-pace" | "forecast" | "target";
export type ProgressPlanCompletionState = "unknown" | "in_progress" | "completed";

const LEARNING_PLAN_PRIMARY_STATES: ReadonlySet<LearningPlanPrimaryState> = new Set([
  "loading", "stale", "no_goal", "goal_paused", "package_error", "package_unavailable", "generator_error",
  "shortfall", "shortened", "ready", "accepted",
]);

export function isRuntimeSelectorId(value: string): value is RuntimeSelectorId {
  const segments = value.split(":");
  return segments.length >= 3 && segments[0] === PREFIX && segments.every((segment) => SEGMENT.test(segment));
}

function selector(surface: string, element: string, ...identities: readonly string[]): RuntimeSelectorId {
  const segments = [PREFIX, surface, element, ...identities];
  for (const segment of segments) assertSegment(segment);
  return segments.join(":") as RuntimeSelectorId;
}

function learningPlanStateSegment(state: LearningPlanPrimaryState): string {
  if (!LEARNING_PLAN_PRIMARY_STATES.has(state)) throw new Error("Unknown learning plan primary state.");
  return state;
}

function assertSegment(value: string): void {
  if (!SEGMENT.test(value)) {
    throw new Error(`Runtime selector identities must match ${SEGMENT.source}.`);
  }
}

function positiveInteger(value: number, label: string): string {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Runtime selector ${label} must be a positive integer.`);
  }
  return String(value);
}

function nonNegativeInteger(value: number, label: string): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Runtime selector ${label} must be a non-negative integer.`);
  }
  return String(value);
}

function sessionPosition(ordinal: number, length: number): Readonly<{ ordinal: string; length: string }> {
  const normalizedLength = positiveInteger(length, "session length");
  const normalizedOrdinal = positiveInteger(ordinal, "session ordinal");
  if (ordinal > length) throw new Error("Runtime selector session ordinal cannot exceed session length.");
  return Object.freeze({ length: normalizedLength, ordinal: normalizedOrdinal });
}

function feedbackTimingSegment(timing: AlgorithmFeedbackMode): string {
  return timing === "afterEachAnswer" ? "after-each-answer" : "at-session-end";
}

const TARGET_DATE_GUIDANCE_STATES: ReadonlySet<TargetDateGuidanceState> = new Set([
  "no_goal", "goal_paused", "no_plan", "update_required", "plan_paused", "completed", "overdue", "unreachable", "at_risk", "on_track", "open_ended", "unavailable",
]);

const TARGET_DATE_GUIDANCE_REASONS: ReadonlySet<TargetDateGuidanceReason> = new Set([
  "no_goal", "goal_paused", "no_plan", "target_changed", "package_changed", "cadence_changed", "plan_paused", "completed", "overdue", "insufficient_sessions", "no_future_slots", "at_risk", "on_track", "no_target", "unknown_completion_rule", "insufficient_elapsed_evidence", "calculation_error",
]);

const HOME_PLAN_UNAVAILABLE_REASONS: ReadonlySet<HomePlanUnavailableReason> = new Set([
  "invalid_request", "concurrent_change", "storage_error", "corrupt_record", "identity_mismatch",
  "package_error", "package_unavailable", "calculation_error", "unsupported_action",
]);

function homePlanUnavailableReasonSegment(value: HomePlanUnavailableReason): string {
  if (!HOME_PLAN_UNAVAILABLE_REASONS.has(value)) throw new Error("Unknown Home plan unavailable reason.");
  return value.replaceAll("_", "-");
}

function guidanceSurfaceSegment(value: TargetDateGuidanceSurface): string {
  if (value !== "home" && value !== "progress") throw new Error("Unknown target date guidance surface.");
  return value;
}

function guidanceStateSegment(value: TargetDateGuidanceState): string {
  if (!TARGET_DATE_GUIDANCE_STATES.has(value)) throw new Error("Unknown target date guidance state.");
  return value.replaceAll("_", "-");
}

function guidanceReasonSegment(value: TargetDateGuidanceReason): string {
  if (!TARGET_DATE_GUIDANCE_REASONS.has(value)) throw new Error("Unknown target date guidance reason.");
  return value.replaceAll("_", "-");
}

function guidanceFactSegment(value: TargetDateGuidanceFactKind): string {
  if (value !== "required-pace" && value !== "actual-pace" && value !== "forecast" && value !== "target") throw new Error("Unknown target date guidance fact.");
  return value;
}

function progressPlanCompletionStateSegment(value: ProgressPlanCompletionState): string {
  if (value !== "unknown" && value !== "in_progress" && value !== "completed") throw new Error("Unknown Progress plan completion state.");
  return value.replaceAll("_", "-");
}

function progressPlanDayStatusSegment(value: HomePlanDayStatus): string {
  if (value !== "scheduled" && value !== "completed" && value !== "skipped" && value !== "rest") throw new Error("Unknown Progress plan day status.");
  return value;
}

function encodedTextSegment(value: string, label: string): string {
  if (!value.length) throw new Error(`Runtime selector ${label} cannot be empty.`);
  return `v-${Array.from(value, (character) => character.codePointAt(0)!.toString(16)).join("_")}`;
}
