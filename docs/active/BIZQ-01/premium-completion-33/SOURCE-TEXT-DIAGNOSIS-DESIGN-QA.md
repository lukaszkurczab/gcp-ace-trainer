# BIZQ-01 max-text Source row — independent diagnosis and repair design

**Verdict: PASS WITH GAPS for the bounded diagnosis and proposed repair; Q12 remains open.** The repeated max-text dark screenshots show an actual text-layout clipping defect in the Source section. The separate timed-out source-target probe is not evidence that the link itself fails.

## Diagnosis

I inspected Q2 max-dark frames 43–45 in the private continuous capture. In all three, the Source heading and the green host text are visibly cut off within their own text rows while the surrounding Details card and Report an issue control remain rendered. The rows are in the middle of the page, above the fixed Next footer. This stable repeated pixel evidence is not explained by the later scroll timeout or by a Next/Source tap collision. It is a presentation defect at maximum text in the native renderer.

The source has a specific gap that matches the pixels. PracticeFeedbackBlock.tsx:17-31 already defines FeedbackText/FeedbackTextLayout: context-keyed remount by text, width, font scale and physical scale, plus the existing one-shot measured minimum height. Expanded authored messages and detail lines use it at lines 50–62. In the same expanded branch, the Source heading, source-host Text, and Source unavailable Text are plain Text nodes without a context key or one-shot measurement. They retain maxFontSizeMultiplier={2}, but nothing gives those rows the small height correction already used for adjacent Details text. The screenshot supports a clipping diagnosis; it does not establish that tapping or opening the link fails.

The corrected-source probe timed out while still in the middle of the page before observing the Source target and restored dark/Large. Treat that as an incomplete scroll/capture attempt only. It neither confirms nor refutes link accessibility or navigation.

## Smallest coherent repair

Reuse the existing FeedbackText for the Source heading, each source host label inside its current Pressable, and the Source unavailable fallback. Supply textMeasurementKey(text, windowWidth, fontScale, windowScale) and physicalScale={windowScale} so the existing keyed reset and one-shot minimum-height policy applies in this layout. Preserve the Pressable's accessibilityLabel, accessibilityRole="link", testID, callback, and host text; keep the translated heading and existing styles. Do not alter the text scale cap, URL behavior, Source data, Details/Report layout, or add a second measurement abstraction. Leave the unobserved source-error message outside this fix.

This is a narrow renderer correction, not a typography redesign. The existing one-shot height helper adds one physical pixel above the rounded first layout height because iOS can clip text at a fractional-pixel boundary. The current fixture already tests its rounding, one-shot behavior, and context-key reset. If the actual row remains clipped after this adaptation, stop and diagnose that measured-height hypothesis instead of adding fixed heights or another fallback.

## Verification conditions

- Extend feedbackTextHeight.test.ts to cover the Source heading, source-host text, and unavailable fallback using the real FeedbackText adapter with context keys that change with text/width/font scale/physical scale. Verify the outer Pressable retains its accessible name, link role, test ID, and handler; keep the helper's existing one-shot rounding test.
- Re-run the narrow feedback text and practice presentation tests plus typecheck.
- After implementation, use only the retained Q2 session at the same index/attempt count. At maximum text in dark, expand Details using an unobscured target, capture the Source heading and full host glyphs, and verify the intended link node is exposed. Do not submit or press Next. If ordinary scrolling cannot expose the complete row, report the remaining product defect instead of declaring it fixed.
- Read back and restore the initial simulator appearance/text size. Compare only the relevant learning-state baseline; elapsed foreground timer changes are expected and must not be reported as answer/session mutation.
- Keep the timed-out mid-page probe marked incomplete. Do not claim link-opening success from it.

## Scores

| Dimension | Score | Reason |
| --- | ---: | --- |
| Objective and architecture fit | 0.98 | Directly repairs the confirmed max-text clipping in the canonical Details Source rows. |
| Simplicity | 0.94 | Reuses the existing keyed measurement component on three currently unmeasured text paths. |
| Risk | 0.88 | Preserves link semantics and source behavior; validation remains tied to the existing saved Q2. |
| Maintainability | 0.95 | Removes inconsistent text-layout treatment within one shared feedback block without new infrastructure. |
| **Minimum** | **0.88** | Above the 0.8 threshold. |

## Reviewed inputs

- Private frames 43–45 under /private/tmp/bizq33-resume-2026-10-07/q2-max-dark/dark/artifacts/2026-10-07_101736/BIZQ33 repaired Q2 max text continuous overlapping page/takeScreenshot/.
- src/features/practice/PracticeFeedbackBlock.tsx:17-31, 47-62, 68-81.
- src/components/textLayoutHeight.ts:1-27.
- src/features/practice/feedbackTextHeight.test.ts:10-31, 34-109.
- Parent-provided note that the corrected-source probe timed out mid-page and restored dark/Large.

This review is read-only. It confirms a visible Source text defect and approves the proposed minimal repair design only; no source edit, device action, or native link-opening result is claimed.
