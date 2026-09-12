import {
  captureMutationExpectedRevisions,
  createMutationPlanFingerprint,
  type JournalWrite,
  type MutationJournalPlan,
  type MutationJournalRecord,
  type MutationOperation,
} from "../../storage/repositories/mutationJournalRepository";
import { createIdentityFingerprint } from "./identity";
import { isArtifactSha256 } from "../../domain";

export type { MutationOperation };

export async function buildMutationJournal(input: { operation: MutationOperation; sessionId: string; trackId: string; identity: unknown; writes: readonly JournalWrite[]; createdAt: string }): Promise<MutationJournalRecord> {
  const artifactSha256Values = input.writes.flatMap((write): string[] => {
    if (write.kind === "put_session") return [write.record.artifactSha256];
    if (write.kind === "put_attempt") return [write.record.item.artifactSha256];
    if (write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry" || write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt") return [write.record.sourceItem.artifactSha256];
    return [];
  });
  const artifactSha256 = artifactSha256Values[0] ?? null;
  if (input.operation !== "reset_learning_state" && (!isArtifactSha256(artifactSha256) || artifactSha256Values.some((value) => value !== artifactSha256))) throw new Error("A mutation journal cannot cross content artifacts.");
  if (input.operation === "reset_learning_state" && artifactSha256 !== null) throw new Error("A learning-state reset cannot claim an artifact SHA-256.");
  const commandFingerprint = await createIdentityFingerprint([input.operation, input.sessionId, input.trackId, artifactSha256, input.identity]);
  const plan: MutationJournalPlan = {
    operation: input.operation,
    status: "journal_durable",
    createdAt: input.createdAt,
    sessionId: input.sessionId,
    trackId: input.trackId,
    artifactSha256,
    commandIdentity: { version: 1, fingerprint: commandFingerprint },
    expectedRevisions: captureMutationExpectedRevisions(input.writes),
    writes: input.writes,
  };
  return {
    journalId: `journal:${commandFingerprint}`,
    ...plan,
    planFingerprint: createMutationPlanFingerprint(plan),
  };
}
