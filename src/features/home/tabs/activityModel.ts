import type { IconName } from "../../../components";
import { getTrackDisplay, type TrackId } from "../../../domain";
import type { ActivitySessionRecord } from "../../../application/activityReadModels";
import { activityTimestamp } from "../../../application/activityReadModels";
import { activityTime, modeLabel } from "./activityPresentation";

export const ALL_ACTIVITY_TRACKS = "all" as const;
export type ActivityFilter = typeof ALL_ACTIVITY_TRACKS | TrackId;
export type ActivityGroup = "Today" | "Yesterday" | "This week" | "Earlier";

export type ActivityItem = Readonly<{
  answerCount: number;
  dateLabel: string;
  duration: string;
  group: ActivityGroup;
  icon: IconName;
  id: string;
  modeId: string;
  modeTitle: string;
  sessionId: string;
  status: "completed" | "ended-early";
  statusLabel: string;
  totalCount: number;
  trackFamily: string;
  trackTitle: string;
}>;

export type ActivityModel = Readonly<{
  groups: readonly Readonly<{ items: readonly ActivityItem[]; label: ActivityGroup }>[];
  items: readonly ActivityItem[];
}>;

export function buildActivityModel(
  records: readonly ActivitySessionRecord[],
  filter: ActivityFilter,
  now = new Date(),
): ActivityModel {
  const items = records
    .filter((record) => filter === ALL_ACTIVITY_TRACKS || record.session.trackId === filter)
    .map((record) => toActivityItem(record, now));
  const groups = (['Today', 'Yesterday', 'This week', 'Earlier'] as const)
    .map((label) => ({ items: items.filter((item) => item.group === label), label }))
    .filter((group) => group.items.length > 0);
  return Object.freeze({ groups: Object.freeze(groups), items: Object.freeze(items) });
}

function toActivityItem(record: ActivitySessionRecord, now: Date): ActivityItem {
  const session = record.session;
  const timestamp = activityTimestamp(record);
  const totalCount = record.result?.totalOccurrences ?? session.actualLength;
  const answerCount = record.result?.answeredOccurrenceIds.length ?? record.attemptCount;
  const group = activityGroup(timestamp, now);
  const track = getTrackDisplay(session.trackId);
  return {
    answerCount,
    dateLabel: activityDateLabel(timestamp, group),
    duration: formatElapsed(session.activeForegroundMs),
    group,
    icon: activityIcon(session.modeId),
    id: session.id,
    modeId: session.modeId,
    modeTitle: modeLabel(session.modeId),
    sessionId: session.id,
    status: session.status === "completed" ? "completed" : "ended-early",
    statusLabel: session.status === "completed" ? "Completed" : "Ended early",
    totalCount,
    trackFamily: track.familyId,
    trackTitle: track.shortTitle,
  };
}

function activityGroup(timestamp: string, now: Date): ActivityGroup {
  const difference = calendarDayDifference(timestamp, now);
  if (difference <= 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference <= 7) return "This week";
  return "Earlier";
}

function activityDateLabel(timestamp: string, group: ActivityGroup): string {
  if (group === "Today" || group === "Yesterday") return `${group}, ${activityTime(timestamp)}`;
  const date = new Date(timestamp);
  return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${activityTime(timestamp)}`;
}

function calendarDayDifference(timestamp: string, now: Date): number {
  const date = new Date(timestamp);
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - day) / 86_400_000));
}

function activityIcon(modeId: string): IconName {
  if (modeId.includes("simulation")) return "clock-check";
  if (modeId.includes("review") || modeId.includes("quick")) return "rotate-ccw";
  if (modeId.includes("learn") || modeId.includes("framework") || modeId.includes("approach")) return "book-open";
  if (modeId.startsWith("certification-")) return "cloud";
  if (modeId.startsWith("coding-interview-")) return "code-brackets";
  return "practice";
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
