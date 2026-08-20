# FUI-012 — Processing State / LoadingState — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Processing State` (`584:5107` dark, `584:5114` light)
- Canonical pattern: `Processing State` (`580:5099`)

The live Figma context and screenshots define a centered, reflowing pending
state: a 28 px status icon with a 1 px success border, 28 px title line,
14/22 supporting text, and no fixed-height or clipped copy. Dark tokens are
`#081328` status surface / `#34B564` status border / `#F1F5F9` primary icon and
title / `#AAB6C8` supporting text; light tokens are `#F3F7F6` / `#287A4B` /
`#102433` / `#506472`.

## Repository implementation

- `src/components/LoadingState.tsx` remains the single generic pending
  primitive and now follows the Processing State geometry, centered responsive
  copy, and explicit busy progress semantics.
- `src/theme/tokens.ts` owns the light/dark `processing` semantic tokens and
  the 22/28 + 14/22 typography scale.
- The existing thirteen `LoadingState` consumers retain their route behavior,
  error handling, and copy; no duplicate processing component was introduced.
- The previous Card-shaped pending surface was removed because it conflicted
  with the prepared Figma pattern's transparent, centered layout.

This slice does not claim whole-product visual parity, Storybook completion,
physical-device evidence, store readiness, provider operations, or final
launch approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/loadingStateOwnership.test.ts` — 9/9 passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
