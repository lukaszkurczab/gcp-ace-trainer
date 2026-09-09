import { createContentPackagePin, type TrackId } from "../../domain";
import type {
  LearningPlanAcceptResult,
  LearningPlanEditorCommitResult,
  LearningPlanSnapshot,
} from "./LearningPlanEditorCoordinator";
import type { LearningPlanReminderExpectedIdentity, LearningPlanReminderResult, PracticeReminderCopy } from "../notificationPreferences";
import type { NotificationPlanIdentity } from "../../storage/repositories/notificationSettingsRepository";

export type LearningPlanSavedReminderResult =
  | Readonly<{ kind: "plan_saved_reminders_synced"; snapshot: LearningPlanSnapshot; reminder: LearningPlanReminderResult }>
  | Readonly<{ kind: "plan_saved_reminders_pending"; snapshot: LearningPlanSnapshot; reminder: LearningPlanReminderResult }>
  | Readonly<{ kind: "plan_saved_reminders_cleared"; snapshot: LearningPlanSnapshot; reminder: LearningPlanReminderResult }>;

export type LearningPlanAcceptRuntimeResult = Exclude<LearningPlanAcceptResult, { kind: "accepted" }> | LearningPlanSavedReminderResult;
export type LearningPlanCommitRuntimeResult = Exclude<LearningPlanEditorCommitResult, { kind: "saved" }> | LearningPlanSavedReminderResult;

export type LearningPlanMutationRuntimeDependencies = Readonly<{
  acceptProposal(proposalId: string, trackId: TrackId): Promise<LearningPlanAcceptResult>;
  commit(editorId: string, trackId: TrackId): Promise<LearningPlanEditorCommitResult>;
  reconcile(copy: PracticeReminderCopy, expected: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult>;
  retry(copy: PracticeReminderCopy, expected?: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult>;
}>;

export function reminderIdentityFromSnapshot(snapshot: LearningPlanSnapshot): NotificationPlanIdentity {
  return Object.freeze({
    trackId: snapshot.plan.trackId,
    goalRevision: snapshot.plan.goalRevision,
    planId: snapshot.plan.planId,
    planRevision: snapshot.plan.planRevision,
    storageRevision: snapshot.revision,
    commandId: snapshot.plan.commandId,
    timezone: snapshot.plan.timezone,
    contentVersion: snapshot.plan.contentVersion,
    contentPackagePin: createContentPackagePin(snapshot.plan.contentPackagePin),
  });
}

export function reminderExpectationFromSnapshot(snapshot: LearningPlanSnapshot): LearningPlanReminderExpectedIdentity {
  return Object.freeze({ trackId: snapshot.plan.trackId, identity: reminderIdentityFromSnapshot(snapshot) });
}

export function pendingSchedulerFailure(): LearningPlanReminderResult {
  return Object.freeze({ kind: "scheduler_failure", status: "pending" });
}

/** Pure plan-save/reminder-result composition. Platform wiring lives in the thin runtime adapter. */
export class LearningPlanMutationRuntimeCore {
  constructor(private readonly dependencies: LearningPlanMutationRuntimeDependencies) {}

  async acceptProposal(proposalId: string, trackId: TrackId, copy: PracticeReminderCopy): Promise<LearningPlanAcceptRuntimeResult> {
    let result: LearningPlanAcceptResult;
    try { result = await this.dependencies.acceptProposal(proposalId, trackId); } catch { return Object.freeze({ kind: "storage_error" as const }); }
    if (result.kind !== "accepted") return result;
    return this.finishSavedPlan(result.snapshot, copy);
  }

  async commit(editorId: string, trackId: TrackId, copy: PracticeReminderCopy): Promise<LearningPlanCommitRuntimeResult> {
    let result: LearningPlanEditorCommitResult;
    try { result = await this.dependencies.commit(editorId, trackId); } catch { return Object.freeze({ kind: "storage_error" as const }); }
    if (result.kind !== "saved") return result;
    return this.finishSavedPlan(result.snapshot, copy);
  }

  async retryReminders(copy: PracticeReminderCopy, expected?: LearningPlanReminderExpectedIdentity): Promise<LearningPlanReminderResult> {
    try { return await this.dependencies.retry(copy, expected); } catch { return pendingSchedulerFailure(); }
  }

  private async finishSavedPlan(snapshot: LearningPlanSnapshot, copy: PracticeReminderCopy): Promise<LearningPlanSavedReminderResult> {
    let reminder: LearningPlanReminderResult;
    try { reminder = await this.dependencies.reconcile(copy, reminderExpectationFromSnapshot(snapshot)); } catch { reminder = pendingSchedulerFailure(); }
    const kind = reminder.kind === "synced" || reminder.kind === "disabled"
      ? "plan_saved_reminders_synced"
      : reminder.status === "pending" ? "plan_saved_reminders_pending" : "plan_saved_reminders_cleared";
    return Object.freeze({ kind, snapshot, reminder });
  }
}
