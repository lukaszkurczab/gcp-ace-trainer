# N09 B01 authoring handoff

This is an inactive proposal for the existing `OOD-N09-B01` test-seam objective. It retains all 18 source question IDs because each item still asks which dependency boundary makes the scenario’s test repeatable while exercising the real operation. Each answer option was replaced with a scenario-specific seam choice, so all option IDs are fresh. No canonical source, catalog, proof, verifier, consumer or admission file was changed.

The proposal has 18 complete questions. `validateQuestion` accepted all 18; original and reversed option arrays produced 180 score checks across the five options for each question. Wrong-option diagnostics match the stored distractor IDs for every item. The original source array remains at manifest SHA-256 `6e75bf2e34178561b500500b2cb449a0e5642ea91cbfb251cc8a25b41277cd7a`.

| File | SHA-256 |
|---|---|
| `proposals/N09-B01.json` | `70a812eab3ddbcd0b20dc99eec741e08d04268b7546f9bc5ff68706c37884831` |
| `AUTHOR-N09-B01.json` | `9bd38a23c47f91910f42b27165e1b433bae9a94cddbbdda9a7c3f962b6281bd0` |

Technical source references support the general test-isolation and controllable-time claims; the operational conditions in each case are explicit scenario premises. References used: [Microsoft unit-testing best practices](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices) and, for the clock case, [Microsoft TimeProvider overview](https://learn.microsoft.com/en-us/dotnet/standard/datetime/timeprovider-overview). This is only an authoring and mechanical-validation handoff, not semantic acceptance.
