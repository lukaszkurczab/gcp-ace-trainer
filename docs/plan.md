# Patternly — Working Execution Plan v3

**Status:** active execution-control document
**Repository:** `lukaszkurczab/gcp-ace-trainer`
**Product:** Patternly
**Repository baseline:** audited `main` at `ac412949a3d53c0712aebfb04476445b833bc41a`
**Baseline date:** 2026-07-16

## 1. Purpose

This document controls how Patternly work moves from an accepted product contract to repository implementation and verified completion.

It defines:

- implementation sequencing;
- current repository gates and blockers;
- the active execution stage;
- task boundaries;
- required deletion of obsolete paths;
- verification evidence;
- stage-completion decisions;
- the next safe task.

Documents `00–13` and `15–17` define the canonical product, architecture, learning, content, persistence, security, interaction, and testing contracts.

This Working Execution Plan is the only active document that defines repository-specific implementation order.

Do not create a separate architecture recovery plan, parallel execution plan, migration roadmap, or secondary stage-status document.

## 2. Authority hierarchy

Conflicts are resolved by contract ownership, not by document age, existing code, or previous task reports.

### 2.1. Canonical product contracts

Documents `00–13` and `15–17` define the target product.

Document `14 — Learning Effectiveness Model` is retired because its content is owned by:

- `01-product-definition.md`;
- `07-content-guidelines.md`;
- `15-certification-track-learning-system.md`;
- `16-leetcode-like-learning-system.md`;
- `17-training-runtime-and-interaction-spec.md`.

Document `14` defines no independent contract and must not remain an authority reference.

### 2.2. Approved design references

Approved visual references own concrete presentation where the canonical documentation delegates visual decisions.

They may define:

- layout;
- hierarchy;
- spacing;
- control placement;
- interaction presentation;
- required visual states.

They do not override:

- lifecycle;
- scoring;
- feedback timing;
- persistence;
- timer semantics;
- review policy;
- ownership boundaries;
- accessibility requirements.

### 2.3. This Working Execution Plan

This document owns:

- repository-specific implementation order;
- stage boundaries;
- current blockers;
- required verification;
- current execution status;
- active next task.

It does not redefine the target product.

### 2.4. Current repository

The repository is evidence of current implementation state.

Existing code is not automatically a product requirement.

A passing test protecting obsolete behaviour does not make that behaviour canonical.

### 2.5. Codex prompts and reports

A Codex prompt may narrow implementation scope but may not weaken a canonical contract.

A Codex report is evidence to inspect, not proof of completion.

Only pushed repository state and independently verified results can close a stage.

## 3. Non-negotiable execution rules

### 3.1. Move or delete

When an obsolete model, flow, module, route, key, API, test, or repository path is replaced:

- move valid responsibility to the canonical owner;
- delete the obsolete path in the same bounded stage;
- delete obsolete tests and fixtures;
- prove the old path unreachable.

Do not create:

- compatibility adapters;
- old-schema readers;
- translators;
- dual reads;
- dual writes;
- legacy fallbacks;
- bridge models;
- parallel runners;
- parallel storage systems;
- permanent migration flags;
- hidden default branches;
- generic substitute content.

### 3.2. One authoritative owner

After a verified stage, one concept has one authoritative owner.

Examples:

- lifecycle guards and family-neutral envelopes → shared kernel;
- workflow coordination → application use cases;
- Algorithms semantics → Algorithms family runtime;
- Certification semantics → Certification family runtime;
- persistence → canonical repositories;
- MMKV access → one infrastructure boundary;
- authored educational feedback → static content;
- rendering → approved shell and family interaction renderer.

Moving a file without moving responsibility does not satisfy this rule.

### 3.3. No hidden partial completion

A stage is not complete because:

- new files exist;
- typecheck passes;
- unit tests pass;
- the old implementation remains as fallback;
- a route is disabled;
- a screen renders fixture data;
- an error state is missing;
- content is structurally valid but unreviewed;
- an approved design is absent;
- Codex reports the intended result;
- a capability works only through a parallel legacy owner.

### 3.4. No temporary architecture

Do not introduce:

- temporary domain models;
- placeholder architecture;
- future-content flags;
- parallel “old” and “new” variants;
- compatibility scaffolding;
- hidden incomplete features;
- architecture intended to be replaced later.

A bounded stage may implement only part of the product, but the implemented part must already use its final canonical structure.

### 3.5. Explicit failure over substitution

Missing content, profile, draft, storage state, design, configuration, or interaction handler blocks the affected operation explicitly.

It must not produce:

- a default topic;
- another track;
- a generic item;
- a guessed answer;
- an empty successful session;
- a fabricated explanation;
- a substitute profile;
- an ordinary-looking result.

## 4. Execution loop

Every bounded repository task follows:

```txt
canonical contract
→ repository fact audit
→ exact implementation prompt
→ bounded implementation
→ required verification
→ push to GitHub
→ independent review of pushed state
→ gate decision
→ Working Execution Plan update
```

The pushed commit or pull request is the review source of truth.

Unpushed changes and narrative implementation reports cannot be accepted as completed work.

## 5. Result classification

Each implementation stage receives one result:

- `VERIFIED`
- `PARTIAL`
- `NEEDS_CORRECTION`
- `BLOCKED`
- `REJECTED`

Each applicable gate receives one result:

- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT_APPLICABLE`

A stage may be `PARTIAL` even when all executed tests pass.

A stage is `VERIFIED` only when every applicable gate passes.

## 6. Mandatory gates

### G-C — Contract gate

Requires:

- exact alignment with documents `00–13` and `15–17`;
- no undocumented behaviour;
- no implementation inferred from a mode name, old screen, or legacy service;
- all required product contracts closed.

### G-A — Architecture gate

Requires:

- correct dependency direction;
- one canonical owner;
- application-layer orchestration;
- no direct UI persistence or scoring;
- no family-owned repository implementation;
- no obsolete reachable owner;
- no global concrete-item union.

### G-P — Persistence and recovery gate

Requires:

- one MMKV infrastructure owner;
- one active session;
- persistence before the first item;
- revision-safe simulation drafts;
- deterministic journal operations;
- idempotent recovery;
- verified materialization;
- explicit mismatch and corruption states;
- canonical reset;
- no AsyncStorage or parallel storage path.

### G-L — Learning and content gate

Requires:

- correct family semantics;
- exact mode behaviour;
- exact scoring;
- review provenance;
- correct persistent-review lifecycle;
- active-content structural validation;
- recorded human editorial approval for active instructional batches;
- no runtime-generated educational explanations.

### G-D — Design and accessibility gate

Requires:

- approved visual reference for every required user-facing state;
- correct session top bar and actions;
- accessible response semantics;
- no colour-only state;
- approved saving, frozen, finalizing, error, and recovery states;
- screenshot and manual QA evidence.

### G-S — Security and privacy gate

Requires:

- approved local-data boundary;
- no unapproved telemetry or transmission;
- production-log redaction;
- no unverified encryption claim;
- permission and backup-policy review;
- accurate reset and deletion communication.

### G-Q — Quality-assurance gate

Requires the applicable subset of:

- `npm run qa:static`;
- architecture checks;
- required negative suite;
- application-use-case tests;
- repository and journal recovery tests;
- interaction-handler tests;
- accessibility tests;
- route smoke;
- Maestro flows;
- screenshot comparison;
- native development-build verification.

## 7. Verified repository baseline

The current `main` branch contains substantial recovery work.

Confirmed high-level facts include:

- MMKV and Nitro modules are installed;
- static QA scripts exist;
- UX/UI audit scripts exist;
- canonical mutation and repository infrastructure exists;
- Algorithms family-runtime work exists;
- immediate Algorithms practice has an application controller;
- Algorithms Interview Simulation has a controller, projections, screens, renderers, and draft persistence;
- the previous large Algorithms session screen and session model were removed;
- a shared training-session finalization mutation exists;
- a training-session draft model and repository exist;
- the latest recovery branch was merged into `main`.

These facts do not establish compliance with the final accepted contracts.

The current implementation was produced against an older documentation set and must be audited before further expansion.

## 8. Known contract deltas

The repository audit must verify at least these known deltas.

### D-01 — Canonical documentation is not yet applied

Repository documents do not yet contain the complete accepted corrections.

No further product implementation should be accepted before documentation closure.

### D-02 — Document 14 remains referenced

Document `14` must be deleted and all authority references removed.

### D-03 — Stale recovery-plan documents remain

Any previous architecture recovery plan or separate implementation roadmap must be deleted or explicitly retired.

This Working Execution Plan is the only active execution-order source.

### D-04 — Algorithms runtime ownership

Current code must be checked for family-runtime ownership of:

- draft persistence;
- foreground timer orchestration;
- finalization orchestration;
- repository coordination.

Those responsibilities belong to application use cases and repositories.

The family runtime owns deterministic Algorithms semantics.

### D-05 — Algorithms simulation flagging

Current Algorithms runtime and UI contain flagging.

The approved Algorithms Interview Simulation profile does not include flagging.

Flagging must be removed unless a later explicit product decision adds:

- a profile contract;
- data-model support;
- approved visual design;
- runtime semantics;
- tests.

### D-06 — Draft revision contract

The current simulation draft must be checked against the approved requirements for:

- schema version;
- draft version;
- monotonically increasing revision;
- expected previous revision;
- stale-write rejection;
- complete-record replacement;
- freeze of one exact durable revision at finalization.

### D-07 — Reinsert contract

The canonical contract requires:

- maximum one reinsert;
- at least three other materialized submitted attempts;
- reviewed variant where available;
- exact source only when no reviewed compatible variant exists;
- no session extension;
- no session reordering;
- deterministic conditional plan slots prepared before session start.

A two-item gap or opportunistic post-start plan mutation is incorrect.

### D-08 — Finalization visibility boundary

Practice feedback may appear after durable submit intent.

Simulation result and instructional feedback may appear only after finalization has been fully materialized and verified.

A durable finalization journal alone is insufficient.

### D-09 — Certification family completeness

All six non-simulation Certification modes require exact implementation contracts.

Current Cloud practice and review flows must not be assumed to satisfy:

- canonical mode identity;
- selection;
- length;
- feedback timing;
- review effects;
- summary;
- recommendation;
- persistence ownership.

### D-10 — Content activation

Active instructional content requires:

- structural validation;
- correct scoring;
- authored feedback;
- stable-ID distractor coverage;
- taxonomy validation;
- required provenance;
- recorded human editorial approval.

Renderable content is not automatically production-ready.

### Stage 1 audit evidence — 2026-07-16

Immutable repository evidence is recorded in [2026-07-16-repository-contract-delta-audit.md](audits/2026-07-16-repository-contract-delta-audit.md), audited at `ac412949a3d53c0712aebfb04476445b833bc41a`.

The audit confirms D-04, D-05, D-06, D-09, and D-10 as mismatches; D-07 has sufficient deterministic-selection evidence but must survive ownership cutover; D-08 has verified Algorithms finalization visibility evidence but Certification lifecycle writes remain outside the canonical boundary.

Missing product/design decisions are: the approved content-network boundary; a versioned official-source Certification `ExamExperienceProfile`; a recorded human editorial/technical content-approval contract; approved designs for draft conflict/recovery and the full Certification mode set; and verified backup, encryption, logging-redaction, and permission policy.

The audited `main` does not contain the pushed Stage 0 closure commit. Stage 1 is therefore `BLOCKED` from verification and Stage 2 cannot become active on this branch until Stage 0 is integrated into `main`.

## 9. Execution sequence

## Stage 0 — Canonical documentation closure

### Goal

Make the accepted documentation the only target contract and make this document the only execution-order source.

### Scope

- replace documents `00–13` with accepted versions;
- delete document `14`;
- replace documents `15–17` with accepted versions;
- remove every reference to document `14`;
- remove references to a future document `18`;
- delete or explicitly retire the existing architecture recovery plan;
- delete or retire previous parallel working plans;
- update documentation indexes and authority declarations;
- resolve conflicting terminology and contracts.

### Required consistency checks

Confirm one definition for:

- canonical document set;
- mode names;
- supported lengths;
- feedback timing;
- timer semantics;
- reinsert eligibility;
- three-item reinsert gap;
- draft ownership and revision;
- finalization visibility;
- Algorithms flagging;
- content activation;
- reset;
- security and privacy boundary.

### Restrictions

- no application code changes;
- no runtime fixes;
- no opportunistic cleanup outside documentation;
- no compatibility note preserving rejected documentation.

### Exit criteria

- documents `00–13` and `15–17` are present;
- document `14` is absent;
- no document `18` exists or is planned;
- no active recovery-plan document exists beside this plan;
- no active reference points to document `14` or `18`;
- cross-document contracts agree;
- documentation checks pass;
- exact commit SHA is recorded.

### Status

`ACTIVE NEXT TASK`

## Stage 1 — Repository-to-contract delta audit

### Goal

Audit the current `main` branch against the accepted canonical documentation.

### Scope

Inspect:

- shared domain and kernel;
- application use cases;
- family runtimes;
- simulation controllers;
- session and attempt models;
- draft model and repository;
- mutation journal;
- timer state;
- Algorithms screens;
- Certification practice and exam;
- navigation;
- Home, Practice, Progress, Review, and Settings;
- content manifests;
- content review records;
- QA and architecture checks.

### Required output

Produce a repository-grounded matrix containing:

- canonical requirement;
- current path;
- current owner;
- confirmed current behaviour;
- mismatch;
- applicable risk ID;
- required action:
  - keep;
  - move;
  - rewrite;
  - delete;

- required tests;
- required design reference;
- implementation dependency.

### Restrictions

- no product code changes;
- no speculative compliance;
- no reuse decision based only on file names or commit messages;
- no stage marked complete from earlier plan status.

### Exit criteria

- every affected canonical contract is mapped to repository evidence;
- known deltas D-01–D-10 are resolved or confirmed;
- current test baseline is recorded;
- missing design and product decisions are listed;
- the exact next implementation stage is bounded.

### Audit status

`BLOCKED` — the repository-to-contract matrix and verification baseline are complete, but the audited `main` still has Stage 0 active and D-01–D-03 open. The audit does not treat a closure commit on a non-ancestor branch as current-main evidence.

## Stage 2 — Canonical model, application, and persistence correction

### Goal

Align the shared model and persistence lifecycle with the accepted contracts.

### Expected scope

Subject to Stage 1 evidence:

- family-neutral kernel envelopes;
- explicit application use cases;
- discriminated active, completed, and abandoned sessions;
- canonical `AttemptResult`;
- one active-session reference;
- revisioned simulation draft;
- canonical foreground-timer state;
- journaled learning-state reset;
- startup recovery order;
- deterministic finalization;
- verified materialization boundary;
- exact content and profile resume checks.

### Required deletion

Delete any superseded:

- family-owned storage orchestration;
- direct screen repository access;
- non-revisioned draft path;
- parallel timer owner;
- old reset path;
- obsolete session model;
- unsupported flag state;
- obsolete journal operation.

### Exit criteria

- ownership matches documents `02`, `04`, `08`, `11`, and `17`;
- one canonical persistence path exists;
- draft conflict and recovery tests pass;
- old owners are unreachable;
- no user-facing capability is reported complete without its UI state.

## Stage 3 — Algorithms runtime correction and complete cutover

### Goal

Bring existing Algorithms implementation into exact compliance with the accepted family and runtime contracts.

### Scope

- all seven Algorithms modes;
- exact entry mappings;
- immediate-feedback practice;
- fixed 40-item Interview Simulation;
- 45-minute foreground countdown;
- revision-safe drafts;
- finalization-only attempts and review;
- unanswered diagnostics;
- conditional reinsert slots;
- three-item separation;
- family recommendations;
- Algorithms summary and review projections;
- approved practice and simulation screens.

### Required correction

At minimum:

- move persistence orchestration out of family runtime where present;
- remove unsupported Algorithms flagging;
- implement exact draft revision contract;
- implement conditional reinsert plan slots;
- enforce three intervening materialized submissions;
- withhold simulation results until verified finalization;
- preserve exactly 40 unique simulation items;
- expose explicit insufficient-content failure.

### Required deletion

Delete:

- unsupported flag controls and state;
- obsolete Algorithms runtime paths;
- dynamic post-start plan mutation;
- duplicate timer owner;
- duplicate finalization owner;
- tests protecting rejected behaviour.

### Exit criteria

- Algorithms lifecycle is testable without React;
- screens only render state and dispatch commands;
- all modes use one canonical application flow;
- all required states have approved designs;
- old Algorithms owners are absent;
- all applicable gates pass.

## Stage 4 — Certification family and GCP track cutover

### Goal

Replace Cloud-specific practice and exam ownership with one canonical Certification family runtime and declarative GCP track instance.

### Scope

Implement exact contracts for:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`
7. `Exam Simulation`

Include:

- competency-first remediation;
- topic-level focus;
- family-specific evidence;
- deterministic recommendations;
- versioned `ExamExperienceProfile`;
- absolute deadline;
- profile-controlled navigation;
- profile-controlled answer changes;
- profile-controlled flagging;
- profile-controlled navigator and sections;
- finalization-only simulation feedback;
- unanswered diagnostics;
- Patternly-defined result communication.

### Required deletion

Delete superseded:

- Cloud practice runtime;
- Cloud-specific write-through;
- global exam defaults;
- old exam persistence;
- `Question` bridge ownership;
- parallel history and review projections;
- compatibility fallback.

### Exit criteria

- GCP is a Certification track instance;
- adding another Certification track requires no new runner;
- all seven mode contracts are implemented and tested;
- the old Cloud runtime is unreachable;
- no official-looking pass/fail is displayed.

## Stage 5 — Shared session shell and product-surface cutover

### Goal

Complete visible product flows over the canonical runtime.

### Scope

- shared session shell;
- family interaction renderers;
- Home;
- Practice;
- Progress;
- Review;
- Settings;
- bottom navigation;
- active-session continue and abandon;
- canonical reset;
- route and CTA behaviour;
- explicit unavailable and failure states.

### Rules

- no dead CTA;
- no fake account;
- no legacy fallback;
- no default track or topic;
- no streaks;
- no levels;
- no badges;
- no readiness, retention, or mastery percentages;
- no route backed by an obsolete owner;
- no required screen without approved design.

### Exit criteria

- every visible CTA works or represents a truthful explicit unavailable state;
- all screens use canonical queries and commands;
- route smoke passes;
- required screenshot QA passes;
- obsolete screens and routes are removed.

## Stage 6 — Active-content activation and remediation

### Goal

Ensure every production-active instructional batch satisfies the complete content contract.

### Scope

Algorithms content is reviewed by mental unit and explicit contrast boundary.

Certification content is reviewed by competency area and topic.

Every activated batch includes:

- structural validation;
- stable identity validation;
- accepted-answer verification;
- scoring verification;
- authored `Reason`;
- complete authored `Details`;
- stable-ID wrong-option explanations;
- taxonomy validation;
- required provenance;
- human technical review;
- human editorial review;
- review record;
- active-manifest update;
- content-version update.

### Runtime relationship

Earlier implementation stages may use:

- bounded reviewed fixtures;
- bounded approved development banks;
- already approved active batches.

Unreviewed content cannot be labelled production-ready or added to the production active manifest.

### Exit criteria

- every active item is covered by a matching review record;
- fixed-length modes satisfy unique-content requirements;
- no generic feedback exists;
- no active item relies on runtime-generated explanation;
- manifest, version, and review records agree.

## Stage 7 — Security, accessibility, QA, and release hardening

### Goal

Prove the canonical implementation under supported runtime conditions.

### Scope

- native MMKV development and release builds;
- startup and journal recovery;
- corruption and mismatch states;
- platform backup policy;
- log redaction;
- permission inventory;
- network inventory;
- screen-reader QA;
- dynamic text;
- reduced motion;
- contrast;
- structural response states;
- Maestro critical flows;
- screenshot comparison;
- release checklist;
- CI gates.

### Exit criteria

- all Critical and High risks are mitigated;
- required automated suites pass;
- required manual QA is recorded;
- screenshots match approved designs;
- privacy and reset copy match verified behaviour;
- no unverified area is reported complete.

## 10. Current stage status

| Area                               | Current classification | Reason                                                                    |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| Canonical documentation            | `NEEDS_CORRECTION`     | Accepted revisions are not yet applied                                    |
| Document 14                        | `REJECTED`             | It duplicates other canonical owners                                      |
| Previous recovery plan             | `REJECTED`             | Separate execution sequencing is no longer permitted                      |
| Repository-to-contract audit        | `BLOCKED`              | Evidence recorded; Stage 0 closure is not in audited `main`              |
| Shared kernel and mutations        | `PARTIAL`              | Significant implementation exists but requires contract audit             |
| MMKV and repositories              | `PARTIAL`              | Revision, reset, bootstrap, and ownership require verification            |
| Algorithms immediate practice      | `PARTIAL`              | New controller exists but must be audited against final lifecycle         |
| Algorithms Interview Simulation    | `NEEDS_CORRECTION`     | Known flagging and draft-contract mismatches                              |
| Certification non-simulation modes | `BLOCKED`              | Exact contracts must be mapped and implemented                            |
| Certification Exam Simulation      | `PARTIAL`              | Existing system requires canonical profile and finalization audit         |
| Product surfaces                   | `PARTIAL`              | Must be revalidated after runtime correction                              |
| Active content quality             | `PARTIAL`              | Production activation requires complete review evidence                   |
| Static QA                          | `PARTIAL`              | Existing checks require alignment with final negative and recovery suites |
| UX/UI audit                        | `PARTIAL`              | Existing scripts require updated canonical-state coverage                 |

No earlier stage remains `VERIFIED` solely because an older plan marked it complete.

## 11. Active next task

### Task ID

`WEP3-00 — Integrate canonical documentation closure into main`

### Goal

Integrate the already-pushed Stage 0 closure into `main`, then independently recheck its canonical-document inventory before Stage 1 verification.

### Required changes

- merge or otherwise integrate the Stage 0 closure commit without changing its contract;
- verify the exact canonical document set and absence of retired references on `main`;
- retain this audit as immutable evidence and then update Stage 1 from `BLOCKED` using the integrated SHA.

### Out of scope

- application code;
- runtime fixes;
- new content;
- UI implementation;
- route changes;
- new product features.

### Required verification

- documentation-reference audit on `main`;
- Stage 0 closure SHA is an ancestor of `main`;
- no second execution-order document;
- exact changed-file inventory;
- pushed commit SHA.

### Completion report

The report must include:

- starting SHA;
- ending SHA;
- exact documents changed;
- documents deleted or retired;
- references removed;
- checks run;
- unresolved documentation conflicts;
- confirmation that no application code changed.

## 12. First Stage 2 task after the Stage 0 unblock

After `WEP3-00` is integrated and the Stage 1 audit status can be verified, the first bounded Stage 2 cutover is:

```txt
WEP3-02 — Algorithms simulation persistence-boundary cutover
```

Its exact scope is limited to removing unsupported Algorithms flagging, moving simulation draft/session/timer/finalization orchestration from `AlgorithmsFamilyRuntime` into application use cases and repositories, and replacing timestamp-only draft persistence with schema/draft revision plus expected-previous-revision rejection. It must preserve the existing fixed-plan reinsert semantics and verified no-results-before-finalization boundary.

It must not implement Certification modes, content activation, product-surface redesign, compatibility/migration readers, or new UI features.

The audit determines which parts of the current implementation are:

- canonical and reusable;
- structurally useful but semantically incorrect;
- owned by the wrong layer;
- obsolete and required to be deleted.

Stage 2 starts only after this audit is accepted.

## 13. Required implementation report

Every Codex implementation report contains:

- task ID;
- starting SHA;
- ending SHA;
- branch;
- files changed;
- canonical owners modified;
- obsolete owners deleted;
- applicable risk IDs;
- gate results;
- commands and results;
- test counts;
- manual QA performed;
- screenshots produced;
- unverified areas;
- blockers;
- next safe task.

The report must separate:

- implemented and verified;
- implemented but unverified;
- planned but not implemented;
- blocked.

## 14. Forbidden immediate work

Until Stages 0 and 1 are verified, do not:

- add runtime features;
- add another Algorithms interaction;
- add Certification modes by inference;
- expand Home or Progress metrics;
- preserve legacy Cloud behaviour;
- add compatibility code;
- add backend content loading;
- add analytics or telemetry;
- add authentication or account UI;
- perform broad content generation;
- mark the current Algorithms simulation complete;
- patch the obsolete recovery plan;
- create another execution roadmap.

## 15. Working-plan maintenance

This document is updated only when:

- a stage is independently reviewed;
- pushed repository evidence exists;
- applicable gates are evaluated;
- the active next task changes;
- a new blocker materially changes sequencing.

Do not update status from:

- Codex intention;
- local unpushed work;
- a task prompt;
- a partial test run;
- a planned follow-up.

This document remains the single execution-control surface.

It must not become a second product specification, but no separate recovery or implementation-sequencing document may duplicate its responsibility.
