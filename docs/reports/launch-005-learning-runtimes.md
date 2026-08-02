# Launch 005 — learning runtimes behavioural evidence

Date: 2026-08-02

Status: `blocking` — Task 5 remains open

Accepted evidence pack: `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1527-final/`

## Outcome

The ordinary Algorithms and Cloud Certification runtime source is prepared for the final two-platform evidence run, and 5I-R8 source QA returned `pass`. The accepted post-R8 device pack is nevertheless empty because the simulator/emulator approval service exhausted its usage allowance and reported that access is unavailable until `2026-08-08 09:18 Europe/Warsaw`.

No Task 5 acceptance criterion is waived. No pre-R8 image was copied, renamed or promoted. This report does not claim a UI/UX pass, device parity, launch readiness or Task 5 completion. Task 6 must not start until the missing verified-terminal device evidence is complete.

## Source and environment

- Branch: `main`
- HEAD: `4c406a761ac2ffffab39e20ee98bab17b7bc85ea`
- Worktree: dirty
- Node.js/npm/Maestro: `22.22.3` / `10.9.8` / `2.6.1`
- iOS target: iPhone 17, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`
- Android target: `emulator-5554`; earlier available, currently unreachable because this sandbox cannot start ADB
- App ID: `com.lkurczab.patternly`
- Accepted capture profile: English, light theme, portrait phone

## Status reconciliation

| Item | Status | Evidence |
|---|---|---|
| Canonical ordinary runtime implementation through 5B-1 and 5I-R2 | done | Launch plan records passing focused/full/gate evidence and repeated independent QA for the closed source slices. |
| R8 explicit capture environment and local-bundle reopen source | done | Focused source QA `3/3`, runner syntax/YAML/CLI/diff checks and independent R8 QA `pass`, as recorded in the launch plan. |
| Pre-R8 device diagnostics | partial | Several iOS/Android paths ran, but naming and relaunch defects make them ineligible for final acceptance. |
| Post-R8 iOS evidence | blocking | No flow ran after the usage/approval rejection. |
| Post-R8 Android evidence | blocking | No flow ran; ADB is unavailable from the current sandbox. |
| Accepted screenshot manifest | blocking | `0/50`; intentionally empty. |
| Task 5 closure | blocking | Two-platform device evidence, manifest integrity and final evidence QA are missing. |
| Task 6 | deferred | Its verified-terminal-evidence input is incomplete; the launch plan forbids starting it now. |

## Pre-R8 diagnostic evidence

These runs show that parts of the learner journey were reachable. They are retained only for diagnosis:

| Platform / flow | Result | Repository path | Why it is not accepted |
|---|---|---|---|
| iOS / 10 | pass | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1459-final/runs/ios-10` | Pre-R8 capture variables produced `undefined` naming. |
| iOS / 20 | pass after R6a | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1415/runs/ios-20-r6a` | Pre-R8 naming defect. |
| iOS / 30 | pass after R7b | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1415/runs/ios-30-r7b` | Pre-R8 naming defect. |
| iOS / 40 | pass before relaunch R8 | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1415/runs/ios-40-r5` | Did not prove process relaunch plus explicit local-bundle reopen. |
| Android / 10 | pass | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1459-final/runs/android-10` | Pre-R8 naming defect. |
| Android / 20 | fail at dev-client launcher | `artifacts/maestro-screen-capture/launch-005-learning-runtimes/2026-08-02-1459-final/runs/android-20` | Relaunch exposed the Expo Development Build shell rather than the local Patternly bundle. |
| Android / 30 and 40 | not executed | — | No diagnostic result. |

The `2026-08-02-1527-final` accepted directory contains no copied or renamed diagnostic screenshot.

## Task 5 acceptance mapping

| Criterion | Automated/source proof | Pre-R8 diagnostic proof | Missing post-R8 proof | Status |
|---|---|---|---|---|
| 1. Learner-visible navigation, audit reset/bootstrap and stable selectors run on both phones without production changes | R8 source QA proves runner input validation, explicit final Maestro environment and exact bundle reopen; runtime selector/source tests are part of the expected gate. | Algorithms bootstrap and multiple flows reached current runtime surfaces on both platforms. | All eight current flow executions using the R8 runners. | blocking |
| 2. Shared shell, Algorithms choice/complexity/ordering, Certification single/multiple, long prompt/feedback and reachable actions | Presentation and accessibility tests cover shared shell/control ownership; content and scoring tests cover deterministic response types. | iOS flows 10/20/30 reached these states; Android flow 10 reached choice/complexity/feedback. | Accepted 25-state set on each platform, visually checked for clipping and reachability. | blocking |
| 3. Final durable feedback retains separate `Finish session`, followed only by verified result | `tests/practiceCompletionHandoff.test.ts`, `tests/trainingLifecycleUseCases.test.ts`, journal tests and the plan's seven-boundary completion evidence prove durable command behavior. | Pre-R8 iOS flows 10 and 30 reached separate Finish and verified result; Android flow 10 did so diagnostically. | Accepted iOS and Android screenshots for both families after R8. | blocking |
| 4. Truthful pause/leave and exact resume for both families | `tests/foregroundSessionTimerFacade.test.ts`, `tests/certificationPracticeLifecycle.test.ts`, `tests/runtimeAuditabilitySurfaces.test.ts` and lifecycle/journal fault tests cover pause, timer, exact resume and recovery. | iOS flows 20 and 40 reached pause/resume; Android flow 20 exposed the launcher defect that R8 repaired in source. | Post-R8 process-relaunch and exact-resume evidence for both families/platforms. | blocking |
| 5. Complete evidence pack, environment, commands, manifest, coverage and honest blockers | This report and the seven pack documents now exist; the accepted JSON manifest is valid and explicitly `blocked`. | Diagnostic runs and failures remain preserved at original paths. | 50 file records, successful run logs, readable images and one-to-one manifest verification. | partial |
| 6. Both platforms pass, screenshots are readable/non-empty, gates and independent evidence QA pass | R8 source QA passed; earlier closed source slices have the plan-recorded focused/full/gate and QA evidence. | No pre-R8 set satisfies the final R8 contract. | Two-platform rerun, screenshot integrity check, current focused/full/gates and independent evidence QA `pass`. | blocking |

## Current non-device verification

The controller reran the non-device gates after R8:

- focused Task 5/R8 set: `53/53` passed;
- typecheck: passed;
- content boundary: passed;
- runtime privacy boundary: passed;
- recovery inventory: passed;
- contract-change gate: passed;
- `git diff --check`: passed.

The full suite completed `533/556` assertions. All 23 reported failures are the
HTTP tests that need to bind a temporary listener on `127.0.0.1`; each failed
before its assertion with the same sandbox error, `listen EPERM: operation not
permitted 127.0.0.1`. This is an execution-access failure, not a passing test or
a product regression verdict. The full suite must be rerun with loopback access
and return `556/556` before Task 5 closure.

## Automated proof boundary

The launch plan also records the following evidence from completed source slices:

- slice 5H: `546/546` full tests and repeated independent QA `pass`;
- slice 5B-1: `551/551` full tests and repeated independent QA `pass`;
- slice 5I-R2: `555/555` full tests and repeated independent QA `pass`;
- slice 5I-R8: focused source tests `3/3`, runner syntax, YAML, Maestro CLI environment syntax, diff checks and independent QA `pass`.

Expected proof set after device access returns:

```sh
node --import tsx --test tests/rcAlgorithmsBootstrap.test.ts tests/runtimeAuditabilitySurfaces.test.ts tests/certificationPracticeLifecycle.test.ts tests/foregroundSessionTimerFacade.test.ts tests/practiceCompletionHandoff.test.ts
npm test
npm run typecheck
npm run validate:content-boundary
npm run validate:runtime-privacy-boundary
npm run recovery:check
npm run gate:contract-change -- HEAD
git diff --check
```

Screenshots do not replace deterministic tests for submit, advance, timer, abandonment or the seven completion fault boundaries. Conversely, source tests do not prove phone layout, scroll reachability or cross-platform parity.

## Required post-blocker execution

1. Restore approved access to the iPhone 17 simulator and `emulator-5554` after the reported availability time.
2. Start the current Metro bundle on explicit `127.0.0.1:8081` and execute the eight commands in the pack's `run-report.md`.
3. Require all four flows to pass on both platforms.
4. Verify `6 + 8 + 8 + 3 = 25` readable screenshots per platform and `50` total, with no `undefined` segment.
5. Populate `manifest.json` one-to-one from the actual post-R8 files; do not import pre-R8 diagnostics.
6. Run the expected focused/full/gates, then independent evidence QA.
7. Close Task 5 only on exact QA verdict `pass`; otherwise create one bounded repair and rerun the affected current flow plus parity evidence.

## Current verdict

Task 5: `blocking`, not complete.

Accepted screenshots: `0/50`.

UI/UX verdict: none.

Next action: wait for device access, then run the full post-R8 two-platform pack; do not start Task 6.
