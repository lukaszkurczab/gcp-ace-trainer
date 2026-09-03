import assert from "node:assert/strict";
import test from "node:test";

import i18n from "../../i18n";
import {
  allowsPracticeFeedback,
  allowsPracticeResponseEditing,
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  isPracticeActionPending,
  noticeForPracticeOperation,
  practiceOptionCorrectnessValue,
  reconcilePracticeLocalResponse,
  reconcilePracticeChoiceSelection,
  resolvePracticeLocalResponse,
} from "./practiceSessionPresentation";
import type { PracticeDurableOperationState } from "../../application/trainingLifecycle";

test("Practice presentation never discloses feedback before the durable feedback boundary", () => {
  for (const phase of ["preparing", "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "recovery_required", "completing", "abandoning"] as const) {
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
  const feedbackTiming = "afterEachAnswer" as const;
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: false, isFinalPosition: false, phase: "unanswered" }), { enabled: false, label: "Check answer", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "submitting_before_journal" }), { enabled: false, label: "Checking answer…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "submit_journal_failed" }), { enabled: true, label: "Try again", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "commit_pending" }), { enabled: false, label: "Saving your answer…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "feedback" }), { enabled: true, label: "Next", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: true, phase: "feedback" }), { enabled: true, label: "Finish session", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "advance_failed" }), { enabled: true, label: "Try again", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: false, isFinalPosition: true, phase: "completing" }), { enabled: false, label: "Finishing session…", loading: true });
  assert.equal(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: false, isFinalPosition: true, phase: "completion_failed" }), null);
});

test("Deferred feedback keeps the submit CTA and saving status aligned", () => {
  const feedbackTiming = "atSessionEnd" as const;
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "unanswered" }), { enabled: true, label: "Submit answer", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "submitting_before_journal" }), { enabled: false, label: "Saving your answer…", loading: true });
  assert.equal(getPracticePrimaryAction({ feedbackTiming, hasLocalResponse: true, isFinalPosition: false, phase: "feedback" })?.label, "Next");
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
    [{ family: "practice", kind: "submit_journal_failed", error: error("submit_again") }, { tone: "error", message: "We couldn't save your response. Your current answer is still here." }],
    [{ family: "practice", kind: "commit_materialization_failed", error: error("recover") }, { tone: "error", message: "Your answer is saved on this device. Restore this question to continue." }],
    [{ family: "practice", kind: "recovery_required", error: error("recover") }, { tone: "error", message: "Restore the session before submitting another answer." }],
    [{ family: "practice", kind: "advancing" }, { tone: "neutral", message: "Opening the next question…" }],
    [{ family: "practice", kind: "advance_failed", error: { ...error("retry_same_command"), operation: "practice_advance" } }, { tone: "error", message: "Your answer is saved. Try opening the next question again." }],
    [{ family: "practice", kind: "verified_pending_clear", error: error("recover") }, { tone: "error", message: "Your answer is saved on this device. Restore this question to continue." }],
    [{ family: "practice", kind: "feedback" }, undefined],
  ];
  for (const [operation, expected] of cases) assert.deepEqual(noticeForPracticeOperation(operation), expected, operation.kind);
});

test("Durable recovery notices stay learner-facing in English and Polish", () => {
  const durableNotice = noticeForPracticeOperation({
    family: "practice",
    kind: "commit_materialization_failed",
    error: { operation: "practice_submit", durableState: "journal_durable", retrySafety: "recovery_only", allowedAction: "recover", prohibitedFallback: "No fallback." },
  });
  assert.ok(durableNotice);
  assert.equal(i18n.t(durableNotice.message, { lng: "en" }), "Your answer is saved on this device. Restore this question to continue.");
  assert.equal(i18n.t(durableNotice.message, { lng: "pl" }), "Twoja odpowiedź jest zapisana na tym urządzeniu. Przywróć pytanie, aby kontynuować.");

  const failureMessage = "Your answer is still saved on this device. We couldn't restore this question yet. Try recovery again.";
  assert.equal(i18n.t(failureMessage, { lng: "en" }), failureMessage);
  assert.equal(i18n.t(failureMessage, { lng: "pl" }), "Twoja odpowiedź nadal jest zapisana na tym urządzeniu. Nie udało się jeszcze przywrócić tego pytania. Spróbuj ponownie je odzyskać.");
  for (const locale of ["en", "pl"] as const) {
    assert.doesNotMatch(i18n.t(durableNotice.message, { lng: locale }), /LOCAL_OPERATION_FAILED|JOURNAL_/);
    assert.doesNotMatch(i18n.t(failureMessage, { lng: locale }), /LOCAL_OPERATION_FAILED|JOURNAL_/);
  }
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

test("Scoped local response preserves all authored control types for the same editable occurrence", () => {
  const responses = [
    { kind: "choice", selectedOptionIds: ["A"] },
    { kind: "ordering", orderedSubgoalIds: ["first", "second"] },
    { kind: "complexity", selectedValuesByDimension: { latency: "low" } },
  ] as const;
  for (const response of responses) {
    const current = Object.freeze({ occurrenceId: "occurrence-1", response, sessionId: "session-1" });
    const reconciled = reconcilePracticeLocalResponse({ current, durableResponse: null, editable: true, occurrenceId: "occurrence-1", sessionId: "session-1" });
    assert.equal(reconciled, current);
    assert.deepEqual(reconciled?.response, response);
  }
});

test("Scoped local response resets when the session or occurrence identity changes", () => {
  const current = Object.freeze({ occurrenceId: "occurrence-1", response: { kind: "choice" as const, selectedOptionIds: ["A"] }, sessionId: "session-1" });
  assert.equal(reconcilePracticeLocalResponse({ current, durableResponse: null, editable: true, occurrenceId: "occurrence-2", sessionId: "session-1" }), null);
  assert.equal(reconcilePracticeLocalResponse({ current, durableResponse: null, editable: true, occurrenceId: "occurrence-1", sessionId: "session-2" }), null);
  assert.equal(reconcilePracticeLocalResponse({ current, durableResponse: null, editable: false, occurrenceId: "occurrence-1", sessionId: "session-1" }), null);
});

test("Scoped durable response is authoritative over an unsent local response", () => {
  const current = Object.freeze({ occurrenceId: "occurrence-1", response: { kind: "choice" as const, selectedOptionIds: ["A"] }, sessionId: "session-1" });
  const stored = { kind: "choice" as const, selectedOptionIds: ["B"] };
  assert.deepEqual(reconcilePracticeLocalResponse({ current, durableResponse: stored, editable: true, occurrenceId: "occurrence-1", sessionId: "session-1" }), {
    occurrenceId: "occurrence-1", response: stored, sessionId: "session-1",
  });
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
