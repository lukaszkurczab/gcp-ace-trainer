# 02 — Architecture

## Canonical structure

```txt
application composition root
  → shared learning kernel
  → track-family runtime
  → track instance and active content bank
  → repository contracts
  → MMKV infrastructure
```

For the account-enabled public launch, that local path remains the only
learning-data write path and receives one account boundary:

```txt
account lifecycle application service
  → account-data repository/service boundary
      → canonical local repositories (device durability authority)
      → ordered sync outbox
      → remote account dataset port (cross-device convergence authority)
```

The remote adapter cannot become a second repository used directly by screens,
family runtimes or learning commands. A learning command commits and verifies
the canonical local mutation first; the same boundary then queues its
revisioned remote operation. Remote compare-and-swap failure preserves the last
verified local and remote states and returns an explicit sync/conflict state.
Provider packages, networking and this account boundary are not implemented in
the current source; Tasks 3 and 8 add them against the canonical contract.

The shared learning kernel owns session lifecycle, immutable attempts, canonical results, review mutation commands, evidence aggregation contracts, and repository interfaces. It treats `trackId` and `familyId` as opaque registry identifiers and is family-agnostic: it does not know certification domains, Algorithms patterns, SQL queries, code traces, system-design dimensions, item renderers, or a global list of interaction types.

`CertificationFamilyRuntime` owns certification scoring, competency evidence, practice semantics, and profile-driven simulation. `AlgorithmsFamilyRuntime` owns mental units, taxonomy evidence, choice/ordering/complexity interactions, and algorithmic review policy. A new track that shares those semantics is an instance of an existing family, not a new parallel runtime. A domain with materially different response, scoring, feedback, or review semantics receives a new family runtime while continuing to use the same kernel, repositories, lifecycle commands, and session shell.


## Scaling model

The architecture scales on two separate axes:

1. **Track-instance extension** — add content, taxonomy, configuration, and metadata to an existing family. This must not change the kernel, persistence subsystem, shared session shell, or family-agnostic application services.
2. **Family extension** — add one family runtime with its own payload validators, interaction handlers, scoring, feedback composition, review policy, recommendation logic, and renderers. This must reuse the canonical lifecycle, attempts, review envelopes, repositories, journal, errors, and shell.

Illustrative future shape:

```txt
track registry
├── CertificationFamilyRuntime
│   ├── gcp-ace
│   ├── azure-ai-fundamentals
│   └── aws-solutions-architect-associate
│
├── AlgorithmsFamilyRuntime
│   └── algorithms
│
├── DatabaseReasoningFamilyRuntime
│   └── sql-and-data-reasoning
│
├── CodeReasoningFamilyRuntime
│   └── debugging-and-code-review
│
└── SystemDesignFamilyRuntime
    └── backend-system-design
```

These future names are architecture probes, not approved delivery scope. Their purpose is to prove that the current design is not a two-track special case.

### Family admission rule

A track may reuse a family only when all of the following are true:

- the family can validate its payloads without checking the concrete `trackId`;
- the family scoring model represents correct, partial, and incorrect work without track-specific exceptions;
- review evidence and recommendation semantics fit the same family taxonomy model;
- the shared shell can render the interaction through registered family handlers;
- adding the track requires no new repository, session lifecycle, attempt model, or storage key family.

If any condition fails because the domain has genuinely different learning semantics, create a new family runtime. Do not add `if (trackId === ...)` branches to the kernel, shared application layer, repositories, or session shell.

### Extensibility acceptance tests

The architecture is not considered scalable until it can demonstrate both cases:

- adding a second certification track changes only certification instance registration, taxonomy, profile, content, and tests;
- adding a deterministic non-certification family such as SQL reasoning adds family-owned handlers and tests but leaves the kernel, persistence, journal, and shared lifecycle unchanged.

Later code-reasoning and system-design families may introduce new family-owned interaction types, but never a second authoritative runtime or a central union of every concrete payload in the product.

## Ownership and dependencies

UI dispatches application commands and renders states; it does not score, select review items, write storage, or improvise feedback. Family runtimes validate payloads, select items, score them, and build deterministic outcomes. Repositories persist canonical records but do not interpret item payloads. Infrastructure alone imports MMKV and constructs one storage client; no screen, domain module, or track imports it.

The track instance owns a versioned `ExamExperienceProfile` for every certification simulation. The profile contains source URL, checked date, optional guide version, duration, question count or range, navigation, answer-change, flagging, navigator, section, and automatic-final-submit policy. The kernel stores the profile reference and applies the family runtime; it never supplies global exam defaults.

## Review and content ownership

A review record carries a source item reference plus skill, competency, or taxonomy evidence. A family may choose an exact item, reviewed variant, contrast item, or repair item; it cannot widen taxonomy silently or fabricate a generic substitute. Active content is content-versioned but the version identifies only the active bank.

## Required recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.

Consequently, the target has no AsyncStorage read path, no dual storage writer, no historical record translator, no old-and-new authoritative module pair, and no permanent status flags that disguise an unfinished replacement. Unknown IDs, unsupported payloads, and absent content fail explicitly.

## Error boundary

Preparation, content resolution, profile resolution, and repository failures are visible unavailable/error states. A runtime failure is actionable evidence for implementation work; it must not turn into a default topic, item, answer, score, or review outcome.

## Current repository fact

Current source still contains older storage and training models. That is implementation work to remove, not an architectural exception to this document.
