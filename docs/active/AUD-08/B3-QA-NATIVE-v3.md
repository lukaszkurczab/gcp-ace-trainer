# AUD-08-B3 native evidence QA — v4 checkpoint

**Scoped verdict: PASS WITH ISSUES.** This review covers the recorded direct-issue/background/reveal/ACK run, the recorded cold-resume ACK screen, post-ACK backend read, guest-data evidence, and the v4 native adoption-exit flow. It does not accept all of B3 or claim guest-data equality, full Hermes bundle execution, or final backend revoke cleanup.

Reviewer: GPT-6 Luna, high. Read-only review of artifacts and current source; no tests, simulator, services, or ports were run or changed. Recovery codes, tokens, credentials, email, operation IDs, and digest values are intentionally omitted from this report.

## Evidence reviewed

- `evidence/B3/native/debug/2026-10-01_0610/direct-issue-live-background-ack/timeline.json` and `runtime-check-after-ack.json`.
- The direct flow’s Maestro command manifest, which records the visible issue panel, background/resume hidden state, explicit reveal, saved-ACK control, and terminal UI. The corresponding timeline places issue and ACK completion about seven seconds apart and records the ACK before both the result expiry and retry deadline.
- Post-ACK filtered Firestore/API read in the direct timeline: session and query responses succeeded; the operation status is `acknowledged`; the result document count is zero; the cipher envelope and plaintext code field are absent.
- `native/debug/2026-10-01_0610/ack-cold-resumed/commands.json` and `.maestro/screenshot-capture/aud08-b3/40-ack-cold-resumed-codes.yaml`: all seven recorded steps completed, asserting recovery-pending, restored codes, saved-ACK requirement, and terminal UI after ACK.
- `native/debug/2026-10-01_0610/read-only-navigation-storage-check.json`.
- `.maestro/screenshot-capture/aud08-b3/45-v4-exit-to-guest.yaml` and `native/debug/2026-10-01_0610/v4-exit-to-guest/AUD-08 B3 v4 account sign-out to preserved guest profile/commands.json`.
- Current `src/features/account/AccountEntryScreen.tsx:953-955,1103-1111`, canonical `src/application/account/AccountSessionProvider.tsx:2045-2146`, and `src/application/account/accountIdentityComposition.test.ts`.

## Findings

The direct live run demonstrates the actual UI sequence for issue, same-process background/foreground hiding, explicit reveal, and saved ACK. Its after-ACK backend query supplies real state evidence: the operation is acknowledged and the result/cipher are gone. The event timeline records a code-set digest and a server operation ID separately, but does not bind the digest to that operation in the backend proof. It therefore cannot establish which exact code set the operation result contained.

The cold-resume run demonstrates the pending screen restoring codes and reaching terminal UI after ACK. Its Maestro flow begins with assertions rather than documenting the process termination/relaunch, and this artifact set has no cold-run backend query or timeline correlating that ACK to an operation, digest, and deadline. The native worker reports a backend ACK before the deadline; the checked-in cold artifact independently proves the UI portion only.

The v3 Metro manifest/launch-asset fetch returned HTTP 200 with the pinned v3 bundle hash and all 46 consumer source pins matching. The post-run Hermes inspector received no CDP response, and the app container had no matching on-disk bundle. The flow’s successful selector assertions are evidence the app performed these UI actions, but the artifacts cannot prove the exact fetched Hermes bundle was the script executed.

The pre-fixture and post-flow encrypted MMKV files have the same size but different hashes. The recorded domain comparison correctly treats that as inconclusive: the SecureStore encryption key is absent from the preserved app-container backup, so the records cannot be decrypted and compared within this read-only scope. The timeline says the adoption choice remained pending, no adoption toggle changed, and Continue was not pressed; the separate navigation check also records no discard selection. There is no evidence that guest data was transferred or discarded, but the actual guest-domain records were not independently compared.

The direct run reached terminal UI after the canonical coordinator path, which awaits vault deletion and a null read-back. That is implementation-backed indirect evidence that the recovery vault was cleared; no Keychain item was independently read. The fixture Firebase account remained signed in, and no sign-out, app-data reset, or fixture-account deletion was performed. Treat the test credentials/account and Firebase SecureStore persistence as outstanding cleanup. The preserved backup excludes Keychain.

The earlier read-only navigation check predates the adoption sign-out button; its statement that this path lacks sign-out is superseded. The v4 Maestro run records 17/17 commands complete: after a stop-and-launch with app data retained, it found and tapped `account-adoption-sign-out`, observed the sign-in screen, chose Continue without account, then reached Home, Progress, and Settings. The flow contains no adoption toggle or Continue/adoption action. This demonstrates that the new selector was available and the safe-exit route executed in the running app. It does not compare guest-domain records before and after sign-out, and the separate storage check still cannot decrypt the MMKV data because the SecureStore key is absent. The canonical source path remains `account.signOut()` through the existing command runner; it persists the local logout/revoke block, closes scoped storage, calls Firebase sign-out, verifies the SDK is null, then publishes signed-out. That path does not invoke adoption or guest discard. The checked-in native run does not itself prove backend revoke cleanup; the native worker's separate backend evidence remains pending review.

## Verification boundary

Native behavior verified: direct issue/background/reveal/saved-ACK UI; direct post-ACK backend status and cipher cleanup; cold-restored pending UI and terminal transition; v4 adoption sign-out to signed-out/guest navigation through Home, Progress, and Settings. Source verified: sign-out uses the canonical provider path and remains disabled during blocking recovery. Not verified by this review: cold-run operation/digest/deadline correlation; exact Hermes execution binding; guest-domain record equality; direct Keychain read-back; the separate backend revoke-cleanup result. This is scoped evidence only, not whole-B3 acceptance. The remaining account-identity mismatch policy is outside this checkpoint and remains unresolved.
