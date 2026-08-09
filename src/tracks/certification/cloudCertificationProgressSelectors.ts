import { GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, type EvidenceRef, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { isCertificationPracticeModeId } from "./domain";
export type CloudCertificationProgressIssue = { key: string; message: string; operation: "read" | "write" | "remove" | "parse" };

export type CloudCertificationTaxonomyPerformance = { axisId: string; correctCount: number; incorrectCount: number; label: string; nodeId: string; partialCount: number; percent: number; taxonomyRef: EvidenceRef; totalAttempts: number };
export type CloudCertificationProgressViewModel = { correctCount: number; degraded: boolean; dueReviewCount: number; examAttemptCount: number; firstAttemptAccuracy: { correct: number; percent: number; total: number }; highPriorityReviewCount: number; incorrectCount: number; issues: CloudCertificationProgressIssue[]; ok: boolean; partialCount: number; practiceAttemptCount: number; recentAccuracy: { correct: number; percent: number; total: number; windowAttemptCount: number }; repeatedMistakeTypes: { count: number; taxonomyRef: EvidenceRef }[]; scheduledReviewCount: number; taxonomyPerformance: CloudCertificationTaxonomyPerformance[]; totalAttempts: number; weakTaxonomyNodes: CloudCertificationTaxonomyPerformance[] };
export type CloudCertificationProgressViewModelInput = { attempts: readonly TrainingAttempt<unknown>[]; issues?: readonly CloudCertificationProgressIssue[]; now?: string; recentAttemptCount?: number; reviewQueueItems?: readonly ReviewQueueEntry[] };

export function buildCloudCertificationProgressViewModel(input: CloudCertificationProgressViewModelInput): CloudCertificationProgressViewModel {
  const attempts = input.attempts.filter((attempt) => attempt.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  const reviews = (input.reviewQueueItems ?? []).filter((entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  const now = input.now ?? new Date().toISOString();
  const recentCount = input.recentAttemptCount ?? 10;
  const taxonomyPerformance = buildTaxonomyPerformance(attempts);
  const firstByItem = new Map<string, TrainingAttempt<unknown>>();
  [...attempts].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt)).forEach((attempt) => { if (!firstByItem.has(attempt.item.itemId)) firstByItem.set(attempt.item.itemId, attempt); });
  const recent = [...attempts].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt)).slice(0, recentCount);
  const firstAccuracy = accuracy([...firstByItem.values()]);
  const recentAccuracy = accuracy(recent);
  return { correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, degraded: (input.issues ?? []).length > 0, dueReviewCount: reviews.filter((entry) => entry.dueAt <= now).length, examAttemptCount: attempts.filter((attempt) => attempt.modeId === "certification-exam-simulation").length, firstAttemptAccuracy: firstAccuracy, highPriorityReviewCount: reviews.filter((entry) => entry.reasons.includes("repeated_mistake")).length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, issues: [...(input.issues ?? [])], ok: (input.issues ?? []).length === 0, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, practiceAttemptCount: attempts.filter((attempt) => isCertificationPracticeModeId(attempt.modeId)).length, recentAccuracy: { ...recentAccuracy, windowAttemptCount: recentCount }, repeatedMistakeTypes: buildMistakeCounts(attempts), scheduledReviewCount: reviews.length, taxonomyPerformance, totalAttempts: attempts.length, weakTaxonomyNodes: taxonomyPerformance.filter((node) => node.percent < 100).slice(0, 8) };
}

function accuracy(attempts: readonly TrainingAttempt<unknown>[]) { const correct = attempts.filter((attempt) => attempt.result.kind === "correct").length; return { correct, percent: attempts.length ? Math.round(correct / attempts.length * 100) : 0, total: attempts.length }; }
function key(ref: EvidenceRef) { return `${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`; }
function buildTaxonomyPerformance(attempts: readonly TrainingAttempt<unknown>[]): CloudCertificationTaxonomyPerformance[] {
  const counts = new Map<string, { ref: EvidenceRef; correct: number; partial: number; incorrect: number; total: number }>();
  for (const attempt of attempts) for (const ref of attempt.reviewEvidence.taxonomyOrSkillRefs) { const current = counts.get(key(ref)) ?? { ref, correct: 0, partial: 0, incorrect: 0, total: 0 }; current[attempt.result.kind] += 1; current.total += 1; counts.set(key(ref), current); }
  return [...counts.values()].map(({ ref, correct, partial, incorrect, total }) => ({ axisId: ref.axisId, correctCount: correct, incorrectCount: incorrect, label: ref.nodeId, nodeId: ref.nodeId, partialCount: partial, percent: total ? Math.round(correct / total * 100) : 0, taxonomyRef: ref, totalAttempts: total })).sort((a, b) => a.percent - b.percent || b.totalAttempts - a.totalAttempts);
}
function buildMistakeCounts(attempts: readonly TrainingAttempt<unknown>[]) { const counts = new Map<string, { count: number; taxonomyRef: EvidenceRef }>(); for (const attempt of attempts.filter((item) => item.result.kind !== "correct")) for (const ref of attempt.reviewEvidence.taxonomyOrSkillRefs.filter((item) => item.axisId === "mistake_type")) counts.set(key(ref), { count: (counts.get(key(ref))?.count ?? 0) + 1, taxonomyRef: ref }); return [...counts.values()].sort((a, b) => b.count - a.count); }
