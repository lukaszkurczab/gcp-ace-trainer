# Patternly — Codex directive 3/3: architecture verification and single release implementation plan regeneration

## Mandate

Audit the actual Patternly architecture against the newly reconciled canonical documentation, then regenerate the repository’s **single** implementation plan from the present codebase to a release-ready commercial application.

Primary repository:

- application: `lukaszkurczab/gcp-ace-trainer`, canonical branch `main`.

Related repository:

- content/publishing: `lukaszkurczab/patternly-content`, canonical branch `master`.

Directives 1 and 2 must already be completed, pushed, and independently verified. The current canonical contract and documents `00`–`13`, `15`–`17` are now the target source of truth. This task must verify the implementation delta and produce an actionable execution plan. It must not implement product code, produce Figma designs, install Storybook, mutate cloud/store resources, or start the first planned implementation task.

Regenerate `docs/launch-completion-plan.md` **in place** as the only active execution-control document. Do not create a second roadmap, recovery plan, architecture plan, design plan, commercial plan, task ledger, or status document.

Commit and push the plan-only change, then stop.

## Authority

Use this hierarchy:

1. `docs/canonical-product-contract.yaml` and its executable schema/parser/tests;
2. Product Owner decision register;
3. documents `00`–`13` and `15`–`17` according to their ownership;
4. current pushed application/content source and tests as implementation evidence;
5. ADRs as technical history/current technical decisions;
6. this regenerated plan as implementation order and status only;
7. reports, audits, screenshots, Figma work, Storybook stories, and test artifacts as evidence only.

Do not redefine product behavior inside the plan. Link to the canonical owner and state the implementation consequence.

## Phase boundary

### In scope

- complete repository-to-contract architecture and implementation audit;
- keep/move/rewrite/delete classification of current code, tests, routes, reports, design references, infrastructure, and cross-repository contracts;
- dependency graph and sequencing;
- parallel work lanes and owner/external checkpoints;
- atomic task decomposition from current state through release readiness;
- task acceptance criteria, deletion obligations, tests, evidence, and gates;
- explicit current task and next executable task;
- regeneration of `docs/launch-completion-plan.md` in place;
- minimal index/authority-reference updates required to make that plan the sole execution source.

### Out of scope

- application, server, content, schema, UI, Storybook, Figma, build configuration, or provider implementation;
- package installation or Expo migration;
- creation of brand directions, design frames, tokens, components, stories, or screenshots;
- content generation or track population;
- cloud, RevenueCat, Firebase, store, domain, email, PITR, signing, deployment, or billing mutations;
- marking implementation complete based on documentation or prior reports;
- continuing the old Task 3 or Task 5 loop.

Read source to determine plan facts; do not modify source in this phase.

## Required architecture audit

Inspect both repositories from clean checkout state where practical.

### Application repository

At minimum inspect:

- package versions, Expo/RN configuration, native config, permissions, backup policy, icon/splash/adaptive/monochrome assets;
- composition root and bootstrap;
- shared learning kernel, family runtimes, track registry, content integration;
- local repositories, MMKV ownership, mutation journals, active-session records, drafts, timers, recovery, reset;
- current account/server client work, secure storage, environment schema, privacy boundary, network clients;
- server Authentication, Firestore, Cloud Run, adoption, sync, snapshot, deletion, HTTP, environment, IAM/deployment assumptions;
- route inventory and actual navigation, including Home, Language, account absence, Practice, Progress, Settings, simulations, reviews, and summaries;
- current theme/tokens/components, visual drift, design reference registry, Figma capability evidence, assets and licensing;
- current tests, architecture checks, QA scripts, Maestro flows, screenshot tooling, Storybook absence/presence, build boundaries, CI;
- current launch/public web artifacts, legal/support/deletion surfaces, analytics/crash/report clients, package delivery, RevenueCat, backup/runbook, signing, and store state;
- stale code and tests protecting superseded account-wide session, account-gated entry, all-bundled content, visible family, Home, Language, local-only, or old design behavior.

### Content repository

At minimum inspect:

- canonical source versus built/published artifacts;
- schemas and semantic validators;
- release manifests and immutable release identity;
- current bundled release and app lock;
- track/family identifiers and Algorithms-to-Coding-Interview migration impact;
- package generation and whole-node boundaries;
- `freeNodeId` and free-vertical readiness;
- locale/evidence identity;
- ten-track brief/content-plan support;
- provenance, editorial/technical review, report-to-correction workflow;
- cross-repository reproducibility and byte verification.

### External state as evidence

Inspect repository records of external resources and only query actual providers where read access is already available and necessary to avoid a false plan assumption. Do not perform mutations.

Distinguish:

- confirmed external state;
- repository claim not externally verified;
- external action already authorized but not performed;
- external action requiring fresh owner authorization;
- external input that can be deferred without blocking local work.

## Required impact classification

For every material current subsystem, use one action:

- `KEEP` — fits the target owner and semantics;
- `MOVE` — responsibility is useful but owned by the wrong layer/path;
- `REWRITE` — concept remains but target semantics materially differ;
- `DELETE` — obsolete, duplicate, placeholder, compatibility, or unsafe path;
- `ADD` — missing final capability;
- `VERIFY` — implementation may be correct but lacks required evidence;
- `EXTERNAL_GATE` — code/docs can proceed, but final closure needs an owner/provider/store action.

Record:

- current path and owner;
- verified behavior;
- canonical target owner;
- reason for classification;
- dependencies;
- required migration/deletion;
- tests and evidence;
- affected repository or external system.

Do not infer compliance from filenames, reports, old task status, or passing tests that protect superseded behavior.

### Mandatory current-model impact areas

Explicitly classify at least:

- account-gated bootstrap before Home/track selection;
- current local guest capability or absence;
- guest-data adoption primitives;
- synchronized account dataset and compact outbox;
- any account-owned `activeSessionReference` or remote session/draft/timer/current-position model;
- one-active-session-across-account assumptions;
- cross-device active-session resume/conflict logic;
- existing Firebase Authentication/Cloud Run/Firestore server foundation;
- email/password-only assumptions;
- link expiry and action-handler assumptions;
- account deletion and subscription assumptions;
- all-content-bundled assumptions;
- network/privacy gate and approved-client registration;
- Home/Practice/Progress overlap;
- Language route;
- Activity absence;
- visible family/category copy and hard-coded two-track branches;
- Algorithms versus `coding_interview` identity;
- track registry scalability and ten-track briefs;
- remote whole-node package absence;
- RevenueCat/entitlement absence;
- analytics/crash/report absence;
- backup/PITR absence;
- current Expo 54/platform configuration versus target Expo 57 matrix;
- Light-only/iPad claims;
- current design references versus new Figma/Storybook/code authority;
- absence of Storybook and release-exclusion proof;
- current app icon, typography, tokens, motion, haptics, public/store visual assets;
- retained RC/device evidence and whether it still gates anything under the new plan.

## Regenerate, do not append

The existing `docs/launch-completion-plan.md` is expected to contain extensive historical task packets, repair transcripts, QA narratives, environment blockers, and outdated sequencing. Do not append another amendment.

Replace its body in place with a compact, current, navigable Working Execution Plan.

Use Git history and retained reports for detailed history. Preserve only facts that affect current sequencing, external state, risk, or reuse decisions.

The regenerated plan must:

- be the only active execution-order source;
- be readable by a human scanning for current state and next work;
- let Codex select one unambiguous next task;
- preserve traceability to completed work through SHA/report links without copying entire reports;
- separate target contract from current implementation status;
- separate implementation tasks from owner approvals and external mutations;
- prevent a blocked device/design/external lane from stopping unrelated safe work;
- prevent significant UI implementation before its approved design;
- prevent bulk track/content copying before representative family proofs;
- prevent release claims without full evidence.

Do not retain old task numbers as active merely to preserve history. Do not reuse an old ID for a materially different task. Include a concise old-to-new mapping for still-relevant open work.

## Required plan structure

Use a structure equivalent to the following.

### 1. Purpose and authority

State:

- this file owns repository implementation order and current status only;
- canonical product behavior lives elsewhere;
- no parallel plan is permitted;
- reports and designs are evidence;
- how task status may be updated.

### 2. Audited repository baseline

Record:

- audit date;
- branch and exact HEAD SHA for both repositories;
- clean/dirty state;
- current package/platform baseline;
- current content release lock;
- verified external-resource baseline;
- current tests/gates and known environment limitations;
- current product/runtime surfaces at a concise level.

Do not copy stale historic counts without re-verification.

### 3. Architecture verdict and impact map

Summarize:

- compatible foundations to preserve;
- incompatible assumptions to migrate/delete;
- missing capabilities;
- cross-repository changes;
- highest-risk ownership transitions;
- architecture invariants that every task must preserve.

Link to a detailed impact matrix if its size would overwhelm the plan. The matrix remains implementation evidence, not a second plan.

### 4. Dependency graph and parallel lanes

Show explicit dependencies and safe parallelism.

At minimum distinguish:

- canonical nonvisual runtime/backend/data lane;
- brand/Figma approval lane;
- Storybook/design-system implementation lane;
- vertical product/UI lane;
- content/package/track lane;
- platform/release/public/store lane;
- external owner/provider mutation lane.

Nonvisual kernel, application, persistence, server, package, and test work may proceed while brand exploration is active when it does not commit a new user-facing presentation.

Significant new or rewritten UI must wait for the applicable approved Figma state. Do not serialize the entire project behind logo work, and do not bypass design approval with a generic UI.

### 5. Stage and task register

Every task must use the task contract below and be small enough for one coherent Codex execution window while still delivering a reachable final-architecture slice.

### 6. External and owner checkpoints

Maintain a separate register for:

- actual Figma owner reviews;
- final design handoff approval;
- RevenueCat/App Store/Play product creation;
- production domain/DNS/sender setup;
- Firebase/Cloud/GCP mutations requiring authorization;
- PITR enablement and restore drill authorization;
- Apple/Google provider console setup;
- store app registration;
- signing identities and secrets;
- TestFlight/Play testing and release submissions.

Each checkpoint states what local work can continue before it.

### 7. Gates

Define existing or extended gates for:

- contract/documentation;
- architecture/dead paths;
- persistence/recovery/sync;
- security/privacy/consent;
- entitlement/store authority;
- package/content integrity;
- learning/content quality;
- brand/Figma approval;
- Storybook/code authority and release exclusion;
- accessibility/motion/haptics/performance;
- iOS/Android device behavior;
- public/legal/support/store assets;
- clean signed artifacts;
- final release GO/NO-GO.

### 8. Current active task and next executable task

Name exactly one current active task after plan generation, or state that the plan is ready and name the exact next task to execute. Include:

- why it is first;
- prerequisites already satisfied;
- blockers that do not affect it;
- first acceptance boundary.

Do not begin it in this directive.

### 9. Plan maintenance rules

Status changes require:

- pushed repository evidence;
- applicable gate results;
- obsolete-path deletion proof;
- truthful verification state;
- exact next-task update.

Do not embed raw test logs, repair diaries, or repeated partial attempts in the plan. Link durable reports instead.

## Mandatory task template

Every task must contain:

- `Task ID`;
- `Title`;
- `Status`: `READY`, `ACTIVE`, `BLOCKED`, `PARTIAL`, `VERIFIED`, or `SUPERSEDED`;
- `Objective`;
- `Why now`;
- `Canonical owners`;
- `Confirmed current repository state`;
- `Dependencies`;
- `Repositories and expected paths`;
- `Scope`;
- `Out of scope`;
- `Implementation requirements`;
- `Keep / move / rewrite / delete obligations`;
- `Acceptance criteria`;
- `Automated verification`;
- `Manual/device/visual evidence`;
- `Security/privacy/content implications`;
- `External or owner checkpoint`;
- `Completion report target`;
- `Next task unlocked`.

Do not create tasks such as “implement authentication” or “finish UI” without bounded vertical acceptance. Do not split work into port-only, interface-only, or unused scaffolding tasks unless that artifact is independently executable and final.

## Preliminary implementation decomposition to validate

Use the following as a starting hypothesis, not as an unquestioned order. Reorder or split it after the architecture audit. Preserve dependency logic.

### Foundation and migration control

#### Stage 0 — audited implementation impact and deletion map

- convert the architecture audit into machine-readable keep/move/rewrite/delete obligations;
- map old task/evidence status to the new plan;
- identify exact first code slice;
- verify clean-checkout app and server CI commands;
- add only plan-scheduled missing architecture/static checks later, not in this directive.

#### Stage 1 — platform/tooling dependency baseline

- determine the correct point for Expo SDK 57 migration;
- align target iOS/Android matrix, native config, backup exclusion, build identities, and clean CI;
- do not force the SDK migration inside an unrelated account slice;
- complete it before final design-system/device freeze at the dependency point proven by the audit.

### Guest, account, and synchronized commercial foundation

#### Stage 2 — guest-first bootstrap and bundled Free vertical

- local installation identity and guest dataset;
- Today/track entry without account;
- bundled complete `freeNodeId` resolution;
- free-only session selection without Premium filler;
- guest goals/progress/review/activity/settings;
- offline operation;
- delete account-gated-first-value path and tests.

Prefer a reachable guest vertical over generic account scaffolding.

#### Stage 3 — guest-to-account adoption

- registration/sign-in boundary over existing provider foundation;
- truthful adoption preview;
- new-empty-account default preserve plus explicit discard;
- existing-account deterministic reconciliation;
- active guest session finish-or-abandon rule;
- convergence verification and binding;
- restart/failure/data-loss tests;
- preserve compatible existing adoption/sync transport and rewrite obsolete account-wide session cases.

#### Stage 4 — complete identity and account-security vertical

Decompose into coherent reachable slices covering:

- email/password registration, verification, sign-in, reset/recovery;
- environment-driven web action handler and result taxonomy;
- password/email change with reauthentication;
- sign out current/all devices and API revocation enforcement;
- Sign in with Apple and Sign in with Google linking/unlinking;
- recovery-code generation, hashing, one-time use, regeneration, narrow recovery session, and session revocation;
- Terms version acceptance;
- account/profile/security surfaces after approved design.

Do not retain email/password-only assumptions or auto-link by email.

#### Stage 5 — device-owned session and incremental sync migration

- remove remote active-session reference, draft, position, timer, account-wide conflict, and cross-device resume;
- preserve one active session per device and canonical local journal;
- enqueue compact idempotent account operations after local durability;
- current-track, goals, attempts, results, review, terminal summaries, and stable content refs;
- incremental cursors, pagination, compact projections, recent Activity, due review/current track;
- on-demand exact history/results;
- sign-out/deletion/revocation interactions;
- migration/deletion of superseded tests and server fields.

#### Stage 6 — RevenueCat and backend Premium entitlement

Decompose into:

- entitlement/account/store model and environment contracts;
- RevenueCat SDK identity using opaque Patternly account ID;
- webhook/backend normalization and idempotency;
- backend Premium projection and short bounded client cache;
- seven-day offline grace and known revoke/refund/expiry precedence;
- purchase/restore/conflict/cross-platform flows;
- guest purchase prohibition;
- downgrade and already-started-session behavior;
- Free alternative recommendation;
- approved UI/paywall after actual first value;
- sandbox/store-console mutations as separate gates.

#### Stage 7 — immutable remote whole-node package pipeline

Decompose across content, server, and mobile:

- track/node/package manifest schema;
- package builder and immutable Cloud Storage object identity;
- release reproducibility and byte checks;
- backend identity/entitlement authorization and signed URL;
- temporary download, checksum, schema/semantic validation;
- versioned local storage and atomic active pointer;
- crash rollback to previous verified version;
- session version pinning;
- review multi-package resolution;
- cache eviction with active-session protection;
- free-node bundling and later explicit offline download compatibility;
- negative proof against per-question Firestore fetching and silent substitution.

#### Stage 8 — account deletion and subscription behavior

- active entitlement display and truthful copy;
- Manage subscription;
- immediate Delete now independent of billing;
- scheduled end-of-paid-period deletion where technically supported;
- Patternly account/data/entitlement-association deletion;
- processor detachment and privacy disclosure;
- public possession-verified deletion flow;
- deleted-account cleanup on previously bound devices;
- no automatic refund/cancellation claim.

#### Stage 9 — analytics, crash, consent, and content reports

- fail-closed analytics/crash consent/privacy gate for launch market;
- closed event schemas and forbidden-field enforcement;
- sanitized Crashlytics boundary;
- content report local/offline/server/admin model;
- account-unlinked default and explicit contact/account consent;
- retention/de-identification/deletion behavior;
- report correction workflow in content repository;
- no raw Firestore event stream.

#### Stage 10 — PITR and restore safety

- configuration packet and provider gate;
- seven-day PITR contract;
- restore runbook;
- sanitized sandbox drill;
- deletion tombstone/proof reconciliation;
- no deleted-account resurrection;
- privacy copy and disaster-recovery boundary;
- no long-term scheduled export at launch.

### Brand and product-design lane

#### Stage B1 — repository/design/tooling baseline

- audit current token/theme/component/icon/font/motion/haptic/public/store state;
- verify actual Figma write access;
- verify Storybook compatibility with the audited Expo/RN stack;
- verify current visual/screenshot tooling and release bundle boundaries;
- decide exact maintainable technical choices from evidence.

#### Stage B2 — focused landscape and anti-reference audit

- technical learning, developer tools, AI, analytics, workflow, cloud, `P` marks, modular marks, nodes, branches, negative space;
- clichés and collision risks;
- no trademark claim.

#### Stage B3 — three Figma directions and owner review

Produce actual editable proof sets for three structurally different directions. Stop only at the owner review of actual frames/components.

#### Stage B4 — two finalists and owner review

Develop the required Light/Dark, hero, track visual, motion/reduced-motion, first-entry, feedback, summary/next-action, and store proofs.

#### Stage B5 — one final system and owner approval

Finalize mark, optical icon, wordmark, typography, palette, track symbols, illustration, motion, haptics, public/store applications, and approved product references.

### Storybook and design-system implementation lane

#### Stage D1 — repository-owned token/asset authority

- one platform-neutral token source;
- generated/typed production theme and Storybook docs;
- Light/Dark/System, track accents, semantic response/status colors, typography, spacing, surfaces/elevation, motion, haptic metadata;
- licensing records;
- lint/architecture checks against unsafe literals/overrides.

#### Stage D2 — development-only React Native Storybook

- audited compatible package/version;
- separate development target/entry;
- deterministic typed fixtures over canonical view-model contracts;
- no MMKV/repositories/account/payment/sync/session lifecycle;
- layered production-component catalogue;
- machine-readable risk-based coverage and `NOT_APPLICABLE` reasons;
- local visual regression without paid hosted dependency;
- static proof that Storybook is absent from release graph/bundle.

#### Stage D3 — canonical primitives, components, shells, states

- brand foundations;
- controls and response interactions;
- learning/session shells;
- loading/empty/offline/error/saving/frozen/finalizing/recovery/destructive states;
- motion/reduced-motion and haptic adapters;
- large text/accessibility;
- Figma-to-code visual verification.

### Vertical product design-code cycles

For every user-facing vertical, create task groups following:

```txt
canonical product/runtime contract
→ complete state inventory
→ Figma draft
→ owner review and APPROVED state
→ production implementation
→ Storybook canonical states
→ interaction/accessibility tests
→ screenshot comparison
→ iOS and Android device verification
→ obsolete-path deletion
→ gate and plan update
```

Apply the cycle to at least:

- first-run value/track/goal/guest flow;
- Today;
- Practice discovery, roadmap, setup, downloads, entitlement state;
- ordinary learning runner and feedback;
- simulations and finalization/review;
- Progress and nested Activity;
- Settings;
- account/security/adoption;
- Premium/paywall/purchase/restore/downgrade;
- sync/offline/package states;
- content report;
- account deletion;
- public auth/action/legal/support/deletion surfaces.

Do not duplicate one generic UI task across all flows. Each task must include its real state inventory and runtime dependency.

### Multi-track, family, and content lane

#### Stage T1 — registry and internal family contracts

- user sees tracks only;
- internal `certification`, `coding_interview`, `design_interview` families;
- atomic Algorithms/Coding Interview migration prerequisite or migration;
- realistic ten-track descriptors in internal density harness/tests;
- no empty production cards.

#### Stage T2 — ten canonical track briefs

For each target track define:

- job-to-be-done and target learner;
- internal family;
- taxonomy outline;
- `freeNodeId`;
- valid modes;
- goal templates;
- Progress dimensions;
- package/content plan;
- provider/provenance constraints;
- launch/commercial admission gate.

No bulk question generation.

#### Stage T3 — representative family/track proofs

Sequence proofs so architecture is validated before copying:

1. GCP ACE as Certification reference;
2. Coding Interview as migrated/extended Algorithms product;
3. Backend System Design as first Design Interview reference;
4. AWS SAA as second Certification proof requiring no new shared runtime;
5. Object-Oriented Design as second Design Interview proof that the family is not backend-hard-coded.

Each production registry admission requires a real free vertical and complete core loop.

#### Stage T4 — remaining launch tracks and content population

- remaining track briefs/contracts/packages/free verticals;
- coverage-matrix-driven content creation;
- technical/editorial/provenance validation;
- immutable package publication;
- no fixed filler counts;
- no production placeholder entry.

Schedule this only after representative proofs close the shared architecture.

### Platform, public surface, and release lane

#### Stage R1 — platform migration and hardening

At the dependency point established by audit:

- Expo SDK 57;
- iOS 16.4+, iPhone-only/no iPad claim;
- Android API 28 minimum/36 target;
- portrait;
- Light/Dark/System;
- 200% text scaling;
- local platform backup exclusion;
- app links/universal links;
- performance baseline and budgets;
- physical-device matrix preparation.

#### Stage R2 — public site and transactional surfaces

- canonical web artifact;
- product landing;
- support;
- Privacy;
- Terms;
- account deletion;
- auth/action handler;
- professional domain/sender/association promotion gate;
- truthful development support destination until then.

#### Stage R3 — perceived-quality and accessibility closure

- whole-product visual consistency;
- loading/layout stability/flicker;
- motion/reduced motion;
- semantic haptics;
- screen reader;
- 200% text;
- keyboard/switch where applicable;
- iOS/Android platform behavior;
- small practical usability/first-use beta review;
- content/brand/provider-affiliation audit.

#### Stage R4 — brand handoff and Figma independence

- final vectors and exports in repository;
- tokens/components/states implemented and visually verified;
- Storybook and baselines complete;
- licensing/source records;
- versioned design baseline/deprecation history;
- local Figma export where tooling permits;
- owner final handoff approval;
- `CODE_CANONICAL` and no CI/build/ordinary-development dependency on paid Figma.

#### Stage R5 — store and signed-artifact closure

- App Store Connect and Play Console records;
- RevenueCat production products/entitlement/offering;
- iOS distribution/signing/TestFlight;
- Android upload key/Play App Signing/internal track;
- privacy declarations and data safety;
- store metadata, icon, screenshots, feature graphics;
- actual signed physical-device smoke on both platforms;
- release candidate freeze;
- final GO/NO-GO.

## Sequencing rules

The regenerated plan must enforce:

1. guest-first bootstrap before account-gated UI expansion;
2. guest adoption before destructive old bootstrap removal is called complete;
3. device-session migration before sync is called target-compliant;
4. backend entitlement before Premium package authorization;
5. package integrity before remote content-backed sessions;
6. privacy/consent contracts before analytics/crash enablement;
7. design approval before significant new UI;
8. Storybook/token foundation only after sufficient final visual direction exists;
9. representative family proofs before broad track copying or bulk content;
10. platform migration at its audited dependency point, before final UI/device freeze;
11. public domain/store/provider mutations as explicit gates, not prerequisites for local code unless technically required;
12. final Figma handoff only after implementation and visual verification;
13. no release claim before signed-artifact smoke and all applicable gates.

## Gate requirements

Extend existing gates rather than inventing duplicate frameworks. Each task identifies applicable gates.

### Contract gate

- canonical requirement and owner referenced;
- no product behavior invented in plan or code;
- superseded tests/paths identified for deletion.

### Architecture gate

- one owner per responsibility;
- no parallel learning lifecycle, persistence path, entitlement authority, package bank, UI implementation, or design authority;
- no compatibility alias or fallback;
- dependency direction enforced.

### Persistence/sync gate

- local journal-first correctness;
- device-owned active session;
- idempotent account operations;
- revision/cursor conflict behavior;
- restart and failure injection;
- no silent data loss.

### Security/privacy gate

- identity/token/recovery-code protections;
- approved clients and closed schemas;
- logging/analytics/report redaction;
- consent/disclosure;
- deletion/subscription truth;
- backup/restore/tombstone safety.

### Entitlement/package gate

- store/RevenueCat/backend authority;
- seven-day grace;
- signed URL authorization;
- immutable object/checksum/schema/semantic validation;
- atomic activation and version pinning;
- Free/Premium filtering.

### Learning/content gate

- family semantics preserved;
- authored feedback/provenance;
- coverage-matrix content planning;
- free vertical completeness;
- no placeholder or filler content;
- cross-repository reproducibility.

### Design/Storybook gate

- actual owner-approved Figma work where required;
- no Codex self-approval;
- production components in Storybook;
- risk-based state coverage;
- visual/interaction/accessibility proof;
- Storybook absent from release;
- code/assets/tokens handoff complete.

### Platform/device/performance gate

- exact target matrix;
- Light/Dark/System;
- 200% text and screen reader;
- reduced motion and haptics;
- performance budgets;
- iOS/Android real device evidence;
- signed build where required.

### Public/store/release gate

- public legal/support/deletion/auth surfaces;
- professional domain/sender/links;
- privacy/store declarations;
- store assets;
- production subscriptions;
- signing and distribution;
- final signed-artifact smoke;
- no open Critical/High risk without explicit launch decision.

## Plan quality constraints

The final plan must be:

- broad enough to cover every required task from current state to release;
- precise enough that each task can be executed without another planning prompt;
- compact enough to scan;
- explicit about current facts versus target work;
- dependency-driven rather than numbered by historical accident;
- honest about external gates;
- free of raw repair transcripts and repeated status prose;
- free of unbounded tasks and generic “polish” stages;
- free of false completion based on reports, Figma frames, Storybook rendering, compile success, or partial tests.

As a practical guardrail, keep the active plan materially smaller than the superseded plan. When detailed matrices are necessary, store them as narrowly scoped evidence and link them. Do not let those matrices become a second execution source.

## Verification requirements

Before committing the regenerated plan:

- verify every canonical capability has at least one implementation task or explicit verified-current-state mapping;
- verify every current incompatible subsystem has a move/rewrite/delete task;
- verify both repositories and every external gate have ownership;
- verify no task begins from a non-existent dependency;
- verify no significant UI task bypasses Figma approval;
- verify nonvisual work is not unnecessarily blocked by Figma;
- verify representative family proofs precede broad content/track expansion;
- verify Expo/platform migration timing is explicit;
- verify one current active/next task exists;
- verify old Task 2/3/5 statuses cannot be mistaken as current;
- verify `release-candidate-closure.md`, reports, audits, roadmap, and Figma do not claim sequencing authority;
- verify no second plan/status ledger is introduced;
- run documentation reference/link checks;
- run plan-schema/static checks if the repository has them;
- run `npm run qa:static` if applicable to a plan-only change;
- run the contract-change gate using its real interface;
- run `git diff --check`;
- obtain independent QA for completeness, sequencing, architecture, privacy/security, design dependencies, release coverage, and absence of a second authority.

Do not fabricate checks. Record environment-blocked validation exactly.

## Acceptance criteria

This directive is complete only when:

1. current implementation has a repository-grounded keep/move/rewrite/delete/add/verify/external-gate map;
2. `docs/launch-completion-plan.md` has been regenerated in place rather than appended;
3. it is the sole active execution-order source;
4. all required work from current state through release is represented across app, server, content, design, Storybook, public web, platform, provider, store, and device evidence;
5. tasks have bounded vertical acceptance and deletion obligations;
6. dependencies and safe parallel lanes are explicit;
7. owner visual reviews and external mutations are explicit checkpoints that do not block unrelated local work;
8. old completed work is summarized by evidence link/SHA rather than copied as repair history;
9. no current-looking obsolete Task 2/3/5 instruction remains;
10. exactly one next executable task is named and is consistent with the audited dependencies;
11. no implementation, Figma, Storybook, provider, store, domain, build, or content mutation occurred;
12. the plan-only change is committed, pushed, and the worktree is clean.

## Required completion report

Report:

- starting and ending SHA for both repositories, including repositories inspected but not modified;
- branch, commit, push result, and final worktree state;
- architecture verdict;
- complete impact-map location and summary counts by classification;
- compatible implementation retained;
- implementation to move, rewrite, delete, add, or verify;
- external state verified and unverified;
- old plan/status documents retired or reclassified;
- exact plan stages and task count;
- old-to-new task mapping;
- dependency and parallel-lane summary;
- external/owner checkpoint register;
- gate framework changes;
- exact current/next task and why it is first;
- commands and exact results;
- independent QA verdict;
- confirmation that no product implementation or external mutation occurred.

Do not continue into the next task. The next execution window starts from the exact task named by the regenerated plan.
