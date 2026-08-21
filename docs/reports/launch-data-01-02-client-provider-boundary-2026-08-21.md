# DATA-01/DATA-02 — Current client/provider boundary reconciliation

Date: 2026-08-21
Application HEAD: `19b6601e19e1888ffce1449dd5e54ca5df4f8996`
Status: `PARTIAL`; launch-blocking evidence and client integration remain open

## Decision

Do not add account screens, an implicit API endpoint, a provider fallback, or a
second persistence path in this slice. The current application is explicitly
guest-first and local-only. That is a valid current runtime boundary, but it is
not the complete public-launch account/sync vertical required by the canonical
contract.

The next implementation of DATA-01 must be a single approved client–server
vertical. It must start only after the account route/state scope has current
owner-approved Figma authority and the required public environment/provider
inputs are available. DATA-02 remains dependent on that identity boundary.

## Confirmed repository facts

### Current application boundary

- `src/navigation/RootNavigator.tsx` and `src/navigation/types.ts` contain no
  account, authentication, adoption, sync, sign-out, or deletion route.
- `src/features/home/YourDataScreen.tsx` states that learning data is local,
  current sync is absent, and account-based recovery is unavailable. This is
  consistent with the current guest-first runtime and must not be replaced by
  account-success copy before the account vertical exists.
- `src/infrastructure/clients/approvedClientRegistry.ts` is the sole app-side
  remote-client inventory. It exposes explicit `unconfigured` and
  `provider_not_composed` availability states and does not create transport.
- `src/infrastructure/clients/publicEnvironment.ts` requires a closed public
  configuration, including `apiOrigin`, auth/link origins, deletion URL,
  support/terms/privacy URLs, and sender domain. Local builds use an explicit
  unconfigured environment; there is no implicit network destination.
- No `AccountAuthClientAdapter.ts`, entitlement adapter, or package-delivery
  adapter currently composes a production transport in the app.

### Existing server foundations

- `server/src/authentication.ts` validates Firebase project, issuer, expiry,
  verified identity, UID binding, recent authentication when required, and
  App Check.
- `server/src/http.ts` exposes authenticated sync, snapshot, and adoption
  boundaries with closed request/error mapping.
- `server/src/accountService.ts` contains revisioned account datasets,
  idempotent mutation/adoption state, bounded snapshots, and conflict checks.
- `server/src/deletion.ts`, `server/src/accountLifecycle.ts`, and the Firebase
  adapter implement durable deletion intent/tombstone and verified deletion
  proof semantics.
- These are server-side foundations and test evidence, not proof of a composed
  mobile client, deployed provider, public links, signed build, or live
  end-to-end account lifecycle.

### Design and evidence boundary

- `docs/designs/account_lifecycle/DESIGN.md` is explicitly historical and
  superseded. Its account-before-bootstrap and old surface assumptions are not
  current UI authority.
- `docs/reports/launch-des-003-figma-authority-revalidation-2026-08-21.md`
  confirms current connector/file/node access, but not owner approval, full
  account vertical scope, or current-SHA parity.
- `docs/reports/launch-data-001-lifecycle-tombstone-2026-08-20.md` and
  `docs/reports/launch-data-002-device-session-remote-boundary-2026-08-20.md`
  correctly record the server hardening slices as partial and leave client
  integration/provider evidence open.

## Gaps and blockers

1. The app has no account state machine, auth command surface, verified-link
   intake, reauthentication route, account profile, or deletion route.
2. The app has no canonical local outbox/sync/adoption orchestration wired to
   the server boundary. Server contracts alone cannot prove local-first
   adoption or cross-device behavior.
3. No current provider/public-environment deployment proof binds the app to a
   live API, Firebase App Check configuration, auth action links, sender,
   public deletion URL, or deployed revision.
4. No owner-approved Figma account/data/deletion state matrix exists for this
   implementation slice. The historical account design cannot be used as a
   substitute.
5. Signed-distribution and exact-SHA end-to-end lifecycle evidence remain
   absent. Physical-device testing is optional and is not part of this blocker.

## Implementation-ready follow-up

### DATA-01 — Compose the identity client vertical

- **Goal:** implement one account route/state group for email/password, Apple,
  Google, recovery codes, App Check, reauthentication, revocation, and explicit
  lifecycle outcomes defined by the canonical contract.
- **Scope:** client auth adapter under the approved registry, account state
  machine, route guards, verified-link intake, public-environment wiring, and
  server HTTP integration; preserve guest-first learning.
- **Non-goals:** anonymous auth, email-only merge, implicit endpoint fallback,
  direct provider calls from screens, billing, or a second local repository.
- **Acceptance:** unconfigured builds fail closed; guest first learning remains
  available; every valid/duplicate/expired/offline/rate-limited/revoked/remote
  outcome is visible and state-safe; credentials/tokens never enter durable
  logs or unsafe storage; Home is reachable after the canonical account gate
  only where the contract requires it.
- **Verification/evidence:** unit and HTTP adversarial tests, storage/log scan,
  sandbox provider lifecycle, link replay/expiry checks, exact-SHA CI, and
  signed-distribution/release-compatible two-platform flow evidence.
- **Risk/stop:** stop if current Figma authority, public environment ownership,
  or provider authorization is unavailable.
- **Report target:**
  `docs/reports/launch-data-01-identity-vertical-YYYY-MM-DD.md`.

### DATA-02 — Wire local-first sync, adoption, and deletion

- **Goal:** connect the existing local journal and device-only session rules to
  the revisioned account dataset with deterministic adoption and deletion.
- **Scope:** outbox orchestration, snapshot/preview/confirm, conflict handling,
  retry/relaunch, sign-out, reauthentication, tombstone observation, and
  verified local/remote cleanup.
- **Non-goals:** silent merge, remote ownership of active device session state,
  provider deletion claims before execution, or commerce entitlement logic.
- **Acceptance:** local commit precedes remote acknowledgement; adoption is
  preview-plus-confirm; device-only session fields never sync; stale writers
  cannot overwrite verified state; deletion exposes retryable failure and
  verifies both local and remote absence.
- **Verification/evidence:** conflict/offline/relaunch/force-close/deletion
  tests, provider sandbox drill, current approved Figma states, exact-SHA CI,
  and signed-distribution/release-compatible evidence.
- **Risk/stop:** stop if DATA-01 is not composed or if deletion/retention proof
  cannot be read back from the provider.
- **Report target:**
  `docs/reports/launch-data-02-sync-adoption-deletion-YYYY-MM-DD.md`.

## Verification reviewed

- Current source inspection of navigation, settings/data disclosure, approved
  client registry, public-environment schema, server auth/HTTP/account/deletion
  modules, and related tests.
- Existing focused DATA reports and DES-003 authority revalidation.
- Application full suite: 631/631 passed; typecheck passed; release-gate
  contract tests passed. These results do not change the external-provider,
  Figma-approval or signed-build boundary. Physical-device testing is outside
  the mandatory launch scope.

## Dead-code check

No obsolete account client, route, fallback, compatibility branch, or parallel
repository was found to delete. The current local-only `YourDataScreen` is
reachable product behavior and remains canonical until the real account/data
vertical replaces it; adding a second account copy now would create competing
truth.
