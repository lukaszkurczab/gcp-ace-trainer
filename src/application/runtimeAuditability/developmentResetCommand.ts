import { getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { clearForegroundTimers, clearReviewQueueItems, clearTrainingAttempts, clearTrainingSessionDrafts, clearTrainingSessions } from "../../storage/repositories";
import { clearMutationJournal } from "../../storage/repositories/mutationJournalRepository";

export const DEVELOPMENT_RESET_LEARNING_STATE_URL = "com.lkurczab.gcpacetrainer://audit/reset-learning-state";
export const DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL = "com.lkurczab.gcpacetrainer://audit/clock/advance";

export type RuntimeAuditabilityCommand =
  | Readonly<{ kind: "reset_learning_state" }>
  | Readonly<{ kind: "advance_clock"; milliseconds: number }>;
export type RuntimeAuditabilityUrlHandling =
  | Readonly<{ kind: "unavailable_in_production" }>
  | Readonly<{ kind: "ignored" }>
  | Readonly<{ kind: "reset_learning_state" }>
  | Readonly<{ kind: "advance_clock"; now: string }>;

const resetLearningStateCommand: RuntimeAuditabilityCommand = Object.freeze({ kind: "reset_learning_state" });

/** Accept only the one documented command; query strings and fragments are not commands. */
export function parseRuntimeAuditabilityCommand(url: string | null): RuntimeAuditabilityCommand | null {
  if (url === DEVELOPMENT_RESET_LEARNING_STATE_URL) return resetLearningStateCommand;
  if (!url) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== DEVELOPMENT_ADVANCE_AUDIT_CLOCK_URL || parsed.hash || [...parsed.searchParams.keys()].length !== 1) return null;
  const milliseconds = parsed.searchParams.get("milliseconds");
  if (!milliseconds || !/^[1-9][0-9]*$/.test(milliseconds)) return null;
  const value = Number(milliseconds);
  return Number.isSafeInteger(value) ? Object.freeze({ kind: "advance_clock" as const, milliseconds: value }) : null;
}

export function isDevelopmentRuntimeAuditabilityEnabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

/**
 * This is deliberately a development-only protocol. It reaches reset through
 * the composed lifecycle facade, never through presentation state or storage.
 */
export async function handleRuntimeAuditabilityUrl(url: string | null): Promise<RuntimeAuditabilityUrlHandling> {
  if (!isDevelopmentRuntimeAuditabilityEnabled()) return { kind: "unavailable_in_production" };
  const command = parseRuntimeAuditabilityCommand(url);
  if (!command) return { kind: "ignored" };
  if (command.kind === "reset_learning_state") {
    try {
      await getTrainingLifecycleUseCases().resetLearningState();
    } catch {
      await clearUnrecoverableDevelopmentLearningState();
    }
    return { kind: command.kind };
  }
  return { kind: command.kind, now: getTrainingLifecycleUseCases().advanceRuntimeAuditabilityClock(command.milliseconds) };
}

/**
 * The documented development reset must remain able to restore a reproducible
 * baseline when an interrupted journal itself cannot be recovered. This path
 * is unavailable in production and clears exactly the same canonical learning
 * records as the lifecycle reset; it never derives or substitutes learner data.
 */
async function clearUnrecoverableDevelopmentLearningState(): Promise<void> {
  await clearMutationJournal();
  await clearForegroundTimers();
  await clearTrainingSessionDrafts();
  await clearTrainingSessions();
  await clearTrainingAttempts();
  await clearReviewQueueItems();
}
