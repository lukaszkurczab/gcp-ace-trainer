# Producer package-16 implementation notes

Read-only preflight for the fixed replacement of the seven OOD-N01 source files B02–B08 (119 items). This records existing verifier/test dependencies for the later implementation owner; it does not authorize or implement source activation.

## Existing proof chain

The authoritative path is `../patternly-content/scripts/content/verify-migration.mjs`:

- Fixed OOD generations are declared as `BIZQ01_OOD_PROOF` (source11, one B01 item), `BIZQ01_OOD_SUCCESSOR_PROOF` (source12, one B01 item), and `BIZQ01_OOD_COHORT13_PROOF` (15 B01 items), around lines 177–252. The current validator has exact root/item keys and fixed identities; it verifies current track hashes, old migration-evidence rows, new/current object equality, source-file hashes and locations, scoring, accepted option and option-ID novelty.
- `loadBizq01OodSemanticProof` around lines 1140–1224 dispatches by exact OOD catalog `contentVersion`. The v13 branch validates cohort13, reconstructs exact v12 B01 bytes and canonical track, then calls the v12 branch; v12 reconstructs v11 and calls the source11 proof. `verifyMigration` then merges the validated OOD mappings into the historical inventory comparison. Keep these old version branches and fixed proof descriptors unchanged.
- Package16 needs its own fixed proof descriptor/path and exact-version branch. That branch should validate all 119 mappings across exactly B02–B08, reconstruct each source13 predecessor from the frozen prior objects, set a predecessor catalog/canonical view to source13, and enter the existing v13→12→11 chain. The existing v13 proof concerns B01 and should remain byte-identical. Extend the wrong-version proof-path list so a package16 proof present with any unrecognized/stale OOD version is rejected. Keep one canonical fixed proof path and closed exact-version dispatch; no runtime override, public waiver, or generic bypass.

## Source and hash constraints

The current OOD track has 1,413 questions; its N01 node has 136 questions (8 × 17). Replacing 119 IDs should keep both counts, all taxonomy/mode/scoring contracts, and B01's 17 current objects unchanged. The OOD track question-set hash and content version will change. The current source files remain seven arrays of 17: old `i001`–`i017` map in order to new `i018`–`i034` within each B02–B08 unit. Each new proof entry must identify its exact source path, old/current source hash, old/current whole question, and fixed item mapping; source and proof must not alias retired IDs.

A real predecessor-byte probe already established that the seven historical B02–B08 source arrays hash as `JSON.stringify(sortedQuestions)` **without** a trailing newline. Reconstruct each file with those exact bytes and compare its `beforeSourceSha256`; do not silently normalize serialization. The existing B01 source11→12→13 proofs reconstruct their B01 predecessor bytes with a trailing newline in `verify-migration.mjs`. Preserve that behavior and all old hashes.

The current catalog OOD version is `object-oriented-design-interview-authoring-v2026.10.03-bizq01-13`; package16 should use its accepted exact successor version when frozen. Current OOD track/node counts stay 1,413/136, while the OOD track hash changes. The canonical verifier’s all-track counts remain 16,077 current and 16,041 historical, with 36 existing approved additions; the OOD semantic replacement result extends the 17 existing OOD mappings by 119, rather than replacing or weakening that lineage.

## Fixture and pin maintenance

These current-root fixtures copy explicit business-quality proofs and call `verifyMigration`; they need the new fixed package16 proof copied alongside existing proofs:

- `../patternly-content/tests/bizq01-migration-proof.test.mjs` copies current `content` and the source11/source12/cohort13, BESD14 and Coding proofs, then verifies the real current repository and a no-proof fixture.
- `../patternly-content/tests/bizq01-besd-seed-cohort-14.test.mjs` also verifies the whole current canonical repository while testing BESD14; add the OOD package16 proof to its fixture proof-copy list. Preserve the BESD14 proof and predecessor behavior.
- Add `../patternly-content/tests/bizq01-ood-node-closure-16.test.mjs` and register it in `test:canonical` in `../patternly-content/package.json`. It should check the fixed 119 set, exact seven source hashes and predecessor reconstruction, B01/unrelated preservation, all question schema/score/option feedback bindings, and strict rejection of missing or mutated package16 proof/source/version/membership. This complements rather than replaces the existing 11/12/13 tests.

These are historical-generation tests, not current-pin fixtures: `bizq01-ood-unit-cohort-13.test.mjs`, `bizq01-ood-source-12.test.mjs`, and `bizq01-ood-source-11.test.mjs`. Their current setup starts from repository `content` and reconstructs a predecessor. Once repository content is v16, stage v13 first by reversing the package16 proof (remove its 119 new objects, restore the 119 frozen before objects by source file, sorted, with the probed no-newline serialization); then retain each test’s existing 13→12→11 reversal and exact version pin. Continue testing absence/tamper/wrong identity of the corresponding historical proofs. The source11/12/13 records and proof hashes remain historical inputs; do not repoint them to v16 or relax their strict-negative assertions.

Current identity/hash pins also exist in:

- `../patternly-content/tests/content-builder.test.mjs`, which reads the cohort13 proof for the expected OOD `contentVersion`; switch this current pin to package16, while preserving other source/proof fixtures.
- `../patternly-content/tests/odk097-design-session-matrix.test.mjs`, whose OOD profile row pins contentVersion and track hash. Advance those two current-source values from v13 only; verify nodeCount/node hash and question counts from a real build rather than changing them speculatively.

`bizq01-source-slice.test.mjs` is the BESD14 source/consumer test, not an OOD predecessor fixture. Do not rewrite its BESD identities. Search for any additional literal OOD v13 pin before implementation; `rg` currently finds the verifier/evidence and the test locations listed above, plus candidate/readiness artifacts whose historical hashes are not this source migration’s update surface.

## Verification commands already defined

The producer package exposes `npm run verify:migration`, `npm run content:validate`, `npm run content:test`, and `npm test` (`test:canonical`). The scoped regression set is the new package16 test plus existing `bizq01-ood-unit-cohort-13`, `bizq01-ood-source-12`, `bizq01-ood-source-11`, `bizq01-besd-seed-cohort-14`, `bizq01-migration-proof`, `content-builder`, and `odk097-design-session-matrix` tests. Then run the canonical suite and the three content/migration commands under stable files. This note contains no execution claim for those future changes.
