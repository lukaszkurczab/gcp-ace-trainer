# 08 — Storage and Offline

## Target

Patternly is offline-first.

MMKV is the only persistence engine for canonical local application state. Infrastructure creates one MMKV client, and repository implementations are the only read and write boundary.

No UI module, screen, family runtime, track instance, content bank, or shared-domain module imports MMKV directly.

Static content is bundled with the application and identified by an active `contentVersion`. User learning data is stored as local canonical state.

Canonical learning data is excluded from automatic platform backup and device-transfer restore. Android excludes the app data root in both legacy backup rules and Android 12+ cloud/D2D extraction rules. Before React Native initializes on iOS, the app creates the MMKV `Documents/mmkv` directory and marks it `isExcludedFromBackup`; failure to establish that policy stops startup. Patternly offers no backup or restore path for learning records.

The target does not include:

- remote content delivery;
- content synchronization;
- user accounts;
- cloud storage;
- Cloud write-through;
- AsyncStorage reads or writes;
- historical-record migration;
- record translation;
- old-schema fallback reads;
- historical item or explanation reconstruction.

Introducing remote content in the future requires a separate approved contract covering source authenticity, manifest signing, version activation, rollback, active-session compatibility, offline availability, and failure behaviour. It is not part of the current architecture.

## Native runtime prerequisite

The repository-pinned `react-native-mmkv` V4 dependency is a native Nitro Module and requires the compatible pinned `react-native-nitro-modules` dependency.

Expo Go cannot supply this native dependency to an already-installed client. Development and testing therefore use an iOS or Android development build containing the pinned native modules.

A new native build is required when:

- `react-native-mmkv` is first added;
- its native version changes;
- `react-native-nitro-modules` changes;
- relevant native configuration changes.

Ordinary JavaScript or TypeScript changes do not by themselves require rebuilding the native client.

The exact dependency versions belong to `package.json`, the lockfile, and the current implementation verification record. This document defines their architectural use rather than treating one package version as a permanent product contract.

## Canonical local records

The canonical repository set owns:

- storage metadata and schema identity;
- application settings;
- the active-session reference;
- active and completed sessions;
- immutable attempts;
- review queue entries;
- family-neutral evidence records;
- family-owned progress records;
- simulation drafts;
- the single pending mutation journal.

Static content is not copied into user persistence.

Canonical records reference bundled content by stable track, content-version, item, and occurrence identities.

A `contentVersion` identifies one complete active content bank. It does not authorize runtime access to historical banks.

## Storage namespace and ownership

All canonical records use one Patternly-owned namespace and one schema version.

Old namespaces, keys, APIs, and repository implementations are deleted. They are not read, migrated, translated, or retained as fallback paths.

Repository contracts operate on validated canonical records. Repository implementations:

- serialize and deserialize canonical records;
- validate schema and record identity;
- return explicit success or failure results;
- support deterministic revision checks;
- support journal materialization and verification;
- never interpret item correctness or taxonomy semantics.

Family runtimes validate family-owned payloads before application use cases pass them to repositories.

## Application bootstrap

Application bootstrap follows this order:

```txt
initialize the one MMKV client
→ open canonical repositories
→ validate storage metadata and schema identity
→ recover and verify the single pending mutation journal, if present
→ resolve and validate bundled track manifests and active content banks
→ load the active-session reference, if present
→ load and validate the owning session and simulation draft, if applicable
→ resolve the exact track, content version, family configuration, and profile
→ enter a ready, unavailable, or blocking recovery state
```

A pending journal is self-contained. Its recovery must not depend on historical content, obsolete runtime code, or the current learner-visible explanation.

Normal learning navigation is not enabled while storage initialization or journal recovery remains unresolved.

After bootstrap:

- a global storage or journal failure produces a root recovery state;
- an invalid track bank makes that track explicitly unavailable;
- an active-session content or profile mismatch produces an explicit resume-unavailable state;
- an incompatible active session may be deliberately abandoned where the application contract permits it;
- another track or mode is never selected silently as a substitute.

Committed attempts remain canonical evidence when an incompatible active session is abandoned.

## One active session

At most one canonical session is active across all tracks and families.

The active-session reference and referenced active session must agree. Missing, duplicated, or conflicting active-session state is an explicit storage error.

A session is persisted and verified before its first item appears.

The immutable session plan includes:

- track and family identity;
- mode and configuration snapshot;
- requested and actual length;
- occurrence-keyed item order;
- occurrence-keyed option order;
- active content version;
- required profile or configuration version;
- creation time.

Runtime must not regenerate item order, option order, or configuration during resume.

## Immediate-feedback practice persistence

In immediate-feedback practice:

- the current unsubmitted selection is ephemeral UI state;
- it is not written to storage;
- changing the selection creates no attempt or review mutation;
- foreground practice time is persisted according to the canonical timer-checkpoint policy.

A practice submit follows:

```txt
validate and freeze the response
→ build the deterministic attempt, session, evidence, and review outcome
→ build the complete immutable write plan
→ persist the durable mutation journal
→ permit authored feedback
→ materialize all canonical writes idempotently
→ verify every intended final record
→ clear the journal
→ permit item advance or completed-session navigation
```

No feedback appears before journal durability.

The next item, completed summary, or other state that depends on materialized records is not exposed until materialization has been verified.

If materialization fails after feedback becomes visible:

- the deterministic submitted outcome remains logically committed in the journal;
- the response cannot be edited or submitted again;
- item advance remains blocked;
- the UI shows an explicit recoverable commit-pending state;
- retry and startup recovery replay the same write plan.

The UI must not describe such a state as an ordinary failure that permits another answer.

## Simulation draft contract

A simulation uses one canonical active session and one optional session-owned draft record.

The draft is not:

- a second session;
- a separate history;
- an independent attempt store;
- a family-specific persistence subsystem;
- a parallel source of truth.

The immutable session owns the plan and configuration. The draft owns mutable, resumable simulation state permitted by the applicable family configuration or certification profile.

A simulation draft is revisioned and may contain:

- occurrence-keyed editable responses;
- current occurrence;
- profile-permitted flags;
- navigator state;
- section state;
- foreground-timer state where applicable;
- other explicitly approved editable simulation state.

Each durable draft mutation increments its revision.

A draft update is accepted only when its expected previous revision matches the canonical stored revision. Stale updates fail explicitly.

The UI may show a response or navigation state as saved only after the new draft revision is durably written and validated.

A failed draft save preserves the last verified durable revision. It creates no attempt, score, feedback, review mutation, or partial saved state.

## Algorithms Interview Simulation persistence

Algorithms simulation persists the occurrence plan and timer behavior resolved from the canonical product contract. This storage document does not restate its count, duration, formula, checkpoint cadence, or foreground policy.

The Algorithms draft persists:

- editable responses by occurrence ID;
- the current occurrence;
- canonical foreground-timer state;
- draft revision and update time.

Algorithms flags are not persisted or rendered unless the approved Algorithms simulation profile is explicitly extended with a flagging policy.

Draft changes create no:

- immutable attempt;
- score;
- correctness state;
- instructional feedback;
- review mutation.

Manual submission or foreground-time exhaustion freezes one exact durable draft revision and starts finalization.

Unanswered occurrences:

- receive zero points;
- remain separate completed-session diagnostics;
- create no fabricated response;
- create no ordinary item-level attempt;
- do not automatically create content-specific review.

Their occurrence and content references remain stored in the completed-session result after the draft is deleted.

## Certification Exam Simulation persistence

Certification `Exam Simulation` uses the owning track instance’s exact versioned `ExamExperienceProfile`.

The immutable session stores:

- the profile identity and version;
- the absolute deadline;
- profile-derived session configuration;
- the fixed occurrence and option order.

The certification draft stores only profile-permitted mutable state, including as applicable:

- occurrence-keyed answers;
- current occurrence;
- flags;
- navigator state;
- current section;
- submitted-section state;
- answer-change state.

If the profile does not permit a feature, its corresponding draft state must not exist.

Returning before the absolute deadline resumes the last verified durable draft.

Returning after the deadline freezes that draft and starts idempotent automatic finalization.

Unanswered occurrences remain in the completed-session result and count according to the certification scoring contract. Runtime does not fabricate an answer in order to create an ordinary attempt.

Post-session review may display unanswered items from the completed-session result. Persistent review is created only according to the explicit Certification family review policy.

## Foreground timer persistence

Foreground timers use a checkpointed canonical state.

The persisted timer records at least:

- accumulated durable foreground milliseconds;
- checkpoint revision or sequence;
- last checkpoint time;
- whether the timer was running when checkpointed.

Runtime may add a current in-memory segment measured with a monotonic clock while the application is active.

A checkpoint is written:

- on defined periodic intervals;
- before or during a response or draft save where required;
- when the application leaves the foreground;
- before manual simulation finalization;
- when the timer reaches zero.

After force-close, recovery resumes from the last verified durable checkpoint. It does not infer active time from wall-clock time while the application was closed.

The implementation contract defines and tests the checkpoint interval and maximum accepted timer drift. The product must not claim precision beyond that bound.

## Mutation coordination

One application-level mutation coordinator serializes canonical writes.

At most one durable mutation journal exists at a time.

While a journal is pending:

- another journaled command cannot begin;
- an operation cannot overwrite the pending journal;
- recovery or materialization must complete first;
- unsafe navigation and mutations remain disabled.

Single-record simulation draft updates do not require a multi-record journal, but they must use:

- expected revision;
- deterministic validation;
- complete-record replacement;
- durable write confirmation;
- explicit failure.

Draft updates cannot execute after finalization has frozen the relevant draft revision.

## Durable mutation journal

The durable journal stores a complete immutable write plan for one logical command.

Supported operations are defined by the canonical data model. They include practice submission, session abandonment, simulation finalization, review mutation, and learning-state reset where approved.

The journal contains enough information to complete materialization without:

- rereading obsolete storage;
- recalculating scoring;
- resolving historical content;
- invoking a different family-runtime decision;
- reading an editable draft after its freeze boundary.

The journal provides logical atomicity and crash-consistent recovery. It does not claim that MMKV physically commits all target keys in one native multi-key transaction.

## Canonical serialization and fingerprints

Journal, command, attempt, and write-plan identities use SHA-256 over one versioned canonical byte representation.

The canonical serializer:

- accepts only the approved JSON-compatible value domain;
- sorts object keys deterministically;
- preserves array order;
- encodes text as UTF-8;
- rejects `undefined`, non-finite numbers, functions, symbols, and unsupported native values;
- normalizes no family payload implicitly;
- includes its serializer version in the fingerprinted envelope.

Ad hoc `JSON.stringify` output from arbitrary objects is not a canonical identity contract.

The command fingerprint identifies the logical command.

The plan fingerprint identifies the exact complete write set.

Changing any intended write, expected revision, target key, deletion, attempt identity, review mutation, completed result, or draft revision changes the plan fingerprint.

## Journal validation

Before the journal becomes durable, validation rejects:

- an unknown operation;
- an unsupported write kind;
- duplicate writes to the same target;
- cross-session writes;
- cross-track writes;
- missing required writes;
- unexpected additional writes;
- stale expected revisions;
- incomplete finalization plans;
- a plan that depends on mutable state not captured in the journal.

Each operation admits only its documented complete write set.

## Materialization and verification

One materializer replays the immutable journal plan.

Each write is idempotent and has an expected state or revision.

Recovery may encounter:

- a write not yet applied;
- a write already applied with the expected fingerprint;
- an unexpected conflicting record.

The first is applied. The second is accepted as completed. The third is an explicit recovery conflict and does not trigger heuristic repair.

Verification reads every intended final record and confirms:

- expected identity;
- expected revision;
- expected content fingerprint;
- required record absence for deletions;
- active-session consistency;
- completed-session consistency where applicable.

The journal is cleared only after all verification succeeds.

## Simulation finalization

Simulation finalization follows:

```txt
freeze one exact durable draft revision
→ reject further draft mutations
→ build deterministic attempts, completed result, and review mutations
→ persist the complete finalization journal
→ materialize its writes idempotently
→ verify all attempts, review changes, completed session, active-session removal, and draft deletion
→ clear the journal
→ expose the canonical summary
```

The journal write plan contains the complete deterministic outcome. It must remain sufficient even if the draft deletion has already been materialized before a force-close.

Finalization failure never reopens the frozen draft for editing.

Retry or startup recovery completes the same outcome. It cannot create:

- a second completed session;
- duplicate attempts;
- duplicate review mutations;
- a different score;
- a new unanswered set.

## Session abandonment

Abandonment is an explicit journaled operation.

For an ordinary active session, abandonment:

- removes the active-session designation;
- removes resumable session state;
- excludes the session from learner history;
- preserves already committed attempts and evidence.

For a simulation, abandonment additionally deletes its draft.

If the data model retains a minimal abandoned-session tombstone for referential integrity, that tombstone is not exposed as history and contains no editable response or simulation state.

Abandonment does not translate or delete already committed attempts.

## Content mismatch

Resume requires the exact active:

- track;
- family configuration;
- content version;
- referenced item identities;
- profile version where applicable.

A mismatch blocks resume.

Runtime must not:

- substitute the current item version;
- map an obsolete item to a new item;
- reconstruct old explanations;
- use a newer profile;
- continue with a partially resolvable plan.

The error state may permit deliberate abandonment. Committed attempts remain.

## Learning-state reset

Learning-state reset is a deterministic journaled operation and must be added to the canonical journal-operation contract.

Before reset begins, any existing journal is recovered and cleared. Reset must not overwrite another pending operation.

Learning-state reset deletes:

- active-session state;
- simulation drafts;
- completed-session history;
- attempts;
- review queue entries;
- progress and evidence records;
- developer learning fixtures in the canonical namespace.

It preserves:

- bundled static content;
- application binaries;
- non-learning settings unless the UI explicitly offers a separate full local reset.

Reset verifies every required deletion before clearing its own journal and reporting success.

A partial reset is not reported as complete.

## Corrupt canonical records

Automatic heuristic repair of corrupt canonical records is not permitted.

The application must not:

- alter scores;
- infer missing answers;
- reconstruct review;
- substitute default content;
- discard records silently;
- activate a destructive MMKV recovery policy without an approved product and security decision.

Until the pre-release corruption policy is approved, canonical-record corruption produces an explicit blocking storage state.

Permitted recovery actions must be defined deliberately and tested. A library-provided recovery option is not by itself a product policy.

## Errors

The following are explicit storage or resume states:

- MMKV initialization failure;
- unsupported canonical schema;
- invalid storage metadata;
- pending-journal recovery failure;
- conflicting materialized record;
- repository validation failure;
- missing active-session record;
- missing simulation draft;
- stale draft revision;
- draft-save failure;
- content-version mismatch;
- unresolved profile;
- finalization failure;
- reset failure;
- corrupt canonical record.

Each state exposes only recovery actions known to be safe.

The application does not:

- continue with a default record;
- fall back to AsyncStorage;
- read an old key;
- show partial-success copy;
- silently discard a draft;
- retry a non-idempotent operation;
- display an apparently successful result without verified materialization.

## Required recovery rule

If an existing record, key, API, repository, flow, or module cannot move into the canonical structure without preserving obsolete semantics, delete it.

Do not create:

- migration readers;
- historical translators;
- compatibility adapters;
- dual reads or writes;
- Cloud write-through;
- parallel repository sets;
- old and new authoritative records;
- hidden catch-and-continue paths.

Backward compatibility is not required for pre-production local state.

An explicit failure is evidence that implementation work remains. It must not be hidden by a default, fallback, translation, or read from the obsolete system.

## Privacy

Patternly stores only local data required for:

- settings;
- session recovery;
- committed attempts;
- review;
- progress and evidence;
- deterministic recommendations.

It does not store accounts, identity profiles, confidence responses, or cloud synchronization metadata.

Local-only storage reduces remote transmission and account-linking exposure. Data minimization comes from storing only the records required by the learning contract.

The application must not describe MMKV data as encrypted unless encryption and key management are explicitly configured and verified.

There is no export or import contract in the current recovery scope.
