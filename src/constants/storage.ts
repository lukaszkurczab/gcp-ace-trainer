export const STORAGE_KEYS = {
  ACTIVE_TRACK: "patternly:v1:activeTrack",
  ATTEMPTS: "patternly:v1:cloudCertification:attempts",
  PRACTICE_HISTORY: "patternly:v1:cloudCertification:practiceHistory",
  ACTIVE_EXAM_SESSION: "patternly:v1:cloudCertification:activeExamSession",
  QUESTION_REVIEW_STATE: "patternly:v1:cloudCertification:questionReviewState",
  TRAINING_SESSIONS: "patternly:v1:training:sessions",
  TRAINING_ATTEMPTS: "patternly:v1:training:attempts",
  TRAINING_REVIEW_QUEUE: "patternly:v1:training:reviewQueue",
  TRAINING_USER_PROGRESS: "patternly:v1:training:userProgress",
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;
export function getStorageReadKeys(keyName: StorageKeyName): readonly string[] { return [STORAGE_KEYS[keyName]]; }
export function getStorageClearKeys(keyName: StorageKeyName): readonly string[] { return [STORAGE_KEYS[keyName]]; }
