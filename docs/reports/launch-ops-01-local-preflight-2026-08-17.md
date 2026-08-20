# OPS-01 — Local Cloud Run artifact preflight (2026-08-17)

## Scope

This report records only repository-local verification for the reproducible
Cloud Run artifact. It does not create or mutate a provider resource, IAM
binding, credential, Artifact Registry repository, Cloud Run service, or
deployment. OPS-01 therefore remains `PARTIAL`.

## Starting state

- Application branch: `main`
- Application commit: `1bc0b3c` (`docs: reconcile DES-002 launch plan status`)
- Worktree: application code is clean and aligned with `origin/main`; the only
  untracked path is the local capture-only Maestro flow directory.
- Content lock: `patternly-app-content-0019`

The latest documentation updates were pushed through `e361197` and `1bc0b3c`.
The local preflight below was repeated against `1bc0b3c`; no content bundle
changes were produced.

## Verified local evidence

The following commands completed successfully on the exact starting commit
and were covered again by the pushed QA run:

```text
npm run sync:content-release
BUNDLED_FREE_NODE_PACKAGES_SYNCED=patternly-app-content-0019

npm run test:content-release-cross-repo
2/2 tests passed

npm run validate:content-boundary
CONTENT_BOUNDARY_CHECK=passed

npm run validate:runtime-privacy-boundary
RUNTIME_PRIVACY_BOUNDARY_CHECK=passed

npm run typecheck
passed

npm run build --prefix server
passed

git diff --check
passed
```

The repeated local run also passed `npm run typecheck`; the application test
suite and content validators are recorded in the current launch audit. The
lock still contains exactly three registered application artifacts, so this
preflight cannot prove the eight-track launch catalogue.

The content sync produced no worktree diff. The server build uses the
digest-pinned `server/Dockerfile` and the digest-pinned Docker builder in
`server/cloudbuild.yaml`; no mutable image tag or source-deploy shortcut was
introduced.

## Evidence not available locally

- `podman info` could not connect to the local Podman machine because its
  socket is unavailable in this execution environment. No container boot or
  image health evidence is claimed.
- `gcloud` is not installed in this environment. No current read-only project,
  IAM, service-account, Artifact Registry, Cloud Build, Cloud Run, logging, or
  rollback inventory was performed.
- No sandbox build, digest resolution, revision-ready check, authenticated
  conformance call, or deployed rollback evidence exists in this report.

## Boundary and next gate

No external mutation was attempted. Completing OPS-01 requires the owner/
provider-authorized deployment boundary: current read-only inventory, the
approved source principal and temporary IAM grants, one sandbox Cloud Build,
immutable digest verification, a sandbox Cloud Run revision check, sanitized
logging/rollback evidence, and removal of temporary grants. Production remains
out of scope until those sandbox proofs and the downstream provider gates pass.
