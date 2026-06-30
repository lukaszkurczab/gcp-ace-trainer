# Manual Route Smoke QA

## Purpose

Use this checklist before accepting visible Patternly route work. It is a manual smoke gate for the current P0 baseline, not a completed evidence report and not a pixel-perfect visual audit.

Canonical references inspected for this checklist:

- `docs/12-testing-strategy.md`
- `docs/03-navigation-and-flows.md`
- `docs/05-design-system.md`
- `docs/designs/home_choice_enabled/screen.png`
- `docs/designs/practice_hub_unified/screen.png`
- `docs/designs/cloud_question_unified_focus_lab_style/screen.png`
- `docs/designs/progress_overview_refined_hierarchy/screen.png`
- `docs/designs/settings_refined_focus_lab_style/screen.png`

## Static Preflight

Run the static QA gate when available:

```sh
npm run qa:static
```

If the script is unavailable in the branch being tested, run the equivalent checks:

```sh
npm run typecheck
npm test
npm run validate:questions
```

## Evidence Template

- Date:
- Tester:
- Platform and device/simulator:
- Build or run command:
- Commit SHA:
- Static preflight result:
- Screenshots or recording paths, if available:
- Blockers:
- Notes:

## Route Checklist

Record `Pass`, `Fail`, or `Blocked` for every item. Add notes for every failure or blocker.

| Area | Item | Expected result | Result | Notes |
| --- | --- | --- | --- | --- |
| App | App opens | App launches into the Patternly shell without a crash or blank screen. |  |  |
| Home | Home renders | Home shows the Patternly header, current track context, primary learning card, recommendations, and bottom navigation. |  |  |
| Home | Current focus / Change focus renders | Current focus is visible and exposes a Change focus action that navigates to track selection. |  |  |
| Home | Start learning path | Start learning opens the Cloud practice setup or current Cloud session path. |  |  |
| Home | Recommendations safety | Recommendation rows are static or safely wired to verified local data; they do not claim unverified review/progress state. |  |  |
| Practice | Practice tab renders | Practice tab opens from bottom navigation and shows the active Cloud practice entry point and available modes. |  |  |
| Practice | Start session path | Practice Start session opens the Cloud practice setup or current Cloud session path. |  |  |
| Question | Selecting an answer | On the Cloud question screen, selecting an answer visibly selects the option and enables Check Answer. |  |  |
| Question | Check Answer behavior | Check Answer performs the expected answer behavior for the current session mode, including feedback for practice and no mid-exam correctness reveal for exam simulation. |  |  |
| Exam | Exam simulation | Exam simulation opens the current exam flow or is clearly static/unavailable. It must not route to a broken or unrelated screen. |  |  |
| Review | Weak item action | Review weak items remains static/unavailable until the review queue flow is verified. It must not route to an unfinished Review UI. |  |  |
| Progress | Progress renders | Progress tab opens from bottom navigation and shows concrete practice/progress evidence or an explicit empty/unavailable state. |  |  |
| Progress | Review action safety | Progress review action remains static/unavailable until the review queue flow is verified. It must not route to an unfinished Review UI. |  |  |
| Progress | No unsafe metrics | Progress does not show readiness, retention, pass prediction, streak, or level metrics. |  |  |
| Settings | Settings renders | Settings tab opens from bottom navigation and shows grouped settings rows. |  |  |
| Settings | Unavailable rows | Static or unavailable Settings rows remain visibly non-destructive and do not imply completed functionality. |  |  |
| Settings | Clear confirmation | Clear local history opens a destructive confirmation before clearing data. |  |  |
| Settings | Clear local data scope | After confirmation, Clear local history clears legacy local data and canonical local training data: active exam sessions, local questions, attempts, practice history, review marks, training sessions, training attempts, review queue items, and user progress. |  |  |
| Navigation | Bottom nav labels | Bottom navigation labels are exactly Home, Practice, Progress, and Settings. |  |  |

## Final Decision

- Overall result:
- Release blocker:
- Follow-up issue or PR:
- Decision notes:
