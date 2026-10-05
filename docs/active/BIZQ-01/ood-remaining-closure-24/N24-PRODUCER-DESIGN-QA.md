# N24 fixed producer design review

**Verdict: PASS for the fixed producer design.** This reviews the proposed N24 proof and verifier approach only. It is not approval of source activation, implementation, generated consumers, admission, native/Premium behavior, or full BIZQ-01.

## Bound inputs and independent checks

- Producer briefing: `N24-PRODUCER-BRIEFING.md`, SHA-256 `fd9a92f02d939c1b0ec3790ca1c83a36517480da3b8920543d15aebb2b2a1abc`.
- Prepared proof: `PREPARED-FIXED-PROOF24.json`, SHA-256 `3c2636ac2d98c7eb0179281bf3bb30aa89934e5a11846e79f69ba35d36e0c1c9`.
- Fixed map: `ROOT-N24-PRODUCER-MAP.json`, SHA-256 `dd444141610a8057053501ade6997323b833bb4d4e7fbd268cff4b896abf9892`.
- Root exact proof/data check: `ROOT-N24-PREPARED-PROOF-CHECK.json`, SHA-256 `fdfcfba50b22d58050dc1143fd2305d3a4db665dd2371b3c2b202bdf987df943`.
- Preservation baseline: `ROOT-N24-PRESERVATION-BASELINE.json`, SHA-256 `1f102728c09666e5a1714c4d90e7141b09dc2a7ce7828da62d6853aa8b6b0f4c`.
- Baseline producer HEAD is `9e2d97f5ee28793c14341d031697cd89273fe288`; I independently confirmed it is the current `patternly-content` HEAD and matches `beforeProducerCommit`.

I independently reconstructed each of the 18 proposed source arrays from the live v23 bytes and fixed whole-object pairs. All 18 live files match their `beforeSourceSha256`; substituting the bound `currentQuestion` objects in source order reproduces each declared N24 `sourceSha256`. Each array has 18 objects, for 324 exact before/current pairs: 36 reserved-ID replacements and 288 same-ID corrections. The 1,413-object predecessor QSet matches the proof's before hash; substituting the 324 current objects produces the exact proposed current QSet with 1,413 unique question IDs. Root's prepared-proof check independently records 1,089 preserved objects and unchanged current sources. This is data/proof review; the proposed v24 files are not yet active.

The producer map and proof agree on the proof hash, scope, version transition, source hashes, item identities, accepted answer IDs, and taxonomy. Each replacement changes question identity and uses fresh option IDs relative to that item; same-ID corrections retain their question identity. The check is per question and does not imply a new cohort-wide option-ID uniqueness rule.

## Design assessment

The approach is compatible with the repository's existing closed proof architecture. The N23 validator in `patternly-content/scripts/content/verify-migration.mjs:11100` onward already checks fixed descriptor metadata, exact proof bytes, catalog version, QSet, source paths and bytes, per-item taxonomy and accepted option, per-item option identities, source/canonical equality, and exact reconstruction of predecessor source/QSet bytes. It then creates a private predecessor catalog/location view and calls the existing fixed proof loader at lines 11249–11282. The version dispatcher at lines 11661–11682 selects a validator by literal content version. N24 can add a correspondingly fixed branch, reconstruct v23 privately, and call the unchanged N23→N22→N21→N20→N19a→N19→N17→N16→N13→N12→N11 chain.

The brief keeps that boundary closed: one fixed 18-file descriptor, a proof pinned by exact bytes, strict source and object membership, and no generic proof override, runtime archive, alternate pipeline, schema migration, or new admission authority. The scope's 18 N08/N09 files are disjoint from the N07 paths used by N23. The preservation baseline records 14 existing descriptors, six private guards, 15 immutable business-quality proofs, 935 untouched content files, and eight other artifacts. Keeping those existing definitions and proof bytes fixed is the right compatibility constraint.

The historical-fixture plan is also coherent. The existing v23 fixture ingress in `patternly-content/tests/ood-cohort16-historical-fixture.mjs:19–53` reconstructs v22 from exact v23 source bytes and removes the v23 proof in the private fixture. N24 needs a matching v24→v23 ingress ahead of that path, then every existing older restoration must reach the unchanged chain. The new N24 test must also copy its proof and all predecessor proofs into its temporary fixture, as the N23 test does at `tests/bizq01-ood-node-closure-23.test.mjs:24–56`.

For implementation verification, the focused N24 suite should exercise all 324 objects against the production validator/scorer, every authored option in normal and reversed order, stable feedback targets, exact current and retired identity membership, and fixed-proof/source/catalog/predecessor tampering including symlink substitutions. It should exercise the v24→v23 historical restoration while preserving the existing N23 and older-version counts/assertions. Register the suite once in `package.json`'s existing `test:canonical` list. These checks follow the N23 test pattern at lines 85–180 and the stated N24 scope; they do not add a new release gate.

| Dimension | Score | Basis |
|---|---:|---|
| Objective and architecture fit | 0.95 | Completes the accepted final OOD cohort through its existing fixed proof, candidate, admission, and provenance path. |
| Simplicity | 0.90 | Adds one closed version branch and a historical fixture ingress instead of a second pipeline or general override. |
| Risk | 0.84 | The fixed map and exact reconstruction bound the data change; 324 changed objects and a long proof chain still require the real tests and preservation checks. |
| Maintainability | 0.86 | Extends the existing versioned proof pattern while preserving immutable predecessors and old guards. |

The minimum is 0.84, above the 0.8 redesign threshold.

## Limits and blockers

No design blocker found. The verifier branch, source activation, producer tests, full canonical suite, candidate/app synchronization, admission, and web provenance have not been verified by this review and remain implementation or downstream work. The root check and my read-only reconstruction establish that the proposed fixed inputs bind coherently; they do not establish that an implementation passes those checks.
