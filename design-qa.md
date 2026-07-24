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

---

# T42 — Custom Practice design QA

## Comparison target

- Source visual truth: `docs/designs/algorithms_custom_practice/t42-custom-practice-flow-reference.png` (SHA-256 `c1e07903190b93ceafbd231bcef803911aa9f03fbd723b9e47eb48ff7be27e73`).
- Native implementation: iPhone 17 simulator, iOS 26.4, dark appearance, regular text size.
- Captures: `artifacts/maestro-screen-capture/custom-practice-t42/2026-07-24-1020/screenshots/screenshots/custom-practice__t42__010__setup__dark__ios-regular.png`, `artifacts/maestro-screen-capture/custom-practice-t42/2026-07-24-1020/screenshots/screenshots/custom-practice__t42__020__runner__dark__ios-regular.png`, and `artifacts/maestro-screen-capture/custom-practice-t42/2026-07-24-1020/summary/screenshots/custom-practice__t42__030__summary__dark__ios-regular.png`.
- Interaction evidence: the capture selected the 10-item at-session-end configuration, submitted all ten durable responses, and reached the canonical completed result with feedback review.

## Fidelity review

- The approved dark visual language is applied through the existing app theme: near-black background, elevated charcoal cards, muted secondary text, violet selection borders, and a single violet primary action.
- Setup preserves the reference's hierarchy of title, bounded configuration controls, and a clear start action. The selected values remain legible with a non-color border and radio state.
- Runner preserves the high-contrast timer/progress/question/answer/action sequence. Answer controls are full-width, touch-safe cards; the primary action remains fixed at the bottom.
- Summary presents score, answered/unanswered totals, and a readable review stack on the same card and action vocabulary as the reference.

## Canonical constraints applied

The reference's multi-topic chips, difficulty selector, timer toggle, free navigator, and in-run correctness are not copied because they conflict with the already approved Custom Practice contract: one explicit mental unit, profile-owned reinsert, sequential lifecycle, and the selected `atSessionEnd` feedback withholding. These are deliberate behavior boundaries, not visual defects.

## Findings

No actionable P0, P1, or P2 visual defects were found in the setup, runner, or summary comparison. No UI source change was required: the owned `src/features/practice/` implementation already uses the approved dark tokens, rounded card surfaces, text hierarchy, and action placement. The reference registration and ownership mapping make this review the authoritative visual target for future changes.

final result: passed
