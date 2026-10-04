# Independent producer acceptance — package 20

**Verdict: PASS for the bounded producer package.** The accepted scope is the nine OOD-N04 source files: 144 new-ID semantic replacements plus 18 same-ID whole-object corrections, preserving the 25 existing Reason corrections and reconstructing the exact v19a predecessor through the unchanged historical chain. This is producer acceptance only; it does not accept app consumers, admission, native behavior, release readiness, or full BIZQ-01.

The reviewed producer snapshot is:

- `scripts/content/verify-migration.mjs` SHA-256 `43d7e66f2ed19fe254fc4484226bd48f514c4405d206ccc24b2cd8e25de509c2`
- `evidence/business-quality/bizq-01-ood-node-closure-20.json` SHA-256 `cb087c42a24d7a7f6ddbd922b05f379efab8f68e991587b30ee8bf51f0e1298d`
- `tests/bizq01-ood-node-closure-20.test.mjs` SHA-256 `b89efc69b42fb652b26f04b17795d52347bbbcbfcd412582cfc5971dd5e484fe`

The proof is fixed to source20 and binds the nine current source hashes, nine predecessor source hashes, current and prior question-set hashes, exact item actions, old and current whole objects, source references, canonical locations, option identities, and historical row hashes. I independently checked each current source against its fixed hash and all 18 current objects per file against the proof. Replacing all 162 N04 objects with their bound predecessor objects reconstructs each file’s exact predecessor bytes; substituting those objects in the full 1,413-question OOD set reproduces both fixed question-set hashes: current `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72` and predecessor `6f493ddd0ebfbbd5fa7acf98e17de69420360925f498791a683aca5f1d7f1f53`.

The verifier keeps the two identity classes separate. Current membership and the public semantic-replacement map use only true replacements; historical reconstruction restores the 18 same-ID old objects before comparing the immutable manifest rows and projections. The existing 19a validator remains restricted to its three N03 private source buffers. The new branch reconstructs N04 in memory and delegates through the existing 19a→19→17→16→13→12→11 chain. The stray-proof guard includes the v20 path, and no generic proof override or widened historical source map was introduced.

I initially found an unintended edit to the fixed v19 descriptor: an item-level `confirmedDefects` field had been added to an N03 entry. The producer owner restored the baseline descriptor. The final verifier diff is additive for v20 (plus the existing wrong-version proof-path list), with no v19 descriptor change; I then reran the affected tests and migration verifier against the final verifier hash above.

The repository-owned preservation receipt reports 162 integrated N04 objects, 144 replacements, 18 same-ID corrections, 944 untouched content files, 1,251 unchanged non-N04 OOD objects, and 11 unchanged immutable proof/evidence files. Receipt: [ROOT-SOURCE-PRESERVATION.json](ROOT-SOURCE-PRESERVATION.json), SHA-256 `cbc2ed09e03c381b328822759d34927363147c31dc19167957bb3c961d8b4334`. My `git diff --check` passed, and the tracked source diff is limited to the nine N04 JSON arrays, the OOD catalog version, the verifier, the v20 test and fixture registration/restore paths, and the explicit canonical test-list registration. Existing proof files are unchanged.

Focused validation on the final snapshot:

- `node --test tests/bizq01-ood-node-closure-20.test.mjs tests/bizq01-ood-node-closure-19.test.mjs tests/bizq01-ood-node-closure-17.test.mjs tests/bizq01-ood-node-closure-16.test.mjs` — **26/26 passed**. This includes full v20 predecessor reconstruction; missing fixed proof rejection; tampered proof, identity, object and hash rejection; source membership/content and symlink rejection; plus the v19/17/16 historical-chain and negative suites.
- `npm run verify:migration` — **passed**, reporting 9 tracks and 16,077 questions, 594 semantic mappings, 18 separate same-ID corrections, and 25 Reason corrections.
- Independent raw-byte/object check — **passed** for all nine current source hashes, all 162 current-object bindings, all nine byte-exact predecessor source hashes, and the full current/predecessor OOD question-set hashes above.
- `git diff --check` — **passed**.

The new focused test is registered once in `test:canonical`, the existing explicit repository test command. Full canonical suite/build, candidate/readiness, consumer synchronization, admission and release checks are downstream root-owned stages and are not asserted here. No native or full-area acceptance is implied.
