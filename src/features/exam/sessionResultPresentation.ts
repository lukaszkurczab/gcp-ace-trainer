import type { TrackId } from "../../domain";
import type { SessionResultScore, SessionResultWeightedPoints } from "../../components/SessionResultOverview";
import { getTrackRoadmapCatalog } from "../practice/trackRoadmapCatalog";

type Translate = (value: string) => string;

export type NormalizedSessionResultDetails = Readonly<{
  points: SessionResultWeightedPoints | null;
  score: SessionResultScore | null;
}>;

/** Converts opaque family evidence into counts that are safe for result presentation. */
export function normalizeSessionResultDetails(value: unknown, answeredCount: number, pointsMaxOverride?: number): NormalizedSessionResultDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { points: null, score: null };
  const details = value as Record<string, unknown>;
  const countFields = ["correctCount", "partialCount", "incorrectCount"] as const;
  const countsAreValid = countFields.every((field) => isNonNegativeInteger(details[field]));
  const score = countsAreValid && countFields.reduce((sum, field) => sum + (details[field] as number), 0) === answeredCount
    ? Object.freeze({ correctCount: details.correctCount as number, partialCount: details.partialCount as number, incorrectCount: details.incorrectCount as number })
    : null;
  const maxPoints = pointsMaxOverride ?? details.maxPoints;
  const points = isNonNegativeNumber(details.pointsEarned) && isPositiveNumber(maxPoints) && (details.pointsEarned as number) <= (maxPoints as number)
    ? Object.freeze({ earned: details.pointsEarned as number, max: maxPoints as number })
    : null;
  return Object.freeze({ points, score });
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: unknown): value is number {
  return isNonNegativeNumber(value) && value > 0;
}

export function formatSessionTopic(
  trackId: TrackId,
  value: unknown,
  translate: Translate,
): string {
  if (typeof value !== "string" || value.length === 0) return translate("Unavailable");
  const topic = getTrackRoadmapCatalog(trackId).find((candidate) => candidate.id === value);
  return topic ? translate(topic.title) : translate("Unavailable");
}
