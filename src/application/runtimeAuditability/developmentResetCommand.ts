import { getTrainingLifecycleUseCases } from "../trainingLifecycle";

export const DEVELOPMENT_RESET_LEARNING_STATE_URL = "com.lkurczab.gcpacetrainer://audit/reset-learning-state";

export type RuntimeAuditabilityCommand = Readonly<{ kind: "reset_learning_state" }>;
export type RuntimeAuditabilityUrlHandling =
  | Readonly<{ kind: "unavailable_in_production" }>
  | Readonly<{ kind: "ignored" }>
  | Readonly<{ kind: "reset_learning_state" }>;

const resetLearningStateCommand: RuntimeAuditabilityCommand = Object.freeze({ kind: "reset_learning_state" });

/** Accept only the one documented command; query strings and fragments are not commands. */
export function parseRuntimeAuditabilityCommand(url: string | null): RuntimeAuditabilityCommand | null {
  return url === DEVELOPMENT_RESET_LEARNING_STATE_URL ? resetLearningStateCommand : null;
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
  await getTrainingLifecycleUseCases().resetLearningState();
  return { kind: command.kind };
}
