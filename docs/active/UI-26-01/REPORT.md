# UI-26-01 — Welcome report

**Status:** complete; independent QA PASS.

## Scope and approach

The existing Welcome screen, three entry actions and navigation behavior remain unchanged. The bounded change uses the repository-canonical QA-A `PatternlyMark`, increases it from 88 to 96, renders Mint in Dark mode and navy in Light mode, and replaces the title/description in all seven release locales.

Initial hypothesis proposed Mint in both themes. Independent Luna-high briefing validation rejected that detail because the current Mint asset on the Light background is approximately 1.32:1, while navy is approximately 16.51:1; Mint on Dark is approximately 12.52:1. The accepted assessment is goal/architecture `0.94`, simplicity `0.97`, risk `0.91`, maintainability `0.96`; minimum `0.91`.

No new asset, component, route or fallback was added. A temporary development-only audit hook was used to open the production `WelcomeScreen` without clearing the existing guest profile; it was removed before diff review.

## Changed paths

- `src/features/account/AccountEntryScreen.tsx`
- `src/features/account/accountWelcomePresentation.test.ts`
- `src/locales/{en,pl,de,fr,es,it,et}/account.json`

English owner copy is exact:

- `Practice. Progress. Be ready.`
- `Focused practice for technical interviews and certifications.`

Other locales use concise semantic translations and preserve the same two-key contract.

## Verification

### Automated

- `node --import tsx --test src/features/account/accountWelcomePresentation.test.ts src/i18n/i18nLocaleParity.test.ts src/application/account/accountIdentityComposition.test.ts` — PASS, 38/38.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.

The focused Welcome test checks the 96px theme-aware mark, exact English copy, nonempty distinct translations in seven locales and unchanged Sign in / Create account / Continue without an account callbacks and test IDs. Locale parity proves the namespace/key/token contract and absence of fallback.

### Runtime / visual

Existing device only: iPhone 17 Simulator, iOS 26.4, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`; no second simulator or app install.

- Dark, English, normal text: `LIVE_UI` hierarchy exposed the new title/description and all three action selectors. Screenshot `/private/tmp/ui-26-01-dark-en.png` shows the Mint QA-A mark, readable hierarchy and unclipped actions.
- Light, English, accessibility-extra-large: screenshot `/private/tmp/ui-26-01-large-text.png` shows the navy mark and enlarged copy. The lower actions intentionally continue below the viewport.
- `/private/tmp/ui-26-01-large-text-scroll.yaml` — PASS. Maestro scrolled the production screen until `account-guest` was 100% visible and then asserted all three actions visible, proving the large-text layout remains operable rather than clipped.

Screenshots establish presentation only. Callback behavior is guarded by the focused structural test and the unchanged production wiring. Seven-locale values are automated evidence; only English was rendered during this bounded runtime pass.

## Limitations and cleanup

- Physical VoiceOver was not used; this change does not alter roles, focus order or accessible action names. The QA-A mark remains decorative as before.
- Android runtime was not exercised; repository scope targets iPhone runtime and the change is shared React Native presentation/copy.
- Temporary screenshots and Maestro YAML remain only under `/private/tmp` and are not repository artifacts.

## Independent QA

The initial independent Luna-high `qa-gate` returned PASS WITH ISSUES solely for the gendered Polish title `Bądź gotowy`. The title was corrected to the neutral `Przygotuj się`, after which the same reviewer inspected the current tree and returned **PASS** with no remaining actionable finding. The reviewer independently confirmed 38/38 focused tests, typecheck, diff-check, no `RootNavigator.tsx` diff and unchanged entry-action wiring.
