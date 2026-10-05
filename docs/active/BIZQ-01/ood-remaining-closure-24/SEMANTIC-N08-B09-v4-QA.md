# Independent semantic review: N08-B09 v4

**Verdict: REVISE.** The corrected prompts and option presentation address the v3 answer-leak and repeated shortest-key cue. However, the v4 set changes the primary decision from assigning retry/idempotency responsibility to an object boundary to choosing the scope of a retry identifier. All 18 items keep their previous question IDs and reuse `owner_preserves_contract` for that changed accepted meaning.

## Inputs and method

- Frozen v4 proposal: `review-inputs/N08-B09-v4.json`, SHA-256 `9e0251f2010279f88ca52d7e0e039dafae7f342ebd02152294c89662c973df71`.
- Frozen v3 comparison: `review-inputs/N08-B09-v3.json`, SHA-256 `960bf89a2f3a3d8fa9a91b587957b7c0e452a2c77b476b116274b7955938a4cf`.
- Source manifest: `N08-N09-MANIFEST.json`, SHA-256 `0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612`; the bound source `OOD-N08-B09.json` is SHA-256 `093bdea05d1a2e9854c474025fea368aac46a1c70f57f4a8371c990f0461e15d`.
- N08/N09 contract: `N08-N09-CONTRACT.json`, SHA-256 `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`.
- I reread all 18 manifest before objects and v4 whole objects, comparing prompts, key, alternatives, Reason, Details and feedback against both the prior authored version and source. I checked production validation/scoring, every option, reversed order and target-ID sets. The checker receipt is `INDEPENDENT-CHECK-N08-B09-v4.json`.

## Finding: primary decision and identity changed

The before questions ask the learner to decide where retryable behavior and its invariant belong: in an object boundary whose owner can enforce it, or in a coordinator, exposed representation, altered subtype or speculative indirection. The accepted answer says to put the retry key or idempotent transition at that enforcing object boundary.

The v4 questions instead ask which identifier to reuse for a retry: one request/operation ID, a broader resource ID, a fresh ID per attempt, or an inferred rejection. That is a useful adjacent question about idempotency-key scope, but the object ownership decision is no longer asked or answered. For example, i001 changes from ownership of the passenger-visible effective-sequence invariant to operation-ID versus platform-ID scope. i014 changes from object responsibility for a traceable invoice reissue to reconciling an uncertain issue ID before a later reissue. The shared retry topic and scenario domain do not preserve the primary decision.

This applies to all 18 items (see `perItemIdentityFindings` in the JSON report). Under the existing contract, each needs either a restoration of the original owner/boundary decision or a corresponding reserved question ID and a fresh accepted option ID for the new decision. This review does not prescribe which repair to author.

The specifically protected i014 retry/idempotency facet remains present: the invoice exchange can accept before a reply is lost, and a corrected issue is kept distinct after reconciliation. The question does not promise exactly-once external delivery. That supported facet does not resolve the identity mismatch.

## Resolved v3 presentation findings

The v4 prompts no longer tell the learner that a retry must reuse the same ID. They give stable operation identifiers, uncertain acknowledgements and a distinct later action, then ask for the policy. The accepted option is not consistently the shortest: it is longest in 8 items and intermediate in 10. The fresh-ID, resource-wide-deduplication and silence-means-rejection alternatives are recognizable, plausible misconceptions whose consequences are tied to each case. I found no independent repeated length/form cue that blocks them.

## Verification

The independent check passed **18/18 validation, 18/18 keyed answers, 54/54 distractors, 18/18 after option reversal, 18/18 feedback target coverage, and 18/18 source bindings**. Those results confirm the encoded key and bindings; they do not establish question-identity continuity.

Checker: `INDEPENDENT-CHECK-N08-B09-v4.mjs`, SHA-256 `3d30cc10533153f15591f6e6640c2c63d8d9e20e7f8761f37bbba2869a6e6948`.

This is a scoped N08-B09 v4 review, not acceptance of the full N08/N09 cohort, source activation, producer, consumer, admission/runtime, native/Premium, or full BIZQ-01.
