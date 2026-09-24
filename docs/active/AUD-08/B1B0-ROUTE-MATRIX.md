# AUD-08 B1b0 — OpenAPI route to backend-store matrix

**Status:** read-only execution inventory; no runtime changes.  
**Backend source:** repository `patternly-backend`, branch `main`, commit `05facbd03e9d5d019ab39004f27fcf1178b6e305` (`feat: prepare authorization generation session exchange`).  
**Inventory check:** 57 OpenAPI operations at this source revision; the table below contains 57 rows, one per exact method and OpenAPI path.

## Reading the matrix

`Profile` is the operation's `x-patternly-security-profile` from `src/api/openapi.ts`. `Store effect` names the backend store and whether the handler reads (`R`) or writes (`W`) through it. `—` means the handler does not call a backend store. The request middleware effects are described below so they are not mistaken for handler work.

Bearer routes (`bearer`, `app_check_bearer`, and `app_check_optional_bearer` when an Authorization header is supplied) run `authenticateRequest`: `users.resolveExistingUser` reads the identity mapping, deleted-identity tombstones, and active user document before the handler. The optional profile without a bearer does not do this. A malformed or invalid supplied bearer fails authentication; it is not treated as guest access. `app_check_verify_only_bearer` verifies Firebase identity and App Check but does not run account resolution middleware. `app_check_only` verifies App Check only. `admin` verifies Firebase identity and configured verified administrator email, uses a derived admin actor ID, and does not resolve an account. `webhook` uses RevenueCat authorization; `public` has no authentication guard.

The table describes actual calls from `src/api/app.ts` and the called store implementations, not a proposed authorization policy. `R/W` includes reads required to decide or construct a write. External Firebase Auth, RevenueCat, email, and local content-package operations are called out where relevant; they are not Firestore stores.

## Exact operation mapping

| Method and OpenAPI path | Profile | Handler store effect and material side effects |
| --- | --- | --- |
| `GET /health` | `public` | — |
| `GET /ready` | `public` | —; calls `firestore.ping()` when configured (infrastructure readiness check, not a domain store read). |
| `GET /openapi.json` | `public` | —; returns the in-memory OpenAPI document. |
| `POST /v1/webhooks/revenuecat` | `webhook` | `revenueCatWebhook` R/W for event idempotency, account/entitlement projection, and receipt claim; subsequent `markReceiptDelivery` writes receipt status. May send email; no user bearer/account-resolution middleware. |
| `POST /v1/account/registration` | `app_check_verify_only_bearer` | `users` R/W: register/resolve identity and user, and create immutable registration acceptance atomically. |
| `POST /v1/account/session/exchange` | `app_check_verify_only_bearer` | `users` R: pin active account authorization generation; `firebaseAuth` issues a custom token (external auth operation, not a Firestore store). |
| `GET /v1/me` | `app_check_bearer` | `users` R: profile and identity projection. |
| `POST /v1/legal-acceptances` | `app_check_bearer` | `users` R/W: account check and immutable legal acceptance. |
| `POST /v1/purchase-confirmations` | `app_check_bearer` | `users` R/W: account/legal-state checks and immutable purchase confirmation/attempt. |
| `GET /v1/entitlements` | `app_check_bearer` | —; reads the configured RevenueCat entitlement provider directly, not `entitlements` store. |
| `GET /v1/progress` | `app_check_bearer` | `progress` R: account snapshot, sync metadata, and progress records used to form the response. |
| `GET /v1/account-data/export` | `app_check_bearer` | `dataExport` R/W: claims per-account rate limit and creates/updates export audit status, then reads export source collections and export history. Rate-limit and audit writes are nested effects of this read route; it returns a serialized attachment. |
| `POST /v1/privacy-requests` | `app_check_bearer` | `privacyRequests` R/W: create the account request and audit event. |
| `GET /v1/privacy-requests` | `app_check_bearer` | `privacyRequests` R: list the account's request metadata. |
| `GET /v1/privacy-requests/{requestId}` | `app_check_bearer` | `privacyRequests` R/W: read the account-owned response and append a response-read audit when available. |
| `POST /v1/guest/privacy-requests` | `app_check_only` | `privacyRequests` R/W: consume public rate limits; create guest request, verification state, and audit events; may send email. |
| `POST /v1/guest/privacy-requests/verify` | `app_check_only` | `privacyRequests` R/W: consume verification rate limit and exchange one-use code for scoped session. |
| `POST /v1/guest/privacy-requests/{requestId}/resend` | `app_check_only` | `privacyRequests` R/W: rate-limit and rotate/send guest verification code. |
| `POST /v1/guest/privacy-requests/{requestId}/response` | `app_check_only` | `privacyRequests` R/W: validate scoped session, read response, and append response-read audit. |
| `POST /v1/legal-requests` | `app_check_bearer` | `legalRequests` R/W: create authenticated consumer case, durable receipt/audit state; may send email. |
| `GET /v1/legal-requests` | `app_check_bearer` | `legalRequests` R: list the authenticated account's cases. |
| `GET /v1/legal-requests/{requestId}` | `app_check_bearer` | `legalRequests` R: read an account-owned case. |
| `POST /v1/public/legal-requests` | `app_check_optional_bearer` | `legalRequests` R/W: create case with nullable account linkage; public path rate-limits and records durable receipt/audit state; may send email. Bearer resolution read runs only if a bearer is supplied. |
| `POST /v1/progress/sync` | `app_check_bearer` | `progress` R/W: validate account/sync metadata, apply mutations, and update records, revision, and journals. |
| `POST /v1/account-data/adoption/preview` | `app_check_bearer` | `progress` R: read account snapshot and compare it with submitted guest snapshot; does not write learning records. |
| `POST /v1/account-data/adoption/confirm` | `app_check_bearer` | `progress` R/W: verify exact preview/resolutions and idempotency, then write adoption mutations and account revision. |
| `POST /v1/account-data/adoption/transfer/start` | `bearer` | `progress` R/W: read account/device state and create or replay transfer session staging. |
| `POST /v1/account-data/adoption/transfer/{sessionId}/upload` | `bearer` | `progress` R/W: read transfer/session state and write chunk metadata plus staged records; staged transfer writes are separate from final account progress. |
| `POST /v1/account-data/adoption/transfer/{sessionId}/seal` | `bearer` | `progress` R/W: read session/chunks and persist sealed state/digest. |
| `POST /v1/account-data/adoption/transfer/{sessionId}/preview` | `bearer` | `progress` R/W: read account and staged snapshot, build resumable preview, and persist preview state/cursor. |
| `POST /v1/account-data/adoption/transfer/{sessionId}/confirm` | `bearer` | `progress` R/W: read preview/session, validate decision and resolutions, then persist immutable confirmation fingerprint/state. |
| `POST /v1/account-data/adoption/transfer/{sessionId}/apply` | `bearer` | `progress` R/W: read confirmed session/account state; write progress into an invisible generation in bounded apply batches and atomically promote the active generation/final session state. |
| `GET /v1/account-data/adoption/transfer/{sessionId}/status` | `bearer` | `progress` R: read transfer status and device/session ownership. |
| `POST /v1/account/recovery-codes` | `app_check_bearer` | `accountLifecycle` R/W: account check and replacement of one-time recovery-code records. |
| `POST /v1/public/recovery-codes/consume` | `app_check_only` | `accountLifecycle` R/W: validate and consume recovery code, update recovery/session state; `firebaseAuth` revokes sessions/issues custom token as part of recovery flow. No account bearer is required. |
| `POST /v1/account/session/revoke` | `app_check_bearer` | `accountLifecycle` R/W: check account and persist idempotent revocation operation state; invokes Firebase Auth session revocation. Does not update account state. |
| `POST /v1/account/deletion` | `app_check_bearer` | `accountLifecycle` R/W: stage/perform deletion and persist completion/proof; `contentReports` W: unlink account from reports; invokes Firebase Auth deletion/revocation within lifecycle flow. |
| `GET /v1/public/deletion-proofs/{proofId}` | `app_check_only` | `accountLifecycle` R/W: read opaque deletion proof; expired or malformed proof may be deleted as cleanup. |
| `POST /v1/public/deletion-operations/status` | `app_check_only` | `accountLifecycle` R/W: resume/read deletion operation status and persist any completed transition. |
| `GET /v1/tracks` | `app_check_bearer` | `tracks` R: read account track access. |
| `GET /v1/content/versions` | `app_check_bearer` | `content` R: read current immutable content-version metadata. |
| `POST /v1/content/reports` | `app_check_optional_bearer` | `contentReports` R/W: deduplicate submission, apply anonymous rate limit, and create/link report when requested. Optional bearer resolution runs only when supplied. |
| `GET /v1/admin/content-reports` | `admin` | `contentReports` R: read triage queue. |
| `GET /v1/admin/privacy-requests` | `admin` | `privacyRequests` R: read minimal admin queue. |
| `GET /v1/admin/privacy-requests/{requestId}` | `admin` | `privacyRequests` R/W: read case details and append operator-details-read audit in a transaction. |
| `PATCH /v1/admin/privacy-requests/{requestId}` | `admin` | `privacyRequests` R/W for transition, audit, and delivery state. For `execute_export`, also `dataExport` R/W (export audit/rate limit and source reads), then `privacyRequests` W for the prepared executed response and audit. |
| `GET /v1/admin/legal-requests` | `admin` | `legalRequests` R: read minimal case queue. |
| `GET /v1/admin/legal-requests/{requestId}` | `admin` | `legalRequests` R/W: read case details and append operator-details-read audit. |
| `PATCH /v1/admin/legal-requests/{requestId}` | `admin` | `legalRequests` R/W: revision-guarded transition, audit, and delivery state; may send email. |
| `POST /v1/admin/security-incidents` | `admin` | `securityIncidents` R/W: create incident and audit; handler then reads details, which appends a details-read audit. |
| `GET /v1/admin/security-incidents` | `admin` | `securityIncidents` R/W: list incident queue and materialize due reminder documents when needed. |
| `GET /v1/admin/security-incidents/{incidentId}` | `admin` | `securityIncidents` R/W: materialize due reminders, read incident/detail projections and append details-read audit. |
| `PATCH /v1/admin/security-incidents/{incidentId}` | `admin` | `securityIncidents` R/W: read and revision-guard incident/action state, append audit; may stage and deliver notifications/email. Handler returns by reading details, which also appends details-read audit. |
| `GET /v1/admin/security-incidents/{incidentId}/authority-exports/{version}` | `admin` | `securityIncidents` R/W: read the requested authority export and append authority-export-read audit. |
| `GET /v1/admin/overview` | `admin` | `admin` R: aggregate Firestore counts/current versions and read the published local question catalog (cached in process); no store writes. |
| `GET /v1/admin/questions` | `admin` | `admin` R: read/search the published local question catalog (cached in process); no Firestore store read or write. |
| `PATCH /v1/admin/content-reports/{clientSubmissionId}` | `admin` | `contentReports` R/W: read report/status and apply admin transition. |

## Evidence and scope limits

- Operation catalogue and profiles: `src/api/openapi.ts`; runtime route-to-OpenAPI matching and normalized paths: `src/api/app.ts` plus `src/api/route-contract.ts`.
- Handler registrations and store dispatch: `src/api/app.ts`.
- Store availability/names: `src/infrastructure/firestore/stores.ts`; detailed effects are implemented under `src/modules/*/store.ts` and `src/modules/billing/revenuecatWebhookStore.ts`.
- The inventory is pinned to backend `main` at the commit above. It does not assert behavior of a deployed backend or client, and it does not make authorization-generation enforcement recommendations. This records current reads/writes only; it does not claim every write is atomic with a session-generation check.
