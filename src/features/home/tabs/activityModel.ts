import type { IconName } from "../../../components";
import { getTrackDisplay, type TrackId } from "../../../domain";
import type { CertificationDomain } from "../../../tracks/certification/domain";
import type { ActivitySessionRecord } from "../../../application/activityReadModels";
import { activityTimestamp } from "../../../application/activityReadModels";
import { activityTime, modeLabel } from "./activityPresentation";
import { getDomainLabel } from "../../../utils";
import { getTrackRoadmapCatalog } from "../../practice/trackRoadmapCatalog";

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
  scopeLabel: string | null;
  status: "completed" | "ended-early" | "time-expired";
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
  const status = activityStatus(record);
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
    scopeLabel: activityScopeLabel(record, track.familyId),
    status: status.kind,
    statusLabel: status.label,
    totalCount,
    trackFamily: track.familyId,
    trackTitle: track.shortTitle,
  };
}

function activityScopeLabel(record: ActivitySessionRecord, trackFamily: string): string | null {
  const roadmapNodeIds = uniqueScopeNodeIds(record, "roadmap_node");
  if (roadmapNodeIds.length === 1) {
    return getTrackRoadmapCatalog(record.session.trackId).find((node) => node.id === roadmapNodeIds[0])?.title ?? null;
  }
  const domainIds = uniqueScopeNodeIds(record, "cloud-domain");
  if (trackFamily === "certification" && domainIds.length === 1) return getDomainLabel(domainIds[0] as CertificationDomain);
  return null;
}

function uniqueScopeNodeIds(record: ActivitySessionRecord, axisId: string): readonly string[] {
  return [...new Set(record.scopeRefs.filter((ref) => ref.axisId === axisId).map((ref) => ref.nodeId))];
}

function activityStatus(record: ActivitySessionRecord): Readonly<{ kind: ActivityItem["status"]; label: string }> {
  if (record.session.status !== "completed") return { kind: "ended-early", label: "Ended early" };
  const deadline = record.session.configurationSnapshot.timerDeadlineAt;
  if (record.session.configurationSnapshot.timer === "absoluteDeadline" && typeof deadline === "string" && Date.parse(deadline) <= Date.parse(activityTimestamp(record))) {
    return { kind: "time-expired", label: "Time expired" };
  }
  return { kind: "completed", label: "Completed" };
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
