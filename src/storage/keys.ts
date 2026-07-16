/** The only namespace for canonical user-owned records. */
const PREFIX = "patternly:canonical:v1:";
export const STORAGE_KEYS = {
  METADATA: `${PREFIX}metadata`,
  ACTIVE_TRACK: `${PREFIX}active-track`,
  ACTIVE_TRAINING_SESSION: `${PREFIX}active-training-session`,
  ACTIVE_TRAINING_SESSION_DRAFT: `${PREFIX}active-training-session-draft`,
  trainingSession: (id: string) => `${PREFIX}training-session:${id}`,
  TRAINING_SESSION_INDEX: `${PREFIX}training-session-index`,
  trainingAttempt: (id: string) => `${PREFIX}training-attempt:${id}`,
  TRAINING_ATTEMPT_INDEX: `${PREFIX}training-attempt-index`,
  reviewEntry: (id: string) => `${PREFIX}review-entry:${id}`,
  REVIEW_INDEX: `${PREFIX}review-index`,
  ACTIVE_SESSION_RUNTIME: `${PREFIX}active-session-runtime`,
  SETTINGS: `${PREFIX}settings`,
  ACTIVE_JOURNAL: `${PREFIX}journal:active`,
} as const;
export const STORAGE_NAMESPACE = PREFIX;
