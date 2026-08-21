# DES-003 — Figma authority revalidation — 2026-08-21

## Scope and result

This is a read-only revalidation of the current Figma source and the two
bounded implementation references already used by FUI-016 and FUI-017. It
confirms that the recorded nodes are still accessible and structurally usable.
It does not create Product Owner approval, close the external
`design-authority` release gate, or claim whole-product parity.

## Current source

| Field | Evidence |
| --- | --- |
| File key | `kZXD7cNBKUU7x0ceTHPFpR` |
| Top-level pages | `0:1` Page 1; `118:738` Patternly Library |
| Library root | `118:738` |
| Home reference | `55:445` — `02A · Home · Coding · Ready` |
| Practice reference | `55:2172` — `04A · Manage Practice Settings · Coding` |
| Connected channel | `eon17bsz` |

## Connector evidence

The official Figma connector returned successfully on 2026-08-21 for:

- document page listing;
- metadata for the library root and both reference nodes;
- design context and screenshots for `55:445` and `55:2172`.

The live context preserves the expected design contracts:

- Home: 393×852 shell, 28 px title, track context, bordered next-action card,
  44 px icon tile, compact metrics and bottom navigation;
- Practice: 393×852 shell, compact 54 px session controls, 48 px choice rows,
  20 px radio controls, uppercase section labels, and a bottom save action.

The context also returned the component descriptions and semantic token
references for the canonical icon, button, choice, segmented-control, and
navigation components. This confirms source availability, not approval of
every runtime state.

## Repository mapping checked

- `src/features/home/HomeTab.tsx` remains the canonical Home implementation.
  It preserves the current product contract and runtime actions instead of
  copying illustrative Figma-only labels or metrics.
- `src/features/practice/PracticeSetupScreen.tsx` remains the canonical
  Practice setup implementation. Its compact Coding path preserves the
  bounded Figma geometry while retaining real route, feedback, accessibility,
  and session semantics.
- Historical FUI-016 and FUI-017 reports remain immutable evidence for their
  implementation slices; this report records only the fresh authority check.

## Remaining gate

`design-authority` is still `not_evidenced`. The following are not established
by connector access alone:

- Product Owner approval bound to the current launch scope and exact release
  candidate;
- complete approved states for all launch verticals, Light/Dark/System,
  large text, reduced motion, and failure/accessibility states;
- current-SHA visual comparison and signed-distribution evidence.

The safe next visual action is focused parity verification for the approved
bounded references after the owner approval checkpoint. Physical-device
verification may be collected optionally, but is not a launch condition. No broad UI
rewrite or Figma write action is authorized by this revalidation.

## Verification

- Figma metadata: pass for the document, library root, Home reference, and
  Practice reference.
- Figma design context: pass for `55:445` and `55:2172`.
- Figma screenshots: pass for both bounded references.
- Source mapping: pass by direct inspection of the canonical Home and Practice
  setup components.
