# 12 — Testing Strategy

## Purpose

Patternly testing verifies the canonical product contract, ownership boundaries, deterministic learning behaviour, persistence recovery, active-content validity, accessibility, and explicit failure states. This document provides verification context and cannot override `canonical-product-contract.yaml`.

Tests assert target behaviour from `canonical-product-contract.yaml`; documents `00`–`13` and `15`–`17` provide supporting context only.

They do not preserve:

- obsolete storage behaviour;
- compatibility readers;
- legacy runtime paths;
- old mode taxonomies;
- historical-record migration;
- generic fallback content;
- current repository behaviour merely because it already exists.

A test that protects an obsolete path must be deleted or replaced in the same implementation stage that removes that path.

## Verification layers

The required verification set includes:

1. shared-kernel unit tests;
2. family-runtime unit and contract tests;
3. interaction-handler tests;
4. application-use-case integration tests;
5. repository and storage tests;
6. mutation-journal recovery tests;
7. content and manifest validation;
8. architecture and import-boundary checks;
9. accessible component and screen tests;
10. navigation and route-state tests;
11. security and privacy checks;
12. manual and screenshot-based QA.

Passing one layer does not replace another.

In particular:

- snapshots do not replace behavioural assertions;
- structural content validation does not replace the required content audit;
- component tests do not replace application-flow tests;
- a green unit suite does not prove journal recovery;
- automation does not replace required visual review.

## Test determinism

Tests use controlled:

- clocks;
- monotonic foreground timers;
- UUID and occurrence-ID generation;
- canonical serialization;
- SHA-256 fingerprints;
- item selection randomness;
- option shuffling;
- repository revisions;
- app foreground and background transitions.

No test may depend on wall-clock timing, nondeterministic random order, or an installed historical local store.

Fixtures identify their schema, content, family configuration, and profile versions explicitly.

## Shared-kernel tests

Test family-neutral contracts for:

- stable identifiers;
- content and occurrence references;
- one active session;
- immutable attempts;
- canonical result envelopes;
- session lifecycle guards;
- review queue records;
- mutation commands;
- journal operation identities;
- repository interfaces;
- abandoned-session semantics.

Assert that the shared kernel does not import or interpret:

- concrete Algorithms payloads;
- concrete Certification payloads;
- track instances;
- active content banks;
- React components;
- MMKV infrastructure;
- a global concrete-item union.

## Application-use-case tests

Test complete application operations independently of React:

- prepare session;
- start session;
- submit practice response;
- save simulation draft;
- advance session;
- complete ordinary session;
- finalize simulation;
- resume active session;
- abandon active session;
- recover pending journal;
- reset learning state;
- load summary;
- query dashboard, progress, and review.

Each use case verifies:

- correct family-runtime resolution;
- exact repository calls;
- expected-revision behaviour;
- explicit typed failures;
- absence of hidden substitutes;
- correct transition between durable journal, materialization, verification, and UI-available state.

UI-level tests are not substitutes for these use-case tests.

## Exact scoring tests

### Multiple choice

Test:

- exact selected set equals correct set → `correct`;
- non-empty proper correct subset with no wrong option → `partial`;
- any selected wrong option → `incorrect`;
- an incorrect response earns zero points;
- empty response completeness is handled by the interaction contract;
- duplicate option IDs are rejected;
- unknown option IDs are rejected;
- response order does not change set-based correctness;
- certification exam correct count increases only for `correct`;
- partial remains diagnostic and does not increase exam correct count.

Use table-driven or property-based tests across representative set combinations.

### Ordering

Test:

- content with fewer than two elements is rejected;
- maximum points equals `itemCount - 1`;
- every preserved canonical adjacent relation earns one point;
- all relations preserved → `correct`;
- one through `maxPoints - 1` preserved → `partial`;
- zero preserved → `incorrect`;
- exact-position similarity does not award points without preserved adjacent relations;
- duplicate or unknown ordering element IDs are rejected;
- response completeness and scoring use the persisted occurrence-specific element set.

### Complexity

Test:

- declared checked dimensions;
- declared available values;
- declared accepted values;
- explicit normalized aliases;
- optional shared presets;
- time-only items;
- space-only items;
- other explicitly supported dimension sets;
- one point per correctly answered checked dimension;
- partial result from a partially correct dimension set;
- rejection of an undeclared dimension;
- rejection of a value outside the item contract;
- rejection of an undeclared alias;
- absence of a global closed complexity-class list;
- hidden accepted values are never treated as UI options unless they are also explicitly declared available values.

## Family-runtime tests

Each family runtime is tested independently of UI and concrete repository implementations.

Test:

- configuration validation;
- content selection;
- response validation;
- completeness;
- scoring;
- deterministic attempt outcome;
- review mutation construction;
- taxonomy or competency evidence;
- family result aggregation;
- authored feedback mapping;
- recommendation calculation;
- unsupported mode and payload failure.

A family-runtime test must prove that identical validated input produces the same deterministic outcome.

## Interaction-handler tests

Every active interaction handler has tests for:

- item validation;
- response validation;
- completeness;
- scoring;
- diagnostics;
- authored feedback lookup;
- stable-ID mapping;
- accessibility view model;
- renderer state mapping.

Adding an interaction is incomplete unless all these contracts exist.

Tests must fail if an interaction is registered without its complete handler.

## Algorithms mode tests

The canonical-product-contract suite validates the complete Algorithms mode matrix and entry resolution from the contract data. Application tests consume the resolved configuration rather than restating a mode list, session lengths, feedback timing, timer, or reinsert policy in this strategy.

For Custom Practice, exercise every configuration declared by the contract, its required blueprint and explicit mental-unit boundary, unsupported-value rejection, the one-active-session lifecycle, and the specified feedback-disclosure boundary. A real-device evidence flow must reset development learning state before each independent case and preserve screenshots, Maestro output, and the resolved session-configuration selector outside the repository worktree.

## Review selection tests

For Algorithms `Weak Area Review`, test that selection:

1. takes eligible source items;
2. then takes only reviewed compatible items under the family policy;
3. shortens when the compatible pool is insufficient;
4. exposes requested and actual length;
5. explains the reduction before session start.

Assert that selection never:

- widens taxonomy silently;
- adds unrelated content;
- duplicates a content identity;
- inserts a generic item;
- uses a default topic;
- fabricates an answer;
- claims the originally requested length after shortening.

Test source-item and compatible-item deduplication by content identity.

## Review lifecycle tests

Test every supported review trigger:

- incorrect;
- partial;
- actual supported hint use;
- wrong pattern;
- wrong strategy;
- complexity error;
- repeated mistake;
- scheduled retrieval;
- weak taxonomy area;
- manual mark.

Test exact provenance:

- attempt;
- session transition;
- manual mark.

Test that review cannot be created without valid provenance.

Test persistent review resolution:

- first successful attempt after `dueAt` increments to one;
- second consecutive successful attempt after `dueAt` resolves;
- success before `dueAt` does not increment;
- partial after one success resets the count;
- incorrect after one success resets the count;
- same-session correction does not resolve persistent review;
- repeated retry of the same committed attempt does not increment twice;
- merging evidence does not invent a successful event;
- an unresolved reason is not silently removed.

Test that hint evidence is impossible for an interaction without an explicitly supported hint and impossible when the hint was not actually used.

## Reinsert tests

Load reinsert enablement, eligibility, placement, and content choice from the canonical resolved configuration. For one eligible source attempt, test:

- the reinsert has a new `occurrenceId`;
- the second submission creates a separate immutable attempt;
- both attempts remain in diagnostics;
- the original error remains recorded;
- same-session correction does not resolve persistent review.

Exercise the resolved family placement rule with both eligible and ineligible plan fixtures. The fixture must distinguish durable submitted attempts from unsubmitted, failed, and abandoned states.

When reinsert is skipped, assert that the application does not:

- extend the session;
- reorder fixed occurrences;
- add unrelated content;
- widen taxonomy;
- introduce duplicates;
- add generic content;
- alter or resolve the persistent review entry merely because reinsert was unavailable.

## Practice session lifecycle tests

Test the ordinary practice sequence:

```txt
prepare
→ persist and verify active session
→ show first item
→ maintain ephemeral selection
→ submit
→ persist durable journal
→ permit feedback
→ materialize records
→ verify records
→ clear journal
→ permit advance
```

Assert:

- the first item is not shown before active-session persistence and verification;
- an unsubmitted practice selection is not persisted;
- no feedback appears before journal durability;
- another submit is rejected after the response is frozen;
- item advance is blocked before materialization verification;
- summary navigation is blocked before completed-session verification;
- committed attempts are immutable;
- retry does not create a duplicate attempt or review mutation.

Test the commit-pending state where feedback is visible but materialization is incomplete.

## Algorithms Interview Simulation tests

Test the resolved canonical simulation configuration: identity and version, valid blueprint, explicit preparation failure, plan integrity, draft response operations, current-position persistence, and the declared feedback boundary.

### Algorithms timer tests

Test:

- foreground time decrements remaining time;
- background time does not;
- closed-app time does not;
- wall-clock changes do not affect remaining time;
- negative remaining values clamp to zero;
- zero triggers exactly one finalization command;
- resumed timer uses the last verified durable checkpoint;
- the UI is not an independent authoritative timer.

Test checkpoint behaviour:

- periodic checkpoint;
- foreground-to-background transition;
- background-to-foreground transition;
- draft-save checkpoint where required;
- manual-finalization checkpoint;
- expiry checkpoint;
- force-close immediately before checkpoint;
- force-close immediately after checkpoint;
- the contract-declared checkpoint cadence and maximum drift.

### Algorithms draft tests

Test revisioned draft operations:

- initial draft creation;
- response save;
- response overwrite;
- response removal;
- current-position update;
- timer checkpoint;
- monotonically increasing revision;
- expected previous revision;
- stale-revision rejection;
- concurrent mutation rejection;
- failed save preserves the previous durable revision;
- UI saved state appears only after durable confirmation;
- every occurrence ID belongs to the session plan;
- unknown occurrence IDs are rejected;
- responses are valid for the referenced item.

Draft changes must create no:

- immutable attempt;
- score;
- result kind;
- review mutation;
- correctness state;
- `Reason`;
- `Details`;
- distractor explanation.

### Algorithms finalization tests

Manual submit and foreground-time exhaustion must invoke the same logical finalization contract.

Test:

- one exact durable draft revision is frozen;
- later draft mutations are rejected;
- one immutable attempt is produced for each answered occurrence;
- no attempt is produced for unanswered occurrences;
- eligible review mutations arise only from finalized answered outcomes;
- completed result contains answered and unanswered occurrence IDs;
- unanswered receives zero points;
- unanswered does not become incorrect automatically;
- unanswered does not automatically create content-specific review;
- draft is deleted only as part of the prepared write plan;
- active-session designation is removed;
- completed session is materialized and verified;
- summary is available only after verification;
- authored feedback becomes available only after successful finalization.

Do not assert native multi-key atomicity.

Assert logical atomicity through deterministic journal recovery.

Inject a force-close or materialization failure:

- before journal persistence;
- after journal persistence;
- after each individual planned write;
- after draft deletion;
- after completed-session write;
- after attempt writes;
- after review writes;
- before verification;
- during verification;
- after verification but before journal clear.

Every recovery must produce exactly the same:

- attempts;
- attempt IDs;
- score;
- answered set;
- unanswered set;
- review mutations;
- completed session;
- draft deletion;
- active-session removal.

Finalization failure must not reopen editable draft state or create a second outcome.

## Certification non-simulation tests

For each Certification configuration declared by the canonical contract, test its resolved:

- entry intent;
- item-selection policy;
- requested length;
- actual-length behaviour;
- timer;
- feedback timing;
- remediation policy;
- review policy;
- completion result;
- recommendation effect.

The corresponding implementation remains blocked until its contract and source-backed track profile are available; behavior is never inferred from mode names.

Test competency-first and then topic-level remediation where required.

## Certification Exam Simulation tests

Test `ExamExperienceProfile` across:

- schema validation;
- track-instance registration;
- application preparation;
- runtime behaviour;
- persistence snapshot;
- resume;
- finalization;
- result rendering.

Validate:

- stable profile ID;
- profile version;
- official public source URL;
- checked date;
- optional guide version;
- duration;
- question count or range;
- navigation policy;
- answer-change policy;
- flagging policy;
- navigator policy;
- section policy;
- timeout policy.

Reject:

- missing required profile;
- unsupported profile version;
- unresolved official behaviour;
- a global duration fallback;
- an inferred navigation rule;
- a feature enabled because another certification supports it;
- resume using a newer profile than the session snapshot.

Test profile-permitted behaviour:

- linear navigation;
- previous/next navigation;
- free navigation;
- answer locking;
- answer changes;
- flagging;
- navigator states;
- single and multiple sections;
- section submission;
- return restrictions;
- manual-finish warning;
- absolute deadline;
- resume before deadline;
- automatic finalization after deadline;
- no pre-final correctness or instructional feedback.

Results tests include:

- raw correct count;
- percentage;
- competency breakdown;
- unanswered as a separate diagnostic category;
- partial not increasing correct count;
- missed-by-default review;
- all-items review;
- no official-looking pass/fail;
- clearly labelled Patternly-defined threshold where enabled.

## Session persistence tests

Test:

- one active session globally;
- persistence before first item;
- active-session reference consistency;
- immutable item order;
- immutable occurrence IDs;
- occurrence-specific option order;
- exact configuration snapshot;
- exact content version;
- exact profile version where applicable;
- ordinary foreground timer state;
- simulation draft linkage;
- resume;
- deliberate abandonment;
- committed attempts preserved after abandonment;
- abandoned session excluded from learner history;
- active draft deleted on simulation abandonment;
- content mismatch blocks resume;
- profile mismatch blocks resume;
- no historical content reconstruction.

Test that normal selection contains no duplicate content identity except an explicitly permitted exact-item reinsert.

## Application bootstrap tests

Test startup order:

```txt
initialize MMKV
→ open repositories
→ validate storage metadata
→ recover pending journal
→ validate bundled manifests and active banks
→ resolve active session and draft
→ resolve content and profile versions
→ enable navigation or expose a blocking state
```

Assert:

- normal navigation is unavailable during unresolved recovery;
- pending journal recovery occurs before active-session rendering;
- a global storage failure produces a root error;
- one invalid track bank does not silently become another track;
- missing active session record is explicit;
- missing required draft is explicit;
- incompatible active session is not resumed partially;
- permitted abandonment preserves committed attempts;
- no old store is read.

## Mutation-journal tests

For every journal operation, test its exact complete write plan.

Operations include at least:

- practice submission;
- ordinary session completion;
- session abandonment;
- simulation finalization;
- review-entry update;
- review-entry removal;
- learning-state reset.

Test:

- one pending journal maximum;
- second journaled command is rejected while one is pending;
- canonical serializer version;
- deterministic command fingerprint;
- deterministic plan fingerprint;
- object-key normalization;
- array-order preservation;
- unsupported serialization value rejection;
- duplicate target-write rejection;
- cross-session write rejection;
- cross-track write rejection;
- missing required-write rejection;
- unexpected-write rejection;
- stale expected-revision rejection;
- mutable-state dependency rejection;
- operation-specific write-set validation.

Materializer tests distinguish:

- write absent and pending;
- write already applied with expected fingerprint;
- conflicting unexpected record.

Verifier tests read every intended final state and required deletion.

The journal clears only after complete verification.

## Draft-repository tests

For every simulation draft family, test:

- session ownership;
- schema and family validation;
- exact track and profile compatibility;
- complete-record replacement;
- expected revision;
- stale revision;
- unknown occurrence;
- invalid response payload;
- invalid flag or section state;
- unsupported feature state;
- persistence failure;
- reload after restart;
- deletion on verified completion or abandonment.

Certification draft tests must reject fields forbidden by the active `ExamExperienceProfile`.

Algorithms draft tests must reject flags unless an approved Algorithms profile explicitly enables them.

## Reset tests

Test learning-state reset as a journaled operation.

Assert deletion of:

- active-session state;
- simulation drafts;
- completed sessions;
- attempts;
- review queue;
- progress;
- evidence;
- canonical developer learning fixtures.

Assert preservation of:

- bundled static content;
- application binaries;
- settings excluded by the approved reset contract.

Inject failure after each deletion step and verify idempotent recovery.

Do not report reset success before every required deletion is verified.

## Content validation tests

Require for every active instructional item:

- unique stable `itemId`;
- valid content version;
- valid interaction type;
- valid taxonomy references;
- prompt and material constraints;
- accepted-answer contract;
- scoring consistency;
- required `Reason`;
- complete `Details`;
- stable option or interaction-element IDs;
- authored explanation for every active wrong choice option;
- valid selected-distractor mapping;
- valid ordering contract;
- valid complexity contract;
- required source metadata;
- manifest membership.

Reject:

- unknown option IDs in feedback;
- answer references to absent options;
- duplicated semantic IDs;
- missing Details;
- generic fallback explanations;
- runtime-generated educational copy;
- undeclared accepted aliases;
- accepted values exposed as available UI values by mistake;
- unsupported payloads;
- duplicate content identities in fixed-length sessions;
- insufficient active pool for a declared fixed-length mode;
- manifest/content-version mismatch.

## Content audit and release gate

Structural validation cannot prove educational quality. The release gate requires a corrected canonical source, technical evidence for its exact committed inputs, and an immutable artifact/manifest whose checksums and source commit agree.

Automated checks do not claim to validate:

- teaching quality;
- factual nuance;
- distractor plausibility;
- transfer value;
- legal originality.

A batch without matching technical evidence cannot enter the active manifest.

## Feedback tests

Test feedback availability:

- practice: after durable submit journal;
- session-end simulation: only after verified finalization.

Before that point, assert absence of:

- correctness;
- `Reason`;
- `Details`;
- distractor explanations;
- accepted answers.

After availability, test:

- `Reason` visible;
- no generic `Feedback` heading;
- `Details` collapsed initially;
- `Details` available after correct, partial, and incorrect outcomes;
- opening and closing Details has no domain, timer, persistence, review, recommendation, or navigation effect;
- wrong selected option maps to its exact stable-ID authored explanation;
- multiple selected wrong options compose only their applicable explanations;
- partial multiple-choice feedback covers omitted correct elements;
- runtime does not fabricate educational copy.

## UI and accessibility tests

Test the approved session top bar:

- timer on the left;
- `x of y` counter on the right;
- no `Item` label;
- no Patternly logo in the session top bar;
- no dedicated close button in the approved Algorithms session layout.

Practice response states cover:

- unselected;
- selected;
- submitting;
- selected correct;
- selected incorrect;
- correct not selected;
- selected partial;
- correct omitted from partial;
- disabled.

Simulation response states cover:

- unanswered;
- answered draft;
- saving;
- saved;
- save failure;
- frozen;
- finalizing.

No simulation control displays correctness before finalization.

Test that response correctness does not rely on colour alone. Accessible semantics and a non-colour structural distinction must identify the state.

Test:

- logical focus order;
- accessible roles, names, states, and descriptions;
- dynamic text;
- supported contrast;
- touch targets;
- reduced motion;
- keyboard or switch controls where applicable;
- screen-reader announcements;
- ordering move controls;
- timer type and pause semantics;
- explicit error-state actions.

## Complexity UI tests

Assert that UI renders:

- declared dimensions;
- declared available answer values;
- declared labels and controls.

Assert that UI does not expose:

- hidden accepted values;
- hidden aliases;
- undeclared dimensions;
- an assumed time-and-space pair;
- a global complexity list.

## Simulation navigator tests

Algorithms navigator tests include:

- the canonical resolved occurrence plan;
- current;
- answered and durably saved;
- unanswered;
- frozen;
- no correctness before finalization;
- no flags unless profile-enabled.

Certification navigator tests render only profile-permitted states and controls.

A feature supported by one profile must not appear for another profile automatically.

## Navigation tests

Test explicit route parameters for:

- track;
- mode;
- review source;
- topic or competency;
- session;
- summary;
- post-session review.

Unknown or missing required IDs produce explicit unavailable states.

Navigation must never silently select:

- another track;
- a default topic;
- a default item;
- a default mode;
- the newest profile;
- another active session.

## Error-state tests

Test explicit states for:

- MMKV initialization failure;
- unsupported storage schema;
- pending-journal recovery failure;
- missing content;
- unsupported payload;
- unknown ID;
- content-version mismatch;
- unresolved profile;
- insufficient fixed-length content;
- stale draft revision;
- draft-save failure;
- timer-recovery failure;
- practice-submit materialization failure;
- finalization failure;
- reset failure;
- corrupt canonical record.

For each state, assert:

- precise failure category;
- known durable state;
- whether retry is safe;
- only approved recovery actions;
- no default or substitute result;
- no hidden data loss;
- no ordinary success presentation.

## Architecture tests

Architecture checks block merge when:

- shared kernel imports a concrete family;
- shared kernel imports a track or renderer;
- a family imports another family;
- a screen imports MMKV;
- a screen imports a repository implementation;
- a family runtime imports MMKV;
- a repository interprets concrete item semantics;
- static content imports application orchestration;
- a global concrete-item union returns;
- a full-screen `trackId` branch selects parallel runners;
- AsyncStorage is imported;
- an obsolete storage key or API remains reachable.

Architecture tests use explicit dependency rules, not only search conventions.

## Security and privacy checks

Pre-release verification includes:

- one MMKV infrastructure owner;
- absence of AsyncStorage and old storage access;
- absence of hard-coded encryption keys or secrets;
- production-log redaction;
- no response, draft, attempt, journal-plan, or MMKV-value logging;
- network dependency inventory;
- device-permission inventory;
- telemetry and analytics inventory;
- platform backup configuration review;
- absence of unverified encryption claims;
- certification provenance validation;
- bundled-content secret scanning.

Where behaviour cannot be automated, record manual evidence.

Local integrity fingerprints must not be presented as tamper-proof credentials or official-result authentication.

## Required negative suite

The suite must fail if any of the following returns:

- confidence fields or confidence UI;
- synthetic readiness percentage;
- synthetic retention percentage;
- synthetic mastery percentage;
- an obsolete or second mode taxonomy;
- `due_queue` or `session_misses` as a mode;
- fallback topic, item, answer, score, result, or explanation;
- generic educational fallback copy;
- old-schema reader;
- historical migration or translator;
- dual storage read or write;
- Cloud write-through;
- parallel runtime;
- old authoritative model;
- AsyncStorage access;
- direct MMKV access outside infrastructure;
- global concrete-item union;
- screen-owned scoring, review, or persistence;
- unreviewed active instructional content;
- fixed-length session shortening;
- duplicate content used to fill a session;
- feedback before the mode permits it;
- correctness disclosure in a simulation draft;
- accepted complexity answers exposed before feedback;
- official-looking pass/fail;
- an unverified encryption claim;
- hidden analytics or telemetry outside the approved contract.

## Manual and screenshot QA

Critical flows require manual and screenshot-based verification on supported mobile platforms.

Cover at least:

- ordinary practice before and after submit;
- correct, partial, and incorrect response states;
- Reason and collapsed Details;
- reinsert and skipped reinsert;
- shortened review disclosure;
- Algorithms simulation draft navigation;
- timer pause outside foreground;
- draft-save failure;
- timer exhaustion;
- frozen and finalizing states;
- finalization failure and recovery;
- unanswered summary;
- certification profile-driven controls;
- content mismatch;
- storage failure;
- dynamic text;
- screen reader;
- reduced motion.

Missing approved visual design blocks the corresponding implementation and QA case.

It is not replaced by a Codex-created generic interaction.

## CI gates

Pull requests and the main branch run the applicable canonical verification set:

- typecheck;
- lint where configured;
- unit tests;
- application integration tests;
- repository and recovery tests;
- content validation;
- human-review-record validation;
- architecture checks;
- required negative suite;
- accessible UI tests.

A capability cannot be marked complete when a required test category is absent, skipped without justification, or replaced only by snapshots.

## Completion evidence

A completed implementation stage reports:

- commands run;
- test counts and results;
- skipped or unavailable suites;
- architecture-check result;
- content-validation result;
- technical evidence and artifact identity;
- manual QA evidence;
- screenshot evidence;
- platform and build used;
- unverified areas;
- remaining risks.

The report distinguishes:

- implemented and verified;
- implemented but unverified;
- planned but not implemented;
- blocked by missing contract or design.

It must not describe planned work as complete.
