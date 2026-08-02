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

## Shell ownership

- `AppShellHeader` is the only branded navigation header. Native stack routes
  render it in stack placement; inline product surfaces render the same
  component inside `Screen`.
- The header always carries the Patternly mark and title. It may also carry one
  reflowing route or track context label and one accessible back action. Inline
  callers own the back destination, including the explicit Home destination
  used when a direct entry has no navigation history.
- `Screen` is the sole general page owner for safe-area edges and scrolling.
  Stack placement owns only the header's top safe-area inset; it does not add a
  second page scroll or content safe-area owner.
- `SessionShell` remains the specialized active-session shell. It composes
  `Screen` and owns session progress and footer geometry; its question top bar
  is session state, not a second branded navigation header.
- Copy in the title and context regions reflows. The shell does not truncate
  those regions to preserve a fixed header height.

## State primitive ownership

- `LoadingState` is the only generic pending-state primitive. It composes the
  shared `Card`, uses the shared palette, spacing and typography, and exposes a
  busy progress announcement with reflowing title and optional description.
- A generic data read renders `LoadingState` only while its result is pending.
  Loaded empty, onboarding, unavailable and failed outcomes remain explicit and
  must not be inferred from the pending value.
- `EmptyState` owns loaded empty and unavailable explanations; it does not
  represent work that is still pending.
- Active learning preparation and durable operations remain session semantics:
  Algorithms practice uses `SessionShell`, and Interview Simulation uses
  `SimulationSessionSurface` and `SimulationOperationPanel`. These specialized
  states do not render `LoadingState`.
- Interview Simulation result reads use the specialized `preparing` projection
  while the read is pending and `verification_failed` only after the read
  returns an actual failure.

## Verification

The implementation is accepted only after:

- side-by-side visual comparison with `option-3.png`;
- dark and light evidence on iOS and Android;
- small-screen and larger-text checks;
- the full Algorithms user-testing journey and a GCP sanity pass;
- static contract, type, and accessibility checks.
