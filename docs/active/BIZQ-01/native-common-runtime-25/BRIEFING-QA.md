# Independent design review — native common runtime25

**Verdict: PASS WITH ISSUES** for the bounded Q09/Q10 runner proposal. This review covers the briefing only; no device, runtime, process, profile or service action was performed.

## Binding and scope

- Reviewed proposal: [BRIEFING.md](BRIEFING.md), SHA-256 `3cee632f6be55d728e9b1dcdf09ddb1c9ea8523b2c05f59f089b66749e91dac1`.
- Objective: use the current free GCP `certification-focus-practice` runner path to observe the shared option-order projection and pre-submit disclosure boundary, without claiming OOD, partial-score, Premium or full BIZQ-01 acceptance.
- Constraints reviewed: preserve the existing iPhone 17 and any active session; do not switch profile/track, clear data, toggle Premium, purchase, alter service configuration, seed a fixture or override choice order.

## Criteria and evidence

| Criterion | Finding |
| --- | --- |
| Q09 active session keeps option identity/order meaningful | `productModeConfig.ts` binds GCP focus practice to the free GCP node. `CanonicalTrainingRuntime.prepare` saves an occurrence-keyed option order; `validateResume` checks exact content identity, plan fingerprint and prepared order. The existing GCP integration test commits a session, rebinds test storage, resumes, and verifies the order. The proposal adds the missing actual-runner evidence. |
| Q10 does not expose answer/Reason/Details before submit | The certification session screen owns unsubmitted selection in local state; the canonical view-model and practice surface gate answer/feedback projection. Existing focused tests exercise the source-level disclosure behavior. The proposal checks the real rendered pre-submit screen, then checks the selected option’s authored feedback and expanded Details after durable submission. |
| No Premium profile required for this slice | `requiresPremiumProductMode` excludes `certification-focus-practice`; the lifecycle separately checks that the selected node is the track’s free node. The GCP focus mode has fixed `after_each_durable_submit` feedback, so the proposal correctly avoids claiming end-of-session feedback or partial scoring. |
| Existing data/session preservation | `startSession` rejects an existing active session. The proposal also checks visible resume/active-session state before starting and stops rather than answering, abandoning or clearing an unknown session. It keeps the currently selected GCP track, avoiding the documented track-switch/reminder reconciliation concern. |
| Actual restart boundary | **Clarification required in execution:** GCP focus practice does not persist an unsubmitted response draft. The screen holds that selection locally, and `validateResume` rejects a simulation draft for practice sessions. Exercise process restart only after a durable submit/ACK, then verify the resumed active session, its committed attempt and the option-order meaning. Do not assert that an unsubmitted selection survives process death. The briefing already disclaims that guarantee; this sequencing makes the Q09 evidence precise. |
| Full BIZQ-01 closure | Not claimed. Q10’s simulation-end path, repaired-question native interactions including partial, Q13 live package update, the authorized Premium profile and the pending valid-partial denominator remain outside this bounded slice. |

This restart clarification is the only issue. It uses the existing immediate-feedback practice contract; it does not add a product rule or require a code change. The proposed flow can still exercise Q09 after an acknowledged answer and Q10 before and after submission on the active session.

## Design assessment

Objective/architecture fit: **0.94**. Simplicity: **0.90**. Risk: **0.87**. Maintainability: **0.90**. Minimum: **0.87**. The proposal exercises one real free mode already wired through the production facade and renderer, uses the sole authorized simulator, and protects unknown session state. The only adjustment is to anchor restart evidence after the durable submit boundary.

The existing product contract is explicit in [productModeConfig.ts](../../../../src/content/canonical/productModeConfig.ts#L166), [premiumProductModePolicy.ts](../../../../src/application/trainingLifecycle/premiumProductModePolicy.ts#L3), [CanonicalTrainingRuntime.ts](../../../../src/application/canonical/CanonicalTrainingRuntime.ts#L33) and [TrainingLifecycleUseCases.ts](../../../../src/application/trainingLifecycle/TrainingLifecycleUseCases.ts#L165). The current UI’s local selection state is in [CertificationPracticeSessionScreen.tsx](../../../../src/features/practice/CertificationPracticeSessionScreen.tsx#L185); the active session conflict is checked before start. Existing relevant coverage is [canonicalChoiceOrderIntegration.test.ts](../../../../src/application/canonical/canonicalChoiceOrderIntegration.test.ts#L18) and [canonicalPracticeChoiceOrderProjection.test.ts](../../../../src/application/canonical/canonicalPracticeChoiceOrderProjection.test.ts#L23). Requirements are [Q09–Q10 and the runner clause in the BIZQ-01 spec](../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md#L169).

This review does not certify the configured device state or the result of the future runner flow. Those require the actual, separately authorized execution and independent runtime evidence.
