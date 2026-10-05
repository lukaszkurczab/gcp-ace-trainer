# CI admission-input design review

**Verdict: PASS for the bounded workflow correction design.** The proposal fixes a reproducible missing-input failure in the content CI test by checking out the already-admitted app at its exact commit beside the content repository. It preserves the existing admission logic and workflow gates; it does not establish that either workflow has been changed or passed after the change.

The frozen briefing is `CI-ADMISSION-INPUT-BRIEFING.md` (SHA-256 `e4b3acaa2f9052101c399ce12f3a3b6cc72a9d58e2b146e14580bd59a393c82f`). Its JSON counterpart is `CI-ADMISSION-INPUT-BRIEFING.json` (SHA-256 `a889d1fbd50d900c2807eae5cab595544102ecc978447a8bd768b7d6fe22ffdf`). The referenced current workflows, test, implementation, and admission file still match their recorded pre-change hashes; this is a design review, not implementation QA.

The failure is concrete. The recorded post-push run for content commit `27b7b7c9ece584e9904b343e63b49cd8a7f087c6` failed in `npm test` because `candidate-admission-v3.test.mjs` resolves the app root as `../patternly` and could not read `integration/contracts/content-release/release.lock.json`. The preserved workflow log confirms the runner checked out only the content repository. The actual missing-input probe reproduces `ENOENT` before writing an admission receipt. The app's post-push run at `ea4f3d61b39bab6b9f12ace73b34721d0d6e717a` passed, but that does not provide the missing app directory to the content job.

The proposed sibling layout matches the actual path contract: check out content into `$GITHUB_WORKSPACE/patternly-content` and the app into `$GITHUB_WORKSPACE/patternly`, and set job `defaults.run.working-directory` to `patternly-content`. The checkout `path` for the first repository is an important implementation detail implied by that layout; leaving the initial checkout at the workspace root would not create the sibling paths the existing test requires. GitHub's `actions/checkout@v4` supports a relative checkout path and a repository/ref input, and job-level `defaults.run.working-directory` applies to `run` steps. The target app repository is publicly readable; I confirmed its public repository page, and the pinned frontend commit `50a6811cde15b662e8c45f777fcc9c447a482d3a` exists locally and is an ancestor of its current `origin/main` commit. The admitted app lock, bundled content lock, and runtime test are present at that commit.

Reading the committed admission JSON in a Node step, accepting only a full 40-character lowercase hexadecimal `frontendCommit`, and using that validated output as `actions/checkout@v4`'s `ref` pins the consumer to the admission instead of drifting with `main`. This also makes interpolation safe for the output channel. Running `npm ci` from each checked-out repository uses each committed lockfile; the app declares Node `>=22.13.0 <23`, while both existing workflows already select Node 22. For the manual workflow, changing `cache-dependency-path` to `patternly-content/package-lock.json` keeps setup-node's cache keyed to the content lock in the new sibling layout. App dependency caching is optional and is not needed for correctness.

The proposal leaves triggers and existing commands/gates in place, does not dispatch the manual release workflow, and does not introduce a new secret or alter admission authority. The existing test still calls the real admission API and runtime test. Its local admission boundary remains `local_verified_artifacts_no_deployment`. The candidate draft code derives the source commit from `git log ... -- content`, so changes limited to `.github/workflows/` do not change the content source snapshot identity. After implementation and ordinary push, the required evidence is the actual content CI run completing all existing steps, including the later build/readiness steps that the failed run skipped.

Scores (0–1): fit **0.96**, simplicity **0.88**, risk **0.86**, maintainability **0.86**; minimum **0.86** (required **0.80**). Exact commit pinning and the existing sibling-root contract are the decisive strengths. The only implementation clarification is to put the first checkout at `patternly-content`; it is directly implied by the proposed layout and is not a reason to reject the design.

This PASS covers design only. It makes no claim of actual workflow implementation, hosted CI success, release readiness, external publication, mobile/native acceptance, or full BIZQ-01 completion.

## Bound evidence

| Input | SHA-256 |
|---|---|
| `patternly-content/.github/workflows/content-publishing.yml` | `216d4c7298c7577d3c4be4b1c1b237e1280feb60dbf951c30c0218912eec2089` |
| `patternly-content/.github/workflows/real-content-release.yml` | `7ac1f5c90985a2edcceca485ad8844cc81edbe860ba62437a24f31fc493591bd` |
| `patternly-content/tests/candidate-admission-v3.test.mjs` | `52113c4f6a9d821a745d562cd79421ccd858545d3dff2e4d767f4968d4995c21` |
| `patternly-content/scripts/review/candidate-admission-v3.mjs` | `a0e69631a55619cfdb0a57bd7351266f4e1ef37a178163a5eba3422fe22ba549` |
| `patternly-content/evidence/admissions/candidate-admission-v3.json` | `80bb66c3813d1283101fde50d5d563ee8987d26516f16338a68e63803c1653d5` |
| `POST-PUSH-CI.json` | `3fb5a8050bc2d38c2f4c6b919d9a0c6e31c72cfefda299460ad269e054fe23b1` |
| `POST-PUSH-CI-content-architecture.log` | `ca3a08d5233b365b5ddaf59a5af694fbed6876a6b2d65a9df117fc993f5a148f` |
| `CI-ADMISSION-MISSING-INPUT-PROBE.log` | `a1669ca69ef1c4ab9b6e55e425c3cc82ca46912e47993dfe8b4f56dc01e43e3b` |

Primary implementation references: [actions/checkout v4](https://github.com/actions/checkout/blob/v4/README.md) and [GitHub Actions workflow syntax for job defaults](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_iddefaultsrun).
