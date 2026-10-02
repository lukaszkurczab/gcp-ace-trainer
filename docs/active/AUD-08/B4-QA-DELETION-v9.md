# AUD-08-B4 actual HTTP deletion — v9 independent QA

**PASS WITH ISSUES**, scoped deletion only. Reviewer: gpt-6-luna high (`b4_replacement_qa`), read-only; root transcription. No independent emulator rerun or source edits.

## Verification

46/46 consumer and 27/27 producer pins matched before and after independent typecheck (PASS). Only the integration test changed since v8. App HEAD `8d12b0ccabf7b2c28659c78c10a7915abafb2672`; backend HEAD `15e49d04dcf510cb7081b356a7182343d9d170ab`. Required root gate: **3 PASS / 0 FAIL / 0 SKIP**, exit 0, 16.26 seconds, isolated emulator shutdown. Log SHA256 `302a7dac75ebe3d6fafa12bb480f19d1a1ff222feff650eed6fbf2b372c11f47`.

## Findings

Live recovery is superseded and cipher removed during deletion sessions_revoking. Stale exact ACK returns typed 401/account_deleted; public status does not mint. Released canonical Admin gate forwards actual revoke/delete once each. HTTP 200 and public proof confirm completed deletion; Auth user and owned Firestore records are absent, tombstone exists, post-purge status does not mint. Scoped criteria PASS.

Read-only rate preflight preserves limits and waits for the natural window boundary. Its wait branch was source-reviewed; the recorded run does not clearly demonstrate that branch executed.

P3 failure-path hygiene: a resolving 35-second timer lets manual fixture cleanup proceed without server completion confirmation. A client timeout does not stop the server handler; cleanup could race it. Nonblocking for this recorded happy path, but requires correction before broader failure-path claims.

## Limits

Local HTTP/Admin/Firestore/Firebase SDK, explicit App Check and scheduling fixtures. Native consume, persistence/restart, production providers, broader concurrency and whole B4 remain unaccepted. Source freeze can be released for the approved next slice.
