# Independent producer fixture dependency preflight

closure02, gpt-6-luna high; actual read-only source/test inspection before source14 implementation. No producer edits or tests claimed.

Current-content fixtures copying complete content+old proofs need the fixed32 BESD proof alongside immutable source01 evidence: tests/bizq01-migration-proof.test.mjs:46–56; tests/bizq01-ood-source-11.test.mjs:44–55; tests/bizq01-ood-source-12.test.mjs:41–53; tests/bizq01-ood-unit-cohort-13.test.mjs:40–53. OOD11/12 fixtures rewind only OOD source/catalog; preserve historical OOD proofs and snapshots, while their copied BESD remains current.

Originaltwo-item BESD tests: tests/bizq01-source-slice.test.mjs:12–20 must check immutable source01 evidence against exact reconstructed accepted two-item predecessor bytes, rather than pretend source01 raw hashes bind the new active source14 files. tests/content-builder.test.mjs:42,468–471 currentBESD version should follow the fixedcurrent source14 proof/catalog; retain source01 history. tests/bizq01-migration-proof.test.mjs:66–75,84–123 must preserve original2proof coverage and additionally assert fullcurrent2+32 chain. There is no BESDsource13 generation; cohort13 repaired OOD only.

Synthetic no-proof fixture tests/bizq01-migration-proof.test.mjs:57–58,78–82 (helpers/simp03-canonical-fixture.mjs:310+) is independent generated content and must not receive real source14 proof. Coding-only bizq01-source-copy.test.mjs needs no BESD change. All originalBESD/OOD proof bytes/descriptors remain immutable.

Narrow changed-proof regression: source-slice/migration-proof/OOD11/OOD12/OOD13/content-builder tests, current fixed32 direct negative matrix, then actual verify:migration. Full required producer gate after owned checkpoint. No stalehistory rewrites/dynamicwaivers/new pipeline.
