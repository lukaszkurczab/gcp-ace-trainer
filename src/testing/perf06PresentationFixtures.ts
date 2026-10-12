import type { ActivityItem, ActivityModel } from "../features/home/tabs/activityModel";
import type { ReviewQueueRow, ReviewQueueScreenModel } from "../features/review/reviewQueueModel";

export type ListFixtureConfiguration = Readonly<{ screen: "activity" | "review-due" | "review-upcoming"; size: 50 | 100 | 500 | 1000 }>;
export function isListFixtureConfiguration(value: unknown): value is ListFixtureConfiguration {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Object.keys(candidate).length === 2 && typeof candidate.screen === "string" && typeof candidate.size === "number"
    && ["activity", "review-due", "review-upcoming"].includes(candidate.screen)
    && (candidate.screen === "activity" ? [50, 500, 1000] : [100, 500, 1000]).includes(candidate.size);
}

export function createActivityPresentationFixture(size: number): ActivityModel {
  const labels = ["Today", "Yesterday", "This week", "Earlier"] as const;
  const items: ActivityItem[] = Array.from({ length: size }, (_, index) => ({
    id: `perf06-session-${index}`, sessionId: `perf06-session-${index}`,
    answerCount: index % 10 === 0 ? 6 : 20, totalCount: 20,
    dateLabel: { kind: "calendar", timestamp: new Date(Date.UTC(2026, 9, 13) - index * 3600000).toISOString() },
    duration: "12:34", group: labels[Math.min(3, Math.floor(index / Math.ceil(size / 4)))]!,
    icon: "book-open", interaction: { kind: index % 10 === 0 ? "toggle_unavailable_details" : "toggle_session_details" },
    kind: index % 10 === 0 ? "unavailable" : "canonical", modeId: "certification-focus-practice", modeTitle: "Focus Practice",
    scopeLabel: "Planning and configuration", status: index % 10 === 0 ? "ended-early" : "completed", statusLabel: index % 10 === 0 ? "Ended early" : "Completed",
    trackFamily: "certification", trackTitle: "Google Cloud ACE", unavailableReasons: index % 10 === 0 ? ["Content version unavailable"] : [],
  }));
  return { items, groups: labels.map((label) => ({ label, items: items.filter((item) => item.group === label) })).filter((group) => group.items.length > 0) };
}

export function createReviewPresentationFixture(size: number, upcoming: boolean): ReviewQueueScreenModel {
  const rows: ReviewQueueRow[] = Array.from({ length: size }, (_, index) => ({
    dueAt: new Date(Date.UTC(2026, 9, 13) + index * 60000).toISOString(), id: `perf06-review-${index}`, questionId: `perf06-question-${index}`,
    kind: index % 5 === 0 ? "unavailable" : "available", mistakeTypeLabels: ["Incorrect answer"],
    promptPreview: `Synthetic review item ${index + 1}: choose the appropriate service for a regional application.`, reasonLabels: ["Incorrect answer"],
    sourceAttemptId: `perf06-attempt-${index}`, status: index % 5 === 0 ? "unavailable" : upcoming ? "upcoming" : index % 3 === 0 ? "requested" : index % 3 === 1 ? "due" : "overdue",
    taxonomyLabel: { kind: "authored", value: "Planning and configuration" }, title: `Review item ${index + 1}: application deployment and regional availability`,
    ...(index % 5 === 0 ? { unavailableReason: "Content version unavailable" } : {}),
  }));
  const available = rows.filter((row) => row.kind === "available");
  return { degraded: false, dueRows: upcoming ? [] : available, upcomingRows: upcoming ? available : [], unavailableRows: rows.filter((row) => row.kind === "unavailable"),
    totalCount: size, trackTitle: "Google Cloud ACE", emptyTitle: "No review items yet", emptyDescription: "Synthetic presentation environment" };
}
