import {
  captureMutationExpectedRevisions,
  createMutationPlanFingerprint,
  type JournalWrite,
  type MutationJournalPlan,
  type MutationJournalRecord,
  type MutationOperation,
  type MutationExpectedRevision,
  type TrainingMutationOperation,
} from "../../storage/repositories/mutationJournalRepository";
import { createIdentityFingerprint } from "./identity";
import { isArtifactSha256 } from "../../domain";

export type { MutationOperation };

export async function buildMutationJournal(input: { operation: TrainingMutationOperation; sessionId: string; trackId: string; identity: unknown; writes: readonly JournalWrite[]; createdAt: string; expectedRevisionOverrides?: readonly MutationExpectedRevision[] }): Promise<MutationJournalRecord>;
export async function buildMutationJournal(input: { operation: "accept_goal_plan"; proposalId: string; trackId: string; identity: unknown; writes: readonly [Extract<JournalWrite, { kind: "accept_goal_plan" }>]; createdAt: string }): Promise<MutationJournalRecord>;
export async function buildMutationJournal(input: { operation: "resolve_account_sync_conflict"; conflictId: string; trackId: string; identity: unknown; writes: readonly [Extract<JournalWrite, { kind: "resolve_account_sync_conflict" }>]; createdAt: string }): Promise<MutationJournalRecord>;
export async function buildMutationJournal(input: { operation: MutationOperation; sessionId?: string; proposalId?: string; conflictId?: string; trackId: string; identity: unknown; writes: readonly JournalWrite[]; createdAt: string; expectedRevisionOverrides?: readonly MutationExpectedRevision[] }): Promise<MutationJournalRecord> {
  if (input.operation === "accept_goal_plan") {
    if (!input.proposalId || input.writes.length !== 1 || input.writes[0]?.kind !== "accept_goal_plan") throw new Error("Goal-plan acceptance requires one typed pair write.");
    const commandFingerprint = await createIdentityFingerprint([input.operation, input.proposalId, input.trackId, input.identity]);
    const plan: MutationJournalPlan = {
      operation: input.operation,
      status: "journal_durable",
      createdAt: input.createdAt,
      proposalId: input.proposalId,
      trackId: input.trackId,
      artifactSha256: input.writes[0].record.plan.artifactSha256,
      commandIdentity: { version: 1, fingerprint: commandFingerprint },
      expectedRevisions: captureMutationExpectedRevisions(input.writes),
      writes: input.writes,
    };
    return { journalId: `journal:${commandFingerprint}`, ...plan, planFingerprint: createMutationPlanFingerprint(plan) };
  }
  if (input.operation === "resolve_account_sync_conflict") {
    const write = input.writes[0];
    if (!input.conflictId || input.writes.length !== 1 || write?.kind !== "resolve_account_sync_conflict" || write.record.conflictId !== input.conflictId) throw new Error("Sync conflict resolution requires one typed pair-and-state write.");
    const commandFingerprint = await createIdentityFingerprint([input.operation, input.conflictId, input.trackId, input.identity]);
    const plan: MutationJournalPlan = {
      operation: input.operation,
      status: "journal_durable",
      createdAt: input.createdAt,
      conflictId: input.conflictId,
      trackId: input.trackId,
      artifactSha256: write.record.afterPlan?.artifactSha256 ?? null,
      commandIdentity: { version: 1, fingerprint: commandFingerprint },
      expectedRevisions: captureMutationExpectedRevisions(input.writes),
      writes: input.writes,
    };
    return { journalId: `journal:${commandFingerprint}`, ...plan, planFingerprint: createMutationPlanFingerprint(plan) };
  }
  if (!input.sessionId) throw new Error("Training mutation requires a session identity.");
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
    expectedRevisions: captureMutationExpectedRevisions(input.writes, input.expectedRevisionOverrides),
    writes: input.writes,
  };
  return {
    journalId: `journal:${commandFingerprint}`,
    ...plan,
    planFingerprint: createMutationPlanFingerprint(plan),
  };
}
