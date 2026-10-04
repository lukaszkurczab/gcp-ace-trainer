# N07-B08 v4 bounded correction

This author correction preserves the frozen v3 array and changes only 18 leaves. For i002–i016, the exact sentence duplicated from `boundaryOrTradeoff` was removed from `feedback.details.errorCorrection`, retaining each preceding case-specific diagnosis. For i001 and i018, `constraints[0]` now says the commit succeeded, matching the prompt’s confirmed write; the prior “may have succeeded” wording contradicted that fact.

- Frozen v3 input: `493b6658598afb8199ff392eaf682906dce27ef68ba74dadd159e13eb27d6030`
- Current proposal: `be7d5acfc2e2ccfa469ad6a70764572842bc873626e29414afd2f107f037bc2b`
- Delta: 16 `errorCorrection` leaves and 2 `constraints[0]` leaves. All other parsed fields, including prompts, options, answers, IDs, Reason, other Details fields, and diagnostics, are unchanged.
- Mechanical check: PASS, 18 whole objects and 90 original/reversed option scoring cases. This is structural/scoring evidence only; semantic review remains independent.
