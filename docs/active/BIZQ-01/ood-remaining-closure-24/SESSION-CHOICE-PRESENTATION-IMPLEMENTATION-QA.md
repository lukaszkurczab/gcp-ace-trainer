# Independent implementation QA: saved choice order at practice presentation

**Verdict: PASS for this bounded application-runtime correction.** Both practice facades now apply the already-persisted occurrence order before returning a question to the production UI adapter. I found no change to question selection, authored content, scoring rules, storage, or release policy.

## Reviewed boundary

The approved scope is the existing Design Interview and Certification Practice paths. The canonical occurrence order is prepared and persisted elsewhere; these facades had been returning the source order. The correction reuses `isCanonicalOptionOrder`, rejects missing or malformed occurrence plans, and returns choice questions with only their option sequence copied into that saved order. Non-choice questions are validated and returned by identity. The screens already catch projection failures and show their existing unavailable state, so there is no source-order fallback.

I inspected both facade call sites, the projection helper, its test, and both real screens plus `toCanonicalQuestionViewModel`. The projection preserves stable option IDs, answer and feedback fields, while submission/scoring continues to use the selected option ID. Certification applies its existing active-question projection after ordering; that projection still strips answer, explanations, and feedback before the question reaches the screen.

## Independent verification

Using Node `v22.22.3`, I ran the new practice-facade test together with the existing canonical order, scoring/feedback, Design feedback, and Certification feedback suites: **24/24 passed**. This covers both real catalogs through the facades and UI adapter, correct and incorrect responses, unchanged order across a rerender and memory-backed resume/rebind, feedback targeting by stable ID, projection of single- and multiple-choice questions, malformed/missing order rejection, and exact non-choice/source preservation. I also ran `npm run typecheck`: **passed**.

The resolved repository evidence is consistent with this narrow result. The initial `qa:static` test phase had 1,872 passes, three failures, and four existing skips. All three failures were in `contentReleaseCrossRepo.test.ts`: its historical checkout did not match the locked commit, and the required expected-current-SHA variable was absent. The same three tests passed 3/3 when rerun with their required historical/current roots, and the content-boundary and runtime-privacy checks passed. The resulting matching evidence is 1,875 passes, zero unresolved failures, and four existing skips across those runs; it is **not** a single fresh all-green `qa:static` invocation. The corrected typecheck passes independently as well. The earlier typecheck failure log records only callback inference and answer-union narrowing in the new probe/test; the final focused test and typecheck use the corrected files.

This QA does not claim native/device behavior, real Premium authorization, interrupted-transaction recovery, source-proposal acceptance, full BIZQ-01 completion, or release readiness. The integration test uses memory-backed storage and synthetic admission as allowed by the approved test scope.

## Exact bindings

- Briefing SHA-256: `6e53c8ebf0448c937f73b3de825e49a75d2a07c2cfa0498bb32613cfa7c5f1cd`.
- Canonical runtime contract `docs/17-training-runtime-and-interaction-spec.md`: `f796b365bfbc16d82b5395d509a44a21ec86bd3a2adb2c29dc04ce8c7ace7c44`.
- BIZQ-01 criteria: `patternly/docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- `src/application/canonical/canonicalOptionOrder.ts`: `27746f6f74bbcd0eab325b98116a837ec8a519370a705bef2a4971ed8070a281`.
- `src/application/design-interview/designInterviewSessionFacade.ts`: `05c50447bf2ac9236e0f10f552baf083c69d064b1b4ed3814f88d5ce60696aeb`.
- `src/application/certification/certificationSessionFacade.ts`: `8c84783be91689a77a0b7c72d1e84520527828ab66f23b94b8f65184e73eae01`.
- `src/application/canonical/canonicalPracticeChoiceOrderProjection.test.ts`: `e736f5601547ca25588306c39ed30d585d3edfb6d15db352d34dc0e13167e33e`.
- Unchanged UI adapters: `canonicalQuestionViewModel.ts` `dcf17cee634856644f9f077665033f305d98f75b5d16737f4630cddc789ac1e3`; `DesignInterviewPracticeScreen.tsx` `a18f3881c56b79ee2988c9bd4ee913f733822f715f96b72f4ff2d7d3b4b3feb9`; `CertificationPracticeSessionScreen.tsx` `acd4aedb8c25a155fe3ee93d5254e932fb2def0b92b6218355de1193cea7109f`.
- Root preservation receipt: `ROOT-SESSION-CHOICE-PRESERVATION.json`, `0568a3d0856ab488a563a5717915b2e82bca69e8b86ced37409c1474d29e6b94`; it reports 935 untouched content files, 15 immutable proofs, no producer-tracked changes, both release locks byte-equal to HEAD, and the generated canonical content lock byte-equal to HEAD.
- Root matching-check receipt: `ROOT-SESSION-CHOICE-IMPLEMENTATION-CHECKS.json`, `a3657ee53ad83b974116c74e4d152b81f264000937da61152078e4184472b287`.
- Root’s focused implementation log: `SESSION-CHOICE-PRESENTATION-FOCUSED.log`, `05795b1718edd4b53a03385030caaf1edaf61e74854c669a05905885a49cd335`.
- Root’s three-test cross-repository rerun: `SESSION-CHOICE-PRESENTATION-CROSS-REPO.log`, `d944c46d4ac48cc1311cd81e5aaf6d38bc4a6358d9305df7493df2486b779809`.
- Root’s content and runtime-privacy boundary log: `SESSION-CHOICE-PRESENTATION-BOUNDARIES.log`, `ff086d359290b4a8d6b20812544deb5fb8d27f15be3b03003ceabccbb1d78a3c`.
- My independent 24-test run: `SESSION-CHOICE-PRESENTATION-INDEPENDENT.log` (bound in the accompanying JSON).
- My independent Node 22 typecheck: `SESSION-CHOICE-PRESENTATION-INDEPENDENT-TYPECHECK.log` (bound in the accompanying JSON).

The implementation package is accepted only within this saved-order presentation scope. Existing content work and broader BIZQ-01 acceptance remain separate.
