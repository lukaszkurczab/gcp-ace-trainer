# N08-B05 v3 correction QA

**Verdict: PASS for the bounded correction.** The sole revised Details leaf now agrees with the prompt and key: learner plus exercise revision identify a completion, while policy is stored with its accepted score. The other17 whole objects are unchanged from the prior full review and remain reusable.

## Bound inputs and checks

- Current frozen proposal: `review-inputs/N08-B05-v3.json`, SHA-256 `ba8349e503dcfe6e6c58ef7cb1af63b312d2b8239c4ef0813f14716dede97677`; proposal bytes match the frozen copy.
- Prior review: `SEMANTIC-N08-B05-v2-QA.json`; the only finding was i011’s contradictory `scenarioApplication`. The other17 current whole objects are exactly equal to that reviewed v2 snapshot.
- Current source bytes match the source SHA bound by the manifest; the JSON report records the exact path and hash.
- The actual content validator/scorer reports18 valid items,18 correct keys,54 incorrect distractors,18 correct keys after reversing options, and no feedback-target mismatch.

## i011 correction

The previous `scenarioApplication` incorrectly said the completion key included learner, exercise revision, and score policy, despite the prompt/key using learner plus revision as identity and storing policy alongside the score. The v3 leaf now says the map key uses learner and exercise revision and the accepted completion record stores policy with its score. The primary decision, question ID, accepted option ID, prompt, alternatives and other explanation fields are unchanged. No new identity or data-model rule is introduced by this review.

This is a bounded correction verdict only; it does not accept the whole N08/N09 cohort, source activation, producer, runtime/admission, native/Premium or full BIZQ-01.
