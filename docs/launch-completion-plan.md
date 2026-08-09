# Patternly — Working Execution Plan

**Status:** active; sole implementation-order and repository-status authority

**Audit date:** 2026-08-09 (reconciled against pushed implementation evidence)

**Target:** release-ready commercial Patternly from the pushed Directive 2 contract

**Current task:** no further brand-system implementation is safe until the Product Owner makes the B-03 `X-09A` 3→2 choice and resolves the current GCP content-admission contradiction recorded below. The content repository remains untouched by application work.

**Next executable tasks:** after the Product Owner's `X-09A` 3→2 choice, deepen only the two selected directions in B-04. Before changing any content lock or GCP runtime/registry state, resolve the current content-admission contradiction below. `PKG-02`/`PKG-03` remain external-infrastructure work and are not started by this checkpoint.

## 1. Purpose and authority

This file owns implementation order and current task status only. Product behavior is owned by [`canonical-product-contract.yaml`](canonical-product-contract.yaml), the [`Product Owner decision register`](product-owner-decision-register.md), and the narrative owners listed in [`README.md`](README.md). This plan links those owners and records implementation consequences; it does not redefine them.

No parallel roadmap, recovery plan, design plan, commercial plan, task ledger, or current-status document is permitted. ADRs, reports, audits, screenshots, Figma files, Storybook stories, CI output, and Git history are evidence, never product or sequencing authority. Historical reports may be retained but may not select work.

Task status is one of `READY`, `ACTIVE`, `BLOCKED`, `PARTIAL`, `VERIFIED`, or `SUPERSEDED`. A task becomes `VERIFIED` only after its change is pushed, all applicable gates pass, obsolete paths are deleted, required evidence is linked, and this file names the next task. Only one task may be `ACTIVE`. `BLOCKED` below normally means a listed dependency or owner/external checkpoint is not yet satisfied; it is not a claim that unrelated lanes cannot proceed.

## 2. Audited repository baseline

| Repository | Branch and HEAD | State at audit | Upstream |
| --- | --- | --- | --- |
| application | `main @ 3690df756daf34e1fa0b26f676c9785fa2180997` | clean before this documentation reconciliation | `origin/main`, ahead/behind `0/0` |
| content/publishing | `master @ ddaeae0607d672b0f3b4eb8c8243055cee257bb` | clean | `origin/master`, ahead/behind `0/0` |

### Current implementation facts

- Mobile is Expo 57.0.11 / React Native 0.86.2. `App.tsx` enters `ContentPreparationGate` and then the local shell without an account gate. The shell is `Home`, `Practice`, `Progress`, `Settings`; `LanguageSettings` is live; Activity is only a small Progress projection.
- MMKV has one canonical repository owner for active track, session, draft, foreground timer, attempts, results, review, settings, a journal-first mutation record, and the local installation/dataset identity. Exactly one active session per device is enforced. There is no account binding implementation, mobile auth/API client, compact sync outbox, goals record, or Activity pagination.
- The shared learning kernel, Certification runtime, current Algorithms strategy-first runtime, deterministic scoring/review, immutable content references, corruption handling, and restart recovery are substantial compatible foundations.
- The server has Firebase Admin token verification, auth-before-body HTTP validation, deny-all direct Firestore rules, environment isolation, revisioned/idempotent account writes, paginated snapshots, adoption staging, and deletion primitives. Its account dataset still synchronizes active-session reference, draft, position and timer, and therefore conflicts with device ownership.
- The content repository has canonical manual source, schemas, provenance, deterministic serialization, fingerprints, immutable releases, checksums, and exact-byte cross-repository verification. Current production data is 2,375 Algorithms items in 213 batches and 360 GCP ACE items.
- The app lock is `patternly-core-0015`, produced from content HEAD `d780204eba858c05b94fdbce8de38ec4c3900a50`, with source commit `9e23b08d`, `algorithms-core-0008`, and `gcp-ace-0014`.
- Current content delivery bundles two whole-track artifacts. It has no `freeNodeId`, immutable compressed node packages, locale/evidence identity contract, Cloud Storage object generation, entitlement authorization, atomic package cache, or Design Interview family.
- `firebase` and `expo-secure-store` are declared in the app but unused by `src`. RevenueCat, Firebase Analytics/Crashlytics clients, reports, Storybook, canonical brand assets/fonts/licensing, universal/app links, and production public surfaces are absent.
- `app.json` is portrait, iPhone-only, and uses the automatic theme. Android min/compile/target are 28/36/36 and iOS is 16.4+. The canonical privacy plugin excludes learning data from OS backup. Tracked Maestro flows are simulator/dev-client evidence, not signed physical-device proof; the unsigned device-smoke requirement for `PLAT-01` is instead a documented Product Owner environment exception.

### Verified gates and limitations

- Application Directive 2 baseline: `npm run qa:static` passed with 557 tests; canonical contract focused suite passed 26/26; cross-repository lock passed 1/1.
- Content: `npm test` passed 45/45; latest artifacts and the app lock verify exact bytes and checksums.
- Content clean release creation is currently blocked: `ci-release-gate.mjs` and both `validate:real:*` commands fail `MISSING_TECHNICAL_EVIDENCE` because committed evidence envelopes do not match the current byte-derived input manifest.
- Server typecheck passed. Focused server tests produced 65 passes and 23 loopback `EPERM` environment blocks, with no assertion failure. Root CI does not install `server/package-lock.json`; local success currently relies on ignored `server/node_modules`, so clean-checkout server QA is not proven.
- Repository evidence dated 2026-08-01 says sandbox/production Firebase projects and Firestore Standard in `europe-central2` exist, direct rules deny all, delete protection is on, PITR is off, email/password is enabled, hosting sites are reserved but undeployed, sandbox has billing controls, and production is unbilled. Directive 3 did not re-query providers.
- No repository proof establishes current Cloud Run deployment, Artifact Registry image, service-account/IAM state, Scheduler, registered Firebase apps, RevenueCat products, Premium bucket, Apple/Google provider configuration, professional domain/DNS/sender, PITR, signing, store records, or signed builds.

## 3. Architecture verdict and impact map

**Verdict:** Patternly is not a greenfield application. Preserve the learning kernel, local durability, certification behavior, server security boundary, and content provenance. Migrate the commercial/account delivery edges and delete their superseded semantics. The highest-risk transitions are device-versus-account ownership, guest adoption without loss, entitlement authority, immutable package activation, account deletion/restore tombstones, atomic content identities, and Figma-to-code authority.

Each row has exactly one action. `Current / action` states verified evidence first, then the required migration. `Depends / proof` names the first relevant task and gate.

| ID | Action | Current owner/path | Current / action | Depends / proof |
| --- | --- | --- | --- | --- |
| IMP-01 | KEEP | `src/domain/learning/**` | Family-neutral session, attempt, result, review and immutable refs fit target; extend through existing owners only. | runtime and learning gates |
| IMP-02 | KEEP | `src/storage/repositories/**`, `src/application/learningMutations/**` | Single MMKV owner, journal-first durability, recovery and revisions remain canonical. | persistence failure injection |
| IMP-03 | KEEP | device session/draft/timer repositories | Already enforces one active session per device; never move these records to account data. | `SESSION-01` |
| IMP-04 | KEEP | `src/application/certification/**`, GCP runtime | Certification modes and shared-kernel use are compatible. | representative GCP proof |
| IMP-05 | KEEP | server authentication/HTTP/environment/Firestore rules | Token checks, auth-before-body, non-leaking errors, deny-all direct access and environment isolation remain. | `FND-01`, security gate |
| IMP-06 | KEEP | content canonical source, schemas, validators, fingerprints, immutable history | Preserve source/provenance and release `0015` as evidence; do not mutate published bytes. | content gate |
| IMP-07 | KEEP | app/content exact-byte lock | Current release-lock verification is reusable and must be extended to node packages. | `PKG-01` |
| IMP-08 | KEEP | OS backup exclusion | Canonical learning data/cache remain excluded from platform backup. | `PLAT-01` device proof |
| IMP-09 | MOVE | `src/tracks/algorithms/**`, content `algorithms` IDs | Strategy-first semantics move atomically to `coding_interview` and visible Coding Interview ID; no alias. | `TRACK-01` |
| IMP-10 | MOVE | `src/features/analytics/analyticsService.ts` | This is a local Progress projection, not telemetry; rename/move to Progress before adding Analytics. | `OBS-01` |
| IMP-11 | MOVE | server deletion/scheduler primitives | Compose one durable account-lifecycle owner; remove split/unreachable execution paths. | `DEL-01` |
| IMP-12 | MOVE | content `*.candidate.json` and taxonomy rationale | Rename eight ingested sources canonically and preserve durable rationale in content owners during ID migration. | `TRACK-01` |
| IMP-13 | REWRITE | `App.tsx`, `ContentPreparationGate` | Keep no-auth first value; add installation/guest identity and validate bundled free vertical without blocking on Premium banks. | `GUEST-01`, `PKG-03` |
| IMP-14 | REWRITE | `RootNavigator`, shell models | `Home` becomes Today; preserve four tabs and add Activity below Progress with non-overlapping jobs. | `UX-02D/I`, `UX-06D/I` |
| IMP-15 | REWRITE | track registry and selection | Replace two-track/family-visible branches with internal families, complete admitted tracks and scalable descriptors. | `TRACK-01`, `TRACK-02` |
| IMP-16 | REWRITE | server account dataset/sync | Remove active pointer/session/draft/position/timer; retain revisions/idempotency and add compact incremental operations/cursors/projections. | `SESSION-01`, `SYNC-01` |
| IMP-17 | REWRITE | server adoption | Retain staged upload/preview/confirm/recovery; remove cross-device session arbitration and require local finish/abandon. | `ADOPT-01` |
| IMP-18 | REWRITE | content/app whole-track artifact boundary | Move from all-bundled whole tracks to bundled complete free nodes plus immutable compressed Premium node packages. | `PKG-01..04` |
| IMP-19 | REWRITE | `plugins/withPrivacyBoundary.js` | Preserve backup exclusion; permit only approved network, link, haptic and notification clients with static checks. | `ARCH-01`, `PLAT-01` |
| IMP-20 | REWRITE | `app.json` and generated-native contract | Expo 54, Light-only, iPad support and implicit Android levels become Expo 57 and exact phone matrix. | `PLAT-01` |
| IMP-21 | REWRITE | theme/components/design references | Replace old presentation through approved Figma→tokens/components/Storybook verticals; do not create parallel UI. | `B-05`, `DS-01..03` |
| IMP-22 | REWRITE | legal/data/settings copy | Replace local-only/no-account claims with truthful target behavior only in approved surface cycles. | `UX-07D/I`, `UX-12D/I` |
| IMP-23 | REWRITE | notifications | Bind reminders to per-track goals, consent and platform policy; no generic ingress. | `GOAL-01`, `UX-07I` |
| IMP-24 | REWRITE | content publisher | Remove two-family conditionals; publish generic internal families/nodes/locales and reproducible evidence. | `FND-01`, `PKG-01` |
| IMP-25 | REWRITE | account deletion implementation | Current immediate primitives lack subscription detachment, public token and restore tombstone reconciliation. | `DEL-01..03`, `OPS-02` |
| IMP-26 | REWRITE | current Maestro/RC evidence | Retain reusable kernel flows, replace stale route/copy/two-track flows, delete superseded flows after coverage moves. | each `UX-*I`, `REL-04` |
| IMP-27 | DELETE | Language route/screen and launch Polish UI plumbing | English-only launch has no one-option Language surface; keep locale-neutral content identity only. | `UX-07I` |
| IMP-28 | DELETE | visible `categoryLabel`/family copy | Families are internal; tracks are the only user-visible products. | `TRACK-01`, `UX-01I` |
| IMP-29 | DELETE | server remote-session conflict/resume cases | Account-wide active-session selection and cross-device resume are forbidden target behavior. | `SESSION-01` negative tests |
| IMP-30 | DELETE | content `planning/algorithms/**`, generator, commands and test | Current-looking planned ledger contradicts completed source; extract durable rationale, then remove all 243 generated files and dead consumers. | `TRACK-01` |
| IMP-31 | ADD | mobile identity/data boundary | Installation ID, guest dataset, account binding and secure credential owner are absent. | `GUEST-01`, `ID-01` |
| IMP-32 | ADD | mobile/server sync | Add journal-after-durability compact outbox, cursors, pagination, recent Activity, due review and exact-history loading. | `SYNC-01/02` |
| IMP-33 | ADD | goals | Add per-track goal templates/data and bounded recommendation/reminder effects. | `GOAL-01` |
| IMP-34 | ADD | identity/security lifecycle | Email/password, Apple, Google, linking proof, reauth, recovery codes, Terms and revocation surfaces are absent. | `ID-01..05` |
| IMP-35 | ADD | RevenueCat/backend entitlement | Add one Premium entitlement, webhook projection, opaque ID, bounded cache, seven-day grace, purchase/restore/downgrade. | `ENT-01..03` |
| IMP-36 | ADD | remote package system | Add manifests, immutable object identity, signed URL auth, download validation, atomic cache, version pinning and eviction. | `PKG-01..04` |
| IMP-37 | ADD | Analytics/Crashlytics/reporting | Add fail-closed consent, closed events/redaction and account-unlinked content reports/correction workflow. | `OBS-01`, `REP-01` |
| IMP-38 | ADD | backup/restore operations | Add seven-day PITR runbook, sandbox drill and deletion-tombstone reconciliation. | `OPS-02`, `X-07` |
| IMP-39 | ADD | Activity | Add nested Progress route, recent projection and on-demand exact history. | `SYNC-01`, `UX-06D/I` |
| IMP-40 | ADD | internal product catalogue | Add ten briefs and design_interview contracts; admit no empty production track. | `TRACK-02`, representative proofs |
| IMP-41 | ADD | design authority/tooling | Add Brand Lab 3→2→1, owner approval, repository tokens/assets, dev-only Storybook and CODE_CANONICAL handoff. | `B-*`, `DS-*`, `REL-03` |
| IMP-42 | ADD | public/release surfaces | Add canonical web artifact, auth/action/legal/support/deletion, links, brand/store assets and signed releases. | `UX-12D/I`, `REL-*` |
| IMP-43 | VERIFY | operation dedupe | Current operation-fingerprint replay window is bounded to 100; prove it satisfies cursor/outbox retry behavior. | `SYNC-01` |
| IMP-44 | VERIFY | Coding Interview pedagogy | Prove implementation-planning objective and copy never imply executable-code verification. | `PROOF-02` |
| IMP-45 | VERIFY | content editorial/provenance | Technical evidence is stronger than explicit release editorial approval; add auditable review admission and source freshness. | `FND-01`, `TRACK-02` |
| IMP-46 | VERIFY | Storybook/native/build boundaries | Prove Storybook absent from release graph and exact Expo/platform configuration in clean signed artifacts. | `DS-02`, `REL-04` |
| IMP-47 | VERIFY | retained visual/device evidence | Historical PNGs and 32 Maestro flows are evidence only; revalidate applicability, licensing and physical-device gaps. | `B-01`, verticals, `REL-04` |
| IMP-48 | EXTERNAL_GATE | provider/project state | Cloud Run/IAM, apps, buckets, Apple/Google, RevenueCat, PITR and current Firebase state require authorized read/mutation checkpoints. | `X-01..X-10` |
| IMP-49 | EXTERNAL_GATE | domain/store/signing | Domain/DNS/sender, App Store/Play products, signing identities, distribution and submissions require owner/provider action. | `X-03`, `X-08..X-12` |

### Invariants every task preserves

1. Local learning writes are durable before any account operation; active session, pointer, draft, position, timer and journal remain device-owned.
2. Store transactions, RevenueCat normalization and backend projection are distinct; a local SDK result never authorizes paid download.
3. Published package bytes are immutable, checksum/schema/semantic validated and pinned per prepared session; no per-question Firestore fetch or silent substitution.
4. One responsibility has one owner. Replacements delete old imports, routes, tests, scripts, branches and misleading docs in the same task.
5. Significant presentation waits for an applicable owner-approved Figma reference. Nonvisual kernel/backend/content work does not wait for branding.
6. Families remain internal; no production track appears without a complete free vertical and core loop.
7. Consent/privacy fails closed. Deletion and restore cannot resurrect a deleted account.

## 4. Dependency graph and parallel lanes

```text
FND-01 ─┬─ PLAT-01 ─ ARCH-01
        ├─ GUEST-01 ─ SESSION-01
        ├─ ID-01 ─ ID-02 ─ ID-03 ─ ID-04/ID-05
        ├─ TRACK-01 ─ TRACK-02 ─ PKG-01
        └─ B-01 ─ B-02 ─ B-03 ─ B-04 ─ B-05 ─ DS-01 ─ DS-02 ─ DS-03

SESSION-01 + ARCH-01 ─ SYNC-01; SYNC-01 + ID-02 ─ SYNC-02
SESSION-01 + SYNC-01 + ID-01 ─ ADOPT-01
ADOPT-01 + SYNC-02 + ID-02 + UX-08D ─ ADOPT-02
SYNC-01 + GUEST-01 + TRACK-02 ─ GOAL-01
ID-01 + ARCH-01 ─ ENT-01
ENT-01 + ID-02 + PLAT-01 ─ ENT-02; ENT-02 + ADOPT-02 ─ ENT-03
PKG-01 + ENT-01 + ARCH-01 ─ PKG-02; PKG-01 + PKG-02 + PLAT-01 ─ PKG-03 ─ PKG-04
ID-01 + SYNC-01 ─ DEL-01 ─ DEL-02; DEL-02 + ENT-01 + SYNC-02 ─ DEL-03
ARCH-01 + PLAT-01 ─ OBS-01; ARCH-01 + PKG-01 ─ REP-01
FND-01 + ARCH-01 ─ OPS-01; OPS-01 + DEL-01 ─ OPS-02
PKG-04 + TRACK-02 ─ PROOF-01/02/03; PROOF-01 ─ PROOF-04; PROOF-03 ─ PROOF-05
PROOF-02 + PROOF-04 + PROOF-05 ─ TRACK-03..07
runtime + approved design + DS-03 ─ approved UX implementation cycles
UX-12I + OPS-01 ─ REL-01
all UX-I + proofs + PLAT-01/PKG-04 ─ REL-02A and REL-02B
REL-02A + REL-02B + all UX-I/proofs ─ REL-02C
REL-02A/B/C + DS-01/02/03 + implemented verticals ─ REL-03
REL-01 + REL-02A/B/C + REL-03 + OPS-02 + track admissions ─ REL-04
REL-04 ─ REL-05 and REL-06 ─ REL-07
```

The graph shows the dependency-defining convergences; each task card's `Dependencies` field is the exhaustive machine-checkable edge list. An omitted edge in the visual does not create a prerequisite, and no visual edge may contradict a card.

Parallel lanes after `FND-01`:

| Lane | Can proceed independently | Must wait for |
| --- | --- | --- |
| runtime/backend/data | guest, device-session, sync, identity APIs, entitlement model, package auth, deletion, privacy | only its data/security dependencies; not Figma |
| brand/Figma | landscape and 3→2→1 actual editable work | owner review at `B-03`, `B-04`, `B-05` |
| Storybook/design system | technical audit may happen in `B-01`; implementation starts after `B-05` | final visual direction; Expo baseline |
| vertical product/UI | state contracts may be prepared; significant production UI does not start | applicable `UX-*D` owner approval and runtime dependency |
| content/package/track | ID migration, briefs, schemas, representative proofs | evidence gate; package runtime for production admission |
| platform/public/release | Expo migration and local web work can proceed early | credentials/mutations only at explicit checkpoints |
| external owner/provider | read verification and authorized mutations | Product Owner approval/credentials; never silently inferred |

## 5. Stage and task register

The register contains 82 dependency-derived tasks. Every task below is one coherent execution window. “Paths” are expected owners, not permission for unrelated refactors. “Delete” is mandatory proof: search imports, routes, tests, commands, CI, docs and generated outputs before marking verified.

### Mandatory task-field contract

Every card inherits the fields below; card-specific text overrides or narrows the default. This inheritance is part of each task, including non-UX work.

- **Why now:** the task is at the earliest point allowed by the DAG; its listed dependencies are the complete prerequisites and its objective is the bounded acceptance boundary.
- **Canonical owners:** the stated requirement IDs and narrative documents; where a card names only documents, the matching top-level canonical requirement from the impact map is also mandatory.
- **Confirmed repository state and paths:** the card's stated current state/paths plus its referenced `IMP-*` rows. Expected paths authorize only the named responsibility in the named repository.
- **Implementation requirements:** the card's scope, keep/move/rewrite/delete obligations and the seven architecture invariants in section 3. **Out of scope** includes all unrelated task cards, product-contract changes, unlisted provider mutations and compatibility/fallback scaffolding.
- **Acceptance and automated verification:** the card's explicit checks plus every applicable gate in section 7, typecheck/focused tests, dead-reference scan, `git diff --check`, clean worktree and pushed commit evidence.
- **Manual/device/visual evidence:** the evidence named by the card. For a purely nonvisual/server/content task this is `NOT_APPLICABLE` with a completion-report reason; it never becomes invented UI/device proof. A device/visual task cannot use that exception.
- **Security/privacy/content implications:** every completion report must state the assessed effect on all three, including `none` with evidence; closed schemas, redaction, provenance and data-loss boundaries remain mandatory where applicable.
- **External/owner checkpoint:** only the checkpoint explicitly listed by the card/section 6; otherwise `none`. Older authorization reports never imply a mutation.
- **Completion report target:** update the existing narrowly relevant report when durable evidence needs a repository owner; otherwise use pushed commit/CI/device links and the plan status update. Never create a second plan or raw-log diary.
- **Next task unlocked:** exactly the card's `Unlocks`; if it says a gate contribution, the remaining named dependencies still apply.

### Stage F — trustworthy foundation and platform

#### FND-01 — Clean-checkout gate integrity — `VERIFIED`

- **Objective / why now:** make both repositories’ claimed gates reproducible before architectural implementation relies on them.
- **Canonical owners:** contract authority; docs 11–12. **Prerequisites:** pushed D2 baseline. **Confirmed state:** root CI omits `server/npm ci`; server tests depend on ignored modules; content release gate fails `MISSING_TECHNICAL_EVIDENCE` although release 0015 byte-lock passes.
- **Repositories / paths:** app `.github/workflows/qa.yml`, root/server package scripts and focused tests; content evidence envelopes, publishing validation scripts/tests. **Scope:** install/test server from its lock in CI; diagnose and repair the technical-evidence manifest mismatch without question changes; make isolated release gate reproducible.
- **Out of scope:** feature work, provider mutation, content edits, ID/package migration. **Keep/move/rewrite/delete:** keep current gates and immutable release; rewrite dependency/evidence ownership; delete no evidence unless proven duplicate and replaced.
- **Acceptance / automated verification:** clean dependency installs; server typecheck/tests use only declared locks; content `npm test`, both `validate:real:*`, isolated `ci-release-gate`, app `qa:static`, contract gate and cross-repo lock pass; loopback blockers are reported, never passed. **Manual evidence:** CI run/clean-clone command matrix.
- **Security/privacy/content:** no semantic or provider change. **Checkpoint:** none. **Output:** `docs/reports/fnd-01-clean-checkout-gates.md` only if repository convention needs durable blockers; otherwise commit/CI links. **Unlocks:** all implementation lanes.
- **Verification and evidence:** application gate-integrity commit `f4dcc0008b428b056f4e2d1d6197b57a7fa77883` passed [QA run 31276876009](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/31276876009), including both locked installs, server typecheck/build before root QA, recovery and contract gates. Content final commit `ddaaeae0607d672b0f3b4eb8c8243055cee257bb` passed [architecture run 31277407577](https://github.com/lukaszkurczab/patternly-content/actions/runs/31277407577) and [isolated real-release run 31277414226](https://github.com/lukaszkurczab/patternly-content/actions/runs/31277414226). Durable evidence is commit `7302f88b98efe725f2063e5c053c2e9cbcdb87cf` plus exact manifest: Algorithms technical/coverage `5f81e720eaa43c001bb23a6aa8eab7f85c23189e62317c2a840a4ade31ce9817`; Certification technical `98943d91b7e1281c6e2da5128feff21807aaac5020c4374734dd5f63c5d0802d`. Questions, content versions, immutable `patternly-core-0015`, and the application release lock were unchanged.

#### PLAT-01 — Expo 57 and target native matrix — `VERIFIED`

- **Objective / why now:** establish the supported runtime before native Firebase, RevenueCat, Storybook and final design integrations. **Owners:** `PLATFORM-RELEASE-001`, docs 02/09/12. **Dependencies:** `FND-01`. **State:** Expo 54, Light-only, tablet-capable, implicit Android levels; native folders ignored.
- **Paths / scope:** package/lock, `app.json`, canonical plugins, build config, CI; migrate to Expo 57, iOS 16.4+ iPhone-only, Android 28/36, portrait, Light/Dark/System, 200% text basis and backup exclusion. **Non-goals:** UI redesign, provider registration, signed release.
- **Obligations:** keep backup exclusion; rewrite permission and native target config; delete obsolete tablet/Light-only assertions and unused migration residue. **Acceptance:** clean install/prebuild/typecheck/unit/architecture checks and debug boot on iOS/Android; exact generated-native assertions. **Evidence:** unsigned phone simulator/emulator smoke and config report.
- **Implications/checkpoint:** security review of permissions; no external mutation. **Output:** platform migration report. **Unlocks:** `ARCH-01`, native identity/entitlement, Storybook foundation and final device work.
- **Verification and exact decisions:** clean `npm ci` completed for root and `server`; root/server typechecks and server build passed; root `qa:static` passed with 560 tests; the cross-repository release-lock test, content/privacy boundaries, `git diff --check`, and a clean generated-native Expo prebuild with iOS/Android/backup assertions all passed. The canonical contract gate passed for both `a5eb8ac14b3753bd443486d94853468183605ad7^..a5eb8ac14b3753bd443486d94853468183605ad7` and current `HEAD`; focused gate tests passed 7/7. The five exact RN 0.86 `StyleSheet.absoluteFillObject` → `StyleSheet.absoluteFill` substitutions in `a5eb8ac14b3753bd443486d94853468183605ad7` are `PASS — PRODUCT_OWNER_APPROVED_DESIGN_NEUTRAL_PLATFORM_MIGRATION` under the closed six-criterion `PO-057` exception; no design reference was fabricated. This host has neither an iOS phone simulator nor Android phone emulator/device, and no unsigned debug boot/smoke was performed. That unavailable smoke is `PASS — PRODUCT_OWNER_ACCEPTED_ENVIRONMENT_EXCEPTION` under `PO-056`, not device-test evidence; signed physical-device proof remains a `REL-07` release requirement. No signing or provider authority is required.

#### ARCH-01 — Approved clients, environment and public-origin boundary — `VERIFIED`

- **Objective:** replace the old no-network rule with one closed, testable client registry. **Owners:** `ENVIRONMENT-PUBLIC-LINKS-001`, `IDENTITY-SECURITY-001`, docs 02/09/11. **Dependencies:** `PLAT-01`. **State:** privacy check bans app networking; server environment isolation is strong.
- **Paths / scope:** environment schema, network/secure-storage adapters, privacy static checks, link origin configuration; register only auth/account, entitlement, package, analytics/crash and report clients. **Non-goals:** implement provider flows or public deployment.
- **Obligations:** keep fail-closed environments and deny-all Firestore; rewrite privacy plugin/check; delete direct/unregistered transport paths. **Acceptance:** secrets absent from bundles/logs, default Firebase domains restricted to sandbox, closed-schema tests, no raw Firestore client. **Evidence:** clean release graph/config audit.
- **Checkpoint:** production values remain `X-03/X-04`; local safe defaults explicit. **Output/unlocks:** architecture evidence; unlocks networked lanes.
- **Verification:** pushed application `59cefd9`; closed `APPROVED-CLIENT-ENVIRONMENT-001` schema/parser/registry mapping passed staged contract gate and independent QA. The transport allowlist is registry-derived; direct Firebase/raw transport, raw error diagnostics and console output remain blocked. Android retains only required `INTERNET`; backup and unnecessary-ingress exclusions remain enforced.

### Stage G — guest, device ownership, synchronization and goals

#### GUEST-01 — Installation guest identity and local dataset — `PARTIAL`

- **Objective:** make existing local-first entry explicitly guest-owned. **Owners:** `GUEST-FREE-001`, docs 01/04/08. **Dependencies:** `FND-01`. **State:** learning works without auth but data has no installation identity/account binding.
- **Paths / scope:** bootstrap, storage keys/repositories, installation identity, guest dataset metadata/reset tests. **Non-goals:** account UI, adoption, Premium. **Obligations:** keep kernel/journal; rewrite bootstrap ownership; delete any first-value auth assumption encountered.
- **Acceptance:** first launch reaches a complete bundled free node offline; restart preserves identity/data; reset is explicit; no Firebase Anonymous Auth; failure injection cannot orphan data. **Evidence:** focused Maestro after existing UI only, storage migration report. **Checkpoint:** none. **Unlocks:** `SESSION-01`, `ADOPT-01`, `UX-01D`.
- **Checkpoint / remaining boundary:** the canonical local installation/dataset record is provisioned and verified before journal recovery or content navigation. It begins in `guest` state, preserves valid later binding states without adopting or regenerating, rejects corrupt/unsupported identities without replacement, and blocks before first value on identity or durable-write failure. Focused behavioral/contract tests, typecheck, the staged canonical contract gate, and independent QA passed at `3690df756daf34e1fa0b26f676c9785fa2180997`. Existing explicit local-history reset behavior remains to be reconciled with the guest-dataset contract. Complete bundled `freeNodeId` package evidence is present after `PKG-01`, but runtime activation and the complete first-value flow remain downstream work; neither can be claimed here or satisfied by a fallback. `GUEST-01` therefore remains partial without blocking independent account-security work.

#### SESSION-01 — Device-session cutover across server contracts — `BLOCKED`

- **Objective:** make account schema incapable of storing/resolving active session state. **Owners:** `DEVICE-SESSION-SYNC-001`, docs 04/08/17. **Dependencies:** `GUEST-01`. **State:** local ownership is compatible; server types/adoption synchronize session/draft/timer.
- **Paths / scope:** server account types, sync/adoption records, schema/tests; preserve local repositories. **Non-goals:** incremental sync client. **Obligations:** keep local session lifecycle; delete remote pointer/session/draft/position/timer, conflict selection and cross-device resume tests with no alias.
- **Acceptance:** negative tests reject forbidden remote fields; two devices can each hold one local session; account operations contain only compact terminal facts; migration behavior is explicit and loss-safe. **Evidence:** schema diff and dead-path scan. **Checkpoint:** none. **Unlocks:** `SYNC-01`, `ADOPT-01`.

#### SYNC-01 — Incremental account operation and projection API — `BLOCKED`

- **Objective:** preserve revision/idempotency while replacing full account snapshots as ordinary sync. **Owners:** `DEVICE-SESSION-SYNC-001`, docs 02/04/08/09. **Dependencies:** `SESSION-01`, `ARCH-01`. **State:** bounded mutation and paginated canonical snapshots exist; operation replay window needs proof.
- **Paths / scope:** server account service/store/HTTP/tests; operations for current track, goals, attempts/results/review and terminal summaries; cursors, due review, recent Activity, on-demand exact history. **Non-goals:** mobile UI.
- **Obligations:** keep fingerprints/revisions/transactions; rewrite projection ownership; delete O(n) ordinary-sync assumptions and remote device state. **Acceptance:** pagination/cursor conflicts, retry/replay-window, restart and concurrent-device tests; projections rebuild from compact facts. **Evidence:** API contract and load bounds.
- **Checkpoint:** none. **Output/unlocks:** sync report; unlocks `SYNC-02`, `GOAL-01`, Activity runtime.

#### SYNC-02 — Mobile journal-to-outbox synchronization — `BLOCKED`

- **Objective:** enqueue idempotent account operations only after local durability. **Owners:** `DEVICE-SESSION-SYNC-001`, docs 08/11/12. **Dependencies:** `GUEST-01`, `SYNC-01`, `ID-02`. **State:** local journal exists; no mobile account client/outbox/cursor.
- **Paths / scope:** application services, MMKV outbox/cursors, account API adapter, triggers and retry states. **Non-goals:** background-sync promise or UI redesign. **Obligations:** keep journal as local authority; add one outbox; delete duplicate direct network writes/fallbacks.
- **Acceptance:** offline/restart/failure/concurrency tests, bounded pagination, explicit sync states, no session draft/timer payload, no silent data loss. **Evidence:** two-device convergence harness. **Checkpoint:** provider test project only when `X-04` authorized. **Unlocks:** adoption, sync UI, Progress/Activity.

#### ADOPT-01 — Server guest-adoption semantics — `BLOCKED`

- **Objective:** retain durable staging while making adoption deterministic and session-free. **Owners:** `ACCOUNT-DATA-ADOPTION-001`, `GUEST-FREE-001`, docs 03/08/09. **Dependencies:** `SESSION-01`, `SYNC-01`, `ID-01`. **State:** start/upload/advance/preview/confirm/cancel and lease recovery exist; current conflict model chooses active sessions.
- **Paths / scope:** server adoption service/store/HTTP/tests. **Non-goals:** mobile presentation. **Obligations:** keep leases, preview, idempotency and crash recovery; rewrite plan cases; delete active-session arbitration.
- **Acceptance:** new-empty default preserves guest; explicit discard; existing-account deterministic plan; account cannot silently merge/discard; confirm is convergent/restart-safe. **Evidence:** truth-table and failure tests. **Checkpoint:** none. **Unlocks:** `ADOPT-02`.

#### ADOPT-02 — Mobile adoption boundary and binding — `BLOCKED`

- **Objective:** bind guest data only after truthful preview and confirmation. **Owners:** `ACCOUNT-DATA-ADOPTION-001`, docs 03/08. **Dependencies:** `ADOPT-01`, `SYNC-02`, `ID-02`, approved `UX-08D` for final UI. **State:** no mobile client/binding.
- **Paths / scope:** guest/account repositories, adoption coordinator, secure binding, state model; presentation in `UX-08I`. **Non-goals:** social linking. **Obligations:** finish-or-abandon active guest session; delete hidden merge/reset paths.
- **Acceptance:** all preview choices, relaunch boundaries and remote/local failure matrices preserve recoverability; binding only after converged confirmation. **Evidence:** device restart harness. **Checkpoint:** none. **Unlocks:** account continuity and entitlement UI.

#### GOAL-01 — Per-track goals and recommendation inputs — `BLOCKED`

- **Objective:** add synchronized per-track goals without coupling them to entitlement or scoring. **Owners:** `PRODUCT-SURFACES-GOALS-001`, docs 01/04/08/17. **Dependencies:** `SYNC-01`, `GUEST-01`, `TRACK-02`. **State:** goals absent.
- **Paths / scope:** goal types/templates, local/account repos, recommendation/reminder adapters/tests. **Non-goals:** final UI. **Obligations:** one owner; delete ad-hoc cadence flags if found.
- **Acceptance:** only valid per-track templates; manual choice outranks recommendation; goals never lock content/change mastery/streak or punish; guest offline and sync cases pass. **Evidence:** decision-table tests. **Checkpoint:** none. **Unlocks:** first-run, Today, Settings design/implementation.

### Stage I — identity and account security

#### ID-01 — Account/security service contracts and composition — `BLOCKED — authenticated approved-client credential and deletion-tombstone authority unresolved`

- **Objective:** expose one composed account API over the compatible Firebase foundation. **Owners:** `IDENTITY-SECURITY-001`, docs 02/04/09. **Dependencies:** `FND-01`, `ARCH-01`. **State:** token verification exists; deletion is not composed; mobile auth absent.
- **Paths / scope:** server composition/HTTP, account generation, revocation and approved-operation schemas. **Non-goals:** provider console or UI. **Obligations:** keep verifier/HTTP boundary; wire or delete unreachable duplicate primitives.
- **Acceptance:** clean server tests cover auth/revocation/recent-auth, non-enumerating errors, approved clients and account generation. **Evidence:** endpoint matrix. **Checkpoint:** `X-04` later. **Unlocks:** `ID-02`, adoption and deletion.
- **Verified boundary / blocker:** the attempted local composition was deliberately not retained. Firebase tokens provide no server-verifiable approved mobile-client/environment claim, so an ordinary request header would be untrusted. Existing deletion proof is request-addressable only and is written after recursive deletion, so identity creation cannot safely distinguish a fresh account from a concurrent/deleted account without a durable UID-addressable tombstone authority. Account revision is currently owned by the dataset head and cannot be copied into a static identity record without a declared consistency rule. This is a security-policy/ownership decision; no partial endpoint is pushed.

#### ID-02 — Email/password mobile vertical and action-handler API — `BLOCKED`

- **Objective:** implement verified email/password registration/sign-in/reset transport without blocking guest first value. **Owners:** `IDENTITY-SECURITY-001`, `ENVIRONMENT-PUBLIC-LINKS-001`, docs 03/09. **Dependencies:** `ID-01`, `PLAT-01`. **State:** Firebase packages unused; no action handler.
- **Paths / scope:** auth adapter, secure token storage, app account state, server/public action result taxonomy; UI waits for `UX-08D`. **Non-goals:** Apple/Google/recovery codes.
- **Obligations:** provider-controlled ordinary expiry/single use; delete exact-30-minute ordinary assumptions. **Acceptance:** verify/reset/retry/restart/revocation/non-enumeration tests; guest learning unaffected. **Evidence:** sandbox test only after checkpoint. **Checkpoint:** `X-04`. **Unlocks:** mobile sync/adoption and account UI.

#### ID-03 — Reauthentication, email/password change and sign-out — `BLOCKED`

- **Objective:** complete current-device/all-device security lifecycle. **Owners:** `IDENTITY-SECURITY-001`, docs 03/09. **Dependencies:** `ID-02`, `ID-01`. **State:** verifier supports recent-auth and revoked-token checks; no client flows.
- **Paths / scope:** server/mobile commands and secure-state cleanup. **Non-goals:** visual implementation before `UX-08D`. **Obligations:** keep recent-auth; delete token-survives-all-device-signout paths.
- **Acceptance:** reauth required for sensitive changes; email change verified; all-device sign-out enforced at API; local guest/account data boundaries truthful. **Evidence:** revocation/restart matrix. **Checkpoint:** sandbox provider config. **Unlocks:** account/security implementation.

#### ID-04 — Apple/Google linking and method safety — `BLOCKED`

- **Objective:** add providers to one UID/account with explicit proof and collision handling. **Owners:** `IDENTITY-SECURITY-001`, docs 03/09. **Dependencies:** `ID-03`, `PLAT-01`. **State:** provider foundation off/unconfigured; no client flows.
- **Paths / scope:** provider adapters, link/unlink service, method inventory/tests. **Non-goals:** console mutation without `X-05`. **Obligations:** no automatic email merge; never unlink last usable method; remove parallel provider accounts.
- **Acceptance:** link collision, cancelled proof, revoked credential, relaunch and last-method negative tests. **Evidence:** sandbox iOS/Android device proof. **Checkpoint:** `X-05`. **Unlocks:** complete account vertical.

#### ID-05 — Recovery codes and Terms acceptance — `BLOCKED`

- **Objective:** add eight one-time codes, narrow recovery session and versioned Terms. **Owners:** `IDENTITY-SECURITY-001`, docs 04/09. **Dependencies:** `ID-01`, `ID-03`. **State:** absent.
- **Paths / scope:** hashing/storage/API/client coordinator; generate/regenerate/use and Terms record. **Non-goals:** support takeover. **Obligations:** no plaintext persistence/logging; revoke sessions after recovery; delete broad recovery tokens.
- **Acceptance:** exactly eight single-use codes, replay/race/rate-limit tests, last recovery path safety, Terms separate from optional analytics consent. **Evidence:** redaction/security review. **Checkpoint:** none. **Unlocks:** complete account/security UX.

### Stage C — commercial entitlement, packages and lifecycle

#### ENT-01 — Backend Premium authority and webhook projection — `BLOCKED`

- **Objective:** establish store→RevenueCat→backend authority for one entitlement. **Owners:** `COMMERCIAL-ENTITLEMENT-001`, docs 02/04/09. **Dependencies:** `ID-01`, `ARCH-01`. **State:** no billing code.
- **Paths / scope:** server entitlement records, environment, webhook verification/idempotency, account projection/tests. **Non-goals:** product creation or UI. **Obligations:** opaque Patternly account ID, no email; one monthly/annual entitlement; no slots/tiers; delete local-authority assumptions.
- **Acceptance:** duplicate/out-of-order/refund/revoke/expiry/product-mismatch tests and bounded projection; guest denied. **Evidence:** threat/model contract. **Checkpoint:** sandbox credentials `X-06`. **Unlocks:** package authorization and clients.

#### ENT-02 — Mobile entitlement cache and seven-day grace — `BLOCKED`

- **Objective:** consume backend projection with bounded cache and safe offline behavior. **Owners:** `COMMERCIAL-ENTITLEMENT-001`, docs 04/08/09. **Dependencies:** `ENT-01`, `ID-02`, `PLAT-01`. **State:** absent.
- **Paths / scope:** RevenueCat adapter, identity binding, backend verification cache/clock/retry tests. **Non-goals:** paywall presentation. **Obligations:** SDK result never authorizes package; delete email/device entitlement identity.
- **Acceptance:** exact seven-day grace, clock/restart/revoke/refund/unknown states, cross-platform account identity and safe completion of already-started entitled session. **Evidence:** sandbox trace. **Checkpoint:** `X-06`. **Unlocks:** purchase/restore and Premium sessions.

#### ENT-03 — Purchase, restore, conflict and downgrade coordinator — `BLOCKED`

- **Objective:** implement commercial commands after first value. **Owners:** `COMMERCIAL-ENTITLEMENT-001`, docs 03/09. **Dependencies:** `ENT-02`, `ADOPT-02`; presentation waits `UX-09D`. **State:** absent.
- **Paths / scope:** purchase/restore/manage/downgrade state machine; final UI in `UX-09I`. **Non-goals:** store production setup.
- **Obligations:** verified account required; guest purchase prohibited; historical learning independent; Free alternative explicit. **Acceptance:** restore conflicts, cancellation, network/store/backend disagreement and cross-platform cases are explicit; no fake success. **Evidence:** sandbox/device flow. **Checkpoint:** `X-06`, later `X-10`. **Unlocks:** Premium UX and release products.

#### PKG-01 — Generic node package and release format — `VERIFIED`

- **Objective:** produce immutable compressed whole-node artifacts and a bundled complete free node. **Owners:** `CONTENT-PACKAGES-001`, docs 04/07. **Dependencies:** `FND-01`, `TRACK-01`, `TRACK-02`. **State:** deterministic whole-track pipeline only.
- **Repositories / paths:** content schemas/config/publisher/tests; app contract fixtures. **Non-goals:** cloud upload or mobile download. **Obligations:** keep canonical source/evidence/checksums/history; rewrite publisher generically; never mutate 0015.
- **Acceptance:** local bundled package records include exact track/node/version/checksum/minimum app/evidence/compressed size; reproducible bytes; complete freeNodeId; negative tests reject mutation/substitution/partial output. Remote object identity/generation belongs only to `PKG-02`, not a bundled package. **Evidence:** exact-byte cross-repository fixture. **Unlocks:** server auth, mobile package store and representative proofs.
- **Verification:** `PO-059` selects closed, versioned Free-node experience profiles instead of treating full-track `validModes` as Free modes. Content `955159c` publishes immutable `patternly-core-0018`, validates both profiles and emits deterministic `bundled-free-node-v2` records: Coding Interview `complexity_and_constraints` (158 items; Learn/Guided/Custom/Weak) and GCP ACE `setup_environment` (82 items; Focus/Weak/Quick). Both bind release, source, technical evidence, inventory, brief, profile and payload checksums; empty review evidence is explicitly unavailable. App `9fc20e5` verifies exact bytes and provenance, rejects tampering, and preserves no remote-delivery, entitlement, or runtime fallback claim.

#### PKG-02 — Entitled package manifest and signed-URL API — `BLOCKED`

- **Objective:** authorize immutable package downloads using backend entitlement. **Owners:** `CONTENT-PACKAGES-001`, `COMMERCIAL-ENTITLEMENT-001`, docs 02/09. **Dependencies:** `PKG-01`, `ENT-01`, `ARCH-01`. **State:** no endpoint/bucket contract.
- **Paths / scope:** server manifest metadata, authorization, signed URL adapter, rate/redaction tests. **Non-goals:** bucket upload without `X-07`.
- **Obligations:** Cloud Run verifies identity/entitlement; Firestore metadata only; delete any per-question fetch. **Acceptance:** guest/unentitled/stale/min-version/checksum/object-generation negatives; short-lived URLs; no object enumeration. **Evidence:** emulator/adapter tests. **Checkpoint:** `X-07`. **Unlocks:** `PKG-03`.

#### PKG-03 — Mobile verified package store and atomic activation — `BLOCKED`

- **Objective:** download to temporary storage, validate and atomically activate a version. **Owners:** `CONTENT-PACKAGES-001`, docs 04/08/17. **Dependencies:** `PKG-01`, `PKG-02`, `PLAT-01`. **State:** bundled in-memory catalogs only.
- **Paths / scope:** client, versioned store, checksum/schema/semantic validation, active pointer, rollback. **Non-goals:** final Practice UI. **Obligations:** keep free bundle and immutable refs; no fallback to stale/wrong version.
- **Acceptance:** interruption/corruption/disk-full/restart/min-version tests retain previous verified version; paid download needs backend authority. **Evidence:** filesystem fault harness. **Checkpoint:** sandbox bucket later. **Unlocks:** `PKG-04`, download UI.

#### PKG-04A — Verified content-package resolver and session-pin contract — `VERIFIED`

- **Objective:** define and implement one package resolver contract that accepts exact verified bundled packages now and future installed packages later, without a separate Free runner, cache, or compatibility catalog.
- **Inputs:** `PKG-01` package records/profiles, `CONTENT-PACKAGES-001`, docs 04/08/17, and the retired whole-track validator/availability/family-runtime owners.
- **Scope:** package identity/version/provenance and availability taxonomy; decoder/schema/semantic boundary; profile-only catalog adapter contract; exact session package-pin record; atomic replacement of whole-track generated-artifact ownership.
- **Non-goals:** remote download, Cloud Storage, entitlement authorization, cache eviction, or any claim of Premium delivery. PO-060 supplies the narrow approved Practice Hub, Setup, and unavailable-mode references; no device result is claimed.
- **Acceptance:** one typed resolver contract supports bundled and future installed packages; malformed/tampered/profile-incompatible bytes fail closed; package identity/version is sufficient for exact resume/review/progress resolution; only profile modes are discoverable; no second lifecycle or Free-only runner is introduced; retired whole-track owners have no production import.
- **Pushed evidence:** application `dd7b8cc` introduces the verified exact-byte resolver; `2a15d14` adds profile-closed package catalogs; `e7821e0` adds the React Native decoder using Expo Crypto and `fflate`; `02c47aa` completes the atomic cutover. At `02c47aa`, bootstrap/lifecycle/review/progress use exact `ContentPackagePin`, Coding exposes Learn/Guided/Custom/Weak and GCP exposes Focus/Weak/Quick, unavailable modes and foreign-package evidence are explicit, and whole-track runtime owners are deleted. Independent QA passed after adversarial profile, pin, default-entry, malformed-route and presentation checks. Typecheck, the staged contract gate, recovery/content/privacy boundaries, cross-repository package checks and focused 88-test verification pass. The density harness now reads each brief from the immutable content commit it declares rather than the mutable current content worktree; this preserves its exact-pin purpose. The full local suite passed 597/597 without synchronizing, rewriting, or otherwise changing the GCP lock.

#### PKG-04 — Session pinning, review resolution and safe eviction — `BLOCKED`

- **Objective:** make runtime/review consume exact package versions safely. **Owners:** `CONTENT-PACKAGES-001`, docs 08/17. **Dependencies:** `PKG-03`, `ENT-02`. **State:** sessions pin bundled content refs; no multi-package cache.
- **Paths / scope:** preparation, review resolver, cache policy and recovery tests. **Non-goals:** bulk content. **Obligations:** keep immutable session identity; protect active/draft/review dependencies; delete silent latest substitution.
- **Acceptance:** active session survives entitlement change; review resolves exact installed package or explicit unavailable state; eviction never removes pinned bytes. **Evidence:** multi-version fault matrix. **Checkpoint:** none. **Unlocks:** Premium content verticals and track admission.

#### DEL-01 — Durable deletion intent, tombstone and composition — `BLOCKED`

- **Objective:** make deletion restart-safe and non-resurrecting. **Owners:** `ACCOUNT-SIGNOUT-DELETION-001`, `BACKUP-RESTORE-001`, docs 04/09. **Dependencies:** `ID-01`, `SYNC-01`. **State:** deletion/proof primitives exist but are not composed and identity/proof ordering is unsafe.
- **Paths / scope:** server lifecycle service/store/HTTP, tombstones, session revocation, recursive data/identity deletion tests. **Non-goals:** subscription UI/public token. **Obligations:** move one owner; delete unreachable/split paths.
- **Acceptance:** every crash point resumes safely; sync/snapshot/restore reject tombstoned account; proof retention bounded; no resurrection. **Evidence:** failure-injection matrix. **Checkpoint:** provider sandbox later. **Unlocks:** `DEL-02`, `OPS-02`.

#### DEL-02 — Public and authenticated deletion APIs — `BLOCKED`

- **Objective:** provide immediate Delete now and possession-verified public flow. **Owners:** `ACCOUNT-SIGNOUT-DELETION-001`, `ENVIRONMENT-PUBLIC-LINKS-001`, docs 03/09. **Dependencies:** `DEL-01`, `ID-02`. **State:** no public route/action handler.
- **Paths / scope:** authenticated endpoint, exact 30-minute custom possession token, non-enumerating public handler. **Non-goals:** production deployment/UI before approval.
- **Obligations:** ordinary Firebase action expiry remains provider-controlled; delete shared 30-minute assumptions. **Acceptance:** single-use/expiry/replay/non-enumeration/rate tests and revocation. **Evidence:** local web integration. **Checkpoint:** domain `X-03`. **Unlocks:** deletion UI/public release.

#### DEL-03 — Subscription-aware deletion and bound-device cleanup — `BLOCKED`

- **Objective:** separate Patternly deletion from store cancellation/refund and detach processor association. **Owners:** `COMMERCIAL-ENTITLEMENT-001`, `ACCOUNT-SIGNOUT-DELETION-001`, docs 03/09. **Dependencies:** `DEL-02`, `ENT-01`, `SYNC-02`; UI waits `UX-11D`.
- **Paths / scope:** lifecycle coordinator, RevenueCat association, immediate/supported scheduled modes, device tombstone handling. **Non-goals:** promise store cancellation/refund.
- **Obligations:** truthful Manage subscription; delete account even if paid period remains; prevent stale device upload. **Acceptance:** active/expired/refunded/offline/multi-device cases; processor detached; previously bound device returns explicit deleted state. **Evidence:** sandbox matrix. **Checkpoint:** `X-06`. **Unlocks:** deletion vertical.

### Stage O — privacy, reporting and recovery operations

#### OBS-01 — Consent-gated Analytics and Crashlytics — `BLOCKED`

- **Objective:** add operational visibility without widening data collection. **Owners:** `ANALYTICS-REPORTS-001`, docs 04/09/12. **Dependencies:** `ARCH-01`, `PLAT-01`. **State:** current “analyticsService” is local Progress logic; no telemetry.
- **Paths / scope:** first move/rename local projection; then consent state, closed event registry, adapters, redaction and crash sanitization. **Non-goals:** broad experimentation platform.
- **Obligations:** fail closed; no raw per-event Firestore stream; delete ambiguous analytics naming/direct calls. **Acceptance:** consent-off emits nothing, forbidden fields fail tests, revoke/reinstall/restart cases and release client registry pass. **Evidence:** proxy/log inspection. **Checkpoint:** Firebase app config `X-04`. **Unlocks:** release observability and consent UI.

#### REP-01 — Account-unlinked content report lifecycle — `BLOCKED`

- **Objective:** support bounded offline report→review→correction without automatic learner data. **Owners:** `ANALYTICS-REPORTS-001`, docs 04/07/09. **Dependencies:** `ARCH-01`, `PKG-01`; UI waits `UX-10D`. **State:** absent in both repos.
- **Paths / scope:** mobile queue, server/admin states, retention/de-identification and content correction/new-release link. **Non-goals:** attach response/account/email/full prompt/feedback by default.
- **Obligations:** explicit account/contact opt-in only; delete hidden context enrichment. **Acceptance:** offline retries idempotently, confirmation only after receipt, forbidden-field tests, deletion/retention workflow and correction provenance. **Evidence:** cross-repo report case. **Checkpoint:** admin access later. **Unlocks:** report UX and content operations.

#### OPS-01 — Production deployment/IAM packet and verification — `PARTIAL — local digest-pinned definition complete; container/provider evidence pending`

- **Objective:** convert repository server into a reproducible deployable artifact with least privilege. **Owners:** docs 02/09/11; environment requirements. **Dependencies:** `FND-01`, `ARCH-01`. **State:** no proven Docker/Cloud Build/deploy path or current Cloud Run/IAM evidence.
- **Paths / scope:** container/build/deploy config, service account/IAM manifests, health/logging, rollback; read verification where authorized. **Non-goals:** production mutation without `X-02`.
- **Obligations:** no owner credentials in repo; remove dead deployment narratives/scripts. **Acceptance:** local container/clean build, least-privilege diff, environment separation and rollback packet. **Evidence:** immutable image provenance. **Checkpoint:** `X-01/X-02`. **Unlocks:** provider-backed staging/production.
- **Verification:** application `4b595f6` adds the one PO-031 manual Cloud Build route, digest-pinned Node and builder images, separated identities, digest deployment instructions and rollback packet. Static server build/typecheck and focused definition tests pass. Docker/Podman runtime is unavailable locally and no provider read/mutation was authorized, so image-start and current IAM/deployment evidence remain pending `X-01/X-02`.

#### OPS-02 — Seven-day PITR restore safety — `BLOCKED`

- **Objective:** prove disaster recovery without account resurrection. **Owners:** `BACKUP-RESTORE-001`, docs 09/12. **Dependencies:** `DEL-01`, `OPS-01`. **State:** repo says PITR off; no runbook/drill.
- **Paths / scope:** configuration packet, restore runbook, sanitized sandbox drill tooling, tombstone/proof reconciliation. **Non-goals:** user account recovery or scheduled export.
- **Obligations:** preserve OS-backup exclusion; delete claims that backup restores user accounts. **Acceptance:** seven-day target documented against verified provider capability; drill detects/re-removes tombstoned records; sanitized evidence and rollback. **Checkpoint:** `X-08` explicit mutation/drill authorization. **Unlocks:** recovery gate.

### Stage B/D — Brand Lab and repository design authority

#### B-01 — Design/tooling capability and asset audit — `VERIFIED`

- **Objective:** establish actual Figma access, Expo-compatible Storybook approach, visual tooling, assets/licensing and release boundaries. **Owners:** `BRAND-DESIGN-AUTHORITY-001`, docs 05/06. **Dependencies:** `FND-01`; Storybook compatibility uses `PLAT-01` result. **State:** historical references only, no Storybook/canonical brand assets.
- **Paths / scope:** read-only design registry, tokens/components/icons/fonts/screenshots/Maestro/build graph audit. **Non-goals:** create visual directions or install Storybook. **Obligations:** classify and later delete unapproved alternatives; no metadata placeholder.
- **Acceptance:** evidence-backed technical choices, license gaps and risk-based state inventory; Figma write capability verified. **Evidence:** tracked audit `docs/audits/2026-08-09-b01-design-tooling-asset-audit.md`; authenticated Figma board `10:2` and owner annotation read-back on 2026-08-10. **Unlocks:** `B-02`.

#### B-02 — Landscape and anti-reference audit — `VERIFIED`

- **Objective:** define collision/cliché constraints for the one Patternly brand. **Owners:** docs 06 and brand PO decisions. **Dependencies:** `B-01`. **State:** no current formal territory study.
- **Paths / scope:** repository design evidence plus referenced primary visual sources; technical learning/developer/cloud/P marks/nodes/branches/negative space. **Non-goals:** trademark opinion or final choice.
- **Obligations:** evidence-only output, no approval label. **Acceptance:** explicit anti-reference/collision matrix and solo-maintainability constraints. **Evidence:** tracked audit `docs/audits/2026-08-10-b02-landscape-anti-reference-audit.md`; it contains primary-source links and no selected direction. **Unlocks:** `B-03`.

#### B-03 — Three Figma directions — `PARTIAL — X-09A Product Owner 3→2 choice required`

- **Objective:** create three structurally distinct editable proof sets. **Owners:** docs 05/06. **Dependencies:** `B-02`. **State:** no approved current direction.
- **Scope:** required mark/icon/wordmark/color/type/track symbol/hero/product-state/public-store proofs in Figma. **Non-goals:** production code or self-approval. **Obligations:** retire rejected explorations after durable decision/provenance retention.
- **Acceptance:** actual editable frames/components, Light/Dark, motion/reduced-motion intent and rationale; no sub-brands. **Evidence:** Figma board `10:92`, editable candidate frames `10:93`, `10:94`, `10:95`, and tracked record `docs/designs/b03-three-patternly-directions/DESIGN.md`. **Checkpoint:** `X-09A` owner chooses exactly two. **Unlocks:** `B-04`.

#### B-04 — Two finalist systems — `BLOCKED`

- **Objective:** deepen two selected directions across required product states. **Owners:** docs 05/06. **Dependencies:** owner checkpoint `X-09A`. **Scope:** hero, track, first entry, feedback, summary/next action, store/public, motion/reduced motion, haptic semantics.
- **Non-goals:** implementation or final approval. **Obligations:** delete rejected third current-looking surface from active references. **Acceptance:** comparable complete proof sets, accessibility contrast/type evidence, optical icon exports. **Checkpoint:** `X-09B` owner selects one. **Output/unlocks:** finalist evidence; `B-05`.

#### B-05 — Final visual system approval — `BLOCKED`

- **Objective:** establish one owner-approved final visual authority. **Owners:** `BRAND-DESIGN-AUTHORITY-001`, docs 05/06. **Dependencies:** `X-09B`. **Scope:** final mark/icon/wordmark/type/palette/track accents/symbols/illustration/motion/haptics/public-store applications and reference states.
- **Non-goals:** Codex approval or code handoff completion. **Obligations:** no duplicate finalist authority. **Acceptance:** real frames/components have owner-only `APPROVED`, provenance and version. **Checkpoint:** `X-09C`. **Evidence:** decision record and approved references. **Unlocks:** `DS-01` and all `UX-*D`.

#### DS-01 — Repository token, asset and licensing authority — `BLOCKED`

- **Objective:** encode approved system once in platform-neutral repository sources. **Owners:** docs 05/06/11. **Dependencies:** `B-05`, `PLAT-01`. **State:** old tokens/components, no canonical brand package.
- **Paths / scope:** tokens, typed generated theme, vectors/fonts/illustration/motion/haptic metadata and licenses. **Non-goals:** parallel redesign. **Obligations:** replace/delete superseded tokens/assets/literals, no hidden overrides.
- **Acceptance:** Light/Dark/System, accents, semantic response/status colors, type/spacing/surface/motion/haptic values generated deterministically; lint blocks unsafe literals. **Evidence:** source/export parity. **Checkpoint:** none. **Unlocks:** `DS-02/03`.

#### DS-02 — Development-only React Native Storybook — `BLOCKED`

- **Objective:** render production components through deterministic typed fixtures without entering release. **Owners:** docs 05/11/12. **Dependencies:** `DS-01`, `PLAT-01`. **State:** absent.
- **Paths / scope:** separate dev entry/target, fixture/view-model boundary, local visual regression and coverage manifest. **Non-goals:** repositories/MMKV/account/payment/session lifecycle in stories or hosted paid service.
- **Obligations:** no parallel story components or mock architecture; NOT_APPLICABLE only with reason. **Acceptance:** static proof Storybook packages/entry/assets absent from release graph/bundle; production components only; deterministic screenshots. **Evidence:** bundle graph and catalog. **Checkpoint:** none. **Unlocks:** `DS-03`, vertical implementations.

#### DS-03 — Canonical primitives, shells and complete states — `BLOCKED`

- **Objective:** replace the old visual component path with approved production primitives and state shells. **Owners:** docs 05/06/11. **Dependencies:** `DS-01`, `DS-02`. **Scope:** controls, response interactions, learning/session shells, loading/empty/offline/error/saving/frozen/finalizing/recovery/destructive states, motion/reduced-motion, haptics and large text.
- **Non-goals:** screen-specific product logic. **Obligations:** use production components in stories; delete duplicate old primitives/tests after consumers migrate. **Acceptance:** interaction/accessibility/visual regression and Figma comparison pass on iOS/Android. **Evidence:** Storybook baselines. **Checkpoint:** visual parity review. **Unlocks:** all `UX-*I`.

### Stage T — product identities, briefs and representative content proofs

#### TRACK-01 — Atomic Coding Interview and GCP identity migration — `VERIFIED`

- **Objective:** remove old target IDs across app/content without an alias. **Owners:** `LEARNING-PRODUCTS-001`, docs 04/07/16. **Dependencies:** `FND-01`. **State:** `algorithms`/`cloud-certification`, hard-coded two-family branches; eight candidate filenames; stale planning ledger.
- **Paths / scope:** app registry/runtime/persistence/content lock/tests; content configs/taxonomy/source/publisher/evidence; migrate to `coding_interview`, `coding-interview-dsa-problem-solving`, and `google-cloud-associate-cloud-engineer` while retaining stable item/evidence identities.
- **Non-goals:** new questions or permanent alias. **Obligations:** move candidate paths/rationale, delete old IDs/branches and 243-file planning ledger plus generator/scripts/tests after consumers move. **Acceptance:** whole-repo/cross-repo old-ID scan, storage migration failure tests, byte/provenance gates and no user-visible family. **Evidence:** migration map. **Checkpoint:** `PO-058` approves exactly the eight existing `two-pointers/*.candidate.json` items as reviewed canonical content; promotion must preserve their payload, item, option, taxonomy and evidence identities and still pass immutable release verification. **Unlocks:** briefs/packages/proofs.
- **Verification:** content source/evidence/artifacts/releases are pushed through `patternly-core-0017` at content `4822bca`; independent QA preserved all item payloads and stable identities. Application `afe8f8e` pins each track to its immutable verified producer, removes retired active paths and aliases, rejects persisted retired IDs explicitly, and passes the closed contract gate with independent QA.

#### TRACK-02 — Ten complete track briefs and registry admission contract — `PARTIAL — package evidence verified; production catalogue gate remains intentionally pending`

- **Objective:** define production-shaped briefs without empty registry cards or filler. **Owners:** `LEARNING-PRODUCTS-001`, docs 01/07/15/16. **Dependencies:** `TRACK-01`. **State:** two configs, no Design Interview or admission/free-node fields; canonical goal semantics already exist in `PRODUCT-SURFACES-GOALS-001`, so brief definition does not wait for their runtime implementation.
- **Repositories / scope:** canonical content briefs and app internal density/admission tests for GCP ACE, AWS SAA, Azure AZ-104, AI-901, Terraform Associate, KCNA, Coding Interview, Backend System Design, Frontend System Design, Object-Oriented Design; each owns learner/JTBD, internal family, taxonomy, freeNodeId, modes, goals, Progress, package/provenance and admission gate.
- **Non-goals:** registry placeholders or bulk questions. **Obligations:** generic internal families only; delete public family/category metadata. **Acceptance:** ten real briefs validate; production registry admits only complete free/core-loop tracks; density harness remains non-production. **Evidence:** cross-repo schema tests. **Unlocks:** package schema and proofs.
- **Verification / remaining boundary:** content `955159c` validates all ten canonical briefs and packages factual evidence only for the two real tracks. App `9fc20e5` pins every brief exactly, rejects duplicate/orphan/missing evidence, and verifies the two immutable Free-node package records against their bytes, profile mode closure and producer provenance. They report `package_evidence_verified_catalogue_gate_pending`; no descriptor-only track receives package evidence or registry admission. Shipping-catalogue admission remains truthfully pending the existing guest/runtime/package-activation gates (`GUEST-01`, `PKG-03`, and their downstream product proof), rather than being inferred from a brief or bundle alone.

#### PROOF-01 — GCP Certification free/package vertical — `BLOCKED`

- **Objective:** prove the reference Certification product on node packages. **Owners:** certification doc 15, package/content requirements. **Dependencies:** `PKG-04`, `TRACK-02`, approved applicable UX cycles. **State:** strong runtime/content, whole-track bundled.
- **Scope:** complete free node, Premium nodes, goals/progress/review/simulation, provenance and immutable publication. **Non-goals:** other certifications. **Obligations:** keep authored semantics; delete old full-bank runtime path after exact coverage moves. **Acceptance:** complete guest and entitled loops, package/review/version/device tests, editorial/technical approval. **Evidence:** cross-repo release and device pack. **Checkpoint:** sandbox package infrastructure. **Unlocks:** `PROOF-04`.

#### PROOF-02 — Coding Interview migrated product proof — `BLOCKED`

- **Objective:** prove strategy-first Coding Interview after atomic ID migration. **Owners:** doc 16/17. **Dependencies:** `PKG-04`, `TRACK-02`, approved UX cycles. **State:** substantial Algorithms semantics/content.
- **Scope:** free and Premium nodes, required modes, implementation-planning learning objective, goals/progress/review/simulation. **Non-goals:** executable judge claim. **Obligations:** no Algorithms alias/copy; retain stable evidence IDs. **Acceptance:** canonical mode/scoring/reinsert tests, package/version/device proof, copy negative tests. **Evidence:** release/device pack. **Checkpoint:** none beyond package sandbox. **Unlocks:** broader Coding content.

#### PROOF-03 — Backend System Design family proof — `BLOCKED`

- **Objective:** create the first Design Interview runtime/content vertical. **Owners:** `LEARNING-PRODUCTS-001`, docs 07/17. **Dependencies:** `TRACK-02`, `PKG-04`, shared runner UX approval. **State:** family/runtime/content absent.
- **Scope:** canonical mental-model taxonomy, complete free node, authored Premium packages, family runtime adapter and complete loop. **Non-goals:** shallow placeholder bank. **Obligations:** extend shared kernel rather than fork lifecycle/persistence. **Acceptance:** content quality/provenance, package/review/simulation/device proof and no backend-only assumptions in generic family contract. **Evidence:** representative release. **Unlocks:** `PROOF-05` and Frontend Design.

#### PROOF-04 — AWS SAA second Certification proof — `BLOCKED`

- **Objective:** prove Certification runtime is provider-neutral before copying. **Owners:** doc 15, AWS brief. **Dependencies:** `PROOF-01`. **State:** only GCP production content.
- **Scope:** reviewed free/Premium vertical using unchanged shared Certification runtime. **Non-goals:** runtime fork or provider affiliation implication. **Obligations:** delete provider-hardcoded branches exposed by proof. **Acceptance:** no new lifecycle/persistence owner; content/provenance/package/device gates pass. **Evidence:** immutable release pack. **Checkpoint:** source license/freshness verification. **Unlocks:** remaining certifications.

#### PROOF-05 — Object-Oriented Design second Design proof — `BLOCKED`

- **Objective:** prove Design Interview is not backend-system-design-hardcoded. **Owners:** OOD brief, docs 07/17. **Dependencies:** `PROOF-03`. **Scope:** complete free/Premium OOD loop through shared Design runtime. **Non-goals:** duplicate family.
- **Obligations:** remove backend-specific generic branches; no placeholder topics. **Acceptance:** independent taxonomy/feedback/simulation, package/provenance/device gates and unchanged shared kernel ownership. **Evidence:** immutable release pack. **Unlocks:** remaining Design track.

The remaining population work is deliberately split by track. Each task below owns exactly one complete free vertical, full core loop, reviewed immutable package set and production registry admission. All share owners docs 07/15/17 and their canonical brief; non-goals are fixed filler counts, batch placeholders, empty cards and family-runtime forks. Each must delete any provider/track hard-coding it exposes, pass coverage/editorial/technical/provenance/cross-repo/device gates, verify source freshness/licensing where applicable, and emit one separately reviewable release commit.

#### TRACK-03 — Azure Administrator AZ-104 production track — `BLOCKED`

- **Objective/state/scope:** add the absent Azure Certification product through the proven Certification runtime. **Dependencies:** `PROOF-02`, `PROOF-04`, `PROOF-05`, `PKG-04`, applicable approved UX cycles. **Paths:** Azure brief/source/config/packages/app admission/tests. **Acceptance/evidence:** common per-track contract above plus no Google/AWS-specific branch. **Checkpoint:** Microsoft source/licensing freshness. **Unlocks:** catalogue release gate contribution.

#### TRACK-04 — Azure AI Fundamentals AI-901 production track — `BLOCKED`

- **Objective/state/scope:** add the absent AI-901 Certification product through the same family owner. **Dependencies:** `PROOF-02`, `PROOF-04`, `PROOF-05`, `PKG-04`, applicable approved UX cycles. **Paths:** AI-901 brief/source/config/packages/app admission/tests. **Acceptance/evidence:** common per-track contract plus AI terminology/provenance review without vendor affiliation claim. **Checkpoint:** Microsoft source/licensing freshness. **Unlocks:** catalogue release gate contribution.

#### TRACK-05 — Terraform Associate production track — `BLOCKED`

- **Objective/state/scope:** add the absent Terraform Certification product without a new lifecycle. **Dependencies:** `PROOF-02`, `PROOF-04`, `PROOF-05`, `PKG-04`, applicable approved UX cycles. **Paths:** Terraform brief/source/config/packages/app admission/tests. **Acceptance/evidence:** common per-track contract plus provider-neutral Certification proof. **Checkpoint:** HashiCorp source/licensing freshness. **Unlocks:** catalogue release gate contribution.

#### TRACK-06 — Kubernetes and Cloud Native Associate production track — `BLOCKED`

- **Objective/state/scope:** add the absent KCNA Certification product through canonical family semantics. **Dependencies:** `PROOF-02`, `PROOF-04`, `PROOF-05`, `PKG-04`, applicable approved UX cycles. **Paths:** KCNA brief/source/config/packages/app admission/tests. **Acceptance/evidence:** common per-track contract plus CNCF terminology/provenance review. **Checkpoint:** CNCF source/licensing freshness. **Unlocks:** catalogue release gate contribution.

#### TRACK-07 — Frontend System Design production track — `BLOCKED`

- **Objective/state/scope:** add the absent Frontend System Design product through the proven non-backend-hardcoded Design Interview runtime. **Dependencies:** `PROOF-02`, `PROOF-04`, `PROOF-05`, `PKG-04`, applicable approved UX cycles. **Paths:** frontend-design brief/source/config/packages/app admission/tests. **Acceptance/evidence:** common per-track contract plus distinct frontend architecture objectives and no backend fallback. **Checkpoint:** source/licensing review. **Unlocks:** complete ten-track catalogue release gate.

### Stage UX — vertical design-to-device cycles

Each `D` task creates a complete state inventory and actual Figma references, ending at owner `APPROVED`; it does not implement significant UI. Each matching `I` task requires `DS-03`, the `D` approval and listed runtime, implements production components, Storybook canonical states, interaction/accessibility tests, screenshot comparison, iOS/Android phone verification, and deletes the replaced route/components/tests. This is the mandatory cycle, not a generic polish pass.

The following fields apply to every `UX-*D` and `UX-*I` card in addition to its stated deltas: **confirmed state** is the audited old production route/components plus absent target states in the impact map; **paths** are that vertical's existing feature/navigation tests and approved Figma/production/Storybook owners; **non-goals** exclude unrelated runtime, provider and content work; **canonical requirements** are the named narrative owners plus `PRODUCT-SURFACES-GOALS-001`, `BRAND-DESIGN-AUTHORITY-001` and the vertical-specific requirement; **obligations** include keep compatible domain behavior, move one owner, rewrite approved presentation and delete every replaced route/component/test/flow with reference proof; **automated verification** includes typecheck, focused interaction/state/accessibility tests, Storybook release exclusion and applicable architecture/privacy/content gates; **manual evidence** includes Figma comparison, 200% text, screen reader, Light/Dark/System, reduced motion/haptics and both phone platforms; **security/privacy/content** must be explicitly assessed in the completion report even when no impact exists; **output** is a pushed vertical evidence packet or existing report update, never another plan; **unlocks** are the named successor and applicable release gates.

#### UX-01D — First value, track, goal and guest design — `BLOCKED`
- **Objective/state:** first launch, loading/error, track choice without family, complete free node, goal, guest continuity, offline. **Owners:** docs 01/03/05. **Dependencies:** `B-05`, `GUEST-01`, `TRACK-02`, `GOAL-01`. **Paths:** entry/selection/onboarding Figma only. **Non-goals:** code/account gate. **Acceptance/evidence:** all states and 200% text/reduced motion approved by owner. **Checkpoint:** owner visual approval. **Unlocks:** `UX-01I`.

#### UX-01I — First value production vertical — `BLOCKED`
- **Objective/scope:** implement approved entry through first completed free learning value. **Dependencies:** `UX-01D`, `DS-03`, `PKG-03`, `GUEST-01`, `GOAL-01`. **State:** current selection is family-visible and full-bank-gated. **Paths:** bootstrap/selection/goals/runner shell. **Delete:** old category presentation/full-bank entry and stale flows. **Acceptance:** offline/restart/free-only/no-account, Storybook states, accessibility/screenshots/two-phone OS smoke. **Security/content:** no Premium filler. **Output:** vertical evidence. **Unlocks:** acquisition core loop.

#### UX-02D — Today design — `BLOCKED`
- **Objective/state:** recommendation priority, manual-choice precedence, resume local session, due review, goal cadence, offline/error/empty. **Owners:** product surfaces and docs 03/05. **Dependencies:** `B-05`, `GOAL-01`, `SYNC-01`. **Paths:** Today Figma. **Non-goals:** Home compatibility. **Acceptance:** owner approval and job non-overlap with Practice/Progress. **Unlocks:** `UX-02I`.

#### UX-02I — Today production vertical — `BLOCKED`
- **Scope:** replace Home with Today using approved components and canonical recommendation inputs. **Dependencies:** `UX-02D`, `DS-03`, `SYNC-02`. **State:** Home route exists. **Delete:** HOME route/name/copy/tests and duplicate projections. **Acceptance:** manual choice wins, device resume stays local, guest/offline/account states, Storybook/accessibility/screenshots/iOS+Android. **Implications:** no remote draft. **Output:** route migration proof. **Unlocks:** canonical shell.

#### UX-03D — Practice, roadmap, downloads and entitlement design — `BLOCKED`
- **State inventory:** discovery, track roadmap, setup, free/Premium, downloading/validating/ready/stale/incompatible/no-space/offline, locked/downgraded. **Owners:** docs 03/05/08. **Dependencies:** `B-05`, `TRACK-02`, `ENT-02`, `PKG-04`. **Non-goals:** paywall details. **Acceptance:** owner approval, families invisible. **Unlocks:** `UX-03I`.

#### UX-03I — Practice/package production vertical — `BLOCKED`
- **Scope:** approved discovery/setup/download/entitlement states. **Dependencies:** `UX-03D`, `DS-03`, `PKG-04`, `ENT-02`. **Delete:** full-bank assumptions, categoryLabel, silent package fallback and obsolete flows. **Acceptance:** free/Premium filtering, atomic package states, Storybook/accessibility/screenshots/two-platform devices. **Security/content:** backend auth only. **Output:** package UX evidence. **Unlocks:** remote content usability.

#### UX-04D — Ordinary runner and feedback design — `BLOCKED`
- **State inventory:** prompt, selection/input, submit, immediate/deferred feedback, saving, frozen, error/recovery, reduced motion/haptics, large text. **Owners:** docs 05/16/17. **Dependencies:** `B-05`, `PKG-04`. **Acceptance:** owner approval across Certification/Coding/Design examples; no executable-code claim. **Unlocks:** `UX-04I`.

#### UX-04I — Ordinary runner production vertical — `BLOCKED`
- **Scope:** migrate production runner/feedback to approved canonical components without forking family lifecycle. **Dependencies:** `UX-04D`, `DS-03`, `PKG-04`. **Delete:** superseded controls/styles/screenshot flows after coverage. **Acceptance:** scoring/journal/recovery unchanged, exact package pin, Storybook state matrix, screen reader/200%/motion/haptics, iOS+Android proof. **Output:** cross-family evidence. **Unlocks:** representative proofs.

#### UX-05D — Simulation, finalization and review design — `BLOCKED`
- **State inventory:** timed/untimed, save/jump/background, frozen/finalizing/recovery, summary, review, unavailable exact package, next action. **Owners:** docs 05/17. **Dependencies:** `B-05`, `SESSION-01`, `PKG-04`. **Acceptance:** owner approval; device-owned boundary visible but not alarming. **Unlocks:** `UX-05I`.

#### UX-05I — Simulation/review production vertical — `BLOCKED`
- **Scope:** approved shells/states over existing tested lifecycle. **Dependencies:** `UX-05D`, `DS-03`, `PKG-04`. **Keep:** timer/journal/finalization semantics. **Delete:** old shells, account-resume copy and superseded Maestro flows. **Acceptance:** lifecycle/concurrency/relaunch/package-resolution tests, accessibility/motion/haptics, screenshots and iOS/Android background/force-close evidence. **Output:** simulation gate pack. **Unlocks:** track proofs.

#### UX-06D — Progress and nested Activity design — `BLOCKED`
- **State inventory:** track Progress dimensions, recent Activity, filters/pagination, exact history/result, empty/offline/loading/error, multiple packages/tracks. **Owners:** product surfaces, docs 03/04/05. **Dependencies:** `B-05`, `SYNC-01`, `GOAL-01`. **Acceptance:** owner approval; Activity is nested, not fifth tab. **Unlocks:** `UX-06I`.

#### UX-06I — Progress/Activity production vertical — `BLOCKED`
- **Scope:** build distinct Progress and nested Activity using compact projections/on-demand history. **Dependencies:** `UX-06D`, `DS-03`, `SYNC-02`. **Delete:** embedded summary pretending to be Activity and duplicated Home analytics owner. **Acceptance:** pagination/cursor/offline/exact-history, Storybook/accessibility/screenshots/two platforms; four tabs only. **Output:** navigation and data proof. **Unlocks:** complete shell.

#### UX-07D — Settings, consent and reminders design — `BLOCKED`
- **State inventory:** Light/Dark/System, goals/reminders, analytics consent, support/legal, account/no-account, package storage, destructive states; no Language route. **Owners:** docs 03/05/09. **Dependencies:** `B-05`, `GOAL-01`, `OBS-01`. **Acceptance:** owner approval and truthful external destinations. **Unlocks:** `UX-07I`.

#### UX-07I — Settings production vertical — `BLOCKED`
- **Scope:** approved settings, theme, consent/reminders/support/legal entry. **Dependencies:** `UX-07D`, `DS-03`, `OBS-01`. **Delete:** Language route/screen, launch Polish presentation, Light-only/local-only claims and dead tests. **Acceptance:** four-tab navigation, consent fail-closed, 200%/screen reader/theme/device screenshots. **Output:** dead-route scan. **Unlocks:** release settings.

#### UX-08D — Account, security and adoption design — `BLOCKED`
- **State inventory:** register/verify/sign-in/reset, Apple/Google/linking collisions, reauth, recovery codes, Terms, sign-out, adoption preview/choices/progress/recovery. **Owners:** docs 03/05/09. **Dependencies:** `B-05`, `ID-05`, `ADOPT-01`. **Acceptance:** owner approval; first value remains outside account. **Unlocks:** `UX-08I`.

#### UX-08I — Account/security/adoption production vertical — `BLOCKED`
- **Scope:** connect approved UI to `ID-*` and `ADOPT-02`. **Dependencies:** `UX-08D`, `DS-03`, `ID-05`, `ADOPT-02`. **Delete:** any account-gated bootstrap, auto-merge/hidden-discard paths, obsolete account-wide-session cases. **Acceptance:** all auth/provider/recovery/adoption/restart/accessibility states, Storybook, screenshots and physical provider flow evidence where configured. **Checkpoint:** `X-05`. **Output:** security/device pack. **Unlocks:** commercial continuity.

#### UX-09D — Premium/paywall/purchase/restore design — `BLOCKED`
- **State inventory:** value-first offer, monthly/annual, verified-account requirement, purchasing/pending/cancel/error, restore conflict, cross-platform, offline grace, downgrade, Manage subscription, Free alternative. **Owners:** docs 01/03/05/09. **Dependencies:** `B-05`, `ENT-01`. **Rationale:** the stable backend state contract is sufficient for design before coordinator implementation. **Acceptance:** owner approval; no slots/tiers. **Unlocks:** `UX-09I` and later coordinator presentation integration.

#### UX-09I — Premium production vertical — `BLOCKED`
- **Scope:** approved commercial UI over backend-authoritative coordinator. **Dependencies:** `UX-09D`, `DS-03`, `ENT-03`, `PKG-04`. **Delete:** local entitlement/fake success paths. **Acceptance:** guest prohibition, restore/conflict/offline/downgrade/started-session, Storybook/accessibility/screenshots/device sandbox flows. **Checkpoint:** `X-06`, production `X-10`. **Output:** entitlement gate pack. **Unlocks:** paid release.

#### UX-10D — Sync/offline/package/report states design — `BLOCKED`
- **State inventory:** queued/syncing/conflict/retry/revoked/deleted, package download validation/recovery, report compose/queued/sent/error with explicit optional contact/account. **Owners:** docs 03/05/08/09. **Dependencies:** `B-05`, `SYNC-01`, `PKG-01`. **Rationale:** canonical report states are sufficient for design before report implementation. **Acceptance:** owner approval; no background-sync promise or automatic sensitive attachments. **Unlocks:** `UX-10I` and later report presentation integration.

#### UX-10I — Sync/offline/package/report production states — `BLOCKED`
- **Scope:** implement approved cross-cutting states in their owning verticals. **Dependencies:** `UX-10D`, `DS-03`, runtime dependencies. **Delete:** silent retries/fallbacks and duplicate network state. **Acceptance:** fault/restart/consent/redaction, Storybook/accessibility/screenshots/iOS+Android offline transitions. **Output:** failure-state evidence. **Unlocks:** operational release gate.

#### UX-11D — Account deletion design — `BLOCKED`
- **State inventory:** entitlement display, Manage subscription, immediate deletion, supported scheduled case, public possession flow, progress/failure/deleted-device state and truthful refund/cancellation copy. **Owners:** docs 03/05/09. **Dependencies:** `B-05`, `DEL-02`, `ENT-01`. **Rationale:** stable deletion/entitlement contracts are sufficient for design before lifecycle coordinator implementation. **Acceptance:** owner approval. **Unlocks:** `UX-11I` and later lifecycle presentation integration.

#### UX-11I — Account deletion production vertical — `BLOCKED`
- **Scope:** approved mobile deletion over `DEL-03`; public presentation completed with `UX-12I`. **Dependencies:** `UX-11D`, `DS-03`, `DEL-03`. **Delete:** local-only Your Data copy and any cancellation promise. **Acceptance:** crash/offline/multi-device/active-entitlement/accessibility/device evidence and no resurrection. **Checkpoint:** RevenueCat sandbox. **Output:** privacy deletion pack. **Unlocks:** privacy release gate.

#### UX-12D — Public/auth/legal/support/store design — `BLOCKED`
- **State inventory:** landing, Privacy, Terms, support, deletion, auth action results, affiliation-safe track/brand presentation, store icon/screens/feature graphics. **Owners:** docs 05/06/09. **Dependencies:** `B-05`, `DEL-02`, public-origin contract. **Acceptance:** owner approval in Light/Dark/responsive/accessibility; truthful dev destination until promotion. **Unlocks:** `UX-12I`.

#### UX-12I — Canonical public artifact and transactional surfaces — `BLOCKED`
- **Scope:** implement one maintainable web artifact and approved assets; action/legal/support/deletion routes, AASA/assetlinks inputs. **Dependencies:** `UX-12D`, `DEL-02`, `ID-02`, `DS-01`. **Delete:** duplicate/undeployed placeholder web paths and stale links. **Acceptance:** link/accessibility/privacy/security/header/non-enumeration tests and visual comparison. **Checkpoint:** `X-03`, store assets later. **Output:** deployable artifact. **Unlocks:** `REL-01`.

### Stage R — release closure

#### REL-01 — Public domain, links and transactional promotion — `BLOCKED`

- **Objective:** promote verified public/auth/legal/support/deletion surfaces to professional origins. **Owners:** environment/public links, docs 09. **Dependencies:** `UX-12I`, `OPS-01`. **Scope:** authorized DNS/domain/sender/hosting/app-link association mutation and verification. **Non-goals:** store submission.
- **Obligations:** no default Firebase domain in production; delete stale sandbox links after cutover. **Acceptance:** TLS/DNS/sender/auth actions/non-enumerating deletion/AASA/assetlinks verified from production-like clients. **Evidence:** external change record. **Checkpoint:** `X-03`. **Unlocks:** store metadata and production auth.

#### REL-02A — Accessibility, motion and haptics closure — `BLOCKED`

- **Objective:** close the interaction-accessibility matrix after every production vertical exists. **Owners:** docs 05/12/13 and `PLATFORM-RELEASE-001`. **Dependencies:** all `UX-*I`, representative proofs, `PLAT-01`. **Scope:** screen reader/focus/order/labels/touch targets, 200% text, reduced motion and semantic haptics on the target phone matrix.
- **Non-goals:** performance tuning, visual taste review or generic polish. **Obligations:** fix canonical primitives/verticals directly and delete obsolete accessibility exceptions/tests. **Acceptance:** automated accessibility/large-text/motion tests plus real iOS/Android phone evidence, with no Critical/High accessibility defect. **Evidence:** bounded accessibility matrix. **Checkpoint:** physical phones. **Unlocks:** `REL-03` contribution.

#### REL-02B — Layout stability and performance-budget closure — `BLOCKED`

- **Objective:** meet measured startup, interaction, memory, package and layout-stability budgets. **Owners:** docs 11/12/13 and `PLATFORM-RELEASE-001`. **Dependencies:** all `UX-*I`, `PKG-04`, `PLAT-01`. **Scope:** cold/warm launch, Today/Practice/runner/navigation, downloads/activation, loading/flicker/layout shift and representative long sessions on both phone platforms.
- **Non-goals:** subjective brand approval or unrelated refactor. **Obligations:** fix the canonical bottleneck; delete profiling hooks/artifacts from release. **Acceptance:** checked-in budgets and repeatable measurement protocol pass on representative low/target devices, with explicit variance and no hidden fallback. **Evidence:** bounded performance report. **Checkpoint:** physical phones. **Unlocks:** `REL-03` contribution.

#### REL-02C — Whole-product usability and consistency audit — `BLOCKED`

- **Objective:** verify first-use comprehension and cross-surface brand/content/provider truth after implementation. **Owners:** docs 01/05/06/07/12. **Dependencies:** all `UX-*I`, all representative proofs, `REL-02A`, `REL-02B`. **Scope:** a small practical first-use beta review, cross-surface copy/state consistency, track/family visibility, affiliation claims, approved asset use and unresolved visual drift.
- **Non-goals:** vague polish or changing canonical behavior. **Obligations:** log concrete defects against owning vertical and delete superseded screenshots/flows after correction. **Acceptance:** every finding has evidence/severity/owner; all Critical/High fixed or an explicit launch decision exists; owner confirms implemented visual consistency. **Evidence:** bounded closure audit, not a second plan. **Checkpoint:** Product Owner visual review and practical test participants. **Unlocks:** `REL-03`.

#### REL-03 — Figma handoff and CODE_CANONICAL — `BLOCKED`

- **Objective:** move operational visual authority entirely into the repository. **Owners:** `BRAND-DESIGN-AUTHORITY-001`, docs 05/06. **Dependencies:** `REL-02A`, `REL-02B`, `REL-02C`, `DS-01..03`, all approved/implemented verticals. **Scope:** final vectors/exports/tokens/components/states/baselines/licenses/source records, local Figma export where available, deprecation history.
- **Non-goals:** continuing paid-Figma dependency. **Obligations:** close/delete superseded active references. **Acceptance:** visual parity verified; Storybook complete and release-excluded; owner approves final handoff; registry reaches `CODE_CANONICAL`. **Checkpoint:** `X-09D`. **Evidence:** handoff packet. **Unlocks:** final store assets and freeze.

#### REL-04 — Store records, products, declarations and asset closure — `BLOCKED`

- **Objective:** create truthful production store/commercial records before signing candidates. **Owners:** platform/commercial/brand/privacy docs. **Dependencies:** `REL-01`, `REL-02A`, `REL-02B`, `REL-02C`, `REL-03`, `OPS-02`, all ten track admissions. **Scope:** App Store/Play app records, privacy/data safety, metadata/assets and RevenueCat production offering/monthly/annual products.
- **Non-goals:** signing, build upload or public release. **Obligations:** no slots/tiers, stale screenshots, placeholder URLs or affiliation claims. **Acceptance:** identifiers/prices/products map to one Premium entitlement; declarations match closed data inventory; approved assets pass platform checks. **Evidence:** dated console export/review packet. **Checkpoint:** `X-10`. **Unlocks:** `REL-05`, `REL-06`.

#### REL-05 — iOS signed candidate and TestFlight evidence — `BLOCKED`

- **Objective:** produce one clean signed iPhone-only candidate. **Owners:** `PLATFORM-RELEASE-001`, docs 12. **Dependencies:** `REL-04`. **Scope:** distribution identity, signing, archive/export, TestFlight upload and signed iPhone smoke preparation. **Non-goals:** Android or release decision.
- **Obligations:** Storybook/dev secrets/iPad declarations/obsolete assets and permissions absent. **Acceptance:** iOS 16.4+ matrix, universal links, purchases, privacy manifest and reproducible artifact hash verified; TestFlight install boots. **Evidence:** archive/build/store logs. **Checkpoint:** `X-11`. **Unlocks:** `REL-07`.

#### REL-06 — Android signed candidate and Play internal evidence — `BLOCKED`

- **Objective:** produce one clean signed Android candidate. **Owners:** `PLATFORM-RELEASE-001`, docs 12. **Dependencies:** `REL-04`. **Scope:** upload key/Play App Signing, AAB, internal track and signed Android smoke preparation. **Non-goals:** iOS or release decision.
- **Obligations:** Storybook/dev secrets/obsolete permissions/assets absent. **Acceptance:** API 28 minimum/36 target, app links, billing/data safety and reproducible artifact hash verified; internal-track install boots. **Evidence:** bundle/build/store logs. **Checkpoint:** `X-11`. **Unlocks:** `REL-07`.

#### REL-07 — Signed physical-device smoke and GO/NO-GO — `BLOCKED`

- **Objective:** make the final release decision from production-shaped artifacts and complete evidence. **Owners:** docs 12/13 and this plan for status. **Dependencies:** `REL-05`, `REL-06`; every applicable gate verified. **Scope:** signed iPhone and Android phone journeys: guest/free, account/adoption, sync/device sessions, purchase/restore/Premium packages, offline grace, reports, deletion, links, analytics consent and all ten admitted tracks.
- **Non-goals:** waiver by documentation or compile success. **Obligations:** no Critical/High risk without explicit Product Owner launch decision. **Acceptance:** clean signed smoke, provider/store/public checks, restore drill evidence, complete handoff and release checklist yield explicit GO or NO-GO. **Checkpoint:** `X-12` release decision/submission. **Output:** final release report. **Unlocks:** authorized submission/release only.

## 6. External and owner checkpoints

These are gates, not implementation tasks. Local work listed in “May continue” remains unblocked.

| ID | Checkpoint | Authority/evidence required | May continue before it |
| --- | --- | --- | --- |
| X-01 | Verify current Firebase/GCP/Cloud Run/IAM/resource state read-only | authorized credentials and dated export | all local code/design/content |
| X-02 | Deploy/mutate Cloud Run, IAM, Artifact Registry or service accounts | explicit owner authorization and reviewed diff/rollback | local server/container/tests |
| X-03 | Domain, DNS, sender, hosting, links and public promotion | owner controls/authorization; verified professional values | local web/action/link artifacts |
| X-04 | Register/configure Firebase mobile apps and email/password/action settings | provider-console access; no product decision reopening | local adapters/emulators/tests |
| X-05 | Apple/Google provider console setup | owner credentials, platform identifiers and redirect configuration | email/password/recovery/backend work |
| X-06 | RevenueCat sandbox/apps/products/webhooks | owner/store credentials; opaque account identity mapping | entitlement interfaces/server tests |
| X-07 | Cloud Storage bucket/object policy and Firestore manifest deployment | reviewed least-privilege plan and owner authorization | local package bytes/server adapters |
| X-08 | Enable seven-day PITR and run sanitized restore drill | fresh explicit mutation/drill authorization | runbook/tombstone tests |
| X-09A/B/C | owner reviews 3→2, 2→1 and final actual visual system | Product Owner decision on real Figma work | all nonvisual lanes |
| X-09D | final Figma handoff approval | implemented parity and complete repo assets/evidence | release prep except CODE_CANONICAL claim |
| X-10 | App Store/Play/RevenueCat production records and subscriptions | owner/store authorization and final identifiers/prices | sandbox/local commercial work |
| X-11 | signing identities, TestFlight and Play internal distribution | protected secrets and owner authorization | unsigned/device/debug work |
| X-12 | store submission and release GO | complete gate packet and Product Owner decision | nothing is auto-submitted |

## 7. Gate framework

Extend existing checks; do not create parallel gate owners.

| Gate | Required proof |
| --- | --- |
| Contract/documentation | canonical requirement/owner linked; contract gate; docs links; no target behavior invented; plan remains sole sequencing source |
| Architecture/dead paths | one owner per responsibility; dependency direction; imports/routes/scripts/tests/docs scan; replacement deletes aliases/fallbacks/obsolete paths |
| Persistence/sync | journal-first, device session, idempotent operations, cursors/revisions, restart/failure/concurrency and no silent loss |
| Security/privacy/consent | identity/recovery/revocation, approved clients, closed schemas, redaction, consent, deletion/subscription truth and tombstone restore safety |
| Entitlement/package | store/RevenueCat/backend authority, seven-day grace, signed URL, immutable checksum/schema/semantic validation, activation/version pinning and Free/Premium filtering |
| Learning/content | family semantics, authored feedback/provenance, complete free vertical, no placeholders/filler, representative proofs, reproducible cross-repo release |
| Brand/Figma | actual owner-approved work at required checkpoint; no Codex self-approval; one Patternly brand and complete visual states |
| Storybook/code | production components, typed fixtures, risk-based states, visual/accessibility proof, Storybook absent from release, repository owns tokens/assets |
| Platform/device/performance | exact matrix, themes, 200% text/screen reader, reduced motion/haptics, measured budgets, real iOS/Android phones and signed evidence where required |
| Public/store/release | legal/support/deletion/auth surfaces, domain/sender/links, declarations/assets/products/signing/distribution, signed smoke and explicit GO/NO-GO |

Product release-ready exit requires every applicable gate above, all ten admitted tracks with complete free/core loops, verified production architecture and operations, no unresolved Critical/High risk without explicit launch decision, final `CODE_CANONICAL` handoff, and signed physical-device evidence on both platforms.

## 8. Current and next executable task

`PLAT-01` is `VERIFIED` at application `cc4a8dd` and its two Product Owner decisions are durable in `PO-056`/`PO-057`: unsigned device smoke is `PASS — PRODUCT_OWNER_ACCEPTED_ENVIRONMENT_EXCEPTION`, and the exact RN migration is `PASS — PRODUCT_OWNER_APPROVED_DESIGN_NEUTRAL_PLATFORM_MIGRATION`. `ARCH-01` is `VERIFIED` at application `59cefd9`. `GUEST-01` is partial after the pushed installation-identity checkpoint `3690df756daf34e1fa0b26f676c9785fa2180997`; its remaining complete-Free-node requirement belongs to the package path and is not hidden or declared complete.

`TRACK-01` is `VERIFIED` at application `afe8f8e`. `PO-059` is durable at application `9fc20e5`: content `955159c` supplies the two closed Free-node package records and app byte/provenance verification is pushed at `9fc20e5`. `PKG-01` is `VERIFIED`; `TRACK-02` remains package-evidence verified while shipping-catalogue admission awaits the existing guest/runtime/package-activation gates. B-01 is `VERIFIED` at application `b6b969b`: the tracked audit confirms the asset, Storybook and release-boundary inventory, and `X-09` is satisfied by authenticated Figma board `10:2` plus its Product Owner approval read-back on 2026-08-10. B-02 is `VERIFIED` at application `051778d` by its tracked evidence-only collision audit. B-03 has three editable, non-approved Figma directions at application `daa95be` and is correctly waiting for `X-09A`, the Product Owner's 3→2 choice. ID-01 is blocked on an unresolved security authority and leaves no partial server endpoint. OPS-01 is partially evidenced at application `4b595f6`; its image/runtime/provider proof awaits the existing external gates. `PKG-04A` is `VERIFIED` at application `02c47aa`: it completes the exact-package lifecycle cutover under PO-059 and the PO-060 Figma-backed interaction reference, with no whole-track runtime fallback. Content `c5ef483` retains both historical immutable Free-node package artifacts, but its current package/inventory records contain only Coding Interview and its curriculum audit classifies GCP as `planned_coverage_only_not_admitted`; the application still exposes the historical GCP Free runtime. This is a material content-admission contradiction: retaining GCP conflicts with the current content classification, while removing it changes the Product Owner-approved offering. Do not sync, rewrite the exact lock, or change the registry until an owner resolves it. No task is blocked by the accepted PLAT-01 device-smoke exception.

## 9. Old-to-new mapping and plan maintenance

| Historical work/status | Current treatment |
| --- | --- |
| old Task 2/RC visual shell and device packets | evidence only; reassess in `B-01`, matching `UX-*`, `REL-02A/B/C` and `REL-04`; never current approval |
| old Task 3 account/provider foundation | compatible security/HTTP/Firestore parts retained; session/sync semantics migrate in `SESSION-01`, `SYNC-*`, `ADOPT-*`, `ID-*` |
| old Task 5 learning runtimes | kernel and Certification retained; Algorithms moves atomically in `TRACK-01`; final device coverage belongs to `UX-04/05` and representative proofs |
| release-candidate closure/readiness audits | historical evidence only; current release exit is `REL-07` |
| content Algorithms planning ledger | durable rationale moves and obsolete generated ledger is deleted in `TRACK-01`; this file alone sequences work |
| former launch repair diaries and task numbers | Git history/report links only; none are active IDs |

Maintenance rules:

1. Start a task by changing exactly that task from `READY` to `ACTIVE` and recording exact repository SHAs; do not activate a dependency-blocked task.
2. A completion update cites pushed commit(s), applicable gate results, manual/external evidence, deletion scan and honest blockers. Raw logs and repair diaries stay out of this file.
3. If acceptance is incomplete, use `PARTIAL` or `BLOCKED`; never infer completion from a report, Figma frame, Storybook render, compile result or partial test.
4. After `VERIFIED`, update dependencies and name exactly one next `READY` task. Independent lanes may be selected when their dependencies are met, but only one current task is active.
5. A materially changed task receives a new ID; historical IDs are not repurposed. Superseded details remain in Git history, not an archive folder or second ledger.
6. Product changes go through the canonical contract/PO process, not this plan. External mutations require their checkpoint even if older reports contain authorization language.
