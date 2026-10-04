# Producer canonical test correction — package 20

## Cause found

The full canonical run exposed three stale test consumers after the fixed OOD source20 migration:

- `bizq01-migration-proof.test.mjs` built a fixture with the v20 catalog and current source arrays but copied proofs only through source19a. The verifier correctly requires the fixed v20 proof first, so the fixture failed at that outer boundary before tests could reach their intended v19a mutations and failure categories.
- `content-builder.test.mjs` still expected OOD's current catalog version from the v19a Reason amendment.
- `odk097-design-session-matrix.test.mjs` pinned v19a's whole-track question-set hash despite checking the current catalog/source.

## Correction

- Added the fixed `bizq-01-ood-node-closure-20.json` proof to the migration-proof fixture. No prior error-code assertions were changed.
- Changed ACC-02's current OOD version expectation to the version in the fixed v20 proof.
- Updated ODK-097's current OOD version and whole-track hash to v20 and `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`. The N01 free-node count/hash and frozen ODK-097 admission artifacts remain unchanged.

## Verification

Command:

```sh
node --test tests/bizq01-migration-proof.test.mjs tests/content-builder.test.mjs tests/odk097-design-session-matrix.test.mjs
```

Result: 44/44 tests passed. All previous migration-proof failure-category checks passed with the v20 fixture binding in place. `git diff --check` passed. No source, catalog, proof, verifier, runtime, lock, candidate, or admission files were changed in this correction.
