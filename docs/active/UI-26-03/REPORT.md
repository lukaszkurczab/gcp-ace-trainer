# UI-26-03

## Approach assessment

- Objective and architecture fit: 0.96
- Simplicity: 0.98
- Risk: 0.91
- Maintainability: 0.97
- Minimum score: 0.91
- Luna High briefing: APPROVED

## Change

Removed the selected-track footer summary and its unused styles. The existing sticky footer still appears under the same conditions and now has one `Start track` action in onboarding and returning selection. Card radio semantics and the existing loading, disabled, save-error, reminder-error, persistence, callback, and navigation behavior remain in place. The regression test rejects the old summary and `Use this track`, requires the single action, and checks that the selected `track.id` is saved and then published through the callback or followed by Home navigation.

## Changed paths

- `src/features/home/SelectTrackScreen.tsx`
- `src/features/home/selectTrackLargeText.test.ts`
- `src/locales/{en,pl,de,fr,es,it,et}/common.json`
- `docs/active/UI-26-03/REPORT.md`

## Verification

- `node --import tsx --test src/features/home/selectTrackLargeText.test.ts` — passed, 4 tests.
- `node --import tsx --test src/features/home/selectTrackLargeText.test.ts src/features/home/selectTrackFailureHandling.test.ts src/features/home/homeOnboardingTransition.test.ts src/i18n/i18nLocaleParity.test.ts` — passed, 15 tests after the locale cleanup.
- `npm run typecheck` — passed (`tsc --noEmit`).
- `git diff --check` — passed.
- `/private/tmp/ui-26-03-standard.yaml` — Maestro PASS on the existing iPhone 17. Changed the active track from Backend System Design to Coding Interview, confirmed the footer exposed `Start track` without `Selected` or `Use this track`, committed the choice, and observed the Coding Interview Home card.
- `/private/tmp/ui-26-03-large-text.yaml` — Maestro PASS at `accessibility-extra-large` on the same device. Selected Backend System Design, confirmed the single action remained visible without the removed copy, committed it, and observed the matching Home card. The simulator text size was restored to `medium` afterward.

Runtime device: iPhone 17 Simulator, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`. No additional simulator or app installation was created. The temporary Maestro flows remain outside the repository under `/private/tmp`.

## Independent QA

The first independent Luna-high review returned PASS WITH ISSUES: all acceptance criteria passed, but the removed `Selected` and `Use this track` copy remained as unused keys in all seven locale files. Those dead keys were removed and locale parity was rerun. The bounded final reviewer independently ran 19/19 related tests, typecheck and diff-check, then returned **PASS** with no remaining actionable finding.
