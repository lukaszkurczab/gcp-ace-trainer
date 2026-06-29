# Patternly Product Audit and Execution Plan

Audit date: 2026-06-29  
Repository root observed: `/Users/lukaszkurczab/Desktop/Projects/GCP`  
Status: planning artifact created after read-only audit; implementation notes below reflect the first Phase 2 cleanup pass.

Implementation note, 2026-06-29: the first Phase 2 pass split the Home shell into tab components, removed the hardcoded `Readiness 72%` UI, deleted selected unreachable legacy screens, made storage parse/read/write failures observable, moved active writes to the Patternly v1 namespace, and switched the runtime shell/components to the dark-first token path. Treat older audit tables as historical evidence where they explicitly reference pre-cleanup screenshots or removed code.

## Executive Summary

Patternly currently exists as an Expo / React Native / TypeScript mobile app with a working Cloud Certification question bank, GCP-shaped exam/practice/review flows, a recent track registry foundation, and a shell-style `Home` screen with tabs for Home, Practice, Progress, and Settings.

Implementation maturity is `partial`. The app has useful Cloud Certification functionality and a validated 360-question seed bank, but it is not yet production-ready Patternly. The canonical product direction in `docs/00-16` is a multi-track technical training workspace, while implementation still centers `Question`, `ExamDomain`, `ExamScreen`, `gcpAceTrainer.*` storage keys, correctness-only scoring, and Cloud-specific analytics.

Main blockers:

- No canonical shared `TrainingItem`, `TrainingSession`, `TrainingAttempt`, `ReviewQueueItem`, or `UserProgress` implementation.
- Algorithms track is registered but intentionally draft; no content, scoring, session runner, progress, or review loop.
- Shell has been split out of the former large `HomeScreen`, but the current Home/Practice/Progress/Settings implementation is still transitional and not yet backed by canonical shared session/progress contracts.
- Runtime UI now uses the dark-first token path, but full per-screen layout alignment to `docs/designs/*` is still a separate implementation pass.
- Cloud progress no longer shows hardcoded readiness precision; remaining progress work is to replace coarse Cloud analytics with concrete track-aware diagnostics.
- Storage no longer silently swallows parse/read/write failures and active writes use Patternly v1 keys, but the data model remains question-shaped.
- No CI config, no EAS config, no release checklist, and limited E2E coverage.
- Documentation conflicts: newer product docs say multi-track/dark-first; `docs/README.md` and ADR-004 still describe older GCP/light-first direction.

Planning stance: do not add product features on top of the current GCP-shaped architecture. First define and implement the canonical multi-track domain/storage/session foundation, then migrate Cloud flows into it, then enable Algorithms as a real track.

## Repository Map

| Area | Evidence | Responsibility | Status |
|---|---|---|---|
| App entry | `App.tsx`, `app.json` | Navigation container, status bar, Expo config | Partial; app name Patternly but slug/bundle still `gcp-ace-trainer`, light UI |
| Navigation | `src/navigation/RootNavigator.tsx`, `src/constants/routes.ts` | Native stack routes | Partial; root still has `Exam`, `PracticeSetup`, `MistakesReview`, etc. as top-level stack routes |
| Shell/screens | `src/features/home/HomeScreen.tsx`, `src/features/home/tabs/*` | Home/Practice/Progress/Settings shell | Transitional; split into tabs, still needs canonical session/progress contracts |
| Cloud practice | `src/features/practice/*` | Domain practice, immediate feedback | Working Cloud-specific path; not canonical shared session runner |
| Cloud exam | `src/features/exam/*` | Exam generation, timed session, scoring, result/review | Working Cloud-specific path; should become track-specific module |
| Review | `src/features/review/*` | Mistake review and answer review | Partial; question-based, no due queue/priority/spaced review |
| Analytics/progress | `src/features/analytics/analyticsService.ts` | Domain/tag/confidence summaries | Cloud-shaped; no track-aware progress model |
| Track registry | `src/domain/tracks/*` | `cloud-certification`, `algorithms` definitions | Partial canonical seed; not yet session/content/scoring contract |
| Types | `src/types/question.ts`, `src/types/attempt.ts` | GCP question and attempt models | Legacy/shared leakage; should move under certification track or be adapted |
| Storage | `src/storage/localStorage.ts`, `src/constants/storage.ts`, `src/storage/storageCodec.ts` | AsyncStorage helpers | Partial; Patternly v1 active keys and observable storage errors, still not repository-style |
| Theme/components | `src/theme/*`, `src/components/*` | Tokens and shared UI | Partial; runtime dark-first pass complete, full design-layout pass still pending |
| Content | `data/question-bank/ace-foundation-320.json` | 360 Cloud seed questions | Canonical Cloud seed for now; not multi-track content pack format |
| Tests | `tests/*.test.ts` | Node tests for scoring, registry, validation, analytics | Passing; too Cloud/GCP-centric |
| Scripts | `scripts/validateQuestionBank.ts` | Strict seed validation | Useful; Cloud-specific |
| Maestro flows | `.maestro/screenshot-capture/*` | Screenshot capture flows | Current main-shell flow canonical; older track-foundation flow obsolete |
| Artifacts | `artifacts/maestro-uiux/*` | Screenshots, reports, logs | Useful evidence; contains failed intermediate attempts and final pass |
| Docs | `docs/00-16`, `docs/adr`, `docs/reports` | Product/architecture/testing/learning direction | Mixed; newer docs supersede older README/ADR-004 conflicts |
| Native iOS | `ios/*` | Prebuilt native app | Present; no release audit performed |
| CI/build | `.github` absent, `eas.json` absent | CI/release automation | Missing |

## Documentation Alignment Audit

| Doc | Says | Implementation | Match | Canonical recommendation |
|---|---|---|---|---|
| `00-overview.md` | Patternly is multi-track, Cloud + Algorithms, focused practice | Cloud works; Algorithms draft only | Partial | Doc becomes canonical |
| `01-product-definition.md` | Track -> mode -> training item -> attempt -> feedback -> progress | Code mostly question/exam/practice | Conflict | Doc canonical; code must migrate |
| `02-architecture.md` | Neutral navigation, track registry, domain logic, storage layer | Track registry exists; shell and storage still Cloud-coupled | Partial | Doc canonical |
| `03-navigation-and-flows.md` | Home/Practice/Progress/Settings, exam inside certification track | Shell tabs exist inside Home; exam remains stack route | Partial | Flow doc canonical; implement real tab/shell structure later |
| `04-data-model.md` | `TrainingItem` base, taxonomy refs, track-aware attempts/progress | `Question`, `ExamDomain`, `AttemptSummary` dominate | Conflict | Doc canonical, with implementation migration |
| `05-design-system.md` | Calm technical workspace with dark-first design-reference alignment | Runtime shell/components use dark-first tokens | Partial; full per-screen layout alignment still pending | Complete focused screen-layout pass against `docs/designs/*` |
| `06-branding-and-style-direction.md` | Patternly umbrella, neutral tracks, legal safety | App display says Patternly; package/bundle still GCP | Partial | Doc canonical |
| `07-content-guidelines.md` | Content must be original, track-aware, not only questions | Cloud seed validates; no Algorithms content | Partial | Doc canonical |
| `08-storage-and-offline.md` | Local-first, storage adapters/repositories, no `gcpAceTrainer` namespace | AsyncStorage helpers use `gcpAceTrainer.*` | Conflict | Doc canonical; storage migration/reset plan needed |
| `09-security-and-privacy.md` | No auth/backend, local data, no unnecessary permissions | Matches app dependency direction | Mostly match | Doc canonical; add visible privacy/legal screen |
| `10-roadmap.md` | Build shared foundation before full loops | Current repo has partial shell before full domain model | Partial | Roadmap should be updated from evidence |
| `11-implementation-guidelines.md` | Avoid `Question`/`Exam` as shared architecture | Code still uses them broadly | Conflict | Guidelines canonical |
| `12-testing-strategy.md` | Domain/track/storage tests first | Tests cover Cloud scoring/validation/registry only | Partial | Add canonical contract tests |
| `13-risk-register.md` | Critical risk: one track dominates architecture | This risk is active | Match as warning | Treat R-002 as P0 |
| `14-learning-effectiveness-model.md` | No fake readiness/retention, use active recall, due review, diagnostic feedback | Fake readiness UI removed; review still not due-based | Partial | Canonical learning model |
| `15-certification-track-learning-system.md` | Certification has competency/topic/skill atom model, review plan, no fake readiness | Current Cloud uses four exam domains and tags only | Partial | Canonical for certification |
| `16-leetcode-like-learning-system.md` | Algorithms needs staged approach mechanics, pattern/strategy/complexity loops | Algorithms is registry-only draft | Missing | Canonical for Algorithms |
| `docs/README.md` | Says private GCP ACE tool, calm exam simulator | Outdated versus `00-16` and current app name | Conflict | Update later; not canonical |
| ADR-001 | Local-first MVP | Matches | Canonical |
| ADR-002 | Local JSON question data | Partially matches Cloud seed; too question-only | Needs replacement/supplement for content packs |
| ADR-003 | No auth MVP | Matches | Canonical |
| ADR-004 | Light-first, dark-ready | Conflicts current dark-first product direction | Must be superseded if dark-first remains final |

## Maestro/UI Artifact Audit

Looked in `.maestro/`, `artifacts/`, `artifacts/maestro-uiux/`, `test-results/`, `screenshots/`, `reports/`.

| Artifact | Represents | Works | Issues | Action |
|---|---|---|---|---|
| `.maestro/screenshot-capture/patternly-main-shell.yaml` | Current shell screenshots | Uses testIDs, passed in latest manifest | Hardcoded dev-client URL/IP; capture-only, not regression flow | Keep and update |
| `artifacts/maestro-uiux/patternly-main-shell/2026-06-29-1110/manifest.md` | Final main shell evidence | Pass, 7 screenshots | Only shell/draft states; no practice/exam/review depth | Keep as baseline |
| `01-home-cloud.png` | Cloud Home | Shows track cards, local shell | Light-first, `Readiness 72%`, card-heavy, placeholder icons | Keep as current-state evidence |
| `02-practice-cloud.png` | Cloud Practice | Shows start practice and exam simulation | Cloud-specific mechanics in generic Practice tab | Keep; update after canonical session runner |
| `03-progress-cloud.png` | Progress | Manifest passed | Progress is Cloud analytics, not true track-aware progress | Keep; update |
| `04-settings-cloud.png` | Settings | Local-first messaging present | No real settings model; defaults hardcoded | Keep; update |
| `05-home-algorithms.png` | Algorithms selected | Draft visible | No usable track loop | Keep as missing-feature evidence |
| `06-practice-algorithms-draft.png` | Algorithms Practice | Explicit draft state | Draft card text says what implementation should do, too internal for production | Keep now; replace before release |
| `.maestro/screenshot-capture/patternly-track-foundation.yaml` | Older standalone track selection | Historical pass | Coordinate taps, references removed route/state | Replace/remove after main-shell flow fully covers track switching |
| `artifacts/maestro-uiux/patternly-track-foundation/2026-06-29-1028/*` | Older foundation evidence | Useful history | Superseded by shell rebuild | Keep historical, do not use as current baseline |
| Failed debug screenshots under `patternly-main-shell/2026-06-29-1045..1057` | Intermediate failures | Debug evidence | Not current product state | Keep as historical/debug only |

## Product Gap Analysis

| Gap | Current state | Target state | Evidence | Severity | Dependency | Action |
|---|---|---|---|---|---|---|
| Onboarding/first run | App opens to shell, no first-run preference flow | Lightweight first-run active track selection or direct default with clear switch | `HomeScreen` | P1 | Track model | Create first-run state or intentionally defer with doc decision |
| Track selection | Inline cards in Home | Active track context, switcher, persisted per track | `HomeScreen`, registry | P1 | Storage | Keep inline selection, move out of monolithic Home |
| Active track context | Stored only `patternly.activeTrack` | Track-aware session/progress/review state | `localStorage.ts` | P0 | Domain/storage model | Add repositories and track-scoped data |
| Certification loop | Practice/exam/review exist | Certification loop grounded in competency/topic/skill atom and review plan | practice/exam files, doc 15 | P1 | Training model | Migrate Cloud to certification track module |
| Algorithms loop | Draft only | Approach primer, pattern drill, strategy practice, complexity review | registry, doc 16 | P1 | Content/scoring | Create content pack + runner |
| Session flow | Separate Exam/Practice flows | Shared session shell with track-specific item renderers | routes/screens | P0 | Domain session model | Replace with `SessionRunner` model |
| Answer/explanation | Cloud feedback exists | Diagnostic feedback with selected choice, rule, signal, mistake type, next action | `PracticeSessionScreen` | P1 | Feedback model | Create `FeedbackPanel` contract |
| LeetCode approach selection | Missing | Pattern/strategy/complexity active attempts | registry only | P1 | Algorithms content | Create algorithms items/scoring |
| Mistake capture | Manual reasons; incorrect flags | Structured mistake types per track and item type | `MistakeReason`, `QuestionReviewState` | P1 | Attempt model | Replace question-only review state |
| Spaced review | Missing due/priority | Due queue with reason, priority, recurrence, review result | doc 14 | P1 | Review model | Create `ReviewQueueItem` |
| Progress/statistics | Cloud domain/tag analytics | Track-aware concrete diagnostics, no fake readiness | analytics service | P1 | Attempts/progress | Build progress aggregator from attempts |
| Topic detail | Missing | Certification competency/topic detail; algorithms pattern detail | docs/designs include topic screens | P2 | Progress model | Create after core loops |
| Settings | Shell tab with static rows | Real local data/reset/privacy/legal/settings controls | `HomeScreen` settings tab | P2 | Storage model | Implement settings repository and screen |
| Empty/loading/error states | Partial | Explicit unavailable/error states for storage/content/session | components exist | P2 | Storage/content loaders | Add states per feature |
| Offline persistence | AsyncStorage helpers | Adapter + repositories + schema/content metadata | `localStorage.ts`, doc 08 | P0 | Model decisions | Build storage foundation |
| Import/export/seed | Cloud import screen unreachable | Decide: dev-only script, production import, or remove | `src/features/import/*` | P2 | Content strategy | Re-scope or remove UI |
| Accessibility | Basic roles in some components | Stable labels/testIDs, real icons, tab semantics, screen reader text | components/Maestro | P2 | UI pass | Add during screen completion |
| Performance | Not assessed | Avoid large re-renders, derived progress caches if needed | no perf tests | P3 | Stable loops | Audit later |
| Privacy/security | No auth/backend; local | Visible privacy/legal, no unnecessary permissions, no secrets | docs/app config | P2 | Settings/legal | Add release pass |
| Test coverage | 17 passing tests | Domain/session/storage/Algorithms/E2E coverage | tests | P1 | Canonical model | Add contract and flow tests |
| Release readiness | Missing CI/EAS/release gate | CI, build validation, Maestro release gate, checklist | no `.github`, no `eas.json` | P2 | Test suite | Add after core loops |

## Learning-System Gap Analysis

General learning model (`14`):

- Exists: active response before feedback in Cloud practice; confidence capture; explanations.
- Missing: `dueAt`, priority review, interleaving, worked examples/fading, hint usage, first-attempt score, review reason, concrete next action.
- Corrected in Phase 2: hardcoded `Readiness 72%` and percentage readiness label removed from runtime UI.

Certification (`15`):

- Exists: 360 scenario-style Cloud questions, domain practice, exam simulation, explanations, distractor rationale, tags, exam signals.
- Missing: competency areas, topics as real taxonomy nodes, skill atoms, decision rules, scenario patterns, review repair items, diagnostic baseline, focus/scenario/mixed/quick-review modes.
- Risk: current four-domain model is too coarse and will produce weak progress diagnostics.

Algorithms (`16`):

- Exists: registry metadata, disabled Pattern Drill and Strategy Practice modes, draft UI.
- Missing: content pack, approach primers, worked examples, subgoals, pattern mechanics, guided application, strategy selection, contrast practice, complexity checks, mistake types, scoring, review.
- Required separation: do not force Algorithms into Cloud multiple-choice questions. It may share session shell, choice controls, feedback panel, progress/review primitives, and storage, but needs its own learning mechanics.

## Technical Gap Analysis

| Path/name | Problem | Cause | Risk | Correction | Acceptance criteria |
|---|---|---|---|---|---|
| `src/features/home/HomeScreen.tsx` | Shell still owns orchestration/data loading, although tab UI is split | Fast transitional rebuild | Hard to extend into canonical session/progress contracts | Continue extracting focused hooks/services only where they clarify ownership | Home imports only shell components and track summary data |
| `src/types/question.ts` | `Question`/`ExamDomain` as shared root | Original GCP app | Blocks Algorithms | Move/copy under certification track; add `TrainingItem` union | Shared code no longer imports `ExamDomain` |
| `src/types/attempt.ts` | Attempt summary question-shaped | Exam-first architecture | Wrong progress/review model | Add `TrainingAttempt` and map Cloud attempts | Attempts include `trackId`, `itemId`, `itemType`, `contentVersion` |
| `src/constants/storage.ts` | `gcpAceTrainer.*` keys | Legacy namespace | Migration/reset ambiguity | Add `patternly:v1:*` keys and migration/reset plan | New writes use Patternly namespace |
| `localStorage.ts` | Silent catch fallbacks | Avoid app crash | Hidden data loss/corruption | Return explicit unavailable/corrupt states or logged result | Storage errors are observable in UI/tests |
| `trackRegistry.ts` | Fallback to Cloud on unknown ID | Convenience fallback | Hidden invalid state | Return `null`/error for invalid IDs after read guard | Unknown track cannot silently launch Cloud |
| `trackRegistry.ts` | Display metadata mixed into domain | First UI slice | Registry grows incorrectly | Split domain definition from UI card props if needed | Registry remains pure/testable |
| `PracticeSetupScreen.tsx` | Hardcoded domain practice | Cloud-first | Not reusable | Keep as Cloud-specific or replace with `SessionSetup` | Shared setup accepts `trackId`, `modeId` |
| `PracticeSessionScreen.tsx` | Question-only runner | Cloud-first | Algorithms cannot use | Introduce `SessionRunner` + item renderers | Cloud practice runs through shared session contract |
| `scoringService.ts` | Exact correctness only | Exam scoring | No partial/strategy quality | Track scoring adapters | Tests cover multi-choice partial and algorithms scoring |
| `analyticsService.ts` | Domain/tag analytics only | GCP model | Misleading track progress | Progress aggregators per track | Algorithms progress can be computed |
| `ImportQuestionsScreen.tsx` | Unreachable UI | Route removed | Dead feature surface | Remove UI or route intentionally under settings/dev | No unreachable feature code remains |
| Empty dirs | `src/features/settings`, `src/features/tracks` | Deleted screens | Dead structure | Remove when implementation pass allowed | No empty feature dirs |
| Theme usage | Runtime now uses `colors.dark.*`; light tokens remain defined | ADR-004 | Full design alignment not finished | Supersede ADR and complete per-screen dark-first layout pass | Runtime dark-first verified by Maestro |
| `BottomTabBar` | Text placeholders for icons | No icon lib | Unpolished/nonstandard | Use approved icon library or RN-safe icons | Tabs use meaningful icons and labels |
| CI/build | No `.github`, `eas.json` | Early repo | No release gate | Add CI for typecheck/test/validate and EAS/build plan | CI required before release |

## Removal Candidates

| Candidate | Type | Why remove | Evidence | Risk | Replacement | Timing |
|---|---|---|---|---|---|---|
| `src/features/settings/` | Empty dir | Deleted screen left folder | `find src -type d -empty` | None | None | Phase 2 |
| `src/features/tracks/` | Empty dir | Deleted screen left folder | empty dir | None | Inline switcher or future `track-selector` | Phase 2 |
| `.maestro/screenshot-capture/patternly-track-foundation.yaml` | Obsolete flow | Coordinate-based, superseded | report + main-shell flow | Losing history if deleted too early | Updated semantic flow | Later after replacement |
| `artifacts/.../patternly-track-foundation/*` | Historical artifacts | Current state superseded | report says superseded | Historical evidence loss | Keep archived, do not use as baseline | Defer |
| `ImportQuestionsScreen.tsx` | Unreachable screen | No route import | `rg` finds only definition | Could lose useful local import | Dev tool script or routed admin/settings item | Verify then Phase 2/4 |
| `QuestionBankSummary.tsx` | Possibly unreachable UI | Used only by import screen | `rg` | Same as import | Validation script or content screen | With import decision |
| Hardcoded `Readiness 72%` | Removed UI concept | Fake precision | Historical `HomeScreen` screenshot/design reference | None | Evidence/practice signal | Done in Phase 2 |
| `gcpAceTrainer.*` as active write namespace | Storage keys | Legacy product name | `constants/storage.ts` | Existing local data migration | `patternly:v1:*` with migration/reset | Phase 4 |
| `Exam` as main mental route | Route/concept | Certification-specific | navigator/docs conflict | Existing Cloud exam path | Cloud-specific nested flow | Phase 3/4 |
| Placeholder tab icons `H`, `>`, `#`, `*` | UI pattern | Not premium/familiar | `HomeScreen`/screenshots | None | Proper icons | Phase 5 |

## Change Candidates

| Path/name | Current problem | Target | Dependencies | Risk | Acceptance criteria | Phase |
|---|---|---|---|---|---|---|
| `docs/README.md` | Outdated GCP-only summary | Multi-track Patternly index | Product decision | Low | No conflict with `00-16` | Phase 1 docs |
| `docs/adr/ADR-004...` | Light-first accepted | Supersede or clarify dark-first | Owner decision | Medium | ADR matches final visual direction | Phase 1 |
| `package.json`, `app.json`, iOS bundle | `gcp-ace-trainer` identifiers | Patternly-neutral identifiers | Release decision | Medium native impact | App IDs intentionally chosen | Phase 7 |
| `trackRegistry.ts` | Partial track display registry | Track contracts + capabilities | Domain models | Medium | Registry supports content/scoring/progress contracts | Phase 1/3 |
| `HomeScreen.tsx` | Monolith | Composed shell and tab screens | Track data hooks | Medium | Smaller files, tab tests, no Cloud logic in shell | Phase 2 |
| `storage/localStorage.ts` | Silent fallbacks | Explicit storage repositories | Storage model | Medium | Corrupt/missing/unavailable tested | Phase 4 |
| `practice/exam/review` files | Cloud logic in generic features | Track-specific Cloud implementation behind shared session contracts | Session model | High | Cloud behavior preserved via tests/Maestro | Phase 3/4 |
| `analyticsService.ts` | Cloud-only progress | Track progress aggregators | Attempt model | Medium | Cloud + Algorithms progress tests pass | Phase 4 |
| `theme/tokens.ts` + components | Light-only runtime | Dark-first Focus Lab | ADR | Medium | Main shell screenshots dark-first and accessible | Phase 5 |
| Maestro flows | Screenshot-only shell | Release gate flows | Stable testIDs | Medium | Shell + core loops captured | Phase 6 |

## Creation Candidates

| Proposed path/name | Purpose | Product rationale | Technical rationale | Dependencies | Acceptance criteria | Phase |
|---|---|---|---|---|---|---|
| `src/domain/training-items/*` | Shared `TrainingItem` model | Multi-track content | Replace `Question` root | Phase 1 | Union supports Cloud and Algorithms |
| `src/domain/sessions/*` | Shared session model/engine | One shell, track-specific mechanics | Testable outside RN | TrainingItem | Session lifecycle tests |
| `src/domain/attempts/*` | Shared attempt model | Better review/progress | Track-aware storage | Session model | Attempts include track/content metadata |
| `src/domain/review/*` | Due review queue | Spaced retrieval | Deterministic priority | Attempts | `dueAt`, reason, priority tested |
| `src/domain/progress/*` | Concrete diagnostics | No fake readiness | Derived/cached aggregations | Attempts/review | Cloud and Algorithms aggregators tested |
| `src/tracks/cloud-certification/*` | Cloud-specific taxonomy/scoring/content adapters | Preserve Cloud value | Contain GCP concepts | Shared domain | Shared code stops importing GCP types |
| `src/tracks/algorithms/*` | Algorithms content/scoring/renderers | Make second track real | Separate learning mechanics | Shared domain | Pattern drill playable |
| `data/tracks/cloud-certification/*` | Versioned Cloud content pack | Content provenance | Manifest/taxonomy/items | Content model | Seed validates |
| `data/tracks/algorithms/*` | Original Algorithms MVP pack | Enable real track | Separate content validation | Algorithms model | Includes pattern/strategy/complexity items |
| `tests/session*.test.ts` | Session engine tests | Protect core loops | Regression guard | Domain model | Cloud + Algorithms session tests |
| `tests/storage*.test.ts` | Storage repository tests | Protect offline data | Corruption/migration guard | Storage layer | Missing/corrupt/version cases pass |
| `.github/workflows/ci.yml` | CI gate | Release safety | Run typecheck/test/validate | Stable scripts | CI green | Phase 6 |
| `eas.json` or release build docs | Build profile | Production readiness | Repeatable builds | Expo decision | Local/EAS build documented | Phase 7 |
| `.maestro/release/*` | Core E2E flows | Product regression guard | Repeatable QA | Stable UI | Shell, Cloud practice, Algorithms drill captured | Phase 6 |

## Ordered Execution Plan

### Phase 0 - Evidence and Baseline

Objective: establish trustworthy baseline before implementation.

Tasks:

1. Record repository inventory: source, docs, tests, configs, Maestro artifacts.
2. Save current route/screen map from `RootNavigator` and `HomeScreen`.
3. Save current test status: `npm run typecheck` pass; `npm test` pass 17/17; `npm run validate:questions` pass 360/0 errors.
4. Record build status: no CI, no `eas.json`; native iOS files present; release build not verified.
5. Record Maestro baseline: latest current pack `artifacts/maestro-uiux/patternly-main-shell/2026-06-29-1110`.
6. Record known broken/stale areas: old GCP naming, dark-first conflict, fake readiness, draft Algorithms, storage namespace, unreachable import screen.

Definition of done: planning file exists and baseline evidence is recorded.

### Phase 1 - Canonical Product and Architecture Alignment

Objective: resolve contradictions before building further.

Tasks:

1. Decide whether current dark-first product direction supersedes ADR-004.
2. Update docs index and ADRs so multi-track/dark-first are canonical.
3. Define canonical track boundaries: shared shell/storage/progress/review, separate certification vs Algorithms learning mechanics.
4. Define minimum shared domain contracts: `Track`, `SessionMode`, `TrainingItem`, `TrainingSession`, `TrainingAttempt`, `ReviewQueueItem`, `UserProgress`.
5. Define Cloud Certification taxonomy target: competency/topic/skill atom at least as data model, even if UI starts smaller.
6. Define Algorithms MVP content shape: approach primer, pattern identification, strategy choice, complexity analysis, solution comparison.
7. Decide import UI fate: remove, hide as dev tool, or route intentionally.
8. Decide storage migration/reset strategy for legacy `gcpAceTrainer.*`.

Definition of done: docs/ADRs align; implementation tasks have acceptance criteria.

### Phase 2 - Structural Cleanup

Objective: remove/isolate stale paths before building more.

Tasks:

1. Remove empty feature dirs after verification.
2. Done: remove hardcoded `Readiness 72%` and replace with explicit insufficient-evidence or concrete practice signals.
3. Split `HomeScreen` into shell/tab components without changing behavior.
4. Move Cloud-only copy/actions behind Cloud-specific tab sections or adapters.
5. Replace hidden fallback from invalid track to Cloud with explicit invalid/unavailable state.
6. Consolidate or quarantine unreachable import UI.
7. Replace placeholder tab icons with real icon strategy.
8. Update Maestro main-shell flow to cover cleanup.

Definition of done: typecheck/tests pass; main-shell Maestro pass; no empty dirs/unreachable selected code without explanation.

### Phase 3 - Core Product Loops

Objective: complete correct loops per track type.

Tasks:

1. Build shared `SessionRunner` model independent of React Native.
2. Build Cloud Certification practice on shared session model.
3. Build Cloud feedback/rationale model with distractor rationale and mistake type.
4. Build Cloud weak-area/review flow from attempts/review queue.
5. Create Algorithms MVP item renderers: pattern choice, strategy choice, complexity choice, solution comparison.
6. Create Algorithms scoring with partial/strategy-quality results.
7. Keep certification exam simulation as Cloud-specific, not global.
8. Add session summaries with concrete next review actions.

Definition of done: Cloud practice still works; Algorithms Pattern Drill works with original content; no generic forced quiz loop.

### Phase 4 - Data, Persistence, and Progress Model

Objective: align state and persistence with product behavior.

Tasks:

1. Implement storage repositories under Patternly namespace.
2. Add schema/content metadata.
3. Create migration or explicit reset path from `gcpAceTrainer.*`.
4. Store attempts as track-aware records referencing content by ID/version.
5. Store review queue with `dueAt`, `priority`, `reason`, `mistakeTypes`.
6. Build progress aggregators per track.
7. Add seed/demo content strategy for Cloud and Algorithms.
8. Add storage tests for missing/corrupt/version mismatch.

Definition of done: storage tests pass; UI shows explicit unavailable/corrupt/reset states.

### Phase 5 - UI System and Screen Completion

Objective: bring screens into Patternly visual system and complete states.

Design reference rule: use `docs/designs/*` as high-fidelity visual references, not as pixel-perfect source files. Final layouts should reach at least **90% alignment** with the selected reference screens while resolving inconsistencies into one coherent app-wide layout system. Do not copy references 1:1 when they conflict with canonical docs, current product truth, accessibility, verified Cloud behavior, or internal consistency.

Tasks:

1. Implement dark-first Focus Lab tokens if ADR supersedes light-first.
2. Apply tokens to `Screen`, `Card`, `Button`, `TrackCard`, tab bar, feedback, progress.
3. Reduce card stacking on shell; keep one primary task per screen.
4. Complete Home, Practice, Progress, Settings for Cloud and Algorithms.
5. Add topic/detail screens after progress model exists.
6. Add empty/loading/error/unavailable states.
7. Add accessibility labels, roles, dynamic text checks.
8. For every UI slice, record selected `docs/designs/*` references, intentional deviations, and 90% alignment evidence.
9. Capture updated Maestro screenshots.

Definition of done: main flows visually match the canonical product direction, demonstrate at least 90% alignment with selected design references after consistency normalization, and pass Maestro captures.

### Phase 6 - Testing and QA

Objective: prevent regressions across core flows.

Tasks:

1. Add unit tests for domain contracts, session engine, Cloud scoring, Algorithms scoring.
2. Add review/progress/storage tests.
3. Add integration tests for Cloud session -> attempt -> review -> progress.
4. Add integration tests for Algorithms drill -> attempt -> mistake -> review/progress.
5. Add Maestro flows for shell, Cloud practice, Cloud exam summary, Algorithms pattern drill, settings reset confirmation.
6. Add visual artifact capture manifest.
7. Add CI workflow for typecheck/test/validate.
8. Define release-blocking test criteria.

Definition of done: CI green; Maestro release gate documented and reproducible.

### Phase 7 - Release Hardening

Objective: prepare production-quality release.

Tasks:

1. Validate Expo/iOS build path and app identifiers.
2. Add release checklist.
3. Review runtime errors and storage failure behavior.
4. Performance pass on session screens and large question bank.
5. Privacy/security pass: no unnecessary permissions, no secrets, local-data disclaimer.
6. Content legal review for Cloud and Algorithms originality.
7. Final Maestro artifact review.
8. Document known limitations and post-release backlog.
9. Go/no-go criteria.

Definition of done: build passes, release checklist complete, no P0/P1 open issues.

## Priority Model

P0:

- Resolve canonical architecture/docs conflict: cannot safely build while code/docs disagree.
- Define shared domain/session/attempt/review/progress contracts: needed before Algorithms and proper storage.
- Remove fake readiness signal: directly contradicts learning model and misleads users.
- Decide storage namespace/migration/reset: prevents data model drift and hidden local data risk.
- Split/isolate GCP shared leakage: otherwise second track becomes bolted-on.

P1:

- Make Algorithms a real MVP loop: required for stated product.
- Migrate Cloud practice/review to canonical session/attempt model: required to preserve current value.
- Add track-aware progress/review: required for usable product promise.
- Add core domain/storage tests: required before continued implementation.
- Resolve UI direction ADR: required before large UI work.

P2:

- CI, release build, Maestro release gates, settings/legal/privacy, accessibility, topic detail screens.

P3:

- Advanced Algorithms timed challenge, import/export backup, remote content, notifications, AI features, richer analytics.

## Implementation Sequencing

### Batch 1 - Canonical Decisions and Cleanup Plan

Scope: docs/ADR alignment, storage/import decisions.  
Files: `docs/README.md`, ADRs, maybe new planning docs.  
Tests: none beyond markdown review.  
Maestro: none.  
Acceptance: docs no longer contradict product direction.  
Commit: one docs commit.

### Batch 2 - Shell Decomposition Without Behavior Change

Scope: split `HomeScreen` into shell/tabs/components.  
Files: `src/features/home/*`, `src/components/*`.  
Tests: `npm run typecheck`, `npm test`; run main-shell Maestro.  
Acceptance: screenshots equivalent, no Cloud behavior lost.  
Commit: one commit.

### Batch 3 - Domain Contract Foundation

Scope: add shared training/session/attempt/review/progress types and tests.  
Files: `src/domain/*`, `tests/*`.  
Tests: new domain tests.  
Acceptance: contracts support Cloud and Algorithms without optional-field soup.  
Commit: one commit.

### Batch 4 - Cloud Migration to Canonical Model

Scope: adapt Cloud practice/exam/review to new contracts while preserving UX.  
Files: `src/tracks/cloud-certification/*`, `src/features/practice/*`, `src/features/exam/*`, `src/features/review/*`.  
Tests: Cloud session/scoring/review tests; Maestro Cloud practice.  
Acceptance: existing Cloud flows work; shared code no longer depends on `ExamDomain`.  
Commit: multiple commits.

### Batch 5 - Storage Repository and Migration/Reset

Scope: Patternly namespace, repositories, explicit error states.  
Files: `src/storage/*`, `src/constants/storage.ts`, tests.  
Tests: storage missing/corrupt/version tests.  
Acceptance: no silent fallback for critical storage states.  
Commit: one or two commits.

### Batch 6 - Algorithms MVP Loop

Scope: original algorithms content pack, scoring, Pattern Drill, Strategy Practice seed.  
Files: `data/tracks/algorithms/*`, `src/tracks/algorithms/*`, session runner UI.  
Tests: Algorithms scoring/session/progress tests; Maestro Algorithms drill.  
Acceptance: Algorithms no longer draft; no LeetCode-copy content.  
Commit: multiple commits.

### Batch 7 - Progress and Review

Scope: due review queue, concrete progress diagnostics.  
Files: `src/domain/review/*`, `src/domain/progress/*`, Progress/Review screens.  
Tests: review/progress integration.  
Acceptance: Home recommendation has explainable reason, no fake readiness.  
Commit: multiple commits.

### Batch 8 - Dark-First UI System

Scope: Focus Lab tokens and screen application.  
Files: `src/theme/*`, `src/components/*`, feature screens, `app.json`, `App.tsx`.  
Tests: typecheck/tests; Maestro screenshots.  
Acceptance: dark-first, accessible, no text overlap, no placeholder icons, at least 90% alignment with selected `docs/designs/*` references without copying inconsistent screens 1:1.  
Commit: multiple UI commits.

### Batch 9 - QA and Release Gate

Scope: CI, release scripts/docs, Maestro gates, release checklist.  
Files: `.github/workflows/*`, `.maestro/*`, docs/release checklist, config.  
Tests: CI-equivalent local run.  
Acceptance: reproducible release gate.  
Commit: one or two commits.

## Final Recommended Next Action

Next implementation task:

Create and review the canonical decision update for Phase 1. Specifically update the docs index and supersede or revise ADR-004 to resolve light-first vs dark-first, and record that `00-16` plus learning docs are canonical over older GCP-only README language. Do not change app code in that task.

Why this is next: code changes are currently blocked by conflicting canonical sources. If implementation starts before resolving the product/architecture/UI direction, the repo will keep layering new code on top of stale GCP/light-first assumptions.

## Verification Performed During Audit

- `npm run typecheck` passed.
- `npm test` passed: 17/17 tests.
- `npm run validate:questions` passed: 360 questions, 0 errors.
- Reviewed current Maestro artifacts and screenshots; did not rerun Maestro during file creation.
