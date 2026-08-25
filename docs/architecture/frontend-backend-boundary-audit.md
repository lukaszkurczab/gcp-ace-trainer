# Frontend/backend boundary audit

> **Historical architecture evidence, reconciled 2026-08-25:** this audit
> preserves the 2026-08-21 cutover findings. `launch-completion-plan.md` owns
> the current implementation order and records later source changes.

Date: 2026-08-21

## Decision

The current application repository remains the React Native/Expo frontend
repository. The backend is a separate `patternly-backend` repository with
Fastify, PostgreSQL, Drizzle ORM, Firebase identity verification, REST and
OpenAPI. `patternly-content` remains the authoring and immutable publishing
repository.

The learning runtime is not moved to the backend. The frontend owns local
practice execution and submits explicit progress mutations when an account
sync operation is requested.

## Classification

| Current module or path | Current responsibility | Target | Migration plan | Dependencies | Risk | Compatibility bridge |
|---|---|---|---|---|---|---|
| `src/application/trainingLifecycle/**` | Local session lifecycle, timer and recovery | FE_ONLY | Keep canonical and offline-first | Local storage and content runtime | High if moved remotely; session interruption/data loss | No |
| `src/application/learningMutations/**` | Local journal, materialization and verification of learning mutations | FE_ONLY | Keep canonical; expose sync projection separately | `src/storage/repositories/**` | High | No |
| `src/storage/**` | MMKV-backed local records, drafts, attempts and review queue | FE_ONLY | Keep local state and device-only fields local | MMKV, domain codecs | High | No |
| `src/infrastructure/content/**` | Bundled and immutable package resolution/integrity checks | FE_ONLY + SHARED_CONTRACT | Keep runtime resolver in FE; consume release lock and content package metadata | `patternly-content`, release lock | Medium | No |
| `src/features/**`, navigation and `App.tsx` | UI, navigation and interaction state | FE_ONLY | Keep in app repository | Local application state | Medium | No |
| `src/infrastructure/clients/PatternlyApiClientAdapter.ts` | REST transport DTOs and auth-token injection | SHARED_CONTRACT | Keep synchronized with backend OpenAPI; CI verifies every versioned endpoint is represented | Backend OpenAPI | High if duplicated or allowed to drift | No |
| `src/infrastructure/clients/publicEnvironment.ts` | Closed public API/origin configuration | SHARED_CONTRACT | Keep FE validation; backend validates private environment separately | Runtime configuration | High for wrong environment | No |
| `server/src/authentication.ts` | Firebase token verification and request auth | BE_ONLY | Replaced by `patternly-backend/src/infrastructure/firebase/**` and auth request boundary | Firebase Admin SDK | High | No |
| `server/src/accountService.ts` | Firestore account dataset, snapshots, adoption and sync | OBSOLETE | Remove from FE repository; canonical backend uses PostgreSQL progress mutations and versioned rows | PostgreSQL/Drizzle | High during cutover | No |
| `server/src/firebaseAdapters.ts` | Firestore account store and Firebase deletion adapter | OBSOLETE / NEEDS_SPLIT | Remove Firestore account authority; retain only provider boundary concepts in backend | Firebase Auth, PostgreSQL | High | No |
| `server/src/deletion.ts`, `accountLifecycle.ts` | Server-side deletion semantics | BE_ONLY | Port to backend account lifecycle module before production deletion is enabled | PostgreSQL and Firebase Auth | High | No |
| `patternly-backend/src/modules/users/**` | Canonical user and identity mapping | BE_ONLY | PostgreSQL-backed user/identity store | Drizzle schema | High | No |
| `patternly-backend/src/modules/progress/**` | Canonical versioned progress and idempotent mutation batch | BE_ONLY | Use `/v1/progress` and `/v1/progress/sync` | PostgreSQL transactions | High | No |
| `patternly-backend/src/modules/entitlements/**` | Server entitlement projection | BE_ONLY | Read projection; RevenueCat reconciliation remains explicit boundary | RevenueCat provider | High | No |
| `patternly-backend/src/modules/content/**` | Current immutable content-version metadata | BE_ONLY | Store metadata only; packages remain content-published artifacts | Content release lock | Medium | No |
| `patternly-content/manual/**`, `scripts/publishing/**` | Authoring, review, validation and immutable publishing | CONTENT_PUBLISHING | Keep separate; never use as runtime API | Git and release artifacts | High | No |
| `integration/contracts/content-release/**` | FE/content immutable release contract | SHARED_CONTRACT | Keep lock and explicit content-root tooling | Content SHA and package checksums | High | No |
| `tests/server*.test.ts` | Tests for old Firestore server | OBSOLETE | Replace with backend PostgreSQL/domain/API tests; remove FE copies | Backend test suite | Medium | No |
| Old `server/Dockerfile`, `server/cloudbuild.yaml` | Deployment files for old in-repo server | OBSOLETE | Backend owns Cloud Run build and deployment contract | Cloud Build/Cloud Run | High | No |

## Boundary rules

- The frontend may enqueue and replay local domain mutations while offline.
- The backend deduplicates each mutation by `(user_id, mutation_id)` and
  rejects stale per-record versions; it never performs last-write-wins JSON
  replacement.
- Active sessions, drafts, current position, timer and the local mutation
  journal remain device-only.
- Firebase Authentication is an identity broker. PostgreSQL owns the
  canonical user and identity records.
- RevenueCat is a billing provider boundary. Backend entitlements are the
  authorization projection; a device cache is not authority.
- Content is consumed through immutable packages and release metadata. The
  app does not import the content repository as a runtime service.

## Compatibility bridge decision

No compatibility bridge is retained for the old `/v1/account/*` Firestore
contract. It was not used by the current app runtime, and retaining it would
create two canonical persistence models. The replacement API is explicit and
versioned under `/v1`.

## Verification status

- Backend foundation: implemented locally and verified by lint, strict
  typecheck, seven API/domain tests, deterministic OpenAPI check and build.
- Frontend generated client: implemented and verified by strict typecheck,
  client tests and runtime privacy boundary test.
- Guest-to-account merge: explicit preview/confirmation contract is defined in
  the backend; execution remains gated on a future product flow and is not
  silently inferred from conflicting records.
- Content cross-repo assumption cleanup: complete; runtime admission now names
  the frontend checkout explicitly and has no artificial backend dependency.
- Old server removal and full application regression: complete; the old
  Firestore server, deployment files and server-only tests were removed from
  the frontend repository.

## Subsequent source reconciliation — 2026-08-25

- `patternly-backend` now contains a PostgreSQL-backed `content_reports` table,
  `/v1/content/reports`, and an administrator-only report list. Its test suite
  verifies validation, retry deduplication and the server-side administrator
  boundary.
- This is not report-feature completion: the active product contract requires
  account-unlinked reporting by default, explicit link consent, offline
  delivery states, retention/de-identification and audit controls. The current
  implementation instead requires an account and stores `user_id`; the active
  plan treats that contradiction as a repair task.
- Backend source uses PostgreSQL/Drizzle for user, progress, entitlement and
  report records. Several narrative and contract references still name
  Firestore/PITR. They require an explicit canonical storage decision and
  synchronized contract/parser/test update; this historical audit does not
  silently resolve it.
