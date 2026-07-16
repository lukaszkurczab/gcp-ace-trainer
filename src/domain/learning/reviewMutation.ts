import type { ReviewQueueEntry } from "./reviewQueueEntry";

export type ReviewMutationCommand =
  | Readonly<{ kind: "upsert"; entry: ReviewQueueEntry; transitionAttemptId: string }>
  | Readonly<{ kind: "remove"; entry: ReviewQueueEntry; transitionAttemptId?: string }>;

export function createReviewMutationCommand(command: ReviewMutationCommand): ReviewMutationCommand {
  if (command.kind === "upsert" && !command.transitionAttemptId.trim()) throw new Error("A review upsert requires its source attempt transition.");
  if (command.kind === "remove" && command.transitionAttemptId !== undefined && !command.transitionAttemptId.trim()) throw new Error("A review removal transition identity cannot be empty.");
  return Object.freeze({ ...command });
}
