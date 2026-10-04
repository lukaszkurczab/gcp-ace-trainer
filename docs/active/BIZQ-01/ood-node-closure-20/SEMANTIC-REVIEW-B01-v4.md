# Bounded semantic re-review: OOD-N04-B01 v4

**Verdict: PASS for this frozen unit proposal.** Proposal `review-inputs/v4/OOD-N04-B01.json`, SHA-256 `670ce78a087186d771a49916eba32a8b6756fbe91dbc58efb3de5fefd8b19b2d`; notes SHA-256 `d81eaf3a68cd14b6f5d220ecc80160c547166b64f3a986a7766e3ef47190083e`. The preservation record binds one changed leaf, `ood-n04-b01-i024.feedback.details.boundaryOrTradeoff`, and confirms all other i024 leaves, the other 17 questions and notes are unchanged.

The new sentence says the screen may display expiry but needs the grant's read-only access decision and cannot use expiry to extend the grant. This is grounded in the prompt's stated read-only role and fixed expiry. It no longer asserts an unstated “full effective-state rule” or implies an unmentioned revocation policy. It also matches the key: the screen consumes an access query at a supplied instant rather than administering a grant.

This closes the only open finding from the prior bounded review chain: i020/i033 passed in v3, and i024's unsupported Details assertion is removed in v4. The 17 exact unchanged item findings and all remaining unchanged i024 fields are reused. This is not a fresh whole-unit rerun or a cross-unit/source/runtime acceptance claim.
