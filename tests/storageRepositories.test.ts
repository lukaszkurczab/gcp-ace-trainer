import AsyncStorage from "@react-native-async-storage/async-storage";
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
} from "../src/domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingSession,
  UserProgress,
} from "../src/domain/training";
import { STORAGE_KEYS } from "../src/storage/keys";
import {
  addReviewQueueItems,
  addTrainingAttempt,
  clearReviewQueueItems,
  clearTrainingSessions,
  getAllUserProgress,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessions,
  getUserProgressByTrack,
  saveTrainingSessions,
  saveUserProgress,
} from "../src/storage/repositories";

const memoryStorage = new Map<string, string>();

beforeEach(() => {
  memoryStorage.clear();
  patchAsyncStorage();
});

test("missing training sessions read as an empty successful list", async () => {
  const result = await getTrainingSessions();

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, []);
  assert.equal(result.issues, undefined);
});

test("corrupt training sessions produce an observable issue and safe fallback", async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.TRAINING_SESSIONS, "{");

  const result = await getTrainingSessions();

  assert.equal(result.ok, false);
  assert.deepEqual(result.value, []);
  assert.equal(result.issues[0]?.operation, "parse");
  assert.equal(result.issues[0]?.key, STORAGE_KEYS.TRAINING_SESSIONS);
});

test("saving, reading, and clearing training sessions works", async () => {
  const session = makeTrainingSession("session-storage-001");

  const saved = await saveTrainingSessions([session]);
  const read = await getTrainingSessions();
  const cleared = await clearTrainingSessions();
  const readAfterClear = await getTrainingSessions();

  assert.equal(saved.ok, true);
  assert.deepEqual(read.value, [session]);
  assert.equal(cleared.ok, true);
  assert.deepEqual(readAfterClear.value, []);
});

test("adding a training attempt preserves existing attempts", async () => {
  const existing = makeTrainingAttempt("attempt-existing-001");
  const added = makeTrainingAttempt("attempt-added-001");

  await addTrainingAttempt(existing);
  const result = await addTrainingAttempt(added);
  const read = await getTrainingAttempts();

  assert.equal(result.ok, true);
  assert.deepEqual(
    read.value.map((attempt) => attempt.id),
    ["attempt-added-001", "attempt-existing-001"],
  );
});

test("review queue repository can add multiple review items and clear them", async () => {
  const first = makeReviewQueueItem("review-storage-001", "attempt-storage-001");
  const second = makeReviewQueueItem("review-storage-002", "attempt-storage-002");

  const added = await addReviewQueueItems([first, second]);
  const read = await getReviewQueueItems();
  const cleared = await clearReviewQueueItems();

  assert.equal(added.ok, true);
  assert.deepEqual(
    read.value.map((item) => item.id),
    ["review-storage-001", "review-storage-002"],
  );
  assert.equal(cleared.ok, true);
});

test("user progress repository can save and read progress per track", async () => {
  const cloudProgress = makeUserProgress("user-progress-cloud", CLOUD_CERTIFICATION_TRACK_ID);
  const algorithmsProgress = makeUserProgress("user-progress-algorithms", ALGORITHMS_TRACK_ID);

  await saveUserProgress(cloudProgress);
  await saveUserProgress(algorithmsProgress);

  const allProgress = await getAllUserProgress();
  const cloudResult = await getUserProgressByTrack(CLOUD_CERTIFICATION_TRACK_ID);
  const algorithmsResult = await getUserProgressByTrack(ALGORITHMS_TRACK_ID);

  assert.equal(allProgress.ok, true);
  assert.deepEqual(
    allProgress.value.map((progress) => progress.trackId),
    [ALGORITHMS_TRACK_ID, CLOUD_CERTIFICATION_TRACK_ID],
  );
  assert.equal(cloudResult.value?.userId, "user-progress-cloud");
  assert.equal(algorithmsResult.value?.userId, "user-progress-algorithms");
});

test("invalid stored shapes are rejected with observable issues", async () => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.TRAINING_SESSIONS,
    JSON.stringify([{ id: "invalid-session" }]),
  );

  const result = await getTrainingSessions();

  assert.equal(result.ok, false);
  assert.deepEqual(result.value, []);
  assert.equal(result.issues[0]?.message, "Stored local data has an invalid shape.");
});

test("repository write errors are observable", async () => {
  patchAsyncStorage({
    setItem: async () => {
      throw new Error("storage unavailable");
    },
  });

  const result = await saveTrainingSessions([makeTrainingSession("session-write-error")]);

  assert.equal(result.ok, false);
  assert.equal(result.issues[0]?.operation, "write");
  assert.equal(result.issues[0]?.message, "storage unavailable");
});

function patchAsyncStorage(overrides: Partial<typeof AsyncStorage> = {}): void {
  Object.assign(AsyncStorage, {
    getItem: async (key: string) => memoryStorage.get(key) ?? null,
    removeItem: async (key: string) => {
      memoryStorage.delete(key);
    },
    setItem: async (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    ...overrides,
  });
}

function makeTrainingSession(id: string): TrainingSession {
  return {
    currentItemIndex: 0,
    id,
    itemRefs: [
      {
        itemId: "training-item-storage-001",
        itemType: "single_choice_question",
        trackId: CLOUD_CERTIFICATION_TRACK_ID,
      },
    ],
    modeId: "cloud-practice",
    startedAt: "2026-06-29T10:00:00.000Z",
    status: "active",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

function makeTrainingAttempt(id: string): TrainingAttempt {
  return {
    answeredAt: "2026-06-29T10:05:00.000Z",
    id,
    itemId: "training-item-storage-001",
    itemType: "single_choice_question",
    modeId: "cloud-practice",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    },
    sessionId: "session-storage-001",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

function makeReviewQueueItem(id: string, sourceAttemptId: string): ReviewQueueItem {
  return {
    createdAt: "2026-06-29T10:05:00.000Z",
    dueAt: "2026-06-30T10:05:00.000Z",
    id,
    itemId: "training-item-storage-001",
    priority: "high",
    reasons: ["incorrect_attempt"],
    sourceAttemptId,
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

function makeUserProgress(userId: string, trackId: UserProgress["trackId"]): UserProgress {
  return {
    completedSessionCount: 1,
    evidenceSignals: [
      {
        count: 1,
        type: "attempts_count",
      },
    ],
    reviewQueue: {
      dueCount: 1,
      highPriorityDueCount: 1,
      nextDueAt: "2026-06-30T10:05:00.000Z",
      overdueCount: 0,
      upcomingCount: 0,
    },
    taxonomyProgress: [
      {
        attemptsCount: 1,
        dueReviewCount: 1,
        evidenceLevel: "emerging",
        taxonomyRef: {
          axisId: trackId === CLOUD_CERTIFICATION_TRACK_ID ? "cloud-domain" : "algorithm-pattern",
          nodeId: trackId === CLOUD_CERTIFICATION_TRACK_ID ? "operations" : "two_pointers",
          role: "primary",
          trackId,
        },
        updatedAt: "2026-06-29T10:05:00.000Z",
      },
    ],
    trackId,
    updatedAt: "2026-06-29T10:05:00.000Z",
    userId,
  };
}
