# FUI-014 — Retained Content / Empty State — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Retained Content Status / Light` (`518:5157`)
- Canonical pattern: `Pattern / Retained Content Status` (`516:5153`)

The live Figma context defines a transparent, centered status primitive with
20 px horizontal padding, 32 px vertical breathing room, 16 px separation,
14/17 semibold title, and 14/22 muted supporting copy. It intentionally does
not render a competing card surface; recovery actions, when a runtime state
requires one, remain explicit below the copy.

## Repository implementation

- `src/components/EmptyState.tsx` is now the canonical centered retained/
  unavailable status primitive with Figma-matched semantic colors and
  responsive centered text.
- The former elevated card, border, left alignment, and heading/body scale
  were removed because they competed with the prepared status pattern.
- Existing explicit unavailable and empty-state consumers retain their titles,
  descriptions, and optional actions; action buttons now use the full content
  width and remain visible rather than becoming hidden fallbacks.
- `src/theme/tokens.ts` owns the light/dark empty-state colors and status
  typography tokens.

This slice does not claim whole-product visual parity, physical-device
evidence, store readiness, provider operations, or final launch approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/loadingStateOwnership.test.ts tests/settingsPresentation.test.ts tests/visualShell.test.ts tests/algorithmsSessionAccessibility.test.ts` — 34/34 passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
