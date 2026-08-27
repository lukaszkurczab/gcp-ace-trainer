# Mobile delivery report — 2026-08-27

## Executor and scope

- Executor: Luna/max — model `gpt-5.6-luna`, reasoning effort `max`.
- Repository: `/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly`.
- Scope: locally verifiable mobile backlog items MOB-001/002/003/009/010/016/017/018/019/021.
- Android was inspected statically only. No Android build, signing, APK, or release operation was run.
- Runtime target attempted: iPhone 17, iOS 26.4. No ready-made build was used.

The implementation plan passed the required pre-change gate at 0.90/1.00 (consistency 0.95, simplicity 0.90, risk 0.85, maintainability 0.90).

## ID status

| ID | Status | Evidence / outcome |
| --- | --- | --- |
| MOB-001 | Covered, runtime unverified | Existing Maestro contracts and focused selector/flow tests pass. No confirmed code gap remained. Runtime flow was not executed because the iOS source build could not attach to the simulator tooling. |
| MOB-002 | Covered | Public legal/deletion destinations are already strict, HTTPS-validated, and fail closed when unavailable. Evidence: `tests/publicLegalLinks.test.ts`, `tests/accountIdentityComposition.test.ts`. |
| MOB-003 | Covered | Track selection remains local until `commitSelection()` persists the choice, then navigates. Evidence: `tests/selectTrackLargeText.test.ts`, `tests/visualShell.test.ts`. |
| MOB-009 | Covered statically, runtime unverified | Branded startup `LoadingState`, explicit progress semantics, and bounded blocking state are present. Evidence: `tests/startupLoadingSurface.test.ts`, `tests/loadingStateOwnership.test.ts`, `tests/brandAssets.test.ts`. |
| MOB-010 | Covered statically, runtime unverified | iOS/Android launcher references and safe bounds are consistent. Evidence: `tests/brandAssets.test.ts`, `tests/androidSandboxVariant.test.ts`. Native icon runtime was not claimed without a source-built simulator run. |
| MOB-016 | Covered statically, runtime unverified | Firebase refresh-token persistence is constrained to the canonical secure adapter. Evidence: `tests/accountIdentityComposition.test.ts`; iOS auth smoke could not be executed. |
| MOB-017 | Done | Removed four runtime imports through `navigation/index.ts` and switched them to direct `goBackOrHome`/`types` imports, eliminating the confirmed RootNavigator → SelectTrackScreen → navigation barrel cycle. Added `tests/navigationDependencyCycle.test.ts`. Commit `c43065696c8081296715e61141331294c1cdaecd`. |
| MOB-018 | Covered statically, runtime unverified | Practice uses the in-flow bottom navigation with `useSafeAreaInsets`; the old manual content reservation is absent. Static accessibility/layout evidence passes. Android and 200% runtime checks were not run under the assigned boundary. |
| MOB-019 | Blocked / no code change | `.env.example`, `publicEnvironment`, and Firebase config already define an explicit public environment contract and fail closed. The remaining clean iOS/Android build evidence and product-owner environment decision are external prerequisites; no speculative configuration was added. |
| MOB-021 | Done locally, Android runtime unverified | Added explicit preparation phases (`opening-storage`, `recovering-learning-state`, `verifying-content`, `resuming-session`), phase-specific copy/selectors, timeout phase reporting, an explicit unavailable selector, and Retry reset to the opening phase. Commit `f478328935cefd05b70c18a3f7a52249770ee879`. |

## Changes

- `src/content/application/ContentPreparationGate.tsx`: phase-aware bounded preparation state, phase-specific loading copy, timeout diagnostics, and observable `preparing:<phase>` / `unavailable` selectors.
- `src/testing/runtimeSelectors.ts`: canonical selectors for preparation and unavailable states.
- `src/features/home/SelectTrackScreen.tsx` and the three practice screens: direct navigation imports to remove the runtime barrel cycle.
- `tests/navigationDependencyCycle.test.ts`, `tests/runtimeSelectors.test.ts`, `tests/startupLoadingSurface.test.ts`, `tests/loadingStateOwnership.test.ts`: focused regression coverage.

Dead-code check: the confirmed competing runtime navigation-barrel path is no longer used by these screens. The public `navigation/index.ts` exports remain because the barrel is still a public route API; no unreachable component, hook, service, or test was deleted speculatively.

## Verification

- `npm run typecheck` — PASS.
- Focused mobile/static suite (45 tests, including loading ownership, navigation cycle, runtime selectors, startup surface, visual shell, large text, platform config, brand assets, legal links) — PASS, 45/45.
- Android static boundary suite — PASS, 16/16. No Android build/signing/release was run.
- Full `npm test` — 579 passed, 1 failed. The sole failure is the existing release-gate expectation while the sibling `patternly-content` checkout is dirty (`tests/contentReviewConsole.test.mjs`, `tests/freeNodeInventory.test.mjs`); the application checkout is clean at the final commit.
- `xcrun simctl list devices available` — iPhone 17 on iOS 26.4 was present/booted at inspection. Source run `npx expo run:ios --device 7F315654-3175-4F3C-BB24-B0263F59360C --no-install` could not proceed: `Can't determine id of Device Hub or Simulator app`; another `simctl` operation also reported CoreSimulatorService connection invalid/refused. Therefore no iOS Maestro runtime result is claimed.
- Maestro version available: 2.6.1; no Android Maestro flow was run.

Final application repository state: clean, `main` synchronized with `origin/main` at `f478328935cefd05b70c18a3f7a52249770ee879` before this report commit.
