# ODK-105 — Your data local/cloud and restore truth

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-105 only.

## Result

The authenticated Your data copy now states that learning data remains on the device while supported account records can also be synchronized to the account cloud. It identifies normal synchronization after signing in to the same account as the restore path, keeps guest-data adoption as a separate merge decision, excludes active sessions and other device-only state, and explicitly says that the downloaded JSON cannot be imported into Patternly. Guest copy and behavior remain unchanged.

The wording is grounded in the actual sync allowlist and implementation: active-track selection, goals and learning plans, completed session summaries/results, attempts, and review-queue entries can be materialized from the account service; active sessions are excluded.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.95 / 0.93 / 0.89 / 0.91**, minimum **0.89**. Independent briefing validation, **gpt-5.6-luna / max**, returned **APPROVE** with **0.95 / 0.93 / 0.89 / 0.91**.

Independent final QA, **gpt-5.6-luna / max**, returned **PASS** with no P0/P1 findings and explicitly approved `VERIFIED_CLOSED` for ODK-105.

| Check | Actual result |
| --- | --- |
| Focused presentation + sync tests run by controller | **34/34 PASS** |
| Expanded focused source suite run by QA | **108/108 PASS** |
| Locale/i18n suite run by QA | **11/11 PASS** |
| Authenticated EN Maestro | **19/19 completed, 5 assertions, 2 screenshots** |
| Authenticated PL Maestro | **19/19 completed, 5 assertions, 2 screenshots** |
| Guest EN/PL Maestro | **34 completed, 1 expected conditional onboarding step skipped, 7 assertions, 4 screenshots** |
| Screenshot visual inspection | **8/8 PASS**, 1206×2622 |
| `git diff --check` | **PASS** |

The controller's ODK-105 typecheck passed before a concurrent SIMP-05 edit. During final QA, repository-wide typecheck failed in the unrelated, untouched `contentIdentityV2Planner.ts` with TS18046/TS7006. This is recorded as a P2 baseline caveat and is not attributed to or hidden by ODK-105.

Passing artifacts are under `artifacts/maestro-screen-capture/odk-e2e-105/auth-en-pass`, `auth-pl-pass`, and `guest-passing`. The saved flows in [odk105](odk105/) reproduce the authenticated and guest EN/PL states. Failed capture iterations remain diagnostic only and are excluded from the result.

## Changed files and limitations

ODK-105 changes only the EN/PL `data` copy, its semantic contract assertions, capture flows, status, and this report. It does not change sync behavior, schema, export behavior, routes, or guest behavior. The screenshots prove presented copy; focused repository tests prove the underlying allowlist and restore contract. No production provider or physical-device behavior is claimed.
