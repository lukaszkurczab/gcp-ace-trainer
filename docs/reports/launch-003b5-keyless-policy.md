# Launch 3B-5 — keyless identity, secret and environment policy

**Date:** 2026-08-01
**Packet status:** complete as a documentation/configuration contract; no cloud or
application implementation is claimed
**Applies to:** the first real Task 3A API deployment in `sandbox` and
`production`

## 1. Outcome and boundary

This report defines the smallest deployable security boundary for the first
production-shaped Patternly API. It deliberately creates no service account,
role binding, secret, Firebase app, container repository or Cloud Run service,
and it does not enable an API or select an unresolved provider/domain.

The canonical path is:

1. an approved human or CI principal obtains short-lived credentials by
   impersonating the environment's one deployment service account;
2. that deployment identity deploys exactly `patternly-api` and attaches the
   environment's one runtime service account;
3. Cloud Run supplies runtime credentials only through its attached service
   identity and the provider metadata service;
4. the mobile client invokes the public HTTPS service with a Firebase ID token;
5. application authorization verifies the Firebase JWT locally before any
   protected application logic, derives the account UID only from the verified
   token, and performs the remote revocation check before account, security and
   destructive operations.

There is no JSON service-account key, `GOOGLE_APPLICATION_CREDENTIALS`, default
credential file, alternate deploy identity, direct mobile Firestore path, hidden
localhost/default URL, or unauthenticated account fallback in this contract.

## 2. Confirmed repository and environment facts

| Fact checked on 2026-08-01 | Evidence/status |
|---|---|
| The repository contains an Expo application but no Firebase client/Admin SDK, Google Cloud client library, server/backend entry point, Dockerfile, Cloud Run manifest, deploy pipeline, application environment file or `EXPO_PUBLIC_*` use. | Confirmed by package/config and reachability searches. Implementation remains **planned** for Task 3A. |
| `firebase.json` deploys only the deny-all Firestore rules; client reads and writes are denied. | Confirmed. This remains the canonical client boundary. |
| Existing environment references are limited to active Maestro/release-evidence tooling such as `PATTERNLY_DEV_CLIENT_URL`, `MAESTRO_TEST_OUTPUT_DIR` and Android/tool variables. | Confirmed; these are test-tool inputs, not an application credential or runtime configuration path. |
| `patternly-app-sandbox` is billed with the approved 5 PLN controls; `patternly-app-production` is unbilled. | Confirmed by the closed 3B-4 evidence packet. |
| Cloud Run, Secret Manager, IAM Credentials, Artifact Registry, Cloud Build and Billing Budgets APIs remain disabled in both projects. | Confirmed by the closed 3B-4 evidence packet. No enablement is performed here. |
| Both projects have the Firestore/Auth foundation, zero Firebase apps and users, and no user-managed service-account key or service-account Owner/Editor grant. | Confirmed by the closed 3B packets. |
| Canonical account data is local-first, synchronizes only through the authenticated API, and server ownership is bound to the UID from a verified Firebase ID token. | Confirmed by the architecture, storage, privacy, data-model and account-data contracts. |

### Reachability and deletion check

Targeted searches covered runtime/deploy entry points, Firebase and Google Cloud
SDKs, credentials, environment variables, token verification/revocation,
service-account keys, Cloud Run, Secret Manager, duplicate routes and direct
Firestore access. There is no existing backend, credential or mobile environment
implementation to replace or delete. The active test-tool environment variables
remain reachable from their evidence scripts and are outside this application's
configuration path. Therefore this slice adds no compatibility branch and
deletes no code. Task 3A must introduce one canonical path rather than preserve
or wrap a competing path.

## 3. Stable resource names

The same logical names are used in each isolated project; the project ID makes
the identities distinct.

| Resource | Sandbox | Production |
|---|---|---|
| GCP project | `patternly-app-sandbox` | `patternly-app-production` |
| Region | `europe-central2` | `europe-central2` |
| Cloud Run service | `patternly-api` | `patternly-api` |
| Artifact Registry repository | `patternly-api` | `patternly-api` |
| Deployment service account | `patternly-deployer@patternly-app-sandbox.iam.gserviceaccount.com` | `patternly-deployer@patternly-app-production.iam.gserviceaccount.com` |
| Runtime service account | `patternly-runtime@patternly-app-sandbox.iam.gserviceaccount.com` | `patternly-runtime@patternly-app-production.iam.gserviceaccount.com` |
| Manual-build service account | `patternly-builder@patternly-app-sandbox.iam.gserviceaccount.com` | `patternly-builder@patternly-app-production.iam.gserviceaccount.com` |
| Scheduler OIDC service account | `patternly-scheduler@patternly-app-sandbox.iam.gserviceaccount.com` | `patternly-scheduler@patternly-app-production.iam.gserviceaccount.com` |
| Runtime Firebase Auth custom role | `projects/patternly-app-sandbox/roles/PatternlyRuntimeFirebaseAuth` | `projects/patternly-app-production/roles/PatternlyRuntimeFirebaseAuth` |

The original 3B-5 preflight concluded that two user-managed service accounts
would be sufficient. Task 3A's concrete 30-day proof-cleanup design supplied
new reachability evidence: using the runtime identity as the Cloud Scheduler
OIDC subject would unnecessarily expose an identity that also has Firestore and
privileged Firebase Auth permissions. `PO-031` later replaced failed local
Podman with manual Cloud Build; executing the Dockerfile as the deployer would
give build code its Run and service-account attachment privileges. The current
canonical boundary therefore uses exactly four user-managed accounts per
environment: deployer, runtime, no-role-at-rest manual builder and OIDC-only
Scheduler identity. They remain distinct. The Scheduler receives no
data/Auth/Run role, the builder receives only temporary source-read/log-write/
repository-write grants, and no Compute Engine default or legacy Cloud Build
service account may be used. This documentation has created zero service
accounts; the build identity remains subject to the Ninth Task 3A replacement
packet, independent QA and exact owner authorization.

## 4. Identity, role and edge matrix

All grants are duplicated independently in the matching project. No cross-
environment impersonation, `actAs`, secret access or data access is permitted.

| Principal / edge | Role or mechanism | Exact resource scope | Necessity and constraint |
|---|---|---|---|
| Owner-approved source principal → deployment SA | `roles/iam.serviceAccountTokenCreator` | The exact environment deployment service account only | Permits short-lived impersonation. The approved principal is an unresolved owner input; it receives no project-wide Token Creator grant. |
| Deployment SA | `roles/run.admin` | Project during the first creation only; after creation, replace with a grant on the exact `europe-central2/patternly-api` service | First create/update and disabling the Invoker IAM check require `run.services.create`, `run.services.update` and `run.services.setIamPolicy`, all included in Cloud Run Admin. The bootstrap project grant is broad and must not remain as convenience access. If exact-service scope cannot support subsequent update/policy operations, stop for owner/security acceptance of the project-scoped role. Re-creation after deletion is an owner-controlled bootstrap operation. |
| Deployment SA → runtime SA | `roles/iam.serviceAccountUser` (`iam.serviceAccounts.actAs`) | The exact environment runtime service account only | Allows the deployer to attach the runtime identity to the service; it grants no impersonation or access to the other environment. |
| Deployment SA → manual-build SA | `roles/iam.serviceAccountUser` (`iam.serviceAccounts.actAs`) | The exact environment builder identity only, during one owner-gated build | Allows one manual submit with the user-specified builder. Remove after build evidence; it grants no access to runtime or Scheduler identities. |
| Deployment SA → Scheduler OIDC SA | `roles/iam.serviceAccountUser` (`iam.serviceAccounts.actAs`) | The exact environment Scheduler identity only | Allows the deployer to configure that identity as the one Scheduler job's OIDC subject. It does not grant the Scheduler identity any project, data or service role. |
| Deployment SA | `roles/cloudscheduler.admin` | Project during creation and the first forced-run proof only | Creates exactly one HTTP job and proves its effective configuration. Remove this grant and the Scheduler-identity `actAs` edge immediately afterward; any later job mutation is a new owner-gated bootstrap. |
| Scheduler OIDC SA | Google-signed OIDC subject checked by the application | Only `POST /internal/deletion-proof-cleanup` with the exact Cloud Run origin as audience | Has no IAM role. The shared Cloud Run transport has its Invoker check disabled for the mobile API, so the cleanup route independently verifies Google JWKS signature, issuer `https://accounts.google.com`, expiry, audience, `email_verified=true`, exact Scheduler email and its provider-returned immutable numeric unique ID in `sub`; it rejects a recreated same-name identity and the token on every user/account route. |
| Deployment SA | `roles/cloudbuild.builds.editor` and `roles/serviceusage.serviceUsageConsumer` | The exact environment project, during one owner-gated build | Submits and observes one manual build through the explicit builder. Remove after build evidence; there is no trigger, retry or persistent build permission. |
| Deployment SA | `roles/storage.admin`, then `roles/storage.objectAdmin` | Project only for exact source-bucket creation, then only that bucket for upload/cleanup | Remove project Storage Admin before build and bucket Object Admin after deleting the exact staged object. No arbitrary provider-managed source bucket is accepted. |
| Deployment SA | `roles/artifactregistry.reader` | The exact `europe-central2/patternly-api` repository through digest verification/deployment | Reads the resolved digest for deployment; it does not push image content. Remove when the one build/deploy proof completes. |
| Deployment SA | Custom role `projects/<ENVIRONMENT_PROJECT_ID>/roles/PatternlyArtifactCleanupPolicyAdmin` | The exact `europe-central2/patternly-api` repository, only after successful digest deploy and through exact policy readback | Contains exactly `artifactregistry.repositories.update` and `artifactregistry.versions.delete`, the documented cleanup-policy permissions. Remove the repository binding immediately after readback; the unbound role definition grants nothing. No project Artifact Registry Admin or Data Access log viewer is used. |
| Manual-build SA | `roles/storage.objectViewer` | The exact private regional source bucket, during one build | Reads only the allowlisted submitted source object. |
| Manual-build SA | `roles/artifactregistry.writer` | The exact `europe-central2/patternly-api` repository, during one build | Pushes the one build-ID-tagged image whose digest is resolved before deployment. |
| Manual-build SA | `roles/logging.logWriter` | The exact environment project, during one build | Writes only to Cloud Logging under `CLOUD_LOGGING_ONLY`; no logs bucket is created. |
| Runtime SA | `roles/datastore.user` | The exact environment project | Required for server-side Firestore document/transaction access. Firestore IAM cannot express the per-account document ownership model; this role is therefore broad across project database data and the application must enforce verified-token UID ownership before access. |
| Runtime SA | Custom role `projects/<ENVIRONMENT_PROJECT_ID>/roles/PatternlyRuntimeFirebaseAuth` | The exact environment project; a separate role definition and binding in each project | Contains exactly `firebaseauth.users.get` for remote revocation/user-state checks, `firebaseauth.users.update` for revoking refresh tokens, and `firebaseauth.users.delete` for canonical remote-identity deletion. It grants no configuration, secret/hash, user-create, session-create or email-sending permission. Any added permission requires a real Task 3A call-graph need and separate security review. |
| Runtime SA | `roles/secretmanager.secretAccessor` | Each exact secret resource used by the service, separately | Allows access only to declared secret versions. There is no project-wide Secret Accessor grant. The current secret inventory is empty because the email/public-link provider is unresolved. |

No user-managed identity receives `roles/owner`, `roles/editor`, project-wide
`roles/iam.serviceAccountUser`, project-wide Token Creator, project-wide Secret
Accessor, Service Usage Admin or a service-account key. API enablement, initial
identity/repository creation and IAM bootstrap remain separately authorized
owner/controller operations. Manual Cloud Build is the only selected image
path under `PO-031`; its temporary identity/roles, exact source bucket and
one-build cost boundary require the separate Ninth Task 3A packet, repeated QA
and enumerated authorization. Triggers, source deploy and default build
identities remain outside this path.

## 5. Keyless credential flow

### Deployment

The approved source principal authenticates through its normal Google identity
and uses explicit `gcloud --impersonate-service-account` flags for the exact
deployment SA on every command. No user, developer or local ADC file is created
or accepted. All access tokens are short-lived. Neither local development nor
CI may download, upload, commit or mount a service-account JSON key.

The deployment must explicitly select the project, region, service, runtime SA
and digest-pinned image. It must fail before mutation if the active project,
impersonated service-account email or image project differs from the selected
environment.

### Runtime

Cloud Run is configured with the exact environment runtime SA. Google client
libraries obtain only that attached workload identity from the Cloud Run
metadata service; this is not a user-created ADC file or developer credential.
The container has no credential file and must fail if code attempts to require
`GOOGLE_APPLICATION_CREDENTIALS`. Local server tests use the declared Firebase
emulators, while real sandbox conformance calls the deployed Patternly API;
neither path accepts developer ADC or adds a production fallback.

## 6. Secret Manager policy

The current secret set is deliberately empty. Firebase web configuration and
the API URL are public identifiers/configuration, not secrets. No email sender,
public-link or signing secret may be named until its provider and ownership are
approved.

When Task 3A has a real secret requirement, all of these conditions apply:

- the value exists only in Secret Manager and is never committed, copied into an
  Expo variable, ordinary Cloud Run variable, build argument or evidence log;
- the runtime SA receives Secret Accessor on that one secret resource;
- Cloud Run environment injection references an explicit numeric version, never
  `latest`; a revision change is required to rotate the pinned version;
- deployment evidence records only project, secret resource name and numeric
  version, never the value;
- a missing/inaccessible version prevents the revision from becoming usable;
- removing a secret also removes its Cloud Run reference and per-secret IAM
  binding. No stale access remains.

## 7. Mobile non-secret environment schema

Expo inlines `EXPO_PUBLIC_*` values into the application bundle. They are public
configuration and must never carry credentials or private keys.

| Variable | Sandbox requirement | Production requirement | Validation |
|---|---|---|---|
| `EXPO_PUBLIC_PATTERNLY_ENVIRONMENT` | `sandbox` | `production` | Exact enum; no default. |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `patternly-app-sandbox` | `patternly-app-production` | Exact environment mapping. |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `<SANDBOX_FIREBASE_WEB_API_KEY>` | `<PRODUCTION_FIREBASE_WEB_API_KEY>` | Required non-secret Firebase identifier from the environment's registered app; distinct and restricted to the matching app/API surface. Placeholder text is documentation only and may not enter a build. |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `<SANDBOX_FIREBASE_APP_ID>` | `<PRODUCTION_FIREBASE_APP_ID>` | Required from the matching registered Firebase app; no cross-environment value. |
| `EXPO_PUBLIC_PATTERNLY_API_BASE_URL` | `<SANDBOX_CLOUD_RUN_HTTPS_ORIGIN>` | `<PRODUCTION_CLOUD_RUN_HTTPS_ORIGIN>` | Required exact allowlisted HTTPS origin; no path ambiguity, userinfo, query or fragment. |

The API key, app ID and API origins are unresolved because Firebase apps and the
Cloud Run services do not yet exist. Creating those resources is a Task 3A cloud
operation, not permission to substitute sample values.

Build-time and startup validation must fail closed when any value is absent,
blank, still shaped like a placeholder, malformed or inconsistent. It must also
reject HTTP, localhost, loopback/private development origins in release builds,
an unapproved custom domain, sandbox values in production, production values in
sandbox, and any Firebase project not exactly mapped above. There is no default
project, inferred environment, fallback URL or automatic switch to the other
environment. Expo access uses static dot notation so the intended values are
actually inlined.

## 8. Invocation and application authentication

`patternly-api` is an HTTPS Cloud Run service reachable by end-user mobile
clients. On that exact service, deployment disables the Cloud Run Invoker IAM
check (`--no-invoker-iam-check`), which Google documents as the recommended
public model. It does **not** also grant `roles/run.invoker` to `allUsers`; two
public-access mechanisms would create duplicate policy paths.

Public transport does not mean anonymous account access. Before any protected
route performs application logic, storage access or side effect, the server:

1. requires exactly one Firebase ID token in `Authorization: Bearer <token>`;
2. rejects a missing or malformed header without examining caller-selected
   account data;
3. locally verifies signature, issuer, audience/project and expiry against the
   matching Firebase project;
4. performs the remote `checkRevoked`/user-state check before account,
   security-sensitive and destructive operations;
5. requires the canonical verified-email/account state;
6. derives the account identifier only from verified `uid`/`sub`;
7. rejects any supplied path/body/query UID that is present and differs from the
   verified UID before business logic; and
8. applies a recent-authentication (`auth_time`) policy as well as the remote
   revocation check before sensitive account deletion/session-revocation work.

Ordinary sync relies on the local JWT checks and therefore has at most the
approximately one-hour remaining lifetime of an already issued Firebase ID
token as its revocation visibility window. After that token expires, Firebase
must issue a replacement; refresh fails once the user's refresh tokens have
been revoked. Task 3A must not claim immediate revocation for ordinary sync or
silently extend an expired token.

Firebase refresh tokens remain confined to the Firebase token endpoint over TLS
and are never accepted by the Patternly API. Logs and errors never contain ID or
refresh tokens.

Canonical recovery and public deletion-link flows, where possession of a
single-use bounded token is the explicit authorization mechanism, require their
own non-enumerating route contract in Task 3. They do not create an anonymous
account API or bypass the protected-route rules above.

If organization policy prevents disabling the Invoker IAM check, implementation
stops. The owner must choose and authorize a gateway/IAP-compatible mobile
invocation design; Task 3A must not silently add `allUsers`, a second endpoint,
an API key as authorization, or a provider-specific fallback.

### Required negative request evidence

Task 3A must automate these cases and prove that no protected application logic
or storage access occurs before rejection:

| Case | Required result |
|---|---|
| No `Authorization` header, empty Bearer value, multiple credentials or malformed JWT | `401`, bounded non-enumerating error; no fallback identity. |
| Bad signature, issuer, audience or token from the other Patternly environment | `401`; no Firestore/Auth call for the requested account. |
| Expired token | `401`; refresh occurs only through Firebase, not the Patternly API. |
| Revoked token on an account, security-sensitive or destructive request | `401`; the remote revocation/user-state check rejects it before protected route logic or side effects. |
| Valid token with unverified email or disallowed account state | `403`, bounded code; no sync/account mutation. |
| Valid token plus a different caller-selected UID/account ID | `403`, bounded mismatch code; no target-account lookup or mutation. |
| Sensitive request with stale `auth_time` | bounded reauthentication-required response; no deletion/revocation side effect. |
| Missing/mismatched mobile environment value | build/startup failure; no localhost, default project or cross-environment retry. |
| Missing/inaccessible pinned secret version | revision/startup failure; no ordinary-variable or previous-value fallback. |

Exact public error codes and routes remain Task 3 implementation details, but
they must conform to the canonical non-enumerating error envelope.

## 9. Acceptance evaluation

| 3B-5 criterion | Result |
|---|---|
| Exactly one deployer, runtime, no-role-at-rest manual builder and OIDC-only Scheduler identity per environment | **Reconciled by Task 3A evidence and `PO-031`** with stable exact names; not yet instantiated and still owner/QA-gated. |
| No Owner/Editor, downloaded key or `GOOGLE_APPLICATION_CREDENTIALS` | **Met by contract** and current evidence. |
| Every role and `actAs`/impersonation edge has necessity and scope | **Met by contract**; Firebase Auth is reduced to a three-permission per-project custom role, while the bootstrap Cloud Run role remains an explicit narrowing/acceptance risk. |
| Secrets only through Secret Manager, per-secret IAM and numeric pinned versions | **Met by contract**; current inventory is correctly empty. |
| Minimal mobile non-secret values and fail-closed API URL/environment validation | **Met by contract**; exact app-derived values remain blocked on real registrations/deployment. |
| Public HTTPS invocation remains compatible with strict Firebase token, UID and revocation enforcement | **Met by contract** using local JWT validation for every protected request and remote revocation checks before account, security and destructive operations. |
| Unresolved provider/domain values remain owner inputs | **Met**; no value or secret was invented. |
| Repository reachability/dead-code evidence and no duplicate path | **Met for this documentation slice**; no implementation path exists yet. |
| Contract gate, diff/whitespace checks and independent QA | **Pass for the current policy boundary:** original 3B-5 passed, and the later Scheduler-identity reconciliation was included in the full Task 3A repeated preflight review that returned exact `pass`. No identity has yet been instantiated. |

## 10. Owner inputs, security stops and Task 3A handoff

The policy is implementable only after these explicit inputs/authorizations:

1. exact approved human or CI source principal for each environment's deployer
   impersonation;
2. authorization of the Task 3A evidence-driven correction from two to four
   user-managed identities by adding the no-role `patternly-scheduler` OIDC
   identity, the no-role-at-rest `patternly-builder` identity and their separate
   deployer-scoped `actAs` edges;
3. security acceptance of the bootstrap project-scoped `roles/run.admin` and
   its mandatory post-create narrowing; otherwise implementation stops for a
   reviewed role design;
4. confirmation that organization policy permits disabling the Invoker IAM
   check; otherwise owner selection of gateway/IAP is required;
5. authorization to register the two Firebase applications and retain their
   exact public API key/app ID values;
6. the real Cloud Run origins produced by the two deployments and an explicit
   release allowlist;
7. any real secret inventory only after the email/public-link provider and
   domain/sender ownership decisions are closed; and
8. the separately approved sandbox maximum-instance/quota settings and later
   production billing/cost boundary before production deployment.

Task 3A must create IAM/resources only together with the first reachable API
slice, capture sanitized effective IAM/service/secret-version evidence, prove
the negative cases, and remove the bootstrap project-level Cloud Run Admin grant
after successful service creation. This report authorizes none of those cloud
mutations by itself.

## 11. First-party references

All sources accessed 2026-08-01:

- [Cloud Run: allowing public access](https://docs.cloud.google.com/run/docs/authenticating/public)
- [Cloud Run: service identity](https://docs.cloud.google.com/run/docs/securing/service-identity)
- [Cloud Scheduler: authenticated HTTP targets](https://docs.cloud.google.com/scheduler/docs/http-target-auth)
- [Cloud Scheduler: service agent and OIDC client separation](https://docs.cloud.google.com/scheduler/docs/http-target-auth#set_up_a_service_account)
- [Google Cloud: service-account ID-token claims](https://docs.cloud.google.com/docs/authentication/token-types#service_account_id_tokens)
- [IAM: service-account impersonation](https://docs.cloud.google.com/iam/docs/service-account-impersonation)
- [Cloud Run: configure secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets)
- [Secret Manager access control](https://docs.cloud.google.com/secret-manager/docs/access-control)
- [Firebase Authentication IAM roles](https://docs.cloud.google.com/iam/docs/roles-permissions/firebaseauth)
- [Firestore IAM roles](https://cloud.google.com/firestore/native/docs/security/iam)
- [Firebase Admin: verify ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase Admin: manage sessions and revoked tokens](https://firebase.google.com/docs/auth/admin/manage-sessions)
- [Firebase API keys](https://firebase.google.com/docs/projects/api-keys)
- [Firebase web configuration](https://firebase.google.com/docs/web/learn-more)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)

Repository sources of truth: `docs/02-architecture.md`, `docs/04-data-model.md`,
`docs/08-storage-and-offline.md`, `docs/09-security-and-privacy.md`,
`docs/canonical-product-contract.yaml`,
`docs/reports/launch-001-account-data-contract.md`,
`docs/reports/launch-003b4-cost-cloudrun-preflight.md` and the Task 3B-5 packet
in `docs/launch-completion-plan.md`.
