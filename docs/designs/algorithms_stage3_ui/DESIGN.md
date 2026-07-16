---
name: Algorithms Stage 3 UI Reference Packet
status: READY_FOR_REVIEW
scope: Algorithms Practice and Algorithms Interview Simulation
viewport: 390 × 844 mobile, dark-first Focus Lab
source_contracts:
  - docs/03-navigation-and-flows.md
  - docs/05-design-system.md
  - docs/06-branding-and-style-direction.md
  - docs/11-implementation-guidelines.md
  - docs/12-testing-strategy.md
  - docs/16-leetcode-like-learning-system.md
  - docs/17-training-runtime-and-interaction-spec.md
---

# Algorithms Stage 3 UI Reference Packet

## Review status and intent

This packet defines the complete review target for canonical Algorithms session UI. It is **READY_FOR_REVIEW**, not approved. Human approval is required before implementation may use these states to close G-D or Stage 3.

It extends the dark-first Focus Lab direction while correcting conflicts in older visual material: no Patternly wordmark/logo in the session top bar, no dedicated close control, no flags, no invented fallback states, and no correctness disclosure before the applicable runtime boundary.

All artboards use a 390 × 844 mobile viewport. Layout uses the canonical 4 px rhythm, Hanken Grotesk for headings, Inter for instructional copy, JetBrains Mono only for technical notation, quiet navy surfaces, restrained violet focus accents, and thin slate outlines. State colour is always paired with a structural treatment and accessible semantics.

## Shared session shell

### Fixed geometry

| Region | Reference treatment |
| --- | --- |
| Safe top region | 16 px visual breathing room above the 56 px session top bar; identical across every state. |
| Top bar | 56 px, horizontally aligned: canonical timer left, optional mode title centred only when needed for disambiguation, `x of y` counter right. No wordmark, logo, item label, or dedicated close button. |
| Progress | 4 px determinate line below the top bar. It reflects plan position only; it never claims completion from a local draft. |
| Content | One scroll column with 20 px side gutters and 24 px gaps between prompt, controls, feedback, and state notices. |
| Bottom action region | Persistent safe-area-aware action surface. It never covers response controls or Details. Its height and alignment do not jump between selected, pending, saved, or frozen states. |

### Canonical top bar

The top bar is the same component on every Practice and Simulation artboard.

- Left: `Active time 12:34` in Practice or `Active time remaining 31:42` in Interview Simulation. Screen-reader label includes timer kind, value, and active-foreground semantics.
- Centre: optional `Guided Practice` or `Interview Simulation`; omitted when the page heading already provides the same context.
- Right: `1 of 20` or `1 of 40`, never `Item 1 of 20`.
- The bar does not gain an exit icon, a Patternly lock-up, a flag action, or a different height in an error/recovery state.

### Shared components

| Component | Reference behaviour |
| --- | --- |
| `SessionTopBar` | Uses only application-projected timer and plan-position state. The displayed time is not a UI-owned clock authority. |
| `PlanProgress` | Thin determinate line; position, not answer correctness. |
| `QuestionCard` | Prompt, interaction requirement, code snippets, and authored option order. It never shows accepted values or scoring inputs early. |
| `ResponseControl` | Choice, ordering, or complexity control with selected, disabled, submitted, saved, frozen, and accessible semantic states. |
| `DurabilityNotice` | Inline, non-modal row below the active interaction: `Saving…`, `Saved`, or an explicit failure. It does not occupy a second authoritative state surface. |
| `FeedbackBlock` | Visible only after Practice durable-submit boundary or verified Simulation finalization. Shows Reason immediately; Details is a collapsed disclosure with no domain side effect. No `Feedback` heading. |
| `SessionActionBar` | One primary action plus a secondary action only when supplied by the application projection. Pending/frozen states remove unsafe actions rather than faking a retry. |
| `SimulationNavigator` | Exactly 40 numbered occurrence controls. It exposes current, durably answered, unanswered, and frozen only. No flag state and no correctness before verified finalization. |
| `StateNotice` | Inline surface with precise operation, durable-state fact, and only safe application-provided recovery action. It is never a generic modal. |

## Practice artboards

| ID | Runtime state | Visible composition and user meaning | Action and accessible semantics |
| --- | --- | --- | --- |
| P-01 · Preparing | `preparing` | Stable top bar with elapsed foreground timer placeholder, empty determinate track, `Preparing Guided Practice` heading, and a concise validation line: `Preparing the session plan and first question.` No question controls are mounted. | Announce `Preparing session`; no retry or navigation action until an application projection exposes one. |
| P-02 · Unanswered | `active.practice.unanswered` | Prompt card, editable response controls, selected state only when the learner has chosen a response, and primary `Check answer`. Selection uses violet outline plus inset surface, not colour alone. | Controls expose selection state; primary action describes required completeness. No score, Reason, Details, or review state is visible. |
| P-03 · Commit pending | `commit_pending.practice` | The submitted controls retain the learner’s choice but are non-editable with a consistent disabled outline and reduced interaction affordance. Inline notice reads `Saving your answer…`; action bar reads `Checking answer…`. | Announce durable submission in progress. Every choice/order/complexity control is disabled, and a second submit is impossible. No feedback appears while the journal is unresolved. |
| P-04 · Correct feedback | `active.practice.feedback` after materialize and verify | Selected correct control uses the success surface plus a thicker success outline. No check icon and no `Correct` label. Reason appears directly below controls. `Details` is a closed disclosure. `Next` is the primary action. | Accessible description says the selected response is correct; it includes authored Reason. Details announces collapsed/expanded but has no persistence or timer effect. |
| P-05 · Incorrect feedback | `active.practice.feedback` after materialize and verify | The selected wrong control uses an error-toned surface plus an inset edge; each correct unselected control uses the success surface plus thicker outline. No cross/check icon and no `Incorrect`/`Correct` text beside controls. Reason is immediate; Details stays closed and contains authored explanation. | Each option has exact semantic state (`selected incorrect`, `correct not selected`) rather than colour-only inference. `Next` follows the full verified feedback state. |
| P-06 · Submit/storage failure | `active.practice.unanswered` with application failure projection | Local selected response remains visibly selected and editable. Inline error reads `The answer was not saved. No feedback or result was created.` The surface names the safe action, for example `Try submit again`, only when the application exposes it. | Announce failure and unchanged durable state. There is no success styling, no Next/Finish, and no implied retry if recovery is not safe. |
| P-07 · Finish transition | final verified Practice occurrence / `completed` transition | Last verified feedback remains visible; action bar replaces Next with `View session result`. The header and plan bar do not flash a setup or unrelated screen. | The button is available only once the completed result projection is present; it announces transition to result, not a pass/fail claim. |

### Practice feedback detail treatment

- Reason is the first instructional element after a verified submitted-response state.
- Details is a single collapsed disclosure labelled `Details`; it has no leading generic `Feedback` title.
- Correctness differs structurally by outline weight and inset/surface treatment as well as semantic state. Icons and redundant correctness labels are prohibited.
- For partial responses, selected correct, omitted correct, and selected wrong controls use distinct accessible descriptions and authored Details; the layout does not calculate its own explanation.

## Interview Simulation artboards

| ID | Runtime state | Visible composition and user meaning | Action and accessible semantics |
| --- | --- | --- | --- |
| S-01 · Preparing | `preparing` | Canonical countdown top bar, fixed `1 of 40`, `Preparing Interview Simulation`, and text: `Checking the required 40 unique items and creating your draft.` The navigator and controls are absent until the session and draft verify. | Announce preparation. Insufficient content becomes S-16, never a shortened plan. |
| S-02 · Editable unanswered | `active.simulation.editable` with no response for current occurrence | Prompt card, editable controls in neutral state, 40-position navigator, and non-dominant inline draft status `No saved response`. Primary action is navigation or a route-provided finish action; no correctness affordance exists. | Navigator exposes current/unanswered. Controls never expose correct/partial/incorrect semantics. |
| S-03 · Local draft | `active.simulation.editable` with an unsaved local response | The current selection is structurally selected, while the inline status reads `Not saved yet`. Navigator remains durably unanswered until save confirms. | Screen reader distinguishes `selected locally, not saved` from `saved`. No score, feedback, or predicted outcome. |
| S-04 · Saving draft | `active.simulation.saving` | The local response stays visible and non-editable only for the save operation; inline `Saving…` occupies the durability row without modal interruption. Navigator remains on the current occurrence and does not mark it answered yet. | Announce saving. Navigation and another response mutation are disabled only as required by the command; timer display remains stable. |
| S-05 · Saved draft | `active.simulation.editable` after durable revision verify | The selected response remains editable and the durability row reads `Saved`. Navigator now uses its answered-and-saved treatment for the occurrence. | Announce `Response saved`; no correctness, feedback, score, or review language appears. |
| S-06 · Draft save failure | `active.simulation.save_failed` | Local response remains visible as unsaved. Inline error reads `The response was not saved. Your last saved draft is unchanged.` The application-provided safe retry action appears in the action area; unrelated navigation remains available if runtime permits it. | Announce failure and exact durable revision fact. No correctness, feedback, or fabricated saved indicator. |
| S-07 · Navigator inventory | `active.simulation.editable` | A dedicated navigator sheet/section presents all 40 numbered occurrence controls in a compact 5-column grid. It is a normal screen region, not a generic modal. The current position has a strong violet outline and selected shape treatment. | Grid has `list`/`button` semantics; each position identifies number and current state. |
| S-08 · Navigator state mix | `active.simulation.editable` | Same 40-control grid: current = violet outline/inset; durably answered = quiet filled surface plus bottom edge; unanswered = neutral outline. No answer correctness and no flags. | Each control announces `current`, `answered and saved`, or `unanswered`; it never announces correct/incorrect. |
| S-09 · Time running low | active simulation with canonical remaining-time projection in warning range | Countdown remains left-aligned; an inline non-modal notice below the top bar says `Active time is running low. The timer pauses outside the app.` Editing and free navigation remain available. | Announce remaining active time once on threshold crossing; do not use urgency animation as the only cue. |
| S-10 · Time exhausted | countdown reaches zero before freeze command completes | Countdown reads `Active time remaining 00:00`; question and navigator are visually stable but no longer accept changes. Inline status says `Time expired. Freezing your latest saved draft.` | Announce expiry. No correctness or summary appears, and no local draft is promoted to durable state. |
| S-11 · Frozen | `finalizing.simulation.frozen` | All controls and navigator use the shared non-editable frozen treatment. Inline state says `Session frozen for finalization.` The primary area has no editing control. | Announce frozen exact state; do not imply finalization success. |
| S-12 · Finalizing | `finalizing.simulation.materializing` | Frozen response shell remains in place with `Finalizing session…` in the durability row. The action area shows a disabled progress action rather than a spinner-only replacement. | Announce finalization; navigation and response changes are disabled; correctness stays hidden. |
| S-13 · Finalization failure | `finalizing.simulation.recovery_required` | Frozen shell remains unchanged. Inline error reads `Finalization did not complete. The frozen session can be retried safely.` Only the application-provided retry/recovery action is shown. | Announce that editing remains unavailable and recovery is safe. Never restore editable controls or reveal partial result data. |
| S-14 · Recovery after restart | `finalizing.simulation.recovery_required` during startup recovery | Frozen shell plus a concise state line: `Recovered the last saved draft revision. Completing finalization safely.` If recovery is unresolved, normal session navigation is unavailable. | Announce recovery boundary and durable revision fact without exposing internal IDs. |
| S-15 · Manual finish confirmation | active editable simulation with finish command requested | A dedicated confirmation screen region explains: `Finish with unanswered questions? Unanswered questions receive zero points.` It lists answered and unanswered counts, retains canonical top bar, and offers `Keep working` and `Finish simulation`. | This is the canonical navigation-confirmation surface, not an improvised generic modal. It does not show score/correctness. |
| S-16 · Insufficient content | preparation failure: fixed 40-item pool unavailable | Stable shell with `The required 40 simulation items could not be prepared.` It states that no shorter session was created and exposes only application-provided return/retry action. | Announce explicit unavailable state; no content duplication, scope widening, or substitute practice session. |
| S-17 · Verified result | `completed` with verified completed-session result | Session result header, answered/unanswered counts, correct/partial/incorrect counts, earned/max points, and post-session authored review entry points. No pass/fail, readiness, mastery, or confidence. Item feedback becomes available only here. | Announce result availability after verification. Item review preserves authored Reason/Details and exact attempt provenance. |

## Runtime-state mapping

| Runtime state | Reference artboard(s) | Prohibited disclosure |
| --- | --- | --- |
| `preparing` | P-01, S-01, S-16 | Item controls, unverified first occurrence, substitute content. |
| `active.practice.unanswered` | P-02, P-06 | Score, correctness, feedback, durable attempt/review. |
| `commit_pending.practice` | P-03 | Feedback, next/finish, concurrent submit. |
| `active.practice.feedback` | P-04, P-05, P-07 | Unverified or generic explanation. |
| `active.simulation.editable` | S-02, S-03, S-05, S-07 through S-09, S-15 | Correctness, score, Reason, Details, review, flags. |
| `active.simulation.saving` / `save_failed` | S-04, S-06 | Saved confirmation before durable write; correctness. |
| `finalizing.simulation.frozen` | S-10, S-11 | Editing, navigation mutation, result/feedback. |
| `finalizing.simulation.materializing` | S-12 | Result/feedback before verifier success. |
| `finalizing.simulation.recovery_required` | S-13, S-14 | Reopened editing, silent fallback, partial summary. |
| `completed` with verified result | P-07, S-17 | Pass/fail, readiness, mastery, confidence, unverified feedback. |

## Practice and Simulation differences

| Concern | Practice | Interview Simulation |
| --- | --- | --- |
| Feedback boundary | After durable submit, materialization, and verification. | Only after verified finalization. |
| Response persistence | Current answer is ephemeral until submit journal. | Revision-safe occurrence draft; local, saving, saved, and failure are visible. |
| Navigation | Linear advance after verified response. | Free navigation across exactly 40 persisted occurrences. |
| Timer | Elapsed active foreground time. | 45-minute active-foreground countdown; closed-app time never reduces it. |
| Incomplete response | Blocks submit with explicit completeness state. | May remain unanswered; it becomes zero-point diagnostics only at finalization. |
| Error recovery | Safe re-submit only where application projection permits it. | Save preserves last durable draft; finalization failure remains frozen and recoverable. |

## Error and recovery inventory

| Condition | Reference | Required message fact |
| --- | --- | --- |
| Practice preparation/content/storage error | P-01 or P-06 application failure projection | What did not prepare/save; no session/result was substituted. |
| Practice submit/commit failure | P-06 | Current local selection is not a verified submitted result; no feedback exists. |
| Simulation insufficient 40-item pool | S-16 | Fixed 40-item session was not prepared; no shortened/widened substitute exists. |
| Simulation draft save failure | S-06 | Last saved revision is unchanged; visible local draft is unsaved. |
| Timer exhaustion | S-10 | Active time is zero and latest saved draft is freezing. |
| Finalization materialization/verification failure | S-13 | Frozen session is recoverable; editing will not reopen. |
| Startup recovery | S-14 | Recovery uses the latest durable revision; normal navigation is unavailable until resolved. |
| Missing/version-mismatched content | S-16-style explicit unavailable surface | Resume is blocked; no newer content is mapped into the old plan. |

## Review checklist

Manual approval must confirm all of the following before changing this packet’s status:

1. Every artboard preserves the canonical top bar and its geometry.
2. Practice selected/correct/incorrect states remain structurally distinct without correctness icons or inline correctness labels.
3. Reason and collapsed Details are present only at permitted feedback boundaries.
4. Simulation displays saving, saved, failure, freeze, and recovery without any pre-finalization correctness leak.
5. The 40-position navigator has only current, durably answered, unanswered, and frozen states.
6. Dynamic text, reduced motion, focus order, and screen-reader announcements are reviewed against the shared component definitions.
7. No artboard introduces flagging, confidence, mastery, readiness, pass/fail, silent fallback, or a generic modal.
