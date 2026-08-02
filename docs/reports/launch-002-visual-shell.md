# Launch 002 — visual shell consolidation

## Status and scope

This report covers completed Slices 2A–2C. Slice 2C has a complete 36-cell
device matrix, a scoped visual audit and fresh independent QA `pass`; Task 2 is
complete.

Slices 2A and 2B are closed after fresh independent QA returned `pass` on their
repaired implementations and evidence. Slice 2C changed capture ownership only;
it found no in-scope product-shell regression requiring runtime code changes.

The slice replaces the competing branded and native-title header presentation
with one `AppShellHeader`, makes back behavior and shell ownership explicit,
and removes the obsolete `AppStackHeader` implementation.

Non-goals were card hierarchy, learning content, result content, lifecycle or
route-contract changes, design-token changes, authentication, and visual parity
claims.

Approved direction: `focus-lab-core-shell-001`, resolved to
`docs/designs/product-direction-options/DESIGN.md` (Quiet Layered).

## Repository facts before implementation

- `RootNavigator` declared 21 stack routes: 10 used the native stack header and
  11 disabled it.
- Five inline product surfaces used `AppStackHeader`; Home separately used
  `AppShellHeader`.
- `Screen` already owned general page safe-area and scroll behavior.
- `SessionShell` already composed `Screen` as the specialized active-session
  shell for Algorithms practice and interview simulation.
- The only feature-local `ScrollView` is the bounded simulation question
  navigator inside a modal; it is not a page-shell owner.

The plan packet's earlier count of nine native-header routes was stale. The
route inventory above is derived from the current navigator and was used for
this slice.

## Canonical result

All 21 routes now have one explicit header or session-shell ownership path in
every reachable render state:

| Ownership | Routes | Rule |
| --- | ---: | --- |
| Native stack placement | 13 | `RootNavigator` supplies `AppShellHeader` once through shared stack options. |
| Fixed inline placement | 6 | Home, track selection, Practice hub, Algorithms scope selection, topic roadmap, and practice setup render `AppShellHeader` inside `Screen`. |
| Session-managed routes | 2 | Interview simulation remains owned by `SessionShell`. Practice session uses `SessionShell` for Algorithms preparation and active states, its existing semantic top bar for active Certification, and inline `AppShellHeader` for every non-active direct `Screen` branch. |

`AppShellHeader` owns the Patternly mark and title, optional reflowing context,
and an optional 48-by-48 accessible back control. Inline routes pass an explicit
destination: specialized flow exits remain specialized, while general direct
entries use `goBackOrHome` to return Home when no history exists. The visual
component itself contains no routing fallback.

For the stack-headerless Practice session route, Algorithms unsupported,
Interview Simulation misroute, active-session conflict, and unavailable states
use the shared header with an explicit Practice Hub destination. Certification
invalid-mode, error, and loading states do the same. Algorithms preparing and
active rendering continues through `PracticeSessionSurface` to `SessionShell`;
active Certification keeps its existing session progress top bar. No active
session received a second branded header.

`Screen` remains the sole general page safe-area and scroll owner. Header stack
placement owns only its own top inset. `SessionShell` remains the only
active-session specialization and continues to compose `Screen`.

## Removed code

- `src/features/navigation/AppStackHeader.tsx` was deleted.
- All five imports and render paths were migrated to `AppShellHeader`.
- Native stack title styling was removed because the stack now renders the
  canonical branded component instead of a competing native-title system.

No wrapper, compatibility branch, per-screen header variant, or hidden fallback
remains.

## Evidence

- `tests/visualShell.test.ts` verifies the single header path, all 21 route
  owners, every reachable Algorithms and Certification branch of the shared
  Practice session route, accessible back geometry, long-copy reflow rules,
  explicit direct-entry fallback, general versus session shell ownership, and
  representative Home, Settings, setup, session, and result surfaces.
- The focused visual-shell test passes: 6 tests, 6 passed.
- Related shell, accessibility, presentation, and canonical-contract tests pass:
  47 tests, 47 passed.
- Repair 2A.1 focused canonical-contract, contract-gate, and visual-shell tests
  pass: 31 tests, 31 passed.
- Repair 2A.2 focused visual, session accessibility, session geometry,
  Certification lifecycle, and summary-navigation tests pass: 39 tests, 39
  passed.
- TypeScript compilation passes.
- The complete repository suite passes after repair 2A.2: 414 tests, 414 passed.
- The first worker gate command omitted the `HEAD` range and therefore inspected
  only staged changes. It reported zero changed paths and did not validate the
  working diff; the earlier pass claim was incorrect.
- Controller verification with `npm run gate:contract-change -- HEAD` exposed
  that the deleted `src/features/navigation/AppStackHeader.tsx` path lacked UI
  ownership. Repair 2A.1 maps only `src/features/navigation/` to the existing
  approved `focus-lab-core-shell-001` reference and test-covers both that deleted
  path and retained `AppBottomNavigation.tsx`.
- After repair 2A.1, the contract-change gate passes against `HEAD` and reports
  29 changed paths in the complete working diff.
- The original route-count assertion inferred Practice-session ownership from
  `PracticeSessionSurface` and did not inspect the route component's direct
  branches. Independent QA rejected that overclaim. Repair 2A.2 replaces the
  inference with explicit assertions for every Algorithms and Certification
  render branch described above.
- After repair 2A.2, the contract-change gate passes against `HEAD` and reports
  31 changed tracked paths in the complete working diff.
- The final whitespace check passes, and the removed header has no remaining
  runtime import or implementation reference.

## Unverified evidence and remaining risk

This slice does not claim screenshot or platform parity. Runtime evidence is
still required for dark and light appearance on iOS and Android, small-screen
layout, larger text, native transition and gesture behavior, and side-by-side
comparison with `option-3.png`. Those checks belong to the planned visual
evidence slice.

The custom stack header's runtime height and top inset are statically owned and
type-checked here, but device screenshots remain necessary to exclude clipping
or excess chrome on specific platform and text-size combinations.

## Slice 2B — pending-state ownership

Slice 2B adds one generic pending-state primitive without completing Task 2 or
claiming device parity. `LoadingState` composes the existing `Card` and shared
tokens, exposes a polite busy progress state, and allows its title and optional
description to reflow without truncation.

### Before and after inventory

| Generic pending owner | Before | After |
| --- | --- | --- |
| Content preparation | Bare text | `LoadingState` |
| Home | Blank shell | `LoadingState` |
| Practice Hub | False onboarding while data was pending | Explicit loaded state, then `LoadingState` or real onboarding |
| Topic Roadmap | False onboarding or empty attempts while data was pending | Explicit loaded state, then `LoadingState` or loaded result |
| Practice Setup | False onboarding or empty attempts while data was pending | Explicit loaded state, then `LoadingState` or loaded result |
| Algorithms scope selection | Section heading | `LoadingState` |
| Certification practice preparation | Bare text | `LoadingState` |
| Algorithms practice summary | `EmptyState` | `LoadingState` |
| Generic result | Bare text | `LoadingState` |
| Exam review | Bare text | `LoadingState` |
| Exam preparation | Bare text | `LoadingState` |
| Mistakes review | `EmptyState` nested in a second card | One `LoadingState` card |
| Answer review | False no-attempt result while data was pending | Explicit loaded state, then `LoadingState` or real no-attempt result |

These are exactly the thirteen generic consumers. Loaded empty, onboarding,
navigation and pre-existing retry outcomes retain their original semantics;
Repair 2B.2 makes six previously unrepresented read failures explicit.

Interview Simulation results remain specialized. The initial and retry reads
now project `preparing` through `SimulationSessionSurface`; only a caught result
read failure projects `verification_failed`. Active Algorithms preparation and
Interview Simulation durable-operation panels remain owned by their existing
session surfaces and do not use `LoadingState`.

Superseded per-screen loading text styles and unused imports were removed. No
feature-local pending component, wrapper, compatibility path or fallback was
added.

### Slice 2B evidence boundary

`tests/loadingStateOwnership.test.ts` enumerates all thirteen consumers, the
component accessibility and reflow contract, the four false-empty corrections,
the specialized exemptions, and the Interview result pending/failure split.

- Focused LoadingState, visual-shell, read-owner, mutation-architecture,
  canonical-contract and contract-gate tests pass: 86 tests, 86 passed.
- TypeScript compilation passes.
- The complete repository suite passes: 425 tests, 425 passed.
- The whitespace and pending-state dead-code/inventory checks pass: exactly
  thirteen generic consumers remain, removed loading styles have no references,
  and specialized session surfaces do not import `LoadingState`.
- The first gate run exposed that
  `src/content/application/ContentPreparationGate.tsx` had no approved visual
  owner. Mapping `src/content/application/` was rejected because it would also
  assign visual ownership to six non-UI modules. A subsequent move hypothesis
  to `src/features/runtime/` was also rejected: it changed root `App.tsx`, moved
  ownership only to satisfy a tooling limitation, and did not represent a
  better product boundary. The move was fully reverted; no runtime-path
  wrapper, re-export or ownership entry remains.
- The final mechanism keeps the gate at its canonical path and extends UI
  ownership narrowly: existing directory entries still match only their `/`
  boundary, while permitted-root exact `.tsx` entries match by equality only.
  The sole new exact entry maps
  `src/content/application/ContentPreparationGate.tsx` to the approved
  core-shell reference. Contract tests prove no match for
  `validateBundledContent.ts`, similarly named suffixes, non-TSX entries or
  root `App.tsx`; existing directory ownership still passes.
- The contract-change gate against `HEAD` passes with 41 changed paths.

The first independent QA review returned `fail`. The earlier statement that
pending data was fully distinct from empty and onboarding outcomes was too
broad: it covered successful reads but not rejected reads. Home, Practice Hub,
Topic Roadmap, Practice Setup, Exam Review and Mistakes Review could finish or
abandon a failed read without projecting an explicit unavailable state. Three
track owners also retained an earlier track when the canonical read resolved
to `null`, Exam Review did not reset previous route rows before its next read,
and exact-file ownership precedence had not been exercised against a competing
directory owner.

Repair 2B.2 gives only those six read owners local pending, resolved and
unavailable branches. Every rejected read uses `describeOperationalFailure`,
ends its busy state under the existing live guard and renders `EmptyState`
before any loaded, empty or onboarding content. No retry or stale-data fallback
was added. Practice Hub now applies `savedTrackId ?? null`; Topic Roadmap and
Practice Setup apply `route.params?.trackId ?? savedTrackId ?? null`, preserving
explicit route authority. Exam Review resets route-keyed rows and its read error
before loading, while Mistakes Review clears its model and selection before
either active-track or queue reads. The gate regression also proves that the
longer exact-file owner wins over a simultaneously matching broader directory
owner.

Fresh independent QA still returned `fail` because the route resets in repair
2B.2 ran inside effects. Effect cleanup blocks a late request from committing,
but effects run after render, so Exam Review could briefly interpret session A
rows under a new session B route. Topic Roadmap and Practice Setup had the same
pre-effect window for an explicit track change. The reset-only test claim was
therefore removed.

Repair 2B.3 replaces only those three route-sensitive read states with local
request-keyed discriminated states. Exam Review keys pending, ready rows and
unavailable results by `sessionId`. Topic Roadmap and Practice Setup key their
pending, ready track-and-attempt data and unavailable results by the explicit
route track or a stable stored-track sentinel; their unrelated selection and
form state remains separate. Each read publishes its captured key under the
existing live guard. Rendering first compares the state key with the current
route request key and shows `LoadingState` on a mismatch, before reading any
error, row, active track or attempt. Focused A-to-B regressions prove that ready
or unavailable A state remains pending under current B, while only matching B
ready or unavailable state can render.

Fresh independent QA returned `pass`. It independently confirmed the A-to-B
request-key guards, late-result suppression, explicit route-track authority,
loaded `null`, all six terminal read failures, exact-file ownership precedence,
the exact thirteen-consumer inventory and the absence of a parallel runtime
path or hidden fallback. Slice 2B is complete; its then-open Slice 2C is closed
by the evidence below.

No screenshots were captured in Slice 2B. Its previously open device and
approved-reference evidence is supplied by Slice 2C below.

## Slice 2C — bounded device and visual evidence

### Evidence scope and result

One capture-only Maestro journey owns six stable semantic checkpoints: Home,
Custom Practice setup, active Algorithms session, partial-session summary,
Settings root and Appearance. The pack
`artifacts/maestro-screen-capture/visual-shell/2026-07-31-142501/` contains the
exact flow, environment, run, blocker, coverage and SHA-256 manifests.

The final matrix is `36 captured / 0 blocked / 0 not run`:

- iOS standard light and dark: 12 cells;
- Android standard light and dark: 12 cells;
- iPhone 16e / XXL / light: 6 cells;
- Android 360×800 dp / font scale 1.5 / light: 6 cells.

Every checkpoint followed its stable selector. Controller inspection used the
original-resolution PNGs rather than scaled previews. Historical prompt and
invalid-viewport diagnostics remain in the pack but are named as diagnostics,
excluded from the 36-cell matrix and never used as successful screenshots.

### Bounded capture repairs

The four repairs changed only the one capture path and its environment
sequencing:

1. A clean iPhone 16e launch used one development-client URL followed by the
   existing dev-menu and audit-listener flows. This separated stacked system
   prompts from app failure without a retry heuristic or alternate launch path.
2. The unified track precondition adopted the existing canonical first-use /
   returning-user split and retained the required post-selection Algorithms
   assertion. It did not reset track preferences or add a second flow.
3. Android overrides were applied before a cold Activity launch, and exact
   `[0,0][720,1600]` root bounds replaced a compatibility-scaled attempt. The
   invalid images were demoted to diagnostics. One canonical Practice scroll
   boundary was added before the existing setup action.
4. Maestro's hierarchy had treated two actions beneath the fixed tab bar as
   visible. Centering moved Algorithms from `[81,1420][639,1528]` to
   `[81,700][639,808]` and Practice setup from `[168,1409][553,1481]` to
   `[168,662][553,734]`, above tab bounds `[0,1409][720,1600]`. The unchanged
   target taps and final assertions then passed.

The final flow SHA-256 is
`c0a3c03d4d8363d407774c66fe0fa2d2683596725d96c15d07c8f353fa16ff26`;
`maestro check-syntax` returns `OK`. Android cleanup was independently reread
as physical `1080×2400`, density `420`, font scale `1.0`, with no overrides.
The iPhone 16e returned to its documented standard-text, light, shutdown
baseline after its bounded run.

### Scoped visual audit and approved reference

The scoped audit is
`artifacts/ui-ux-audit/launch-002-visual-shell-2026-07-31/`. Its report,
machine-readable findings and implementation backlog are paired with an
explicit `option-3-comparison.md`. The strict findings validator returns
`0 error(s), 0 warning(s)`.

The audit verdict is `GO WITH FOLLOW-UPS`: no P0/P1 and no in-scope shell
regression. One observed P2, `FUI-001`, records the Android narrow/large setup
control breaking `QUESTIONS` between characters. The word is complete, the
screen owns scrolling and the run proves `Start session` reachable. This is a
per-screen configuration-layout issue assigned to Task 4, whose existing
entry/discovery scope owns responsive setup controls; Task 2 does not add a
font reduction, ellipsis, Android branch or parallel primitive to hide it.

### Controller verification

- Focused shell, pending-state and contract tests: 43 passed, 0 failed.
- Full repository tests: 425 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run gate:contract-change -- HEAD`: passed, 41 changed paths.
- `maestro check-syntax`: `OK`.
- Findings strict validation: 0 errors, 0 warnings.
- Screenshot inventory: exactly 36 `visual-shell__core__*.png` files and six
  explicitly excluded historical diagnostics.
- `git diff --check`: passed.

The dead-code check finds no runtime `AppStackHeader` implementation/import,
no second generic `LoadingState`, no alternate visual-shell capture flow and no
optional success assertion. Documentation references to `AppStackHeader` are
retained only as deletion history; other `centerElement: false` occurrences
belong to distinct flows or the non-interactive final Home assertion boundary.

### Unverified areas and remaining risk

This evidence does not certify screen-reader order, full hitbox geometry,
gestures, animations, physical devices, tablets, keyboard/bottom-sheet states,
store screenshots or routes outside the six checkpoints. Those gaps are not
converted into parity claims. The existing source import-cycle warning
`RootNavigator → HomeScreen → SelectTrackScreen → navigation/index →
RootNavigator` did not block bundling or the bounded flow; it remains an input
for the next-plan re-evaluation rather than an unscoped Task 2 refactor.

Fresh independent QA inspected all 36 current PNGs at original resolution,
validated the six excluded diagnostics, manifests, 2C.4 bounds, restore proof,
full diff and all gates, and returned `pass`. It independently classified
`FUI-001` as a local Task 4 P2 rather than a shared-shell regression and found
no blocking debt, hidden fallback, parallel implementation or obsolete runtime
path. Task 2 is complete.
