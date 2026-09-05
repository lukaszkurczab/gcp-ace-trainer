# P1b — practice route, form, and UX guards

## Model and effort

- Model: `gpt-5.6-luna`
- Effort: `max`
- Pre-change minimum score: **0.84** (objective fit 0.88, simplicity 0.86, risk 0.84, maintainability 0.88).

## Facts and assumptions

- The content package profile is the mode authority. `buildPracticeModes` exposes the profile-declared modes and setup calls `packageProfile.getMode` once; a missing mode is an unavailable route rather than a render throw.
- The bundled certification profiles declare `certification-quick-review`. Quick Review therefore remains a supported setup path with its profile session defaults. The bundled profiles do not declare the scenario/mixed paths, and their profile lookup rejects those paths.
- Route topic identity is valid only when it resolves inside the selected package's free topic/roadmap. An unknown or unavailable topic is an explicit unavailable state.
- `SelectTrackScreen.commitSelection` saves the selected track and navigates to `ROUTES.HOME` with `{ initialTab: "home" }`. Home is the root stack route, so this return drops the practice Hub/roadmap route params and clears a previous practice `trackId` override.
- Existing common locale entries already cover the new unavailable, topic-choice, change-topic, back, Continue, Quick Review, and review-copy messages in both EN and PL. No locale file change was needed.

## Scope completed

- Kept the P1a scoped read model as the single read owner for Hub, roadmap, and setup. Read errors remain retryable; route, package, topic, and mode errors render an explicit unavailable shell with a back or choose-topic action. Hub and roadmap unavailable shells retain bottom navigation.
- Added setup route identity derived from track, mode, topic, session configuration, review references, source, and related route inputs. A new identity resets route-derived length, feedback, review, focus-topic, and setup-error state before submit can use it. Pending request and identity mismatch share one local skeleton branch, while read error and null-track handling retain their existing ordering.
- Kept profile-supported Quick Review configuration and rendering. Removed the scenario competency state/list/validation/empty UI because no installed profile supplies it and profile lookup rejects it; the existing session configuration contract is unchanged.
- Added a single active-topic roadmap action in Hub with the active track identity, plus a visible Change topic affordance. The secondary mode list excludes the Custom Practice row while retaining the hero `openSetup`/`customEntry` selectors and CTA.
- Added a route-topic guard to roadmap and preserved the selected track when navigating between Hub and roadmap. Roadmap selection now uses the existing sticky `Screen` footer Continue action; bottom navigation and safe-area handling remain owned by the shell. Topic titles can grow with large text instead of being clipped to two lines.
- Removed the unreachable `lengthFeedbackReview` loading variant and its skeleton-only styles after Quick Review became the profile-supported fixed configuration.

## Files and removed paths

P1b production changes:

- `src/features/practice/PracticeHubScreen.tsx`
- `src/features/practice/TopicRoadmapScreen.tsx`
- `src/features/practice/PracticeSetupScreen.tsx`
- `src/navigation/types.ts`

P1b regression coverage and compatibility updates:

- `src/features/practice/practiceRouteGuards.test.ts`
- `src/features/practice/practiceNavigation.test.ts`
- `src/navigation/loadingStateOwnership.test.ts`
- `src/tracks/coding-interview/algorithmsSessionAccessibility.test.ts`

P1a files used by this slice and still present in the checkout:

- `src/application/practiceReadModels.ts`
- `src/features/practice/usePracticeReadModel.ts`
- `src/application/practiceReadModels.test.ts`

Removed or replaced paths were the per-screen read owners already removed in P1a, the setup scenario competency scaffolding, the duplicate Custom Practice secondary row, the inline roadmap Continue control, and the unreachable setup loading variant. The hero Custom Practice entry, runtime selectors, session configuration, review references/source, persistence, curriculum, provider, and progression paths remain. `plan.md` was not modified.

## Verification

- `node --import tsx --test src/features/practice/practiceNavigation.test.ts src/features/practice/practiceFlowModel.test.ts src/features/practice/practiceSessionConfig.test.ts src/application/practiceReadModels.test.ts src/features/practice/practiceRouteGuards.test.ts src/navigation/loadingStateOwnership.test.ts src/components/visualShell.test.ts src/i18n/practiceCopy.test.ts src/content/contentPackageRuntimeCutover.test.ts src/tracks/coding-interview/algorithmsSessionAccessibility.test.ts` — **67 passed, 0 failed**.
- `npm run typecheck` — **passed**.
- `git diff --check` — **passed**.
- The repository-wide baseline was not rerun. The previously reported mutationArchitecture ExamScreen regex and rcAlgorithmsBootstrap stale-YAML failures remain outside P1b.
- No commit was created.

## Risks and limitations

- Native screenshot/runtime evidence remains with the parent task; this bounded step used the existing shell contracts plus static route/navigation and loading assertions.
- The Change Track reset conclusion is based on the current stack topology and `SelectTrackScreen` navigation call; it intentionally leaves track persistence semantics unchanged.
- Future package profiles can add modes through `getMode` and `buildPracticeModes`; this change does not invent or reject such modes by name.

## Final integration note
The canonical reader and its test now live at `src/application/practiceReadModels.ts` and `.test.ts`; `usePracticeReadModel` remains in features. Final verification supersedes intermediate commands: `npm run qa:static` PASS, 743/743 tests, typecheck and content/privacy boundaries.
The originally reported 67-test command above contains obsolete/nonexistent paths; it is not independently reproducible and must not be reused. The final complete repository gate is recorded in final-qa.log. Narrow final ownership/read/route/loading check: 46/46 PASS (see final-report.md).
