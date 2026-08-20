# DES-002 — repository assets, tokens, and licensing audit

## Status

`PARTIAL` — repository-owned implementation evidence is present, but the
asset/font rights record required for commercial release is not present.

This audit records the current repository truth. It does not infer a license
from a file being committed, from Figma access, or from Product Owner visual
approval.

## Authority and implementation boundary

- Final visual source: Figma `Patternly Library`, file key
  `kZXD7cNBKUU7x0ceTHPFpR`, connected channel `eon17bsz`.
- Repository implementation authority: `src/theme/tokens.ts`,
  `src/assets/brand/**`, `src/assets/icons/**`, `assets/brand/**`, and the
  production components that consume them.
- No Figma URL, connector call, or remote asset is used by the Expo build or
  CI. A source checkout is sufficient for runtime assets.

## Evidence matrix

| Requirement | Repository evidence | Result |
|---|---|---|
| Final vector masters | 8 mark masters under `src/assets/brand/mark/`, 3 app-icon SVG masters under `src/assets/brand/app-icon/` | verified present |
| Launcher exports | `assets/brand/app-icon/patternly-app-icon*.png` and `assets/brand/web/favicon.png` | verified present; covered by `tests/brandAssets.test.ts` |
| Small-size geometry | `*-micro.svg` masters and QA-A render/comparison evidence under `docs/brand/qa-a-reconstruction/` | verified present |
| Typed semantic palette | `colors.light`, `colors.dark`, and `brand` in `src/theme/tokens.ts` | verified present |
| System appearance | `AppPreferencesProvider` resolves `appearance: system` to the platform color scheme; runtime tokens remain Light/Dark | verified present |
| Typography tokens | `typography` in `src/theme/tokens.ts`; no bundled font files or `expo-font` dependency | verified; platform font only |
| Figma independence | no Figma runtime import or build dependency; repository-owned paths are used | verified by source inspection and existing contract/build checks |
| Font/license/source records | no tracked `LICENSE`, `NOTICE`, attribution, or asset provenance record for the brand/icon SVG and PNG files | missing; release blocker |

## Rights boundary

The SVG/PNG files were added as Patternly brand assets in commit `cb211c2` and
the design documentation identifies the approved QA-A source. That proves
repository provenance, not commercial usage rights. A Product Owner or legal
owner must supply an explicit rights statement (or a third-party license and
attribution record) before DES-02 can become `VERIFIED`.

No bundled font license is required for the current implementation because the
app uses platform typography and does not ship font files. This must be kept
true unless a future approved design handoff adds a font package.

## Verification

- `npm run typecheck` — passed.
- `npm run validate:runtime-privacy-boundary` — passed.
- `npm test` — 619/619 passed in the unrestricted local environment.
- `git diff --check` — passed.
- Maestro visual-shell — Light and Dark each 48/48 commands completed; the
  evidence pack is recorded under `artifacts/maestro-screen-capture/`.

## Remaining closure

DES-02 remains `PARTIAL` until the owner/legal source record is supplied and
the final asset set is rechecked against it. This is a genuine human/legal
gate; no runtime fallback, placeholder license, or inferred permission is
added.
