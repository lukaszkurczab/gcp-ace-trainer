import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildSimulationNavigatorItems,
  composeChoiceDraft,
  composeComplexityDraft,
  isSimulationPresentationBlocked,
  isSimulationQuestionRenderable,
  moveOrderingDraft,
  SimulationDraftIntentQueue,
} from "../src/features/algorithms/interviewSimulation/model";

test("active simulation presentation projects only draft-completeness and flags into navigation", () => {
  assert.deepEqual(buildSimulationNavigatorItems([
    { answerState: "complete", flagged: false, index: 0 },
    { answerState: "partial", flagged: false, index: 1 },
    { answerState: "complete", flagged: true, index: 2 },
  ]), [
    { index: 0, state: "answered" },
    { index: 1, state: "unanswered" },
    { index: 2, state: "flagged" },
  ]);
});

test("navigator has explicit persistence-error and unavailable representations", () => {
  assert.deepEqual(buildSimulationNavigatorItems([
    { answerState: "complete", flagged: false, index: 0 },
    { answerState: "unanswered", flagged: false, index: 1 },
  ], { erroredIndices: [0], unavailableIndices: [1] }), [
    { index: 0, state: "error" },
    { index: 1, state: "unavailable" },
  ]);
});

test("unsupported current renderer input is unavailable without turning missing content into a fake navigator state", () => {
  assert.equal(isSimulationQuestionRenderable({ options: [] }), true);
  assert.equal(isSimulationQuestionRenderable({ subgoals: [] }), true);
  assert.equal(isSimulationQuestionRenderable({ correctComplexity: { dimensions: [] } }), true);
  assert.equal(isSimulationQuestionRenderable({ type: "unknown" }), false);
  assert.equal(isSimulationQuestionRenderable(null), false);
});

test("rapid presentation intents compose from the latest local draft rather than stale render state", () => {
  const first = composeChoiceDraft(null, "a", true);
  assert.deepEqual(composeChoiceDraft(first, "b", true), { kind: "choice", selectedOptionIds: ["a", "b"] });
  const time = composeComplexityDraft(null, "time", "O(n)");
  assert.deepEqual(composeComplexityDraft(time, "space", "O(1)"), {
    kind: "complexity",
    selectedValuesByDimension: { time: "O(n)", space: "O(1)" },
  });
  assert.deepEqual(moveOrderingDraft(["a", "b", "c"], "a", 1), {
    kind: "ordering",
    orderedSubgoalIds: ["b", "a", "c"],
  });
});

test("draft intent queue retains only the latest failed intent and makes it retryable", async () => {
  const failures: Array<readonly [string, number]> = [];
  const queue = new SimulationDraftIntentQueue<number>({
    onChange: () => undefined,
    onLatestFailure: (occurrenceId, response) => failures.push([occurrenceId, response]),
  });

  queue.enqueue("o:1", 1, async () => false);
  queue.enqueue("o:1", 2, async () => false);
  await queue.whenIdle();
  assert.deepEqual(failures, [["o:1", 2]]);
  assert.deepEqual(queue.get("o:1"), { response: 2, revision: 2 });

  queue.enqueue("o:1", 2, async () => true);
  await queue.whenIdle();
  assert.equal(queue.has("o:1"), false);
});

test("active simulation blocks progression for pending or failed durability and timeout", () => {
  assert.equal(isSimulationPresentationBlocked({ kind: "idle" }, 1), false);
  assert.equal(isSimulationPresentationBlocked({ kind: "saving_draft", status: "pending" }, 1), true);
  assert.equal(isSimulationPresentationBlocked({ kind: "saving_flag", status: "failed" }, 1), true);
  assert.equal(isSimulationPresentationBlocked({ kind: "idle" }, 0), true);
});

test("Interview Simulation has an explicit runtime-backed route and no screen persistence or scoring imports", () => {
  const routes = readFileSync("src/constants/routes.ts", "utf8");
  const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
  const practiceSession = readFileSync("src/features/practice/PracticeSessionScreen.tsx", "utf8");
  const activeScreen = readFileSync("src/features/algorithms/interviewSimulation/AlgorithmsInterviewSimulationScreen.tsx", "utf8");

  assert.match(routes, /ALGORITHMS_INTERVIEW_SIMULATION/);
  assert.match(navigator, /AlgorithmsInterviewSimulationScreen/);
  assert.match(practiceSession, /mode === ALGORITHM_MODE_IDS\.interviewSimulation/);
  assert.match(practiceSession, /navigation\.replace\(ROUTES\.ALGORITHMS_INTERVIEW_SIMULATION/);
  assert.doesNotMatch(activeScreen, /from\s+["'][^"']*(?:storage|repositories|scoring|learningMutations|trainingSessions)[^"']*["']/);
  assert.doesNotMatch(activeScreen, /scoreAlgorithmQuestion|createTrainingAttempt|commitTrainingOutcome/);
  assert.match(activeScreen, /unavailableIndices: isCurrentQuestionRenderable \? \[\] : \[currentIndex\]/);
  assert.match(activeScreen, /SimulationQuestionPresentation disabled=\{isAnswerInteractionBlocked\}/);
});

test("pending or failed durability disables terminal mutations and summary does not invent answer-change history", () => {
  const panels = readFileSync("src/features/algorithms/interviewSimulation/components/SimulationPanels.tsx", "utf8");
  const summary = readFileSync("src/features/algorithms/interviewSimulation/components/SimulationSummaryPanel.tsx", "utf8");

  assert.match(panels, /Button disabled=\{disabled\} loading=\{pending\} onPress=\{onLeave\}/);
  assert.match(panels, /Button disabled=\{disabled\} loading=\{pending\} onPress=\{onSubmit\}/);
  assert.match(panels, /hasUnanswered \? "Submit with unanswered questions\?" : "Submit simulation\?"/);
  assert.match(summary, /Answer changes.*Not recorded for this session/);
});

test("zero-time finalization keeps an explicit retry path instead of suppressing a failed timeout", () => {
  const activeScreen = readFileSync("src/features/algorithms/interviewSimulation/AlgorithmsInterviewSimulationScreen.tsx", "utf8");

  assert.match(activeScreen, /void triggerTimeoutFinalization\(\)/);
  assert.match(activeScreen, /beginRetry\(retryTimeoutFinalization\)/);
  assert.match(activeScreen, /const next = await controller\.finalize\(\)/);
});
