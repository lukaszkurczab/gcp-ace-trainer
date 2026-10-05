# CI admission-input implementation QA

**Verdict: PASS for the local two-workflow correction.** Both workflows now create the sibling checkout layout required by the existing admission test, install the app at the admission-pinned SHA, and retain the content test/build/release checks. This is not hosted-CI acceptance: the ordinary post-push content workflow still needs to demonstrate that `npm test` and all later build/readiness steps complete.

The implementation is limited to the two workflow files. Their current SHA-256 values are `18955c8e440c4c4dc6a7c1b708ced9feca60e4426ad5ae63e3a9627dfff0406b` (`content-publishing.yml`) and `e3979195d0b824633f43a8338fa8f0d74bf5348742a6dae7376d96d264865d20` (`real-content-release.yml`). The content admission test, admission implementation, and committed admission JSON are unchanged from their reviewed hashes.

The content checkout is explicitly placed at `patternly-content`; the job defaults route normal `run` steps there. The validated `frontendCommit` is emitted as a step output, and the app is checked out from the fixed public repository into sibling path `patternly`. The app dependency install overrides the default working directory to that sibling. The manual workflow's npm cache path points to the content lockfile in its new location. I parsed both workflows with the app's existing `js-yaml` dependency and executed the exact inline SHA-reader script under Bash. Each emitted the admitted SHA `50a6811cde15b662e8c45f777fcc9c447a482d3a`; a malformed multi-line SHA was rejected by both readers before an output was emitted.

I independently ran the existing admission test with Node `v22.22.3`: **2 passed, 0 failed**. The test uses the actual admission API and invokes the app runtime test through the checked-out sibling. The local app worktree is at `ea4f3d61b39bab6b9f12ace73b34721d0d6e717a`, rather than the admitted `50a6811…`; I compared the full commit range and confirmed its 355 changed paths are all under `docs/` or `.agent/`, with no changes outside those directories. The lockfile and three runtime files consumed by admission are also identical at the pinned and current revisions. Therefore, the local test exercises the same app code, dependencies, lock and runtime test; the hosted workflow itself will check out the exact admitted commit.

The corrected inline-step probe is preserved in [CI-ADMISSION-FINAL-QA-FOCUSED.log](CI-ADMISSION-FINAL-QA-FOCUSED.log). The earlier probe-harness failure is also retained: it passed a shell heredoc to Node's JavaScript evaluator and failed before the shell script ran. I did not treat that failure as evidence about workflow behavior; the corrected Bash execution and invalid-input probes passed. The historical post-push content CI failure remains accurately recorded as an `ENOENT` for the absent sibling release lock before the fix. The manually triggered release workflow was not dispatched.

No admission rules, tests, release locks, runtime files, secrets or services were changed. The existing release/admission boundary remains `local_verified_artifacts_no_deployment`; no deployment or publication is claimed.

## Bound inputs and verification

| Input | SHA-256 |
|---|---|
| `patternly-content/.github/workflows/content-publishing.yml` | `18955c8e440c4c4dc6a7c1b708ced9feca60e4426ad5ae63e3a9627dfff0406b` |
| `patternly-content/.github/workflows/real-content-release.yml` | `e3979195d0b824633f43a8338fa8f0d74bf5348742a6dae7376d96d264865d20` |
| `patternly-content/tests/candidate-admission-v3.test.mjs` | `52113c4f6a9d821a745d562cd79421ccd858545d3dff2e4d767f4968d4995c21` |
| `patternly-content/scripts/review/candidate-admission-v3.mjs` | `a0e69631a55619cfdb0a57bd7351266f4e1ef37a178163a5eba3422fe22ba549` |
| `patternly-content/evidence/admissions/candidate-admission-v3.json` | `80bb66c3813d1283101fde50d5d563ee8987d26516f16338a68e63803c1653d5` |
| app `package-lock.json` | `0ababcb26d054bd5ea3f10e800e4049c273eb367baceef3b128a63f33e15f000` |
| `CI-ADMISSION-IMPLEMENTATION.md` | `6d41aa2b6b62d70f3d68b9982fd3502cf1916b2629536d983e3990630655144a` |
| `CI-ADMISSION-IMPLEMENTATION.json` | `a7abb0009e7cf9c2bf96c3091fa0d4fc199ff4d51d767d98130e1f883b5b44da` |
| This review's focused probe log | `266e8df24af33a6829e78708d1b11aec8733621dc5512b1dea405357b0093eb8` |

The upstream references used for the reviewed checkout and workflow behavior are [actions/checkout v4](https://github.com/actions/checkout/blob/v4/README.md) and [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_iddefaultsrun).
