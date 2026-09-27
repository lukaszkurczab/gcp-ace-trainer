export type CommittedExamNavigationRefreshFailure =
  | Readonly<{ kind: "stale" }>
  | Readonly<{ kind: "active_session_conflict"; session: unknown }>
  | Readonly<{ kind: "unavailable"; cause: unknown }>;

/** A confirmed move closes the navigator even when its follow-up read needs retrying. */
export function settleCommittedExamNavigation(
  failure: CommittedExamNavigationRefreshFailure,
  requireRefresh: (failure: CommittedExamNavigationRefreshFailure) => void,
): "navigated" {
  requireRefresh(failure);
  return "navigated";
}
