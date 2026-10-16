/** Native visual smoke only: in-memory read ports, no profile/storage/SDK bootstrap. */
export { useAppPreferences, useThemedStyles } from '../../../src/preferences/appPreferencesContext';
export { presentTargetDateGuidance } from '../../../src/application/learningPlan/targetDateGuidancePresentation';
import { createDefaultGoal, getTrackDisplay } from '../../../src/domain';
import { requireGoalPolicy } from '../../../src/domain/tracks/trackGoalPolicies';
export const trackId = 'aws-certified-solutions-architect-associate' as const;
export const fixture = { secondary: false, reviewReads: 0, cadenceReads: 0 };
const delay = () => new Promise(resolve => setTimeout(resolve, 650));
export const captureProfileReadFence = () => () => {};
export const getActiveTrackId = async () => trackId;
export const loadActiveTrackId = getActiveTrackId;
export async function loadGoal() {
  await delay();
  if (++fixture.cadenceReads === 1) throw Error('fixture_read_failure');
  return createDefaultGoal(requireGoalPolicy(trackId));
}
export const loadLearningPlan = async () => null;
export async function loadTrackReviewQueueViewModel() {
  await delay();
  if (++fixture.reviewReads === 1) throw Error('fixture_read_failure');
  return { degraded: false, dueItems: [], overdueItems: [], upcomingItems: [], unavailableItems: [], issues: [], ok: true, totalItems: 0, trackTitle: getTrackDisplay(trackId).title };
}
const forbidden = () => { throw Error('fixture_write_forbidden'); };
export const removeUnavailableReview = forbidden;
export const persistGoalPlanStatus = forbidden;
export const reconcileDeviceReminder = forbidden;
export const reminderNeedsAttention = () => false;
export const learningPlanProposalCoordinator = { create: forbidden };
export const useNotificationSettings = () => ({ loading: false, trackId, status: 'disabled', refresh: forbidden });
export const getApplicationCurrentTime = () => '2026-10-15T10:00:00Z';
export const contentPackageRuntimeOwner = { getPreparedDiscovery: () => ({ track: { trackId } }) };
export const selectSingleCase = () => fixture.secondary ? { recipe: { caseId: 'smoke', title: 'Smoke case', steps: [1], initialEstimatedSeconds: 60 }, nodeId: 'smoke' } : null;
export const hasClaudeDueReview = () => false;
export const homePlanPlacement = (input: { hasActiveSession: boolean; hasPracticeRecommendation: boolean; planKind?: string }) => input.hasActiveSession ? 'hidden' : input.hasPracticeRecommendation ? 'secondary' : 'primary';
export const buildHomeTabModel = () => ({ recommendations: [], heroTitle: 'Learning', heroSubtitle: 'Practice', primaryLabel: 'Start', topicId: 'smoke' });
