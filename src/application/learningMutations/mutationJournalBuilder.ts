import {
  captureMutationExpectedRevisions,
  createMutationPlanFingerprint,
  type JournalWrite,
  type MutationJournalPlan,
  type MutationJournalRecord,
  type MutationOperation,
} from "../../storage/repositories/mutationJournalRepository";
import { createIdentityFingerprint } from "./identity";
import { contentPackagePinsEqual, type ContentPackagePin } from "../../domain";

export type { MutationOperation };

export async function buildMutationJournal(input: { operation: MutationOperation; sessionId: string; trackId: string; identity: unknown; writes: readonly JournalWrite[]; createdAt: string }): Promise<MutationJournalRecord> {
  const pins = input.writes.flatMap((write): ContentPackagePin[] => {
    if (write.kind === "put_session") return [write.record.packagePin];
    if (write.kind === "put_attempt") return [write.record.item.packagePin];
    if (write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry" || write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt") return [write.record.sourceItem.packagePin];
    return [];
  });
  const packagePin = pins[0] ?? null;
  if (input.operation !== "reset_learning_state" && (!packagePin || pins.some((pin) => !contentPackagePinsEqual(pin, packagePin)))) throw new Error("A mutation journal cannot cross content package pins.");
  if (input.operation === "reset_learning_state" && packagePin) throw new Error("A learning-state reset cannot claim a content package pin.");
  const commandFingerprint = await createIdentityFingerprint([input.operation, input.sessionId, input.trackId, packagePin, input.identity]);
  const plan: MutationJournalPlan = {
    operation: input.operation,
    status: "journal_durable",
    createdAt: input.createdAt,
    sessionId: input.sessionId,
    trackId: input.trackId,
    packagePin,
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
