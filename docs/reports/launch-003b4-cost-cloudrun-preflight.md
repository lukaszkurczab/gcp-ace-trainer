# Launch 003B-4 — billing, Cloud Run and cost-control preflight

**Date:** 2026-08-01  
**Status:** implementation complete; independent closure QA `pass`
**Controller decision:** `pass`

## Objective and boundary

This packet verifies the current cost and infrastructure boundary for exactly
`patternly-app-sandbox` and `patternly-app-production`. It performed no cloud
mutation: no billing association, API enablement, budget, spend cap, quota,
IAM binding, service account, key, secret, Firebase app or Cloud Run resource
was created or changed.

The repository has no production-shaped server, container, build or Cloud Run
service definition. Creating an empty or mock service would add a second path
that Task 3A would later replace, so service deployment remains part of the
first real Task 3A API slice.

## Sanitized account and project findings

Two billing accounts are visible to the authenticated operator. Account IDs,
names and payment details were neither printed nor persisted.

| Accessible billing account | State | Currency | Link-project permission | Budget list/create permission |
| --- | --- | --- | --- | --- |
| 1 | closed | `PLN` | allowed | allowed / allowed |
| 2 | open | `PLN` | allowed | allowed / allowed |

At the read-only preflight snapshot before `PO-024`, both Patternly projects
were unlinked and reported `billingEnabled: false`. The single accessible open
PLN account was therefore only a possible target at that checkpoint, not an
authorized selection.

At that preflight snapshot, the Cloud Billing Budget API read returned
`403 PERMISSION_DENIED` with reason `SERVICE_DISABLED` for both accessible
accounts. IAM permission tests proved that budget list/create permissions were
present, but the disabled API made API enumeration of a
Patternly-project-filtered budget **unverifiable** at that checkpoint. A zero
counter from that failed read was not evidence of absence. No API was enabled
to close the API-read gap. The later owner screenshots and attestation recorded
below now prove the existence and visible configuration of both authorized
budgets without changing that API state.

## Required service states

All states below came from fresh Service Usage reads by exact project number.

| Service | Sandbox | Production |
| --- | --- | --- |
| `run.googleapis.com` | `DISABLED` | `DISABLED` |
| `billingbudgets.googleapis.com` | `DISABLED` | `DISABLED` |
| `secretmanager.googleapis.com` | `DISABLED` | `DISABLED` |
| `iamcredentials.googleapis.com` | `DISABLED` | `DISABLED` |
| `artifactregistry.googleapis.com` | `DISABLED` | `DISABLED` |
| `cloudbuild.googleapis.com` | `DISABLED` | `DISABLED` |

Because the Cloud Run Admin API is disabled, a service-specific Cloud Run list
was not available. This report does not infer that Cloud Run resources are
absent from an API-disabled response. Enabling the API only to list resources
would have violated the zero-mutation boundary.

## IAM and key inventory

Principal identifiers were not printed or persisted.

| Finding | Sandbox | Production |
| --- | --- | --- |
| Project IAM bindings | 7 | 7 |
| Basic-role bindings | `roles/owner`: 1 member | `roles/owner`: 1 member |
| `roles/editor` bindings | 0 | 0 |
| Custom-role bindings | 0 | 0 |
| Service accounts visible | 1 | 1 |
| User-managed service-account keys | 0 | 0 |
| Google-managed service-account keys | 2 | 2 |

The current human/project-owner baseline is not a runtime identity design.
Task 3A must use dedicated single-purpose service identities and must not grant
Owner or Editor to a runtime or deployment account. No existing custom role or
user-managed key contradicts that future keyless boundary.

## Firestore, Authentication and app regression check

| Check | Sandbox | Production |
| --- | --- | --- |
| Firestore databases | 1 × `(default)` | 1 × `(default)` |
| Database edition / location | `STANDARD` / `europe-central2` | `STANDARD` / `europe-central2` |
| Delete protection / PITR | enabled / disabled | enabled / disabled |
| Firebase Auth subtype | `FIREBASE_AUTH` | `FIREBASE_AUTH` |
| Email / password required / improved privacy | enabled / true / true | enabled / true / true |
| Anonymous / phone / duplicate emails | false / false / false | false / false / false |
| MFA / multi-tenancy / blocking triggers | disabled / false / 0 | disabled / false / 0 |
| Social / OIDC / SAML providers | 0 / 0 / 0 | 0 / 0 / 0 |
| Users (one-user page read) | 0, no next page | 0, no next page |
| Registered Firebase apps | 0 | 0 |

The completed 3B-2 and 3B-3 foundations have not broadened. No data, user,
provider or client-app path appeared.

## Current first-party capability and cost facts

Sources were accessed on 2026-08-01.

- Linking Cloud Billing upgrades a Firebase project to Blaze, and paid Google
  Cloud products such as Cloud Run require that relationship. Cloud Run still
  has free usage quota, but the billing account is required to use it:
  [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans),
  [Firebase Cloud Run prerequisites](https://firebase.google.com/docs/hosting/cloud-run).
- Cloud Run supports `europe-central2` in Warsaw, and the current Cloud Run
  price table classifies it as Tier 2:
  [Cloud Run locations](https://cloud.google.com/run/docs/locations),
  [Cloud Run pricing](https://cloud.google.com/run/pricing).
- With no minimum instances, Cloud Run can scale to zero; setting minimum
  instances above zero retains idle capacity. Patternly should explicitly set
  service minimum instances to `0`:
  [Cloud Run overview](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run),
  [minimum instances](https://docs.cloud.google.com/run/docs/configuring/min-instances).
- An explicit maximum instance count helps control cost, but Cloud Run may
  briefly exceed it during traffic spikes or deployment. It is not a currency
  cap:
  [autoscaling behavior](https://docs.cloud.google.com/run/docs/about-instance-autoscaling),
  [maximum instances](https://docs.cloud.google.com/run/docs/configuring/max-instances).
- Ordinary Cloud Billing budgets send notifications and do not stop usage or
  charges. Cost reporting is delayed:
  [budgets and alerts](https://docs.cloud.google.com/billing/docs/how-to/budgets).
  Default role-based email recipients are Billing Account Administrators and
  Billing Account Users; project-level recipients are a separate Preview
  option for single-project budgets:
  [budget notification recipients](https://cloud.google.com/billing/docs/how-to/budgets-notification-recipients).
- Spend-cap budgets are Preview, cover one eligible service in one project,
  and can pause new Cloud Run usage. Enforcement is not instantaneous;
  in-flight work, latency overages and ongoing fixed resource costs can still
  be billed. They do not cover Firestore or another service:
  [spend-cap budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps).
- Firestore has a separate free quota (one free database, 1 GiB, 50,000 reads,
  20,000 writes and 20,000 deletes per day, plus 10 GiB outbound transfer per
  month). Its usage and quotas must be monitored independently:
  [Firestore usage and limits](https://firebase.google.com/docs/firestore/quotas).
- API request quotas are service-specific and may enforce with latency; they
  are not a project-wide spending cap:
  [capping API usage](https://docs.cloud.google.com/apis/docs/capping-api-usage).
- Cloud Run obtains Google API credentials through its attached service
  identity and the provider metadata service. Google recommends a dedicated user-managed service account
  with minimal permissions and avoiding downloadable keys:
  [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity),
  [service-account security](https://docs.cloud.google.com/iam/docs/best-practices-service-accounts).

## Owner-authorized execution slice

The next mutation should be a **sandbox-only cost-boundary slice**, not a Cloud
Run deployment. Production must remain Spark/unbilled until the first real
Task 3A API is validated in sandbox and receives a separate production-
promotion authorization. `PO-024` authorizes the exact sandbox values and
boundary below.

### Authorized exact mutations

For `patternly-app-sandbox` only:

1. In a pre-mutation console read, inspect budgets on the single accessible
   open PLN account. Stop if the account is no longer uniquely open/accessible,
   the project-scoped budget view is unavailable, or an overlapping sandbox
   budget exists.
2. Link that verified open PLN billing account to the sandbox project. This
   upgrades only sandbox from Spark to Blaze.
3. Create one alerts-only, single-project, all-service monthly budget with a
   `5 PLN` target, default role-based recipients (Billing Account
   Administrators and Billing Account Users), no Pub/Sub automation,
   actual-spend thresholds at 50%, 80% and 100%, and a 100% forecast threshold
   if the current budget surface supports it. Enable Project Owners as
   recipients only if the supported Preview project-level recipients option is
   offered for this single-project budget; otherwise retain the supported
   default role recipients and do not claim that Project Owners are notified.
4. If the Preview control is offered for the exact sandbox project and Cloud
   Run service scope, create one monthly Cloud Run spend-cap budget with a
   `5 PLN` target. If the project-scoped budget view or Preview cap is
   unavailable, stop and report the partial state; do not silently substitute
   another control or automatically unlink billing.

This authorized packet changes no principal or IAM role and enables no runtime/build
API. Its complete mutation count is one sandbox billing association, one
alerts-only budget and, only if the documented Preview control is available,
one Cloud Run spend-cap budget. Production receives zero mutations.

### Pre-execution checkpoint

The first execution attempt stopped before billing. The safely project-scoped
Budget API read remains unavailable with `SERVICE_DISABLED`, and the connected
browser runtime failed before it could open the authenticated Cloud Billing
budget view; neither failure was replaced with a false zero result. The owner
then supplied a current screenshot of the selected open PLN billing account's
complete budget table. It contains one unrelated-project budget and no
Patternly budget, satisfying the overlap precheck without persisting the
private screenshot or unrelated identifiers in the repository. A fresh read
confirmed `billingEnabled: false` for both Patternly projects immediately
before the worker mutation.

### Billing association checkpoint

The delegated worker repeated the sanitized preflight successfully, but the
approval layer rejected its one association command before process launch
because the subagent did not carry the owner's direct financial authorization.
It did not retry, mutate cloud state or edit the repository. The controller,
which held the direct `PO-024` approval, then executed exactly one association
operation for `patternly-app-sandbox` with the unique open PLN billing account.

Sanitized post-operation evidence proves:

- sandbox changed from `billingEnabled: false` to `true`;
- production remained `billingEnabled: false`;
- `run.googleapis.com`, `billingbudgets.googleapis.com`,
  `secretmanager.googleapis.com`, `iamcredentials.googleapis.com`,
  `artifactregistry.googleapis.com` and `cloudbuild.googleapis.com` remain
  `DISABLED` in both projects;
- no production, API, IAM, service-account, key, secret, Firebase app, Cloud
  Run, Firestore, Authentication or Hosting mutation was performed.

The owner subsequently created both authorized `5 PLN` controls. Their
verified implementation evidence is recorded in the PO-024 checkpoint below.

### Deferred to the first real Task 3A API deployment

Do not yet enable Cloud Run, Artifact Registry, Cloud Build, Secret Manager or
IAM Credentials; do not create deployment/runtime service accounts, secrets,
repositories or quotas. The production-shaped Task 3A deployment packet must
name the real API artifact and then, in the same coherent slice:

- enable only the APIs actually used by that build/deployment;
- create one dedicated runtime identity per environment, attach it to the real
  Cloud Run service and grant only required Firestore/secret access;
- grant deployment permissions separately, including `actAs` only on the
  selected runtime identity;
- use explicit `gcloud --impersonate-service-account` deployment commands and
  keep user-managed key count at zero; do not create a user, developer or local
  application-default credential file;
- deploy in `europe-central2` with minimum instances `0` and an owner-approved
  explicit maximum instance value;
- set Firestore and callable API quotas from measured request economics, not
  from an invented placeholder workload.

### Risks, failure modes and rollback boundary

- The sandbox billing association exposes that whole project to pay-as-you-go
  charges and can auto-enable provider dependencies during later deployments.
  Production remains unbilled and cannot be used as an automatic fallback.
- Alerts do not stop charges. Preview caps can enforce late, can bill overage
  and only pause covered Cloud Run usage; enforcing a cap can make the API
  unavailable until manually lifted.
- If billing association succeeds but the alert budget or Preview spend cap
  cannot be created, sandbox is in a partial state. Stop and report; do not
  automatically unlink, delete the successful alert budget, mutate production
  or widen scope.
- Budget resources can be deleted and billing can be unlinked, but unlinking
  does not reverse accrued charges and can disable paid services. It is an
  explicit owner rollback, never an automatic compensation after application
  deployment.
- The approved `5 PLN` all-service alert target and `5 PLN` Cloud Run Preview
  cap are intentionally low because the product may fail to find demand.
  `PO-024` authorizes only that sandbox boundary. Production billing and
  production budgets require a later, separate promotion decision after the
  real sandbox API is validated.

## Read-only operation inventory and limitations

The worker performed only these sanitized reads:

- Cloud Billing project state and accessible billing-account list;
- Cloud Billing account `testIamPermissions` for project association and
  budget list/create;
- Billing Budget list attempts, which failed with `SERVICE_DISABLED`;
- Service Usage state for the six named APIs;
- project IAM policy summarized to role/member counts;
- IAM service-account and key lists summarized to counts/key types;
- Firestore database lists reduced to the named database fields;
- Admin v2 Auth config/provider lists and a one-user page read reduced to
  named booleans/counts;
- Firebase app lists reduced to counts;
- repository file/path inspection for an existing server/deployment path.

Cloud Run resources remain unverifiable for the explicit API-disabled reasons
above. Budget API objects and fields not exposed in the supplied console
evidence also remain unavailable through the disabled API; the existence,
scope and visible configuration of both authorized budgets are nevertheless
proved by the screenshots and owner attestation below. No secret-bearing Auth
fields, tokens, credentials, account IDs, payment details, principals, key
material or unrelated-project spend were inspected or persisted.

## PO-024 implementation checkpoint — complete; repeated QA pending

The owner completed the sandbox-only console operation. Fresh sanitized Cloud
Billing reads now prove `patternly-app-sandbox` has `billingEnabled: true` and
`patternly-app-production` remains `billingEnabled: false`. Fresh Service Usage
reads prove all six deferred deployment APIs remain `DISABLED` in both
projects: Cloud Run, Billing Budgets, Secret Manager, IAM Credentials, Artifact
Registry and Cloud Build. The worker performed no mutation and did not enable
an API.

The owner-provided expanded Cloud Billing screenshot visibly proves exactly
these budget-table facts for the two Patternly rows:

| Visible budget row | Project shown | Service shown | Period | Amount | Alert thresholds shown | Spend-cap status shown |
| --- | --- | --- | --- | --- | --- | --- |
| `Patternly` | `Patternly Sandbox` | none (all services) | monthly | `5 PLN` | 50%, 80%, 100% | Not applicable |
| `Patternly-sandbox` | `Patternly Sandbox` | `Cloud Run` | monthly | `5 PLN` | 50%, 80%, 100% | Configured |

The screenshot also shows zero current spend for both rows. The owner explicitly
confirmed the hidden configuration: the alert budget uses 50%, 80% and 100%
actual-spend thresholds plus the supported 100% forecast threshold, retains the
default IAM role recipients, and has no Pub/Sub or additional Monitoring
notification channel. Project Owners were optional in the authorized packet
and are not claimed as configured. The screenshots and owner attestation
jointly prove the exact console packet; no underlying resource identifier or
unrelated financial data is persisted.

A Cloud Billing Budget API list was attempted only with the documented
server-side `scope=projects/patternly-app-sandbox` filter against the unique
open PLN account. It returned `403 PERMISSION_DENIED` with reason
`SERVICE_DISABLED`; no unscoped or unrelated-budget list was attempted. The
API therefore cannot independently expose the two budget objects or hidden
notification/spend-cap fields in the current zero-mutation boundary. This is a
provider-read limitation, not evidence that the screenshot-visible budgets are
absent.

The earlier sanitized Firestore/Auth/app/IAM/key inventory remains the latest
recorded regression evidence for those surfaces. Billing association and
budget creation do not modify them, and focused post-operation reads prove the
six deferred APIs remain disabled. Production billing, runtime APIs, IAM,
service identities, secrets, Firebase apps and Cloud Run deployment remain
outside `PO-024`.

## Verification and QA

- `git diff --check` passed.
- `npm run gate:contract-change -- HEAD` passed with
  `CONTRACT_CHANGE_CHANGED_PATHS=41`.
- The first independent QA run returned `fail` because the proposed alert
  recipients omitted Billing Account Users and treated Project Owners as a
  default recipient set.
- The repair changed only the recipient statement and added the current
  first-party notification-recipient source. It now names Billing Account
  Administrators and Billing Account Users as the default role recipients and
  Project Owners only through the supported Preview single-project option.
- Repeated independent QA returned `pass`; no cloud-state, scope,
  architecture, cost-boundary or debt finding remains.
- The first implementation-closure QA returned `fail` only because this report,
  the plan and decision register still described the pre-budget partial state.
  The focused documentation repair records the completed controls and removes
  the stale remaining-evidence claim; repeated independent closure QA returned
  `pass`.
