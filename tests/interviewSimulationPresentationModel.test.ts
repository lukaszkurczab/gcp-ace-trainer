import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatSimulationItemProgress,
  formatSimulationQuestionCounts,
  getSimulationProgress,
  getSimulationTimerTone,
  readSimulationReviewDetail,
  readSimulationReviewRows,
  readSimulationTerminal,
  simulationCompletionLabel,
  type SimulationTerminalController,
} from "../src/features/algorithms/interviewSimulation/model";

test("simulation presentation helpers clamp progress and retain the 1-based item label", () => {
  assert.equal(formatSimulationItemProgress(-4, 40), "1 of 40");
  assert.equal(formatSimulationItemProgress(99, 40), "40 of 40");
  assert.equal(formatSimulationItemProgress(0, 0), "0 of 0");
  assert.equal(getSimulationProgress(-4, 40), 0);
  assert.equal(getSimulationProgress(99, 40), 1);
  assert.equal(getSimulationProgress(0, 0), 0);
});

test("simulation presentation helpers expose the approved timer urgency boundaries", () => {
  assert.equal(getSimulationTimerTone(10 * 60 * 1000 + 1), "normal");
  assert.equal(getSimulationTimerTone(10 * 60 * 1000), "warning");
  assert.equal(getSimulationTimerTone(5 * 60 * 1000 + 1), "warning");
  assert.equal(getSimulationTimerTone(5 * 60 * 1000), "critical");
  assert.equal(getSimulationTimerTone(0), "critical");
});

test("simulation presentation helpers label submitted, unanswered, and flagged counts without semantics", () => {
  assert.equal(
    formatSimulationQuestionCounts({ answered: 18, flagged: 5, total: 40, unanswered: 22 }),
    "18 answered, 22 unanswered, 5 flagged",
  );
});

test("terminal presentation rejects pre-finalization and reads filter/detail only through the controller", () => {
  const prefinalization = {
    getState: () => ({ status: "active", terminal: null, failure: null }),
    getReviewDetail: () => { throw new Error("must not read review before finalization"); },
    getReviewRows: () => { throw new Error("must not read review before finalization"); },
  } as unknown as SimulationTerminalController;
  assert.equal(readSimulationTerminal(prefinalization).kind, "unavailable");
  assert.equal(readSimulationReviewRows(prefinalization, "all").kind, "unavailable");

  const row = {
    occurrenceId: "occurrence:1", index: 0, itemId: "item:1", mentalUnitId: "arrays_and_strings", prompt: "prompt", title: null,
    questionType: "single_choice", result: "incorrect", flagged: true,
    selectedResponse: { kind: "choice", optionIds: ["wrong"] }, correctResponse: { kind: "choice", optionIds: ["right"] }, reason: "reason", details: "details",
  } as const;
  const terminal = { sessionId: "session:1" };
  const finalized = {
    getState: () => ({ status: "terminal", terminal, failure: null }),
    getReviewRows: (filter: string) => filter === "flagged" ? [row] : [],
    getReviewDetail: (occurrenceId: string) => {
      if (occurrenceId !== row.occurrenceId) throw new Error("missing occurrence");
      return row;
    },
  } as unknown as SimulationTerminalController;
  assert.deepEqual(readSimulationReviewRows(finalized, "flagged"), { kind: "ready", value: [row] });
  assert.deepEqual(readSimulationReviewDetail(finalized, row.occurrenceId), { kind: "ready", value: row });
  assert.equal(readSimulationReviewDetail(finalized, "missing").kind, "unavailable");
  assert.equal(simulationCompletionLabel("manual"), "Completed manually");
  assert.equal(simulationCompletionLabel("timeout"), "Time expired — finalized automatically");
  assert.equal(simulationCompletionLabel("unknown"), "Finalization completed");
});

test("terminal presentation does not import scoring or persistence layers", () => {
  for (const file of filesUnder("src/features/algorithms/interviewSimulation")) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:storage|repositories|algorithmScoring|scoringService|learningMutations)[^"']*["']/);
  }
});

function filesUnder(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}
