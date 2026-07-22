import type { ContentItemRef, TrackId } from "../domain";
import type { AlgorithmFeedbackMode } from "../tracks/algorithms/domain/algorithmModes";

/**
 * Stable native identifiers for observing product runtime state in development
 * and end-to-end tests. Identifiers are deliberately separate from learner
 * copy and accessibility labels.
 *
 * Grammar: patternly:<surface>:<element>[:<stable-identity>...]
 */
const PREFIX = "patternly";
const SEGMENT = /^[a-z0-9][a-z0-9:_-]*$/;

declare const runtimeSelectorId: unique symbol;

export type RuntimeSelectorId = string & Readonly<{ [runtimeSelectorId]: "RuntimeSelectorId" }>;
export type ResponseResult = "correct" | "incorrect" | "partial";

type ItemId = ContentItemRef["itemId"];

export const runtimeSelectors = Object.freeze({
  content: Object.freeze({
    ready: (bootstrapRevision: number) => selector("content", "ready", nonNegativeInteger(bootstrapRevision, "content bootstrap revision")),
  }),
  home: Object.freeze({
    root: () => selector("home", "root"),
    trackCard: (trackId: TrackId) => selector("home", "track-card", trackId),
  }),
  practice: Object.freeze({
    hubRoot: () => selector("practice", "hub", "root"),
    modeCard: (modeId: string) => selector("practice", "mode-card", modeId),
    openSetup: () => selector("practice", "open-setup"),
    customEntry: () => selector("practice", "custom-entry"),
    setup: () => selector("practice", "setup"),
    setupRoot: () => selector("practice", "setup", "root"),
    customSetupTitle: () => selector("practice", "custom-setup-title"),
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
    option: (itemId: ItemId, optionId: string) => selector("session", "option", itemId, optionId),
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
    configuration: (sessionId: string, length: number, feedbackTiming: AlgorithmFeedbackMode) => selector("summary", "configuration", sessionId, String(length), feedbackTimingSegment(feedbackTiming)),
    feedbackItem: (sessionId: string, occurrenceId: string) => selector("summary", "feedback-item", sessionId, occurrenceId),
  }),
  progress: Object.freeze({
    root: () => selector("progress", "root"),
    node: (roadmapNodeId: string) => selector("progress", "node", roadmapNodeId),
  }),
  simulation: Object.freeze({
    root: (sessionId: string) => selector("simulation", "root", sessionId),
    question: (itemId: ItemId) => selector("simulation", "question", itemId),
    option: (itemId: ItemId, optionId: string) => selector("simulation", "option", itemId, optionId),
    action: (sessionId: string, actionId: string) => selector("simulation", "action", sessionId, actionId),
    navigator: (occurrenceId: string) => selector("simulation", "navigator", occurrenceId),
  }),
});

export function isRuntimeSelectorId(value: string): value is RuntimeSelectorId {
  const segments = value.split(":");
  return segments.length >= 3 && segments[0] === PREFIX && segments.every((segment) => SEGMENT.test(segment));
}

function selector(surface: string, element: string, ...identities: readonly string[]): RuntimeSelectorId {
  const segments = [PREFIX, surface, element, ...identities];
  for (const segment of segments) assertSegment(segment);
  return segments.join(":") as RuntimeSelectorId;
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
