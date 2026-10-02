import type { RecoveryOperationSnapshot } from "../../application/account/recoveryOperationCoordinator";

export type RecoveryOperationPresentation = Readonly<{
  showPanel: boolean;
  showCodes: boolean;
  showRetry: boolean;
  showResume: boolean;
  issueBlocksReplacement: boolean;
  showDefer: boolean;
  deferred: boolean;
  acknowledged: boolean;
  savedAcknowledgementPending: boolean;
  resumeKind: "issue" | "consume" | "terminal" | null;
}>;

export function getRecoveryOperationPresentation(snapshot: RecoveryOperationSnapshot): RecoveryOperationPresentation {
  if (snapshot.kind === "issue") {
    const acknowledged = snapshot.status === "acknowledged";
    const terminal = acknowledged || snapshot.status === "superseded" || snapshot.status === "expired_or_invalid";
    return {
      showPanel: !terminal || acknowledged,
      showCodes: !snapshot.deferredFor && !terminal && !snapshot.needsAccountResolution && !snapshot.savedIntent && snapshot.codes !== null,
      showRetry: !snapshot.deferredFor && !snapshot.needsAccountResolution && !terminal && (snapshot.failure !== null || snapshot.savedIntent || snapshot.status === "in_progress" || snapshot.status === "provider_retryable" || snapshot.status === "delivery_unconfirmed"),
      showResume: snapshot.deferredFor !== null || snapshot.needsAccountResolution || snapshot.status === "superseded" || snapshot.status === "expired_or_invalid",
      issueBlocksReplacement: !terminal || snapshot.needsAccountResolution || snapshot.status === "superseded" || snapshot.status === "expired_or_invalid",
      showDefer: snapshot.accountResolution === "different_uid" || snapshot.accountResolution === "different_generation",
      deferred: snapshot.deferredFor !== null,
      acknowledged,
      savedAcknowledgementPending: snapshot.savedIntent && snapshot.status === "result_available" && !snapshot.deferredFor && !snapshot.needsAccountResolution,
      resumeKind: snapshot.deferredFor !== null || snapshot.needsAccountResolution ? "issue" : snapshot.status === "superseded" || snapshot.status === "expired_or_invalid" ? "terminal" : null,
    };
  }
  if (snapshot.kind === "consume") {
    return { showPanel: true, showCodes: false, showRetry: !snapshot.needsAccountResolution && (snapshot.failure !== null || snapshot.status === "provider_retryable" || snapshot.status === "in_progress"), showResume: snapshot.needsAccountResolution, issueBlocksReplacement: true, showDefer: false, deferred: false, acknowledged: false, savedAcknowledgementPending: false, resumeKind: snapshot.needsAccountResolution ? "consume" : null };
  }
  if (snapshot.kind === "loading" || snapshot.kind === "unavailable") {
    return { showPanel: true, showCodes: false, showRetry: true, showResume: false, issueBlocksReplacement: true, showDefer: false, deferred: false, acknowledged: false, savedAcknowledgementPending: false, resumeKind: null };
  }
  if (snapshot.kind === "terminal") {
    const acknowledged = snapshot.status === "acknowledged";
    return { showPanel: true, showCodes: false, showRetry: false, showResume: !acknowledged, issueBlocksReplacement: !acknowledged, showDefer: false, deferred: false, acknowledged, savedAcknowledgementPending: false, resumeKind: acknowledged ? null : "terminal" };
  }
  return { showPanel: false, showCodes: false, showRetry: false, showResume: false, issueBlocksReplacement: false, showDefer: false, deferred: false, acknowledged: false, savedAcknowledgementPending: false, resumeKind: null };
}
