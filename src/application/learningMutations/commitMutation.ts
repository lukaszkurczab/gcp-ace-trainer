import { clearMutationJournal, persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import type { MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
import { MutationCommitFailure, type MutationCommitPhase } from "../trainingLifecycle/contracts";

export type { MutationCommitPhase };
export { MutationCommitFailure };

export async function commitMutation(record: MutationJournalRecord): Promise<void> {
  let prepared: MutationJournalRecord;
  try { prepared = await persistMutationJournal(record); }
  catch (error) { throw new MutationCommitFailure("journal", false, error); }
  try { await materializeMutation(prepared); }
  catch (error) { throw new MutationCommitFailure("materialization", true, error); }
  try { await verifyMutation(prepared); }
  catch (error) { throw new MutationCommitFailure("verification", true, error); }
  try { await clearMutationJournal(prepared.commandIdentity.fingerprint); }
  catch (error) { throw new MutationCommitFailure("verification", true, error); }
}
