# UX findings

1. **P2 — inaccessible automation semantics for active session.** `OBSERVED`: the visible title “Continue active session” is only part of a combined accessibility label (“Continue active session, Continue or deliberately abandon the active session., Continue”). A text selector failed; the full composite label succeeded. This is brittle for end-to-end tests and likely less concise for assistive technology.
2. **P2 — Details verification gap.** `OBSERVED`: Reason is visible and Details starts collapsed, but no stable dedicated ID was available to prove expansion/collapse and read the full content reliably in a sequential audit flow.
3. **P3 — clipped audit scope at phone size.** `OBSERVED`: question choices extend beneath the fold at 402×874; scrolling is required to view all choices and feedback. No clipping of visible text was observed, but long-content and dynamic-type coverage remains absent.
4. **P2 — terminology is partially explainable but incomplete.** `OBSERVED`: Home and Practice clearly identify Algorithms and the next topic. `INFERRED`: because Cloud Certification is absent, users cannot assess the promised multi-track distinction from the running product.
