# Independent producer QA — OOD N02 closure cohort 17

**Verdict: PASS for the bounded source producer package.** The review binds content repository checkpoint `3c45f928e7d8deb3a1c94fd13c992bffd6185d6c`, fixed OOD content version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-17`, and proof SHA-256 `f3ec83ddfaa92b782fa12ed6e9c606e11b40c7b67837fdd33d4aa4ec0862ccac`. This covers source, catalog, fixed migration evidence, strict verifier, and producer tests. It does not claim consumer/admission, native/Premium, or full BIZQ-01 acceptance.

## Reviewed source and proof contract

The closed v17 verifier branch binds the literal eight N02 source paths and hashes, current track version and question-set hash, all 152 ordered old-to-new replacement identities, objective, accepted-option ID, source references, and current/retired whole objects. Each source contains exactly its 19 new IDs; taxonomy, single-choice interaction/scoring, source bytes, current canonical objects, and per-question new option identities are checked. The proof must have the exact accepted field set and fixed proof path. The verifier rejects a missing or altered proof, extra/unreviewed fields, wrong version/hash/path/question mapping, tampered old or current object, unsupported membership, and symlinked proof/source paths. It does not provide a caller override or compatibility map.

For each of the eight files, the validator privately substitutes the 19 immutable v16 predecessor objects and checks the exact prior source bytes. It reconstructs the v16 track set and catalog identity, then dispatches through the unchanged v16 → v13 → v12 → v11 proof chain. Source16’s historical validator body is preserved byte-for-byte. The existing16 historical fixture now restores v17 to exact v16 bytes before continuing the prior restoration; the cohort13 fixture then uses the same accepted history. This keeps generation-specific historical checks from incorrectly applying v13/v16 counts to v17 while retaining the earlier guards.

The current mapping is exactly 152 replacements across B01–B08, old i001–i019 to new i020–i038 in source order. The fixed proof schema contains no `proposalSha256` fields: it binds the eight current source hashes and the full old/current question objects to the literal descriptor. `ROOT-SOURCE-PRESERVATION.json` independently ties each actual source hash to its frozen reviewed-proposal hash; both links and all eight values match. Taxonomy, node, interaction type, scoring, existing N01 objects, and all other OOD/global question objects remain bound to the accepted contract.

## Actual verification

- Independently ran `node --test tests/bizq01-ood-node-closure-17.test.mjs`: **7/7 passed**. This includes exact 152 mapping and v16→13→12→11 reconstruction, validation/scoring of every accepted and wrong option in original and reversed order, targeted feedback coverage, missing historical proofs, tampered identities/hashes/objects, missing/duplicate/extra mapping membership, changed source/catalog version, and symlinked proof/source paths.
- The recorded producer narrow suite, `ROOT-PRODUCER-NARROW.log`, passed **33/33**, covering the current package and retained source11/12/13/16 historical guards.
- `ROOT-MIGRATION.log` reports actual migration verification `passed`: 9 tracks, 117 nodes, 943 mental units, 16,077 canonical questions, and 288 cumulative OOD replacement mappings.
- `ROOT-PRODUCER-CANONICAL.log` passed **142/142**, with no failures or skips. This includes the canonical content and migration tests after the source checkpoint.
- The actual `content:build-all` command built all 9 track artifacts to a private output root. `ROOT-BUILD-PRESERVATION.json` confirms all 8 non-OOD artifacts are byte-identical; the OOD artifact reflects the accepted source17 content.
- `ROOT-SOURCE-PRESERVATION.json` confirms all 152 new source questions and 1,214 option-scoring cases, preservation of the other 15,925 canonical question objects and 945 tracked content files, and unchanged bytes for the seven pre-existing immutable proofs.
- `ROOT-HISTORICAL-VALIDATOR-PRESERVATION.json` confirms the prior source16 historical validator body remains exact.

## Limits

This PASS accepts the source producer boundary for the reviewed 152-item cohort and its historical migration chain. Actual app/web consumer synchronization, release-lock/admission, consumer/native presentation, Premium eligibility, and full BIZQ-01 closure remain separate decisions and are not asserted here. Root-owned candidate work is a subsequent in-progress stage and is outside this producer review; foreign audit paths were not changed or evaluated.
