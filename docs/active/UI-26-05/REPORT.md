# UI-26-05

## Approach assessment

- Objective and architecture fit: 0.94
- Simplicity: 0.84
- Risk: 0.85
- Maintainability: 0.92
- Minimum score: 0.84
- Initial rejection/redesign: independent QA rejected the prior `@expo/ui` picker because its `locale` prop is iOS-only, so an Android device whose system language differs from the selected Patternly language would render the calendar in the wrong language. This slice removes that dependency and uses one shared React Native calendar driven by the selected app locale.
- Luna High briefing: APPROVED

## Change

Replaced the native package picker with `GoalTargetDateCalendar`. The screen passes its selected `AppLocale`; the calendar uses it for month titles, weekday headings and full accessible date labels. English weeks begin Sunday; the other six locales begin Monday. Calendar edits remain pending until `Set date`; `Cancel` closes without changing the date draft; `Clear date` empties it. Date conversion still uses local calendar fields at local noon and the saved value remains `YYYY-MM-DD | undefined`. Self-paced goals still hide the date control.

## Changed paths

- `package.json`, `package-lock.json` — removed `@expo/ui` and its now-unused dependency tree.
- `src/features/home/GoalCadenceScreen.tsx`
- `src/features/home/GoalTargetDateCalendar.tsx`
- `src/features/home/GoalTargetDateCalendar.test.ts`
- `src/features/home/goalTargetDateCalendarModel.ts`
- `src/features/home/goalTargetDatePicker.ts`
- `src/features/home/goalTargetDatePicker.test.ts`
- `src/features/home/goalCadencePresentation.test.ts`
- `src/locales/{en,pl,de,fr,es,it,et}/common.json`
- `docs/active/UI-26-05/REPORT.md`

The existing/root-owned `src/i18n/i18nLocaleParity.test.ts` changes were preserved; the parity test passed with the new localized month controls.

## Verification

- `rg -n '@expo/ui|DateTimePicker|targetDatePickerLocale' package.json package-lock.json src` — no remaining implementation or dependency references. The only package name reference is a negative assertion in the presentation test.
- `npm uninstall @expo/ui` — initially failed with ERESOLVE because the package’s optional `react-dom@19.3.0` peer conflicted with the repository’s React 19.2.3. `npm uninstall --legacy-peer-deps @expo/ui` then passed, removing 32 packages; the npm cache was redirected to temporary storage.
- `npm ls @expo/ui --depth=0` — empty dependency tree.
- `node --import tsx --test src/features/home/goalTargetDatePicker.test.ts src/features/home/GoalTargetDateCalendar.test.ts src/features/home/goalCadencePresentation.test.ts src/i18n/i18nLocaleParity.test.ts` — passed, 23 tests. Coverage includes locale propagation through the screen into the rendered component, all seven locales’ month/weekday/accessibility formatting, week starts, month boundaries, leap day, selection, and pending-date behavior.
- `npm run typecheck` — passed (`tsc --noEmit`).
- `git diff --check` — passed.
- Maestro on the existing iPhone 17 / iOS 26.4 — passed for opening the shared calendar, app-locale English month (`September 2026`), Sunday-first weekday labels, next-month navigation, selecting `2026-10-05`, Cancel preserving the empty draft, Set rendering `Oct 5, 2026`, and Clear restoring the empty state. The simulator system UI remained Polish, so the English calendar labels also demonstrate that the calendar follows the Patternly locale rather than the system locale.
- Maestro at `accessibility-extra-large` on the same simulator — passed; the calendar month and `Set date` remained reachable. The simulator was restored to `medium` afterward.
- Two intermediate Maestro assertions were not counted as product failures: the first expected abbreviated weekday text while the accessibility tree intentionally exposed full labels; the second tapped `Clear date` while it was covered by the sticky footer. Re-running with the actual accessible label and scrolling the control above the footer passed.
- Independent final `qa-gate` (Luna High) — PASS. Android runtime was not exercised; QA classified that as an evidence limitation rather than an open criterion because the task does not require it and the platform-specific picker path was removed.

## Superseded `@expo/ui` evidence

The earlier implementation installed `@expo/ui@57.0.20` using `npx expo install @expo/ui`. Its earlier simulator and Maestro results applied only to that picker and did not verify this redesigned calendar. Independent QA subsequently rejected that approach because Android ignores the package's locale prop. The shared calendar now has its own runtime evidence above.

The successful uninstall reported 17 npm audit advisories in the remaining dependency tree (1 high); remediation was outside this slice.
