# 09 — Security and Privacy

> This document separates the implemented local-only build from the
> account-enabled public-launch target. The normative target is
> `canonical-product-contract.yaml`. Account, networking, remote storage,
> email/link delivery, sync and deletion mechanisms are not implemented or
> provider-verified yet and must not be described as current build behaviour.

## Purpose

Patternly uses a local-first security and privacy model.

The product stores only the data required to authenticate a launch account, run learning sessions, preserve committed evidence, support review and recommendations, recover the one active session, synchronize the account dataset and retain user settings.

Local storage reduces network exposure and avoids account-linked profiling. It does not by itself guarantee encryption, protection from a compromised device, or irrecoverable deletion.

Security claims must describe mechanisms that are explicitly configured, tested, and supported by the current application build.

## Data boundary

Patternly may store the following canonical local data:

- application settings;
- the active-session reference;
- active and completed session records;
- immutable attempts and deterministic results;
- simulation drafts;
- review queue entries;
- evidence and progress read projections derived from attempts, results and
  review entries, never independent writable records;
- explained recommendation inputs;
- durable mutation journals and recovery metadata;
- exact content, configuration, and profile references required for resume.
- a verified account binding, sync revision metadata and ordered pending
  operation envelopes in the account-enabled target.

The public-launch remote service may store:

- a normalized email and opaque account identifier;
- a one-way password verifier and revocable session records;
- verification, recovery and distinct public-deletion possession tokens with
  single-use expiry;
- one revisioned account dataset containing the canonical account-owned
  learning records and content references;
- bounded sync operation identity, revision and deletion-verification records.

Patternly does not require:

- names or public identity profiles;
- confidence collection;
- synthetic readiness, retention, or mastery metrics;
- location, contacts, photos, microphone, camera, health, or advertising identifiers.

A later feature that requires additional personal data, device permission,
telemetry, analytics, billing, social login, remote content delivery or a field
outside the canonical account contract requires a separate approved data and
security contract.

It must not be introduced as an incidental implementation detail.

## Data minimization

Persist only fields required by an approved product, learning, persistence, or recovery contract.

Do not store:

- duplicate copies of static bundled content;
- obsolete item or explanation versions;
- raw UI component state that has no resume requirement;
- speculative future fields;
- unused device identifiers;
- free-form diagnostic data when structured codes are sufficient;
- complete journal or repository payloads in production logs;
- hidden behavioural profiles beyond documented learning evidence.

Derived progress projections must remain limited to evidence required for a
concrete training decision and must not become separately stored or synchronized
profiles.

Do not derive or retain additional personal classifications from learning performance.

## Local storage boundary

MMKV is an infrastructure boundary, not a domain dependency.

One infrastructure-owned client and one canonical repository set own local persistence.

No screen, UI component, family runtime, track instance, content module, or shared-domain module accesses MMKV directly.

Old local records, keys, APIs, AsyncStorage paths, Cloud write-through, translators, and compatibility readers are deleted rather than preserved.

Historical pre-production learning state is not migrated or interpreted.

If an obsolete record cannot be represented without changing or obscuring its meaning, it is deleted.

## Confidentiality and encryption

Patternly must not describe local data as encrypted unless encryption and key management are explicitly configured and verified in the supported application builds.

The use of MMKV alone is not an encryption claim.

Before enabling an encryption claim, the implementation contract must define and test:

- whether the MMKV instance is encrypted;
- how the encryption key is generated;
- where the key is stored;
- whether the key is hardware- or OS-protected where supported;
- key availability after restart;
- key loss behaviour;
- reset behaviour;
- development and test-key separation;
- behaviour on unsupported or compromised devices.

Encryption keys must not be:

- hard-coded in source;
- committed to the repository;
- included in bundled static content;
- written to logs;
- derived from predictable public constants;
- reused across unrelated application environments without an approved policy.

If encryption is not enabled, product copy and privacy documentation must state only that learning data is stored locally on the device.

## Threat model

The current security model is intended to protect against:

- accidental network transmission by the product;
- unnecessary collection of personal data;
- parallel or obsolete storage paths;
- silent substitution of missing records;
- incomplete or duplicated committed outcomes;
- accidental disclosure through production logs;
- unauthorized data access through unrelated application modules;
- incorrect claims of official certification status.

The account-enabled target additionally protects against:

- account enumeration through recovery and public deletion requests;
- replay of used or expired verification, recovery or public-deletion links;
- disclosure of raw passwords or tokens in application persistence or logs;
- stale remote overwrites and duplicate sync operations;
- silent data adoption, merge or active-session loss;
- continued remote access after verified account deletion.

The current product does not claim to protect local data against an attacker who has:

- an unlocked device;
- operating-system-level access;
- root or jailbreak access;
- access to application backups;
- access to application debug tooling;
- physical forensic access to device storage.

A compromised local device may permit inspection or modification of local records.

Patternly learning results are therefore personal practice evidence, not tamper-proof credentials, official examination records, or independently verifiable proof of competence.

## Integrity and recovery

The durable mutation journal, revisions, fingerprints, and verification checks protect application-level consistency and idempotent recovery.

They are designed to prevent:

- duplicated attempts;
- duplicated review mutations;
- partial session completion;
- inconsistent active-session state;
- divergent outcomes after retry;
- presentation of an unverified completed result.

These mechanisms provide logical integrity within the application contract.

They do not constitute:

- cryptographic authentication of the user;
- anti-cheat protection;
- protection from malicious local record modification;
- proof that a result was produced on an uncompromised device;
- an official certification record.

Unexpected record fingerprints, stale revisions, conflicting materialization, or corrupt canonical records produce explicit blocking errors. Runtime does not repair them heuristically.

## Network and credential boundary

Ordinary learning remains local-first after one verified online account
bootstrap. Network access is required for registration, verification, sign-in,
recovery/reset, reauthentication, remote restore and account deletion.

The authorized field groups are closed in `canonical-product-contract.yaml`:

- identity commands transmit normalized email, the password only for the
  active credential command, and the distinct verification, recovery or public
  deletion possession token where needed;
- access tokens are received in an authenticated TLS response and sent only in
  the authorization bearer header; refresh tokens are sent only to the token
  endpoint in an authenticated TLS request body;
- account calls transmit opaque account/session identity, verification state
  and expected account revision;
- sync transmits record type/identity/revision, content references, canonical
  learning payload and operation fingerprint;
- operational metadata is limited to request identity, bounded error code and
  client timestamp.

Transport must be authenticated TLS. The app never persists a password. The
remote service stores only a one-way verifier. Access tokens remain in memory;
refresh tokens use OS-protected credential storage. Verification, recovery and
public-deletion possession tokens are never persisted. Tokens, normalized
email and canonical learning payloads are excluded from logs.

Before export, sign-out or account deletion, an unresolved mutation journal
must complete recovery, materialization, verification and clear. Failure blocks
the operation as visible `journalRecoveryFailure` without deleting the binding
or verified learner data. Account
deletion persists a minimal hashed durable intent before its first remote
destructive step, resumes idempotently from its last verified stage after
restart and completes verified local cleanup even when the remote identity or
sessions are already absent.

The deletion intent is a device-operational, never-synchronized cleanup
checkpoint and has no authority over learning data. A previously bound offline
device retains local data until it reconnects because no provider-neutral
contract can prove remote deletion while offline. Authenticated account-deleted
evidence on reconnect persists that intent before idempotent local cleanup,
ends in the visible remote-account-deleted result and must not enter an
impossible reauthentication flow.

The current build transmits none of these account fields because the service
does not exist yet. Remote analytics, crash uploads, telemetry, billing,
content delivery and arbitrary third-party SDK collection remain unauthorized.

A third-party SDK must not be added merely for convenience if it collects identifiers or application data outside the approved boundary.

## Logging and diagnostics

Production logs must not contain:

- normalized email addresses;
- passwords, access tokens, refresh tokens, verification tokens, recovery
  tokens or public-deletion possession tokens;

- learner responses;
- answer option text;
- complete prompts or explanations;
- simulation drafts;
- attempt payloads;
- review evidence payloads;
- complete progress projections;
- MMKV values;
- mutation-journal write plans;
- encryption keys;
- internal source URLs containing credentials;
- stack traces containing persisted user data.
- data export payloads.

Diagnostics may use:

- bounded error codes;
- operation names;
- non-sensitive schema versions;
- redacted record types;
- safe correlation IDs;
- counts that cannot reconstruct learning content or responses.

Identifiers should be included only when necessary for local diagnosis and must not be transmitted remotely without an approved telemetry contract.

Developer-only diagnostics must be disabled or redacted in production builds.

The canonical learner-visible diagnostic projection is `src/application/operationalDiagnostics.ts`. It emits only an action-specific sentence and a finite operational code; it never carries a caught error message, session ID, storage key, answer, draft, or content payload. `npm run validate:runtime-privacy-boundary` rejects production source that introduces raw operational messages, console diagnostics, or a network client, and `qa:static` runs that gate.

## Device permissions

Patternly requests no device permission unless an approved, implemented feature requires it.

A new permission requires:

- an explicit product use case;
- least-privilege scope;
- user-facing explanation;
- denial behaviour;
- revocation behaviour;
- platform testing;
- confirmation that denial does not silently produce substitute learning data.

Learning sessions, review, progress, and certification simulation must not require unrelated device permissions.

## Platform backup and device transfer

The application must explicitly decide and verify platform backup behaviour for canonical local learning data.

Product documentation must not assume that “local-only” means “never copied by the operating system.”

Before release, the implementation and privacy contract must state whether canonical data:

- is included in system backups;
- can move to another device through platform restore;
- is excluded from backup;
- remains usable after restore;
- is rejected after restore because key, schema, profile, or content requirements cannot be resolved.

Backup behaviour must be consistent with encryption-key management and resume semantics.

The current policy excludes the canonical storage root from Android cloud backup and device transfer, and marks the iOS MMKV directory as excluded from automatic backup before storage initialization. The current build offers no restore path; the launch target restores only remotely acknowledged account data through the application service. This is an application policy, not a claim that the operating system, a compromised device, or forensic tooling can never copy local data.

## Reset and deletion

A user-initiated learning-state reset logically deletes canonical local learning records from the Patternly namespace, including:

- active-session state;
- simulation drafts;
- completed-session history;
- attempts;
- review queue entries;
- source attempts, results and review entries from which progress and evidence
  projections are derived;
- pending learning-state mutations where the reset contract safely permits their removal.

Bundled static content is not user data and remains part of the application.

Non-learning settings may remain unless the user selects a separately defined full local reset.

Reset is journaled and verified according to the storage contract. It is not reported as complete after partial deletion.

Patternly may claim logical application-level deletion after verification.

It must not claim:

- forensic secure erasure;
- guaranteed immediate destruction of every flash-memory remnant;
- deletion from an operating-system backup that the application cannot control;
- deletion from external diagnostic services unless those services have an approved deletion contract.

Pre-production recovery deletion and user-initiated reset are separate concepts:

- recovery deletion removes obsolete unsupported schemas and keys;
- user reset removes supported canonical learning state.

Neither operation creates a migration or compatibility path.

Account deletion is separate from local learning reset. It requires network,
recent reauthentication and explicit confirmation of the scope. The accepted
request revokes every account session, deletes identity, credential, profile,
learning and sync-operation data from the live service, verifies that deletion,
and only then deletes account-owned local records. A remote or local
verification failure remains `deletionFailed` with retry; it is never presented
as success.

The public web request path verifies possession of the email address without
revealing whether an account exists. Live service data has zero retention days
after verified deletion. Encrypted backups may retain an inaccessible copy for
at most 30 days and must never restore a deleted account into the live service.
A minimal deletion proof containing only request identity, irreversible account
ID hash, request/completion timestamps and result code remains for 30 days,
then is removed. These are target requirements; provider retention and deletion
jobs still require implementation and production verification.

## Data loss and recovery communication

The current build still has no account recovery or cross-device restoration;
uninstall, reset, device loss and corruption can permanently remove its local
learning data.

The public-launch target changes that product boundary only after verified
sync exists. A bound account may restore the last remotely acknowledged
dataset. Offline-pending mutations remain only on their originating device
until acknowledged, so device loss can still lose those pending changes.
Platform backup remains excluded. An incompatible content/profile version may
still block resume, and selecting one of two divergent active sessions requires
explicit confirmed abandonment of the other draft.

User-facing copy must show the last successful sync time, pending count,
conflict or failure. It must not use “backed up” or “synced” for local-only or
pending data.

## Content provenance and integrity

Active content must be:

- original or lawfully used;
- structurally validated;
- factually reviewed;
- audited in canonical source and released with technical evidence;
- identified by a stable manifest and content version.

The active content version identifies one complete active bank. Runtime does not reconstruct obsolete explanations or map inactive content into a current session.

Bundled content must not contain:

- application secrets;
- private keys;
- credentials;
- confidential exam material;
- exam dumps;
- unlawfully copied questions;
- hidden personal data.

Content validation and review protect educational correctness and legal provenance. They do not make Patternly an official certification source.

A future remote-content mechanism requires an additional security contract for authenticity, integrity, activation, rollback, cache isolation, and failure handling.

## Certification profile provenance

Each certification track instance owns a versioned `ExamExperienceProfile`.

The profile retains:

- stable profile identity;
- profile version;
- official public `sourceUrl`;
- `sourceCheckedAt`;
- optional official guide version;
- documented simulation behaviour;
- provenance necessary to audit profile changes.

Only official public sources may define a claim of faithful certification simulation behaviour.

A profile rule must not be:

- inferred from memory;
- copied from another certification;
- guessed from the current UI;
- supplied by an unofficial exam dump;
- retained after the official source contradicts it.

If a material official rule is missing, ambiguous, obsolete, or unsupported, the track cannot claim faithful simulation.

Profile provenance demonstrates the source of the implemented behaviour. It does not imply provider endorsement, official software status, or official scoring.

## Product safety

Missing content, unsupported payloads, unknown IDs, unresolved profiles, content-version mismatches, journal conflicts, corrupt records, and storage failures are explicit states.

Patternly does not respond by creating:

- a default topic;
- a default item;
- a guessed answer;
- a substitute result;
- a fabricated review entry;
- a generic explanation;
- a silent empty history;
- an apparently successful session.

Error messages expose only information needed for a safe user action. They do not expose persisted payloads, secret material, stack traces, or internal storage structure in ordinary product UI.

A failure is actionable evidence that a contract or implementation path remains unresolved. It must not be hidden through a fallback to obsolete data.

## Communication and affiliation

Patternly is independent.

Certification provider names and trademarks identify subject matter only.

Patternly does not claim:

- affiliation;
- endorsement;
- provider approval;
- official exam content;
- official scores;
- official pass or fail;
- official certification status;
- guaranteed examination or interview outcomes.

Diagnostic results are Patternly learning evidence.

Any internal practice threshold is:

- explicitly labelled as Patternly-defined;
- visually and verbally distinct from an official result;
- not represented as eligibility, readiness, certification, or a guaranteed outcome.

Algorithms `Interview Simulation` is also Patternly-defined and does not claim to reproduce an official company interview or prove interview readiness.

## User-facing privacy communication

Privacy and settings surfaces must state clearly:

- whether the user is viewing the current local-only build or the verified
  account-enabled release;
- which learning data is local, remotely acknowledged or still pending;
- the verified account identity, last successful sync time, pending count and
  any blocking conflict/failure;
- local storage is not described as encrypted unless verified;
- reset removes canonical learning data from the application;
- local reset is distinct from sign-out and account deletion;
- reset may not erase external operating-system backups;
- uninstall, reset, device loss, or storage corruption may lose local and
  offline-pending data;
- account deletion scope, 30-day backup maximum and 30-day minimal proof
  retention;
- certification results are practice diagnostics, not official records;
- account mechanisms and data transmission are not claimed in a build until
  provider and signed-binary verification pass.

Copy must distinguish current verified behaviour from planned or possible future functionality.

## Security validation

Pre-release verification includes:

- one MMKV infrastructure owner;
- absence of AsyncStorage and old storage reads;
- absence of dual writes and compatibility repositories;
- repository validation and explicit corruption handling;
- journal idempotency and conflict handling;
- reset completeness;
- production-log redaction;
- absence of hard-coded keys and secrets;
- permission inventory;
- network dependency inventory;
- normalized-email, password and token persistence/logging checks;
- non-enumerating recovery and public-deletion responses;
- verification/recovery link expiry, one-use and replay checks;
- local/remote adoption, stale revision, immutable collision and divergent
  active-session tests;
- sign-out with pending outbox and export/discard evidence;
- remote deletion, session revocation, local deletion, backup exclusion and
  retention-job evidence;
- platform backup configuration review;
- certification-profile provenance validation;
- content legality and secret scanning;
- user-facing privacy-copy review.

A successful functional test suite alone is not sufficient evidence of security or privacy compliance.

## Required recovery rule

If an existing record, model, flow, key, API, module, SDK, or diagnostic path cannot move into the canonical structure without preserving obsolete or unsafe semantics, delete it.

Do not create:

- old-schema readers;
- historical translators;
- compatibility adapters;
- dual storage paths;
- hidden network transmission;
- generic recovery defaults;
- unreviewed telemetry;
- silent record repair;
- misleading encryption or privacy claims.

Backward compatibility is not required for pre-production storage or learning history.

An explicit failure is safer than silently producing incorrect learning evidence or transmitting data outside the approved boundary.
