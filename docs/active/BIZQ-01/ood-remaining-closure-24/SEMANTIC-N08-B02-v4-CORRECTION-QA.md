# N08-B02 v4 correction QA

**Verdict: PASS for the bounded correction.** The three revised distractors now contradict the respective visible case facts, with fresh option IDs and messages that diagnose those exact failures. The 15 unchanged whole objects reuse the v3 review findings after byte-level canonical comparison.

## Bound inputs and checks

- Current frozen proposal: `review-inputs/N08-B02-v4.json`, SHA-256 `33c0cbc1cd355618a5b55f2cd423e6f66a7014ce61b08fa9cf7fb317f6f09fe8`; proposal bytes match the frozen copy.
- Prior review: `SEMANTIC-N08-B02-v3-QA.json`; it identified only i011, i013 and i015 as one-best-answer gaps. The other15 current whole objects are exactly equal to that reviewed v3 snapshot.
- Source path and manifest SHA are bound in the JSON report; current source bytes match the manifest.
- The actual content validator/scorer reports18 valid items,18 correct keys,54 incorrect distractors,18 correct keys after reversing options, and no feedback-target mismatch.

## Changed items

- **i011:** The former read-only copy alternative was replaced with a refund-only replacement that drops the inspection condition and evidence. That now directly violates the visible requirement to preserve inspection facts. The new option ID and message identify that loss.
- **i013:** The global notification queue alternative was replaced with sending a notification before acceptance and retaining it if acceptance fails. That can announce a comment that never became accepted; the new diagnostic states this precise problem. The keyed operation remains bound to author and revision on the accepted comment.
- **i015:** The global invoice queue alternative was replaced with a seller-only response key. The prompt requires each response to remain attached to the matching submitted invoice copy, and a seller-only key can attach a delayed result to a corrected copy. Its fresh option ID and message diagnose that collision.

All three retain their question IDs and accepted option ID `owner_preserves_contract`; only feedback and interaction choices changed in these objects. The remaining15 objects are byte-equivalent to the reviewed v3 snapshot. This is a bounded correction verdict, not acceptance of the full unit, source activation, producer, runtime/admission, or full BIZQ-01.
