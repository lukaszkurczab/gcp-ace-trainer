# 03 — Navigation and Flows

This document provides navigation context for the behavior defined by `canonical-product-contract.yaml`; it cannot override that contract.

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

## Public-launch account and data flow

`canonical-product-contract.yaml` defines the complete account surface and
state map. The implementation must provide account entry, register, identity
verification, sign-in, forgot/reset password, expired-session
reauthentication, account/profile, data adoption, sync status/conflict,
sign-out, in-app deletion and a public deletion-request path.

First account binding always resolves before Home or track selection. Empty
local and remote data creates one empty bound dataset. Local-only data is
previewed and explicitly uploaded; remote-only data is previewed and explicitly
restored. When both sides contain records, the application presents the
deterministic reconciliation plan and any active-session choice before applying
it. Cancellation or failure leaves both last verified datasets unchanged.

A previously verified bound account can open Home and continue local learning
offline. The shell must expose pending sync and cannot present registration,
sign-in, recovery, reauthentication, restore or deletion as successful while
offline. A server-declared revoked or expired session returns to the explicit
reauthentication surface and blocks sync.

These are required downstream surfaces, not current routes. The current
`RootNavigator` still contains 21 non-account routes; Task 3 adds the account
route group only after approved designs exist and removes obsolete entry logic
instead of keeping parallel anonymous and account paths.

## Mode setup

Routes resolve the requested Algorithms or Certification mode through `canonical-product-contract.yaml`. This navigation document does not enumerate modes or define their lengths, feedback timing, reinsert, shortening, or timer behavior.

The resolved configuration is shown before start. A route may carry an entry intent or review source, but the application resolves it against the contract and owning family runtime rather than this document. Unknown, unsupported, or incomplete configurations remain explicit preparation failures.

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

## Simulation navigation context

Simulation routes render the configuration resolved from the canonical contract and, for Certification, the selected track profile. The shared shell may present draft, persistence, freeze, finalization, summary, and recovery states, but it does not define their timing, feedback, reinsert, item-count, or timer policy.

Algorithms simulation remains Patternly-defined rather than an official assessment. Certification simulation makes fidelity claims only when its resolved profile has the required official support. In both families, a UI timer is a projection of canonical runtime state, never a second source of truth.

Draft changes remain separate from immutable attempts and results. Finalization freezes the verified durable draft, materializes one deterministic result, and exposes the summary only after verification; a failure keeps the recoverable state explicit rather than reopening an apparently saved draft.

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
