# BIZQ-01 Q12 — measured feedback text height implementation

## Status

The bounded source and test implementation is frozen for independent QA. Root-owned native comparison is pending; this report does not claim the one-physical-pixel margin has passed on-device, nor does it claim full Q12 or full BIZQ-01 acceptance.

## Change

`PracticeFeedbackBlock` now renders authored feedback messages and the existing `detailLines` through one local `FeedbackText` path. Its child takes the first positive finite React Native `onLayout` frame, rounds that frame up to the next physical pixel, and adds one more physical pixel:

```text
ceil(measuredHeight × physicalScale) / physicalScale + 1 / physicalScale
```

The child keeps the existing shared body style and `maxFontSizeMultiplier={2}`. Its one-shot measurement closure ignores subsequent layout callbacks, so applying the minimum does not cause incremental growth. An internal key includes the text, window width, font scale, and physical scale, resetting the measurement when that layout context changes. The outer list keys remain `kind:targetId` and `detail:index`, avoiding collisions between repeated strings.

The temporary item-specific callbacks, console marker, item ID gate, and `minHeight: 221` diagnostic were removed. `Reason`, disclosure behavior, source links, reporting, message order/text, scoring, session state, and navigation are unchanged. The content, font cap, and native dependencies are unchanged.

## Verification

The focused feedback and accessibility tests passed 28/28 under Node 22. They cover the captured floating-point boundary, invalid initial frames, one-shot growth protection, context-key changes, the actual component layout callback through a small hook/JSX harness, stable sibling keys, and both feedback body paths.

`npm run typecheck`, `npm run validate:content-boundary`, and `npm run validate:runtime-privacy-boundary` passed under Node 22. The focused test also verifies that the development probe marker, item-specific gate, and diagnostic 221-point minimum are absent from the delivered component. `git diff --check` passed.

The earlier 221-point native experiment showed five measured lines and a complete visible sentence, but that diagnostic does not prove the smaller formula works. Root owns the required native recapture of the same saved result at maximum text in light and dark, plus an ordinary Large-size control, with navigation and the result unchanged. Native acceptance remains pending.

## Changed files

- `src/features/practice/PracticeFeedbackBlock.tsx`
- `src/features/practice/feedbackTextHeight.ts`
- `src/features/practice/feedbackTextHeight.test.ts`
- `src/features/practice/practiceFeedbackDelivery.test.ts`
- `docs/active/BIZQ-01/native-presentation-28/IMPLEMENTATION.md`
- `docs/active/BIZQ-01/native-presentation-28/IMPLEMENTATION.json`
- Four `WORKER-*.log` files in this packet record the final focused tests, typecheck, and boundary checks.

The check logs do not include the transient first test-harness failures. Those were harness binding issues (the extracted JSX initially lacked the measurement helper and window-dimension bindings), not source failures; the final harness passes. No raw device or user data is included in the logs.

## Exact bindings

Hashes for source, tests, and verification logs are recorded in `IMPLEMENTATION.json`. Native comparison inputs remain in the diagnostic event/screenshot artifacts linked by `DIAGNOSTIC-MINHEIGHT-PROBE.json`; no native claim is inferred from the synthetic component harness.
