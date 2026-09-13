# ODK-121 — scrollable Leave session sheet

Date: 2026-09-13  
Status: `VERIFIED_CLOSED`

## Outcome

The shared Leave session modal now constrains its sheet to the viewport and keeps the full surface in one scrollable region. At accessibility-large text the title, explanation, Continue, Pause and End actions remain visible or reachable, while the destructive action retains the bottom safe-area inset.

The backdrop remains a separate dismiss target. The scroll surface does not create bounce when its content fits, and the change does not alter the existing Continue, Pause/resume or End/summary handlers.

## Implementation

- Added one bounded `ScrollView` inside the canonical `PracticeSessionSurface.ExitModal`.
- Kept the full-screen backdrop outside the sheet so taps above the sheet still dismiss it.
- Applied the top safe-area inset to scroll content and retained the bottom inset around the destructive action.
- Disabled vertical bounce and the scroll indicator; no keyboard avoidance was added because this surface has no text input.
- Extended the focused presentation contract test for the bounded scroll, safe-area and interaction structure.

## Verification

| Gate | Result |
| --- | --- |
| Independent QA | **PASS**, no P0/P1/P2 |
| App typecheck | **PASS** |
| Focused presentation tests | **15/15 PASS** |
| Diff check | **PASS** |
| iOS visual runtime | **PASS** on iPhone 17 / iOS 26.4 / portrait / PL for light regular, light accessibility-large and dark accessibility-large |
| Modal interaction runtime | **PASS**, 3/3 for scrim dismiss, reopen and Continue; all Continue/Pause/End controls asserted visible |

## Runtime evidence

The local evidence pack is at `artifacts/maestro-screen-capture/odk121-leave-session/2026-09-13-1410/`. It contains the environment record, manifest, coverage matrix, run report and blockers record together with before/after screenshots.

The pre-fix accessibility-large capture reproduces the top clipping. The corresponding light and dark post-fix captures show the complete title, copy and all actions without overlap with the home indicator.

## Preserved behavior

- Continue dismisses the modal and leaves the same question active.
- Pause retains the existing resumable-session handler and selector.
- End retains the existing terminal partial-summary handler and selector.
- Backdrop dismiss and native modal close continue to call the same dismiss handler.

Pause and End were not executed against the runtime fixture because that would mutate or terminate the prepared session; their unchanged handler wiring is covered by the focused contract test and independent diff review.

## Removed/replaced paths

- Replaced the unbounded, non-scrollable modal stack with one viewport-bounded scroll surface.
- Removed no domain, navigation or session-lifecycle paths.

## Remaining limitation

The screenshot matrix uses the isolated iPhone 17 simulator. A separate smallest-device screenshot was not captured; the bounded-height and overflow contract is covered structurally and by the stricter accessibility-large case on the verified viewport. No landscape claim is made because the application supports portrait only.
