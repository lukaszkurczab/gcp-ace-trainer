# Patternly core journey — Quiet Layered

## Approval

- **Status:** APPROVED
- **Authority:** product owner
- **Approval date:** 2026-07-28
- **Visual source:** [Option 3 — Quiet Layered](option-3.png)
- **Scope:** Track Selection, Home, Practice, active question and feedback,
  session summary, Progress, and the shared shell required by those surfaces.

## Product intent

The interface should feel calm, technical, and deliberate. Space is functional:
large card padding limits each surface to the information required for the
current decision. The application is not a dashboard and does not use
decorative metrics, gamification, or repeated topic and track context.

## Canonical visual rules

1. Each screen exposes one dominant decision.
2. One spacious outlined layer contains the recommended next action.
3. Track or topic context appears once, close to the decision it qualifies.
4. Alternatives are secondary rows or links below the recommendation, not
   competing hero cards.
5. Dark mode is the primary reference; light mode preserves the same hierarchy,
   spacing, contrast, and semantic colors.
6. Large padding must not make the primary action unreachable on a small screen
   or with larger text. Content may reflow, but it must not truncate or overlap.
7. Option 1 is not a second visual system. Its sole retained principle is the
   hierarchy guardrail: remove redundant layers until one next action is clear.

## Product truth

All titles, explanations, progress evidence, and actions come from the canonical
track registry and application projections. The visual reference does not
authorize invented tracks, fake metrics, unavailable actions, silent fallbacks,
or mock success states.

## Verification

The implementation is accepted only after:

- side-by-side visual comparison with `option-3.png`;
- dark and light evidence on iOS and Android;
- small-screen and larger-text checks;
- the full Algorithms user-testing journey and a GCP sanity pass;
- static contract, type, and accessibility checks.
