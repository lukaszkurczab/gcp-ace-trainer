# SEC-01 — Approved-client App Check boundary

Date: 2026-08-20  
Scope: server authentication boundary and environment contract

## Findings

The server requires a Firebase ID token and a verified Firebase App Check
token on protected account routes before it reads or parses the request body.
The App Check claim must resolve to an explicitly configured app ID. Production
configuration rejects debug mode; local non-Cloud-Run execution requires
declared loopback Firebase emulators. Firebase Admin is initialized once from
the selected environment project, and the server does not expose an
unauthenticated health route.

The repository therefore has a fail-closed implementation boundary. This
report does not claim production attestation-provider registration, mobile
app identifiers, debug-token handling, Cloud Run deployment, or provider
operations evidence; those remain `OPS-02`/`BLK-12` gates.

## Repository evidence

- `server/src/authentication.ts` verifies the ID token, requires
  `x-firebase-appcheck`, verifies the token with Firebase Admin, and allow-lists
  the returned `appId`.
- `server/src/environment.ts` requires explicit App Check mode and IDs and
  rejects production debug mode, duplicate IDs, cross-environment projects,
  and undeclared local Firebase runtime.
- `server/src/http.ts` authenticates before request-body parsing and maps
  Firebase App Check failures to closed public errors.
- `server/src/firebaseAdapters.ts` delegates App Check verification to the
  Firebase Admin App Check provider.

## Verification

- Authentication, HTTP, startup, and environment tests pass when run with a
  local listener.
- `npm run validate:runtime-privacy-boundary` — passed.
- `npm run gate:contract-change` — passed.

