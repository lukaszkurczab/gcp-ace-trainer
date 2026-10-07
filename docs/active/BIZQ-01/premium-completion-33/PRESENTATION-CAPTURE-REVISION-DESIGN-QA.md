# BIZQ-01 presentation capture revision — independent design review

**Verdict: PASS WITH GAPS for the proposed next-state capture plan.** This review approves the bounded method to continue from the retained unanswered Q2. It does not accept Q12, the runtime, the content, or BIZQ-01 as complete.

## Evidence and assessment

I viewed the private ordinary-resume and post-tap screenshots. The first shows the answered Q1 at `1 of 10`; the second shows unanswered Q2 at `2 of 10`. The Maestro log records the Details target at `[37,745][365,793]` on a 402×874-point display, then a tap at `(201,769)`. That point is inside the visible fixed Next button in the first screenshot. The run also records `centerElement: false`. The subsequent Q2 screenshot and index-1/one-attempt snapshot corroborate that this action continued the session; it did not submit another answer.

This is evidence of a tool-coordinate/pixel collision, not evidence that the Details press handler is defective. `PracticeFeedbackBlock.tsx:38-40` wires Details to a local `detailsOpen` toggle, and `DetailsDisclosure.tsx:19-29` invokes that callback on press. `PracticeSessionSurface.tsx:127-147` places feedback in the session body, while `SessionShell.tsx:64-88` supplies a `Screen` with a separate footer; `Screen.tsx:30-51` renders its scroll view and footer as siblings. The captured target bounds overlap the footer's Next hit area, so the AX match and 100% visibility log do not establish an unobscured physical tap. A product accessibility/layout defect remains unproven; if ordinary scrolling cannot put Details wholly above the footer, stop and report that as a newly observed UI issue rather than forcing a tap.

The corrected approach is appropriately bounded: keep the saved session and its unanswered Q2, never rewind/reseed/resubmit Q1, and prove the current item/attempt snapshot before continuing. For each Details interaction, centering is only a positioning aid. Capture the actual target and footer geometry, ensure the target is fully within the scroll viewport and does not intersect the fixed action bar, then tap and verify both the expanded content and unchanged current item/attempt count before any Next. If the target cannot be made unobscured, stop. This makes the follow-up readout meaningful without turning a matcher into acceptance evidence.

The proposed coverage is a reasonable risk-based Q12 slice: repaired long-option correct Q1 in max-text light, the retained max-text dark partial evidence from package 30, repaired correct Q2 in max-text dark with Details actually expanded, and a repaired wrong Q5 with its authored feedback visible after Details expansion. The Q12 source requirement is readability of long options and Details in light/dark at large text without escaping actions; it does not require every item, or Q1 specifically, to be repeated in both themes. Same-Q1 dual-theme capture would be useful additional evidence, but is a preference rather than a release criterion and should not justify replaying or altering the saved answer. Do not claim that this bounded set closes the full Q12 matrix.

## Scores

| Dimension | Score | Reason |
| --- | ---: | --- |
| Objective and architecture fit | 0.96 | Uses the actual saved native session and repairs the evidence gap without changing answers or product code. |
| Simplicity | 0.92 | Reuses Q2 and the existing partial/wrong cases; avoids a redundant theme-by-item matrix. |
| Risk | 0.87 | No answer replay or session rewrite; explicit geometry and snapshot gates address the observed collision. |
| Maintainability | 0.91 | Clear, repeatable capture checks and honest scope labels; no new app abstraction or persistent test state. |
| **Minimum** | **0.87** | Above the required 0.8 threshold. |

## Conditions for the next UI run

- Start only from the reviewed current index-1 state and confirm the exact item, options/order, and one existing Q1 attempt in a fresh snapshot.
- Never reuse the stale Q1 continuation flow. Do not resubmit Q1 or alter session storage to restore index 0.
- Before each Details tap, inspect a fresh screenshot plus AX bounds. Require the full target to be visible and outside the fixed Next hit region; `centerElement: true` alone is not proof.
- After tapping, verify the target’s expanded state/content and confirm the item index and attempt count did not change. If either is uncertain, stop and take read-only evidence; do not retry a possibly effective tap.
- Continue Q2 only after its correct answer is recorded once; capture its full Details in max-text dark before advancing. For Q5, assert its selected wrong result and authored message only after Details is expanded.
- Preserve the existing exact OS-setting restoration and before/after learning-state comparisons. Keep the previous Q1 dark attempt and this accidental Next visible as failures/limitations, not passes.
- Report this as bounded presentation evidence only. No VoiceOver, whole-store, provider, full Q12, or full BIZQ-01 claim follows from this plan.

## Reviewed inputs

- `PRESENTATION-CAPTURE-REVISION-2026-10-07.md`
- Private screenshots: `/private/tmp/bizq33-resume-2026-10-07/resume-q1/2026-10-07_094541/BIZQ33 ordinary resume same saved Q1 after cold launch/takeScreenshot/same-saved-q1-after-resume.png` and `/private/tmp/bizq33-resume-2026-10-07/expand-q1/2026-10-07_094627/BIZQ33 saved Q1 expand Details after ordinary resume/takeScreenshot/saved-q1-details-expanded-after-resume.png`
- Private Maestro log and `commands.json` in the matching `expand-q1/2026-10-07_094627/.../logs/` and run directory.
- `src/features/practice/PracticeSessionSurface.tsx`, `src/features/practice/PracticeFeedbackBlock.tsx`, `src/components/DetailsDisclosure.tsx`, `src/features/coding-interview/session/SessionShell.tsx`, `src/components/Screen.tsx`.
- `docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md` §6, Q12 and §7; `docs/active/BIZQ-01/native-partial-q12-30/ACCEPTANCE-QA.md` for accepted partial/theme evidence.

This is a design review, not runtime verification or approval of the follow-up screenshots. Actual pixel visibility, expanded content, state preservation, and OS restoration remain to be observed in the authorized run.
