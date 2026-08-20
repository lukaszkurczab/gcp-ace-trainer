# FUI-009 — Screen Header / outlined Icon Button — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Screen Header` (`456:5317` dark, `456:5685` light)
- Canonical component: `Icon Button` (`153:836`), outlined navigation variant (`242:2301`)
- Canonical icon: `Icon / Chevron Left` (`144:829`)

The live Figma context and screenshots define a 44 px touch target, a centered
36 px outlined visual treatment, a 12 px radius, and a 20 px chevron. The dark
QA border/icon tokens are `#1E293B`/`#F1F5F9`; the light QA tokens are
`#E3EAE9`/`#102433`. Pressed state uses the elevated dark surface `#0F172A`
and the corresponding light surface token.

## Repository implementation

- `src/components/IconButton.tsx` is now the canonical outlined icon action.
- `src/components/AppShellHeader.tsx` consumes it for every shared back action;
  the old 48 px pill and rotated right-chevron path were removed.
- `src/theme/tokens.ts` owns the light/dark `iconButton` semantic tokens.
- `tests/visualShell.test.ts` verifies the 44/36 geometry, accessibility owner,
  canonical left-chevron, and pressed-state contract.

Runtime navigation destinations and existing back behavior are unchanged. This
slice does not claim full Screen Header composition, Storybook coverage, device
parity, store readiness, or final launch approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/visualShell.test.ts tests/algorithmsSessionAccessibility.test.ts` — 19/19 passed.
- `npm run gate:contract-change` — passed.
- `npm run validate:runtime-privacy-boundary` — passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
