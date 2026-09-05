# P2 QA corrections

Status: complete in `/private/tmp/patternly-activity-refactor`; no commit created.

Model: `gpt-5.6-luna`

Effort: `max`

## Pre-change validation

The correction scored `0.92` for objective and architecture consistency, `0.90` for simplicity, `0.88` for risk, and `0.90` for maintainability. The minimum score was `0.88`, above the required `0.80` threshold. The scope is bounded to the three QA findings: the Progress empty-state CTA, local calendar grouping tests, and a whitespace-tolerant RC flow assertion.

## Facts and assumptions

- The existing empty Progress branch already rendered `Open Practice` only when `algorithmsProgress` and `onProgressAction` were present. Cloud and installed package models had no equivalent practice action and therefore exposed only the global Activity action.
- `HomeScreen` already owns navigation to `PRACTICE_HUB`, and `ActivityScreen` uses that route for its empty state. `PracticeHubScreen` resolves the active track, so the same route is the existing track-aware entry point for every Progress track.
- P2 changed activity grouping to local calendar days and Monday-based weeks through `activityPresentation.ts`, but the Progress projection had no behavioral coverage for a Monday boundary or a DST midnight boundary.
- The checked-in RC YAML contains an outer conditional track-selection flow and a nested conditional change-track flow. The prior test depended on exact indentation and did not assert the final Continue tap in the nested sequence. The correction preserves exact IDs, timeout, retry, direction, centering, and visibility values while matching whitespace independently.
- The requested scope excludes HomeTab expansion, production exam or Maestro YAML edits, scheduler/persistence changes, dependencies, and new general-purpose production abstractions. Those constraints remain unchanged.

## Changes

- Added an optional `onOpenPractice` callback to `ProgressTab`. Algorithms keeps its existing model-selected `onProgressAction`; cloud and installed empty states use the shared callback. `HomeScreen` wires it to the existing `ROUTES.PRACTICE_HUB` route.
- Added Progress model tests for a Monday week boundary and a local DST midnight boundary. The tests build real package-scoped attempts and assert the resulting activity groups.
- Reworked `rcAlgorithmsBootstrap.test.ts` with compacted YAML fragments and an ordered sequential assertion. The nested command order is now checked as `scrollUntilVisible` with its exact timeout and options, then the Algorithms tap, then the Continue tap, while existing structural/count assertions remain.

## Files, removals, and references

Files changed for this correction:

- `src/features/home/HomeScreen.tsx`
- `src/features/home/tabs/ProgressTab.tsx`
- `src/features/home/tabs/progressPresentation.test.ts`
- `src/features/home/tabs/homeProgressProjections.test.ts`
- `src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts`
- `docs/workstreams/screen-refactor-2026-09-05/P2-QA-corrections.md`

No files were removed. References checked included `P2.md`, `P2-brief.md`, `P5-baseline-repair.md`, `baseline-review.md`, `progressTabModel.ts`, `activityPresentation.ts`, `ActivityScreen.tsx`, `PracticeHubScreen.tsx`, `HomeScreen.tsx`, and `.maestro/rc-algorithms-bootstrap.yaml`. No production exam or Maestro YAML file was edited, and no dependency or lockfile changed.

## Exact verification

- `node --import tsx --test src/features/home/tabs/progressPresentation.test.ts src/features/home/tabs/homeProgressProjections.test.ts src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts` — **20/20 passed**.
- `TZ=Europe/Warsaw node --import tsx --test src/features/home/tabs/homeProgressProjections.test.ts src/features/home/tabs/activityModel.test.ts` — **21/21 passed**.
- `TZ=America/New_York node --import tsx --test src/features/home/tabs/homeProgressProjections.test.ts` — **15/15 passed**.
- `node --import tsx --test src/application/activityReadModels.test.ts src/features/home/tabs/activityModel.test.ts src/features/home/tabs/homeProgressProjections.test.ts src/features/home/tabs/progressPresentation.test.ts src/tracks/coding-interview/rcAlgorithmsBootstrap.test.ts scripts/mutationArchitecture.test.ts src/features/exam/examReadOwner.test.ts` — **59/59 passed**.
- `npm run typecheck` — **passed** (`tsc --noEmit`).
- `git diff --check` — **passed**.

Metro, native builds, Maestro execution, and the full baseline were not run by design.

## Risks and limits

- The RC check validates the checked-in YAML text and ordering; it does not execute Maestro.
- The Practice CTA uses an existing navigation route but was not native-tested in this correction.
- The date tests cover the requested Monday and DST boundaries in Warsaw and New York; other timezone databases are not exhaustively exercised.
