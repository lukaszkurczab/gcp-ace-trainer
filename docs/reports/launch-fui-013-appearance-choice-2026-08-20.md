# FUI-013 — Appearance Choice previews — 2026-08-20

## Authority

- Figma file: `Patternly Library` (`kZXD7cNBKUU7x0ceTHPFpR`)
- Connected channel: `eon17bsz`
- Pattern QA: `QA instance / Pattern / Appearance Choice / Light` (`622:5202`)
- Canonical pattern: `Pattern / Appearance Choice` (`619:5237`)
- Canonical variants: System (`619:5222`), Light (`619:5227`), Dark (`619:5232`)

The live Figma context defines an appearance-specific radio row with a 60×48
preview, 14 px horizontal/vertical row padding at repository scale, responsive
copy, and a trailing single-choice control. System and Dark use the dark
preview palette; Light uses the light canvas/surface and dark text bars. The
preview is decorative and must not enter the accessibility tree.

## Repository implementation

- `src/components/ChoiceRow.tsx` now exposes the used `appearancePreview`
  variant and renders the repository-owned System/Light/Dark preview geometry.
- `src/features/home/AppearanceSettingsScreen.tsx` passes the canonical
  appearance variant; `LanguageSettingsScreen` remains on the plain choice row.
- `src/theme/tokens.ts` owns the preview colors for both light and dark app
  modes; no remote Figma asset or live Figma dependency was added.

Existing preference persistence, async-save locking, radio semantics, and
deterministic test IDs remain unchanged. This slice does not claim whole-product
visual parity, physical-device evidence, store readiness, or final launch
approval.

## Verification

- `npm run typecheck` — passed.
- `node --import tsx --test tests/settingsPresentation.test.ts tests/loadingStateOwnership.test.ts` — 13/13 passed.
- `git diff --check` — passed.

Exact-SHA CI evidence is pending for the commit containing this slice.
