# 2026-06-29 — Track Foundation Slice

## Supersession Notice

This report documents the first implementation slice. The later main shell rebuild on 2026-06-29 supersedes the temporary standalone `SelectTrackScreen` route. Track selection now lives inline in the main shell, and the `SelectTrackScreen` files were removed to avoid preserving a stale navigation path.

## Objective

Start implementing the commercial MVP plan by adding the first code-level multi-track foundation without rewriting existing GCP exam and practice flows.

## Scope Implemented

- Added shared track/domain contracts:
  - `TrackId`
  - `TrackDefinition`
  - `SessionModeDefinition`
  - `TrackTaxonomy`
  - `ContentManifest`
  - `TrainingItemType`
- Added static `trackRegistry` with:
  - `cloud-certification` as the active default track,
  - `algorithms` as an explicit draft track.
- Added new Patternly storage key:
  - `patternly.activeTrack`
- Added active-track storage helpers:
  - `getActiveTrackId`
  - `saveActiveTrackId`
- Added reusable `TrackCard` as the first shared training component.
- Added `SelectTrackScreen` and route.
- Updated `HomeScreen` to read active track context and show Cloud-specific actions only for the Cloud Certification track.
- Added registry contract tests.
- Kept the registry free of `react-native` / theme imports so domain tests can run outside the app runtime.

## Files Changed

- `src/domain/index.ts`
- `src/domain/tracks/index.ts`
- `src/domain/tracks/trackRegistry.ts`
- `src/domain/tracks/types.ts`
- `src/constants/routes.ts`
- `src/constants/storage.ts`
- `src/storage/localStorage.ts`
- `src/components/index.ts`
- `src/components/training/index.ts`
- `src/components/training/TrackCard.tsx`
- `src/features/tracks/index.ts`
- `src/features/tracks/SelectTrackScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`
- `tests/trackRegistry.test.ts`

## Documentation Updates

Documentation was updated in this report.

No source-of-truth product decision changed in this slice. The implementation follows the existing plan in `docs/17-commercial-mvp-redesign-plan.md`.

## Current Behavior

- Cloud Certification remains the default track.
- Existing GCP exam and practice flows remain reachable.
- Algorithms can be selected as a draft track, but does not start a fake or fallback session.
- Home shows an explicit draft state for Algorithms and does not silently fall back to Cloud actions.

## Non-Goals

- No bottom-tab navigation yet.
- No dark-first Focus Lab restyle yet.
- No Algorithms content pack or scoring yet.
- No attempt/progress migration yet.
- No storage migration beyond the new active-track key.

## Verification

Verification performed:

```txt
npm install              pass
npm run typecheck        pass
npm test                 pass, 17 tests
npm run validate:questions pass, 360 total questions, 0 errors
```

`npm install` was required because `node_modules` was absent and `tsc` / `tsx` were unavailable. It completed successfully and reported 23 dependency vulnerabilities. They were not fixed in this slice because `npm audit fix` can change dependency versions and should be handled as a separate dependency/security task.

Expo dev server check:

```txt
npm start -- --port 8081 --localhost   fail
npm start -- --port 19000 --localhost  fail
```

Both attempts failed inside Expo CLI / `freeport-async` with `RangeError [ERR_SOCKET_BAD_PORT]`, after attempting to listen on port `65536`. No local dev URL was available from this run.

## Risks and Follow-Up

- `trackRegistry` currently includes minimal display metadata because it feeds the first track-aware UI. It must not import React Native or app theme modules. If this grows, split pure domain contracts from UI presentation metadata.
- Active track storage is new and safe, but existing attempt/review/progress records are still GCP-specific.
- The Algorithms track is intentionally draft. The next implementation slice must add original content, scoring, and session logic before enabling its session modes.
- The next UI slice should continue extracting reusable components rather than adding screen-local cards/rows.
