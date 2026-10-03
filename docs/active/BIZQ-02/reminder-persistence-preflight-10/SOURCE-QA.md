# BIZQ-02 saved-plan editor entry — independent source QA

**Verdict: PASS WITH ISSUES — source slice only.** The Progress entry reuses the existing edit action and preserves existing guidance, model, session, route and persistence ownership. Native/cold-process acceptance remains open.

## Criteria and evidence

- `ProgressPlanSection` adds a static `progressPlan.editSchedule()` selector and one localized secondary `Edit schedule` button only for a ready verified-plan model with an `onAction` callback. Its action is the existing `{ kind: "adjust_schedule", destination: "LearningPlanEditor" }`.
- The button is suppressed when primary or secondary guidance already exposes `adjust_schedule` or `resume_plan`; those existing controls are retained. It is absent for `none`, `unavailable` (including identity mismatch), and missing callback. The test also confirms invoking the button leaves the input model, active session, and primary guidance unchanged.
- `ProgressTab` receives the canonical Home plan snapshot and delegates its action to `HomeScreen.handleHomePlanAction`. That existing owner routes `adjust_schedule` through `learningPlanEditorCoordinator.startExistingEdit(selectedTrackId)`, navigates only on `ready`, and reports failure through its existing alert. The existing coordinator tests continue to cover accepted-plan snapshot reads, stale revision rejection, current context checks, and atomic save/retry behavior.
- The new test executes the actual `ProgressPlanSection` JSX branch through the repository's bounded TSX harness. It covers all seven supported locales (en/pl/de/es/fr/it/et), duplicate editor/resume action suppression in both primary and secondary positions, none/unavailable/no-handler cases, callback payload, and active-session preservation. The helper is not a React mount or native/SDK test; the evidence makes that boundary explicit.
- The initial saved-plan entry preflight was RED: open-ended ready guidance lacked `patternly:progress-plan:edit-schedule`. That demonstrates the prior missing entry. It does not prove the changed branch on a device.

## Checks

Independently run:

```text
node --import tsx --test src/features/home/tabs/progressScheduleEntry.test.mjs src/features/home/tabs/progressPresentation.test.ts src/features/home/learningPlanEditorPresentation.test.ts src/application/learningPlan/LearningPlanEditorCoordinator.test.ts
24/24 passed
```

`git diff --check` for the owned production/test changes passed. Root's `source-green.log` records the wider focused group at 41/41, and `typecheck.log` shows `npm run typecheck` / `tsc --noEmit` completed without diagnostics. An earlier root source run was 40/41 because its test fixture used unsupported `pt`; that test-only locale was changed to supported `et`, and the final run passed. No production behavior was altered for that correction.

## Scope and limits

The inspected production delta is confined to `src/features/home/tabs/ProgressTab.tsx` and the static selector in `src/testing/runtimeSelectors.ts`; the new owned test is `src/features/home/tabs/progressScheduleEntry.test.mjs`. No locale, copy, domain, storage, route, CAS, scoring, Premium, reminder, or runtime policy changed.

This review does not claim a post-change native CTA, cold-process exact-value read, interrupted SDK recovery, notification delivery, or full BIZQ-02 acceptance. The saved-plan value remains a separate native/runtime check. No device was operated for this source review.
