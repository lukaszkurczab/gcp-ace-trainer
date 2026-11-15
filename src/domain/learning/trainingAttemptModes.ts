/**
 * Kernel-level training mode identity. The learning kernel, envelope guards and
 * shared canonical mechanics classify attempts without loading the Coding
 * Interview family or the track registry; both re-export these values.
 */
export const CODING_INTERVIEW_TRACK_ID = "coding-interview-dsa-problem-solving";

export const APPROACH_CHALLENGE_MODE_ID = "coding-interview-approach-challenge" as const;

export const ALGORITHM_MODE_IDS = {
  learnApproach: "coding-interview-learn-approach",
  guidedPractice: "coding-interview-guided-practice",
  customPractice: "coding-interview-custom-practice",
  recognizePatterns: "coding-interview-recognize-patterns",
  contrastPractice: "coding-interview-contrast-practice",
  weakAreaReview: "coding-interview-weak-area-review",
  independentPractice: "coding-interview-independent-practice",
  interviewSimulation: "coding-interview-simulation",
} as const;

const ALGORITHM_MODE_ID_SET: ReadonlySet<string> = new Set(Object.values(ALGORITHM_MODE_IDS));

export type TrainingAttemptModeClass = "legacy" | "approach_challenge" | "unknown";

export function isApproachChallengeTrainingAttempt(trackId: string, modeId: string): boolean {
  return trackId === CODING_INTERVIEW_TRACK_ID && modeId === APPROACH_CHALLENGE_MODE_ID;
}

/** One canonical mode discriminator for legacy learning evidence boundaries. */
export function classifyTrainingAttemptMode(trackId: string, modeId: string): TrainingAttemptModeClass {
  if (isApproachChallengeTrainingAttempt(trackId, modeId)) return "approach_challenge";
  if (trackId !== CODING_INTERVIEW_TRACK_ID) return "legacy";
  return ALGORITHM_MODE_ID_SET.has(modeId) ? "legacy" : "unknown";
}
