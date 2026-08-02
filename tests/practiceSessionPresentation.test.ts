import assert from "node:assert/strict";
import test from "node:test";

import {
  allowsPracticeFeedback,
  allowsPracticeResponseEditing,
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  isPracticeActionPending,
  noticeForPracticeOperation,
  practiceOptionCorrectnessValue,
  reconcilePracticeChoiceSelection,
  resolvePracticeLocalResponse,
} from "../src/features/practice/practiceSessionPresentation";
import type { PracticeDurableOperationState } from "../src/application/trainingLifecycle";

test("Practice presentation never discloses feedback before the durable feedback boundary", () => {
  for (const phase of ["preparing", "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "recovery_required", "abandoning"] as const) {
    assert.equal(allowsPracticeFeedback(phase), false, phase);
  }
  for (const phase of ["feedback", "advancing", "advance_failed", "completed"] as const) {
    assert.equal(allowsPracticeFeedback(phase), true, phase);
  }
});

test("Practice presentation permits response edits before a journal exists", () => {
  assert.equal(allowsPracticeResponseEditing("unanswered"), true);
  assert.equal(allowsPracticeResponseEditing("submit_journal_failed"), true);
  for (const phase of ["preparing", "submitting_before_journal", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "recovery_required", "feedback", "advancing", "advance_failed", "completed", "abandoning"] as const) {
    assert.equal(allowsPracticeResponseEditing(phase), false, phase);
  }
});

test("Practice action model separates final feedback from the durable Finish command", () => {
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: false, isFinalPosition: false, phase: "unanswered" }), { enabled: false, label: "Check answer", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "submitting_before_journal" }), { enabled: false, label: "Checking answer…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "commit_pending" }), { enabled: false, label: "Finishing the update…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "feedback" }), { enabled: true, label: "Next", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: true, phase: "feedback" }), { enabled: true, label: "Finish session", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: false, isFinalPosition: true, phase: "completing" }), { enabled: false, label: "Finishing session…", loading: true });
  assert.equal(getPracticePrimaryAction({ hasLocalResponse: false, isFinalPosition: true, phase: "completion_failed" }), null);
});

test("Practice pending phases retain a stable unsafe-action lock", () => {
  for (const phase of ["submitting_before_journal", "commit_pending", "advancing", "abandoning"] as const) {
    assert.equal(isPracticeActionPending(phase), true, phase);
  }
  assert.equal(isPracticeActionPending("feedback"), false);
});

test("Practice operation notice mapping remains one family-neutral interpretation", () => {
  const error = (allowedAction: "submit_again" | "recover" | "retry_same_command") => ({ operation: "practice_submit" as const, durableState: "journal_durable" as const, retrySafety: "recovery_only" as const, allowedAction, prohibitedFallback: "No fallback." });
  const cases: readonly [PracticeDurableOperationState, { tone: "neutral" | "error" | "success"; message: string } | undefined][] = [
    [{ family: "practice", kind: "submitting_before_journal" }, { tone: "neutral", message: "Saving your answer…" }],
    [{ family: "practice", kind: "submit_journal_failed", error: error("submit_again") }, { tone: "error", message: "The answer was not durably submitted. You can safely submit the same local response again." }],
    [{ family: "practice", kind: "commit_materialization_failed", error: error("recover") }, { tone: "error", message: "Your response is immutable because a durable command exists. Recovery must replay that exact command." }],
    [{ family: "practice", kind: "recovery_required", error: error("recover") }, { tone: "error", message: "A previous session update must be recovered before another answer can be submitted." }],
    [{ family: "practice", kind: "advancing" }, { tone: "neutral", message: "Opening the next question…" }],
    [{ family: "practice", kind: "advance_failed", error: { ...error("retry_same_command"), operation: "practice_advance" } }, { tone: "error", message: "Your answer remains committed. Retry opening the next question." }],
    [{ family: "practice", kind: "verified_pending_clear", error: error("recover") }, { tone: "error", message: "Your response is immutable because a durable command exists. Recovery must replay that exact command." }],
    [{ family: "practice", kind: "feedback" }, undefined],
  ];
  for (const [operation, expected] of cases) assert.deepEqual(noticeForPracticeOperation(operation), expected, operation.kind);
});

test("Practice local choice selection survives only the same editable occurrence", () => {
  const current = Object.freeze({ sessionId: "session-1", occurrenceId: "occurrence-1", selectedOptionIds: Object.freeze(["A"]) });
  const sameFailedOccurrence = reconcilePracticeChoiceSelection({
    current,
    durableSelectedOptionIds: null,
    editable: allowsPracticeResponseEditing("submit_journal_failed"),
    occurrenceId: "occurrence-1",
    sessionId: "session-1",
  });
  assert.equal(sameFailedOccurrence, current);
  assert.deepEqual(sameFailedOccurrence.selectedOptionIds, ["A"]);

  const nextUnansweredOccurrence = reconcilePracticeChoiceSelection({
    current,
    durableSelectedOptionIds: null,
    editable: allowsPracticeResponseEditing("unanswered"),
    occurrenceId: "occurrence-2",
    sessionId: "session-1",
  });
  assert.deepEqual(nextUnansweredOccurrence, { sessionId: "session-1", occurrenceId: "occurrence-2", selectedOptionIds: [] });
});

test("Practice durable choice response wins and response-less locked state clears", () => {
  const current = { sessionId: "session-1", occurrenceId: "occurrence-1", selectedOptionIds: ["A"] };
  assert.deepEqual(reconcilePracticeChoiceSelection({ current, durableSelectedOptionIds: ["B"], editable: false, occurrenceId: "occurrence-1", sessionId: "session-1" }), {
    sessionId: "session-1", occurrenceId: "occurrence-1", selectedOptionIds: ["B"],
  });
  assert.deepEqual(reconcilePracticeChoiceSelection({ current, durableSelectedOptionIds: null, editable: false, occurrenceId: "occurrence-1", sessionId: "session-1" }), {
    sessionId: "session-1", occurrenceId: "occurrence-1", selectedOptionIds: [],
  });
});

test("Practice response renderer consumes application feedback states without scoring in UI", () => {
  const control = buildPracticeResponseControl({
    choiceSelectionMode: "multiple",
    feedbackControls: [
      { id: "a", state: "incorrect" },
      { id: "b", state: "omitted_correct" },
      { id: "c", state: "correct" },
    ],
    localResponse: { kind: "choice", selectedOptionIds: ["a", "c"] },
    renderer: {
      kind: "choice",
      options: [
        { id: "a", selected: true, text: "A" },
        { id: "b", selected: false, text: "B" },
        { id: "c", selected: true, text: "C" },
      ],
    },
  });
  assert.deepEqual(control, {
    kind: "choice",
    selectionMode: "multiple",
    options: [
      { id: "a", state: "incorrect", text: "A" },
      { id: "b", state: "omitted_correct", text: "B" },
      { id: "c", state: "correct", text: "C" },
    ],
  });
});

test("The visible ordering is a complete response before the learner moves an element", () => {
  const control = buildPracticeResponseControl({
    localResponse: null,
    renderer: {
      kind: "ordering",
      elements: [
        { id: "first", text: "First" },
        { id: "second", text: "Second" },
      ],
    },
  });

  assert.deepEqual(resolvePracticeLocalResponse(null, control), {
    kind: "ordering",
    orderedSubgoalIds: ["first", "second"],
  });
  assert.deepEqual(
    resolvePracticeLocalResponse({ kind: "ordering", orderedSubgoalIds: ["second", "first"] }, control),
    { kind: "ordering", orderedSubgoalIds: ["second", "first"] },
  );
});

test("Practice correctness semantics stay separate from the native checked selection state", () => {
  assert.equal(practiceOptionCorrectnessValue("neutral"), undefined);
  assert.equal(practiceOptionCorrectnessValue("selected"), undefined);
  assert.equal(practiceOptionCorrectnessValue("correct"), "Correct response");
  assert.equal(practiceOptionCorrectnessValue("incorrect"), "Incorrect response");
  assert.equal(practiceOptionCorrectnessValue("omitted_correct"), "Correct response");
});
