# ODK-E2E-128 — readable Progress domains

Date: 2026-09-21  
Status: `VERIFIED_CLOSED`

## Outcome

Progress now resolves Claude and Google Cloud performance domains through one explicit, track-aware display catalog. The learner sees an authored, localized domain name and a short meaning in Current focus and Performance evidence. Unknown, aliased, and cross-track IDs fail to localized unavailable copy; no internal identifier is rendered. Empty package metadata no longer invents the `operations` domain.

No scoring, grouping, blueprint ID, content artifact, contentVersion, or artifact SHA changed. `patternly-content` remained clean.

## Canonical mapping

| Runtime ID | English UI title | Blueprint/source relationship |
| --- | --- | --- |
| `solution_design_and_architecture` | Solution Design & Architecture | Claude domain 1 provider label |
| `model_prompt_and_context_decisions` | Claude Models, Prompting & Context Engineering | Claude domain 2 provider label |
| `enterprise_tools_retrieval_and_integration` | Integration | Claude domain 3 provider label |
| `evaluation_diagnosis_and_optimization` | Evaluation, Testing & Optimization | Claude domain 4 provider label |
| `governance_safety_and_risk_controls` | Governance, Safety & Risk Management | Claude domain 5 provider label |
| `stakeholder_decisions_and_delivery_lifecycle` | Stakeholder Communication & Lifecycle Management | Claude domain 6 provider label |
| `team_workflows_and_operational_enablement` | Developer Productivity & Operational Enablement | Claude domain 7 provider label |
| `setup_environment` | Setting up a cloud solution environment | Existing GCP scoring domain |
| `planning_implementation` | Planning and configuring a cloud solution | Existing GCP scoring domain |
| `operations` | Ensuring successful operation of a cloud solution | Existing GCP scoring domain |
| `access_security` | Configuring access and security | Existing GCP scoring domain |

The seven Claude provider labels were reconciled against `patternly-content/config/certification-objective-registries/claude-certified-architect-professional-certification.json`; their runtime node IDs were reconciled against the Claude curriculum and taxonomy. The four GCP IDs retain their existing exact exam-domain labels.

## Implementation

- `cloudProgressDomainMetadata.ts` owns the closed 7 + 4 display catalog and an `available` / `unavailable` resolver.
- `progressTabModel.ts` projects title and description without changing score aggregation. Claude and GCP unknown IDs use explicit unavailable copy; absence of a package node no longer defaults to another domain.
- `ProgressTab.tsx` renders the short meaning in Current focus and Performance evidence. At accessibility font sizes the evidence row becomes vertical and fixed line heights were removed from the touched text.
- EN and PL locale files contain every authored title, description, and unavailable state.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| Focused metadata/progress/i18n tests | PASS, 12/12 after the large-text correction; earlier broader focused slice PASS, 13/13 |
| `npm run validate:content-boundary` | PASS |
| `npm run validate:runtime-privacy-boundary` | PASS |
| `git diff --check` | PASS |
| Full `npm test` | 1178 PASS; 10 release-manifest hook failures because the intentionally modified sibling backend worktree is not clean |
| Runtime EN | PASS: exact Claude title and meaning; raw ID and `CCAR domain 1` absent |
| Runtime PL | PASS: localized title and meaning; raw ID and `CCAR domain 1` absent |
| Runtime PL large text, 402 pt screen | PASS after correction: full Current focus and stacked Performance evidence content visible |

The full-suite failures do not execute ODK-128 behavior: `releaseManifest.test.mjs` requires all four sibling repositories to be clean, while the backend contains preserved in-progress local bootstrap changes. No repository was cleaned or reset to make this gate pass.

## Runtime evidence

Evidence is under `docs/qa/evidence/ODK-128/`:

- `progress-evidence-en.png` and hierarchy
- `progress-evidence-pl.png` and hierarchy
- `progress-evidence-pl-large-text.png` and hierarchy
- `progress-score-pl-large-text.png` and hierarchy
- repeatable Maestro navigation/assertion flows

Only disposable simulator `Patternly_ODK124` (`2E25A24A-E3FC-408A-BFC0-F91A939F2D7E`) was used. Preserved iPhone 17 state was not reset or changed. The disposable simulator's content size was restored to `medium` after capture.

## Independent QA

Verdict: **PASS**, with no P0 or P1 findings. Scores: architecture `0.92`, simplicity `0.88`, risk `0.84`, maintainability `0.90`; minimum `0.84`.

QA independently ran 14 focused metadata/progress/large-text tests, `npm run typecheck`, and `git diff --check`; all passed. It also inspected the focused diff, runtime hierarchies, screenshots, and confirmed that `patternly-content` is clean with no generated canonical-content diff.

Non-blocking P2 evidence gaps:

- GCP and unknown/missing ID are covered by resolver/UI contract tests, not separate runtime captures.
- Zero-attempt behavior is covered by the model test, not a dedicated zero-progress screenshot. The file named `progress-empty-en.png` records the top of the runtime page after one completed response and is not cited as zero-attempt proof.
- Older `Needs attention` and Activity surfaces visible in the XXXL capture retain pre-existing clipping outside the changed ODK-128 Current focus and Performance evidence cards.

## Assessment

- Architecture: `0.92`
- Simplicity: `0.86`
- Risk: `0.84`
- Maintainability: `0.90`
- Minimum: `0.84`

The implementation was accepted by the pre-change validator at minimum `0.84`. Runtime large-text evidence found one layout defect; it was fixed and retested before independent QA.
