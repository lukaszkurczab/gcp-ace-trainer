# Root actual producer checks before source checkpoint

2026-10-03, content HEAD 237c14349d8bbe26aaed6d83ce58103b20761dd0 with the owned source12 changes. Producer worker stopped; root ran these checks against actual stable worktree files.

- Targeted source11/source12/migration/content-builder/ODK tests: 54/54 PASS, zero failures/skips (ROOT-PRODUCER-targeted.log).
- `npm run verify:migration`: exit0, nine tracks, 16,077 current / 16,041 historical questions; both OOD replacements i001→i018 and i002→i019 retained (ROOT-PRODUCER-migration.log).
- Existing builder validate and canonical-answer test for OOD: each 1,413 PASS (ROOT-PRODUCER-ood-validation.log and ROOT-PRODUCER-ood-answers.log).
- Existing `build-all --output-root /private/tmp/bizq01-source12-root-built`: exit0. Actual output comparison to BEFORE-BOUNDARY.json proves other eight artifacts byte-identical with unchanged versions/counts. Only OOD advances to source12, SHA256 00a6bf06a885e4b54c633297348d402c39732b8906b4ac844578d6276236c1bd, count1,413 (ROOT-BUILD-PRESERVATION.json).
- Source comparison to committed predecessor: 17→17, i002 removed/i019 added, other16 objects exact; only this source file and OOD catalog version change among tracked canonical content; immutable source11 proof bytes unchanged (ROOT-SOURCE-PRESERVATION.json). Actual i019 deep-equals the reviewed PROPOSED-QUESTION.json including the resolved visible invariant.
- Owned content `git diff --check`: exit0.

Full `npm test` before checkpoint is **114/116, two failures**, not PASS. Both actual failures report “Canonical content paths or bytes differ from the committed source snapshot; commit or reconcile content before drafting.” They occur in candidate-draft and candidate-readiness tests at the existing assertCanonicalSourceSnapshot guard. ROOT-PRODUCER-canonical-before-checkpoint.log retains both traces. No safeguard was weakened. After independent source/proof acceptance, the authorized local source checkpoint is required by this existing guard; rerun the full suite before recording a passed repository-test basis or candidate readiness decision.

Source semantic acceptance is separate in SOURCE-SEMANTIC-QA.md. Independent producer-proof acceptance and all downstream consumer/admission/final-delivery checks remain pending. No candidate generation, app synchronization, admission, push, native test or deployment is established by this report.
