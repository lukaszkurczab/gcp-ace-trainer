# FUI-015 — Surface / Bottom Sheet

Date: 2026-08-20  
Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)  
References: `456:5450` (Light QA), `456:5080` (Dark QA), canonical shell `181:1080`

## Scope

The existing `SettingsBottomSheet` is the runtime owner for the settings and
notification information sheets. This slice aligns that owner with the final
Figma shell: semantic elevated light/dark surfaces, exact border/handle roles,
14 px top corner radius, the prepared top shadow, and an explicit modal
accessibility boundary. Existing sheet content, callbacks, safe-area handling,
and scroll behavior remain unchanged.

The Figma purchase and sign-out patterns were not assigned to this component;
no purchase, account, or new action semantics were introduced.

## Repository changes

- Added `bottomSheet` light/dark semantic tokens and the exact `sheet` radius.
- Updated `SettingsBottomSheet` to consume the tokens, use the Figma shell
  shadow, and expose `accessibilityViewIsModal`.
- Added a focused presentation contract test for the shell and tokens.

## Verification

- `npm run typecheck` — passed.
- Focused settings/visual/loading tests — 23/23 passed.
- `npm run validate:runtime-privacy-boundary` — passed.
- `git diff --check` — passed.

This is a bounded presentation slice. It does not claim whole-product Figma
parity, Storybook completion, provider/store readiness, device evidence, or
launch approval.
