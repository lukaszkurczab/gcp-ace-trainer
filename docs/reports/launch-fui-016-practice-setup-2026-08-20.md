# FUI-016 — Custom Practice setup presentation — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Approved reference: `04A · Manage Practice Settings · Coding` (`55:2172`)

The approved reference defines the Coding practice-settings shell with compact
session-length controls, uppercase section labels, muted supporting copy, and
compact single-choice rows. The repository implementation keeps the runtime's
canonical `Custom Practice` title, explicit feedback timing, accessibility
descriptions, and `Start session` command; it does not introduce the reference's
unowned focus-area or settings-save semantics.

## Repository implementation

- `src/features/practice/PracticeSetupScreen.tsx` now applies the compact
  Figma presentation only to Coding `Custom Practice`: 54 px length controls,
  48 px feedback rows, 20/8 px radio geometry, uppercase labels, compact
  typography, and the repository light/dark choice tokens.
- Existing `AppShellHeader`, route ownership, session configuration, feedback
  semantics, and test IDs remain canonical. The previous spacious option path
  remains for other practice modes because their information density and
  immutable configuration differ.
- Compact feedback details remain in the accessibility label while the visual
  row stays aligned with the approved reference.
- Figma's decorative topography/glow assets were not copied from expiring
  remote URLs; the slice is therefore structural/control parity, not a claim
  of full decorative parity.
- Added `PRACTICE-SETUP-PRESENTATION-001` to the canonical product contract and
  mapped it to the existing practice setup presentation test.

## Maestro confirmation

The capture-only `visual-shell.yaml` flow passed on the local iOS 18.6
simulator in both regular light and regular dark themes after rebuilding the
debug app. Each run completed Home → Practice → Custom Practice → active
session → exit decision → partial summary → Settings → Appearance and captured
six checkpoints.

Evidence is local and intentionally not a release sign-off:

- Dark final run: `artifacts/maestro-screen-capture/fui-visual-confirmation/2026-08-20-1525/updated-dark-final/`
- Light final run: `artifacts/maestro-screen-capture/fui-visual-confirmation/2026-08-20-1525/updated-light-final/`
- Representative Custom Practice screenshots were manually inspected after
  the run; no clipped controls or broken path state was observed.
- Android, large text, physical devices, release binaries, and final design
  authority approval remain unverified.

## Verification

- `npx expo run:ios --device "Maestro_IOS_iPhone-16-Pro_18"` — build and install passed (one existing Xcode dependency-analysis warning).
- Maestro visual-shell flow — passed in light and dark iOS regular variants; 6/6 checkpoints each.
- `npm run typecheck` — passed.
- `npm run gate:contract-change -- HEAD` — passed.
- Focused contract, visual-shell, practice-config, and practice-flow tests — 50/50 passed.
- `git diff --check` — passed.

This bounded slice does not claim whole-product Figma parity, Storybook
completion, provider/store readiness, physical-device evidence, or launch
approval. Exact-SHA CI evidence is still pending for the commit containing it.
