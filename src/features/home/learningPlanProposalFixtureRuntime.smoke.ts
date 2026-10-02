import { generateLearningPlanProposal, type GoalSnapshot, type TrackId } from "../../domain";
import type { LearningPlanEditorStartResult } from "../../application/learningPlan/LearningPlanEditorCoordinator";
import type { LearningPlanAcceptRuntimeResult } from "../../application/learningPlan/learningPlanMutationRuntime";
import type { LearningPlanProposalResult } from "../../application/learningPlan/LearningPlanProposalCoordinator";
import type { LearningPlanReminderResult } from "../../application/notificationPreferences";
import type { LearningPlanProposalFixtureCase } from "./learningPlanProposalFixtureCommand";
import type { LearningPlanProposalFixtureAction, LearningPlanProposalScreenRuntime } from "./learningPlanProposalRuntime";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const PROPOSAL_ID = "ui11-fixture-proposal";
const ARTIFACT_SHA256 = "a".repeat(64);
const DELAY_MS = 3_000;

export function createLearningPlanProposalFixtureRuntime(scenario: LearningPlanProposalFixtureCase, onExit?: () => void): LearningPlanProposalScreenRuntime {
  const counts: Record<LearningPlanProposalFixtureAction, number> = {
    accept: 0, create: 0, "edit-proposal": 0, "edit-existing": 0, "retry-reminders": 0,
  };
  const increment = (action: LearningPlanProposalFixtureAction) => { counts[action] += 1; };
  const outcome = createOutcome(scenario);
  const result = scenario === "stale"
    ? Object.freeze({ kind: "stale" as const })
    : scenario === "unavailable"
      ? Object.freeze({ kind: "package_unavailable" as const })
      : Object.freeze({ kind: outcome.kind, proposal: Object.freeze({ proposalId: PROPOSAL_ID, trackId: TRACK_ID, outcome }) });

  const runtime: LearningPlanProposalScreenRuntime = Object.freeze({
    ...(onExit ? { exitFixture: onExit } : {}),
    async resolve(proposalId, trackId) {
      if (scenario === "delayed-loading") await delay(DELAY_MS);
      if (proposalId !== PROPOSAL_ID || trackId !== TRACK_ID) return Object.freeze({ kind: "stale" as const });
      return result;
    },
    async create() {
      increment("create");
      return result;
    },
    async startProposalEdit(proposalId, trackId): Promise<LearningPlanEditorStartResult> {
      increment("edit-proposal");
      if (proposalId !== PROPOSAL_ID || trackId !== TRACK_ID) return { kind: "stale", reason: "proposal" };
      if (scenario === "edit-storage") await delay(DELAY_MS);
      if (scenario === "edit-stale") return { kind: "stale", reason: "proposal" };
      return { kind: "storage_error" };
    },
    async startExistingEdit(): Promise<LearningPlanEditorStartResult> {
      increment("edit-existing");
      return { kind: "storage_error" };
    },
    async accept(proposalId, trackId): Promise<LearningPlanAcceptRuntimeResult> {
      increment("accept");
      if (proposalId !== PROPOSAL_ID || trackId !== TRACK_ID) return { kind: "stale", reason: "proposal" };
      if (scenario === "ready3-no-target") await delay(DELAY_MS);
      if (scenario === "accept-validation") return { kind: "validation_error", code: "invalid_schedule" };
      if (scenario === "accept-stale") return { kind: "stale", reason: "proposal" };
      return { kind: "storage_error" };
    },
    async retryReminders(): Promise<LearningPlanReminderResult> {
      increment("retry-reminders");
      return { kind: "scheduler_failure", status: "pending" };
    },
    getFixtureInvocationCounts: () => Object.freeze({ ...counts }),
  });
  return runtime;
}

function createOutcome(scenario: LearningPlanProposalFixtureCase) {
  const preferredDays = scenario === "ready1-target" ? ["mon"] as const
    : scenario === "ready7-target" ? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
      : ["mon", "wed", "sat"] as const;
  const qualityUnmet = scenario === "quality-unmet-target" || scenario === "quality-unmet-open-ended";
  const hasTarget = scenario === "ready1-target" || scenario === "ready7-target" || scenario === "quality-unmet-target";
  const goalSnapshot: GoalSnapshot = Object.freeze({
    record: Object.freeze({
      goalType: scenario === "ready7-target" ? "prepare_for_an_interview" : "build_foundations",
      preferredDays,
      status: "active",
      trackId: TRACK_ID,
      weeklySessionTarget: preferredDays.length,
      ...(hasTarget ? { targetDate: "2026-10-31" } : {}),
    }),
    revision: 1,
  });
  const capacity = scenario === "shortened"
    ? { kind: "shortened" as const, actualLength: 4, requestedLength: 10 }
    : scenario === "shortfall"
      ? { kind: "shortfall" as const, requestedLength: 10, eligibleItemCount: 2, missingItemCount: 8 }
      : { kind: "exact" as const, actualLength: 10 };
  return generateLearningPlanProposal({
    goalSnapshot,
    artifactSha256: ARTIFACT_SHA256,
    contentVersion: "ui11-runtime-fixture-v1",
    primaryModeId: "coding-interview-guided-practice",
    requestedLength: 10,
    sessionCapacity: capacity,
    // Explicit presentation fixture only: actual production rules remain package-owned/absent.
    completionState: qualityUnmet
      ? { kind: "in_progress" as const, qualifyingAttemptCount: 25, requiredAttemptCount: 20, rollingWindowSize: 10 }
      : hasTarget
      ? { kind: "in_progress" as const, qualifyingAttemptCount: 0, requiredAttemptCount: 1, rollingWindowSize: 1 }
      : { kind: "unknown" as const },
    dueReviewCount: 0,
    primaryScopeLabel: "UI11 fixture scope",
    localToday: "2026-09-30",
    timezone: "Europe/Warsaw",
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
