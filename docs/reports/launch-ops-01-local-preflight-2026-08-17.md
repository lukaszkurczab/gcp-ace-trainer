# OPS-01 — Local Cloud Run artifact preflight (2026-08-17)

## Scope

This report records only repository-local verification for the reproducible
Cloud Run artifact. It does not create or mutate a provider resource, IAM
binding, credential, Artifact Registry repository, Cloud Run service, or
deployment. OPS-01 therefore remains `PARTIAL`.

## Starting state

- Application branch: `main`
- Application commit: `c0e4aaa` (`docs: reconcile launch plan with AI-901 release`)
- Worktree: clean and aligned with `origin/main` (`0/0`)
- Content lock: `patternly-app-content-0019`

## Verified local evidence

The following commands completed successfully on the exact starting commit:

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

