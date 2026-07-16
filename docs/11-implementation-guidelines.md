# 11 — Implementation Guidelines

## Purpose

This document defines how the canonical Patternly contracts are implemented.

It does not redefine product behaviour, scoring, review, persistence semantics, content quality, or visual interaction.

Implementation must reproduce the approved contracts from documents `00`–`17`. Current repository behaviour is evidence of the existing state, not evidence of correct target behaviour.

When required behaviour is missing or contradictory, implementation stops at that boundary. The responsible canonical document and its contract tests must be corrected before code chooses an interpretation.

## Source-of-truth hierarchy

Use the following ownership when resolving implementation questions:

- `02-architecture.md` defines module ownership and dependency direction;
- `04-data-model.md` defines canonical persisted and domain records;
- `17-training-runtime-and-interaction-spec.md` defines session behaviour and state transitions;
- `08-storage-and-offline.md` defines persistence, journal, recovery, reset, and resume;
- `05-design-system.md` and approved visual references define presentation;
- `07-content-guidelines.md` defines authored content and activation quality;
- `12-testing-strategy.md` defines required verification;
- family learning-system documents define family-specific semantics.

An implementation prompt, current screen, existing service, obsolete test, or repository convention does not override these sources.

A conflict is resolved by updating the responsible contract and test, not by adding a compatibility branch.

## Mandatory recovery rule

If an existing model, record, flow, module, key, route, API, or test cannot move into the canonical structure without preserving obsolete semantics, delete it.

Do not create:

- fallbacks;
- translators;
- compatibility adapters;
- dual reads or writes;
- old-store bridges;
- parallel session runners;
- second authoritative models;
- historical-content reconstruction;
- permanent migration flags;
- hidden catch-and-continue branches;
- default topic, item, answer, score, result, or explanation values.

Backward compatibility is not required for pre-production storage, content, or runtime models.

Implementation must migrate ownership or delete the old path. It must not preserve both implementations so that the replacement appears safer.

An explicit failure is valuable evidence that migration work remains. It must not be hidden by reading the old system or constructing an ordinary-looking substitute result.

## Ownership boundaries

### Shared learning kernel

The shared kernel owns only family-neutral contracts:

- stable identifiers;
- content and occurrence references;
- session lifecycle guards;
- canonical session and attempt envelopes;
- result envelopes;
- review queue records and mutation commands;
- family-neutral evidence envelopes;
- mutation-journal operation contracts;
- repository interfaces;
- lifecycle commands and events.

The kernel does not own:

- a global union of concrete item types;
- certification or Algorithms taxonomy;
- family-specific selection;
- scoring;
- response completeness;
- educational feedback composition;
- concrete renderers;
- family recommendations;
- MMKV implementation.

### Application layer

Application use cases coordinate complete operations:

- prepare and start session;
- persist session before first item;
- submit practice response;
- save simulation draft revision;
- advance session;
- complete session;
- finalize simulation;
- resume session;
- abandon session;
- recover a pending journal;
- reset learning state;
- query dashboard, progress, history, summary, and review.

The application layer:

- resolves the applicable family runtime through the registry;
- invokes family-owned validation and deterministic outcome construction;
- coordinates repositories and journal operations;
- converts domain and persistence failures into application states.

It does not implement family-specific correctness, content selection, taxonomy interpretation, or educational copy.

### Family runtime

A family runtime owns:

- family payload validation;
- response completeness;
- item selection;
- scoring;
- family result diagnostics;
- review policy;
- taxonomy or competency evidence;
- feedback mapping and authored-field composition;
- progress aggregation;
- deterministic recommendations;
- mode semantics;
- family interaction handlers.

A family runtime produces deterministic domain outcomes. It does not:

- import MMKV;
- directly write repository implementations;
- own an independent session store;
- construct a second application lifecycle;
- fabricate educational explanations.

### Track instance

A track instance owns declarative track material:

- track identity and metadata;
- taxonomy;
- roadmap or certification blueprint;
- active content manifest and bank;
- content version;
- enabled modes;
- family-specific configuration;
- certification `ExamExperienceProfile` where applicable;
- Algorithms simulation profile where applicable;
- required provenance.

A new track fitting an existing family is implemented as a track instance, not as a copied runtime.

### Interaction handler

Each concrete interaction is implemented as one vertical module containing:

- item and response contracts;
- content validation;
- response completeness;
- scoring;
- diagnostic mapping;
- authored feedback mapping;
- renderer;
- accessibility behaviour;
- contract tests.

Adding an interaction must not require:

- extending a global union of every concrete item;
- adding a `trackId` switch to the session shell;
- placing scoring in a React component;
- adding a generic unsupported interaction placeholder.

An interaction enters the active runtime only when the complete vertical module exists.

### UI and session shell

UI renders application states and dispatches application commands.

UI may own ephemeral presentation state explicitly permitted by the runtime contract, including an unsubmitted practice selection.

UI does not:

- score;
- construct attempts;
- mutate review;
- select learning content;
- aggregate progress;
- choose recommendations;
- access MMKV;
- interpret raw repository records;
- fabricate `Reason`, `Details`, or distractor explanations;
- convert failures into defaults.

The shared session shell owns common lifecycle presentation. Family renderers own concrete response controls and semantic item presentation.

### Repositories and infrastructure

Repository contracts operate on canonical records.

Repositories:

- persist and retrieve canonical state;
- apply expected-revision guards;
- validate stored record envelopes;
- support idempotent journal materialization and verification;
- do not interpret item correctness or educational meaning.

Infrastructure alone:

- imports MMKV;
- creates the one MMKV client;
- constructs repository implementations;
- implements canonical serialization and storage codecs.

Delete AsyncStorage access rather than wrapping it.

## Dependency restrictions

Enforce at least these forbidden dependencies:

```txt
shared kernel
  -X-> concrete family runtime
  -X-> concrete track
  -X-> active content bank
  -X-> renderer
  -X-> MMKV

family runtime
  -X-> another family runtime
  -X-> MMKV
  -X-> repository implementation
  -X-> React screen orchestration

screen or UI component
  -X-> MMKV
  -X-> repository implementation
  -X-> scoring implementation
  -X-> review mutation policy

repository implementation
  -X-> concrete item semantics
  -X-> authored feedback composition

track instance or static content
  -X-> application orchestration
  -X-> storage implementation
```

Concrete implementations are connected only in the application composition root.

Architecture checks must enforce these restrictions. A code-review convention alone is insufficient.

## Boundary validation

Validate external or persisted identifiers and payloads at the first owning boundary.

Explicitly reject:

- unknown track IDs;
- unknown mode IDs;
- unknown item or occurrence IDs;
- unsupported interaction types;
- invalid family configuration;
- invalid response payloads;
- invalid option IDs;
- unresolved profile versions;
- missing content;
- content-version mismatch;
- stale draft revisions;
- invalid repository records;
- incomplete journal plans.

Do not coerce an unsupported payload into a supported shape.

Do not use unchecked casts, ignored type errors, or generic parsing defaults to bypass a contract. Any unavoidable platform-boundary assertion must be localized behind runtime validation and must not enter canonical domain state unverified.

## Session preparation

Before the first item appears:

1. resolve track and family;
2. resolve mode and exact configuration;
3. validate required content and profile;
4. select the complete valid session plan;
5. generate immutable occurrence IDs;
6. generate and persist occurrence-specific option order;
7. persist the active session;
8. verify the persisted active session;
9. expose the first item.

For fixed-length modes, preparation fails explicitly when the exact valid pool cannot be selected.

Do not:

- shorten a fixed-length mode;
- duplicate content;
- widen taxonomy silently;
- substitute a default item;
- display an item before active-session persistence succeeds.

Only one canonical active session may exist.

## Immediate-feedback practice

An unsubmitted practice response remains ephemeral UI state.

Changing it creates no:

- attempt;
- review mutation;
- score;
- persisted response;
- instructional feedback.

Practice submit follows:

```txt
validate and freeze response
→ build deterministic attempt, session, evidence, and review outcome
→ build the complete immutable write plan
→ persist the durable mutation journal
→ allow authored feedback
→ materialize canonical records idempotently
→ verify every intended final record
→ clear the journal
→ allow item advance or completed-session navigation
```

Feedback may appear after journal durability because the submitted outcome is then logically committed.

Item advance, summary navigation, and other states requiring canonical records occur only after verified materialization.

If materialization fails after feedback appears:

- the submitted response remains frozen;
- another submit is rejected;
- advance remains blocked;
- the UI shows the defined commit-pending recovery state;
- retry or startup recovery executes the same immutable write plan.

The failure must not be presented as permission to answer again.

## Durable mutation journal

At most one durable mutation journal exists at a time.

While a journal is pending:

- another journaled command cannot start;
- its write plan cannot be replaced;
- unsafe navigation and mutations remain disabled;
- recovery or materialization must complete first.

Every journal contains:

- one supported logical operation;
- versioned canonical command identity;
- deterministic command fingerprint;
- exact plan fingerprint;
- expected record revisions or absence conditions;
- the complete operation-scoped write set.

Validation rejects:

- duplicate target writes;
- unknown writes;
- cross-session or cross-track writes;
- incomplete operation plans;
- unexpected additional writes;
- stale expected revisions;
- dependencies on mutable state not captured in the journal.

The journal provides logical atomicity and crash-consistent recovery. It does not imply a native multi-key MMKV transaction.

One materializer replays the immutable plan. One verifier reads every intended final record. The journal clears only after verification succeeds.

Retry must produce the same attempts, results, review mutations, session state, and deletions.

## Simulation drafts

A simulation draft is mutable state owned by one active canonical session.

It is not:

- a second session;
- separate history;
- an independent attempt store;
- a family-specific storage subsystem;
- a parallel source of truth.

Draft state is stored under a versioned, session-owned contract.

Every draft update:

1. validates the proposed family payload;
2. names the expected previous revision;
3. replaces the complete canonical draft record;
4. increments the revision;
5. becomes visible as saved only after durable confirmation.

A stale revision fails explicitly.

A failed draft save preserves the last verified durable revision.

Draft mutation creates no immutable attempt, score, review mutation, correctness feedback, or completed-session result.

After finalization freezes a draft revision, all later draft mutations are rejected.

## Algorithms Interview Simulation

Algorithms `Interview Simulation` uses its Patternly-defined profile:

- exactly 40 unique occurrences;
- 45 minutes of active foreground work;
- free navigation;
- editable responses until finalization;
- persisted canonical draft;
- no reinsert;
- no per-item correctness or instructional feedback before finalization;
- finalization-only attempts and review mutation.

Preparation fails if 40 valid unique items cannot be selected.

The timer is:

```txt
remainingMs =
  max(0, 45 minutes - canonicalActiveForegroundMs)
```

It is a foreground countdown, not an absolute deadline.

Background and closed-app time do not consume it.

Implementation must use the canonical checkpointed timer contract. It must not create an independent UI clock or infer foreground work from closed-app wall time.

The draft stores the approved mutable simulation state, including:

- occurrence-keyed responses;
- current occurrence;
- canonical foreground timer state;
- draft revision.

Flags are implemented only if the approved Algorithms simulation profile explicitly supports them.

### Algorithms finalization

Manual submission or canonical foreground-timer exhaustion freezes one exact durable draft revision.

Finalization follows:

```txt
freeze durable draft revision
→ reject response and navigation mutations
→ build deterministic attempts, completed result, evidence, and review mutations
→ persist complete finalization journal
→ materialize canonical records idempotently
→ verify attempts, review, completed session, active-session removal, and draft deletion
→ clear journal
→ expose canonical summary and authored feedback
```

Answered occurrences create immutable attempts during finalization.

Eligible finalized outcomes create review mutations only according to Algorithms review policy.

Unanswered occurrences:

- receive zero points;
- create no fabricated response;
- create no ordinary item-level attempt;
- do not automatically create content-specific review;
- remain stored in the completed-session result;
- remain available to summary and post-session review.

A failed finalization:

- leaves the session frozen;
- does not reopen editable draft state;
- preserves deterministic recovery;
- cannot create a second outcome.

Do not describe journaled finalization as a guaranteed native multi-key transaction.

## Certification Exam Simulation

Certification `Exam Simulation` resolves the exact versioned `ExamExperienceProfile` owned by the selected track instance.

No global duration, question count, navigation, answer-change, flagging, navigator, section, or timeout default is allowed.

Do not infer an undocumented official rule from:

- another certification;
- current UI;
- memory;
- an unofficial source;
- an existing generic exam implementation.

The immutable session snapshots the exact profile identity and version.

The simulation draft stores only profile-permitted mutable state.

The absolute deadline remains authoritative across foreground, background, and closed-app time.

Returning after expiry freezes the last durable draft and invokes idempotent automatic finalization.

If a required official rule is unresolved, preparation fails explicitly and the product does not claim faithful simulation.

## Scoring implementation

Implement only scoring contracts explicitly defined by the responsible family and interaction handler.

### Multiple choice

- exact correct set: `correct`;
- non-empty proper correct subset with no wrong option: `partial`;
- any wrong option: `incorrect` with zero points;
- certification exam correct count increments only for `correct`.

### Ordering

Ordering scores preserved correct adjacent relations.

It does not use exact-position scoring.

Reject content with fewer than two ordering elements.

### Complexity

Complexity scoring uses only dimensions, available values, accepted values, aliases, and maximum points declared by the item.

Do not assume:

- both time and space exist;
- a global closed list of complexity classes;
- accepted aliases not declared by content.

UI renders available values, not hidden accepted answers.

### Session-end scoring

Simulation scoring and attempts are constructed only during finalization.

Draft responses have no provisional correctness, score, attempt, review mutation, or instructional feedback.

## Review implementation

Review mutations preserve:

- source content reference;
- exact attempt, transition, or manual-mark provenance;
- family-owned taxonomy, skill, topic, mental-unit, or competency evidence;
- reasons;
- due state;
- persistent-resolution evidence.

Persistent review resolves only after two consecutive successful review attempts submitted after the applicable `dueAt`.

A successful attempt before `dueAt` does not increment resolution progress.

A partial or incorrect review attempt resets the consecutive-success count.

A correction in the same session does not resolve persistent review.

Do not merge review entries in a way that:

- loses provenance;
- invents a successful retention event;
- removes an unresolved reason;
- widens taxonomy;
- turns missing content into a substitute review item.

## Reinsert

Reinsert is enabled only for:

- Algorithms `Guided Practice`;
- Algorithms `Weak Area Review`, `source = due_queue`;
- Algorithms `Weak Area Review`, `source = session_misses`.

For each eligible source attempt:

- result must be incorrect or partial;
- maximum reinserts: one;
- at least three other submitted items must separate the attempts;
- prefer a reviewed variant of the same mechanism;
- use the exact source item only when no compatible reviewed variant exists;
- create a new occurrence and immutable attempt;
- preserve the original failure in diagnostics;
- do not resolve persistent review merely because of same-session correction.

If the fixed session plan cannot provide the required gap, skip the reinsert.

Do not:

- extend the session;
- reorder already fixed occurrences;
- duplicate unrelated content;
- widen taxonomy;
- add a generic repair item.

## Authored content implementation

Static content owns:

- prompts and material constraints;
- stable options or interaction elements;
- accepted-answer contracts;
- scoring inputs;
- `Reason`;
- `Details`;
- stable-ID distractor explanations;
- taxonomy references;
- required provenance.

Runtime validates and composes authored fields. It never writes or invents educational explanations.

Active content must pass:

- structural validation;
- family-specific validation;
- manifest validation;
- required human editorial sign-off.

Codex may apply exact reviewed content or produce bounded candidates for human review. It cannot:

- claim human approval;
- mass-rewrite active explanations from a generic instruction;
- activate structurally valid but unreviewed content;
- hide weak content behind status flags;
- introduce runtime fallback copy.

A learner-visible or scoring change to active content requires the approved content-version update.

## Error handling

Use explicit typed failures at domain, application, repository, and UI boundaries.

Do not:

- catch and continue with empty values;
- return a default item after lookup failure;
- convert repository failure into an ordinary empty history;
- retry an unsafe non-idempotent operation;
- hide a stale draft revision;
- substitute a newer profile or content version;
- mark partial materialization as success;
- discard a draft silently;
- expose stack traces or persisted payloads in ordinary UI.

Every failure state must define:

- failed operation;
- known durable state;
- whether retry is safe;
- available recovery action;
- prohibited fallback behaviour.

A generic `Something went wrong` state is insufficient where the application knows a more precise failure category.

## Security and privacy implementation

Persist only data required by approved contracts.

Production code and logs must not expose:

- response payloads;
- simulation drafts;
- complete attempts;
- mutation-journal plans;
- MMKV values;
- encryption keys;
- full educational content unnecessarily;
- secret or credential material.

Do not claim local data is encrypted unless encryption and key management are explicitly configured and verified.

Do not add analytics, telemetry, remote content, cloud synchronization, or device permissions without an approved security and privacy contract.

## Design dependency

Implementation requires an approved visual and interaction reference for every new user-facing state.

This includes:

- response states;
- ordering controls;
- complexity controls;
- draft saving;
- foreground-countdown disclosure;
- simulation navigator;
- timer exhaustion;
- frozen finalization state;
- finalization failure and retry;
- certification sections and flags;
- unanswered warning;
- explicit storage and content errors.

If required design is absent, stop at that boundary.

Codex must not invent:

- a generic modal;
- an alternative navigator;
- a new correctness indicator;
- an extra feedback card;
- a fallback screen;
- a hidden interaction shortcut.

## Testing discipline

Every implementation change includes tests at the owning boundary.

As applicable, add or update:

- pure family-runtime unit tests;
- kernel lifecycle tests;
- application use-case integration tests;
- repository and journal recovery tests;
- interaction-handler contract tests;
- content validation;
- accessibility tests;
- import-boundary checks;
- negative tests proving forbidden fallbacks absent;
- manual and screenshot-based QA for approved critical states.

A snapshot alone is not proof of behaviour.

A test preserving an obsolete path must be deleted or replaced in the same stage in which that path is replaced.

Do not weaken an assertion merely to make the current implementation pass.

## Change discipline

Before editing:

1. inspect the actual repository paths and active owners;
2. record confirmed repository facts separately from assumptions;
3. identify the canonical source documents;
4. define exact files in and out of scope;
5. run the applicable baseline verification;
6. identify old paths that the completed change must remove.

During implementation:

- change ownership, not only folder location;
- keep domain logic testable without React;
- use one canonical path;
- avoid speculative abstractions;
- do not add unsupported future interaction types;
- do not add placeholders or temporary architecture labels;
- keep public APIs as narrow as the active use cases require.

After implementation:

- run the complete applicable verification set;
- inspect changed imports and dependency direction;
- search for old symbols, keys, routes, and storage APIs;
- inspect error and fallback branches;
- verify that tests exercise the canonical owner;
- perform required manual and screenshot QA;
- update documentation only to confirmed implementation facts.

## Completion discipline

A change is complete only when:

- its target owner is canonical;
- the replaced path is deleted;
- no adapter or fallback remains;
- required tests pass;
- required error states are explicit;
- required UI design is implemented accurately;
- required active content is validated and human-approved;
- persistence and recovery behaviour are verified;
- import boundaries pass;
- manual evidence is recorded where required;
- documentation matches the resulting code and active content.

Every change includes a dead-code and regression check covering:

- old imports;
- old storage keys;
- obsolete read and write APIs;
- duplicate repositories;
- parallel runtimes;
- duplicate routes;
- stale screens;
- obsolete tests and fixtures;
- unused types and exports;
- global concrete-item unions;
- direct storage access from UI;
- hidden default branches;
- catch-and-continue paths;
- generic educational fallback copy;
- stale documentation.

Tests must prove removal or explicit failure, not successful substitution.

Do not claim completion based on:

- planned changes;
- files created but not integrated;
- passing unit tests while integration remains parallel;
- hidden disabled legacy code;
- a structurally valid but unreviewed content bank;
- a required UI state without approved design;
- an unverified manual flow.

## Required implementation report

Every bounded implementation task ends with a report containing:

- starting and ending commit or diff scope;
- confirmed repository facts;
- files changed;
- canonical owners introduced or modified;
- obsolete paths deleted;
- reason for each deletion;
- tests and commands run with results;
- architecture and dead-code checks;
- manual and screenshot evidence;
- content-validation and human-review evidence where applicable;
- unresolved or unverified areas;
- remaining risks.

The report must distinguish:

- implemented and verified;
- implemented but not verified;
- planned but not implemented;
- blocked by a missing canonical contract or approved design.

It must not describe planned work as complete.
