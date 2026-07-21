# Domain findings

| ID | Severity | Evidence | Finding | Likely layer |
| --- | --- | --- | --- | --- |
| DF-001 | P1 | STATICALLY_VERIFIED | Cloud Certification has no manual source and no bundled artifact; validation stops with `EMPTY_INGRESS`. | content readiness / product composition |
| DF-002 | P2 | STATICALLY_VERIFIED | Current app test suite has a contract mismatch: Practice Hub now renders `Default Practice`, while its test still expects only three alternatives. | application UI/test contract in dirty worktree |
| DF-003 | P2 | OBSERVED | Active-session resume card uses a composite accessibility label; stable title-only targeting fails. | presentation accessibility / QA observability |
| DF-004 | P2 | OBSERVED + STATICALLY_VERIFIED | Real item-to-artifact comparison cannot be deterministic because runtime UI has no correlatable item identity. | QA observability |
| DF-005 | P2 | STATICALLY_VERIFIED | Cross-repo integration validation requires clean application inputs and is not executable on the state audited. | repository process / evidence gate |

No score corruption, wrong answer key, silent fallback content, raw serialized content, or missing Algorithms Reason/Details field was observed in the small runtime sample. That is not proof that none exists outside the sample.
