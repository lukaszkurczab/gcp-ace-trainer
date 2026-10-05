# N08-B03 v3 correction QA

**Verdict: PASS for the bounded correction.** The changed i002 answer now includes the stable request identity needed to resolve a retry to the approval already committed, while atomically retaining its exception and control evidence. The other17 whole objects are unchanged from the prior full review and remain reusable.

## Bound inputs and checks

- Current frozen proposal: `review-inputs/N08-B03-v3.json`, SHA-256 `74ac35a41d3045172ee281c0aa6819a4fc275b627ee7882ee1d981bb85e6d4a1`; proposal bytes match the frozen copy.
- Prior review: `SEMANTIC-N08-B03-v2-QA.json`; its only finding was i002 retry identity. The other17 current whole objects are exactly equal to that reviewed v2 snapshot.
- Current source bytes match the source SHA bound by the manifest; see the JSON report for exact path and hash.
- The actual content validator/scorer reports18 valid items,18 correct keys,54 incorrect distractors,18 correct keys after reversing options, and no feedback-target mismatch.

## i002 correction

The revised prompt supplies a stable request ID reused by a retry and says a retry after commit must return the first approval. The accepted operation commits one approval per request ID with its named exception and required control evidence, then returns that approval on retry. This closes the v2 gap where an approval could be duplicated because the key did not identify the committed request. The question ID remains `ood-n08-b03-i002`: the primary decision remains the same atomic approval state. The accepted option ID changes from `owner_preserves_contract` to `owner_preserves_contract_retry_i002_v3`, reflecting the added retry-result meaning. No transport-level exactly-once guarantee is inferred.

This pass is limited to the correction; it does not accept other units, source activation, producer/history, runtime/admission, native/Premium or full BIZQ-01.
