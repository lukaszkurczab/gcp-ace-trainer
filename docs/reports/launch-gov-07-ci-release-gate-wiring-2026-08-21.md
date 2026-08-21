# GOV-07 — CI release-gate wiring

Date: 2026-08-21

## Finding

The canonical QA workflow `.github/workflows/qa.yml` ran `qa:static`, native platform contract checks, contract-change checks, and the pinned content round-trip. It did not run `npm run release:gate --enforce`. Therefore a green QA run was not evidence that the launch gate was green.

Adding the enforced release gate to the ordinary regression job would make every current QA run fail for known, product-level blockers such as the incomplete eight-track lock and missing provider/store/device approvals. That would conflate regression health with launch admission.

## Implemented local wiring

Added `.github/workflows/launch-readiness.yml` as a separate manually dispatched workflow:

- requires explicit `application_commit` and `content_commit` inputs;
- checks out the application at the requested SHA with full history;
- checks out `lukaszkurczab/patternly-content` at the requested SHA with full history;
- rejects non-40-character lowercase SHA inputs and checkout mismatches;
- installs the application lockfile dependencies;
- installs the exact content checkout dependencies and runs its architecture
  suite, authoring validator, and AWS source audit;
- runs `node scripts/releaseGate.mjs --enforce` directly so the uploaded
  `launch-readiness-report.json` contains JSON only and remains parseable when
  the enforced gate exits non-zero;
- uploads the JSON report named after the evaluated application SHA even when the enforced gate fails.

The gate itself validates the application checkout, content evidence checkout, content source-commit reachability, release-lock provenance, launch scope, per-track admissions, and external release evidence. The workflow also runs the content repository’s exact-SHA validation suite. It does not create or imply any missing approval, provider, store, signing, or Figma evidence. Physical-device evidence is optional and is reported separately from mandatory external evidence.

## Verification

- `node --test tests/launchReadinessWorkflowContract.test.mjs tests/cleanCheckoutCiContract.test.mjs tests/releaseGate.test.mjs`: 8/8 passed.
- `npm test`: 631/631 passed when run with loopback access for the HTTP tests.
- The exact content checkout commands also passed locally: content suite
  143/143, `authoring:validate`, and `audit:aws-workbook-source`.
- `npm run typecheck`: passed.
- Workflow YAML parse and `git diff --check`: passed.
- Direct `node scripts/releaseGate.mjs --enforce` output is parseable JSON and
  exits non-zero with the honest `not_ready` status while blockers remain.
- The workflow preserves that gate exit code only after parsing the report, so
  a corrupt or truncated report fails the job independently of admission.
- The local gate remains honestly `not_ready`; no external evidence was fabricated.
- A GitHub run for the new workflow is pending because this local worktree has not been pushed.

## Boundary

This slice closes CI wiring only. It does not make the product launch-ready and does not replace exact-SHA CI, real content/provider/store/signing/device evidence, Figma owner approval/parity, or Product Owner GO.
