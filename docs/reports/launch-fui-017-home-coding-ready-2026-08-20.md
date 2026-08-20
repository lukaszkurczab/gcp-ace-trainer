# FUI-017 — Home · Coding · Ready presentation — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Approved reference: `02A · Home · Coding · Ready` (`55:445`)
- Repository reference: `docs/designs/figma-home-coding-ready/DESIGN.md`

The approved reference defines a compact Home shell: 28 px page title,
short track context with a 22 px icon tile and Change action, and a bordered
next-practice card with a 44 px icon tile, 22/28 title, 14/22 detail, compact
action, and centered secondary action.

## Repository implementation

- `HomeScreen` now lets the loaded Home surface own its Figma-shaped content
  shell without the route-level branded header; loading and unavailable states
  retain the canonical `AppShellHeader` recovery owner.
- `HomeTab` now uses repository-owned light/dark navigation tokens for the
  track context, compact card, active rail, icon tile, action geometry, and
  secondary topic action.
- The existing recommendation model, resume guards, `Change track` route,
  `Choose another topic` route, test IDs, and disabled/unavailable behavior are
  unchanged. The reference's illustrative overview metrics and `Manage
  settings` CTA were not invented because the current Home contract does not
  expose those values/actions as canonical runtime commands.
- The approved Figma node is now registered in the canonical design-reference
  registry and owns only `src/features/home/HomeScreen.tsx` and
  `src/features/home/tabs/HomeTab.tsx` for the design-change gate; unrelated
  Home UI changes still require their own approved reference.

## Maestro confirmation

After rebuilding the debug iOS app, the capture-only visual-shell flow passed
in both regular light and regular dark variants on
`Maestro_IOS_iPhone-16-Pro_18` (iOS 18.6). Each run completed all six
checkpoints: Home, Custom Practice, active session, partial summary, Settings,
and Appearance. The Home screenshot was manually inspected after the final
mint action correction.

Evidence:

- Dark: `artifacts/maestro-screen-capture/fui-visual-confirmation/2026-08-20-1525/fui-017-dark-final/`
- Light: `artifacts/maestro-screen-capture/fui-visual-confirmation/2026-08-20-1525/fui-017-light-final/`

This is simulator evidence for the bounded slice, not whole-product visual
sign-off. Android, large text, physical devices, release binaries, and final
design-authority release evidence remain open.

## Verification

- `npx expo run:ios --device "Maestro_IOS_iPhone-16-Pro_18"` — build/install passed; one existing Xcode dependency-analysis warning.
- Maestro visual-shell — passed, 6/6 checkpoints in light and dark iOS regular variants.
- `npm run typecheck` — passed.
- `npm run gate:contract-change -- HEAD` — passed.
- Focused Home, contract, track-presentation, shell, and large-text tests — 41/41 passed.
- `git diff --check` — passed.

FUI-017 does not claim the illustrative Figma overview metrics are implemented
or that the commercial launch gate is satisfied.
