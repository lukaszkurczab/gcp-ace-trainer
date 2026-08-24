# DES-005 — Figma parity reconciliation and next implementation packet

Date: 2026-08-23
Repository: `Patternly`
Workstream: full application refactor and 99% Figma parity across reachable paths
Current source SHA at packet update: `2b19f81`
Current user-provided Figma connector channel: `ksxw21cw`

## Scope and decision boundary

This is an evidence-based reconciliation before the next implementation
slice. It does not claim whole-product parity, Product Owner approval, or
completion of the 99% objective. It records which source path is canonical,
which Figma facts are safe to apply as visual geometry, and which differences
require a product/design decision before code changes.

The repository remains the implementation authority after handoff. Figma
provides the visual reference; the canonical product contract, the current
route graph, and the Product Owner decision register provide interaction,
content, entitlement, and command truth.

## Evidence reviewed

### Repository evidence

- `AGENTS.md`, especially the canonical-path, deletion-first, no-fake-data,
  and explicit-unavailable-state rules.
- `docs/launch-completion-plan.md` and the current parity report
  `docs/reports/launch-des-04-figma-parity-2026-08-21.md`.
- `docs/canonical-product-contract.yaml`,
  `docs/product-owner-decision-register.md`, and the approved PKG-04A
  reference `docs/designs/pkg-04a-free-package-interactions/DESIGN.md`.
- Canonical route owners in `src/navigation/RootNavigator.tsx`.
- Practice owners in `src/features/practice/PracticeHubScreen.tsx`,
  `src/features/practice/PracticeSetupScreen.tsx`,
  `src/features/practice/PracticeSessionSurface.tsx`,
  `src/features/practice/practiceFlowModel.ts`, and shared primitives
  `src/components/Screen.tsx`, `src/components/ListRow.tsx`,
  `src/components/Card.tsx`, and `src/components/Button.tsx`.
- Select Track owner in `src/features/home/SelectTrackScreen.tsx` and the
  shared returning-state header in `src/components/AppShellHeader.tsx`.
- Current focused source tests for Practice, session accessibility, visual
  shell ownership, and the canonical product contract.

### Figma connector evidence

The live connector returned design context and screenshots on 2026-08-23 for
the current file:

| Field | Current evidence |
|---|---|
| File | `kZXD7cNBKUU7x0ceTHPFpR` |
| Page | `0:1` Page 1 |
| Library | `118:738` Patternly Library |
| Current Practice Hub frame | `55:993` — `03A · Practice · Coding · Review available` |
| Current Practice Setup frame | `55:2172` — `04A · Manage Practice Settings · Coding` |
| Current Practice preparing frame | `68:549` — `06A · Preparing` |
| Current Practice Question Shell unanswered frame | `68:569` — `06B · Single choice · Unanswered` |
| Current Practice Question Shell selected frame | `68:603` — `06C · Single choice · Selected · Immediate feedback mode` |
| Current Practice immediate-feedback frame | `68:637` — `06E · Immediate feedback · Default` |
| Current Practice details-expanded frame | `68:719` — `REF-06A · Details expanded` |
| Current Practice final-item frame | `68:844` — `06F · Final item` |
| Current Progress frame | `842:9563` — `Pattern / Progress Screen · Established Evidence` |
| Current Progress empty-state frame | `842:10949` — `Pattern / Progress Screen · No Evidence` |
| Current Goal & cadence create frame | `842:11569` — `Goal & cadence · Create` |
| Current Goal & cadence active frame | `842:11693` — `Goal & cadence · Active` |
| Current Activity frame | `842:11192` — `Pattern / Activity Screen · Populated` |
| Current Activity empty frame | `842:11410` — `Pattern / Activity Screen · Empty` |
| Current Activity filtered-empty frame | `842:11466` — `Pattern / Activity Screen · Filtered Empty` |
| First-choice Select Track frame | `42:422` — `05A · Select Track · First choice / Coding selected` |
| Returning Select Track frame | `42:478` — `05B · Select Track · Returning / Current Coding` |
| Changed-selection Select Track frame | `42:539` — `05C · Select Track · Switch pending / GCP` |
| Unknown-registration failure frame | `42:604` — `05D · Select Track · Unknown registration failure` |
| Unadmitted-registration failure frame | `42:642` — `05E · Select Track · Unadmitted registration failure` |
| Figma-only Track Evidence frame | `842:11057` — `Pattern / Track Evidence Screen` |
| Current Notifications blocked frame | `92:889` — blocked permission state |
| Current Notifications reminder editor | `92:914` — reminder bottom sheet |
| Shared Bottom Navigation Light stress | `830:9045` — 200% navigation labels and safe-area geometry |
| Shared Button authority | `141:817` |
| Current connector session | `ksxw21cw`, supplied by the owner in the active task |

The current session/channel is connector context, not proof of Product Owner
approval. The repository records several historical or scoped channels which
must not be silently treated as interchangeable:

- `wtk4hp8i` / board root `10:2`: explicit Product Owner approval for the
  narrow PKG-04A interaction references (`PO-060`).
- `eon17bsz`: earlier connected channel recorded for the Home/Practice
  references in `DES-001`, `DES-003`, and `docs/designs/figma-home-coding-ready`.
- `76kzylrb`: stale channel still present in the active launch plan.
- `ksxw21cw`: current user-provided connector session for this workstream.

## Status audit

Only the repository plan statuses are used below.

| Area | Status | Evidence and boundary |
|---|---|---|
| Canonical route graph and screen owners | `done` | `RootNavigator` has one owner for Home, Activity, Settings, Practice Hub, Practice Setup, active Practice, summaries, simulation, and review. Source ownership and route tests pass. This proves architecture, not pixel parity. |
| Shared design-system primitives | `partial` | `Screen`, `Button`, `Card`, `ListRow`, headers, navigation, and session shells are canonical and source-tested. Commits `7e9b200`, `e257af4`, `2eb6c65`, `992d5bb`, and `f3afd92` align the shared Button state matrix, Bottom Navigation separator, Screen Header context typography, Screen Header base geometry, and Screen Shell default spacing to Figma `141:817`, `140:875`, `140:881`, and `830:7457`; current slices still require runtime comparison across all states and themes. |
| Home, Progress, and Activity source slices | `partial` | Commits through `1c9457b` align documented source geometry and typography against live nodes, including the Home recent-activity single row, Progress 16 px content inset, Progress no-evidence state geometry, Activity and Goal Glow-UL variants, and exact 40 px filtered-empty inset. Fresh same-head pixel comparison is still missing for several states; Activity capture is blocked by the local simulator tooling. |
| PKG-04A Coding Free interaction truth | `done` | `buildPracticeModes` exposes exactly Learn Approach, Guided Practice, Custom Practice, and evidence-conditioned Weak Area Review; the canonical tests assert the mode list. Independent, Recognize, Contrast, and Simulation are excluded from the Free profile as required by `PO-059`/`PO-060`. |
| Current Practice Hub visual parity | `partial` | `bc09d63` applies the safe geometry facts from `55:993` while preserving the approved Free interaction contract, `6f8b0c6` aligns the Coding row icon container/icon/chevron geometry from `232:1716`, and `a6d05c6` aligns the section-label inset/typography and removes the fixture-only hero-action chevron. The current source does not render the Figma fixture's `Independent Practice` / `Coding Interview` rows; that fixture-versus-contract discrepancy is recorded separately, and fresh runtime pixel comparison remains blocked. |
| Current Practice Setup visual parity | `partial` | `65aeccd` applies the safe compact segmented-control, choice-row, header, sticky-footer, and spacing facts from `55:2172`. Its Focus areas and `Save settings` semantics are still not represented by the current canonical route/model and were not invented; fresh runtime pixel comparison remains blocked. |
| Current Practice preparing-state visual parity | `partial` | `0a7e8c3` reuses the canonical async-state owner for the preparing card, status row, typography, spacer, and item terminology from `68:549`; the Figma-only `Leave practice` command remains unresolved because the preparing phase has no safe lifecycle/command owner. Fresh runtime pixel comparison remains blocked. |
| Current Practice Question Shell/footer visual parity | `partial` | `86e32d9` adds a Practice-only `session` footer variant with 228 px minimum height, bottom alignment, and 8 px action gap from `68:569`/`68:603`; `7e9b200` aligns the shared Button pressed/disabled state matrix from `141:817`. Simulation keeps its existing footer owner. Fresh runtime pixel comparison remains blocked. |
| Current Practice feedback surface parity | `partial` | `0341424` removes the redundant visible result label; `536b19b` aligns `REASON` to 12/16 and rich-details body text to 13/20; `1c9457b` maps collapsed Details to the standalone row and expanded Details to the Figma outer panel. The runtime result selector remains on the visible reason panel. Figma `68:637` does not show a Details row in its immediate-feedback default while the canonical after-answer contract and existing runtime selectors still expose it, so state binding remains an explicit conflict; fresh runtime pixel comparison remains open. |
| Current Select Track visual parity | `partial` | `1c8a8cc` aligns the reachable onboarding, unchanged-returning, and changed-selection state geometry from `42:422`, `42:478`, and `42:539`; `364a832` adds the shared dark ambient/topo layer for Select Track and Practice Hub. The eight-track registry projection and unreachable `42:604`/`42:642` failure states remain explicit scope or route gaps; fresh runtime pixel comparison remains blocked. |
| Figma authority and approval binding | `blocking` | The current channel is known, but it is not documented as Product Owner approval. The plan also contains stale channel references. A final 99% claim needs an explicit mapping of approved nodes/states to the current launch scope. |
| Runtime screenshot and pixel evidence | `partial` | Explicit Maestro `2.6.1` capture now works on the booted iPhone 16 Pro / iOS 18.6 simulator. Current source `2b19f81` completed the shared 11-checkpoint visual-shell flow in both Dark and Light, plus Settings/blocked Notifications large-text stress captures. The complete reachable-path matrix, logical-viewport-normalized pixel comparisons, and owner decisions remain unverified. |
| Account, authentication, Premium, content trust, and deletion UI | `unknown / needs evidence` | The canonical contract defines boundaries, but the current route graph does not provide matching owners for all Figma surfaces. Owner must decide whether those Figma surfaces are in this parity objective or outside the current launch route graph. |
| Goals, cadence, focus areas, and Progress effectiveness | `partial` | Goal & cadence now has a canonical per-track record, route, create/active states, Progress entry point, and Figma-matched Goal ambient variants. Figma-only focus-area and effectiveness semantics still have no owner; current-head Light/Dark runtime comparison and Product Owner approval remain open. |

## Phase A — reachable-path parity matrix

The matrix below is derived from the current `RootNavigator` and the
conditional render branches in the route owners. `Current status` uses the
Phase A categories from the parity brief: it is not a final claim of visual
parity. In particular, `PARTIAL` includes source-level convergence whose
current-head Light/Dark screenshot comparison is still unavailable.

`DESIGN_MISSING` means that the current Figma file/channel has no approved,
route-bound authority for that state. `CANONICAL_CONFLICT` means that the
available Figma reference describes a command, data model, taxonomy, or state
that contradicts the repository-owned product contract. Neither category is a
permission to invent a replacement UI.

| Surface | Route / trigger | App state | Theme | Figma node | Shared components | Current status | Required action |
|---|---|---|---|---|---|---|---|
| Application shell | All stack routes and Home tabs | Normal scroll, footer, safe area, large text | Light / Dark / System | `830:7457`, `830:8697`; header `830:7792`, `830:9032`; navigation `830:7805`, `830:9045` | `Screen`, `ScreenHeader`, `AppShellHeader`, `BottomTabBar`, `Button` | `PARTIAL` | Capture the current SHA in both themes and bind each shared state to the approved node set. |
| Home overview | `Home` default tab | Established track, recommendation, overview metrics, recent activity | Light / Dark | `55:445`, `55:539` | `HomeScreen`, `HomeTab`, `Card`, `Button` | `PARTIAL` | Produce same-head screenshots for ready, review-due, active/resume, and no-activity variants. |
| Home bootstrap and failures | `Home` load / focus effect | Loading, shell read error, recommendation unavailable; the no-track branch delegates to `SelectTrack` below | Light / Dark | No route-bound approved state in the current set | `Screen`, `SelectTrackScreen`, `LoadingState`, `EmptyState` | `DESIGN_MISSING` | Request exact Figma states, including trigger and recovery action; keep current explicit unavailable states until then. |
| Progress | `Home` → Progress tab | Established evidence, no evidence, focus/attention actions, diagnostics expansion | Light / Dark | `842:9563`, `842:10949` | `ProgressTab`, `Card`, `ListRow`, `Button`, `EmptyState` | `PARTIAL` | Capture populated and empty states at current SHA; separately verify the existing model-backed actions. |
| Goal & cadence | Progress weekly-goal action → `GoalCadence` | Create, active, paused; per-track cadence and preferred days | Light / Dark | `842:11569`, `842:11693` | `GoalCadenceScreen`, `ChoiceRow`, `Screen`, `Button`, canonical goal repository | `PARTIAL` | Capture create/active states at current SHA in both themes; validate the paused state and notification-settings handoff against owner-approved behavior. |
| Track Evidence | Progress evidence action (not currently routed) | Read-only evidence list and row drill-down | Light / Dark | `842:11057` | No canonical route owner; `TopicRoadmapScreen` is not equivalent | `CANONICAL_CONFLICT` | Owner must decide route/read-model/row-command ownership or explicitly exclude this Figma surface from launch scope. |
| Activity | `Activity` | Populated, empty, filtered-empty, filter selection | Light / Dark | `842:11192`, `842:11410`, `842:11466`; row patterns `830:7642`, `830:8898` | `ActivityScreen`, `ScreenHeader`, `ListRow`, `EmptyState`, sheet primitives | `PARTIAL` | Restore capture tooling and compare populated, empty, filtered-empty, filter-sheet, and large-text states. |
| Settings root | `Home` → Settings tab | Canonical app, learning, data/privacy, developer rows and app identity | Light / Dark | `822:7687`, `830:8182`, `830:9422` | `SettingsTab`, `SettingsGroup`, `ListRow`, `IconTile`, `ScreenHeader` | `PARTIAL` | Capture the current canonical row set; do not add rows merely because they appear in the Figma fixture. |
| Settings fixture-only rows | Settings design reference | Account, sync, plan, help rows absent from current commands; Goal & cadence is owned from Progress | Light / Dark | `830:8182`, `830:9422` | No canonical route/command owner for these Settings rows | `CANONICAL_CONFLICT` | Resolve scope with the owner; no account or commercial semantics may be created from this fixture alone. |
| Appearance settings | `AppearanceSettings` | Light, Dark, System selection and preview | Light / Dark / System | Shared component `882:14452`; no current route-bound approved screen | `AppearanceSettingsScreen`, `PreferenceSelectionScreen`, `ChoiceRow`, `ScreenHeader` | `DESIGN_MISSING` | Supply a route-bound Figma state set covering selection, preview, and persistence feedback; shared row geometry is source-aligned but does not close the screen-state gap. |
| Notifications | `NotificationSettings` | Permission checking, undetermined, denied, granted, editor sheet, invalid time, save/disable failure | Light / Dark | `92:865`, `92:889`, `92:914` | `NotificationSettingsScreen`, `ScreenHeader`, `SettingsDialog`, `Button` | `PARTIAL` | Capture all permission/editor/error states at current SHA and bind native prompt boundaries separately. |
| Data, legal, diagnostics | `YourData`, `LegalInformation`, `BackendDiagnostics` | Local-data contract, legal links, configured developer verification, unavailable/error states | Light / Dark | No current route-bound approved node | `ScreenHeader`, `Screen`, `EmptyState`, `Button` | `DESIGN_MISSING` | Obtain route-bound design states after the account/data/legal contract is owner-approved; do not copy Figma-only account surfaces. |
| Track selection | `SelectTrack`, Home/Practice no-track branch | First choice, returning unchanged, returning with changed selection | Light / Dark | `42:422`, `42:478`, `42:539` | `SelectTrackScreen`, `Screen`, `AmbientBackdrop`, `Button` | `PARTIAL` | Capture onboarding and both returning states; validate eight-track rendering against the approved launch scope. |
| Track registration failures | `SelectTrack` registration/admission failure trigger | Unknown registration and unadmitted registration | Light / Dark | `42:604`, `42:642` | No truthful registration-state input in current route | `CANONICAL_CONFLICT` | Owner must provide the registration-state contract or retire these references from this scope; do not add simulated failure dialogs. |
| Practice Hub | `PracticeHub` and Home/Practice entry | Loading, review available/unavailable, enabled/unavailable mode rows; the no-track branch delegates to `SelectTrack` | Light / Dark | `55:993`, row `232:1716` | `PracticeHubScreen`, `Screen`, `Card`, `ListRow`, `IconTile`, `Button` | `PARTIAL` | Capture loaded states; verify current canonical four-mode Coding Free contract against the approved frame scope. |
| Practice Hub fixture-only modes | Practice Hub Figma rows | `Independent Practice` / `Coding Interview` rows versus canonical Learn, Guided, Custom, Weak Area Review | Light / Dark | `55:993` | No new mode owner permitted | `CANONICAL_CONFLICT` | Keep the repository-owned mode taxonomy; resolve the Figma/product discrepancy before any semantic row change. |
| Practice scope and roadmap | `AlgorithmsScopeSelection`, `TopicRoadmap` | Scope ready/loading/unavailable; current, selected, locked, empty, and handoff rows | Light / Dark | No current route-bound approved node | `Screen`, `ScreenHeader`, `ListRow`, `ChoiceRow`, `EmptyState` | `DESIGN_MISSING` | Supply exact route/state references before changing route-owned geometry or taxonomy presentation. |
| Practice setup | `PracticeSetup` | Loading, unavailable, canonical mode configuration, validation, small-screen/keyboard states | Light / Dark | `55:2172` | `PracticeSetupScreen`, `Screen`, `ChoiceRow`, `Card`, `Button`, `ScreenHeader` | `PARTIAL` | Capture canonical setup variants and resolve current-head visual deltas without changing session semantics. |
| Practice setup fixture-only controls | `PracticeSetup` Figma state | Focus areas summary and `Save settings` footer | Light / Dark | `55:2172` | No canonical focus-area/save command owner | `CANONICAL_CONFLICT` | Resolve the Custom Practice length and focus-area/save contract with the owner before semantic implementation. |
| Practice session — preparing and operation | `PracticeSession` | Preparing, operation notice, retry, leave/pause/abandon and recovery states | Light / Dark | `68:549`, `68:1074` | `PracticeSessionSurface`, `SessionShell`, `OperationNotice`, `Button` | `PARTIAL` | Capture current source states; obtain a lifecycle owner for any Figma-only preparing command. |
| Practice session — question and feedback | `PracticeSession` | Unanswered, selected, immediate feedback, details expanded, final item | Light / Dark | `68:569`, `68:603`, `68:637`, `68:719`, `68:844` | `PracticeSessionSurface`, `SessionShell`, `AnswerOption`, `PracticeFeedbackBlock`, `DetailsDisclosure` | `PARTIAL` | Capture all interaction states in both themes and verify expanded content at current SHA. |
| Practice session — other families | `PracticeSession` | Certification and Design Interview question/feedback variants | Light / Dark | No family-specific approved node in the current set | Family-specific session owners plus shared primitives | `DESIGN_MISSING` | Request family-specific references; keep the existing canonical lifecycle and explicit unavailable branches. |
| Practice summary | `AlgorithmsPracticeSummary` | Loading, verified completed, ended early, unavailable | Light / Dark | `750:6235` | `AlgorithmsPracticeSummaryScreen`, `Screen`, `Button`, `EmptyState` | `PARTIAL` | Capture verified and unavailable outcomes; keep durable-result ownership unchanged. |
| Certification exam | `Exam` | Preparing, question, selected response, navigator, flag, timeout, finish confirmation/failure | Light / Dark | No current route-bound approved node | `ExamScreen`, `Card`, `SettingsDialog`, `Button` | `DESIGN_MISSING` | Supply exam-specific references before replacing the current exam shell or confirmation states. |
| Certification exam outcomes | `ExamReview`, `Result` | Loading, populated review, empty review, verified result, unavailable result | Light / Dark | No complete route-bound outcome set; shared unavailable reference only | `ExamReviewScreen`, `ResultScreen`, `ReviewUnavailableSurface`, `EmptyState` | `DESIGN_MISSING` | Provide route-bound outcome designs; do not expand the thin result surface with speculative metrics or actions. |
| Simulation | `AlgorithmsInterviewSimulation` | Active/editing, save failure, navigator failure, operation recovery, leave/abandon, finish confirmation | Light / Dark | `74:539`, `74:726`, `74:834`, `74:879`, `74:968`, `74:992` | `AlgorithmsInterviewSimulationScreen`, `SessionShell`, `SimulationQuestionNavigator`, `SimulationOperationPanel`, `SettingsDialog` | `PARTIAL` | Capture active, navigator, recovery, action-sheet, and finalization states at current SHA. |
| Simulation summary and review | `AlgorithmsInterviewSimulationSummary`, `AlgorithmsInterviewSimulationReview` | Verified result, filter all/missed, answer selection, details, unavailable result | Light / Dark | `81:538`, `801:7299`, `765:6130`, `82:538`, `801:7653` | `ReviewShell`, `ReviewNavigator`, `ReviewFeedbackBlock`, `ReviewUnavailableSurface`, `DetailsDisclosure` | `PARTIAL` | Capture current result/review states; preserve explicit unavailable and `Needs Review` contract conflict. |
| Answer review | `AnswerReview` | Loading, no attempt, populated, filtered empty, details, update/error state | Light / Dark | `81:538`, `801:7299`, `765:6130`, `248:2394` | `ReviewShell`, `ReviewNavigator`, `AnswerOption`, `ReviewFeedbackBlock`, `DetailsDisclosure` | `PARTIAL` | Produce current-head screenshots; record `Needs Review` as a canonical conflict because the approved state does not show that mutation. |
| Mistakes review | `MistakesReview` | Loading, no track, empty, filtered-empty, populated, unavailable | Light / Dark | No current route-bound approved node | `MistakesReviewScreen`, `ReviewShell`, `ListRow`, `EmptyState` | `DESIGN_MISSING` | Request the review-queue reference set for both families and all empty/error states. |

### Matrix conclusion

The current route graph is fully enumerated, but the matrix is not yet a
final parity result: no current-head row may be promoted to `MATCHED` until
the required Light/Dark evidence is captured and compared. The safe source
work is therefore complete for the currently revalidated Figma-backed slices;
the remaining work splits into three independent lanes:

1. `DES-005-C`: owner-bound authority and the Custom Practice contract;
2. `DES-005-D`: current-head visual capture for every `PARTIAL` row;
3. owner-supplied Figma states or product decisions for `DESIGN_MISSING` and
   `CANONICAL_CONFLICT` rows.

This keeps missing design from blocking unrelated source work, while making
the final `MATCHED` / `DESIGN_MISSING` / `CANONICAL_CONFLICT` report
mechanically derivable from the matrix rather than inferred from test status.

## Confirmed contradictions and stale assumptions

1. An earlier report snapshot recorded `76kzylrb` as the Figma authority. The
   current launch plan now names `ksxw21cw`; prior repository references also
   name `eon17bsz`, while the only explicit Product Owner approval found for
   the Free interaction subset is `wtk4hp8i`. These references still need a
   single owner-bound mapping before final approval.

2. Current frame `55:993` visibly contains `Independent Practice` and a
   `Coding Interview` row. The approved Free profile explicitly excludes
   Independent and requires `Custom Practice` plus evidence-conditioned
   `Weak Area Review`. Copying the frame's rows literally would regress the
   product contract.

3. Current frame `55:2172` presents `Focus areas`, a summary action, and a
   `Save settings` footer. The current canonical Custom Practice flow owns an
   explicit mental-unit selection, feedback timing, session length, and a
   `Start session` command. It has no durable focus-area model or settings-save
   command. The Figma fixture cannot be used as permission to create those
   semantics.

4. The repository contract and current runtime support Coding Custom Practice
   lengths `[10, 20, 40]` with explicit `afterEachAnswer` or `atSessionEnd`
   feedback. `PO-059`, `PO-060`, and `docs/designs/pkg-04a-free-package-interactions`
   describe the approved Free Custom reference as exactly 10 questions. This
   is a material contract/document contradiction; it must be resolved before
   changing the setup's session-length semantics.

5. The latest safe Practice Hub geometry slice is now applied in commit
   `058c6ea`: the primary card uses the live 16 px internal rhythm, 0.28
   primary-border opacity, 20/24 title metrics, and rail top offset 19 px; the
   topic indicator uses a 6 px gap and the settings action uses 13/16 medium
   text. The current Figma mode rows still use 14 px semibold titles, 11 px
   regular details with a 2 px text gap, 32 px elevated icon tiles with an
   8 px radius, and 72 px row geometry; the source's grouped `ListRow` variant
   owns those values. These are visual-owner corrections, not reasons to
   rename or add modes.

## Implementation-ready tasks

### DES-005-A — Practice Hub geometry convergence under canonical mode truth

- **Goal:** Match the current approved-safe visual geometry of `55:993` while
  keeping the PKG-04A mode list, exact commands, and unavailable states.
- **Scope:** `PracticeHubScreen`, the canonical list-row variant/primitive if
  required, shared card tokens only when the change is proven reusable, and
  focused visual/source assertions.
- **Non-goals:** Do not add Independent Practice to the Free list; do not copy
  current fixture copy literally; do not add Focus areas, metrics, new routes,
  or a second Practice shell.
- **Inputs:** live node `55:993`; `PO-059`/`PO-060`; current
  `buildPracticeModes`; current `Screen`, `Card`, `ListRow`, and Button owners.
- **Acceptance criteria:** card internal rhythm and shadow match the selected
  Figma state; rows use the 14/11/2 px visual hierarchy and 32/8 px icon tile
  geometry; the four canonical Coding Free modes remain unchanged; weak-area
  empty state remains explicit; large text and accessible labels remain valid.
- **Verification:** focused Practice/model/visual-shell tests, TypeScript,
  `git diff --check`, and a same-head light/dark capture when the simulator
  tooling is available. Record source-level and runtime evidence separately.
- **Risks:** changing the shared `ListRow` may affect Settings/Activity; prefer
  a proven existing variant or a narrow canonical style owner and verify all
  consumers before editing.
- **Report target:** append the result to the current parity report and this
  reconciliation packet; do not rewrite historical Figma reports.

### DES-005-B — Practice Setup geometry convergence without semantic migration

- **Goal:** Match safe compact setup geometry from `55:2172` without creating
  unowned focus-area or save semantics.
- **Scope:** `PracticeSetupScreen`, compact segmented control, choice rows,
  Screen Header, and footer geometry.
- **Non-goals:** Do not decide the 10 versus 10/20/40 contract in code; do not
  add a focus-area persistence model; do not rename `Start session` to
  `Save settings` without owner authorization.
- **Inputs:** `55:2172`, canonical contract, PO-059/060, and the current
  canonical route/model. DES-005-C remains required for semantic migration.
- **Acceptance criteria:** compact header, section labels, segmented control,
  radio rows, sticky footer, large-text behavior, and a11y match the approved
  state; all rendered fields map to real route/model values; unavailable states
  remain explicit.
- **Verification:** focused setup/session/accessibility tests, TypeScript,
  source diff, and light/dark runtime capture when available.
- **Risks:** visual changes can accidentally change session length, feedback,
  focus scope, or start command.
- **Report target:** parity report plus the contract decision note.

- **Status:** safe geometry slice complete in `65aeccd`; owner decision remains
  required before adding or renaming any semantic control.

### DES-005-C — Owner-bound Figma authority and Custom Practice contract decision

- **Goal:** Establish one current Figma reference set and reconcile the
  contradictory Custom Practice length statements before semantic UI changes.
- **Scope:** owner decision record and updates to the canonical docs only.
- **Non-goals:** no code, no synthetic approval record, no relabeling of old
  Figma channels or historical evidence.
- **Inputs:** current channel `ksxw21cw`, file `kZXD7cNBKUU7x0ceTHPFpR`,
  approved PKG-04A `wtk4hp8i`, current contract, PO-059/060, and the current
  Practice routes.
- **Acceptance criteria:** one explicit channel/node map identifies which
  states are approved for this release; Custom Practice length is resolved as
  either the current `[10,20,40]` contract or the approved Free-only `10`
  reference; focus-area/save semantics are either given a canonical owner or
  explicitly excluded; stale channel references are marked historical.
- **Verification:** owner decision is recorded in the decision register and
  canonical contract/PKG reference; no implementation proceeds from a
  contradictory source.
- **Risks:** choosing a visual fixture over the product contract can create a
  new migration and invalidate package/runtime evidence.
- **Report target:** updated active launch plan and a dated owner decision
  record.

### DES-005-D — Current-head visual evidence matrix

- **Goal:** Prove node-to-screen parity for both themes across every reachable
  state in the agreed scope.
- **Scope:** capture-only Maestro flows, same-head light/dark screenshots,
  Figma screenshots, manifests, and comparison notes for Home, Practice Hub,
  Practice Setup, active Practice, feedback, summary, Progress, Activity,
  Settings, notifications, simulation, recovery, and review.
- **Non-goals:** no destructive learner-state reset, no fake screenshots, no
  claim that an old capture proves current-head parity.
- **Inputs:** DES-005-C authority map, current route graph, current app SHA,
  simulator availability, and existing capture flows.
- **Acceptance criteria:** each claimed `MATCHED` state has a current-head
  screenshot pair or an explicit source-only/semantic exception; blocked
  captures identify the exact external failure; comparison evidence is stored
  at absolute paths.
- **Verification:** Maestro syntax and runtime assertions, screenshot review,
  pixel/diff notes, and current SHA binding.
- **Risks:** mixed cached bundles, stale sessions, theme drift, and treating
  semantic fixture differences as pixel defects.
- **Report target:** parity report and QA-02 evidence packet.

## First next task

**DES-005-A is complete in `bc09d63`, and the safe geometry portion of
DES-005-B is complete in `65aeccd`.** These changes only altered visual geometry that is
directly observable in the current Figma frame and already owned by the
canonical Practice Hub/list/card primitives. The next task is **DES-005-C**:
resolve owner-bound authority and the Custom Practice `10` versus `10/20/40`
contract before any Practice Setup semantic change. DES-005-B remains blocked
for semantic migration until that decision exists.

## Verification performed and evidence limits

- Live Figma design context and screenshots: pass for the current file/page/
  library and the node set recorded above, including the revalidations in the
  addenda.
- `npm run typecheck`: pass at current source SHA `2b19f81`.
- Latest focused review/accessibility/visual contract checks: 30/30 pass,
  including Practice Hub, Question Shell, rich feedback, Answer Review, and
  Simulation Review source owners.
- Full `npm run qa:static`: pass at source commit `2b19f81`, with recovery
  inventory 287/116/564 and 573/573 tests, TypeScript, content boundary, and
  runtime privacy boundary.
- Working tree: source commit `2b19f81` is clean; this report and the launch
  plan contain the current documentation addendum.
- No graph output was present in the repository; graph orientation was not
  used because direct route/source/document evidence was sufficient.

Unverified: fresh Practice Hub/Setup runtime pixel comparison at current head,
Android, signed/distribution rendering, and owner approval of the current
`ksxw21cw` frame set. The simulator/capture blocker remains explicit in the
parity report; it does not justify inventing screenshot evidence or marking
the 99% objective complete.

## Addendum — Simulation navigator recovery notice convergence

The current channel `ksxw21cw` was revalidated against live Figma `74:726`,
where the save-failure navigator uses a 12 px `Operation Notice` radius and a
12 px gap before the full-width `Try again` action. Commit `92dcdc2` applies
those two geometry facts to the existing `SimulationQuestionNavigator` owner.
The retry command, frozen navigator cells, modal accessibility boundary,
reduced-motion behavior, and all lifecycle semantics remain unchanged.

Focused navigator/operation/session checks passed 17/17; typecheck and
`git diff --check` passed; `npm run qa:static` passed with 561/561 tests and
recovery inventory 283/113/552. Runtime pixel comparison remains blocked by
the unavailable Maestro binary and refused CoreSimulatorService; no 99%
parity claim is made.

## Addendum — Answer Review convergence

After this packet was created, the current channel `ksxw21cw` was revalidated
against the live Review Shell authority `81:538` and canonical instance
`801:7299`, plus the shared Pattern Review Shell component `765:6130`.
Source commits `4d27861`, `45016a5`, and `621c4bd` now align the shared review footer,
filter surface/tabs, answer-review spacing, plain Reason section, Details
disclosure, Simulation Review feedback owner, and the Result unavailable
content-area/surface geometry. The existing `Needs Review`
mutation remains intact; because it is not represented in the approved Figma
states, the parity matrix records that behavior as `CANONICAL_CONFLICT` rather
than removing it from the product.

Focused review-shell checks passed, and `npm run qa:static` passed on
`621c4bd` with 559/559 tests, TypeScript, content-boundary, and runtime-privacy
checks. Current dark/light runtime pixel comparison for Answer Review,
navigator, and unavailable review states remains unverified; this addendum is
source evidence, not a 99% completion claim.

## Addendum — Simulation shell geometry convergence

The current channel `ksxw21cw` was revalidated against active simulation
frames `74:539` and `74:834`, the navigator save-failure frame `74:726`, and
shared Answer Option authority `248:2394`. Commit `3ed145a` applies only the
safe visual facts owned by the existing canonical paths: simulation progress
uses `surface/input`, navigator cells use the elevated surface with 56 px
baseline geometry and 12/16 semibold labels, frozen cells no longer apply a
source-level opacity reduction, and the shared letter badge uses 12/16
semibold typography. No simulation command, persistence state, footer owner,
or semantic mode was changed.

Focused simulation/Answer Option/visual-shell checks passed 25/25, and
`npm run qa:static` passed on `3ed145a` with 559/559 tests, TypeScript,
content-boundary, and runtime-privacy checks. Fresh dark/light runtime pixel
comparison for active simulation, navigator failure, recovery, and review
operational states remains unverified; this addendum is source evidence, not a
99% completion claim.

## Addendum — Simulation operation footer convergence

The current channel `ksxw21cw` was revalidated against the live recovery
frames `74:834` and `74:879`, plus action-sheet frames `74:968` and `74:992`.
Commit `a3e2937` moves only the two recoverable operation notices into the
existing `SessionShell` footer, producing the Figma order of notice, primary
recovery action, secondary action, and Leave action. The shared action sheet
now uses the live 22/28 semibold title and 14 px sheet radius. Durable command
semantics, operation recovery, and all non-notice panels remain unchanged.

Focused simulation operation/action-sheet/visual-shell checks passed 28/28,
and `npm run qa:static` passed on `a3e2937` with 559/559 tests, TypeScript,
content-boundary, and runtime-privacy checks. Fresh runtime pixel comparison
for these operational states remains unverified because `maestro` is absent
and CoreSimulatorService rejects simulator connections; this is source
evidence, not a 99% completion claim.

## Addendum — Settings content footer convergence

The current channel `ksxw21cw` was revalidated against live Figma
`822:7687` (`Pattern / Settings Content`) with fresh design context and
screenshot evidence. The applicable current Settings rows already use the
canonical source primitives and match the live 32 px icon tile, 63 px row,
16/14 px padding, 12 px radius, and tracked section-label geometry. Figma-only
account, sync, plan, cadence, and help rows conflict with the current product
commands and were not introduced.

Commit `acd2201` aligns the existing Settings app identity with Figma: 13 px
semibold product name, 11 px regular version metadata, 2 px internal gap, and
no duplicate footer top padding. The shared list-row supporting token uses the
live 11/15.4 line-height contract. No semantic route, command, persistence
behavior, or fallback path changed.

Focused Settings/Notification presentation checks passed 10/10;
`npm run typecheck` passed; `npm run qa:static` passed with 561/561 tests,
recovery inventory 283/113/552, content-boundary, and runtime-privacy checks.
Fresh runtime pixel comparison remains blocked by the unavailable Maestro
binary and refused CoreSimulatorService; this addendum does not claim 99%
parity.

## Addendum — Practice recovery notice radius convergence

The current channel `ksxw21cw` was revalidated against live Figma `68:1074`
and canonical `Operation Notice` `258:2847`. The two repository-owned
recovery notice owners already matched the Figma elevated surface, warning
border, 16 px padding, 12 px gap, and warning copy; their only identified
geometry gap was an 8 px radius.

Commit `4314107` changes both `PracticeSessionSurface` and
`SimulationOperationPanel` to the Figma 12 px radius. It preserves the
existing footer ownership, retry/recovery semantics, lifecycle, persistence,
and explicit unavailable states; no duplicate notice or fallback branch was
introduced.

Focused Practice/Simulation checks passed 26/26 and `npm run qa:static`
passed with 561/561 tests and recovery inventory 283/113/552. Runtime pixel
comparison remains unavailable because Maestro is absent and CoreSimulatorService
rejects simulator connections; no 99% parity claim is made.

## Addendum — Current-head Practice Hub revalidation

On the then-current source SHA `7a93ad4`, the live Figma node `55:993` was revalidated
through connector channel `ksxw21cw` with fresh design context and screenshot
evidence. The canonical `PracticeHubScreen` already matches the safe visual
contract: 18 px page/intro rhythm; layered hero surface with 22 px radius,
20 px padding, 16 px internal rhythm, visible 3×44 px rail, 6 px copy gap,
20/28 hero title, 13.5/19 detail, and 16 px action gap; the grouped mode
surface and 72 px rows preserve the 14/11/2 text hierarchy and 32/8 icon-tile
geometry.

An independent implementation pass made no code change because no additional
safe geometry mismatch was found. The canonical `buildPracticeModes()` list,
commands, explicit weak-area unavailable state, accessibility behavior, and
large-text handling remain unchanged. Figma-only Independent Practice and
Coding Interview rows remain a `CANONICAL_CONFLICT`, not an implementation
target. Focused Practice Hub checks passed 2/2, typecheck and `git diff
--check` passed, and `npm run qa:static` passed with recovery inventory
281/113/552 and 561/561 tests. Fresh runtime pixel comparison remains
unverified because Maestro is unavailable and CoreSimulatorService refuses
the simulator connection; this is source evidence, not a 99% completion
claim.

## Addendum — Reachability and dead-code convergence

Commit `d4d0cfc` applies the evidence-backed cleanup from the current route
and design-system audit. The unused `DomainAccent` and `MetricCard` exports
and files were removed after an inbound-reference scan; the associated tests
now assert the remaining canonical Practice Hub presentation without naming
deleted symbols. The unreachable Practice Hub branch for Free-excluded scope
modes was deleted, while the independently reachable Home declared-scope
entry remains unchanged.

The navigation contract was also reduced to its actual consumers: the unused
`Exam.questionIndex` parameter and simulation-summary `completionKind` route
parameter were removed. Simulation summaries continue to derive completion
state from the verified durable result, so this is a route-contract cleanup,
not a lifecycle or visual behavior change. Focused route/presentation/design
system checks passed 40/40 and typecheck passed. This does not change the
remaining runtime pixel-evidence or owner-approval blockers.

Post-cleanup `npm run qa:static` also passed with recovery inventory
282/113/552, 561/561 tests, content-boundary, and runtime-privacy-boundary
checks.

## Addendum — Shared review-unavailable surface convergence

Commit `7a93ad4` consolidates the identical inner Figma review-unavailable
surface used by Certification Answer Review and Simulation Review into the
repository-owned `ReviewUnavailableSurface` component. Each route keeps its
own outer shell and positioning (`marginTop` for Answer Review and the
absolute 185 px/353 px result state for Simulation Review); only the repeated
warning icon, 48 px icon tile, title, description, and text hierarchy now
have one visual owner. No data, navigator, filter, review-marking, or route
semantics changed.

Focused visual-shell/accessibility checks passed 23/23; `npm run qa:static`
passed with recovery inventory 282/113/552 and 561/561 tests. Runtime
pixel comparison for both review states remains unverified because Maestro
is unavailable and CoreSimulatorService refuses simulator connections.

## Addendum — Details disclosure convergence

Commit `d1483e9` consolidates the duplicated `Details` disclosure control in
`PracticeFeedbackBlock` and `ReviewFeedbackBlock` into the repository-owned
`DetailsDisclosure` component. The shared owner preserves the Figma-validated
toggle geometry: 48 px minimum height, surface/border treatment, spacing,
secondary label hierarchy, chevron state, and the accessible expanded/collapse
contract. Practice and review routes retain their own surrounding reason,
divider, separator, and rich-details layout because those contracts are not
identical.

No feedback semantics, durable state, route contract, or runtime selector
changed. Focused accessibility/visual-shell/session checks passed 27/27;
`npm run qa:static` passed with recovery inventory 283/113/552 and 561/561
tests, typecheck, content-boundary, and runtime-privacy-boundary checks.
Current-head runtime pixel comparison remains unverified because Maestro is
unavailable and CoreSimulatorService refuses simulator connections.

## Addendum — Home metric and activity CTA convergence

Commit `176e331` applies two safe visual corrections to the repository-owned
Home surface against live Figma node `55:445` in connector channel `ksxw21cw`.
Overview now places its divider only between metric rows, matching the Figma
structure without leaving a trailing line after `Last session`. The Recent
activity `View activity` action retains its accessible press target and action
semantics but no longer renders a chevron, matching the text-only Figma CTA.

No data projection, route, action command, runtime selector, or accessibility
contract changed. Focused Home/visual/large-text checks passed 15/15;
`npm run qa:static` passed with recovery inventory 283/113/552 and 561/561
tests, typecheck, content-boundary, and runtime-privacy-boundary checks.
Current-head runtime pixel comparison remains unverified because Maestro is
unavailable and CoreSimulatorService refuses simulator connections.

## Addendum — Home recent-activity copy convergence

Commit `8d32858` aligns the Home recent-activity detail with the live Figma
states `55:445` and `55:539`. Figma renders a completion label such as
`Completed yesterday`; the Home projection now uses a canonical translated
completion label and no longer exposes the internal `attempt.result.kind`
value in the compact surface. Durable attempt data, date handling for older
entries, the Activity route, selectors, and action semantics remain intact.

Focused Home/activity checks passed 19/19; `npm run qa:static` passed with
recovery inventory 283/113/552 and 562/562 tests, typecheck,
content-boundary, and runtime-privacy-boundary checks. Current-head runtime
pixel comparison remains unverified because Maestro is unavailable and
CoreSimulatorService refuses simulator connections.

## Addendum — Button state-token decision boundary (historical)

Live Figma `141:817` was revalidated against the repository-owned `Button`
primitive. The shared component currently has one generic disabled treatment,
while the Figma authority defines distinct Primary, Secondary, Destructive,
and Ghost disabled/pressed states. A worker review confirmed that the
existing palette cannot represent the complete matrix without misusing
unrelated Light/Dark roles or introducing local color fallbacks.

At that audit point the state matrix remained `PARTIAL` with a design-system
decision required; this was not a code gap to patch opportunistically. The
decision boundary was the symmetric Light/Dark mapping for pressed/disabled
states and whether runtime `loading` should inherit Disabled. Commit `7e9b200`
records the resulting source-level convergence in the current addendum below;
fresh runtime proof and owner/accessibility approval remain separate gates.

## Addendum — Progress weekly-block geometry convergence

Commit `b58042d` applies one safe layout correction to the repository-owned
Progress surface against live Figma node `842:9563` in connector channel
`ksxw21cw`. The `This week` label and weekly card now share one section with a
10 px internal gap, matching the Figma `ThisWeek` frame and removing the
accidental 28 px root gap that displaced `Current focus` and all following
content by 18 px.

The change does not add the Figma-only goal, cadence, recent-effectiveness,
trend, or focus-area metrics because the current local evidence model does not
provide them truthfully. No data projection, route, action command, runtime
selector, or accessibility contract changed. Focused Progress/Home checks
passed 29/29; `npm run qa:static` passed with recovery inventory 283/113/553
and 562/562 tests, typecheck, content-boundary, and runtime-privacy-boundary
checks. Current-head runtime pixel comparison remains unverified because
Maestro is unavailable and CoreSimulatorService refuses simulator connections.

## Addendum — Progress no-evidence state convergence

Commit `deb7b81` applies the safe empty-state branch from live Figma node
`842:10949` in connector channel `ksxw21cw`. When the canonical projection
reports `model.hasData === false`, Progress now renders the explicit no-evidence
surface: the Figma-aligned glyph, title, explanatory copy, and, only for the
Algorithms family where an existing canonical action is available, `Open
Practice`. The previous empty `Current focus`, `Needs attention`, activity, and
evidence sections are not rendered in this state.

No goal, cadence, effectiveness, trend, or focus-area metric was added. The
action reuses `algorithmsProgress.priority.primaryAction`; model shape, durable
records, route ownership, selectors, and accessibility semantics remain
unchanged. Polish translations were added for the two new visible strings.
Focused Progress/Home checks passed 29/29; `npm run qa:static` passed with
recovery inventory 283/113/553 and 562/562 tests, typecheck, content-boundary,
and runtime-privacy-boundary checks. Current-head runtime pixel comparison
remains unverified because Maestro is unavailable and CoreSimulatorService
refuses simulator connections.

## Addendum — Activity empty-state convergence

Commit `15f54c1` aligns the reachable Activity empty states with live Figma
nodes `842:11410` and `842:11466` in connector channel `ksxw21cw`. The screen
now uses a local Activity empty renderer with the two-bar activity glyph,
Figma-aligned copy, and the existing `PRACTICE_HUB` command. A filtered-empty
state additionally exposes `Show all activity`, which resets the existing
filter, plus the same practice command as a secondary action.

The shared `EmptyState` remains the unavailable/error primitive; no route,
session model, persistence, or read projection changed. Focused Activity /
visual / loading checks passed 30/30; `npm run qa:static` passed with recovery
inventory 283/113/553 and 562/562 tests, typecheck, content-boundary, and
runtime-privacy-boundary checks. Current-head runtime pixel comparison remains
unverified because Maestro is unavailable and CoreSimulatorService refuses
simulator connections.

## Owner-bound gap — Track Evidence route

Figma node `842:11057` defines a read-only `Track Evidence` screen: a pushed
header from Progress, track context, and a seven-row evidence list with
detail/chevron affordances. The repository does have `TopicRoadmapScreen` and
`ROUTES.TOPIC_ROADMAP`, but that route is a different canonical surface: it
lets the learner choose a practice topic, renders available/current/locked
roadmap nodes, and returns the selection to Practice Hub. It is therefore not
a safe owner for the Figma evidence list.

Adding a matching detail route would change the route graph, evidence read
projection, and row drill-down command. This remains an explicit owner/product
decision gap; no Figma-only screen was added and the existing Topic Roadmap was
not relabeled or repurposed.

## Addendum — Progress evidence-copy truthfulness

Commit `6dd51f6` removes a misleading presentation from the Algorithms
Progress focus card. The previous branch rendered the roadmap node's
`itemCoveragePercent` as a large effectiveness percentage, although the
canonical model defines it as item coverage and does not provide effectiveness
data. The card now renders the existing `statusLabel` and `practicedLabel`
instead; score percentages remain available only on track projections that
provide canonical `performanceScores`.

No model, durable record, route, action command, or new metric was added.
Focused Progress/Home checks passed 29/29; `npm run qa:static` passed with
recovery inventory 283/113/553 and 562/562 tests, typecheck, content-boundary,
and runtime-privacy-boundary checks. Current-head runtime pixel comparison
remains unverified because Maestro is unavailable and CoreSimulatorService
refuses simulator connections.

## Addendum — Select Track state and geometry convergence

Commit `1c8a8cc` revalidated the current connector channel `ksxw21cw` against
live Figma nodes `42:422` (first choice), `42:478` (returning with the current
track), and `42:539` (returning after changing the track). The repository-owned
`SelectTrackScreen` now keeps the durable active track separate from the local
selection: onboarding retains the selected-track context and `Continue`, a
returning user with no change has no footer, and a returning user who changes
selection gets the Figma-shaped `Use this track` action. The existing
`AppShellHeader` also owns the compact 36 px back-navigation variant used by
the returning state.

The source geometry now follows the verified Figma contract for title rhythm,
29/35 title typography, 14/20 supporting copy, 12 px track-list gap, 20 px
card radius, 10 px card internal rhythm, 11/15.4 supporting labels, and the
sticky-footer spacing. All eight track registrations remain rendered because
the current registry and admission tests are canonical; Figma's two-card
Coding/GCP projection is therefore an explicit scope/canonical conflict, not
a reason to hide six runtime tracks.

Commit `364a832` adds the repo-owned `AmbientBackdrop` and the downloaded
Figma topography SVG to the shared `Screen` owner. The exact dark-mode glow
positions and four contour ellipses are now reused by Select Track and
Practice Hub; light mode remains solid because the current Figma authority
does not provide a light ambient variant.

This slice is still not marked `MATCHED`: Figma nodes `42:604` and `42:642`
define unknown/unadmitted registration-failure dialogs, but the current route
has no truthful registration-state input or owner for them. The eight-track
registry projection also remains a canonical scope conflict against Figma's
two-card projection. Runtime pixel proof is still unavailable because Maestro
is absent and CoreSimulatorService refuses simulator connections. Focused
ambient/Select Track/visual-shell checks passed 15/15; `npm run qa:static`
passed with recovery inventory 284/114/555, 564/564 tests, typecheck,
content-boundary, and runtime-privacy-boundary checks.

## Addendum — Practice preparing-state convergence

Commit `0a7e8c3` revalidated live Figma node `68:549` (`06A · Preparing`)
against the canonical `PracticeSessionSurface` owner. `PreparingNotice` now
reuses the existing async-state card owner used by completion: 44 px status
icon, `LOADING` label, Figma-shaped title/description hierarchy, and the
reserved lower spacer are shared rather than maintained as a second preparing
card style. The description uses the canonical item terminology.

The Figma bottom `Leave practice` action remains intentionally unresolved.
The current preparing phase has no safe lifecycle command owner and the route
does not expose a truthful command input for it; adding a no-op or an invented
transition would create a fake state. The obsolete `preparing` and
`preparingTitle` styles were deleted. Focused session/accessibility/loading/
visual-shell checks passed 43/43; `npm run typecheck` and `git diff --check`
passed, and full `npm run qa:static` passed with recovery inventory 284/114/555,
564/564 tests, typecheck, content-boundary, and runtime-privacy-boundary
checks. Runtime pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Practice Question Shell footer convergence

Commit `86e32d9` revalidated live Figma nodes `68:569` (`06B · Single choice ·
Unanswered`) and `68:603` (`06C · Single choice · Selected · Immediate feedback
mode`) against the shared `SessionShell` owner. The Practice route now uses a
dedicated `session` footer variant: 228 px minimum height, bottom-aligned
actions, and an 8 px action gap, matching the Figma action-footer geometry.
Simulation continues to use its existing layout-specific footer path.

The shared disabled Button colors remain unresolved against `141:817` and were
not copied locally; they require one design-system token decision for all
Button variants. No command, state transition, persistence, or response
semantics changed. Focused shell/session checks passed 34/34; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. Runtime
pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Practice feedback surface convergence

Commit `0341424` revalidated live Figma nodes `68:637` (`06E · Immediate
feedback · Default`), `68:719` (`REF-06A · Details expanded`) and `68:844`
(`06F · Final item`) against the canonical `PracticeFeedbackBlock` owner.
These references expose correctness through the answer-option state and the
reason/details surfaces, without a separate visible `Correct`/`Incorrect`/
`Partial` label. The redundant result label, formatter, and unused
translation were removed. The runtime result selector remains attached to the
visible reason panel, preserving the auditability contract without adding a
second UI element.

No scoring, feedback, navigation, persistence, or command semantics changed.
Focused feedback/accessibility/session checks passed 34/34; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. Expanded
details geometry and same-head runtime pixel proof remain open because
Maestro is absent and CoreSimulatorService refuses simulator connections.

## Addendum — Practice feedback typography convergence

Commit `536b19b` revalidated the live expanded-details reference `68:719` and
applied only its safe typography facts to the existing feedback owners:
`REASON` is now 12/16 semibold, while rich feedback paragraphs, headings, list
text, and callout text use 13/20. The shared document renderer remains the
canonical content-block owner; no content schema, authored copy, scoring,
navigation, persistence, or command semantics changed.

Focused feedback/accessibility/session checks passed 32/32; full
`npm run qa:static` passed with recovery inventory 284/114/555, 564/564 tests,
typecheck, content-boundary, and runtime-privacy-boundary checks. Same-head
runtime pixel proof remains unavailable because Maestro is absent and
CoreSimulatorService refuses simulator connections.

## Addendum — Shared Button state matrix convergence

Commit `7e9b200` revalidated live Figma shared Button `141:817` in connector
channel `ksxw21cw` and applied its Default/Pressed/Disabled matrix to the
canonical `src/components/Button.tsx` owner. Primary, Secondary, Destructive,
and Ghost now use variant-specific disabled surface, border, label, and
pressed-state mappings from the existing Light/Dark semantic palette. Runtime
`loading` explicitly inherits the same disabled mapping through the existing
`isDisabled` contract.

No raw color literals, route, command, lifecycle, persistence, or accessibility
contract changed. The obsolete generic disabled style was removed rather than
kept as a competing path. Focused visual/accessibility checks passed 31/31;
full `npm run qa:static` passed with recovery inventory 284/114/555 and
564/564 tests, typecheck, content-boundary, and runtime-privacy-boundary.
Same-head runtime pixel proof and Product Owner approval remain open.

## Addendum — Bottom Navigation separator convergence

Commit `e257af4` revalidated the canonical Bottom Navigation authority
`140:875` / `483:5328` and its Light/Dark stress instances `830:7805` /
`830:9045` in connector channel `ksxw21cw`. Figma resolves the
`surface/overlay` top separator to `#F1F5F9` in both themes; the dark
repository token had remained `#1E293B`, while the Light token was already
aligned. The existing `BottomTabBar` remains the single owner of the four
destination tabs, active indicator, item heights, icon sizing, caption metrics,
pressed state, accessibility roles, and safe-area padding.

Only the central dark `navigation.border` token changed. No route, label,
callback, lifecycle, persistence, or fallback path changed. Focused shell /
accessibility checks passed 29/29; full `npm run qa:static` passed with
recovery inventory 284/114/556 and 565/565 tests, typecheck,
content-boundary, and runtime-privacy-boundary. Same-head runtime pixel proof
and Product Owner approval remain open.

## Addendum — Screen Header base geometry convergence

Commit `2eb6c65` revalidated the canonical Screen Header `140:881` in
connector channel `ksxw21cw`. The reference defines a `16 px` (`space/16`)
container gap, an `8 px` (`space/8`) back/context-row gap, a 44 px touch target
with a 36 px visible outlined back button, and muted description text. The
shared `src/components/ScreenHeader.tsx` now uses `spacing.lg` for the base
container, `spacing.sm` for the base context row, and `palette.textMuted` for
the base description.

The existing Activity and Practice Setup variants keep explicit owner-specific
spacing and description color because their Figma references establish a
different local rhythm. This is a source-level geometry correction only: no
route, command, lifecycle, persistence, accessibility, or semantic product
contract changed, and no duplicate header path was added. Focused checks passed
34/34; full `npm run qa:static` passed with recovery inventory 284/114/556 and
565/565 tests, typecheck, content-boundary, and runtime-privacy-boundary.
Same-head runtime pixel proof and Product Owner approval remain open.

## Addendum — Practice Hub row icon convergence

Commit `6f8b0c6` revalidated the canonical Figma row instance `232:1716` in
connector channel `ksxw21cw`. The row uses a `32×32` icon container with
`radius/8`, `color/surface/elevated`, a `24×24` leading icon, and a `20 px`
trailing icon slot. The Coding Practice Hub now uses the existing `IconTile`
with `iconSize={24}` and the existing `settings` tone for enabled Coding rows;
the tone resolves to the repository's neutral elevated/list-row palette. The
chevron is rendered at `20 px`.

The change is route-local and preserves the current four-mode canonical model.
Certification and Design Interview rows keep their previous semantic tone
mapping because this node does not establish their visual contract. No route,
command, lifecycle, persistence, accessibility, or mode-availability behavior
changed; no duplicate icon owner was introduced. Focused checks passed 34/34;
full `npm run qa:static` passed with recovery inventory 284/114/556 and
565/565 tests, typecheck, content-boundary, and runtime-privacy-boundary.
Same-head runtime pixel proof and Product Owner approval remain open.

## Addendum — Screen Shell spacing convergence

Commit `992d5bb` revalidated Figma `Pattern / Screen Shell · Dark` `830:7457`
in connector channel `ksxw21cw`. The reference uses `space/20` between
scroll-content blocks. The canonical `src/components/Screen.tsx` now uses
`spacing.xl` (`20 px`) for the default content gap; compact density remains
`spacing.md`, and route-owned overrides such as Practice, Home, and Activity
remain explicit.

This is a shared visual spacing correction only. Padding, footer geometry,
route ownership, commands, lifecycle, persistence, accessibility, and product
semantics are unchanged. Focused shell checks passed 25/25; full
`npm run qa:static` passed with recovery inventory 284/114/556 and 565/565
tests, typecheck, content-boundary, and runtime-privacy-boundary. Same-head
runtime pixel proof and Product Owner approval remain open.

## Addendum — Notification content spacing convergence

The current channel `ksxw21cw` was revalidated against live Figma nodes
`92:865` (granted), `92:889` (permission blocked), and `92:914` (reminder
editor). The two full-screen notification states use a `24 px` gap between
their content blocks; the local owner had retained `spacing.xl` (`20 px`).

Commit `21e6ff8` changes only `NotificationSettingsScreen.content` to the
existing `spacing.xxl` (`24 px`) token. The reminder editor's own `16 px`
internal gap remains in `SettingsBottomSheet` and is not changed. Permission
commands, device-settings handoff, disabled reminder behavior, local
persistence, copy, and accessibility semantics remain untouched. The
notification sentinel and shared shell checks passed `20/20`; full
`npm run qa:static` passed with recovery inventory `284/114/556` and `565/565`
tests, TypeScript, content-boundary, and runtime-privacy-boundary.

This is source-level convergence, not a `MATCHED` claim: current-head
Light/Dark pixel comparison and Product Owner approval remain open.

## Addendum — Answer Review filter spacing convergence

The current channel `ksxw21cw` was revalidated against live Figma node
`81:538` (`08A · Answer Review · Default`). The reference places the 44 px
review filter inside a full-width wrapper with `20 px` horizontal and `8 px`
vertical padding. The shared `ReviewShell` had applied the horizontal inset
directly to the filter and omitted the 16 px vertical rhythm, moving the
question content upward. The same reference defines a `6 px` gap between the
`QUESTION` eyebrow and prompt; the Answer Review owner had used the repository
`4 px` token.

Commit `a81c390` adds the canonical `filterRow` wrapper and changes only the
Answer Review question-block gap to the observed `6 px` value. The shared
ReviewShell now serves the same spacing contract for Answer Review and
Simulation Review. Navigation, filtering, review marking, answer state,
details disclosure, persistence, and accessibility semantics remain unchanged;
no second shell or fallback path was introduced.

Focused review/visual checks passed `20/20`; full `npm run qa:static` passed
with recovery inventory `284/114/556` and `565/565` tests, TypeScript,
content-boundary, and runtime-privacy-boundary checks. This is source-level
convergence, not a `MATCHED` claim: current-head Light/Dark pixel comparison,
Maestro/CoreSimulator capture, and Product Owner approval remain open.

## Addendum — Home Overview metric convergence

The current channel `ksxw21cw` was revalidated against live Figma nodes
`55:445` (`02A · Home · Coding · Ready`) and `55:539` (`02B · Home · Coding ·
Active session`). Both states use the shared `Metric Row` contract: an `8 px`
gap between the 40×4 progress track and the value, with the value using the
14 px semibold body-strong treatment. The Home owner had used a `4 px` gap and
the 14/22 body line box, which widened and vertically over-sized the metric
value group.

Commit `fbb49e1` changes only `HomeTab` Overview metric presentation to the
existing `spacing.sm` and `typography.bodyStrong` tokens. Ready and active
session recommendation ownership, actions, activity copy, track selection,
navigation, persistence, and accessibility semantics remain unchanged. No
obsolete path or duplicate visual owner was retained or introduced.

Focused Home/visual/large-text checks passed `36/36`; full
`npm run qa:static` passed with recovery inventory `284/114/556` and `565/565`
tests, TypeScript, content-boundary, and runtime-privacy-boundary checks. This
is source-level convergence, not a `MATCHED` claim: current-head Light/Dark
runtime pixel comparison, Maestro/CoreSimulator capture, and Product Owner
approval remain open.

## Addendum — Practice final-item state revalidation

The current channel `ksxw21cw` was revalidated against live Figma node
`68:844` (`06F · Final item`). It confirms the existing canonical final-item
semantics: the correct answer state, title-case `Reason`, collapsed `Details`,
primary `Finish session`, and ghost `Leave session`. At source SHA `bd0fc5e`,
`AnswerOption`, `DetailsDisclosure`, and `getPracticePrimaryAction` already own
these states. No second completion path, fixture-only layout, or semantic
shortcut was added.

This is a revalidation with no additional source delta. The final-item row
still remains `PARTIAL` in the matrix until current-head Light/Dark runtime
capture and expanded-details geometry evidence exist; Product Owner approval
also remains open.

## Addendum — Progress typography convergence

The current channel `ksxw21cw` was revalidated against live Figma nodes
`842:9563` (`Pattern / Progress Screen · Established Evidence`) and
`842:10949` (`Pattern / Progress Screen · No Evidence`). The populated
reference uses a 12 px medium status label for current-focus evidence and a
13 px semibold activity link. The local Progress owner had rendered the focus
status as 14/20 and inherited the 14/22 small-link treatment.

Commit `e4466b9` changes only those two existing style owners to 12/18 medium
and 13/18 semibold. The empty state was rechecked against `842:10949` and
already owns the same icon/title/description/action structure, so it was not
changed. The Figma weekly-goal/cadence labels, effectiveness trend chart, and
track-evidence surface are not backed by the canonical local model; they were
not added as synthetic metrics, metadata, or new routes.

No route, command, learning evidence, persistence, accessibility behavior, or
fallback path changed, and no obsolete Progress visual owner was retained or
introduced. Focused Progress/Home/review/visual checks passed `36/36`; full
`npm run qa:static` passed with recovery inventory `284/114/556` and `565/565`
tests, TypeScript, content-boundary, and runtime-privacy-boundary checks.
This is source-level convergence, not a `MATCHED` claim: current-head
Light/Dark runtime pixel comparison and Product Owner approval remain open.

## Addendum — Activity empty and clearable-filter convergence

The current channel `ksxw21cw` was revalidated against live Figma nodes
`842:11192` (`Pattern / Activity Screen · Populated`), `842:11410`
(`Pattern / Activity Screen · Empty`), and `842:11466`
(`Pattern / Activity Screen · Filtered Empty`). Populated rows retain the
existing 73 px row, 36 px icon tile, 10 px row gap, 11/15.4 detail text, and
status-color mapping. Empty states use an 80 px bottom inset, a 17 px title,
and success-colored activity bars. The filtered selector is clearable and
uses primary text for the selected track.

Commit `a749654` applies those visual facts and exposes the clear icon through
the existing `setFilter(All tracks)` transition. The filter sheet, track
taxonomy, activity read model, row navigation, empty-state commands, and
unavailable path remain canonical; no alternate filter model, route, or
fallback was introduced. The new clear affordance has a dedicated runtime
selector and translated accessibility copy.

Focused Activity checks passed `35/35`; full `npm run qa:static` passed with
recovery inventory `284/114/556` and `565/565` tests, TypeScript,
content-boundary, and runtime-privacy-boundary checks. This is source-level
convergence, not a `MATCHED` claim: current-head Light/Dark runtime pixel
comparison and Product Owner approval remain open.

## Addendum — Practice Hub primary-card geometry convergence

The current channel `ksxw21cw` was revalidated against live Figma node
`55:993`, its primary card `55:1022`, rail `55:1023`, card text `55:1024` /
`55:1025` / `55:1026`, settings action `55:1029`, and shared Button authority
`141:817`. The card metadata defines a `353×204` surface with `20 px`
padding, `16 px` gaps, a `0.28` primary border, visible `0 16 40` shadow,
20/24 title metrics, 13.5/19 description metrics, and a rail at top `19 px`.
The topic indicator uses a `6 px` gap and the settings label uses 13 px medium
text with a 16 px line box.

Commit `058c6ea` applies those visual facts in the existing `PracticeHubScreen`
owner and updates the focused geometry sentinels. Follow-up commit `b8e4083`
corrects the card and action-stack rhythm tokens from `spacing.xl` to
`spacing.lg`, making the Figma 16 px rhythm explicit in source. Canonical mode ownership,
the four-mode Coding Free contract, navigation commands, unavailable states,
large-text branch, lifecycle, persistence, and accessibility behavior remain
unchanged; no Figma-only `Independent Practice` or `Coding Interview` rows
were added.

The final focused Practice Hub/Question Shell/accessibility suite passed
`26/26`; full `npm run qa:static` passed with recovery inventory
`284/114/557` and `566/566`
tests, TypeScript, content-boundary, and runtime-privacy-boundary checks. This
is source-level convergence, not a `MATCHED` claim: current-head Light/Dark
runtime pixel comparison, Maestro/CoreSimulator capture, and Product Owner
approval remain open.

## Addendum — Practice Question prompt-to-answer rhythm convergence

The current channel `ksxw21cw` was revalidated against live Figma node
`68:569` (`06B · Single choice · Unanswered`) and its shared Question Shell
component. The reference uses a 12 px vertical rhythm through the scrollable
question content, including the transition from the prompt to the first
answer option. The canonical `PracticeSessionSurface` had kept a 16 px gap on
the wrapper between `QuestionCard` and `PracticeResponseControls`, while the
question label/prompt and answer-option stack already used 12 px.

Commit `2668022` changes that existing wrapper to `spacing.md` (`12 px`) and
adds a focused sentinel. Answer-option geometry, footer ownership, submit and
leave commands, feedback timing, lifecycle, persistence, and accessibility
semantics remain unchanged.

Focused Practice Hub/Question Shell/accessibility checks passed `26/26`; full
`npm run qa:static` passed with recovery inventory `284/114/557` and `566/566`
tests, TypeScript, content-boundary, and runtime-privacy-boundary checks. This
is source-level convergence, not a `MATCHED` claim: current-head Light/Dark
runtime pixel comparison, Maestro/CoreSimulator capture, and Product Owner
approval remain open.

## Addendum — Practice feedback label-state convergence

The current channel `ksxw21cw` was revalidated against live Figma `68:637`
(`06E · Immediate feedback · Default`) and `68:719` (`REF-06A · Details
expanded`). The immediate-feedback reason panel renders the title-case label
`Reason`, while the expanded reference renders `REASON`; both retain the same
12/16 semibold label geometry and the same reason-panel surface. Commit
`bd0fc5e` makes the existing `PracticeFeedbackBlock` use the already-present
`detailsOpen` state for this casing-only visual variant. No feedback result,
scoring, disclosure command, authored copy, or persistence behavior changed.

Focused Practice Hub/Question Shell/accessibility checks passed `26/26`; full
`npm run qa:static` passed at `bd0fc5e` with recovery inventory `284/114/557`
and `566/566` tests, TypeScript, content-boundary, and runtime-privacy-boundary
checks. This remains source-level convergence: fresh current-head Light/Dark
runtime pixel comparison, expanded-details geometry proof, and Product Owner
approval remain open.

## Addendum — Current-channel cross-surface revalidation

The current connector channel `ksxw21cw` was revalidated against Activity
populated/empty nodes `842:11192` and `842:11410`, granted Notifications
`92:865`, shared Button `141:817`, expanded Practice details `68:719`, and
Practice Preparing `68:549`. The existing canonical owners already expose the
safe Figma geometry: Activity filter/rows/empty CTA, Notification section and
settings-row rhythm, the full Button state matrix, the 12/16 `REASON` label
and 13/20 rich-details typography, and the Preparing async card.

No source delta was justified by this pass. Figma-only `Loading older
activity...` and `Leave practice` still have no truthful pagination or
preparing-lifecycle command owner; adding them would create a fake state.
The expanded details surface remains source-level aligned but is not promoted
to `MATCHED` without current-head Light/Dark runtime evidence.

Fresh `npm run qa:static` on source SHA `bd0fc5e` passed recovery inventory
`284/114/557`, TypeScript, `566/566` tests, content boundary, and runtime
privacy boundary. The repository was clean on `main` before this
documentation-only evidence update; no push was performed. This does not
claim 99% parity or Product Owner approval.

## Addendum — Default footer vertical rhythm convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`Pattern / Screen Shell · Dark` node `830:7457`. The shared `Screen` default
footer used `spacing.lg` (`16 px`) vertically, while the live Figma shell uses
`20 px` top and bottom padding. The canonical default footer now uses the
existing `spacing.xl` token (`20 px`). Specialized `compact`, `review`,
`session`, and `sticky` footer contracts remain explicit and unchanged.

This is a shell-geometry-only correction: no route, action, lifecycle,
persistence, accessibility, or semantic contract changed. The reachability
scan found active consumers for every footer variant and no obsolete or
duplicate visual owner introduced by the change. Focused shell/session checks
passed `11/11`; fresh `npm run qa:static` passed recovery inventory
`284/114/557`, TypeScript, `566/566` tests, content boundary, and runtime
privacy boundary. Current-head Light/Dark runtime pixel comparison and
Product Owner approval remain open; this does not claim 99% parity.

## Addendum — Review reason typography convergence

The current connector channel `ksxw21cw` was revalidated against Answer
Review `81:538`. Its shared review feedback uses Inter Medium at 14/22 for
the visible Reason body. Practice feedback remains a separate owner and keeps
its Figma-defined regular body treatment.

Commit `5a0fabe` applies `fontWeight: "500"` only to the repository-owned
`ReviewFeedbackBlock`, used by Certification Answer Review and Simulation
Review. No feedback semantics, review marking, details disclosure, route,
lifecycle, or persistence behavior changed. Focused visual-shell checks passed
`10/10`; full `npm run qa:static` passed with recovery inventory
`284/114/557`, `566/566` tests, TypeScript, content-boundary, and
runtime-privacy-boundary checks. Current-head Light/Dark runtime comparison
and Product Owner approval remain open; this does not claim 99% parity.

## Addendum — Practice Hub section chrome convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`55:993`. The `More ways to practice` section uses a route-local 6 px top
inset and 13/16 bold muted label; the previous shared `SectionHeader tight`
rendered a 14/18 semibold label without that inset. The hero secondary action
also has text only in the reference, so its extra 16 px chevron was removed.

Commit `a6d05c6` keeps the canonical four Coding Free modes, their existing
commands, unavailable states, route ownership, lifecycle, persistence, and
accessibility unchanged. The Figma-only mode rows and settings semantics were
not introduced. Focused Practice Hub/accessibility checks passed `15/15`; the
full `npm run qa:static` passed with recovery inventory `284/114/557`,
`566/566` tests, TypeScript, content-boundary, and runtime-privacy-boundary
checks. Current-head Light/Dark runtime comparison and Product Owner approval
remain open; this does not claim 99% parity.

## Addendum — Settings section-label rhythm convergence

The current connector channel `ksxw21cw` was revalidated against live Figma
`822:7687` (`Pattern / Settings Content`). The canonical Figma groups place
the first 63 px row directly after the 13 px section label; the previous
shared `SettingsGroup` added a 4 px title-to-row gap. Commit `5e3a69f` adds an
explicit title-gap contract and sets the three canonical Settings root groups
(`App`, `Learning`, and `Data & privacy`) to `0 px`. The default 4 px gap is
retained for `SettingsInformationScreen`, which has no route-bound reference
in this Figma scope.

No fixture-only Account, Sync, Plan, Goal & cadence, or Help rows were added,
and the repository-owned version string was not replaced with the Figma
fixture's sample version. Focused Settings presentation checks passed `8/8`;
the full `npm run qa:static` passed with recovery inventory `284/114/557`,
TypeScript, `566/566` tests, content boundary, and runtime privacy boundary.
Current-head Light/Dark runtime comparison and Product Owner approval remain
open; this is source-level convergence, not a 99% claim.

## Addendum — Fixed question-shell structure convergence

The current connector channel `ksxw21cw` was revalidated against live Figma
`74:539` (Simulation active), `851:11383` (G04 Practice canonical QA),
`68:569` (Practice active), and `74:834` (operation recovery). The canonical
question shell keeps the top bar and 4 px progress track outside the scrolling
body, starts scroll content at the 20 px shell inset, and uses a 12 px body
rhythm. The top bar remains a horizontal row at the 200% text-size reference;
the previous large-text column path was removed. Practice uses the proven
228 px action footer, while active Simulation uses the proven 361 px footer.

`Screen` now exposes the fixed `header` slot and an explicit `simulation`
footer variant; `SessionShell` is the single owner of the shared shell
geometry and maps practice/simulation defaults to those contracts. The
operation-recovery state remains explicitly separate: Figma `74:834` places
its notice and actions below a footer-less question shell, while the current
runtime still renders that notice/action surface through the existing default
footer. No lifecycle, command, persistence, content, scoring, or route
semantics changed, and the removed large-text/session-root styles have no
remaining references.

Focused shell/session/accessibility checks passed `33/33`. Fresh
`npm run qa:static` on the current working tree passed recovery inventory
`284/114/557`, TypeScript, `566/566` tests, content boundary, and runtime
privacy boundary. This is source-level convergence only: current-head
Light/Dark runtime pixel evidence, CoreSimulator/Maestro capture, operation
recovery geometry, and Product Owner approval remain open. This does not
claim 99% parity.

## Addendum — Simulation operation-recovery layout convergence

This addendum supersedes the preceding open-delta statement for the recovery
surface.

The current connector channel `ksxw21cw` was revalidated against Figma
`74:834` (`07E · Save failure · Keep editing`) and `74:879`
(`07F · Navigation recovery`). Both references use an 852 px footer-less
question shell followed by a 20 px gap, a 353×76 operation notice, full-width
48 px actions, 12 px action spacing, and 16 px bottom inset. `74:834` has
`Try again`, `Keep editing`, and `Leave simulation`; `74:879` has `Continue`
and `Leave simulation`.

`SimulationSessionSurface` now removes operation notices from the fixed
`Screen` footer entirely and renders one canonical recovery region below the
`SessionShell`. The previous `actionBarOperation` styling and the
`SessionShell` footer override were removed because they represented the
wrong owner and could not produce the Figma footer-less shell. The existing
operation projection, commands, runtime selectors, accessibility semantics,
and persistence behavior remain unchanged. The neighboring action-sheet
references `74:968` and `74:992` were revalidated; no source delta was made
there because the existing modal remains the canonical action-sheet owner.

Focused operation/session/shell checks passed `34/34`. Fresh
`npm run qa:static` passed recovery inventory `284/114/557`, TypeScript,
`566/566` tests, content boundary, and runtime privacy boundary. Current-head
Light/Dark runtime pixel evidence, CoreSimulator/Maestro capture, action-sheet
runtime comparison, and Product Owner approval remain open. This does not
claim 99% parity.

## Addendum — Practice summary outcome-label convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`750:6235` (Practice complete). The canonical summary already matched the
shell, 24 px content inset, 28 px content rhythm, factual metrics, outcome
rows, review note, and 48 px action geometry. The remaining confirmed visual
delta was the `OUTCOME DISTRIBUTION` label: the source now uses 10 px bold
uppercase text, 1.2 px letter spacing, and a 12 px line height on
`AlgorithmsPracticeSummaryScreen`.

The Figma secondary label says `Back to Home`, while the canonical command
still navigates to `PRACTICE_HUB` and is intentionally labeled `Back to
practice`. No misleading copy-only change was made; this remains an explicit
`CANONICAL_CONFLICT` until the product owner supplies the intended command.
The completed-summary row remains `PARTIAL`, not `MATCHED`, because current
head Light/Dark runtime captures and owner approval are still missing.

Source commit `6b5ad42` passed focused summary/navigation and visual-shell
checks (`2/2` and `10/10`), TypeScript, and full `npm run qa:static` with
recovery inventory `284/114/557`, `566/566` tests, content boundary, and
runtime privacy boundary. This is a source-level correction only and does
not claim 99% parity.

## Addendum — Practice setup selected-segment token convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`55:2172` (Custom Practice settings). The compact segmented control already
matched the 54 px shell, 4 px inset, 10 px selected segment, and selected
primary surface. Its selected `questions` caption was using `onPrimary`,
while Figma specifies the action `primary` token; the canonical
`PracticeSetupScreen` now uses `palette.primary` for that caption.

The Figma-only `Focus areas` summary and `Save settings` CTA remain excluded:
the current route owns `Start session`, session-length selection, feedback
timing, and the corresponding session command, but no truthful focus-area
selection or settings-save command exists in the repository. The route stays
`PARTIAL` pending current-head Light/Dark runtime evidence and owner approval.

Source commit `a404eac` passed the focused setup/loading/configuration/visual
checks (`27/27`), TypeScript, and full `npm run qa:static` with recovery
inventory `284/114/557`, `566/566` tests, content boundary, and runtime
privacy boundary. This does not claim 99% parity.

## Addendum — Home recommendation-card clipping convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`55:445` (Home · Coding · Ready). The canonical recommendation card already
matched the 22 px radius, primary border, 20 px inset, 16 px card rhythm,
44 px icon tile, 22/28 title, and primary CTA. Figma also clips the card
contents at its rounded boundary; the source card rail is positioned at
`left: -1`, so `HomeTab` now sets `overflow: "hidden"` on the card to keep
the rail inside that boundary.

No recommendation data, route, command, progress model, or accessibility
behavior changed. The Home row remains `PARTIAL` pending current-head
Light/Dark runtime captures and owner approval.

Source commit `8f17eba` passed focused Home/visual/accessibility checks
(`29/29`), TypeScript, and full `npm run qa:static` with recovery inventory
`284/114/557`, `566/566` tests, content boundary, and runtime privacy
boundary. This does not claim 99% parity.

## Addendum — Progress action-token convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`842:9563` (Progress · Established Evidence). The route's existing local
evidence model already owns the current-focus, review, activity, and
learning-map surfaces. Figma binds the visible status/action accents to the
green `action/primary` token; `ProgressTab` now applies `palette.primary` to
the `This week` label, the focus evidence detail, and the `Review weak areas`
action label. The previous blue `info`/inherited ghost-label colors were
visual token mismatches.

The Figma goal/cadence/focus-area values, effectiveness chart, and
`View all track evidence` route still have no truthful canonical owner in the
repository. They remain explicit scope conflicts and were not synthesized.
The Progress row stays `PARTIAL` pending current-head Light/Dark runtime
captures and owner approval.

Source commit `ad1b97a` passed focused Progress/projection/visual checks
(`26/26`), TypeScript, and full `npm run qa:static` with recovery inventory
`284/114/557`, `566/566` tests, content boundary, and runtime privacy
boundary. This does not claim 99% parity.

## Addendum — Activity instance geometry revalidation

The current connector channel `ksxw21cw` was revalidated against the
populated Activity screen `842:11192`, the concrete row instance `842:11177`,
and the track selector `842:11173`. The screen-level row instances are
`353×95`: their visible content uses `16 px` horizontal padding, `12 px`
vertical padding, `10 px` inter-column gap, a `36×36` icon tile, 14 px
semibold title text, and 11/15.4 px caption lines. The existing
`ActivityScreen` source owns those values; its `minHeight: 73` is the content
minimum before the 24 px vertical padding and therefore does not make the
rendered row 73 px tall. The selector also matches the 40 px height, 14 px
horizontal inset, 8 px gap, and 18 px chevron.

No source delta is justified by this pass. The Figma `PaginationLoading`
label (`Loading older activity...`) still has no truthful pagination owner in
the repository, whose canonical read model loads the durable local history as
one verified projection. It was not added as a permanent or synthetic loading
state. Current-head Light/Dark runtime comparison, capture tooling, and
Product Owner approval remain open; this does not claim 99% parity.

## Addendum — Default Screen content inset convergence

The current connector channel `ksxw21cw` was revalidated against the live
Figma Screen Shell `830:7457`, including its `393×852` stress instance
`830:7459`. The reference `scroll-content` uses `space/20` as its outer inset
on all four sides. In the default no-footer content contract, the canonical
`Screen` already owned the horizontal and bottom 20 px tokens; its default
top inset was the remaining 16 px outlier. Footer-specific clearance remains
an explicit separate contract in the shared shell.

Commit `8d6efa1` changes only the shared default `Screen.content` top inset
from `spacing.lg` to the existing `spacing.xl` token. Compact density, footer
variants, safe-area edges, and route-owned overrides remain explicit and
unchanged. No route, command, lifecycle, persistence, accessibility, or
semantic contract changed, and the dead-path scan found no duplicate shell
owner introduced by the correction.

Focused shell/session checks passed `25/25`; fresh `npm run qa:static` passed
recovery inventory `284/114/557`, TypeScript, `566/566` tests, content
boundary, and runtime privacy boundary. Current-head Light/Dark pixel capture,
CoreSimulator/Maestro tooling, and Product Owner approval remain open. This
is source-level convergence only and does not claim 99% parity.

## Addendum — Select Track sticky-footer owner convergence

The current connector channel `ksxw21cw` was revalidated against Select Track
`42:422` (`05A · First choice · Coding selected`). The reference uses a
dedicated `Sticky-Bottom-Area` with a 16 px top inset, a 0.05 white separator,
and 20 px outer bottom padding around its 4 px safe local content clearance.

Commit `17f1e25` routes `SelectTrackScreen` through the existing shared
`Screen` `sticky` footer variant and reduces its route-local footer content
padding from 8 px to 4 px. The existing selection state, eight-track registry,
commit command, persistence, large-text stacking, and accessibility contract
remain unchanged. No registration-failure dialog or Figma-only track
projection was introduced.

Focused Select Track/ambient/shell checks passed `15/15`; fresh
`npm run qa:static` passed recovery inventory `284/114/557`, TypeScript,
`566/566` tests, content boundary, and runtime privacy boundary. The row
remains `PARTIAL` because current-head Light/Dark pixel capture, the
screen-level two-card versus eight-track scope decision, and Product Owner
approval remain open. This does not claim 99% parity.

## Addendum — List Row disabled-state convergence

The current connector channel `ksxw21cw` was revalidated against the shared
List Row disabled references `155:852` (shown) and `155:876` (hidden). Both
references keep the row fully legible on `surfaceInput`, preserve the row's
normal geometry, and use secondary supporting text; they do not apply a
whole-row opacity treatment. The shown reference also uses the muted leading
icon treatment.

Commit `d71f5dd` updates the existing shared `ListRow` owner to use the
canonical `surfaceInput` disabled background and `textSecondary` detail color,
passes the real disabled state to `Pressable`, and exposes the corresponding
accessibility state. The only direct disabled caller is the existing blocked
daily-reminder row, which now selects the existing muted `IconTile` tone while
preserving its current command, notification state, and explicit unavailable
copy. The previous generic opacity/text-muted rule was removed because it
contradicted the Figma state; no second row owner, route, persistence path, or
new prop semantics were introduced.

Focused notification/settings/accessibility/shell checks passed `35/35`.
Fresh `npm run qa:static` passed recovery inventory `284/114/557`, TypeScript,
`566/566` tests, content boundary, and runtime privacy boundary. Current-head
Light/Dark pixel capture, CoreSimulator/Maestro evidence, and Product Owner
approval remain open. The hidden List Row variant has no reachable canonical
caller in the current app, so no artificial usage path was added. This is
source-level convergence only and does not claim 99% parity.

## Addendum — Goal & cadence canonical route convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`842:11569` (Goal & cadence · Create) and `842:11693` (Goal & cadence ·
Active). The former Figma-only goal/cadence surface now has a canonical
owner: `GoalCadenceScreen`, entered from the Progress weekly card for the
active track. The create state uses the existing `ChoiceRow`, `Screen`,
`IconButton`, `Button`, and theme tokens; the active state renders the
persisted summary, status, preferred days, and notification-settings handoff.

The domain contract is per-track and descriptor-backed. A goal stores only
truthful fields currently owned by the UI: goal template, optional validated
ISO target date, weekly session target, preferred days, and active/paused
status. It persists through the canonical repository namespace, with no
second storage path and no synthetic target date. Reminder scheduling remains
owned by Notification Settings, matching the Figma handoff rather than
creating a duplicate reminder command.

Commits `fc5bbeb` and `3e37ab3` add the route, domain validator, application
read/write ports, repository, Progress entry point, translations, and focused
contract/presentation tests, then close the day-label, stepper, and status-token
deltas against the live create reference. Full `npm run qa:static` passed recovery inventory
`287/116/563`, TypeScript, `572/572` tests, content boundary, and runtime
privacy boundary. The Goal & cadence row remains `PARTIAL`: same-head
Light/Dark runtime screenshots, paused-state visual comparison, and Product
Owner approval are still open. This addendum does not claim 99% parity.

## Addendum — Activity ambient and filtered-empty convergence

The current connector channel `ksxw21cw` was revalidated against Activity
`842:11192` (populated), `842:11410` (empty), and `842:11466` (filtered
empty). The populated and empty references share the dark Page 1 Glow-UL;
the filtered-empty state adds a 40 px horizontal content inset while keeping
the existing two-bar icon and action stack.

Commits `e09ca7d` and `a726705` extend the existing `Screen`/`AmbientBackdrop` owner with
an explicit Activity variant: dark Activity renders only the Figma-matched
teal Glow-UL, while the established Track/Practice variant keeps its indigo
glow and topography unchanged. `ActivityEmptyState` applies the existing
40 px horizontal inset only to the filtered branch. No activity model, route,
filter command, session history projection, or fallback path changed.

Focused Activity/ambient/visual-shell checks passed `15/15`; current local
`npm run qa:static` passed recovery inventory `287/116/563`, `572/572` tests,
TypeScript, content-boundary, and runtime-privacy-boundary. Activity remains
`PARTIAL` pending same-head Light/Dark runtime screenshots and Product Owner
approval; this addendum does not claim 99% parity.

## Addendum — Shared Screen Header context typography

The current connector channel `ksxw21cw` was revalidated against the shared
Screen Header `140:881`. Its back/context row uses an accessible 44 px back
button, an 8 px row gap, and a 14 px semibold context label with an 18 px
line-height; the title and muted description remain on the existing shared
title/description tokens.

Commit `f3afd92` changes only the shared `ScreenHeader` context style from
the generic 14/22 small text token to the existing 14/18 body-strong token.
The practice-setup medium-weight override remains explicit. No route, title,
navigation command, safe-area behavior, or accessibility boundary changed.

Focused shell/header checks passed `11/11`; current local `npm run qa:static`
passed recovery inventory `287/116/563`, `572/572` tests, TypeScript,
content-boundary, and runtime-privacy-boundary. Runtime Light/Dark capture
and Product Owner approval remain open; this addendum does not claim 99% parity.

## Addendum — Goal ambient-layer convergence

The current connector channel `ksxw21cw` was revalidated against Goal &
cadence `842:11569` (Create) and `842:11693` (Active). Both references use a
single Glow-UL and no indigo/topography layer. The Create reference places it
at `left:0/top:0`, uses `#20C997` at 6% opacity, and uses the Figma gradient
transform `matrix(32 0 0 28 224 196)`.

Commit `0659a5f` keeps `AmbientBackdrop` as the single owner, adds an explicit
Goal variant, and leaves the existing Track/Practice default and Activity
variant geometry intact. Goal no longer renders the default indigo/topography
layer. No route, goal persistence, cadence behavior, notification handoff,
or unavailable-state semantics changed.

Focused Goal/ambient/visual-shell checks passed `13/13`; current local
`npm run qa:static` passed recovery inventory `287/116/563`, `572/572` tests,
TypeScript, content-boundary, and runtime-privacy-boundary. Goal remains
`PARTIAL` pending same-head Light/Dark runtime screenshots, paused-state
comparison, and Product Owner approval; this addendum does not claim 99% parity.

## Addendum — Progress content inset convergence

The current connector channel `ksxw21cw` was revalidated against Progress
`842:9563`. Its `Scrollable-Content` uses a 16 px top inset, 20 px horizontal
inset, 20 px bottom inset, and a 28 px section rhythm. The shared `Screen`
default remains the canonical 20 px top inset for other routes.

Commit `8c0a9b8` applies the 16 px inset only when `HomeScreen` renders the
Progress tab. Home and Settings keep their existing route-specific spacing;
no Progress model, goal action, navigation command, or semantic state changed.

Focused Progress/Home/visual-shell checks passed `22/22`; current local
`npm run qa:static` passed recovery inventory `287/116/563`, `572/572` tests,
TypeScript, content-boundary, and runtime-privacy-boundary. Runtime Light/Dark
capture and Product Owner approval remain open; this addendum does not claim
99% parity.

## Addendum — Progress no-evidence visual geometry convergence

The current connector channel `ksxw21cw` was revalidated against the Progress
no-evidence frame `842:10949`. The state uses a compact 24 px/700 title, an
empty weekly card with 14 px horizontal and 12 px vertical padding, 4 px card
rhythm, no progress bar, a 48 px icon with 20 px radius, and a 40 px vertical
empty-state inset. Its Open Practice CTA uses the existing Button owner with
the Figma success/pill treatment.

Commit `0db6c20` applies these state-specific styles only when the canonical
Progress model has no evidence. The repository-owned copy and action remain
truthful; no synthetic session target, goal value, route, or fallback was
introduced. Focused Progress/Home/visual-shell checks passed `26/26`; current
local `npm run qa:static` passed recovery inventory `287/116/563`, `572/572`
tests, TypeScript, content-boundary, and runtime-privacy-boundary. Runtime
Light/Dark capture and Product Owner approval remain open; this addendum does
not claim 99% parity.

## Addendum — Home recent activity row convergence

Current-channel Figma `55:445` places the recent activity copy and the
`View activity` action in one shared row. Commit `c327b58` aligns the
canonical `HomeTab` owner with that structure for both populated and explicit
empty activity states. The durable attempt projection, empty-state copy,
runtime selector, and Activity navigation command remain unchanged. The
obsolete nested list wrapper and the separate action row were removed because
they no longer represented the canonical layout.

Focused Home/visual-shell checks passed `15/15`; current local
`npm run qa:static` passed recovery inventory `287/116/563`, `572/572` tests,
TypeScript, content-boundary, and runtime-privacy-boundary. Runtime Light/Dark
capture and Product Owner approval remain open; this addendum does not claim
99% parity.

## Addendum — Practice expanded-details geometry audit and implementation packet

The current connector channel `ksxw21cw` was revalidated against live Figma
node `68:719` (`REF-06A · Details expanded`) using both design context and a
fresh screenshot. The reference has two distinct surfaces: the existing
reason card remains separate, while the disclosure and its expanded document
content sit inside one outer elevated panel. That outer panel uses the
repository-equivalent geometry of `surface/elevated`, a 1 px border, 12 px
radius, 16 px padding, and a 12 px internal gap. The disclosure row itself is
48 px high with 4 px horizontal and 12 px vertical padding and an 18 px
chevron.

Repository inspection at source SHA `c327b58` confirms that
`src/components/DetailsDisclosure.tsx` already owns the disclosure row and its
accessibility state correctly. The remaining source gap is in
`src/features/practice/PracticeFeedbackBlock.tsx`: its `container` currently
groups reason, disclosure, and expanded document with only a 12 px gap, so it
does not express the Figma outer details panel. The reason card must remain
outside that new grouping. `AlgorithmFeedbackDocumentBlock` already owns the
13/20 rich-details typography recorded in the previous addendum and should not
be duplicated or restructured.

### Next implementation-ready task: `DES-005-C — Practice expanded-details wrapper`

| Field | Contract |
|---|---|
| Objective | Make the canonical Practice feedback owner express the expanded-details grouping from Figma `68:719`, without changing feedback, scoring, navigation, lifecycle, content, or accessibility semantics. |
| Scope | `PracticeFeedbackBlock`; existing shared tokens; focused Practice/session/accessibility/visual tests; this report and the launch plan. Touch `DetailsDisclosure` only if verification proves a shared row correction is required. |
| Required geometry | Keep the reason panel separate. Wrap the disclosure and optional document in one owner-bound elevated panel using existing theme tokens for surface, border, radius, padding, and gap. Preserve disclosure row min-height 48, horizontal padding 4, vertical padding 12, and icon size 18. Do not add raw Figma color literals. |
| Non-goals | No new result label, feedback copy, content schema, scoring rule, route, command, session lifecycle branch, persistence path, or Figma-only action. Do not add a second disclosure/document renderer. |
| Acceptance | Expanded and collapsed states use one canonical visual owner; `DetailsDisclosure` retains `accessibilityState.expanded`, labels, role, and test selector; reason/result selectors remain reachable; rich content grows without clipping at 200% text; Light/Dark styles resolve through the existing design-system tokens. |
| Verification | Focused Practice/session/accessibility and visual-shell tests, `npm run typecheck`, `git diff --check`, then full `npm run qa:static`. Runtime Light/Dark screenshot comparison remains a separate evidence gate until CoreSimulator/Maestro is restored. |
| Stop conditions | If the outer panel's collapsed-state behavior or token mapping is not confirmed by the current Figma authority, stop at source evidence and record the unresolved design decision; do not invent a variant. |

### Working-docs status after this audit

| Work item | Status | Evidence / boundary |
|---|---|---|
| Brief, source SHA, current channel, and Figma authority recorded | `done` | Source `c327b58`; connector `ksxw21cw`; file `kZXD7cNBKUU7x0ceTHPFpR`; page `0:1`; library `118:738`; node `68:719` revalidated. |
| Practice question/feedback source ownership | `partial` | `PracticeSessionSurface` → `PracticeFeedbackBlock` → `DetailsDisclosure` / `AlgorithmFeedbackDocumentBlock` is canonical and test-covered, but the outer expanded-details grouping is not represented in source. |
| Next implementation slice | `planned` | `DES-005-C` above; smallest coherent change is the owner-local wrapper plus focused verification. |
| Current-head runtime visual proof | `blocking` | `maestro` is unavailable and CoreSimulatorService refused the local simulator connection; no fresh Light/Dark pixel claim is made. |
| Product Owner approval for full parity scope | `blocking` | `ksxw21cw` is connector context, not approval evidence. |

This audit is documentation-only. No production source, test, route, or
content file was changed in this pass. The previous statement that expanded
details were source-level aligned is narrowed: typography and disclosure-row
geometry are aligned at source level, while the outer grouping remains an
implementation gap and the final parity status remains `PARTIAL`.

## Addendum — DES-005-C implementation convergence

Commit `1c9457b` implements the verified geometry slice in the canonical
`PracticeFeedbackBlock` owner. The collapsed disclosure remains a standalone
48 px row, matching Figma `68:844`; when opened, the same disclosure and the
rich document are grouped inside one elevated panel with the existing
`elevatedSurface`, `border`, `radius.lg`, `spacing.lg`, and `spacing.md`
tokens, matching the structure of Figma `68:719`. The reason card remains
outside that wrapper. No raw Figma color, second renderer, result label,
feedback copy, scoring, route, lifecycle, persistence, or command was added.

The current Figma evidence also records an unresolved state conflict:
`68:637` (immediate feedback default) contains the reason card and footer but
no Details row, while the repository's canonical after-answer contract and
existing M1/M2 audit flows require a reachable Details selector for rich
feedback. This implementation therefore corrects only the verified geometry
and does not silently remove or hide the contract-required interaction.
Resolve this as a Figma/product-state decision before promoting the matrix row
beyond `PARTIAL`.

Focused Practice/session/accessibility and M1/M2 selector checks passed
`23/23`; `npm run typecheck` passed; full `npm run qa:static` passed with
recovery inventory `287/116/563`, `572/572` tests, content boundary, and
runtime privacy boundary. Current-head Light/Dark capture remains unavailable
because Maestro is absent and CoreSimulatorService refused the simulator
connection. Product Owner approval and pixel proof remain open; this does not
claim 99% parity.

## Addendum — Goal & cadence active geometry convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`842:11569` (Create) and `842:11693` (Active). Commit `38af502` keeps
`GoalCadenceScreen` as the single route owner and aligns the existing contract
with the pushed-header rhythm: an 8 px internal header gap, track context before
the Active status row, and the existing Create description below the context.

The Active summary now uses the Figma 14 px/14 gap card rhythm with explicit
separators, 12 px teal labels, 14 px medium values, and preferred-day badges.
The reminders action remains the existing notification-settings command. No
goal fields, route, persistence, reminder semantics, pause behavior, or new
Figma-only action were added; the previous oversized summary-row path was
removed because it was the competing presentation owner.

Focused Goal/ambient/runtime-audit checks passed `7/7`; `npm run typecheck` and
full `npm run qa:static` passed with recovery inventory `287/116/563`,
`572/572` tests, TypeScript, content boundary, and runtime privacy boundary.
Current-head Light/Dark/200% runtime capture and Product Owner approval remain
open; this addendum does not claim 99% parity.

## Addendum — Shared visual-effect token cutover

Commit `4f918ad` completes a repository-owned token cutover for repeated visual
effects used by the reachable UI. `src/theme/tokens.ts` now owns the shared
scrims, review/session overlays, subtle borders, dividers, sheet handles,
unavailable surfaces, shadow color, dark ambient colors, and theme-specific
primary pressed color. Shared shell, button, modal, review, practice,
simulation, Goal & cadence, and ambient owners consume those tokens directly.

The migration preserves the existing Figma values and runtime behavior; it does
not introduce a second theme, visual fallback, route, command, or semantic
state. The dead-literal scan found no remaining raw overlay/scrim/shadow or
ambient canvas literal outside the token owner; domain track accents remain
explicit content metadata.

Focused visual/accessibility/session/Goal checks passed `44/44`; full
`npm run qa:static` passed recovery inventory `287/116/564`, `573/573` tests,
TypeScript, content boundary, and runtime privacy boundary. This is design
system convergence, not a `MATCHED` or 99% claim: current-head Light/Dark/200%
runtime capture and Product Owner approval remain open.

## Addendum — Goal active edit-affordance conflict

The fresh screenshot for Figma `842:11693` shows the Active state with a
read-only summary, a centered `Pause goal` action, and a `Save changes` sticky
footer; it does not show an `Edit goal` affordance. The canonical repository
still owns an explicit `Edit goal` command that creates the draft used by the
existing Goal form and `persistGoal` path. Removing that command would make the
persisted goal fields unreachable, while turning the Figma `Save changes`
button into a no-op would create fake interaction.

This is therefore a `CANONICAL_CONFLICT`, not a safe visual deletion. The
existing edit command remains visible and truthful until the Product Owner
decides whether the Figma frame is read-only, represents an already-editing
variant, or omits the edit affordance from the approved state set. No source
change was made for this conflict.

## Addendum — Practice Hub section-label casing convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`55:993` (`03A · Practice · Coding · Review available`). The section label is
rendered as the uppercase `MORE WAYS TO PRACTICE` contract, while the canonical
`PracticeHubScreen` owner supplied the same copy in sentence case.

Commit `2bc34df` changes only the existing `sectionTitle` style to use
`textTransform: "uppercase"` and extends the existing Practice Hub geometry
sentinel. Mode ownership, the four bundled Coding Free modes, unavailable
states, commands, lifecycle, persistence, accessibility, and the Figma-only
rows remain unchanged. No duplicate owner or copy branch was introduced.

Focused Practice/accessibility/visual-shell checks passed `30/30`; `npm run
typecheck`, `git diff --check`, and full `npm run qa:static` passed with recovery
inventory `287/116/564`, `573/573` tests, content boundary, and runtime privacy
boundary. This is source-level convergence, not a `MATCHED` or 99% claim:
current-head Light/Dark/200% runtime capture and Product Owner approval remain
open.

## Addendum — Certification exam screen design boundary

The current connector channel `ksxw21cw` was checked against Figma `74:1464`,
named `EXAM PRACTICE`. This node is a compact specification card, not an
approved route-bound 393×852 screen: it lists profile-owned facts such as
question count, duration, timer semantics, navigator, flagging, and the
explicit statement `No official exam result`.

The reachable repository routes `Exam` and `ExamReview` therefore remain
`DESIGN_MISSING` for parity purposes. The card cannot safely supply their
layout, and reusing Simulation or Answer Review as a substitute would invent a
screen/state mapping. No source change was made; an approved route-bound
Certification screen and outcome reference are still required before this
lane can move beyond its current matrix status.

## Addendum — Practice Hub unavailable-row reconciliation

Live Figma `55:1139` confirms that the unavailable review state is a variant
inside Practice Hub, not a separate route. Its row uses `surface/input`, keeps a
chevron, and renders the status inside the supporting copy (`Unavailable · No
review items are due yet.`). The canonical repository instead renders an
explicit non-actionable row with an `Unavailable` badge and package-scoped
reason copy, preserving the product contract that an empty review queue must
never substitute ordinary practice.

This is a `CANONICAL_CONFLICT`, not a safe geometry-only change: removing the
badge or making the chevron actionable would alter the explicit unavailable
boundary, while copying the Figma sentence would change the current
package-scoped diagnostic contract. No source change was made. The owner must
decide whether the Figma row is the approved unavailable presentation or a
fixture variant before this state can move beyond `PARTIAL`.

Page-1 metadata also contains account, authentication, premium, and content
delivery frames, but the current `RootNavigator` does not expose those routes.
They remain outside the reachable-path parity matrix until a canonical route
owner exists; no Figma-only route was added.

## Addendum — Progress goal action-copy convergence

The current connector channel `ksxw21cw` was revalidated against Figma
`842:9564` (09A Established Evidence). The existing Progress goal entry already
uses the canonical `onOpenGoal` command and opens `GoalCadenceScreen`; its source
label was `View goal`, while the Figma state labels the existing-goal action
`Manage goal`.

Commit `92fe971` changes only that visible label and its accessibility label:
existing goals now expose `Manage goal` / `Manage learning goal`, while the
no-goal state exposes `Set a goal` / `Set a learning goal`. Polish translations
were added through the existing translation boundary. Route, goal model,
persistence, editing command, and navigation semantics are unchanged; no
synthetic metrics or Figma-only action was introduced.

Focused Goal/visual/runtime-audit checks passed `17/17`; the current full
`npm run qa:static` passed recovery inventory `287/116/564`, `573/573` tests,
TypeScript, content boundary, and runtime privacy boundary. This is a
source-level label convergence, not a `MATCHED` or 99% claim: current-head
Light/Dark/200% runtime capture and Product Owner approval remain open.

## Addendum — ChoiceRow radio placement convergence

The current connector channel `ksxw21cw` was revalidated against the shared
Figma `Pattern / Appearance Choice` component `619:5237` and its 200% stress
instance `882:14452`. The reference order is preview, flexible copy, then the
20 px radio control at the trailing edge. The canonical `ChoiceRow` previously
rendered the radio between the preview and copy, which moved the control away
from the right edge in every caller.

Commit `ec888d9` moves the existing radio node after the copy for the
Appearance-preview variant. Revalidation against compact `Choice Row` in
Figma `55:2172` then confirmed that ordinary and compact rows keep the radio
before the copy; `e6935c4` makes that distinction explicit in the shared owner.
Appearance, Goal & cadence, and compact Practice Setup therefore retain their
respective Figma orders. Selected state, values, commands, persistence,
accessibility role/state, and large-text behavior remain unchanged. No
duplicate row owner or route-specific layout was introduced.

Focused settings/visual/goal checks passed `21/21`; current source
`e6935c4` also passed recovery inventory `287/116/564`, `573/573` tests,
TypeScript, content boundary, and runtime privacy boundary. The Light/Dark/200%
runtime capture and Product Owner approval remain open. The Appearance route
remains `DESIGN_MISSING` for full route-bound state coverage even though its
shared row geometry now has Figma evidence.

## Addendum — Summary Shell large-text propagation

The current connector channel `ksxw21cw` was revalidated against Figma
`882:14459`, the 200% stress instance of the shared `Pattern / Summary Shell`
component (`750:6109` / `750:6107`). The canonical simulation summary already
owned the shell geometry, completion state, footer actions, and 200% text
contract for its title, mode, and Results label. Its metric and outcome text
nodes were the remaining source-level gap: `Answered`, `Active time`, and the
`Correct` / `Partial` / `Incorrect` label/value pairs did not explicitly carry
the same `maxFontSizeMultiplier={2}` used by the surrounding summary.

Commit `9312cf2` adds that multiplier to the existing `SummaryStat` and
`OutcomeStat` owners. Commit `03fff7a` then aligns the metric row with Figma's
flexible label, fixed spacer, and right-aligned value reflow. These changes do
not alter completion semantics, result data, copy, route, navigation, button
geometry, or add any Figma-only metric. The result remains one summary
renderer with an explicit stress-state text contract.

Focused visual-shell checks and `npm run typecheck` pass at this slice. The
current-head full QA, Light/Dark/200% runtime pixel capture, and Product Owner
approval remain open, so this is source-level convergence and not a `MATCHED`
or 99% claim.

## Addendum — Review Shell 200% text and accent convergence

The current connector channel `ksxw21cw` was revalidated against the Answer
Review authority `81:538` / `801:7299`, the shared Review Shell `765:6130`,
and the 200% stress instances `766:5732` (Dark) and `766:5822` (Light).
Those references keep the review QUESTION/REASON accent at Figma teal
`#14B8A6`, scale the answer-option letter and review eyebrow with the same
200% text contract, and allow rich Details paragraphs, headings, lists,
callouts, and code to grow without replacing their existing semantic owners.

Commit `c7de410` introduces the repository-owned `ambient.reviewTeal` token
and maps the shared Review feedback/question-eyebrow owners to it; it does
not change the action-primary token or Practice's distinct `#20C997` accent.
Commit `917a084` adds the 200% multiplier to the shared AnswerOption letter,
and commit `2b19f81` completes the same contract for simulation review
eyebrows, Practice feedback reason text, and the rich feedback document
renderer. The existing `selectable` code path, answer semantics, review
marking, details disclosure, navigation, and unavailable states remain
unchanged.

Focused typecheck and review/accessibility/visual checks passed; the current
head also passed full `npm run qa:static` with recovery inventory 287/116/564
and 573/573 tests. This is source-level convergence, not a `MATCHED` or 99%
claim: current-head Light/Dark/200% runtime pixel capture and Product Owner
approval remain open.

## Addendum — Current-head iOS capture recovery

The capture blocker was narrowed on 2026-08-24. The repository source remains
`2b19f81`; the explicit local Maestro binary
`/Users/lukaszkurczab/.maestro/bin/maestro` reports version `2.6.1`, and the
current connector channel remains `ksxw21cw`. On simulator
`00B8F5B5-DF44-4621-8E30-56927604FA96` (`Maestro_IOS_iPhone-16-Pro_18`, iOS
18.6), capture-only flows completed for the canonical Settings and blocked
Notifications states in both Light and Dark:

- `/tmp/patternly-capture-current-head-dark-2026-08-24/`
- `/tmp/patternly-capture-current-head-large-text-2026-08-24/`
- `/tmp/patternly-capture-current-head-large-text-dark-2026-08-24/`

The large-text runs used the simulator's
`accessibility-extra-extra-extra-large` content-size setting, then restored
the standard `large` size and the prior Dark application appearance. The
captured Settings/Notifications states did not expose clipping in the
permission card, blocked reminder row, or bottom-navigation labels. Figma
`92:889` and the shared navigation stress authority `830:9045` remain the
visual references; no source delta was justified by this evidence.

This closes only the tooling gap for these states. It does not promote their
matrix rows to `MATCHED`: the remaining reachable states still need current-
head captures and pixel review, and the full Figma scope still contains
`DESIGN_MISSING` and `CANONICAL_CONFLICT` rows pending owner decisions.

## Addendum — Current-head visual-shell Light/Dark capture

On the same current source `2b19f81`, the canonical shared Maestro flow
`.maestro/screenshot-capture/visual-shell/visual-shell-capture.yaml` completed
all 11 screenshot/assertion checkpoints for both application themes on
`00B8F5B5-DF44-4621-8E30-56927604FA96` (`Maestro_IOS_iPhone-16-Pro_18`, iOS
18.6), using the explicit Maestro `2.6.1` binary:

- Dark: `/tmp/patternly-capture-visual-shell-dark-2026-08-24-v3/`
- Light: `/tmp/patternly-capture-visual-shell-light-2026-08-24/`

The journey covers track selection, Home, Custom Practice setup, active
Algorithms session, exit sheet, partial summary, Progress, Settings,
Notifications, Data & privacy, and Appearance. The flow used the canonical
route selectors and assertions; no product source changed to make the flow
pass. Visual inspection of the current-head Light captures found no new
clipping or unavailable-state mismatch in the sampled core shell. These are
runtime evidence packs, not a Figma `MATCHED` decision: screenshots are
1206×2622 device captures while the referenced Figma frames use a 393×852
logical viewport, so normalized node-to-screen comparison is still required.
The remaining reachable-state matrix, `DESIGN_MISSING`/
`CANONICAL_CONFLICT` decisions, and Product Owner approval remain open.

## Addendum — Reachable 200% text contract

Commit `8b2dd0e` completes the source-level 200% text contract for visible
React Native text across the reachable Home, Progress, Practice, Settings,
Simulation, Exam, Review, shared-component, and rich-feedback owners. Existing
Figma stress references `882:14459`, `766:5732`, `766:5822`, and shared Button
`141:817` establish the contract; this slice applies it consistently through
the canonical owners with `maxFontSizeMultiplier={2}`. The current Progress
authority `842:9563` also uses the established-evidence section copy
`Recent activity`, which is now the source copy. No route, model, selector,
scoring, persistence, navigation command, visual token, or Figma-only metric
was added. The rich-feedback code-token spans keep the explicit cap; the only
remaining text node without visible copy is the empty ExamReview runtime marker.

The source audit found no visible render-owned `<Text>` without the cap across
the changed reachable surfaces. Verification on `8b2dd0e` passed recovery
inventory `287/116/565`, TypeScript, `574/574` tests, `git diff --check`,
content boundary, and runtime privacy boundary. This is source-level
convergence, not a `MATCHED` or 99% claim: current-head normalized Figma
comparison, full reachable-state capture, `DESIGN_MISSING`/
`CANONICAL_CONFLICT` owner decisions, and Product Owner approval remain open.
