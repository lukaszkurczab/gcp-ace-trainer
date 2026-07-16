import { recoverPendingMutation } from "../learningMutations";
import { canPersistTrainingSessionDraft } from "../../domain";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getTrainingSessions,
  openCanonicalRepositories,
} from "../../storage/repositories";

export type ApplicationBootstrapState =
  | Readonly<{ kind: "ready"; activeSessionId: string | null }>
  | Readonly<{ kind: "blocking"; reason: string }>;

/**
 * The bootstrap sequence is deliberately linear.  Do not make recovery or
 * repository validation parallel with navigation or content resolution.
 */
export async function bootstrapApplication(
  validateBundledContent: () => Promise<unknown>,
  resolveActiveSession: (sessionId: string) => Promise<void>,
): Promise<ApplicationBootstrapState> {
  try {
    await openCanonicalRepositories();
    await recoverPendingMutation();
    await validateBundledContent();
    const activeSession = await getActiveTrainingSession();
    const sessions = (await getTrainingSessions()).value;
    const activeRecords = sessions.filter((session) => session.status === "active");
    if (!activeSession && activeRecords.length > 0) throw new Error("An active training session exists without an active-session reference.");
    if (activeSession && (activeRecords.length !== 1 || activeRecords[0]?.id !== activeSession.id)) {
      throw new Error("The active-session reference is inconsistent with canonical session records.");
    }
    if (!activeSession) return { kind: "ready", activeSessionId: null };
    const draft = await getActiveTrainingSessionDraft();
    if (canPersistTrainingSessionDraft(activeSession) && !draft) throw new Error("The active session requires a missing canonical draft.");
    if (draft && (draft.sessionId !== activeSession.id || draft.trackId !== activeSession.trackId)) {
      throw new Error("The canonical draft does not match the active session.");
    }
    await resolveActiveSession(activeSession.id);
    return { kind: "ready", activeSessionId: activeSession.id };
  } catch (error) {
    return { kind: "blocking", reason: error instanceof Error ? error.message : "Application bootstrap failed." };
  }
}
