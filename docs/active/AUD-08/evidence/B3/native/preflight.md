# AUD-08 B3 native preflight

Date: 2026-10-01 (local simulator time, Europe/Warsaw)

## Environment and scope

- Existing iPhone 17 simulator `7F315654-3175-4F3C-BB24-B0263F59360C`, iOS 26.4, was already booted. Existing `com.lkurczab.patternly` app was installed and launched; no device was created, app data was cleared, or backend/service restarted.
- Existing Metro smoke endpoint `http://[::1]:8081/status` returned `packager-status:running`. The Expo AppEntry bundle endpoint returned a 69,385,281-byte bundle containing `recovery-operation-panel`. This confirms current B3 UI is being served by Metro; it does not by itself prove which bundle the already-installed app executed.
- Local backend/Auth/Firestore data was not inspected or changed.

## Captured UI and path

- `aud08-b3-010-settings-guest-account-cta.png` shows the live Guest Settings state with the visible “Sign in or create an account” CTA. The initial launch home and attempted Expo URL screenshots are also retained as context; neither is counted as Account Entry evidence.
- Maestro found `settings-screen` and tapped the visible `settings-account-entry` element at its reported center (`201,230`). The screen stayed on Guest Settings through the following assertion window. Two attempts failed to reach Account Entry: first looking for `account-sign-in`, then the source-correct sign-in form selector `account-email`. The recorded post-tap screenshots still show Settings.
- No signed-in identity, recovery codes, operation status, token, or code fixture was used. No B3 issue or saved-ACK native state was reached.

## Next native path and selectors

- Current source path: Settings tab → `settings-account-entry` → `AccountEntryScreen` with `initialMode: "signIn"` for guest/signed-out users. Expected form selectors are `account-email`, `account-password`, and `account-sign-in-submit`; `account-sign-in` is only the entry-choice CTA and is not expected in the direct sign-in mode.
- For recovery-code issue UI, a matching authenticated test account should open Settings → `settings-recovery` → Account Security recovery. Source selectors include `account-recovery-codes-panel`, `recovery-operation-panel`, `recovery-operation-codes`, `recovery-operation-saved-ack`, and `recovery-operation-retry`. `delivery_unconfirmed` is an explicit retained-status panel, not an issue/ACK success state.
- Pending recovery startup should be captured separately after a coordinator-controlled fixture is available. Do not seed a mismatched UID or force account switching from this Guest baseline.

## Readiness

**Partial preflight; native Account Entry and recovery operation captures are blocked.** Simulator, installed app, Maestro, and Metro are available. The next blocker is explaining why the visible Settings Guest CTA does not produce the registered Account Entry screen in the running app; current source routes it directly, but the on-device screen remains Settings after an accurately targeted press. Root should verify the runtime bundle/reload and navigation behavior before continuing native B3 paths. Do not interpret this as a passed UI or account-flow check.
