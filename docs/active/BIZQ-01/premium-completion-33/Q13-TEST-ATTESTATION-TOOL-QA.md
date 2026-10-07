# Q13 test-attestation tool — independent acceptance review

**Verdict: PASS WITH GAPS** for the bounded test-only source patch generator and receipt contract. This is not Q13 runtime acceptance and does not authorize treating an instrumented test build as an unmodified release binary.

The tool is suitable to prepare the reviewed instrumentation in clean detached copies of the two admitted commits. `generate.mjs` pins both refs, the owned source-file hashes, and the corresponding public content identities; refuses an attached or dirty checkout and in-repository binding path; patches only `App.tsx`, `TrainingLifecycleUseCases.ts`, and two generated helper files; and verifies the content lock and patched file hashes after application. The fresh nonce is injected into the app-entry helper, while a private mode-0600 binding records the exact source, tool, patch, and later app-tree/JS hashes.

The runtime contract matches the intended behavior. The entry import writes only the four allowlisted receipt fields using the current public content-lock identity. The lifecycle wrapper is inserted around the exact `resolveRuntimeForSession(session)` call. At both admitted refs, `resumeActiveSession` obtains the active session and passes that unchanged session pin to the resolver; `run("resume_unavailable", ...)` preserves `TrainingApplicationFailure` and wraps the exact resolver miss as its cause. The helper writes `identity_mismatch` only for the exact OOD v23 track/version/hash, v24 lock identity, and expected error/cause. It catches receipt-write failures and returns the original resolved value or rethrows the identical original error.

The nonce receipt is meaningful execution evidence for the **instrumented JS bundle**: an older cached OTA cannot contain a fresh post-build nonce, and the briefing forbids uploading the instrumented bundle. Missing or malformed receipts must remain inconclusive. The code and documentation explicitly disclaim unmodified-binary acceptance.

## Verification

- `node --import tsx --test 'docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/*.test.*'` — 10 passed, 0 failed.
- Tests exercise allowlisted receipt shape/stages, exact v23-to-v24 mismatch predicates, original result/error identity on receipt failure, exact-ref/hash/checkout refusal, patch scope, unchanged generated content lock, and build hash binding.
- Reviewed both admitted source refs directly at `TrainingLifecycleUseCases.ts:429-445, 566-574, 631-632`; both contain the same resolver boundary and error wrapping.
- Reviewed `Q13-CACHE-CAPABILITY-2026-10-07-03.json` and the preservation receipt. The bounded Debug cache create/write/read/delete probe passed with no canonical-store writes; relevant learning/profile preservation checks passed. This establishes Debug cache capability only.
- No detached patch, build, install, simulator action, account change, or runtime receipt was performed by this reviewer.

## Conditions and gaps before relying on a device run

- `exact_resume_success` is written immediately after the exact resolver returns, before `getDraft` and `runtime.validateResume`. It proves exact resolution, not full session restoration. Keep the stage interpretation narrow and separately require ordinary UI evidence plus the unchanged unanswered session payload/order.
- `bind-build` verifies that the supplied embedded-JS file is inside an `.app`, then hashes it and the app tree. It does not discover which JS file the native executable loads or verify the bundle identifier. Before install, independently confirm the passed JS path is the built app's actual embedded JS bundle and that the app identity remains the existing bundle ID; do not infer either fact from the hash receipt.
- The CLI permits a caller-supplied `--nonce`; documentation prohibits reuse, but the generator does not maintain a nonce-use registry. For each device run, omit `--nonce` so the tool creates a fresh 256-bit nonce, verify that exact nonce's cache paths are absent before the run, and build a new instrumented artifact for any rerun. Existing same-nonce files are not overwritten, so reusing a nonce could leave a stale receipt.
- Keep the already-approved execution gates: finish the currently owned OOD10 session before installs; validate content-release integrity at both refs; use the same app identity with ordinary install/launch; require fresh entry and mismatch receipts and fail-closed UI with no answer or occurrence substitution; compare the session and Guest preservation categories afterward; restore the current app and required environment state. The Debug cache probe does not prove Release behavior.

Scores: objective/architecture fit **0.96**, simplicity **0.89**, risk **0.84**, maintainability **0.87**; minimum **0.84**. The remaining risk is confined to execution-time evidence interpretation and run hygiene, with concrete checks above; it does not require changing product code or weakening the receipt contract.

## Evidence

- Approved method: `docs/active/BIZQ-01/premium-completion-33/Q13-TEST-ATTESTATION-BRIEFING.md`
- Tool: `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/generate.mjs`
- Policy/runtime: `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/attestation-policy.ts`, `attestation-runtime.template.ts`
- Tests and usage: `docs/active/BIZQ-01/premium-completion-33/q13-test-attestation/attestation-policy.test.ts`, `generate.test.mjs`, `README.md`
- Debug-only cache prerequisite: `docs/active/BIZQ-01/premium-completion-33/Q13-CACHE-CAPABILITY-2026-10-07-03.json`
- Cache preservation receipt: `docs/active/BIZQ-01/premium-completion-33/Q13-CACHE-CAPABILITY-PRESERVATION.json`
