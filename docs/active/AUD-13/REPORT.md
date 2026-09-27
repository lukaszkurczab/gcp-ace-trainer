# AUD-13

## Assessment

- Objective and architecture fit: 0.95
- Simplicity: 0.90
- Risk: 0.87
- Maintainability: 0.93
- Minimum score: 0.87
- Luna High briefing: APPROVED

## Confirmed cause and correction

The Custom Practice setup and route correctly supplied `feedbackMode: "atSessionEnd"`, but the Algorithms facade forwarded that UI/domain field unchanged. `CanonicalTrainingRuntime` consumes the canonical `feedbackTiming` field and therefore treated the missing field as the default `afterEachAnswer` mode. Runtime reproduction on the existing iPhone 17 confirmed this exact mismatch twice.

`startAlgorithmsSession` now owns the explicit boundary conversion:

- `afterEachAnswer` → `after_each_durable_submit`
- `atSessionEnd` → `after_session_completion`
- an omitted UI value remains omitted for fixed/default modes

The adapter preserves the remaining request fields and is exercised through the real `startAlgorithmsSession` lifecycle seam, so the regression test detects both incorrect mappings and a bypassed adapter.

## Changed paths

- `src/application/coding-interview/codingInterviewSessionFacade.ts`
- `src/application/coding-interview/codingInterviewSessionFacade.test.ts`
- Deleted the completed `docs/active/UI-26-06/REPORT.md`; this report is the current task artifact.

## Verification

- `node --import tsx --test src/application/coding-interview/codingInterviewSessionFacade.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts` — passed, 8/8.
- The earlier journal/draft/finalization gate passed 60/60, including force-close recovery, journaled lifecycle, mutation journal/materializer/verifier, draft, and finalization tests.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- Full `npm test` — 1305/1311 passed. Six pre-existing repository-wide failures remain outside this slice: lost-key retry expectation (295), visual-shell route count (589), three environment-bound cross-repo content checks (638–640), and locale-key inventory (942). None imports or exercises the changed Algorithms facade boundary; the focused facade/runtime and journal gates are green.
- Maestro used only the existing iPhone 17 (iOS 26.4); no simulator, installation, or device data was created or reset.
- Session `coding-interview-dsa-problem-solving:coding-interview-custom-practice:4` started with durable configuration `length:10:feedback-timing:at-session-end` after the fix.
- Answers 1–5 were submitted individually and the durable session advanced to question 6/10. The unselected/unsubmitted response on question 6 was not counted as durable evidence.
- The session was left for later, Patternly was terminated and launched again, and the Home resume card referenced the same session ID. Continuing reopened the same session at question 6/10 with the same deferred-feedback configuration and foreground timer.
- Questions 6–10 were submitted after restart. The same session produced a completed result with `10:at-session-end` configuration.
- Review opened exact occurrence 4 (the fifth response), question `alg-complexity-scaling-001`, with a persisted `correct` result and no submission control.
- The pre-fixture active track, Backend System Design, was restored and confirmed by `patternly:home:track-card:backend-system-design-interview`.
- Independent `qa-gate` on GPT-6 Luna High: **PASS**. The reviewer traced the sole Custom Practice start path and lifecycle boundary, found no bypass, reran the facade/canonical runtime tests (8/8), typecheck, and diff-check, and accepted the same-session cold-restart evidence without treating screenshots as durability or backend proof.

## Evidence boundaries

- Screenshots before and after restart confirm presentation only. Durable behavior is established by the same session ID, exact question-6 position after process restart, completion, and occurrence-4 review selectors.
- The foreground timer showed `01:29` before leaving and `02:26` after resuming and executing further foreground checks. The journal/timer test suite establishes checkpoint semantics; this short manual restart is not claimed as a precise wall-clock exclusion measurement.
- Three discarded setup sessions were deliberately abandoned during diagnosis. No unrelated device data or named stash was changed.
- The six repository-wide failures listed above were not changed or represented as PASS; they remain visible for their owning tasks.
