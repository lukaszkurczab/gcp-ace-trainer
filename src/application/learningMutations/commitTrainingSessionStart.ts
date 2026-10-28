import type { TrainingSession, TrainingSessionDraft } from "../../domain";
import { canPersistTrainingSessionDraft, getTrackRegistration, initialForegroundTimerForSession } from "../../domain";
import { buildMutationJournal } from "./mutationJournalBuilder";
import { commitMutation } from "./commitMutation";

type SessionStartInput = {
  session: TrainingSession;
  draft: TrainingSessionDraft | null;
  createdAt: string;
};

export async function commitTrainingSessionStart(input: SessionStartInput): Promise<void> {
  await commitMutation(await buildTrainingSessionStartJournal(input));
}

/** Same immutable start plan for the canonical commit and exact test-only cutpoint authority. */
export async function buildTrainingSessionStartJournal(input: SessionStartInput) {
  if (input.session.status !== "active") throw new Error("Training session start requires an active session.");
  const draftExpected = canPersistTrainingSessionDraft(input.session);
  if (draftExpected !== Boolean(input.draft)) throw new Error("Training session start draft does not match the session configuration.");
  if (input.draft && (input.draft.sessionId !== input.session.id || input.draft.trackId !== input.session.trackId || Object.keys(input.draft.responsesByOccurrenceId).length !== 0 || input.draft.flaggedOccurrenceIds.length !== 0)) {
    throw new Error("Training session start requires an empty draft in the same session scope.");
  }
  const initialTimer = initialForegroundTimerForSession(input.session, getTrackRegistration(input.session.trackId).familyId);
  const writes = [
    { kind: "put_session", record: input.session } as const,
    ...(input.draft ? [{ kind: "put_active_session_draft", record: input.draft } as const] : []),
    ...(initialTimer
      ? [{ kind: "put_active_foreground_timer", record: initialTimer } as const]
      : []),
  ];
  return buildMutationJournal({
    operation: "start_training_session",
    sessionId: input.session.id,
    trackId: input.session.trackId,
    identity: JSON.parse(JSON.stringify([input.session, input.draft])),
    writes,
    createdAt: input.createdAt,
  });
}
