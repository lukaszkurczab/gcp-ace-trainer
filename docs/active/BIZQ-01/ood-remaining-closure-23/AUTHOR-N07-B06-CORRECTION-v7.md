# N07-B06 v7 explanation correction

Removed only the exact repeated boundary sentence from 17 ErrorCorrection fields, corrected the i014 wrong_4 diagnosis to match the signed-delta alternative, and added a case-specific retained-observation requirement for i016 so the existing traceability answer is supported.

- Frozen input: `5eafc6852700e0efd4a14e6419146ead10314a261c067fd575e581a977a76cfd`
- Current proposal: `18b0c6e2f3b783d35482f68d3c14703300a8ce8991a9dda0db5b5a13984a2287`
- Parsed-object leaves changed: 20.
- Mechanical check: **PASS**, 18 objects and 90 original/reversed option score cases. This confirms schema, score, and target bindings only; semantic review is independent.

The 17 suffix removals affect i001–i006 and i008–i018; i007’s distinct explanation remains unchanged. i014 wrong_4 now names the signed-delta bypass of the separate reversal/positive-amount allocation path. i016 now explicitly requires retaining the observation used to explain refund eligibility; the key and existing traceability message are then supported by that fictional scenario fact.
