import AsyncStorage from "@react-native-async-storage/async-storage";
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import type { ReviewQueueItem, TrainingAttempt } from "../src/domain/training";
import { STORAGE_KEYS } from "../src/storage/keys";
import {
  saveReviewQueueItems,
  saveTrainingAttempts,
} from "../src/storage/repositories";
import {
  buildCloudCertificationProgressViewModel,
  buildCloudCertificationReviewViewModel,
  createCloudCertificationContentAdapter,
  loadCloudCertificationProgressViewModel,
  loadCloudCertificationReviewViewModel,
} from "../src/tracks";
import { makeQuestion } from "./fixtures";

const memoryStorage = new Map<string, string>();

beforeEach(() => {
  memoryStorage.clear();
  patchAsyncStorage();
});

test("progress selector returns an empty concrete view model when no canonical attempts exist", async () => {
  const viewModel = await loadCloudCertificationProgressViewModel({
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(viewModel.ok, true);
  assert.equal(viewModel.degraded, false);
  assert.equal(viewModel.totalAttempts, 0);
  assert.equal(viewModel.practiceAttemptCount, 0);
  assert.equal(viewModel.examAttemptCount, 0);
  assert.deepEqual(viewModel.firstAttemptAccuracy, {
    correct: 0,
    percent: 0,
    total: 0,
  });
  assert.deepEqual(viewModel.taxonomyPerformance, []);
  assert.deepEqual(viewModel.repeatedMistakeTypes, []);
});

test("progress selector counts practice and exam attempts separately", () => {
  const viewModel = buildCloudCertificationProgressViewModel({
    attempts: [
      makeTrainingAttempt("attempt-practice-001", {
        modeId: "cloud-practice",
      }),
      makeTrainingAttempt("attempt-exam-001", {
        modeId: "cloud-exam-simulation",
      }),
    ],
  });

  assert.equal(viewModel.totalAttempts, 2);
  assert.equal(viewModel.practiceAttemptCount, 1);
  assert.equal(viewModel.examAttemptCount, 1);
});

test("progress selector derives correct, incorrect, and partial counts", () => {
  const viewModel = buildCloudCertificationProgressViewModel({
    attempts: [
      makeTrainingAttempt("attempt-correct-001", {
        result: {
          isCorrect: true,
          kind: "correctness",
        },
      }),
      makeTrainingAttempt("attempt-incorrect-001", {
        result: {
          isCorrect: false,
          kind: "correctness",
        },
      }),
      makeTrainingAttempt("attempt-partial-001", {
        result: {
          earnedPoints: 1,
          isCorrect: false,
          kind: "partial_credit",
          maxPoints: 2,
        },
      }),
    ],
  });

  assert.equal(viewModel.correctCount, 1);
  assert.equal(viewModel.incorrectCount, 1);
  assert.equal(viewModel.partialCount, 1);
  assert.deepEqual(viewModel.firstAttemptAccuracy, {
    correct: 1,
    percent: 33,
    total: 3,
  });
});

test("progress selector derives domain and topic counts through content adapter item joins", () => {
  const firstQuestion = makeQuestion({
    domain: "operations",
    id: "selector-taxonomy-001",
    tags: ["logging", "monitoring"],
  });
  const secondQuestion = makeQuestion({
    domain: "access_security",
    id: "selector-taxonomy-002",
    tags: ["iam"],
  });
  const contentAdapter = createCloudCertificationContentAdapter([firstQuestion, secondQuestion]);

  const viewModel = buildCloudCertificationProgressViewModel({
    attempts: [
      makeTrainingAttempt("attempt-taxonomy-001", {
        itemId: firstQuestion.id,
        result: {
          isCorrect: false,
          kind: "correctness",
        },
      }),
      makeTrainingAttempt("attempt-taxonomy-002", {
        itemId: firstQuestion.id,
        result: {
          isCorrect: true,
          kind: "correctness",
        },
      }),
      makeTrainingAttempt("attempt-taxonomy-003", {
        itemId: secondQuestion.id,
        result: {
          isCorrect: true,
          kind: "correctness",
        },
      }),
    ],
    contentAdapter,
  });

  const operations = viewModel.taxonomyPerformance.find(
    (score) => score.axisId === "cloud-domain" && score.nodeId === "operations",
  );
  const logging = viewModel.taxonomyPerformance.find(
    (score) => score.axisId === "cloud-topic" && score.nodeId === "logging",
  );

  assert.equal(operations?.totalAttempts, 2);
  assert.equal(operations?.correctCount, 1);
  assert.equal(operations?.percent, 50);
  assert.equal(logging?.totalAttempts, 2);
});

test("progress selector derives repeated mistake type counts from attempt mistake refs", () => {
  const viewModel = buildCloudCertificationProgressViewModel({
    attempts: [
      makeTrainingAttempt("attempt-mistake-001", {
        mistakeTypeNodeId: "confused_services",
      }),
      makeTrainingAttempt("attempt-mistake-002", {
        mistakeTypeNodeId: "confused_services",
      }),
      makeTrainingAttempt("attempt-mistake-003", {
        mistakeTypeNodeId: "rushed",
      }),
    ],
  });

  assert.deepEqual(
    viewModel.repeatedMistakeTypes.map((item) => [item.taxonomyRef.nodeId, item.count]),
    [
      ["confused_services", 2],
      ["rushed", 1],
    ],
  );
});

test("progress selector does not expose readiness or retention percentages", () => {
  const viewModel = buildCloudCertificationProgressViewModel({
    attempts: [],
  });

  assert.equal("readinessPercent" in viewModel, false);
  assert.equal("retentionPercent" in viewModel, false);
  assert.equal("examPassPrediction" in viewModel, false);
});

test("review selector returns due and high-priority items from canonical review queue", () => {
  const viewModel = buildCloudCertificationReviewViewModel({
    now: "2026-06-29T12:00:00.000Z",
    reviewQueueItems: [
      makeReviewQueueItem("review-overdue-001", {
        dueAt: "2026-06-28T12:00:00.000Z",
        priority: "high",
      }),
      makeReviewQueueItem("review-upcoming-001", {
        dueAt: "2026-06-30T12:00:00.000Z",
        priority: "normal",
      }),
    ],
  });

  assert.equal(viewModel.totalItems, 2);
  assert.deepEqual(viewModel.dueItems.map((item) => item.id), ["review-overdue-001"]);
  assert.deepEqual(viewModel.overdueItems.map((item) => item.id), ["review-overdue-001"]);
  assert.deepEqual(viewModel.upcomingItems.map((item) => item.id), ["review-upcoming-001"]);
  assert.deepEqual(viewModel.highPriorityItems.map((item) => item.id), ["review-overdue-001"]);
});

test("review selector joins canonical review item to Cloud content prompt and taxonomy", async () => {
  const question = makeQuestion({
    domain: "operations",
    id: "review-join-question-001",
    question: "Which tool should inspect Cloud Logging entries?",
    tags: ["logging"],
  });
  const contentAdapter = createCloudCertificationContentAdapter([question]);

  await saveReviewQueueItems([
    makeReviewQueueItem("review-join-001", {
      itemId: question.id,
      mistakeTypeNodeId: "confused_services",
    }),
  ]);

  const viewModel = await loadCloudCertificationReviewViewModel({
    contentAdapter,
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(viewModel.ok, true);
  assert.equal(viewModel.dueItems[0]?.prompt, question.question);
  assert.deepEqual(
    viewModel.dueItems[0]?.taxonomyRefs.map((ref) => `${ref.axisId}:${ref.nodeId}`),
    ["cloud-domain:operations", "cloud-topic:logging", "cloud-mistake-type:confused_services"],
  );
  assert.deepEqual(
    viewModel.dueItems[0]?.mistakeTypeRefs.map((ref) => `${ref.axisId}:${ref.nodeId}`),
    ["cloud-mistake-type:confused_services"],
  );
});

test("selector result degrades and includes repository issues for corrupt canonical data", async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.TRAINING_ATTEMPTS, "{");

  const viewModel = await loadCloudCertificationProgressViewModel({
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(viewModel.ok, false);
  assert.equal(viewModel.degraded, true);
  assert.equal(viewModel.totalAttempts, 0);
  assert.equal(viewModel.issues[0]?.key, STORAGE_KEYS.TRAINING_ATTEMPTS);
  assert.equal(viewModel.issues[0]?.operation, "parse");
});

test("progress loader reads canonical repositories for attempts and review queue counts", async () => {
  await saveTrainingAttempts([
    makeTrainingAttempt("attempt-loader-001", {
      answeredAt: "2026-06-29T10:00:00.000Z",
      itemId: "selector-loader-001",
      result: {
        isCorrect: false,
        kind: "correctness",
      },
    }),
  ]);
  await saveReviewQueueItems([
    makeReviewQueueItem("review-loader-001", {
      dueAt: "2026-06-29T11:00:00.000Z",
      itemId: "selector-loader-001",
      priority: "high",
    }),
  ]);

  const viewModel = await loadCloudCertificationProgressViewModel({
    now: "2026-06-29T12:00:00.000Z",
  });

  assert.equal(viewModel.totalAttempts, 1);
  assert.equal(viewModel.dueReviewCount, 1);
  assert.equal(viewModel.highPriorityReviewCount, 1);
});

function makeTrainingAttempt(
  id: string,
  overrides: {
    answeredAt?: string;
    itemId?: string;
    mistakeTypeNodeId?: string;
    modeId?: string;
    result?: TrainingAttempt["result"];
  } = {},
): TrainingAttempt {
  return {
    answeredAt: overrides.answeredAt ?? "2026-06-29T10:00:00.000Z",
    id,
    itemId: overrides.itemId ?? id,
    itemType: "single_choice_question",
    mistakeTypeRefs: overrides.mistakeTypeNodeId
      ? [
          {
            axisId: "cloud-mistake-type",
            nodeId: overrides.mistakeTypeNodeId,
            role: "mistake_type",
            trackId: "cloud-certification",
          },
        ]
      : undefined,
    modeId: overrides.modeId ?? "cloud-practice",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["a"],
    },
    result: overrides.result ?? {
      isCorrect: true,
      kind: "correctness",
    },
    trackId: "cloud-certification",
  };
}

function makeReviewQueueItem(
  id: string,
  overrides: {
    dueAt?: string;
    itemId?: string;
    mistakeTypeNodeId?: string;
    priority?: ReviewQueueItem["priority"];
  } = {},
): ReviewQueueItem {
  return {
    createdAt: "2026-06-29T10:00:00.000Z",
    dueAt: overrides.dueAt ?? "2026-06-29T11:00:00.000Z",
    id,
    itemId: overrides.itemId ?? "review-item-001",
    mistakeTypeRefs: overrides.mistakeTypeNodeId
      ? [
          {
            axisId: "cloud-mistake-type",
            nodeId: overrides.mistakeTypeNodeId,
            role: "mistake_type",
            trackId: "cloud-certification",
          },
        ]
      : undefined,
    priority: overrides.priority ?? "high",
    reasons: ["incorrect_attempt"],
    sourceAttemptId: `attempt:${id}`,
    trackId: "cloud-certification",
  };
}

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
