# UI-26-06

## Assessment

- Objective and architecture fit: 0.95
- Simplicity: 0.84
- Risk: 0.82
- Maintainability: 0.90
- Minimum score: 0.82
- Luna High briefing: APPROVED

## Change

Goal create/edit and active summary now show a read-only reminder draft derived from preferred days. The copy makes clear exact times and activation are available only after accepting a learning plan. Goal-specific navigation to Notification Settings was removed; global Settings remains the activation entry. The now-unused goal source/return fields and translated goal-back copy were removed.

Notification settings state now exposes `planReady` only when the active snapshot has an accepted plan with at least one slot. Structural source failures and absent plans do not show permission or activation/retry controls. Accepted disabled plans may show permission and Enable; only `synced` may show the active Turn off action. Durable `permission_denied`, `scheduler_failure`, and `concurrent_change` states show pending copy, retry when the accepted plan is ready, and a neutral Cancel reminder request action using the existing disable path. Runtime, persistence, and scheduler contracts were not changed.

## Changed paths

- `src/features/home/GoalCadenceScreen.tsx`
- `src/features/home/goalCadencePresentation.test.ts`
- `src/features/home/NotificationSettingsScreen.tsx`
- `src/preferences/useNotificationSettings.ts`
- `src/preferences/notificationSettingsPresentation.ts`
- `src/preferences/notificationPresentation.test.ts`
- `src/navigation/types.ts`
- `src/testing/runtimeSelectors.ts`, `src/testing/runtimeSelectors.test.ts`
- `src/locales/{en,pl,de,fr,es,it,et}/{common,notifications}.json`
- Deleted `docs/active/UI-26-05/REPORT.md`; added this report.

## Verification

- Historical baseline before this slice: 71/71 repository tests passed.
- `node --import tsx --test src/preferences/notificationPresentation.test.ts src/preferences/notificationSettingsState.test.ts src/features/home/goalCadencePresentation.test.ts src/testing/runtimeSelectors.test.ts src/i18n/i18nLocaleParity.test.ts` — passed, 44/44.
- `npm run typecheck` — passed (`tsc --noEmit`).
- `git diff --check` — passed.
- Reference search confirmed no runtime consumers remain for goal-specific notification source, return route, or `backToGoal` copy; only negative assertions remain in tests.
- Maestro on the existing iPhone 17 (iOS 26.4) confirmed the goal summary shows the read-only `Reminder draft`, with the exact-time/activation boundary, and no former goal-to-reminders action.
- Maestro confirmed that a missing/stale accepted plan exposes none of Enable, Turn off, Retry, or permission cards.
- Maestro accepted an updated local plan, enabled notifications after the real iOS permission prompt, and confirmed the synchronized schedule and active Turn off state.
- Runtime delivery evidence: after persisting Sunday at 05:42 and backgrounding Patternly, iOS Notification Center showed the delivered notification `Time to practise` / `Choose one focused Patternly practice session.` at 05:42. This verifies local delivery, not backend behavior.
- Maestro at `accessibility-extra-large` confirmed the Reminders screen, granted-permission card, synchronized schedule, and Turn off action remain reachable on the same iPhone 17; content size was restored to `medium` afterward.
- Independent `qa-gate` on GPT-6 Luna High: **PASS**. The reviewer independently reran the focused UI/state/locale suite (44/44), the reminder coordinator runtime suite (20/20), typecheck, and diff-check; no actionable defect or open acceptance criterion remained.

## Limitations and diagnostic notes

- iOS Simulator rejected `simctl privacy ... revoke notifications` with `Operation not permitted`, so the denial presentation was verified through the pure state matrix tests rather than by mutating simulator privacy state. The tests cover `permission_denied` as pending with Retry plus neutral Cancel request and without active Turn off wording.
- Direct Maestro entry into the controlled time field normalized partial input to `05:00`; atomic clipboard paste produced the intended `05:42`. These failed input attempts did not change application code and are not counted as PASS evidence.
- Existing goal save/pause reconciliation remains intact and only reconciles persisted reminder intent; notification scheduling/runtime ownership was deliberately left unchanged.
