import {
  captureMutationExpectedRevisions,
  createMutationPlanFingerprint,
  type JournalWrite,
  type MutationJournalPlan,
  type MutationJournalRecord,
  type MutationOperation,
} from "../../storage/repositories/mutationJournalRepository";
import { createIdentityFingerprint } from "./identity";

export type { MutationOperation };

export async function buildMutationJournal(input: { operation: MutationOperation; sessionId: string; trackId: string; identity: unknown; writes: readonly JournalWrite[]; createdAt: string }): Promise<MutationJournalRecord> {
  const commandFingerprint = await createIdentityFingerprint([input.operation, input.sessionId, input.trackId, input.identity]);
  const plan: MutationJournalPlan = {
    operation: input.operation,
    status: "journal_durable",
    createdAt: input.createdAt,
    sessionId: input.sessionId,
    trackId: input.trackId,
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
