# ODK-112 — Legal information: hub boundary, links, and timeframes

Status: **VERIFIED_CLOSED / done**, 2026-09-13. Scope is ODK-112 only.

## Result

Legal information now states its role explicitly: it is a short guide, the bundled Privacy Policy and Terms hold the full rules, and only Support opens a configured external destination. The request rows and pre-submission screens expose the proven legal timeframes without inventing an operational SLA:

- service complaints receive an answer within 14 days, explicitly distinguished from a filing deadline;
- eligible consumers generally have 14 days to withdraw, with eligibility and service-start rules left in the local Terms;
- privacy requests normally receive a response within one month and may be extended by up to two months with notice in the first month;
- non-personal data recovery uses the statutory “reasonable time” boundary where applicable, without a fixed response promise;
- suspension appeals are identified as manual review without a fixed response promise.

Guest legal-request screens now retain the kind-specific legal copy and append the public email-channel instruction. Previously the generic guest instruction replaced the kind-specific intro and hid its timeframe immediately before submission.

## Review and verification

Controller scores (fit, simplicity, risk, maintainability): **0.98 / 0.93 / 0.88 / 0.94**, minimum **0.88**. The implementation reuses the existing localization, local-document routes, public Support boundary, and canonical request screens; it adds no new routing or policy layer.

| Check | Actual result |
| --- | --- |
| Preferences, presentation, and legal submission focused suite | **37/37 PASS** |
| Backend legal and privacy deadline contracts | **10/10 PASS** |
| EN/PL resource parity | **legal 74/74; data 139/139** |
| Guest EN hub, four request channels, Support boundary, Privacy, and Terms | **PASS — 7 screenshots** |
| Account EN privacy deadline and pre-submission form | **PASS — 2 screenshots** |
| Independent QA | **PASS — no P0/P1; flow-stability P2 addressed in maintained flow** |
| ODK-112 scoped `git diff --check` | **PASS** |
| Repository typecheck | **Not attributed while concurrent SIMP-05 changes shared storage contracts** |

Guest evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-13_003440/ODK-112 legal hub boundaries and proven timeframes — EN/takeScreenshot`, with the final local Terms continuation under `/Users/lukaszkurczab/.maestro/tests/2026-09-13_003706/ODK-112 local Terms continuation — EN/takeScreenshot`. Account evidence is under `/Users/lukaszkurczab/.maestro/tests/2026-09-13_005139/ODK-112 GDPR timeframe before submission — account EN/takeScreenshot`. Reproducible flows are in [odk112](odk112/).

## Limitations

The guest proof is split across the main run and a one-step Terms continuation because the document was visibly open but its long text node did not satisfy the original test-ID visibility assertion. The maintained main flow asserts the visible document title instead. The flow also now waits for every request screen and checks the guest email field, closing the independent QA traceability gap.

The legal documents still show unresolved operator placeholders from the existing ODK-E2E-087 scope. ODK-112 does not alter document variables or claim release readiness for those documents.
