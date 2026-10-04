# Independent producer-correction QA — package 20

**Verdict: PASS for the bounded correction.** The three test edits repair fixtures and current pins made stale by the accepted OOD source20 migration; they do not change producer behavior or historical assertions.

Reviewed content repository head: `b1d7cc419b475dccd37fba82c948bcd760ab577f`. The correction commit is `4721c39` (`test(content): bind existing consumers to reviewed OOD N04 source`).

The migration-proof fixture now copies the fixed v20 proof, so tests for the earlier v19a checks can reach their intended assertions instead of failing at the outer missing-v20-proof check. ACC-02 now reads its current OOD version from the v20 proof. ODK-097 now pins OOD v20 and its whole-track hash `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`; its N01 free-node pin and historical admission inputs remain unchanged. The diff changes only those fixture/import/version/hash lines.

Independent verification:

- `node --test tests/bizq01-migration-proof.test.mjs tests/content-builder.test.mjs tests/odk097-design-session-matrix.test.mjs` — **44/44 passed**.
- Root-owned full canonical run after the correction — **158/158 passed**, as recorded in `ROOT-PRODUCER-CANONICAL.log`; the earlier 10 failures from stale fixture/pin inputs remain preserved in `ROOT-PRODUCER-CANONICAL-REVISE.log`.
- Actual isolated verifier probes against copied content/proof fixtures: replacing the v20 proof with a directory fails at the v20 proof check with `UNSAFE_PATH`; replacing the N04 source file with a directory fails source discovery with `UNSAFE_PATH`; a symlinked N04 source-directory ancestor fails source discovery with `SYMLINK_PATH`. A symlinked `evidence/business-quality` ancestor is also rejected, although an earlier BESD proof’s shared path guard catches it before the v20 proof branch. The held originals were placed outside the copied content tree so they could not trigger an unrelated inventory failure. All probe mutations were confined to `/private/tmp` and removed. The reproducible probe script [check-path-probes.mjs](check-path-probes.mjs), SHA-256 `5682029c71228a5f1a0226d40a4f050997b8b31afb872ce5ff6e34870273581a`, passed `node --check` and was rerun after moving held originals outside the fixture tree.

The probes establish rejection at the verifier boundary; the parent-path symlink probe does not claim that the v20 branch itself was the first rejecting stage. No producer, proof, catalog, app, or release behavior was modified by this review.
