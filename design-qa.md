# T32 — Simulation navigator design QA

## Comparison target

- Source visual truth: `docs/designs/algorithms_simulation_navigator/t31-simulation-navigator-reference.png` (1024 × 1536).
- Rendered implementation: `artifacts/maestro-screen-capture/simulation-navigator/2026-07-23-1200/screenshots/screenshots/t32__020__question-navigator.png` (1206 × 2622; iPhone 17 simulator at native capture density).
- State: active question 1; navigator open; 0 saved responses and 39 unanswered.
- Interaction verified: tapping the accessible active-question control opens a modal navigator. The Maestro hierarchy reports forty buttons in reading order, from `Question 1, current` through `Question 40, unanswered`.

The source is a desktop design board containing a phone-frame example; the implementation capture is an unframed native phone viewport. The comparison therefore uses the sheet content, not the board chrome or device frame. The simulator had a larger Dynamic Type scale and the app's light appearance enabled. The approved reference explicitly permits a four-column large-text adaptation, and the app's existing token system intentionally supplies both light and dark palettes.

## Fidelity surfaces

- Typography: the implemented heading, summary, numeric cells, and labels preserve the reference hierarchy. Larger native text switches the grid to four columns without truncation.
- Spacing and layout rhythm: the sheet is bottom-anchored with a drag handle, 16px-equivalent rounded top corners, 48px minimum cells, and 8px grid gaps. The 4-column layout is the documented large-text variant.
- Colors and tokens: current, saved, and unanswered states use the canonical primary, success, and border tokens. The inspected capture is light-mode; the source board illustrates dark-mode tokens.
- Images and icons: the existing close SVG is reused; the reference does not require any raster imagery.
- Copy and content: the sheet presents the required title, answered/unanswered totals, question numbers, and accessible state labels. It does not expose correctness, score, flags, progress bars, or finalization controls.

## Findings

No actionable P0, P1, or P2 fidelity differences. The light-mode capture and 4-column grid are expected environment variants rather than design drift. The state-specific saving, incomplete-response, and retry presentations are covered by focused component/state tests; no production failure was induced for a visual capture.

## Comparison history

1. Initial capture did not connect after the simulator reset because Metro was not running. The local Expo dev server was started; this was an environment issue, not a UI defect.
2. The first runnable capture used visible text for the opener, but the accessible parent owns the label. The capture flow was corrected to target `Open question navigator, Question 1`.
3. The final capture opened the navigator and recorded all 40 accessible cells. No UI fix was required after visual comparison.

## Implementation checklist

- [x] Separate modal navigator, not an inline active-screen grid.
- [x] Current, answered-and-saved, and unanswered cell states.
- [x] Accessible cell labels and reading-order rendering.
- [x] Dynamic Type 5-to-4 column adaptation.
- [x] Explicit incomplete-response and save-failure/retry feedback.

## Follow-up polish

- Capture the answered/saving/failure variants with a deterministic failure fixture when such a product-owned fixture exists; this is evidence breadth only, not an implementation gap.

final result: passed
