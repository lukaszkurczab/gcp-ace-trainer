# ODK-107 — local learning-history reset

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-107 only.

## Result

Your data now exposes one canonical local learning-history reset for an exact guest or authenticated session. The confirmation sheet names the deleted scope (practice/exam sessions, results, attempts, reviews, active session, drafts, and timers) and the preserved scope (active track, goals, plans, preferences, notifications, installation identity, account binding, and content-report outbox). Cancel performs no mutation and success is explicit in EN and PL.

Guest reset uses the canonical journaled learning-state reset. Authenticated reset first requires a completely clean synchronized state, writes a durable reset guard, suppresses outbox/tombstone synthesis, clears the local history, and restores only supported history records through `getProgress`; it never calls the sync upload boundary. A failed restore retains the guard for retry. Sign-out is blocked while that guard exists, so it cannot erase the recovery marker or account binding.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.94 / 0.86 / 0.84 / 0.90**, minimum **0.84**. The design replaced unsafe direct wiring, which would have synthesized cloud tombstones after deletion, with the guarded restore protocol.

Independent final QA, **gpt-5.6-luna / max**, initially found one P1 in failed-restore → sign-out recovery. The fix and regression test were independently re-reviewed; the P1 is **closed / PASS**, with no remaining ODK-107 P0/P1.

| Check | Actual result |
| --- | --- |
| Full independent repository test run | **1050/1050 PASS** |
| Focused reset + account lifecycle after P1 fix | **45/45 PASS** |
| Earlier focused reset/presentation/locale suite | **36/36 PASS** |
| Expanded account/content regression suite | **100/100 PASS** |
| Guest EN, guest PL, auth EN, auth PL Maestro | **4/4 flows PASS**, cancel + confirmation + success |
| Screenshot visual inspection | **8 artifacts present**; representative EN/PL, light/dark reviewed |
| `git diff --check` | **PASS** |
| Typecheck | **PASS before concurrent SIMP protocol edit**; current unrelated SIMP boundary is transiently red |

Passing artifacts are under `artifacts/maestro-screen-capture/odk-e2e-107/{guest-pl-pass,guest-en-pass,auth-pl-pass,auth-en-pass}`. Reproducible flows are under [odk107](odk107/). Older failed/interrupted runs in `guest-en-pass` document test-harness stabilization only; the newest `2026-09-12_174011` run is canonical and passed.

## Limitations

The simulator proves the user-visible reset contract and the service tests prove exact mutation/synchronization behavior. It does not claim cloud deletion—by design, local reset preserves the account copy and restores supported history. The final repository-wide typecheck was invalidated by a concurrent SIMP change that narrowed the adoption client snapshot type while legacy storage remains `1 | 2`; ODK-107's own change passed typecheck immediately before that concurrent edit and its focused checks remain green.
