import { learningPlanEditorCoordinator } from "./LearningPlanEditorCoordinator";
import {
  reconcileLearningPlanReminders,
  retryLearningPlanReminders,
  type LearningPlanReminderExpectedIdentity,
  type PracticeReminderCopy,
} from "../notificationPreferences";
import { expoNotificationPlatform } from "../../infrastructure/notifications/expoNotificationPlatform";
import {
  LearningPlanMutationRuntimeCore,
  type LearningPlanAcceptRuntimeResult,
  type LearningPlanCommitRuntimeResult,
  type LearningPlanMutationRuntimeDependencies,
  type LearningPlanSavedReminderResult,
} from "./learningPlanMutationRuntimeCore";
import type { TrackId } from "../../domain";

export type {
  LearningPlanAcceptRuntimeResult,
  LearningPlanCommitRuntimeResult,
  LearningPlanMutationRuntimeDependencies,
  LearningPlanSavedReminderResult,
} from "./learningPlanMutationRuntimeCore";
export { reminderExpectationFromSnapshot, reminderIdentityFromSnapshot } from "./learningPlanMutationRuntimeCore";
export type { LearningPlanReminderExpectedIdentity } from "../notificationPreferences";

function defaultDependencies(): LearningPlanMutationRuntimeDependencies {
  return {
    acceptProposal: (proposalId, trackId) => learningPlanEditorCoordinator.acceptProposal(proposalId, trackId),
    commit: (editorId, trackId) => learningPlanEditorCoordinator.commit(editorId, trackId),
    reconcile: (copy, expected) => reconcileLearningPlanReminders(expoNotificationPlatform, copy, expected),
    retry: (copy, expected) => retryLearningPlanReminders(expoNotificationPlatform, copy, expected),
  };
}

export class LearningPlanMutationRuntime extends LearningPlanMutationRuntimeCore {
  constructor(dependencies: LearningPlanMutationRuntimeDependencies = defaultDependencies()) {
    super(dependencies);
  }
}

export const learningPlanMutationRuntime = new LearningPlanMutationRuntime();

export function acceptPlanWithReminders(proposalId: string, trackId: TrackId, copy: PracticeReminderCopy): Promise<LearningPlanAcceptRuntimeResult> {
  return learningPlanMutationRuntime.acceptProposal(proposalId, trackId, copy);
}

export function commitPlanWithReminders(editorId: string, trackId: TrackId, copy: PracticeReminderCopy): Promise<LearningPlanCommitRuntimeResult> {
  return learningPlanMutationRuntime.commit(editorId, trackId, copy);
}

export function retryPlanReminders(copy: PracticeReminderCopy, expected?: LearningPlanReminderExpectedIdentity) {
  return learningPlanMutationRuntime.retryReminders(copy, expected);
}
