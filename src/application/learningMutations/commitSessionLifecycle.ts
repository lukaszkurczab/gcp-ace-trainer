import { canPersistTrainingSessionDraft, type TrainingSession } from "../../domain";
import { getActiveTrainingSessionDraft } from "../../storage/repositories";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";
export async function commitSessionCompletion(session: TrainingSession, createdAt: string): Promise<void> { await commitMutation(await buildMutationJournal({ operation: "complete_training_session", sessionId: session.id, trackId: session.trackId, identity: session.id, writes: [{ kind: "put_session", record: session }, { kind: "clear_active_session", sessionId: session.id }], createdAt })); }
export async function commitSessionAbandonment(session: TrainingSession, createdAt: string): Promise<void> {
  if (session.status !== "abandoned") throw new Error("Session abandonment requires an abandoned session record.");
  const draft = canPersistTrainingSessionDraft(session) ? await getActiveTrainingSessionDraft() : null;
  if (canPersistTrainingSessionDraft(session) && (!draft || draft.sessionId !== session.id || draft.trackId !== session.trackId)) {
    throw new Error("Interview Simulation abandonment requires its active persisted draft.");
  }
  await commitMutation(await buildMutationJournal({
    operation: "abandon_training_session",
    sessionId: session.id,
    trackId: session.trackId,
    identity: session,
    writes: [
      { kind: "put_session", record: session },
      { kind: "clear_active_session", sessionId: session.id },
      ...(draft ? [{ kind: "clear_active_session_draft", sessionId: session.id } as const] : []),
    ],
    createdAt,
  }));
}
