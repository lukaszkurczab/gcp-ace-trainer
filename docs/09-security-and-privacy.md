# 09 — Security, Privacy, Identity, and Operations

## Purpose and authority

This document owns the narrative security, privacy, identity, entitlement, observability, reporting, deletion, and disaster-recovery boundaries. Normative behavior is in `canonical-product-contract.yaml`. Provider configuration and current implementation are evidence, not product authority.

Patternly minimizes collection, fails closed at privacy boundaries, and states local, synchronized, billable, deleted, or pending status truthfully.

## Data boundary

Patternly may process only data required for:

- a guest installation and local learning dataset;
- verified identity and linked sign-in methods;
- versioned Terms acceptance and separate optional analytics consent;
- account-owned learning synchronization and rebuildable projections;
- Premium entitlement projection and purchase/restore support;
- immutable content-package authorization and integrity;
- bounded analytics/crash diagnostics after consent;
- learner-initiated content reports;
- account security, deletion, deletion proof, and disaster recovery.

Names, public profiles, advertising identifiers, contacts, location, photos, microphone, health data, and hidden learner profiling are not required for launch. No SDK, provider, log, or report may expand this boundary incidentally.

## Guest and account identity

A guest uses a local opaque installation identity. Patternly does not use Firebase Anonymous Authentication.

A Patternly account has one Firebase UID and one stable opaque Patternly account ID. The opaque account ID, never an email address, is used for RevenueCat identity and backend account references. Email is contact and credential data, not canonical commercial identity.

Launch sign-in methods are:

- email and password;
- Sign in with Apple;
- Sign in with Google;
- eight one-time recovery codes generated for the Patternly account.

Linking requires proof of control of the currently authenticated account and the new provider. Patternly never merges accounts automatically because email strings match. A collision enters an explicit sign-in-and-link flow. The last usable sign-in method cannot be unlinked.

Password or email changes require recent reauthentication and applicable verification. Provider and email action outcomes are non-enumerating.

## Verification, recovery, and sessions

Ordinary Firebase verification and recovery action codes use provider-controlled expiry and single-use behavior. Product copy does not promise an exact duration. The separate public account-deletion possession token is Patternly-controlled, single-use, and expires after exactly 30 minutes.

Recovery codes are displayed only at creation/regeneration, stored server-side only as salted hashes, consumed once, and invalidated on regeneration. A successful recovery code opens a narrow recovery session, requires establishment of a usable sign-in method, and revokes other account sessions.

Patternly supports sign-out on the current device and sign-out on all devices. Sensitive APIs verify revocation, recent authentication where required, approved client/environment, closed request schema, and account generation. Revocation is enforced server-side; removing a local token is not sufficient.

There is no manual support takeover without a usable linked method or unused recovery code.

## Terms and consent

Acceptance of a specific Terms version is required for account operations and is stored separately from optional analytics/crash consent. Refusing optional analytics does not block Free or Premium learning.

Consent state is explicit, versioned where necessary, changeable, and applied before an analytics or crash SDK can collect. A missing, corrupt, unknown, or not-yet-loaded consent state disables collection.

## Commercial and entitlement authority

The App Store and Google Play own transactions. RevenueCat normalizes store state. Patternly backend owns the account-bound Premium projection used to authorize server resources. A bounded device cache supports offline experience but is never authority for a paid package download.

RevenueCat uses the opaque Patternly account ID. Purchase requires a verified Patternly account. Guests cannot purchase, restore, or download Premium packages.

Premium is one entitlement across every Premium track, with one monthly and one annual product. There are no active-track slots, track tiers, release cooldowns, or account-local substitutions.

Cross-platform Premium follows the verified Patternly account and normalized store state. Purchase and restore conflicts produce explicit ownership/recovery outcomes. They never silently transfer learning data, merge accounts, or trust a local SDK result as backend authorization.

A last verified Premium projection may be used offline for up to seven days under the canonical grace policy. Known refund, revocation, expiry, account deletion, or conflict evidence takes precedence. A session started while entitled can finish safely; new Premium sessions require the current entitlement rule.

Downgrade removes access to new Premium sessions and downloads but never deletes or falsifies historical attempts, results, Activity, or progress. The product offers an eligible Free alternative when possible.

## Network and provider boundary

Only approved clients may send user data. Every remote request uses TLS, a closed schema, bounded payload, explicit timeout/retry policy, redacted logs, and environment-specific endpoints and credentials.

Public configuration is environment-driven and includes product origin, auth-action origin, redirect domain, Privacy, Terms, support, public deletion, iOS associated domain, Android host, and sender domain. Default Firebase domains are allowed only in development/sandbox. Professional domain and sender promotion are release inputs, not hard-coded product semantics.

Client applications never access Firestore directly. Firebase ID tokens are verified by the backend; Firestore rules remain deny-all for direct clients. Cloud Run mediates account, sync, entitlement, package, report, and deletion operations.

## Package authorization and integrity

Firestore contains bounded manifest/account metadata, Cloud Storage contains immutable whole-node package bytes, and Cloud Run authorizes identity and backend entitlement before issuing a short-lived signed URL.

Signed URLs are bearer capabilities and therefore short-lived, excluded from logs/analytics, and not persisted beyond download. Package checksum, immutable object identity/generation, schema, semantics, minimum app version, locale, and publication identity are verified before atomic activation. Per-question Firestore fetching, mutable published objects, and silent version substitution are prohibited.

## Analytics and crash reporting

Firebase Analytics and Crashlytics are allowed only behind the fail-closed consent/privacy gate. No raw per-event Firestore stream is permitted.

Analytics uses a closed event vocabulary and bounded enumerated properties. Forbidden fields include account ID, Firebase UID, email, tokens, recovery codes, free-form prompt/response/feedback, full content text, signed URLs, package bytes, journal payloads, and stable identifiers that enable unintended profiling.

Crash reports are sanitized before SDK submission. User-authored text, learning responses, content bodies, credentials, request headers, and full repository records are never attached. Changing consent stops future collection and handles queued provider data according to the disclosed policy.

## Content reports

A learner may report content using a closed category set and optional bounded description. Automatic context is limited to technical identifiers and versions necessary to locate the content and reproduce the issue.

By default a report is not linked to the Patternly account and does not attach the learner response, account ID, email, full prompt, answer options, explanation, or feedback. Account linking and contact details require separate explicit opt-in, with the exact attachment previewed before submission.

Offline reports have visible queued/retrying/failed/sent states. The UI confirms submission only after server acknowledgement. Server records use bounded retention, closed admin states, access control, audit events, and deletion/de-identification rules. The content repository owns the report-to-correction-to-release workflow; reports never mutate published packages directly.

## Logging and secrets

Production logs use structured allow-listed codes. They do not contain passwords, tokens, recovery codes, raw authorization headers, emails, signed URLs, learning responses, complete content, package bytes, journal payloads, or repository dumps.

Secrets and service credentials remain outside source, bundles, screenshots, reports, and test fixtures. Environment separation prevents development/sandbox credentials and endpoints from being promoted implicitly.

## Device security and backup

MMKV is not described as encrypted unless key creation, protection, restart, loss, reset, and supported-device behavior are implemented and verified. Local-first storage does not protect against an unlocked, rooted/jailbroken, or forensically inspected device.

Canonical learning data, credentials, and package caches are excluded from iCloud/Android backup and device transfer. Account synchronization is the only product continuity mechanism.

Production Firestore uses a seven-day PITR target. PITR is disaster recovery, not user account recovery. Restore requires an authorized runbook, sanitized sandbox drill, audit trail, and reconciliation against deletion tombstones/proofs before any live promotion. A restore cannot recreate a deleted account, credential, entitlement association, report linkage, or account data. No long-term scheduled export is part of launch.

## Account deletion and subscriptions

The account surface shows verified entitlement status and a truthful Manage subscription action. Deleting a Patternly account is independent of store cancellation and is never described as cancelling or refunding a subscription.

The learner can choose immediate deletion. Scheduled deletion at the end of a paid period may be offered only where the verified store/provider state makes it technically supportable; immediate deletion remains available.

Deletion covers Patternly identity, linked methods and recovery codes, account dataset, profile, consent, processor association, entitlement projection, report linkage where applicable, server sessions, and bound-device cleanup evidence. Processor transaction records governed by the store/provider and legal obligations are disclosed rather than falsely claimed deleted.

The public deletion flow verifies mailbox possession using the custom 30-minute token and returns non-enumerating outcomes. Deletion revokes sessions, writes tombstone/proof state, and prevents PITR or a stale device from resurrecting the account.

Local reset, sign-out, store subscription management, and Patternly account deletion remain distinct actions.

## Privacy communication

Privacy, Terms, support, store declarations, and in-product copy must state:

- what remains only on the device and what synchronizes;
- that active sessions and drafts never synchronize;
- what guest adoption will preserve, combine, or block before confirmation;
- when Premium is verified, cached, expired, revoked, or in offline grace;
- what analytics/crash collection is enabled by consent;
- exactly what a content report will attach;
- the separation between account deletion and subscription cancellation/refund;
- the PITR disaster-recovery boundary and no-resurrection protection;
- the actual supported platforms and release configuration.

No implementation is described as encrypted, anonymous, deleted, restored, synchronized, endorsed, or provider-verified without evidence.

## Verification obligations

Security and privacy verification includes identity linking collisions, last-method protection, recent reauthentication, revocation, recovery-code hashing/single use/regeneration, non-enumeration, guest adoption failure injection, sync idempotency, package authorization and signed-URL redaction, consent fail-closed behavior, analytics/report forbidden fields, deletion/subscription truth, tombstone restore reconciliation, backup exclusion, environment isolation, direct-Firestore denial, secret scanning, and production-log inspection.

Missing evidence is an explicit release blocker; it is not converted into a silent fallback or optimistic claim.

## Required recovery rule

Obsolete auth paths, duplicate account models, direct Firestore clients, local entitlement authority, raw telemetry streams, mutable package paths, compatibility stores, and restoration paths capable of account resurrection are deleted rather than retained behind flags.
