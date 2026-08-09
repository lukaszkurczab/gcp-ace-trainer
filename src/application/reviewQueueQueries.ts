import {
  CODING_INTERVIEW_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  getTrackDisplay,
  type EvidenceRef,
  type ReviewQueueEntry,
  type TrackId,
} from "../domain";
import { getReviewQueueItems } from "../storage/repositories";
import type { StorageIssue } from "../storage/repositories/result";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import type { AlgorithmQuestion } from "../tracks/coding-interview/algorithmQuestionTypes";
import type { CertificationQuestion } from "../tracks/certification";

export type ReviewQueueViewItem = { dueAt: string; id: string; isDue: boolean; isOverdue: boolean; itemId: string; mistakeTypeRefs: EvidenceRef[]; prompt: string; reasons: ReviewQueueEntry["reasons"] extends readonly (infer Reason)[] ? Reason[] : never[]; sourceAttemptId: string; taxonomyRefs: EvidenceRef[] };
export type ReviewQueueViewModel = { degraded: boolean; dueItems: ReviewQueueViewItem[]; issues: StorageIssue[]; ok: boolean; overdueItems: ReviewQueueViewItem[]; totalItems: number; trackTitle: string; upcomingItems: ReviewQueueViewItem[] };

export async function loadTrackReviewQueueViewModel(input: { now?: string; trackId: TrackId }): Promise<ReviewQueueViewModel> {
  const result = await getReviewQueueItems();
  return buildTrackReviewQueueViewModel({ issues: result.issues ?? [], now: input.now, reviewQueueItems: result.value, trackId: input.trackId });
}

export async function buildTrackReviewQueueViewModel(input: { issues?: readonly StorageIssue[]; now?: string; reviewQueueItems: readonly ReviewQueueEntry[]; trackId: TrackId }): Promise<ReviewQueueViewModel> {
  const now = input.now ?? new Date().toISOString();
  const items = (await Promise.all(input.reviewQueueItems.filter((entry) => entry.trackId === input.trackId).map((entry) => buildReviewViewItem(entry, now))))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));
  return { degraded: (input.issues ?? []).length > 0, dueItems: items.filter((item) => item.isDue), issues: [...(input.issues ?? [])], ok: (input.issues ?? []).length === 0, overdueItems: items.filter((item) => item.isOverdue), totalItems: items.length, trackTitle: getTrackDisplay(input.trackId).title, upcomingItems: items.filter((item) => !item.isDue) };
}

async function buildReviewViewItem(entry: ReviewQueueEntry, now: string): Promise<ReviewQueueViewItem> {
  return { dueAt: entry.dueAt, id: entry.id, isDue: entry.dueAt <= now, isOverdue: entry.dueAt < now, itemId: entry.sourceItem.itemId, mistakeTypeRefs: dedupeRefs(entry.taxonomyOrSkillRefs.filter((ref) => ref.axisId === "mistake_type")), prompt: await resolvePrompt(entry), reasons: [...entry.reasons], sourceAttemptId: entry.sourceAttemptId, taxonomyRefs: dedupeRefs(entry.taxonomyOrSkillRefs) };
}
async function resolvePrompt(entry: ReviewQueueEntry): Promise<string> {
  const item = await contentPackageRuntimeOwner.resolveItem(entry.sourceItem);
  if (entry.trackId === CODING_INTERVIEW_TRACK_ID) return (item as AlgorithmQuestion).prompt;
  if (entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID) return (item as CertificationQuestion).question;
  return getTrackDisplay(entry.trackId).title;
}
function dedupeRefs(refs: readonly EvidenceRef[]): EvidenceRef[] { return [...new Map(refs.map((ref) => [`${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`, ref])).values()]; }
