# 03 — Navigation and Flows

## Navigation

The primary tab navigation exposes:

1. `Home`
2. `Practice`
3. `Progress`
4. `Settings`

Track selection, session setup, session runner, session summary, review, and topic or competency details are nested application routes rather than additional primary tabs.

Track context is visible on every learning surface where it affects content, recommendations, progress, review, or session behaviour. A session belongs to exactly one track and never mixes tracks or track families.

Routes carry explicit track, mode, source, topic, competency, or session identifiers where required. An unknown or missing required identifier produces an explicit unavailable or error state. Navigation never silently selects a default topic, item, track, or session.

Home shows deterministic, family-specific, explained recommendations. It prioritizes overdue review and repeated mistakes when those signals require action.

Home does not display confidence, readiness, retention, or mastery percentages. A valid learner choice among currently supported configurations overrides the recommendation for the current session.

## Algorithms modes and setup

The only user-facing Algorithms mode labels are:

1. `Learn Approach`
2. `Guided Practice`
3. `Recognize Patterns`
4. `Contrast Practice`
5. `Weak Area Review`
6. `Independent Practice`
7. `Interview Simulation`

Algorithms entry intents map as follows:

| Entry intent                       | Canonical mode                                |
| ---------------------------------- | --------------------------------------------- |
| Approach primer or new mental unit | `Learn Approach`                              |
| Topic or default practice          | `Guided Practice`                             |
| Pattern recognition                | `Recognize Patterns`                          |
| Contrast                           | `Contrast Practice`                           |
| Due review                         | `Weak Area Review`, `source = due_queue`      |
| Current-session misses             | `Weak Area Review`, `source = session_misses` |
| Mixed practice                     | `Independent Practice`                        |
| Timed validation                   | `Interview Simulation`                        |

`due_queue` and `session_misses` are sources for `Weak Area Review`, not separate modes.

For `Weak Area Review`, selection takes eligible source items first. It may then add only reviewed items compatible under the Algorithms family review policy, using the same mental unit, mechanism, pattern relationship, or approved repair boundary.

It must not silently widen taxonomy, add unrelated content, duplicate an item, or use a generic substitute.

If the compatible review pool is smaller than the requested length:

- the session is shortened;
- `actualLength` reflects the selected pool;
- the actual length and reason are shown before start.

This shortening rule applies only where the mode contract permits it. It does not apply to fixed-length `Interview Simulation`.

## Certification modes and setup

The only user-facing Certification mode labels are:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`
7. `Exam Simulation`

Certification entry routes resolve their exact mode configuration through the owning `CertificationFamilyRuntime` and track instance.

The mode contract must define selection, requested and actual length, feedback timing, timer behaviour, review behaviour, and completion rules before implementation. A mode label alone is not sufficient configuration.

`Exam Simulation` is available only when the selected certification track supplies a valid, official-source-backed `ExamExperienceProfile`.

## Practice session flow

A non-simulation session follows this application flow:

```txt
setup
→ resolve and show actual configuration
→ prepare valid item order and option order
→ persist the one active session
→ show the first item
→ keep the current unsubmitted response in UI state
→ validate and freeze on submit
→ build deterministic attempt, session, evidence, and review outcome
→ persist the durable mutation journal
→ reveal feedback or transition as permitted by the mode
→ materialize canonical records
→ verify materialization
→ clear the journal
→ advance or complete
→ show summary
```

No first item appears before the active session is durably persisted.

No feedback or item advance occurs before the submit journal is durable.

A practice selection that has not been submitted is ephemeral UI state and is not persisted.

All non-simulation sessions use elapsed foreground time and show an accessible count-up timer.

The learner may continue the one active session or explicitly abandon it. An abandoned session does not appear in history. Already committed attempts and their evidence remain.

Practice modes reveal authored feedback after each durable submission. The runner has:

- a visible question counter;
- an accessible timer;
- accessible response controls;
- explicit preparation, content, submit, and persistence failures;
- family-specific item rendering;
- shared lifecycle actions.

## Simulation draft model

A simulation uses the same canonical active-session lifecycle as practice but adds a persisted, session-owned draft state.

The draft state is not a second session, separate history, independent runtime, or parallel source of truth. It is keyed by and belongs exclusively to the one active simulation session.

Depending on the family and profile, persisted draft state may contain:

- responses by item ID;
- current item position;
- navigation state;
- flags;
- section state;
- timer state;
- other explicitly supported simulation controls.

A saved simulation response is distinct from an unsubmitted practice selection. It is an accepted, persisted draft response that remains editable until the applicable finalization boundary.

Draft changes create no immutable `TrainingAttempt`, score, instructional feedback, or review mutation.

A draft response, navigation change, flag change, or section transition must not be represented as safely saved until its canonical draft update is durable. Persistence failure remains explicit and preserves the last verified durable state.

## Algorithms Interview Simulation

`Interview Simulation` is a Patternly-defined timed Algorithms validation session. It does not claim to reproduce an official assessment or every real-world interview condition.

It has exactly 40 unique items selected under the Algorithms simulation blueprint.

Preparation fails explicitly when the runtime cannot select 40 valid and compatible items. The runtime must not:

- shorten the simulation;
- repeat an item;
- widen the configured taxonomy silently;
- add unrelated content;
- use a default or generic substitute.

The simulation permits:

- free navigation;
- answer changes until finalization begins;
- persisted draft responses;
- persisted current position;
- resume of the one active simulation;
- no reinsert;
- no per-item correctness or instructional feedback before finalization.

### Timer

Algorithms `Interview Simulation` uses a 45-minute foreground countdown:

```txt
remainingMs = max(
  0,
  45 minutes - canonicalActiveForegroundMs
)
```

Background and closed-app time do not consume the Algorithms simulation timer.

The setup and runner must disclose that the timer measures active foreground work and pauses outside the app. Patternly must not describe this behaviour as an exact reproduction of an uninterrupted real interview.

The canonical timer-state model, foreground-segment transitions, persistence checkpoints, force-close recovery, and expiry transition are defined in the data model, storage contract, and training-runtime specification. UI must not implement an independent timer source.

### Draft persistence

The canonical Algorithms simulation draft persists:

- response by item ID;
- current position;
- canonical foreground-timer state.

Changing a draft response does not submit that item. No attempt, score, feedback, or review mutation exists before finalization.

### Finalization

Manual final submission or exhaustion of the 45 minutes of canonical foreground time invokes the same idempotent finalization command.

Finalization follows this order:

```txt
freeze the complete durable draft snapshot
→ reject further response and navigation changes
→ build deterministic attempts, score, session result, evidence, and review mutations
→ persist a durable complete-simulation journal
→ expose finalized results
→ materialize canonical records
→ verify materialization
→ remove completed draft state
→ clear the journal
```

If journal durability or materialization fails:

- the simulation remains frozen;
- its durable draft snapshot remains recoverable;
- no editable state is restored;
- no second finalization outcome is created;
- retry completes the same deterministic operation.

Answered draft responses create immutable attempts during finalization.

Applicable incorrect, partial, repeated-mistake, complexity, strategy, pattern, or other documented outcomes may create or update review only during finalization.

### Unanswered items

Unanswered items are permitted.

They:

- receive zero points;
- remain a distinct summary category;
- do not create an ordinary item-level attempt;
- do not automatically create content-specific review;
- are persisted on the completed session as unanswered item references and count;
- may contribute to a family-defined session-level completion or time-management performance signal.

They must not disappear from the persistent simulation result.

### Results

Algorithms simulation results show at least:

- total item count;
- answered item count;
- unanswered item count;
- correct item count;
- partial item count;
- incorrect item count;
- points earned;
- maximum available points;
- an evidence-based breakdown defined by the Algorithms family;
- post-session access to authored feedback.

Any percentage is derived from real earned and maximum points. It is not readiness, retention, mastery, or an official outcome.

No pass/fail result is shown.

Post-session review defaults to non-correct answered items and separately exposes unanswered items. An all-items view may be available.

## Certification Exam Simulation

Each certification `Exam Simulation` reads the selected track instance’s versioned `ExamExperienceProfile`.

The profile controls:

- question count or range;
- absolute deadline;
- navigation;
- answer changes;
- flagging;
- navigator;
- section behaviour;
- section-return behaviour;
- automatic final submission.

No global certification-exam defaults are used.

If required official behaviour is unclear or unsupported, the track cannot claim faithful simulation and preparation fails explicitly.

The canonical certification simulation draft persists all profile-permitted state needed for deterministic resume, including as applicable:

- answers;
- current position;
- flags;
- navigator state;
- section state;
- absolute deadline.

No per-item correctness, `Reason`, `Details`, or distractor explanation appears before finalization.

System exit requests confirmation. The available actions must distinguish continuing the simulation, leaving it resumable, and deliberate abandonment where the product permits abandonment.

Manual finish permits unanswered items but warns with their count.

Timeout:

```txt
absolute deadline reached
→ freeze all durable answers
→ start the idempotent final commit
```

If the application returns before the deadline, the learner resumes the canonical draft. If it returns after the deadline, the application auto-finalizes the frozen durable state.

A failed finalization preserves the frozen recoverable state and retries the same deterministic operation.

Results show:

- raw correct count;
- percentage;
- competency breakdown;
- unanswered as a separate incorrect diagnostic category.

Partial results never increase the correct count.

No official-looking pass/fail result is shown. Any internal practice threshold is clearly labelled as Patternly-defined.

Answer review defaults to missed items and may expose all items.

## Summary and review navigation

A completed session routes to one canonical summary identified by session ID.

Summary and review load canonical completed-session, attempt, score, unanswered, and review evidence through application queries. They do not reconstruct results from UI state or obsolete storage.

Opening post-session review does not create a new training session. Starting a remediation or weak-area session from review creates a new explicitly configured session through the normal setup flow.

## Design dependency

Approved visual and interaction design is required before implementing a new user-facing interaction or state, including:

- simulation navigator;
- editable draft-answer state;
- foreground-paused timer disclosure;
- timer-expired frozen state;
- finalization-in-progress state;
- finalization failure and retry;
- unanswered warning;
- section transitions;
- review disclosure;
- explicit content or preparation failure.

Missing design is a blocker. It is not permission for Codex to invent a substitute interaction, generic modal, alternative navigator, or hidden fallback.
