# AUD-08 B3 native route diagnosis

Date: 2026-10-01 (Europe/Warsaw)  
Repository: `patternly`, branch `main`, HEAD `8d12b0cc`  
Device: existing booted iPhone 17, iOS 26.4 (`7F315654-3175-4F3C-BB24-B0263F59360C`)  
App: `com.lkurczab.patternly`

## Result

The Guest Settings → Account Entry route works on the current live simulator. A corrected Maestro run navigated Home → Settings, found `settings-screen`, tapped `settings-account-entry`, and then found `account-email`. The captured screen is the signed-out Sign in form. This reproduces the source-defined route and shows no overlay or touch-target blocker. No production source change is indicated by the current evidence.

The earlier `preflight.md` runs did not reach Account Entry. Their failure is not reproducible in the corrected live route. The earlier and current app bundle identities were not independently fingerprinted, so the cause of that earlier failure remains unknown; Metro's bundle endpoint alone does not establish which JS bundle an already-installed app consumed.

## Repository evidence

- `src/features/home/HomeScreen.tsx:385-390` routes guest/signed-out Settings account presses to `ROUTES.ACCOUNT_ENTRY` with `initialMode: "signIn"`.
- `src/features/home/tabs/SettingsTab.tsx:223` renders the enabled `settings-account-entry` button and forwards its press to `onOpenAccount`.
- `src/navigation/RootNavigator.tsx:322-323` registers `ROUTES.ACCOUNT_ENTRY` with `AccountEntryScreen`.
- `src/features/account/AccountEntryScreen.tsx` renders the sign-in form selectors `account-email`, `account-password`, and `account-sign-in-submit` in this mode.

## Runtime evidence

The successful Maestro command was:

```sh
maestro test \
  --device 7F315654-3175-4F3C-BB24-B0263F59360C \
  --test-output-dir=/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/active/AUD-08/evidence/B3/native/debug/2026-10-01_0610/final-route-run \
  --debug-output=/Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/active/AUD-08/evidence/B3/native/debug/2026-10-01_0610/final-route-debug \
  --flatten-debug-output \
  /Users/lukaszkurczab/Desktop/Projects/Patternly/patternly/docs/active/AUD-08/evidence/B3/native/debug/2026-10-01_0610/repro.yaml
```

All five flow actions completed: Home visible, Settings tapped, Settings screen visible, account button tapped, Account Entry email field visible. The screenshot is `final-route-debug/repro/takeScreenshot/020-account-entry.png`; command metadata and logs are beside it. Filtered runtime logs contained no React Native fatal/uncaught JS or Maestro command failure. Simulator logs had unrelated Apple Contacts/LaunchServices errors, which did not affect the route.

The read-only hierarchy captured before the run showed the CTA enabled at `[20,205][382,255]`. Maestro tapped it by stable ID. No credentials or account actions were used; app data and backend state were left intact.

The first local diagnostic flow draft incorrectly asserted Settings before Maestro's app launch had returned to Home. That harness assertion failed before touching the account button. The corrected flow starts at Home and explicitly visits Settings. The failed harness output was written by Maestro outside the assigned folder at `/Users/lukaszkurczab/repro`; it is not treated as evidence. The successful run's evidence is under this `debug/` directory.

## Source changes and assessment

No production source files were changed. The only added files are this diagnosis and the scoped reproduction flow under `debug/`.

Consistency: 0.95 — current source ownership and route registration agree with the passing runtime path.  
Simplicity: 1.00 — no code fix is justified by a route that passes end to end.  
Risk: 0.95 — the reproduction used the existing simulator without account data changes.  
Maintainability: 1.00 — the scoped flow provides a small repeatable diagnostic.  
Overall (minimum): 0.95.

## Verification limits

This confirms the route on the currently launched simulator app and the visible form state. It does not identify the JS bundle hash currently loaded, explain the earlier failed captures, or validate any authenticated recovery operation. Those are outside this route diagnosis.
