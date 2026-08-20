# FUI-011 — Choice Group / accessible radio rows — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Choice Group` (`456:4983` dark, `456:5353` light)
- Canonical pattern: `Choice Group` (`163:886`)
- Canonical row: `Choice Row` (`141:838`), comfortable density
- Canonical control: `Control / Radio` (`132:48`)

The live Figma context and screenshots define a mutually exclusive radio group:
72 px minimum row height, 14 px horizontal padding, 12 px vertical padding,
12 px row radius, 12 px row gap, a 20 px radio with 2 px stroke and an 8 px
selected dot, plus 14/21 semibold title and 11/15 supporting text at the
repository scale. Dark active/border/surface tokens are `#20C997`/`#1E293B`/
`#0E1B31`; light tokens are `#0F766E`/`#E3EAE9`/`#FBFDFC`.

## Repository implementation

- `src/components/ChoiceRow.tsx` is the canonical accessible radio row with
  `accessibilityRole="radio"` and an explicit selected state.
- `src/features/home/PreferenceSelectionScreen.tsx` now renders a labelled
  `radiogroup` of `ChoiceRow` instances; the existing async save lock and
  preference callback remain unchanged.
- `src/theme/tokens.ts` owns the light/dark `choice` semantic tokens.
- `tests/settingsPresentation.test.ts` verifies the group semantics, 72/20/8
  geometry, and deterministic option test IDs.

The former trailing “Current” badge/list-row path was removed because it did
not expose the mutually exclusive control semantics required by the design.
This slice does not claim full Storybook coverage, physical-device evidence,
store readiness, or final launch approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/settingsPresentation.test.ts tests/visualShell.test.ts tests/algorithmsSessionAccessibility.test.ts` — 23/23 passed.
- `npm run gate:contract-change` — passed.
- `npm run validate:runtime-privacy-boundary` — passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
