# Manual Cloud Build and Cloud Run deployment preflight

## Scope and status

This is the sole repository definition for a first real Patternly API image:
[`server/Dockerfile`](../../server/Dockerfile) and
[`server/cloudbuild.yaml`](../../server/cloudbuild.yaml). It implements
`PO-031`'s manual Cloud Build choice. It creates no trigger, provider resource,
credential, bucket, secret, role binding, or deployment. It is not evidence
that either environment is deployed.

The Dockerfile pins the official Docker Hub Node image manifest captured from
the `22.13.1-bookworm-slim` source tag on 2026-08-09. The Cloud Build definition
pins the official `gcr.io/cloud-builders/docker` builder manifest captured on
the same date. These source tags identify the captured manifests; deployments
use the pinned digests, not mutable tags.

This packet applies separately to `sandbox` / `patternly-app-sandbox` and
`production` / `patternly-app-production`, in `europe-central2`. The service,
Artifact Registry repository, and image name are each `patternly-api`.

## Fixed identities and boundaries

For the selected environment project `<PROJECT_ID>`, use only these exact
identities:

| Responsibility | Identity |
| --- | --- |
| Deploy | `patternly-deployer@<PROJECT_ID>.iam.gserviceaccount.com` |
| Runtime | `patternly-runtime@<PROJECT_ID>.iam.gserviceaccount.com` |
| One manual build | `patternly-builder@<PROJECT_ID>.iam.gserviceaccount.com` |
| Scheduler OIDC subject | `patternly-scheduler@<PROJECT_ID>.iam.gserviceaccount.com` |

The manual builder has no role at rest and is specified only for the one build.
It may read the exact staged source object, write the exact Artifact Registry
repository, and write Cloud Logging. The deployer submits/observes that build,
resolves the image digest, and attaches only the runtime identity. It never
builds as the deployer, the runtime, the Compute Engine default identity, or a
legacy Cloud Build identity. There is no Cloud Build trigger, `gcloud run deploy
--source`, retry policy, credential file, or `GOOGLE_APPLICATION_CREDENTIALS`.

The applicable IAM scopes and temporary-grant removal order are the canonical
matrix in [the keyless policy](../reports/launch-003b5-keyless-policy.md#4-identity-role-and-edge-matrix).
Do not infer a project-wide role from this deployment definition.

## Build definition

The image is built from repository-root source with:

```text
gcloud builds submit <EXACT_STAGED_SOURCE_OBJECT> \
  --project=<PROJECT_ID> \
  --config=server/cloudbuild.yaml \
  --region=europe-central2 \
  --service-account=projects/<PROJECT_ID>/serviceAccounts/patternly-builder@<PROJECT_ID>.iam.gserviceaccount.com \
  --substitutions=_IMAGE_URI=europe-central2-docker.pkg.dev/<PROJECT_ID>/patternly-api/patternly-api \
  --timeout=900s
```

The exact staged source object/bucket and build identifier are externally
authorized inputs, not repository defaults. Before submitting, the impersonated
deployer identity, source object project, builder identity, repository path,
and selected environment must all match `<PROJECT_ID>`. The build produces only
`europe-central2-docker.pkg.dev/<PROJECT_ID>/patternly-api/patternly-api:<BUILD_ID>`.
`CLOUD_LOGGING_ONLY` is set in the build config; the command must not create a
logs bucket. The Cloud Build record is the image provenance; resolve the pushed
image's immutable `sha256:<DIGEST>` from Artifact Registry before deployment.

## Digest deployment intent

After exact digest verification, the deployer may perform the authorized
environment deployment using the immutable reference below. Never deploy a tag
or substitute a digest from the other project.

```text
gcloud run deploy patternly-api \
  --project=<PROJECT_ID> \
  --region=europe-central2 \
  --image=europe-central2-docker.pkg.dev/<PROJECT_ID>/patternly-api/patternly-api@sha256:<DIGEST> \
  --service-account=patternly-runtime@<PROJECT_ID>.iam.gserviceaccount.com \
  --port=8080 \
  --min-instances=0 \
  --no-invoker-iam-check \
  --impersonate-service-account=patternly-deployer@<PROJECT_ID>.iam.gserviceaccount.com
```

The actual service environment must be supplied only after the Cloud Run origin
is known and must satisfy the server's fail-closed contract:
`PATTERNLY_ENVIRONMENT`, `FIREBASE_PROJECT_ID`, `PATTERNLY_API_ORIGIN`,
`PATTERNLY_SCHEDULER_AUDIENCE`, `PATTERNLY_SCHEDULER_EMAIL`, and
`PATTERNLY_SCHEDULER_SUBJECT`, `PATTERNLY_APPCHECK_MODE`, and
`PATTERNLY_APPCHECK_APP_IDS`. App Check mode must be `production` in the
production environment; `debug` is permitted only in sandbox. App IDs are
comma-separated Firebase App Check app identifiers and must be unique. No value
may be blank, cross-environment, a
placeholder, local address, secret, or credential path. The current server has
no declared secret inventory. A future secret must use its exact resource and
numeric version according to the keyless policy; `latest` and ordinary
environment-variable secret injection are prohibited.

`--no-invoker-iam-check` is the only public-transport mechanism. Do not also
grant `roles/run.invoker` to `allUsers`. All protected application routes still
require both the verified Firebase ID token and the allow-listed Firebase App
Check assertion before request-body handling.

## Health and logging allowlist

Cloud Run network readiness is the service health signal. The image healthcheck
only checks that PID 1 is alive because the API intentionally exposes no public,
unauthenticated health endpoint; adding one would change the canonical route
surface. A deployed revision must be checked through Cloud Run's revision-ready
state and an authenticated, environment-correct API conformance call.

Application logging is currently fail-silent: the server writes no application
logs. Until an implementation adds a reviewed structured logger, the allowlist
is empty. Cloud Build may write its build record to Cloud Logging only. No log
may include credentials, raw authorization headers, Firebase tokens, email,
recovery codes, signed URLs, request bodies, account data, learning responses,
package bytes, journal payloads, or repository dumps.

## Rollback and external gates

Rollback is a deliberate deployer action: select the prior verified revision
whose image digest and environment match the same project, then move 100% of
traffic to that revision. Do not roll back across environments, to an image tag,
or by reconstructing an image. Record the prior/new revision names and digests
without recording sensitive environment values. If the prior revision or its
digest cannot be verified, stop rather than guessing.

Before any provider command, the controller must confirm the applicable
authorization and gates: APIs/IAM/source bucket/one build for sandbox, an
approved source principal, exact temporary IAM grants, public-invoker policy,
real service origin allowlist, and a separately approved production billing and
deployment boundary. After the proof, capture sanitized build/digest/revision
evidence and remove every temporary build and bootstrap grant required by the
keyless policy.
