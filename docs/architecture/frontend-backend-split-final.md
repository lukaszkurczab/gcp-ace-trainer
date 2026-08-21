# Frontend/backend split — final handoff

Date: 2026-08-21

## Status

The split is complete locally and all available local release gates pass.
GitHub publication is not complete because the environment rejected creation of
the new public backend repository as an external disclosure action requiring
explicit user approval.

## Repositories and commits

| Repository | Remote | Intended default branch | Local migration commit | Publication |
|---|---|---|---|---|
| Frontend | `https://github.com/lukaszkurczab/gcp-ace-trainer.git` | `main` | `1763882899d1f439f52751c7334969bd2fb290fc` (`feature/frontend-backend-split`) | Not pushed |
| Backend | `https://github.com/lukaszkurczab/patternly-backend.git` | `main` | `c699396e4abb3361a69ca875f8954c1cda291d1c` (`main`, with feature branch retained) | Repository does not yet exist |
| Content | `https://github.com/lukaszkurczab/patternly-content.git` | `master` | `7fcf28d159c19e6b5d1c7e63828ae943ca3ce7e3` (`feature/frontend-backend-split`) | Not pushed |

The existing frontend and content repositories are public. The backend was
prepared as public to match that visibility, but `gh repo create` was rejected
by the execution policy before creating anything.

## Responsibility boundary

```text
patternly-content
  authoring -> validation -> review -> immutable release artifacts
                                      |
                                      v
patternly (Expo frontend)             immutable content lock/package
  local learning engine, sessions, timer, queue, cache, UI
       |
       | Firebase ID token + explicit versioned progress mutations
       v
patternly-backend
  Firebase identity mapping -> PostgreSQL canonical user state
  idempotent progress sync -> version conflicts, never last-write-wins
  entitlements/subscriptions boundary, track access, content metadata
       |
       v
  Cloud Run / Cloud SQL / Secret Manager / Cloud Logging contracts
```

## Implemented changes

Frontend:

- Kept learning execution, active sessions, timer, local queue, cache and
  state transitions offline-first.
- Added the REST transport boundary in
  `src/infrastructure/clients/PatternlyApiClientAdapter.ts` with token
  injection, HTTPS origin validation, `/v1/` path restriction, timeout and
  explicit transport errors.
- Removed the old Firestore server, its deployment files and server-only test
  suite from the frontend repository.
- Removed the obsolete account adapter and updated the approved client
  registry to point at the Patternly API boundary.
- Kept account deletion/adoption behavior out of the frontend until its
  PostgreSQL backend lifecycle contract is enabled; no silent compatibility
  bridge remains.

Backend:

- Added strict TypeScript, Fastify, Zod, Drizzle, PostgreSQL and structured
  request correlation foundations.
- Added `/health`, `/ready`, `/openapi.json`, `/v1/me`,
  `/v1/entitlements`, `/v1/progress` and `/v1/progress/sync`.
- Added Firebase Admin token verification with canonical PostgreSQL user and
  identity mapping.
- Added transactional mutation batches with `mutationId` deduplication,
  expected-version checks and explicit conflict results.
- Added the User, Identity, Device, Subscription, Entitlement, TrackAccess,
  NodeProgress, ItemProgress, SyncMutation and ContentVersion persistence
  domains with constraints and indexes.
- Added the guest-to-account merge preview/confirmation contract. Every
  conflict requires an explicit resolution; unresolved conflicts are returned
  as unavailable rather than choosing a winner.
- Added Cloud Run Docker/Cloud Build contracts and backend CI.

Content:

- Kept the repository as authoring and immutable publishing only.
- Replaced ambiguous application-root admission variables with explicit
  `PATTERNLY_FRONTEND_ROOT` naming.
- Did not add an artificial runtime dependency on the backend.

## Verification

- Frontend: `npm test` — 544 passed, 0 failed.
- Content: `npm test` — 143 passed, 0 failed.
- Backend: `npm run ci` — lint, strict typecheck, Drizzle schema check, 9
  tests, deterministic OpenAPI check and production build passed.
- Frontend/backend client consistency check passed for all 6 versioned API
  paths.
- Diff whitespace checks passed in all three repositories.
- `npm audit --omit=dev` could not reach the npm audit endpoint because the
  execution environment could not resolve `registry.npmjs.org`; dependency
  advisory status remains an external verification item.

## Remaining external action

One explicit user approval is required to create the public repository
`lukaszkurczab/patternly-backend` and publish the prepared `main` commit. After
that, the feature branches for the frontend and content changes also need to
be pushed, followed by remote SHA verification. No provider provisioning was
attempted: Firebase, RevenueCat, Cloud SQL, Secret Manager and Cloud Run
credentials are intentionally not present locally.
