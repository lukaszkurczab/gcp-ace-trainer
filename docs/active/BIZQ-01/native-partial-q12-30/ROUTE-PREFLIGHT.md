# Q12 navigation preflight: review the completed Claude partial answer

This is a source-based route assessment, not a new simulator run or native acceptance result. The current recorded native session is the completed 10-question Claude Certification Focus Practice session `claude-certified-architect-professional-certification:certification-focus-practice:2`; its third occurrence is `CCARP-D01-O01-transfer`. The existing acceptance receipt records 9 correct, 1 partly correct, and the authored feedback and all five Details for that item.

## Ordinary route from the current GCP Home

1. On Home, use **View activity** (`patternly:home:activity`). `HomeScreen` navigates to Activity. Activity initializes its filter to **All tracks**, so the active GCP track does not need to change.
2. In Activity, open the completed Claude Certification Focus Practice row for session `claude-certified-architect-professional-certification:certification-focus-practice:2` (`patternly:activity:row:claude-certified-architect-professional-certification:certification-focus-practice:2`). If needed, scroll the existing Activity list; do not change the track filter.
3. On that session’s result summary, use **Review Answers** (`patternly:summary:review-answers:claude-certified-architect-professional-certification:certification-focus-practice:2`). It opens answer review for the same session ID.
4. Answer review starts at the first recorded occurrence and preserves the session’s saved order. Use **Next** twice (`patternly:practice-review:next`) to reach ordinal 3 of 10. Confirm the question is `CCARP-D01-O01-transfer` and the displayed result is Partial.
5. Expand Details with `patternly:session:details-toggle:CCARP-D01-O01-transfer`; confirm the expanded region `patternly:session:details:CCARP-D01-O01-transfer` is visible. This inspects the stored feedback for the existing partial response.

The Activity screen reads completed-session records and defaults to a cross-track view. The result and answer-review screens load and validate the exact completed session, attempt, and question evidence. Review order is projected from the saved `session.itemOrder`, so ordinal 3 is the recorded partial item rather than a newly selected question. The Details disclosure uses component-local state. These inspected paths do not start a session, submit an answer, change the active track, or edit the goal/plan.

For this inspection, avoid controls that intentionally write data: “Mark Needs Review”/review-queue actions, report submission, source-link opening, answer controls, or starting/continuing practice. The route is assessed from source and prior receipts only; it has not been run as a new device interaction in this preflight.

## Evidence and scope

The exact session ID, item order, and partial target are bound by `native-partial-29/ROOT-PREPARED10.json` (SHA-256 `30932f8dba881b9e99a3c215ab0e15c3306661aae7c1f4f93e6290e198e00452`). The prior `native-partial-29/ACCEPTANCE-QA.json` (SHA-256 `6d3c6337ac9b11a0ba430aa5aba39d339326d2584dd4ff1a445dddb411e77680`) records the actual completed session, its 9/1 score, and observed feedback/details. `native-partial-29/PREFLIGHT.json` (SHA-256 `ba485fb4f371b81f029d513cfe5c5c13ce543489ec86ec512389cf4e775af079`) records the preflight binding.

The source bindings below were hashed while preparing this route: Home action, Activity default filter and row interaction, activity loading/model/navigation, completed result action, answer-review order/projection, feedback Details disclosure, and runtime selectors. The previously accepted GCP preservation receipt remains evidence for the earlier Claude exercise and return to GCP; it is not evidence that this route was newly navigated during Q12.

This establishes a plausible, ordinary route to the existing completed partial answer review. It does not claim that the route has been performed now, that the Q12 display conditions have been exercised, or that this alone completes BIZQ-01 native acceptance.
