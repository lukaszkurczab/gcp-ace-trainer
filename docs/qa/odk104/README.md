# ODK-104 capture reproduction

Run from the app repository. Use a signed-in, empty local test account; do not clear existing simulator state. Start the app API on `127.0.0.1:8080` with Auth (`19099`) and Firestore (`18081`) emulators for `patternly-app-sandbox`, with no SMTP or production provider configuration. Verify `/health` and `/ready` before the online capture. Metro is `localhost:8081` and the app is `com.lkurczab.patternly`.

The observed bootstrap was: register a unique `example.test` account through the UI, accept terms, reach **Your account is ready**, verify `account-entry-choice` is absent (empty guest data), then use `account-entry-continue` to enter Home. Existing accounts can sign in instead. A main tab bar plus the account export control establish the authenticated capture precondition. The capture does not submit any privacy request.

Disable Fast Refresh through Simulator Device → Shake → Disable Fast Refresh while capturing, then restore it after the run. Wait for the app to settle; close any development warning toast if it obscures controls. The flow preserves the running session with `launchApp.stopApp: false` and allows 120 seconds for startup.

```sh
maestro --udid C3477113-C193-4C0F-9125-FEC9E5A71181 test --test-output-dir artifacts/maestro-screen-capture/odk-e2e-104/online docs/qa/odk104/10-data-auth-en-pl.yaml
```

The online flow ends at the bottom of the Polish request form. Stop only the locally started test API, preserving the Auth/Firestore emulators and Metro, then run:

```sh
maestro --udid C3477113-C193-4C0F-9125-FEC9E5A71181 test --test-output-dir artifacts/maestro-screen-capture/odk-e2e-104/offline docs/qa/odk104/20-data-auth-offline-en-pl.yaml
node --import tsx docs/qa/odk104-verify-data-translations.cjs
node --import tsx --test src/preferences/appPreferences.test.ts src/i18n/i18nLocaleParity.test.ts src/application/account/accountDataExportFailure.test.ts src/preferences/settingsPresentation.test.ts
```

`ChoiceRow` accessibility text combines each right and its description with a comma. The request sheet's Close control scrolls with the content, so the flow scrolls upward before closing it. These are observed UI contracts, not application changes.

See [final report](../ODK-104-REPORT.md) for the actual run results and limitations. The dated artifact directories preserve unsuccessful diagnostic runs separately from final evidence.
