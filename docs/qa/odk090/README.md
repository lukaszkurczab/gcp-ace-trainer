# ODK-090 evidence

## Reproduction

- Authenticated scenario: `maestro --udid C3477113-C193-4C0F-9125-FEC9E5A71181 test --test-output-dir artifacts/maestro-screen-capture/odk-e2e-090/auth-pass docs/qa/odk090/10-auth-inline-validation.yaml`
- Guest scenario: `maestro --udid 7CB0DBB6-DEB2-4CAB-93FC-DF71CB7A7F8F test --test-output-dir artifacts/maestro-screen-capture/odk-e2e-090/guest-retry docs/qa/odk090/20-guest-inline-validation.yaml`

The authenticated simulator must contain a verified local-emulator account. The guest simulator must have no authenticated session. Run the local API at `127.0.0.1:8080` against Auth `19099` and Firestore `18081`; no production provider or SMTP configuration is needed.

## Passing artifacts

- [Authenticated commands](../../../artifacts/maestro-screen-capture/odk-e2e-090/auth-pass/2026-09-12_130501/ODK-090%20authenticated%20inline%20narrative%20validation/commands.json)
- [Authenticated manifest](../../../artifacts/maestro-screen-capture/odk-e2e-090/auth-pass/2026-09-12_130501/ODK-090%20authenticated%20inline%20narrative%20validation/manifest.json)
- [Authenticated screenshots](../../../artifacts/maestro-screen-capture/odk-e2e-090/auth-pass/2026-09-12_130501/ODK-090%20authenticated%20inline%20narrative%20validation/takeScreenshot/)
- [Guest commands](../../../artifacts/maestro-screen-capture/odk-e2e-090/guest-retry/2026-09-12_125532/ODK-090%20guest%20inline%20email%20validation/commands.json)
- [Guest manifest](../../../artifacts/maestro-screen-capture/odk-e2e-090/guest-retry/2026-09-12_125532/ODK-090%20guest%20inline%20email%20validation/manifest.json)
- [Guest screenshots](../../../artifacts/maestro-screen-capture/odk-e2e-090/guest-retry/2026-09-12_125532/ODK-090%20guest%20inline%20email%20validation/takeScreenshot/)

Screenshot SHA-256:

- auth error: `61ba409d732fd03333064a4cc4f32b1089b4fbddbdca22fab563045194b104be`
- auth corrected: `da4957a33f75a890b57390f94a5cb95347808b5d0171cb1c5b72bc232de860eb`
- guest error: `8602cd754b58b17885e8dbd33fda75d426a4718128d48b56e7fad01b4e4ca731`
- guest corrected: `2811bcd5664e203db6676fc88153829b60d5d06478cd9ac6ff3b6d84e73ca98a`
