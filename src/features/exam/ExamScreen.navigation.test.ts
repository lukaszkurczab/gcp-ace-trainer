import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createExamActionLane } from "./examActionLane";
import { settleCommittedExamNavigation } from "./examNavigationRefresh";
import { shouldClearPendingExamWrite, type PendingExamWrite } from "./examPendingWrite";
import type { CertificationExamProjection } from "../../application/certification";

const screen = readFileSync("src/features/exam/ExamScreen.tsx", "utf8");

test("Certification Exam runner uses exact resume, route-keyed reads and expired result navigation", () => {
  assert.match(screen, /readOwner\.load\(token, route\.params\?\.expectedSessionId\)/);
  assert.match(screen, /readOwner\.begin\(requestKey\)/);
  assert.match(screen, /readOwner\.invalidate\(token\)/);
  assert.match(screen, /navigation\.replace\(ROUTES\.RESULT, \{ sessionId: outcome\.sessionId \}\)/);
  assert.match(screen, /Another session is active/);
  assert.match(screen, /Exam unavailable/);
});

test("exam response changes persist the canonical choice response before publishing the refreshed selection", () => {
  assert.match(screen, /saveCertificationExamResponse\(\{ occurrenceId: projection\.occurrenceId, response: \{ type: "choice_single", optionId \} \}\)/);
  assert.match(screen, /await refreshAfterAction\(token\)/);
  assert.match(screen, /accessibilityRole="radio"/);
  assert.match(screen, /accessibilityState=\{\{ checked: selected, disabled: actionPending \|\| resolutionRequired \}\}/);
  assert.match(screen, /if \(shouldClearPendingExamWrite\(attempted, refreshed\)\) setPendingExamWrite\(null\)/);
  assert.match(screen, /await retryCertificationExamDraftSave\(\)/);
  assert.match(screen, /<PracticeQuestionCard question=\{\{ constraints: projection\.question\.constraints, itemId: projection\.question\.questionId, prompt: projection\.question\.prompt \}\} \/>/);
});

test("an unavailable refresh after an uncertain exam save retains the attempted response until exact confirmation", () => {
  const write: PendingExamWrite = { kind: "response", occurrenceId: "occurrence-1", response: { type: "choice_single", optionId: "option-b" } };
  const unavailable = { kind: "unavailable", cause: new Error("read failed"), source: "interval" } as const;
  assert.equal(shouldClearPendingExamWrite(write, unavailable), false);

  const oldProjection = { draft: { responsesByOccurrenceId: {}, flaggedOccurrenceIds: [] }, operation: { kind: "save_failed", error: { allowedAction: "retry_same_command" } } } as unknown as CertificationExamProjection;
  assert.equal(shouldClearPendingExamWrite(write, { kind: "ready", projection: oldProjection }), false);

  const exactProjection = { draft: { responsesByOccurrenceId: { "occurrence-1": write.response }, flaggedOccurrenceIds: [] }, operation: { kind: "editable" } } as unknown as CertificationExamProjection;
  assert.equal(shouldClearPendingExamWrite(write, { kind: "ready", projection: exactProjection }), true);
  assert.match(screen, /pendingExamWrite && shouldClearPendingExamWrite\(pendingExamWrite, outcome\)/);
});

test("all exam draft writes and navigation share one in-flight action lane", async () => {
  const lane = createExamActionLane();
  let resolveFirst!: (value: string) => void;
  let secondRuns = 0;
  const first = lane.run(() => new Promise<string>((resolve) => { resolveFirst = resolve; }));

  assert.equal(lane.isBusy(), true);
  assert.deepEqual(await lane.run(async () => { secondRuns += 1; return "second"; }), { kind: "busy" });
  assert.equal(secondRuns, 0);

  resolveFirst("saved");
  assert.deepEqual(await first, { kind: "completed", value: "saved" });
  assert.equal(lane.isBusy(), false);
  assert.deepEqual(await lane.run(async () => "next action"), { kind: "completed", value: "next action" });
});

test("a durable navigator move closes the navigator while a failed projection read exposes retry", () => {
  const reportedFailures: string[] = [];
  const result = settleCommittedExamNavigation({ kind: "unavailable", cause: new Error("read failed") }, (failure) => {
    reportedFailures.push(failure.kind);
  });

  assert.equal(result, "navigated");
  assert.deepEqual(reportedFailures, ["unavailable"]);
  assert.match(screen, /kind: "refresh_error"/);
  assert.match(screen, /Retry exam refresh/);
  assert.match(screen, /retryExamRefresh/);
});

test("exam actions describe navigation and finish confirmation, including unanswered questions", () => {
  assert.match(screen, /Question navigator/);
  assert.match(screen, /Flag question/);
  assert.match(screen, /Previous/);
  assert.match(screen, /Next/);
  assert.match(screen, /Finish with unanswered questions\?/);
  assert.match(screen, /const unansweredCount = projection\.session\.itemOrder\.filter/);
  assert.match(screen, /runtimeSelectors\.simulation\.action\(projection\.session\.id, "finish"\)/);
  assert.match(screen, /answered: answered\.has\(item\.occurrenceId\)/);
});
