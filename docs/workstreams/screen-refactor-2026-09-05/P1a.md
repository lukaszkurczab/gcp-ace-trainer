# P1a — scoped practice read model

## Model and effort

- Model: `gpt-5.6-luna`
- Effort: `max`
- Pre-change minimum score: **0.84** (consistency 0.88, simplicity 0.90, risk 0.84, maintainability 0.88).

## Facts and assumptions

- `PracticeHubScreen` read the stored track, training attempts, and review queue independently.
- `TopicRoadmapScreen` and `PracticeSetupScreen` each repeated the stored-track and training-attempt reads, including a stored-track read when an explicit `trackId` was already present in the route.
- The existing repository result contract can carry `issues`; an issue remains an unavailable read and is never converted into an empty history.
- Review availability remains Hub-only and uses the active track, exact package pin, and due time.
- Focus cleanup and request identity belong to the local practice hook. No global cache, persistence, curriculum, provider, or session configuration changes are needed for P1a.

## Scope completed

- Added the pure `practiceReadModel` loader and the React Navigation `usePracticeReadModel` adapter.
- Added one request-keyed pending/ready/unavailable state shape for the three screens.
- Explicit route tracks skip the stored-track read; roadmap/setup do not request reviews; Hub opts into reviews.
- Added lifecycle cleanup so an unfocused request cannot publish a result or error, and added a retry action to each existing unavailable state.
- Kept training attempts, review refs/source, package pin checks, and the existing screen skeletons/navigation intact.
- Updated the loading ownership assertions to protect the shared hook contract and each screen’s request-key guard.

## Files and removed paths

- Added `src/application/practiceReadModels.ts`.
- Added `src/features/practice/usePracticeReadModel.ts`.
- Added `src/application/practiceReadModels.test.ts`.
- Updated `src/features/practice/PracticeHubScreen.tsx`, `TopicRoadmapScreen.tsx`, and `PracticeSetupScreen.tsx` to consume the shared loader.
- Updated `src/navigation/loadingStateOwnership.test.ts` for the new owner and retry contract.
- Removed the duplicated per-screen read state, focus callbacks, repository imports, and Hub review filtering implementation. No runtime selector, persistence, curriculum, provider, mode, form, progression, or route UX path was removed.

## Verification

- `node --import tsx --test src/application/practiceReadModels.test.ts` — **4 passed**.
- `node --import tsx --test src/navigation/loadingStateOwnership.test.ts` — **24 passed**.
- `node --import tsx --test src/features/practice/practiceNavigation.test.ts src/features/practice/practiceFlowModel.test.ts src/features/practice/practiceSessionConfig.test.ts src/application/practiceReadModels.test.ts src/navigation/loadingStateOwnership.test.ts` — **48 passed**.
- `npm run typecheck` — **passed**.
- `git diff --check` — **passed**.
- No commit was created and `plan.md` was not modified.

## Risks and follow-up

- Native visual/runtime capture was not repeated for this bounded loader step; the parent owns baseline and screenshot evidence.
- P1b still owns route mode/topic guards, stale setup form reset, selected-topic affordance, and the Hub duplicate/topic UX. Those paths remain unchanged here so P1a does not alter mode or curriculum behavior.
- Repository baseline `qa:static` was not rerun as requested; its known pre-existing failures remain outside this step.

## Final integration note
The canonical reader and its test now live at `src/application/practiceReadModels.ts` and `.test.ts`; `usePracticeReadModel` remains in features. Final verification supersedes intermediate commands: `npm run qa:static` PASS, 743/743 tests, typecheck and content/privacy boundaries.
