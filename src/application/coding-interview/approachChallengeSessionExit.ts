import type { TrainingSession } from "../../domain";
import { APPROACH_CHALLENGE_TRACK_ID } from "../../content/canonical/approachChallengeProblem";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { loadActiveTrainingSession } from "../learningReadModels";
import { captureProfileReadFence } from "../profileReadFence";
import { getForegroundSessionTimerFacade, TrainingApplicationFailure } from "../trainingLifecycle";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";

export type ApproachChallengeEndAction = "end" | "retry_checkpoint" | "retry_command" | "recover_checkpoint" | "recover_abandonment" | "reconcile_abandonment";
export type ApproachChallengeEndResult = Readonly<{ kind: "ended"; session: TrainingSession }>
  | Readonly<{ kind: "not_ended"; nextAction: ApproachChallengeEndAction }>;
export type ApproachChallengePauseAction = "pause" | "retry_checkpoint" | "recover_checkpoint";
export type ApproachChallengePauseResult = Readonly<{ kind: "paused"; session: TrainingSession }>
  | Readonly<{ kind: "not_paused"; nextAction: Exclude<ApproachChallengePauseAction, "pause"> }>;
type CheckedOperation = <T>(operation: () => Promise<T>) => Promise<T>;

/** Pause owns only a checkpoint. Its retries can never continue into abandonment. */
export async function pauseApproachChallengeSession(
  expectedSessionId: string,
  action: ApproachChallengePauseAction = "pause",
  assertCurrent = captureProfileReadFence(),
): Promise<ApproachChallengePauseResult> {
  const checked: CheckedOperation = async (operation) => {
    assertCurrent();
    const result = await operation();
    assertCurrent();
    return result;
  };
  const session = await checked(loadActiveTrainingSession);
  assertExpectedSession(session, expectedSessionId);
  try {
    await checkpointApproachChallengeExit(session, action, assertCurrent, checked);
  } catch (cause) {
    assertCurrent();
    const pending = await checked(() => getTrainingLifecycleUseCases().getExpectedSessionPendingMutation(expectedSessionId));
    const active = await checked(loadActiveTrainingSession);
    assertExpectedSession(active, expectedSessionId);
    if (pending?.operation === "advance_training_session") return { kind: "not_paused", nextAction: "recover_checkpoint" };
    if (pending) throw cause;
    return { kind: "not_paused", nextAction: "retry_checkpoint" };
  }
  const active = await checked(loadActiveTrainingSession);
  assertExpectedSession(active, expectedSessionId);
  return { kind: "paused", session: active };
}

async function checkpointApproachChallengeExit(
  session: TrainingSession,
  action: ApproachChallengePauseAction | "end",
  assertCurrent: () => void,
  checked: CheckedOperation,
): Promise<void> {
  const lifecycle = getTrainingLifecycleUseCases(), timer = getForegroundSessionTimerFacade();
  if (action === "recover_checkpoint") {
    const pending = await checked(() => lifecycle.getExpectedSessionPendingMutation(session.id));
    if (pending?.operation !== "advance_training_session") throw new TrainingApplicationFailure("resume_unavailable", "No matching foreground checkpoint is available to recover.");
    await checked(() => lifecycle.recoverActiveTrainingOperation(undefined, { sessionId: session.id, assertCurrent }));
    const active = await checked(loadActiveTrainingSession);
    assertExpectedSession(active, session.id);
    session = active;
  }
  if (action === "retry_checkpoint" || action === "recover_checkpoint") await checked(() => timer.retryLeaveForegroundAfterCheckpointFailure(session));
  else await checked(() => timer.leaveForeground(session, "session_exit"));
}

/** Ends only the confirmed ACM session. Uncertain saves replay/recover their existing command. */
export async function endApproachChallengeSession(
  expectedSessionId: string,
  action: ApproachChallengeEndAction = "end",
  assertCurrent = captureProfileReadFence(),
): Promise<ApproachChallengeEndResult> {
  const lifecycle = getTrainingLifecycleUseCases();
  const timer = getForegroundSessionTimerFacade();
  const checked = async <T,>(operation: () => Promise<T>): Promise<T> => {
    assertCurrent();
    const result = await operation();
    assertCurrent();
    return result;
  };
  const exactSession = async (): Promise<TrainingSession> => {
    const session = await checked(loadActiveTrainingSession);
    assertExpectedSession(session, expectedSessionId);
    return session;
  };
  const ended = (session: TrainingSession): ApproachChallengeEndResult => {
    assertCurrent();
    if (session.id !== expectedSessionId || session.status !== "abandoned" || session.modeId !== APPROACH_CHALLENGE_MODE_ID || session.trackId !== APPROACH_CHALLENGE_TRACK_ID) {
      throw new TrainingApplicationFailure("verification_failure", "The confirmed Approach Challenge session has not been ended.");
    }
    timer.releaseAfterVerifiedSessionEnd(expectedSessionId);
    return { kind: "ended", session };
  };
  let checkpointFailed = false;
  try {
    if (action === "recover_abandonment") return ended(await checked(() => lifecycle.recoverExpectedSessionAbandonment(expectedSessionId)));
    if (action === "reconcile_abandonment") {
      await exactSession();
      const result = await checked(() => lifecycle.reconcileUncertainMutation(expectedSessionId));
      if (result === "conflict") throw new TrainingApplicationFailure("verification_failure", "The exact session-ending command could not be reconciled.");
      if (result !== "verified") return { kind: "not_ended", nextAction: "reconcile_abandonment" };
      return ended(await checked(() => lifecycle.recoverExpectedSessionAbandonment(expectedSessionId)));
    }
    const session = await exactSession();
    if (action === "retry_command") return ended(await checked(() => lifecycle.retryExpectedSessionAbandonment(expectedSessionId)));
    checkpointFailed = true;
    await checkpointApproachChallengeExit(session, action, assertCurrent, checked);
    checkpointFailed = false;
    await exactSession();
    return ended(await checked(() => lifecycle.abandonActiveSession({ sessionId: expectedSessionId, assertCurrent })));
  } catch (cause) {
    assertCurrent();
    const pending = await checked(() => lifecycle.getExpectedSessionPendingMutation(expectedSessionId));
    if (pending?.operation === "abandon_training_session") return { kind: "not_ended", nextAction: "recover_abandonment" };
    if (checkpointFailed && pending?.operation === "advance_training_session") return { kind: "not_ended", nextAction: "recover_checkpoint" };
    if (pending) throw cause;
    const active = await checked(loadActiveTrainingSession);
    if (!active) return ended(await checked(() => lifecycle.recoverExpectedSessionAbandonment(expectedSessionId)));
    assertExpectedSession(active, expectedSessionId);
    const operation = await checked(() => lifecycle.getPracticeOperationState(active, false));
    if (operation.kind === "abandonment_recovery_required") {
      if (operation.error.allowedAction === "reconcile") return { kind: "not_ended", nextAction: "reconcile_abandonment" };
      if (operation.error.allowedAction === "recover") return { kind: "not_ended", nextAction: "recover_abandonment" };
      throw cause;
    }
    if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") {
      return { kind: "not_ended", nextAction: "retry_command" };
    }
    if (checkpointFailed) return { kind: "not_ended", nextAction: "retry_checkpoint" };
    if (operation.kind === "abandonment_failed_before_journal" || operation.kind === "feedback" || operation.kind === "unanswered") {
      return { kind: "not_ended", nextAction: "end" };
    }
    throw cause;
  }
}

function assertExpectedSession(session: TrainingSession | null, sessionId: string): asserts session is TrainingSession {
  if (!session || session.id !== sessionId || session.status !== "active" || session.trackId !== APPROACH_CHALLENGE_TRACK_ID || session.modeId !== APPROACH_CHALLENGE_MODE_ID) {
    throw new TrainingApplicationFailure("active_session_conflict", "The confirmed Approach Challenge session is no longer active.");
  }
}
