import { clearMutationJournal, persistMutationJournal, updateMutationJournalPhase } from "../../storage/repositories/mutationJournalRepository";
import type { MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
import { MutationCommitFailure } from "../mutationBoundary";
import { ensureAccountOutboxFromLocalDataset } from "../../storage/repositories/accountDataRepository";

export async function commitMutation(record: MutationJournalRecord): Promise<void> {
  let prepared: MutationJournalRecord;
  try { prepared = await persistMutationJournal(record); }
  catch (error) { throw new MutationCommitFailure("journal_write", "not_durable", error); }
  try { await materializeMutation(prepared); await updateMutationJournalPhase(prepared, "materialized"); }
  catch (error) { throw new MutationCommitFailure("materialization", "journal_durable", error); }
  try { await verifyMutation(prepared); await updateMutationJournalPhase(prepared, "verified_pending_clear"); }
  catch (error) { throw new MutationCommitFailure("verification", "materialized", error); }
  try { await clearMutationJournal(prepared.commandIdentity.fingerprint); }
  catch (error) { throw new MutationCommitFailure("journal_clear", "verified_pending_clear", error); }
  try { await ensureAccountOutboxFromLocalDataset(); }
  catch (error) { throw new MutationCommitFailure("journal_clear", "verified_pending_clear", error); }
}
