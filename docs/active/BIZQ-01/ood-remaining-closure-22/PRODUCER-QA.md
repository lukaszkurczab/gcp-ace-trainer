# N06/22 producer acceptance review

**Verdict: PASS for the bounded source producer.** The fixed 180-item same-ID proof is enforced and reconstructs exact v21 source bytes before the unchanged v21 validator runs. Historical guards and aggregate content are preserved. This accepts only the producer slice; it does not accept the app consumer, runtime/admission, native or Premium behavior, release, or full BIZQ-01 completion.

## Reviewed implementation

The implementation is bound to content HEAD `7648782e57ef6927b90c687f7ae67c62b8ae5ed2`. Its principal file hashes are:

| File | SHA-256 |
|---|---|
| `scripts/content/verify-migration.mjs` | `a40af4fab77754dab1690375081ce55be35f7d20200546c8c9c20e1b013af3e6` |
| `evidence/business-quality/bizq-01-ood-node-closure-22.json` | `5987128d427d0362b2fe83f6ab62bf2483169374c51941bf23fc3b192f0e089c` |
| `tests/bizq01-ood-node-closure-22.test.mjs` | `ef1414d4f88e546ac317fe8d02b9aed0ec570d2c12c3b2b3cd87639d05cbb5d0` |
| `tests/ood-cohort16-historical-fixture.mjs` | `5e7570922792e9902899dd72fe4b58d113ff7c9a0c86d20bcc9768372204259f` |
| `package.json` | `53b99e9ae6f40f621b9ef2ab41fe3acf76054c9f776dd003f93f19b12f117f7e` |
| `tests/bizq01-ood-node-closure-21.test.mjs` | `a13751304b10be337f22d5a36b854ed914f1698272549c9a245fc2ef60c0700e` |
| `tests/content-builder.test.mjs` | `98a79892396bb8b61cb49cde44002d409ea00514e328f91f7c4c6b5bcdcd5713` |
| `tests/odk097-design-session-matrix.test.mjs` | `4ebeb3cc8cd8c5f090bd094f93577ac367e2090451a0aef47161e8af48db84d1` |

The immutable semantic inputs are `SEMANTIC-CURRENT-ACCEPTED-QA.json` SHA-256 `3ddac680b864069af4295ac5c2f90d8a83564431b996188b85bdc49effe84ff8`, the exact registry SHA-256 `fe693c44f41e3f923764d44eb587ad97ce95a9fc3e1293b96c08bfd72e046a9c`, and the fixed producer map SHA-256 `9369a886d8c091b4ee68bbb34818ec2001f1ff42698e59721548074729ef9e68`. The approved implementation scope is recorded in `PRODUCER-BRIEFING.md`, SHA-256 `b20aa77ae5c1753f944fe69bb1d84a76db6e9ac2cd57b5bd6b00742d295a209b`.

The v22 proof pins ten source files with 18 objects each, 180 same-ID corrections, and zero question-ID replacements. The validator binds the literal proof hash and descriptor, current version and QSet, each source file's location/hash/taxonomy, each current full object, the corresponding fixed before object and historical row hash, accepted-option identity, scoring contract, and source references. It rejects duplicate IDs within a question. It reconstructs every v21 source array and the whole v21 QSet using the verified serialization, changes only the predecessor catalog version in a private canonical view, then calls the existing v21 validator. That leaves the earlier chain and counts intact: 594 replacement mappings, 351 total same-ID corrections, 25 Reason amendments, 16,077 current questions, and 16,041 historical questions.

I inspected the source22 guard and dispatch, fixed descriptor, proof payload, source-path checks, v22 fixture restoration, affected historical test fixtures, canonical test registration, and current-version pins. The fixture helper validates current source bytes and full objects before restoring the exact v21 predecessor in a temporary tree, removes only the temporary v22 proof, and then lets existing v21→v20→19a→19→17→16→13→12→11 restorers run. The v21 test now runs against that restored v21 fixture and keeps its v21 assertions. Other historical test changes add the v22 fixed proof to their isolated evidence copies; their historical proof assertions remain targeted at their original versions. `test:canonical` registers the new v22 suite once. The builder and ODK test pins move to v22 while existing N01 pool pins remain unchanged.

The fixed proof and old-guard evidence bind as follows:

- `PREPARED-FIXED-PROOF22.json`: SHA-256 `5987128d427d0362b2fe83f6ab62bf2483169374c51941bf23fc3b192f0e089c`.
- `ROOT-PREVIOUS-GUARDS-FINAL.json`: SHA-256 `20c032b647b935ab62c2dedb8e2f5ce419abe8a33447a20b8f5f7652d3a16b81`; confirms all 12 prior fixed descriptors and four closed private guard bodies match the accepted baseline.
- `ROOT-SOURCE-PRESERVATION-POST-IMPLEMENTATION.json`: SHA-256 `da2a16b1f1986ce98297a7f1ca63d78ef3492168d727879ce3dbc09dac0c8de4`; confirms all 180 current items, 1,233 other OOD items, 765 accepted N01–N05 items, 943 untouched content files, 13 prior immutable proof files, and eight other artifacts are preserved.

## Independent verification

| Check | Result |
|---|---|
| `node --check` on verifier, v22 test and historical fixture helper | Passed |
| `git diff --check` | Passed |
| `/opt/homebrew/opt/node@22/bin/node --test tests/bizq01-ood-node-closure-22.test.mjs` | 5/5 passed: positive exact-history reconstruction, all fixed predecessor proofs required, proof/object/membership/source/accepted-key tampering rejected, wrong current source/version and missing v21 predecessor rejected, and symlinked proof/source rejected. The positive case also validates each current question and scores every option in original and reversed order (1,656 cases). |
| Initial full `npm run test:canonical` | 178 tests: 176 passed, two candidate snapshot tests failed because the source/catalog was still dirty. Both failed at the existing `assertCanonicalSourceSnapshot` guard in `candidate-draft-v2.mjs:75`; no v22 producer assertion failed. Log SHA-256 `5030d696e9bd945edb6d0b7bd792e02626e0f0d42f6ec3371c6b0f2ba913030e`. |
| After local source checkpoint, targeted snapshot-resolution tests | 3/3 passed, covering both previously failing candidate tests plus the isolated untracked-source rejection. The source/proof/code bytes were unchanged by the checkpoint. Log SHA-256 `00704756ffa90a4f06883c3b0f37d8f95627516829c46fd87a53f029f9615b9b`. I therefore accept canonical coverage as the 176 matching passes plus those three targeted passes; I do not claim a fresh single 178/178 run. Aggregate receipt: `ROOT-PRODUCER-CANONICAL.json`, SHA-256 `684daabbc5cba5a2b1f5c0758aa9434b214d6ec0e01835c5c74a169cfca41d62`. |
| `npm run verify:migration` | Passed: nine tracks, 16,077 current and 16,041 historical questions; 594 replacements, 351 same-ID corrections and 25 Reason amendments. Log SHA-256 `4ac8eee9a6d4c4ef94d181a7b1337e6aae043e037feaf67c2496c8c3b28bddb9`. |
| `npm run content:validate -- --track object-oriented-design-interview` | Passed for all 1,413 OOD questions. Log SHA-256 `6a66772a3eb93f463484d52f0fd54e64e587fb3c2f9cfa44f33aef3da980cb1d`. |

The source checkpoint resolves the pre-existing clean-snapshot precondition; it does not weaken that guard or itself confer source, app, candidate, admission, or release acceptance. The workspace also contains unrelated untracked `dist/` and full-content-audit material; these are outside this review and were left untouched.

## Boundary

This PASS accepts the N06 producer implementation and its immutable proof/history integration. Consumer synchronization and runtime behavior, candidate admission, provenance delivery, native or Premium availability, and full BIZQ-01 closure remain separate work and are not established here.

## Erratum

The initial report transcription omitted one `0` in the SHA-256 for `tests/odk097-design-session-matrix.test.mjs`. The table above now records the independently re-read file hash `4ebeb3cc8cd8c5f090bd094f93577ac367e2090451a0aef47161e8af48db84d1`. This is metadata-only; the reviewed file bytes and verdict are unchanged.
