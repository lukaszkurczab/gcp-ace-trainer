# N07-B07 v6 bounded correction

This correction addresses the five reviewer-confirmed read-plan ambiguities in i002, i003, i004, i011, and i013. The aggregate/projection decisions and all question IDs remain unchanged. i001 and the other 12 question objects are exact v5.

- Frozen v5 input: `107f75af667532aaae86ee824ae1d4e4f39423b08928af307b8e02881bc1f0bd`
- Current proposal: `8c2fe085f6e08836b9bdabb8995b8d0a40172fd0dbf4833cd1f95497150fc92d`
- Parsed-object changes: 22 leaves across five questions; see the JSON companion for each exact before/after value.
- Removed two valid distractors: i004 wrong_3 (whole-service preload) and i011 wrong_2 (whole-warehouse single-query load). Four options per item pass the existing schema and scorer; this does not assert a five-choice requirement.
- i003’s replacement distractor changes aggregation grain (grouping by author splits the per-episode total) and has a new option ID plus aligned message target.
- i013 uses fictional transfer sizes (12 KB current metadata, 80 MB history, 1 MB request cap); these are scenario facts, not Patternly measurements or universal budgets. i002 likewise describes only the stated case’s uncached loader behavior.
- Mechanical check: **PASS**, 18 questions, 88 original/reversed option score cases. This validates shape, scoring, and message targets only; independent semantic review remains pending.
