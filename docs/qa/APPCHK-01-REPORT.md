# APPCHK-01 — mobile client App Check boundary

**Status:** `done` locally for the client boundary. Backend enforcement is covered by APPCHK-02; provider evidence remains open.

## Contract and evidence

- Product decision BE-DEC-004 requires App Check on every protected mobile request, in addition to bearer and recent authentication where applicable. Hosted marketing web, local admin, webhooks and infrastructure checks use their own boundaries.
- The mobile `PatternlyApiClientAdapter` is the canonical HTTP path for its `/v1/*` operations. It now obtains an App Check token before transport for every `/v1/*` path except `/v1/admin/*`. `GET /health`, `GET /ready` and `GET /openapi.json` are also excluded. Query strings are parsed separately from paths. The two calls already supplying an explicit token keep that token.
- A missing, empty, timed-out or throwing provider produces `app_check_unavailable` without HTTP. Privacy-request UI classification maps this and server attestation rejection to its existing unavailable/retry state in English and Polish.
- Bearer acquisition, optional bearer on guest mobile calls, recent-auth behavior and the request timeout remain separate. No token is fabricated by the production provider.

## Verification

- `node --import tsx --test src/infrastructure/clients/patternlyApiClient.test.ts src/application/account/accountIdentityComposition.test.ts` — 46/46 passed.
- `node --import tsx --test src/infrastructure/clients/approvedClientRegistry.test.ts` — 4/4 passed.
- `npm run typecheck` — passed.
- `git diff --check` — passed.
- Independent validation before implementation: `gpt-5.6-luna`, `max`, briefing only; consistency 0.93, simplicity 0.91, risk 0.86, maintainability 0.90, minimum **0.86**. Earlier brief without the route matrix was rejected at 0.72 and redesigned.
- Independent post-change QA: `gpt-5.6-luna`, `max`, `PASS`; consistency 0.94, simplicity 0.91, risk 0.86, maintainability 0.90, minimum **0.86**. No blocking issue found in the central policy or client tests.

## Remaining work

- APPCHK-02 enforces the mobile matrix server-side and updates OpenAPI and security probes. Its independent QA passed; see the backend APPCHK-02 report.
- APPCHK-03/04 must prove the native/debug configuration boundary and unavailable/retry behavior across mobile flows. Real provider proof belongs to ODK-084 after freeze.
- WEB-03B must add the user-approved guest privacy form in the app, then remove browser privacy endpoints and links. The public marketing web has no login or account management.
