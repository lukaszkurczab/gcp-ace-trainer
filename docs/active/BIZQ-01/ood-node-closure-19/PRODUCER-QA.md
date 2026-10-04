# Independent producer QA — BIZQ-01 OOD N03 cohort 19

**Verdict: PASS for the bounded producer source/proof package.** This accepts the source integration and its fixed historical proof path only. It is not consumer, admission, native, Premium, release, or full BIZQ-01 acceptance.

## Reviewed inputs

- Frozen semantic reviews: [`SEMANTIC-REVIEW-B01-B04-v1.md`](SEMANTIC-REVIEW-B01-B04-v1.md), [`SEMANTIC-REVIEW-B05-B09-v1.md`](SEMANTIC-REVIEW-B05-B09-v1.md), and [`SEMANTIC-CROSS-UNIT-v1.md`](SEMANTIC-CROSS-UNIT-v1.md).
- Fixed source descriptor: `evidence/business-quality/bizq-01-ood-node-closure-19.json`, SHA-256 `7161c91cc3ec8cf1cc22d99121928902b1e706986cd833f6663c0d4534715a4f`.
- Current verifier SHA-256: `0c849ef990e1393dc4e91faf28d0d7b17928018abaf1fdbd73fd20eb87163931`.
- Fixed cohort test SHA-256: `86daca7d82a861f07968c03e2f66d57662f902f8da9d3ec39888cb3e1dc8f24c`.
- Producer HEAD at review: `90a1d83859c2be83c5266ffe981f487d3c29aeeb`, matching the descriptor’s `beforeProducerCommit`.
- The canonical source contract at `../docs/07-content-guidelines.md` has SHA-256 `b451c500d5d67e0649f7df7decb1d1cd6e105381ca7204ab923f4fba3bd700f7`, matching the packet contract.

## Findings

The fixed proof binds exactly nine B01–B09 source arrays and 162 item mappings. Each current array has 18 items. I independently compared each integrated array to its frozen proposal, verified its current-byte SHA against the descriptor, and compared every `beforeQuestion` object with the source bytes from `git show HEAD:<path>`. All nine previous-source hashes and all nine current-source hashes match. The 162 retired IDs are unique and absent from current arrays; the 162 new IDs are unique and the proof’s current objects match the source arrays exactly. No source outside those nine arrays was changed; the only catalog change is the OOD content version from v17 to v19.

The proof uses a fixed private descriptor selected by the catalog’s exact content version. Proof input cannot choose a path, cohort, ID mapping, or identity approval. The common strict validation body accepts only the existing fixed v17 descriptor and fixed v19 descriptor. It binds full current and retired question objects, fixed source hashes, taxonomy, interaction/scoring, answer option and references; rejects duplicate, missing, extra, or unrelated mappings; and reconstructs the byte-exact v17 source arrays and whole-track question set before invoking the unchanged v17→16→13→12→11 proof chain. The existing v17 descriptor and eight immutable predecessor proofs are unchanged; I checked the current bytes against the eight hashes in `BEFORE-PRODUCTION.json` and all matched.

Historical v17 fixtures reconstruct the exact predecessor bytes from v19, then run the existing v17 guards. The v19 test separately checks the fixed 162 mapping, all 1,296 scoring/reversal cases, exact wrong-option targets, missing proofs, tampered current/old objects, changed hashes, duplicate/missing/extra mappings, unrelated source membership, unsupported catalog version, and symlinked proof/source paths.

## Verification

- `node --test tests/bizq01-ood-node-closure-19.test.mjs tests/bizq01-ood-node-closure-17.test.mjs tests/bizq01-ood-node-closure-16.test.mjs tests/bizq01-migration-proof.test.mjs` — **32/32 passed**.
- `npm run verify:migration` — **passed**. It reports 16,077 current questions, 1,413 current OOD questions, 16,041 historical questions, and 450 cumulative replacement mappings.
- `git diff --check` — passed.
- The recorded root source-preservation check reports 1,251 other OOD objects, 15,915 other global objects, 944 other tracked content files, and all eight other track artifact bytes preserved. This agrees with the source-file scope I inspected.

## Remaining boundary

At review time, `ROOT-CANONICAL.log` records 147/149 tests passing. Its two failures are the candidate-draft and candidate-readiness tests, both stopping at `assertCanonicalSourceSnapshot` because the changed content tree does not yet match the committed source snapshot. I inspected that guard: it requires identical committed and working content paths/bytes. This is a clean-source snapshot stage condition, not a failure in the v19 producer proof. The full canonical gate must be rerun after the source checkpoint before candidate/readiness acceptance. Consumer/admission, builds, native/Premium, and full BIZQ-01 acceptance are outside this producer verdict.
