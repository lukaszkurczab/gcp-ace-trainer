export const MANUAL_RETRY_FAILURE_LIMIT = 5;

export type ManualRetryLimit = { failedAttempts: number; inFlight: boolean };

export function createManualRetryLimit(): ManualRetryLimit {
  return { failedAttempts: 0, inFlight: false };
}

export function canStartManualRetry(limit: ManualRetryLimit): boolean {
  return !limit.inFlight && limit.failedAttempts < MANUAL_RETRY_FAILURE_LIMIT;
}

export function reserveManualRetry(limit: ManualRetryLimit): boolean {
  if (!canStartManualRetry(limit)) return false;
  limit.inFlight = true;
  return true;
}

/** Settle one reserved manual attempt once; automatic bootstraps are never reserved. */
export function settleManualRetry(limit: ManualRetryLimit, succeeded: boolean): void {
  if (succeeded) {
    limit.inFlight = false;
    limit.failedAttempts = 0;
    return;
  }
  if (!limit.inFlight) return;
  limit.inFlight = false;
  limit.failedAttempts = Math.min(MANUAL_RETRY_FAILURE_LIMIT, limit.failedAttempts + 1);
}
