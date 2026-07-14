import { clearMutationJournal, getActiveMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
export async function recoverPendingMutation(): Promise<void> { const record = await getActiveMutationJournal(); if (!record) return; await materializeMutation(record); await verifyMutation(record); await clearMutationJournal(); }
