import type { ReviewQueueEntry } from "../../domain";
import type { MutationExpectedRevision } from "../../storage/repositories/mutationJournalRepository";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutationAfterPreflight } from "./commitMutation";

export type ReviewEntryMutation = Readonly<{
  action: "put" | "update" | "delete";
  createdAt: string;
  record: ReviewQueueEntry;
  expectedRevisionOverrides: readonly MutationExpectedRevision[];
  transitionId: string;
}>;

/** Resolves a review change and journals it inside the shared local-write lane. */
export async function commitReviewEntryChange(resolve: () => Promise<ReviewEntryMutation | null>, revalidate: () => void): Promise<void> {
  await commitMutationAfterPreflight(async () => {
    const input = await resolve();
    if (!input) return null;
    const write = input.action === "delete"
      ? { kind: "delete_review_entry" as const, record: input.record }
      : input.action === "put"
        ? { kind: "put_review_entry" as const, record: input.record }
        : { kind: "update_review_entry" as const, record: input.record, transitionId: input.transitionId };
    return buildMutationJournal({
      operation: input.action === "delete" ? "remove_review_entry" : "set_review_entry",
      sessionId: input.record.sourceSessionId,
      trackId: input.record.trackId,
      identity: [input.record.id, input.transitionId, input.action, input.record],
      writes: [write],
      createdAt: input.createdAt,
      expectedRevisionOverrides: input.expectedRevisionOverrides,
    });
  }, revalidate);
}
