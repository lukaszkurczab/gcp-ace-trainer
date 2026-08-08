# Repository hygiene record — 2026-08-08

## Scope and authority

This is the bounded evidence record for Directive 1. It does not reconcile the
product contract, rewrite canonical documents, regenerate the execution plan,
or change application behaviour.

The Product Owner handoff was downloaded outside the repositories, verified as
a real ZIP, passed ZIP integrity testing, contained exactly the five required
files, and matched SHA-256
`c8c5c248726c01e331e0bfc74831165dda269a3e1248f7f91ddc7b93490b1460`.
The five source files are retained verbatim under `docs/directives/` as phase
inputs; the ZIP and extraction directory are not committed.

`docs/launch-completion-plan.md` remains the sole execution-order document
until Directive 3 regenerates it. Directive 2 owns all semantic reconciliation.

## Classification inventory

| Path or family | Classification | Evidence / current consumers | Action and surviving owner |
| --- | --- | --- | --- |
| `docs/directives/**` | `KEEP_CANONICAL` | Exact Product Owner phase inputs; Directive 1 requires both owner directives and Directives 2–3 define later boundaries. | Retain verbatim as input authority, not as a duplicate normative product contract. |
| `docs/00-13`, `15-17`, canonical YAML/schema/parser/tests, PO register | `KEEP_CANONICAL` | Explicit Directive 1 preservation set and executable contract consumers. | Preserve; only mechanical authority/reference repair allowed here. |
| `docs/README.md` | `KEEP_CANONICAL` | Documentation index and authority map. | Add directives and distinguish historical evidence from current authority. |
| `docs/launch-completion-plan.md` | `DEFER_TO_PLAN_REGENERATION` | Sole current execution-order surface; Directive 3 explicitly replaces it in place. | Preserve body except links made invalid by proven-safe deletions. |
| `docs/release-candidate-closure.md` | `SUMMARIZE_THEN_DELETE` | Duplicate current-looking status surface; durable task facts already exist in the plan, PO register, focused reports, tests, and Git history. | Delete; `launch-completion-plan.md` remains the only execution surface. |
| `docs/launch-surface-inventory.md` | `KEEP_HISTORICAL_WITH_STATUS` | Directive 2 explicitly requires the retained route inventory as repository evidence. | Retain with a prominent historical-input marker; Directive 2 owns reconciliation. |
| `docs/competitive-product-gap-audit.md` | `KEEP_HISTORICAL_WITH_STATUS` | Directive 2 requires retained audits and its category research still informs later reconciliation. | Retain as dated research, without product/status authority. |
| `docs/launch-readiness-audit.md` | `KEEP_HISTORICAL_WITH_STATUS` | Directive 2 explicitly inspects retained audits; it records prior NO-GO and implementation risks. | Retain with historical-input marker, not as current gate/status. |
| `docs/reports/launch-001-account-data-contract.md` | `KEEP_HISTORICAL_WITH_STATUS` | Prior account/server contract facts remain relevant to Directive 2 and existing foundations. | Retain with historical marker; canonical product semantics remain elsewhere. |
| `docs/reports/launch-002-visual-shell.md` | `SUMMARIZE_THEN_DELETE` | Verbose completed-task evidence duplicated by source, tests, design registry, and Git history. | Delete; direct owners are source/tests and `docs/designs/product-direction-options/DESIGN.md`. |
| `docs/reports/launch-003a2-account-lifecycle-design.md` | `SUMMARIZE_THEN_DELETE` | Verbose completed-task transcript; its design and checksum evidence survives in the directly consumed design reference and tests. | Delete; direct owner is `docs/designs/account_lifecycle/DESIGN.md` plus its PNG; Git retains provenance. |
| `docs/reports/launch-003a0-*`, `launch-003b1-*` through `launch-003b5-*` | `KEEP_ACTIVE_EVIDENCE` | External mutation, environment, security, IAM, hosting, and provider provenance cannot be reconstructed from source alone. | Retain unchanged for Directive 2/3 and operational auditability. |
| `docs/reports/launch-005-learning-runtimes.md` | `KEEP_ACTIVE_EVIDENCE` | Open physical-device/runtime evidence and reusable RC flows still consume its proof model. | Retain. |
| `docs/designs/**` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Current canonical YAML, parser, tests, and implementation consume these references; future Figma authority does not make current evidence disposable. | Retain with directory-level previous-contract status; Directive 2 owns authority reconciliation. |
| `docs/po-questions/**`, `docs/adr/**` | `KEEP_HISTORICAL_WITH_STATUS` | Owner decisions and technical history explain current behaviour and provider/security choices. | Retain; Directive 2 owns supersession/status changes. |
| `docs/user-testing/**` | `DELETE_DEAD` | Cohort-specific Algorithms moderation packet from the previous launch model; the readiness audit explicitly replaced it, and no current test, CI job, package command, or open gate consumes the prose. | Delete; future practical beta requirements are owned by the new directives and Directive 3, not this old packet. |
| `scripts/runUserTestingReadinessEvidence.mjs`, `scripts/participantBuildIdentity.mjs`, `tests/participantBuildIdentity.test.mjs`, `e2e:user-testing:readiness` | `DELETE_DEAD` | Closed evidence generator and its self-test only served the deleted moderated-testing packet; no CI or active contract requirement consumes them. | Delete command, runner, helper, and infrastructure-only test together. |
| `.maestro/user-testing/algorithms-independent-practice-preflight.yaml`, `research-build-settings-preflight.yaml` | `DELETE_DEAD` | Only the deleted readiness runner/packet consumed these preflight flows. | Delete. |
| `.maestro/user-testing/algorithms-core-journey.yaml`, `tests/userTestingCoreJourneyMaestro.test.ts` | `KEEP_CANONICAL` | Canonical YAML maps `USER-TESTING-CORE-JOURNEY-001` directly to the test. | Retain until Directive 2 changes the canonical requirement and its executable coverage. |
| `.maestro/user-testing/algorithms-session-dry-run-regression.yaml`, `tests/algorithmsSessionDryRunRegressionMaestro.test.ts` | `KEEP_ACTIVE_EVIDENCE` | Test verifies current product session/timer/partial-summary behaviour, independent of the deleted moderation tooling. | Move flow to `.maestro/algorithms-session-dry-run-regression.yaml` and repair its test path. |
| `.maestro/rc-*`, `.maestro/runtime-auditability.yaml`, RC runners and package commands | `KEEP_ACTIVE_EVIDENCE` | Current runtime/device evidence and focused tests still consume them. | Retain. |
| `src/content/bundled/generated*.ts`, `src/tracks/algorithms/generated/*.generated.ts` | `KEEP_CANONICAL` | Imported by runtime, recovery/content checks, tests, and cross-repository release verification. | Retain; these are tracked release inputs, not disposable debris. |
| `capture.pcap` | `DELETE_GENERATED` | No consumer; malformed 1.5 KB packet capture introduced incidentally. | Deleted in cleanup commit `d303d87`; `*.pcap` is narrowly ignored. |
| `package.json` command `inventory:algorithms` | `DELETE_DEAD` | Command pointed to a script deleted earlier and had no consumer. | Removed in cleanup commit `d303d87`. |
| Ignored `artifacts/**`, `docs/audits/**`, native build output, dependency directories | `KEEP_ACTIVE_EVIDENCE` | Local ignored user/device evidence or reproducible tool output; not tracked cleanup candidates. | Do not modify or commit. |
| Application/server/account/sync/deletion/environment foundations | `KEEP_CANONICAL` | Explicitly protected by Directive 1; source inspection found active imports/tests. | No source-code cleanup or behaviour change. |
| Content repository canonical sources, schemas, release lock, immutable release artifacts, provenance | `KEEP_CANONICAL` | Publishing and application cross-repository verification consume them. | Content repository unchanged. |
| Content planning/candidate material | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Fate depends on Directive 2 family/track/content-package semantics. | Retain; no cross-repository cleanup mutation. |

## Exact cleanup actions

- Added the five verified Product Owner inputs under `docs/directives/`; the
  downloaded ZIP remains outside canonical repository paths.
- Deleted `docs/release-candidate-closure.md` and repaired all live references.
- Deleted the duplicated reports `launch-002-visual-shell.md` and
  `launch-003a2-account-lifecycle-design.md`; retained their direct evidence
  owners and Git provenance.
- Deleted the seven-file `docs/user-testing/` moderated-study packet, its
  package command, runner, build-identity helper/self-test, and two readiness
  preflight Maestro flows.
- Moved the still-valid Algorithms session regression flow out of the deleted
  user-testing namespace and repaired its test consumer.
- Marked the route inventory, competitive audit, readiness audit, account
  report, and design registry as historical or deferred evidence so they
  cannot be mistaken for current product or execution authority.
- Previous cleanup remains valid: deleted `capture.pcap`, ignored `*.pcap`, and
  removed the dead `inventory:algorithms` package command.

## Deferred work

Directive 2 owns product, commercial, entitlement, guest/account, sync,
session, language, navigation, content-package, platform, and design-authority
reconciliation across the canonical contract and narrative owners. Directive 3
owns replacement of the current launch plan and final execution sequencing.
Neither phase was started by this cleanup.
