# Ordering-feedback scope QA

**Verdict: PASS for this bounded scope expansion.** The scanner reproduces a concrete authored-feedback inconsistency in the current content. It does not establish that every match is a defect or that all FESD ordering questions need remediation.

I reran `scan-ordering-feedback.mjs` against content HEAD `90a1d83859c2be83c5266ffe981f487d3c29aeeb`. Its JSON output matched `CURRENT-ORDERING-FEEDBACK-SCOPE.json` byte for byte. The frozen scope file SHA-256 is `5837d026d706e600d4fc8f642c5e0ebe5fd743ed9dc307d08c1abb9def62422b`. The live result contains 1,018 distinct question rows, all in `frontend-system-design-interview`. The predicate is narrow and reproducible: an ordering question's `wrong_element` message targets its accepted first element and contains “first or only step would hide”.

The recorded `fesd-n10-b04-i003` row is a true example, not a false positive. Its accepted sequence starts with `observe`; its prompt asks the learner to order the evidence path; and its feedback for `observe` says treating it as the “first or only step” would hide the required boundary. Since the answer explicitly puts `observe` first, that diagnostic contradicts the keyed answer. The row's source SHA-256 (`c01c09776696a48ee9586712a1eaec4fa65e4b22524487cd0a9cec7633e822a2`) matches the current `FESD-N10-B04.json` bytes.

This finding is about authored diagnostic-to-answer consistency. The current Design Interview projection selects `broken_relation` messages for ordering responses and does not return `wrong_element` messages, so this check alone does not show that the contradictory text is currently displayed to learners. It also does not verify the other feedback in these questions, determine whether each whole question should change, or establish a native/runtime defect. Review each matched question's full prompt, answer, and feedback before deciding a repair; do not apply a bulk text replacement based only on this predicate.

Verification: `node --check docs/active/BIZQ-01/closure-review-18/scan-ordering-feedback.mjs` passed; a fresh live scan matched the frozen scope exactly. No source, scanner, or sample files were changed for this review.
