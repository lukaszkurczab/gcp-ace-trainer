# Design References

## Status

Files in this directory are visual reference material for future UI implementation. They are not a pixel-perfect implementation contract and should not be copied 1:1.

The current canonical product direction is defined by:

- `docs/03-navigation-and-flows.md`,
- `docs/05-design-system.md`,
- `docs/06-branding-and-style-direction.md`,
- `docs/14-learning-effectiveness-model.md`,
- track-specific learning-system docs.

If an individual design conflicts with those documents, with current repository behavior, or with verified product constraints, the canonical docs and repository evidence win.

## Implementation Rule

Final implemented layouts should reach at least **90% design-reference alignment** with the relevant screens in this directory, while remaining internally consistent across the app.

This means:

- preserve the screen purpose, information hierarchy, primary action, density, and interaction model from the selected reference;
- preserve the visual direction, spacing rhythm, typography scale, and component language after normalizing them through the shared design system;
- do not copy inconsistent one-off values, duplicated patterns, fake metrics, conflicting colors, or screen-local layout decisions from separate references;
- prefer one coherent app-wide layout system over exact reproduction of mismatched reference screens;
- adapt copy, metrics, empty states, and unavailable states to current product truth and repository behavior.

## 90% Alignment Checklist

For every UI implementation batch that uses these references, the report should include a short checklist covering:

- selected reference screen(s),
- preserved screen job and primary action,
- preserved top-level layout structure,
- preserved core component hierarchy,
- preserved visual tone and density,
- intentional deviations with rationale,
- responsive/mobile fit,
- accessibility and text-overlap verification,
- Maestro screenshot evidence where applicable.

The target is high fidelity to the reference direction, not blind duplication of every pixel.
