# Independent design review: saved option order at practice presentation

**Verdict: PASS.** The briefing closes a concrete gap between an already persisted session order and the options actually presented by two practice flows. Its one projection and two facade call sites use the existing session occurrence order and existing membership validator. It introduces no shuffle owner, persistence change, content change, admission policy, or new product gate.

## Frozen inputs and repository evidence

- Briefing: `SESSION-CHOICE-PRESENTATION-BRIEFING.md`, SHA-256 `6e53c8ebf0448c937f73b3de825e49a75d2a07c2cfa0498bb32613cfa7c5f1cd`.
- Actual read-only preflight: `ROOT-SESSION-CHOICE-PRESENTATION-PREFLIGHT.json`, SHA-256 `a839248fb3c63096d02f563fbd5f5c428a9ba4914afa5ef9d81382205841a9c3`.
- Existing runtime contract: `docs/17-training-runtime-and-interaction-spec.md`, SHA-256 `f796b365bfbc16d82b5395d509a44a21ec86bd3a2adb2c29dc04ce8c7ace7c44`.
- BIZQ-01: `patternly/docs/specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md`, SHA-256 `c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3`.
- Existing ordering preparation and validation: `patternly/src/application/canonical/canonicalOptionOrder.ts`, SHA-256 `e91aaf2818ac669f30e47528e2ba08d91eae67a770c806f704ce26bb42ded74e`.
- Affected projections: `patternly/src/application/design-interview/designInterviewSessionFacade.ts`, SHA-256 `4ff9001ce690486e60ecc2c8ebe47d19c7caf1a054bfdc01c57eaf93b271fa1a`; `patternly/src/application/certification/certificationSessionFacade.ts`, SHA-256 `1727816579ef068265826070a20eb8c4657514c0c1f08077105b5c7f1ed26240`.
- Current UI adapters: `patternly/src/features/practice/canonicalQuestionViewModel.ts`, SHA-256 `dcf17cee634856644f9f077665033f305d98f75b5d16737f4630cddc789ac1e3`; `DesignInterviewPracticeScreen.tsx`, SHA-256 `a18f3881c56b79ee2988c9bd4ee913f733822f715f96b72f4ff2d7d3b4b3feb9`; `CertificationPracticeSessionScreen.tsx`, SHA-256 `acd4aedb8c25a155fe3ee93d5254e932fb2def0b92b6218355de1193cea7109f`.

The existing contract says to prepare the order for every occurrence, persist it with the session, use stable IDs for scoring, and reuse the exact order after resume. It permits source order as a valid stored permutation, so the issue is not any particular authored array. The actual preflight reports that 9/10 prepared occurrences in each sampled track had a saved order different from the raw-question view. I independently traced the relevant call sites: both facades resolve a question but omit `session.optionOrderByOccurrence[occurrenceId]`; the shared view model maps options in received order; the controls render that order. This agrees with the preflight’s reported mismatch and identifies the narrow missing adapter input.

## Assessment

Objective/architecture fit **0.97**, simplicity **0.92**, risk **0.87**, and maintainability **0.90**; minimum **0.87**. The proposal uses the existing occurrence-specific order and `isCanonicalOptionOrder`, then applies the result before either facade hands data to its screen. Invalid or missing orders fail through existing async unavailable/error paths rather than silently returning source order. Keeping the transformation in the application projection preserves the UI contract and the existing scoring-by-ID boundary.

The non-choice behavior is appropriately distinct: validate its existing declared control order and leave the interaction unchanged. For choice interactions, copy only the options array into the saved permutation; preserve IDs, answer, feedback targets, and all other question fields. Certification must keep its existing answer/feedback stripping. The proposed tests cover actual prepared session data, resume/rebind, both facades, the production view model, scoring/feedback by ID, and malformed order rejection. These are the right checks for this adapter change and do not claim device or Premium evidence.

I found no material conflict with the canonical contract and no need to rotate source arrays. The change addresses the view boundary where the persisted order is currently dropped. Content-specific length and distractor findings remain separate from this common runtime correction.

This is design acceptance only. It does not establish implementation correctness, producer or consumer acceptance, native/Premium behavior, full BIZQ-01 completion, or release readiness.
