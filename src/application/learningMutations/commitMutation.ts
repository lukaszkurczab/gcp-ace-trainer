import { clearMutationJournal, persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import type { MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { materializeMutation } from "./mutationMaterializer";
import { verifyMutation } from "./mutationVerifier";
export async function commitMutation(record: MutationJournalRecord): Promise<void> { const prepared = await persistMutationJournal(record); await materializeMutation(prepared); await verifyMutation(prepared); await clearMutationJournal(prepared.commandFingerprint); }
