# FUI-008 — Bottom Navigation implementation evidence

**Status:** `PARTIAL` — bounded implementation slice complete; whole-product design handoff remains open.

## Authority

- Figma file: `kZXD7cNBKUU7x0ceTHPFpR`
- Connected channel: `eon17bsz`
- Canonical component: `Navigation / Bottom Item` (`140:777`)
- Dark QA instance: `QA instance / Pattern / Bottom Navigation` (`456:5327`)
- Light QA instance: `QA instance / Pattern / Bottom Navigation` (`456:5695`)

The live Figma contract specifies a 24 px icon, 11 px Inter caption with
15.4 px line height, 4 px icon/label gap, 8 px vertical padding, 20×2 px active
indicator, 60/66 px unselected/selected minimum heights, a 12 px pressed radius,
and a 200% text QA state. The QA instances are 393×116 at 200% text and retain
the four product destinations. Their specimen copy says `Home`, while the
repository's product contract remains the source of truth for runtime labels
and routes.

## Repository change

- `src/theme/tokens.ts`: added repository-owned Light/Dark navigation semantic
  tokens and the 11/15 navigation caption token.
- `src/components/BottomTabBar.tsx`: mapped surface/border/active/muted colors,
  24 px icons, 20×2 active indicator, 60 px item minimum, 8 px vertical
  padding, pressed state, and 200% text scaling while preserving existing
  accessibility roles, selectors, and navigation callbacks.
- `tests/algorithmsSessionAccessibility.test.ts`: updated the structural
  accessibility contract to require the Figma geometry and 200% multiplier.

No route, label, session, content, storage, entitlement, or provider behavior
was changed. No obsolete runtime path was retained or added.

## Verification

Passed locally:

- `npm run typecheck`
- focused accessibility and shell tests: 17/17
- `npm run gate:contract-change`
- `npm run validate:content-boundary`
- `npm run validate:runtime-privacy-boundary`
- `git diff --check`

The full local suite reached all 610 tests; 586 passed. Twenty-four HTTP tests
could not bind `127.0.0.1` in the restricted sandbox and failed with `EPERM`.
This remains an environment limitation and requires canonical CI confirmation.

Not yet evidenced by this slice: device screenshot parity, screen-reader run,
physical iOS/Android behavior, complete DES-02 handoff, or whole-product visual
QA. The next task remains the continuation of DES-02 token/asset/license
reconciliation, followed by DES-03 canonical primitives.
