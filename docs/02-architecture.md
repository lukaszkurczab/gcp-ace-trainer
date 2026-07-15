# 02 — Architecture

## Canonical structure

```txt
application composition root
├── UI, navigation, and session shell
├── application use cases and queries
├── track registry
│   ├── AlgorithmsFamilyRuntime
│   │   └── Algorithms track instance and active content bank
│   └── CertificationFamilyRuntime
│       └── certification track instances and active content banks
├── shared learning kernel
└── infrastructure
    └── MMKV repository implementations
```

The canonical dependency direction is:

```txt
UI and navigation
  → application use cases and queries

application use cases
  → shared learning kernel contracts
  → family runtime contracts
  → repository contracts

concrete family runtimes
  → shared learning kernel contracts
  → their own track instances and active content

MMKV infrastructure
  → repository contracts

application composition root
  → concrete family runtimes
  → concrete repository implementations
  → track registry
```

The shared learning kernel does not depend on concrete family runtimes, track instances, item renderers, active content banks, or MMKV infrastructure.

## Shared learning kernel ownership

The shared learning kernel owns only family-neutral learning contracts:

- stable track, session, attempt, and content-reference identifiers;
- canonical session lifecycle and state guards;
- immutable attempt and result envelopes;
- generic review queue records and mutation commands;
- family-neutral evidence envelopes;
- durable mutation-journal contracts;
- repository interfaces;
- lifecycle commands and events.

The kernel may represent a deterministic result produced by a family runtime, but it does not calculate family-specific correctness, interpret an item payload, select learning content, construct educational feedback, or aggregate family-specific progress.

It does not know certification domains, Algorithms patterns, concrete interaction types, item renderers, or a global union of all possible item payloads.

## Application-layer ownership

Application use cases coordinate complete product operations, including:

- preparing and starting a session;
- resolving the required family runtime through the registry;
- persisting the active session before its first item appears;
- submitting a practice response;
- recording durable mutation intent;
- materializing deterministic attempts, review mutations, and session state;
- advancing or completing a session;
- finalizing a simulation;
- resuming or abandoning the one active session;
- recovering an incomplete journaled operation;
- loading dashboard, progress, history, and review views.

The application layer coordinates domain and persistence boundaries. It does not implement family-specific scoring, content selection, educational feedback, or taxonomy interpretation.

No screen or renderer performs this orchestration.

## Family-runtime ownership

`CertificationFamilyRuntime` owns:

- certification payload validation;
- competency, topic, and skill interpretation;
- certification item selection;
- practice and remediation semantics;
- certification scoring;
- authored feedback mapping;
- certification review policy;
- certification evidence interpretation and recommendations;
- profile-driven `Exam Simulation` semantics.

`AlgorithmsFamilyRuntime` owns:

- algorithmic payload validation;
- mental units, pattern families, variants, archetypes, and skill atoms;
- Algorithms item selection;
- choice, ordering, and complexity interaction semantics;
- algorithmic scoring;
- authored feedback mapping;
- algorithmic review policy;
- algorithmic evidence interpretation and recommendations;
- `Interview Simulation` semantics defined by the Algorithms learning-system and training-runtime contracts.

A family runtime validates inputs and produces deterministic domain outcomes. It does not import MMKV, perform direct storage writes, own repository implementations, or create a second session lifecycle.

A new track is an instance of an existing family when its semantics fit that family. It is not a new parallel session runner.

## Track-instance ownership

A track instance owns declarative track-specific material:

- track identity and metadata;
- taxonomy;
- roadmap or certification blueprint;
- active content manifest and content bank;
- content version;
- enabled family modes;
- family-specific configuration;
- source and provenance metadata where required.

Each certification track instance owns its versioned `ExamExperienceProfile`.

The profile includes:

- official public source URL;
- date on which the source was checked;
- optional guide version;
- duration;
- question count or range;
- navigation policy;
- answer-change policy;
- flagging policy;
- navigator policy;
- section policy;
- automatic-final-submit policy.

`CertificationFamilyRuntime` interprets this profile. The kernel does not provide global exam defaults and does not infer an omitted official rule.

The Algorithms track instance owns its Patternly-defined `Interview Simulation` configuration. That configuration is not an `ExamExperienceProfile`, does not claim to reproduce an official external exam, and must be defined explicitly in the Algorithms data and runtime contracts.

`AlgorithmsFamilyRuntime` interprets the configuration. It must not embed an undeclared alternative configuration inside UI or runtime branches.

## Simulation state and persistence

Simulation semantics belong to the applicable family runtime. Persistence orchestration belongs to application use cases, while repositories persist canonical state.

Editable or incomplete simulation response state must remain part of the one canonical active-session model. It must not create:

- a second authoritative simulation session;
- a separate runtime-specific history;
- a parallel attempt store;
- an independent draft subsystem with conflicting lifecycle semantics.

Before such state is implemented, its canonical record shape, persistence points, resume behaviour, answer-change behaviour, and finalization transition must be defined in the data model, storage contract, and training-runtime specification.

Simulation timer behaviour follows the training-runtime contract:

- non-simulation practice uses elapsed foreground time;
- `Interview Simulation` and certification `Exam Simulation` use an absolute deadline and countdown.

Family-specific scoring and review timing follow the applicable runtime specification. The architecture document does not introduce an alternative scoring or finalization path.

## Repository and infrastructure ownership

Repository contracts are defined at the kernel or application boundary and operate on canonical records.

Repository implementations:

- persist and retrieve canonical state;
- enforce storage-level validation and result contracts;
- support idempotent materialization and recovery;
- do not interpret concrete item payloads;
- do not calculate scores;
- do not select review content;
- do not construct educational feedback.

Infrastructure alone imports MMKV, creates the single MMKV client, and constructs repository implementations.

No UI module, screen, renderer, application-domain module, family runtime, track instance, or content bank imports MMKV.

## UI ownership

UI dispatches application commands and renders application states.

It may own ephemeral presentation state such as an unsubmitted current selection where the runtime contract permits it. It does not:

- score an answer;
- construct a `TrainingAttempt`;
- mutate review;
- select session content;
- aggregate progress;
- choose recommendations;
- write storage;
- interpret repository records;
- fabricate `Reason`, `Details`, or distractor explanations;
- silently substitute missing data.

Family renderers own concrete interaction presentation and accessibility behaviour. The shared session shell owns shared lifecycle presentation such as the timer, counter, progress, scrolling, bottom actions, loading, exit, and explicit failure states.

Neither the shell nor a generic screen imports a global union of concrete family item types.

## Dependency restrictions

The following dependency directions are forbidden:

```txt
shared learning kernel
  -X-> concrete family runtime
  -X-> track instance
  -X-> active content bank
  -X-> UI renderer
  -X-> MMKV infrastructure

CertificationFamilyRuntime
  -X-> AlgorithmsFamilyRuntime

AlgorithmsFamilyRuntime
  -X-> CertificationFamilyRuntime

UI or screen
  -X-> MMKV
  -X-> repository implementation
  -X-> family scoring implementation

repository implementation
  -X-> concrete item semantics
  -X-> educational feedback composition

track instance or content bank
  -X-> MMKV
  -X-> application orchestration
```

Concrete implementations are connected only in the application composition root.

## Review and content ownership

A canonical review record contains:

- a source item reference;
- family-owned skill, competency, topic, mental-unit, or taxonomy evidence;
- review reasons;
- due-state and resolution evidence.

The applicable family runtime decides, according to its documented review policy, whether review should use:

- the exact source item;
- a reviewed variant of the same mechanism;
- a compatible contrast item;
- a repair item.

It may not silently widen taxonomy, introduce unrelated content, duplicate an item to satisfy a requested length, or fabricate a generic substitute.

Active content is versioned, but a content version identifies only the active bank. It does not authorize reconstruction of obsolete items, options, answers, or explanations.

Static content owns authored educational feedback. Runtime may validate and compose authored fields, but it never invents instructional copy from IDs, enums, or generic templates.

## Required recovery rule

If an existing model, record, flow, or module cannot move into the canonical structure without preserving obsolete semantics, delete it.

Do not create:

- fallbacks;
- record translators;
- compatibility adapters;
- dual reads or writes;
- parallel session runners;
- parallel authoritative models;
- historical explanation reconstruction;
- permanent migration-status flags;
- hidden catch-and-continue branches.

Backward compatibility is not required for pre-production storage, content, or runtime models.

An explicit runtime failure is valuable evidence that migration work remains. It must not be hidden by substituting defaults, reading an obsolete store, or converting an unsupported record into an ordinary session.

Consequently, the target has no AsyncStorage read path, dual storage writer, historical-record translator, old-and-new authoritative module pair, or permanent status flag that disguises an unfinished replacement.

## Error boundary

Family runtimes return explicit validation or domain failures for unknown IDs, unsupported payloads, missing content, invalid responses, and unresolved family configuration.

Repositories return explicit persistence failures.

Application use cases convert those failures into defined application states. UI renders the corresponding unavailable or error state and an allowed recovery action where one exists.

Preparation, content resolution, profile resolution, journal durability, materialization, recovery, and completion failures must not turn into:

- a default topic;
- a default item;
- a default answer;
- a substitute score;
- a fabricated review outcome;
- a generic explanation;
- an apparently successful session.

## Current repository fact

Current source still contains older storage and training models.

Those models are implementation work to remove. They are not architectural exceptions, compatibility requirements, or evidence that the target should preserve parallel ownership.
