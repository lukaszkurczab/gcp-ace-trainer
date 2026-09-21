import type { IconName } from "../../../components";
import { getTrackDisplay, type TrackId } from "../../../domain";
import type { CertificationDomain } from "../../../tracks/certification/domain/certificationModes";
import type { ActivityRecord, ActivitySessionRecord, ActivityUnavailableSessionRecord } from "../../../application/activityReadModels";
import { activityTimestamp } from "../../../application/activityReadModels";
import { calendarDayDifference, isSameCalendarWeek, modeLabel, type ActivityDateLabel } from "./activityPresentation";
import { getDomainLabel } from "../../../utils";
import { getTrackRoadmapCatalog } from "../../practice/trackRoadmapCatalog";

export const ALL_ACTIVITY_TRACKS = "all" as const;
export type ActivityFilter = typeof ALL_ACTIVITY_TRACKS | TrackId;
export type ActivityGroup = "Today" | "Yesterday" | "This week" | "Earlier";

export type ActivityItem = Readonly<{
  answerCount: number;
  dateLabel: ActivityDateLabel;
  duration: string;
  group: ActivityGroup;
  icon: IconName;
  id: string;
  interaction:
    | Readonly<{ destination: "algorithms_practice_summary" | "canonical_result"; kind: "open_result" }>
    | Readonly<{ kind: "toggle_session_details" }>
    | Readonly<{ kind: "toggle_unavailable_details" }>;
  kind: "canonical" | "unavailable";
  modeId: string;
  modeTitle: string;
  sessionId: string;
  scopeLabel: string | null;
  status: "completed" | "ended-early" | "time-expired";
  statusLabel: string;
  totalCount: number;
  trackFamily: string;
  trackTitle: string;
  unavailableReasons: readonly string[];
}>;

export type ActivityModel = Readonly<{
  groups: readonly Readonly<{ items: readonly ActivityItem[]; label: ActivityGroup }>[];
  items: readonly ActivityItem[];
}>;

export function buildActivityModel(
  records: readonly ActivityRecord[],
  filter: ActivityFilter,
  now = new Date(),
): ActivityModel {
  const items = [...records]
    .sort((left, right) => activityTimestamp(right).localeCompare(activityTimestamp(left)))
    .filter((record) => filter === ALL_ACTIVITY_TRACKS || (isUnavailableRecord(record) ? record.trackId : record.session.trackId) === filter)
    .map((record) => toActivityItem(record, now));
  const groups = (['Today', 'Yesterday', 'This week', 'Earlier'] as const)
    .map((label) => ({ items: items.filter((item) => item.group === label), label }))
    .filter((group) => group.items.length > 0);
  return Object.freeze({ groups: Object.freeze(groups), items: Object.freeze(items) });
}

function toActivityItem(record: ActivityRecord, now: Date): ActivityItem {
  if (isUnavailableRecord(record)) return toUnavailableActivityItem(record, now);
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
    interaction: activityInteraction(record, track.familyId),
    kind: "canonical",
    modeId: session.modeId,
    modeTitle: modeLabel(session.modeId),
    sessionId: session.id,
    scopeLabel: activityScopeLabel(record, track.familyId),
    status: status.kind,
    statusLabel: status.label,
    totalCount,
    trackFamily: track.familyId,
    trackTitle: track.shortTitle,
    unavailableReasons: [],
  };
}

function toUnavailableActivityItem(record: ActivityUnavailableSessionRecord, now: Date): ActivityItem {
  const timestamp = activityTimestamp(record);
  const group = activityGroup(timestamp, now);
  const track = safeTrackDisplay(record.trackId);
  return {
    answerCount: record.answeredCount,
    dateLabel: activityDateLabel(timestamp, group),
    duration: "—",
    group,
    icon: activityIcon(record.modeId),
    id: record.id,
    interaction: { kind: "toggle_unavailable_details" },
    kind: "unavailable",
    modeId: record.modeId,
    modeTitle: "Unavailable session",
    sessionId: record.sessionId,
    scopeLabel: null,
    status: record.status === "completed" ? "completed" : "ended-early",
    statusLabel: "Unavailable",
    totalCount: record.totalCount,
    trackFamily: track.familyId,
    trackTitle: track.shortTitle,
    unavailableReasons: record.unavailableReasons,
  };
}

function activityInteraction(record: ActivitySessionRecord, trackFamily: string): ActivityItem["interaction"] {
  const { session, result } = record;
  if (trackFamily === "coding_interview" && session.modeId !== "coding-interview-simulation") {
    if (session.status === "abandoned" && record.attemptCount > 0) {
      return { destination: "algorithms_practice_summary", kind: "open_result" };
    }
    if (session.status === "completed" && resultMatchesSession(result, session, "coding_interview")) {
      return { destination: "algorithms_practice_summary", kind: "open_result" };
    }
  }
  if ((trackFamily === "certification" || trackFamily === "design_interview") && session.status === "completed" && resultMatchesSession(result, session, trackFamily)) {
    return { destination: "canonical_result", kind: "open_result" };
  }
  return { kind: "toggle_session_details" };
}

function resultMatchesSession(result: ActivitySessionRecord["result"], session: ActivitySessionRecord["session"], familyId: string): boolean {
  return result !== null &&
    result.sessionId === session.id &&
    result.trackId === session.trackId &&
    result.evidence.familyId === familyId;
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

function isUnavailableRecord(record: ActivityRecord): record is ActivityUnavailableSessionRecord {
  return "kind" in record && record.kind === "unavailable";
}

function safeTrackDisplay(trackId: string): Readonly<{ familyId: string; shortTitle: string }> {
  try {
    return getTrackDisplay(trackId as TrackId);
  } catch {
    return { familyId: "unavailable", shortTitle: "Unavailable track" };
  }
}

function activityGroup(timestamp: string, now: Date): ActivityGroup {
  const difference = calendarDayDifference(timestamp, now);
  if (difference <= 0) return "Today";
  if (difference === 1) return "Yesterday";
  return isSameCalendarWeek(timestamp, now) ? "This week" : "Earlier";
}

function activityDateLabel(timestamp: string, group: ActivityGroup): ActivityDateLabel {
  if (group === "Today" || group === "Yesterday") return { kind: "relative", label: group, timestamp };
  return { kind: "calendar", timestamp };
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
