# ODK-055 — Delete account: local, cloud, reminder, and retention effects

Status: **VERIFIED_CLOSED / done**, 2026-09-13. Scope is ODK-055 only.

## Result

Account deletion now has one fail-closed completion boundary across the remote proof, device reminders, and local account-owned learning data. After the backend has returned and verified a deletion proof, the app must first cancel every known native learning-plan reminder and persist reminders as disabled. Only then may it clear the canonical local learning namespace, release the account binding, mark the deletion lifecycle complete, sign out, and report success.

If reminder cancellation or its durable settings write fails, deletion remains `localCleanupPending`. The local learning data and binding remain available for an explicit or restart recovery retry, while the verified remote operation marker prevents a second remote deletion request. The retry repeats reminder cancellation and local cleanup only.

## Verified effects

| Scope | Deleted or disabled | Intentionally retained |
| --- | --- | --- |
| Local learning | selected track, goal, learning plan, active session/draft/timer, session/result/attempt/review indexes and orphan records, sync state, content-report outbox | device settings, disabled notification settings, installation identity, mutation journal, deletion recovery marker |
| Device reminders | every native reminder known through durable schedules, legacy IDs, or the reminder journal; settings become disabled | a retryable pending record if native cancellation or durable persistence fails |
| Cloud account | Firebase Auth user, Patternly user subtree and progress, identity mapping, export audits and rate-limit record | no account-owned learning copy |
| Limited cloud evidence | account/contact links are removed from retained content reports | 45-day keyed-HMAC deletion tombstone without raw provider UID; unlinkable deletion operation/proof evidence for the documented period |
| External store | no Patternly account or sync data remains | an App Store subscription and Apple-controlled transaction records are outside Patternly deletion and are not cancelled by it |

The local Privacy Policy and Your data copy describe these same boundaries: synchronized learning data is removed, local-only drafts/preferences/reminders are distinguished from the sync allowlist, retained deletion evidence is identified, and store subscriptions are explicitly outside the account deletion effect.

## Review and verification

Controller scores before correction (fit, simplicity, risk, maintainability): **0.99 / 0.82 / 0.74 / 0.88**, minimum **0.74**. The initial risk was below the 0.8 threshold because the deletion service could report success while scheduled native reminders remained active. The corrected design raises the assessed minimum to **0.91**: one required preparation callback is shared by initial deletion, explicit retry, and restart recovery; it reuses the canonical reminder coordinator and the existing durable deletion marker rather than adding another lifecycle.

| Check | Actual result |
| --- | --- |
| Account deletion lifecycle and command guards | **56/56 PASS** |
| Native reminder enable/disable/failure behavior | **20/20 PASS** within the combined **76/76** focused run |
| Backend suite against live Auth and Firestore emulators | **163/163 PASS** |
| Cloud destructive deletion, proof, tombstone, report de-identification, and old-token rejection | **PASS** in backend emulator tests 55–63 |
| Local cleanup retry after reminder failure, without a second remote delete | **PASS** |
| ODK-055 scoped `git diff --check` | **PASS** |
| Repository typecheck | **ODK-055 errors: none; full result not attributable while concurrent SIMP-05 changes contain unrelated errors** |
| Independent QA | **PASS — no P0/P1; diagnostic-classification P2 fixed before closure** |

The emulator run used the already-running local Firebase Auth and Firestore emulators after the wrapper correctly refused to start duplicate instances on occupied ports.

## Limitations

The automated proof deliberately uses disposable emulator identities and injected native-notification adapters. A physical-device check of operating-system notification delivery remains part of the separate device gate; ODK-055 proves the application contract and simulator-safe native cancellation boundary, not Apple-controlled subscription cancellation or physical-device scheduler behavior.
