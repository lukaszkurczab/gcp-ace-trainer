# Native 28 — one-variable minimum-height probe

## Purpose

This is a temporary diagnostic comparison for the already-confirmed Q12 native clipping on the completed review item. It changes only the development probe text's minimum height. It is not a product fix and does not establish the underlying React Native layout cause.

## Exact change

In `src/features/practice/PracticeFeedbackBlock.tsx`, the text style for the single probe message is now:

```tsx
style={[styles.detailText, isProbeMessage ? { minHeight: 221 } : undefined]}
```

`isProbeMessage` remains gated by `__DEV__`, the exact item `gcp-ace-gcpace-n01-b03-001`, and a `wrong_option` message targeting `D`. The prior observed frame was 219.9998779296875 points high, so this sets a diagnostic minimum one point above that measurement. It leaves text, font size/cap, available width, font scale, details state, scoring, and session data unchanged. All other feedback text receives no extra style.

## Comparison to collect

The root owns the existing iPhone and Metro run. Repeat the same completed wrong-D review at the same dark appearance and Large accessibility setting. Capture the existing `[native28-layout-probe]` events and a screenshot. Compare the target Text frame height, measured line records, and visible final words with the previous capture. Do not submit or create another session.

If the extra minimum height changes the rendered result while width, font scale, and authored text remain the same, that supports a vertical frame-sizing sensitivity. If the text remains clipped, it weakens the finite-height hypothesis; the probe does not justify increasing product height or changing typography. In either case, retain the capture as diagnostic evidence and return to review before making a product change.

## Existing observations this isolates

The prior native event stream reported a 328-point text width and a 219.9998779296875-point frame. `onTextLayout` reported four complete 44-point lines, including the full final line `organization-wide attachment scope.` The screenshot still clipped the visible final line at `organization-wide attachme…`. The prior event stream is evidence of a measurement/rendering mismatch, not proof of its cause. This probe varies only the minimum frame height to test the remaining finite-height hypothesis.

## Scope and status

This remains development-only instrumentation for BIZQ-01 Q12. No authored copy, font policy, native dependency, SDK, runtime configuration, or persisted state changes. The code is frozen for the root-owned native comparison. Remove this temporary minimum-height override and the earlier layout instrumentation after the diagnostic is complete, before any product implementation is proposed.

## Bindings

- Source before this one-variable change: `src/features/practice/PracticeFeedbackBlock.tsx`, SHA-256 `55dc674cba289014cc9ae71af75b0754abaf20fa36e73a8b122b29e1f34ed586`.
- Source with the temporary minimum-height comparison: `src/features/practice/PracticeFeedbackBlock.tsx`, SHA-256 `4a61b24e7a4fd60a4e14b1c189bacb76d996070adffa5bce83d97fe9a404f4e2`.
- Prior native event stream: `NATIVE-LAYOUT-EVENTS.jsonl`, SHA-256 `ea37aa084ae2da140672dcade59835b00b776b0d93511e8450296f0501b17218`.
- Prior instrumented screenshot: `screens/diagnostic-instrumented-dark-message.png`, SHA-256 `6b3868dd8dd47586e43a17e364fe2e5a23e77975e9ce1f397e466f4ff8989c29`.
- The changed code is one style-array entry relative to the frozen instrumented source; the root owns bundle refresh, device capture, and interpretation.
