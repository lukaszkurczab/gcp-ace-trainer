# AUD-05 — navigation and session lifecycle

**Status:** complete — independent QA `PASS WITH ISSUES`  
**Date:** 27 September 2026  
**Repository:** `patternly`  
**Device:** existing iPhone 17, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`

## Outcome

The audit reproduced and fixed two defects in the shared practice experience:

1. An iOS edge-back gesture bypassed the leave confirmation and removed an active runner route. The three practice runners now use React Navigation's `usePreventRemove`, retain the exact attempted navigation action, and replay it only after the learner confirms leaving.
2. A rapid double activation in the Design runner could submit an answer and immediately activate the newly rendered `Next` CTA, skipping visible feedback. Design and Certification now guard concurrent commands until their refreshed projection commits. The shared practice surface additionally rejects only gesture carry-over to a different primary-action identity inside a measured 400 ms window. Same-phase retries remain immediately available and accepted commands are not delayed.

The implementation keeps Algorithms, Design, and Certification lifecycle ownership separate. No domain fallback, parallel lifecycle, compatibility path, migration, device reset, second app installation, or new simulator was added.

## Approach assessment

Final approach: goal/architecture fit `0.94`, simplicity `0.84`, risk `0.84`, maintainability `0.90`; minimum `0.84`. The first promise-scoped guard and the second projection-commit-only guard were rejected by runtime evidence before closure. Maestro uses `TapRepeat(repeat=2, delay=100)`; simulator touch logs placed the two activations approximately 350 ms apart. The final 400 ms boundary adds a small measured margin and applies only when the CTA identity changes across session/item/phase/label.

## Runtime evidence

All flows ran sequentially on the existing iPhone 17 against the already running local stack. Backend readiness returned database, authentication, and provider-reader checks as true; Metro returned `packager-status:running`. Firebase Auth and Firestore emulator processes remained on ports 19099 and 18081, and the app used the existing `com.lkurczab.patternly` installation.

### Algorithms

- Cold launch exposed and resumed exact session `coding-interview-dsa-problem-solving:coding-interview-custom-practice:5` at question 1/10.
- Explicit Leave → Keep learning preserved the local selection and enabled Submit.
- iOS edge swipe opened the same leave confirmation; Keep learning retained the same item and selection.
- `doubleTapOn` Submit produced one feedback state at ordinal 1 and did not expose ordinal 2.
- Pause and cold resume retained item `alg-complexity-reject-002`, its committed feedback, session identity, and foreground timer.
- The session completed 10/10. A cold relaunch showed no resume card.

### Backend System Design

- Session `backend-system-design-interview:design-interview-learn-framework:1` covered 10 items.
- Explicit Leave/cancel and edge swipe/cancel preserved an unsubmitted response.
- Before the fix, double Submit on `besd-n01-b01-i001` skipped directly to ordinal 2; a projection-commit-only guard still skipped q2→q3 and q3→q4.
- With the final phase-identity guard, double Submit on `besd-n01-b04-i001` left ordinal 4 visible with the `Next` CTA; ordinal 5 was absent. A later separate `Next` activation advanced exactly to ordinal 5.
- The remaining questions and final action completed 10/10. A cold relaunch showed no resume action.

### Google Cloud ACE Certification

- The Focus Practice route with an unavailable topic rendered `Practice setup is unavailable` and `This topic is not included in your free content`; `Back to practice` returned to the hub.
- Knowledge Check session `google-cloud-associate-cloud-engineer:certification-diagnostic-baseline:1` covered 40 items.
- Explicit Leave/cancel and iOS edge swipe/cancel retained the selection.
- `doubleTapOn` Submit on `gcp-ace-gcpace-n01-b02-001` left ordinal 1 with `Next`; ordinal 2 remained absent.
- Pause, cold launch, and canonical resume retained the committed answer, exact session, ordinal 1, and timer.
- The session completed 40/40 and final double activation produced one route exit. A cold relaunch showed no resume action.

The final active track was restored to Backend System Design.

## Unavailable and direct-entry boundary

The learner-reachable unavailable route was exercised at runtime and its return action worked. `ExamScreen` Back remains covered by its existing navigation regression and the prior real fix (`goBackOrHome`). Algorithms Simulation is registered and its unavailable result routes remain covered by source tests, but the current app has no ordinary exposed Simulation card and no `NavigationContainer` linking configuration for an external direct-entry URL. No audit-only route or hidden fallback was added merely to manufacture runtime evidence. This boundary is explicit and must not be described as a runtime PASS for Simulation direct entry.

## Verification

- Final controller gate covering route guards, navigation, exit copy, presentation, application session durability, journaled lifecycle, Exam Back, and excluded Algorithms direct-entry scope — PASS, 50/50.
- Independent reviewer rerun of presentation, surface wiring, and route guards — PASS, 29/29.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- Maestro — PASS for the individual assertions listed above. Intermediate flows that intentionally reproduced the defects failed at the expected skipped-feedback assertion; those failures are evidence of the pre-fix behavior, not final gate results.

The full `npm test` suite was not rerun for this slice. Its latest run had 1305/1311 passing with six pre-existing failures outside AUD-05: lost-key retry expectation, visual-shell route count, three cross-repository content/environment assertions, and locale inventory.

## Independent review

Luna High issued `PASS WITH ISSUES`. It found no blocking acceptance failure, second lifecycle path, or misleading direct-entry claim. The reviewer confirmed that the task can close, while identifying one actionable non-blocking accessibility risk: the 400 ms phase-identity guard silently ignores a fast activation of a newly rendered CTA and has no separate VoiceOver/keyboard runtime evidence. The guard is deliberately narrower than a blanket cooldown, same-identity retry is not delayed, and a separate post-window activation passed runtime; nevertheless this limitation remains explicit rather than being presented as an accessibility PASS.
