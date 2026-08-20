# CNT-06 follow-up — AZ-104 package provenance and Design Backend input audit — 2026-08-20

## Outcome

The attempted AZ-104 Free-node cutover to `patternly-az104-0002` was stopped by the canonical immutable-build contract and reverted. The existing package remains pinned to `patternly-az104-0001`; the current release `patternly-az104-0002` remains preserved as independently verified release evidence.

The next Design Interview package slice is also not executable yet: the Backend family registry contains eight provenance-resolved slot bindings, but the canonical Backend source contains no authored item records bound to those eight binding IDs. Existing 1,569 Backend records are approved as a complete source review set, but remain an inactive candidate source for runtime purposes.

## Evidence

- Content `master` after the safe revert: `16322c62fb2dfabcbcf49208818089b438ae7886`, pushed to `origin/master`.
- `patternly-az104-0002` release artifact: source commit `ad6cbe1b6948ddb16b7c9f7f3a26ddb49c12e0de`, checksum `968386e75c9abd4b54401e9876dadba6c0dbd01003aea8cfcad3a8d7027569ec`.
- Canonical AZ-104 track artifact and build report for the immutable content version still prove source commit `67437fa377b4021fb1a4764095fa16e6048641a2`.
- `npm run build:bundled-free-node -- --track microsoft-azure-administrator-associate-az-104` failed closed with `TECHNICAL_EVIDENCE_PROVENANCE_MISMATCH` when the pin was changed to release `0002`.
- After the revert, content `npm test` passed `142/142`.
- `config/families/design_interview.json` declares the Backend first batch as eight slot bindings under `scope: authoring_feasibility_only`; `config/design-interview-source-registry.json` confirms those bindings are provenance-resolved, while no matching `sourceBinding.bindingId` occurs in `manual/source/backend-system-design-interview`.

## Decision boundary

Do not overwrite the historical AZ-104 build report, do not relabel the `0001` package, and do not map the Backend slot bindings to nearby generated questions. The next coherent content step is a separately authored, source-bound Backend batch plus an explicit Design package contract; only then can a Design package be built and passed to the app resolver/runtime work.

## Remaining gates

- AZ-104 package cutover requires a new canonical immutable track-build/report pair or an explicitly supported release-specific build-report contract; neither exists today.
- Design RUN-01/RUN-02 remain blocked until the family-owned interaction/scoring/package contract and executable Backend source batch exist.
- No publishing admission, runtime admission, launch-lock expansion, or commercial readiness is inferred by this audit.
