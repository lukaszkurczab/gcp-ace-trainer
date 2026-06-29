# 17 — Commercial MVP Redesign and Multi-Track Plan

## Objective

Move Patternly from a personal GCP ACE trainer toward a commercial MVP by implementing the Focus Lab visual direction, adding the Algorithms track, and replacing GCP-only product assumptions with a shared multi-track training foundation.

## Decision Scope

This plan covers planning and implementation sequencing only. It does not implement application code.

Allowed decisions:

- identify the canonical product and architecture direction,
- classify current repo state against that direction,
- define the smallest coherent implementation sequence,
- prepare worker-ready tasks with acceptance criteria and verification.

Deferred decisions:

- paid plan details, subscriptions, account system, sync, backend, AI generation, notifications, and remote content management,
- app store launch assets,
- production analytics and telemetry.

## Evidence Reviewed

Repository evidence:

- `package.json`
- `App.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`
- `src/constants/routes.ts`
- `src/constants/storage.ts`
- `src/theme/tokens.ts`
- `src/types/question.ts`
- `src/types/attempt.ts`
- `src/types/settings.ts`
- `src/storage/localStorage.ts`
- `src/features/home/HomeScreen.tsx`
- `src/features/practice/PracticeSetupScreen.tsx`
- `src/features/practice/PracticeSessionScreen.tsx`
- `src/features/exam/examService.ts`
- `src/features/analytics/analyticsService.ts`
- `tests/analytics.test.ts`
- `tests/examGeneration.test.ts`

Documentation evidence:

- `docs/README.md`
- `docs/00-overview.md`
- `docs/01-product-definition.md`
- `docs/02-architecture.md`
- `docs/03-navigation-and-flows.md`
- `docs/04-data-model.md`
- `docs/05-design-system.md`
- `docs/06-branding-and-style-direction.md`
- `docs/10-roadmap.md`
- `docs/11-implementation-guidelines.md`
- `docs/12-testing-strategy.md`
- `docs/13-risk-register.md`
- `docs/16-leetcode-like-learning-system.md`
- `docs/designs/technical_workspace_1/DESIGN.md`
- `docs/designs/technical_workspace_2/DESIGN.md`
- screenshots in `docs/designs/*/screen.png`

Design evidence reviewed visually:

- `docs/designs/select_track/screen.png`
- `docs/designs/home_choice_enabled/screen.png`
- `docs/designs/practice_hub_unified/screen.png`
- `docs/designs/cloud_question_unified_focus_lab_style/screen.png`
- `docs/designs/algorithm_drill_unified/screen.png`
- `docs/designs/progress_overview_refined_hierarchy/screen.png`
- `docs/designs/session_summary_refined_analytics_actions/screen.png`
- `docs/designs/settings_refined_focus_lab_style/screen.png`

Verification attempted:

- `npm run typecheck`
- `npm test`
- `npm run validate:questions`

Planning-time result: verification was initially blocked because `node_modules` was absent and local binaries `tsc` / `tsx` were not available.

Implementation update on 2026-06-29: dependencies were installed during implementation. Current verification for the track foundation and main shell rebuild passes:

- `npm run typecheck`
- `npm test`
- `npm run validate:questions`

## Confirmed Facts

1. The app package is still named `gcp-ace-trainer` in `package.json`.
2. Current runtime stack is Expo / React Native / TypeScript with React Navigation and AsyncStorage.
3. Current navigation is a single native stack centered on `Home`, `Exam`, `PracticeSetup`, `PracticeSession`, `Analytics`, and `Settings`.
4. Current shared route params use `ExamDomain` and question-count parameters directly.
5. Current domain model is GCP/question/exam-first: `Question`, `ExamDomain`, `AttemptMode = "exam" | "practice"`, `ActiveExamSession`, `QuestionReviewState`.
6. Current storage keys are namespaced as `gcpAceTrainer.*`.
7. Current analytics aggregate `domainPerformance`, `weakestTags`, confidence, and mistake reasons for exam/practice question records only.
8. Current tests protect existing GCP/exam behavior, not the multi-track contracts described in docs.
9. Newer documentation defines Patternly as a multi-track technical training app with at least `cloud-certification` and `algorithms`.
10. Newer documentation defines the canonical model as `app -> track -> session mode -> training item -> attempt -> feedback/result -> progress`.
11. Newer navigation docs recommend bottom tabs: `Home`, `Practice`, `Progress`, `Settings`, with `Exam Simulation` nested under the certification track instead of a top-level app center.
12. Newer branding docs identify Focus Lab and dark-first styling as the current product direction.
13. The design screenshots align with dark-first Focus Lab: bottom tabs, track selection, active track context, a single primary CTA, sparse cards, neon accents used for status/CTA, and progressive disclosure.

## Assumptions

1. The current commercial MVP target is Patternly.
2. The current repo at `/Users/lukaszkurczab/Documents/New project` resolves to `/Users/lukaszkurczab/Desktop/Projects/GCP` and is the intended app repo.
3. Existing GCP functionality should be preserved as the first `cloud-certification` track, but not remain the app-wide architecture.
4. Algorithms MVP should be strategy-first and mobile-friendly, not a full coding editor or online judge.
5. The dark Focus Lab direction in `technical_workspace_2` and the `*_unified` / `*_refined_*` screenshots supersede the older light-first wording in `docs/05-design-system.md` and `docs/adr/ADR-004-light-first-dark-ready-ui.md`.

## Canonical Path

Canonical product path:

```txt
Patternly
  -> track
  -> session mode
  -> training item
  -> attempt
  -> feedback/result
  -> review/progress
```

Canonical MVP tracks:

- `cloud-certification`: existing GCP ACE-style question content, practice, exam simulation, review, domain progress.
- `algorithms`: pattern/strategy/complexity training, no copied LeetCode content, no full editor in MVP.

Canonical navigation target:

```txt
Root
  -> onboarding / track selection
  -> main tabs
       -> Home
       -> Practice
       -> Progress
       -> Settings
  -> session runner
  -> session summary
  -> review / detail screens
```

Canonical design target:

- dark-first Focus Lab,
- minimal technical workspace,
- one primary action per screen,
- track-level accents, not separate themes,
- progressive disclosure for progress and analytics,
- explicit legal safety for Google and LeetCode references.

## Engineering Principles for Implementation

Implementation must treat Patternly as a product codebase, not a sequence of one-off screens. The commercial MVP goal requires shared contracts, shared components, and clear ownership boundaries from the first implementation slice.

Required principles:

- Prefer common components over screen-local UI duplication.
- Keep shared logic DRY, especially for session setup, item rendering, choice selection, feedback, progress, review queue, empty/loading/error states, and settings rows.
- Build generic elements around product concepts: `Track`, `SessionMode`, `TrainingItem`, `TrainingAttempt`, `FeedbackPanel`, `ProgressInsight`, `ReviewQueueItem`.
- Keep track-specific behavior inside track modules, not in shared components.
- Use design tokens and common layout wrappers instead of screen-local color, spacing, typography, and shadow literals.
- Add abstractions only when they remove real duplication or clarify ownership; do not introduce a heavy plugin framework.
- Prefer explicit unsupported/degraded states over hidden fallbacks.
- Update documentation during implementation whenever a contract, flow, storage schema, design token, component ownership rule, or product decision changes.
- If implementation reveals a problem not explained by documentation, stop and ask for an owner decision before continuing.
- If different documents, designs, code paths, or tests disagree on the intended behavior or architecture, stop and ask for an owner decision before continuing.

Required shared component / generic element targets:

```txt
src/components/base/
  Screen
  AppText
  Button
  IconButton
  Card
  ListRow
  Badge
  Chip
  Divider
  ProgressBar
  EmptyState
  ErrorState
  LoadingState

src/components/training/
  TrackCard
  SessionModeCard
  TrainingItemCard
  ChoiceOption
  FeedbackPanel
  ExplanationBlock
  SessionProgress
  SessionSummaryCard

src/components/progress/
  ProgressInsightCard
  ReviewQueueCard
  TaxonomyPerformanceRow

src/components/settings/
  SettingsGroup
  SettingsRow
  SettingsToggleRow
  DestructiveActionRow
```

Naming rules:

- Shared components must use track-neutral names.
- GCP/cloud-specific components belong under a cloud track/module.
- Algorithms-specific components belong under an algorithms track/module.
- No shared component should be named around `Exam`, `Question`, `Domain`, `GCP`, or `LeetCode` unless it is intentionally track-specific.

Documentation update rule:

- Every implementation report must state whether docs were updated.
- If docs were not updated, the report must explicitly say why no contract, flow, or design decision changed.
- Any new common component must be documented in the design system or implementation guidelines before the task is considered done.

## Competing Legacy Paths

| Area             | Current competing path                                     | Risk                                                                   |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Package identity | `gcp-ace-trainer`                                          | Product identity remains tied to one personal exam trainer.            |
| Storage          | `gcpAceTrainer.*` keys                                     | Migration risk and app-wide GCP coupling.                              |
| Types            | `Question`, `ExamDomain`, `AttemptSummary` as shared roots | Algorithms must fake question/exam data.                               |
| Navigation       | `Exam` top-level route                                     | Product mental model remains certification-first.                      |
| Home             | exam readiness and next actions list                       | Does not match track-first commercial UX.                              |
| Analytics        | exam/domain/tag-specific                                   | Cannot represent algorithm patterns, complexity, or strategy mistakes. |
| Tests            | GCP exam tests only                                        | Multi-track regressions will not be caught.                            |
| Design system    | light-first docs plus dark-first designs                   | Implementation can drift without a resolved token decision.            |
| Components       | screen-local cards, rows, glyphs, and feedback blocks      | UI duplication will make the commercial redesign inconsistent and slow. |

## Approach Check

The requested end state is valid, but implementing the new styling first as screen-by-screen paint would be the wrong first implementation step. The current code still has app-wide GCP/exam assumptions in navigation, types, storage, analytics, and tests. A visual restyle on top of that would make the app look like a commercial product while preserving a personal GCP trainer architecture.

Better sequence:

1. Stabilize the canonical multi-track contracts.
2. Introduce track registry and active-track storage.
3. Rebuild app shell/navigation to match the Focus Lab screens.
4. Rehome existing GCP functionality as `cloud-certification`.
5. Add Algorithms content and session logic.
6. Rework progress/review/settings to use track-aware data.
7. Add commercial MVP trust surfaces without backend scope creep.

## Status Table

| Item                               | Status   | Evidence                                     | Notes                                                                                           |
| ---------------------------------- | -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Patternly product definition       | partial  | `docs/00`, `docs/01`, `docs/06`              | Docs are strong, README/package identity still conflict.                                        |
| Focus Lab design direction         | partial  | `docs/designs/*`, `technical_workspace_2`    | Screens exist, theme tokens still light-first default.                                          |
| Shared app shell                   | partial  | `RootNavigator.tsx`                          | Single stack exists, no bottom tabs or onboarding/track selection.                              |
| Track registry                     | planned  | no `src/domain/tracks` or `src/tracks`       | Required before adding Algorithms safely.                                                       |
| Active track selection             | planned  | no active track model/storage                | Required for Home/Practice/Progress context.                                                    |
| Generic training item model        | planned  | current `Question` root                      | Must precede Algorithms track.                                                                  |
| Existing cloud certification track | partial  | current question bank, exam/practice screens | Functionality exists but is not isolated as a track.                                            |
| Algorithms track                   | planned  | docs/designs only                            | No content pack, scoring, or session flow found.                                                |
| Review queue                       | partial  | `QuestionReviewState`, mistakes review       | Tied to question IDs, not track-aware.                                                          |
| Progress / analytics               | partial  | `analyticsService.ts`                        | Exam/domain-specific; needs track-aware model.                                                  |
| Local storage adapter              | partial  | `localStorage.ts`                            | Adapter exists, but keys and schemas are GCP-specific.                                          |
| Testing                            | partial  | node tests exist                             | Verification blocked locally by missing dependencies; tests do not cover multi-track contracts. |
| Legal/trust copy                   | partial  | docs define disclaimers                      | Must appear in app before commercial MVP.                                                       |
| Backend/accounts/subscriptions     | deferred | docs exclude for MVP                         | Safe to defer for local-first MVP.                                                              |

## Implementation Status Update — 2026-06-29

This section supersedes the planning-time status for code already changed during the commercial MVP rebuild.

Implemented:

- Shared track registry and active track storage exist under `src/domain/tracks` and `src/storage/localStorage.ts`.
- `cloud-certification` is the active default track.
- `algorithms` is registered as an explicit draft track with no fake fallback session.
- The main app shell is now `HomeScreen` with track-aware `Home`, `Practice`, `Progress`, and `Settings` tabs.
- `RootNavigator` no longer exposes `SelectTrack`, `Analytics`, or `Settings` as standalone top-level routes.
- Track switching is inline in the main shell through reusable `TrackCard` components.
- Progress and settings surfaces have been rehomed into shell tabs.
- Standalone stale UI artifacts were removed:
  - `src/features/tracks/SelectTrackScreen.tsx`
  - `src/features/analytics/AnalyticsScreen.tsx`
  - `src/features/analytics/AnalyticsCharts.tsx`
  - `src/features/settings/SettingsScreen.tsx`
- Chart-only dependencies were removed after their only consumer was deleted:
  - `react-native-chart-kit`
  - `react-native-svg`
- Shared shell/common components were added:
  - `AppShellHeader`
  - `BottomTabBar`
  - `SettingsGroup`
  - `TrackCard` with stable `testID` / accessibility labels for Maestro.

Still not implemented:

- Dark-first Focus Lab token/theme migration.
- Track-aware attempt/session storage migration.
- Algorithms content, scoring, and session runner.
- Generic `TrainingItem` / `TrainingAttempt` model.
- Track-aware review queue and session summary actions.

Current architectural rule:

- Do not reintroduce standalone `Analytics`, `Settings`, or `SelectTrack` routes unless a later product decision changes the shell architecture. New settings/progress/track-selection work should extend the shell tabs and shared components.

## Gaps, Bugs, Contradictions, and Blockers

### Blocking

- Current repo has uncommitted changes outside this plan. Implementation workers must not overwrite them.

### Product / Architecture Gaps

- Shared domain model is not implemented.
- Track registry is not implemented.
- Algorithms content pack is not implemented.
- Existing GCP functionality is not isolated behind a `cloud-certification` track boundary.
- Storage schemas cannot safely represent multiple tracks yet.
- Review/progress/analytics do not support algorithm-specific concepts such as pattern, strategy, complexity, or mistake type.
- Common component ownership is not defined in code yet; current screens can duplicate layout, cards, rows, feedback blocks, and glyph logic.

### UX / Design Gaps

- Bottom-tab shell is implemented in `HomeScreen`, but not yet visually migrated to the dark-first Focus Lab direction.
- Always-available track switching exists in the shell Home tab; first-run onboarding is still not implemented.
- Current Home is now track-first, but still needs the final Focus Lab visual pass.
- Current session screens are question/exam-specific and visually light-first.
- Current Settings includes local training settings, but not a commercial MVP trust/settings structure matching designs.
- Existing UI implementation is not yet constrained by a documented common component inventory.

### Documentation Contradictions

- `docs/README.md` still says the context is a private GCP ACE training tool.
- `docs/05-design-system.md` says light-first/dark-ready, while newer overview/branding/design screenshots point to dark-first Focus Lab.
- `docs/adr/ADR-004-light-first-dark-ready-ui.md` may be stale if dark-first is now the launch direction.

### Commercial MVP Risks

- Adding subscriptions/account UI now would violate the local-first MVP scope and create trust debt.
- Adding Algorithms as hardcoded quiz questions would undermine the product promise and make the second track feel bolted on.
- Reusing LeetCode problem statements or official exam-like materials would create legal risk.

## Completed Work Removed From Active Plan

None. This pass did not find multi-track implementation work that can be marked `done` and removed from the active plan.

Existing GCP exam/practice functionality should be treated as `partial` foundation for the Cloud Certification track, not as completed Patternly MVP work.

## Remaining Implementation-Ready Tasks

### Task 1 — Resolve Product and Design Source of Truth

Goal:

- Make the repo documents consistent enough that implementation workers do not choose between stale light-first/GCP-only and current dark-first/multi-track directions.

Scope:

- Update or supersede `docs/README.md`, `docs/05-design-system.md`, and `docs/adr/ADR-004-light-first-dark-ready-ui.md`.
- Declare dark-first Focus Lab as launch direction if confirmed by owner intent.
- Mark GCP ACE as the first Cloud Certification track, not the whole product.

Non-goals:

- No application code changes.
- No new feature scope.

Inputs:

- `docs/00-overview.md`
- `docs/01-product-definition.md`
- `docs/05-design-system.md`
- `docs/06-branding-and-style-direction.md`
- `docs/designs/technical_workspace_2/DESIGN.md`
- `docs/designs/*_unified*/screen.png`

Acceptance criteria:

- README no longer frames the app as only a private GCP ACE tool.
- Design system document names the canonical launch theme and explains any light-mode status.
- ADR status is updated or a new ADR supersedes it.
- Design system or implementation guidelines document the required common component layers and DRY rules.
- Documentation states the stop condition for undocumented problems and cross-document/code/design contradictions.
- A worker can identify the canonical design direction without interpreting contradictory docs.

Verification:

- Documentation diff review.
- Search for stale claims: `rg "private|light-first|GCP ACE trainer|single GCP|gcp-ace-trainer" docs`.

Required evidence:

- Updated docs and search output.

Risks:

- Owner may still want light mode as default. If so, stop and get explicit decision before UI implementation.

Report target:

- New execution report under `docs/reports/` or a short update in this plan.

Stop conditions:

- Conflicting owner decision about dark-first vs light-first.

### Task 2 — Introduce Shared Track and Training Contracts

Goal:

- Add minimal neutral domain contracts before any Algorithms implementation or broad UI restyle.

Scope:

- Add `Track`, `SessionMode`, `TrainingItem`, `TrainingAttempt`, `TrainingSession`, `SessionResult`, `TaxonomyRef`, and `UserProgress` types.
- Add lightweight `trackRegistry`.
- Represent current GCP content as a `cloud-certification` track definition without moving all screens yet.
- Add an `algorithms` track stub with metadata only.

Non-goals:

- No full session engine rewrite.
- No Algorithms content yet.
- No storage migration yet beyond type-safe placeholders.

Inputs:

- `docs/02-architecture.md`
- `docs/04-data-model.md`
- `docs/11-implementation-guidelines.md`
- current `src/types/*`
- current `src/features/questions/*`

Acceptance criteria:

- Shared types exist outside GCP-specific feature folders.
- `trackRegistry` lists `cloud-certification` and `algorithms`.
- Cloud track can expose current question bank metadata.
- Algorithms track can appear in selection UI as unavailable/draft or enabled with no session start.
- Shared domain contracts identify which generic UI components need to consume them.
- Any new generic contract is reflected in docs before the task is marked complete.
- Existing tests still pass after dependencies are available.

Verification:

- `npm run typecheck`
- focused unit tests for `trackRegistry`
- `npm test`

Required evidence:

- Typecheck output.
- New track contract tests.

Risks:

- Too much abstraction. Keep registry static and explicit.

Report target:

- Implementation report with files changed, contract summary, and documentation updates performed.

Stop conditions:

- Existing GCP exam/practice flow cannot compile after contracts are introduced.
- A contract decision is needed but not covered by `docs/02-architecture.md`, `docs/04-data-model.md`, or `docs/11-implementation-guidelines.md`.

### Task 3 — Add Active Track Storage and Migration Boundary

Goal:

- Store active track and prepare for multi-track local state without silently corrupting existing GCP data.

Scope:

- Add Patternly namespaced keys for active track and future track-aware records.
- Keep legacy `gcpAceTrainer.*` read support only where needed.
- Add explicit migration or bridging logic from current GCP-only state to `cloud-certification`.
- Add storage tests for missing, corrupted, and legacy data.

Non-goals:

- No backend sync.
- No account model.
- No destructive storage reset.

Inputs:

- `src/constants/storage.ts`
- `src/storage/localStorage.ts`
- `src/types/attempt.ts`
- `docs/08-storage-and-offline.md`
- `docs/12-testing-strategy.md`

Acceptance criteria:

- Active track persists locally.
- Missing active track defaults safely to `cloud-certification`.
- Legacy data remains readable.
- Corrupted active-track state falls back explicitly and safely.
- Storage keys no longer expand the `gcpAceTrainer.*` namespace for new data.

Verification:

- storage unit tests,
- `npm test`,
- `npm run typecheck`.

Required evidence:

- Test output and migration behavior notes.

Risks:

- Hidden compatibility fallback. Any legacy read must be named and covered by tests.

Report target:

- Storage migration report.

Stop conditions:

- Migration design would require deleting or rewriting existing user data without confirmation.

### Task 4 — Implement Focus Lab App Shell and Navigation

Goal:

- Replace the exam-centered single-stack UX with the commercial MVP shell shown in designs.

Scope:

- Add bottom tabs: `Home`, `Practice`, `Progress`, `Settings`.
- Add/select track flow.
- Add track switcher entry point.
- Move exam simulation under Cloud Certification practice flow.
- Apply dark-first base tokens and screen wrappers.
- Create or refactor common base/training components needed by the shell: `Screen`, `AppText`, `Button`, `IconButton`, `Card`, `ListRow`, `Badge`, `TrackCard`, `SessionModeCard`, and `ProgressBar`.
- Remove duplicated screen-local card/row/glyph styles where a common component can own the behavior.
- Keep current GCP flows reachable during transition.

Non-goals:

- No Algorithms session logic.
- No subscription/account functionality.
- No final analytics redesign.

Inputs:

- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`
- `src/constants/routes.ts`
- `src/theme/tokens.ts`
- `src/components/*`
- `docs/designs/select_track/screen.png`
- `docs/designs/home_choice_enabled/screen.png`
- `docs/designs/practice_hub_unified/screen.png`

Acceptance criteria:

- App opens into a track-aware Home or first-run track selection.
- Bottom tabs match the target structure.
- Cloud Certification current practice/exam flows remain accessible.
- No top-level `Exam` affordance dominates Home.
- Visual tokens are centralized; screen-local color literals are minimized.
- Reusable UI primitives live in common component folders and are reused by at least Home, Practice, Progress, and Settings where applicable.
- Shared components are track-neutral and do not include GCP/exam assumptions.
- Common component usage and ownership are documented.
- UI does not imply Google affiliation.

Verification:

- `npm run typecheck`
- manual simulator smoke test for tab navigation and existing GCP flow
- screenshot evidence for Home, Select Track, Practice tab, Settings

Required evidence:

- Typecheck output and screenshot paths.

Risks:

- Large navigation churn can break route params. Keep compatibility adapters until route users are migrated.

Report target:

- UI shell implementation report with component inventory and documentation updates.

Stop conditions:

- Existing route params become ambiguous between cloud and algorithm flows.
- A design screenshot and current design-system docs disagree on component behavior, hierarchy, theme, or spacing.
- A needed common component API is unclear or would force track-specific assumptions into shared code.

### Task 5 — Rehome Existing GCP Flow as Cloud Certification Track

Goal:

- Keep current useful GCP practice/exam value while moving it behind track-aware contracts.

Scope:

- Rename user-facing labels from exam-app language to Cloud Certification track language where appropriate.
- Keep `Exam Simulation` as a Cloud mode.
- Move GCP-specific scoring/domain helpers into cloud-specific modules when feasible.
- Make review and summary records include `trackId`.
- Reuse shared `TrainingItemCard`, `ChoiceOption`, `FeedbackPanel`, `ExplanationBlock`, and `SessionSummaryCard` instead of adding new cloud-only equivalents unless the cloud behavior is genuinely track-specific.
- Add track-aware tests around existing GCP scoring and practice.

Non-goals:

- No major visual redesign beyond already-established shell tokens.
- No new GCP content.

Inputs:

- `src/features/exam/*`
- `src/features/practice/*`
- `src/features/review/*`
- `src/features/questions/*`
- `src/utils/domain.ts`
- `data/question-bank/ace-foundation-320.json`

Acceptance criteria:

- Existing GCP practice and exam behaviors still work.
- New records include or can derive `trackId = "cloud-certification"`.
- GCP-specific names are not used in shared contracts.
- Exam simulation appears as one mode inside Cloud Certification.
- Cloud-specific UI uses common training components where the interaction pattern is shared.
- Any cloud-only component is documented as track-specific and does not leak into shared folders.

Verification:

- existing exam/practice tests,
- new track-aware tests,
- manual smoke test for start practice, submit answer, finish/review.

Required evidence:

- Test output and route smoke notes.

Risks:

- Renaming too aggressively can cause avoidable breakage. Move boundaries first, then rename internals incrementally.

Report target:

- Cloud track migration report with shared-vs-track-specific component decisions.

Stop conditions:

- Current GCP attempt history cannot be read after migration.
- Cloud requirements force a change to a shared component contract that is not documented.

### Task 6 — Add Algorithms MVP Content and Session Logic

Goal:

- Implement the new commercial-value path: Algorithms strategy-first training.

Scope:

- Add local Algorithms content pack with original items.
- Add item types for `pattern_identification`, `strategy_choice`, and `complexity_analysis`.
- Add scoring/feedback functions for those item types.
- Add Pattern Drill flow using shared session contracts.
- Add basic session summary.
- Reuse shared `TrainingItemCard`, `ChoiceOption`, `FeedbackPanel`, `ExplanationBlock`, `SessionProgress`, and `SessionSummaryCard`.
- Add algorithms-specific components only for genuinely unique presentations such as pseudocode ordering, complexity comparison, or trace/step ordering.

Non-goals:

- No full coding editor.
- No online judge.
- No copied LeetCode problem text or editorials.
- No AI generation.

Inputs:

- `docs/16-leetcode-like-learning-system.md`
- `docs/04-data-model.md`
- `docs/07-content-guidelines.md`
- `docs/designs/algorithm_drill_unified/screen.png`
- `docs/designs/complexity_summary/screen.png`

Acceptance criteria:

- User can select Algorithms track.
- User can start a Pattern Drill session.
- User can answer at least one algorithm item type.
- Feedback explains why the pattern/strategy/complexity answer fits.
- Attempts are stored track-aware.
- Review/progress receives enough metadata for weak patterns later.
- Content is original and includes taxonomy refs, explanation, and common mistakes.
- Algorithms UI does not duplicate cloud question UI; shared selection, feedback, and summary components are reused where applicable.
- Any new algorithm-specific component is documented with its non-goal and ownership boundary.

Verification:

- content validation tests,
- scoring tests for algorithms item types,
- session flow unit/integration test,
- manual smoke test for Algorithms drill.

Required evidence:

- Test output and content validation output.

Risks:

- Weak content quality. Start with fewer high-quality items rather than a broad shallow pack.

Report target:

- Algorithms MVP report with content, scoring evidence, component reuse decisions, and documentation updates.

Stop conditions:

- Content source cannot be confirmed as original.
- Algorithms item behavior is not covered by the current data model, testing strategy, or content guidelines.

### Task 7 — Rebuild Progress, Review, and Summary Around Track-Aware Insight

Goal:

- Convert personal analytics into commercial MVP value: actionable weak areas and review queue per track.

Scope:

- Add shared review queue model.
- Add track-aware progress aggregation.
- Convert Analytics into Progress tab.
- Support Cloud domain progress and Algorithms pattern/complexity progress.
- Implement session summary actions: review weak areas, start new session.
- Reuse shared progress components: `ProgressInsightCard`, `ReviewQueueCard`, `TaxonomyPerformanceRow`, and `SessionSummaryCard`.

Non-goals:

- No advanced charts beyond MVP.
- No cloud sync or account history.
- No predictive readiness claims.

Inputs:

- `src/features/analytics/analyticsService.ts`
- `src/features/analytics/AnalyticsScreen.tsx`
- `src/features/review/*`
- `docs/designs/progress_overview_refined_hierarchy/screen.png`
- `docs/designs/session_summary_refined_analytics_actions/screen.png`
- `docs/designs/topic_performance_detail_gcp_services/screen.png`

Acceptance criteria:

- Progress screen shows review queue and weak areas.
- Progress separates or filters by track.
- Cloud metrics do not leak into Algorithms labels.
- Algorithms metrics include patterns/strategy/complexity where data exists.
- Session summary recommends the next track-aware action.
- Progress/review UI uses generic components that accept taxonomy/progress data instead of cloud-only domain props.
- Shared progress component contracts are documented with examples for Cloud and Algorithms.

Verification:

- progress aggregation tests,
- review queue tests,
- manual screenshot evidence for Progress and Session Summary.

Required evidence:

- Test output and screenshots.

Risks:

- Over-dashboarding. Keep first screen focused on one action and drill-down details.

Report target:

- Progress/review implementation report with aggregation contracts and component documentation updates.

Stop conditions:

- Data model cannot distinguish attempts by track.
- Progress requirements expose a contradiction between analytics docs, data model, and current implementation.

### Task 8 — Commercial MVP Trust and Settings Pass

Goal:

- Raise the product from personal tool to MVP by making boundaries, privacy, data control, and legal safety explicit.

Scope:

- Settings screen aligned with Focus Lab design.
- Local data export/reset controls if feasible.
- Legal disclaimers for Google and LeetCode-style content.
- About / help copy that clarifies local-first, independent, no official affiliation.
- Reuse settings components: `SettingsGroup`, `SettingsRow`, `SettingsToggleRow`, and `DestructiveActionRow`.
- Remove or defer account/subscription rows unless a real implementation exists.

Non-goals:

- No fake account profile.
- No fake subscription state.
- No sign-out without auth.
- No notification toggles unless notifications actually exist.

Inputs:

- `src/features/settings/SettingsScreen.tsx`
- `docs/06-branding-and-style-direction.md`
- `docs/09-security-and-privacy.md`
- `docs/designs/settings_refined_focus_lab_style/screen.png`

Acceptance criteria:

- Settings exposes only implemented or clearly disabled capabilities.
- Legal disclaimers are visible enough for certification/platform safety.
- Reset/export behavior is explicit and confirmed.
- No UI implies cloud account, subscription, or sync if not implemented.
- Settings rows and groups are shared components, not repeated screen-local row implementations.
- Any deferred/future commercial affordance is documented and not shown as an active capability.

Verification:

- `npm run typecheck`
- manual settings smoke test,
- copy/legal review against docs.

Required evidence:

- Screenshot and copy review notes.

Risks:

- The provided Settings design contains account/subscription affordances that are not MVP-safe without implementation. Treat them as future-state unless owner explicitly approves a mocked commercial shell.

Report target:

- Settings/trust pass report with documentation updates for privacy, legal, and settings capabilities.

Stop conditions:

- Owner requires subscription/account UI before backend/auth exists.
- A settings capability appears in design but is not implemented or documented as future-state.

## Parallelization Guidance

Safe to parallelize after Task 1:

- Task 2 contract design and Task 4 visual token/component exploration can run in parallel only if Task 4 does not hardcode track behavior.
- Task 8 copy/trust pass can draft copy in parallel, but implementation should wait until navigation/settings ownership is clear.

Do not parallelize:

- Task 6 Algorithms implementation before Task 2 contracts and Task 3 storage boundary.
- Task 7 progress/review before attempts include track-aware metadata.
- Any screen-wide visual rewrite that bypasses the shared theme/components.
- Any implementation task that discovers undocumented behavior, unclear ownership, or contradictory docs/designs/code/tests.

## First Next Task

Task 1 is first.

Reason:

- The repo contains contradictory source-of-truth documents: personal GCP trainer vs Patternly multi-track, light-first vs dark-first. Implementation can proceed only after the canonical direction is written down clearly enough that workers do not make opposite design and architecture choices.

Once Task 1 is done, Task 2 should start immediately. The track contracts are the architectural gate for both the new style shell and the Algorithms path.

## Worker Packet for First Next Task

Objective:

- Reconcile documentation so Patternly commercial MVP, dark-first Focus Lab, and multi-track architecture are the explicit source of truth.

Scope:

- Inspect `docs/README.md`, `docs/00-overview.md`, `docs/01-product-definition.md`, `docs/05-design-system.md`, `docs/06-branding-and-style-direction.md`, `docs/10-roadmap.md`, and `docs/adr/ADR-004-light-first-dark-ready-ui.md`.
- Patch only documentation.

Constraints:

- Do not modify application code.
- Do not remove useful historical context; supersede stale decisions explicitly.
- Do not introduce backend/account/subscription scope.
- Keep GCP as the first Cloud Certification track.
- Add common component and DRY requirements to the canonical implementation docs.
- Add the rule that workers must stop and ask if documentation is missing or contradictory.

Expected output:

- Updated README or pointer to current source of truth.
- Updated design-system direction or new ADR superseding light-first.
- Updated implementation/design docs covering common components, generic elements, DRY, documentation updates during implementation, and contradiction stop conditions.
- Short report listing stale assumptions retired.

Verification:

- Run `rg "private tool|GCP ACE trainer|light-first|dark-ready|official exam simulator|LeetCode replacement" docs`.
- Confirm remaining matches are historical, legal-safety, or explicitly superseded.

Stop conditions:

- If owner wants the launch app to remain light-first, stop and request an explicit decision before patching design docs.

## Verification Notes

Commands attempted:

```txt
npm run typecheck
npm test
npm run validate:questions
```

Current result:

- `npm run typecheck` fails because `tsc` is not found.
- `npm test` fails because `tsx` is not found.
- `npm run validate:questions` fails because `tsx` is not found.

Likely cause:

- `node_modules` is not installed in the current workspace.

Required before implementation verification:

```txt
npm install
npm run typecheck
npm test
npm run validate:questions
```

## Unverified Areas and Remaining Risks

- Current app runtime was not launched in Expo during this planning pass.
- Screenshots were reviewed as static assets, not compared against current rendered app output.
- Uncommitted code changes exist before this plan and must be preserved.
- Documentation files appear untracked in git; implementation workers should confirm the intended branch/worktree state before editing.
- Current design includes future-looking account/subscription rows; these should not be implemented as fake commercial affordances in a local-first MVP.
- The new Algorithms path depends on original content quality. A small high-quality pack is safer than a broad shallow pack.
