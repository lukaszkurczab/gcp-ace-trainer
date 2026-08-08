# Patternly — Codex directive: reconcile the canonical documentation and extend the active execution loop with brand, design, Storybook, and perceived-quality closure

## Mandate

Treat this directive as an amendment to the work already in progress in the Patternly repository. Locate the actual current branch, current active task, current canonical documentation, and the single active Working Execution Plan. The active task is expected to be the current product-contract reconciliation task, but repository state is the source of truth.

Do **not** create a second roadmap, recovery plan, brand plan, design plan, or parallel loop. Update the existing canonical documents and the existing execution-control document in place, preserve verified work and historical evidence, and then continue the existing loop autonomously from its real current position.

This is not a request for another abstract decision list. The owner has delegated the remaining product, design, technical, tooling, licensing, first-run, paywall-timing, and launch-surface choices to Codex. Make those decisions from the accepted constraints, current repository facts, solo-maintenance cost, and long-term product quality. Escalate only a genuine external blocker such as missing repository/Figma access, unavailable credentials, an irreversible external action, or a contradiction that cannot be resolved from the accepted contracts. Do not escalate ordinary implementation choices.

The only mandatory owner approvals are reviews of **actual visual work** in Figma and final release/design handoff checkpoints. Do not ask the owner to choose abstract fonts, token formats, folder layouts, Storybook internals, CI mechanics, or similar engineering details before producing evidence.

## Authority and operating rules

1. The accepted owner decisions in this directive override stale local-only, no-account, no-sync, minimal-brand, or generic “experience hardening” statements in the current documentation.
2. Preserve every already accepted commercial/product detail in the current product-contract reconciliation work unless this directive explicitly supersedes it.
3. Canonical product documents own product and runtime semantics. Figma owns visual exploration and approved presentation only while the one-time design phase is active. After verified handoff, the repository and Storybook become the operational visual authority.
4. Existing code is repository evidence, not a requirement. Move valid responsibility to the canonical owner and delete obsolete paths. Do not introduce adapters, translators, old/new parallel systems, hidden fallbacks, placeholder architecture, or temporary “MVP” layers.
5. Missing required design remains a blocker for the corresponding user-facing implementation. It is not permission to invent a generic modal, fallback navigator, substitute screen, arbitrary style, or code-first visual pattern.
6. Non-visual domain/application/persistence work may continue before final brand approval when it does not commit a new user-facing presentation. Significant UI implementation must follow the approved design cycle defined below.
7. Push completed changes. Do not claim completion from local unpushed state, a narrative report, a Figma draft, or passing tests that still protect obsolete behaviour.

## Final owner decisions to encode

### 1. Product and commercial direction

Patternly is a commercial, guest-first, local-first product; it is not a local-only product.

- A user can reach the first meaningful learning value without an account.
- The free product exposes the first roadmap node of a track; preserve any more exact already accepted free-entitlement wording from the current commercial contract where it is stricter and compatible.
- Premium is subscription-based and controls the number of active tracks by tier. Preserve exact accepted tier values and entitlement rules already present in the active reconciliation work; do not invent conflicting values.
- An account is required only when the accepted contract requires identity, paid entitlement, synchronization, restore, or cross-device access. Do not force account creation before first value.
- Guest learning state is retained and safely adopted when the user creates or attaches an account.
- Learning remains offline-first after the required content/package and entitlement state are available. Network, account, package, and synchronization failures must have explicit behaviour and must not corrupt or silently replace local canonical learning evidence.
- Preserve the already accepted account, entitlement, purchase, restore, downgrade, offline-grace, synchronization, remote-content/package, analytics, crash-reporting, deletion, and privacy decisions from the current product-contract reconciliation task. Remove all stale claims that these capabilities categorically do not exist.
- Track family is an internal architectural concept. The user sees tracks and their learning surfaces, not “Interview Preparation family” or “Certification Preparation family”.
- Primary product surfaces are `Today`, `Practice`, `Progress`, `Activity`, and `Settings`, with nested track, roadmap, setup, runner, summary, review, account, Premium, and recovery routes as required by the accepted contract.
- `Today` owns the single most useful executable next action. `Practice` is the manual learning workspace. `Activity` owns historical activity. Do not collapse these back into a generic Home/history mixture.
- Preserve the accepted language direction: English first; Polish is an additional language with full and partial variants where already specified, and certification/exam language must match the real assessment language where the accepted partial-language contract requires it.

Choose the remaining first-run and monetization presentation without another owner questionnaire. Default to the lowest-friction, evidence-led sequence:

```txt
first launch
→ concise product value
→ choose track and goal
→ start the free first node as guest
→ experience a real decision, authored Reason, and Details
→ receive an explained next action
→ encounter account or Premium only at a genuine entitlement/sync boundary
```

Do not put a hard paywall or account wall before the user has received real learning value. Do not use artificial scarcity, countdowns, dark patterns, or gamification.

### 2. Target quality level

The release target is **focused flagship quality that remains sustainable for a solo developer**.

Required:

- a distinctive and approved icon, mark, and wordmark;
- a coherent visual grammar rather than isolated polished screens;
- complete Light, Dark, and System behaviour, with Dark as the primary brand expression and full Light parity;
- a deliberate but restrained motion system;
- a subtle, diagrammatic illustration language used selectively;
- semantic, sparse haptics where they improve state clarity;
- high-quality loading, empty, offline, error, saving, frozen, finalizing, recovery, and destructive states;
- perceived-performance budgets and device verification;
- complete App Store and Google Play launch assets;
- a minimal coherent public surface: product landing page, support, Privacy, Terms, account deletion, and any required authentication/action-handler pages;
- a final whole-product consistency and release-quality audit.

Explicitly out of scope:

- a broad qualitative-research programme;
- a large marketing strategy or campaign system;
- a large editorial illustration library;
- motion on every screen;
- decorative animation, celebration theatre, streaks, badges, leagues, confetti, or AI-brand clichés.

Use small, practical usability checks and external beta/manual first-run review as release QA, not as a separate research programme.

### 3. Brand architecture

Patternly is one product brand.

Tracks may have:

- stable accent colours;
- one compact symbol built from the shared grammar;
- a limited track-specific geometric motif or key visual.

Tracks do not have:

- separate logos or wordmarks;
- separate app icons;
- separate typography systems;
- independent component libraries;
- visual treatment that mimics a certification provider or implies affiliation.

Track symbols are navigational/content identifiers, not sub-brands. They must work in monochrome, use the same construction rules, and remain secondary to Patternly.

### 4. Visual territory and formal grammar

The primary territory is:

```txt
ambiguous or dispersed elements
→ recognition of relationships
→ ordered pattern
```

The narrative and motion logic is:

```txt
several plausible interpretations or paths
→ reveal the decisive boundary
→ resolve to the useful structure or path
```

Use a controlled hybrid grammar built from a bounded set of primitives such as:

```txt
module
space
connector
branch
boundary
focus frame
resolved group
```

The system must feel precise and technical without becoming a generic AI node graph, blockchain network, analytics logo, workflow diagram, cloud mark, terminal cliché, or developer-tool hexagon.

The primary mark is an abstract structure in which a `P` emerges as a second reading through negative space, grouping, boundary, or one resolved path. Do not create a normal letter `P` decorated with random nodes.

The app icon is an optical adaptation of the same mark, with its own master for small-size legibility, launcher masks, iOS requirements, Android adaptive foreground/background, and Android monochrome use. It is not a second logo.

The wordmark uses a high-quality type family with a controlled custom element, spacing, or integration of the mark. Do not commission or fabricate a full custom alphabet. Use a rational, humanist technical sans for the product; monospace is reserved for code, pseudocode, and formal notation where it carries meaning. Prefer a high-quality open-source/OFL family to avoid an ongoing license cost and distribution risk unless repository evidence establishes a materially better no-recurring-cost option.

Colour architecture:

- neutral Light and Dark surface systems;
- one main Patternly accent;
- subordinate track accents;
- separate semantic status colours;
- separate correct/partial/incorrect response treatments;
- brand and track colours never encode correctness, readiness, mastery, warning, or error;
- every semantic distinction has a non-colour treatment and accessible semantics.

Illustration language:

- diagrammatic, abstract, sparse, and built from the same primitives as the mark;
- no mascot, people scenes, 3D renders, decorative stock illustration, or unrelated hero art;
- use only in first-run, track selection/headers where useful, important empty states, public/store surfaces, and a small number of explanatory moments.

Motion:

- functional state transitions plus a limited brand signature;
- key uses may include pattern resolution, path selection, entry into a track, revealed next action, and transition from session to summary;
- no continuous background motion, pulsing urgency, animation on every tap, or motion that delays an action;
- every material animation has a reduced-motion counterpart and must remain comprehensible without motion.

Haptics:

- sparse semantic events through a platform adapter;
- use for a small number of meaningful boundaries such as durable confirmation, warning, recoverable/blocking failure, or completion boundary;
- never claim durable success before canonical persistence/verification;
- no haptic on routine navigation or every control tap.

### 5. Figma working model and owner approval

Use Figma as a **one-time active design environment**, not a permanent operational dependency.

Create or use three controlled spaces:

1. `Patternly — Brand Lab`
2. `Patternly — Design System`
3. `Patternly — Product`

Codex creates and iterates in Figma. The owner reviews, directly edits where useful, and approves actual visual work. Treat the owner’s edits as binding feedback. Codex may set `DRAFT` and `REVIEW`; only the owner may set `APPROVED`.

Use the controlled exploration funnel:

```txt
3 materially different directions
→ 2 developed finalists
→ 1 final system
```

The initial three directions must differ structurally, not merely by colour, radius, stroke width, or rotation.

#### Proof set for each of the three initial directions

- main mark and construction of the emerging `P`;
- optical app-icon adaptation;
- monochrome version;
- working wordmark;
- simplified Dark and Light applications;
- Algorithms and GCP ACE symbols;
- two additional non-production track probes used only to test scalability;
- small-size mark/icon tests;
- launcher context;
- track-card or track-selection application;
- ordinary-practice runner application with visible track context.

#### Additional proof for the two finalists

- fuller Light/Dark colour architecture;
- one diagrammatic hero visual;
- one track key visual;
- pattern-resolution motion study;
- decision/path-resolution motion study;
- reduced-motion equivalents;
- first-entry surface;
- practice feedback surface;
- summary or explained-next-action surface;
- one store-style composition.

#### Final-system deliverables

- vector masters for the mark, wordmark, lockups, app icon, and track symbols;
- platform icon exports, including adaptive and monochrome Android variants;
- approved colour and typography system;
- illustration primitives and usage rules;
- motion and reduced-motion specifications;
- haptic intent mapping;
- approved product references required by the active loop;
- store/public visual assets;
- source exports sufficient to stop paying for Figma without losing the system.

Before generating the three directions, perform a focused current landscape and anti-reference audit covering technical learning, developer tools, AI, analytics, workflow, cloud, `P` marks, modular marks, node graphs, branches, and negative space. Record clichés and collision risks. Repeat a similarity screen for the selected finalist. This is not a formal trademark opinion and must not be presented as one.

Exploratory generated images or sketches may be used as references only. Every asset submitted for review must be rebuilt as editable Figma vectors/components. No traced logo, raster hidden under a mask, or non-editable generated image may become the final mark, icon, symbol, wordmark, or illustration primitive.

If Codex lacks actual Figma write access, report the exact missing capability as a blocker. Do not replace this phase with screenshots, a local HTML gallery, or code-first design.

### 6. Handoff and long-term design authority

Figma remains the visual source while design and implementation are active. It stops being operationally required only after a verified handoff:

```txt
FIGMA_DRAFT
→ FIGMA_REVIEW
→ FIGMA_APPROVED
→ IMPLEMENTED
→ VISUALLY_VERIFIED
→ HANDED_OFF
→ CODE_CANONICAL
```

After `CODE_CANONICAL`:

- production components, repository-owned design tokens, Storybook, canonical screen states, tests, and checked-in assets are the operational design authority;
- CI and normal development do not require Figma or a paid Figma plan;
- Figma may remain an archive, but no build, test, or implementation depends on it;
- renew paid Figma only for a system-level redesign, a materially new interaction grammar, or a large incomparable product vertical.

Use Storybook as the repo-native design authority after handoff.

Requirements:

- a separate development-only React Native Storybook entry point/target in the same repository;
- production builds statically prove that Storybook and its entry path are absent from the release graph/bundle;
- stories render production components and screen views, not a parallel UI implementation;
- deterministic typed fixtures use canonical presentation/view-model contracts and controlled clocks/IDs;
- Storybook must not access MMKV, production repositories, account services, payment services, sync, or a parallel session lifecycle;
- a layered catalogue covers foundations, brand, primitives, canonical components, learning interactions, shells, critical screens/states, motion, and reduced motion;
- coverage is risk-based rather than a cartesian product, but required states and explicit `NOT_APPLICABLE` reasons are machine-readable;
- Storybook visual/interaction/accessibility tests complement, not replace, full application and device QA.

Use one repository-owned, platform-neutral token source after handoff. Generate or expose the production theme, Storybook documentation, typed token names, Light/Dark, track accents, semantic status/response values, typography, spacing, surface/elevation, motion, and relevant haptic metadata from that authority. Select the exact format and libraries after auditing the current stack; do not ask the owner to choose JSON versus TypeScript or similar internal details.

Preserve the complete handoff package in the repository:

- editable vector sources and production exports;
- mark/icon/wordmark/track-symbol construction rules;
- design tokens and recipes;
- canonical components and states;
- motion/haptic specifications;
- illustration primitives;
- approved reference screenshots/videos where useful as evidence;
- source/licensing records for fonts and third-party assets;
- a versioned design baseline and deprecation history;
- a local Figma export where the active tooling permits it.

Future changes use three classes:

1. maintenance inside the existing system — code/Storybook first;
2. extension of the existing grammar — Storybook review and owner approval, Figma normally unnecessary;
3. system-level redesign/new grammar — temporarily reopen Figma and perform another formal handoff.

### 7. Implementation details delegated to Codex

Resolve the following after repository audit without requesting another owner decision round:

- exact Storybook package/version and integration compatible with the pinned Expo/React Native stack;
- token source format and generation method;
- component recipe representation;
- lint/architecture checks for literal values and unsafe overrides;
- story coverage manifest structure;
- visual regression mechanism without requiring a paid hosted service;
- screenshot baseline storage and review flow;
- motion library already compatible with the app, or the smallest justified change;
- platform adapters for iOS/Android differences and semantic haptics;
- performance budgets based on measured repository/device baselines;
- exact font selection and licensing from the accepted typographic direction;
- exact palette values and contrast validation;
- exact first-run copy and layout;
- exact paywall placement consistent with guest-first first value;
- exact minimal public-site implementation and hosting already compatible with the project;
- folder names, APIs, fixtures, and CI commands.

Prefer the smallest maintainable solution that satisfies the accepted contract. Do not perform unrelated Expo/React Native upgrades only to obtain a preferred Storybook or animation setup unless the audit proves they are necessary and the change is justified in the plan.

## Required documentation reconciliation

Inspect every canonical document and update only the responsible owners. Do not paste the entire directive into every file and do not create a separate decision ledger that competes with the canonical documents.

At minimum, reconcile the following ownership:

### `00 — Overview`

- commercial guest-first, local-first product boundary;
- accounts, Premium, synchronization, remote packages/content and external services at the correct high level;
- user-visible track model versus internal family model;
- canonical product surfaces;
- one Patternly brand and the new documentation authority model.

Remove stale categorical claims that Patternly has no accounts, cloud synchronization, remote content, or networked services.

### `01 — Product Definition`

- guest/free/Premium/account value model;
- first-value path;
- active-track entitlement concept;
- Today/Practice/Progress/Activity/Settings roles;
- focused-flagship quality target and solo-maintenance constraint;
- language contract where owned here;
- user-visible track semantics and invisible family semantics.

### `02 — Architecture`

- local-first learning core plus approved account, entitlement, sync, package/content, telemetry/crash and backend boundaries from the current commercial contract;
- guest-state adoption and ownership boundaries;
- no second learning lifecycle introduced by cloud/account features;
- temporary Figma authority and post-handoff Storybook/code authority;
- development-only Storybook boundary;
- repository token/asset ownership;
- no UI or Storybook access to persistence/business services outside typed presentation contracts.

### `03 — Navigation and Flows`

- primary surfaces `Today`, `Practice`, `Progress`, `Activity`, `Settings`;
- guest-first onboarding and first-value flow;
- track/goal selection;
- free-node boundary;
- account creation/adoption;
- Premium/paywall/restore/downgrade/expiry flows from the accepted commercial contract;
- sync/offline/package states;
- public/account/deletion routes where applicable;
- explicit design dependency and vertical design-code cycle.

### `04 — Data Model`

- add only the identity, guest adoption, entitlement, package, sync, device/session ownership, account deletion, and remote-projection records required by the already accepted commercial contract;
- preserve one canonical learning lifecycle and deterministic local evidence;
- do not place design tokens, Figma metadata, or Storybook fixtures in the domain model;
- do not invent generic cloud envelopes that obscure ownership.

### `05 — Design System`

Expand from screen styling into the complete product design contract:

- brand architecture and grammar;
- Light/Dark/System;
- Patternly and track colour ownership;
- mark/icon/wordmark/track-symbol usage;
- illustration and motion/haptic principles;
- Figma file structure, statuses, approval, and `3 → 2 → 1` exploration;
- complete design-reference/state inventory;
- Storybook and post-handoff code-canonical model;
- token/component/shell/screen-composition hierarchy;
- iOS/Android adapters;
- first-run, account, Premium, sync, package, empty/error/recovery and public/store surfaces;
- perceived-quality and accessibility requirements.

### `06 — Branding and Style Direction`

Make this the primary brand owner for:

- focused-flagship/solo-sustainable quality;
- one Patternly brand with subordinate track signatures;
- visual territory and formal grammar;
- emerging `P` mark;
- optical app-icon adaptation;
- wordmark and typography direction;
- colour architecture;
- diagrammatic illustration language;
- restrained motion signature;
- anti-reference rules;
- external/store/public brand consistency;
- prohibited AI/cloud/provider/gamification clichés.

### `07 — Content Guidelines`

- preserve instructional quality contracts;
- reconcile language/localization and certification-language rules where content-owned;
- ensure track symbols/branding never imply provider affiliation;
- do not weaken content review or provenance unless another already accepted owner decision explicitly changed it.

### `08 — Storage and Offline`

Replace local-only statements with the accepted local-first commercial architecture:

- guest local state;
- account adoption;
- canonical local ownership of active learning operations;
- exact sync/remote-projection boundary;
- package/content availability and offline behaviour;
- entitlement/offline-grace behaviour;
- device/session ownership and conflict policy;
- deletion/reset distinctions;
- no parallel persistence path or silent merge;
- no weakening of journal, revision, recovery, or explicit-failure rules.

### `09 — Security and Privacy`

Replace the stale no-account/no-network contract with exact approved disclosures for:

- identity and guest adoption;
- purchases/entitlements;
- sync and remote learning projections;
- remote content/package delivery;
- analytics/crash reporting;
- processors, fields, purpose, retention, deletion, redaction, offline behaviour, consent/disclosure and data-subject actions;
- local versus remote deletion and backup semantics;
- public privacy/account-deletion surfaces;
- accurate encryption and platform-backup claims.

Use the exact accepted service choices already present in the active commercial reconciliation. Do not add a third-party SDK merely because it is convenient.

### `10 — Product Capability Roadmap`

Replace the single generic `Experience hardening` tail with explicit capabilities for:

- commercial guest/account/Premium foundation;
- local-first sync/package/offline operation;
- brand identity foundation;
- design system and Figma exploration;
- Storybook/code handoff;
- vertical design-code closure of product flows;
- motion, illustration, haptics and perceived performance;
- store/public launch surfaces;
- whole-product quality closure.

Keep this as a capability roadmap, not a second implementation loop.

### `11 — Implementation Guidelines`

Add:

- Figma/Storybook/code authority lifecycle;
- owner-only visual approval;
- no implementation from unapproved frames;
- no Codex self-approval;
- no arbitrary style overrides, literal design values, or local motion/haptics outside the system;
- separate Storybook target and typed fixtures;
- vertical design-code cycle;
- complete handoff and Figma independence;
- future change classes;
- implementation details delegated to repository audit rather than owner questionnaires.

### `12 — Testing Strategy`

Add required verification for:

- Storybook component/screen states and risk-based coverage;
- visual regression without automatic baseline replacement;
- interaction and accessibility tests;
- Light/Dark/System and representative large-text states;
- reduced motion and semantic haptics;
- Figma-to-implementation visual verification during the active design phase;
- full iOS/Android device QA for safe areas, navigation, keyboard, screen reader, motion performance and haptics;
- launcher/app/adaptive/monochrome icon verification;
- first-run, account, Premium, sync, package/offline and deletion flows;
- store/public assets and release-build checks;
- perceived-performance budgets and regression evidence;
- proof that Storybook is absent from release builds.

### `13 — Risk Register`

Add risks and mitigations for at least:

- generic or collision-prone brand direction;
- unfinished/missing app icon and external launch identity;
- Codex self-approving visual work;
- Figma becoming a permanent paid dependency;
- incomplete Figma-to-code handoff;
- Storybook drifting from production or entering the release bundle;
- design tokens/components being bypassed by local overrides;
- motion harming accessibility or perceived performance;
- track symbols becoming sub-brands or mimicking providers;
- public/store surfaces diverging from the product;
- technically correct but visibly low-quality release;
- font/asset licensing gaps.

### `15`, `16`, and `17`

Preserve family learning semantics. Update only what the accepted commercial, language, account/session ownership, sync/offline, navigation, or design-authority changes genuinely require. Do not use this work as an opportunity to rewrite scoring, review, simulation, or content rules.

### Documentation indexes and references

Update indexes, authority declarations, cross-document references, and terminology. Remove all stale contradictions such as:

- local-only/no-account/no-sync/no-content-delivery claims;
- `Home` as the old primary surface where `Today` is canonical;
- absence of `Activity`;
- Figma as a permanent runtime/design dependency;
- generic “approved visual reference” language without lifecycle and handoff;
- branding reduced to tone and restrained surfaces;
- generic final `Experience hardening` as the only perceived-quality work.

Do not duplicate the same contract across every document. Assign one owner and use cross-references.

## Required modification of the existing execution loop

Modify the one active Working Execution Plan in place. Preserve completed task IDs, verified statuses, commit SHAs, reports, and dependencies. Do not reset the project to an earlier stage and do not mark already completed work incomplete without repository evidence.

Locate the actual current task (expected to be the current product-contract reconciliation task) and expand it to cover the documentation changes above. If the current loop already contains some commercial reconciliation, merge this directive into that task rather than creating another task.

The updated loop must include the following capabilities and dependencies, using the existing stage/task structure wherever possible:

### A. Canonical contract reconciliation

- commercial guest-first product contract;
- navigation and product-surface reconciliation;
- account/Premium/sync/package/privacy contract;
- complete brand/design/quality contract;
- Figma/Storybook/handoff authority;
- cross-document consistency and negative search for stale claims.

This remains documentation-only unless the actual active task explicitly already includes code. Do not mix opportunistic UI implementation into documentation closure.

### B. Repository, tooling, and baseline audit

Audit the current repository for:

- app configuration, icon/splash/adaptive/monochrome assets;
- current theme/tokens/components and visual drift;
- current navigation versus Today/Practice/Progress/Activity/Settings;
- current first-run/account/Premium/sync/package surfaces;
- current Figma references and approval registry;
- actual Figma write capability;
- Storybook compatibility with the pinned stack;
- existing visual harnesses and screenshot tooling;
- animation/haptics libraries;
- font loading and licensing;
- iOS/Android platform adapters;
- release bundle boundaries;
- current perceived-performance baseline;
- public/store surface readiness.

Produce repository-grounded keep/move/rewrite/delete actions. Do not infer compliance from filenames.

### C. Brand and design foundation before significant new UI

Add a bounded Brand Lab sequence:

```txt
focused landscape and anti-reference audit
→ 3 directions and owner review
→ 2 finalists and owner review
→ 1 final system and owner approval
→ final vectors/assets/tokens/specifications
```

The loop must record the exact owner checkpoints. Codex should do all work possible before each checkpoint and present actual Figma artefacts, not another list of abstract questions.

### D. Storybook and code design-system foundation

After sufficient visual approval:

- implement the repo-owned token authority;
- install/configure the separate development-only Storybook target;
- create typed fixtures and the layered catalogue;
- implement canonical primitives/components/interactions/shells;
- create risk-based story coverage and visual tests;
- prove release exclusion;
- begin Figma-to-code verification.

Choose exact technical implementation from repository evidence.

### E. Vertical design–code cycles integrated with existing product stages

For every user-facing vertical in the existing loop, require:

```txt
canonical runtime/product contract
→ complete state inventory
→ Figma draft(s)
→ owner review and approval
→ production implementation
→ Storybook canonical states
→ accessibility and interaction tests
→ screenshot comparison
→ iOS and Android device verification
→ obsolete-path deletion
→ plan/gate update
```

Apply this to the existing Algorithms, Certification, shared shell, Today, Practice, Progress, Activity, Settings, first-run, account/Premium, sync/offline/package, error/recovery, and public/store work. Do not create a separate UI loop competing with existing runtime stages.

### F. Brand and perceived-quality closure

Expand final release hardening to include measurable completion of:

- icon and external identity;
- whole-product visual consistency;
- first-value and paywall transitions;
- motion/reduced motion;
- semantic haptics;
- perceived performance;
- loading/layout stability and flicker removal;
- app-store/play-store assets;
- minimal landing/support/legal/account-deletion surfaces;
- physical-device accessibility and motion quality;
- small external beta/first-use QA;
- final content/brand/provider-affiliation review.

### G. Formal design handoff and Figma independence

The loop is not release-complete until:

- all required Figma sources and exports are in the repository;
- approved visual states are implemented and verified;
- Storybook and repository baselines cover the required system;
- code/assets/tokens are `CODE_CANONICAL`;
- no CI, build, documentation lookup, or ordinary implementation task depends on an active Figma subscription;
- the owner approves final handoff.

### Sequencing rule

Do not unnecessarily block non-visual kernel/application/persistence corrections on brand exploration. Do block significant new or rewritten UI presentation on the corresponding approved design. Express this dependency explicitly in the existing loop rather than serializing all engineering behind the logo work.

## Gates and completion criteria

Extend existing gates rather than creating a second gate framework. At minimum ensure the active plan can prove:

- canonical product/commercial/documentation consistency;
- approved brand direction and final app icon;
- approved design for every required user-facing state;
- Storybook/code authority and release exclusion;
- complete Figma handoff;
- Light/Dark/System, large text, screen reader and reduced motion;
- iOS/Android platform behaviour;
- semantic motion/haptics correctness;
- perceived-performance budgets;
- store/public surface readiness;
- accurate account/sync/privacy behaviour;
- no obsolete local-only or old-navigation paths;
- no generic visual fallback or Codex self-approval.

A stage is not complete because a Figma frame exists, Storybook renders, a screenshot was regenerated, or the code compiles. The applicable owner approval, behavioural tests, visual comparison, device QA, and obsolete-path deletion must all be recorded.

## Work execution after documentation and loop update

After the documentation and active Working Execution Plan are reconciled and verified:

1. commit and push that bounded change;
2. update the active task/status using pushed evidence;
3. continue autonomously with the next safe task from the modified loop;
4. do not stop merely to ask which obvious technical option to use;
5. stop only at:
   - a scheduled owner review of actual Figma variants/final design;
   - a real access/credential/external-action blocker;
   - an unresolved canonical contradiction that cannot be eliminated by assigning ownership correctly.

At a Figma checkpoint, provide:

- direct links to the exact frames/components;
- the comparison rubric and hard-gate findings;
- concrete strengths/risks of each direction;
- the exact changes requested from the owner;
- no request for abstract design decisions already delegated here.

## Verification for the documentation/loop amendment

Run the repository-appropriate documentation and static checks. At minimum verify:

- one active execution-order document only;
- no stale categorical no-account/no-sync/no-remote-content claims;
- one canonical primary-navigation list;
- one owner for brand identity, design system, Figma lifecycle, Storybook authority, and handoff;
- no second roadmap or brand plan;
- no duplicated/conflicting Light/Dark, motion, illustration, icon, track-brand, or approval contracts;
- no weakening of learning, persistence, recovery, security, accessibility, or content semantics;
- exact changed-file inventory;
- clean worktree after commit/push.

Run `npm run qa:static` and any documentation-reference/architecture checks that actually exist in the repository. Do not fabricate a command. If a required check does not exist, record the gap in the active loop and add the smallest appropriate check if it belongs to the documentation task; otherwise schedule it in the next bounded implementation task.

## Required completion report

Report:

- current task ID and how it was amended;
- starting SHA and ending SHA;
- branch and pushed commit/PR;
- canonical documents changed;
- stale contracts removed;
- commercial/product decisions preserved from the prior reconciliation;
- brand/design decisions encoded and their owning documents;
- exact modifications to the existing loop;
- current active stage/task after the amendment;
- commands and results;
- unresolved contradictions;
- Figma access result;
- next safe task actually started or completed;
- the next required owner checkpoint, only if actual visual material is ready.

Separate clearly:

- implemented and verified;
- implemented but not verified;
- planned in the modified loop but not yet implemented;
- blocked by an external dependency.

Do not present the full future brand/design implementation as complete merely because the documentation and loop now describe it.
