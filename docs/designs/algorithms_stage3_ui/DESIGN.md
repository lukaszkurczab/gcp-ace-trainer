---

name: Algorithms Stage 3 UI Reference Packet
status: APPROVED
approval:
  authority: product-owner
  method: explicit-human-approval
  scope: Algorithms Practice and Algorithms Interview Simulation
scope: Algorithms Practice and Algorithms Interview Simulation
viewport: 390 × 844 mobile, dark-first Focus Lab
source_contracts:

* docs/03-navigation-and-flows.md
* docs/05-design-system.md
* docs/06-branding-and-style-direction.md
* docs/11-implementation-guidelines.md
* docs/12-testing-strategy.md
* docs/16-leetcode-like-learning-system.md
* docs/17-training-runtime-and-interaction-spec.md

---

# Algorithms Stage 3 UI Reference Packet

## Review status and intent

This packet is the approved canonical visual and interaction reference for Algorithms Practice and Algorithms Interview Simulation. Product-owner approval covers this document and the four graphics in this directory. It may be used to implement the required UI states, but it does not itself close G-D or Stage 3: implementation, routing removal, automated checks, and visual QA remain required.

The packet extends the dark-first Focus Lab direction while correcting conflicts in older visual material:

- no Patternly wordmark or logo in the session top bar;
- no dedicated close control;
- no flagging;
- no confidence, readiness, mastery, or pass/fail language;
- no invented fallback states;
- no substitute content;
- no correctness disclosure before the applicable runtime boundary;
- no UI-owned timer, persistence, scoring, or recovery authority.

All artboards use a 390 × 844 mobile viewport. Layout follows the canonical 4 px rhythm, Hanken Grotesk for headings, Inter for instructional copy, JetBrains Mono only for technical notation, quiet navy surfaces, restrained violet focus accents, and thin slate outlines.

State colour is always paired with structure and accessible semantics.

## Shared session shell

### Fixed geometry

| Region               | Reference treatment                                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Safe top region      | 16 px breathing room above the 56 px session top bar. Geometry remains identical across every state.                                                                                      |
| Top bar              | 56 px. Timer slot left, optional mode title centred only when needed, plan-position slot right. No logo, wordmark, `Item` label, flag, or dedicated close button.                         |
| Progress             | 4 px determinate line below the top bar. It reflects verified plan position only. It never claims completion from local or unverified state.                                              |
| Content              | One scroll column with 20 px horizontal gutters and 24 px vertical gaps between prompt, controls, feedback, state notices, and secondary information.                                     |
| Bottom action region | Persistent safe-area-aware action surface. It never covers response controls or Details. Its height does not jump between editable, pending, saved, feedback, frozen, or recovery states. |

### Canonical top bar

The top bar is one shared component across Practice and Interview Simulation.

After verified session start:

- left: `Active time 12:34` in Practice;
- left: `Active time remaining 31:42` in Interview Simulation;
- centre: optional `Guided Practice` or `Interview Simulation`, only when needed for disambiguation;
- right: `1 of 20` or `1 of 40`;
- never `Item 1 of 20`.

Before session verification:

- timer and plan-position slots retain their geometry;
- neither slot exposes semantic timer or position values;
- use a neutral reserved slot or skeleton;
- do not imply that a session, plan, first occurrence, or countdown already exists.

The top bar never gains:

- an exit icon;
- a Patternly lock-up;
- a flag action;
- a different height in error, recovery, finalization, or result states.

### Shared components

| Component             | Reference behaviour                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionTopBar`       | Uses only application-projected timer and verified plan-position state. The display is not a UI-owned clock authority.                                                             |
| `PlanProgress`        | Thin determinate line representing verified plan position.                                                                                                                         |
| `QuestionCard`        | Prompt, interaction requirement, code snippets, and authored option order. It never exposes accepted values, scoring inputs, or correct answers early.                             |
| `ResponseControl`     | Choice, ordering, or complexity control with local-selected, disabled, submitted, saved, feedback, and frozen states.                                                              |
| `DurabilityNotice`    | Inline non-modal row below the active interaction. It represents one precise operation and its durable-state fact.                                                                 |
| `FeedbackBlock`       | Visible only after the Practice durable-feedback boundary or verified Simulation finalization. Reason is immediately visible. Details is collapsed. No generic `Feedback` heading. |
| `SessionActionBar`    | One primary action and at most one secondary action supplied by the application projection. Pending and frozen states remove unsafe actions.                                       |
| `SimulationNavigator` | Numbered occurrence controls for the canonical resolved plan. It exposes current, durably answered, unanswered, and frozen states only.                                                 |
| `StateNotice`         | Inline surface with operation, durable-state fact, safe action, and explicit non-substitution statement when relevant.                                                             |
| `SessionExitSurface`  | Canonical navigation surface for preserving or abandoning a session. It is not a generic modal and is not opened from a dedicated close icon.                                      |

## Practice artboards

### Practice state inventory

| ID                                   | Runtime state                                                | Visible composition and user meaning                                                                                                                                                           | Actions and semantics                                                                              |
| ------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P-01 · Preparing                     | `preparing`                                                  | Stable shell with reserved timer and position slots, empty progress track, `Preparing Guided Practice`, and `Preparing the session plan and first question.` No question controls are mounted. | Announce `Preparing session`. No retry or navigation until exposed by the application projection.  |
| P-02 · Unanswered                    | `active.practice.unanswered`                                 | Prompt card, editable controls, optional local selection, and primary `Check answer`. Selected state uses violet outline plus inset surface.                                                   | No score, correctness, Reason, Details, or durable review state.                                   |
| P-03 · Submitting                    | `active.practice.submitting`                                 | Submitted response remains visible and non-editable. Inline notice: `Saving your answer…`. Primary action is disabled and reads `Checking answer…`.                                            | Prevent duplicate submit. No feedback, Next, or Finish.                                            |
| P-04 · Submit journal failure        | `active.practice.unanswered` with submit failure projection  | Local selection remains visible and editable. Inline error: `The answer was not saved. No submitted result or feedback was created.`                                                           | Safe re-submit appears only when explicitly exposed by the application.                            |
| P-05 · Commit pending                | `commit_pending.practice`                                    | Response is logically committed. Inline notice: `Answer saved. Finishing the update…`. Controls remain locked.                                                                                 | No second submit. Next or Finish remains disabled until materialization and verification complete. |
| P-06 · Commit recovery with feedback | `commit_pending.practice` with feedback projection available | Committed response and permitted feedback remain visible. Inline error states that the saved answer is being recovered and the learner must not resubmit.                                      | Only safe replay or recovery action. Editing does not reopen.                                      |
| P-07 · Correct feedback              | `active.practice.feedback`                                   | Selected correct response uses success surface and thicker outline. No icon and no `Correct` label. Reason is visible; Details collapsed.                                                      | `Next` is enabled only after verified feedback state.                                              |
| P-08 · Incorrect feedback            | `active.practice.feedback`                                   | Selected wrong response uses error-toned surface and inset edge. Correct unselected response uses success surface and thicker outline. No correctness icons or labels.                         | Each response has exact accessible semantic state.                                                 |
| P-09 · Advancing                     | `active.practice.advancing`                                  | Current verified feedback remains visible. Action bar reads `Loading next question…`; interaction is locked.                                                                                   | No next question is mounted before verified position advance.                                      |
| P-10 · Position advance failure      | `active.practice.feedback` with advance failure projection   | Current feedback remains visible and unchanged. Inline error: `Your answer is saved, but the next question could not be opened.`                                                               | Safe retry advances position only. It never resubmits the answer.                                  |
| P-11 · Finish transition             | final verified occurrence and completed result available     | Last verified feedback remains visible. `View session result` replaces Next only after completed result verification.                                                                          | No loading flash or unrelated screen.                                                              |
| P-12 · Exit request                  | active resumable Practice session                            | Canonical exit surface explains that leaving the route preserves the active session for resume.                                                                                                | `Keep learning` and `Leave and resume later`.                                                      |
| P-13 · Abandon confirmation          | active Practice session with explicit abandonment requested  | Dedicated confirmation region explains that abandonment ends resumability and preserves only already durable records.                                                                          | `Keep session` and `Abandon session`.                                                              |
| P-14 · Abandoning                    | abandonment command in progress                              | Current screen remains stable and locked. Inline notice: `Abandoning session…`.                                                                                                                | No repeated command or navigation mutation.                                                        |
| P-15 · Abandonment failure           | active session remains available                             | Inline error states that abandonment did not complete and the session remains resumable.                                                                                                       | Safe retry only if exposed by the application.                                                     |

### Practice feedback treatment

- Reason is the first instructional element after verified feedback availability.
- Details is one collapsed disclosure labelled `Details`.
- There is no generic `Feedback` heading.
- Correctness differs by outline weight, inset treatment, surface treatment, and accessible state.
- No checkmark, cross, `Correct`, or `Incorrect` label appears beside an answer.
- For partial responses, selected correct, omitted correct, and selected wrong controls have distinct accessible descriptions.
- The UI never calculates its own explanation.

## Interview Simulation artboards

### Simulation state inventory

| ID                                          | Runtime state                                            | Visible composition and user meaning                                                                                                                                                          | Actions and semantics                                                        |
| ------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| S-01 · Preparing                            | `preparing`                                              | Stable shell with reserved timer and counter slots, `Preparing Interview Simulation`, and `Checking the required plan and creating your draft.` Navigator and controls are absent.            | No semantic position or active timer before verification.                    |
| S-02 · Insufficient content                 | preparation failure                                      | Stable shell with `The required simulation plan could not be prepared.` It states that no alternative session was created.                                                                    | Only explicit return or retry supplied by the application.                   |
| S-03 · Editable unanswered                  | `active.simulation.editable` with no response            | Prompt, neutral controls, navigator for the resolved plan, durability row `No saved response`.                                                                                                | No correctness, score, Reason, Details, or review state.                     |
| S-04 · Local unsaved draft                  | `active.simulation.editable` with local response         | Current selection is structurally selected. Durability row: `Not saved yet`. Navigator remains durably unanswered.                                                                            | Screen reader distinguishes local unsaved selection from saved response.     |
| S-05 · Saving draft                         | `active.simulation.saving`                               | Local response remains visible and temporarily non-editable. Durability row: `Saving…`. Navigator does not mark the position answered yet.                                                    | Duplicate mutation is blocked. Timer remains stable.                         |
| S-06 · Saved draft                          | `active.simulation.editable` after revision verification | Selected response remains editable. Durability row: `Saved`. Navigator marks the occurrence durably answered.                                                                                 | No correctness or score.                                                     |
| S-07 · Draft save failure                   | `active.simulation.save_failed`                          | Local response remains visibly unsaved. Error: `The response was not saved. Your last saved draft is unchanged.`                                                                              | Retry only when safe. Other navigation remains available only if permitted.  |
| S-08 · Stale draft revision                 | rejected stale revision                                  | Local response remains visible but uncommitted. Error explains that a newer durable revision exists and this change was not saved.                                                            | Application-provided reload or recovery action. No silent overwrite.         |
| S-09 · Navigator inventory                  | `active.simulation.editable`                             | The resolved plan's numbered controls appear in a compact grid. Current = violet outline and inset treatment.                                                                                 | Grid semantics expose number and state.                                      |
| S-10 · Navigator mixed state                | `active.simulation.editable`                             | Current, durably answered, and unanswered positions are structurally distinct.                                                                                                                | Never expose correctness or flags.                                           |
| S-11 · Manual finish confirmation           | active simulation with finish command requested          | Confirmation region: `Finish with unanswered questions? Unanswered questions receive zero points.` Answered and unanswered counts are visible.                                                | `Keep working` and `Finish simulation`.                                      |
| S-12 · Exit request                         | active resumable Simulation                              | Canonical exit surface explains that leaving preserves the active session and latest durable draft.                                                                                           | `Continue simulation` and `Leave and resume later`.                          |
| S-13 · Abandon confirmation                 | explicit abandonment requested                           | Explains that abandonment ends resumability and discards unsaved local changes while preserving durable records already written.                                                              | `Keep session` and `Abandon simulation`.                                     |
| S-14 · Abandoning                           | abandonment in progress                                  | Frozen interaction shell with `Abandoning simulation…`.                                                                                                                                       | No repeated command.                                                         |
| S-15 · Abandonment failure                  | abandonment failed                                       | Error states that the simulation remains resumable and latest durable draft is unchanged.                                                                                                     | Safe retry only if exposed.                                                  |
| S-16 · Time exhausted                       | remaining active time reaches zero                       | Timer reads `Active time remaining 00:00`. Controls and navigator stop accepting changes. Notice: `Time expired. Freezing your latest saved draft.`                                           | No correctness or summary. Unsaved local response is not promoted.           |
| S-17 · Frozen                               | `finalizing.simulation.frozen`                           | All controls and navigator use frozen treatment. Notice: `Session frozen for finalization.`                                                                                                   | No editing, navigation mutation, score, or feedback.                         |
| S-18 · Finalization journal pending         | finalization command journal in progress                 | Frozen shell remains visible. Notice: `Saving the finalization command…`.                                                                                                                     | No further interaction.                                                      |
| S-19 · Finalization journal failure         | journal write failed                                     | Frozen shell remains unchanged. Error states that editing will not reopen and no result was created.                                                                                          | Safe retry only if application permits.                                      |
| S-20 · Finalizing                           | `finalizing.simulation.materializing`                    | Frozen shell and `Finalizing session…`. Disabled progress action remains in the stable action area.                                                                                           | Correctness remains hidden.                                                  |
| S-21 · Finalization materialization failure | materialization failed                                   | Frozen shell. Error: `Finalization did not complete. The frozen session can be retried safely.`                                                                                               | Editing stays unavailable.                                                   |
| S-22 · Finalization verification failure    | materialized result failed verification                  | Frozen shell. Error states that the result is not available because verification did not complete.                                                                                            | No partial result or review data.                                            |
| S-23 · Recovering after restart             | unresolved startup recovery                              | Frozen shell. Notice: `Recovering the frozen session…`.                                                                                                                                       | No claim that recovery already succeeded.                                    |
| S-24 · Recovered and finalizing             | durable recovery verified                                | Frozen shell. Notice: `Frozen session recovered. Finalizing safely…`.                                                                                                                         | Result remains unavailable until complete verification.                      |
| S-25 · Timer checkpoint recovery failure    | active or frozen recovery failure                        | Error identifies inability to recover the canonical active-time checkpoint and states whether session interaction remains blocked.                                                            | No UI-owned reconstruction of elapsed time.                                  |
| S-26 · Missing required draft               | active simulation record exists without required draft   | Explicit unavailable surface states that resume cannot continue because the exact draft is missing.                                                                                           | No empty replacement draft.                                                  |
| S-27 · Content-version mismatch             | saved plan cannot resolve exact content version          | Explicit unavailable surface states that the saved session cannot be resumed with a different bank version.                                                                                   | No mapping to newer content.                                                 |
| S-28 · Corrupt canonical state              | invariant failure                                        | Explicit recovery-required surface states that the session cannot safely continue.                                                                                                            | No fallback runner, partial session, or invented state.                      |
| S-29 · Verified result                      | `completed` with verified result                         | Answered/unanswered counts, correct/partial/incorrect counts, earned/max points, and post-session authored review entry points.                                                               | No pass/fail, readiness, mastery, or confidence. Feedback appears only here. |

## Runtime-state mapping

| Runtime state                             | Reference artboards                 | Prohibited disclosure or action                             |
| ----------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `preparing`                               | P-01, S-01, S-02                    | Semantic timer, item counter, controls, substitute content. |
| `active.practice.unanswered`              | P-02, P-04                          | Score, correctness, feedback, durable attempt claim.        |
| `active.practice.submitting`              | P-03                                | Feedback, Next, Finish, duplicate submit.                   |
| `commit_pending.practice`                 | P-05, P-06                          | Editing, duplicate submit, unverified next position.        |
| `active.practice.feedback`                | P-07, P-08, P-10                    | Unverified explanation or next question.                    |
| `active.practice.advancing`               | P-09                                | Next occurrence before verified advance.                    |
| `active.simulation.editable`              | S-03, S-04, S-06, S-09 through S-13 | Correctness, score, Reason, Details, flags.                 |
| `active.simulation.saving`                | S-05                                | Saved claim before revision verification.                   |
| `active.simulation.save_failed`           | S-07, S-08                          | Fabricated saved state or silent overwrite.                 |
| `finalizing.simulation.frozen`            | S-16 through S-19                   | Editing, navigation mutation, result.                       |
| `finalizing.simulation.materializing`     | S-20 through S-24                   | Result or feedback before verifier success.                 |
| `finalizing.simulation.recovery_required` | S-21 through S-28                   | Reopened editing, silent fallback, partial summary.         |
| `completed` with verified result          | P-11, S-29                          | Pass/fail, readiness, mastery, confidence.                  |

## Exit and abandonment rules

There is no dedicated close button.

Exit handling may be entered through:

- system back;
- native navigation gesture;
- route replacement;
- explicit application-provided leave action outside the top bar.

Leaving and abandonment are different operations.

### Leave and resume later

- preserves the active session;
- preserves the latest durable draft;
- does not create a completed result;
- does not mark the session abandoned;
- may discard only explicitly identified unsaved local UI state.

### Abandon

- is deliberate;
- ends resumability after durable verification;
- does not fabricate completion;
- does not delete already materialized attempts or results from earlier completed work;
- must expose in-progress and failure states;
- must not silently fall back to leaving the session active.

## Practice and Simulation differences

| Concern              | Practice                                                     | Interview Simulation                                                                 |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Feedback boundary    | After durable submit, commit completion, and verification.   | Only after verified finalization.                                                    |
| Response persistence | Current response is ephemeral until submit journal succeeds. | Revision-safe occurrence draft with local, saving, saved, stale, and failure states. |
| Navigation           | Linear advance after verified response.                      | Free navigation across the canonical resolved occurrence plan.                       |
| Timer                | Elapsed active foreground time.                              | Canonical resolved timer projection; UI does not own its policy.                     |
| Incomplete response  | Blocks submit with explicit completeness state.              | May remain unanswered and scores zero only at finalization.                          |
| Recovery             | Commit replay and safe advance retry.                        | Draft revision recovery and frozen finalization recovery.                            |

## Error and recovery inventory

Every error reference must communicate:

1. which operation failed;
2. what durable state remains;
3. whether retry is safe;
4. which action is permitted;
5. what the system did not substitute, duplicate, reopen, or discard.

Required variants:

- Practice preparation failure;
- Practice submit-journal failure;
- Practice commit materialization failure;
- Practice commit verification failure;
- Practice position-advance failure;
- Practice abandonment failure;
- Simulation insufficient 40-item pool;
- Simulation draft save failure;
- Simulation stale revision;
- Simulation timer checkpoint recovery failure;
- Simulation missing required draft;
- Simulation content-version mismatch;
- Simulation corrupt canonical state;
- Simulation finalization-journal failure;
- Simulation finalization materialization failure;
- Simulation finalization verification failure;
- Simulation abandonment failure;
- Startup recovery in progress;
- startup recovery verified;
- startup recovery unresolved.

## Visual deliverables

Each unique visual state must have a 390 × 844 reference render or a clearly documented variant of a shared base artboard.

Each render must include:

- artboard ID;
- runtime state;
- visible copy;
- enabled actions;
- disabled or absent actions;
- durable-state fact;
- accessible semantic annotation;
- mapping to shared components.

Visuals must cover at minimum:

### Practice boards

- preparing;
- unanswered;
- submitting;
- submit failure;
- commit pending;
- commit recovery;
- correct feedback;
- incorrect feedback;
- advancing;
- advance failure;
- finish transition;
- leave/resume;
- abandon confirmation;
- abandoning;
- abandonment failure.

### Simulation boards

- preparing;
- insufficient content;
- editable unanswered;
- local unsaved response;
- saving;
- saved;
- save failure;
- stale revision;
- 40-position navigator;
- finish confirmation;
- leave/resume;
- abandon confirmation;
- time exhausted;
- frozen;
- finalization journal pending;
- finalization journal failure;
- finalizing;
- materialization failure;
- verification failure;
- recovery in progress;
- recovered and finalizing;
- timer recovery failure;
- missing draft;
- content-version mismatch;
- corrupt state;
- verified result.

## Review checklist

Human approval must confirm:

1. Every artboard preserves canonical shell geometry.
2. Preparing states do not expose semantic timer or position values.
3. Practice selected, correct, and incorrect states remain structurally distinct without correctness icons or labels.
4. Reason and collapsed Details appear only at permitted boundaries.
5. Practice submit, commit, recovery, advance, and advance-failure states are separate.
6. Simulation distinguishes local, saving, saved, stale, failed, frozen, finalizing, and recovery states.
7. The navigator renders the canonical resolved plan and never exposes correctness or flags.
8. Leaving and abandonment are separate and correctly described.
9. Dynamic text, reduced motion, focus order, and screen-reader announcements have been reviewed.
10. No state introduces confidence, mastery, readiness, pass/fail, silent fallback, substitute content, generic spinner-only replacement, or a generic modal.

Until the complete visual set is manually approved:

```text
G-D: BLOCKED
Stage 3: BLOCKED
```
