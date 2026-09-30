import type { LearningPlanProposalResult } from "../../application/learningPlan";
import type { LearningPlanEditorStartResult } from "../../application/learningPlan/LearningPlanEditorCoordinator";
import type { LearningPlanReminderResult, PracticeReminderCopy } from "../../application/notificationPreferences";
import type { LearningPlanAcceptRuntimeResult } from "../../application/learningPlan/learningPlanMutationRuntime";
import type { TrackId } from "../../domain";
import { learningPlanEditorCoordinator, learningPlanProposalCoordinator } from "../../application/learningPlan";
import { acceptPlanWithReminders, retryPlanReminders } from "../../application/learningPlan/learningPlanMutationRuntime";

export type LearningPlanProposalFixtureAction = "accept" | "create" | "edit-proposal" | "edit-existing" | "retry-reminders";
export type LearningPlanProposalFixtureCounts = Readonly<Record<LearningPlanProposalFixtureAction, number>>;

export type LearningPlanProposalScreenRuntime = Readonly<{
  exitFixture?(): void;
  resolve(proposalId: string, trackId: TrackId): Promise<LearningPlanProposalResult>;
  create(trackId: TrackId): Promise<LearningPlanProposalResult>;
  startProposalEdit(proposalId: string, trackId: TrackId): Promise<LearningPlanEditorStartResult>;
  startExistingEdit(trackId: TrackId): Promise<LearningPlanEditorStartResult>;
  accept(proposalId: string, trackId: TrackId, copy: PracticeReminderCopy): Promise<LearningPlanAcceptRuntimeResult>;
  retryReminders(copy: PracticeReminderCopy): Promise<LearningPlanReminderResult>;
  getFixtureInvocationCounts?(): LearningPlanProposalFixtureCounts;
}>;

export const productionLearningPlanProposalRuntime: LearningPlanProposalScreenRuntime = Object.freeze({
  resolve: (proposalId, trackId) => learningPlanProposalCoordinator.resolve(proposalId, trackId),
  create: (trackId) => learningPlanProposalCoordinator.create(trackId),
  startProposalEdit: (proposalId, trackId) => learningPlanEditorCoordinator.startProposalEdit(proposalId, trackId),
  startExistingEdit: (trackId) => learningPlanEditorCoordinator.startExistingEdit(trackId),
  accept: (proposalId, trackId, copy) => acceptPlanWithReminders(proposalId, trackId, copy),
  retryReminders: (copy) => retryPlanReminders(copy),
});
