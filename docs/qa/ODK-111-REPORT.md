# ODK-111 — Legal information: personal rights and non-personal recovery

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-111 only.

## Result

Legal information now exposes two direct, distinct entries: **GDPR requests** routes to the account-bound privacy-request surface, while **Recover non-personal data** routes to the manually assessed legal-request form. The previous shared `Data rights` bottom sheet and its obsolete state, identifiers, and localization keys were removed.

The recovery copy explicitly limits the request to eligible non-personal data and states that deleted progress is neither retained nor restored. An authenticated request uses account identity and asks for a narrative; a guest request requires both email and narrative. A guest cannot create or inspect account privacy requests.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.99 / 0.95 / 0.91 / 0.96**, minimum **0.91**. The selected PO option is implemented as two direct rows with existing canonical routes and submission endpoints; no new abstraction or compatibility path was added.

| Check | Actual result |
| --- | --- |
| Preferences, presentation, and legal submission focused suite | **36/36 PASS** |
| EN/PL legal resource parity | **74/74 common keys; no differences** |
| Authenticated EN runtime: both routes and account forms | **PASS — 3 screenshots** |
| Guest EN runtime: both routes, account boundary, and public recovery form | **PASS — 3 screenshots** |
| Independent QA | **PASS — no P0/P1; one evidence-traceability P2 addressed in maintained flows** |
| ODK-111 scoped `git diff --check` | **PASS** |
| Repository typecheck | **Not attributed while concurrent SIMP-05 changes shared runtime contracts** |

Authenticated evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-12_202723/ODK-111 personal rights and non-personal recovery — account EN/takeScreenshot`. Guest evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-12_205044/ODK-111 personal rights and non-personal recovery — guest EN/takeScreenshot`. Reproducible flows are in [odk111](odk111/).

## Limitations

The first screenshot in the already completed authenticated artifact retains an earlier `guest-en` filename, although the artifact, commands, remaining names, and assertions identify the authenticated branch. The maintained account flow now uses the correct `account-en` name. This is an evidence-label issue only; the guest branch has a separate successful artifact and correctly labelled captures.

The setup helper may finish on onboarding after switching from an account to guest. The canonical guest flow handles that entry state before performing its assertions. Early failed runs also exposed a Maestro coordinate race when a settings row was near the future back-button position; centering the row before tapping removed the race and the final run passed without retry scaffolding.
