# Launch OPS-01 — provider sandbox drill and readback — 2026-08-21

## Status

`blocked`, partial readback only. The existing sandbox project was found; no
new provider environment was created and no mutating provider command was run.

## Scope

Target environment: `sandbox` / `patternly-app-sandbox`.

Readback was performed with Firebase CLI using JSON output. No credential,
token, API secret, or service-account material was written to the repository.

## Readback results

| Check | Result | Consequence |
| --- | --- | --- |
| Firebase project | `ACTIVE`, project number `958691314582` | Sandbox exists; creation is not required. |
| Firebase Apps | Empty list | No iOS/Android/Web Firebase app registration was evidenced. |
| Firestore | `(default)`, `europe-central2`, `FIRESTORE_NATIVE`, delete protection enabled | Database exists. `POINT_IN_TIME_RECOVERY_DISABLED` blocks the recovery requirement. |
| Firebase Hosting | `https://patternly-app-sandbox.web.app` exists | The HTTPS surface exists, but the unauthenticated probe returned `404`; no product surface is deployed/evidenced there. |
| Firebase Functions | Readback failed with `Failed to list functions` | Functions deployment state is unknown; no positive evidence is admitted. |
| Cloud Run / IAM / Artifact Registry | Not read back in this environment | Deployed revision, digest, runtime identity, IAM, and rollback state remain unverified. |

## Drill outcome

The readback proves only that the sandbox shell and Firestore/Hosting
resources exist. It does not prove a deployable or reviewable Patternly
runtime. A restore drill cannot be honestly completed while PITR is disabled
and there is no verified application/data fixture or deployed API boundary.

## Required authorized continuation

1. Obtain valid provider authorization for the exact sandbox project and run
   read-only Cloud Run, IAM, Artifact Registry, Firebase Apps, App Check, and
   Firestore configuration readbacks.
2. Register only the Firebase apps required by the final mobile build and bind
   their identifiers to the sandbox environment.
3. Enable and verify the approved Firestore PITR policy before the restore
   drill; record the provider operation and sanitized effective state.
4. Deploy one immutable sandbox candidate through the documented keyless
   Cloud Build/Cloud Run path, then read back revision, digest, runtime
   identity, public transport, and rollback target.
5. Execute the deletion/tombstone/restore drill against sandbox data and prove
   no account, entitlement, report, credential, or deleted dataset is
   resurrected.
6. Remove temporary build/bootstrap grants and attach only sanitized evidence
   to the provider release envelope.

Until these steps have real readback, `provider-and-operations` must remain
`not_evidenced` in the launch gate.
