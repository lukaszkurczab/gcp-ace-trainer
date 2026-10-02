# AUD-08 B3 native recovery issue checkpoint (source v2)

## Outcome

The existing iPhone 17 reached a signed-in account-adoption screen and issued a recovery-code operation through the app. The Maestro flow later exited nonzero because it expected the `recovery-operation-show-codes` control, while the active screen rendered codes immediately. The UI hierarchy showed `recovery-operation-codes`, `recovery-operation-save-required`, and `recovery-operation-saved-ack`. Raw recovery codes were removed from every text artifact; the failure screenshot was deleted. No saved acknowledgement was sent.

## Fixture and route

- Device: existing iPhone 17 simulator, UDID `7F315654-3175-4F3C-BB24-B0263F59360C`, iOS 26.4.
- App: `com.lkurczab.patternly`; same previously booted app and Metro, no device or app-data reset.
- Fixture alias: `AUD-08-B3-native-20261001-77d536f5a8`. The email and password remain in a mode-0600 file under private `/private/tmp`; neither value is copied here.
- Account path: Settings → account entry → register. The first two runs stopped at the client-side minimum-password validation because Maestro entered one character in each secure field. The existing account-registration flow toggles each field visible before typing; applying that pattern and asserting the complete value in both fields allowed the normal SDK registration path to complete. Screenshots are deleted on failures and the wrapper redacts fixture credentials from text logs.
- Auth emulator: before retry, password sign-in returned HTTP 400 `EMAIL_NOT_FOUND`; after registration, password sign-in returned HTTP 200. The Patternly API registration/session path completed, and the adoption screen appeared after the flow's 30-second panel assertion expired.

## Served bundle and source checkpoint

At `2026-10-01T04:57:01.384Z`, Metro served manifest and launch bundle with HTTP 200. The served JS bundle was 68,155,229 bytes with SHA-256 `cbf6300d0e747bcb0b13b330a4166b57d63b96e74aca32d744aac0fb7fae77bb`; it contained `ensureRecoveryIssueSignInSession`, `recovery-operation-show-codes`, and `recovery-operation-saved-ack`. All 44 files in the then-current consumer source-pins v2 manifest matched. The same dev-client URL was reopened on the existing device without clearing app data, followed by the native registration/recovery operation.

This is a v2 checkpoint only. The parent later invalidated source freeze v2 after final QA found additional exposure and cleanup races and directed native cold-restart/foreground work to wait for source v3. The hash above is historical evidence and does not identify the later v3 bundle.

## Read-only server proof

Using only the owned fixture identity, the read-only check performed Firebase password sign-in, canonical `/v1/account/session/exchange`, Firebase custom-token sign-in, and `GET /v1/me`; each returned HTTP 200. A Firestore-emulator query filtered by that account ID found exactly one matching operation and one result document:

- Operation `f7321081-6d11-48fa-9829-bd2f40a584cc`, kind `reissue`, status `result_available`, expected authorization generation `1`.
- Matching result document contained a cipher envelope and no plaintext `codes` field.
- No saved-ACK request was sent; the server operation remains pending acknowledgement.

The query inspected only the owned account. It did not read or alter other emulator accounts. No emulator data was reset.

## Stop point

Background/foreground reveal, cold restart, same-operation comparison, and saved acknowledgement are pending the parent’s source-v3 freeze. Guest adoption was not continued; the existing guest profile remains available for later transfer and the pre-fixture app-container baseline is preserved. The baseline does not include iOS Keychain.

Detailed redacted run artifacts are in `register-fixture/` and `issue-codes/`. The test flow is `.maestro/screenshot-capture/aud08-b3/20-register-local-smoke-fixture.yaml` and `.maestro/screenshot-capture/aud08-b3/30-issue-test-only-recovery-codes.yaml`.
