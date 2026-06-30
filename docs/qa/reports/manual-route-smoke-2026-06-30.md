# Manual Route Smoke Report - 2026-06-30

## Summary

- Repository: `lukaszkurczab/gcp-ace-trainer`
- Branch: `main`
- Commit SHA: `4dd7b352dc4e1bb98db3806d34a57b8933e8b1f1`
- Date/time: `2026-06-30 15:26:38 CEST`
- Tester: Codex QA agent
- Platform/environment: macOS host, iOS Simulator `iPhone 17`, iOS `26.4`, installed native app bundle `com.lkurczab.gcpacetrainer`
- App run command: existing live `npm run ios` / `expo run:ios` process was detected; app was relaunched for route resets with `xcrun simctl terminate booted com.lkurczab.gcpacetrainer` and `xcrun simctl launch booted com.lkurczab.gcpacetrainer`
- Static checks: Passed when run as split commands after `npm run qa:static` hit a sandbox IPC issue at `validate:questions`
- Screenshots: `docs/qa/reports/manual-route-smoke-2026-06-30-assets/`
- Final decision: `PASS`

## References Inspected

- `docs/qa/manual-route-smoke.md`
- `docs/12-testing-strategy.md`
- `docs/03-navigation-and-flows.md`
- `src/navigation/RootNavigator.tsx`
- `src/features/home/shellModel.ts`
- `.maestro/screenshot-capture/patternly-main-shell.yaml`
- `.maestro/screenshot-capture/patternly-track-foundation.yaml`
- `package.json`

## Static Checks

| Command | Result | Notes |
| --- | --- | --- |
| `npm run qa:static` | Failed in sandbox | `typecheck` and `test` completed, then `validate:questions` failed with `listen EPERM` on the `tsx` IPC pipe under `/var/folders/.../tsx-501/*.pipe`. |
| `npm run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| `npm test` | Pass | 91 tests passed. |
| `npm run validate:questions` | Pass | 360 questions validated, 0 errors. |

## Route Checklist Results

| Area | Item | Result | Evidence / notes |
| --- | --- | --- | --- |
| App | App opens | Pass | Existing native iOS app was running; relaunch via `xcrun simctl launch booted com.lkurczab.gcpacetrainer` succeeded. |
| Home | Home renders | Pass | Home showed Patternly header, Cloud Certification context, current focus, primary card, recommendations, and bottom nav. Verified by Maestro hierarchy. |
| Home | Current focus / Change focus renders | Pass | `CURRENT FOCUS`, `Change focus`, and Cloud Certification were visible. Tapping Change focus opened `Choose track`. |
| Home | Start learning path | Pass | Tapping `Start learning` opened `Practice by Domain`. |
| Home | Recommendations safety | Pass | Recommendation rows rendered without active routes; `src/features/home/shellModel.ts` shows `HOME_RECOMMENDATIONS` have no route targets. |
| Practice | Practice tab renders | Pass | Practice tab rendered active track, `Start session`, `Exam simulation`, and `Review weak items`; screenshot: `manual-route-smoke-2026-06-30-assets/practice-tab.png`. |
| Practice | Start session path | Pass | Tapping `Start session` from Practice opened `Practice by Domain`. |
| Question | Selecting an answer | Pass | Practice session opened; selecting a visible option changed the row state and enabled answer submission. Screenshot before answer: `manual-route-smoke-2026-06-30-assets/question-before-answer.png`. |
| Question | Check Answer behavior | Pass | Tapping `Check Answer` produced visible incorrect-answer feedback, `Mark Needs Review`, and `Next Question`; screenshot: `manual-route-smoke-2026-06-30-assets/question-after-check.png`. |
| Exam | Exam simulation | Pass | `Exam simulation` was visible and marked `Ready`; coordinate tap on the visible card opened the current `Exam` route. Screenshot: `manual-route-smoke-2026-06-30-assets/exam-route-attempt.png`. |
| Review | Weak item action | Pass | Practice tab showed `Review weak items` with `Unavailable` and copy `Available after review queue is verified.` No unfinished Review UI route was opened. |
| Progress | Progress renders | Pass | Progress tab opened and showed `Focus overview`, review queue, practice activity, performance, and concrete metrics. Screenshot: `manual-route-smoke-2026-06-30-assets/progress-tab.png`. |
| Progress | Review action safety | Pass | Progress showed `Review unavailable until queue is verified`; no Review migration route was opened. |
| Progress | No unsafe metrics | Pass | Maestro asserted `readiness`, `retention`, `pass prediction`, `streak`, and `level` were not visible. |
| Settings | Settings renders | Pass | Settings tab rendered Patternly local workspace, learning preferences, app preferences, data/privacy, and account/help sections. Screenshot: `manual-route-smoke-2026-06-30-assets/settings-top.png`. |
| Settings | Unavailable rows are static | Pass | `Review priority`, `Notifications`, `Subscription`, and `Help and feedback` were visible with unavailable/local static states. |
| Settings | Clear local history confirmation | Pass | Clear row opened destructive confirmation `Clear all local data?`; `Clear` action was visible and required before reset. |
| Settings | Clear local data scope | Pass | After confirming Clear, Progress no longer showed the previously created `1 practice answers` evidence and returned to zero-count local state. Static tests also passed the reset coverage that calls legacy and canonical clear functions. Screenshot: `manual-route-smoke-2026-06-30-assets/progress-after-clear.png`. |
| Navigation | Bottom nav labels | Pass | Bottom nav labels were exactly `Home`, `Practice`, `Progress`, `Settings` across shell screens. |

## Notes

- Temporary Maestro flows were created under `/private/tmp` only. No `.maestro/` files were changed.
- Some Maestro text selectors missed visible labels (`Algorithms`, `Cloud practice`, `Exam simulation`, `Clear local history`) due to viewport or selector matching. These were resolved with hierarchy inspection, screenshots, or coordinate taps against visible UI.
- The app was already running from `npm run ios`; no new app code, dependencies, Review migration, Algorithms content, or question-bank content was changed.

## Blockers

- None for the manual route smoke gate.

## Final Decision

`PASS`

The required visible routes and safety states were verified on the iOS simulator, and static QA checks passed via the split-command fallback after the combined script hit a sandbox IPC permission issue.
