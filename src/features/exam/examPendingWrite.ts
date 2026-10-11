import type { CertificationExamProjection } from "../../application/certification";
import type { CanonicalQuestionResponse } from "../../content/canonical";
import type { ExamReadOwnerOutcome } from "./examReadOwner";

export type PendingExamWrite = Readonly<{ kind: "response"; occurrenceId: string; response: CanonicalQuestionResponse }> | Readonly<{ kind: "flag"; occurrenceId: string; flagged: boolean }>;

export function shouldClearPendingExamWrite(
  write: PendingExamWrite,
  outcome: ExamReadOwnerOutcome<CertificationExamProjection>,
): boolean {
  if (outcome.kind !== "ready") return false;
  const projection = outcome.projection;
  if ("error" in projection.operation && projection.operation.error.allowedAction === "reconcile") return false;
  if (write.kind === "response") {
    return JSON.stringify(projection.draft.responsesByOccurrenceId[write.occurrenceId] ?? null) === JSON.stringify(write.response);
  }
  return projection.draft.flaggedOccurrenceIds.includes(write.occurrenceId) === write.flagged;
}
