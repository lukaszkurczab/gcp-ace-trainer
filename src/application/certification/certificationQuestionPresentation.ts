import { findTrackDescriptor, isSupportedTrackQuestionPresentation, type TrackBriefDescriptor, type TrackQuestionPresentation } from "../../domain/tracks/trackAdmission";
import { TrainingApplicationFailure } from "../trainingLifecycle/contracts";

/** Application boundary for the existing question layout, never a provider-ID fallback. */
export function projectCertificationQuestionPresentation(
  descriptor: Pick<TrackBriefDescriptor, "presentation"> | undefined,
): TrackQuestionPresentation {
  const presentation = descriptor?.presentation?.practiceQuestion;
  if (!presentation || !isSupportedTrackQuestionPresentation(presentation)) {
    throw new TrainingApplicationFailure("missing_content", "Practice interaction unavailable");
  }
  return Object.freeze({ ...presentation });
}

export function certificationQuestionPresentation(trackId: string): TrackQuestionPresentation {
  return projectCertificationQuestionPresentation(findTrackDescriptor(trackId));
}
