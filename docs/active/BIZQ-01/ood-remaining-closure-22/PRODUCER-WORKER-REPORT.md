# N06/22 producer worker report

Status: implementation is locally ready; HOLD for root’s canonical producer gate and independent producer review. Root-owned source/catalog/proof22 writes were treated only as verification inputs; this report does not claim source acceptance, candidate readiness, admission, or full BIZQ-01 closure.

The producer now has a private fixed v22 descriptor and validator bound to proof SHA `5987128d427d0362b2fe83f6ab62bf2483169374c51941bf23fc3b192f0e089c`. It verifies the exact ten N06 source files and 180 same-ID mappings, reconstructs each v21 raw source without a newline and the whole predecessor question set, then invokes the existing fixed v21→20→19a→19→17→16→13→12→11 chain. The old descriptors and private guard bodies remain in place. The validator uses per-question option ID checks and adds no cross-question uniqueness rule.

The v22 consumer test checks all 180 authored objects, source membership and hashes, authored wrong-option targets, 828 option slots in original and reversed order (1,656 score cases), and resulting history totals of 594 replacements, 351 same-ID corrections and 25 Reason amendments. Negative cases cover proof/object/membership/identity/key/source tampering, catalog mismatch, absent v21 predecessor, and symlinked proof/source paths. The existing v21 test now restores exact v21 fixture bytes before retaining its historical 153-item and history assertions. Historical tests that start from current content copy proof22 and use the sequential private restore chain; their historic target versions and assertions remain unchanged. Only current content-version pins were advanced to v22.

Actual verification:

- `node --check scripts/content/verify-migration.mjs`, `node --check tests/bizq01-ood-node-closure-22.test.mjs`, and `node --check tests/ood-cohort16-historical-fixture.mjs` — passed.
- `node --test tests/bizq01-ood-node-closure-22.test.mjs` — 5/5 passed after final validator wording correction.
- `node --test tests/bizq01-ood-node-closure-22.test.mjs tests/bizq01-ood-node-closure-21.test.mjs tests/bizq01-ood-node-closure-20.test.mjs tests/bizq01-ood-node-closure-19.test.mjs tests/bizq01-ood-node-closure-17.test.mjs tests/bizq01-ood-node-closure-16.test.mjs tests/bizq01-ood-unit-cohort-13.test.mjs tests/bizq01-ood-source-12.test.mjs tests/bizq01-ood-source-11.test.mjs tests/bizq01-migration-proof.test.mjs` — 70/70 passed.
- `node --test tests/content-builder.test.mjs tests/odk097-design-session-matrix.test.mjs` — 29/29 passed.

Root will run the required canonical suite and preservation checks after this stable worker checkpoint. No app/web/backend/runtime/device work was performed by this worker.

Owned code and test files at this checkpoint: `patternly-content/package.json`, `patternly-content/scripts/content/verify-migration.mjs`, the new `patternly-content/tests/bizq01-ood-node-closure-22.test.mjs`, `patternly-content/tests/ood-cohort16-historical-fixture.mjs`, historical test fixture-copy updates in `bizq01-migration-proof`, OOD closures 16/17/19/20/21, OOD sources 11/12, and OOD unit cohort 13 tests, plus current pins in `content-builder.test.mjs` and `odk097-design-session-matrix.test.mjs`. Root-owned source/catalog/proof changes and foreign `dist/`/audit data were preserved.
