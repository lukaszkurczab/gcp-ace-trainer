# N08-B08/B09 v3 QA metadata erratum

This additive erratum preserves the original v3 review reports and corrects two report-metadata statements from direct checks of the frozen inputs.

- Both reports’ Markdown listed the contract hash as `00c20d8c…`, which is the contract’s bound guidelines digest. The actual raw SHA-256 of `N08-N09-CONTRACT.json` is `6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27`. The companion JSON reports and `INDEPENDENT-CHECK-N08-B08-B09-v3.json` already bind that actual file hash.
- The B09 v3 Markdown said keyed choices “are now last in their option arrays.” Direct frozen-array check shows the keyed choice is at index 0 for all18 current B09 items (`position0: 18`). The same check shows the keyed choice is strictly shortest for all18. This review does not treat the stored array order as learner exposure because the independently accepted app presentation correction randomizes displayed options; the shortest-choice finding remains a distinct content-form observation.
- B09 i014 identity rationale: the manifest before object says a rejected invoice must be reissued, traceably and without double-charging; the current object covers a possible acceptance followed by a lost acknowledgement, with the same stable issue ID returning the recorded result. The outcome certainty changed, but the primary decision remains operation-identity/idempotency at the retry boundary, so SAME_ID is supported. This is consistent with the canonical N08-B09 facet control and makes no exactly-once transport claim.

No proposal, source, verdict, or original report was changed by this erratum.
