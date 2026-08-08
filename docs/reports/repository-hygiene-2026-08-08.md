# Repository hygiene record — 2026-08-08

## Scope and authority

This is the bounded evidence record for Directive 1. It does not redefine the
product contract, documentation semantics, or execution plan. The owner inputs
were verified from the supplied five-file ZIP: ZIP integrity passed and its
SHA-256 was `c8c5c248726c01e331e0bfc74831165dda269a3e1248f7f91ddc7b93490b1460`.

`docs/launch-completion-plan.md` remains the sole execution-order document
until Directive 3 regenerates it. Directive 2 owns reconciliation of semantic
documentation conflicts.

## Classification inventory

| Path or family | Classification | Evidence and consumers | Action / required verification |
| --- | --- | --- | --- |
| `docs/00-13`, `15-17`, contract YAML/schema/parser/tests, PO register | `KEEP_CANONICAL` | Explicit Directive 1 preservation set; contract gate and tests consume them. | Untouched except minimal non-product authority wording in `00` and `10`. |
| `docs/README.md` | `KEEP_CANONICAL` | Documentation index. | Repair authority index: plan is sole execution order; RC closure is historical. |
| `docs/launch-completion-plan.md` | `DEFER_TO_PLAN_REGENERATION` | Repository execution sequence; extensive task history. | Preserve unchanged; Directive 3 owns replacement. |
| `docs/release-candidate-closure.md` | `KEEP_HISTORICAL_WITH_STATUS` | Linked by reports and user-testing material; records dated RC facts. | Add historical-only status; do not use as current authority. |
| `docs/launch-surface-inventory.md`, `competitive-product-gap-audit.md`, `launch-readiness-audit.md` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Referenced by plan, PO register, and current documentation; their launch assumptions conflict with owner inputs. | Retain as evidence; Directive 2 decides semantic treatment. |
| `docs/reports/launch-001-account-data-contract.md` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Historical account-contract evidence; linked by plan and current status material. | Retain pending guest-first/entitlement/session reconciliation. |
| `docs/reports/launch-002-visual-shell.md`, `launch-003a2-account-lifecycle-design.md` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Account design and visual target evidence; design references remain consumed by contract/tests. | Retain until Figma/design authority reconciliation. |
| `docs/reports/launch-003a0-domain-hosting-decision.md`, `launch-003b1-project-shells.md`, `launch-003b2-firestore-foundation.md`, `launch-003b3-authentication-foundation.md`, `launch-003b4-cost-cloudrun-preflight.md`, `launch-003b5-keyless-policy.md` | `KEEP_ACTIVE_EVIDENCE` | External mutation, security, environment, and project provenance; Task 3/report references remain. | Retain unchanged. |
| `docs/reports/launch-005-learning-runtimes.md` | `KEEP_ACTIVE_EVIDENCE` | Open Task 5 device-evidence gate and RC runners/flows. | Retain unchanged. |
| `docs/designs/**` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | All current design references are cited by canonical YAML, semantic parser, and contract tests. | Retain until controlled Figma/handoff work; no PNG deletion. |
| `docs/po-questions/rc-003-certification-exam-interaction-policy.md` | `KEEP_HISTORICAL_WITH_STATUS` | Sole PO decision record for current certification interaction behaviour; no duplicate consumer. | Retain as historical implementation provenance. |
| `docs/user-testing/**` | `DEFER_TO_PLAN_REGENERATION` | Reusable protocol/evidence, but launch-gate role depends on regenerated plan; links consume RC record. | Retain; repair labels that called RC evidence current status. |
| `docs/adr/**` | `KEEP_HISTORICAL_WITH_STATUS` | Architectural history; ADR-003 already identifies supersession. | Retain for Directive 2 status reconciliation. |
| `.maestro/rc-*`, `.maestro/runtime-auditability.yaml`, `scripts/run*Rc*.mjs`, matching `e2e:rc:*` commands | `KEEP_ACTIVE_EVIDENCE` | Invoked by RC runners and open device-evidence report. | Retain. |
| `.maestro/user-testing/**`, `scripts/runUserTestingReadinessEvidence.mjs`, `e2e:user-testing:readiness` | `DEFER_TO_PLAN_REGENERATION` | Runner consumes the flow; launch role belongs to later plan. | Retain without execution. |
| `.maestro/screenshot-capture/**` | `KEEP_ACTIVE_EVIDENCE` | Plan/report evidence paths and current RC visual/device flows. | Retain pending plan and design reconciliation. |
| `src/content/bundled/generated*.ts`, `src/tracks/algorithms/generated/*.generated.ts` | `KEEP_CANONICAL` | Imported by runtime, tests, recovery/content-boundary scripts, and cross-repository release checks. | Retain; tracked generation is a reproducible release input, not debris. |
| `capture.pcap` | `DELETE_GENERATED` | No source/test/script/CI/doc consumer; 1.5 KB malformed raw-IP capture, added incidentally in commit `4c406a7`. | Delete and ignore `*.pcap`; search for references. |
| `package.json` `inventory:algorithms` | `DELETE_DEAD` | Its only reference is the package script; `scripts/inventoryAlgorithmsSchema.mjs` was deleted in `21ec654`. | Remove the dead command and verify package-script targets. |
| Ignored `artifacts/**` and `docs/audits/**` local outputs | `KEEP_ACTIVE_EVIDENCE` | Untracked/ignored user material, including visual-audit evidence. | Do not modify or commit. |
| Application lockfiles, native/config files, server source, account/sync/deletion code | `KEEP_CANONICAL` | Required build inputs or foundations explicitly preserved by owner directives. | No source cleanup in Directive 1. |
| Content `manual/source/**`, schemas, publishing scripts, release lock, `artifacts/releases/**`, `artifacts/tracks/**` | `KEEP_CANONICAL` | Publishing pipeline and application cross-repository lock consume immutable manifests/artifacts. | No content-repository change. |
| Content `planning/**` and `*.candidate.json` | `DEFER_TO_DOCUMENTATION_RECONCILIATION` | Planning records reference candidate source paths; future track/family contract changes govern their fate. | Retain pending Directive 2. |
| Content `reports/`, `exports/`, and `artifacts/` ignore conventions | `KEEP_CANONICAL` | Publishing workflow prevents unapproved generated output from being tracked while retaining immutable release inputs. | No change. |

## Executed cleanup

- Deleted the unreferenced packet capture and added the narrow `*.pcap` ignore
  rule to prevent recurrence.
- Removed the stale `inventory:algorithms` package command, whose script no
  longer exists and has no consumer.
- Reclassified the RC closure as historical, repaired its consumer labels, and
  retained the launch plan as the sole execution-order document pending the
  controlled Directive 3 regeneration.

## Deferred work

Directive 2 owns all product, commercial, account, language, navigation,
session, content-package, and design-authority semantics. Directive 3 owns plan
replacement and the final role of historical execution and user-testing
material.
