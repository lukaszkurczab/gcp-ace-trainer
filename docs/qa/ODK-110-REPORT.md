# ODK-110 — Legal information: unavailable external Support

Status: **VERIFIED_CLOSED / done**, 2026-09-12. Scope is ODK-110 only.

## Result

When the public environment is absent or invalid, Legal information now labels the warning **External support unavailable** / **Zewnętrzna pomoc jest niedostępna**. Its explanation already names the precise cause and says only that the Support link is disabled. The local Privacy Policy and Terms rows remain normal in-app navigation actions; the disabled presentation remains confined to the external Support row.

The configured state is unchanged: a validated public environment supplies the Support destination and removes the warning. Invalid or missing public configuration still fails closed instead of inventing a URL.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.98 / 0.96 / 0.93 / 0.96**, minimum **0.93**. The correction renames one misleading localization contract and keeps the existing single public-configuration boundary.

| Check | Actual result |
| --- | --- |
| Missing, invalid, and configured public-environment tests | **5/5 PASS** |
| Preferences, localization, and settings presentation | **33/33 PASS** |
| Combined focused suite | **38/38 PASS** |
| Local EN Support warning and disabled row | **PASS** |
| Local Privacy Policy navigation/document | **PASS** |
| Local Terms navigation/document | **PASS** |
| Manual visual review of three captures | **PASS** |
| Independent QA | **PASS — no P0/P1/P2** |
| EN/PL legal resource shape | **34/34 keys; equal shape** |
| Approved client registry | **4/4 PASS** |
| ODK-110 scoped `git diff --check` | **PASS** |
| Repository typecheck | **Not attributed while concurrent SIMP-05 changes shared runtime contracts** |

Canonical runtime evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-12_202014/ODK-110 local Support unavailable scope — EN/takeScreenshot`. The reproducible local-config flow is [10-local-support-scope-en.yaml](odk110/10-local-support-scope-en.yaml).

## Limitations

The local flow intentionally does not open an external URL. Valid and invalid configured destinations are covered at the public-environment contract boundary; the runtime capture proves that a missing local configuration disables Support while both bundled legal documents remain available. The visible legal-document placeholders are pre-existing ODK-E2E-087 scope and are not changed here.
