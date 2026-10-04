# Producer QA — reason amendment 19a

**Verdict: PASS for the bounded producer change.** The implementation integrates the frozen 25 same-ID `feedback.reason` corrections and proves exact reconstruction of the prior OOD-N03-v19 sources. It does not alter question identity, options, answer, prompt, Details, scoring, or the 450 semantic migration mappings.

The accepted scope is bound to manifest `725750aa6c8ebdba357f2e892e7c6aa94c45202a97c677d41284b8d063e199bf`, proposal `76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15`, and semantic review `641483a282017e2f55a876073e8f11d67b4f9fa57c9b7d28116c0a99c3e7c348`. The producer proof is `evidence/business-quality/bizq-01-ood-reason-amendment-19a.json` (SHA-256 `4d964e0a09690ba4b12382b11e9d9a5917069bbb6bbfe953f157aab5c1b7debb`). It binds the actual current source hashes and object changes; it does not contain proposal hashes. `ROOT-SOURCE-PRESERVATION.json` independently links those source bytes to the frozen proposal and records preservation.

The fixed verifier descriptor admits the exact proof and the three exact source files. It validates current regular-file paths, hashes, catalog version and membership, then applies the fixed 25-item reason-only mapping. Reconstruction restores the previous source objects and verifies their hashes and complete track set. The prior v19 → v17 → v16 → v13 → v12 → v11 proof chain remains intact; the private historical context is restricted to the fixed, closed v19 reconstruction. No generic override or caller-supplied proof path was introduced.

Independent verification passed:

- `node --test tests/bizq01-migration-proof.test.mjs`: 15/15, including missing/tampered proof or reason, wrong IDs/version/path/hash, unexpected object-field changes, invalid membership, stale mappings, and source/proof symlink cases.
- `node --test tests/bizq01-ood-node-closure-19.test.mjs`: 7/7 against the preserved historical chain.
- `npm run verify:migration`: passed; 9 tracks, 117 nodes, 943 units, 16,077 canonical questions, and 450 semantic mappings. The 25 same-ID reason corrections are accounted for separately.
- Independently checked the three reconstructed predecessor sources against the producer baseline and verified the ten immutable proof files against the preservation record.
- Root’s actual nine-track build passed; the other eight artifact bytes match their recorded baselines. `ROOT-BUILD-PRESERVATION.json` records these hashes.
- Root’s final focused mutation suite passed 15/15 using verifier SHA `4239f4c1557dadfcf24481e1b780d72a34129cab337457f7099ce6fe5d7a5a61` and test SHA `f2cc7e7cdef38de24bb96942e58596e432a2da3d043b59e474dd2502d39a8006`. The earlier stale expected-error assertion is retained in the log; the frozen test now expects the actual `CANONICAL_MEMBERSHIP` rejection.

Preservation evidence records 25 changed reason fields, 29 unchanged questions in the touched files, 1,388 other OOD questions, 16,052 other global question objects, 950 tracked content files and all ten immutable proofs unchanged. The migration summary reports 16,077 questions and all 450 existing semantic mappings.

This verdict covers producer implementation only. Clean-snapshot canonical checks, candidate/readiness, consumer synchronization, admission and release checks remain subsequent pipeline stages; this report does not claim they have passed. It also makes no consumer, native, Premium, or full BIZQ-01 acceptance claim.
