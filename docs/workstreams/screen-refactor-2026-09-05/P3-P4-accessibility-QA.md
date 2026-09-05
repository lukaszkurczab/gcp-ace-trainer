# P3/P4 accessibility QA

## Scope

- Model and effort: `gpt-5.6-luna/max`.
- This bounded pass implements two accessibility corrections in the main checkout.
- The notification reminder row now keeps the existing `ListRow` pressable path while disabled, so its button role and `accessibilityState.disabled` remain explicit; the chevron is omitted whenever the row is disabled.
- `InfoBlock` has an opt-in `accessibilityAlert` prop. Enabled blocks become one accessible alert element with a polite live region. Only notification and appearance error surfaces opt in; ordinary informational blocks keep their previous accessibility behavior.

## Facts and assumptions

- `ListRow` already applies `accessibilityRole="button"`, `accessibilityState={{ disabled }}`, and `disabled` on its `Pressable`, but only when `onPress` is present. Keeping the callback and passing `disabled` reuses that established contract without changing the shared component API.
- The reminder row's disabled state covers loading, mutation, unresolved permission, and denied permission with no active reminder. Its chevron now follows that same state.
- `InfoBlock` previously rendered a plain `View`; the new semantics are opt in so existing neutral, success, and non-error warning blocks are unchanged.
- `accessibilityLiveRegion` is platform-dependent in React Native, while the accessible `alert` role provides the semantic error surface where live-region behavior is unavailable. No native implementation or Metro flow was run in this pass.

## Files and references

Changed:

- `src/components/InfoBlock.tsx` — adds `accessibilityAlert` and conditional accessible grouping, polite live-region, and alert-role props.
- `src/features/home/NotificationSettingsScreen.tsx` — applies alert semantics to notification/open-settings/reminder errors and aligns the disabled reminder pressable and chevron behavior.
- `src/features/home/AppearanceSettingsScreen.tsx` — applies alert semantics to the appearance save error.
- `src/preferences/notificationPresentation.test.ts` — checks the disabled row contract, hidden chevron, and notification alert surfaces.
- `src/preferences/settingsPresentation.test.ts` — checks the `InfoBlock` opt-in contract and appearance error usage.
- `docs/workstreams/screen-refactor-2026-09-05/P3-P4-accessibility-QA.md` — this report.

Removed: none.

The change does not add a controller, factory, cache, storage/domain behavior, route, or general accessibility abstraction.

## Assessment

Pre-edit assessment: architecture `0.88`, simplicity `0.93`, safety `0.82`, maintainability `0.87`; minimum `0.82`.

Post-edit assessment: architecture `0.92`, simplicity `0.95`, safety `0.88`, maintainability `0.90`; minimum `0.88`.

The correction reuses the existing `ListRow` semantics and keeps `InfoBlock` behavior unchanged by default, limiting the blast radius to the named error surfaces.

## Verification

- `node --import tsx --test src/preferences/notificationPresentation.test.ts src/preferences/settingsPresentation.test.ts src/i18n/i18nLocaleParity.test.ts` — PASS, 16 tests.
- `npm run typecheck` — PASS.
- `git diff --check -- src/components/InfoBlock.tsx src/features/home/NotificationSettingsScreen.tsx src/features/home/AppearanceSettingsScreen.tsx src/preferences/notificationPresentation.test.ts src/preferences/settingsPresentation.test.ts` — PASS.

Not run: native/Metro, full QA, or `qa:static`; the parent task owns native recheck and broader integration verification.

## Limitations

- The scoped presentation tests verify source contracts and do not replace VoiceOver/TalkBack confirmation on device.
- No separate unit helper or general controller/factory was introduced; the existing guard/application behavior tests remain the relevant behavioral coverage.
