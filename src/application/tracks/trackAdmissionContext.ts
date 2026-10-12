import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import type { LearningDataAdmissionContext, TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

/** Canonical production admission context; callers pass it to storage owners explicitly. */
export const productionTrackAdmissionContext: TrackAdmissionContext = Object.freeze({
  isAdmittedTrackId: isRegisteredTrackId,
});

/** Explicit canonical context for storage owners validating multi-track data and goal semantics. */
export const productionLearningDataAdmissionContext: LearningDataAdmissionContext = Object.freeze({
  trackAdmission: productionTrackAdmissionContext,
  goalPolicyResolver: requireGoalPolicy,
});
