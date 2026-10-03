# BIZQ-01 feedback delivery08 — independent source acceptance

**Verdict: PASS** for the bounded existing-payload SINGLE/MULTIPLE CHOICE source slice. Authored explanations now flow from canonical stable IDs through the existing immediate-practice projections and both existing Details adapters. This is not full BIZQ-01 acceptance.

## Criteria checked

- `projectCanonicalChoiceFeedbackMessages` derives wrong and omitted-correct targets from the same canonical control states, filters the original authored array without reordering it, and returns a frozen result. The real-content checks bind GCP q001 and Coding contrast006 to the locked artifact versions and compare exact authored text. Correct answers produce no unrelated wrong-option message; mismatched response types fail; absent authored messages and non-choice interactions retain their prior projection shape.
- Certification adds the optional messages field only to its existing after-each-answer projection. Deferred feedback remains `null`. Its session facade selects a materialized attempt for immediate feedback, so a merely submitted/unmaterialized response does not disclose the message.
- Coding passes the canonical composed messages through the existing practice projection, whose existing feedback-timing guard requires `afterEachAnswer`; the practice projection consumes materialized or already-committed outcome data. The actual Coding practice integration submits a wrong answer, checks exact messages and incorrect result, rebinds lifecycle composition, and verifies the projection remains stable.
- `CertificationPracticeSessionScreen` and `PracticeSessionScreen` pass the message array through unchanged. The actual JSX harness checks the expanded Details branch renders authored text with stable kind/target key and `maxFontSizeMultiplier={2}`, while the collapsed branch returns `null`. Existing Details renderer remains the only message renderer; no message is added to other surfaces.
- Coding's prior empty `wrongOptionExplanations` and `omittedCorrectOptionExplanations` placeholders are removed. Scoring, authored source, answer order, content versions, durability/timing gates, and post-session review wiring are outside this delta.

## Independent checks

From `patternly/`:

```text
node --import tsx --test src/application/canonical/canonicalChoiceFeedbackPresentation.test.ts src/application/certification/certificationFeedbackProjection.test.ts src/application/coding-interview/codingInterviewSimulationResult.integration.test.ts src/content/bizq01CodingSourceCopy.test.ts src/features/practice/practiceFeedbackDelivery.test.ts src/features/practice/practiceSessionPresentation.test.ts src/features/practice/practiceAnswerFeedbackPresentation.test.ts
40/40 passed

node --import tsx docs/active/BIZQ-01/feedback-delivery-slice-08/preflight.ts --expect-delivered
exit 0; expectedRed=[]

npm run typecheck
passed (`tsc --noEmit`)

git diff --check -- <owned production and test paths>
passed
```

The preflight used the locked GCP and Coding artifacts. It submitted GCP q001's wrong response through `CanonicalTrainingRuntime`, committed the outcome twice, rebound the in-memory repositories, and observed one attempt with the exact authored message in the canonical composer and immediate Certification projection. Correct-response messages remained absent and deferred Certification feedback remained null. The Coding facade integration separately covered durable submission and lifecycle rebind. Root's related focused run records 51/51 passing tests.

## Scope limits

This acceptance exercises the real JSX source branches with the repository's bounded harness; it is not a React mount, native layout, or VoiceOver run. No native device, post-session terminal review, non-choice message delivery, or broader bank-wide content-semantic audit was performed. Those paths remain explicit follow-up scope and do not block this bounded existing-payload source change.

A workspace-wide `git diff --check` also reported trailing whitespace in the unrelated, concurrently edited `docs/PATTERNLY-WORKING-PLAN.md`; the scoped check for this slice's owned paths passed. That foreign file was not edited.
