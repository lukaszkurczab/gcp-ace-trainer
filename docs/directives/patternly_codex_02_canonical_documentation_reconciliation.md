# Patternly — Codex directive 2/3: canonical product contract and documentation reconciliation

## Mandate

Reconcile Patternly’s complete canonical product and architecture documentation with the latest Product Owner decisions **before any new product implementation resumes**.

Primary repository:

- application: `lukaszkurczab/gcp-ace-trainer`, canonical branch `main`.

Related repository:

- content/publishing: `lukaszkurczab/patternly-content`, canonical branch `master`.

Directive 1 must already be completed and pushed. Inspect the actual repository state and verify that the cleanup did not remove any input required here. This directive is documentation-and-contract work only. It must end with a coherent pushed documentation change and must not continue into implementation-plan regeneration or product code.

The target is one internally consistent canonical contract, one truthful authority hierarchy, one coherent narrative document set, and explicit unresolved decisions only where a material owner choice genuinely remains.

## Required source directives and precedence

Read both owner directives in full:

1. `patternly_codex_task3_product_contract_reconciliation.md`;
2. `patternly_codex_brand_design_and_loop_reconciliation-1.md`.

Use this precedence:

1. this directive controls phase scope and forbids product implementation;
2. `patternly_codex_task3_product_contract_reconciliation.md` controls product, commercial, entitlement, account, authentication, synchronization, session ownership, remote content, analytics, reporting, backup, platform, privacy, and launch semantics;
3. `patternly_codex_brand_design_and_loop_reconciliation-1.md` controls brand, visual grammar, Figma, Storybook, design-system authority, illustration, motion, haptics, perceived quality, public/store visual consistency, and design handoff;
4. the current normative contract and narrative documents are the previous repository authority and must be migrated to the new owner decisions; they do not override those decisions;
5. existing code is evidence of current implementation, not target product authority.

Do not ask the owner to reconfirm decisions already present in either directive.

### Explicit reconciliation of known collisions

Encode these resolutions consistently across the canonical contract, PO register, narrative docs, tests, and indexes:

- **Premium model:** one Premium entitlement covering all Premium content in all tracks; one monthly and one annual product; no active-track slots, no tier based on concurrent tracks, and no track release/cooldown model.
- **Language:** the launch application and launch content are English-only. Remove the current one-option Language route from launch scope. Polish full/partial variants are future localization work and must preserve stable evidence identities, but they are not a launch capability.
- **Navigation:** primary tabs are `Today`, `Practice`, `Progress`, and `Settings`. `Activity` is a required nested section/route under `Progress`, not a fifth primary tab. References in the brand directive to Activity as a primary product surface mean that Activity is a first-class required experience, not that it is a tab.
- **Entry:** the product is guest-first. A learner reaches meaningful free-node value without registration. Account creation is required for Premium purchase, synchronization, restore, and cross-device continuity.
- **Session ownership:** an active learning session is device-owned, at most one per device, and never synchronized or resumed on another device.
- **Design authority:** Figma is temporary visual authority during the one-time active design phase; after verified handoff, repository tokens/assets/components, Storybook, tests, and checked-in baselines become operational authority.

If another collision is discovered, apply the same ownership rule. Escalate only when the requirements remain logically incompatible after assigning them to their correct owner.

## Phase boundary

### In scope

- canonical authority and terminology reconciliation;
- Product Owner decision register updates with explicit supersession;
- `canonical-product-contract.yaml`;
- its schema, semantic parser, focused positive tests, focused negative tests, and requirement-to-test coverage;
- documents `00`–`13` and `15`–`17`;
- documentation indexes and cross-references;
- ADR status and any narrowly necessary new ADR;
- narrative description of target behavior, ownership, boundaries, risks, and verification;
- exact identification of unresolved material decisions;
- a temporary safety marker on the existing execution plan if needed to prevent obsolete task selection before directive 3.

### Out of scope

- application, server, persistence, UI, Storybook, Figma, content-package, analytics, RevenueCat, authentication, synchronization, or cloud implementation;
- external provider or store configuration;
- domain purchase or deployment;
- bulk content generation;
- creation of the final release implementation plan;
- continuation of the old Task 3 implementation;
- opportunistic refactoring merely because documentation exposes a code mismatch.

Do not mix product implementation into this change even when the implementation appears small or obvious.

## Documentation authority model to establish

The repository must end with an explicit hierarchy equivalent to:

1. `docs/canonical-product-contract.yaml` — normative product-behavior and cross-cutting policy authority;
2. `docs/product-owner-decision-register.md` — owner decisions, supersession, rationale, and historical traceability;
3. documents `00`–`13` and `15`–`17` — narrative and domain-specific owners that elaborate the canonical contract without duplicating or contradicting it;
4. ADRs — historical or current technical decisions, never product authority or execution sequencing;
5. `docs/launch-completion-plan.md` — implementation order and repository status only, regenerated later by directive 3;
6. reports, inventories, Figma references, screenshots, and QA artifacts — evidence, never product or sequencing authority.

A concept must have one primary narrative owner. Other documents should reference that owner rather than copying its full contract.

## Required reasoning discipline

### Separate four kinds of statement

For every material topic, distinguish:

- `DIRECT_OWNER_DECISION` — explicitly stated in the supplied directives;
- `DERIVED_TECHNICAL_CONSEQUENCE` — necessary to implement a direct decision safely;
- `CURRENT_REPOSITORY_FACT` — verified in current code/config/docs and likely to change during implementation;
- `OPEN_MATERIAL_DECISION` — cannot be resolved without a consequential owner choice.

Do not describe current implementation facts as target behavior. Do not describe target behavior as already implemented.

### Validate rather than merely copy

Verify whether the new target is coherent with:

- the existing learning kernel and family boundaries;
- local-first persistence and journal guarantees;
- current server/account foundation;
- provider capabilities and official primary documentation;
- App Store and Google Play constraints where applicable;
- Firebase, RevenueCat, Firestore, Cloud Run, Cloud Storage, Universal Link/App Link, and Expo platform capabilities;
- the content repository’s publishing and release model;
- solo-developer operating cost and maintenance constraints.

Use official primary sources when external provider behavior matters. Record a source and checked date where a contract depends on mutable provider behavior. Do not turn a provider implementation detail into permanent product semantics unless necessary.

### Decide ordinary details autonomously

Do not ask the owner about:

- internal type names;
- token file format;
- Storybook package choice;
- folder layout;
- parser implementation;
- test organization;
- ordinary retry mechanics already constrained by idempotency;
- clear dependency ordering;
- obvious terminology cleanup;
- choices whose only reasonable answer is dictated by the accepted architecture or platform.

Escalate only when a choice materially affects one or more of:

- commercial model or recurring cost;
- user-visible launch scope;
- data loss, user rights, deletion, backup, or recovery guarantees;
- provider/vendor commitment not already selected;
- privacy/legal disclosure;
- irreversible external action;
- material architecture that cannot be changed without significant rework;
- actual visual approval reserved to the owner;
- two accepted requirements that cannot both be satisfied.

When escalation is necessary, complete every unaffected documentation change first. Create a compact decision packet containing:

- the exact question;
- why it is materially consequential;
- verified repository/provider facts;
- viable options and consequences;
- Codex recommendation;
- affected canonical fields/documents;
- work that remains unblocked;
- the smallest owner answer required.

Do not invent a default for a material open decision. Do not create artificial decisions merely to produce a questionnaire.

## Required reconciliation workflow

### Step 1 — establish the baseline and authority map

Inspect:

- current branch, HEAD, worktree, and cleanup commit;
- `docs/README.md` and every file claiming authority or current status;
- canonical YAML, schema, semantic parser, tests, and contract-change gate;
- Product Owner decision register and next available PO ID;
- documents `00`–`13` and `15`–`17`;
- ADRs;
- launch plan, route inventory, audits, and retained reports;
- application routes, configuration, package versions, account/server boundaries, storage records, track registry, current content lock, and privacy checks as read-only evidence;
- corresponding content-repository contracts.

Produce an authority/contradiction matrix before editing. At minimum cover:

- account-required entry versus guest-first entry;
- local-only versus synchronized commercial product;
- account-owned versus device-owned active session;
- remote active-session draft/timer versus local device draft/timer;
- email/password-only versus Apple/Google/recovery-code methods;
- exact 30-minute Firebase verification/recovery rule versus provider-controlled expiry;
- no billing versus RevenueCat/backend entitlement;
- all content bundled versus free-node bundle plus immutable remote node packages;
- Home versus Today;
- missing Activity versus nested Activity;
- visible family/category versus internal-only family;
- two-track examples versus ten-track target catalogue;
- English-only launch versus one-option Language route and future localization;
- permanent Figma/design-reference dependency versus Figma-to-Storybook/code handoff;
- Light-only/current tablet claims versus target platform matrix;
- old experience-hardening tail versus full brand/design/perceived-quality/public/store closure.

### Step 2 — update the Product Owner decision register first

Add the next available PO decisions with explicit dates, status, consequences, and `supersedes` relationships.

Do not rewrite historical decisions as though they never existed. Mark them superseded where appropriate. Preserve external mutation authorizations and provider decisions that remain valid.

At minimum represent decisions for:

- guest-first entry and guest adoption;
- Free/Premium model and no track slots;
- RevenueCat and backend entitlement authority;
- seven-day offline Premium grace;
- account deletion independent of store cancellation;
- authentication methods and recovery codes;
- provider-controlled ordinary verification/recovery expiry;
- English-only launch and removal of Language route;
- device-owned active sessions and incremental sync;
- Today/Practice/Progress/Activity/Settings ownership;
- per-track goals;
- internal-only families and ten-track target catalogue;
- Coding Interview renaming/boundary;
- immutable whole-node package delivery;
- analytics/crash boundary;
- account-unlinked-by-default content reports;
- PITR/restore policy;
- platform release matrix;
- one Patternly brand, Figma `3 → 2 → 1`, owner-only visual approval, Storybook/code handoff, and Figma independence.

Where a previous decision still applies only to historical research or an old pre-production build, say so explicitly.

### Step 3 — rewrite the normative contract

Update the actual current normative authority rather than creating a duplicate.

The canonical contract must explicitly represent, at minimum:

#### Commercial and entitlement

- permanent Free access;
- one monthly and one annual Premium product;
- one account-bound Premium entitlement for all Premium content;
- no track slots or tiers;
- verified Patternly account required for purchase;
- RevenueCat identity using a stable opaque Patternly account ID, never email;
- store transaction authority, RevenueCat normalization, backend entitlement projection, bounded device cache;
- cross-platform Premium;
- restore-purchase conflict/recovery behavior;
- downgrade behavior and historical-learning independence;
- seven-day offline verification grace;
- safe completion of a session already started while entitled.

#### Free product and guest

- one canonical `freeNodeId` per production-visible launch track;
- complete free node bundled in the app;
- permitted free modes and strict free-node filtering;
- no Premium filler in Free sessions;
- guest local identity and local dataset;
- guest track switching, goals, attempts, review, Activity, Progress, and offline operation;
- explicit guest-to-account adoption preview and confirmation;
- deterministic local-versus-account plan;
- active guest session finish-or-abandon boundary;
- no Firebase Anonymous Authentication.

#### Identity and account security

- email/password, Sign in with Apple, Sign in with Google, and eight one-time recovery codes;
- one Firebase UID and one Patternly account across linked methods;
- proof before provider linking; no automatic merge by email;
- no unlinking the last usable method;
- password/email changes with recent reauthentication and verification;
- sign out current device and all devices;
- API revocation enforcement for sensitive operations;
- hashed recovery codes, narrow recovery session, session revocation after recovery;
- no manual support takeover without a usable method/code;
- versioned Terms acceptance separate from optional analytics consent;
- truthful account deletion/subscription behavior.

#### Environment, links, and public URLs

- environment-driven public origin, auth action origin, redirect domain, privacy, terms, support, public deletion, iOS domain, Android host, sender domain;
- default Firebase domain allowed only in development/sandbox;
- professional domain and sender alias as release-promotion inputs;
- provider-controlled ordinary action-code expiry and single-use behavior;
- exact 30-minute custom public-deletion possession token only;
- non-enumerating action-handler outcomes.

#### Local-first learning and synchronization

- current track account-owned and synchronized;
- at most one active session per device;
- active pointer, draft, position, timer, and local mutation journal never synchronized;
- local journal-first mutation followed by compact idempotent account operation;
- explicit sync triggers without a background-sync promise;
- incremental sync, pagination, compact projections, due review/current activity loading, on-demand exact history;
- compact canonical facts remain authority; derived projections remain rebuildable.

#### Product surfaces, Activity, and goals

- primary tabs `Today`, `Practice`, `Progress`, `Settings`;
- nested `Activity` under `Progress`;
- exact jobs and non-overlap for Today, Practice, Progress, and Activity;
- recommendation priority and explicit manual-choice precedence;
- per-track goals and valid templates only;
- goals affect recommendation/cadence/reminders, not entitlement, locking, scoring, mastery, streaks, or punitive messaging.

#### Families, tracks, and learning products

- internal families `certification`, `coding_interview`, and `design_interview`;
- family names not user-visible;
- ten equal-status target track briefs, without empty production cards or placeholders;
- shipping-registry admission only with a real free vertical and complete core loop;
- representative family/track proofs before broad copying;
- atomic migration or explicit bounded prerequisite for `algorithms` to `coding_interview`, never a permanent alias;
- Coding Interview strategy-first boundary and mandatory implementation-planning learning objective;
- simulation copy that does not imply executable-code verification.

#### Remote packages and content

- bundled free nodes;
- immutable compressed whole-node Premium packages in Cloud Storage;
- Firestore manifest/account metadata;
- Cloud Run identity/entitlement authorization and short-lived signed URLs;
- required manifest fields, checksum, immutable object identity/generation, minimum app version, locale metadata;
- temporary download, checksum, schema/semantic validation, versioned persistence, atomic activation;
- exact version pinning per prepared session;
- review package resolution and active-session-safe cache eviction;
- future locale packages reuse stable evidence identities.

#### Analytics, crash reporting, and content reports

- Firebase Analytics and Crashlytics with fail-closed consent/privacy gate;
- no raw per-event Firestore stream;
- closed event vocabulary and forbidden fields;
- content report categories, bounded automatic context, no automatic account/response/prompt attachment;
- explicit opt-in account link/contact;
- retention and admin states;
- offline queued/retry states and confirmation-only user experience.

#### Backup and platform

- production Firestore seven-day PITR target;
- restore runbook, sanitized sandbox drill, deletion tombstone reconciliation, no account resurrection;
- backup is disaster recovery, not user account recovery;
- local platform backup excluded for canonical learning data/cache;
- Expo SDK 57 before final freeze;
- iOS 16.4+, iPhone only, no iPad support claim;
- Android API 28 minimum and target API 36;
- portrait, Light/Dark/System, 200% text scaling, phone-only evidence, signed physical-device smoke.

#### Brand, design, and long-term authority

- one Patternly brand with subordinate track accents/symbols, not sub-brands;
- focused flagship quality sustainable for a solo developer;
- formal visual territory and bounded primitives;
- emerging-`P` mark, optical app icon, wordmark, accessible color architecture;
- sparse diagrammatic illustration, restrained motion, reduced motion, semantic haptics;
- one-time Figma spaces and controlled `3 → 2 → 1` exploration;
- owner-only `APPROVED` status for actual visual work;
- vertical design-code cycle;
- development-only Storybook rendering production components through typed fixtures;
- repository token/asset ownership and proof that Storybook is absent from release builds;
- handoff states through `CODE_CANONICAL` and no continuing paid Figma dependency;
- public/store visual assets and whole-product quality closure.

### Step 4 — update schema, parser, and contract tests

The contract change is incomplete without executable semantics.

Update:

- schema shape and required fields;
- semantic parser invariants;
- focused positive tests;
- focused negative tests;
- requirement-to-test coverage;
- contract-change gate expectations.

Tests must reject at least:

- account required before all learning;
- guest data silently discarded or merged;
- guest purchase or Premium package download;
- local RevenueCat SDK result as paid-download authority;
- track-slot/tier entitlement;
- account-wide active-session ownership;
- remote active-session draft/timer/current position;
- cross-device active-session resume;
- Free review or Free session pulling Premium content;
- per-question Firestore session fetching;
- mutable published packages or silent version substitution;
- user-visible family/category grouping;
- empty or placeholder production tracks;
- ordinary Firebase verification/recovery fixed to exactly 30 minutes;
- Language route as a launch setting with only English;
- Activity as a fifth primary tab;
- Figma or Storybook as a production runtime dependency;
- Codex self-approval of visual work;
- analytics enabled without the privacy/consent gate;
- content reports automatically attaching learner response, account ID, email, full prompt, or feedback;
- restore behavior that resurrects a deleted account;
- iPad support claim in the target release matrix.

Do not weaken existing learning, scoring, journal, recovery, content-quality, accessibility, or explicit-failure tests unless the new owner decision directly supersedes the tested behavior.

### Step 5 — reconcile narrative owners `00`–`17`

Narrative documents describe the **target product contract**, not a mixed current-state changelog. Current repository status belongs in directive 3’s execution plan.

Assign ownership as follows and avoid broad duplication.

#### `00 — Overview`

Own the concise guest-first commercial/local-first product boundary, user-visible tracks versus internal families, product surfaces, account/Premium/sync/package high-level model, one Patternly brand, and documentation authority.

#### `01 — Product Definition`

Own users, jobs, first-value journey, Free/Premium/account value model, Today/Practice/Progress/Activity/Settings roles, goals, track semantics, language launch boundary, and focused-flagship quality target.

#### `02 — Architecture`

Own shared learning kernel, family/track extension, local-first plus account/sync/package/entitlement/backend boundaries, device-session ownership, guest adoption, analytics/crash/report clients, Figma-to-Storybook/code authority, and dependency direction.

#### `03 — Navigation and Flows`

Own the route/surface map and complete flows for guest entry, first value, track/goal selection, account/adoption, Premium/restore/downgrade, package/offline/sync, Today/Practice/Progress/Activity/Settings, deletion, public actions, and the vertical design-code dependency.

#### `04 — Data Model`

Own canonical records and explicit ownership for guest installation, account identity/binding, entitlement projection, goals, package manifests/cache pointers, sync outbox/cursors, Activity, account deletion, and device-owned active session. Do not place design tokens, Figma metadata, or Storybook fixtures in the domain model.

#### `05 — Design System`

Own complete visual/product design architecture: tokens, components, shells, states, Light/Dark/System, brand/track/semantic colors, Figma statuses, Storybook/code handoff, accessibility, motion/haptics adapters, public/store surfaces, state inventory, visual verification, and quality budgets.

#### `06 — Branding and Style Direction`

Own brand promise, one-brand architecture, visual territory, formal grammar, mark/icon/wordmark, typography direction, color architecture, illustration, motion signature, anti-reference/collision rules, provider-affiliation safety, and external consistency.

#### `07 — Content Guidelines`

Preserve instructional quality and provenance. Add locale/evidence neutrality, remote package/publishing implications, ten-track brief/content-plan boundaries, provider-affiliation restrictions, and content-report correction linkage without weakening authored feedback or review requirements.

#### `08 — Storage and Offline`

Own local guest state, account adoption, local journal authority, device-owned active session, compact sync outbox, remote projections, entitlement grace, package download/validation/activation/cache, reset versus account deletion, platform backup exclusion, explicit failures, and no parallel persistence path.

#### `09 — Security and Privacy`

Own exact identity, entitlement, store/RevenueCat/backend, synchronization, remote packages, analytics/crash, content report, retention, deletion, PITR/restore, processor, logging, encryption, consent, public privacy/deletion, and platform-backup boundaries.

#### `10 — Product Capability Roadmap`

Remain a capability roadmap, not task sequencing. Replace the generic old tail with explicit commercial foundation, sync/package/offline, brand, Figma design system, Storybook/code handoff, vertical product closure, multi-track/family proofs, content expansion, public/store surfaces, platform hardening, and release quality.

#### `11 — Implementation Guidelines`

Own implementation and dependency discipline for the new account/sync/package/entitlement clients, local-first mutation flow, device sessions, provider adapters, environment configuration, Figma/Storybook/code lifecycle, owner-only approval, typed fixtures, token discipline, vertical design-code workflow, deletion of obsolete paths, and no compatibility aliases.

#### `12 — Testing Strategy`

Own contract/schema/parser tests, local-first/account/sync/package/entitlement tests, guest adoption, device sessions, RevenueCat/backend authority, package integrity, analytics/privacy, reports, PITR drill evidence, Storybook coverage/release exclusion, visual regression, Light/Dark/System, large text, reduced motion, screen reader, haptics, device QA, public/store assets, and signed artifacts.

#### `13 — Risk Register`

Own current risks and mitigations across commercial entitlement, guest adoption, account linking/recovery, deletion/subscription mismatch, remote package integrity, stale entitlement, sync/data loss, analytics privacy, backup resurrection, generic brand, Figma dependency, self-approval, Storybook drift/release leakage, token bypass, licensing, motion/accessibility, provider mimicry, public/store divergence, and visibly low-quality release.

#### `15 — Certification Track Learning System`

Preserve certification learning semantics. Update only track catalogue, goals, free-node/Premium access, package/locale, account-independent learning history, Activity, and design/surface implications that genuinely apply.

#### `16 — Coding Interview Learning System`

Rename `16-leetcode-like-learning-system.md` to a canonical Coding Interview name if the repository and cross-references can be migrated atomically. Preserve family learning semantics while updating the `coding_interview` family boundary, strategy/implementation-plan objective, free-node/Premium access, packages/locales, Activity, and simulation claims.

Do not leave both old and new filenames as active authorities. Do not introduce an `algorithms`/`coding_interview` semantic alias in documentation.

#### `17 — Training Runtime and Interaction Specification`

Preserve one learning lifecycle and detailed interaction semantics. Update bootstrap, entitlement checks, free filtering, package preparation, device ownership, sync enqueue points, Activity terminal summaries, guest adoption boundary, downgrade behavior, and design state requirements. Remove account-wide active-session and remote-draft assumptions.

### Step 6 — reconcile ADRs, indexes, and terminology

- Mark obsolete local-only, no-auth, Light-first, and earlier design decisions historical/superseded rather than silently deleting required context.
- Create a new ADR only for a durable technical choice not adequately owned by the canonical contract or existing ADRs.
- Update `docs/README.md` and every authority declaration.
- Ensure no document claims `release-candidate-closure.md`, an audit, Figma, or a report is execution/product authority.
- Remove stale `Home` terminology where `Today` is target behavior.
- Remove user-facing family/category language.
- Remove one-option Language launch references.
- Standardize track IDs, family IDs, `freeNodeId`, package terminology, Activity terminology, entitlement terminology, and design-handoff statuses.
- Update cross-repository references when the content contract is affected.

### Step 7 — freeze obsolete execution text without regenerating it

Directive 3 owns the implementation plan. Do not append another reconciliation packet to the existing oversized plan.

Before this phase ends, ensure Codex cannot mistake old Task 3 or old task ordering for current instructions. Use the smallest safe mechanism, for example:

- a prominent `FROZEN — superseded pending regeneration` header in `docs/launch-completion-plan.md` that points to the new canonical contract and directive 3; or
- another single repository-standard status marker that makes the same fact unambiguous.

Do not regenerate tasks, renumber the plan, embed new execution sequencing, or copy the owner directives into the plan in this phase.

## Verification requirements

Run repository-appropriate checks that actually exist. At minimum:

- schema validation for the canonical contract;
- semantic parser positive suite;
- focused negative suite rejecting the superseded model;
- requirement-to-test coverage validation;
- documentation reference/link audit;
- authority uniqueness scan;
- contradiction searches for no-account, all-learning-account-gated, local-only, no-sync, remote active session, account-wide active session, track slots, family-visible, fifth Activity tab, Home-as-canonical, exact 30-minute ordinary Firebase links, all-content-bundled, one-option Language, permanent Figma dependency, and generic Experience hardening;
- route/surface terminology check;
- ADR status/reference check;
- `npm run qa:static`;
- `npm run gate:contract-change -- <appropriate-base>` using the repository’s real usage;
- `git diff --check`;
- clean-checkout documentation/test proof where practical;
- content-repository schema/publishing checks when modified.

Do not fabricate a command or claim. If a test is blocked by environment, listener, device, credential, or provider access, record the exact blocker and run every unaffected test.

Independent QA must evaluate:

- correctness of direct-owner decisions;
- completeness;
- authority ownership;
- absence of duplicate contract;
- architecture coherence;
- privacy/security truth;
- learning-contract preservation;
- design-authority coherence;
- absence of stale current-looking semantics;
- absence of accidental implementation changes.

## Acceptance criteria

This directive is complete only when:

1. the PO register records the new decisions and explicit supersessions;
2. the normative contract represents every required product, commercial, runtime, content-package, analytics/reporting, backup/platform, and brand/design decision;
3. schema, parser, and tests enforce the new model and reject the superseded model;
4. documents `00`–`13` and `15`–`17` agree and each concept has one owner;
5. current implementation status is not mixed into the target narrative contract;
6. old local-only, account-gated-first-value, remote-session, track-slot, visible-family, Home, Language-route, and permanent-Figma claims are removed or explicitly historical;
7. learning, scoring, feedback, review, journal, recovery, accessibility, content-quality, and explicit-failure guarantees are not weakened accidentally;
8. the old execution plan cannot be selected as current work before directive 3;
9. no application/server/UI/provider/Figma/Storybook implementation or external mutation was performed;
10. all checks pass or have an exact recorded environment blocker;
11. the change is committed, pushed, and the worktree is clean.

## Required completion report

Report:

- starting and ending SHA for every repository touched;
- branch, commit, push result, and worktree state;
- source-directive precedence used;
- every new PO decision and the decisions it supersedes;
- exact canonical files changed, renamed, added, or removed;
- canonical contract/schema/parser/test changes;
- direct decisions versus derived consequences;
- verified current repository facts used only as implementation evidence;
- unresolved material decisions and their exact decision packets;
- stale contradictions removed;
- ADR/index/authority changes;
- commands, test counts, and exact results;
- independent QA verdict;
- confirmation that no product implementation, plan regeneration, Figma work, Storybook work, content generation, cloud/store/domain mutation, or secret operation occurred;
- the exact handoff condition for directive 3.

Do not claim that the application implements the reconciled contract. This phase makes the target precise and enforceable; directive 3 will determine the implementation path.
