# N05/21 producer implementation

The fixed N05/21 proof is wired into the private migration verifier. The verifier checks its frozen proof bytes and descriptor, the current catalog/version and question-set hash, all nine exact source files, the 153 same-ID records, each before/current object and accepted option binding, and source/canonical object parity. It reconstructs the nine exact v20 source arrays using the frozen before objects and no trailing newline, builds a private v20 canonical view, and delegates to the unchanged v20 proof validator. The returned history remains 594 replacements, 171 same-ID corrections, and 25 Reason-only amendments. The v21 path checks option-ID uniqueness within each question; it adds no cross-question uniqueness or retired-ID rule.

The historical fixture helper now exposes `restoreOodSource20Fixture`. Starting from live v21 fixture bytes, it verifies proof21/source hashes, restores the nine prior v20 source arrays, sets the temporary catalog back to v20 and removes proof21 only from that temporary fixture. The closure20 test runs its original N04/v20 assertions and proof20 checks against this reconstructed fixture. Older fixture-copy arrays include proof21 where they start from live current content. The current-version assertions in the builder and ODK-097 test now bind v21.

Changed producer files:

- `patternly-content/scripts/content/verify-migration.mjs`
- `patternly-content/tests/bizq01-ood-node-closure-21.test.mjs` (new; registered in `patternly-content/package.json`)
- `patternly-content/tests/ood-cohort16-historical-fixture.mjs`
- Existing closure20, migration-proof, closure16/17/19, source11/12, and unit13 fixture tests
- `patternly-content/tests/content-builder.test.mjs`
- `patternly-content/tests/odk097-design-session-matrix.test.mjs`
- `patternly-content/package.json`

The root-owned source, catalog and fixed proof were already activated before this implementation slice; I did not modify them. No paths were removed. No generated app artifacts, locks, runtime admission, pools, schema, selector, native or Premium behavior were changed by this producer slice.

Verification performed:

- `node --check scripts/content/verify-migration.mjs` and `node --check tests/bizq01-ood-node-closure-21.test.mjs` — passed.
- `npm run verify:migration` — passed; 9 tracks, 117 nodes, 943 mental units, 16,077 current questions and 16,041 historical questions.
- `npm run content:validate -- --track object-oriented-design-interview` — passed; 1,413 questions.
- `npm run content:test -- --track object-oriented-design-interview` — passed; 1,413 canonical answers.
- Closure20 plus closure21 focused tests — 10/10 passed. Closure21 exercised all 153 questions, all 612 options in original and reversed order (1,224 scoring cases), exact wrong-option target IDs, the v20 predecessor proof, and proof/source/version/object/path/symlink negatives.
- Historical closure16/17/19 and source11/12/unit13 tests — 40/40 passed.
- Migration-proof, content-builder and ODK-097 matrix tests — 44/44 passed.
- `git diff --check` on the touched producer files — passed.
- Full `npm run test:canonical` — both runs reported 171/173 passed. The two failures are `candidate draft v2 binds all nine canonical artifacts and exact ODK-096 AWS identity deterministically` and `Codex candidate decision v2 binds exact candidate, source snapshot, release and nine artifact hashes`. Both fail in `assertCanonicalSourceSnapshot` because the canonical source paths/bytes differ from the committed source snapshot while the root-owned N05 source and catalog updates are present as working-tree changes. The second, full captured rerun is `/tmp/patternly-n05-test-canonical.log`; the first run's tool output was streamed and truncated, so no separate raw file was retained. These guards were preserved and no commit was made. The same full-suite result must be revisited after the authorized source checkpoint is committed/reconciled.

The canonical test suite therefore remains incomplete at this checkpoint. This report does not claim app consumer acceptance, candidate admission, full BIZQ-01 acceptance, or release readiness.
