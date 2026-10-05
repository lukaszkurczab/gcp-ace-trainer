# N08-B06 v4 bounded correction QA

**Verdict: PASS for the frozen B06 v4 correction.** The sole blocking v3 finding, on `ood-n08-b06-i008`, is resolved by the changed visible facts and aligned distractor feedback. The other 17 whole objects match the already reviewed v3 payload exactly and reuse their prior item-level conclusions.

The old stem said that the parent request remains unchanged if either vendor check fails before acceptance. Alt2 published a replacement after the first check and restored the original only if the second failed. That could preserve the final state while briefly exposing an incomplete split, so the old stem did not determine whether this alternative violated the contract.

The v4 stem now says the parent must remain the published, current request throughout both checks and that no intermediate split may be visible. The revised alt2 publishes a temporary replacement after the first check and restores the original if the second fails. It directly conflicts with the visible publication boundary. The updated feedback explains that later restoration does not undo the visible intermediate state. The correct key remains “publish only after both checks pass; stop remaining checks on pre-commit failure,” and the question and answer IDs remain unchanged.

I independently compared the frozen v3 and v4 arrays by the repository’s `canonicalJson` whole-object representation. Exactly i008 changed; 17 questions are byte-semantically identical. Using the production question validator and scorer across all 18 questions yielded 18 valid objects, 18 correct keyed answers, 54 incorrect distractor responses, 18 correct answers after reversing option order, and exact feedback target sets for all 18.

The reproducible check is [SEMANTIC-N08-B06-v4-CORRECTION-CHECK.mjs](SEMANTIC-N08-B06-v4-CORRECTION-CHECK.mjs), with its receipt in [SEMANTIC-N08-B06-v4-CORRECTION-CHECK.json](SEMANTIC-N08-B06-v4-CORRECTION-CHECK.json). Frozen input SHA-256 values: v3 `d214610eb75d80ac03851bb803f920ff6846091b331c163bd6cf98ed3989a341`; v4 `8ba061292da10875ec6b2c1148b4e249d610daf520894d9ba520dae9e52c433a`. The full per-item fingerprints and dispositions are in the companion JSON report.

This bounded PASS resolves the i008 issue recorded in the prior v3 report. It does not claim producer, source activation, runtime, admission, native/Premium, or full BIZQ-01 acceptance.
