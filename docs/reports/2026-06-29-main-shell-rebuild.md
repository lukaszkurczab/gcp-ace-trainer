# 2026-06-29 — Main Shell Rebuild

## Objective

Replace the old GCP/exam-centered layout with a track-first Patternly shell that can support a commercial MVP without preserving stale standalone routes.

## Scope Implemented

- Rebuilt `HomeScreen` into a shell with `Home`, `Practice`, `Progress`, and `Settings` tabs.
- Removed standalone `SelectTrack`, `Analytics`, and `Settings` routes from `RootNavigator`.
- Kept exam, focused practice, mistakes review, attempt history, and answer review as nested Cloud Certification flows.
- Moved track selection into the shell Home tab.
- Rehomed progress and settings into shell tabs.
- Kept Algorithms visible as a draft track and blocked session start until content/scoring exists.
- Added shared components:
  - `AppShellHeader`
  - `BottomTabBar`
  - `SettingsGroup`
- Added stable `testID` and accessibility labels to `TrackCard` / `BottomTabBar` for Maestro capture flows.
- Removed stale UI artifacts:
  - `src/features/tracks/SelectTrackScreen.tsx`
  - `src/features/analytics/AnalyticsScreen.tsx`
  - `src/features/analytics/AnalyticsCharts.tsx`
  - `src/features/settings/SettingsScreen.tsx`
- Removed chart-only dependencies that no longer have consumers:
  - `react-native-chart-kit`
  - `react-native-svg`

## Files Changed

- `package.json`
- `package-lock.json`
- `src/components/AppShellHeader.tsx`
- `src/components/BottomTabBar.tsx`
- `src/components/SettingsGroup.tsx`
- `src/components/index.ts`
- `src/components/training/TrackCard.tsx`
- `src/constants/routes.ts`
- `src/features/home/HomeScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`
- deleted `src/features/analytics/AnalyticsCharts.tsx`
- deleted `src/features/analytics/AnalyticsScreen.tsx`
- deleted `src/features/settings/SettingsScreen.tsx`
- deleted `src/features/tracks/SelectTrackScreen.tsx`
- deleted `src/features/tracks/index.ts`

## Documentation Updates

- Updated `docs/17-commercial-mvp-redesign-plan.md` with the current implementation status, verification state, and rule against reintroducing standalone `SelectTrack`, `Analytics`, or `Settings` routes.
- Updated `docs/reports/2026-06-29-track-foundation-slice.md` with a supersession notice for the temporary standalone `SelectTrackScreen`.

## Current Behavior

- The app opens directly to the Patternly shell.
- Cloud Certification remains the default active track.
- Cloud practice, exam simulation, and review flows remain reachable from the Practice tab.
- Algorithms can be selected in the Home tab, but shows explicit draft/empty states instead of starting a fake session.
- Settings and Progress are shell tabs, not stack destinations.

## Non-Goals

- No dark-first Focus Lab token migration in this slice.
- No Algorithms content, scoring, or session runner.
- No track-aware attempt storage migration.
- No account, subscription, backend, or sync work.

## Verification

Verification performed:

```txt
npm run typecheck          pass
npm test                   pass, 17 tests
npm run validate:questions pass, 360 total questions, 0 errors
maestro test               pass, 7 screenshots
```

Maestro evidence:

- Flow: `.maestro/screenshot-capture/patternly-main-shell.yaml`
- Artifact manifest: `artifacts/maestro-uiux/patternly-main-shell/2026-06-29-1110/manifest.md`
- Screenshots:
  - `01-home-cloud.png`
  - `02-practice-cloud.png`
  - `03-progress-cloud.png`
  - `04-settings-cloud.png`
  - `05-home-algorithms.png`
  - `06-practice-algorithms-draft.png`
  - `07-home-cloud-restored.png`

## Risks and Follow-Up

- `HomeScreen` is intentionally a transitional shell. More logic should move into track/session modules as Algorithms and track-aware progress are implemented.
- Existing attempt and practice records are still Cloud/GCP-shaped. Progress is rehomed visually but not yet semantically track-aware.
- Focus Lab styling is still incomplete; this slice prioritizes canonical navigation and stale artifact removal.
