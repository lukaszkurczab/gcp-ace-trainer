# N07 B03 v2 bounded author correction

**Status: ready for independent re-review; not semantic acceptance.** This revision addresses only the frozen B03 v1 findings: the cohort’s repeated longest-correct form and i006’s missing visible mapping from the stored door-policy code to the domain revocation state.

The v1 semantic review is bound to proposal SHA-256 `97cdc4698077a34576da5762805782c17edd34bcb08345d363df779c8b849865`; the form-cue supplement is bound to the same input. Their exact file hashes are recorded in [the correction receipt](AUTHOR-N07-B03-v2-CORRECTION.json). The old report and proposal remain unchanged.

I preserved all 18 question IDs and the accepted `owner_preserves_contract` option IDs. The options now express a case-specific mapping and a concrete competing responsibility boundary, such as policy evaluation during loading, caller-side raw-row interpretation, or performing an external effect during a read. The accepted choices state the mapping decision in shorter, case-specific form. Some keys remain longest where the case’s full mapping needs that detail; no equal-length, option-count, or numeric style threshold was applied.

For i006, the prompt and constraints now state that `REVOKED` maps to revoked and `ACTIVE` maps to unrevoked. The key, Reason, all five Details fields, and the matching wrong-option diagnostic use that same mapping. The access check remains with the badge/domain operation; the new premise only resolves which domain state each stored code represents.

The existing B03 checker passes 18 complete objects and 90 original/reversed option-scoring cases, with the accepted IDs and feedback targets intact. This establishes schema, scoring, and target binding only. Independent review is still required for the revised semantics and option presentation.
