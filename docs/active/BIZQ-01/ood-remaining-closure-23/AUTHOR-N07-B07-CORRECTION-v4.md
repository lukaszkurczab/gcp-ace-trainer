# N07-B07 v4 bounded correction

This author correction preserves the frozen v3 array and changes only `feedback.details.errorCorrection` for all 18 existing questions. In each item, the field previously ended with the exact same sentence already present in `boundaryOrTradeoff`. I removed that duplicated suffix and retained the case-specific first sentence describing the nearest error.

- Frozen v3 input: `a1594042e5fd1cbba6767f9941b87fb7975b964e02a2f6b99a99a5ed98d9de7d`
- Current proposal: `a3748cdb5ee1d91b334ece3a85ee7b61a061e9c25feef282aac496e20de485f7`
- Delta: 18 `errorCorrection` leaves only; prompts, constraints, options, answers, IDs, Reason, the other Details fields, and wrong-option diagnostics are byte-equivalent to v3 after JSON parsing.
- Mechanical check: PASS, 18 whole objects and 90 original/reversed option scoring cases. This is structural/scoring evidence only; semantic review remains independent.
