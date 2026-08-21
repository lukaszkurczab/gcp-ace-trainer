# GOV-01 — exact-SHA CI handoff — 2026-08-21

## Purpose

This packet defines the next executable verification slice for the local
GOV-01 content-approval-integrity change. It is an acceptance handoff, not
evidence that the change has been pushed or that CI has passed.

## Decision scope

- **Application repository:** `main`, current local HEAD
  `19b6601e19e1888ffce1449dd5e54ca5df4f8996`.
- **Content repository:** `master`, current local HEAD
  `12b99c78e03ec6c58964d7f83d11d1b50af08467`.
- **Change boundary:** content approval schema/validator/readiness/review
  packet semantics and their tests; no learner-source mutation.
- **External action required:** an authorized commit and push to the canonical
  content branch, followed by exact-SHA GitHub Actions verification.

## Confirmed local inputs

- `npm test`: 143/143 passed in the content repository.
- `npm run authoring:validate`: passed.
- `npm run audit:aws-workbook-source`: passed as a source audit; it does not
  create a runtime or publishing contract.
- The owner manifest is bound to source commit
  `e73c7314eee7b2cd3f53b04c952b6af6526d3685` and remains separate from
  agent-prepared review records.
- The app readiness gate remains `not_ready`; no local document change can
  close provider, store, signing, Figma-approval, or GO evidence gates.
  Physical-device testing is outside the mandatory launch scope.

## Acceptance criteria

1. The exact local content change set is reviewed before commit; unrelated
   user changes are not included.
2. A canonical content commit is pushed to `master`.
3. The `content-publishing.yml` workflow passes on that exact pushed SHA,
   including architecture tests, authoring validation, all eight structural
   validators, deterministic readiness/review-packet generation, and the
   existing Coding bundled Free-node check.
4. The workflow's generated readiness and review-packet files are clean on
   the pushed SHA.
5. The resulting report records the exact commit, workflow run URL, and
   whether the change altered learner-source bytes. A green run is not treated
   as publishing/runtime admission.
6. If the exact-SHA run fails, the failure is diagnosed from its logs and the
   change remains `partial`; no approval or readiness status is upgraded by
   inference.

## Non-goals

- Do not create or edit `evidence/human-content-approvals/manifest.json` to
  manufacture approval.
- Do not add a missing AWS runtime config, Design Interview runtime contract,
  package, publishing admission, or runtime admission in this slice.
- Do not push application or content changes without explicit authorization.
- Do not change the eight-track launch scope or relabel historical releases.

## Verification after authorization

```text
git diff --check
npm test
npm run authoring:validate
npm run audit:aws-workbook-source
git diff --name-only -- manual/source config/tracks config/families config/taxonomy schemas/publishing scripts/publishing package.json package-lock.json
```

Then run the canonical content workflow on the pushed SHA and record its
immutable run URL. Reconcile the app's cross-repository readiness only after
the content SHA is available from the canonical remote.

## Risks and stop conditions

- Stop if the push would include unrelated dirty files or if the remote branch
  advanced and the local base is stale.
- Stop if CI reports source or manifest drift; do not repair it by changing
  approval identity or deleting evidence.
- Stop before CNT-01 implementation until the owner chooses the canonical AWS
  content/taxonomy version and approves the required Free/diagnostic recut.

## Report target

Update this packet or add a follow-up exact-SHA result report with the pushed
content commit and workflow URL. Until then, GOV-01 remains `partial` and the
launch goal remains unverified.
