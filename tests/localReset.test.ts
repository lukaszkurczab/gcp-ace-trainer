import assert from "node:assert/strict";
import test from "node:test";

import {
  CLEAR_LOCAL_HISTORY_DETAIL,
  CLEAR_LOCAL_HISTORY_OPERATION_NAMES,
  clearPatternlyLocalHistory,
  type ClearLocalHistoryOperations,
} from "../src/features/home/localReset";

test("clear local history clears legacy and canonical local stores", async () => {
  const called: string[] = [];
  const operations = Object.fromEntries(
    CLEAR_LOCAL_HISTORY_OPERATION_NAMES.map((operationName) => [
      operationName,
      async () => {
        called.push(operationName);
      },
    ]),
  ) as ClearLocalHistoryOperations;

  await clearPatternlyLocalHistory(operations);

  assert.deepEqual(called.sort(), [...CLEAR_LOCAL_HISTORY_OPERATION_NAMES].sort());
});

test("clear local history copy covers progress and review data", () => {
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /practice/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /exams/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /review queue/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /progress/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /overrides/);
  assert.match(CLEAR_LOCAL_HISTORY_DETAIL, /active sessions/);
});
