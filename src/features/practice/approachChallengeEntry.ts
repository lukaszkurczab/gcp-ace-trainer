import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { APPROACH_CHALLENGE_TRACK_ID } from "../../content/canonical/approachChallengeProblem";

export type ApproachChallengeActiveSession = Readonly<{ trackId: string; modeId: string; status: string }>;
export type ApproachChallengeEntry<TStage, THistory> =
  | Readonly<{ kind: "history"; detail: THistory }>
  | Readonly<{ kind: "session"; stage: TStage }>
  | Readonly<{ kind: "setup" }>
  | Readonly<{ kind: "conflict" }>;

/** Resolves an explicit history identity before reading/resuming the active session. */
export async function resolveApproachChallengeEntry<TStage, THistory>(input: Readonly<{
  requestedSessionId?: string;
  loadActiveSession: () => Promise<ApproachChallengeActiveSession | null>;
  getExactHistory: (sessionId: string) => Promise<THistory>;
  resumeActiveSession: () => Promise<void>;
  readActiveStage: () => Promise<TStage>;
}>): Promise<ApproachChallengeEntry<TStage, THistory>> {
  if (input.requestedSessionId) {
    return Object.freeze({ kind: "history", detail: await input.getExactHistory(input.requestedSessionId) });
  }

  const active = await input.loadActiveSession();
  if (active?.status !== "active") return Object.freeze({ kind: "setup" });
  if (active.trackId !== APPROACH_CHALLENGE_TRACK_ID || active.modeId !== APPROACH_CHALLENGE_MODE_ID) {
    return Object.freeze({ kind: "conflict" });
  }

  await input.resumeActiveSession();
  return Object.freeze({ kind: "session", stage: await input.readActiveStage() });
}
