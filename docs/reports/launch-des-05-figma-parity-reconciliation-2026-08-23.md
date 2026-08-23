# DES-005 — Figma parity reconciliation and next implementation packet

Date: 2026-08-23
Repository: `Patternly`
Workstream: full application refactor and 99% Figma parity across reachable paths
Current source SHA at packet creation: `65aeccd`
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
  `src/features/practice/practiceFlowModel.ts`, and shared primitives
  `src/components/Screen.tsx`, `src/components/ListRow.tsx`,
  `src/components/Card.tsx`, and `src/components/Button.tsx`.
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
| Shared design-system primitives | `partial` | `Screen`, `Button`, `Card`, `ListRow`, headers, navigation, and session shells are canonical and source-tested. Current slices still require runtime comparison across all states and themes. |
| Home, Progress, and Activity source slices | `partial` | Commits through `d7c6611` align documented source geometry and typography against live nodes. Fresh same-head pixel comparison is still missing for several states; Activity capture is blocked by the local simulator tooling. |
| PKG-04A Coding Free interaction truth | `done` | `buildPracticeModes` exposes exactly Learn Approach, Guided Practice, Custom Practice, and evidence-conditioned Weak Area Review; the canonical tests assert the mode list. Independent, Recognize, Contrast, and Simulation are excluded from the Free profile as required by `PO-059`/`PO-060`. |
| Current Practice Hub visual parity | `partial` | `bc09d63` applies the safe geometry facts from `55:993` while preserving the approved Free interaction contract. Its visible `Independent Practice` row and copy still do not match the canonical mode model, and fresh runtime pixel comparison remains blocked. |
| Current Practice Setup visual parity | `partial` | `65aeccd` applies the safe compact segmented-control, choice-row, header, sticky-footer, and spacing facts from `55:2172`. Its Focus areas and `Save settings` semantics are still not represented by the current canonical route/model and were not invented; fresh runtime pixel comparison remains blocked. |
| Figma authority and approval binding | `blocking` | The current channel is known, but it is not documented as Product Owner approval. The plan also contains stale channel references. A final 99% claim needs an explicit mapping of approved nodes/states to the current launch scope. |
| Runtime screenshot and pixel evidence | `blocking` | Existing captures prove selected previous slices only. Current Activity-route capture and several same-head state comparisons remain unverified because `maestro` is unavailable and CoreSimulatorService refused the simulator connection. |
| Account, authentication, Premium, content trust, and deletion UI | `unknown / needs evidence` | The canonical contract defines boundaries, but the current route graph does not provide matching owners for all Figma surfaces. Owner must decide whether those Figma surfaces are in this parity objective or outside the current launch route graph. |
| Goals, cadence, focus areas, and Progress effectiveness | `blocking` | The Figma frames expose values/actions that the current local model does not truthfully provide. Adding labels or synthetic metrics would violate the canonical contract. |

## Confirmed contradictions and stale assumptions

1. The active launch plan still names `76kzylrb` as the Figma authority. The
   current task supplies `ksxw21cw`; prior repository references also name
   `eon17bsz`, while the only explicit Product Owner approval found for the
   Free interaction subset is `wtk4hp8i`. These references need a single
   owner-bound mapping before final approval.

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

5. There are already source-level Practice Hub geometry differences that are
   safe to address without changing product truth: the current Figma Hub card
   uses a 16 px internal rhythm and a visible shadow; the source owner uses a
   12 px card gap and overrides the layered shadow opacity to zero. The current
   Figma mode rows use 14 px semibold titles, 11 px regular details with a
   2 px text gap, 32 px elevated icon tiles with an 8 px radius, and 72 px row
   geometry. The source's default `ListRow` details currently use the broader
   14/22 `small` style and 4 px copy gap. These are visual-owner corrections,
   not reasons to rename or add modes.

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

- Live Figma design context and screenshots: pass for `55:993` and `55:2172`.
- `npm run typecheck`: pass at current source SHA lineage.
- Focused Practice/model/visual-shell tests: 33/33 pass.
- Full `npm run qa:static`: pass on source commit `65aeccd`, with 559/559
  tests, TypeScript, content boundary, and runtime privacy boundary.
- Working tree: clean at the implementation boundary before this report update.
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

On current source SHA `d4d0cfc`, the live Figma node `55:993` was revalidated
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
281/113/552, 561/561 tests, content-boundary, and runtime-privacy-boundary
checks.

## Addendum — Button state-token decision boundary

Live Figma `141:817` was revalidated against the repository-owned `Button`
primitive. The shared component currently has one generic disabled treatment,
while the Figma authority defines distinct Primary, Secondary, Destructive,
and Ghost disabled/pressed states. A worker review confirmed that the
existing palette cannot represent the complete matrix without misusing
unrelated Light/Dark roles or introducing local color fallbacks.

This row remains `PARTIAL` with a design-system decision required; it is not
a code gap to patch opportunistically. The minimum owner-bound decision is a symmetric
Light/Dark button token group for primary-pressed surface, primary-disabled
border, ghost-pressed surface, and destructive foreground, plus an explicit
decision on whether runtime `loading` should inherit the Figma Disabled
appearance. No Button source change was made; the existing geometry,
accessibility, and loading behavior remain stable. The contrast of the live
Dark destructive-disabled foreground also requires owner/accessibility review
before implementation.
