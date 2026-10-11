import { markAccountDataPending } from "../../storage/repositories/accountDataRepository";
import { clearMutationJournal, getActiveMutationJournal, updateMutationJournalPhase } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
import { MutationCommitFailure } from "../mutationBoundary";
import { assertLearningStateResetMaterialized } from "../../storage/repositories/learningStateResetRepository";

/** Replays only the durable phase that remains.  The immutable journal plan is
 * deliberately reused so retry never creates new attempts, reviews or results. */
export async function recoverPendingMutation(): Promise<void> {
  let record = await getActiveMutationJournal();
  if (!record) return;
  if (record.status === "journal_durable") {
    try {
      await materializeMutation(record);
      record = await updateMutationJournalPhase(record, "materialized");
    } catch (error) {
      throw new MutationCommitFailure("materialization", "journal_durable", error);
    }
  }
  if (record.status === "materialized") {
    try {
      await verifyMutation(record);
      record = await updateMutationJournalPhase(record, "verified_pending_clear");
    } catch (error) {
      throw new MutationCommitFailure("verification", "materialized", error);
    }
  }
  if (record.status === "verified_pending_clear") {
    try {
      if (record.operation === "reset_learning_state") {
        const reset = record.writes[0];
        if (reset?.kind !== "clear_learning_state") throw new Error("A reset journal has no exact physical target plan.");
        assertLearningStateResetMaterialized(reset.targetPlan);
      }
      if (record.operation !== "resolve_account_sync_conflict" && record.operation !== "reset_learning_state") await markAccountDataPending();
      await clearMutationJournal(record.commandIdentity.fingerprint);
    } catch (error) {
      throw new MutationCommitFailure("journal_clear", "verified_pending_clear", error);
    }
  }
}
