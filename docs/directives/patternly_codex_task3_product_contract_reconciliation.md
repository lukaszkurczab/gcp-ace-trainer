# Patternly — reconcile current Product Owner decisions into the canonical contract, then continue Task 3 autonomously

You are working in the existing Patternly repositories:

- application: `lukaszkurczab/gcp-ace-trainer`, canonical branch `main`;
- content/publishing: `lukaszkurczab/patternly-content`, canonical branch `master`.

The application repository already executes work from `docs/launch-completion-plan.md`. Task 3 is active. Existing Task 3 work includes provider/account server work and bounded sync, snapshot, and durable adoption transport. Do not restart Task 3, discard compatible implementation, or assume the plan text is fully current. Inspect the actual branch, HEAD, worktree, commits, tests, reports, cloud-boundary records, and any uncommitted work before changing anything.

This instruction contains direct Product Owner decisions. They supersede every contradictory narrative, PO decision, ADR assumption, task packet, test expectation, route assumption, or implementation direction currently present in either repository. Preserve historical records, but mark superseded decisions explicitly. Do not retain compatibility aliases, parallel authorities, fallback behavior, or a second implementation merely to preserve superseded pre-production semantics.

## Operating mode

Complete this work in the current execution window.

Do not stop after:

- writing a plan;
- adding a report;
- updating only documentation;
- listing blockers that can be resolved from the repository;
- preparing scaffolding;
- implementing an unused port;
- producing an uncommitted partial change;
- completing only a preflight when implementation can safely continue.

The required workflow is:

1. inspect current repository and worktree state;
2. identify every current contract and implementation assumption contradicted by the decisions below;
3. record the new owner decisions in the repository’s real PO decision authority, using the next available decision IDs and explicit `supersedes` relationships;
4. update the normative contract, schema/parser, tests, narrative documentation, launch plan, route inventory, risk register, ADR status, reports, and cross-repository contracts;
5. reconcile the existing Task 3 implementation with the new contract, preserving compatible code and deleting or rewriting incompatible paths;
6. run all relevant validators, tests, typechecks, builds, privacy/content/contract gates, dead-path scans, whitespace checks, and the repository’s existing independent QA workflow;
7. continue autonomous implementation from the first unblocked revised Task 3 slice;
8. commit and push coherent completed work according to the repository’s existing branch policy; do not rewrite history or overwrite unrelated user work;
9. continue through subsequent unblocked slices until there is a genuine external, destructive, credential, store-console, domain-purchase, or owner-only blocker.

Do not ask the owner to repeat or reconfirm any decision stated below. Resolve ordinary technical details from the current architecture, official provider documentation, repository policy, market-standard behavior, and the constraints in this prompt. Stop only when an operation requires a new external mutation or secret that is not already authorized, or when two requirements are logically impossible to satisfy together. In that case, preserve all completed work and report the exact smallest decision or authorization required.

## Authority and historical integrity

`docs/canonical-product-contract.yaml` remains the normative product-behavior authority unless the repository has since moved that authority to a newer canonical file. Update the actual current authority, not a duplicate.

The current plan contains historical packets, QA repairs, owner authorizations, and evidence. Do not erase history. Instead:

- add new decisions with explicit supersession links;
- mark old requirements as historical or superseded where appropriate;
- update current status summaries and active task packets so Codex cannot select an obsolete packet;
- remove obsolete implementation paths after the new canonical path is reachable;
- update `docs/README.md` and other indexes so there is one truthful current execution source;
- do not maintain two “current status” documents.

At minimum inspect and reconcile, where present:

- `docs/canonical-product-contract.yaml`;
- its schema, semantic parser, and focused tests;
- `docs/01-product-definition.md`;
- `docs/02-architecture.md`;
- `docs/03-navigation-and-flows.md`;
- `docs/04-data-model.md`;
- `docs/08-storage-and-offline.md`;
- `docs/09-security-and-privacy.md`;
- `docs/10-roadmap.md`;
- `docs/13-risk-register.md`;
- Certification, Algorithms/coding-interview, and runtime specifications;
- `docs/launch-completion-plan.md`;
- `docs/launch-surface-inventory.md`;
- `docs/competitive-product-gap-audit.md`;
- `docs/launch-readiness-audit.md`;
- relevant ADRs;
- the actual owner-decision register;
- application and server tests;
- `patternly-content` schemas, publishing contracts, manifests, and release architecture affected by remote node packages or multi-track registration.

Create a focused reconciliation report such as `docs/reports/launch-003-product-contract-reconciliation.md`, using the repository’s established report conventions. The report must distinguish:

- direct owner decisions;
- derived technical consequences;
- compatible existing implementation;
- implementation that must be migrated or deleted;
- deferred external inputs;
- exact test and evidence results.

# Canonical Product Owner decisions

## 1. Commercial launch and entitlement

Patternly will have a commercial public launch.

There is one Premium entitlement covering all Premium content in all tracks. There are no “track slots,” no tier based on the number of concurrently unlocked tracks, and no assignment/release/cooldown model for tracks.

The commercial product structure is:

- permanent Free access;
- one monthly Premium product;
- one annual Premium product;
- no store-level free trial is required for launch because permanent free nodes provide the product trial;
- numeric prices remain a downstream store/pricing decision and must not block Task 3 or be guessed in source code;
- purchase requires a verified Patternly account;
- guest users cannot purchase Premium.

RevenueCat is the selected subscription infrastructure.

Use a stable, opaque Patternly account identifier as the RevenueCat App User ID. Do not use email as the RevenueCat identity.

The authority model is:

- Apple App Store or Google Play is the authority for the underlying store transaction;
- RevenueCat normalizes store state and emits entitlement updates;
- the Patternly backend owns the account-bound Premium entitlement projection used to authorize Premium content;
- the device stores only a bounded cached projection for offline use;
- a local RevenueCat SDK result alone must not authorize a paid Cloud Storage download.

Cross-platform Premium is required. A valid purchase associated with one Patternly account grants Premium after login on either supported platform, regardless of the store where it was purchased.

`Restore purchases` means:

- re-read store transactions;
- verify them through RevenueCat/backend;
- reconnect an active purchase to the current Patternly account where safe;
- restore Premium only when the store still considers the purchase entitled.

It does not reactivate an expired subscription and does not restore an old snapshot of learning data. Learning data, Progress, Activity, and review are independent of Premium expiry.

A store transaction must not be silently attached to multiple Patternly accounts. Define explicit conflict and recovery behavior.

## 2. Free access

Every launch track has one canonical `freeNodeId`.

The bundle shipped with the application contains the complete free node for every production-visible launch track.

Free users may start new sessions only from content belonging to that track’s free node. The free experience includes, when the family can truthfully support the mode:

- Standard or Guided Practice;
- Custom Practice limited to the free node and a 10-item session, using only feedback options already supported by that family;
- Weak Area Review limited to eligible evidence from the free node;
- Quick Review limited to eligible evidence from the free node;
- a family-owned Learn/Approach entry when it is a real learning experience rather than a duplicate mode.

Free does not include:

- full-track Diagnostic Baseline;
- track-wide Mixed or Independent Practice;
- full Exam Simulation;
- full Interview Simulation;
- any session that silently pulls Premium items to fill the requested length.

Progress, Activity, historical results, historical feedback, passive answer review, goals, and account settings remain accessible independently of the current tier.

After downgrade:

- an already started Premium session remains usable and may be finished on the same device;
- no new Premium session may start;
- Free Weak Area and Quick Review filter eligible items to the free node;
- Premium weak areas may remain visible as evidence, but their session CTA is locked;
- historical Premium results and feedback remain readable;
- the main recommended CTA must always have an executable Free alternative;
- resubscription restores access to existing progress; it does not recreate or reset learning state.

## 3. Offline entitlement grace

Use a 7-day offline entitlement grace period.

A device may start a new Premium session offline only when:

- the required package is already available locally;
- the last server-verified entitlement is no more than 7 days old;
- no later known refund, revoke, or expiry has invalidated it.

A session already started while Premium was valid can always be completed on the same device, even if Premium expires during the session.

After the 7-day verification window, the app remains usable as Free until a network verification succeeds. The client cannot extend `entitlementVerifiedAt` by itself.

Do not confuse this Product grace period with Apple/Google billing grace periods. Store billing state must be normalized separately.

## 4. Account deletion and subscriptions

Deleting a Patternly account does not claim to cancel, refund, or expire an App Store or Google Play subscription automatically.

The deletion experience must:

- detect and truthfully display an active entitlement;
- explain that store billing is managed separately;
- provide `Manage subscription`;
- retain an immediate `Delete now` path;
- allow a scheduled deletion at the end of the already paid period where technically supported;
- never make immediate deletion conditional on preserving the paid period;
- remove the Patternly account, Patternly data, and account-entitlement association according to the deletion contract;
- avoid implying that a refund is automatic.

Any RevenueCat/store record retained independently by the processor must be described in privacy documentation and detached from the deleted Patternly account where required by the processor contract.

## 5. Guest mode and account adoption

`Try for free` is a real local guest mode.

A guest can:

- enter the product without registration;
- select and switch tracks;
- set goals;
- use every production-visible track’s free node;
- accumulate local attempts, results, review, Activity, Progress projections, and settings;
- work offline.

A guest cannot:

- synchronize;
- restore data on a second device;
- purchase Premium;
- download Premium packages;
- recover data after uninstall or device loss.

Creating a Patternly account must preserve guest progress.

The flow is:

1. local guest dataset exists;
2. user registers or signs in;
3. identity is verified;
4. the app shows a truthful adoption preview;
5. the user explicitly confirms;
6. canonical guest learning facts are uploaded/reconciled;
7. the app verifies convergence;
8. the local installation becomes bound to the account.

For a new empty account, preserving the guest data is the recommended/default action, but discard remains an explicit destructive choice.

For an existing account with remote data, show the deterministic local-versus-account plan. Never silently merge or discard.

An active guest session is device-owned and is not migrated. Before completing account adoption, require the user either to finish it or explicitly abandon it. Preserve already committed attempts according to the canonical session rules.

This decision supersedes every current requirement that Home, track selection, or all learning be unreachable before verified account bootstrap. Account creation is required for Premium and sync, not for first product value.

Do not implement guest as Firebase Anonymous Authentication unless a later explicit decision changes this. Guest identity is local installation state.

## 6. Authentication and account recovery

Launch sign-in methods:

- email and password;
- Sign in with Apple;
- Sign in with Google;
- recovery codes.

All linked methods must resolve to one Firebase UID and one Patternly account. A user-facing “family” or separate account per provider is prohibited.

Do not automatically merge accounts solely because two providers return the same email. Require proof through an existing sign-in method before linking.

Do not allow unlinking the last usable sign-in method.

Required account-security actions:

- change password after recent reauthentication;
- change primary email after recent reauthentication and verification of the new email;
- notify/protect the previous email according to provider capability;
- link and unlink Apple/Google where safe;
- sign out this device;
- sign out all devices;
- regenerate recovery codes;
- delete account.

`Sign out all devices` must revoke refresh tokens and require the Patternly API to enforce revocation for sensitive/protected operations rather than waiting only for local token expiry.

Recovery codes are a first-party Patternly mechanism:

- generate 8 one-time high-entropy codes;
- display them only once;
- store only strong hashes and required metadata;
- generating a new set invalidates all old codes;
- using a code creates a narrowly scoped, short-lived recovery session;
- successful recovery requires new credentials or a newly linked provider and revokes all prior sessions;
- codes never enter logs, Analytics, support reports, or content reports.

If the user is signed out, has lost email access, forgotten the password, has no linked Apple/Google provider, and has no recovery code, Patternly does not perform manual account takeover through support. Describe this limitation truthfully.

Terms are accepted at account creation. Store a version and acceptance timestamp. Analytics consent or another optional data-processing choice must not be hidden inside Terms.

The launch application and content are English-only. Remove the Language Settings route until a real second language is implemented. Future locale work must remain evidence-neutral: stable item/option identities and scoring do not change with presentation language.

## 7. Verification, recovery links, domain, and email

Development and sandbox may use the free default Firebase domain.

All origins and URLs must nevertheless be environment-driven. No business logic may hard-code the default Firebase host.

At minimum configure explicit values for:

- public web origin;
- auth action origin;
- auth redirect domain;
- privacy URL;
- terms URL;
- support URL;
- public account deletion URL;
- iOS associated domain;
- Android App Link host;
- transactional email sender domain.

The production custom domain and professional support alias are release-promotion inputs. They are not required to continue local Task 3 implementation. Before external beta/store signing, the same canonical web artifact and account flows must move to the professional domain, and App Links/Universal Links, store URLs, sender domain, and provider redirects must be updated and verified.

During development use `lukasz.kurczab@gmail.com` as the support destination. Do not expose a fake professional address.

Use provider-controlled expiry and single-use semantics for ordinary Firebase verification and password-recovery action codes. The current exact 30-minute requirement for verification and password recovery is superseded.

Keep the exact 30-minute, single-use custom token only for the public account-deletion possession flow.

The static/web handler must distinguish valid, expired, already used, malformed, rate-limited, and remote-failure results without account enumeration.

## 8. Session ownership and synchronization

`currentTrackId` is account-owned and synchronizes. It is the last track selected as the default context. The user can switch tracks freely, and each track has separate goals, Progress, Activity, review, and statistics.

Recommendations apply only to the current track.

The active learning session is device-owned.

Rules:

- at most one active session per device across all tracks;
- another device may have its own independent active session;
- an active session cannot be resumed on another device;
- active-session pointer, draft, current position, timer, and mutation journal do not synchronize;
- device loss can lose the unfinished session and any locally committed but not yet acknowledged changes;
- completed or intentionally ended session facts synchronize after local durability;
- no account-wide active-session conflict or divergent-draft choice exists in the target model.

This supersedes the current account-owned `activeSessionReference`, remote active session, simulation draft, foreground timer, and “one active session across the account” model.

Do not keep the old remote active-session model as a fallback or compatibility path.

Every learning mutation remains local-first:

1. validate;
2. persist the canonical local journal;
3. materialize and verify local records;
4. clear the local journal;
5. enqueue a compact idempotent account operation;
6. synchronize opportunistically.

Sync triggers:

- cold app start;
- network return;
- foreground return when the sync view is stale;
- session completion or intentional terminal end;
- goal change;
- current-track change;
- entitlement update;
- explicit user retry.

Do not promise background sync on launch.

Use incremental sync and pagination. A new or returning device downloads only what is currently required:

- account/profile and entitlement;
- current track;
- goals;
- compact per-track Progress projections;
- due review for the current track;
- recent Activity;
- revision/cursor metadata.

Older Activity pages and exact result details load on demand and are cached locally.

Store compact canonical facts required for correctness and review:

- terminal session summary;
- attempts;
- results;
- review mutations;
- stable content references.

Progress/statistics may be stored as materialized read models for performance, but they remain derived and rebuildable. They must not become the only authority.

## 9. Activity

Activity is required, but it is not a primary tab.

Primary tabs:

- `Today`;
- `Practice`;
- `Progress`;
- `Settings`.

`Activity` is a nested section/route under Progress.

Activity answers “what did I actually do?” and contains paginated terminal session summaries. It is not a streak, heatmap, social feed, or independent analytics product.

Include:

- completed sessions;
- intentionally ended-early sessions that contain committed attempts;
- completed review sessions;
- completed simulations.

Exclude:

- setup without a started session;
- active local sessions;
- transient recovery operations;
- abandoned sessions without committed attempts.

A compact Activity record includes, as applicable:

- session ID;
- track ID;
- node/scope;
- mode;
- content release and package version;
- start and end timestamps;
- completion kind;
- requested and actual length;
- answered count;
- result summary;
- elapsed foreground time;
- result reference.

Opening exact review loads detailed data on demand. Published static node packages should remain available by default because storage is cheap and they contain no user data. If a package must be retired for legal, security, or compatibility reasons, retain the Activity summary and show an explicit `Content version unavailable` result rather than reconstructing or substituting newer content.

## 10. Today, Practice, Progress

Families and family categories are not visible to the user. The user sees only tracks.

Rename user-facing `Home` to `Today`.

`Today` answers “what should I do now?” and contains:

- current track and fast switch;
- active local session, if any;
- one primary executable recommendation;
- weekly goal state;
- due review when it outranks roadmap continuation;
- a compact previous-session summary;
- at most one evidence-backed insight;
- sync or entitlement warnings only when action is required.

`Today` must not become a full mode catalogue or duplicate the complete Progress dashboard.

`Practice` remains a separate primary tab and is the manual workspace for the current track. It contains:

- active local session;
- current/recommended node;
- Standard/Guided and Custom Practice;
- Weak Area and Quick Review;
- track roadmap/node selection;
- mode selection;
- package/download state;
- simulation where the track supports it;
- explicit Free/Premium access state.

Consolidate fragmented Practice discovery routes where appropriate. Do not merge Today and Practice into one overloaded page.

`Progress` answers “how is my learning changing?” and contains:

- node evidence;
- weak areas;
- recurring errors;
- trend;
- goal adherence;
- due review;
- recent Activity and entry to full Activity.

Insights on Today must be deterministic, evidence-backed, cooldown-controlled, and scoped to the current track. Do not rotate generic motivational tips merely to change the text.

Recommendation priority for the current track:

1. resume the active local session;
2. overdue review;
3. missing session from the current weekly plan;
4. repeated high-signal mistake/remediation;
5. continue the current node;
6. next roadmap node.

The learner’s explicit manual choice wins for a newly started session.

## 11. Goals

Goals are stored per track.

A track exposes only goal templates appropriate to its concrete purpose. Families remain internal and are not shown as a catalogue grouping.

Canonical goal data:

- `trackId`;
- `goalType`;
- optional target date;
- weekly session target;
- optional preferred days;
- optional preferred local reminder time;
- optional preferred session length;
- active/paused state.

Goal types may include:

- prepare for a certification;
- prepare for an interview;
- build foundations;
- refresh/maintain skills;
- learn at own pace.

Do not show invalid goal types for a track.

Goals affect:

- Today recommendations;
- weekly planning;
- reminder scheduling;
- suggested session length/cadence.

Goals do not affect:

- entitlement;
- content locking;
- scoring;
- mastery/readiness claims;
- streaks;
- punitive messaging.

## 12. Internal families and launch track catalogue

Families are internal implementation contracts. They are not user-facing categories, filters, headings, or marketing sections.

Use three target families:

- `certification`;
- `coding_interview`;
- `design_interview`.

Keep coding and design interview separate because their payloads, scoring details, evidence, review semantics, and simulations differ materially. Reuse the shared kernel, lifecycle, persistence, package, entitlement, Activity, Goal, Progress shell, and session shell.

The target launch catalogue contains ten equal-status user-visible tracks:

1. `Coding Interview: DSA & Problem Solving`;
2. `Backend System Design Interview`;
3. `Object-Oriented Design Interview`;
4. `Frontend System Design Interview`;
5. `Google Cloud Associate Cloud Engineer`;
6. `AWS Certified Solutions Architect – Associate`;
7. `Microsoft Azure Administrator Associate (AZ-104)`;
8. `Microsoft Azure AI Fundamentals (AI-901)`;
9. `HashiCorp Terraform Associate (004)`;
10. `Kubernetes and Cloud Native Associate (KCNA)`.

Do not show family names to the user.

Do not create empty production cards, `Coming soon`, inactive runtime flags, fake content, hidden unavailable branches, or placeholder tracks.

“Start all ten tracks” means:

- create a complete canonical product brief for each;
- assign the internal family;
- define its job-to-be-done and target user;
- define taxonomy outline;
- define free node;
- define family-valid mode matrix;
- define goal templates;
- define Progress dimensions;
- define package/content plan;
- define launch/commercial completion gate;
- include all ten realistic descriptors in an internal design/layout/density harness and tests.

A track enters the shipping production registry only together with a real free vertical and complete user-visible core loop. Do not add an incomplete track merely to make the count ten.

Implement representative family proofs before copying the architecture:

- GCP ACE remains the current Certification reference;
- Coding Interview is the migration/extension of the current Algorithms product;
- Backend System Design is the first Design Interview reference;
- AWS SAA must prove a second Certification track requires no new shared runtime;
- Object-Oriented Design must prove Design Interview is not hard-coded to backend system design.

Do not generate bulk question content during this reconciliation. Define contracts, briefs, schemas, package boundaries, and reference verticals first. Content generation and full track population remain later work driven by coverage matrices, not fixed filler counts.

The canonical user-facing Algorithms product becomes `Coding Interview: DSA & Problem Solving`. The target internal family ID is `coding_interview`.

Do not create a permanent `algorithms` → `coding_interview` alias. Inspect the current app/content dependency graph and choose one of two safe paths:

- migrate the family ID atomically across app, content, releases, fixtures, tests, and documentation now if the whole migration is coherent and verifiable; or
- add one explicit bounded migration prerequisite before multi-track catalogue implementation, leaving the current ID temporarily unchanged and clearly historical.

Do not partially rename the family or maintain both IDs as active authorities.

## 13. Coding Interview product boundary

Coding Interview remains strategy-first and does not claim to be an online judge.

It must include a canonical learning objective/node that presents interview-style problems and requires the learner to determine:

- decisive constraints;
- legal approach families;
- chosen strategy;
- data structures;
- invariant/state;
- expected time complexity;
- expected space complexity;
- edge cases;
- ordered implementation plan;
- why plausible alternatives fail.

This is part of the launch track contract.

Rename or clarify simulation copy so it does not imply verification of executable code when no code runner exists. A future code-writing mode is a separate product/runtime decision.

## 14. Remote content packages

Free nodes are bundled.

Premium content is downloaded on demand as complete node packages. Whole-node download is the default unit because it reduces database round trips, guarantees complete offline session content, and permits atomic version pinning.

Do not fetch individual questions from Firestore during session preparation or execution.

Target architecture:

- Cloud Storage stores immutable compressed node-package objects and assets;
- Firestore stores account data, package/track manifest metadata, entitlement projection, goals, Progress, Activity, review, and reports;
- Cloud Run verifies identity and entitlement and issues short-lived signed download URLs;
- the app downloads, validates, and atomically activates packages locally.

Each package manifest includes at least:

- track ID;
- node ID;
- content release ID;
- package version;
- schema version;
- prompt locale;
- feedback locale;
- item count;
- compressed size;
- SHA-256;
- immutable storage object identity/generation;
- minimum app version;
- created/published timestamp.

Published objects are immutable. A correction creates a new object/version.

Activation flow:

1. download to a temporary location;
2. verify byte checksum;
3. validate schema and semantic content;
4. persist the versioned package;
5. atomically update the active package pointer;
6. only then expose it to session preparation.

A crash or failed validation leaves the previous verified package active.

Every prepared session pins exact package/content versions. A package update affects only new sessions.

For review spanning multiple nodes:

- resolve required item references;
- group by package;
- fetch only missing packages;
- cache them;
- start only after all required content is locally verified.

Do not add session-package optimization until measurements show whole-node packages cause material latency/cost problems.

Support explicit offline download later without changing package identity. Cache eviction must never remove a package pinned by an active session. Historical review follows the Activity/package-retention rule above.

Future translated feedback packages must reuse stable item/option/scoring identities. Locale is presentation, not a second evidence bank.

## 15. Analytics and operational visibility

Launch includes product analytics and crash reporting.

Use:

- Firebase Analytics for product events;
- Firebase Crashlytics for sanitized crash/stability reporting;
- BigQuery export only when built-in reporting no longer answers the required product questions;
- Firestore/Patternly API for content reports and admin workflow;
- an admin web dashboard later for content-report triage, operational summaries, and selected aggregated analytics.

Do not store raw analytics event streams as one-document-per-event Firestore data.

Analytics is fail-closed until the privacy/consent contract authorizes collection for the Polish launch market. Terms acceptance is not analytics consent.

Minimum event vocabulary should cover:

- guest started;
- track selected;
- goal configured;
- registration started/completed;
- guest data adopted;
- first sync completed;
- session started/completed/ended early;
- review opened/completed;
- Premium offer viewed;
- purchase started/completed/restored;
- entitlement expired/revoked;
- package download completed/failed;
- sync failed;
- content problem submitted;
- account deleted.

Events must not contain:

- email;
- password/token;
- prompt text;
- option text;
- learner response;
- Reason/Details;
- draft;
- report free text;
- raw exception messages with private payloads;
- store purchase token.

Update the existing runtime privacy gate rather than weakening it. Permit only explicitly registered analytics/crash/account/content clients and closed field schemas.

## 16. Report a problem

A per-item content problem path is required.

The report is account-unlinked by default, not represented as absolutely anonymous.

The form requires:

- category;
- user description.

Categories:

- incorrect answer;
- ambiguous or unclear question;
- unclear explanation;
- outdated information;
- rendering/technical problem;
- other.

Automatically attach only bounded context:

- report ID;
- item ID;
- release/package ID;
- track/node;
- mode/route;
- UI/prompt/feedback locale;
- app version/build;
- platform;
- timestamp.

Do not automatically attach the learner’s response, full prompt, full feedback, email, or account ID.

Offer an explicit unchecked/intentional choice to link the report to the Patternly account and permit contact. Without consent, send no account ID or email.

Retention:

- ordinary raw report: 30 days;
- admin-confirmed important report: until the fix is released plus 30 days;
- hard maximum for identifiable/free-text raw report: 180 days;
- after that, only a de-identified issue record may remain with item, category, disposition, and fixed release;
- deleting an account immediately removes any account link, while the account-unlinked report may remain under its own retention policy.

User-facing states:

- submitting;
- accepted;
- queued/offline;
- failed;
- retry.

The user receives confirmation only, not ticket tracking.

Admin states may include:

- new;
- triaged;
- duplicate;
- accepted;
- rejected;
- fix in progress;
- fixed;
- released;
- expired.

## 17. Backup and restore

A commercial synchronized product requires backup.

Enable/plan Firestore 7-day point-in-time recovery for the production data path.

Do not add scheduled long-term exports for launch.

Required work:

- record the provider configuration and retention boundary;
- create a restore runbook;
- perform and document a sanitized sandbox restore drill;
- define how restored data is reconciled with deletion tombstones/proofs;
- prevent a restored snapshot from resurrecting a deleted Patternly account;
- describe the recoverability window truthfully in privacy documentation;
- preserve the rule that backup is disaster recovery, not user account recovery.

The cloud mutation to enable PITR remains subject to the repository’s existing owner authorization and provider-mutation gate. Documentation, contracts, tests, runbook, and sandbox plan may proceed immediately; do not mutate production without the exact authorization.

Local platform backup remains disabled/excluded for canonical learning data and content cache. Cross-device continuity comes from the account service, not iOS/Android backup restore.

## 18. Platform target

Record the target release matrix:

- Expo SDK 57 before final release freeze;
- iOS 16.4+;
- iPhone only;
- no iPad support claim;
- Android 9 / API 28 minimum;
- Android target API 36;
- portrait;
- Light, Dark, and System appearances;
- 200% text scaling support;
- phone-only evidence;
- physical-device signed-artifact smoke on both platforms.

Do not perform the SDK/platform migration opportunistically inside an unrelated account slice unless the revised plan identifies it as the current dependency. Assign implementation to the platform-hardening stage, but remove contradictory current configuration claims from the plan.

# Required contract and implementation reconciliation

The current account contract and Task 3 implementation were designed around assumptions now superseded. Inspect actual code and classify every affected component.

## Preserve where compatible

Likely compatible concepts include, subject to verification:

- Firebase Authentication provider foundation;
- Cloud Run as the only privileged account/data API;
- client-deny-all Firestore;
- strict token verification and UID derivation;
- secure refresh-token storage and memory-only access tokens;
- local journal-first writes;
- idempotent outbox operations;
- remote snapshots and revisioned account facts;
- deletion intent and proof;
- local guest-data versus remote account adoption primitives;
- bounded error codes and logging exclusions;
- sandbox/production project separation;
- local/emulator web action handler;
- existing account lifecycle design primitives that remain truthful.

Preserve only after proving they fit the new target.

## Rewrite or delete where incompatible

At minimum inspect for:

- bootstrap that blocks Home/track selection before account verification;
- `activeSessionReference` synchronized as account data;
- remote training-session draft/timer/current-position authority;
- one-active-session-across-account enforcement;
- divergent active-session adoption/merge;
- cross-device active-session resume;
- account deletion that assumes subscription cancellation;
- exact 30-minute verification/recovery links;
- no-social-provider assumptions;
- no-billing/no-entitlement assumptions;
- all-content-bundled assumptions;
- blanket network/analytics bans that cannot represent approved clients;
- Language route with only English;
- Home/Practice/Progress overlap;
- user-visible family/category language;
- code branching on only `algorithms` and `cloud-certification`;
- track registry that cannot hold ten realistic descriptors;
- documentation claiming GCP and Algorithms are the whole product.

Delete superseded code and tests once the new path is reachable. Do not leave historical branches in production.

# Revised execution order

After recording and validating the new contract, revise `docs/launch-completion-plan.md` so the current Task 3 sequence is truthful.

The dependency order should be equivalent to:

1. Product-contract and PO-decision reconciliation.
2. Current implementation impact map and deletion/migration plan.
3. Guest bootstrap and free product entry.
4. Guest-to-account adoption with preserved progress.
5. Account identity vertical:
   - email/password;
   - verification/recovery;
   - password/email change;
   - session revocation;
   - Apple/Google linking;
   - recovery codes.
6. Device-owned session and incremental account-sync migration.
7. RevenueCat/backend entitlement projection and offline grace.
8. Remote node-package manifest, authorization, download, validation, cache, and activation.
9. Account deletion/subscription behavior.
10. Analytics/crash boundary.
11. Backup/PITR runbook and authorized sandbox proof.
12. Navigation reconciliation for Today/Practice/Progress/Activity.
13. Multi-track registry, family contracts, ten track briefs, and internal density harness.
14. Representative track/family verticals before bulk content expansion.

Use the repository’s established task/slice naming rather than creating a second parallel plan. Reorder or split Task 3 only as necessary to maintain coherent acceptance boundaries.

Do not jump to Task 6 while the existing Task 5 device-evidence gate remains open. Task 3 may continue independently because it is already active, but do not use the Task 5 blocker as a reason to stop account/product-contract work.

# Verification requirements

The reconciliation is not complete until all of the following are true:

1. The normative contract explicitly represents:
   - guest entry;
   - guest adoption;
   - Free/Premium;
   - RevenueCat/backend entitlement authority;
   - 7-day offline grace;
   - device-owned active sessions;
   - incremental sync;
   - Activity;
   - Today/Practice/Progress split;
   - per-track goals;
   - internal-only families;
   - ten-track target catalogue;
   - node packages;
   - analytics;
   - content reports;
   - PITR/backup;
   - account deletion/subscription behavior.

2. Semantic tests reject the superseded model:
   - account-required-before-all-learning;
   - account-wide active-session ownership;
   - cross-device active-session resume;
   - silent guest-data loss;
   - Free review pulling Premium content;
   - local SDK-only Premium authorization;
   - per-question Firestore content fetching;
   - user-visible family/category grouping;
   - empty production tracks;
   - exact 30-minute Firebase verification/recovery requirement.

3. Narrative docs no longer contradict the contract.

4. Current plan status names:
   - what Task 3 work is complete;
   - what was built under the old assumptions;
   - what remains compatible;
   - what must be migrated/deleted;
   - the exact next active slice.

5. Route inventory reflects:
   - Today;
   - Practice;
   - Progress with nested Activity;
   - guest/account routes;
   - removal of the one-option Language route.

6. Data model no longer makes active session, draft, timer, or active-session reference account-owned.

7. Remote-content design does not create:
   - a second question bank;
   - mutable published packages;
   - per-question runtime network dependency;
   - silent version substitution;
   - unverified cache activation.

8. No source contains production placeholders, fake providers, coming-soon cards, hidden fallbacks, compatibility aliases, or invented completed status.

9. App and server clean-checkout CI includes their real dependency install, typecheck, build, and tests.

10. Both repositories’ cross-repository content/package contracts remain reproducible and byte-verifiable.

11. All applicable current tests and gates pass. If environment access blocks a specific test, record it as blocked and rerun every test that can run; do not convert an environment failure into a pass.

12. Independent QA returns `pass` for:
    - correctness;
    - completeness;
    - architecture;
    - privacy/security;
    - documentation truth;
    - dead paths;
    - absence of a second authority.

# Autonomous continuation after documentation

After the documentation and contract changes pass their focused gates, do not end the task.

Continue with the smallest coherent implementation slice that is both:

- consistent with the revised contract; and
- unblocked by external store/domain/credential authorization.

Prefer completing a reachable vertical over adding generic infrastructure.

The likely first implementation target is the guest-first composition/bootstrap and guest-to-account adoption boundary, while preserving compatible provider/server work. However, inspect the actual worktree and choose the true first dependency. If an already-started local Task 3 server slice can be completed safely under the new model, complete it first and then remove obsolete account-wide session assumptions.

Do not perform unapproved external mutations merely because the plan now names them. For RevenueCat products, App Store/Play records, custom domain purchase, production sender verification, PITR enablement, or production deployment, prepare exact implementation/configuration packets and continue local code/tests until the external action is the only remaining blocker.

# Final response format

When you finally reach a genuine stopping point, report:

- starting and ending SHA for both repositories;
- branch and worktree state;
- new PO decisions and what they supersede;
- exact canonical/narrative files updated;
- implementation retained, migrated, deleted, and added;
- tests, builds, gates, and QA results;
- external mutations performed, with authorization reference;
- external mutations not performed;
- current Task 3 status;
- exact next active slice;
- any genuine blocker and the smallest input required.

Do not claim Task 3, a track, the commercial model, remote content, analytics, backup, or launch complete without its full acceptance evidence.
