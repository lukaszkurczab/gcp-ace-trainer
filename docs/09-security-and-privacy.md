# 09 — Security and Privacy

## Purpose

Patternly uses a local-first security and privacy model.

The product stores only the data required to run learning sessions, preserve committed evidence, support review and recommendations, recover the one active session, and retain user settings.

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
- evidence and progress aggregates;
- explained recommendation inputs;
- durable mutation journals and recovery metadata;
- exact content, configuration, and profile references required for resume.

Patternly does not require:

- user accounts;
- names, email addresses, or identity profiles;
- authentication credentials;
- cloud synchronization;
- remote learning-history storage;
- confidence collection;
- synthetic readiness, retention, or mastery metrics;
- location, contacts, photos, microphone, camera, health, or advertising identifiers.

A later feature that requires additional personal data, device permission, network transmission, account identity, telemetry, export, import, or synchronization requires a separate approved data and security contract.

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

Family-owned progress records must remain limited to evidence required for a concrete training decision.

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

## Network boundary

The canonical product does not require network access for learning sessions, local history, review, progress, or resume.

The current target does not transmit learning records, answers, scores, review evidence, simulation drafts, or recommendations to a Patternly backend.

Remote analytics, crash-report uploads, telemetry, content delivery, account services, backups, or synchronization are not implicitly permitted by the absence of an account.

Before any such service is enabled, its contract must define:

- exact data fields transmitted;
- destination and processor;
- purpose;
- retention;
- failure behaviour;
- offline behaviour;
- user disclosure and consent where required;
- redaction;
- deletion;
- whether learning content or responses leave the device;
- security review and tests.

A third-party SDK must not be added merely for convenience if it collects identifiers or application data outside the approved boundary.

## Logging and diagnostics

Production logs must not contain:

- learner responses;
- answer option text;
- complete prompts or explanations;
- simulation drafts;
- attempt payloads;
- review evidence payloads;
- complete progress records;
- MMKV values;
- mutation-journal write plans;
- encryption keys;
- internal source URLs containing credentials;
- stack traces containing persisted user data.

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

The current policy excludes the canonical storage root from Android cloud backup and device transfer, and marks the iOS MMKV directory as excluded from automatic backup before storage initialization. Patternly offers no backup or restore path for learning records. This is an application policy, not a claim that the operating system, a compromised device, or forensic tooling can never copy local data.

## Reset and deletion

A user-initiated learning-state reset logically deletes canonical local learning records from the Patternly namespace, including:

- active-session state;
- simulation drafts;
- completed-session history;
- attempts;
- review queue entries;
- progress and evidence records;
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

## Data loss and recovery communication

Patternly has no cloud synchronization or account-based recovery in the current product contract.

Therefore:

- uninstalling the application may remove local learning data;
- loss or replacement of the device may lose learning data;
- a reset cannot be undone by Patternly;
- an incompatible active session may need to be abandoned;
- there is no cross-device history restoration contract;
- there is no export or import contract in the current recovery scope.

User-facing copy must not imply that local learning history is backed up, synchronized, or recoverable unless a verified platform mechanism or future product contract provides it.

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

- learning data is stored locally under the current product contract;
- no Patternly account or cloud synchronization exists;
- local storage is not described as encrypted unless verified;
- reset removes canonical learning data from the application;
- reset may not erase external operating-system backups;
- uninstall, reset, device loss, or storage corruption may cause permanent data loss;
- certification results are practice diagnostics, not official records;
- future data transmission features require an updated disclosure.

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
