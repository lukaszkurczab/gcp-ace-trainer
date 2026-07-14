const PREFIX = "patternly:v1:";
export const STORAGE_KEYS = {
  ACTIVE_TRACK: `${PREFIX}active-track`,
  ACTIVE_TRAINING_SESSION: `${PREFIX}active-training-session`,
  trainingSession: (id: string) => `${PREFIX}training-session:${id}`,
  TRAINING_SESSION_INDEX: `${PREFIX}training-session-index`,
  trainingAttempt: (id: string) => `${PREFIX}training-attempt:${id}`,
  TRAINING_ATTEMPT_INDEX: `${PREFIX}training-attempt-index`,
  reviewEntry: (id: string) => `${PREFIX}review-entry:${id}`,
  REVIEW_INDEX: `${PREFIX}review-index`,
  ACTIVE_CERTIFICATION_EXAM: `${PREFIX}active-certification-exam`,
  SETTINGS: `${PREFIX}settings`,
  ACTIVE_JOURNAL: `${PREFIX}journal:active`,
  contentActive: (trackId: string) => `${PREFIX}content:active:${trackId}`,
  contentVersion: (trackId: string, version: string) => `${PREFIX}content:version:${trackId}:${version}`,
} as const;
export const STORAGE_NAMESPACE = PREFIX;
