export const STORAGE_KEYS = {
  ACTIVE_TRACK: "patternly:v1:activeTrack",
  QUESTIONS: "patternly:v1:cloudCertification:questions",
  ATTEMPTS: "patternly:v1:cloudCertification:attempts",
  PRACTICE_HISTORY: "patternly:v1:cloudCertification:practiceHistory",
  ACTIVE_EXAM_SESSION: "patternly:v1:cloudCertification:activeExamSession",
  QUESTION_REVIEW_STATE: "patternly:v1:cloudCertification:questionReviewState",
  TRAINING_SESSIONS: "patternly:v1:training:sessions",
  TRAINING_ATTEMPTS: "patternly:v1:training:attempts",
  TRAINING_REVIEW_QUEUE: "patternly:v1:training:reviewQueue",
  TRAINING_USER_PROGRESS: "patternly:v1:training:userProgress"
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

export const LEGACY_STORAGE_KEYS: Partial<Record<StorageKeyName, string>> = {
  ACTIVE_TRACK: "patternly.activeTrack",
  QUESTIONS: "gcpAceTrainer.questions",
  ATTEMPTS: "gcpAceTrainer.attempts",
  PRACTICE_HISTORY: "gcpAceTrainer.practiceHistory",
  ACTIVE_EXAM_SESSION: "gcpAceTrainer.activeExamSession",
  QUESTION_REVIEW_STATE: "gcpAceTrainer.questionReviewState"
};

export function getStorageReadKeys(keyName: StorageKeyName): readonly string[] {
  const currentKey: string = STORAGE_KEYS[keyName];
  const legacyKey: string | undefined = LEGACY_STORAGE_KEYS[keyName];

  return legacyKey && legacyKey !== currentKey ? [currentKey, legacyKey] : [currentKey];
}

export function getStorageClearKeys(keyName: StorageKeyName): readonly string[] {
  return getStorageReadKeys(keyName);
}
