# BIZQ-01 common-runtime closure preflight (Q09/Q10/Q13)

Date: 2026-10-05. This is a read-only evidence reconciliation, not a runtime acceptance or a status change. N24 and its post-push CI were accepted separately; this note does not re-review N24.

## Finding

I found no new reproducible Q09, Q10, or Q13 implementation defect in the current source and focused tests. The remaining gap is actual runner evidence across process/device lifecycle and a live content update, not a failing source-level contract. The smallest useful next slice is a native runner check on the existing iPhone 17 using the already available free Coding custom-practice mode and a single-choice question: verify pre-submit secrecy, saved option-order/selection meaning after background/foreground or rerender, and feedback timing through session completion with expanded Details. This can advance Q09/Q10 without a Premium profile or partial-score denominator. It is an evidence increment, not full Q09/Q10 closure: the spec's repaired-question native checks and partial-answer case still remain.

Q13 has matching source-level exact-version behavior and package-retention tests, but no evidence here that an active session survives a package update in the actual runner without changing its question/answer meaning. Keep that as an evidence gap; no update-path regression reproduced.

## Requirement-to-evidence map

| Requirement | Current best evidence | Assessment and boundary |
| --- | --- | --- |
| Q09: rerender/restart an active session without changing option meaning | `canonicalChoiceOrderIntegration.test.ts` exercises prepared sessions, persisted option order, resume validation and selection projection after test-storage rebind. `canonicalPracticeChoiceOrderProjection.test.ts` checks Design and GCP facade projection, submit, and rebind. `trainingSessionDraft.test.ts` and `applicationSessionDurability.test.ts` cover durable draft/session state and resume constraints. | Source-level coverage passes; storage rebind is not an actual app process restart or native interaction. Native runner evidence remains missing. |
| Q10: no accepted answer, Reason or Details before submit/session completion | `canonicalQuestionViewModel.ts` projects prompt/constraints/interaction only; `certificationFeedbackProjection.test.ts` verifies projection and deferred feedback; `practiceSessionPresentation.test.ts` exercises phase gates, including submit/recovery and end-feedback states. | The contracts and renderer unit tests cover disclosure boundaries. No native screen/props inspection has verified the actual runner's before-submit and before-end views. |
| Q13: active session when its content package updates | `CanonicalTrainingRuntime.validateResume` binds session track/version/artifact and item references; `bizq01CodingSourceCopy.test.ts` verifies stale-version/hash rejection without answer substitution. `nodeContentPackage.test.ts` verifies exact package retention/resolution across activation. | The two layers agree on exact identity and fail-closed mismatch behavior. No current test or native run demonstrates an in-progress session across an installed content update; this is missing integration evidence, not a reproduced defect. |
| Actual native runner / repaired-question interactions | `native-runner-preflight-15/REPORT.md` records guest cold launch, accepted plan/schedule, settings and account-required Premium offer. The report explicitly says it did not run a repaired question or test answer/order/restart/end-feedback/Details/update-active-session. | Historical evidence is valid for that guest flow only. It does not establish current question behavior, a real Premium session, or full native acceptance. |

The bounded source checks run during this preflight passed 58/58 tests under Node 22 across lifecycle durability, draft persistence, canonical runtime/order projection, certification disclosure projection, source-copy mismatch handling and exact node-package retention. These tests support the source-level conclusions above; they do not simulate native process death or an active UI while installing an update.

## Feasible next evidence slice

`productModeConfig.ts` defines `coding-interview-custom-practice` as an immediate mode over the free Coding node and permits selectable feedback timing. That gives a reachable, non-Premium path for a single-choice Q09/Q10 runner check. On the existing iPhone 17, one coherent flow could start that mode, choose an option, background/foreground or rerender before submission, verify the selected stable option remains the same, verify no answer/reason/details are exposed, submit, complete the session with end-of-session feedback, then inspect the expanded explanation. Keep it to correct/wrong single-choice outcomes so the pending partial denominator is not implicated.

This would not satisfy the spec's separate native requirement to exercise correct, wrong and partial responses on repaired questions. The specific N08/N09 questions from N24 are outside the ordinary N01 pools and their real Design modes are Premium; that does not make all repaired OOD questions unreachable, since the current ordinary N01 pools include accepted and repaired questions. No authorized Premium profile is confirmed. The profile report treats that as an availability evidence gap, not proof that no account exists and not a RevenueCat-specific acceptance rule. Do not substitute a local testing toggle or simulated entitlement for a real configured profile.

I do not recommend adding another source-only test solely to mirror the already-covered facade, view-model, scoring and package identity contracts. Q13 can advance when a natural native/package-update test path is available; until then retain the precise mismatch/rejection contract and report the live-session integration evidence as missing.

## Scope and references

- Canonical requirements: [BIZQ-01 spec, Q09–Q13 and closure scope](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md#L169).
- Current canonical plan: [row 19a](../../../PATTERNLY-WORKING-PLAN.md#L72). It keeps BIZQ-01 partial and lists the Premium profile and valid-partial denominator as pending; the pushed N24 source/runtime package is an accepted fragment, not full BIZQ-01 acceptance.
- Current native boundary: [native runner preflight 15](../native-runner-preflight-15/REPORT.md) and [profile feasibility](../native-runner-preflight-15/PROFILE-FEASIBILITY.md).
- Historical source-sample report: [closure review 18 matrix](../closure-review-18/ACCEPTANCE-MATRIX.md). Its bounded 216-row sample is not a current defect inventory after the accepted N01–N09 packages; reuse individual evidence only where its exact object and behavior still match.
- Latest bounded package evidence: [N24 final QA](FINAL24-QA.md) and [post-push CI receipt](POST-PUSH24-CI.json). The package report's explicit limits on native, Premium and whole-area acceptance remain applicable.
- Exact focused-test invocation and raw source/test bindings: [machine-readable preflight receipt](COMMON-RUNTIME-CLOSURE24-PREFLIGHT.json).

No code, runtime, device, profile, service, plan, queue, or admission state was changed in this preflight.
