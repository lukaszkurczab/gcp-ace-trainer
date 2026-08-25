# Android EAS and Firebase App Check runbook

This runbook is for the Android-only Patternly sandbox release. It does not
require an Apple Developer account. The Firebase project is
`patternly-app-sandbox`, the Android package is `com.lkurczab.patternly`, and
the EAS project is `@lkurczab/patternly`.

## 1. Confirm the EAS signing identity

Run these commands from the app repository:

```sh
npx -y eas-cli@latest whoami
npx -y eas-cli@latest project:info
npx -y eas-cli@latest credentials -p android
```

In the credentials menu choose the `production` build profile and confirm:

- application identifier: `com.lkurczab.patternly`;
- a managed Android JKS keystore exists;
- the SHA-256 fingerprint is the one that will be registered in App Check.

The current production EAS keystore was found and has this SHA-256 fingerprint
(read it again if the keystore is ever replaced):

```text
A4:77:47:B5:4A:80:18:2A:B5:07:DA:63:89:02:A0:68:CC:2B:E7:9C:24:78:B8:DA:89:C3:9E:D2:7B:92:4A:2F
```

Never download or commit the JKS, `credentials.json`, passwords or private
keys. EAS manages the keystore remotely for the production profile.

## 2. Continue development without Google Play

Google Play registration is not required for the app implementation or for an
EAS preview APK. Keep these values empty while Play Integrity is not being
used:

```text
EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=
EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER=
```

With this configuration, guest learning, Firebase Auth composition, account
surfaces and the rest of the local app can be developed normally. Content
reports remain explicitly unavailable until App Check is configured; the
client records `app_check_unavailable` instead of sending an unauthenticated
request. This is an intentional security boundary, not a release blocker for
the rest of the app.

## 3. Optional App Check for development

If report submission or the backend App Check path must be tested before Play
registration, use the Android debug provider. Firebase's debug provider is
intended for emulator/test environments and must not be shipped to users.

1. Set the local, ignored `.env` value to
   `EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=debug`.
2. Build and run the Android development or preview APK.
3. Read the generated debug token from Android logs.
4. In [Firebase App Check for the sandbox project](https://console.firebase.google.com/project/patternly-app-sandbox/appcheck/apps), open the Android app's menu and choose **Manage debug tokens**.
5. Register the token and repeat the report test.

Keep the token private. Do not put it in `.env.example`, source code, EAS
production variables or Git. Firebase documents this debug-token workflow in
[Use App Check with the debug provider on Android](https://firebase.google.com/docs/app-check/android/debug-provider).

## 4. Configure EAS environment values

In the EAS project settings, add the sandbox values to the `preview` and
`production` environments. The public Firebase and OAuth identifiers are safe
client identifiers; do not add service-account JSON, private keys, backend
secrets or passwords as `EXPO_PUBLIC_*` values.

Required client values are the Firebase and Google values documented in
`.env.example`. For development, either leave App Check empty as in step 2 or
use the debug value from step 3. Do not set `playIntegrity` yet.

```text
EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=debug
EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER=
```

Also provide the complete validated
`EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT` JSON with the real sandbox HTTPS
API, auth-action, legal, support and deletion origins. The repository refuses
an incomplete or unsafe public environment instead of guessing an endpoint.

## 5. Build and test the Android candidate

The EAS profiles are already defined:

```sh
# Internal APK for development/UI smoke; Google Play registration is not needed.
npx -y eas-cli@latest build --platform android --profile preview

# Android AAB build; distribution can happen later.
npx -y eas-cli@latest build --platform android --profile production
```

The repository requires a clean commit before EAS build submission. For the
development checkpoint, verify:

- Google Sign-In completes for the sandbox Firebase project;
- guest learning remains available;
- account entry stays explicit when public environment values are incomplete;
- if the debug provider is configured, a content report reaches the backend
  without an App Check rejection.

## 6. Later distribution gate

When distribution is actually planned, register the production app in the
chosen store and configure the production provider. For Google Play this means
linking `patternly-app-sandbox` from **Release > App integrity > Play Integrity
API**, registering the Android app in Firebase App Check with the production
EAS SHA-256 fingerprint, then setting:

```text
EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=playIntegrity
EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER=
```

Only after that gate should the signed store candidate be verified against real
App Check metrics and the backend report endpoint. Firebase recommends
monitoring App Check metrics before enabling enforcement; see [Play Integrity
provider](https://firebase.google.com/docs/app-check/android/play-integrity-provider).

Apple provider configuration and iOS signed-build evidence remain out of scope
until an Apple Developer account is available.
