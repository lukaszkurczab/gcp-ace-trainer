# FUI-010 — Settings Section / List Row — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Settings Section` (`456:4995` dark, `456:5365` light)
- Canonical pattern: `Settings Section` (`163:903`)
- Canonical row: `List Row` (`155:900`), supporting text shown

The live Figma context and screenshots define the grouped row contract used at
200% text: 12 px inter-element spacing, 16 px horizontal padding, 14 px
vertical padding, 32 px leading icon container with an 8 px radius, 12 px row
radius, 14/21 semibold title, 11/15 regular supporting text, and a 20 px
trailing chevron. Dark tokens are `#0E1B31` row / `#0F172A` icon surface /
`#F1F5F9` primary; light tokens are `#FBFDFC` row / `#F7FAF9` icon surface /
`#102433` primary.

## Repository implementation

- `src/components/ListRow.tsx` applies the Figma geometry and responsive text
  contract to its existing `variant="grouped"` path.
- `src/components/SettingsGroup.tsx` now uses the canonical 8 px spacing
  between individually rounded rows instead of a competing wrapper card.
- `src/components/IconTile.tsx` exposes the repository-owned `settings` tone
  for the 32 px leading icon treatment.
- `src/features/home/tabs/SettingsTab.tsx`,
  `src/features/home/SettingsInformationScreen.tsx`, and
  `src/features/home/NotificationSettingsScreen.tsx` consume the settings
  tone and 20 px trailing chevron where the Figma pattern applies.
- `src/theme/tokens.ts` owns the light/dark `listRow` semantic tokens and
  14/21 + 11/15 typography tokens.

Existing settings navigation callbacks, selection behavior, and storage/error
states are unchanged. This slice does not claim full screen-header adoption,
Storybook coverage, physical-device evidence, store readiness, or final launch
approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/settingsPresentation.test.ts tests/visualShell.test.ts tests/algorithmsSessionAccessibility.test.ts` — 21/21 passed.
- `npm run gate:contract-change` — passed.
- `npm run validate:runtime-privacy-boundary` — passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
