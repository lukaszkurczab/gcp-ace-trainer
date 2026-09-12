# ODK-108 — account-data export scope and system sharing

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-108 only.

## Result

The authenticated Your data screen now names the action **Share or download account data** / **Udostępnij lub pobierz dane konta** and summarizes the artifact as account data, synced learning, and account activity. The details sheet explicitly describes the supported learning records and account context, Article 15 information, included and omitted categories, device-only exclusions, normal account restore, separate guest-data adoption, recent reauthentication, rate limits, and the fact that the JSON export cannot be imported into Patternly.

The client validates the complete current backend export envelope before creating a temporary file, including Article 15 information plus legal acceptances, purchase confirmations, and consumer cases. A recent-authentication challenge returns to the same data screen; choosing the export again opens the real iOS system share/save sheet with the generated JSON file.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.96 / 0.95 / 0.91 / 0.93**, minimum **0.91**. The change extends the existing export boundary and copy without adding a second export path.

Independent QA found no P0/P1. Static contract review confirms the frontend DTO and validator match the backend document, including all 11 manifest categories and redactions. The initial P2 evidence gap was closed by a clean install, fresh verified account, explicit reauthentication, and corrected EN/PL native-sheet captures.

| Check | Actual result |
| --- | --- |
| Focused export service tests | **9/9 PASS** |
| Focused settings/presentation tests | **21/21 PASS** |
| Clean sign-in, password prompt, onboarding | **PASS** |
| PL copy, details, reauthentication, system share sheet | **PASS** |
| EN copy/details and post-reauth system share sheet | **PASS** |
| EN/PL locale leaf-key parity | **139/139** |
| `git diff --check` | **PASS** |
| Repository typecheck | **Blocked by active concurrent SIMP-05 C1 identity cutover**; ODK-focused checks are green |

Canonical visual evidence is under `artifacts/maestro-screen-capture/odk-e2e-108/clean-auth-en/2026-09-12_190000` and `artifacts/maestro-screen-capture/odk-e2e-108/clean-auth-pl/2026-09-12_190933`. Reproducible flows are under [odk108](odk108/).

## Limitations

The system share sheet is owned and localized by iOS, so automation captures the native sheet rather than asserting one locale-specific action label. Import is intentionally unsupported. The full shared-tree typecheck cannot be attributed to ODK-108 while SIMP-05 C1 is actively replacing the content-identity contract; its failures are confined to that concurrent migration and were acknowledged by its owning task.
