# N07-B07 v5 read-plan disambiguation

Added neutral case-specific caller limits to six reviewed ambiguous read-plan items and corrected their causal details/option feedback. In i013, replaced the viable lazy-proxy alternative with a concrete early-read violation and issued a fresh distractor ID.

- Frozen input: `a3748cdb5ee1d91b334ece3a85ee7b61a061e9c25feef282aac496e20de485f7`
- Current proposal: `107f75af667532aaae86ee824ae1d4e4f39423b08928af307b8e02881bc1f0bd`
- Parsed-object leaves changed: 38.
- Mechanical check: **PASS**, 18 objects and 90 original/reversed option score cases. This confirms schema, score, and target bindings only; semantic review is independent.

Only i001, i002, i003, i004, i011, and i013 changed. The added budgets and scope facts are local hypothetical caller contracts, not global query-count rules or claims about Patternly production workloads. i013’s changed alternative now evaluates history before its separate view is requested; its option and diagnostic IDs were both updated.
