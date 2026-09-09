import { clearMutationJournal, persistMutationJournal, updateMutationJournalPhase } from "../../storage/repositories/mutationJournalRepository";
import type { MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
import { MutationCommitFailure } from "../mutationBoundary";
import { getAccountSyncState, markAccountDataPending } from "../../storage/repositories/accountDataRepository";
import { withLocalLearningWriteOperation } from "./localLearningWriteOperation";

export async function commitMutation(record: MutationJournalRecord): Promise<void> {
  return withLocalLearningWriteOperation(() => commitMutationUnlocked(record));
}

async function commitMutationUnlocked(record: MutationJournalRecord): Promise<void> {
  const accountState = await getAccountSyncState();
  if (accountState.materialization || accountState.pendingConfirmation) throw new MutationCommitFailure("journal_write", "not_durable", new Error("Account data transition is in progress."));
  let prepared: MutationJournalRecord;
  try { prepared = await persistMutationJournal(record); }
  catch (error) { throw new MutationCommitFailure("journal_write", "not_durable", error); }
  try { await materializeMutation(prepared); await updateMutationJournalPhase(prepared, "materialized"); }
  catch (error) { throw new MutationCommitFailure("materialization", "journal_durable", error); }
  try { await verifyMutation(prepared); await updateMutationJournalPhase(prepared, "verified_pending_clear"); }
  catch (error) { throw new MutationCommitFailure("verification", "materialized", error); }
  try { await markAccountDataPending(); await clearMutationJournal(prepared.commandIdentity.fingerprint); }
  catch (error) { throw new MutationCommitFailure("journal_clear", "verified_pending_clear", error); }
}
