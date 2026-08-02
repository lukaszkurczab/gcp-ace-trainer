# Launch 001 — account, identity and data contract

## Decision

Slice 1A defines one vendor-neutral, implementation-ready public-launch
account and data lifecycle in `canonical-product-contract.yaml`. It does not
implement that lifecycle. The current source remains a local-only build until
Task 3 implements the declared account application/service boundary and passes
provider, device and signed-build verification; Task 8 later extends the
contract for content reporting.

Slice 1B closes the independent-QA contract gaps: progress and evidence are
derived-only, pre-destructive journal recovery and crash-recoverable deletion
are explicit, token/link transport is closed, lifecycle failures map to
surfaces and first bootstrap cannot enter offline before successful sync.

Slice 1C closes cross-device deletion, deletion-intent authority, visible
journal-recovery failure, semantic parser and downstream dependency gaps.

Slice 1D makes the pre-bootstrap offline invariant exhaustive across every
lifecycle in-progress, success and failure target while preserving only the
declared entry and true already-offline self-loops.

Task 1 closed on 2026-07-31 after fresh independent QA returned `pass`. QA
manually verified the valid contract and offline self-loop, rejected direct
offline mutations from initial sync, identity verification, sign-in progress
and initial-sync failure, and found no remaining blocking or high-severity
finding.

The selected identity is verified email and password. A network connection is
required for registration, verification, sign-in, the first authenticated
bootstrap, recovery/reset, reauthentication, remote restore and deletion. A
previously verified bound account can continue local learning offline and
queues only verified local mutations for later sync.

## Dated reconciliation addendum — 2026-08-01

This report preserves the Task 1 state accepted on 2026-07-31. `PO-020`
subsequently supersedes only its provider/backend and region non-selection:
the selected path is standard Firebase Authentication, Firestore Standard and
Cloud Run in `europe-central2`. The vendor-neutral lifecycle and every other
Task 1 decision remain unchanged. `PO-020` does not select Firebase Hosting or
another public host/domain, and it does not prove project access, sender-domain
ownership, retention, implementation or signed-build behavior; those remain
current Task 3 inputs and evidence requirements.

## Dated retention reconciliation addendum — 2026-08-01 (`PO-026`)

The owner approved the existing canonical retention semantics unchanged: live
service data has zero retention after verified deletion; startup uses zero
provider-backup days only after a provider-specific read confirms that no backup
or schedule exists; any separately authorized future encrypted backup expires
within at most 30 days and cannot restore a deleted account; and the proof keeps
exactly the five canonical fields for exactly 30 days before physical removal.

This decision does not prove the current provider backup inventory and does not
authorize PITR, backup, TTL, a retention job or another cloud mutation. The 3B
evidence proves PITR disabled and no repository or initiated-operation backup
configuration, while also recording Firestore's baseline one-hour version
history. Patternly therefore makes no claim of zero recoverable history and
prohibits restoring a deleted account from that history. Provider inventory,
expiry/cleanup implementation and the sanitized sandbox deletion drill remain
Task 3 evidence.

## Dated transactional-email processor addendum — 2026-08-01 (`PO-032`)

The owner approved Resend Free only for the owner-only sandbox and only to
deliver the distinct public-deletion possession link. This processor boundary
permits transactional-email delivery data to remain with Resend for at most 30
days in the United States. That processor copy necessarily contains the
recipient's normalized email and the distinct
`publicDeletionPossessionToken` in the message content and delivery/API
records. It does not make Resend an account-data authority and does not
classify those records as a Patternly or Firebase backup.

This processor retention is separate from the unchanged deletion rules. Live
Patternly/Firebase account data still has zero retention after verified
deletion; an independently authorized encrypted backup still has a maximum of
30 days and cannot restore a deleted account; and the minimal five-field
deletion proof still remains for exactly 30 days. The
`publicDeletionPossessionToken` remains distinct, single-use and valid for 30
minutes regardless of the processor's longer delivery-data retention.
Patternly/Firebase-controlled stores do not persist the token, and
Patternly-controlled logs exclude both it and the normalized email. No Resend
account, key, secret, dependency, message send or cloud resource is implemented
or proven by this contract-only addendum.

## Confirmed repository facts

- `PO-017` requires registration, sign-in and the complete account lifecycle
  for public launch.
- The current `RootNavigator` declares 21 non-account routes and has no account
  entry, lifecycle, adoption, sync or deletion route.
- No current production source implements account, network, remote-data,
  email-delivery or verified-link services.
- MMKV and one canonical repository set own current local records. Screens and
  family runtimes do not own persistence.
- Current local keys cover metadata, active track, active session and draft,
  foreground timer, completed sessions/results, attempts, review entries,
  settings, notification settings and the active mutation journal.
- Pre-production storage compatibility is not required. Obsolete readers,
  parallel repositories, Cloud write-through and silent repair are forbidden.
- The existing local journal/revision/fingerprint model already establishes
  local durability, idempotency and explicit conflict patterns that the sync
  boundary can preserve.

## Assumptions and bounded choices

- No backend, auth or email provider is selected by this slice.
- Email/password is the smallest identity model consistent with the existing
  register, verification, duplicate identity, forgot/reset and
  reauthentication surface inventory. Social and anonymous identity would add
  scope or recreate a bypass.
- Thirty minutes is the configured and maximum validity for single-use
  verification, recovery and public-deletion links. A different validity
  requires a canonical contract change before implementation.
- Live account data has zero retention after verified deletion. Encrypted
  backups have a 30-day maximum, while the minimal deletion proof remains for
  exactly 30 days and then is removed. Legal review may require a stricter
  policy; extending backup retention or changing the exact proof window requires
  an explicit contract change before implementation.
- Static bundled content remains outside account synchronization. This slice
  authorizes only account identity, canonical learning records and bounded
  operation metadata.

## Canonical authority model

There is one learning-data path with two non-competing roles:

```txt
learning command
→ canonical local journal/materialization/verification
→ canonical local repositories (device durability authority)
→ ordered idempotent sync outbox
→ account-data service with expected account revision
→ one remote account dataset (cross-device convergence authority)
```

Screens, family runtimes and content code cannot call a remote repository
directly. A local commit is real before remote acknowledgement and is displayed
as pending, not synced. A remote failure retains that local commit and its
outbox entry. A stale revision fetches remote state and permits only the
declared deterministic replay; otherwise sync blocks without overwriting
either verified state.

## Record ownership walkthrough

| Record class | Owner | Remote policy | Rationale |
| --- | --- | --- | --- |
| storage metadata | device | never | validates this installation and schema |
| account binding | account + device | identity reference only | binds the device without duplicating the remote profile |
| sync metadata/outbox | account + device | operation envelope only | coordinates delivery; it is not learning history |
| application settings | device | never | appearance/language belong to this installation |
| notification settings | device | never | permission and reminder delivery are device-specific |
| active track | account | revisioned | affects cross-device entry and recommendation context |
| active-session reference | account | revisioned | enforces one active account session |
| training session | account | revisioned | active progress changes; completed state is verified |
| result and attempt | account | immutable by stable ID | committed evidence unions safely only by identity/fingerprint |
| review queue entry | account | revisioned | changes through deterministic learning operations |
| simulation draft and timer | account | revisioned | exact resumable state; stale writes fail |
| mutation journal | device-operational | materialized writes only | crash recovery stays local; verified effects sync |
| account-deletion intent | device-operational | never | minimal cleanup checkpoint; never learning-data authority |

Repository indexes follow the ownership and sync policy of their record class;
they are never an independent authority or separately merged dataset.
Family-neutral evidence and family progress are non-writable read projections
derived only from attempts, results and review entries. The current storage key
set has no separate evidence/progress record, so neither projection is an
independent synchronization authority.

## Identity and lifecycle walkthrough

| Command | Success | Required visible failures |
| --- | --- | --- |
| register | verification pending | invalid input, duplicate identity, rate limit, offline, remote failure |
| verify identity | authenticated initial sync | invalid/expired/used link, rate limit, offline, remote failure |
| resend verification | verification pending with a new single-use link | rate limit, offline, remote failure |
| change pending email | verification pending; previous link invalidated and verification resent | invalid input, duplicate identity, rate limit, offline, remote failure |
| sign in | authenticated initial sync | invalid credential, unverified identity, rate limit, offline, remote failure |
| request recovery | same non-enumerating accepted state | invalid input, rate limit, offline, remote failure |
| reset password | signed out; new sign-in required | invalid input/link, expired/used link, rate limit, offline, remote failure |
| complete initial sync/adoption | authenticated ready | adoption conflict, offline, remote failure |
| enter offline | offline authenticated | no fabricated failure; the validated bound dataset remains available |
| restore network | authenticated syncing | still offline or remote failure leaves the offline state unchanged |
| expire session | reauthentication required | no fallback transition |
| reauthenticate | authenticated sync | invalid credential, revoked session, rate limit, offline, remote failure |
| sign out | credentials and account-owned local records removed | pending sync, export required, local deletion failure |
| delete account | sessions revoked, remote deletion verified, local account data removed | reauthentication required, rate limit, offline, remote failure, deletion verification failure |
| complete remote deletion cleanup | terminal remote-account-deleted result | journal recovery or local cleanup failure remains retryable from the durable intent |

Every failure group names its destination state. Validation and remote failures
return to the safe source state; an interrupted initial sync remains in
authenticated syncing. Offline entry exists only after a completed
authenticated sync. Sign-out failure returns to its exact source state and
binding. A deletion request that needs fresh credentials enters
`reauthenticationRequired`; operational deletion failures enter
`deletionFailed` so the user can retry without a success claim.

Registration may report a duplicate identity so the learner can choose sign-in
or recovery. Pending verification explicitly supports resend and changing the
pending email; changing it invalidates the prior link. Recovery and public
deletion requests return the same accepted response whether or not the address
exists. Verification, recovery and public-deletion links use distinct
possession tokens, are verified HTTPS universal links, single-use and expire
after 30 minutes. Invalid, expired and already-used links are different visible
outcomes.

## First-binding and conflict walkthrough

| Local | Remote | Deterministic result |
| --- | --- | --- |
| empty | empty | create one empty bound dataset |
| populated | empty | preview, confirm, upload exact local dataset, verify |
| empty | populated | preview, confirm, restore exact remote dataset, verify |
| populated | populated | preview a record-policy reconciliation plan before confirmation |
| active session on one side | any compatible state | preserve it and reject creation of a second active session |
| divergent active sessions | divergent active session | require an explicit choice and confirmed abandonment of the other draft |
| divergent record | divergent record | apply its declared record policy or block without mutation |

Distinct immutable IDs union only after preview confirmation. Same ID and
fingerprint deduplicates idempotently. Same immutable ID with a different
fingerprint is an integrity conflict. A one-sided revisioned change wins only
after its expected revision check. Two-sided revisioned changes permit only a
deterministic semantic replay; an unsupported replay blocks. Device-owned
records remain device-only. Cancellation or failed verification keeps both
last verified datasets unchanged.

## Offline and session-expiry walkthrough

- Offline learning is available only for a previously verified bound account
  with a validated local dataset after one successful authenticated sync. The
  initial bootstrap cannot switch to offline. It is not anonymous entry.
- Practice, review, progress and exact session resume remain available.
- Each mutation completes local durability first and then exposes
  `offlinePending` with the pending count.
- Registration, sign-in, verification, first bootstrap, recovery/reset,
  reauthentication, restore and deletion are explicitly unavailable offline.
- An access token that expires offline blocks sync and security actions but
  does not discard local work. A server-declared revocation requires
  reauthentication and blocks sync and account learning entry when online.

## Sign-out, deletion and retention walkthrough

Before export, sign-out or account deletion, any durable mutation journal must
be recovered, materialized, verified and cleared. A failure blocks the requested
operation as visible `journalRecoveryFailure`, retains the current account
binding and verified records, and blocks binding a different account around the
unresolved journal. Export maps that result to account/profile; sign-out and
deletion map it to their own surfaces.

Sign-out first resolves a pending outbox by synchronization or by a completed,
verified data export followed by explicit discard confirmation. It then removes
account-owned local records, account binding, tokens and outbox. Storage
metadata, application settings and notification settings remain. Any deletion
failure leaves the device bound and exposes the failure.

The export is versioned canonical JSON over account-owned local records plus
the sync projection, with SHA-256 integrity over canonical bytes. Passwords,
tokens, transport envelopes and deletion proofs are excluded. Export is
available offline and is successful only after verified file handoff; opening
the system share surface alone is not success.

Local learning reset is not sign-out and is not remote account deletion.
Account deletion requires network, recent reauthentication and explicit scope
confirmation. Before the first remote destructive step it persists a minimal
durable intent containing operation ID, irreversible account ID hash, request
time and verified stage. Acceptance then revokes all sessions, removes live identity,
credential, profile, learning and sync data, verifies remote absence, then
removes account-owned local records. Failure remains retryable and cannot show
success. After restart, deletion resumes idempotently from the last verified
stage; an already-absent remote identity/session set still leads to verified
local cleanup before the intent is cleared. The public request path verifies
email possession without account enumeration.

A different previously bound device retains its local data while offline. On
authenticated reconnect, an account-deleted result bound to its stored account
causes the device to persist the same device-operational intent before local
cleanup, then idempotently remove credentials, binding, outbox and account-owned
records. The evidence may arrive during authenticated sync or from the
reauthentication endpoint while the device is `reauthenticationRequired`.
Success is the terminal `remoteAccountDeleted` result; the device does not ask
for another reauthentication of an account already known to be deleted. Cleanup
failure retries from the intent.

After verified deletion, live service retention is zero days. The minimal
deletion proof retains only request ID, irreversible account ID hash,
timestamps and result code for 30 days.

## Data-flow and threat review

| Boundary / threat | Required control | Explicit failure |
| --- | --- | --- |
| password capture | TLS command only; never persisted or logged; remote one-way verifier | reject command and retain no password |
| session tokens | access token in memory and authorization header only; refresh token in OS-protected storage and token-endpoint TLS body only | reauthentication required; no anonymous fallback |
| email link replay | distinct verification/recovery/public-deletion possession token; verified HTTPS universal link, single use, 30-minute expiry, rate limit | invalid, expired or used state |
| account enumeration | non-enumerating recovery/public deletion response | rate-limited or remote-failure state |
| local mutation loss | journal, materialize, verify, then enqueue | local recovery state; never report sync |
| stale remote writer | expected account revision and idempotent operation ID | deterministic replay or blocking conflict |
| immutable identity collision | stable ID plus fingerprint | blocking integrity conflict |
| two active sessions | one account-level active reference | explicit session choice; confirmed abandonment |
| production logging | closed exclusions for credentials, identity and learning payloads | bounded code/correlation only |
| pending journal at destructive boundary | recover, materialize, verify and clear before export/sign-out/delete | block and retain binding/data |
| deletion partial failure or restart | durable hashed intent, idempotent staged resume, verified remote and local absence | `deletionFailed`; no success claim |
| deleted account observed on another device | retain while offline; authenticated evidence on reconnect; intent-backed local cleanup | `remoteAccountDeleted`; never impossible reauthentication |
| provider/backup overclaim | mechanism and signed-build evidence required | public launch remains blocked |

Current MMKV is not described as encrypted. The contract does not claim secure
forensic erasure, protection from a compromised device, provider operation,
published policies or signed-binary verification.

## Surface map

The canonical contract maps account entry, register, verify, sign-in, forgot
password, reset password, expired-session reauthentication, account/profile,
data adoption, sync status, sign-out, in-app deletion and public deletion
request. Each surface includes its required editing/pending/progress/success and
specific failure states. `journalRecoveryFailure` is visible for export,
sign-out and deletion, while sync status exposes remote-account-deleted cleanup.
No route or placeholder component is created by this slice.

## Downstream implementation slices

### Task 3 — account lifecycle and adoption surfaces

- **Objective:** implement the declared lifecycle through one account
  application/service boundary and one route group.
- **Scope:** register, verify, sign-in, recover/reset, session expiry,
  reauthenticate, account/profile, adoption preview/confirmation, sync-status,
  sign-out and deletion; verified HTTPS link intake and transactional email
  port; provider adapter selected only after the interface tests pass.
- **Non-goals:** social/anonymous login, billing, account bypass, direct screen
  access to provider SDKs, a second learning repository.
- **Acceptance:** every canonical operation/state has one visible result;
  recovery/public deletion do not enumerate; credentials obey storage/logging
  rules; routes cannot enter Home before verified bootstrap/adoption; obsolete
  anonymous entry logic is removed.
- **Evidence:** application/service unit tests, route/state tests, provider
  sandbox lifecycle, link replay/expiry, two-platform register/sign-in/reset/
  reauthenticate/sign-out/delete flows and independent security QA.
- **Stop:** no approved account designs, provider cannot satisfy token/deletion
  boundaries, or email/universal-link ownership is unavailable.

### Task 7 — settings, data and privacy truth

- **Objective:** after Task 3, replace current local-only account copy and
  establish the public account/privacy/support disclosure foundation.
- **Scope:** account group, verified identity, sync projection, local/remote
  record explanation, export, reset/sign-out/deletion distinctions, retention,
  legal/privacy/support links and app identity.
- **Non-goals:** policy promises stronger than signed-binary evidence,
  analytics/billing, duplicate account settings.
- **Acceptance:** `Your data` and privacy copy distinguish local, acknowledged
  and pending state; destructive actions show exact scope and failures; public
  URLs match SDK/network inventory and store declarations; old no-account copy
  and unreachable Settings branches are removed.
- **Evidence:** settings matrix, copy inventory, network/SDK field audit,
  export/reset/sign-out/delete tests, public URL checks, store-declaration
  cross-check and screenshots on both platforms.
- **Stop:** public policy/support ownership is unavailable or provider/signed
  behaviour contradicts the planned disclosure.

### Task 8 — account-safe content reporting

- **Objective:** define the report data boundary before any content-report
  payload or network operation is implemented.
- **First scope:** extend the canonical contract with a closed report schema,
  field purposes, retention/deletion behavior and requirement-to-test mapping.
  Task 1 does not authorize item, release, category, free-text or identity fields
  for reporting. After Task 7, this same first scope updates the public
  disclosures before any report network path.
- **Non-goals:** learning-record mutation, silent item hiding, arbitrary
  telemetry, a separate auth client, question-bank copy or network work before
  the contract extension passes.
- **Acceptance:** the new closed schema declares every report field and purpose,
  authentication/authorization boundary, retention, deletion and log exclusion;
  parser/schema negative tests reject undeclared fields before implementation.
- **Evidence:** canonical contract diff, schema/parser tests, privacy review and
  requirement coverage. Service/offline/correction drills belong to the later
  implementation slice after this gate.
- **Stop:** no real intake owner/destination, privacy policy cannot cover free
  text, or the correction pipeline cannot retain immutable release context.

## Dead-code and obsolete-contract check

- No account/auth/network implementation exists, so there was no runtime path
  to delete in this documentation-only slice.
- Public-launch no-account assertions were retired from the product,
  architecture, navigation, data, storage, security and decision narrative.
- `ADR-003` remains intentionally as superseded historical evidence.
- `YourDataScreen` and the research Settings requirement still describe the
  currently shipped local-only runtime. Task 7 replaces those current-runtime
  statements after account/sync implementation instead of layering new copy on
  top of them.
- No compatibility reader, fallback, provider package, route, UI component,
  mock service, feature flag or parallel repository was added.

## Files inspected

- launch plan, launch surface inventory and competitive gap audit;
- canonical YAML, JSON Schema, parser, contract-change gate and tests;
- product definition, architecture, navigation, data, storage, security and
  privacy narratives; ADR-003 and the product-owner decision register;
- current root navigator/types, storage keys/repositories and `YourDataScreen`.

## Changed files

- `docs/canonical-product-contract.yaml` — normative account/data contract and
  requirement-to-test mappings.
- `docs/canonical-product-contract.schema.json` — closed schema for the new
  contract.
- `scripts/validateCanonicalProductContract.ts` — typed account contract,
  exact ordered-table validation, exact operation/surface mapping and
  exhaustive pre-bootstrap offline-transition rejection across in-progress,
  success and failure targets.
- `tests/canonicalProductContract.test.ts` — lifecycle, authority, adoption,
  sync, deletion, privacy and surface contract tests, including derived read
  models, cross-device deletion, intent authority, distinct possession tokens,
  link-expiry rejection and three pre-bootstrap offline negative cases.
- `docs/00-overview.md`, `01-product-definition.md`, `02-architecture.md`,
  `03-navigation-and-flows.md`, `04-data-model.md`,
  `08-storage-and-offline.md`, `09-security-and-privacy.md` — narrative
  alignment that separates the launch target from current runtime.
- `docs/adr/ADR-003-no-auth-in-mvp.md` and
  `docs/product-owner-decision-register.md` — historical retirement and
  contract-resolution record.
- `docs/launch-completion-plan.md` and
  `docs/release-candidate-closure.md` — record the independently accepted
  account contract and move active execution to Task 2.
- `docs/launch-surface-inventory.md` and
  `docs/launch-readiness-audit.md` — incrementally distinguish the now-defined
  account target from the still-unimplemented runtime. These four status and
  audit documents were pre-existing dirty or untracked owner work; Slices
  1A–1D changed only their account-contract alignment and did not claim
  ownership of the surrounding edits.
- this report — route/data/threat walkthrough, risks and downstream slices.

## Verification record

- `npm run typecheck` — pass.
- `node --import tsx --test tests/canonicalProductContract.test.ts tests/contractChangeGate.test.ts`
  — pass, 25/25 tests.
- `npm test` — pass, 407/407 tests.
- `npm run gate:contract-change -- HEAD` — pass,
  `CONTRACT_CHANGE_CHANGED_PATHS=17`.
- `git diff --check` — pass.
- Documentation contradiction search for independent progress/evidence records,
  overlong link validity, pre-bootstrap offline entry, cross-device deletion,
  journal failure visibility and Task 3→7→8 dependency — no unresolved contract
  contradiction.
- Fresh independent QA — `pass`; manual mutation checks confirmed exhaustive
  pre-bootstrap offline rejection and no regression in prior repair findings.

## Unverified areas and residual risks

- No auth/backend/email provider, hosting region, processor, sender domain,
  universal/app-link domain or public deletion URL has been selected.
- OS-protected token storage, TLS/pinning posture, remote authorization,
  password verifier parameters, rate limits, email delivery, deletion jobs,
  backup expiry and public policies have no implementation or production proof.
- Thirty-day retention maxima require owner/legal confirmation if applicable
  law or a selected provider cannot meet the stricter deletion target.
- Cross-device races, offline queue durability and signed Android/iOS behaviour
  remain implementation risks for Tasks 3 and 8.
