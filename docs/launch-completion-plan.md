# Patternly — Launch Completion Plan

**Document role:** replacement candidate for `docs/launch-completion-plan.md`
**Authority state:** this file becomes sequencing authority only after it is committed and pushed to application `main`; until then the pushed repository document remains authoritative.
**Audit date:** 2026-08-17
**Target:** commercial launch readiness for the exact eight-track launch catalogue defined below.
**Execution model:** controller → bounded worker → independent QA; all agents use **Luna max reasoning**, without exceptions or silent downgrade.

---

## 1. Canonical source-of-truth rule

Only pushed canonical branches count as implementation or status evidence:

| Repository | Canonical branch | Audited HEAD | Exact-sha CI evidence |
| --- | --- | --- | --- |
| application | `main` | `3674c68` | QA run `31988253547` — success |
| content/publishing | `master` | `00c97e8ef0d1710e9b8c51e6d5b4740e50cecd32` | Content publishing run `31985200947` — success |

A local worktree, unpushed commit, worker report, screenshot, Figma comment, spreadsheet, chat statement, or stale evidence pack never changes task status. A task becomes `VERIFIED` only after:

1. the implementation is committed and pushed to the canonical branch;
2. applicable CI passes against the exact pushed SHA;
3. required device, provider, content, visual, or human evidence is linked;
4. obsolete paths and hidden fallbacks are removed;
5. this plan is updated on the canonical branch and names the next executable task.

If either canonical branch advances after this audit, the controller must re-resolve both HEADs and reconcile changed facts before editing.

### Authority precedence

1. Pushed Product Owner decisions and canonical product contract in application `main`.
2. This plan after it is pushed as `docs/launch-completion-plan.md`.
3. Pushed application and server implementation.
4. Pushed content source, schemas, validators, evidence, and immutable releases in content `master`.
5. Product Owner-designated final Figma file/nodes for presentation only.
6. CI, device, provider, and store evidence tied to exact SHAs/builds.
7. Historical reports and superseded designs as evidence only.

The final Figma work is an implementation authority, not permission for Codex to design, reinterpret, simplify, or self-approve missing states. A missing Figma state blocks only the affected visual slice; it does not block unrelated architecture, data, content, or infrastructure work.

---

## 2. Fixed Product Owner decisions

The launch catalogue contains exactly these eight learner-visible tracks:

1. `coding-interview-dsa-problem-solving` — Coding Interview / Algorithms
2. `google-cloud-associate-cloud-engineer` — GCP ACE
3. `aws-certified-solutions-architect-associate` — AWS SAA
4. `microsoft-azure-ai-fundamentals-ai-901` — Azure AI Fundamentals AI-901
5. `microsoft-azure-administrator-associate-az-104` — Azure Administrator AZ-104
6. `backend-system-design-interview` — Backend System Design
7. `frontend-system-design-interview` — Frontend System Design
8. `object-oriented-design-interview` — Object-Oriented Design

`hashicorp-terraform-associate-004` and `kubernetes-cloud-native-associate-kcna` may remain as post-launch briefs or roadmap material, but they are not launch tracks, may not appear as production cards, and may not be required by launch gates.

Additional fixed decisions:

- Internal families are implementation details. Users see tracks, not `coding_interview`, `certification`, or `design_interview` labels.
- The first complete node of every admitted track is Free. Premium is one cross-platform entitlement, not slots, tiers, or per-track purchases.
- All eight launch banks require explicit owner-authorized editorial approval. The owner may record that approval directly or authorize an agent to record it against exact source and item manifests; no approval may be inferred or simulated.
- Design is already prepared in Figma. Codex implements the Product Owner-designated final references; it does not run a new brand or visual-direction exercise.
- All agent and subagent invocations are capped at and must use Luna max reasoning. No lower model is allowed for workers, QA, research, content, design implementation, or release verification.
- Pushed canonical branches are the only truth. Progress that is not pushed does not exist for status purposes.
- The app is brought to full launch readiness, not a placeholder MVP. No `Coming soon`, empty track cards, hidden feature flags, fake success, compatibility aliases, silent fallback, or temporary duplicate architecture.

---

## 3. Audit verdict

**Current verdict: NO-GO.** The repositories contain a strong learning kernel, durable local storage, exact content identity work, a usable guest/free-package foundation, content authoring infrastructure, and green exact-SHA CI. They do not contain a release-ready commercial product.

The green CI proves the current contracts, not the target launch catalogue:

- Application CI and the release lock now contain three artifacts: Coding Interview, historical GCP, and the newly pinned AZ-104 Free-node package; the lock is still intentionally short of the eight-track launch catalogue.
- The production track registry now exposes Coding Interview, GCP, and AZ-104; the remaining five tracks are not registered.
- The content workflow validates the eight-track readiness report and all current authoring validators; the latest pushed report has a local exact-SHA gate of 142/142 and records all eight technical validators as passed. AI-901 now also has a verified immutable release and bundled Free-node package, but remains explicitly not admitted for application runtime or publishing.
- The content release gate still treats Coding Interview as the sole release candidate.
- AZ-104 retains its pushed authoring registration, canonical source bank, readiness row, passing authoring validation, owner-authorized approval record, and historical immutable release `patternly-az104-0001`; AI-901 now has current release `patternly-ai901-0001`, a 144-item Free-node package, and the same explicit publishing/runtime admission boundary.
- All eight launch banks have owner-authorized approval records bound to exact source and item manifests; none is admitted for publishing or runtime.
- RevenueCat, production package delivery, complete account/auth/sync/adoption/deletion, final design-system implementation, public surfaces, store records, signed builds, and final physical-device evidence are incomplete or absent.

The correct strategy is not a rewrite. Preserve the verified kernel and cut over the incomplete commercial, content-admission, account, package-delivery, presentation, and release edges.

---

## 4. Current eight-track evidence matrix

Content facts below come from `evidence/readiness/eight-track-launch-readiness.json` and the eight approval records at current content commit `00c97e8ef0d1710e9b8c51e6d5b4740e50cecd32`; current source identity is `e73c7314eee7b2cd3f53b04c952b6af6526d3685`. The application registry/lock last changed at `53986c5e2b7f0db7e3e85fdcad634f90bafcb0cf` and remains intentionally short of the eight-track launch catalogue.

| Launch track | Pushed candidate source | Candidate inventory | Free package | Human review | Publishing/runtime admission | Current app exposure | Launch status |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Coding Interview | present | 3,404 items; 2,827 choice, 279 complexity, 298 ordering | present; 158-item `complexity_and_constraints` package | approved; record bound to source/item manifest | not admitted in current readiness report | registered; pinned historical immutable release | `PARTIAL` |
| GCP ACE | present | 2,981 choice items; 20 nodes; 152 blocks | present; 82-item `setup_environment` package | approved; record bound to source/item manifest | not admitted; current candidate differs from historical app lock | registered; historical GCP release pinned | `PARTIAL / CONTRADICTED` |
| AWS SAA | present | 2,568 choice items; 21 nodes; 134 blocks | absent | approved; record bound to source/item manifest | not admitted | descriptor only; not registered | `PARTIAL` |
| Azure AI-901 | present | 752 choice items; 5 nodes | present; 144-item immutable `patternly-ai901-0001` Free-node package | approved; record bound to source/item manifest | not admitted | descriptor only; not registered | `PARTIAL / PACKAGE-VERIFIED` |
| Azure AZ-104 | present | 1,288 choice items; 9 nodes; 75 blocks | present; immutable `patternly-az104-0001` bundled package | approved; record bound to source/item manifest | not admitted | registered with pinned Free-node package; no runtime admission | `PARTIAL / PACKAGE-PINNED` |
| Backend System Design | present | 1,569 choice items; 10 nodes; 89 blocks | absent | approved; record bound to source/item manifest | not admitted | descriptor only; no Design runtime admission | `PARTIAL` |
| Frontend System Design | present | 1,766 items; 601 choice, 147 decision-matrix, 1,018 ordering; 10 nodes; 88 blocks | absent | approved; record bound to source/item manifest | not admitted | descriptor only; no Design runtime admission | `PARTIAL` |
| Object-Oriented Design | present | 1,413 choice items; 9 nodes; 79 blocks | absent | approved; record bound to source/item manifest | not admitted | descriptor only; no Design runtime admission | `PARTIAL` |

### Consequences

- “Prepared track” and “launch-admitted track” are different states. Candidate presence does not authorize production exposure.
- No release lock update is allowed until a track has an approved source bank, complete Free node, immutable release, package proof, family/runtime proof, and explicit publishing/runtime admission.
- The historical GCP artifact must never be silently relabelled as the current 2,981-item GCP source. Either publish a new current GCP release and migrate atomically, or retain the old release as immutable history only.
- AI-901 source ingress, owner approval, technical evidence, immutable release, inventory, and bundled Free-node packaging are now closed; its remaining blockers are explicit publishing/runtime admission and application lock/runtime integration. AZ-104 remains historical-package evidence until its current full-package chain is rebuilt after shared pipeline changes.

---

## 5. Verified foundations retained as regression sentinels

The following work is not reopened merely because the plan is regenerated. It remains `VERIFIED` only while its tests continue to pass on every subsequent canonical SHA.

| Sentinel | Retained evidence / invariant |
| --- | --- |
| `S-FND-01` clean-checkout gates | both repositories install from locks; application CI installs/builds server and runs recovery/static gates; content CI installs and validates deterministically |
| `S-PLAT-01` platform contract | Expo `57.0.11`, RN `0.86.2`, iOS 16.4+ phone-only, Android min/compile/target 28/36/36, portrait, system theme, backup exclusion |
| `S-ARCH-01` approved-client boundary | closed client/environment registry, direct transport restrictions, no raw Firestore client path, privacy static checks |
| `S-GUEST-01` guest identity | durable installation/local-dataset identity before first value; reset preserves identity; corruption fails closed; iOS simulator first-value/relaunch evidence |
| `S-LEARN-01` shared learning kernel | deterministic sessions, attempts/results/review, journal-first mutation, one local active session, restart recovery, immutable content references |
| `S-TRACK-01` canonical Coding/GCP IDs | retired `algorithms`/old cloud IDs are not production aliases; persisted retired IDs fail explicitly |
| `S-PKG-01` package format | exact-byte/provenance verification and immutable bundled Free-node records for Coding and GCP |
| `S-PKG-04A` package resolver | exact `ContentPackagePin`, profile-closed mode catalogue, malformed/tampered/foreign package failure, no whole-track runtime fallback |
| `S-CONTENT-01` authoring infrastructure | schemas, provenance, deterministic serialization, track-specific candidate validators, immutable history, and the current eight-track readiness report with AZ-104 source counts and explicit non-admission |
| `S-CI-HEAD` exact-SHA CI | application run `31956559706` succeeded on `229071feff211dddb805aa0a1694eeadd5adaf8c`; content run `31956610099` succeeded on `1d46083ab7ce7f8c03b1ec42a7c07be35406ce07` |

**LR-02 rebaseline (2026-08-16):** `S-FND-01`, `S-PLAT-01`, and `S-ARCH-01` were re-exercised by the application recovery gate in run `31956559706`: it installed application and server locks, built the server, regenerated and checked the native platform contract, ran the canonical contract gate, and ran `qa:static`. `S-GUEST-01` and `S-LEARN-01` are covered by that same static suite; the committed iOS first-value/relaunch evidence remains `docs/reports/guest-01-ios-simulator-maestro-2026-08-10.md` and is not represented as a new device run. `S-TRACK-01`, `S-PKG-01`, and `S-PKG-04A` were re-exercised by the focused scope tests and the pinned multi-track release round-trip in the same application run. `S-CONTENT-01` was re-exercised by content run `31956610099`, which installed from the content lock, ran the authoring and per-track validators, regenerated the eight-track report without a diff, validated the bundled Free node, and passed the content publishing gate. `S-CI-HEAD` is the pair of successful exact-SHA runs recorded above. No sentinel was reclassified as a launch admission, and no device, provider, editorial, store, or runtime proof was inferred.

A regression sentinel is not proof of a missing launch capability. For example, successful package verification does not prove remote Premium delivery, and successful candidate validation does not prove human approval or runtime admission.

---

## 6. Mandatory status vocabulary

Use only:

- `READY` — every dependency is satisfied; implementation may start.
- `ACTIVE` — the controller-selected current slice.
- `BLOCKED` — a named dependency or authority is missing.
- `PARTIAL` — bounded compatible implementation exists, but the task acceptance boundary is not met.
- `VERIFIED` — pushed exact-SHA implementation plus all required evidence and CI.
- `SUPERSEDED` — replaced by a named canonical task/decision; retained only as history.

Human and provider gates are represented as blockers on a task, not as fake implementation tasks. Only one controller task may be `ACTIVE`; workers may execute dependency-independent slices explicitly delegated by that controller.

---

## 7. Critical launch blockers

| ID | Severity | Blocker | Required closure |
| --- | --- | --- | --- |
| `BLK-01` | Critical | canonical plan/contract still targets ten tracks while owner launch scope is eight | add exact launch-scope contract; move Terraform/KCNA to post-launch; update all gates and docs |
| `BLK-02` | Critical | AZ-104 source was absent from pushed content source | closed by source ingress and technical readiness evidence; review packet, packages, and admission remain under `CNT-04`–`CNT-06` |
| `BLK-03` | Critical | all eight still lack the complete package/publishing/runtime admission chain | retain the eight exact approval records, then produce complete Free packages, immutable releases, and explicit publishing/runtime admission |
| `BLK-04` | Critical | app registry/CI/release lock are two-track | generic eight-track admission and exact cross-repo lock; no placeholder registrations |
| `BLK-05` | Critical | Design Interview runtime not production-proven | generic family contract; Backend reference proof; OOP independence proof; Frontend proof |
| `BLK-06` | Critical | current GCP brief identity no longer matches the historical locked artifact | keep historical GCP package explicitly unverified; produce a new immutable GCP publication and atomic lock/runtime migration |
| `BLK-07` | Critical | Premium entitlement and package authorization absent | backend RevenueCat authority, App Check/auth boundary, signed URL manifest API and verified client store |
| `BLK-08` | Critical | account/session/sync/adoption/deletion contracts incomplete | remove remote session ownership; compact idempotent sync; safe adoption; durable tombstones and non-resurrection |
| `BLK-09` | Critical | prepared Figma is not yet repository-owned production UI | exact Figma node map; tokens/assets/licenses; canonical components; all verticals; parity and accessibility proof |
| `BLK-10` | Critical | no complete public/store/signed release chain | legal/support/deletion/auth surfaces, professional origins, store records, EAS/signing, TestFlight/Play and signed smoke |
| `BLK-11` | High | final launch gate still reports content/admission blockers | deterministic eight-track readiness report and fail-closed `release:gate` now exist; gate remains intentionally non-passing |
| `BLK-12` | High | provider/operations state is not freshly evidenced | least-privilege deployment, App Check/Firebase apps, package bucket, PITR, RevenueCat and domain evidence |
| `BLK-13` | High | accessibility/performance/usability closure absent | 200% text, screen reader, reduced motion, haptics, budgets, first-use review and both physical platforms |
| `BLK-14` | High | app release configuration is incomplete | release versioning, icons/splash/privacy/link config, `eas.json`, build profiles, secrets boundary and declarations |

No Critical or High item may be silently waived. A Product Owner launch decision may accept a residual High risk only when the risk, impact, mitigation, expiry, and rollback are recorded. Critical risks require closure.

---

## 8. Execution DAG

```text
LR-01 ─┬─ CNT-01 ─ CNT-02 ─ CNT-03 ─ CNT-04 ─ H-CONTENT ─ CNT-05 ─ CNT-06
       ├─ RUN-01 ─ RUN-02 ─ RUN-03 ─ RUN-04
       ├─ SEC-01 ─ DATA-01 ─ DATA-02 ─ DATA-03 ─ DATA-04 ─ DATA-05
       ├─ DES-01 ─ DES-02 ─ DES-03 ─ DES-04..DES-12
       └─ OPS-01 ─ OPS-02

CNT-06 + RUN family proofs + RUN-06 ─ TRK-01..TRK-08 ─ CAT-01
SEC-01 + DATA-02 ─ ENT-01 ─ ENT-02 ─ PKG-01 ─ PKG-02 ─ ENT-03
DATA-05 + ENT-03 ─ complete account/commercial UX
DES verticals + runtime/data/commercial owners ─ QA-01..QA-06
CAT-01 + QA gates + OPS gates ─ REL-01 ─ REL-02 ─ REL-03 ─ REL-04
```

Independent local lanes may proceed in parallel after `LR-01`, but no lane may fabricate another lane’s acceptance evidence. In particular:

- content authoring may proceed before Figma;
- backend/account/package work may proceed before visual implementation;
- design-system extraction may proceed from final Figma before provider setup;
- provider mutations require explicit authority;
- human editorial review may occur in parallel by track, but production admission waits for all required sign-offs for that track;
- final catalogue and release gates require all eight tracks.

---

## 9. Task register

### Stage LR — canonical baseline and plan reconciliation

#### LR-01 — Eight-track launch contract and plan cutover — `VERIFIED`

**Objective:** make the repository unambiguously target the confirmed eight-track release and make this document the sole implementation-order authority.

**Scope:**

- replace `docs/launch-completion-plan.md` with this reconciled plan;
- add one canonical `LAUNCH_TRACK_IDS`/release-scope owner containing exactly the eight IDs;
- keep Terraform and KCNA only as post-launch briefs, never shipping registry entries or release dependencies;
- reconcile `canonical-product-contract.yaml`, overview/product/roadmap/testing/risk documentation, track admission tests, launch surface inventory, and plan references;
- replace “seven-bank” and “ten-track launch” assumptions with a deterministic eight-track readiness model that reports AZ-104 source counts and explicit non-admission;
- preserve current immutable releases and the two-track lock until replacement artifacts are valid.

**Acceptance:** exact-scope tests reject missing, extra, duplicated, aliased, or visible-family tracks; docs and tests agree; current CI remains green; no production placeholder is added.

**Evidence:** pushed application SHA, content SHA if content report changes, CI links, scope diff, old-term/dead-reference scan.

**Verification (2026-08-17):** application commit `723d92ee98b8900025da82a2d06b7bb20d486125` still pins Coding, historical GCP, and `patternly-az104-0001` and dispatches certification packages by track without family aliases; QA run `31982242309` passed the recovery/static and multi-track release jobs. Content commit `9226bb20e4220e5656d07ae5e505b1deb316536c` binds all eight approvals/review packets to source `e73c7314eee7b2cd3f53b04c952b6af6526d3685`, records all eight technical validators as passed, publishes current AI-901 immutable release `patternly-ai901-0001` and its 144-item Free-node package, and passes 142/142 local tests; content publishing run `31983559879` passed on that exact SHA. The report names exactly eight launch tracks; Coding/GCP/AZ have existing bundled package evidence and AI-901 now has current immutable package evidence, while all eight remain explicitly not admitted for publishing/runtime. The application readiness report is still `not_ready` with 34 blockers, including lock scope mismatch, four missing Free packages, seven missing current full packages, and eight publishing plus eight runtime admissions.

**Unlocks:** every remaining lane.

#### LR-02 — Verified-sentinel rebaseline — `VERIFIED`

All sentinels are recorded in section 5 against the post-`LR-01` exact SHAs. They were not reimplemented. Any later failure becomes a regression owned by the slice that caused it.

#### LR-03 — Final gate automation skeleton — `VERIFIED`

Add a deterministic non-passing-yet launch-readiness report that lists every blocker without making ordinary CI red. Add a separate `release:gate` command that fails until all eight tracks and all release evidence are complete. The command becomes mandatory only at `REL-03`; it must never infer human, device, provider, or store evidence.

**Verification (2026-08-17):** `npm run launch:readiness` emits deterministic `patternly-launch-readiness-v1` JSON without failing ordinary validation. `npm run release:gate` emits the identical report and exits `1` while blockers remain. The gate reads the canonical eight-track contract, the content readiness report, and the application release lock; it requires explicit verified evidence records for design authority, security/privacy, provider/operations, physical devices, store readiness, and Product Owner `GO`. It reports absent or invalid evidence as a blocker rather than inferring it. Focused gate tests pass; after AI-901 immutable package evidence and the current content report, the application report is correctly `not_ready` with 34 blockers.

---

### Stage CNT — eight-track content completion and admission

#### CNT-01 — AZ-104 canonical ingress — `VERIFIED`

Use the existing `microsoft-azure-administrator-associate-az-104` authoring registration to add its missing canonical source using the existing content contracts. Reconcile its official objective coverage, node taxonomy, mental units, interaction contract, explanations, distractor explanations, provenance, and source freshness. Preserve the owner requirement of more than 120 authored questions per admitted node unless the canonical content contract is explicitly changed by the Product Owner.

**Acceptance:** source is deterministic; all official domains/skills are mapped; no workbook-only or generated temporary ledger becomes canonical; validator passes; the readiness report includes AZ-104 with exact counts; no publishing/runtime admission is granted.

#### CNT-01A — AI-901 canonical ingress and Free-node release — `VERIFIED`

Install the existing AI-901 node-authoring source through the canonical Certification adapter, derive the checked-in taxonomy/track/profile configuration from the 752 authored items, emit technical evidence, and produce an immutable full-track release plus a profile-closed 144-item Free-node package. Keep the Patternly practice profile explicit where Microsoft does not publish an exact simulation item count; do not claim Microsoft affiliation or provider-faithful exam simulation.

**Verification (2026-08-17):** content `master` `9226bb20e4220e5656d07ae5e505b1deb316536c`, CI `31983559879`, technical evidence for source commit `a050e8a2417a0f88877c020c9d4142279f38d855`, immutable release `patternly-ai901-0001`, inventory and package `microsoft-azure-ai-fundamentals-ai-901-free-node-0001`; local and CI content tests pass 142/142. Publishing and runtime admission remain intentionally open.

#### CNT-02 — Eight-track deterministic readiness report — `VERIFIED`

Replace `seven-bank-candidate-readiness-v1` with an eight-track launch readiness schema. For every track report source root, family, nodes, mental units/blocks, interaction inventory, Free node, source/provenance freshness, technical validation, human review, immutable release, publishing admission, runtime admission, package evidence, and explicit blockers. Generate twice and require byte identity in CI.

#### CNT-03 — Technical and provenance closure for all eight — `VERIFIED`

Run or create uniform validators for every track. Track-specific validators may inspect domain-specific constraints, but the result envelope and gate semantics must be generic. Close broken citations, unsupported technical claims, duplicate identities, missing Reason/Details, distractor explanations, interaction-contract mismatches, stale official objectives, and deterministic serialization errors. Do not edit content merely to satisfy fixed quotas.

#### CNT-04 — Human review packets — `VERIFIED`

Generate one bounded review packet per track: coverage map, node/mental-unit counts, interaction distribution, sample strata, source freshness, automated findings, known limitations, and a machine-readable approval form. Agents may prepare and validate packets but may not set `approved`.

**Verification (2026-08-17):** content commit `9226bb20e4220e5656d07ae5e505b1deb316536c` carries deterministic approval records at `evidence/content-approvals/<trackId>.json`, review packets bound to source `e73c7314eee7b2cd3f53b04c952b6af6526d3685`, refreshed Coding technical/simulation evidence, current AI-901 immutable release/package evidence, and explicit passed results for all eight technical validators. Local `npm test` passes 142/142; readiness and packet regeneration are deterministic; `git diff --check` passes; content publishing run `31983559879` passes the exact content gate.

#### H-CONTENT — Human editorial approval for all eight — `VERIFIED — OWNER AUTHORIZED`

The Product Owner or designated human reviewer must approve every track without exception. Approval must identify exact source commit, review scope, reviewer, date, disposition, and any accepted limitations. The Product Owner explicitly authorized the agent in the active task to record these approvals. The eight records are machine-validated and bound to source commit `e73c7314eee7b2cd3f53b04c952b6af6526d3685`; they do not grant runtime, publishing, package, provider, store, signing, or device admission. Rejection or source drift returns the affected track to `CNT-03`.

#### CNT-05 — Complete Free-node packages for all eight — `BLOCKED by canonical family package inputs`

Package construction may proceed after technical closure and the explicit family dispatch contract, but production admission also requires `H-CONTENT`. Build a complete bundled Free node for each track from its canonical brief and approved source. Each package must be whole-node, immutable, reproducible, profile-closed, non-repeating for supported session sizes, and include exact feedback/evidence identities. No Premium content may leak into Free pools. Current repository evidence exposes Coding, historical GCP, AZ-104, and current AI-901 bundled Free-node packages; the publisher still lacks complete canonical package inputs for AWS, Backend, Frontend, and OOP. AI-901 has crossed the package-input and immutable-release boundary, but remains outside app runtime/publishing admission. Do not copy GCP configuration, infer undocumented provider simulation behavior, fabricate difficulty or package metadata, or relabel historical GCP artifacts; add provider-neutral inputs and explicit adapters only when those contracts are defined and tested.

#### CNT-06 — Immutable full-node release sets and publishing admission — `BLOCKED by CNT-05`

Publish new immutable releases and per-node package manifests without mutating historical bytes. Admission records must bind source commit, technical evidence, human approval, brief, package set, checksums, minimum app version, locale/evidence identity, and publisher version. The current GCP candidate still requires a new version; historical `gcp-ace-0016` remains history. AI-901 now has release `patternly-ai901-0001` and a verified 144-item Free-node package, but no publishing/runtime admission record; the app lock must not be updated until that admission boundary is explicitly closed.

---

### Stage RUN — generic family and package runtime

#### RUN-01 — Canonical family contract closure — `VERIFIED`

Confirm exactly three internal launch families: `coding_interview`, `certification`, `design_interview`. Define family-owned mode capabilities, interaction adapters, scoring semantics, progress dimensions, simulation rules, and content/package contracts. Shared session, storage, review, journal, and navigation ownership remains family-neutral. No user-visible family labels.

**Verification (2026-08-17):** the canonical contract now requires explicit package-to-family dispatch with fail-closed unsupported-family behavior; application QA run `31981873905` passed the corresponding runtime and contract checks on application SHA `0c87ae91c9f239771a9cddddbfccc0772b84db08`. This closes the dispatch boundary, but does not admit a Design runtime or fabricate package inputs for tracks that do not yet have them.

#### RUN-02 — Design Interview reference runtime — `BLOCKED by canonical Design blueprint and executable package inputs`

Implement Backend System Design as the first Design Interview proof through the shared kernel. Support the interaction shapes actually present in approved content, including choice, ordering, and decision-matrix where applicable. Do not force Design content through Certification semantics or create a backend-only lifecycle.

**Verification (2026-08-17):** `RUN-01` is already `VERIFIED`, so it is no longer the blocking dependency. The current content source at `patternly-content` `master` `9226bb20e4220e5656d07ae5e505b1deb316536c` still declares `config/families/design_interview.json` with `supportedInteractions: ["choice"]`, `currentExecutableCapacity: 0`, no executable sessions, and no Free-node claim; its 8 Backend, 10 Frontend, and 9 OOD records are explicitly authoring-feasibility batches only. The 142/142 content test suite confirms productive case payloads and blocked slots are rejected. Implementing a Design runner now would require inventing the missing blueprint/package contract, so this task remains blocked by canonical executable Design inputs rather than by the already-closed family contract.

#### RUN-03 — Design Interview independence proof — `BLOCKED by RUN-02 + canonical executable Design inputs`

Admit OOP through the same family owner and remove any backend-specific generic assumptions. Then admit Frontend and prove its rich ordering/decision-matrix inventory without a second family or fallback transformation.

#### RUN-04 — Provider-neutral Certification proof — `BLOCKED by per-track approved package inputs`

Use GCP as the current-source reference and AWS as the second proof. Remove provider-hardcoded branches. Then prove AZ-104 and AI-901 use the unchanged Certification lifecycle, with track-specific content and official-source profiles only.

**Verification (2026-08-17):** `RUN-01` is `VERIFIED`; the remaining dependency is the approved immutable package/admission chain for the provider tracks. AI-901 has a current immutable package but no runtime/publishing admission, while the current readiness report still lacks package inputs for AWS and the Design tracks and current full-package/admission evidence for the remaining tracks.

#### RUN-05 — Installed package resolver and atomic store — `BLOCKED by package delivery contract`

Extend the verified bundled resolver to installed immutable node packages. Temporary download → checksum/schema/semantic validation → atomic activation; retain previous verified version on interruption, disk-full, corruption, incompatibility, or restart. Never substitute “latest” for the session-pinned version.

#### RUN-06 — Session pin, review resolution, and safe eviction — `BLOCKED by RUN-05`

Protect package bytes referenced by active session, draft, result, review, and exact history. Entitlement loss must not corrupt an already-started session. Missing historical bytes produce an explicit unavailable state, not a different package.

### Stage TRK — per-track production proofs

Each task below is independently reviewable and may progress as soon as that track's approved immutable package inputs and the relevant family/runtime dependencies exist. `TRK-*` proves content-to-runtime correctness; it does not waive final visual, provider, signed-build, or cross-product QA gates. Every task must preserve the shared kernel and package owners, delete track/provider hard-coding it exposes, and publish one exact cross-repository evidence packet.

#### TRK-01 — Coding Interview production proof — `BLOCKED by per-track CNT-06 + RUN-01 + RUN-06`

Prove the complete Coding product from the approved current source: Free node, Premium nodes, Learn/Guided/Custom/Weak and other admitted modes, due review, progress, simulation, package pinning, restart and downgrade continuity. Preserve the strategy-first contract and implementation-planning objective; reject executable-judge/pass claims. No `algorithms` alias or legacy whole-track path.

#### TRK-02 — GCP ACE production proof and current-source cutover — `BLOCKED by per-track CNT-06 + RUN-04 + RUN-06`

Publish and prove the approved current GCP source as a new immutable release. Migrate the app lock/runtime atomically from historical `gcp-ace-0016`; retain the old bytes only as immutable history. Prove Free/Premium practice, remediation, Quick Review, exam simulation, exact review resolution, current official-source provenance, and no silent old/new substitution.

#### TRK-03 — AWS SAA production proof — `BLOCKED by per-track CNT-06 + RUN-04 + RUN-06`

Prove AWS through the unchanged provider-neutral Certification runtime. Include complete Free/Premium packages, scenario feedback, review/progress/simulation, exact provenance and affiliation-safe copy. Any GCP-specific branch found in a shared owner must be removed rather than copied.

#### TRK-04 — Azure AI-901 production proof — `BLOCKED by per-track CNT-06 + RUN-04 + RUN-06`

Prove AI-901 through the unchanged Certification runtime with accurate AI workload/responsible-use/service-boundary semantics, complete Free/Premium packages, review/progress/simulation, current Microsoft provenance and no official-score or provider-affiliation implication.

#### TRK-05 — Azure AZ-104 production proof — `BLOCKED by CNT-01 + per-track CNT-06 + RUN-04 + RUN-06`

Prove the newly ingested AZ-104 bank through the same Certification owner. Cover identity/governance, storage, compute, networking, monitoring/recovery and the reviewed official objective map; include complete Free/Premium packages, simulation and exact package/history behavior. No workbook-only runtime source or Azure-specific lifecycle fork.

#### TRK-06 — Backend System Design production proof — `BLOCKED by per-track CNT-06 + RUN-02 + RUN-06`

Prove Backend as the first Design Interview vertical: requirements, capacity, data/service boundaries, tradeoffs, reliability, evolution, authored feedback, review/progress/simulation and exact packages. Shared Design contracts must not encode backend-only assumptions.

#### TRK-07 — Object-Oriented Design production proof — `BLOCKED by per-track CNT-06 + RUN-03 + RUN-06`

Prove OOP through the same Design Interview owner, with domain responsibilities, state/invariants, collaboration, extensibility, testing and communication. Remove backend-specific generic assumptions; do not reward pattern-name recall without design justification.

#### TRK-08 — Frontend System Design production proof — `BLOCKED by per-track CNT-06 + RUN-03 + RUN-06`

Prove Frontend through the unchanged Design Interview owner and its actual choice, ordering and decision-matrix interactions. Cover state/data flow, client boundaries, delivery/performance, accessibility/resilience, security and evolution. No fallback conversion to simpler interaction types and no backend lifecycle fork.

#### CAT-01 — Exact eight-track production catalogue — `BLOCKED by TRK-01..TRK-08`

Replace the two-track registry with generic admission records for exactly eight launch tracks only after all eight `TRK-*` proofs pass. A track appears only when its complete Free vertical, full core loop, human approval, immutable package set, runtime proof, and current lock are present. Terraform/KCNA remain non-production. Update the cross-repository lock and CI atomically; no descriptor-only track is registered.

---

### Stage SEC/DATA — identity, session ownership, sync, adoption, and deletion

#### SEC-01 — Approved mobile-client and environment proof — `PARTIAL`

Resolve the existing `ID-01` security blocker with a server-verifiable client assertion. The default implementation is Firebase App Check verification at the server boundary, with production attestation providers and explicitly environment-gated debug support only in sandbox. Firebase ID token alone is not an approved-client assertion. Requests missing or failing the assertion are rejected before body handling.

**Verification (2026-08-16):** the API now verifies Firebase App Check with the Firebase Admin adapter, checks the returned app ID against an explicit environment allow-list, rejects missing/invalid assertions before parsing request bodies, and maps provider failures to closed 401 responses. `PATTERNLY_APPCHECK_MODE` is required and production rejects `debug`; `PATTERNLY_APPCHECK_APP_IDS` is required, unique, and passed from startup into every protected account route. The full local suite passes (602 tests), including authentication, HTTP, snapshot, adoption, environment, server build, and release-gate coverage; exact pushed commit `3c74a5f8700300f4666f2e6a4ac6666aa89e95a2` passed application QA run `31972610341`. Mobile provider registration and production attestation evidence remain an external OPS-02/provider gate, so this slice is not marked fully verified.

#### DATA-01 — Durable account lifecycle/tombstone authority — `PARTIAL`

Create a UID-addressable lifecycle record outside recursive account-data deletion. Write deletion intent/tombstone before destructive work, retain bounded proof, revoke sessions, and make account creation/sync/restore reject tombstoned generations. Do not copy mutable dataset revision into a static identity record; retain revision ownership in the dataset head.

**Verification (2026-08-16):** the server now persists an immutable UID-addressable tombstone in `accountLifecycles/{uid}` before revocation/data/identity deletion, derives a separate tombstone generation without copying dataset revision, keeps the tombstone outside recursive `accounts/{uid}` deletion, and rejects tombstoned sync/snapshot/adoption requests with a closed 410 response before body handling. Intent writes are transactionally idempotent and conflicting request identities are rejected. The full local suite passes (604 tests), including lifecycle adapter, deletion-order, HTTP boundary, typecheck, and server build coverage; implementation commit `d6dd3cc` passed exact-SHA application QA run `31973221280`. Mobile account creation/restore orchestration is not present in this server slice and remains part of the broader account vertical, so DATA-01 is not marked fully verified.

#### DATA-02 — Device-session server cutover — `PARTIAL`

Delete remote active-session pointer, draft, item position, timer, conflict selection, and cross-device resume from account schemas/services/tests. Each device owns at most one local active session. Server sync contains compact terminal learning facts and projections only.

**Verification (2026-08-16):** the server account schema no longer accepts `activeSessionReference`, `simulationDraft`, or `foregroundTimer`; adoption no longer classifies or resolves active-session conflicts, and confirmation carries no session-selection or abandonment fields. Full durable adoption, sync, HTTP, typecheck, and build coverage passes locally for the cutover. `trainingSession` records are accepted only when terminal (`completed` or `abandoned`), while local active-session ownership remains in the device learning kernel. The implementation is therefore a pushed server-side partial: mobile outbox projection, account creation/restore orchestration, and two-physical-device proof remain open under DATA-03–DATA-05.

#### DATA-03 — Incremental account operations and projections — `BLOCKED by DATA-02 + SEC-01`

Retain revision/idempotency/transactions; add bounded operations, cursors, due review, goals, recent Activity, and on-demand exact history. Prove retry-window behavior, pagination, concurrent devices, restart, and projection rebuild. Ordinary sync may not require O(n) account snapshots.

#### DATA-04 — Mobile journal-to-outbox sync — `BLOCKED by DATA-03 + email/password account vertical`

Enqueue idempotent operations only after local journal durability. One outbox owner; explicit offline/retry/conflict states; no direct duplicate network write. Two-device convergence and failure injection are required.

#### DATA-05 — Guest adoption and account binding — `BLOCKED by DATA-03 + account vertical`

Retain staged upload/preview/confirm/recovery, remove active-session arbitration, and require local finish/abandon before binding. New empty account preserves guest data by default; existing account requires explicit deterministic choice. Binding occurs only after converged confirmation; no silent merge/discard.

#### DATA-06 — Goals, Progress, and Activity projections — `BLOCKED by DATA-03`

Add per-track goals that never alter mastery, entitlement, or content access. Progress remains a learning projection; Activity is nested under Progress, paginated, and resolves exact history on demand. Four tabs remain Today, Practice, Progress, Settings.

#### DATA-07 — Complete identity/security lifecycle — `BLOCKED by SEC-01 + DATA-01`

Implement email/password without blocking guest first value; verified action handler; reauthentication; email/password change; current/all-device sign-out; Apple/Google explicit linking without email auto-merge; never unlink last method; eight one-time recovery codes; versioned Terms acceptance; secure storage and redaction.

#### DATA-08 — Account deletion end-to-end — `BLOCKED by DATA-01 + DATA-04 + entitlement authority`

Immediate authenticated deletion and possession-verified public deletion; subscription handling is truthful and separate from cancellation/refund; processor association is detached; stale devices cannot resurrect data; PITR restore re-applies tombstones.

---

### Stage ENT/PKG — subscription and Premium delivery

#### ENT-01 — Backend Premium authority — `BLOCKED by SEC-01 + DATA-01`

Implement store → RevenueCat → backend projection with one opaque Patternly account identifier and one Premium entitlement. Verify webhook signatures and idempotency; handle out-of-order, duplicate, refund, revoke, expiry, and product mismatch. Email and device identifiers are not entitlement authority.

#### ENT-02 — Mobile verified entitlement cache — `BLOCKED by ENT-01 + account vertical`

The RevenueCat SDK result never directly authorizes packages. Consume backend projection with server timestamps, known-negative precedence, exact seven-day offline grace, restart/clock/refund/revoke tests, and safe completion of an already-started entitled session.

#### PKG-01 — Entitled manifest and signed-URL API — `BLOCKED by ENT-01 + CNT-06 + provider authorization`

Cloud Run verifies identity, App Check, entitlement, track/node/version, minimum app version, object generation, and rate bounds before returning a short-lived signed URL. Firestore stores metadata only. No object enumeration or per-question fetch.

#### PKG-02 — Cloud package publication and verified mobile installation — `BLOCKED by PKG-01`

Publish immutable compressed node objects, verify generation/checksum, and integrate the atomic store from `RUN-05`. Prove interruption, corruption, wrong account/track/version, stale URL, low storage, offline, rollback, and eviction behavior.

#### ENT-03 — Purchase, restore, conflict, and downgrade — `BLOCKED by ENT-02 + DATA-05 + PKG-02`

Verified account required; guest purchase prohibited; Free alternative explicit. Implement monthly/annual purchase, restore, cross-platform account conflict, cancellation/pending/error, manage subscription, downgrade, and historical-learning continuity. No fake success when store, RevenueCat, backend, or network disagree.

---

### Stage DES — implementation of the prepared Figma authority

The old Brand Lab direction-generation tasks are `SUPERSEDED` as execution work. Their evidence may remain historical. The current lane begins from the Product Owner-designated final Figma references.

#### DES-01 — Final Figma authority inventory — `PARTIAL; current file inspectable, owner/release evidence still open`

Record exact Figma file, page, node IDs, version, owner approval state, and mapping to every required product/public/store state. Do not assume old B-05 `DRAFT` frames are final. Classify each state as `REFERENCE_COMPLETE`, `REFERENCE_MISSING`, or `NOT_APPLICABLE`. Missing visual references block only corresponding `DES-*` slices. The current file is now inspectable through the official connector: `kZXD7cNBKUU7x0ceTHPFpR`, Page 1, library root `118:738`, fresh Light/Dark verification board `882:14188` (`882:14189` Dark, `882:14341` Light), Home reference `55:445`, and Practice setup reference `55:2172`. The bounded inventory and live connector evidence are recorded in `docs/reports/launch-des-001-figma-authority-inventory-2026-08-17.md`. This unblocks targeted design implementation, but does not create Product Owner approval evidence, close the external `design-authority` release gate, or claim whole-product `DESIGN READY`. The current Figma uses `Home` while the reconciled runtime contract targets `Today`; implementation must preserve the runtime contract and use only the approved geometry, tokens and components from the reference.

#### DES-02 — Repository tokens, assets, and licensing — `PARTIAL; targeted token mapping unblocked, full handoff remains open`

Import final vectors rather than reconstructing geometry; record fonts/licenses; generate typed Light/Dark/System tokens; track accents remain subordinate to one Patternly brand; lint unsafe literals; no live Figma dependency in build or CI. The live Figma variable read for the approved Home reference now confirms the semantic color, spacing, radius and typography names needed for bounded implementation. Full repository-owned token/asset/licensing inventory and verified handoff remain open, so this task is not `VERIFIED` and does not unblock the complete Storybook/primitives lane.

#### DES-03 — Development-only Storybook and canonical primitives — `BLOCKED by DES-02`

Use production React Native components with typed deterministic fixtures. Storybook has a separate dev entry and is statically absent from release bundles. Implement controls, response interactions, shells, loading/empty/offline/error/saving/frozen/finalizing/recovery/destructive states, reduced motion, haptics, and large text.

#### DES-04 — Guest bootstrap and first value — `BLOCKED by DES-03 + guest/package owners`

Implement the approved first-launch, invalid/unsupported identity, track selection, Free-node entry, goal, offline, recovery, and first completion states without an account wall or family labels.

#### DES-05 — Today and Practice — `BLOCKED by DES-03 + goals/package/entitlement owners`

Replace Home with Today. Implement recommendation priority, local resume, due review, manual-choice precedence, roadmap, setup, downloads, package states, Free/Premium locks, downgrade, and explicit unavailable states.

#### DES-06 — Ordinary runner and feedback — `BLOCKED by DES-03 + RUN family proofs`

Implement all approved interaction types over one lifecycle. Preserve color-only correctness, timer/counter placement, authored Reason visible and Details collapsed, immediate/deferred feedback, saving/error/frozen/recovery, accessibility, motion, and haptics.

#### DES-07 — Simulation, finalization, summary, and review — `BLOCKED by DES-03 + RUN-06`

Preserve deterministic timer/background/restart/finalization semantics and exact package resolution. Remove account-wide resume copy and old shells only after coverage moves.

#### DES-08 — Progress and nested Activity — `BLOCKED by DES-03 + DATA-06`

Implement track-specific Progress and paginated nested Activity, including exact result/history, package unavailable, multi-track, empty/offline/loading/error states. No fifth tab.

#### DES-09 — Settings, consent, reminders, and storage — `BLOCKED by DES-03 + observability/goals`

Implement theme, goals/reminders, analytics consent, package storage, support/legal, account/no-account and destructive states. Remove the one-option Language route and stale local-only claims.

#### DES-10 — Account, security, and adoption — `BLOCKED by DES-03 + DATA-05 + DATA-07`

Implement registration/verification/sign-in/reset, linking/collision, reauth, recovery codes, Terms, sign-out, adoption preview/choices/progress/recovery. First value stays outside account.

#### DES-11 — Premium and purchase — `BLOCKED by DES-03 + ENT-03`

Implement value-first offer, monthly/annual, verified-account requirement, purchase/restore/conflict, grace, downgrade, manage subscription, and Free alternative. No slots or tiers.

#### DES-12 — Reports, deletion, public/auth/legal/support/store surfaces — `BLOCKED by DES-03 + report/deletion/public owners`

Implement content report queue/confirmation, mobile/public deletion, landing, Privacy, Terms, support, auth action results, affiliation-safe track presentation, store icon/screens/feature graphics, and responsive accessibility.

---

### Stage OBS/OPS — privacy, observability, providers, and operations

#### OBS-01 — Consent-gated Analytics and Crashlytics — `BLOCKED by SEC-01`

Rename the existing local Progress projection that is incorrectly called analytics. Add a closed event registry, fail-closed consent, forbidden-field tests, sanitized crashes, revocation/reinstall behavior, and zero emission before consent. No raw per-event Firestore stream.

#### OBS-02 — Account-unlinked content reports — `BLOCKED by CNT-06 + RUN-06`

Queue offline, submit idempotently, attach only bounded content/package identity by default, and require explicit opt-in for account/contact. Add review/correction/new-release provenance and retention/de-identification tests.

#### OPS-01 — Reproducible Cloud Run artifact and least-privilege IAM — `PARTIAL`

Preserve the digest-pinned build/deploy definition already present. Complete local container boot, current read-only provider inventory, service-account/IAM diff, health/logging, rollback, Artifact Registry provenance, and deployed sandbox evidence before production mutation.

**Verification (2026-08-17):** application commit `c0e4aaa` was clean and aligned with `origin/main` before the documentation-only updates; final application commit `aaa1f8fa51363512e30dbb65823adb98d341bc8f` passed GitHub Actions QA run `31984300974` (Recovery QA gate and multi-track content release contract). `npm run sync:content-release` produced no diff; the cross-repository content contract (2/2), content boundary, runtime/privacy boundary, application typecheck, server TypeScript build, and `git diff --check` all passed. The digest-pinned `server/Dockerfile` and `server/cloudbuild.yaml` remain unchanged. Podman could not connect to its local machine socket and `gcloud` is not installed, so no container boot, provider inventory, Artifact Registry digest, Cloud Run revision, logging, rollback, or deployed sandbox evidence is claimed; OPS-01 remains `PARTIAL` pending the authorized provider boundary.

#### OPS-02 — Firebase mobile apps and App Check — `BLOCKED by provider authority`

Register/configure iOS and Android apps per environment; email/password/action settings; App Check production providers; debug tokens only in sandbox; deny-all direct Firestore remains. Record identifiers without secrets.

#### OPS-03 — RevenueCat and package storage — `BLOCKED by provider/store authority`

Create sandbox then production apps/products/offering/webhook, one Premium entitlement, immutable package bucket/object policy, metadata deployment, and least-privilege signing. Verify no client can enumerate or authorize objects directly.

#### OPS-04 — Domain, public origin, sender, and links — `BLOCKED by owner authority`

Promote one professional domain and sender; deploy public/auth/legal/support/deletion surfaces; verify TLS, DNS, AASA, assetlinks, non-enumeration, and remove default Firebase production origins.

#### OPS-05 — PITR and restore drill — `BLOCKED by DATA-01 + provider authority`

Enable the exact seven-day target if provider capability supports it; run a sanitized sandbox restore; prove tombstones are re-applied and deleted accounts do not resurrect. Backup is disaster recovery, not user account recovery.

#### OPS-06 — Release configuration — `BLOCKED by DES-02 + final provider/store identifiers`

Add canonical `eas.json`, build/update channels, app/build version policy, icons/splash/adaptive icon, privacy manifests/declarations, notification/link config, secret/environment boundaries, reproducible prebuild, and release bundle exclusion checks. Current `0.1.0` and minimal `app.json` are not a release packet.

---

### Stage QA — launch closure

#### QA-01 — Eight-track automated contract matrix — `BLOCKED by CAT-01`

For each track prove registration, family, Free node, supported modes, 10/20/40 where applicable, non-repeating pools, authored feedback, scoring/review, exact package pin, progress, simulation where applicable, no foreign content, and no provider/track hardcoding. Update application CI so the release round-trip covers all eight immutable releases.

#### QA-02 — Security/privacy threat and abuse closure — `BLOCKED by completed data/commercial/public owners`

Verify auth-before-body, App Check, token revocation, linking takeover resistance, recovery code secrecy, webhook replay, signed URL abuse, package substitution, rate limits, closed schemas, consent, report minimization, deletion, tombstone restore, secrets/log redaction, and environment isolation.

#### QA-03 — Persistence/offline/concurrency closure — `BLOCKED by DATA/RUN/ENT completion`

Failure-inject journal, outbox, adoption, package activation, entitlement cache, finalization, deletion, disk-full, process kill, restart, two devices, and version eviction. No silent loss or fake convergence.

#### QA-04 — Accessibility/motion/haptics closure — `BLOCKED by all production verticals`

Automated and real-device screen-reader order/labels, focus, targets, contrast, 200% text, reduced motion, semantic haptics and persistence-aware success. Zero open Critical/High accessibility defect.

#### QA-05 — Visual parity and whole-product consistency — `BLOCKED by all DES tasks`

Compare approved Figma references to iOS and Android captures for every risk-based state; verify public/store/product identity consistency, no family leakage, no stale UI path, no unapproved literal/asset, and no Codex self-approval.

#### QA-06 — Performance and layout budgets — `BLOCKED by complete product`

Check cold/warm start, Today/Practice/navigation, ordinary and long sessions, download/activation, memory, package size, flicker, loading and layout shift on representative lower/target devices. Budgets and variance must be checked in, repeatable, and met.

#### QA-07 — Human content sign-off reconciliation — `BLOCKED by final immutable releases`

Verify every shipping byte derives from the exact human-approved source commit and no post-approval semantic edit bypassed review. Any semantic change invalidates the affected sign-off.

#### QA-08 — Practical first-use beta review — `BLOCKED by signed candidates`

Run a bounded first-use test across guest, first value, track switching, account boundary, Premium offer, and recovery. Findings receive severity/owner/evidence; all Critical/High are fixed or, for High only, explicitly accepted by the Product Owner.

---

### Stage REL — signed release and GO/NO-GO

#### REL-01 — Store/commercial records and declarations — `BLOCKED`

Create App Store/Play records, one monthly and one annual Premium product, RevenueCat production offering, privacy/data-safety declarations, metadata, screenshots, support/privacy/terms/deletion URLs, and affiliation-safe descriptions for exactly eight tracks.

#### REL-02 — Signed iOS candidate — `BLOCKED by REL-01`

Reproducible iPhone-only archive, signing, TestFlight upload, universal links, purchases, privacy manifest, exact artifact hash, and install/boot on supported physical iPhone.

#### REL-03 — Signed Android candidate — `BLOCKED by REL-01`

Reproducible AAB, Play App Signing/internal track, API 28/36 contract, app links, billing/data-safety, exact artifact hash, and install/boot on supported physical Android phone.

#### REL-04 — Final signed physical-device matrix — `BLOCKED by REL-02 + REL-03`

On both signed candidates verify guest/free for all eight tracks, account/adoption, two-device sync, purchase/restore, Premium packages, seven-day grace, downgrade, reports, analytics consent, links/actions, deletion, notifications, offline/restart, exact history, accessibility, and no dev/Storybook path.

#### REL-05 — GO/NO-GO — `BLOCKED by every gate`

The Product Owner receives exact application/content SHAs, CI runs, immutable release IDs, build hashes, provider/store evidence, human content approvals, Figma/code parity, risk register, rollback, and signed device results. `GO` requires every exit criterion below. No agent submits or releases without explicit authorization.

---

## 10. Universal Definition of Done for every implementation slice

Every worker report and independent QA report must include:

1. exact starting remote SHAs and proof the worktree matched them;
2. facts found before editing and assumptions explicitly labelled;
3. bounded objective, paths changed, and non-goals;
4. implementation summary and deletion/migration map;
5. automated commands and exact results;
6. security, privacy, content, persistence, accessibility, and release impact, including `none` with reasoning;
7. dead-reference scan covering imports, routes, scripts, tests, CI, docs, generated artifacts, feature flags, and aliases;
8. manual/device/visual/provider evidence or `NOT_APPLICABLE` with a valid reason;
9. independent QA findings and disposition;
10. pushed commit SHA and exact-SHA CI link;
11. updated status in this plan and the next unlocked task;
12. clean canonical worktree and remote ahead/behind `0/0` after push.

A task may not be marked `VERIFIED` from local tests alone. A documentation-only task still requires contract-gate and CI evidence when it changes canonical behavior, scope, or status.

---

## 11. Final launch-readiness exit criteria

Patternly is launch-ready only when all conditions are simultaneously true on exact canonical SHAs:

- application `main` and content `master` are clean, pushed, mutually pinned, and green;
- release scope is exactly the eight confirmed tracks; no Terraform/KCNA production exposure;
- all eight have complete canonical source, technical/provenance validation, human editorial approval, complete Free node, immutable full package set, publishing admission, runtime admission, and cross-repo lock;
- GCP uses the approved current source release, not an ambiguous historical substitution;
- Coding, Certification, and Design Interview family proofs pass without per-track lifecycle forks;
- guest first value works offline without account creation for every track;
- account, sync, adoption, security, recovery, entitlement, purchase/restore, package delivery, reporting, deletion, and restore semantics pass their failure matrices;
- the final Figma authority is implemented in repository-owned tokens/assets/components and complete verticals; Storybook is dev-only and absent from release;
- public/auth/legal/support/deletion surfaces and professional origins are live and verified;
- provider infrastructure, least privilege, RevenueCat, package storage, App Check, PITR, rollback, and observability are evidenced;
- accessibility, visual parity, performance, first-use usability, offline, concurrency, and security gates pass;
- signed TestFlight and Play internal candidates pass the full physical-device matrix;
- store metadata, products, declarations, URLs, screenshots, icons, privacy records, and affiliation claims match the product;
- no open Critical risk and no unaccepted High risk;
- `npm run release:gate` passes against the exact release SHAs/build evidence;
- the Product Owner records explicit `GO`.

Until then, status remains `NO-GO`, regardless of local functionality, candidate question counts, green partial CI, or unsigned simulator evidence.
