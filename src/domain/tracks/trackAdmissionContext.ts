import type { TrackId } from "../learning/trackIdentity";
import type { GoalPolicyResolver } from "../goals/goalPolicy";

/** Trusted, explicitly supplied product-admission capability for track identities. */
export type TrackAdmissionContext = Readonly<{
  isAdmittedTrackId: (trackId: string) => boolean;
}>;

/** Combined, explicit program context for boundaries that validate track and goal semantics. */
export type LearningDataAdmissionContext = Readonly<{
  trackAdmission: TrackAdmissionContext;
  goalPolicyResolver: GoalPolicyResolver;
}>;

/** Guard-safe evaluation: malformed contexts and throwing predicates fail closed. */
export function isTrackAdmitted(context: TrackAdmissionContext, trackId: TrackId): boolean {
  try {
    return typeof context?.isAdmittedTrackId === "function" && context.isAdmittedTrackId(trackId) === true;
  } catch {
    return false;
  }
}
