import assert from "node:assert/strict";
import test from "node:test";

import type { CertificationPracticeReviewItem } from "../../application/certification";
import { buildCertificationPracticeReviewControl, certificationPracticeReviewOptionState, commitManualReviewAndReadback } from "./certificationPracticeReviewPresentation";

function item(input: Readonly<{ correctOptionIds: readonly string[]; selectedOptionIds: readonly string[]; selectionMode: "single" | "multiple" }>): CertificationPracticeReviewItem {
  return {
    constraints: [],
    correctOptionIds: input.correctOptionIds,
    details: { text: "Explanation" },
    item: { artifactSha256: "a".repeat(64), contentVersion: "test", questionId: "q1", trackId: "claude-certified-architect-professional-certification" },
    occurrenceId: "q1:1",
    options: [
      { optionId: "a", text: "A" },
      { optionId: "b", text: "B" },
      { optionId: "c", text: "C" },
      { optionId: "d", text: "D" },
    ],
    ordinal: 1,
    prompt: "Question",
    questionId: "q1",
    reason: "Reason",
    result: "incorrect",
    selectedOptionIds: input.selectedOptionIds,
    sourceAttemptId: "attempt:q1",
    selectionMode: input.selectionMode,
  };
}

test("completed single-select review distinguishes the learner answer from the omitted correct answer", () => {
  assert.deepEqual(buildCertificationPracticeReviewControl(item({ correctOptionIds: ["a"], selectedOptionIds: ["b"], selectionMode: "single" })).options.map(({ id, state }) => ({ id, state })), [
    { id: "a", state: "omitted_correct" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "not_selected" },
    { id: "d", state: "not_selected" },
  ]);
});

test("completed multi-select review preserves every selected, correct and omitted state", () => {
  assert.deepEqual(buildCertificationPracticeReviewControl(item({ correctOptionIds: ["a", "c"], selectedOptionIds: ["a", "b"], selectionMode: "multiple" })).options.map(({ id, state }) => ({ id, state })), [
    { id: "a", state: "correct" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "omitted_correct" },
    { id: "d", state: "not_selected" },
  ]);
  assert.equal(certificationPracticeReviewOptionState(true, true), "correct");
});

test("manual-review ACK publishes pending before its readback and treats read failure as unavailable", async () => {
  const events: string[] = [];
  let rejectRead!: (error: Error) => void;
  let signalRead!: () => void;
  const readGate = new Promise<never>((_resolve, reject) => { rejectRead = reject; });
  const readStarted = new Promise<void>((resolve) => { signalRead = resolve; });
  const pending = commitManualReviewAndReadback({
    commit: async () => { events.push("commit-ack"); },
    onCommitted: () => { events.push("pending"); },
    readback: () => { events.push("readback"); signalRead(); return readGate; },
    isCurrent: () => true,
  });
  await readStarted;
  assert.deepEqual(events, ["commit-ack", "pending", "readback"]);
  rejectRead(new Error("storage read failed"));
  assert.deepEqual(await pending, { kind: "unavailable" });
});

test("manual-review success publishes only the confirmed readback", async () => {
  const events: string[] = [];
  const result = await commitManualReviewAndReadback({
    commit: async () => { events.push("commit-ack"); },
    onCommitted: () => { events.push("pending"); },
    readback: async () => { events.push("readback"); return ["confirmed-entry"]; },
    isCurrent: () => true,
  });
  assert.deepEqual(events, ["commit-ack", "pending", "readback"]);
  assert.deepEqual(result, { kind: "ready", value: ["confirmed-entry"] });
});

test("manual-review commit failure remains a save failure and never reads back", async () => {
  const events: string[] = [];
  const result = await commitManualReviewAndReadback({
    commit: async () => { events.push("commit"); throw new Error("durable commit rejected"); },
    onCommitted: () => { events.push("pending"); },
    readback: async () => { events.push("readback"); return []; },
    isCurrent: () => true,
  });
  assert.deepEqual(result, { kind: "commit_failed" });
  assert.deepEqual(events, ["commit"]);
});

test("manual-review readback from a replaced route, profile, or occurrence cannot publish", async () => {
  for (const replacedContext of ["route", "profile", "occurrence"] as const) {
    const context = { route: "session:A", profile: "profile:A", occurrence: "occurrence:A" };
    let releaseRead!: (value: readonly string[]) => void;
    const readGate = new Promise<readonly string[]>((resolve) => { releaseRead = resolve; });
    const pending = commitManualReviewAndReadback({
      commit: async () => undefined,
      onCommitted: () => undefined,
      readback: () => readGate,
      isCurrent: () => context[replacedContext] === `${replacedContext}:A`,
    });
    context[replacedContext] = `${replacedContext}:B`;
    releaseRead(["stale"]);
    assert.deepEqual(await pending, { kind: "stale" }, `${replacedContext} changes must fence the old readback`);
  }
});
