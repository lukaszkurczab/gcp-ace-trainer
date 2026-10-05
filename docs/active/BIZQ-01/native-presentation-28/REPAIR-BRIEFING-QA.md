# Independent review — Q12 measured feedback text height repair

**Verdict: PASS for the proposed implementation approach.** The plan addresses the reproduced complete-diagnostic readability defect with a local layout correction, keeps the existing text and font cap, and reserves actual native confirmation for implementation QA.

The controlled comparison supports the height-sensitive explanation. At the same text width and font scale, the baseline Text frame was `219.9998779 pt`, its events showed four 44-point lines, and the visible sentence was clipped. A target-only `minHeight: 221` yielded a `220.9998779 pt` frame, five 44-point lines, and the complete authored sentence in the screenshot. This does not prove every UIKit or React Native internal detail, but it is sufficient evidence to test a small content-frame rounding correction.

The proposed local `FeedbackText` covers the two Details body paths that share the affected style: authored feedback messages and `detailLines`. Measuring once and using `ceil(height × physicalScale) / physicalScale + 1 / physicalScale` gives the observed `219.9998779 pt` frame a `220.3333 pt` minimum at scale 3—more than the one-pixel shortfall suggested by the capture, without adopting the probe’s 221-point value as a product dimension. A non-null guard prevents a layout-state growth loop; a context-sensitive React key resets the measurement when the text or text-size geometry changes. The installed React Native iOS source also uses `NSLineBreakByClipping` when `numberOfLines` is unset, consistent with the observed last-line behavior. That source fact supports the diagnosis but does not replace the planned native comparison.

I found no proposal-level blocker. During implementation, preserve each sibling’s existing stable identity/index in its React key and append the text/width/font-scale/device-scale measurement context so duplicate strings cannot collide. Also describe the first `onLayout` value as the initial measured frame rather than an intrinsic-content-size API. These are implementation details, not reasons to widen scope.

The planned math/lifecycle and consumer tests should cover the physical-pixel rounding boundary, one-time measurement, reset on text/width/font-scale/scale changes, and no repeated minimum-height growth. The root-owned native check at maximum supported text in both themes, plus the ordinary Large check, remains necessary to show the exact `+1 physical pixel` implementation works; the previous `+1 pt` diagnostic does not establish that smaller margin by itself. Preserve the text, `maxFontSizeMultiplier={2}`, Details disclosure, sources, and navigation, and remove all target-specific callbacks and `minHeight: 221` instrumentation.

## Proposal scores

| Criterion | Score | Reason |
| --- | ---: | --- |
| Fit | 0.96 | Directly addresses a native-rendered clipping defect while keeping the authored explanation and current accessibility cap. |
| Simplicity | 0.85 | One local component shared by the two related Details body paths; no global Text wrapper or SDK patch. |
| Risk | 0.84 | A one-pixel margin is small and bounded, with explicit key resets and no repeated growth; the exact smaller margin still needs native confirmation. |
| Maintainability | 0.84 | Pixel rounding and lifecycle are testable in isolation, and ownership stays within the existing feedback component. |

This is a design review only. It does not claim implementation, native repair, Q12, or full BIZQ-01 acceptance.

## Reviewed bindings

- `REPAIR-BRIEFING.md`: `8ad1f1872172325019bdcc2d2b57ae84c3dea0bb0876f1bd52f3a2bd4085b52f`
- `DIAGNOSTIC-REVIEW.md`: `1175b77549e729fcf31d7c7e61ed88b10497faa0c51882082fde5514b78d6360`
- `DIAGNOSTIC-REVIEW.json`: `31d6e7e88ff4eac2d07fbd93a48c9e10aca4ec188186f247ba54af8bc3fa9e83`
- Baseline layout events: `ea37aa084ae2da140672dcade59835b00b776b0d93511e8450296f0501b17218`
- Added-height layout events: `cc69bcea14942a02135c3b287ed6868e40e220efb0c88ad4bd47ede294dc315b`
- Baseline screenshot: `6b3868dd8dd47586e43a17e364fe2e5a23e77975e9ce1f397e466f4ff8989c29`
- Added-height screenshot: `0d74a0aceab262d39521fbbb31655729b3d28ed195cd9ea608e1c601fcd3d813`
- `PracticeFeedbackBlock.tsx` diagnostic source: `4a61b24e7a4fd60a4e14b1c189bacb76d996070adffa5bce83d97fe9a404f4e2`
- Installed React Native `RCTTextShadowView.mm`: `040b5376d1ff63f9f5d0bbbe5f322aa7179b68c4129b10897a5ad9558f0414b5`
