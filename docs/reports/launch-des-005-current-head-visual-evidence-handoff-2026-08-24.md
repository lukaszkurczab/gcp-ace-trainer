# DES-005-D — Current-head visual evidence handoff

Date: 2026-08-24  
Repository: `Patternly` application  
Current repository HEAD: `c4000c9bbbb2336baf26cc3a96ddbc249f16955e`  
Current source behavior slice: `239e167`  
Figma file: `kZXD7cNBKUU7x0ceTHPFpR`  
Figma page: `0:1`  
Figma connector channel: `ksxw21cw`

## Goal

Close the current-head Light/Dark/large-text visual evidence gap for the
reachable application shell and its Home, Progress, Activity, and Settings
owners, then promote only states that have both source/runtime evidence and a
direct Figma comparison. This packet does not claim 99% parity; it defines the
next independently verifiable step toward it.

## Decision scope

In scope are the existing route graph, shared `Screen`, `BottomTabBar`,
`Button`, `ListRow`, ambient layers, and the reachable shell states already
covered by the repository Maestro flows. The repository remains the authority
for commands, data, entitlements, lifecycle, and accessibility semantics.

Out of scope until an owner supplies a route-bound contract are Figma-only
account/commercial rows, Progress effectiveness/trend data, Track Evidence
navigation, synthetic active sessions, and any new capture-only or deep-link
entry path. A Figma fixture must not be converted into product semantics merely
to improve a screenshot score.

## Evidence reviewed

### Current repository

- `src/components/Screen.tsx`, `BottomTabBar.tsx`, `Button.tsx`,
  `ListRow.tsx`, and `AmbientBackdrop.tsx` as shared visual owners.
- `src/features/home/HomeScreen.tsx`, `tabs/HomeTab.tsx`,
  `tabs/ProgressTab.tsx`, `ActivityScreen.tsx`, and `tabs/SettingsTab.tsx` as
  reachable shell owners.
- `src/navigation/RootNavigator.tsx` and the committed Maestro capture flows
  as route and trigger authority.
- Current source verification recorded for `239e167`: recovery inventory
  `287/116/567`, TypeScript, `576/576` tests, content boundary, runtime
  privacy boundary, and `git diff --check`.

### Live Figma

The design-to-code context and screenshots were fetched from the current
channel for:

| Node | Revalidated fact | Boundary |
|---|---|---|
| `830:7457` | Shared Screen Shell stress geometry: 393×852 canvas, 20 px scroll/content inset and rhythm, fixed footer, canonical List Row and Button instances. | The fixture includes Settings copy/rows that are not all route-bound in the app. |
| `55:445` | Home Ready geometry: 20 px content inset, 18 px shell rhythm, 353 px next-action card, 22 px card radius, 44 px icon tile, 40×4 metric bars, shared four-item navigation. | Sample values and actions must remain backed by the current Home model. |
| `842:9563` | Progress Established Evidence geometry: 30/36 title, 40 px track selector, 28 px section rhythm, 14 px cards, 16/14 card padding, focus and attention sections, navigation. | Effectiveness trend, Track Evidence, and sample performance facts have no complete canonical route/model contract. |

## Current status audit

| Area | Status | Evidence and next boundary |
|---|---|---|
| Shared shell geometry | `partial` | Source tokens and owners are already aligned for the revalidated geometry; current-head runtime capture and normalized comparison are missing. |
| Home Ready / active / no-activity states | `partial` | Canonical Home owner and capture selectors exist; same-head Light/Dark evidence for the full state family is not yet bound to the current HEAD. |
| Progress established / empty states | `partial` | Source renders contract-backed local evidence and goal actions; Figma-only effectiveness/trend/Track Evidence remains an explicit conflict, not an implementation gap. |
| Activity populated / empty / filtered-empty | `partial` | Canonical route, filter command, and model exist; complete current-head theme/large-text capture and normalized comparison remain open. |
| Settings root and reachable settings states | `partial` | Current rows and native permission boundaries are canonical; Figma fixture-only account/sync/plan/help rows remain a conflict. |
| Figma authority / owner approval | `blocking` | Channel and node evidence are known, but the channel is not Product Owner approval for the full matrix. |
| 99% parity claim | `unknown / needs evidence` | No current matrix row may be promoted to `MATCHED` without state-level runtime comparison and owner decision. |

## Implementation-ready tasks

### DES-005-D1 — current-head capture pack

- **Goal:** capture reachable shell, Home, Progress, Activity, Settings,
  Light/Dark, and repository large-text states from the current HEAD.
- **Scope:** existing committed Maestro flows and truthful durable state
  preparation only; record route/state/theme/device/profile for every image.
- **Non-goals:** no production route, seed session, Figma fixture data, or
  semantic copy changes.
- **Inputs:** current HEAD `c4000c9`, source slice `239e167`, simulator and
  Maestro setup documented in the launch plan, and Figma nodes above.
- **Acceptance:** every capture is reproducible from a committed flow; a
  missing state is recorded as `DESIGN_MISSING`, `CANONICAL_CONFLICT`, or
  unavailable with its trigger, never silently skipped; Light/Dark and the
  repository 200% stress profile are separately identifiable.
- **Verification:** Maestro syntax, capture run, screenshot manifest, source
  SHA check, and visual inspection for clipping/overlap/safe-area failures.
- **Required evidence:** paths outside the repo, manifest with exact SHA,
  device/OS/Maestro versions, and a matrix row mapping each checkpoint to its
  Figma authority.
- **Risk:** a capture-only setup can mutate durable user state; isolate and
  delete only proven capture artifacts, preserving production semantics.
- **Report target:** append to
  `docs/reports/launch-des-05-figma-parity-reconciliation-2026-08-23.md`.

### DES-005-D2 — normalized Figma comparison

- **Goal:** compare current-head captures against exact Figma frames at a
  common logical viewport and classify state-level deltas.
- **Scope:** only states with a direct route-bound Figma node and truthful
  runtime entry.
- **Non-goals:** no visual score that masks missing states, fixture-only rows,
  or semantic conflicts.
- **Acceptance:** each compared state records viewport, theme, scale,
  threshold, observed delta, and resulting `MATCHED`/`PARTIAL` status.
- **Verification:** reproducible image normalization and a human-readable
  review packet.
- **Required evidence:** source SHA, Figma node, capture path, normalized
  image/diff, and owner decision where semantics differ.
- **Risk:** screenshot similarity can hide wrong commands or data; source and
  product-contract checks remain mandatory.
- **Report target:** same DES-005 reconciliation report.

### DES-005-C1 — owner decisions for semantic conflicts

- **Goal:** obtain explicit decisions for Progress effectiveness/trend/Track
  Evidence and fixture-only Settings/Practice controls.
- **Scope:** decision register and route-bound Figma state requests.
- **Non-goals:** no synthetic metrics, no no-op actions, no placeholder rows.
- **Acceptance:** each conflict becomes an approved route/state, an explicit
  scope exclusion, or remains visibly unavailable; no source semantics are
  inferred from a static fixture.
- **Verification:** owner-bound decision record linked to exact Figma nodes.
- **Report target:** parity report and Product Owner decision register.

## Initial next task (completed by the addendum below)

Execute `DES-005-D1` before another geometry patch. The shared owners already
contain the safe token-level convergence found in the current Figma context;
the highest-value missing evidence is now current-head runtime truth across the
reachable shell. This initial task is recorded as completed by the runtime
evidence addendum below. If comparison reveals a real source delta, implement
it in a separate canonical slice with a focused test and rerun the pack.

## Unverified areas and risks

- The original handoff was documentation-only; the current-head shell pack is
  now recorded in the evidence artifact referenced by the addendum below.
- Normalized Figma comparison and Product Owner approval remain absent.
- Simulation confirmation remains unreachable through the bundled Free entry
  contract and must not be made reachable with fake data.
- Full app/product launch blockers outside UI parity are intentionally not
  reclassified by this packet.

## Addendum — DES-005-D1 current-head runtime evidence after `c7c1f9e`

The capture task now has a reproducible visual-shell evidence pack for the
current repository HEAD `c7c1f9e51d92246a1c76eec65683028775ad1f46` on iPhone 16
Pro / iOS 18.6 (`00B8F5B5-DF44-4621-8E30-56927604FA96`) with Maestro 2.6.1
and the local Metro loopback. The canonical 11-checkpoint visual-shell flow
passed in all four requested variants:

- Light, standard content size: 11/11
- Dark, standard content size: 11/11
- Light, `accessibility-extra-extra-extra-large` 200% stress: 11/11
- Dark, `accessibility-extra-extra-extra-large` 200% stress: 11/11

The manifest and coverage matrix are in
`artifacts/maestro-screen-capture/des005d-current-head-2026-08-24/`; the
original full-screen PNGs remain in the four recorded `/tmp` roots. The pack
covers Track selection, Home, Practice Setup, active session, exit sheet,
partial Summary, Progress, Settings, Notifications, Data & privacy, and
Appearance. Activity and the remaining app-wide route/state branches are not
silently treated as covered by this shell pack.

The temporary active-track precondition was capture-only and deleted after
the run. No production source, route, selector, backend contract, persistence
behavior, or committed canonical flow changed. This completes runtime capture
evidence for the scoped shell lane, but it does not promote any matrix row to
`MATCHED`: normalized Figma comparison, Activity/full reachable-state
coverage, Figma-only semantic owner decisions, and Product Owner approval
remain open. `DES-005-D2` is now the next implementation-ready task.
