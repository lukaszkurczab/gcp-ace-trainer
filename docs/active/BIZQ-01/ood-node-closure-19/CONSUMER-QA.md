# Independent consumer QA — OOD N03 cohort 19

**Verdict: PASS for the bounded local consumer contract.** This accepts the synced consumer path and focused content test against the frozen 162-question cohort. It does not accept N03 pool eligibility, native-device behavior, Premium access, or the wider BIZQ-01 objective.

## Bound inputs

- App checkout: `62f01a6dbbcd0abe85fe29118e59a5b50184a44d` (consumer changes were present in the working tree during review).
- Content checkpoint: `9d89f2038b3931e35feb995fabb128796a1a4d11`; readiness record: `693e55139e554263e004822a75d0a555d1dc2052`.
- Candidate: `4ab655bd84a1e8f252d15b6ee217ab3451ced917cdc5ef2ea5c9f9bfa6e5c13a`.
- OOD artifact: version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-19`, 1,413 questions, SHA-256 `9632bd529f51a9ad29e5dd54a7e22684c668db22d3f5a6c49764c405689a95fb`.
- Bundled content-lock SHA-256: `56340a2a403bf0d853225ffd0a4d7ed407f130bad536b1050944aa708a30c8fc`.
- Current release-lock SHA-256: `987d414a3ff8a6ba3613d50d301136adc1c79933dbe77fd8c910a03b5aba7ea9`.

The generated OOD artifact and content-lock agree on track, version, count, and digest. The release lock binds the same OOD digest/version and candidate ID, and its bundled-lock digest matches the current content-lock bytes. The new test pins each of the nine reviewed proposal payload hashes and verifies all 162 questions match both the producer source and runtime artifact. The preservation receipt reports 1,251 other OOD objects unchanged, all 162 retired IDs absent, and the historical release lock byte-exact; it also records the eight other generated artifacts unchanged.

## Checks performed

- `node --import tsx --test src/content/bizq01OodNodeClosure19.test.ts src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts` — **22/22 passed**.
- `npm run typecheck` — **passed**.

The focused test checks all nine units and all 162 new IDs against frozen proposal bytes, source files, and the loaded runtime catalog; verifies all predecessor IDs are absent; and checks the preserved accepted N01 (136) and N02 (152) objects. For each single-choice item it checks real scoring for every option, score invariance under option reversal, exact wrong-option feedback targets, and submitted feedback. The pre-answer projection is compared to its exact expected prompt/constraints/choice-options shape, then checked unchanged after mutating the answer, Reason, and Details sentinels. Choice controls use stable option IDs and radio roles with all controls initially unchecked. The mode-pool assertion confirms all three ordinary pools remain exactly the 136 N01 IDs and contain none of the N03 IDs.

The first GREEN attempt had one test-only false positive: B02-019’s visible correct option text equals its authored Reason, so a raw substring search incorrectly treated visible choice text as feedback disclosure. The assertion was replaced with exact projection equality plus hidden-field mutation sentinels. The preserved first-failure log documents that attempt; the corrected focused run passed.

## Boundary

This review confirms the local artifact/runtime consumer binding and focused modeled UI projection, scoring, feedback, and pool contracts. It does not establish actual screen-reader operation, device presentation, native acceptance, N03 mode-pool eligibility, Premium availability, or full BIZQ-01 completion. Separate source/admission/provenance and any native gates remain owned by their corresponding package evidence.
