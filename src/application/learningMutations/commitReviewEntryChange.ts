import type { ReviewQueueEntry } from "../../domain";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";

export async function commitReviewEntryChange(input: { record: ReviewQueueEntry; isUpdate: boolean; transitionId: string; createdAt: string }): Promise<void> {
  const write = input.isUpdate
    ? { kind: "update_review_entry" as const, record: input.record, transitionId: input.transitionId }
    : { kind: "put_review_entry" as const, record: input.record };
  await commitMutation(await buildMutationJournal({ operation: "set_review_entry", sessionId: input.record.sourceSessionId, trackId: input.record.trackId, identity: [input.record.id, input.transitionId, input.record.reasons, input.record.dueAt], writes: [write], createdAt: input.createdAt }));
}

export async function commitReviewEntryRemoval(record: ReviewQueueEntry, createdAt: string): Promise<void> {
  await commitMutation(await buildMutationJournal({ operation: "remove_review_entry", sessionId: record.sourceSessionId, trackId: record.trackId, identity: record.id, writes: [{ kind: "delete_review_entry", record }], createdAt }));
}
