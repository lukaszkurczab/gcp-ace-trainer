import assert from "node:assert/strict";
import test from "node:test";

import {
  allowsPracticeFeedback,
  allowsPracticeResponseEditing,
  buildPracticeResponseControl,
  getPracticePrimaryAction,
  isPracticeActionPending,
} from "../src/features/practice/practiceSessionPresentation";

test("Practice presentation never discloses feedback before the durable feedback boundary", () => {
  for (const phase of ["preparing", "unanswered", "submitting", "commit_pending", "abandoning"] as const) {
    assert.equal(allowsPracticeFeedback(phase), false, phase);
  }
  for (const phase of ["feedback", "commit_recovery", "advancing", "completed"] as const) {
    assert.equal(allowsPracticeFeedback(phase), true, phase);
  }
});

test("Practice presentation permits response edits only while unanswered", () => {
  assert.equal(allowsPracticeResponseEditing("unanswered"), true);
  for (const phase of ["preparing", "submitting", "commit_pending", "commit_recovery", "feedback", "advancing", "completed", "abandoning"] as const) {
    assert.equal(allowsPracticeResponseEditing(phase), false, phase);
  }
});

test("Practice action model prevents duplicate submit and preserves final result transition", () => {
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: false, isFinalPosition: false, phase: "unanswered" }), { enabled: false, label: "Check answer", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "submitting" }), { enabled: false, label: "Checking answer…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "commit_pending" }), { enabled: false, label: "Finishing the update…", loading: true });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: false, phase: "feedback" }), { enabled: true, label: "Next", loading: false });
  assert.deepEqual(getPracticePrimaryAction({ hasLocalResponse: true, isFinalPosition: true, phase: "feedback" }), { enabled: true, label: "View session result", loading: false });
});

test("Practice pending phases retain a stable unsafe-action lock", () => {
  for (const phase of ["submitting", "commit_pending", "advancing", "abandoning"] as const) {
    assert.equal(isPracticeActionPending(phase), true, phase);
  }
  assert.equal(isPracticeActionPending("feedback"), false);
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
