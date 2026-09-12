# ODK-106 — Your data explicit session states

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-106 only.

## Result

The Your data screen now derives its copy and capabilities from one exhaustive `AccountState` presentation contract. Authenticated users receive export, account details, and privacy requests; only an exact guest session receives the public support channel and guest details. Signed-out, blocked, verification-pending, loading, configuration-unavailable, deletion, backend-unavailable, and revoked states each expose truthful EN/PL copy plus the approved safe action or an explicitly disabled state.

Recovery actions reuse only provider-owned commands: session restore, pending-deletion retry, identity refresh, and sign-out. Async actions reject duplicate presses, clear busy state in `finally`, and expose a localized failure. Replaced generic guest/auth locale paths were removed.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.97 / 0.92 / 0.91 / 0.94**, minimum **0.91**. Independent briefing validation, **gpt-5.6-luna / max**, returned **APPROVE** with minimum **0.90**.

Independent final QA, **gpt-5.6-luna / max**, returned **PASS** with no P0/P1 findings and explicitly approved `VERIFIED_CLOSED`.

| Check | Actual result |
| --- | --- |
| Controller focused presentation, wiring, and locale tests | **24/24 PASS** |
| Expanded independent QA tests | **103/103 PASS** |
| Authenticated EN/PL Maestro | **35/35 completed, 8 assertions, 2 screenshots** |
| Guest EN/PL Maestro | **36 completed, 1 expected conditional onboarding step skipped, 8 assertions, 4 screenshots** |
| Screenshot visual inspection | **6/6 PASS**, 1206×2622 |
| Local API preflight for authenticated evidence | `/health` and `/ready` **PASS** |
| `git diff --check` | **PASS** |

Passing artifacts are under `artifacts/maestro-screen-capture/odk-e2e-106/auth-en-pl-pass` and `guest-en-pl`; reproducible flows are under [odk106](odk106/). The earlier `auth-en-pl` run is diagnostic only: it timed out at account verification while the local API was stopped, then passed after the API readiness checks succeeded.

## Limitations

Authenticated and guest states have direct simulator evidence. The remaining recovery and unavailable states are covered by the exhaustive presentation test and source wiring, not by synthesized runtime sessions. Repository-wide typecheck is not claimed green: it currently fails only in the unrelated concurrent SIMP-05 edit at `src/storage/repositories/contentIdentityV2Planner.ts:599` (`TS18046`, `TS7006`).
