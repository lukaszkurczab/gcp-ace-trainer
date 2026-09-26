const INITIAL_RETRY_DELAY_MS = 30_000;
const MAX_RETRY_DELAY_MS = 6 * 60 * 60 * 1_000;

/** Returns the capped exponential delay for the already reserved attempt. */
export function learningPlanRecoveryRetryDelayMs(attemptCount: number): number {
  if (!Number.isSafeInteger(attemptCount) || attemptCount < 1) throw new RangeError("Recovery attempt count must be a positive integer.");
  return Math.min(INITIAL_RETRY_DELAY_MS * 2 ** Math.min(attemptCount - 1, 31), MAX_RETRY_DELAY_MS);
}

export function nextLearningPlanRecoveryRetryAt(attemptCount: number, now: Date): string {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Recovery clock must be a valid date.");
  return new Date(now.getTime() + learningPlanRecoveryRetryDelayMs(attemptCount)).toISOString();
}

export function isLearningPlanRecoveryRetryDue(nextRetryAt: string | null, now: Date): boolean {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Recovery clock must be a valid date.");
  return nextRetryAt === null || (Number.isFinite(Date.parse(nextRetryAt)) && Date.parse(nextRetryAt) <= now.getTime());
}
