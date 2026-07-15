# 10 — Product Capability Roadmap

## Purpose

This document describes the target product capabilities and their dependency relationships.

It is not:

- an implementation migration plan;
- a repository cleanup checklist;
- a release schedule;
- a record of completed recovery work.

Implementation sequencing, replacement of legacy paths, and repository-specific recovery gates are defined only by the separately regenerated architecture recovery plan after the canonical product documentation is accepted.

This roadmap defines what the product must be capable of doing and which foundational contracts a capability depends on.

## Roadmap semantics

The numbered capabilities express product-level dependencies, not permission to postpone quality, accessibility, security, or explicit failure behaviour.

A capability may be implemented incrementally, but no increment is considered active or complete unless it satisfies all applicable cross-cutting gates in this document.

Legacy-key deletion, AsyncStorage removal, old-runtime removal, compatibility-path cleanup, and other repository migration work are not product capabilities. They belong to the architecture recovery plan.

## Capability dependency map

```txt
canonical learning core
├── canonical local state and recovery
├── Algorithms non-simulation learning
├── Certification non-simulation learning
├── simulation systems
└── evidence, progress, and recommendation

all capabilities
├── content quality and provenance gate
├── accessible and resilient experience gate
└── security and privacy gate
```

## 1. Canonical learning core

Patternly has one family-neutral learning core for:

- session identity and lifecycle;
- immutable attempts;
- canonical result envelopes;
- content and occurrence references;
- review evidence and review mutation commands;
- evidence aggregation contracts;
- durable mutation outcomes;
- explicit unsupported and unavailable states.

The core supports family-owned interaction semantics without defining a global concrete-item union.

It preserves the following invariants:

- one active session;
- one canonical session envelope;
- one canonical attempt envelope;
- one review queue;
- deterministic and idempotent committed outcomes;
- no confidence collection;
- no synthetic readiness, retention, or mastery percentages;
- no default topic, item, answer, score, or feedback substitute.

Review evidence includes both:

- exact provenance to an item, attempt, session transition, or manual mark;
- family-owned skill, taxonomy, topic, mental-unit, or competency evidence.

Persistent review resolution follows the approved due-date and consecutive-success contract.

## 2. Canonical local state and recovery

Patternly persists canonical learning state locally through one repository boundary and one MMKV infrastructure client.

The capability includes:

- persistence before the first item appears;
- occurrence and option-order stability;
- one active-session reference;
- immediate-feedback practice commit;
- revisioned simulation drafts;
- resume;
- deliberate abandonment;
- completed-session results;
- learning-state reset;
- content-version mismatch handling;
- durable mutation journal;
- idempotent materialization and force-close recovery;
- explicit corruption and storage failures.

Static content is bundled and versioned. A content version identifies only the active bank.

The target product has no user account, cloud synchronization, remote learning-history store, or export/import contract.

Removal of old keys, AsyncStorage, Cloud write-through, and obsolete repository paths is recovery work, not part of this roadmap capability description.

## 3. Algorithms non-simulation learning

Algorithms supports these six non-simulation modes:

1. `Learn Approach`
2. `Guided Practice`
3. `Recognize Patterns`
4. `Contrast Practice`
5. `Weak Area Review`
6. `Independent Practice`

The capability includes:

- roadmap mental units;
- pattern families and variants;
- problem archetypes;
- skill atoms;
- recognition and contrast;
- strategy selection;
- state and invariant reasoning;
- adjacent-relation ordering;
- content-defined complexity;
- immediate authored feedback;
- compatible review selection;
- disclosed shortened review;
- constrained reinsert where permitted;
- summary and next-action evidence.

Algorithms content teaches decision mechanisms and transfer. It does not provide an online judge or claim to reproduce an external coding platform.

A normal session does not add duplicate content to satisfy a requested length.

## 4. Certification non-simulation learning

Certification supports these six non-simulation modes:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`

The capability includes:

- exam-domain taxonomy;
- competency areas;
- topics;
- skill atoms;
- scenario-based decisions;
- family-defined mode selection;
- competency-first remediation;
- topic-level focus;
- immediate authored feedback;
- stable-ID distractor explanations;
- source-aware technical content;
- review evidence and due-state handling;
- summary and next-action evidence.

Every mode must have an explicit contract for:

- entry intent;
- item selection;
- requested and actual length;
- feedback timing;
- timer behaviour;
- review policy;
- shortening behaviour;
- completion and summary.

A mode name alone is not sufficient implementation configuration.

## 5. Simulation systems

Patternly has two distinct simulation capabilities. They share canonical session, persistence, finalization, and result contracts but do not share the same timer or provenance semantics.

### 5.1. Algorithms Interview Simulation

Algorithms `Interview Simulation` is Patternly-defined.

It includes:

- exactly 40 unique items;
- a declared Algorithms simulation selection blueprint;
- 45 minutes of active foreground work;
- a foreground countdown that pauses outside the app;
- free navigation;
- editable persisted draft responses;
- persisted current position;
- deterministic resume;
- no reinsert;
- no correctness or instructional feedback before finalization;
- finalization-only attempts, scoring, evidence, and review mutation;
- distinct unanswered diagnostics;
- idempotent manual or foreground-timeout finalization;
- post-session authored feedback and family-specific breakdown.

It does not claim to reproduce an official assessment, a specific employer interview, or an uninterrupted real interview.

Preparation fails explicitly if 40 valid unique items cannot be selected.

### 5.2. Certification Exam Simulation

Certification `Exam Simulation` is driven by the selected track instance’s exact versioned `ExamExperienceProfile`.

The capability includes profile-controlled:

- official source and checked date;
- guide version where available;
- question count or range;
- absolute deadline;
- navigation;
- answer changes;
- flagging;
- navigator;
- sections;
- return to completed sections;
- automatic final submission;
- resume before the deadline;
- automatic finalization after expiry;
- unanswered diagnostics;
- raw correct count;
- percentage;
- competency breakdown;
- post-session review.

If a material official rule is unresolved, the track cannot claim faithful simulation.

No global exam defaults or official-looking pass/fail result are used.

## 6. Evidence, progress, review, and recommendation

Patternly converts committed learning outcomes into actionable evidence.

The capability includes distinct:

- `evidenceVolume`;
- `learningStageEvidence`;
- `performanceSignals`;
- review due state;
- repeated-mistake evidence;
- family-specific taxonomy or competency breakdown;
- deterministic recommendation;
- explanation of why an action is recommended.

Home prioritizes overdue review and repeated mistakes when they support an action.

A recommendation:

- is deterministic;
- is family-specific;
- names its evidence;
- does not lock a supported mode;
- can be overridden by a valid learner choice;
- does not claim AI authority;
- does not convert sparse evidence into certainty.

A visible metric must:

1. answer a concrete training question;
2. have sufficient supporting evidence;
3. lead to a meaningful training decision.

## Cross-cutting gate A — Content quality and provenance

Content quality is a prerequisite for activation, not a late hardening phase.

Every active instructional item has:

- a coherent prompt and constraint contract;
- stable interaction-element identities;
- an accepted-answer and scoring contract;
- concise authored `Reason`;
- complete authored `Details`;
- selected-error handling;
- meaningful stable-ID distractor explanations where applicable;
- valid taxonomy references;
- required provenance;
- structural validation;
- recorded human editorial approval.

Algorithms content is reviewed by mental unit and explicit contrast boundary.

Certification content is reviewed by competency area and topic and uses appropriate authoritative public sources.

Content correction occurs in the canonical active source. Runtime does not retain or translate obsolete explanations.

A fixed-length mode is not available unless the active bank satisfies its unique-item and blueprint requirements.

Automated validation does not replace human factual and educational review.

## Cross-cutting gate B — Accessible and resilient experience

Accessibility, mobile interaction design, explicit errors, and recovery states are required for every capability.

The product experience includes:

- approved visual and interaction design;
- accessible controls and semantic state;
- response states not dependent on colour alone;
- timer states matching the actual timing contract;
- explicit loading, saving, frozen, finalizing, unavailable, and failure states;
- no feedback before the active mode permits it;
- no generic feedback fallback;
- no silent route or content substitution;
- safe recovery actions only;
- dynamic text and supported contrast;
- keyboard, switch, and screen-reader behaviour where applicable;
- manual and screenshot-based verification of critical flows.

Missing required design blocks implementation. It does not authorize Codex to invent an alternative interaction.

## Cross-cutting gate C — Security and privacy

Every capability remains inside the approved local data boundary.

The product:

- stores only required canonical learning state;
- does not require an account or identity profile;
- does not transmit learning history under the current contract;
- does not claim encryption unless it is configured and verified;
- redacts learning payloads from production logs;
- requests no unrelated device permissions;
- defines reset and logical deletion accurately;
- distinguishes logical integrity from tamper-proof certification;
- verifies platform backup behaviour before making device-locality claims;
- does not add analytics, telemetry, remote content, or synchronization without a separate approved contract.

Local practice results are not official records or independently verifiable credentials.

## Capability completion criteria

A capability is complete only when all applicable evidence agrees:

1. the canonical product and domain contract is closed;
2. the data and persistence model represents every required state;
3. the owning family or application boundary is unambiguous;
4. automated contract, integration, persistence, negative, and accessibility tests pass;
5. required UI and interaction designs exist;
6. required error and recovery states are implemented;
7. active content passes structural validation;
8. active instructional content has recorded human editorial sign-off;
9. fixed-length session-pool requirements are satisfied;
10. security and privacy requirements are verified;
11. manual and screenshot-based QA covers critical states;
12. documentation matches the active implementation and content;
13. no hidden substitute or second authoritative path is required for the capability to appear functional.

A capability is not complete when:

- only its happy path works;
- content is structurally complete but not editorially approved;
- a required design is missing;
- a fixed-length mode silently shortens or duplicates content;
- an error becomes a default topic, item, answer, result, or explanation;
- an obsolete path remains necessary to preserve behaviour;
- planned work is reported as implemented.

## Relationship to the recovery plan

Documents `00`–`17` define the target product contract.

Document `18` converts those contracts into repository-specific implementation stages using current code evidence.

The recovery plan may choose an implementation sequence, introduce temporary execution gates, and identify paths to delete. It must not:

- redefine a capability;
- weaken an activation gate;
- reinterpret a mode;
- postpone required content quality, accessibility, security, or explicit failures beyond capability completion;
- treat current legacy code as a product requirement.
