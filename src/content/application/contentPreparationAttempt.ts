import type { VerificationWorkPlan, VerifiedUnit } from "../canonical/runtimeCatalog";

export type ContentPreparationOutcome = Readonly<{
  accepted: boolean;
  publication: "none" | "timeout" | "whole_result";
  phase: "running" | "timed_out" | "finished";
  deadline: number;
}>;

/** A finite verified-progress watchdog; timeout never cancels content validation. */
export function createContentPreparationAttempt(options: Readonly<{
  isCurrent: () => boolean;
  canAcceptLateSuccess: () => boolean;
  now: () => number;
  stallMs: number;
}>) {
  let phase: ContentPreparationOutcome["phase"] = "running";
  let deadline = options.now() + options.stallMs;
  let plan: VerificationWorkPlan | undefined;
  let declared = new Set<string>();
  const credited = new Set<string>();
  let timeoutIssued = false;
  const outcome = (accepted = false, publication: ContentPreparationOutcome["publication"] = "none"): ContentPreparationOutcome =>
    Object.freeze({ accepted, publication, phase, deadline });
  const current = () => phase !== "finished" && options.isCurrent();
  const reconcileExpiry = (observedNow: number) => {
    if (phase === "running" && observedNow >= deadline) phase = "timed_out";
  };
  const timeoutOutcome = () => {
    if (phase !== "timed_out" || timeoutIssued) return outcome();
    timeoutIssued = true;
    return outcome(false, "timeout");
  };
  const beforeProgress = (observedNow: number) => {
    if (!current()) return outcome();
    reconcileExpiry(observedNow);
    return phase === "timed_out" ? timeoutOutcome() : undefined;
  };
  return {
    pending: () => phase === "running" && options.isCurrent(),
    view: () => outcome(),
    attachWorkPlan(candidate: VerificationWorkPlan) {
      const stopped = beforeProgress(options.now());
      if (stopped) return stopped;
      if (plan || !candidate.build || typeof candidate.build !== "object" || !Array.isArray(candidate.units)) return outcome();
      const ids = candidate.units.map((unit) => unit.id);
      const currentCount = candidate.units.filter((unit) => unit.kind === "current_artifact").length;
      const retainedCount = candidate.units.filter((unit) => unit.kind === "retained_pair").length;
      if (currentCount > 9 || retainedCount > 3 || currentCount + retainedCount !== ids.length
        || ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) return outcome();
      plan = candidate;
      declared = new Set(ids);
      return outcome(true);
    },
    acceptVerifiedUnit(proof: VerifiedUnit) {
      const observedNow = options.now();
      const stopped = beforeProgress(observedNow);
      if (stopped) return stopped;
      if (!plan || proof.build !== plan.build || !declared.has(proof.unitId) || credited.has(proof.unitId)) return outcome();
      credited.add(proof.unitId);
      deadline = observedNow + options.stallMs;
      return outcome(true);
    },
    expireIfDue() {
      if (!current()) return outcome();
      reconcileExpiry(options.now());
      return timeoutOutcome();
    },
    complete(successful: boolean) {
      if (!current()) return outcome();
      reconcileExpiry(options.now());
      if (phase === "timed_out" && (!successful || !options.canAcceptLateSuccess())) return timeoutOutcome();
      // A valid same-call late whole success takes priority over unissued timeout.
      phase = "finished";
      timeoutIssued = true;
      return outcome(true, "whole_result");
    },
    cancel() { phase = "finished"; timeoutIssued = true; return outcome(); },
  };
}
