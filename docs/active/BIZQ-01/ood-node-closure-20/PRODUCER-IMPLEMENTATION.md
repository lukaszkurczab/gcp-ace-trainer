# Producer implementation evidence — OOD N04 package 20

This packet implements the approved v20 source map in the canonical producer and verifies that historical evidence still reconstructs the accepted v19a generation. It is implementation evidence only; it is not an independent semantic review or full BIZQ-01 acceptance.

## Implemented boundary

- Replaced the nine `OOD-N04-B01` through `OOD-N04-B09` source arrays and advanced only the OOD catalog `contentVersion` to `object-oriented-design-interview-authoring-v2026.10.04-bizq01-20`.
- Added the fixed proof `evidence/business-quality/bizq-01-ood-node-closure-20.json`: 144 semantic question replacements and 18 same-ID corrections. The proof preserves full old/current question objects and their fixed source mappings.
- Added a closed v20 descriptor and verifier branch. It pins the proof bytes, checks the nine source hashes and complete membership, validates historical row hashes and taxonomy, and reconstructs the exact v19a source arrays and question set before invoking the existing v19a → v19 → v17 → v16 → v13 → v12 → v11 proof chain.
- Kept same-ID corrections separate from replacement identity mappings. During global historical reconstruction, the verifier restores their frozen predecessor objects without treating them as new or retired question IDs. Existing BIZQ OOD proof descriptors and predecessor validators remain byte-identical to the pre-slice baseline.
- Extended the historical fixture helper so older-generation tests unwind v20 back to the exact prior snapshots, and registered the v20 test once in `test:canonical`.

## Fixed source bindings

The nine current source arrays are compact JSON with no trailing newline. Their SHA-256 values are:

| Unit | SHA-256 |
| --- | --- |
| N04-B01 | `14689bf58bc6b5fc92e19b58f3ea6c030d0d876b9d7f7d0226639f1078b1a3ab` |
| N04-B02 | `07dc546ab1fe0b27faf59b90415dce6d19c5f84fb3d9e0b5d9b9367089540027` |
| N04-B03 | `df3d74abef8658fe3a038af2975644dea70240e549da3c84d0b6358dc27cd770` |
| N04-B04 | `111104dbb3d8b2c1d09c49d824a23719808a194bd4d53842cc573724df003f55` |
| N04-B05 | `87d3159243ad32fcf4739799478a69b2f8d9eb22994a9a2b701ecaa2752e5950` |
| N04-B06 | `ae0a8306d017225a899a8aa7b4038eca836550c51c702a9c9e3c49fd1c30eef0` |
| N04-B07 | `17e336e71bc3690f9c2bf6d0783099261662fb5551f8e2d942df22948bee217f` |
| N04-B08 | `431555e485c0362703faa4bcd660ad8627774bd6d02619d12520d35d53caf183` |
| N04-B09 | `f51418182cf1beee23a947de3f67771bddfd023a5e6599350c6be63e9b15a87c` |

The fixed v20 proof SHA-256 is `cb087c42a24d7a7f6ddbd922b05f379efab8f68e991587b30ee8bf51f0e1298d`. The predecessor question-set hash is `6f493ddd0ebfbbd5fa7acf98e17de69420360925f498791a683aca5f1d7f1f53`; the v20 question-set hash is `5b552f935cc3fa8bb142ccd38dc747a19a57823a8c7c8fd243fc786d43f0fe72`.

## Verification run

- `node --check scripts/content/verify-migration.mjs` — passed. Current verifier SHA-256: `43d7e66f2ed19fe254fc4484226bd48f514c4405d206ccc24b2cd8e25de509c2`.
- `node --check tests/bizq01-ood-node-closure-20.test.mjs` and `node --check tests/ood-cohort16-historical-fixture.mjs` — passed.
- `node scripts/content/verify-migration.mjs --content-root content` — passed at 9 tracks / 16,077 current questions and 16,041 historical questions.
- `node --test tests/bizq01-ood-node-closure-20.test.mjs tests/bizq01-ood-node-closure-19.test.mjs tests/bizq01-ood-node-closure-17.test.mjs tests/bizq01-ood-node-closure-16.test.mjs tests/bizq01-ood-source-12.test.mjs tests/bizq01-ood-source-11.test.mjs` — 40/40 passed. This covers all 162 v19 items, 152 v17 items, 119 v16 items, the v20 proof/predecessor chain, direct missing-proof/tamper/source-membership/symlink failures, and old source11/source12 fixtures.
- `node --test tests/bizq01-ood-unit-cohort-13.test.mjs` — 5/5 passed, preserving the original v13/v12/v11 generation checks.
- A direct producer call reported 594 semantic replacement mappings, 25 Reason-only amendments, and 18 same-ID corrections.
- `test:canonical` contains `tests/bizq01-ood-node-closure-20.test.mjs` exactly once.

The full canonical suite, build/candidate checks, and independent producer acceptance remain with the root owner. No app, web, backend, runtime, candidate, admission, commit, or push changes were made in this slice.
