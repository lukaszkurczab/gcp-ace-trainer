# Native 28 layout-diagnosis review

## Finding

The `219.9999 pt` frame is numerically close to five reported `44 pt` line heights, but the evidence does not establish a five-line finite-height constraint or explain the confirmed clipping. I would treat it as a hypothesis to test, not a diagnosis.

The instrumented cold-mounted run reports a `328 × 219.9999 pt` frame for the target message and four `onTextLayout` lines, each `44 pt` high. Their combined reported line height is `176 pt`; a fifth line would require `220 pt`, about `0.00012 pt` more than the reported frame. The fourth event contains the complete authored ending, `organization-wide attachment scope.`, at a reported width equal to the `328 pt` frame. The screenshot captured after these layout callbacks visibly cuts the same message horizontally after `organization-wide attachme…`; nearby Details text later shows the full phrase on two lines. The frame probe at the larger text setting returned no Text frame and explicitly marked that separate read unsuccessful.

The frame and line callbacks were captured in the same cold-mounted maximum-text flow before its screenshot, so they are stronger evidence than unrelated measurements. Still, `onTextLayout` reports four lines, not the hypothetical fifth line, and the visible defect is at the right edge. The `5 × 44` coincidence makes a native final-line fit/height-rounding hypothesis plausible: a frame just short of another line box might keep the trailing words from wrapping. It does not prove that mechanism. The source has no explicit `numberOfLines`, ellipsis, or fixed message height, so the measured frame is not evidence of an authored fixed-height cap.

## Smallest useful next experiment

Use the existing development-only probe and same completed review item for a one-variable diagnostic comparison: baseline frame versus a temporary target-only `minHeight: 221` on the message Text, with the maximum text setting applied before opening the review. This adds just over the observed 5×44-point line-box size for the diagnostic run; it is not a product dimension or permanent style. Capture the target Text's `onLayout` and `onTextLayout`, immediate Details/parent frames, and screenshot in each state, grouped by pass. Keep the authored string, `maxFontSizeMultiplier={2}`, theme, selection, Details state, and session unchanged. Do not submit, clear, or recreate the session.

Compare the baseline and expanded-frame screenshots and layout events. If the added point lets the full last phrase wrap and become visible without changing width, that supports a height-sensitive final-line fit hypothesis; if clipping persists, the hypothesis is weakened and the next inspection should focus on text/ancestor clipping or rendering. If native line widths exceed the measured frame, trace the width constraint. This is a diagnostic experiment, not a new acceptance gate or proposed product fix. No cause is confirmed until the comparison distinguishes the outcomes.

## Evidence and limits

- `ROOT-DIAGNOSTIC-OBSERVATIONS.json` — `c5f754d67874138d59348b72f94ffd7f06f06ec99df8cae3d49814be638bf373`
- `NATIVE-LAYOUT-EVENTS.jsonl` — `ea37aa084ae2da140672dcade59835b00b776b0d93511e8450296f0501b17218`
- `screens/diagnostic-instrumented-dark-message.png` — `6b3868dd8dd47586e43a17e364fe2e5a23e77975e9ce1f397e466f4ff8989c29`
- `ROOT-MESSAGE-FRAME-PROBE-THIRD.json` — `83063ed3aeaea0f81d3d2b653532ec2935e18233fff374727666c096402a0217`
- `LAYOUT-PREFLIGHT.md` — `0e9d6cb19149ab0f27b6d2b3bffd5e3a57c9f4e9f6ed55b021b9d60e810974ff`
- `src/features/practice/PracticeFeedbackBlock.tsx` — `55dc674cba289014cc9ae71af75b0754abaf20fa36e73a8b122b29e1f34ed586`
- Screenshot manifest — `dff4bf4bcd45d4f0c2f200003d45ff7f4b39e577a99c2d24f95a5049f291aa97`

The visual clipping is confirmed in the supplied native capture. The near-five-line frame size is a plausible, unconfirmed hypothesis. This review does not propose a product fix or claim Q12/native acceptance.
