# B-01 — Design/tooling and asset audit

Date: 2026-08-09
Scope: repository evidence for the B-01 boundary only; no product, asset, or
tooling implementation was changed.

## Decision

**B-01 is partially evidenced, not complete.** The repository establishes the
current Expo/build baseline and the status of its visual evidence, but it does
not establish a compatible Storybook integration, provenance/licensing for
local visual assets, or Figma write access. Do not install Storybook or begin
target visual implementation from this report.

## Confirmed repository facts

| Area | Evidence | Audit result |
| --- | --- | --- |
| Platform/build graph | `package.json` uses Expo `~57.0.11`, React Native `0.86.2`, React `19.2.3`, and `main: expo/AppEntry`; `app.json` declares automatic appearance, portrait phones, iOS 16.4 and Android 28/36; `metro.config.js` configures `react-native-svg-transformer`. CI regenerates native projects with `npx expo prebuild --no-install --clean` in `.github/workflows/qa.yml`. | The present baseline is Expo-managed with a custom SVG source transform. |
| Tokens and components | `src/theme/tokens.ts` contains hand-authored Light/Dark colours, spacing, radius, typography, and shadows. `src/components/` provides shared primitives; `src/components/Icon.tsx` maps the 17 local SVGs. | These are implementation tokens/primitives, not the final repository-owned design-system handoff required by docs 05/06. |
| Icons, fonts, and product assets | Tracked source visual files are 17 SVGs in `src/assets/icons/` and six historical PNGs under `docs/designs/`. `git ls-files` finds no tracked TTF/OTF/WOFF files, and `package.json` has no `expo-font` dependency. `app.json` has no source `icon`, `splash`, adaptive-icon, or monochrome-icon declaration. | The app currently uses platform/default typography and a small local icon set. There is no canonical mark, wordmark, app-icon master, font package, illustration system, or public/store asset source. |
| Screenshots and Maestro | The repository tracks 32 `.maestro/*.yaml` flows, including 15 capture flows. The test suite reads named flows (for example `tests/algorithmsSessionDryRunRegressionMaestro.test.ts`); no Maestro screenshot artifact is tracked because `artifacts/` is ignored. `docs/designs/README.md` identifies all retained design PNGs as previous-contract historical evidence only. | Flows are reachable test/QA inputs; screenshot outputs are non-versioned historical evidence and cannot be target visual approval or release baselines. |
| Historical visual paths | `docs/designs/README.md` marks the directory historical. `docs/designs/product-direction-options/DESIGN.md` and `docs/designs/account_lifecycle/DESIGN.md` explicitly supersede their previous-contract authority. The contract validator and `tests/canonicalProductContract.test.ts` still consume the historical registry/provenance. | No deletion is justified in B-01: the paths have declared provenance and live validation/repository references. They must remain non-authoritative until the replacement work proves a safe removal. |
| Licensing/provenance | `git ls-files` finds no tracked `LICENSE`, `NOTICE`, or attribution/source record for the local UI SVGs or historical PNGs. Separately, `src/content/bundled/generatedAlgorithmFeedbackAssets.ts` is a hash-pinned educational feedback asset whose content-source path and SHA-256 are recorded by `scripts/syncBundledContentRelease.mjs`; it is not a brand asset. | UI-icon and historical-image provenance/license evidence are absent from the repository. The generated feedback diagram has content provenance, but that does not establish a reusable brand-asset license record. This is a handoff/release risk, not proof that any asset is unlicensed. |

## Storybook and Figma capability

### Storybook

There is no `storybook` package, configuration, story file, script, or release
exclusion check in the current repository. The canonical contract requires a
development-only entry that renders production components through typed
fixtures, and requires Storybook to be absent from release graphs and bundles
(`docs/05-design-system.md`; `docs/canonical-product-contract.yaml`). The
current Expo/Metro configuration is useful compatibility context, but it is
not evidence that a particular Storybook version/configuration works with this
SDK 57 / React Native 0.86 baseline or can be release-excluded.

**B-01 technical conclusion:** the only contract-compatible approach is a
separate development-only entry/target with typed fixtures and a future static
release-graph proof. Exact dependency/configuration selection remains
unverified and must be proven by the later approved Storybook implementation;
this task explicitly does not install it.

### Figma — X-09 condition

The available tool registry for this execution environment contains **no
Figma connector or write-capable Figma tool**. No Figma file URL, file key,
connected account, or successful write response was available. A local Figma
skill description alone is not evidence of authenticated file access.

**X-09 is unmet.** It is satisfied only when the Product Owner provides an
authorized Figma connector/file context and a write operation can be performed
and evidenced against the controlled Brand Lab, Design System, or Product
space. Until then, B-02 must not claim actual Figma exploration or owner visual
approval.

## Risks and required successor evidence

1. **High — target brand asset gap:** final mark/icon/wordmark/type/track
   symbols and their editable/local exports do not exist. B-02/B-05 must not
   substitute historical rasters or the current generic icon set for approved
   brand authority.
2. **High — provenance gap:** add source and license records when a final
   asset/font is selected; do not infer rights from a file being present.
3. **Medium — visual regression gap:** current Maestro flows are executable
   state evidence, but their ignored captures are not reproducible checked-in
   baselines. Later DS/UX work must create contract-compliant baselines and
   compare them on both platforms.
4. **Medium — build isolation gap:** no Storybook release-exclusion proof
   exists. Any later integration must prove both the Expo-compatible dev target
   and its absence from production bundles before it becomes a design-system
   dependency.

## Assumptions deliberately not promoted to facts

- The existing SVGs may be original project work; the repository does not
  record enough provenance to confirm it.
- The ignored Maestro captures may accurately depict the listed dates; their
  untracked status prevents them from serving as canonical reproducible
  evidence.
- A future Storybook version may support this Expo baseline; no local proof was
  found.

## Verification and next task

- Passed: `node --import tsx --test tests/canonicalProductContract.test.ts`
  (26/26).
- Repository checks: tracked-asset/license inventory; Storybook/Figma search;
  Maestro-flow inventory; historical-reference reachability scan.
- Not run: device capture or a Storybook build (neither is in B-01 scope).
- Note: `npm test -- --test-name-pattern='canonical product contract'` invokes
  the package's full test glob rather than a narrow test; it reached 556 passes
  and 23 failures where sandboxed server tests cannot bind `127.0.0.1`
  (`EPERM`). It is not used as B-01 verification.

**Next task:** B-02 may begin only after the X-09 Figma access condition is
met; it should use the above asset/provenance inventory and retain historical
references solely as provenance, not as target authority.
