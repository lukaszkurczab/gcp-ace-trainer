# Patternly — Codex directive 1/3: repository hygiene and evidence cleanup before canonical reconciliation

## Mandate

Clean the existing Patternly repositories before any canonical documentation rewrite or new product implementation begins.

Primary repository:

- application: `lukaszkurczab/gcp-ace-trainer`, canonical branch `main`.

Related repository:

- content/publishing: `lukaszkurczab/patternly-content`, canonical branch `master`.

This is a bounded repository-hygiene task. Its purpose is to remove obsolete task debris, generated artifacts, duplicate status surfaces, dead references, and files that no longer serve the current product or release process. It is **not** permission to rewrite the canonical product contract, redesign the application, implement the new product decisions, or regenerate the implementation plan.

Work from the actual repositories. Inspect the current branch, HEAD, worktree, recent commits, ignored files, untracked files, subdirectories, scripts, tests, CI, package commands, documentation references, and cross-repository contracts before deleting anything. Do not assume that a file is disposable merely because it is old, large, named `report`, or associated with a completed task.

Complete this cleanup in the current execution window. Commit and push one coherent cleanup change. Stop after the cleanup has been verified and pushed; do not continue into directive 2 or directive 3.

## Required input directives and authority

Two owner directives are supplied alongside this task:

1. `patternly_codex_task3_product_contract_reconciliation.md`;
2. `patternly_codex_brand_design_and_loop_reconciliation-1.md`.

Read both before classifying files, because they determine which existing records are still needed for the subsequent documentation reconciliation.

Use this precedence when the two directives conflict:

1. this cleanup directive controls the allowed work in this phase;
2. `patternly_codex_task3_product_contract_reconciliation.md` controls product, commercial, entitlement, account, synchronization, session ownership, content-package, platform, privacy, and launch semantics;
3. `patternly_codex_brand_design_and_loop_reconciliation-1.md` controls brand, visual design, Figma, Storybook, design handoff, motion, haptics, illustration, and perceived-quality requirements;
4. current canonical repository documents remain evidence of the previous contract until directive 2 reconciles them; they do not override the new owner directives.

Normalize these known collisions while classifying files; do not ask the owner to resolve them again:

- Premium is one entitlement with monthly and annual products; there are no active-track slots or slot-based tiers.
- The launch application and launch content are English-only; Polish variants are future localization work, not launch scope.
- Primary tabs are `Today`, `Practice`, `Progress`, and `Settings`; `Activity` is a required nested section/route under `Progress`, not a fifth primary tab.
- The product is guest-first. Account creation is required for Premium, synchronization, restore, and cross-device continuity, not before first learning value.
- Active learning sessions are device-owned and do not synchronize.

Do not edit canonical files merely to encode those decisions in this phase. Preserve the relevant source directives and enough repository evidence for directive 2.

## Phase boundary

### In scope

- repository inventory and classification;
- deletion of obsolete generated artifacts and task debris;
- deletion or retirement of duplicate status/execution surfaces that are demonstrably no longer authoritative;
- removal of dead scripts, dead test fixtures, dead references, dead package commands, and dead CI entries whose only purpose was a completed or deleted artifact;
- removal of stale visual explorations or task-specific evidence that has no continuing approval, legal, operational, regression, or provenance value;
- correction of links, indexes, ignore rules, and references made invalid by approved deletions;
- preservation or minimal status-marking of historical decisions that remain necessary to interpret implementation or owner intent;
- generation of one bounded cleanup report if the repository has an established report convention and the report itself will remain useful after the cleanup.

### Out of scope

- changing product behavior;
- changing application, server, domain, persistence, synchronization, entitlement, content, or UI implementation;
- editing the semantic content of documents `00`–`13` and `15`–`17`;
- changing `canonical-product-contract.yaml`, its schema, semantic parser, or contract tests;
- adding new PO decisions;
- regenerating or materially rewriting `docs/launch-completion-plan.md`;
- creating Figma work, Storybook, tokens, brand assets, or design-system implementation;
- adding providers, dependencies, routes, screens, services, cloud resources, store records, domains, secrets, or external deployments;
- broad formatting churn unrelated to deletion and reference repair.

If safe cleanup requires a semantic product decision, classify the item as deferred to directive 2 or directive 3 rather than deciding it here.

## Required operating rules

### 1. Preserve user work and repository truth

- Inspect the current worktree before changing anything.
- Do not overwrite, reset, stash, or discard unrelated uncommitted user work.
- Do not rewrite Git history.
- Do not delete a file merely to obtain a clean tree or a smaller diff.
- Use Git history as the default archive for superseded implementation-task narratives. Do not create a new `archive/`, `legacy/`, `old/`, or `deprecated/` dumping ground unless a retained artifact has a concrete legal, operational, provenance, or restore purpose that Git history cannot satisfy.

### 2. Evidence before deletion

For every deletion candidate, determine:

- current references from source, tests, scripts, CI, package commands, documentation, ADRs, reports, and cross-repository contracts;
- whether the file is generated or hand-authored;
- whether it is reproducible;
- whether it records an external mutation, security decision, data-loss boundary, release provenance, content provenance, owner approval, or unresolved blocker;
- whether it is the only surviving evidence for a currently implemented behavior;
- whether a current test or script consumes it;
- whether deleting it would make a current claim impossible to audit;
- whether it belongs to the active contract, active execution control, historical decision record, operational runbook, or completed-task evidence.

A filename, creation date, directory name, or large size is not sufficient evidence.

### 3. No silent historical destruction

Historical decisions may remain when they explain why current code or external resources exist. Prefer one of these actions:

- retain with an explicit historical/superseded status;
- preserve the material decision in the PO register or ADR and delete duplicate prose;
- retain one compact, canonical operational record and delete repeated task transcripts;
- rely on Git history when no current repository reader needs the old text.

Do not preserve multiple current-looking status documents merely because they contain some unique history. Extract only the durable facts that still matter, then delete or retire the competing surface.

### 4. No cleanup by hiding

Do not solve clutter by:

- adding ignore rules for tracked obsolete files;
- moving everything into another folder;
- renaming active-looking files to `archive-*` without deciding their value;
- retaining dead package scripts that point to missing files;
- leaving broken documentation links;
- keeping disabled routes or unreachable code as “history.”

## Required classification model

Create an inventory for every material noncanonical document, report family, design-reference family, task artifact family, generated artifact family, and suspicious root-level file. Use exactly one classification per item or coherent file family:

- `KEEP_CANONICAL` — an active authority or required operational contract that must remain untouched in this phase;
- `KEEP_HISTORICAL_WITH_STATUS` — a decision/provenance record that still explains current state but must not look current;
- `KEEP_ACTIVE_EVIDENCE` — evidence still needed by an open gate, unresolved blocker, release proof, security review, external mutation record, or regression suite;
- `SUMMARIZE_THEN_DELETE` — verbose or duplicated evidence whose small durable facts must be moved to the correct surviving owner before deletion;
- `DELETE_GENERATED` — reproducible build, test, screenshot, packet, cache, dump, capture, temporary, or generated artifact that does not belong in source control;
- `DELETE_DEAD` — unreferenced and non-authoritative source, fixture, script, document, or asset with no current purpose;
- `DEFER_TO_DOCUMENTATION_RECONCILIATION` — content whose fate depends on the canonical contract rewrite in directive 2;
- `DEFER_TO_PLAN_REGENERATION` — plan/status/history material whose final treatment depends on directive 3.

Record the reason and proof for each classification. Do not use `KEEP` as a default for uncertainty. Use the appropriate `DEFER` classification when the next directive owns the decision.

## Mandatory inspection scope

Inspect at least the following in the application repository, where present.

### Repository root

- tracked captures such as `capture.pcap`;
- temporary logs, dumps, coverage, screenshots, archives, build outputs, local environment files, and generated manifests;
- duplicated lockfiles or generated files not required by the actual build;
- stale root scripts or configuration left by completed experiments;
- `.gitignore` gaps that caused reproducible local artifacts to be tracked or repeatedly appear untracked.

### `docs/`

Preserve the canonical document set for directive 2:

- `00-overview.md` through `13-risk-register.md`;
- `15-certification-track-learning-system.md`;
- `16-leetcode-like-learning-system.md` pending the later naming decision;
- `17-training-runtime-and-interaction-spec.md`;
- `canonical-product-contract.yaml`;
- `canonical-product-contract.schema.json`;
- its parser, contract tests, and owner decision register.

Inspect and classify:

- `README.md`;
- `launch-completion-plan.md`;
- `release-candidate-closure.md`;
- `launch-surface-inventory.md`;
- `competitive-product-gap-audit.md`;
- `launch-readiness-audit.md`;
- all `docs/reports/**`;
- all `docs/designs/**`;
- all `docs/po-questions/**`;
- all `docs/user-testing/**`;
- all ADRs, especially local-only, no-auth, and Light-first decisions superseded by the new direction;
- duplicate status tables, repeated test transcripts, old blocker narratives, obsolete review packets, and references to completed RC work.

The current `launch-completion-plan.md` is expected to contain both active sequencing and extensive historical repair detail. Do not regenerate it here. Classify it as deferred to directive 3 and only make a minimal change if required to prevent a deleted reference from breaking it.

The current `release-candidate-closure.md` and other current-status surfaces may contradict the active launch plan. Do not invent a replacement status in this phase. Retain, retire, summarize, or delete them only when repository evidence proves which durable facts still need a surviving owner.

### Design and visual evidence

For every design/reference folder, determine:

- whether the reference is explicitly approved;
- whether it still applies after the new brand/Figma direction;
- whether production code or tests depend on it;
- whether it is a temporary generated exploration, implementation evidence, or durable approved source;
- whether it should survive until the Figma reconciliation and handoff phase.

Do not delete the only approved reference for a currently implemented state merely because a future redesign is planned. Do not preserve exploratory alternatives as approved work.

### Scripts, tests, CI, and device evidence

Inspect:

- RC-only Maestro flows and runners;
- user-testing-only runners;
- report generators and evidence manifests;
- package scripts referring to completed or deleted workflows;
- CI workflows and architecture checks;
- fixtures whose only consumer is deleted;
- stale tests that validate only removed evidence infrastructure rather than product behavior.

Preserve reusable product tests, canonical contract tests, architecture checks, account/server tests, content release verification, and current device flows needed by an open gate. Delete a script or test only after proving no active command, CI job, report, or acceptance gate needs it.

### Application and server source

This phase is not a source-code cleanup pass. Inspect source only to establish whether an artifact or document is still referenced.

In particular, do not delete substantial account/server foundations merely because the new guest-first contract changes bootstrap semantics. Existing Firebase Authentication, Cloud Run, Firestore, bounded sync, adoption, deletion, environment, and transport work must be preserved for directive 2 and directive 3 to classify as keep, move, rewrite, or delete.

### Content repository

Inspect the content repository for:

- generated release artifacts accidentally committed beside canonical source;
- stale reports or matrices already superseded by a published release;
- duplicate manifests or unreferenced evidence;
- cross-repository links that will break after application cleanup.

Do not delete canonical source content, active releases, release locks, schemas, publishing contracts, provenance, or byte-verification inputs. Modify the content repository only when the cleanup is independently safe and necessary. Otherwise record the candidate for a later cross-repository task.

## Execution workflow

### Step 1 — establish the exact baseline

Record for both repositories:

- branch;
- HEAD SHA;
- upstream relation;
- worktree status;
- untracked and ignored material relevant to cleanup;
- current package/test commands;
- current active documentation authorities as claimed by the repository;
- large tracked files and suspicious generated artifacts;
- open work or reports that still depend on evidence files.

Abort destructive cleanup only when unrelated dirty work makes safe attribution impossible. Preserve all inspection results and report the exact paths involved.

### Step 2 — build the cleanup inventory

Produce a machine-readable or clearly tabular inventory containing:

- path or file family;
- classification;
- current references/consumers;
- current authority/evidence role;
- reproducibility;
- proposed action;
- replacement owner when summarization is required;
- verification required before deletion.

Do not begin broad deletion before the inventory exists.

### Step 3 — execute only proven-safe actions

Apply deletions and minimal reference repairs in bounded groups. For each group:

1. delete or summarize the exact files;
2. remove obsolete imports, commands, links, indexes, or CI entries;
3. add an ignore rule only for genuinely generated local output;
4. search for the deleted path and conceptual name;
5. run the focused validation that proves no active owner was removed.

Do not combine unrelated source refactors with cleanup.

### Step 4 — resolve duplicate current-status surfaces

There must not be multiple documents claiming to be the current execution source after this cleanup. However, directive 3 owns the final plan regeneration.

Therefore:

- identify every document that claims current execution/status authority;
- preserve `docs/launch-completion-plan.md` for directive 3;
- remove or clearly retire only those competing surfaces whose durable facts have been retained elsewhere;
- do not rewrite the launch plan or invent its new status;
- leave one unambiguous handoff note stating that canonical reconciliation and plan regeneration are the next controlled phases.

### Step 5 — verify repository hygiene

Run all applicable repository checks that actually exist. At minimum:

- `git diff --check`;
- broken documentation-link/reference scan;
- search for every deleted path and obsolete authority phrase;
- package-script and CI target verification;
- tracked large/generated/binary file review;
- secret and credential scan appropriate to the repository;
- `npm run qa:static` when the current environment supports it;
- any focused tests for scripts or references changed by cleanup;
- cross-repository content contract verification when touched.

Do not fabricate a command. Do not convert an environment or loopback failure into a pass. Record every blocked check precisely and run all remaining checks.

### Step 6 — commit, push, and stop

Create one coherent cleanup commit or the smallest justified sequence if both repositories must change. Push according to the existing branch policy. Do not proceed to canonical documentation reconciliation, implementation-plan generation, Figma, Storybook, application code, or cloud mutation.

## Acceptance criteria

This directive is complete only when:

1. every deleted file or family has a documented evidence-based reason;
2. no canonical `00`–`17` document, canonical YAML/schema/parser/test, PO decision authority, active release contract, or required implementation evidence was deleted;
3. reproducible task debris and accidental tracked artifacts are removed;
4. no deleted path remains referenced by source, tests, scripts, CI, docs, package commands, or cross-repository contracts;
5. duplicate current-status surfaces are removed or explicitly historical without creating a replacement plan;
6. no `archive`, `legacy`, or equivalent dumping ground was introduced merely to move clutter;
7. active server, account, learning-runtime, persistence, content, and release code remains intact unless a deletion was independently proven dead and unrelated to the upcoming reconciliation;
8. the repositories are clean after the pushed commit, except for explicitly identified unrelated owner work;
9. all executable checks pass or have an exact environment blocker recorded;
10. the next phase can reconcile documentation without first reverse-engineering piles of completed-task debris.

## Required completion report

Report:

- starting and ending SHA for each repository touched;
- branch, upstream, push result, and final worktree state;
- complete classification inventory or its repository path;
- exact files deleted;
- exact files summarized before deletion and the surviving owner of their durable facts;
- files retained as canonical, historical, or active evidence and why;
- items deferred to directive 2 and directive 3;
- package, CI, reference, ignore, or index changes;
- commands run and exact results;
- blocked checks and why;
- confirmation that no product behavior, canonical contract semantics, implementation plan, application/server code, Figma work, Storybook work, or external resource was changed.

Do not describe the repository, documentation, or implementation plan as fully reconciled. This phase only establishes a clean and auditable starting point.
