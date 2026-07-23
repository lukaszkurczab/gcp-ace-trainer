# 17 — Training Runtime and Interaction Specification

## Purpose and ownership

This document provides runtime context for the behavior defined by `canonical-product-contract.yaml`:

- session preparation;
- active-session lifecycle;
- immediate-feedback practice;
- editable simulation drafts;
- submission and finalization;
- timers;
- feedback disclosure;
- review mutation;
- reinsert;
- resume and abandonment;
- explicit errors and recovery.

It operationalizes the family learning contracts from documents `15` and `16`.

It does not redefine:

- the scientific rationale for a learning mode;
- content quality;
- repository implementation;
- MMKV configuration;
- visual styling;
- security and privacy policy.

No screen, implementation prompt, legacy runtime, or mode name may supply behavior missing from the canonical product contract.

## 1. Preconditions

Before session setup is exposed, resolve and validate:

- track ID;
- track family;
- canonical mode ID;
- review source where applicable;
- requested session length;
- track configuration;
- practice or simulation blueprint;
- active content version;
- required content payloads;
- interaction handlers;
- required certification profile;
- route parameters.

The following are explicit preparation failures:

- unknown ID;
- unsupported mode;
- unsupported review source;
- unsupported payload;
- missing content;
- invalid content;
- missing interaction handler;
- invalid blueprint;
- insufficient fixed-length content;
- unresolved certification profile;
- content-version mismatch;
- profile-version mismatch;
- repository failure.

The runtime never substitutes:

- a default track;
- a default topic;
- a default mental unit;
- a default competency;
- a default item;
- a default answer;
- a guessed score;
- a generic explanation;
- a newer content or profile version.

## 2. Mode configuration

The runtime resolves Algorithms and Certification modes exclusively from `canonical-product-contract.yaml`. It does not maintain mode matrices, entry mappings, session lengths, feedback timing, reinsert behavior, shortening policy, or timer behavior in this specification.

An entry intent or review source is validated by the resolved family configuration. Unknown or unsupported values fail preparation explicitly; the runtime never infers behavior from a mode label.

## 4. Session preparation

Session preparation follows:

```txt
resolve track and family
→ resolve mode and exact configuration
→ validate blueprint, content, handlers, and profile
→ prepare complete deterministic session plan
→ generate stable plan-slot and occurrence identities
→ prepare option order for every possible resolved occurrence
→ persist and verify the one active session
→ create and verify a simulation draft where required
→ expose the first resolved item
```

Only one active session may exist across all tracks and families.

The first item must not appear before:

- active-session persistence succeeds;
- the persisted record is verified;
- required simulation-draft creation succeeds.

### Fixed-length modes

The following never shorten:

- Certification `Diagnostic Baseline`;
- Algorithms `Interview Simulation`;
- Certification `Exam Simulation`.

If their exact valid pool cannot be prepared, setup fails explicitly.

The runtime must not:

- duplicate content;
- widen taxonomy;
- substitute another topic;
- use inactive content;
- add generic content;
- claim the requested length was prepared when it was not.

### Shortenable modes

When shortening is permitted:

- `actualLength` equals the prepared valid slot count;
- requested and actual length are shown before start;
- the reason for shortening is shown;
- selection remains within the mode’s declared compatibility boundary.

## 5. Canonical session states

A session uses one of these top-level states:

```txt
preparing
active
commit_pending
finalizing
completed
abandoning
abandoned
blocked
```

`active` contains a practice or simulation substate.

### Practice substates

```txt
active.practice.unanswered
active.practice.submitting
commit_pending.practice
active.practice.feedback
active.practice.advancing
```

### Simulation substates

```txt
active.simulation.editable
active.simulation.saving
active.simulation.save_failed
finalizing.simulation.frozen
finalizing.simulation.materializing
finalizing.simulation.recovery_required
```

A state transition not defined by this document is invalid.

## 6. Immediate-feedback practice lifecycle

### Unanswered state

In `active.practice.unanswered`:

- response controls are editable;
- the current response is ephemeral UI state;
- no response payload is persisted;
- no attempt exists;
- no score exists;
- no review mutation exists;
- no correctness or authored feedback is visible.

### Submit

Submit follows:

```txt
validate response
→ confirm completeness
→ freeze local response
→ build deterministic attempt, session, evidence, and review outcome
→ build complete immutable journal write plan
→ persist durable mutation journal
```

If response validation or completeness fails:

- no journal is created;
- the session remains unanswered;
- the defined validation state is shown.

If journal persistence fails:

- no outcome is logically committed;
- no feedback is shown;
- no attempt or review mutation exists;
- the learner may safely retry;
- the current local response may remain available.

### Journal durable

After journal durability:

- the submitted response is logically committed;
- the response is immutable;
- another submit is rejected;
- authored practice feedback may be shown;
- item advance remains disabled;
- completed-summary navigation remains disabled.

The runtime enters:

```txt
commit_pending.practice
```

### Materialization

The immutable journal plan is materialized idempotently.

Materialization creates or updates only the records declared by the operation:

- immutable attempt;
- session state;
- review entries;
- evidence;
- completed-session result where the submitted item completes the session.

Every intended final record is then verified.

If materialization or verification fails:

- the submitted response remains frozen;
- feedback already exposed remains valid;
- the learner cannot answer again;
- item advance remains blocked;
- the runtime exposes an explicit commit-recovery state;
- retry replays the same deterministic journal.

The failure must not be presented as an ordinary unsuccessful answer submission.

### Journal clear and feedback state

After complete verification:

- clear the journal;
- enter `active.practice.feedback`;
- enable the applicable `Next` or `Finish` action.

### Advance

When the learner selects `Next`:

```txt
resolve next session-plan slot
→ persist and verify current-position transition
→ clear ephemeral response and feedback UI state
→ show next item
```

The next item must not appear before the position update is durable and verified.

If position persistence fails:

- remain on the current feedback state;
- preserve the committed attempt;
- show an explicit advance failure;
- do not skip to another item.

### Finish

When the final item outcome has been verified:

- the completed-session result must already be canonical;
- `Finish` navigates to summary;
- summary loads the completed result through application queries;
- summary is not reconstructed from component state.

## 7. Practice response and scoring contracts

### Multiple choice

A multiple-choice response is:

- `correct` when the selected set equals the complete correct set;
- `partial` when the selected set is a non-empty proper subset of the correct set and contains no wrong option;
- `incorrect` when any wrong option is selected.

An incorrect multiple-choice response earns zero points.

Single-choice content has no partial state unless its explicit interaction contract defines multiple required elements.

Unknown option IDs and duplicate selected IDs are rejected.

### Ordering

Ordering content contains at least two elements.

For canonical order:

```txt
A → B → C → D
```

score:

```txt
A→B
B→C
C→D
```

```txt
maxPoints = itemCount - 1
```

Result:

- all relations preserved → `correct`;
- one or more but not all preserved → `partial`;
- zero preserved → `incorrect`.

Exact-position scoring is not used.

### Complexity

Complexity content declares:

- checked dimensions;
- available response values;
- accepted values;
- accepted normalized aliases;
- maximum points.

Award one point for every correctly answered checked dimension.

Result:

- all checked dimensions correct → `correct`;
- at least one but not all correct → `partial`;
- zero checked dimensions correct → `incorrect`.

Time-only and space-only items are valid.

No global closed list of complexity classes exists.

Accepted values and aliases remain hidden scoring inputs until feedback is permitted.

## 8. Feedback disclosure

Every active instructional item has authored `Reason` and complete `Details`.

### Practice

Practice feedback is available after submit-journal durability.

When available:

- `Reason` is visible immediately;
- `Details` is collapsed initially;
- no generic `Feedback` heading is added;
- wrong selected choice options map to authored explanations by stable option ID;
- partial responses explain omitted required elements where applicable.

Opening or closing `Details` has no effect on:

- score;
- attempt;
- review;
- evidence;
- timer;
- draft;
- recommendation;
- navigation;
- persistence.

### Session-end modes

Algorithms `Interview Simulation` and Certification `Exam Simulation` reveal no item-level:

- correctness;
- score;
- `Reason`;
- `Details`;
- distractor explanation;
- review state;

before finalization has been fully materialized and verified.

A durable finalization journal alone is not sufficient to reveal results.

Post-session review uses the same authored feedback contract as practice.

Runtime never fabricates educational copy.

## 9. Review mutation

A committed eligible outcome may create or update review for approved reasons:

- incorrect;
- partial;
- actual supported hint use;
- wrong pattern;
- wrong strategy;
- complexity error;
- repeated mistake;
- scheduled retrieval;
- weak taxonomy evidence;
- manual mark.

Review records preserve:

- source item;
- exact attempt, transition, or manual-mark provenance;
- family-owned taxonomy, skill, topic, competency, or mental-unit evidence;
- reasons;
- due state;
- persistent-resolution state.

A family may select:

- exact source item;
- reviewed variant;
- compatible contrast item;
- compatible repair item.

It may not:

- widen taxonomy silently;
- add unrelated content;
- fabricate generic review content;
- discard provenance.

## 10. Persistent review resolution

Persistent review resolves only after two consecutive successful eligible attempts submitted after the applicable `dueAt`.

Rules:

- success before `dueAt` does not increment;
- first eligible after-due success sets the count to one;
- second consecutive eligible after-due success resolves the entry;
- partial resets the count;
- incorrect resets the count;
- retry of the same committed attempt cannot increment twice;
- same-session correction does not resolve persistent review.

Mode eligibility is family-owned.

### Algorithms

Attempts may advance persistent resolution when prepared through:

- `Weak Area Review`, `source = due_queue`;
- another explicitly documented due-review context.

`session_misses` provides immediate correction. Its attempts count toward resolution only when they independently satisfy the due-time and family eligibility contract.

Ordinary Algorithms practice and simulation do not silently resolve persistent review.

### Certification

Attempts may advance persistent resolution when prepared through:

- `Weak Area Review`;
- `Quick Review`.

Other Certification practice and simulation modes may create or increase review but do not silently resolve persistent review.

## 11. Reinsert

The resolved canonical mode configuration determines whether reinsert is available. Its eligibility and placement policy are family-owned and must be consumed through that resolved configuration, not inferred from a mode label or duplicated in this runtime narrative.

### Conditional plan-slot contract

Because the session plan is persisted before the first item appears, reinsert must not mutate the plan opportunistically.

A reinsert-capable prepared session may contain conditional plan slots.

Each conditional slot persists before session start:

- stable slot ID;
- source occurrence ID;
- ordinary-content branch;
- policy-selected reinsert branch;
- occurrence and option order for every possible branch;
- deterministic resolution rule.

Every possible branch is:

- content-valid;
- taxonomy-compatible;
- version-compatible;
- included in the persisted session plan;
- independently resolvable after restart.

A conditional slot resolves as follows:

```txt
source attempt result
  ├─ correct
  │    → ordinary branch
  │
  └─ partial or incorrect
       ↓
       reinsert allowance unused?
         ├─ no
         │    → ordinary branch
         │
         └─ yes
              ↓
              resolved family placement rule
              satisfied?
                ├─ no
                │    → ordinary branch
                │
                └─ yes
                     → policy-selected reinsert branch
```

A conditional slot:

- never changes session length;
- never reorders slots;
- never introduces content not persisted during preparation;
- can be claimed by only one source occurrence;
- produces one resolved occurrence and one attempt.

The reinserted response creates a separate immutable attempt.

Both attempts remain diagnostic evidence.

A correct reinsert does not:

- remove the original error;
- resolve persistent review in the same session;
- alter historical evidence.

If no valid conditional slot is available, reinsert is skipped as a normal outcome.

Skipping must not:

- extend the session;
- reorder the plan;
- duplicate unrelated content;
- widen taxonomy;
- insert generic content;
- change persistent review scheduling;
- resolve the review entry.

## 12. Simulation draft lifecycle

A simulation uses:

- one canonical active session;
- one revisioned session-owned draft.

The draft is not a second session or attempt store.

It contains only mutable state permitted by the applicable family configuration or certification profile.

### Editable state

In `active.simulation.editable`:

- responses may be added, changed, or removed where permitted;
- navigation may change where permitted;
- correctness and feedback remain hidden;
- draft responses create no attempts, scores, evidence, or review mutations.

### Draft save

Every save:

```txt
validate mutation
→ validate expected previous revision
→ build complete replacement draft
→ persist draft
→ verify new revision
→ expose saved state
```

A stale revision fails explicitly.

The UI must not announce `Saved` before durable verification.

If draft persistence fails:

- the last verified durable revision remains authoritative;
- the current unsaved UI edit remains visibly unsaved;
- no attempt or score is created;
- retry uses an explicit expected revision;
- a newer durable draft must not be overwritten.

### Resume

Resume restores:

- exact session plan;
- exact resolved plan slots;
- exact content and profile versions;
- last verified durable draft;
- current position;
- timer state;
- profile-permitted navigator, section, or flag state.

Resume does not regenerate item or option order.

A missing or incompatible required draft blocks resume.

### Finalization boundary

Finalization freezes one exact verified durable draft revision.

After freeze:

- response mutations are rejected;
- navigation mutations are rejected;
- draft-save commands are rejected;
- the session cannot return to editable state.

Manual finalization waits for an in-flight draft save to resolve.

Timer-triggered finalization freezes the latest verified durable draft revision. A transient edit that was never durably saved is not part of the finalized result and must never have been represented as saved.

## 13. Simulation finalization

Finalization follows:

```txt
freeze exact durable draft revision
→ build deterministic attempts, result, evidence, and review mutations
→ build complete immutable finalization write plan
→ persist durable finalization journal
→ materialize all writes idempotently
→ verify all final records and required deletions
→ clear journal
→ expose canonical result and post-session feedback
```

The journal provides logical atomicity and crash-consistent recovery.

It does not imply a native multi-key MMKV transaction.

The finalization write plan includes:

- one immutable attempt for every answered occurrence;
- no ordinary attempt for unanswered occurrences;
- eligible review mutations from answered outcomes;
- completed-session result;
- answered and unanswered diagnostics;
- active-session removal;
- draft deletion.

If materialization or verification fails:

- the simulation remains frozen;
- no draft mutation is allowed;
- summary and instructional feedback remain unavailable;
- retry or startup recovery replays the same immutable plan;
- a second finalization outcome cannot be created.

## 14. Timers

Timer kind, duration, cadence, durable checkpointing, drift, and lifecycle checkpoints resolve exclusively from `canonical-product-contract.yaml` and the applicable track profile. The runtime persists only canonical timer state; UI renders its projection and never owns an independent authoritative clock.

Expiry freezes the verified durable draft and begins the declared idempotent finalization path. Recovery resumes only from canonical durable state.

## 15. Algorithms Interview Simulation

Algorithms simulation resolves its product-defined configuration from the canonical contract. Preparation validates the resolved blueprint without silently changing its content scope, item plan, feedback, reinsert, or timer behavior.

### Answered outcomes

Finalization creates attempts for answered occurrences.

Each attempt preserves:

- response;
- result kind;
- points earned;
- maximum points;
- diagnostics;
- content and occurrence identity.

Partial interaction outcomes may contribute partial points to `pointsEarned`, while only `correct` contributes to `correctCount`.

### Unanswered outcomes

Unanswered occurrences:

- earn zero points;
- remain distinct from incorrect;
- create no fabricated response;
- create no ordinary attempt;
- do not automatically create content-specific review;
- remain persisted in the completed-session result.

### Result

The completed result includes:

- total item count;
- answered count;
- unanswered count;
- correct count;
- partial count;
- incorrect count;
- points earned;
- maximum points;
- family-specific mental-unit or skill breakdown;
- foreground active time.

No pass/fail, readiness, retention, mastery, or predicted interview outcome is shown.

## 16. Certification non-simulation runtime

Certification non-simulation behavior is resolved from the canonical contract and owning family runtime. This document does not duplicate per-mode selection, length, feedback, timer, reinsert, shortening, review, or completion definitions.

## 17. Certification Exam Simulation

Certification `Exam Simulation` uses the selected track instance’s exact versioned `ExamExperienceProfile`.

The session snapshots:

- profile ID and version;
- official source reference;
- duration;
- question count or range;
- absolute deadline;
- navigation policy;
- answer-change policy;
- flagging policy;
- navigator policy;
- section policy;
- timeout policy.

No global default or inferred official rule exists.

The draft stores only state permitted by that profile.

### Exit

System exit requests confirmation.

The interaction distinguishes:

- continue simulation;
- leave the active session resumable;
- deliberately abandon where the product permits it.

Abandonment:

- removes the active session from resumable state;
- deletes the draft;
- excludes the session from history;
- preserves already committed attempts, although normal simulation attempts do not exist before finalization.

### Manual finish

Manual finish:

- warns when responses remain unanswered;
- shows the unanswered count;
- permits finalization unless the profile explicitly forbids it;
- freezes the latest verified durable draft revision.

### Timeout

At the absolute deadline:

- answers freeze;
- further edits are rejected;
- one idempotent finalization begins.

### Unanswered scoring

Unanswered occurrences:

- contribute zero to raw correct count;
- remain in the percentage denominator;
- remain a distinct diagnostic category;
- create no fabricated response;
- create no ordinary item-level attempt;
- do not automatically create content-specific review.

### Results

Results show:

- raw correct count;
- percentage;
- competency breakdown;
- unanswered count;
- partial and incorrect diagnostics where applicable.

Partial does not increment raw correct count.

Post-session answer review defaults to:

- answered non-correct items;
- unanswered items as a separate category.

An all-items view may be available.

No official-looking pass/fail result is shown.

Any internal threshold is clearly labelled Patternly-defined.

## 18. Interruption, resume, and abandonment

### Ordinary interruption

Leaving the application without abandoning preserves the one active session.

Resume requires exact resolution of:

- track;
- family;
- mode;
- content version;
- configuration version;
- profile version where applicable;
- session plan;
- simulation draft where applicable.

### Content or profile mismatch

A mismatch blocks resume.

The runtime must not:

- map an old item to a current item;
- use a newer profile;
- reconstruct an old explanation;
- resume a partial subset of the session;
- silently start a replacement session.

Where safe, the user may deliberately abandon the incompatible active session.

### Abandonment

Abandonment is explicit.

It:

- removes resumable active-session state;
- removes simulation draft state;
- excludes the session from learner history;
- preserves already materialized attempts and evidence;
- does not translate historical records.

## 19. Error states

The runtime distinguishes at least:

- preparation failure;
- invalid response;
- submit-journal persistence failure;
- commit-pending materialization failure;
- position-advance failure;
- draft-save failure;
- stale draft revision;
- timer recovery failure;
- finalization-journal persistence failure;
- finalization materialization failure;
- finalization verification failure;
- content-version mismatch;
- profile-version mismatch;
- missing active session;
- missing required draft;
- repository failure;
- corrupt canonical state.

Every error state defines:

- failed operation;
- known durable state;
- whether retry is safe;
- permitted recovery action;
- prohibited fallback behaviour.

The runtime does not:

- catch and continue with empty data;
- display an apparently successful result;
- allow a second submit after logical commit;
- reopen a frozen simulation;
- discard a draft silently;
- read an obsolete store;
- create generic content.

## 20. Interaction and accessibility requirements

The runner exposes:

- visible timer;
- `x of y` question counter;
- explicit editable, saving, submitted, frozen, and error states;
- accessible response controls;
- family-specific renderers;
- approved bottom actions;
- approved feedback disclosure.

Correctness is not shown before the active mode permits it.

Simulation draft controls never expose correct, partial, or incorrect state before finalization.

Response states must not rely on colour alone.

Ordering exposes accessible movement controls.

Complexity controls expose declared available values, not hidden accepted answers.

Missing approved design for a required runtime state blocks implementation.

## 21. Required recovery rule

If an existing model, record, flow, module, route, key, API, or test cannot move into the canonical structure without preserving obsolete semantics, delete it.

Do not create:

- fallbacks;
- translators;
- compatibility adapters;
- dual reads or writes;
- parallel session runners;
- second authoritative state;
- historical-content reconstruction;
- hidden default branches;
- generic educational explanations.

Backward compatibility is not required for pre-production storage, content, or runtime models.

An explicit runtime failure is evidence that migration work remains. It must not be hidden by substituting defaults or reading the obsolete system.
