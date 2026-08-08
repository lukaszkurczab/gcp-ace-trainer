# Patternly — product completion plan before public launch

Status date: 2026-08-01
Application evidence commit: `4a2c2ab`
Decision: `PRODUCT COMPLETION NO-GO`

## Why this document exists

The earlier launch plan started too late. It treated Patternly as a
feature-complete release candidate requiring lifecycle, signing and store
closure. Current source and fresh screenshots do not support that assumption.

The complete source-level product-surface inventory is now closed in
[`launch-surface-inventory.md`](launch-surface-inventory.md). Patternly has
completed its account/data contract and canonical visual shell. The first
active task is now the missing account/authentication implementation. Store
registration, signing and distribution remain mandatory explicit work rather
than an implied final action.

The category baseline is closed in
[`competitive-product-gap-audit.md`](competitive-product-gap-audit.md). It
adds Study Activity, content trust/reporting and a bounded goal/cadence
decision while deliberately excluding launch-time imitation of judges, labs,
AI tutors, gamification, community and paywalls.

Internal testing continues independently. Manual item-by-item question review
is not part of this plan.

## Current evidence

`RootNavigator` registers 21 routes. All 21 were inspected in current source
and their implemented and missing states are classified in the launch surface
inventory. The bounded Task 2 pack now covers six representative shell
checkpoints in a 36-cell iOS/Android, light/dark and narrow/larger-text matrix.
It proves the shared shell, not uncaptured product routes and states; app-wide
visual readiness therefore remains `partial`.

The owner now requires registration and sign-in for public launch. Current
source has no auth/account routes, backend, identity model, remote-data
boundary, deletion service or local-data adoption implementation. The completed
Task 1 contract supersedes the old no-auth launch assumption; Task 2 now
provides the canonical shell consumed by the account implementation.

Pre-Task-2 discovery evidence:

- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/02__onboarding-selection__010__track-selection__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/04__practice__010__algorithms-hub__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/05__practice__010__custom-setup__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/07__summary__010__partial-summary__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/08__progress__010__algorithms-priority__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/09__settings__010__settings-root__light__ios-regular.png.png`
- `../artifacts/maestro-screen-capture/full-launch-surface-audit/2026-07-31-current/ios-full/screenshots/15__exam-review__010__empty-review__light__ios-regular.png`

Defects originally visible in that discovery sample:

- Custom Practice opens with its title clipped above the visible viewport.
- Exam Review and partial summary use sparse generic empty/result compositions
  with little context and excessive unused space.
- Track Selection and Practice Hub use very tall repeated cards, causing
  important alternatives to start below the first viewport.
- Progress repeats empty-state information across several large sections and
  lacks a compact information hierarchy.
- Root/tab screens use the branded Patternly header while settings and exam
  routes use a different native-stack header and back treatment.
- spacing, header height, card density and action placement vary materially
  between routes.

Task 2 removed the competing header path, introduced one generic pending-state
owner and passed its representative 36-cell matrix. Remaining per-screen
hierarchy and outcome defects stay assigned to Tasks 4 and 6 rather than being
misrepresented as unresolved shell ownership.

## Status table

| Area | Status | Evidence / reason |
| --- | --- | --- |
| Question bank and pinned content release | `done` | 2,735 items; structural tests and byte-exact application integration pass |
| Full product-surface inventory | `done` | all 21 registered routes, embedded states, missing launch surfaces, store registration and signing work are classified in `launch-surface-inventory.md` |
| Competitive/category gap review | `done` | direct Algorithms, certification and adjacent learning products were compared in `competitive-product-gap-audit.md` |
| Account/authentication product contract | `done` | vendor-neutral lifecycle, authority, adoption, sync, offline, recovery, sign-out and deletion contract passed independent QA after Slices 1A–1D; 25/25 focused and 407/407 full tests pass |
| Account backend/provider decision | `done` | `PO-020` fixes Firebase Authentication + Firestore Standard + Cloud Run in `europe-central2`; the reconciled contract, prerequisite boundaries and cost/security constraints passed independent QA on 2026-08-01 |
| Firebase/GCP project shells | `done` | 3B-1 closed with `patternly-app-sandbox` and `patternly-app-production` as distinct unbilled `ACTIVE` Firebase projects; `PO-024` later linked sandbox billing only, while production remains unbilled |
| Firestore security foundation | `done` | both Standard `(default)` databases in `europe-central2` and byte-identical deny-all rules were verified while both projects were unbilled; 3B-2 passed independent QA |
| Firebase Authentication provider foundation | `done` | both projects expose the exact email/password-only `FIREBASE_AUTH` config with improved email privacy and no apps/users; 3B-3 closed before the later sandbox-only billing link and passed independent QA |
| Account/authentication implementation | `blocking` | the complete account lifecycle design is now approved, but no registration, sign-in, verification, recovery, account, sign-out, reauthentication or deletion surface/service exists |
| Missing screen and state decision | `done` | the canonical inventory identifies existing, missing and conditionally required launch surfaces |
| Visual system consistency | `done` | Task 2 closed after one shared header, one generic pending-state owner, 36/36 representative device cells, scoped option-3 comparison and independent QA `pass` |
| First-run track choice | `partial` | onboarding variant exists in source; fresh first-install state and completion behaviour still need capture |
| Home and track discovery | `partial` | implemented, but hierarchy and card density need product review |
| Practice discovery and setup | `blocking` | visible layout defect in Custom Practice; remaining modes and configurations not fully captured |
| Algorithms practice runner | `partial` | functional lifecycle exists; question types, feedback variants, long content and terminal states need visual closure |
| Certification ordinary practice lifecycle | `blocking` | weaker lifecycle than Algorithms and no complete state coverage |
| Simulation and exam surfaces | `partial` | runtime exists; result/review presentation is visibly under-designed and recovery states are not fully audited |
| Progress and review surfaces | `partial` | implemented; empty and populated hierarchies, mistakes review and answer review require redesign/verification |
| Study Activity / session history | `blocking` | durable records exist, but no chronological history route reliably reopens an exact result/review |
| Content trust and issue reporting | `blocking` | internal release/provenance exists, but no user-facing release/source context or per-item reporting path exists |
| Learning goal and cadence | `planned` | decide whether goal/horizon/cadence materially changes recommendations; do not add vanity streak/readiness mechanics |
| Settings product contract | `partial` | Language offers no real choice; public support/privacy destinations and consistent headers are unresolved |
| Public privacy and support surfaces | `blocking` | no public URLs or dedicated support route are evidenced |
| Loading, empty, unavailable and recovery state design | `partial` | one canonical generic pending state and six explicit read-failure owners are implemented/tested; route-specific evidence remains with later tasks |
| Dark theme | `partial` | six representative checkpoints pass in light/dark on iOS and Android; app-wide frozen-screen coverage remains Task 9 |
| Android visual parity | `partial` | six representative standard and narrow/larger-text checkpoints pass; later product surfaces remain uncaptured |
| Small-screen and tablet contract | `blocking` | representative narrow/larger-text shell evidence passes on iOS and Android, but tablet support remains declared without a launch-quality decision/evidence set |
| Future content-release reproducibility | `partial` | current-source `validate:real:*` fails while pinned integration remains correct |
| Apple/Google developer and app registration | `unknown / needs evidence` | account, agreements, roles and store app records were not inspected |
| Android production signing | `blocking` | release still uses debug signing; upload-key and Play App Signing path are not complete |
| iOS production signing/archive | `unknown / needs evidence` | no validated archive, upload or TestFlight install evidence |
| Production distribution and store packet | `planned` | downstream of product completion but explicitly decomposed into store registration, platform signing, metadata and signed-artifact gates |

## Canonical launch sequence

### Stage 0 — close the product-surface inventory (`done`)

The source review of all 21 routes, embedded states, missing account/trust
surfaces, store registration and signing work is complete in
[`launch-surface-inventory.md`](launch-surface-inventory.md). Fresh visual
coverage remains scoped verification evidence for the implementation tasks
below; it is not another app-wide discovery stage.

### Stage 1 — define the account, identity and data contract (`done`)

Before drawing authentication screens or selecting a provider, define:

- why an account is required and whether first use can begin offline;
- identity method, verification and recovery;
- ownership of local and remote learning records;
- the explicit decision when existing local data meets a new or returning
  account;
- offline and expired-session behaviour;
- account deletion, associated-data deletion and public deletion request;
- privacy, security, retention and support obligations;
- deep/universal-link and email-delivery boundaries;
- the single canonical repository/service path that replaces the no-auth
  assumptions without creating a parallel local/account product.

This stage must update the canonical product, persistence, security and
navigation contracts. It must not add placeholder routes or a provider-specific
compatibility layer.

### Stage 2 — lock one visual and navigation system

Define one canonical screen shell before repairing screens independently:

- safe-area and scroll ownership;
- branded versus native header decision;
- back-navigation pattern;
- page-title scale and first-viewport spacing;
- card density and section rhythm;
- primary, secondary, destructive and inline actions;
- empty, loading, unavailable, error, success and terminal-result patterns;
- long-copy and long-answer behaviour;
- bottom-navigation visibility on nested routes;
- dark-theme and platform token behaviour.

This stage must reuse and simplify the existing components and tokens. It must
not add a parallel design system.

### Stage 3 — close missing or misleading product surfaces

Implement the decisions already captured by the route/state inventory:

- account entry/welcome;
- registration and identity verification where required;
- sign-in, forgot/reset password and session-expired recovery;
- account/profile, sign-out and account deletion;
- local-data adoption/merge decision and truthful sync/backup status;
- public privacy destination and in-app access;
- public support/contact destination;
- app identity/version/support information if required by the chosen support
  flow;
- first-run completion state;
- truthful no-data and no-history states;
- notification denied and device-settings recovery;
- unrecoverable local-data and content-preparation states;
- whether Language is removed for an English-only launch or completed as a
  real language choice;
- whether tablet support is removed or completed.

Do not create empty placeholder screens. Every retained route must have a
complete launch use case.

### Stage 4 — repair entry and discovery journeys

Surfaces:

- first-run track choice;
- Home for both tracks;
- track switching;
- Topic Roadmap;
- Algorithms scope selection;
- Practice Hub for both families;
- Custom Practice and Certification configuration;
- a bounded learning-goal/cadence surface only if Task 1 proves it changes the
  recommendation or reminder contract.

Primary goals:

- one clear first action;
- important alternatives visible without oversized repeated cards;
- no clipped headings or hidden controls;
- clear relationship between track, topic, mode and session configuration;
- consistent back and tab behaviour.

### Stage 5 — complete learning runtimes

Algorithms:

- verify choice, multiple-choice, ordering and complexity controls;
- verify short and long questions, long answers, feedback documents and code;
- finish submit, feedback, details, pause/resume, conflict and failure states.

Certification:

- replace the split ordinary-practice lifecycle with the canonical shared
  lifecycle;
- add elapsed foreground time, explicit leave choice, pause/resume, active
  configuration conflict, unanswered validation and truthful completion;
- visually align ordinary practice and exam simulation without erasing their
  different interaction contracts.

### Stage 6 — redesign outcomes, review and progress

Surfaces:

- Algorithms completed and partial summaries;
- Certification result;
- empty and populated Exam Review;
- Answer Review;
- Mistakes Review;
- Algorithms simulation summary and review;
- Progress for both tracks, empty and populated;
- Study Activity/session history with exact result/review reopening.

Required outcome:

- summaries explain what happened, what was saved and what to do next;
- result screens do not collapse into generic cards with large empty regions;
- review states preserve question, response, correct answer, explanation and
  review action hierarchy;
- Progress prioritizes one next action and removes repeated empty-state copy;
- durable history is chronological, distinguishes resumable/completed/ended
  early sessions and never duplicates aggregate Progress.

### Stage 7 — finish settings and trust surfaces

- normalize settings headers and spacing;
- resolve the English-only versus Polish product contract;
- verify Appearance in light, dark and system modes;
- complete Notifications permission, denied, enabled, edit and disable states;
- make Your Data actionable and verify reset confirmations/results;
- connect Legal Information to the public privacy destination;
- add support/contact access;
- show truthful local and remote storage, sync and recovery limitations;
- add the account group and account/data deletion entry without duplicating
  Settings or retaining obsolete no-account copy.

### Stage 8 — close content trust and correction feedback

- expose active content release/version and honest freshness information;
- expose certification source basis and checked date without implying official
  endorsement;
- add `Report a problem` to feedback/details and answer review;
- carry stable item, track and content-release identity automatically;
- implement sent, queued/offline, failed and retry states;
- connect reports to canonical in-place correction and reproducible publishing;
- do not add a hidden weak-content flag, runtime filter or second question bank.

### Stage 9 — platform and visual hardening

- iOS and Android parity;
- small-screen reflow;
- status bar, safe area, keyboard and bottom-sheet behaviour;
- dark appearance;
- remove tablet support claims/configuration and collect phone-only evidence;
- launch icon, splash and native appearance;
- visual regression pack for canonical routes and states;
- copy consistency and final English proofreading.

### Stage 10 — technical release closure

Only after the product surface is frozen:

- restore future content-release validation;
- confirm Apple Developer and Google Play developer account access,
  agreements and roles;
- register Patternly and its canonical identifiers in App Store Connect and
  Play Console;
- align iOS native configuration and configure iOS distribution identity;
- configure Android upload signing and Play App Signing;
- build and verify the signed AAB and iOS archive separately;
- complete privacy declarations and store metadata;
- capture final store screenshots from release candidates;
- run signed-artifact smoke and issue final GO/NO-GO.

## Implementation-ready task packets

### Completed discovery — route/state inventory

Task 0 has been removed from active implementation. Its source-level output is
[`launch-surface-inventory.md`](launch-surface-inventory.md). All current routes
and missing launch surfaces are assigned below; future task reports update the
inventory rather than requesting another broad audit.

### Completed Task 1 — account, identity and data contract (`done`, not active)

Task 1 closed after independent QA `pass`. Its detailed Slices 1A–1D remain
below as acceptance and repair history, not active work. The canonical output
is [`reports/launch-001-account-data-contract.md`](reports/launch-001-account-data-contract.md).

**Controller slice 1A — canonical account/data contract (`completed`)**

- **Smallest coherent objective:** replace the contradictory public-launch
  no-account assumptions with one vendor-neutral, implementation-ready account
  and data lifecycle. Splitting identity, data adoption, sync and deletion into
  separate decisions would leave unsafe transitions undefined, so they remain
  one documentation-and-contract slice.
- **Confirmed repository facts:** `PO-017` requires registration and the full
  account lifecycle; the 21-route navigator has no account route; current
  production source has no account service or remote-data implementation; one
  MMKV-backed canonical repository set owns local learner records; the
  pre-slice contracts explicitly prohibited accounts, remote learning storage and sync;
  pre-production storage compatibility is not required.
- **Assumptions for this slice:** the contract stays independent of a backend
  vendor; Task 1 changes normative contracts, narrative contracts and contract
  tests only; it does not add UI, networking, credentials, provider packages or
  a second persistence implementation.
- **Scope:** account purpose and entry gate; identity method; verification,
  recovery and reauthentication; session expiry and offline states; ownership
  of every local and remote record; first-account data adoption; deterministic
  sync/conflict semantics; sign-out, account deletion, retention and public
  deletion request; deep/universal-link and email-delivery boundaries; route
  and state mapping; security/privacy/threat boundaries; sequenced downstream
  implementation slices.
- **Non-goals:** provider or hosting selection; auth/account screen or service
  implementation; public URL creation; secrets; analytics; billing; social
  login; compatibility readers for obsolete pre-production data; silent merge,
  overwrite, account bypass or offline success.
- **Acceptance criteria:**
  1. `canonical-product-contract.yaml` and its schema define exactly one
     test-covered account/data contract covering entry, identity, lifecycle,
     data authority, adoption, offline, sync/conflict and deletion.
  2. One state/transition walkthrough covers register, verify, sign in,
     recover/reset, expired session, reauthenticate, sign out and delete,
     including invalid, duplicate, expired, rate-limited, offline and remote
     failure outcomes without a hidden fallback.
  3. Every canonical local record class is assigned an owner and remote-sync
     policy; empty-local, empty-remote, both-populated, active-session and
     divergent-record adoption cases have deterministic, user-visible results
     with no silent loss or parallel authority.
  4. The route/surface map names the complete account, adoption, sync-status,
     recovery and deletion states required by later implementation while
     creating no placeholder route or code.
  5. Security/privacy documentation specifies transmitted fields and purpose,
     credential/token handling boundaries, logging exclusions, offline and
     session-expiry behavior, retention, deletion verification and honest
     limitations; no claim is stronger than the planned mechanism.
  6. `ADR-003` remains historical only, obsolete no-auth launch statements are
     retired, and narrative docs do not contradict the normative contract or
     describe unimplemented behavior as current behavior.
  7. The task report records the data-flow/threat walkthrough, exact changed
     files, dead-code/obsolete-contract check, verification results, unverified
     provider/production areas, risks and small implementation slices for
     Tasks 3, 7 and 8.
- **Required evidence before closure:** focused canonical-contract tests,
  schema/contract parser success, contract-change gate result, documentation
  contradiction search, route/data-state walkthrough and independent QA
  verdict `pass`.
- **Stop conditions:** an owner-only identity or data-loss trade-off cannot be
  resolved from product constraints; the contract would require real provider
  credentials, production data or an irreversible external action; existing
  dirty changes make attribution unsafe.

**Controller repair slice 1B — contract integrity after QA (`completed`)**

- **Objective:** correct only the repo-level account-contract gaps found by
  independent QA; preserve the vendor-neutral lifecycle and avoid adding any
  runtime implementation.
- **Scope:** remove derived progress/evidence as independent synchronized
  records; resolve pending mutation journals before export/sign-out/deletion;
  make destructive deletion crash-recoverable; close auth/public-deletion token
  and link fields; make Task 8's future schema extension explicit; complete the
  lifecycle/surface map; enforce the 30-minute link maximum; prevent offline
  entry before successful first bootstrap.
- **Non-goals:** provider/hosting selection, UI/routes, networking, remote
  repositories, content-report implementation, retention-policy expansion,
  unrelated narrative rewrites or changes to Tasks 2–14 beyond dependency
  wording made necessary by this repair.
- **Acceptance criteria:**
  1. Remote convergence synchronizes canonical stored facts only; progress and
     evidence projections are derived from attempts/results/review and cannot
     become separately writable or synchronized authority.
  2. Any durable learning mutation journal is recovered, materialized,
     verified and cleared before export, sign-out or deletion can proceed;
     failure blocks the destructive operation without discarding committed
     work or leaving prior-account data bound to a new account.
  3. Account deletion persists a minimal durable intent before the first remote
     destructive step and can finish idempotent local cleanup after restart
     even if remote identity and sessions are already gone.
  4. Closed transmitted-field and link contracts include access/refresh-token
     transport and a distinct single-use, expiring public-deletion possession
     token without permitting token persistence or logging.
  5. Task 8 no longer claims item/category/free-text fields are authorized by
     Task 1; its first implementation step must add and test a closed report
     schema, purpose, retention and deletion policy before any report network
     path exists.
  6. Verification resend and pending-email change have explicit operations and
     visible outcomes; every lifecycle failure appears in its surface state;
     sign-out failure deterministically preserves the exact source state.
  7. Initial bootstrap/adoption cannot transition to offline learning before
     one authenticated sync succeeds; later verified bound sessions retain the
     declared offline behavior.
  8. Schema/parser reject link validity above 30 minutes, with a negative test;
     all narrative/report tables match the repaired normative model.
- **Required evidence:** updated focused positive/negative contract tests,
  storage-key/read-model comparison proving no duplicate authority, journal and
  deletion interruption walkthrough, lifecycle/surface coverage check,
  typecheck, full tests, contract gate, diff check and a fresh independent QA
  verdict `pass`.
- **Stop conditions:** a correction requires real provider behavior,
  production/legal data or an owner-only retention decision; the repair would
  need runtime code rather than an implementable contract.

**Controller repair slice 1C — cross-device deletion and parser closure
(`completed`)**

- **Objective:** close the five remaining repo-level findings from re-QA
  without changing the selected identity, retention maxima or runtime scope.
- **Scope:** account-deletion cleanup on every previously bound device;
  authority for the durable deletion intent; visible journal-recovery failure;
  semantic parser enforcement for lifecycle/surface and first-sync invariants;
  linear Task 7 then Task 8 dependency.
- **Non-goals:** provider API selection, push/background delivery, instant
  cleanup of an offline device, runtime code, UI design, public policy copy or
  content-report schema implementation.
- **Acceptance criteria:**
  1. A previously bound device that later receives authenticated evidence that
     its account was deleted durably and idempotently removes credentials,
     binding, outbox and account-owned local records, exposes an account-deleted
     result and never enters impossible reauthentication; an offline device is
     honestly documented to retain local data until it reconnects.
  2. The account-deletion intent is a declared device-operational record with
     `remoteSync: never`, minimal fields, explicit persistence/clear boundaries
     and no authority over learning data.
  3. Journal recovery failure is a named visible blocking result for export,
     sign-out and account deletion; each operation preserves the binding and
     verified data until recovery succeeds.
  4. Parser-level negative tests reject a pre-bootstrap offline transition and
     any incorrect lifecycle-operation-to-surface mapping, in addition to the
     existing exact link-expiry guard.
  5. Task 7 depends on Task 3 and produces the public account/privacy/support
     foundation; Task 8 then begins with its closed report contract extension
     and updates those disclosures before any report network path. No cyclic
     dependency remains.
- **Required evidence:** updated YAML/schema/parser negative tests, cross-device
  deletion interruption/wakeup walkthrough, record ownership table, surface
  failure map, dependency check, typecheck, full tests, contract gate, diff
  check and a new independent QA verdict `pass`.
- **Stop conditions:** completion requires a real provider deletion API,
  production device access or an owner/legal change to the 30-day maxima.

**Controller repair slice 1D — exhaustive pre-bootstrap offline invariant
(`completed`)**

- **Objective:** close the sole remaining QA finding by making the parser reject
  every lifecycle edge that enters `offlineAuthenticated` from a non-offline
  source except the declared `enterOffline` transition from
  `authenticatedReady`.
- **Scope:** semantic validation in
  `scripts/validateCanonicalProductContract.ts`, focused negative contract
  tests and this Task 1 evidence packet.
- **Non-goals:** changing the valid lifecycle, schema shape, account provider,
  runtime code, UI, persistence or any other Task 1 contract decision.
- **Acceptance criteria:**
  1. The parser enumerates lifecycle transition edges from `inProgress`,
     `success` and every failure target. It permits the canonical
     `enterOffline` operation only when its source is exactly
     `authenticatedReady` and its in-progress and success states are both
     `offlineAuthenticated`; it may also permit a true offline self-loop only
     when every declared source is already `offlineAuthenticated`. Every other
     edge to `offlineAuthenticated` is rejected.
  2. Focused negative tests prove rejection of at least
     `completeInitialSync.success: offlineAuthenticated` and
     `verifyIdentity.success: offlineAuthenticated`, in addition to the
     existing initial-sync offline-failure mutation.
  3. The valid canonical contract still parses unchanged; no new path,
     fallback, metadata label or runtime implementation is added.
- **Required evidence:** parser diff, three negative pre-bootstrap-offline
  cases, focused tests, full tests, typecheck, contract gate, diff check and a
  fresh independent QA verdict `pass`.
- **Stop conditions:** the exhaustive edge rule contradicts another declared
  lifecycle requirement or requires a runtime/product decision rather than a
  parser-only correction.

- **Goal:** define one implementable account model before auth UI or backend
  work begins.
- **Scope:** account purpose, required/optional entry, identity and
  verification, recovery, session expiry, local/remote data ownership,
  local-data adoption, offline behaviour, sync/conflict semantics, deletion,
  retention, privacy/security, deep links and email delivery.
- **Non-goals:** provider selection before requirements, UI implementation,
  compatibility with pre-production storage or a second parallel data path.
- **Inputs:** owner requirement, `ADR-003`, canonical product contract,
  persistence/security contracts, current local repositories and complete
  launch surface inventory.
- **Acceptance criteria:** one approved end-to-end lifecycle exists for
  register, verify, sign in, recover, reauthenticate, sign out and delete;
  every local/remote data transition is explicit; account and deletion states
  are mapped to routes/surfaces; obsolete no-auth contract statements are
  retired; no provider or fallback is selected without satisfying the
  contract.
- **Verification:** architecture review against the current repository,
  threat/data-flow review and route/data-state walkthrough.
- **Required evidence:** updated canonical contracts, decision record, data-flow
  model and implementation slices with acceptance criteria.
- **Risk:** adding login forms before deciding data ownership would create two
  competing products and unsafe silent merge/loss behaviour.
- **Report target:** `docs/reports/launch-001-account-data-contract.md`.

### Completed Task 2 — canonical visual shell and component rules (`done`, not active)

Task 2 closed under the previous contract after independent QA `pass`. Its
detailed Slices 2A–2C remain below as historical acceptance evidence. The
duplicated report was removed during Directive 1; Git history preserves it,
while current direct evidence remains in source, tests, and
[`designs/product-direction-options/DESIGN.md`](designs/product-direction-options/DESIGN.md).

**Controller slice 2A — shared shell/header ownership (`completed`)**

- **Smallest coherent objective:** replace the two competing branded/native
  header implementations with one visual component and make header, safe-area
  and scroll ownership explicit without redesigning route content.
- **Confirmed repository facts:** `RootNavigator` mixes native-stack headers
  on nine routes with `headerShown: false` on the others; five feature screens
  render `AppStackHeader`, Home renders `AppShellHeader`, and active learning
  uses `Screen`/`SessionShell`; `Screen` already owns safe-area and optional
  scrolling; `focus-lab-core-shell-001` is approved and maps components,
  navigation and Home to the Quiet Layered reference; current screenshots show
  the header mismatch and a clipped setup title.
- **Assumption:** active question/session top bars remain task-specific
  semantic controls, but their outer geometry continues through the same
  `Screen` contract; they are not a second branded navigation header.
- **Scope:** one reusable branded header with optional back action and route
  context; native-stack integration; replacement and deletion of
  `AppStackHeader`; explicit documentation/tests for header, safe-area and
  scroll ownership; representative static coverage for Home, nested Settings,
  setup, session and result.
- **Non-goals:** changing route content, fixing card hierarchy, redesigning
  outcomes, authentication, new navigation routes, new tokens, per-screen
  spacing exceptions or visual-evidence claims before capture.
- **Acceptance criteria:**
  1. All branded navigation headers render through one component; the old
     `AppStackHeader` implementation and imports are deleted, not wrapped or
     retained.
  2. Native-stack routes and inline-header routes show the same Patternly mark,
     title scale, optional context and accessible back action; fallback back
     navigation is explicit and never silently changes product state.
  3. `Screen` remains the sole general page safe-area/scroll owner, while
     `SessionShell` remains its declared active-session specialization; no
     feature adds a parallel safe-area or top-level scroll shell.
  4. Focused tests guard the one-header path, route coverage, accessibility,
     long-copy shrink/reflow and representative shell ownership.
  5. The design/reference and Task 2 report state exact ownership and do not
     claim screenshots or platform parity before capture.
- **Required evidence:** file/reference inventory before and after, focused
  tests, typecheck, full tests, contract gate, diff check, dead-code search and
  independent QA `pass` for Slice 2A.
- **Stop conditions:** the approved reference conflicts with a required
  platform navigation behavior, the custom native header cannot preserve safe
  areas/accessibility on supported platforms, or completing the slice requires
  per-screen product redesign.

**Planned closure slices after 2A:** 2B verifies and consolidates the existing
type/spacing/card/action/state primitives without adding a second design
system; 2C captures the bounded Home, nested Settings, setup, session and
result evidence on iOS and Android and repairs only shell-level regressions.

**Controller addendum 2A.1 — deleted navigation path ownership
(`completed`)**

- **Objective:** make the contract gate recognize the approved shell authority
  for the real shared feature-navigation directory after deletion of the old
  header.
- **Scope:** add `src/features/navigation/` to canonical UI ownership under
  `focus-lab-core-shell-001`, update the exact ownership test and correct the
  2A report evidence.
- **Non-goals:** restoring `AppStackHeader`, weakening the gate, adding a
  deletion exception, changing UI behavior or mapping unrelated feature code.
- **Acceptance criteria:** the deleted header and retained bottom-navigation
  code resolve to the approved shared-shell reference; the exact mapping is
  test-covered; `npm run gate:contract-change -- HEAD` passes on the actual
  working diff.
- **Required evidence:** focused canonical/gate tests, full tests, typecheck,
  diff check and controller verification before independent QA.

**Controller repair 2A.2 — headerless session-route branches
(`completed`)**

- **Objective:** close the independent-QA finding that a stack-headerless
  practice-session route has direct conflict, unavailable and misroute states
  without either the branded shell header or the active-session shell.
- **Scope:** add the shared inline shell header to every non-active direct
  `Screen` branch of `PracticeSessionScreen` and to Certification preparation/
  unavailable branches reached through that same route; add state-specific
  regression assertions and correct the 21-route ownership evidence.
- **Non-goals:** changing session content, lifecycle, Certification runtime,
  active-session top bars, route definitions, error copy or navigation
  outcomes.
- **Acceptance criteria:** every stack-headerless practice-session branch is
  either an active/preparing `SessionShell` state, the existing Certification
  active semantic top bar, or a non-active `Screen` with `AppShellHeader` and
  explicit back-to-Practice behavior; tests enumerate misroute, conflict,
  loading/preparing and unavailable branches rather than infer coverage from
  one nested surface.
- **Required evidence:** focused shell/session tests, typecheck, 413+ full
  tests, contract gate against `HEAD`, diff check, corrected report and fresh
  independent QA `pass`.

**Controller slice 2B — canonical pending-state primitive and ownership
(`completed`)**

- **Smallest coherent objective:** add the one missing shared visual-state
  primitive and replace every confirmed generic pending presentation with it,
  while preserving the existing specialized session-state surfaces.
- **Confirmed repository facts:** the shared component directory already owns
  canonical `Button`, `Card`, `EmptyState`, `InfoBlock`, `SectionHeader`,
  `ListRow`, `SettingsGroup`, `Badge` and `MetricCard` implementations, but has
  no loading/pending primitive. Thirteen user-visible generic pending branches
  currently render a blank shell, raw text, a section heading, an `EmptyState`,
  or a false pre-load empty/onboarding state: application content preparation;
  Home; Practice Hub; Topic Roadmap; Practice Setup; Algorithms scope selection;
  Certification practice preparation; Algorithms practice summary; generic
  result; exam review; exam preparation; mistakes review; and answer review.
  The Interview Simulation result additionally renders a verification failure
  before its first result read finishes. Active Algorithms practice and
  Interview Simulation already have semantic preparing/operation projections
  through their specialized session surfaces.
- **Scope:** one exported `LoadingState` composed from existing tokens and
  `Card`; migration of the thirteen confirmed generic pending branches;
  an explicit loaded state where `null` currently conflates pending with an
  empty result; correction of the Interview Simulation result's first-read
  projection to its existing semantic preparing state; removal of superseded
  loading styles/imports; exact component-ownership rules, focused tests and
  Task 2 evidence updates.
- **Non-goals:** changing data reads, lifecycle transitions, retry/error copy,
  active-session preparing or durable-operation panels, result content, card
  hierarchy outside pending states, token redesign, new abstract state systems,
  screenshot claims or unrelated raw controls.
- **Acceptance criteria:**
  1. `LoadingState` is the single generic pending-state component, uses the
     existing `Card`, palette, spacing and typography contracts, supports a
     title and optional description, announces a busy progress state to assistive
     technology and allows large text to reflow without truncation.
  2. All thirteen inventoried generic pending branches use `LoadingState`;
     none uses `EmptyState`, a bare `Text`, a section heading, a blank shell or
     a pre-load empty/onboarding result to represent pending work.
  3. The Interview Simulation result distinguishes its initial read from a
     verified failure through its existing specialized session projection; the
     active-session preparing and durable-operation surfaces remain specialized
     and are not duplicated by `LoadingState`.
  4. The existing shared components remain canonical and no equivalent wrapper,
     per-feature primitive, compatibility branch or hidden fallback is added;
     superseded loading styles and imports are removed.
  5. Focused tests enumerate the generic inventory, component accessibility and
     reflow contract, specialized exemptions and false-empty corrections; the
     design reference and report state the ownership boundary without claiming
     device parity before Slice 2C.
- **Required evidence:** before/after branch inventory, focused tests,
  typecheck, full tests, contract gate against `HEAD`, diff check, dead-code
  search and fresh independent QA `pass` for Slice 2B.
- **Stop conditions:** a pending branch cannot be distinguished from a real
  empty/error state without changing its canonical application contract, or
  consolidation would require replacing a durable session-operation surface.

**Controller repair 2B.1 — exact-file UI ownership (`completed`)**

- **Objective:** resolve the contract gate without assigning a visual design
  reference to non-UI content-application modules or moving runtime ownership
  only to satisfy a tooling limitation.
- **Confirmed repository facts:** UI ownership currently accepts only directory
  prefixes; `src/content/application/` contains the React
  `ContentPreparationGate` beside six non-UI content modules, so mapping the
  whole directory would be false. Moving the gate changes root `App.tsx`, which
  has the same directory-only ownership problem, and a deleted old path remains
  part of the gate's complete diff. The gate already selects the longest
  ownership match, but uses raw prefix matching for every entry.
- **Scope:** keep `ContentPreparationGate.tsx` at its existing canonical path;
  extend the ownership schema and validator to accept a precise `.tsx` file
  path in addition to directory prefixes; make exact-file entries match only
  path equality; map only this gate file to the approved shared-shell reference;
  add collision, neighboring-file and directory-boundary tests.
- **Non-goals:** moving the gate, changing bootstrap/recovery/content behavior,
  mapping `src/content/application/`, weakening UI-change detection, permitting
  arbitrary file types, changing unrelated ownership entries or adding a gate
  exception.
- **Acceptance criteria:** directory ownership retains boundary-safe prefix
  behavior; an exact `.tsx` entry matches only the identical file and not a
  similarly named or neighboring path; the gate file has approved ownership;
  neighboring content modules remain unmatched; no root import or runtime path
  changes; the contract gate passes against the complete `HEAD` diff.
- **Required evidence:** focused schema, validator, gate, ownership and Slice 2B
  tests, typecheck, full tests, gate against `HEAD`, diff check and dead-path
  search.

**Controller repair 2B.2 — terminal read failures and loaded-null truth
(`completed`)**

- **Objective:** close independent QA's `fail` by ensuring every migrated
  generic read stops announcing busy after a settled failure and every loaded
  missing-track result replaces stale state.
- **Confirmed repository facts:** Home, Practice Hub, Topic Roadmap, Practice
  Setup, Exam Review and Mistakes Review have real rejecting read paths but no
  terminal read-failure presentation; after rejection they retain a busy
  `LoadingState`. Practice Hub, Topic Roadmap and Practice Setup update
  `activeTrackId` only for a truthy result, so a later canonical `null` leaves
  an earlier track visible. The exact-file matcher has neighbor, suffix and
  independent directory tests, but no test proving that an exact entry wins
  when a broader directory entry also matches.
- **Scope:** add an explicit unavailable read state to the six named owners,
  clear pending on both resolve and reject, render the existing `EmptyState`
  with scoped failure copy and existing navigation where applicable; assign
  the resolved track including `null` in the three track owners; reset Exam
  Review's route-keyed rows before a new read; add rejected-read, loaded-null
  and exact-over-directory precedence regressions; correct the Slice 2B report.
- **Non-goals:** retry controls, changing repository/read-model behavior,
  preserving stale data after failure, new state abstractions, lifecycle or
  navigation changes, moving components, renaming the ownership field, or
  changing pending/error content outside the six named owners.
- **Acceptance criteria:**
  1. A rejected read in each of the six owners ends busy state and renders an
     explicit unavailable `EmptyState`; none falls through to stale data,
     onboarding, empty content or indefinite loading.
  2. Practice Hub, Topic Roadmap and Practice Setup apply both non-null and null
     resolved track values, while an explicit route track remains authoritative
     where its existing route contract requires it.
  3. Exam Review cannot display rows from a previous session while a new
     route-keyed read is pending or after that read fails.
  4. Tests exercise rejected-read and loaded-null source boundaries, and prove
     an exact-file ownership entry wins over a simultaneously matching broader
     directory entry; the bounded `sourcePathPrefix` name remains unchanged.
  5. Report claims are corrected; focused/full tests, typecheck, real gate,
     diff check and fresh independent QA all pass.
- **Required evidence:** six-owner branch inventory, focused Slice 2B and gate
  tests, typecheck, full tests, `gate:contract-change -- HEAD`, diff check,
  dead/stale-state search and fresh QA `pass`.

**Controller repair 2B.3 — route-keyed read identity (`completed`)**

- **Objective:** prevent the pre-effect render of a prior route result under a
  new session or track identity.
- **Confirmed repository facts:** effect cleanup prevents a late old promise
  from committing after the effect changes, but `useEffect` and
  `useFocusEffect` run after render. Exam Review can therefore render prior rows
  once under a new `sessionId`; Topic Roadmap and Practice Setup can render a
  prior track/attempt set once under a new route `trackId`. The current tests
  assert resets inside effects but do not exercise key A to key B.
- **Scope:** in Exam Review, Topic Roadmap and Practice Setup only, associate
  pending/resolved/unavailable local read state with the request key captured by
  that read; before any loaded/error rendering, treat a state-key mismatch as
  pending; preserve the existing live guard and explicit route-track authority;
  replace the reset-only assertions with A-to-B identity regressions covering
  pending, late resolve and reject.
- **Non-goals:** a shared route-read abstraction, changing navigation or read
  models, retry controls, keying unrelated local form state, focus-refresh
  redesign, or changing Home/Practice Hub/Mistakes Review.
- **Acceptance criteria:**
  1. No row, track, attempt or error created for request key A can render under
     current key B, including the render before B's effect runs.
  2. A late resolve or reject for A remains ignored after B starts; B alone may
     publish its ready or unavailable state.
  3. Explicit route track remains authoritative and stored `null` remains a
     valid loaded result; the new key guards do not create a fallback.
  4. Focused regressions prove A-to-B pending, late resolve and reject behavior
     from the implemented local state contract; full verification and fresh QA
     return `pass`.
- **Required evidence:** current-state inspection for the three owners, focused
  route-key/read-owner tests, typecheck, full tests, real contract gate, diff
  check, stale-key search and independent QA `pass`.

**Controller slice 2C — fresh bounded shell evidence (`completed`)**

- **Smallest coherent objective:** prove the shell completed in 2A/2B on the
  supported mobile platforms and repair only shell-level regressions that are
  visible in that proof.
- **Confirmed repository facts:** the approved Quiet Layered reference requires
  side-by-side comparison, dark/light evidence on iOS and Android, and
  small-screen/larger-text checks. The 2026-07-30 evidence predates the current
  header and pending-state changes, has no dark-theme capture and records a
  transient Practice Hub plus a large-text hierarchy defect. The partial
  2026-07-31 pack is iOS/light/regular only and stopped at Appearance while the
  old clipped header still existed. Neither pack can close this slice. A booted
  iPhone 17 simulator, an available narrower iPhone 16e simulator, an attached
  Android emulator and Maestro 2.6.1 are available at slice start.
- **Scope:** one capture-only Maestro journey using deterministic audit state;
  fresh Home, Custom Practice setup, active Algorithms session, partial-session
  result/summary, Settings root and nested Appearance checkpoints; standard
  light and dark runs on iOS and Android; a narrower/larger-text run on each
  platform; immutable screenshot, environment, coverage, blocker and run
  manifests under one new timestamped evidence pack; side-by-side comparison
  with `option-3.png`; shell-only repairs discovered by those checkpoints,
  followed by a fresh capture of every affected matrix cell.
- **Non-goals:** a new broad product audit, redesigning route content or result
  hierarchy assigned to later tasks, adding routes or fake state, changing
  learning data to make screenshots attractive, treating old images as current
  evidence, tablet/store assets, screen-reader certification, physical-device
  claims or changing emulator settings without restoring them.
- **Acceptance criteria:**
  1. The fresh pack records commit/worktree identity, app/build/runtime,
     simulator/emulator identity, platform, theme, text profile, exact flow and
     result for every run; failures remain explicit in `blockers.md` and never
     appear as captured success.
  2. Standard light and dark evidence exists on both iOS and Android for all
     six checkpoints. Each checkpoint is captured only after its stable
     semantic selector is visible; transient refreshing/loading frames do not
     satisfy ready evidence.
  3. A narrower-device/larger-text run on each platform covers the same six
     checkpoints and proves reachable primary actions, reflowing headers and
     state copy, non-overlap, non-truncation, safe areas and scroll ownership.
  4. A contact sheet or equivalent side-by-side comparison pairs the approved
     `option-3.png` with the fresh checkpoints. The review judges shell,
     hierarchy, spacing, contrast, card/action/state primitives and records any
     later-task content defect without repairing it in Task 2.
  5. Every in-scope shell regression is repaired in the one canonical path,
     obsolete code is removed, focused/full tests, typecheck, contract gate and
     diff check pass, affected screenshots are recaptured, and independent QA
     returns `pass`. No device/theme parity claim is made for a missing cell.
- **Required evidence:** capture-flow diff, screenshot manifest with all 36
  expected checkpoint cells (24 standard theme/platform plus 12
  narrower/larger-text), environment and run reports, contact-sheet comparison,
  controller visual inspection, focused/static checks, full tests, typecheck,
  contract gate, diff check, dead-code search and independent QA `pass`.
- **Stop conditions:** the current app cannot be installed or launched on one
  required platform after bounded environment repair; a required runtime needs
  credentials or production data; the only correction would be an out-of-scope
  product redesign; or a platform/tool failure cannot be distinguished from an
  application failure with repository-local evidence.

**Controller environment repair 2C.1 — clean iOS narrow launch (`completed`)**

- **Objective:** distinguish a stacked first-launch system prompt from a real
  inability to run the current development build on the iPhone 16e profile.
- **Confirmed facts:** the same `Patternly.app` installs on iOS 18.6; the first
  XXL attempt produced no checkpoint screenshots because the system
  `Open in Patternly` confirmation remained visible after two Maestro-reported
  taps and the audit listener never became ready. The simulator was restored to
  its baseline `large`, light, shutdown state, and the failed assertions plus
  two diagnostic screenshots are preserved in the pack.
- **Scope:** one clean simulator boot; the already installed identical build;
  exactly one dev-client URL open; the existing repository dev-menu/listener
  flows; one retry of the six-checkpoint capture at
  `extra-extra-large`; complete restoration afterward.
- **Non-goals:** changing app code, rebuilding a different binary, adding a
  product fallback, repeated prompt heuristics, deleting blocker evidence or
  claiming success from diagnostic screenshots.
- **Acceptance criteria:** listener-ready is observed after the single launch,
  all six checkpoint assertions and images complete at XXL, exact flow hashes
  and runtime state are recorded, and the simulator returns to baseline. If the
  listener still cannot become ready, the profile remains explicitly blocked
  and no further environment workaround is attempted in Task 2.
- **Required evidence:** pre/run/post simctl state, exact command/flow result,
  six checkpoint hashes on success or retained diagnostic hashes on failure,
  and an updated manifest/coverage/blocker report.

**Controller repair 2C.2 — canonical first-use/returning track precondition
(`completed`)**

- **Objective:** make the single visual-shell capture journey normalize to
  Algorithms from either valid post-reset Home state.
- **Confirmed facts:** clean repair 2C.1 made the listener ready after one URL,
  proving the iPhone 16e runtime works. Its unified run then stopped with zero
  screenshots because a fresh install correctly rendered `Choose a track` and
  `Start Algorithms`, while the flow required the returning-user
  `change-track` control. The existing canonical RC bootstrap already solves
  this exact state split with a conditional `change-track` tap followed by the
  one shared Algorithms selector.
- **Scope:** replace the unconditional returning-user precondition in the one
  capture flow with that existing conditional bootstrap pattern; retain the
  exact post-selection Algorithms assertion; rerun only iOS narrow/XXL/light
  through the already proven clean launch sequence and restore the simulator.
- **Non-goals:** resetting the track preference, inventing fixture state,
  separate first-use/returning capture implementations, optional success
  assertions, product code changes or another runtime-launch workaround.
- **Acceptance criteria:** both a fresh no-track state and a persisted
  non-Algorithms state converge through the visible canonical picker to the
  same Algorithms Home; no branch skips the final Algorithms assertion; iOS
  narrow produces six valid checkpoint images or fails on the first real
  in-flow assertion; flow revision/hash and restoration evidence are recorded.
- **Required evidence:** capture-flow diff against the failed revision,
  canonical-bootstrap pattern comparison, exact Maestro result, six hashes on
  success, original-resolution inspection and updated pack truth.

**Controller repair 2C.3 — valid Android narrow viewport and canonical setup
scroll (`completed`)**

- **Objective:** replace an invalid compatibility-scaled Android attempt with a
  real full-surface 360×800 dp / font-scale 1.5 capture and allow the flow to
  reach setup through the owning Practice scroll container.
- **Confirmed facts:** the attempted PNG is 720×1600, but the application
  surface occupies only about 549×1219 pixels with white space to its right and
  below. That ratio is `320/420`, matching the new/old density ratio, so the
  running Activity was compatibility-scaled after the density override. Its
  clipping cannot be attributed to product layout and checkpoint 010 is not
  valid matrix evidence. The Practice hierarchy independently confirms a real
  scroll owner and the canonical `open-setup` action below its initial
  viewport; the flow currently taps without scrolling.
- **Scope:** demote the attempted Home and Practice images to non-matrix
  diagnostics; apply size/density/font overrides before a force-stop and
  canonical dev-client relaunch; prove the application/root viewport fills the
  720×1600 display before capture; add one `scrollUntilVisible` for
  `patternly:practice:open-setup` in the existing Practice owner; rerun the six
  Android narrow/light checkpoints and restore all overrides.
- **Non-goals:** UI product changes, preserving the false clipping finding,
  accepting letterboxed/compatibility-scaled evidence, direct navigation to
  setup, optional checkpoint assertions, a second capture flow or changes to
  standard-profile evidence.
- **Acceptance criteria:** pre-capture bounds prove a full 720×1600 application
  surface at 360×800 dp and font scale 1.5; the only flow change is canonical
  Practice scrolling before the existing action; all six assertions and PNGs
  complete or the first genuine full-surface failure remains explicit; each
  image is inspected at original resolution; the emulator returns to physical
  1080×2400, density 420, font scale 1.0 with no overrides.
- **Required evidence:** invalid-attempt ratio calculation and demotion,
  pre/run/post display and root-bounds evidence, flow diff/hash, exact Maestro
  result, six checkpoint hashes, original-resolution review and pack truth.

**Controller repair 2C.4 — fixed-tab-aware capture scrolling (`completed`)**

- **Objective:** make the capture journey tap scroll-owned actions only after
  they are positioned outside the fixed tab bar.
- **Confirmed facts:** the valid full-surface Android hierarchy gave the
  Algorithms Continue action bounds `[81,1420][639,1528]` and tab-bar bounds
  `[0,1409][720,1600]`. The action was fully occluded by the tab bar even
  though Maestro's hierarchy visibility was 100%; its center tap selected the
  Progress tab. This proves neither a track-selection navigation failure nor a
  product layout defect while the owning scroll view can still reposition the
  action. The existing session-start boundary already centers its scroll target.
- **Scope:** set `centerElement: true` for the Algorithms selector and Practice
  setup entry scroll boundaries before their existing taps; retain selectors,
  final assertions and the one flow; repeat the guarded cold Android narrow
  run, requiring post-scroll actions to be outside the tab bounds.
- **Non-goals:** coordinate taps, direct navigation, optional assertions,
  changing tab/product layout, hiding an inability to scroll, modifying other
  capture boundaries or accepting Progress as a successful selection.
- **Acceptance criteria:** both scroll targets are repositioned above the tab
  bar and receive their own taps; Algorithms Home and setup assertions pass;
  all six checkpoints complete, or a failed ability to reposition becomes a
  product-shell repair with exact bounds evidence; emulator restoration and
  full-surface guards remain mandatory.
- **Required evidence:** command-log before/after bounds, flow diff/hash, exact
  Maestro result, six PNG hashes, visual inspection and restored-device proof.

- **Goal:** remove competing navigation and layout patterns.
- **Scope:** shell, headers, safe areas, scrolling, type scale, spacing, cards,
  actions and standard state components.
- **Non-goals:** per-screen content changes or new product functionality.
- **Inputs:** launch surface inventory, highest-severity screenshot findings,
  current shared components/tokens and approved design reference
  `focus-lab-core-shell-001`.
- **Acceptance criteria:** one documented and implemented pattern for each
  listed primitive; no duplicate shell/header path remains; representative
  screens pass screenshot comparison.
- **Verification:** component tests and iOS/Android reference screenshots.
- **Required evidence:** before/after comparisons for Home, nested settings,
  setup, session and result.
- **Risk:** per-screen exceptions would preserve the current inconsistency.
- **Historical report:** removed as duplicated task evidence during Directive 1;
  retained in Git history.

### Task 3 — authentication and account surfaces (`active`; bounded server
sync, snapshot and durable adoption transport passed QA; the first reachable
mobile account vertical is next; external owner/provider/cloud branches remain
parked under `PO-033`)

- **Goal:** implement the complete account lifecycle defined in Task 1.
- **Scope:** account entry, register, verification, sign-in, forgot/reset,
  expired session/reauthentication, account/profile, sign-out, account
  deletion, local-data adoption and sync/conflict surfaces when required.
- **Non-goals:** social providers or extra identity methods not selected by the
  contract; fake offline success; hidden account bypass.
- **Inputs:** completed Tasks 1–2, the route/state inventory and local/emulator
  action, privacy and account-deletion destinations sufficient for truthful
  pre-market lifecycle evidence. Task 7 later completes Settings/support
  access; public promotion remains a release-gate input, not a Task 3 input.
- **Acceptance criteria:** every required success, validation, network,
  duplicate identity, invalid credential, expired link, rate-limit, offline,
  reauthentication, merge/conflict and deletion branch has a truthful
  user-visible result; one canonical account/data path exists; obsolete
  no-account UI and unreachable code are removed.
- **Verification:** service/use-case tests, navigation/deep-link tests, security
  and privacy boundaries, two-platform account lifecycle flows and clean
  register/sign-in/delete runs.
- **Required evidence:** state matrix, before/after route captures, backend/data
  contract evidence and deletion proof without private user data.
- **Risk:** incomplete deletion or local-data adoption will cause store-policy
  failure or irreversible user data loss.
- **Report target:** `docs/reports/launch-003-account-surfaces.md`.

**Controller prerequisite 3A — real provider-backed account foundation
(`identity/data provider, retention, pre-market Hosting policy and account
design resolved; production-shaped implementation started; custom public-
deletion email provider requires owner selection`)**

- **Smallest coherent objective after unblock:** establish the one real
  production identity/account-data path that every Task 3 surface will use.
  This slice must include a conforming provider/backend adapter, secure token
  boundary, canonical binding/sync persistence, verified HTTPS links and
  sandbox lifecycle proof. A port-only or screen-only slice would be
  unreachable scaffolding and is therefore not an acceptable partial result.
- **Confirmed repository facts:** no auth/account runtime, account route,
  provider dependency, client environment schema or OS-protected token store
  exists. `RootNavigator` still enters Home directly through its 21
  non-account routes. The production Android privacy plugin removes `INTERNET`
  and `ACCESS_NETWORK_STATE`; the runtime privacy gate rejects every
  `fetch`/XHR/WebSocket/axios client. iOS has no associated-domain entitlement,
  Android has no HTTPS app-link association, and the development audit listener
  handles only deterministic reset commands. Canonical storage has no account
  binding, sync outbox/revision or deletion-intent keys. The repository contains
  no public privacy, support or account-deletion destination. Current `Your
  data` / Settings copy truthfully says the present build has no account or
  sync and must be retired only when the real cutover exists.
- **Locked owner decision (`PO-020`, 2026-08-01):** use standard Firebase
  Authentication with email and password, Firestore Standard and Cloud Run in
  `europe-central2` (Warsaw). Do not use Identity Platform or Cloud SQL for the
  launch path. The mobile app never reaches Firestore directly: one Patternly
  application boundary calls the regional Cloud Run API, which verifies
  Firebase ID tokens and exclusively owns Firestore transactions, privileged
  identity operations and remote deletion. Client Firestore offline
  persistence and its automatic synchronization are not part of the product.
  `PO-020` did not select a public host. `PO-025` now selects the Firebase
  Hosting Emulator as the sole pre-market local serving path while leaving the
  professional market host/provider and owned domain to gate 11A. The provider
  decision, canonical limitation, 3A/3B boundary and cost/security constraints
  passed independent QA on 2026-08-01; the PO-025 reconciliation also passed
  independent QA after two focused repair cycles.
- **Confirmed current project state and remaining external gaps:**
  `patternly-app-sandbox` and `patternly-app-production` now exist as distinct
  `ACTIVE` Firebase/GCP project shells and are listable through the authenticated
  Firebase CLI session. Prerequisite 3B now also fixes the cost, keyless
  identity, secret-injection and fail-closed environment policy with independent
  QA `pass`; concrete identities and resources remain merged into the first
  production-shaped 3A deployment. No public host/provider is active, and the
  repository has no static Hosting artifact, deploy target, preview/live deploy
  script, public privacy destination or public account-deletion destination. The
  owner-controlled domain/DNS, public deployment, transactional-email sender
  domain and signed association proof are deliberately deferred to the last
  safe release gate before Tasks 12–13. The account design is approved; the
  immediate Task 3 owner inputs are the exact sandbox principal, IAM/bootstrap
  risk, enumerated resource mutation and local build-path decisions in 3A-3.
- **Canonical extension points after unblock:** compose the account gate in
  `App.tsx`; extend `applicationBootstrap` so verified account binding and first
  sync/adoption complete before content/Home; add one account route group to
  `RootNavigator`, navigation types and route constants; extend the existing
  canonical repositories/keys and journal-first mutation path with binding,
  revision, outbox and deletion intent; replace the blanket offline production
  boundary with one closed approved-client/logging boundary; implement local
  action-link handling without freezing native association identity; remove
  obsolete no-account copy at the actual cutover. Public Hosting promotion and
  native association configuration remain downstream release work.
- **Scope after unblock:** one fail-closed environment schema; one account
  application/service boundary and one Firebase/Cloud Run adapter covering the
  complete identity and account-data API; OS-protected refresh-token
  storage with memory-only access tokens; canonical account binding, sync
  metadata/outbox and crash-recoverable deletion intent; production networking;
  local/emulator verification/recovery/public-delete link intake; provider
  sandbox create → verify → sign-in → reauthenticate → delete conformance and
  sanitized deletion proof; bootstrap gating with no anonymous path to Home.
- **Non-goals:** account UI/routes before the foundation is reachable; social
  or anonymous identity; direct provider SDK calls from screens; a second
  learning repository; local fake success; generic unused ports; mock provider
  production code; permissive network access; provider-specific compatibility
  paths; Hosting live/preview deployment, public tunnel, market domain or
  signed native association proof; billing or analytics.
- **Acceptance criteria after unblock:**
  1. Missing or incomplete environment configuration fails closed before any
     account/network operation; secrets stay outside Git and only declared
     non-secret client values reach the app.
  2. Exactly one service boundary and one real adapter cover every canonical
     identity, session, account-data, sync and deletion operation with the
     contract's explicit bounded outcomes; no screen or family runtime reaches
     the provider directly.
  3. Passwords and possession tokens are never persisted or logged; access
     tokens are memory-only; refresh tokens use an OS-protected store and are
     sent only to the declared token endpoint.
  4. Verification, recovery and public-deletion handling uses local Auth/action
     link evidence with distinct single-use tokens and the 30-minute maximum;
     replay, expiry, rate-limit and non-enumeration tests pass. This Task 3
     evidence cannot claim a public callback or signed association; the owned
     HTTPS domain and live proof remain mandatory at the release-promotion gate.
  5. Learning writes remain local journal-first and enqueue exactly once;
     expected-revision conflicts, immutable collisions and active-session
     divergence block without silent overwrite or a second authority.
  6. Account deletion is reauthenticated, idempotent and restartable, revokes
     every session, verifies remote absence and then verifies local cleanup;
     provider live retention is zero, backup retention never exceeds 30 days
     and the five-field deletion proof remains for exactly 30 days.
  7. Home and track selection are unreachable before verified first sync and
     explicit adoption resolution; no feature flag, audit path or offline state
     becomes an anonymous account bypass.
  8. The old blanket network-ban tests are replaced, not weakened, by an exact
     approved-client/field/logging boundary; native network changes, local link
     handling and provider sandbox lifecycle pass without freezing or claiming
     signed App Links/Universal Links.
  9. Every protected API request derives UID solely from a successfully
     verified Firebase ID token. A caller-selected account/UID mismatch is
     rejected, and sensitive account, security and destructive operations also
     perform the revoked-token check before any state change.
- **Required evidence after unblock:** provider capability matrix; approved
  environment schema and negative tests; application/service conformance tests;
  canonical repository, journal, outbox, conflict and restart tests; native
  permission and local/emulator link-intake proof; sandbox
  replay/expiry/non-enumeration/rate-limit/offline/deletion drills; sanitized
  lifecycle and remote-deletion proof; token/UID/revocation conformance tests;
  typecheck, full tests, privacy boundary, contract gate, diff check and
  independent QA `pass`.
- **Controller slice 3A-3 — complete provider-backed account foundation
  (`owner authorization received` for the base packet; Cloud Build replacement
  preflight QA `pass` and exact replacement mutation authorization received;
  owner approved the Thirteenth packet; email-processor contract reconciliation
  and the local server-core repair passed independent QA; local implementation
  continues before every deferred cloud mutation):**
  - **Objective:** implement the one production-shaped account foundation
    required by every Task 3 surface: complete identity/session operations,
    canonical local binding and outbox, all seven first-binding adoption cases,
    revisioned sync/conflict handling, restartable sign-out/deletion, verified
    local action links and the sandbox Cloud Run/Firestore authority. The same
    slice wires the approved entry/register/verification/sign-in/adoption/sync
    surfaces through verified bootstrap so it is a reachable vertical path, not
    an unused port or backend.
  - **Confirmed repository facts:** `App.tsx` currently places the content gate
    directly above a `RootNavigator` whose initial route is Home;
    `applicationBootstrap` validates only canonical local learning state and
    content; no account route, service, backend, Firebase SDK, environment
    schema, protected token store or account storage keys exist. The native
    privacy plugin removes release `INTERNET` and `ACCESS_NETWORK_STATE`, while
    the runtime privacy check forbids every network client. Firestore remains
    client-deny-all. `firebase.json` has no Hosting artifact or emulator entry.
    The sandbox still has zero registered Firebase applications. Java is
    available. The checksum-verified official Google Cloud CLI works from its
    private absolute path. The approved Podman VM was created but failed before
    SSH/API readiness and is no longer an authorized build path. No competing
    account/backend path exists to keep.
  - **Why the prior smaller slice is removed:** environment-only, port-only,
    provider-only and screen-only changes are unreachable scaffolding. The
    attempted empty-account cut also could not park populated local or remote
    data without inventing a temporary unavailable state or violating mandatory
    adoption preview/confirmation. Those concerns therefore remain one coherent
    foundation. Later Task 3 slices add recovery/profile/destructive UI to this
    same completed service; they do not add a second provider, data authority or
    account path.
  - **Repository scope:** add one production Cloud Run server and one mobile
    account application boundary. The server owns strict Firebase-token
    verification, UID authorization, Firestore transactions, revision/adoption/
    conflict rules, session revocation and remote deletion. The mobile boundary
    owns fail-closed public configuration, Firebase credential commands,
    memory-only access tokens, OS-protected refresh tokens, journal-first local
    learning writes, binding/outbox/deletion-intent repositories and the one API
    adapter. Bootstrap and the approved account/adoption routes prevent Home
    before verified binding and confirmed convergence. The one `/auth/action`
    artifact runs only on the loopback Hosting emulator.
  - **Closed allowed-path matrix for the worker:**
    - mobile configuration/domain/application/infrastructure:
      `src/config/accountEnvironment.ts`, `src/domain/account/**`,
      `src/application/account/**`, `src/infrastructure/account/**` and
      `src/infrastructure/storage/secureTokenStore.ts`;
    - canonical persistence/composition:
      `src/storage/keys.ts`,
      `src/storage/repositories/accountBindingRepository.ts`,
      `syncMetadataRepository.ts`, `syncOutboxRepository.ts`,
      `accountDeletionIntentRepository.ts`, repository `index.ts` and
      `canonicalRepositories.ts`, plus the existing learning mutation files only
      where the outbox is atomically coupled to a verified local commit;
    - reachable bootstrap/UI ownership: `App.tsx`,
      `src/application/bootstrap/applicationBootstrap.ts`,
      `src/content/application/ContentPreparationGate.tsx`, route constants,
      `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts`,
      `src/features/account/**`, the single new account `uiOwnership` entry and
      `src/features/home/YourDataScreen.tsx` only to replace reachable false
      no-account/no-sync copy with the truthful implemented account/data model;
    - native/network/hosting configuration: `app.json`, `package.json`,
      `package-lock.json`, `plugins/withPrivacyBoundary.js`,
      `scripts/validateRuntimePrivacyBoundary.mjs`, `firebase.json`,
      `.firebaserc`, `public/auth/action/**`, one root `Dockerfile`,
      `.dockerignore`, `.gcloudignore`, `cloudbuild.yaml`,
      `server/deploy/cloudbuild-source-lifecycle.json` and
      `server/deploy/artifact-registry-cleanup-policies.json`;
    - server: `server/**` only; tests: new `tests/account*.test.ts`,
      `tests/serverAccount*.test.ts`, `tests/cloudBuildBoundary.test.ts` and
      focused edits to existing bootstrap,
      storage, native-privacy, Hosting-policy and canonical-contract tests;
      evidence docs: this plan,
      `docs/launch-surface-inventory.md` only for the exact route/status delta,
      and
      `docs/reports/launch-003a3-account-foundation.md`.
  - **Forbidden worker scope:** every other feature/screen, learning algorithm,
    content artifact/bank, unrelated repository, Task 4+ route, public deploy
    workflow, production project/configuration, market legal copy, alternate
    backend/client, generated artifact and broad formatting/refactor. A need
    outside the allowed matrix is a stop for controller review, not implied
    permission.
  - **Exact provider scope after explicit authorization — sandbox only:**
    - use the checksum-verified official Google Cloud CLI 578.0.0 ARM64 archive
      installed at
      `/Users/lukaszkurczab/.local/share/patternly-tools/google-cloud-sdk` and
      invoke `gcloud` by absolute path without optional components, a PATH or
      shell-profile change. The failed local Podman VM is not a build path and
      must be removed only after the replacement Cloud Build packet passes QA
      and its exact deletion is authorized. Authenticate the owner interactively with
      `gcloud auth login` and `firebase login --reauth`, never with a local,
      user or developer application-default credential file, a
      service-account key or login JSON output. Verify the normalized active
      account by a hash-only pipeline against
      `9163e547f9028fabed8378b6087c0aced9065eadebb2e09fedc6069e06eeeee7`;
      raw tokens/config files must never enter command evidence. Later commands
      pass project, region and impersonated deployer explicitly rather than
      relying on a default CLI project/profile.
    - register one Firebase Web application with display name
      `patternly-mobile-sandbox` for the Expo JavaScript client; existing
      `firebase.googleapis.com`, `identitytoolkit.googleapis.com`,
      `securetoken.googleapis.com`, `firestore.googleapis.com` and
      `serviceusage.googleapis.com` remain the same; enable only
      `run.googleapis.com`, `artifactregistry.googleapis.com`,
      `iam.googleapis.com`, `iamcredentials.googleapis.com`,
      `cloudscheduler.googleapis.com`, `cloudbuild.googleapis.com` and
      `storage.googleapis.com` if disabled;
    - create `patternly-deployer@patternly-app-sandbox.iam.gserviceaccount.com`,
      `patternly-runtime@patternly-app-sandbox.iam.gserviceaccount.com`,
      `patternly-builder@patternly-app-sandbox.iam.gserviceaccount.com` and the
      OIDC-only
      `patternly-scheduler@patternly-app-sandbox.iam.gserviceaccount.com`; this
      evidence-driven Scheduler identity and the separately authorized build
      identity supersede the 3B-5 assumption that two user-managed identities
      would be sufficient. Create custom
      role `projects/patternly-app-sandbox/roles/PatternlyRuntimeFirebaseAuth`
      with exactly `firebaseauth.users.get`, `.update` and `.delete`, and the
      `europe-central2` Artifact Registry repository `patternly-api`;
    - grant the approved source principal Token Creator only on the deployer;
      grant the deployer temporary project `roles/run.admin`,
      `roles/cloudbuild.builds.editor` and
      `roles/serviceusage.serviceUsageConsumer`, repository-scoped
      `roles/artifactregistry.reader`, plus exact-resource
      `roles/iam.serviceAccountUser` on the runtime, Scheduler and builder
      identities. Grant temporary project `roles/storage.admin` only long
      enough to create the exact source bucket, replace it with bucket-scoped
      `roles/storage.objectAdmin` for upload/cleanup, and remove the project
      bootstrap role plus every build-only role after the build.
      Grant the builder repository-scoped `roles/artifactregistry.writer`,
      bucket-scoped `roles/storage.objectViewer` and project-scoped
      `roles/logging.logWriter` only for the one build, then remove them. The
      Google-managed Cloud Build service agent keeps only its provider-managed
      `roles/cloudbuild.serviceAgent`; it is not the build identity. Grant the runtime project-scoped
      `roles/datastore.user` and the exact custom role; grant no basic role,
      service-account key, project-wide Token Creator/Service Account User or
      Secret Accessor;
    - create exactly one private Standard Storage bucket named
      `patternly-app-sandbox-europe-central2-build-source` in
      `europe-central2`, failing if that exact globally unique name is
      unavailable. Enforce uniform bucket-level access and public-access
      prevention; disable versioning and soft delete; set no retention policy;
      apply lifecycle deletion at age one day. Upload only the strict
      `.gcloudignore` allowlist consisting of the root `Dockerfile`,
      `.dockerignore` and `server/**`; explicitly delete the submitted object
      after the build, with the lifecycle rule only as bounded cleanup backup.
      Use one manually submitted `cloudbuild.yaml`, no trigger, source-deploy
      convenience path, retry or cache. It names the builder SA, uses
      `CLOUD_LOGGING_ONLY`, `e2-standard-2` and a 900-second timeout, performs
      one Docker build/push with a digest-pinned Cloud Builder image, tags only
      by `$BUILD_ID`, records the submitted-source hash manifest and resolves
      the pushed image to its immutable digest. Deploy only that digest to
      `patternly-api` in `europe-central2` with minimum instances zero and
      maximum instances one and an explicit 360-second request timeout.
      Explicitly use `--no-invoker-iam-check` as the public transport for this
      API, not as anonymous application access or a public website; require
      verified Firebase ID tokens/derived UID at the application boundary and
      do not also bind `roles/run.invoker` to `allUsers`. Narrow/remove the
      project-scoped Cloud Run Admin grant after first creation and prove the
      effective result. Remove the deployer's Cloud Build Editor/builder
      `actAs`/Storage grants and all builder data/log/repository grants after
      the successful build; any later build requires a new owner-gated grant.
      Create custom role
      `projects/patternly-app-sandbox/roles/PatternlyArtifactCleanupPolicyAdmin`
      containing exactly `artifactregistry.repositories.update` and
      `artifactregistry.versions.delete`; bind it to the deployer only on the
      exact repository after successful digest deployment, set and read back
      the reviewed cleanup policy, then remove the binding. The keep-most-
      recent rule uses `keepCount=3`, retaining the active digest plus up to two
      existing rollback images; keep rules override matching delete rules.
      Delete versions older than 30 days and untagged versions older than one
      day only when they are not among those three. Do not depend on the
      asynchronous provider dry-run or grant Data Access log viewing.
    - create exactly one regional Cloud Scheduler HTTP job,
      `patternly-deletion-proof-cleanup`, in `europe-central2`, scheduled as
      `0 * * * *` in `Etc/UTC`. It sends `POST` only to
      the provider-returned Cloud Run service origin plus
      `/internal/deletion-proof-cleanup` with a
      Google-signed OIDC token for
      `patternly-scheduler@patternly-app-sandbox.iam.gserviceaccount.com` and an
      audience equal to the provider-returned Cloud Run service origin without
      path or query. The application verifies the Google JWKS signature,
      issuer exactly `https://accounts.google.com`, expiry, audience,
      `email_verified=true`, the exact service-account email and its immutable
      provider-returned numeric unique ID in `sub` before dispatching this
      route; Firebase credentials, a deleted/recreated same-name identity and
      every other Google principal are rejected. The scheduler identity
      receives no project, Firestore,
      Firebase Auth, Cloud Run or service-account role and cannot obtain access
      by being the job's OIDC subject. Because the
      shared mobile API intentionally uses `--no-invoker-iam-check`, do not add
      a redundant `roles/run.invoker` or `allUsers` binding. The Scheduler
      service agent created by Google keeps only its Google-managed
      `roles/cloudscheduler.serviceAgent`; it is never used as the job client
      identity. The deployer receives project-scoped
      `roles/cloudscheduler.admin` plus
      `roles/iam.serviceAccountUser` on only the scheduler identity solely for
      job creation and its first forced-run proof; both grants are removed
      immediately afterward and future job mutation requires a new owner-gated
      bootstrap. Its separate existing `actAs` edge to the runtime identity
      remains used only for Cloud Run deployment. No Pub/Sub topic or queue is
      created.
    - configure five Scheduler retries with 10-second minimum, 300-second
      maximum backoff, three doublings, a 30-minute maximum retry duration and
      a 300-second attempt deadline. The handler has a stricter 240-second
      monotonic wall-time budget. It queries only the five-field deletion-proof
      collection for `completedAt <= now - 30 days`, ordered by `completedAt`
      and then document ID, with a stable value cursor, exactly 100 documents
      per page and at most 20 pages/2,000 documents in one attempt. Each page is
      one atomic Firestore batch delete; an already absent document is success.
      Before the next page and with at least 10 seconds of handler budget left,
      one `limit(1)` probe determines completion. Return `2xx` only when that
      probe is empty. If expired work remains, a query/commit fails, or the
      time/document ceiling is reached, return a bounded `503`
      `cleanup_incomplete_retryable` before 240 seconds so Scheduler retries;
      do not persist another cursor or report partial success. This explicit
      `360s Cloud Run > 300s Scheduler > 240s handler` relation leaves 60
      seconds between each cancellation boundary. All proof reads become
      unavailable at
      `completedAt + 30 days` independently of physical cleanup. The healthy-
      service cleanup SLO is the next hourly invocation plus the configured
      30-minute retry window and final five-minute attempt deadline (at most 95
      minutes after expiry); duplicate at-least-once deliveries are harmless.
      A proof older than that SLO is an explicit failing retention condition,
      never reported as success, and the next scheduled execution continues
      reconciliation after exhausted retries.
    - do not enable Secret Manager, whose secret inventory is empty; do not
      create a Cloud Build trigger, repository connection, default build
      identity, private worker pool, live/preview Firebase Hosting target, public page,
      production resource or production billing link. The sandbox default
      Firebase sender is test evidence only; owned market sender/domain remains
      gate 11A.
  - **Acceptance criteria:**
    1. Missing, placeholder, cross-environment or malformed configuration fails
       before Auth or network work; no default project, URL or credential path
       exists.
    2. Registration, verification/resend/change-email, sign-in, refresh,
       recovery/reset, reauthentication, session revocation, sign-out and
       deletion use the one account boundary/adapter and return every canonical
       bounded outcome without account enumeration outside the declared
       registration/sign-in disclosure boundary.
    3. Passwords and action tokens are never persisted/logged; access tokens are
       memory-only; the refresh token is stored only through the OS-protected
       repository and is sent only to the Firebase token endpoint.
    4. The server rejects missing, malformed, expired, wrong-project,
       unverified or caller-UID-mismatched credentials before Firestore; UID is
       derived only from the verified token and bounded errors contain no token,
       email or private payload.
    5. Dataset emptiness is computed only from account-owned learning records
       and active sessions; `storageMetadata`, device settings, notification
       settings, binding/outbox and deletion-intent records do not make learning
       data populated. Every one of the seven canonical adoption cases renders
       `dataAdoption.preview` with “This device”/“Cloud” summaries and explicit
       confirmation before mutation, returns its exact declared result, keeps
       both last verified datasets on cancel/failure and requires explicit
       selection plus separately confirmed abandonment for divergent sessions.
       Revision conflicts, immutable collisions and irreconcilable records
       block without a default winner or silent overwrite.
    6. Entry, registration, verification, sign-in, adoption and sync/conflict
       routes consume that real foundation; Home/track selection are unreachable
       before verified binding and confirmed first convergence, and offline
       cannot create an anonymous path. Real account source and
       `account-lifecycle-001` ownership enter together.
    7. Mobile networking is reachable only through the enumerated Firebase and
       Patternly API clients; direct mobile Firestore, raw diagnostics and broad
       arbitrary origins remain prohibited. Native release networking and
       backup exclusions both remain explicitly tested.
    8. `/auth/action` is the one real static artifact and handles local
       verification, recovery and public-deletion possession results with
       distinct single-use tokens, 30-minute maximum, replay/expiry and
       non-enumerating request behavior. It is served only by the loopback
       Hosting emulator; no live/preview deployment, site target, public tunnel
       or signed-link/public-domain completion claim exists.
    9. Sign-out recovers/verifies the mutation journal, synchronizes or completes
       a verified export then separately confirms discard, and deletes only
       account-owned local state. Account deletion is recently reauthenticated,
       idempotent and restartable, revokes sessions, verifies remote absence,
       completes local cleanup, retains only the exact five-field proof for 30
       days and cannot restore a deleted account from baseline history/backup.
       The proof is logically unavailable at the exact expiry instant; the one
       authenticated hourly Scheduler route physically deletes it within the
       declared 95-minute configured-delivery SLO for work that fits the stated
       per-attempt/retry ceilings, retries idempotently and exposes every
       overdue proof as a failing retention condition. Neither
       the job nor its route can invoke Firebase-user endpoints or query live account,
       identity, learning, binding, outbox or deletion-intent data.
    10. Sanitized sandbox proof covers register → verify → sign-in → all
        adoption classes → ordered sync/conflict → reauthenticate → sign-out and
        delete, plus replay/expiry/non-enumeration/rate-limit/offline/restart
        negatives, effective IAM, digest, min/max instances, Scheduler
        identity/job/retry configuration, exact-expiry read denial, duplicate
        delivery, the `360s > 300s > 240s` timeout relation, 100-document pages,
        2,000-document attempt ceiling, stable cursor, empty final probe,
        retryable partial-work response, overdue-proof failure and zero client
        Firestore access. Focused/full relevant tests, typecheck, privacy/
        Hosting/contract gates, diff check and independent QA return `pass`.
  - **Non-goals:** the later account-profile, recovery/reset,
    expired-session/reauthentication, sign-out, deletion and public-deletion
    mobile screen closure (their service/link behavior belongs here); Task 7
    Settings/support integration; production cloud resources/billing; market
    domain/sender, live Hosting, signed App Links/Universal Links, analytics,
    social/anonymous auth, direct Firestore, Cloud Build triggers or source
    deploy, Secret Manager with an empty inventory, a second adapter, mock production provider, compatibility
    path, feature flag or hidden fallback.
  - **Required evidence:** allowed-file diff against the closed matrix; exact
    seven-case adoption/result comparison; exact environment and error
    matrices; account storage/restart tests; bootstrap/navigation tests;
    approved-client privacy negatives; server auth/UID/transaction tests; local
    Hosting action-link evidence; unchanged deny-all client rules; sanitized
    sandbox resource/IAM/digest/config/lifecycle packet; sanitized Cloud Build
    ID, exact source hashes, user-specified builder/IAM/log/bucket evidence and
    resolved image digest;
    Scheduler API/job/service-agent/client-identity email+unique-ID/IAM/retry
    evidence and sanitized exact-expiry/physical-cleanup/overdue-proof drills;
    deterministic timeout, page/attempt ceiling, cursor, final-probe and
    partial-work retry tests;
    deletion-first reachability scan over unused components/hooks/services/
    utilities/imports, duplicate routes/state paths, obsolete tests/docs,
    hidden fallback/compatibility branches, placeholder/mock files and stale
    generated artifacts. The debug-only Metro permission injection and every
    old no-account/no-sync statement must be either proven still reachable for
    the remaining pre-cutover build or deleted at the real cutover; any retained
    old path needs a named reason. Controller review and independent QA are
    mandatory.
  - **Owner authorization recorded before external mutation (`PO-028`):** the
    owner authorized the
    exact owner Google principal identified in the approval request and require
    the reauthenticated CLI identity to match its normalized-email SHA-256
    (`9163e547f9028fabed8378b6087c0aced9065eadebb2e09fedc6069e06eeeee7`)
    as the sole source principal for sandbox deployer impersonation; accept the
    temporary sandbox project-scoped `roles/run.admin` bootstrap grant with
    mandatory immediate narrowing; authorize the exact APIs, Firebase app,
    identities, role/bindings, repository, digest push and Cloud Run service
    enumerated above, including `--no-invoker-iam-check` without an `allUsers`
    binding; authorize the evidence-driven correction of 3B-5 from two to four
    user-managed sandbox identities by adding the no-role
    `patternly-scheduler` OIDC principal and the separately scoped
    `patternly-builder` build principal; authorize
    `cloudscheduler.googleapis.com`, the one hourly
    `patternly-deletion-proof-cleanup` job, its Google-managed service agent,
    scheduler-SA OIDC client identity and the deployer's temporary
    `roles/cloudscheduler.admin` plus scheduler-SA `actAs` bindings with
    mandatory removal immediately after first-run proof. `PO-031` supersedes
    only the former local Podman build/push choice with one manual Cloud Build
    path without triggers; its exact API/IAM/bucket/build/cleanup mutation
    remains separately gated until the replacement packet passes QA. The existing 5 PLN all-service
    budget is an alert, not a hard
    stop; the 5 PLN Cloud Run Preview spend cap can apply with delay and covers
    neither Firestore nor Artifact Registry/IAM/API traffic; min-zero/max-one is
    a scaling control that can briefly be exceeded, not a total project cost
    guarantee. One Scheduler job is free only while the billing account has no
    more than three jobs total; otherwise its current list price is USD 0.10
    per 31 days. Its invocations still consume ordinary Cloud Run and Firestore
    reads/deletes. At one hourly empty query this is approximately 744
    invocations and minimum document reads per 31 days. One cleanup attempt is
    capped at 2,000 proof reads/deletes plus its final probe; five configured
    retries can repeat separately metered work, although already deleted pages
    are absent on the next stable scan. These ceilings bound runaway work but
    do not create a billing hard stop. Free quotas are
    billing-account/project usage allowances, not a guaranteed invoice cap.
    Firestore TTL is deliberately not enabled because expiry-to-deletion is
    typically up to 24 hours and TTL deletes do not receive free usage; Cloud
    Tasks is not enabled because per-proof task creation cannot be atomic with
    the Firestore proof and would require a second reconciliation mechanism.
    Production, live Hosting, Cloud Build triggers/source deploy, Cloud Tasks,
    Firestore TTL and Secret Manager remain explicitly unauthorized. The same
    authorization includes interactive owner reauthentication and the verified
    official archive installation described above. Repository implementation may not represent the sandbox
    path as verified until the real evidence exists.
  - **Stop conditions:** the recorded authorization is withdrawn; current
    identity lacks the exact permissions; organization policy prevents the
    approved public-invocation model; Cloud Build requires a default identity,
    trigger, unknown logging destination, non-exact source bucket or broader
    persistent permissions than this packet; the default
    Firebase sender/action flow cannot produce truthful local evidence; any
    adoption case cannot be completed without preserving both verified sides;
    `gcloud` installation/authentication or exact manual-build identity/source
    boundary cannot be proven without a local application-default credential file, a
    key, a different provider/runtime or larger
    resources; cost controls cannot remain min-zero/max-one; Scheduler cannot mint the
    exact scheduler-identity OIDC token or the application cannot verify it
    without accepting another principal/audience; an expired proof remains
    readable at or after exact expiry; physical cleanup or its explicit overdue
    failure cannot be proven within the declared SLO; or implementation
    requires a placeholder, second authority, permissive network path or
    unrelated refactor.
  - **Preflight QA repair packet (2026-08-01; recorded before repair; QA
    verdict `fail`):** independent QA found three blocking defects before any
    worker implementation or cloud mutation.
    - **Finding 1 — adoption boundary:** the empty-only path omitted the
      mandatory `dataAdoption.preview` confirmation, treated device-owned
      metadata/settings as if they made the learning dataset non-empty and did
      not map every populated case to an exact truthful state. A clean install
      could therefore block, while existing data would require a temporary
      unavailable branch.
    - **Finding 2 — owner/cloud authorization:** the packet did not enumerate
      every API/resource/role, did not explicitly authorize the Cloud Run
      `--no-invoker-iam-check` transport, named no stable fingerprint for the
      source principal and understated that the 5 PLN budget is mostly alerting
      rather than one hard cross-service cap.
    - **Finding 3 — worker boundary:** allowed paths and forbidden paths were
      not closed, the deletion-first scan was incomplete, and stale account-
      design blocker wording remained elsewhere in the plan.
    - **Repair objective:** remove the empty-only implementation boundary and
      merge it back into the complete production-shaped 3A foundation. Define
      emptiness only over account-owned learning records and active sessions;
      implement every canonical adoption case and result without a temporary
      unavailable state; enumerate exact repository paths and cloud mutations;
      record the principal through an owner-approved irreversible fingerprint;
      state truthful cost limits; delete stale blocker wording; repeat
      independent preflight QA before seeking owner authorization or delegating
      code.
    - **Non-goals:** weakening the adoption contract, keeping an empty-account
      fast path, adding metadata to hide incomplete cases, starting code/cloud
      work before the repaired packet passes QA, or expanding into account UI
      that remains downstream of the reachable foundation.
    - **Required evidence:** repaired packet diff, exact contract comparison,
      closed allowed/forbidden path matrix, full deletion-first checklist,
      exact owner/cloud decision matrix, whitespace check and repeated
      independent QA verdict.
  - **Second preflight QA repair packet (2026-08-01; recorded before repair;
    repeated QA verdict `fail`):** repeated QA confirmed every first-round
    blocker closed but found that the packet requires physical deletion of the
    five-field proof after day 30 without authorizing any TTL, scheduler or
    other invocation mechanism. Cloud Run `min=0` cannot guarantee cleanup
    without a trigger.
    - **Scope:** compare only provider-native cleanup mechanisms against exact
      expiry, retry/idempotency, least privilege and the owner's low-cost
      boundary; choose one canonical mechanism; enumerate its API, resource,
      identity/IAM edges, invocation authentication, schedule/latency, cost and
      negative evidence in the 3A-3 provider/owner matrix.
    - **Non-goals:** enabling the selected API/resource before owner approval;
      adding a permanent warm instance, Secret Manager value, third account-
      data authority, broad runtime role, analytics retention or an approximate
      TTL claim presented as exact physical deletion.
    - **Acceptance criteria:** proof becomes unavailable at its exact 30-day
      expiry; physical cleanup has one bounded documented latency and retries
      idempotently; the trigger cannot invoke account/user routes or read live
      learning data beyond the expired proof query; all cost/free-tier caveats
      and IAM edges are truthful; the owner decision explicitly authorizes the
      resource; repeated preflight QA returns `pass`.
    - **Required evidence:** current official pricing/behavior sources, repaired
      provider/owner/stop/evidence matrices, no cloud mutation, whitespace
      check and repeated independent QA verdict.
    - **Selected repair pending repeated QA:** use one hourly Cloud Scheduler
      HTTP job and a dedicated no-role `patternly-scheduler` service identity,
      with application-verified Google OIDC on a cleanup-only route. This is a
      narrow evidence-driven correction of the 3B-5 two-identity assumption:
      reusing `patternly-runtime` would make a Scheduler-controlled principal
      also capable of Firestore and privileged Firebase Auth work. Logical
      availability ends
      exactly at `completedAt + 30 days`; physical reconciliation has a
      95-minute configured-delivery SLO, idempotent at-least-once handling and an
      explicit overdue failure. Firestore TTL is rejected because deletion is
      non-instantaneous and typically occurs within 24 hours, and TTL deletes
      are outside the Firestore free quota. Cloud Tasks is rejected because its
      per-proof scheduled task cannot be atomically created with the Firestore
      proof and therefore needs another reconciler. Scheduler pricing is based
      on jobs rather than executions: the first three jobs per billing account
      are free and an additional job is currently USD 0.10 per 31 days; Cloud
      Run and Firestore usage remain separately metered. Sources:
      [Scheduler pricing](https://cloud.google.com/scheduler/pricing),
      [Scheduler delivery and idempotency](https://docs.cloud.google.com/scheduler/docs/overview),
      [Scheduler OIDC identity](https://docs.cloud.google.com/scheduler/docs/http-target-auth),
      [Scheduler retries](https://docs.cloud.google.com/scheduler/docs/configuring/retry-jobs),
      [Cloud Run request timeout behavior](https://docs.cloud.google.com/run/docs/configuring/request-timeout),
      [service-account ID-token claims](https://docs.cloud.google.com/docs/authentication/token-types#service_account_id_tokens),
      [Firestore TTL behavior and pricing](https://firebase.google.com/docs/firestore/ttl),
      [Firestore free quota](https://firebase.google.com/docs/firestore/pricing)
      and [Cloud Tasks limits](https://docs.cloud.google.com/tasks/docs/quotas).
  - **Third preflight QA repair packet (2026-08-01; recorded before repair;
    repeated QA verdict `fail`):** QA found one remaining execution-budget
    blocker. The job's five-minute attempt deadline matched Cloud Run's
    unstated provider default while the handler could iterate an unspecified
    number of cursor batches. A timed-out request could therefore keep working,
    miss a deterministic response and make both retries and the 95-minute SLO
    unprovable.
    - **Scope:** define one strict timeout relation across Cloud Run, Scheduler
      and the handler; bound page size, pages/documents and handler wall time;
      define stable pagination and the exact success-versus-retry response;
      update SLO, cost and evidence without changing the selected cleanup
      service or retention semantics.
    - **Non-goals:** a second worker service, queue, persisted cleanup cursor,
      permanent warm instance, larger Scheduler frequency, silent partial
      success or weakening exact-expiry read denial.
    - **Acceptance criteria:** Cloud Run timeout is strictly greater than the
      Scheduler attempt deadline, which is strictly greater than the handler
      budget; every attempt has exact page/document ceilings and deterministic
      ordering; success is returned only after an empty final probe; remaining
      work or depleted time returns a retryable failure before the Scheduler
      deadline; duplicate/partial attempts remain idempotent; the maximum
      per-attempt Firestore work and residual SLO/cost risk are explicit; the
      next independent preflight QA returns `pass`.
    - **Required evidence:** repaired provider/AC/cost/evidence text, official
      Cloud Run timeout behavior, timeout and pagination tests in the future
      worker packet, whitespace/contract checks, no cloud mutation and repeated
      independent QA verdict.
    - **Repair result:** the timeout/page/retry packet was written before the
      repair, the canonical contract suite then passed 28/28 and the contract
      change gate passed. Independent repeated preflight QA reviewed the full
      current 3A-3 packet and returned the exact verdict `pass`. No Firebase/GCP
      mutation occurred. Owner authorization is now the only pre-worker gate.
  - **Fourth preflight repair packet (2026-08-01; complete after the fifth
    focused repair; owner authorization received; repeated QA `pass`):** post-approval local
    evidence found no `gcloud` executable, no initialized/running Podman
    machine and no authorized Firebase CLI account. The Podman read also cannot
    create its user configuration inside the current sandbox. The active packet
    names Podman and reauthentication but does not yet make the local bootstrap
    reproducible or prevent another credential-output incident.
    - **Scope:** add the official reversible macOS Google Cloud CLI installation
      path; define one rootless Apple Hypervisor Podman machine with exact local
      resource ceilings; define interactive user login for `gcloud` and
      Firebase without exposing tokens; verify only the owner-approved
      normalized-email fingerprint; capture versions/readiness before any cloud
      mutation; then repeat preflight QA.
    - **Inputs:** current command evidence (`gcloud` absent; Podman 5.0.3 with
      Apple Hypervisor but no reachable machine; Firebase CLI with no authorized
      account), `PO-028`, the
      [official Homebrew gcloud path](https://docs.cloud.google.com/sdk/docs/downloads-homebrew)
      and [Podman machine initialization](https://docs.podman.io/en/stable/markdown/podman-machine-init.1.html).
    - **Non-goals:** application code, Firebase/GCP resource mutation, local,
      user or developer application-default credential files,
      downloaded service-account keys, `GOOGLE_APPLICATION_CREDENTIALS`, sudo,
      Docker, Cloud Build, token/config-file output, a default project/profile,
      or a second container runtime.
    - **Acceptance criteria:** install the current official Homebrew `gcloud-cli`
      cask only after the recorded owner approval and capture its version;
      initialize/start exactly one rootless `patternly-build` Podman machine
      through the already installed Apple Hypervisor provider with 2 CPUs,
      4,096 MiB memory and 20 GiB disk, then prove `podman info`; authenticate
      interactively to both CLIs without printing tokens or using JSON login
      output; hash the normalized active account through a pipeline that emits
      only the approved SHA-256; pass project/region/impersonation explicitly on
      every later cloud command; stop before resource mutation if any identity,
      version, provider or readiness check fails; repeated preflight QA returns
      exact `pass`.
    - **Required evidence:** official CLI/Podman sources, pre/post executable
      paths and versions, sanitized Podman machine inspect/info, hash-only
      identity comparison, no credential material in output/repo, no cloud
      resource delta, updated owner record, whitespace/contract checks and
      independent preflight QA verdict.
    - **Risk:** browser authentication is owner-interactive; a Homebrew/cache or
      Podman VM permission failure is an explicit stop, not permission for sudo,
      a token export, an alternate runtime or a larger VM.
    - **Report target:** append only sanitized executed evidence to
      `docs/reports/launch-003a3-account-foundation.md` when that real report is
      created by the implementation worker; do not create a pre-code report.
  - **Fifth preflight QA repair packet (2026-08-01; recorded before repair;
    initial QA verdict `fail`, repeated QA verdict `pass`):** QA found two stale 3B-5 sentences that still
    permitted a locally created impersonation ADC file and developer ADC for
    tests. Those are parallel credential paths that contradict the approved
    interactive-user-login plus explicit CLI impersonation boundary.
    - **Scope:** delete both local/developer ADC alternatives; keep only
      explicit `gcloud --impersonate-service-account` for deployment and
      emulator/deployed-sandbox test paths; clarify that attached Cloud Run
      metadata-service workload credentials are not a locally created ADC file
      or developer credential.
    - **Non-goals:** changing the runtime service identity, introducing key
      files, changing Firebase emulators, installing/logging in before repeated
      QA or broad credential-policy rewriting.
    - **Acceptance criteria:** no source document permits user/developer/local
      ADC, ADC files or implicit deployment impersonation; runtime provider
      libraries can use only the attached Cloud Run metadata identity; local
      tests use emulators and sandbox conformance uses the deployed API; search,
      whitespace/contract checks and repeated independent QA return exact
      `pass`.
    - **Required evidence:** focused policy diff, repository-wide credential
      wording search, no local/cloud mutation and repeated QA verdict.
    - **Repair result:** the stale local impersonation-ADC and developer-ADC
      alternatives were removed from the active policy and reconciled in the
      earlier cost preflight. Runtime identity is now only the attached Cloud
      Run metadata-service identity; deployment is only explicit CLI
      impersonation; local tests use emulators and live sandbox conformance uses
      the deployed API. `git diff --check`, the contract-change gate and the
      full repository suite (427/427) passed. Independent repeated preflight QA
      returned the exact verdict `pass`. No local bootstrap or cloud mutation
      occurred before that verdict.
  - **Sixth local-bootstrap repair packet (2026-08-01; recorded before the
    repaired install; stop condition reached):** the approved Homebrew
    `gcloud-cli` 578.0.0 cask twice
    failed closed while creating its internal virtual environment. The cask
    installed Homebrew Python 3.14 but could not import `virtualenv`; Homebrew
    removed every cask link and payload after each failure. Installing the
    current Homebrew `virtualenv` 21.7.1 formula alone did not repair the cask
    because its module lives in the formula's isolated site-packages directory.
    - **Smallest coherent scope:** keep the exact approved cask and formula;
      on the repaired cask invocation only, set `PYTHONPATH` to the installed
      Homebrew `virtualenv` 3.14 site-packages path. Read-only proof already
      shows the exact cask Python imports `virtualenv 21.7.1` through that path.
    - **Non-goals:** direct Google archive installation, a second `gcloud`,
      editing shell profiles, `pip --break-system-packages`, modifying the
      system/Homebrew Python package set, changing credential policy or
      performing any cloud mutation.
    - **Acceptance criteria:** the cask installs once, `gcloud version` works
      without a persistent `PYTHONPATH`, the installed paths are the Homebrew
      cask paths, no partial alternate installation remains and authentication
      has not yet emitted account or token data.
    - **Required evidence:** both sanitized failure outputs, formula/cask
      versions, the import-only proof, installed cask/version/path checks and
      whitespace/contract checks.
    - **Stop conditions:** the same import failure repeats; the cask requests a
      different Python/package mutation; a direct installer, sudo, shell-profile
      edit or parallel installation becomes necessary.
    - **Result:** the same import failure repeated even with the verified
      installation-only module path, so the cask again removed its own payload
      and links. The stop condition was honored; no fourth cask attempt or
      hidden Python mutation is allowed.
  - **Seventh local-bootstrap repair packet (2026-08-01; owner-approved in
    `PO-030`; complete):** replace the non-working package mechanism, not
    the selected Google CLI or credential architecture.
    - **Smallest coherent scope:** download the exact official, versioned macOS
      ARM64 archive named by current Google documentation; verify its published
      SHA-256 before extraction; install it under one private
      `patternly-tools/google-cloud-sdk` directory without shell-profile edits;
      invoke it by absolute path and remove the now-unneeded Homebrew
      `virtualenv` formula only after version/path proof.
    - **Non-goals:** an interactive pipe-to-shell installer, `sudo`, an
      unversioned download, a second CLI, profile/PATH mutation, user/developer
      ADC, cloud mutation or changing any approved deployment identity.
    - **Acceptance criteria:** checksum is exact; only one working `gcloud`
      installation exists; version, architecture and absolute path are proven;
      the CLI works without persistent environment overrides; no account/token
      output occurs before the separately controlled interactive login.
    - **Required evidence:** official package/version/checksum source, local
      checksum, installed version/path, absence of cask links and unnecessary
      formula after cleanup, whitespace/contract checks.
    - **Stop conditions:** checksum mismatch; target directory already contains
      an unknown installation; archive requests sudo/profile mutation; another
      package or credential path becomes necessary.
    - **Result:** the official macOS ARM64 578.0.0 archive matched Google's
      published SHA-256
      `1b5f2b91b73f289979dbce012d5308ceaae473797956a0c7b1baa5edc267bf35`
      and works by absolute path from the declared private directory with its
      bundled Python. The optional installer attempt to add system Python via
      `sudo` was refused and was unnecessary. No PATH/profile, ADC, account or
      cloud resource was changed. Homebrew cask links and the no-longer-needed
      Homebrew Python/virtualenv path are absent; system Python remains the
      pre-existing 3.13.1.
  - **Eighth local-build decision packet (2026-08-01; recorded before any
    build-path mutation; option B selected in `PO-031`):** the exact
    Podman 5.0.3 VM was created with 2 CPUs, 4 GiB and 20 GiB, but repeated
    starts never produced SSH or an API connection. Debug evidence shows the
    AppleHV host sent traffic while the guest returned zero bytes and then
    stopped. Podman is only a container-build tool, not an application/runtime
    dependency.
    - **Options:** update Podman and recreate the new empty VM, or retire the
      local VM and use manual Cloud Build with no trigger. The latter is
      recommended for the solo, infrequent deployment model, but it changes
      the exact API/IAM/cost boundary authorized in `PO-028`.
    - **Smallest coherent scope after an owner selection of Cloud Build:** first
      define a closed manual-build packet covering the one Dockerfile, source
      exclusions, explicit user-specified build identity, logging destination,
      Artifact Registry digest, no trigger/retry, API/IAM grant and immediate
      narrowing; compare it with current Cloud Build pricing; obtain repeated
      independent QA `pass`; only then remove the new empty VM and perform one
      authorized sandbox build.
    - **Non-goals:** Cloud Build triggers, CI/CD, default Compute Engine build
      identity, a second image path, source deploy convenience mode, Preview
      `--no-build`, Docker Desktop, a permanent local VM or any cloud mutation
      before the replacement packet passes QA.
    - **Acceptance criteria:** exactly one canonical build path remains; the
      same reviewed source/Dockerfile produces a digest-addressed image; no
      automatic build can run; all build/service-agent IAM and log/storage
      costs are explicit; the empty failed VM and stale connections are removed
      only after authorization; repeated preflight QA returns exact `pass`.
    - **Required evidence:** owner decision, official Cloud Build source-deploy/
      pricing/user-specified-SA guidance, current local failure logs, complete
      role/cost/source/log matrix, resource delta, diff/contract checks and
      independent QA verdict.
    - **Stop conditions:** owner retains Podman; least-privilege manual build
      requires an unapproved default identity, automatic trigger, unknown log
      destination or cost exposure; QA does not return `pass`.
    - **Latest read-only state (2026-08-01 22:40 Europe/Warsaw):** the official
      `gcloud` still reports 578.0.0 with bundled Python 3.14.6. Podman reports
      `patternly-build` as `Currently starting` with the approved 2 CPU/4 GiB/
      20 GiB limits, while the host process list contains no Podman, gvproxy or
      VM process. This is a stale failed-machine state, not readiness or a
      reason to preserve a second build path. No process was killed and the VM
      remains untouched pending exact deletion authorization.
    - **Authorized cleanup result:** after the exact owner authorization, the
      controller removed only `patternly-build`. A post-operation Podman
      machine listing is empty. No host Podman installation, application code,
      credential, GCP resource or other VM was removed; the deleted VM had
      never reached readiness and contained no Patternly source or data.
  - **Ninth Cloud Build replacement preflight packet (2026-08-01; recorded
    before API, IAM, bucket, build or Podman cleanup mutation; repaired
    independent QA `pass`; exact owner authorization received):** implement the
    owner's `PO-031` choice as one bounded manual
    supply-chain path, not as a general CI/CD platform.
    - **Confirmed facts:** the repository has no Dockerfile, build config,
      `.gcloudignore`, server directory, trigger, repository connection or
      alternate image path. `cloudbuild.googleapis.com` was disabled at the
      last provider read; the current Storage/Logging API state must be read
      before mutation rather than assumed. The failed `patternly-build` VM is
      empty and has no application/runtime responsibility. The destination
      remains the private `europe-central2/patternly-api` Artifact Registry
      repository and Cloud Run accepts only the resolved image digest.
    - **Smallest coherent scope:** this replacement boundary executes only
      inside the full 3A-3 worker slice. The worker first implements the real,
      reachable production-shaped `server/**`, its own package lock and the
      server auth/transaction tests already required by the main acceptance
      packet; controller code/test acceptance of that source is a hard gate
      before any cloud mutation. Alongside that real server, add the root
      `Dockerfile`, `.dockerignore`, `.gcloudignore`, `cloudbuild.yaml`, the two
      exact lifecycle-policy JSON files and `tests/cloudBuildBoundary.test.ts`
      inside the closed worker matrix. Enable only Cloud Build and Storage if their pre-read proves they
      are disabled; use existing Logging without creating a logs bucket. Create
      exactly one no-role-at-rest builder SA and the exact private regional
      source bucket. Submit one build manually through the impersonated
      deployer, resolve/push one digest, remove all build-only grants and the
      staged source object, then deploy by digest. After successful deploy,
      temporarily bind the exact-repository two-permission cleanup custom role,
      apply/read back the deterministic policy and remove that binding. Remove the failed empty
      Podman VM only after this packet receives QA `pass` and the owner
      authorizes the enumerated destructive cleanup.
    - **Source/build boundary:** `.gcloudignore` sends only the root Dockerfile,
      `.dockerignore` and `server/**`; the Docker context retains only the root
      Dockerfile and `server/**`. `.git`, mobile, documentation,
      environment/config credentials, captures and evidence are excluded.
      The server owns its package manifest and lockfile. The one config names
      `patternly-builder@patternly-app-sandbox.iam.gserviceaccount.com`,
      `CLOUD_LOGGING_ONLY`, `E2_STANDARD_2`, a 900-second timeout, no cache and
      one digest-pinned Cloud Builder Docker step. It has no deploy, IAM or test
      step, no automatic retry and no mutable `latest` tag; `images:` publishes
      only
      `europe-central2-docker.pkg.dev/patternly-app-sandbox/patternly-api/patternly-api:build-$BUILD_ID`.
      A pre-submit manifest and SHA-256 cover the exact dirty-worktree source
      files, and build result plus Artifact Registry must report the same
      immutable digest.
    - **Identity/IAM boundary:** the approved human principal retains only the
      existing exact-deployer Token Creator edge. During the one build, the
      deployer receives project `roles/cloudbuild.builds.editor` and
      `roles/serviceusage.serviceUsageConsumer`, exact-builder
      `roles/iam.serviceAccountUser`, bucket `roles/storage.objectAdmin` and
      repository `roles/artifactregistry.reader`; only initial bucket creation
      may use temporary project `roles/storage.admin`, removed before build.
      The builder receives exact-bucket `roles/storage.objectViewer`, exact-
      repository `roles/artifactregistry.writer` and project
      `roles/logging.logWriter`. Builder code receives no Run, IAM actAs/Token
      Creator, Firestore, Firebase Auth, Secret Manager, build-create or basic
      role. The provider Cloud Build service agent keeps only its Google-managed
      `roles/cloudbuild.serviceAgent`; no manual Token Creator edge is added in
      this same-project design. Every deployer build grant and every builder
      grant is removed after the build/deploy evidence; the builder remains
      role-free and a later build requires a new owner-gated grant. After the
      successful digest deploy only, bind the project custom role
      `PatternlyArtifactCleanupPolicyAdmin` containing exactly
      `artifactregistry.repositories.update` and
      `artifactregistry.versions.delete` to the deployer on only
      `europe-central2/patternly-api`; remove the binding immediately after
      exact policy readback. The role definition may remain unbound, but no
      principal retains cleanup-policy or artifact-delete permission.
    - **Storage/log/image lifecycle:** use exactly
      `gs://patternly-app-sandbox-europe-central2-build-source/source` and stop
      if the bucket name is unavailable. The Standard bucket is in
      `europe-central2`, uniform-access only, public-access-prevention enforced,
      versioning/soft delete disabled, no retention policy and one-day object
      lifecycle cleanup. Delete the exact submitted object immediately after
      completion; the lifecycle handles only interrupted cleanup. Do not create
      a log bucket; Cloud Logging is the sole destination and full failure-log
      access requires a separately reviewed temporary viewer grant. Apply and
      read back the reviewed Artifact Registry policy only after successful
      deploy: `keepCount=3` retains the active digest plus up to two existing
      rollback images, while delete rules remove older-than-30-day and
      untagged-older-than-one-day versions only outside that protected newest
      set. The deterministic policy JSON/static test plus provider readback are
      the evidence; do not authorize asynchronous dry-run audit-log access.
    - **Cost boundary:** this slice permits one manual `e2-standard-2` build
      with a 15-minute timeout and no retry. Current list price after the shared
      2,500 free build-minutes per billing account is USD 0.006/minute, so the
      compute ceiling at list price is USD 0.09 for this attempt; the free pool
      is not a hard cap or guarantee. Source Storage operations/bytes, Cloud
      Logging and Artifact Registry storage/egress are separately metered. The
      exact-source deletion, one-day lifecycle, three-image retention and
      existing 5 PLN all-service alert bound exposure operationally but do not
      make it a billing hard stop. Any second attempt is a new controller
      decision after checking whether the first build exists.
    - **Acceptance criteria:** exactly one manual build config, Dockerfile,
      source bucket and user-specified builder exist; no trigger, connection,
      default/legacy build SA, source deploy, local build or second path exists;
      submitted source is the allowlisted hash manifest; the builder has only
      source-read/log-write/repository-write; build and registry digests match;
      Cloud Run consumes only `@sha256`; the object and all temporary build IAM
      are removed; cleanup preserves the active digest plus up to two existing
      rollback images and its exact-repository policy grant is removed; the
      static boundary test, typecheck, relevant/full tests, contract gate,
      whitespace check and independent QA all pass.
    - **Non-goals:** a trigger, CI/CD, GitHub/repository connection, default
      Compute Engine or legacy Cloud Build identity, Buildpacks/Kaniko/Cloud Run
      source deploy, private pool, log bucket, cache, automatic retry, parallel
      local build, second Dockerfile, production resource or persistent build
      permission.
    - **Required evidence:** `PO-031`; official manual-submit, user-specified-SA,
      location, pricing, Storage soft-delete/lifecycle, Logging, Artifact
      Registry cleanup and IAM-permission guidance; provider pre/post
      API/IAM/bucket/trigger/build/policy reads;
      source manifest/archive/Dockerfile hashes; build ID, builder, region,
      source-object generation, result and matching registry digest; temporary-
      grant removal; empty source bucket; exact cleanup-policy readback and
      temporary custom-role binding removal; Podman removal
      only after exact approval; repository checks and independent verdict.
      First-party references accessed 2026-08-01 are
      [manual submit](https://docs.cloud.google.com/build/docs/running-builds/submit-build-via-cli-api),
      [user-specified service accounts](https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts),
      [Cloud Build access](https://docs.cloud.google.com/build/docs/securing-builds/configure-access-to-resources),
      [Cloud Build pricing](https://cloud.google.com/build/pricing),
      [build log storage](https://docs.cloud.google.com/build/docs/securing-builds/build-log-storage),
      [Storage soft delete](https://docs.cloud.google.com/storage/docs/soft-delete),
      [Artifact Registry build access](https://docs.cloud.google.com/artifact-registry/docs/configure-cloud-build)
      and [cleanup policies](https://docs.cloud.google.com/artifact-registry/docs/repositories/cleanup-policy).
    - **Stop conditions:** an API beyond the enumerated conditional Cloud Build
      and Storage enablement is required; same-project builds require a default
      SA or manual service-agent Token Creator; the exact bucket is unavailable;
      soft delete/versioning/public access cannot be closed; source exceeds the
      allowlist; a builder/base image cannot be pinned; unknown logging or
      broader persistent IAM is required; digests differ; a second paid attempt
      is needed; or QA does not return exact `pass`.
    - **Owner authorization result:** after the repaired independent QA `pass`,
      the owner explicitly approved the exact Cloud Build packet and deletion
      of the empty VM. This authorizes only the enumerated sandbox delta and one
      build; the real-server-before-cloud gate, no-second-attempt rule and every
      stop condition remain active.
  - **Tenth Cloud Build preflight repair packet (2026-08-01; recorded before
    repair after independent QA `fail`):** close only the Artifact Registry
    cleanup-policy ownership and first-build evidence defects.
    - **Findings:** the Ninth packet names no principal with the repository
      update permission required to set cleanup policies; provider cleanup
      dry-run is asynchronous and its effects appear in Data Access audit logs,
      but no narrow viewer/time-window evidence path was authorized; and the
      first build cannot prove two rollback images that do not yet exist.
    - **Smallest coherent scope:** identify the minimum exact-repository role or
      custom permission set for policy update and remove it immediately after
      application; replace broad/implicit log evidence with one bounded,
      explicitly authorized verification method; define retention as active
      digest plus up to two existing rollback images with `keepCount=3` rather
      than requiring nonexistent artifacts. Change no build, runtime, source,
      Scheduler or account behavior.
    - **Non-goals:** project Artifact Registry Admin, persistent policy editor,
      general Data Access log access, waiting for or inventing two images,
      immediate destructive cleanup, a second build, trigger or broader IAM.
    - **Acceptance criteria:** one named principal can update cleanup policy only
      on `europe-central2/patternly-api` and loses that grant after evidence;
      the verification path has exact data scope and bounded time or avoids
      audit-log access entirely; first-build evidence truthfully retains the
      active digest and zero-to-two existing rollback images while the policy's
      `keepCount=3` remains testable; diff/contract checks and repeated
      independent QA return exact `pass`.
    - **Required evidence:** official Artifact Registry cleanup-policy and IAM
      role definitions, focused text diff, permission-removal requirement,
      deterministic policy JSON/static test and repeated QA verdict.
    - **Stop conditions:** only a project-wide/persistent admin role can update
      policy; provider verification requires broad/unbounded log access; the
      policy could delete the active digest; or repeated QA does not pass.
    - **Repair result:** the exact-repository custom role now contains only the
      two documented permissions and is unbound after exact policy readback;
      asynchronous dry-run/Data Access log viewing was removed; `keepCount=3`
      truthfully means active plus up to two existing rollback images. Focused
      search, `git diff --check` and the contract gate passed; repeated
      independent QA included the later real-server ordering repair and
      returned exact `pass`.
  - **Eleventh Cloud Build preflight repair packet (2026-08-01; recorded before
    repair after a second independent QA `fail`):** remove one execution-order
    contradiction without creating pre-code infrastructure.
    - **Finding:** the replacement packet correctly confirms that no
      `server/**` exists, but its local smallest-scope wording lists build files
      and then requires a successful image build/deploy. Read alone, that could
      authorize an empty or placeholder server solely to exercise Cloud Build.
    - **Smallest coherent scope:** state explicitly that the Ninth packet is an
      execution boundary inside the full 3A-3 worker scope, not a standalone
      infrastructure slice. The worker first implements the real reachable
      production-shaped `server/**` required by 3A-3 acceptance criteria; only
      that reviewed server, its own package lock and the one Dockerfile may be
      built. No API/IAM/bucket/build mutation occurs before controller code/test
      acceptance of that source.
    - **Non-goals:** empty server, health-only placeholder, sample image,
      pre-code cloud proof, mock provider, second worker task or widening the
      already closed 3A-3 code matrix.
    - **Acceptance criteria:** build execution has an explicit real-server gate;
      server reachability/auth/transaction tests pass before source upload; the
      image contains the canonical API and no mobile/docs/evidence context; QA
      can no longer read the replacement packet as standalone scaffolding.
    - **Required evidence:** focused wording diff, existing full 3A-3 server
      acceptance criteria, future server tests and repeated QA verdict.
    - **Stop conditions:** the real server cannot be completed in the coherent
      3A-3 worker slice or any placeholder/parallel backend is proposed.
    - **Repair result:** the Ninth packet now states that it executes only
      inside the full 3A-3 worker slice, after controller acceptance of the real
      reachable server and its auth/transaction tests. No placeholder server,
      pre-code cloud proof or second backend is authorized. Repeated independent
      QA returned exact `pass`.
  - **Twelfth worker-scope repair packet (2026-08-01; recorded before code
    implementation after worker stop):** allow the two exact files required to
    complete the already-approved cutover truthfully.
    - **Confirmed facts:** `YourDataScreen` is registered as the reachable
      `YourData` route and opened from Settings. Its English and Polish copy
      repeatedly says that Patternly requires no account/backend/sync/recovery,
      which becomes false in this slice and is already a named blocking item in
      the launch inventory. The inventory itself requires every implementation
      task to record route additions/merges/deletions, but neither file was in
      the closed worker matrix. The worker stopped before editing, as required.
    - **Smallest coherent scope:** add only
      `src/features/home/YourDataScreen.tsx` for truthful account/local-remote/
      export/adoption/deletion/recovery copy and
      `docs/launch-surface-inventory.md` for the exact account route and status
      delta. Do not open broader Home, Settings, legal-copy or discovery scope.
    - **Non-goals:** redesigning the information screen, adding legal promises,
      changing unrelated Home/Settings routes, another audit, marketing copy,
      public-host claims or edits to any other documentation.
    - **Acceptance criteria:** no reachable copy denies the implemented account,
      sync or recovery model; retained privacy exclusions remain true; the
      inventory exactly matches added/merged/deleted routes without reopening
      discovery; focused account tests cover the copy boundary; all original
      3A-3 criteria and worker stop conditions remain unchanged.
    - **Required evidence:** route/import reachability, before/after copy search,
      focused route/copy test, inventory diff, allowed-file diff and later
      independent QA.
    - **Stop conditions:** truthful copy needs unresolved legal/provider claims,
      a third out-of-matrix file is required or the route graph cannot be
      represented as an exact delta.
  - **Thirteenth provider-decision packet (2026-08-01; `owner-approved`;
    recorded after the worker's provider-capability stop and before any email-
    provider, Secret Manager or cloud mutation):**
    - **Confirmed facts:** the canonical public deletion request requires its
      own opaque `publicDeletionPossessionToken`, a 30-minute expiry, single use
      and the same accepted response whether or not the normalized email has an
      account. Firebase Admin can generate only password-reset, email-
      verification and email-sign-in action links; none is a distinct custom
      deletion capability or an arbitrary transactional-email transport.
      Reusing one would broaden credential/session authority and violate the
      approved contract. The worker therefore stopped with the account server
      only partially implemented; no deletion/email-provider path is complete
      and no provider account, key, secret, API or cloud resource was created.
    - **Smallest coherent options:** (A) select one transactional-email
      provider for only the public-deletion message and keep Firebase's own
      verification/recovery delivery; (B) reopen the approved lifecycle
      contract to use a provider-native credential/session action as possession
      proof and repeat contract/design QA; or (C) move service/link behavior to
      Task 7, which would leave 3A-3's required reachable vertical path
      incomplete. B weakens the deliberately separated token authority and C
      creates pretend completeness, so neither is recommended.
    - **Recommended option A — Resend Free for the owner-only sandbox:** use
      `onboarding@resend.dev` only to the email attached to the owner's Resend
      account, with no domain purchase and no subscription charge; Free is
      currently USD 0/month for 3,000 messages/month and 100/day. Use one
      send-only key, no tracking/webhook/contact/audience feature, a stable
      idempotency key and one exact Secret Manager secret exposed only to the
      runtime identity by a pinned numeric version. At market promotion, the
      same adapter requires an owner-controlled verified sending domain; that
      remains gate 11A and does not authorize a purchase now.
    - **Material privacy trade-off:** Resend retains email data for 30 days on
      Free/Pro/Scale, and account metadata, logs and API records are stored in
      the United States irrespective of send region. Its no-message-content
      storage option currently requires an eligible paid plan plus a USD
      50/month add-on. Approval therefore must explicitly distinguish zero
      retention of live Patternly/Firebase account data from a truthful maximum
      of 30 days for the transactional-email processor's delivery data; the
      email token itself still expires after 30 minutes. This requires a narrow
      canonical-contract/privacy addendum and independent contract QA, not a
      hidden exception.
    - **Rejected alternative for this slice:** Amazon SES is low-cost per use
      and its sandbox can send only to verified recipients, but it adds a second
      cloud account/billing boundary and either long-lived AWS credentials or a
      new cross-cloud workload-federation design. Current AWS pricing also puts
      new accounts on an Essentials path rather than the older SES-specific
      free allowance. Its operational/security cost is disproportionate to one
      owner-only sandbox message path and conflicts with the selected GCP-
      learning/single-cloud direction.
    - **Acceptance criteria after owner approval of A:** the provider-specific
      retention addendum passes independent contract QA before implementation;
      the public endpoint always returns the same accepted result for present
      and absent accounts; it stores only a cryptographically random token hash
      with purpose, expiry and single-use state, never plaintext; only an
      existing owner sandbox account causes a provider send; send retries use
      one idempotency key; the provider key never enters Git, CLI output, build
      context or logs; missing/invalid secret fails explicitly; tracking and
      webhooks remain absent; API/IAM/readback prove exactly one pinned Secret
      Manager version and runtime-only access; replay/expiry/non-enumeration,
      provider-failure and log-exclusion tests pass.
    - **Owner decision result (`PO-032`):** the owner answered `Tak`, approving
      option A exactly as presented: Resend Free only for the owner-only
      sandbox, the disclosed 30-day US processor-data retention, one send-only
      key, one pinned Secret Manager version and runtime-only access. No paid
      plan, domain, production use or public Hosting was authorized.
    - **Immediate contract-reconciliation slice:** change only the canonical
      account privacy model, its schema/test, the dated Task 1 contract report,
      `PO-032` and this plan so they distinguish zero live Patternly/Firebase
      account-data retention from a maximum 30 days of transactional-email
      delivery data stored in the United States. Preserve the 30-minute token
      expiry, token non-persistence/log exclusion and all existing account-
      deletion proof/backup limits. No provider code, dependency, secret or
      cloud mutation belongs to this slice.
    - **Contract-slice acceptance criteria:** the schema rejects a missing,
      over-30-day or non-US processor boundary; canonical tests assert the
      exact values and unchanged token/deletion limits; prose never describes
      processor logs as zero-day deleted Patternly account data or as a backup;
      no other contract field, runtime path or product behavior changes;
      focused contract tests, contract gate, typecheck where relevant and diff
      checks pass; independent QA returns exact `pass`.
    - **Non-goals:** marketing/broadcast email, provider contacts/audiences,
      open/click tracking, webhooks, SMTP, a second email adapter, Firebase
      credential action reuse, AWS, domain purchase/verification, public
      Hosting, production use, paid plan, automatic provider fallback or any
      account/deletion success claim before the email/token and remote deletion
      path passes end-to-end evidence.
    - **Required evidence:** official Firebase action-link capability list;
      official Resend price, test-recipient, key-scope, idempotency, retention,
      residency and no-content-storage terms; owner decision `PO-032`; focused
      contract diff/tests and independent QA `pass`; then provider account/key
      presence without value disclosure, exact Secret Manager API/secret/IAM
      pre/post reads, sanitized owner-only delivery/token drill and the full
      3A-3 controller/QA evidence.
    - **Stop conditions:** owner rejects the 30-day US processor retention;
      Resend requires payment, a domain or a recipient beyond its documented
      owner-only test boundary; a send-only key cannot be created; Secret
      Manager requires broader persistent access; token/email/private payload
      enters logs; a second provider/path is proposed; or contract QA does not
      return exact `pass`.
  - **Overnight continuation rule (`PO-033`, 2026-08-01):** an interactive
    Resend account/key step, owner login, secret entry, purchase, production
    access or irreversible operation pauses only that external evidence branch.
    The controller must continue every independent local part of 3A-3: contract
    reconciliation, implementation, tests, diff/dead-code review and
    independent QA. It may prepare exact read-only/preflight evidence for the
    blocked external branch, but cannot insert a substitute secret, fake send,
    hidden fallback or success claim. A dependent task may not be marked done
    and the one Cloud Build must not be spent while code may still change.
  - **Fourteenth contract-repair packet (2026-08-01; recorded after independent
    QA `fail` and before repair):** remove the unqualified token/email retention
    contradiction exposed by the approved processor boundary.
    - **Finding:** the first PO-032 contract change permits Resend to retain
      message content, recipient metadata and API logs for at most 30 days, but
      the same contract still says without scope that possession-token
      persistence and token logging are prohibited and excludes both token and
      normalized email from all logs. The public-deletion email necessarily
      carries both values, so those claims cannot coexist truthfully.
    - **Smallest coherent repair:** replace the unqualified credential fields
      with `possessionTokenPersistenceInPatternlyStores` and
      `tokenLoggingInPatternlyControlledLogs`; replace `logExclusions` with
      `patternlyControlledLogExclusions`. Keep all three prohibitions exact for
      application/Firebase-controlled storage and logging. State separately
      that the sole authorized processor copy contains the recipient email and
      30-minute token in message content and delivery/API records for at most 30
      days in the United States. Remove the old unscoped field names rather
      than preserve compatibility aliases.
    - **Scope:** only the same four contract-slice files: canonical YAML,
      schema, canonical test and the dated Task 1 addendum.
    - **Non-goals:** changing token authority, 30-minute expiry, single use,
      provider, plan, recipient policy, deletion retention, proof/backup limits,
      provider code, cloud resources or any other canonical behavior.
    - **Acceptance criteria:** schema requires only the scoped canonical names
      and rejects every old unscoped name; tests prove Patternly/Firebase never
      persist or log the email/token, while the processor disclosure explicitly
      includes them and retains them no longer than 30 days; token capability
      expires after 30 minutes regardless of processor retention; no hidden
      exception, compatibility field or second processor exists; focused tests,
      validation, contract gate and diff checks pass; repeated independent QA
      returns exact `pass`.
    - **Required evidence:** focused before/after field search, schema-negative
      fixtures for old names, unchanged token/deletion/backup/proof values,
      worker report, controller checks and repeated independent QA.
    - **Stop conditions:** the scope cannot be made truthful without changing
      token authority/expiry or adding another provider/retention class; any
      old unqualified name remains; or repeated QA does not pass.
    - **Repair result:** the three unqualified names were deleted and replaced
      by Patternly-store/Patternly-controlled-log scopes; the sole processor copy
      now enumerates recipient normalized email and the deletion token in
      message, delivery and API records. Exact provider, 30-day US retention,
      30-minute token capability, zero live account data and existing backup/
      proof limits remain unchanged. Focused canonical tests pass 21/21,
      validation/contract gate/diff checks pass, and repeated independent QA
      returned exact `pass`. The PO-032 contract branch is complete.
  - **Fifteenth local server-core repair packet (2026-08-01; recorded after
    read-only gap inspection and before implementation):** harden only the
    existing auth/adoption/deletion/cleanup modules before adding email or HTTP
    reachability.
    - **Confirmed defects:** revisioned-record creation compares declared
      `null` against an invented zero revision; Scheduler accepts the forbidden
      bare `accounts.google.com` issuer; cleanup can start work without the
      required ten-second margin and probes after its budget; `requestedAt`
      accepts noncanonical/future input; deletion retries do not read an
      existing proof or tolerate every already-absent Firebase identity step;
      deleting one Firestore document does not prove absence of its
      subcollections; current `.ts` import specifiers/generic typing break the
      repository typecheck. The server start script points to a nonexistent
      entrypoint and is misleading until the later route slice.
    - **Scope:** only existing `server/src/accountData.ts`,
      `accountService.ts`, `authentication.ts`, `deletion.ts`,
      `firebaseAdapters.ts`, `schedulerAuthentication.ts`, `server/package*`,
      an optional server `tsconfig.json`, and the three existing
      `tests/serverAccount*.test.ts`. Remove the invalid start claim if no real
      entrypoint is added in this slice. Do not add public-deletion email/token
      code or HTTP routes yet.
    - **Non-goals:** mobile code, UI/routes, Resend, secrets, HTTP framework or
      entrypoint, Docker/Cloud Build, provider/cloud mutation, expanding the
      Scheduler route, a second data model, compatibility imports or a fake
      production adapter.
    - **Acceptance criteria:** new revisioned records accept only expected
      `null` plus revision one; updates require the exact existing revision;
      stale/idempotent/immutable collisions are tested. Scheduler accepts only
      `https://accounts.google.com`. Cleanup starts a page or final `limit(1)`
      probe only with at least ten seconds remaining, caps at 20 pages/2,000
      deletions, preserves stable cursors, treats duplicate delivery as safe and
      maps errors/time/remaining work to `cleanup_incomplete_retryable` without
      false completion. `requestedAt` is exact UTC ISO and no later than the
      operation clock. An identical existing proof returns unchanged; a
      mismatched proof fails; already-absent identity/session steps are
      idempotent. The Firestore adapter recursively deletes the sole canonical
      account document tree and verifies no account document or subcollection
      remains. Source/test imports compile through one server TS configuration;
      focused tests, server build/typecheck, root typecheck and diff check pass.
    - **Required evidence:** focused create/update/stale/idempotent/collision
      tests; exact/bare issuer test; budget values immediately below/at/above the
      ten-second boundary, 20x100/2,000, cursor, duplicate/error/final-probe
      tests; canonical/future timestamp tests; existing/mismatched proof and
      already-absent identity tests; recursive-delete call plus emulator proof
      if available; import/dead-start search and exact test/typecheck output.
    - **Known architectural stop:** a crash after Firebase identity deletion but
      before deletion-proof persistence cannot be made end-to-end restartable by
      an authenticated retry alone. If closing that window requires a durable
      remote deletion-operation record or expands the currently proof-only
      Scheduler route, stop that subproblem for a separate owner/security packet
      rather than weaken auth, write a success proof early or add hidden
      reconciliation. Complete every other independent criterion first under
      `PO-033`.
    - **Implementation result before dependency review:** all locally closable
      behavior was implemented inside the closed scope. Controller-reproduced
      tests pass 23/23, server and root typechecks pass, and diff/dead-start
      checks pass. Firestore emulator proof remains unavailable because no
      emulator is declared; the identity-delete/proof crash window remains the
      explicit architectural stop above.
  - **Fifteenth-A dependency repair packet (2026-08-01; recorded after
    controller audit and before dependency edit):** remove avoidable production
    dependency advisories without changing server behavior.
    - **Finding:** a clean exact server lockfile install reproduces eight
      moderate `uuid`-chain advisories through the current Firebase Admin/
      Firestore/Storage dependency graph. `npm audit fix --force` proposes a
      breaking downgrade to Firebase Admin 10.3.0 and is rejected. Registry
      metadata currently reports Firebase Admin 14.2.0 and Google Auth Library
      11.0.0 as the latest releases, while the server requests 13.4.0 and
      10.9.1 ranges.
    - **Scope:** only `server/package.json` and `server/package-lock.json`, plus
      read-only reruns of the existing server tests/typechecks. Update direct
      dependencies to their current compatible releases through the package
      manager and accept only the lockfile it generates.
    - **Non-goals:** `npm audit fix --force`, downgrade, override/resolution,
      vendoring, source/test refactor, root mobile dependencies or suppression
      of a remaining advisory.
    - **Acceptance criteria:** a clean lock install succeeds; focused 23 tests,
      server/root typecheck and diff check remain green; production-only audit
      reports zero vulnerabilities. If the latest official graph still reports
      an advisory, stop with exact upstream evidence instead of forcing or
      hiding it. No source behavior or public API changes.
    - **Required evidence:** before/after direct and resolved versions, clean
      install, exact audit output, unchanged source/test hashes or diff and the
      full focused verification result.
    - **Stop conditions:** latest packages require unsupported Node/runtime,
      source changes beyond narrow compatibility, lockfile instability or a
      remaining advisory without a safe non-breaking upstream release.
    - **Implementation result — upstream stop:** direct dependencies now resolve
      to the latest Firebase Admin 14.2.0 and Google Auth Library 11.0.0; all
      ten source/test hashes are unchanged, clean install succeeds, focused
      tests pass 23/23 and both typechecks pass. Production audit improves from
      eight to six moderate findings but still reports
      `GHSA-w5hq-g745-h8pq` through Firebase Admin's mandatory Google Cloud
      Storage/gaxios/teeny-request graph and `uuid` 9.0.1. The only npm-proposed
      fix is the forbidden breaking downgrade to Firebase Admin 10.3.0. No
      force, override, suppression or downgrade was applied. This dependency-
      risk branch remains open for an upstream release or explicit owner/
      security acceptance before the one Cloud Build; under `PO-033` it does
      not block QA of the byte-identical Fifteenth behavior or later local code.
  - **Fifteenth-B account-data QA repair packet (2026-08-01; recorded after
    independent QA `fail` and before repair implementation):** remove three
    unsafe assumptions from the existing adoption/sync core without expanding
    the server surface.
    - **Confirmed defects:** adoption currently treats the greater declared
      record revision as a proven one-sided descendant even though neither
      dataset carries ancestry evidence; duplicate record keys and multiple
      `activeSessionReference` records are silently accepted through `Map`
      overwrite/merge behavior; arbitrary operation IDs are remembered without
      the operation payload, so reuse of an ID with different input falsely
      reports idempotent success.
    - **Scope:** only `server/src/accountData.ts`,
      `server/src/accountService.ts`, the remote-shape validator in
      `server/src/firebaseAdapters.ts`, and
      `tests/serverAccountAdoption.test.ts`. Replace arbitrary sync/adoption
      operation IDs with the one canonical transmitted
      `operationFingerprint`; compute it deterministically from the complete
      semantic operation envelope and require the supplied value to match.
      Delete the old `operationIds` storage/API path rather than retaining an
      alias or compatibility branch.
    - **Non-goals:** new ancestry/base-snapshot metadata, automatic divergent
      adoption, conflict-resolution UI, HTTP/mobile routes, Firebase emulator
      setup, deletion/email/Scheduler work, dependency changes, cloud mutation,
      schema migration compatibility or unrelated refactor.
    - **Acceptance criteria:** one shared dataset validator verifies every
      record fingerprint, rejects duplicate `type:id` keys and permits at most
      one active-session reference; preview, confirmation, remote reads and the
      final sync result pass through it. Adoption of the same key with different
      fingerprints and any unequal declared revisions produces a blocking
      `revision_conflict`; exact matches remain deduplicated and immutable
      conflicts retain their explicit result. Sync rejects duplicate mutation
      keys before mutation and rejects any result with two active-session
      references. The service computes a SHA-256 fingerprint over a canonical
      envelope containing operation kind, expected account revision and every
      semantic input field; blank, malformed or nonmatching supplied
      fingerprints fail before write. An exact replay is idempotent, while the
      same supplied fingerprint with different payload/revision cannot succeed.
      Remote storage contains only bounded `operationFingerprints`, with no
      `operationIds` field or accepting alias. Focused tests, server/root
      typechecks and diff/dead-code checks pass, then independent QA returns
      exact `pass`.
    - **Required evidence:** duplicate local/remote key and duplicate mutation
      tests; multiple-active-session tests for input and post-sync state;
      unequal-revision adoption conflict plus exact-match/immutable regression;
      deterministic fingerprint order test, malformed/mismatch/collision and
      identical-replay tests; remote-shape rejection of the removed field;
      focused test/typecheck output, old-name search, controller diff review and
      repeated independent QA.
    - **Stop conditions:** correctness requires a new ancestry contract or
      persistent base snapshot; the canonical operation fingerprint cannot be
      computed from existing semantic inputs; a compatibility path would be
      required by deployed data; or the repair crosses into another 3A-3
      surface. Stop that subproblem explicitly rather than infer ancestry,
      weaken validation or preserve the unsafe path.
    - **Fifteenth-B1 focused QA repair (2026-08-01; recorded after repeated QA
      `fail` and before repair):** the one-sided-active-session classification
      currently takes precedence over unrelated record conflicts, while
      confirmation blocks conflicts only for `divergentRecord`. This can retain
      the remote conflicting value and silently discard the local one.
      Restrict the repair to `server/src/accountData.ts` and
      `tests/serverAccountAdoption.test.ts`: any non-active record conflict in
      the one-sided-active-session case must block confirmation without
      mutation or default winner; preserve the separate explicit-choice flow
      for two divergent active sessions. Add revisioned and immutable mixed-case
      regressions plus an `AccountDataService.confirm` no-write assertion, and
      add the already-required changed-confirmation operation-fingerprint
      negative evidence. No case taxonomy expansion, ancestry metadata,
      conflict UI, fallback or unrelated edit. Focused/full tests, both
      typechecks, diff check and repeated independent QA must pass.
    - **Fifteenth-B/B1 result:** complete. One canonical validator now enforces
      exact remote/dataset shape, fingerprint integrity, unique record keys and
      at most one active-session reference. Adoption no longer invents ancestry
      from a greater revision and mixed active-session/record conflicts cannot
      bypass blocking confirmation. Sync rejects duplicate mutation keys and
      invalid final active-session state. Arbitrary `operationId(s)` were
      deleted from this account-data path and replaced by the canonical
      full-envelope SHA-256 `operationFingerprint`; the old remote field remains
      only as negative rejection evidence. Controller reproduced 32/32 focused
      account tests, 459/459 full tests, server/root typechecks, contract/privacy
      validation and diff checks. Repeated independent QA returned exact
      `pass`. Firestore emulator integration remains a named 3A-3 evidence gap,
      not a claim of completion.
  - **Sixteenth deletion-recovery owner/security packet (2026-08-01;
    `owner-decision-required`; read-only architecture analysis complete; no
    implementation or cloud mutation):** close the non-atomic Firebase Auth
    deletion-to-Firestore-proof crash window without false success.
    - **Confirmed blocker:** no write ordering can atomically cover Firestore
      account data, Firebase Auth identity and the five-field success proof. If
      the process stops after identity deletion and before proof creation, the
      authenticated client cannot be assumed able to retry. Proof-first would
      lie when later deletion fails. The local device intent is not a remote
      work authority. Existing IAM could perform reconciliation, but `PO-028`
      explicitly restricts the Scheduler route to proof cleanup and forbids it
      from reading deletion operations or invoking Firebase-user work; current
      authorization is therefore insufficient.
    - **Recommended architecture:** before the first destructive step, create
      exactly one service-owned
      `accountDeletionOperations/{requestId}` record outside the account tree
      and proof collection. It contains only `uid`,
      `irreversibleAccountIdHash`, canonical `requestedAt`, `trigger`, `stage`,
      `nextAttemptAt`, bounded `failureCount` and bounded `lastFailureCode`;
      the document ID is the request ID. Stages are exactly `prepared`,
      `sessionsRevoked` and `remoteDataAbsent`. Each effect is idempotent and
      stage-checked. Identity deletion occurs only after recursive data-absence
      verification. Finalization is one Firestore transaction that revalidates
      the operation, creates the exact five-field proof only after data and Auth
      absence, and deletes the operation. An unfinished operation has no TTL or
      age-based deletion; it remains an explicit failing/retryable condition
      until finalization, then no raw UID remains outside normal provider
      operational history.
    - **One-job reconciliation:** because the approved job has not been created,
      replace its not-yet-created name/target with exactly one
      `patternly-deletion-maintenance` job targeting
      `/internal/deletion-maintenance`; do not create a second job. Keep the
      same hourly schedule, OIDC identity, outer retry/deadline and 240-second
      handler budget. In at most 20 fair rounds, handle at most one eligible
      deletion operation and one 100-proof page per round, requiring at least
      ten seconds before each provider call; thus one attempt remains capped at
      20 operations and 2,000 proofs. Failed operations receive a bounded retry
      code and future `nextAttemptAt` so one poison item cannot starve others.
      Stable proof cursors remain; final `limit(1)` probes cover both queues.
      Return 2xx only when both are empty, otherwise the existing bounded 503.
      No Cloud Tasks, TTL, second job, API, SA, role or persistent IAM is added.
    - **Recommended client completion evidence:** accept only the exact
      provider-bound Firebase refresh/reauthentication `user-not-found` result
      for a previously verified stored UID when the initiating device already
      has its matching durable deletion intent, or when another previously
      bound device is reconnecting. The invariant that Auth deletion occurs
      only after verified remote-data absence makes that result sufficient for
      idempotent local cleanup. Generic auth failure, revoked/expired token,
      caller UID, bare request ID or network error is never success. First prove
      the exact Firebase emulator/sandbox error mapping. If the provider cannot
      supply a deterministic bound result, stop for a separate purpose-bound
      continuation-token contract; do not add one as fallback.
    - **Owner decision requested:** approve the durable service-owned operation,
      the combined one-job route/name/scope, the stated 20-operation/2,000-proof
      fair-round ceilings and Firebase `user-not-found` completion evidence
      subject to provider proof. This replaces only the proof-only Scheduler
      restriction in `PO-028`; all identity, audience, role, timeout, retry,
      cost and no-extra-service constraints remain.
    - **Cost/IAM effect:** no new permanent IAM, service account or fixed
      service. The existing runtime permissions already cover Firestore and
      Firebase Auth; Scheduler SA remains role-free. The empty hourly path adds
      roughly one Firestore query/read (about 744 per 31 days). Each real
      deletion adds the operation create/stage/final transaction and retried
      Auth/data calls. These are metered and not a hard cap, but avoid the second
      job's extra invocations and possible USD 0.10/31-day charge above the
      billing account's first three jobs.
    - **Acceptance criteria after approval:** contract/schema/tests classify the
      remote operation as service-operational and never learning authority;
      create/replay/collision and every crash boundary converge without early
      proof; Auth/data absence is verified; final proof+operation deletion is
      atomic; fair-round/time/queue/error tests prove no starvation or false
      2xx; exact Firebase missing-user evidence is tested; current proof-only
      route/job wording and dead code are replaced, not retained; focused/full
      tests, emulator/sandbox drill, controller review and independent QA pass.
    - **Non-goals:** proof-first/pending proof, disabled identity, accepting a
      revoked token, request ID as bearer secret, new continuation token,
      second Scheduler job, Cloud Tasks, Pub/Sub, Eventarc, Functions,
      Workflows, Cloud Run Job, TTL, KMS, new IAM role or hidden retry path.
    - **Stop conditions:** owner does not approve the route/data-scope change;
      exact provider missing-user evidence cannot be proven; current IAM is
      insufficient; a poison operation can starve proof retention; zero live-
      data semantics require deleting an unfinished operation; or another
      service/secret/capability becomes necessary.
  - **Seventeenth normalized Firestore account-dataset repair packet
    (2026-08-01; `preflight-required`; recorded after Fifteenth-B/B1 QA `pass`
    and before implementation):** replace the structurally bounded one-document
    adapter before making account data reachable over HTTP.
    - **Confirmed blocker:** `FirestoreAccountDatasetStore` currently stores the
      complete, growing `RemoteAccountDataset.records` array in
      `accounts/{uid}` and rewrites it on every operation. The product contract
      has no total-history cap and immutable attempts/results accumulate.
      Firestore limits one document to 1 MiB and an API request to 10 MiB, so
      the current adapter predictably fails as legitimate history grows. A
      history cap, truncation or a split write without an activation boundary
      would lose data or expose partial state. Official evidence:
      [Firestore usage and limits](https://firebase.google.com/docs/firestore/quotas)
      and [transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions).
    - **Ordering impact after re-evaluation:** protected account-data HTTP is
      deferred until this adapter is corrected. PO-034 deletion recovery,
      Resend/Secret Manager, provider drills, Cloud Build and later Task 3+
      surfaces remain independent parked branches under `PO-033`; no later
      task is removed or merged by this finding.
    - **Canonical storage shape:** keep `accounts/{uid}` as a small exact head
      containing the account revision, active dataset-generation ID, bounded
      operation fingerprints, active manifest and at most one explicit
      adoption transition. Store each validated learning record as one document
      below `accounts/{uid}/generations/{generationId}/records/{recordKeyHash}`;
      the document proves its deterministic `type:id` key hash. The logical
      authority remains the one `singleRevisionedAccountDataset`; generations
      are storage activation units, never parallel readable authorities.
    - **Read and sync rules:** reconstruct the active dataset in stable pages
      between two head reads and accept it only when generation, revision and
      manifest are unchanged; otherwise retry within a strict bound and return
      an explicit retryable conflict. Ordinary sync performs one head CAS plus
      only its unique changed record documents and is limited to at most 100
      mutations per operation. Each record's canonical serialized bytes are
      limited to 512 KiB before Firestore overhead; an oversized record fails
      explicitly before any write. There is no limit or truncation of the total
      logical dataset.
    - **Adoption/recovery rules:** stage the complete confirmed dataset under
      the deterministic operation-fingerprint generation in bounded pages,
      verify record count and full dataset fingerprint, then atomically CAS the
      head from the expected revision to that generation. Until activation the
      old generation is the sole readable authority. The head transition makes
      staging, activation and old-generation cleanup explicit and idempotent;
      other mutations fail with a bounded recovery-required result. A failed or
      expired pre-activation staging lease can be rolled back only after proving
      that the old head remains active. After activation, any authenticated
      account-data request can finish deletion of the named retired generation
      and clear the transition; success is not returned for the adoption until
      cleanup is verified. No timer, Scheduler scope, TTL or hidden cleanup path
      is added.
    - **Scope:** `server/src/accountData.ts` only for bounded canonical record
      byte validation if needed; replace the storage contract/orchestration in
      `server/src/accountService.ts`; replace only the account-dataset portion
      of `server/src/firebaseAdapters.ts`; focused additions to
      `tests/serverAccountAdoption.test.ts` and one Firestore-store conformance
      test using an injected deterministic adapter boundary. Contract/schema
      edits are allowed only if the preflight proves that the 100-mutation or
      512-KiB operational limits are user-visible canonical behavior rather
      than provider implementation constraints.
    - **Non-goals:** HTTP/entrypoint, mobile/UI/bootstrap, email, deletion or
      Scheduler behavior, cloud/emulator mutation, Firestore client access,
      total-history cap, data truncation, second readable dataset, ancestry
      inference, migration compatibility for undeployed documents, TTL, second
      cleanup service, dependency change or broad repository refactor.
    - **Acceptance criteria:** aggregate datasets larger than 1 MiB round-trip
      while every individual record remains valid; the head never contains
      learning payloads; stable paged reads either return one manifest-verified
      revision or an explicit retryable conflict; sync writes only its at-most-
      100 mutation documents plus the head and retains account-revision/
      operation-fingerprint replay semantics; oversize record and batch reject
      before persistence. Failed staging and stale CAS keep the old dataset
      byte-for-byte readable; successful activation exposes exactly the staged
      manifest; every crash boundary resumes or safely rolls back without
      partial publication; retired-generation cleanup is verified before
      adoption success; recursive account deletion still removes the entire
      tree. The old whole-dataset document reader/writer is deleted, not kept as
      fallback. Focused/full tests, both typechecks, diff/dead-code checks and
      independent QA return exact `pass`.
    - **Required evidence:** >1-MiB aggregate fixture with individually bounded
      records; 512-KiB boundary and 100/101 mutation tests; stable page ordering,
      head-change retry ceiling and manifest mismatch tests; exact staged-write,
      activation, stale-CAS, lease rollback and every pre/post-flip crash replay;
      retired-generation deletion verification; operation replay/collision and
      recursive account-delete regressions; Firestore emulator proof if locally
      available, otherwise an explicit unverified integration gap before cloud
      deployment; old `accounts/{uid}.dataset` reachability search.
    - **Preflight stop conditions:** the transition cannot recover when the
      initiating device disappears; cleanup can become an unobservable
      indefinite second dataset; a consistent unbounded read needs one large
      Firestore transaction; record/batch limits conflict with real canonical
      command sizes; the model requires a new scheduled service, TTL, public
      route or owner decision; or an implementation slice cannot remove the old
      adapter completely.
    - **Seventeenth-A preflight repair (2026-08-01; recorded after architecture
      QA `fail` and before implementation):** close atomic-size and staging/
      rollback race gaps without changing the normalized direction.
      - **Atomic sync boundary:** a sync commit is one Firestore transaction
        containing the active-head read/CAS, reads and writes of only the unique
        mutated record documents, the updated manifest, account-revision bump
        and completed operation-fingerprint append. In addition to at most 100
        mutations and 512 KiB per canonical record, the sum of canonical bytes
        for every record written by that operation is at most 4 MiB. The 4-MiB
        ceiling deliberately leaves at least 6 MiB of the provider's 10-MiB API
        request limit for document names, protobuf and index overhead. Count,
        individual size or aggregate-size failure is detected before opening a
        transaction; no record is changed outside this CAS. The future client
        outbox must split larger independent local commits into multiple FIFO
        operations; an indivisible real command above this bound is a stop for
        canonical command redesign, never truncation.
      - **Stable reads:** page size is exactly 100 and the full active snapshot
        is accepted only when head reads before and after paging have identical
        account revision, active generation and manifest. Restart from page one
        at most three times; then return
        `account_snapshot_changed_retryable`. Record pages are ordered by
        deterministic document ID and each document proves its key hash. No
        unbounded Firestore transaction is used for reads.
      - **Exact transition:** the head has at most one transition with exactly
        `operationFingerprint`, `targetGeneration`, `previousGeneration`,
        `stage`, `manifest`, `nextRecordIndex` and `leaseExpiresAt`. Stages are
        `staging`, `rollingBack` and `activatedCleaning`. The lease is exactly
        15 minutes from the server clock and is renewed by each successful
        staging page. A page contains at most 100 records and 4 MiB canonical
        bytes; its transaction first reads the head, requires the same
        fingerprint/target/manifest, `staging`, and the exact
        `nextRecordIndex`, writes deterministic record documents, advances the
        index and lease atomically. Replay of an already committed page derives
        the next index from the head and never duplicates progress.
      - **Pre-flip recovery:** when the lease has expired, the matching resumed
        operation and any other authenticated account-data request race only by
        head transaction: the matching operation may renew `staging`, while a
        recovery request may CAS it to `rollingBack`; exactly one wins. No page
        can write after `rollingBack`. Rollback deletes at most 20 stable pages
        of 100 staged records per request, verifies the target generation is
        empty, then clears the transition in a head transaction only if the old
        generation/revision are still active. Incomplete recovery returns
        `account_transition_recovery_retryable`; a later authenticated request
        continues it. The old active dataset remains byte-for-byte unchanged.
      - **Activation and post-flip recovery:** after staged count and fingerprint
        verification, one transaction revalidates the staging transition and
        expected old head, increments account revision, activates the target
        manifest, appends the completed operation fingerprint and changes the
        transition to `activatedCleaning` naming the retired generation. If no
        retired generation exists it clears the transition in that transaction.
        Otherwise any authenticated account-data request deletes at most 20
        stable 100-record pages from only that retired generation, verifies it
        empty and CAS-clears the transition. No other mutation proceeds while a
        transition remains. An exact operation replay must finish its named
        recovery before returning success; a different operation first drives
        recovery and returns the explicit retryable result if work remains.
        Adoption success is returned only after transition clearance. Crash
        before activation exposes only the old generation; crash after
        activation exposes only the new head but blocks mutation/success until
        retired cleanup is verified.
      - **Repaired evidence:** add 4-MiB minus/equal/plus aggregate tests,
        combined many-large-record transaction-bound evidence, three-read-retry
        exhaustion, exact 15-minute lease boundary, staging-page versus rollback
        transaction race, rollingBack write denial, 20x100 cleanup continuation,
        activation fingerprint timing, same/different-operation recovery and
        every pre/post-flip crash boundary. The original Seventeenth scope,
        non-goals and stop conditions otherwise remain.
    - **Seventeenth-B preflight repair (2026-08-01; recorded after repeated
      architecture QA `fail` and before implementation):** bound actual stored
      envelopes/index exposure and complete the removable-record lifecycle.
      - **Fixed persisted record envelope:** Firestore never receives the
        arbitrary nested `AccountRecord.payload` as a map. Each record document
        has only fixed bounded scalar metadata (`keyHash`, `type`, `id`,
        `fingerprint`, optional integer `revision`) plus the exact canonical
        record JSON encoded as one bytes field. Reads decode the bytes, require
        byte-for-byte canonical re-encoding, validate the record fingerprint and
        prove that metadata/key hash match. This gives one bounded index entry
        per fixed field instead of indexing arbitrary learner payload structure.
        The 512-KiB individual limit applies to the complete canonical bytes.
      - **Deterministic transaction estimator:** supersede Seventeenth-A's raw
        4-MiB sum with a 2-MiB maximum over the complete canonical bytes of every
        put and every existing document selected for deletion, plus the exact
        UTF-8 bytes of all fixed scalar metadata and document paths. Count and
        size are computed from the stable snapshot before the transaction and
        revalidated against the exact documents read inside it. At most 100
        mutations still apply, but large documents reduce that count. The
        conservative 2-MiB envelope leaves at least 8 MiB of the provider's
        10-MiB request ceiling for protobuf and the fixed, cardinality-bounded
        scalar indexes; no arbitrary payload field creates its own index entry.
        Retired/staged cleanup also queries at most 100 documents but selects
        only the largest deterministic prefix within the same 2-MiB estimator
        for each head-conditioned delete transaction; it never assumes all 100
        large documents fit.
      - **Closed sync mutation union:** replace the upsert-only mutation with
        exactly `put` and `delete`. `put` keeps current create/update rules.
        `delete` contains `type`, `id`, exact expected positive revision and
        expected fingerprint, and is allowed only for
        `activeSessionReference`, `simulationDraft`, `foregroundTimer` and
        `reviewQueueEntry`, the four record classes physically cleared by
        canonical learning lifecycle commands. Immutable attempts/results,
        training sessions and active track cannot be deleted through ordinary
        sync; whole-account deletion and the separate local-learning reset keep
        their own semantics. Missing, stale or fingerprint-mismatched delete is
        a blocking record conflict. Put and delete count together toward both
        operation ceilings, are included with kind and all preconditions in the
        operation fingerprint, update the manifest after removal and commit in
        the same head-CAS transaction. No tombstone, inferred success or
        compatibility mutation is added; a stale device first fails account
        revision and the future deterministic reconciliation must not replay an
        absent remote record as a null-revision create.
      - **Additional evidence:** high-cardinality nested payload persists only
        as one canonical bytes field; corrupt bytes/metadata/hash fail; 2-MiB
        minus/equal/plus mixtures of puts and deletes reject before persistence;
        cleanup splits by encoded size. Grouped session completion/abandonment
        deletes active reference, timer and draft atomically; resolved review
        deletion, forbidden immutable deletion, missing/stale/fingerprint
        mismatch, exact replay and cross-device stale no-resurrection are
        tested. The earlier 4-MiB evidence wording is superseded by this 2-MiB
        stored-envelope rule.
    - **Seventeenth preflight result:** complete. Independent QA failed the
      first two designs before implementation, the A/B repairs closed atomic
      request sizing, transition recovery, indexed-payload and removable-record
      lifecycle gaps, and the third full architecture review returned exact
      `pass`. The current one-document/upsert-only code remains unchanged until
      the following scoped worker implementation; no HTTP or cloud work is
      authorized by this preflight result.
    - **Seventeenth-C implementation QA repair (2026-08-01; recorded after
      independent QA `fail` and before repair):** close one runtime-discriminator
      inconsistency in the implemented sync mutation union. An unknown/hybrid
      `kind` currently falls through as delete during validation/fingerprinting,
      as put during logical manifest calculation and again as delete during
      persistence, so the head can atomically commit a manifest that no longer
      matches its records. Restrict scope to `server/src/accountService.ts` and
      `tests/serverAccountAdoption.test.ts`. Validate exact allowed keys for
      each `put` and `delete` shape before identity, fingerprint or store access;
      reject unknown kinds, mixed/hybrid shapes and extra fields. Route identity,
      canonical fingerprinting, logical application, envelope preflight and
      transaction persistence through exhaustive discriminated branches with no
      default-to-put/delete behavior. Regression evidence must prove an unknown
      kind and both hybrid directions cannot obtain an operation fingerprint,
      open a transaction or change head/records; valid put/delete and replay
      remain unchanged. No adapter/model/limit/transition changes or broad
      refactor. Focused/full tests, both typechecks, diff check and repeated
      independent QA must pass.
    - **Seventeenth-C result (2026-08-01):** complete. The runtime boundary now
      accepts only exact-key `put` and `delete` mutation objects before
      fingerprinting or any store access. Identity, canonical fingerprinting,
      logical application, both envelope checks and transaction persistence use
      exhaustive discriminated branches; all prior implicit default-to-put or
      default-to-delete behavior was removed. Regression evidence rejects an
      unknown kind, both hybrid directions and an extra-field mutation without
      opening a transaction or changing head/records. Controller verification
      passed the 46/46 focused server pack, 473/473 full tests, server and root
      typechecks, contract-change and runtime-privacy gates, and diff check.
      Repeated independent QA returned exact `pass` and found no new blocking
      correctness, completeness, architecture, debt or dead-path issue. The
      already-declared Firestore emulator/cloud integration gap remains; it does
      not justify a parallel store or block the next local protected HTTP slice.
    - **Eighteenth-A protected ordinary-sync HTTP packet (2026-08-01;
      historical packet; superseded by the closed B/C repairs below):** make
      the already-accepted authentication, normalized Firestore store and
      ordinary sync operation reachable through one real, bounded Node/Cloud
      Run entrypoint without yet exposing an unsafe whole-dataset protocol.
      - **Confirmed facts:** `server` has no HTTP handler, listening entrypoint,
        build output or `start` command. `authenticateAccountRequest`,
        `FirebaseAdminIdTokenVerifier`, `FirestoreAccountDatasetStore` and
        `AccountDataService.applySync` are real local implementations, but the
        Firebase Admin module currently initializes its default app at import
        time instead of after the fail-closed environment check. `applySync`
        accepts at most 100 exact runtime-validated mutations and enforces a
        conservative 2-MiB Firestore-operation envelope, but returns the whole
        logical dataset. Adoption preview/confirmation likewise accepts and
        returns the complete, intentionally unbounded dataset. Google documents
        a 32-MiB HTTP/1 request limit for Cloud Run, so a naive JSON adoption
        endpoint would reintroduce a predictable whole-history ceiling:
        <https://docs.cloud.google.com/run/quotas#request_limits>.
      - **Smallest coherent scope:** add `server/src/http.ts` with one injected
        protected handler for exact `POST /v1/account/sync`; add
        `server/src/index.ts` as the real process entrypoint; minimally change
        `server/src/firebaseAdapters.ts` so Firebase Admin initialization is
        explicit and project-bound only after `loadServerEnvironment` succeeds;
        add `server/tsconfig.build.json` and `build`/`start` package commands;
        add focused `tests/serverAccountHttp.test.ts`. No mobile code is added
        because the client environment, protected-token storage and bootstrap
        gate must later arrive together as a reachable mobile vertical path.
      - **Exact request contract:** accept only `application/json` (an optional
        UTF-8 charset is allowed), count streaming bytes and reject both a
        declared or observed body above exactly 4 MiB, reject malformed JSON,
        and require the exact top-level keys `expectedAccountRevision`,
        `mutations`, `operationFingerprint`. A UID/account selector is never a
        request field. Authenticate the Bearer Firebase ID token through the
        existing ordinary protected-request path, derive the sole UID from its
        verified claims, then call the one `AccountDataService.applySync` path;
        nested exact mutation validation and the 2-MiB stored-envelope rule stay
        canonical in that service.
      - **Exact response contract:** success is `200` with only
        `accountRevision`, `datasetFingerprint`, `operationFingerprint`,
        `recordCount` and `result: "synchronized"`; an exact replay returns the
        same bounded receipt. Never serialize records, payloads, stored
        fingerprint history, credentials or the verified token. JSON responses
        use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
        Known validation/authentication/conflict/oversize/retryable conditions
        map to one stable allowlisted `{ "error": { "code": ... } }` envelope
        and appropriate 4xx/409/413/415/503 status; unexpected errors become
        only `internal_error` with status 500. Raw exception text, bodies and
        Authorization values are never logged or returned.
      - **Entrypoint rule:** environment validation completes before Firebase
        Admin initialization. The explicitly initialized Admin app is bound to
        the validated Firebase project, the real verifier/store/service are
        composed once, and the Node server listens on the validated `PORT` on
        `0.0.0.0`. Startup failure terminates; there is no emulator, anonymous,
        in-memory or cross-project runtime fallback.
      - **Acceptance criteria:** wrong method/path/content type, oversized,
        empty, malformed, extra-key, caller-UID and invalid-mutation requests
        cannot reach the account store; missing/malformed/invalid/unverified/
        expired credentials cannot call sync; valid tokens pass only their
        verified UID; exact valid put/delete and replay return the bounded
        receipt; conflicts and retryable transition errors remain explicit;
        unknown errors disclose no internals; a production build starts from
        emitted JavaScript rather than a TypeScript development loader.
      - **Required evidence:** focused real-HTTP loopback tests covering byte
        boundaries, exact request/response fields, authentication/UID routing,
        error mapping, no-store/no-sniff headers, replay and zero-store negative
        paths; build plus emitted-entrypoint smoke evidence; existing focused
        account suites, full tests, server/root typechecks, contract/privacy
        gates, diff/dead-code search and independent implementation QA `pass`.
      - **Non-goals:** adoption preview/confirmation, remote dataset download,
        deletion, scheduler, email/Resend, public hosting, cloud mutation,
        Firebase emulator proof, mobile networking/token storage/UI/bootstrap,
        CORS, a health endpoint, an HTTP framework, a second service/store, a
        compatibility route or any whole-dataset response. The later adoption
        transport must be a separately reviewed bounded paged protocol; absence
        of that route is explicit and is not hidden by a fallback.
      - **Stop conditions:** stop before implementation if preflight cannot
        prove that this deployable real-service vertical slice is coherent
        despite not yet being called by mobile, if any accepted request can
        exceed the Cloud Run or existing service envelope, if Firebase can
        initialize before environment validation, or if a second data authority
        or an unbounded response becomes necessary. No owner decision, secret,
        paid service or cloud write is required for this local slice.
      - **Eighteenth-A preflight result:** `fail`. Independent QA accepted the
        ordinary-sync-only server increment and rejection of naive whole-
        dataset adoption transport, but found two P1 ambiguities: a receipt
        containing the current dataset revision/fingerprint/count cannot remain
        identical when an old retained operation is replayed after a later
        operation, and the narrative error categories did not close the public
        error/status mapping. Implementation remains unauthorized until the
        following repair passes repeated architecture QA.
    - **Eighteenth-B HTTP preflight repair (2026-08-01; recorded before
      implementation):** retain Eighteenth-A scope and replace only its receipt,
      error, decoding and startup-proof ambiguities.
      - **Operation-stable receipt:** success contains exactly
        `committedAccountRevision: expectedAccountRevision + 1`, the submitted
        `operationFingerprint`, and `result: "synchronized"`. These values are
        derived from the accepted semantic operation and remain identical while
        its fingerprint is retained even when another operation commits before
        replay. They deliberately do not claim the current head or convergence.
        Remove `accountRevision`, dataset fingerprint and record count from the
        A response. Test immediate replay and replay after one intervening
        operation; both return byte-equivalent receipts. A fingerprint aged out
        of the bounded history keeps the canonical stale-revision result.
      - **Closed public error table:** the handler returns only the following
        allowlisted mappings; source messages/codes are never copied into the
        response. All errors absent from the table, including Firebase Admin or
        Firestore provider failures, stored-head/record/page/manifest
        corruption, staged-record collision and programming errors, map only to
        `500 internal_error`.

        | Reachable source condition | HTTP | Public code |
        |---|---:|---|
        | unknown path | 404 | `not_found` |
        | non-POST method on the sync path | 405 + `Allow: POST` | `method_not_allowed` |
        | media type other than the exact allowed JSON forms | 415 | `unsupported_media_type` |
        | any `Content-Encoding` other than absent or `identity` | 415 | `unsupported_content_encoding` |
        | declared or observed body over 4 MiB; valid record or sync stored-envelope oversize | 413 | `request_too_large` |
        | empty body, fatal UTF-8 failure, malformed JSON, non-object/extra top-level field, invalid revision/fingerprint/mutation/record payload, duplicate mutation key or prohibited delete | 400 | `invalid_request` |
        | missing or malformed Authorization header | 401 | `authentication_required` |
        | Firebase `auth/id-token-expired` or local expired claim | 401 | `id_token_expired` |
        | Firebase `auth/id-token-revoked` | 401 | `id_token_revoked` |
        | Firebase `auth/argument-error` or `auth/invalid-id-token`; wrong project/issuer or invalid subject | 401 | `invalid_id_token` |
        | verified but unverified-email identity | 403 | `identity_unverified` |
        | UID mismatch or recent-authentication failure if later reused by a sensitive route | 403 | `authorization_required` |
        | stale account revision | 409 | `stale_account_revision` |
        | record revision/fingerprint mismatch | 409 | `record_revision_conflict` |
        | immutable collision | 409 | `immutable_integrity_conflict` |
        | resulting second active-session reference | 409 | `active_session_conflict` |
        | stable-snapshot exhaustion or transition changed/recovery incomplete | 503 | `account_data_retryable` |

        Authenticate first, then parse and prevalidate the exact semantic input
        with the exported canonical fingerprint function before calling the
        service. Consequently input-validation errors are classified at the
        boundary; any same-named validation/integrity failure raised after the
        accepted service begins is not reclassified as client input and falls
        through to `internal_error`, except for the explicit conflict, size and
        retryable rows above.
      - **Exact byte/encoding rule:** enforce the 4-MiB limit over raw stream
        bytes, not JavaScript characters. Decode once with fatal UTF-8, reject a
        byte-order mark and invalid byte sequences, and reject compressed or
        otherwise encoded bodies instead of decompressing them. Test actual
        streamed `limit - 1`, `limit`, `limit + 1`, invalid UTF-8 and non-
        identity encoding; tests may use whitespace padding so the service
        mutation limit remains a separate assertion.
      - **Initialization purity:** importing `firebaseAdapters.ts` and
        constructing injected adapter instances performs no Admin app
        initialization. The explicit post-environment factory creates exactly
        one app bound to the validated project and rejects any unrelated
        pre-existing default/named Admin app rather than reusing it. Entrypoint
        composition is injectable enough to prove that invalid environment
        input makes zero Firebase-initializer and zero listener calls; a valid
        environment initializes once before listening once.
      - **Clarified completion boundary:** this is durable deployable server
        code, not a completed product vertical and not closure of Task 3. It
        cannot trigger the one Cloud Build/deploy before the later protected
        mobile/bootstrap vertical and remaining required server surfaces pass.
        No new scope or architecture is added; all Eighteenth-A non-goals and
        stop conditions remain.
      - **Eighteenth-B preflight result:** complete. Repeated independent QA
        returned exact `pass`: the operation-stable receipt remains identical
        across an intervening operation without new persisted receipt state;
        aged-out replay becomes the existing stale-revision conflict; input,
        authentication, conflict, size, retryable, corruption and provider
        errors have a closed non-leaking boundary; byte/encoding and startup
        ordering evidence is exact. No owner input or cloud action is required,
        so implementation may proceed only within the combined A+B scope.
    - **Eighteenth-C implementation QA repair (2026-08-01; recorded after QA
      `fail` and before repair):** close one provider/domain error-collision
      path in `server/src/http.ts` and `tests/serverAccountHttp.test.ts` only.
      A thrown object with an unrecognized provider `code` can currently reuse
      an allowlisted local `message` and be misclassified, for example an Auth
      outage carrying `message: "expired_id_token"` as 401 or a Firestore error
      carrying `message: "stale_account_revision"` as 409. Make the presence of
      a provider-shaped `code` authoritative: authentication maps only the four
      explicitly allowed Firebase Auth token codes from Eighteenth-B and sends
      every other coded error to `500 internal_error`; service mapping sends
      every coded error to `500 internal_error` before considering exact
      uncoded domain messages. Add both collision regressions and prove neither
      raw code nor message is returned or logged. No change to routes, request/
      receipt contract, service/storage architecture, startup, dependencies or
      limits. Focused/full tests, both typechecks, build, gates, diff check and
      repeated independent QA must pass.
    - **Eighteenth-C result (2026-08-01):** complete. The server now exposes
      exactly one protected `POST /v1/account/sync`, derives UID only from the
      verified Firebase token, enforces the exact 4-MiB raw-byte and strict JSON/
      UTF-8 boundary, calls the canonical sync service and returns only the
      three-field operation-stable receipt. The old import-time/default-app
      Firebase Admin path was deleted; invalid environment input causes zero
      Admin initialization and zero listener calls, while the real emitted
      JavaScript entrypoint composes one validated-project runtime. The QA
      repair makes coded provider failures authoritative, so unknown Auth codes
      and every coded service/Firestore error collapse to non-leaking
      `500 internal_error` before local-message mapping. Controller evidence
      passed 59/59 combined focused tests, 486/486 full tests, both typechecks,
      server build and emitted-entrypoint smoke, strict unused checks, contract/
      privacy gates and diff check. Repeated independent QA returned exact
      `pass` after reproducing the two hostile provider/domain collisions. No
      framework, dependency, route alias, fallback, health/CORS surface, cloud
      mutation or generated source was retained.
    - **Post-Eighteenth dependency review (2026-08-01):** ordinary sync is now
      reachable on the real server boundary but does not make the account
      product or Task 3 complete. Re-evaluation keeps Tasks 4–14 ordered and
      finds no obsolete later task or new external dependency. It removes a
      whole-dataset download/adoption endpoint from near-term scope: normalized
      storage deliberately permits history beyond any single HTTP response, so
      mobile/bootstrap must not begin by inventing a capped or silent partial
      remote view. The next local dependency is one authenticated, stable,
      response-byte-bounded remote-snapshot page contract on the same service/
      store/HTTP authority. Only after that passes may a separate paged adoption
      upload/confirmation protocol be designed; mobile environment, protected
      token storage and bootstrap remain merged behind both server contracts so
      they become one reachable vertical path. External Resend, Scheduler/
      deletion durability, dependency-risk acceptance, emulator/cloud proof and
      the one Cloud Build remain parked under `PO-033`; none blocks local work.
    - **Nineteenth-A bounded remote-snapshot page packet (2026-08-01;
      complete; independent implementation QA `pass`):** add
      the smallest protected remote-read operation required before paged
      adoption or mobile bootstrap, without reconstructing or returning the
      complete account dataset in one request.
      - **Confirmed facts:** the accepted store already reads a named active
        generation in ordered document-ID pages and validates every fixed
        record envelope; the accepted HTTP boundary currently exposes only
        ordinary sync. `AccountDataService.preview` still reconstructs the full
        dataset and is not a safe transport API. Each canonical record is at
        most 512 KiB, while aggregate history has no artificial cap. A snapshot
        page therefore must be bounded independently by both record count and
        exact serialized response bytes, and every continuation must bind to
        the unchanged head revision and manifest.
      - **Smallest coherent scope:** extend `AccountDataService` with one stable
        page read using the existing `AccountDatasetStore`; extend the existing
        Node handler with exact protected `POST /v1/account/snapshot/page` and
        compose the same service instance in `index.ts`; replace the now-
        misleading sync-only handler/service type names rather than keeping
        aliases; add focused snapshot HTTP/service tests and update only the
        existing HTTP tests affected by that canonical rename. No adapter,
        dependency, environment, build or persistence-schema change.
      - **Request contract:** authenticate first through the same ordinary
        verified-token/UID path. Accept only the existing exact JSON media and
        identity-encoding rules, with a route-specific 4-KiB raw request-body
        ceiling. Require exactly `cursor`, `expectedAccountRevision` and
        `expectedDatasetFingerprint`. The initial request uses all three as
        `null`. A bound request uses a non-negative integer revision, lowercase
        64-hex dataset fingerprint and either a `null` cursor to repeat page one
        or a lowercase 64-hex opaque cursor; mixed null/non-null snapshot fields
        or a non-null cursor without both snapshot fields are invalid. There is
        no UID, generation or record selector.
      - **Stable service read:** after the existing bounded transition recovery,
        read and validate the head, require any supplied revision/fingerprint
        to match, read at most 21 ordered record documents after the cursor from
        the active generation, decode/validate each and reread the head. Retry a
        mid-read authority change at most three times, then use the existing
        retryable snapshot error; if a caller-bound snapshot is already stale,
        return a distinct `snapshot_changed` conflict. An absent account is the
        canonical revision-zero empty manifest. Never return operation history,
        generation IDs or Firestore envelopes.
      - **Page/response contract:** the HTTP layer selects at most 20 records
        from the stable read-ahead and the largest non-empty prefix whose exact
        UTF-8 JSON response body is no more than 2 MiB. Success contains exactly
        `accountRevision`, `datasetFingerprint`, `recordCount`, `records` and
        `nextCursor`. `nextCursor` is the document ID of the last returned
        record when the read-ahead or byte ceiling proves more data remains,
        otherwise `null`. Empty datasets return an empty page and null cursor.
        Every returned record is the validated canonical account record only;
        no stored metadata wrapper is exposed. `Content-Length` is the exact
        encoded body length and all accepted security/cache headers remain.
      - **Snapshot completion rule:** the endpoint never claims a page is a
        complete synchronized dataset. A consumer may accept completion only
        after `nextCursor: null`, exact accumulated record count and recomputed
        canonical dataset fingerprint both match the repeated page metadata.
        Any head change requires restarting from null cursor with a fresh
        snapshot. A syntactically valid but invented cursor can only yield data
        that fails those final count/fingerprint checks; do not add server-side
        cursor sessions, signing secrets or hidden truncation to mask that
        property.
      - **HTTP/error integration:** extend the closed table only with
        `409 snapshot_changed`. Invalid request/cursor/metadata remains
        `400 invalid_request`; existing authentication, retryable and coded-
        provider rules remain unchanged; corrupt head/page/record/manifest and
        all coded Firestore failures remain non-leaking `500 internal_error`.
        Unknown path/method behavior stays exact and neither route logs bodies,
        tokens, records, cursors or provider errors.
      - **Acceptance criteria:** initial empty and populated reads, repeated
        first page, multi-page assembly, a 21st-record continuation, exact
        2-MiB body boundary with one-more-record deferral, a near-512-KiB record,
        invalid/mixed metadata and cursor, caller UID injection, stable replay,
        stale-bound snapshot, three mid-read races, corrupt documents/order and
        coded provider failures all have deterministic tested outcomes. A full
        valid page sequence reassembles to the declared count/fingerprint; a
        skipped/invented cursor cannot pass that verification. Each stable
        attempt performs only two head reads and at most 21 record reads apart
        from the already-accepted bounded transition recovery.
      - **Required evidence:** focused fake-store service tests and real-loopback
        HTTP tests for exact request/response fields, byte/count limits, auth/
        UID, cursors, concurrency, errors and no leakage; combined existing
        account/HTTP suites; 2-MiB minus/equal/plus serialization evidence;
        full tests, both typechecks, server build/smoke, strict unused and dead-
        path search, gates/diff check and independent implementation QA `pass`.
      - **Non-goals:** adoption preview/upload/confirmation, whole-dataset
        response, sync changes, cursor signing/session storage, mobile code,
        token storage/bootstrap/UI, deletion, email, Scheduler, emulator/cloud,
        Cloud Build/deployment, CORS/health, provider/schema changes or a second
        read/data authority.
      - **Stop conditions:** stop if a page requires a full-generation scan,
        cannot fit at least one already-valid maximum-size record below the
        exact 2-MiB response ceiling, can silently complete after a skipped page
        or concurrent head change, needs a new secret/persistent cursor session,
        or becomes a generic unused port. This durable server operation does not
        close Task 3 or authorize cloud work; no owner decision is required.
      - **Nineteenth-A preflight result:** complete. Independent architecture QA
        returned exact `pass`: 21-document lookahead is sufficient for a
        20-record page, the exact serialized prefix includes the real null/string
        cursor, every continuation is bound to revision plus manifest, and an
        invented/skipped cursor cannot satisfy final count and canonical
        fingerprint verification. Two head reads plus at most 21 record reads
        per stable attempt are bounded without a full scan or persistent cursor
        state. Empty/corrupt/concurrent/provider cases and the 2-MiB/512-KiB
        boundaries are closed. Implementation may proceed only in this packet.
      - **Nineteenth-A implementation result (2026-08-02):** complete. The one
        `AccountDataService` now performs revision/manifest-bound snapshot reads
        with 21-document lookahead and at most three unbound authority retries;
        the one Node account handler exposes exact authenticated
        `POST /v1/account/snapshot/page`, selects at most 20 records and the
        largest non-empty prefix whose actual UTF-8 JSON body is at most 2 MiB,
        and returns only the five declared fields. Sync-only handler/service
        names were replaced rather than retained as aliases. Focused account
        regression passed 65/65, the full repository passed 492/492, both
        typechecks, server build, server strict-unused check, contract/content/
        privacy gates, whitespace and dead-path searches passed. Independent
        implementation QA reran the isolated and combined HTTP suites (6/6 and
        19/19), found no P1/P2 or blocking debt and returned exact `pass`.
      - **Post-Nineteenth dependency review (2026-08-02):** Tasks 4–14 retain
        their order and no completed work needs to be reintroduced. Snapshot
        paging removes the last reason to cap or silently truncate a remote
        dataset, but it does not make first binding reachable: existing
        `preview` and `confirm` still accept a complete local dataset in one
        in-process call and therefore cannot be exposed as an HTTP body for
        unbounded history. The next smallest local dependency is one separately
        preflighted, bounded and restart-safe adoption transport that uploads a
        canonical local dataset in pages, produces a preview against one stable
        remote snapshot, and confirms exactly that reviewed plan without a
        second data authority. Mobile environment, protected token storage,
        account bootstrap and account UI remain merged behind the completed
        sync/snapshot APIs and this adoption boundary. External Resend,
        Scheduler/deletion durability, dependency acceptance, emulator/cloud
        proof and Cloud Build remain parked under `PO-033`; none changes the
        local ordering or acceptance criteria.
    - **Twentieth-A0 deterministic adoption identity and restartable canonical
      digest packet (2026-08-02; complete; independent implementation QA
      `pass`):** remove the two proven local blockers to a bounded
      adoption transport without yet adding persistence or HTTP surface.
      - **Confirmed facts:** `fingerprintDataset` is SHA-256 of the complete
        canonical dataset JSON and must remain byte-for-byte stable. The current
        Node hash cannot export a restart-safe state between bounded requests.
        Independently reproduced repo evidence also shows that two datasets
        with identical canonical fingerprints but a different input-record
        order currently produce different adoption `planId` values because
        `previewAdoption` hashes its unsorted conflict array. A whole-dataset
        finalize, trusting a client aggregate hash, partial mutation before
        confirmation or a second fingerprint algorithm would violate the
        accepted contract and architecture.
      - **Smallest coherent scope:** in `server/src/accountData.ts`, sort
        adoption conflicts canonically by `recordType`, then `recordId`, then
        `code` before both returning them and deriving `planId`. Replace only
        that module's opaque one-shot SHA implementation with one small
        dependency-free canonical SHA-256 implementation whose active runtime
        path supports update, exact validated state export/restore and final
        digest. Put it in one server-owned module, remove the `node:crypto`
        import from `accountData.ts`, route both `computeCanonicalSha256` and
        adoption `planId` through this same implementation, and delete the
        superseded one-shot path rather than retaining an alias. Add focused
        tests only.
      - **State contract:** the exported state is exactly
        `{ version: 1, algorithm: "sha256", words: [eight unsigned 32-bit
        integers], totalBytes: "canonical non-negative decimal", tailHex:
        "lowercase even-length hex" }`, with no optional or extra fields.
        `totalBytes` is less than `2^61`; `tailHex` represents 0–63 bytes,
        `tailBytes <= totalBytes`, and
        `(totalBytes - tailBytes) % 64 === 0`. Restore rejects a leading-zero
        decimal other than `"0"`, wrong version/algorithm, unsafe or
        inconsistent lengths, invalid words/hex and every non-block-aligned
        completed-byte count. Digest calculation is repeatable and
        non-mutating: it pads and finalizes only an internal copy, while the
        validated exported/restored accumulator remains appendable.
      - **Acceptance criteria:** SHA-256 results are bit-identical to
        `node:crypto` for empty/non-empty UTF-8 and binary values, every padding
        boundary around 55/56/63/64 bytes, multi-block inputs and deterministic
        page splits. Export → structured serialization → restore at every split
        yields the same digest, including a tail and exact block boundary.
        Existing record, dataset and sync-operation fingerprints remain
        unchanged for fixed fixtures. The adoption fixture whose conflicts are
        already in the declared canonical order retains its existing `planId`
        and adoption-operation fingerprint; every permutation of the same
        logical local and remote datasets converges to those exact values and
        returns the same canonically ordered conflicts. Confirmation behavior
        and all seven cases remain exact.
      - **Required evidence:** focused SHA/account-data tests including invalid
        serialized states and the reproduced permutation failure; existing
        adoption/account suites, full tests, both typechecks, server build,
        strict server unused/dead-path search including proof that
        `accountData.ts` no longer imports or calls `createHash`, gates/diff
        check and independent implementation QA `pass`.
      - **Non-goals:** adoption HTTP or Firestore state, upload pages, preview
        pagination, confirmation staging, changing the canonical dataset or
        record fingerprint algorithm/output, dependency addition, client/mobile
        code, schema/cloud/Scheduler/TTL work or a generic crypto framework.
      - **Stop conditions:** any existing canonical digest changes, the state
        cannot be validated without trusting caller metadata, restart equality
        fails at a padding boundary, the implementation exposes two hash paths,
        or the change grows beyond the one canonical digest and deterministic
        adoption-preview identity. This is a directly used canonical primitive,
        not a placeholder transport or alternate data authority.
      - **Twentieth-A0P preflight repair (2026-08-02; recorded after independent
        QA `fail`):** QA found three P2 ambiguities in the packet, not an
        implementation defect: the direct adoption-plan hash could have
        survived beside the new canonical path, the serialized state was not
        literally testable, and the stability statement incorrectly covered
        intentionally non-canonical conflict order. The repaired scope above
        now requires zero `node:crypto` hash calls in `accountData.ts`, routes
        `planId` through the same active accumulator, fixes every state field,
        bound and alignment invariant, and preserves the existing value only
        for the already-canonical fixture while all permutations converge to
        it. No implementation may begin until repeated architecture QA passes.
      - **Twentieth-A0 result (2026-08-02):** complete. Repeated architecture
        QA passed the repaired packet. One dependency-free
        `Sha256Accumulator` now owns canonical hashing and adoption `planId`;
        its exact versioned state is strictly validated, serializable,
        restartable and appendable, while digest calculation is non-mutating.
        The old `node:crypto` paths in `accountData.ts` were deleted. Adoption
        conflicts are ordered by type, ID and code before identity derivation;
        all four tested local/remote permutations converge to the pre-change
        canonical `planId` and adoption-operation fingerprint. Controller
        evidence passed 34/34 focused tests, 1,025 additional length/split/
        restore comparisons against Node SHA-256, 498/498 full tests, both
        typechecks, server build and strict-unused check, contract/content/
        privacy gates, diff and dead-path searches. Independent implementation
        QA returned exact `pass`; no P1/P2 or blocking performance/debt finding
        remains.
      - **Post-Twentieth-A0 dependency review (2026-08-02):** the repaired
        digest and preview identity remove the only local prerequisite found by
        the adoption architecture inspection. Tasks 4–14 and parked external
        items retain their order and criteria. The next coherent work is the
        complete durable adoption operation itself, not another digest helper,
        whole-dataset endpoint or mobile placeholder: one account-owned staged
        upload, bounded preparation/conflict paging, exact confirmed candidate
        generation and CAS activation on the existing account authority. Its
        state/store/HTTP contract must be independently preflighted before any
        implementation because it adds persistent operational data and crash
        recovery. No owner, secret, provider or cloud mutation is required for
        that local packet.
    - **Twentieth-A1-0 Firestore/canonical record-order alignment packet
      (2026-08-02; complete; independent implementation QA `pass`):** close
      the newly proven ordering mismatch before the durable
      adoption state machine queries remote records in semantic order.
      - **Confirmed facts:** Firestore's documented text order is UTF-8 encoded
        byte order, while `canonicalAccountDatasetValue`, merged adoption output
        and other account-record ordering currently use `localeCompare`.
        Controller reproduction orders `B`, `a`, `ä`, emoji and a private-use
        character differently under those two comparators. Therefore a bounded
        Firestore `type,id` merge and the current canonical dataset digest can
        disagree even though every record is valid. No production/mobile
        account path or production dataset exists, and the sandbox data store
        was established empty, so correcting this now needs no data migration
        or compatibility branch.
      - **Smallest coherent scope:** add one exported dependency-free UTF-8 byte
        comparator for account record keys in `server/src/accountData.ts` and
        use it for canonical dataset record order, merged record order and
        adoption conflict tuple order (`recordType`, `recordId`, then `code`).
        Remove those account-order `localeCompare` calls rather than retaining
        two comparators. Tighten account-record ID validation to Unicode-scalar
        (well-formed UTF-16) strings so distinct accepted IDs cannot collapse
        to the same replacement-character UTF-8 bytes; paired surrogates remain
        valid and lone high/low surrogates are rejected. Add focused account-data/adoption tests; update the
        account data-model documentation only to name UTF-8 byte order as the
        canonical record order. Do not add a store query or index in this
        prerequisite—the complete A1-Core packet owns both together so no
        unused persistence port is left behind.
      - **Acceptance criteria:** comparison is lexicographic over the exact
        UTF-8 bytes of `type` and then `id`, with the shorter equal prefix first;
        conflict `code` uses the same byte comparator only after equal type/ID.
        The Firestore-order witness above, valid non-BMP pairs and rejection of
        lone high/low surrogates have explicit evidence. Every permutation of the same Unicode
        dataset yields one dataset fingerprint, ordered conflict list, preview
        `planId` and confirmation result. Existing ASCII canonical fixtures,
        including the A0 fixed plan/operation identities, remain unchanged.
        No `localeCompare` remains in account-record/dataset/conflict ordering.
      - **Required evidence:** focused comparator and adoption permutations
        against an independent UTF-8 `Buffer.compare` oracle; fixed ASCII and
        Unicode digest fixtures; existing adoption/account suites; full tests,
        both typechecks, server build/strict-unused, gates/diff/dead-path and
        independent QA `pass`.
      - **Non-goals:** changing canonical object-key ordering or record payload
        encoding, Firestore queries/indexes, persistence schema, adoption state,
        HTTP/mobile/cloud work, accepting locale-dependent aliases or migrating
        nonexistent production data.
      - **Stop conditions:** the comparator cannot match Firestore's documented
        UTF-8 order for every accepted record ID, distinct accepted IDs can
        encode to the same sort bytes, an existing ASCII fixture changes, two
        ordering paths remain, or the fix requires a production
        migration. After QA pass, A1-Core must use this exact comparator and a
        matching Firestore semantic-order query; it may not reintroduce locale
        collation or in-memory whole-generation sorting.
      - **Twentieth-A1-0 repair after implementation QA `fail` (2026-08-02):**
        the first review found three active semantic-record sorts in
        `accountService.ts` still using `recordKey(...).localeCompare(...)` for
        sync-operation identity, adoption staging and the resulting sync
        dataset. The repair exported the existing record-identity comparator,
        reused it at all three call sites and added Unicode sync/staging
        evidence. It did not change canonical object-key ordering or test-store
        hexadecimal document ordering. Repeated QA was required before
        closure.
      - **Twentieth-A1-0 result (2026-08-02):** complete. One dependency-free
        comparator now defines exact UTF-8 byte order for account record
        identity, canonical datasets, adoption merge/conflicts, sync identity,
        staging and resulting sync datasets. Record IDs accept valid non-BMP
        pairs and reject every lone surrogate. The Firestore witness
        `B`, `a`, `ä`, private-use U+E000 and emoji converges across dataset,
        adoption and all 120 sync-mutation permutations; fixed ASCII
        identities remain unchanged. Controller evidence passed 37/37 focused
        SHA/adoption tests and 501/501 full tests, both typechecks, server build,
        strict-unused, contract/content/privacy gates, diff and dead-path
        checks. The only production server `localeCompare` left is the
        intentionally unchanged canonical object-key sort. Repeated independent
        implementation QA returned exact `pass`.
      - **Post-Twentieth-A1-0 dependency review (2026-08-02):** the ordering
        repair removes the last proven local prerequisite for Firestore
        semantic paging. The complete service/store/adapter A1-Core operation
        remains the next coherent task; exposing upload routes before that
        core passes would create a reachable partial workflow, so HTTP remains
        a later thin slice. Tasks 4–14 retain their order and criteria. Resend,
        Scheduler/deletion durability, dependency acceptance, emulator/cloud
        evidence and Cloud Build remain parked under `PO-033`; none blocks
        local A1-Core work and no broader product audit is needed.
    - **Twentieth-A1-Core bounded durable adoption operation packet
      (2026-08-02; completed; independent implementation QA `pass`):**
      replace the active whole-dataset adoption service with one
      complete, account-owned, restart-safe operation before exposing any new
      route.
      - **Confirmed facts and canonical authority:** `AccountDataService.preview`
        and `confirm` still read or accept a complete dataset and the latter
        stages it from memory, so they cannot safely back an unbounded launch
        workflow. The existing account head plus
        `accounts/{uid}/generations/{generation}/records/{keyHash}` remains the
        sole remote learning-data authority. The operation state lives only at
        `accounts/{uid}/adoptionOperations/current`, with staged local records
        below `localRecords/{sequenceId}` and preview conflicts below
        `conflicts/{sequenceId}`. A candidate uses the existing generation path
        keyed by its final adoption-operation fingerprint; partial candidates
        are never active or readable as account data. Recursive deletion of
        `accounts/{uid}` already owns all these descendants.
      - **Exact ordering and persistence contract:** `sequenceId` is a
        zero-padded 16-digit safe non-negative JavaScript integer beginning at
        `0000000000000000`. Uploaded local records must be strictly increasing
        by the completed A1-0 `compareAccountRecordIdentity`; conflict documents
        are strictly increasing by record type, ID and code under the same
        UTF-8 byte comparator. The Firestore adapter adds one bounded active-
        generation query ordered by `type ASC`, `id ASC`, then document ID ASC.
        Its cursor is exactly `{ type, id, documentId }` and resumes only with
        `startAfter(type, id, documentId)`. `firebase.json` must point to a
        checked-in `firestore.indexes.json` whose one entry is exactly
        `collectionGroup: "records"`, `queryScope: "COLLECTION"`, fields
        `type ASCENDING` then `id ASCENDING`; Firestore supplies the final
        `__name__ ASC` ordering. Ordered fields exist in every valid persisted
        record; accepted IDs are below Firestore's 1,500-indexed-byte boundary.
        No hash-ordered full scan plus in-memory sort is permitted.
      - **Operation identity and upload identity:** the server recomputes
        `adoptionId = computeCanonicalSha256({ expectedAccountRevision,
        expectedDatasetFingerprint, kind: "accountAdoption",
        localDatasetFingerprint, localRecordCount })`; UID is never caller
        input. A page fingerprint is the same canonical SHA path over exactly
        `{ adoptionId, kind: "adoptionUploadPage", records,
        startRecordIndex }` after exact record validation, and the server never
        trusts a client aggregate or page digest. Upload hashing begins with the
        exact bytes `{"records":[`, appends commas plus each exact canonical
        record encoding and ends with `]}` only after the declared count.
      - **Closed operation state:** one strict version-1 discriminated union is
        validated on every read; unknown, missing or extra fields are
        corruption. Every nonterminal state has exactly `version: 1`,
        `adoptionId`, `stage`, `leaseExpiresAt`, `remoteAccountRevision`,
        `remoteGeneration`, `remoteDatasetFingerprint`, `remoteRecordCount`,
        `localDatasetFingerprint`, `localRecordCount`, `stepNumber`,
        `stepToken`, `lastAdvance` and `lastUpload`. `lastAdvance` is exactly
        null or `{ expectedStepToken, receipt: { adoptionId,
        result: "advanced", stage, stepToken } }`; `lastUpload` is exactly null
        or `{ startRecordIndex, recordCount, pageFingerprint, receipt: {
        acceptedNextRecordIndex, adoptionId, pageFingerprint,
        result: "accepted", stage, stepToken } }`. Remote generation is null
        only for the canonical empty head. Active-session summaries are bounded scalars
        `{ id, fingerprint }`, never complete records or payloads.
        Stage-specific fields are literal:
        - `uploading`: `nextRecordIndex`, `lastRecordType`, `lastRecordId`,
          `localDigestState`;
        - `preparing`: `localAfterSequenceId`, `remoteAfterCursor`,
          `localProcessedCount`, `remoteProcessedCount`, `nextConflictIndex`,
          `localActiveSessionSummary`, `remoteActiveSessionSummary`;
        - `hashingPlan`: `conflictAfterSequenceId`, `planDigestState`,
          `conflictCount`, `caseId`, `result`, `localFingerprint`,
          `remoteFingerprint`, `localActiveSessionSummary` and
          `remoteActiveSessionSummary`;
        - `previewReady`: `conflictCount`, `caseId`, `result`,
          `localFingerprint`, `remoteFingerprint`, `planId`,
          `localActiveSessionSummary` and `remoteActiveSessionSummary`;
        - `hashingConfirmation`: all `previewReady` semantic fields plus exact
          `confirmation`, `confirmationFingerprint`, `localAfterSequenceId`
          and `operationDigestState`;
        - `buildingCandidate`: exactly `conflictCount`, `caseId`, `result`,
          `localFingerprint`, `remoteFingerprint`, `planId`, `confirmation`,
          `confirmationFingerprint`, `operationFingerprint`,
          `localAfterSequenceId`, `remoteAfterCursor`, `candidateRecordCount`,
          `candidateDigestState` and
          `rejectedActiveSessionId`. The rejected ID is required and equals the
          unselected side's one active-session summary only for
          `divergentActiveSessions`; it is exactly null for every other case;
        - `activatedCleaning`: `caseId`, `adoptionResult`,
          `confirmationFingerprint`, `operationFingerprint`,
          `committedAccountRevision`, `previousGeneration` and `cleanup`;
        - `discarding`: `reason` (`cancelled`, `expired` or
          `snapshotChanged`), `candidateGeneration` and `cleanup`.
        The two active-session summaries are carried unchanged from preparation
        through confirmation; the transition to candidate building derives the
        rejected ID from them and the accepted confirmation, then removes both
        summaries. `completed` has exactly `version: 1`, `stage: "completed"`,
        `adoptionId`, `confirmationFingerprint`, `operationFingerprint`,
        `committedAccountRevision`, `caseId`, `adoptionResult`, `stepNumber`,
        `stepToken` and `lastAdvance`; `cancelled` has exactly `version: 1`,
        `stage: "cancelled"`, `adoptionId`, `result: "cancelled"`,
        `stepNumber`, `stepToken` and `lastAdvance`. Terminal `lastAdvance` is
        required, carries the input token and exact final advanced receipt, and
        is the only retained replay metadata. Terminal states contain no
        binding, lease, cursor, digest, record, conflict or upload data.
        `discarded` has exactly `version: 1`, `stage: "discarded"`,
        `adoptionId`, `result: "discarded"`, `reason` (`expired` or
        `snapshotChanged`), `stepNumber`, `stepToken` and final `lastAdvance`,
        with the same terminal replay constraints.
        The exact terminal responses are `{ adoptionId, adoptionResult, caseId,
        committedAccountRevision, operationFingerprint, result: "completed" }`,
        `{ adoptionId, result: "cancelled" }` and `{ adoptionId, reason,
        result: "discarded" }`; state-only replay metadata is never exposed in
        those receipts.
      - **Initialization and nullability invariants:** a fresh operation has
        `stepNumber: 0`, the corresponding derived token, `lastAdvance: null`
        and `lastUpload: null`. Upload starts with `nextRecordIndex: 0` and both
        `lastRecordType`/`lastRecordId` null; afterward both are non-null and
        name the last accepted record. Every `*AfterSequenceId`,
        `*AfterCursor`, conflict cursor and cleanup cursor is null before its
        first consumed document and otherwise has its exact last-consumed
        cursor. Processed/count indexes begin at zero. Each active-session
        summary is null until none has been seen and remains null if that side
        has no active session; once set it cannot change. `remoteGeneration`
        and `previousGeneration` are null exactly when the bound head has no
        active generation. `candidateGeneration` is null until an operation
        fingerprint exists and is non-null exactly when an inactive candidate
        may contain records.
      - **Literal cleanup protocols:** `discarding.cleanup` is the tagged union
        `{ phase: "localRecords" | "conflicts" | "candidateRecords" |
        "finalize", cursor: null | { documentId } }`, in exactly that order;
        `candidateRecords` is skipped when `candidateGeneration` is null.
        `activatedCleaning.cleanup` is `{ phase:
        "previousGenerationRecords" | "localRecords" | "conflicts" |
        "finalize", cursor: null | { documentId } }`, in exactly that order;
        `previousGenerationRecords` is skipped when `previousGeneration` is
        null. Every document page is ordered by document ID and resumes with
        `startAfter(documentId)`. A phase changes only after a limit-one ID-only
        probe at its current cursor proves the leaf collection empty, and the
        next phase always starts with cursor null. `finalize` re-probes every
        owned leaf collection from its beginning and rechecks the head before
        atomically writing `cancelled`, `discarded` or `completed`. Generation
        container documents are never created or deleted; only their record
        leaves exist. The operation document is replaced by its terminal state,
        never deleted as a substitute for descendant cleanup.
      - **Advance concurrency/replay token:** the current token is exactly the
        canonical SHA-256 of `{ adoptionId, kind: "adoptionStep", stepNumber,
        stage }`. Each accepted `advance` transaction stores the immediately
        preceding token and its exact receipt while incrementing the step
        number and deriving the new token. The current token executes at most
        one bounded step; the immediately preceding advance token returns the
        stored receipt without work; every older or unrelated token yields
        `adoption_step_changed`. Every command that changes stage increments
        `stepNumber`, derives the new token and clears a nonmatching
        `lastAdvance`; each accepted advance does the same even when its stage
        is unchanged. Upload replay is independently keyed by its
        start index and recomputed page fingerprint, so lease renewal cannot
        manufacture a second accepted page.
        The final cleanup advance atomically creates the terminal step token and
        `lastAdvance`; the immediately preceding token replays that final
        advanced receipt, the current terminal token returns the terminal
        completed/cancelled/discarded receipt, and every other token is
        `adoption_step_changed`. Thus a crash after the final commit cannot
        repeat cleanup or lose the accepted response.
        `confirmationFingerprint` is exactly
        `computeCanonicalSha256({ abandonOtherActiveSessionConfirmed:
        confirmation.abandonOtherActiveSessionConfirmed ?? false, confirmed:
        confirmation.confirmed, planId: confirmation.planId,
        selectedActiveSessionSide: confirmation.selectedActiveSessionSide ??
        null })`; no alternate normalized confirmation shape is allowed.
      - **Lease and bounded work:** the lease is the existing exact 15 minutes;
        `now === leaseExpiresAt` is expired. Only a valid accepted start,
        upload, advance, preview read or confirmation may renew it. Each upload,
        prepare/hash/build command consumes at most 20 payload records or
        conflicts including refetched lookahead and at most 2 MiB of their raw
        canonical bytes cumulatively. Persisted record envelopes add exact
        validated `canonicalByteLength`; merge queries first read at most 22
        scalar-only descriptors total (20 consumable plus one lookahead per
        side, cumulatively at most 128 KiB), then fetch at most 20 selected full
        records whose declared lengths fit the remaining raw-byte budget.
        Descriptors are not trusted: each full record must match its descriptor
        and byte length. Each command also has a separate cumulative 2-MiB
        encoded write/delete envelope and every atomic commit independently
        fits that envelope. Adapter pages reject limits outside 1–100,
        malformed cursors/sequence IDs, noncanonical documents and unordered
        results.
      - **Service commands:** `startAdoption` input has exactly the declared
        remote/local binding, `adoptionId` and required boolean
        `restartCancelled` and `restartDiscarded`. It validates a stable head and the current
        operation slot. With no operation it returns exactly `{ adoptionId,
        result: "started", stage, stepToken }`; the zero-record dataset starts
        directly in `preparing` with the finalized empty-dataset digest and all
        other datasets start in `uploading`. The same adoption ID in a
        nonterminal state returns `{ adoptionId, result: "resumed", stage,
        stepToken }`; a matching completed operation returns its terminal
        receipt. A matching cancelled operation returns its terminal receipt
        when `restartCancelled` is false and is atomically replaced by a fresh
        operation with the same deterministic adoption ID only when
        `restartCancelled` is true and the head still matches the original
        binding. Another live operation is `adoption_in_progress`. An expired
        pre-activation operation is atomically moved to `discarding`; start
        then returns exactly `{ adoptionId: previousAdoptionId,
        result: "cleanupRequired", stage: "discarding", stepToken }` and does
        no cleanup itself. An existing `discarding` returns the same current
        cleanup-required status. `activatedCleaning`, expired or not, returns
        the analogous cleanup-required receipt and can never discard or roll
        back the active candidate. Only `advanceAdoption` performs or finalizes
        cleanup; bounded cleanup must reach a terminal before a new start.
        `uploadAdoptionPage` accepts only the exact next
        range, validates strict order, size/count and page identity, atomically
        writes records plus digest progress, and returns the same receipt for
        an exact replay of only the one `lastUpload`; gaps, partial overlaps,
        an older page or changed content are `adoption_page_conflict`. Its receipt is exactly
        `{ acceptedNextRecordIndex, adoptionId, pageFingerprint,
        result: "accepted", stage, stepToken }`. The final page, including a
        final partial page, must match declared count and digest before entering
        preparation and performs the required stage/token transition. Any
        exact `lastUpload` can replay after the stage transition from its stored
        boundary, fingerprint and receipt; no arbitrary historical subrange is
        treated as an accepted command.
      - **Preview construction:** `advanceAdoption` performs a bounded
        merge-join between sequence-ordered local records and the stable remote
        semantic query, revalidating remote revision/generation/manifest on
        every step. Exact duplicates collapse; immutable
        same-key/different-fingerprint and differing revisioned records create
        the existing canonical conflicts. Resumable summary data derives the
        same seven `caseId`/`result` values and active-session facts as
        `previewAdoption`. `hashingPlan` pages the ordered conflict documents
        through the restartable SHA accumulator to reproduce the exact existing
        preview JSON and `planId`. `readAdoptionPreviewPage` returns all scalar
        preview fields, `adoptionId`, `conflictCount`, at most 20 conflicts and
        a stable next cursor; concatenating pages reproduces the pure preview.
        The advance receipt is exactly `{ adoptionId, result: "advanced",
        stage, stepToken }` and the preview read does not change the token.
      - **Confirmation, candidate and activation:** confirmation accepts only
        the ready operation's exact `planId`. Its accepted receipt is exactly
        `{ adoptionId, result: "accepted", stage, stepToken }`; the canonical
        confirmation and its fingerprint persist through activation so an
        exact replay returns the current accepted status or completed receipt,
        while different confirmation data is rejected. Ordinary conflicts return
        `adoption_conflict` without candidate writes. Divergent active sessions
        require one selected side and confirmed abandonment; only the rejected
        active reference and drafts tied to that rejected session may be
        removed. The confirmation digest pages the staged local records and
        must reproduce `computeAdoptionOperationFingerprint` exactly; the
        operation fingerprint is the target generation. Candidate building is
        a second bounded semantic merge-join using the existing adoption rules,
        writing candidate records and restartable dataset digest/count progress
        atomically. An identical existing candidate record is replay; a
        different one is a collision with no progress. Only a complete matching
        manifest can be published in one CAS transaction that rechecks the
        original head binding, marks the candidate active, increments revision
        and appends the operation fingerprint. The former active generation is
        then cleaned while the new dataset remains active; completion is not
        reported until old-generation, staged-record and conflict cleanup has
        finished and the minimal receipt is stored.
      - **Cancel, expiry and cleanup:** cancel is allowed only before
        activation and atomically enters `discarding`; it never rolls back an
        activated dataset. Its interim receipt is exactly `{ adoptionId,
        result: "discarding", stage: "discarding", stepToken }` and replays
        unchanged only while cleanup is in progress. Discarding removes operation local/conflict docs and any
        inactive candidate generation, then writes terminal `cancelled` for a
        user cancel or terminal `discarded` for expiry/snapshot change. After
        user-cancel cleanup, the exact replay response is
        the terminal `{ adoptionId, result: "cancelled" }`; restarting that
        identical deterministic operation requires the explicit
        `restartCancelled: true` start input above and a fresh head CAS.
        A matching discarded operation returns its terminal receipt unless
        `restartDiscarded: true`; only that explicit input may atomically
        replace the same discarded adoption after a matching-head CAS. A
        different valid adoption may replace either terminal after its own
        stable-head validation.
        `activatedCleaning` removes only the prior generation and transient
        operation children before writing `completed`. A later adoption call
        continues expired or post-activation cleanup. There is no Scheduler or
        TTL claim and no autonomous background cleanup in this task. Cleanup
        reads IDs/references only, deletes at most 100 leaves per page, persists
        its cursor after every page and stops at 20 pages, 2,000 leaves or the
        cumulative 2-MiB delete envelope, whichever comes first. It must prove
        each `localRecords`, `conflicts` or generation `records` collection
        empty before finalizing its owner; parent deletion is never treated as
        cascading cleanup. Before deleting any generation record it rechecks
        that the generation is not the head's active generation.
      - **Smallest coherent code scope and deletion-first rule:** extend the one
        `AccountDatasetStore` and its Firestore adapter, add the exact query/
        index configuration and implement the complete non-HTTP service state
        machine with focused store/service tests. Preserve pure
        `previewAdoption`/`confirmAdoption` as the semantic oracle/shared rules,
        but delete the superseded whole-dataset `AccountDataService.preview` and
        `confirm`, the entire `AccountDatasetHead.transition` union, every
        `recoverTransition` hook, all head staging/rolling-back/
        activated-cleaning builders and their obsolete tests once no runtime
        import or route reaches them. There is no production migration because
        the sandbox authority is empty. The operation document is the sole
        adoption and cleanup state. Sync and snapshot continue directly against
        the active head while a pre-activation adoption exists; the adoption
        detects any head revision/generation/manifest change as
        `snapshot_changed`. Do not create a second store, authority, digest,
        comparator, compatibility alias, hidden fallback or parallel adoption
        implementation.
      - **Acceptance criteria:** all seven cases and confirmations are byte- and
        behavior-identical to the pure semantic functions; 0/1/20/21 records,
        page boundaries, 512 KiB per record and 2 MiB minus/equal/plus one are
        explicit; Unicode and input permutations preserve dataset/plan/
        operation identities; crashes before and after every transaction plus
        replay of every command converge; remote sync during upload,
        preparation or candidate build produces `snapshot_changed` and never
        publishes; conflict, active-session selection, expiry, cancel, cleanup
        and candidate collision retain the last verified datasets; no step
        reads/writes more than its declared records/documents/bytes; no partial
        generation becomes active and no client-trusted hash or full dataset is
        required in one request or memory scan.
      - **Required evidence:** new focused service/store state-machine tests and
        Firestore adapter/index conformance; exact comparison with pure
        adoption behavior; crash/replay/race/limit/Unicode fixtures; proof that
        recursive account deletion owns operation descendants; existing
        adoption, sync, snapshot, deletion and adapter suites; full tests, both
        typechecks, server build, strict-unused/dead-path searches, contract/
        content/privacy gates, diff check and independent implementation QA
        `pass`.
      - **Non-goals:** HTTP routes or request/error mapping, mobile repository,
        account UI/bootstrap, credentials or token storage, emulator/cloud
        deployment, Scheduler/TTL, Resend, dependency remediation, domain/
        paid hosting, production migration or changing the canonical account
        record/payload encoding and adoption policies.
      - **Transaction and terminal replay rules:** every transaction captures
        time and validated command input outside its callback, performs all
        head/operation/page/candidate reads before its first write, has no
        external side effect and is deterministic if Firestore reruns the
        callback. Candidate writes and operation progress are committed
        together only after all collision reads. `completed`, `cancelled` and
        `discarded`
        remain the exact replay authority until a different valid adoption is
        started or the same cancelled/discarded operation is explicitly
        restarted; that
        start may atomically replace the terminal document after stable-head
        validation. After explicit replacement, an older
        adoption ID is superseded and yields `adoption_step_changed`; the
        bounded head operation-fingerprint history still prevents duplicate
        dataset publication.
      - **Stop conditions:** the semantic Firestore query/index cannot be
        expressed with the A1-0 order; any stage needs an unbounded generation
        scan or full dataset in memory; existing digests cannot be reproduced
        incrementally; publication can occur before final digest/count and head
        CAS; cleanup could delete an active generation; or the implementation
        would retain two reachable adoption runtimes. Any such finding returns
        the packet to architecture repair before implementation.
      - **Twentieth-A1-Core-P preflight repair (2026-08-02; recorded after
        independent architecture QA `fail`):** QA found no provider blocker but
        rejected four protocol ambiguities: terminal/common fields
        contradicted one another, stage-changing non-advance commands lacked
        token/replay rules, cleanup could remain duplicated in the old head
        transition, and Firestore read-first/retry and cumulative byte/read
        bounds were not executable. The repaired packet above now gives the
        exact active and terminal unions, stage fields, receipt shapes,
        resume/replacement window and token transitions; deletes the entire
        old head-transition runtime; makes operation state the sole cleanup
        owner; locks the literal query/index/cursor; and requires descriptor-
        bounded reads, leaf-before-parent cleanup and retry-pure read-first
        transactions. No implementation may begin until repeated architecture
        QA returns exact `pass`.
      - **Twentieth-A1-Core-P2 preflight repair (2026-08-02; recorded after
        repeated architecture QA `fail`):** the second review accepted the
        Firestore bounds, sole cleanup owner and transaction rules, but found
        three remaining replay/state gaps. The repaired union now persists one
        literal `lastUpload` boundary/fingerprint/receipt and permits replay of
        only that exact page; defines the full `lastAdvance` and canonical
        confirmation-fingerprint shapes plus the rejected-session nullability
        invariant; and separates the in-progress discarding receipt from the
        terminal cancelled receipt. A required `restartCancelled` start field
        is the sole way to restart the same deterministic adoption after
        cancellation, so a late start replay cannot silently become a new
        operation. Repeated architecture QA is still required before work.
      - **Twentieth-A1-Core-P3 preflight repair (2026-08-02; recorded after the
        third architecture QA `fail`):** the reviewer found two remaining
        restart gaps rather than a provider issue. Both bounded active-session
        summaries now persist through plan hashing, preview and confirmation,
        then deterministically produce the one rejected ID at candidate entry.
        Terminal states now retain only step number/token and the final
        `lastAdvance`, so both the immediately preceding and current terminal
        tokens have explicit post-commit replay behavior without retaining a
        lease, cursor, digest or payload. Crash-after-final-commit evidence is
        mandatory. Architecture QA must still pass before implementation.
      - **Twentieth-A1-Core-P4 preflight repair (2026-08-02; recorded after two
        independent reviews of P3 returned `fail`):** one review found that
        expiry/snapshot cleanup still deleted its replay authority and that the
        candidate field list contradicted summary removal; the other required
        literal cleanup phases and initial nullability. The packet now has an
        exact replaceable `discarded` terminal and explicit restart command,
        enumerates candidate fields without the consumed summaries, fixes all
        initial/null state invariants, and defines both tagged cleanup orders,
        document-ID cursors, empty probes, generation nullability and final
        re-probes. No parent/container deletion stands in for leaf cleanup.
        One independent reviewer returned `pass`, while a second found the
        terminal cleanup-response ambiguity repaired below; implementation
        remained paused.
      - **Twentieth-A1-Core-P5 preflight repair (2026-08-02; recorded after the
        second independent P4 review returned `fail`):** exact completed,
        cancelled and discarded terminal receipts are now literal, and current
        terminal-token replay covers all three. `startAdoption` only moves an
        expired pre-activation operation to `discarding` and returns the old
        adoption ID/current token in a literal `cleanupRequired` receipt; it
        likewise reports existing discarding/activated-cleaning work. Only
        `advanceAdoption` may execute or finalize cleanup and create the final
        replay metadata. A fresh start cannot begin before that terminal state.
        Two independent repeated architecture reviews returned exact `pass`;
        the packet is implementation-ready and has no provider/owner blocker.
      - **Twentieth-A1-Core-R1 dead-mapping repair (2026-08-02; completed;
        focused evidence pass):**
        controller inspection after implementation found four unreachable
        `account_transition_*` HTTP error-map branches and two assertions that
        existed only for the deleted head-transition adoption runtime. The
        smallest coherent repair is delete-only: remove those six stale
        references without adding adoption routes, changing current HTTP
        behavior or refactoring the mapper. Acceptance is a zero-result dead
        search for the old transition/runtime vocabulary plus passing focused
        account HTTP tests, both typechecks, strict-unused and server build.
        Non-goals remain all A1-HTTP endpoints, request schemas, authentication
        changes and unrelated error-map cleanup. Required evidence is the
        focused test output, static checks, diff check and repeated independent
        implementation QA `pass` for the complete A1-Core slice.
      - **Twentieth-A1-Core-R2–R5 correctness repair packet (2026-08-02;
        completed; repeated implementation QA `pass`):** independent QA
        reproduced three defects despite the green suite: terminal start replay
        was evaluated after stale head binding, a foreign candidate document
        could survive into an activated generation, and transaction retries
        could observe a new clock value. Controller inspection also proved that
        a legal sync after candidate activation could permanently prevent
        cleanup completion. This is one closed local repair because all four
        findings meet in the same operation-state and transaction contract.
        - **Scope:** change only `server/src/accountService.ts`, the narrow
          Firestore store port/adapter in `server/src/firebaseAdapters.ts`, the
          A1-Core in-memory store and focused adoption/adapter tests, plus this
          packet. Do not add HTTP routes, dependencies, mobile code, auth,
          deployment, Scheduler or a general workflow abstraction.
        - **R2 terminal start replay:** after strict input/adoption-ID validation,
          read and validate the current operation before any head read. A
          matching `completed`, or matching `cancelled`/`discarded` without its
          explicit restart boolean, returns the exact terminal receipt without
          reading head. Restart, empty-slot creation and replacement of another
          terminal use one read-first transaction which reads current operation
          and head, proves the observed operation unchanged and proves current
          revision/fingerprint equal the input binding, then writes the fresh
          operation. A stale restart returns `snapshot_changed` without changing
          its terminal replay authority. Matching active resume/cleanup rules do
          not change.
        - **R3 complete candidate proof:** `buildingCandidate` gains exact
          `localProcessedCount` and `remoteProcessedCount`; both start at zero
          with the existing local/remote cursors null, advance by the number of
          source documents actually consumed (including rejected records), and
          neither may exceed the bound counts. Candidate publication is removed
          from this stage.
          Its last transaction writes the last candidate records, finalizes the
          expected fingerprint/count and enters `checkingCandidate`, never head.
          The closed `checkingCandidate` stage has, in addition to every exact
          `AdoptionBase` field, exactly `stage`, `conflictCount`, `caseId`,
          `result`, `localFingerprint`, `remoteFingerprint`, `planId`,
          `confirmationFingerprint`, `operationFingerprint`,
          `candidateManifestFingerprint`, `candidateRecordCount`,
          `candidateAfterDocumentId` and `candidateObservedDocumentCount`.
          `candidateAfterDocumentId` is initially null and later the exact last
          consumed physical document ID; `candidateObservedDocumentCount`
          starts at zero. The transition removes `confirmation`,
          `rejectedActiveSessionId`, both source cursors and processed counts,
          and the build digest; only the listed scalar preview fields remain for
          preview replay, while confirmation replay needs only the persisted
          canonical `confirmationFingerprint`. This stage
          pages every physical candidate leaf by document ID using at most 21
          scalar `{documentId, canonicalByteLength}` descriptors, consumes at
          most 20, re-reads and strictly validates each selected full document
          inside a read-first transaction, respects the cumulative 128-KiB
          descriptor and 2-MiB raw bounds, and rejects an observed count above
          the expected count. EOF with a different count is
          `candidate_generation_mismatch`; equal count enters
          `hashingCandidateManifest`. The closed `hashingCandidateManifest`
          stage has, in addition to every exact `AdoptionBase` field, exactly
          `stage`, `conflictCount`, `caseId`, `result`, `localFingerprint`,
          `remoteFingerprint`, `planId`, `confirmationFingerprint`,
          `operationFingerprint`, `candidateManifestFingerprint`,
          `candidateRecordCount`, `candidateAfterCursor`,
          `candidateVerifiedRecordCount` and
          `candidateVerificationDigestState`. Its semantic cursor is initially
          null, verified count is zero and digest is exactly initialized with
          the UTF-8 bytes `{"records":[`. The transition removes the physical
          cursor/count; no confirmation object, rejected-session ID, source
          cursor/count or build digest reappears. It reuses the exact semantic
          `type,id,documentId` query, reads at most 21 scalar descriptors and 20
          matching full records per step, validates every descriptor/document
          pair and recomputes the exact canonical dataset manifest. Only EOF
          with exact count and fingerprint may, in the final read-first
          transaction, CAS the original pre-activation head binding, write the
          verified manifest and enter the already closed `activatedCleaning`
          state using `caseId`, `result` as `adoptionResult`,
          `confirmationFingerprint`, `operationFingerprint`, the committed
          revision, `remoteGeneration` as `previousGeneration`, and its literal
          cleanup initial phase/cursor; all preview/proof fields are then
          removed. Extra, missing,
          unindexed, corrupt, wrong-key and same-count/wrong-content leaves must
          fail before head write. After leaving `buildingCandidate`, no
          canonical call site may write that inactive generation.
        - **R3 replay/cancel/cleanup:** both proof stages use ordinary advanced
          receipts/tokens and renew the lease only with the command-captured
          time. Exact confirmation replay returns accepted status in both.
          Preview reads remain possible because the bounded scalar preview
          fields are retained. Both are pre-activation: cancel, expiry or head
          change enters `discarding` with `candidateGeneration` equal to the
          operation fingerprint. Cleanup must delete corrupt candidate leaves
          by ID without decoding their payload; a transaction-private existence
          read is permitted solely for this cleanup, while proof retains full
          validation. The active-generation guard remains mandatory.
        - **R4 retry purity:** every public mutating command captures exactly one
          `commandNow = this.now()` after input validation and before any
          transaction callback; helpers receive it explicitly. No callback may
          call a clock, mutate a value outside its closure, perform an external
          read or produce a different write/return value on Firestore retry.
          Accumulators and next states are reconstructed inside the callback;
          the callback returns its receipt/state through `runTransaction<T>`.
        - **R5 post-activation sync:** every `activatedCleaning` step binds only
          to `head.activeGeneration === operation.operationFingerprint`.
          Revision, manifest and operation-fingerprint history may advance via
          legal sync on that same active generation. Cleanup never writes head,
          restores an old manifest/revision or deletes the active generation;
          completed receipt keeps the adoption commit revision. Missing or
          changed active generation returns explicit
          `active_generation_changed` without deletion, cursor movement or
          terminalization.
        - **Additional exact invariants:** terminal `stepNumber` is at least one.
          Its `lastAdvance.expectedStepToken` must equal the derived previous
          token for `activatedCleaning` before `completed`, and `discarding`
          before `cancelled`/`discarded`; arbitrary valid-looking hashes are
          corruption. Prepare/build reject zero consumed source records while a
          processed count remains below its declaration, and reject an extra
          source after a declared count. Skipping a rejected active reference or
          its draft is source progress even when it yields no candidate record.
        - **Acceptance:** terminal replay performs zero head reads after later
          head changes; restart/create/replacement is one binding CAS; head is
          never written by `buildingCandidate`; physical and semantic proof are
          both bounded and required before activation; all corrupt/extra/missing
          fixtures leave head unchanged and remain cancellable/cleanable; retry
          executes identical callbacks with one captured time; sync throughout
          cleanup preserves its latest data and still completes, while changed
          active generation makes no progress; predecessor tokens and no-
          progress rules are strict; no second activation path or whole-
          generation in-memory scan exists.
        - **Required evidence:** terminal replay/restart/CAS-race tests; candidate
          0/1/20/21 and Unicode proof pages; extra valid/unindexed/corrupt,
          missing, wrong-key/length/bytes and same-count/wrong-digest fixtures;
          descriptor/raw/write limits; crash before/after and token replay for
          both proof stages; cancel/expiry and corrupt-payload cleanup; a fake
          Firestore retry that discards the first writes and reruns the callback
          while the injected clock rejects any in-callback access; sync before
          each cleanup phase and finalization plus changed-generation failure;
          terminal-token and missing-source tests; focused and full tests, both
          typechecks, strict-unused, server build, contract/content/privacy
          gates, diff/dead-path checks and repeated independent QA `pass`.
        - **Non-goals:** A1-HTTP/error mapping, Scheduler/TTL, migration of
          deployed operation documents, another index, locks, cloud work or
          manual-administrator corruption after a completed proof.
        - **Stop conditions:** physical ID traversal cannot see documents omitted
          by semantic indexes; a canonical path can still write the candidate
          after `buildingCandidate`; corrupt-leaf cleanup would require a public
          raw-read path; deployed active version-1 operations require migration;
          or any evidence shows activation before both proofs, rollback of a
          newer sync, or acceptance of a changed active generation.
      - **Twentieth-A1-Core-R6 cursor/count continuity repair (2026-08-02;
        completed; repeated implementation QA `pass`):** QA
        proved that otherwise-green R2–R5 accepted persisted proof states with
        a positive processed count and null cursor, and that a staged local
        sequence `0000,0002` could conceal missing `0001` with the declared
        document count unchanged. The smallest repair changes only the strict
        validator, prepare/build source checks and focused adoption tests.
        `checkingCandidate.candidateObservedDocumentCount === 0` must be exactly
        equivalent to `candidateAfterDocumentId === null`; the corresponding
        invariant holds for `hashingCandidateManifest` verified count/semantic
        cursor. In both `preparing` and `buildingCandidate`, local processed
        count zero requires a null cursor and a positive count requires exactly
        `adoptionSequenceId(localProcessedCount - 1)`; remote processed count
        zero requires a null cursor and a positive count requires a non-null
        semantic cursor. Before either merge step, every returned local
        lookahead entry must equal `adoptionSequenceId(localProcessedCount +
        offset)`; a gap, duplicate, substitution by an extra sequence or
        impossible cursor/count is `corrupt_adoption_source_count`, with no
        operation/head write. Acceptance requires validator rejection of both
        impossible proof states and both prepare/build same-count hole-plus-
        extra fixtures, while canonical 0/1/20/21, Unicode and replay fixtures
        remain unchanged. Evidence is focused tests, both typechecks,
        strict-unused, build, full tests/gates/diff/dead checks and repeated
        independent QA `pass`. Non-goals are store/Firestore schema changes,
        HTTP/mobile/cloud work or broader state-machine refactoring. Stop only
        if the canonical zero-padded sequence cannot prove local continuity;
        current repository evidence says it can.
      - **Closure evidence (2026-08-02):** the final R2–R6 implementation
        replaces the old whole-dataset adoption runtime with the single bounded
        operation described above. Controller verification passed the 55/55
        focused adoption, adapter, deletion, configuration and SHA tests and
        the 504/504 full repository suite; root and server typechecks, server
        strict-unused, server build, contract-change, content-boundary,
        runtime-privacy and diff checks all pass. Independent QA reproduced the
        impossible cursor/count and same-count `0000,0002` failures, confirmed
        their rejection before any transaction progress, rechecked the legal
        R2–R6 stage transitions and returned exact `pass`. No emulator, cloud
        deployment or Scheduler claim is made by this local closure.
      - **Post-Twentieth-A1-Core dependency review (2026-08-02):** the service,
        store, adapter and index authority are now complete enough for one thin
        A1-HTTP exposure slice; retaining HTTP as a separate task avoids making
        request parsing or status mapping part of the durable state machine.
        The next task must expose the existing six commands only, reuse the
        current verified-email Firebase boundary and delete any obsolete
        adoption error mappings it replaces. It must not add a second service,
        alternate payload contract, hidden fallback, mobile repository work or
        cloud deployment. Later Task 3 mobile work still depends on this HTTP
        contract; Tasks 4–14 keep their order. Parked Resend, durable deletion
        scheduling, dependency acceptance, emulator/cloud and Cloud Build work
        remain independently resumable and do not block the local HTTP slice.
    - **Twentieth-A1-HTTP bounded adoption transport packet (2026-08-02;
      completed; independent implementation QA `pass`):** expose the
      completed durable operation through six thin authenticated commands on
      the existing account handler, without adding another adoption service or
      moving state-machine rules into HTTP.
      - **Confirmed repository facts:** `server/src/http.ts` currently owns the
        exact protected `POST /v1/account/sync` and
        `POST /v1/account/snapshot/page` routes, authenticates a verified-email
        Firebase token before parsing an entity, derives the UID only from its
        claims, enforces fatal UTF-8/exact JSON media/identity encoding and
        returns non-cacheable non-sniffable JSON. The completed
        `AccountDataService` already owns `startAdoption`,
        `uploadAdoptionPage`, `advanceAdoption`,
        `readAdoptionPreviewPage`, `confirmAdoptionOperation` and
        `cancelAdoption`; no adoption HTTP route or competing transport exists.
        `server/src/index.ts` already composes this same service instance.
      - **Smallest coherent scope:** change only `server/src/http.ts`, focused
        account-HTTP tests and this plan packet. If existing HTTP test doubles
        require the six newly reachable methods, update those doubles with
        explicit fail-fast implementations; do not make service methods
        optional. Define `AccountHttpService` as the exact `Pick` of the one
        `AccountDataService` command/read surface rather than duplicating six
        method signatures. No service/store/Firestore/index/environment,
        dependency, mobile, UI or deployment change is permitted.
      - **Exact routes and methods:** add only protected `POST` routes
        `/v1/account/adoption/start`, `/v1/account/adoption/upload/page`,
        `/v1/account/adoption/advance`, `/v1/account/adoption/preview/page`,
        `/v1/account/adoption/confirm` and
        `/v1/account/adoption/cancel`. Query variants, aliases, alternate verbs
        and caller-selected UID/account/generation fields remain unavailable.
        A known route with another method returns the existing 405 envelope and
        `Allow: POST`; every other path returns the existing 404 envelope before
        authentication.
      - **Request boundary:** authenticate through the existing ordinary
        verified-token path before reading or parsing the entity. Start,
        advance, preview, confirm and cancel each have an exact 4-KiB raw-body
        ceiling; upload has an exact 2-MiB raw-body ceiling. Reuse the current
        content-type, content-encoding, streamed-byte, fatal-UTF-8, BOM and JSON
        rules. Require exactly the current service keys: start has
        `adoptionId`, `expectedAccountRevision`,
        `expectedDatasetFingerprint`, `localDatasetFingerprint`,
        `localRecordCount`, `restartCancelled`, `restartDiscarded`; upload has
        `adoptionId`, `pageFingerprint`, `records`, `startRecordIndex`; advance
        has `adoptionId`, `expectedStepToken`; preview has `adoptionId`,
        `afterSequenceId`; confirm has `adoptionId`, `confirmation`; cancel has
        only `adoptionId`. The HTTP layer rejects non-object, extra/missing
        top-level keys and obviously wrong scalar/array shells; the existing
        service remains the sole canonical nested-record, confirmation,
        fingerprint, ordering and state validator and must reject malformed
        input before any store access. The handler neither trusts nor
        recomputes a second aggregate identity.
      - **Success and response boundary:** route the verified UID and exact
        validated input to only the corresponding service method and return its
        literal receipt/page unchanged with status 200. The preview response is
        encoded once and must be at most 2 MiB; its service contract already
        returns at most 20 small canonical conflict descriptors plus the exact
        scalar fields and cursor, so no transport truncation or alternate
        cursor calculation is allowed. Every success/error retains exact
        `Content-Length`, `Cache-Control: no-store`, JSON UTF-8 and
        `X-Content-Type-Options: nosniff`. No token, UID, generation, stored
        document, request body or exception/provider text is returned or
        logged.
      - **Closed adoption error map:** a provider-shaped error with any `code`
        is always `500 internal_error` before message inspection. Exactly
        `invalid_adoption_start`, `invalid_adoption_page`,
        `invalid_adoption_page_fingerprint`, `invalid_adoption_advance`,
        `invalid_adoption_preview_page`, `invalid_adoption_confirmation`,
        `invalid_adoption_cancel`, `invalid_account_dataset`,
        `invalid_account_record`, `invalid_record_payload` and
        `record_fingerprint_mismatch` map to `400 invalid_request`;
        `account_record_too_large` and
        `adoption_page_too_large` map to `413 request_too_large`;
        `snapshot_changed` and `active_generation_changed` map to
        `409 snapshot_changed`; `adoption_in_progress`,
        `adoption_page_conflict` plus
        `adoption_dataset_fingerprint_mismatch` (both publicly
        `adoption_page_conflict`), `adoption_step_changed`, `adoption_not_ready`,
        `adoption_conflict` and `active_session_conflict` map one-for-one to
        their same-named 409 public codes;
        `multiple_active_session_references` also maps to the public
        `409 active_session_conflict`. `account_data_retryable` and
        `account_snapshot_changed_retryable` map to
        `503 account_data_retryable`. Candidate/source corruption, collisions,
        proof/build envelope failures, impossible response size and every
        unknown uncoded error map only to `500 internal_error`. Do not add an
        unreachable `adoption_expired` mapping: expiry is represented by the
        service's bounded `cleanupRequired`/discarded protocol.
      - **Acceptance criteria:** the route/method matrix exposes exactly the
        existing eight account endpoints; authentication precedes entity work
        on all six new routes; valid calls dispatch once with only the verified
        UID and return byte-stable literal service results for every start/
        resume/cleanup/terminal, upload, advance, preview, confirm and cancel
        outcome. Missing/extra/UID-injected/malformed inputs and 4-KiB or 2-MiB
        limit-plus-one bodies cannot reach the store; exact-limit bodies remain
        parseable with whitespace padding. The complete closed error map,
        provider/domain collision defense, exact headers and preview-response
        ceiling are tested. Existing sync/snapshot behavior remains unchanged.
      - **Required evidence:** focused real-loopback tests for all six routes,
        exact dispatch and bodies, shared authentication, limits, encodings,
        strict top-level inputs, errors, non-leakage and response headers;
        combined existing account HTTP/service tests; full tests, root/server
        typechecks, server build and strict-unused, contract/content/privacy
        gates, diff/dead-path checks and independent implementation QA `pass`.
      - **Non-goals:** state-machine/store/Firestore changes, response
        pagination redesign, a generic router/framework, CORS/health, recent-
        auth or token-revocation policy changes, mobile repositories/networking/
        bootstrap/UI, Firebase emulator/cloud evidence, Cloud Build/deploy,
        Scheduler/deletion, Resend or any compatibility/parallel route.
      - **Stop conditions:** stop before implementation if the handler would
        need a second adoption validator or state machine, any response can
        require silent truncation, the verified UID boundary cannot be reused,
        a route needs unbounded work/body, or a provider/owner/cloud decision is
        required. Current repository evidence shows none of those conditions.
      - **Architecture preflight result (2026-08-02):** independent QA returned
        exact `pass`. The six routes, shared verified-UID boundary, literal
        service receipts, exact request/response limits, one `Pick` service
        authority and the amended closed error map are implementable without a
        second validator or state machine; no owner, provider or cloud blocker
        remains for this local slice.
      - **Twentieth-A1-HTTP-R1 thin-boundary evidence repair (2026-08-02;
        completed; repeated implementation QA `pass`):** the
        implementation is functionally green, but QA found that its adoption
        prevalidators repeated hash, numeric-range, page-count and sequence-ID
        rules already owned by `AccountDataService`, and that focused evidence
        did not prove every literal receipt variant or nested-invalid zero-store
        behavior. Repair only `server/src/http.ts` and
        `tests/serverAccountAdoptionHttp.test.ts`; do not change the service,
        store, state machine, routes, error map, limits or any other test.
        Adoption HTTP prevalidation must retain exact top-level keys and only
        the obvious JSON shells: declared strings, numbers, booleans, arrays,
        objects and `null|string` cursors. Remove the duplicate adoption hash
        regex, safe/nonnegative number rules, 1–20 page-count rule and exact
        sequence-ID rule; the existing service must classify their exact
        `invalid_adoption_*` failures before store access. Add a table covering
        byte-exact `JSON.stringify` preservation for all reachable response
        variants: start `started`, `resumed`, both `cleanupRequired` stages and
        `completed`/`cancelled`/`discarded`; advance `advanced` and all three
        terminal receipts; confirm `accepted` and `completed`; cancel
        `discarding` and all three terminal receipts; plus upload and preview.
        Add a fail-fast/counted `AccountDatasetStore` behind a real
        `AccountDataService` and prove a nested upload record with a wrong
        fingerprint plus malformed nested confirmations pass the thin HTTP
        shell, return `400 invalid_request` through the closed service map and
        perform zero store reads/writes. Acceptance is no duplicate adoption
        validator/constants in HTTP, exact literal bytes for the complete
        response unions, zero-store nested-invalid evidence, unchanged eight-
        route behavior, focused/full/static gates and repeated independent QA
        `pass`. Non-goals are any production service/store/index/mobile/cloud
        change or general HTTP refactor. Stop if the canonical service performs
        store access before validating either nested input; current code shows
        that it does not.
      - **Implementation result and evidence (2026-08-02):** the existing
        account handler now exposes exactly the six protected adoption `POST`
        routes over the one `AccountDataService`; its manually duplicated
        service interface was replaced by one exact `Pick`. R1 removed the
        duplicated adoption hash/range/count/cursor validator while retaining
        exact top-level JSON shells. Controller verification passed 28/28
        combined account HTTP tests and 513/513 full repository tests; root and
        server typechecks, server build and strict-unused, contract-change,
        content-boundary, runtime-privacy and diff checks pass. Repeated
        independent QA reproduced all literal response unions byte-for-byte,
        verified nested-invalid upload/confirmation requests against the real
        service with zero store calls, rechecked routes/auth/limits/error
        mapping/provider collision and returned exact `pass`. No service,
        store, Firestore, mobile or cloud path changed in this transport slice.
      - **Post-Twentieth-A1-HTTP dependency review (2026-08-02):** all three
        server prerequisites for first binding—ordinary sync, stable snapshot
        paging and durable paged adoption—are now complete on one authenticated
        authority. Another server-only or screen-only slice would be unused
        scaffolding. The next coherent local task is therefore the first
        reachable mobile account vertical already required by 3A-3: fail-closed
        public configuration, the one Firebase/Auth plus Cloud Run client
        boundary, protected refresh-token storage, canonical binding/sync/
        outbox repositories, bootstrap convergence gate and the approved
        entry/register/verification/sign-in/adoption/sync routes together.
        Recovery/profile/sign-out/deletion completion can follow on this same
        boundary only if the first vertical exposes those genuinely unavailable
        states rather than inventing success. Tasks 4–14 retain their order;
        parked Resend, durable deletion scheduling, dependency acceptance,
        emulator/cloud proof and Cloud Build remain independently resumable and
        do not block local implementation with injected test configuration.
    - **Twenty-first-A mobile account vertical preflight blocker (2026-08-02;
      owner/security decision deferred while independent work continues):**
      - **Objective:** make the first mobile account path genuinely reachable as
        `entry -> register/verify or sign-in -> seven-case adoption -> first
        verified sync -> Home`, with no anonymous route, fake verification or
        screen-only scaffolding.
      - **Confirmed repository/provider facts:** mobile has no account source,
        route, binding, sync metadata/outbox, SecureStore owner or network
        client. The server now supplies all eight protected account-data
        operations but no identity-link issuer. Firebase Auth REST is the
        smallest single credential path: it explicitly returns ID and refresh
        tokens, supports register/sign-in/lookup/update/OOB commands and the
        Secure Token refresh endpoint, and permits deleting the currently
        unused `firebase` package. ID tokens can therefore remain memory-only
        and only the refresh token can enter SecureStore. The public Firebase
        client API, however, does not expose a way to configure or independently
        prove the canonical 30-minute maximum for verification and recovery OOB
        codes. A device timestamp, `continueUrl` value or client-only wrapper
        would be forgeable and is not acceptable evidence.
      - **Blocking contradiction:** the canonical contract requires distinct,
        single-use verification and recovery possession links expiring after at
        most 30 minutes, while the selected no-secret native Firebase delivery
        path offers provider-managed expiry rather than that exact enforceable
        limit. The approved sign-in design also routes an unverified valid
        credential to resend, but the lifecycle currently returns that failure
        to `signedOut` while `resendVerification` is legal only from
        `verificationPending`. A worker may not invent either missing
        transition.
      - **Smallest honest decisions:** (A) extend the server with hashed,
        single-use, 30-minute verification/recovery link state and expand the
        already-approved Resend processor purpose beyond public deletion, which
        requires an owner privacy decision and later sender secret; (B) change
        the contract to truthful provider-managed Firebase expiry and reconcile
        lifecycle/design/tests, preserving the free native sender path; or (C)
        keep verification visibly unavailable, which cannot close a reachable
        mobile vertical. Option B is the smallest and lowest-cost MVP path, but
        it changes a normative security contract and therefore needs the owner.
      - **Non-goals before decision:** no SDK/REST dual path, custom Firebase
        persistence, client-enforced expiry, captured/mock production email,
        dead recovery link, anonymous Home bypass, secret creation, public
        Hosting, cloud mutation or partial mobile implementation presented as
        complete.
      - **Acceptance/evidence after decision:** one declared issuer/consumer and
        one lifecycle transition model; exact replay/used/invalid/expiry and
        non-enumeration tests; token persistence proof; register -> verify ->
        adoption -> sync -> Home navigation proof; focused/full/static gates and
        independent QA `pass`. Provider-backed proof remains separate from
        injected local tests.
      - **Overnight disposition:** Task 4 depends on this account entry and is
        skipped rather than weakened. Task 5 has only the completed lifecycle,
        family contracts and Task 2 patterns as inputs, so it becomes the first
        independent local task until the owner resolves A or B. This is a
        dependency-based skip, not a second product audit or a closure claim for
        Task 3.
- **Resolved owner input:** provider/backend path and region are fixed by
  `PO-020` as Firebase Authentication + Firestore Standard + Cloud Run in
  `europe-central2`, subject to the complete contract and conformance evidence.
- **Owner input status for 3A-3:** `PO-028` records approval of the exact
  principal fingerprint, CLI bootstrap, temporary/narrowed runtime/deployment
  IAM,
  enumerated sandbox resources, public Cloud Run transport boundary, Scheduler
  cleanup identity/job and truthful residual cost risk. Interactive browser
  authentication is an execution step the owner may still need to complete; it
  is not a new product decision. `PO-030` approves the verified official CLI
  archive and `PO-031` selects manual Cloud Build over Podman; the exact Cloud
  Build packet and deletion of the empty VM are now authorized. The VM was
  deleted and no Podman machine remains; the one cloud build still waits for
  controller acceptance of the real server. `PO-032` now approves the one
  custom public-deletion email transport and its truthful retention/secret
  boundary. Its contract reconciliation and the local server-core repair now
  have independent QA `pass`. `PO-034` remains the owner/security decision for
  crash-safe deletion recovery and the combined maintenance-job scope. Under
  `PO-033`, that external branch, Resend account/secret material and the one
  Cloud Build remain parked while independent local implementation continues.
  Production and market promotion remain unauthorized.
- **Owner decision packet 3A-1 — deletion retention (`complete`; `PO-026`
  recorded; independent QA `pass`):**
  - **Confirmed facts:** the canonical contract already requires zero live-data
    days after verified deletion, encrypted backups to expire within at most 30
    days and never restore a deleted account, and one minimal deletion proof for
    exactly 30 days containing only request ID, irreversible account-ID hash,
    request/completion timestamps and result code. Both Firestore databases have
    PITR disabled. The repository and recorded 3B operations contain no backup,
    TTL or retention-job configuration, but a provider-specific backup-schedule
    and backup listing has not yet proved external absence. Firestore reports its
    baseline one-hour version history even with PITR disabled; this cannot be
    described as zero recoverable history or used to restore a deleted account.
  - **Recommended decision:** approve the canonical limits unchanged. Keep the
    launch implementation at zero provider-backup days while backups remain
    unnecessary; the 30-day value is a ceiling if an encrypted provider backup
    becomes operationally required later, not an instruction to enable one. The
    owner approved this exact decision on 2026-08-01.
  - **Read-only feasibility and cost finding:** Cloud Run plus server-owned
    Firestore can implement zero live-data retention and a five-field proof
    cleanup boundary without enabling a backup product. Starting with no backup
    or PITR creates no backup/PITR charge. A later cleanup trigger or TTL is a
    separately priced, separately authorized operational choice, not part of
    this decision-record slice; no fixed high-cost retention service is required
    merely to record or implement the approved semantics.
  - **Evidence gaps:** PITR-off state is proven, but external absence of backups
    and schedules still needs a provider-specific read. Exact expiry, physical
    proof cleanup, denial of baseline-history/backup restore and idempotent
    deletion still require implementation tests and a sanitized sandbox drill;
    none is claimed complete by `PO-026`.
  - **Smallest coherent scope after approval:** encode and test deletion-job
    expiry/verification so live account data is absent at success, any future
    encrypted backup is inaccessible and expires no later than day 30, deleted
    accounts are excluded from restore, and the five-field deletion proof is
    removed after day 30.
  - **Non-goals:** enabling PITR or provider backups; retaining email, UID,
    learning records, raw request payloads or possession tokens as proof;
    extending retention for analytics/support convenience; claiming legal
    compliance without applicable review; or implementing account UI in this
    decision slice.
  - **Acceptance criteria:** one owner decision is recorded; contract and
    security wording remain byte-consistent; provider capability evidence proves
    the selected implementation can meet the limits before sandbox lifecycle
    acceptance; boundary tests prove zero live data at verified success, proof
    availability through its declared 30-day window, exclusion immediately
    after expiry and physical cleanup evidence, restore exclusion, crash/retry
    behavior and proof-field closure; no backup product is enabled merely to
    satisfy a maximum; focused tests and independent QA return `pass`.
  - **Required evidence:** owner decision register, exact contract/schema/test
    comparison, current Firestore PITR/backup state, provider deletion and expiry
    capability matrix, sanitized sandbox deletion drill, cost-impact statement,
    controller verification and independent QA.
  - **Stop conditions:** applicable counsel requires a stricter rule; the chosen
    provider cannot prove expiry/restore exclusion; production data or an
    irreversible backup change is required; or approval would enable a paid
    retention feature. Surface that blocker instead of adding a hidden exception.
  - **Closure evidence:** controller verification passed 21/21 canonical
    contract tests, TypeScript typecheck, the contract-change gate and
    whitespace checks. Independent QA returned the exact verdict `pass`. No
    contract value, application code, Firebase/GCP resource or paid retention
    feature changed. 3A-1 is complete and removed from active work.
- **Completed owner decision 3A-2 — account lifecycle design source
  (`APPROVED`; candidate and focused-finalization QA `pass`):**
  - **Confirmed facts:** `PO-009` fixes Quiet Layered, Task 2 completed the
    shared shell with independent QA `pass`, and the canonical contract plus
    launch-surface inventory already enumerate every account lifecycle surface
    and state. No registered `APPROVED` design reference covers account UI;
    `focus-lab-core-shell-001` owns only the shared shell/core journey and cannot
    be relabelled as an account design. The contract gate requires a separate
    approved reference before user-facing implementation is ready.
  - **Recommended decision:** authorize derivation of one complete
    account-lifecycle design from `PO-009`, the completed Task 2 shell and the
    Task 1 contract, including operational copy derived from declared outcomes,
    plus conditional authorization to register the finished reference as
    `APPROVED` only when it satisfies every acceptance criterion enumerated
    below, controller inspection passes and independent QA returns `pass`. If
    any of those conditions is unmet, the reference cannot be `APPROVED` and
    Task 3 cannot start. Do not create style alternatives or require another
    visual-direction choice. The owner granted this exact authorization on
    2026-08-01 and asked the controller to surface future dilemmas for explicit
    consent or preference rather than silently choosing them.
  - **Smallest coherent scope after authorization:** the requested owner
    authorization covers derivation and only the conditional approval path:
    create one canonical
    `account-lifecycle-001` design package and one composite visual reference;
    cover account entry, registration, verification, sign-in, recovery/reset,
    expired-session reauthentication, profile, data adoption, sync/conflict,
    sign-out, account deletion and public deletion request with all declared
    success, validation, rate-limit, offline, remote-failure and destructive
    states; define one reusable form-field anatomy; complete the enumerated
    acceptance checklist; register the candidate as `PENDING`; obtain controller
    inspection and independent QA `pass`; only then transition the same reference
    to `APPROVED`. Shared components/navigation retain their Task 2 ownership.
    No `uiOwnership` entry is added for a non-existent future account path;
    Task 3 must add ownership for its real account source in the same slice that
    creates that source. Authorization does not permit an `APPROVED` state before
    the design evidence exists.
  - **Non-goals:** implementing UI/backend/routes; inventing legal terms,
    consent or marketing promises; changing identity methods, lifecycle states,
    Quiet Layered or Task 2; producing one mockup per state, empty frames, fake
    success, a second shell/design system or stylistic variants.
  - **Acceptance criteria:** one reference covers the complete canonical
    surface/state matrix without omissions; each archetype has one dominant
    action and explicit loading/error/conflict/destructive behavior;
    `forgotPassword` and `publicDeleteRequest` use truthful non-enumerating copy,
    while `register` preserves the declared `duplicateIdentity` outcome and
    `signIn` preserves `unverifiedIdentity` only after a valid credential;
    small-screen, large-text, keyboard, error focus, autofill/password-manager,
    accessibility names and touch targets are specified; the new form primitive
    is defined once without implementation; registry validation, contract gate,
    artifact inspection and independent QA return `pass`; the reference becomes
    `APPROVED` only after all preceding criteria and controller inspection pass;
    the candidate is `PENDING` until then, and no ownership metadata names a
    source path that does not yet exist.
  - **Required evidence:** owner conditional-authorization record, exact
    contract-to-design coverage matrix, Task 2 primitive reuse map, finished
    design document and composite reference, completed enumerated acceptance
    checklist, rendered visual inspection, focused validation/contract checks,
    controller diff and artifact-inspection result, independent QA `pass`, and
    an approval trail showing the registry transition to `APPROVED` only after
    all preceding evidence exists. The Task 3 implementation packet must retain
    explicit evidence that real account source ownership is added together with
    the first real account UI source, not in this design-only slice.
  - **Stop conditions:** any enumerated acceptance criterion is unmet,
    controller inspection does not pass or independent QA does not return
    `pass`—in each case the reference remains non-`APPROVED` and Task 3 does not
    start; owner requires a different visual direction; legal copy/consent is
    necessary to complete a screen; the contract lacks an outcome needed by the
    design; or the package would require implementation code to pretend
    completeness. Surface the blocker instead of inventing it.
  - **QA preflight repair packet (2026-08-01; complete; independent re-QA
    `pass`):**
    independent QA returned `fail` because the proposed decision hid a second
    owner act—approval of the not-yet-existing design—and applied
    non-enumeration to surfaces whose canonical outcomes intentionally disclose
    `duplicateIdentity` or `unverifiedIdentity`.
    - **Scope:** make the requested owner decision explicitly cover derivation
      plus conditional authorization to register the resulting reference as
      `APPROVED` only after every enumerated acceptance criterion, controller
      inspection and independent QA `pass`; otherwise it remains unapproved.
      Limit non-enumerating copy to `forgotPassword` and
      `publicDeleteRequest`, while `register` preserves `duplicateIdentity` and
      `signIn` preserves `unverifiedIdentity` only after a valid credential.
    - **Non-goals:** weakening the design gate, inventing a blanket privacy
      response, suppressing canonical errors, approving an unseen artifact
      without conformance evidence, changing lifecycle states or starting
      design/implementation work.
    - **Acceptance criteria:** the owner sees one truthful combined decision
      with the exact conditional approval boundary; a failed criterion or QA
      cannot produce an `APPROVED` reference; disclosure behavior maps exactly
      to the canonical operations; the complete original scope remains intact;
      repeated independent QA of the decision packet returns `pass`.
    - **Required evidence:** repaired packet diff, exact contract disclosure
      comparison, conditional approval trail from owner authorization through
      completed criteria, controller inspection and independent QA `pass` to
      the approval-state transition, and the repeated QA verdict.
    - **Closure evidence:** controller inspection and whitespace checks passed;
      repeated independent QA confirmed both prior high findings closed and
      returned the exact verdict `pass`. No design artifact, registry entry,
      runtime code or external resource was created during this preflight.
  - **Controller architecture refinement (2026-08-01; recorded before candidate
    implementation):** the schema's canonical `PENDING` status is used during
    artifact review. The candidate reference may enter the registry as `PENDING`
    but cannot satisfy user-facing readiness. After controller inspection and
    independent QA `pass`, one focused finalization changes that same reference
    to `APPROVED` and repeats validation/QA. Because `src/features/account/`
    does not yet exist, this slice must not add a placeholder ownership entry;
    the first Task 3 UI implementation adds ownership atomically with real code.
  - **Candidate implementation evidence (2026-08-01):**
    `docs/designs/account_lifecycle/DESIGN.md` records the exact 13-surface
    canonical state matrix, archetypes, operational copy/disclosure rules, one
    form-field anatomy, accessibility/layout behavior and Task 2 primitive
    reuse. One ImageGen-produced composite reference is stored at
    `docs/designs/account_lifecycle/account-lifecycle-reference.png`, derived
    from `option-3.png` and inspected for complete frames, readable English
    copy, Quiet Layered hierarchy, one dominant action and absence of pre-
    bootstrap bottom navigation. The registry contains the one
    `account-lifecycle-001` reference as `PENDING`, with no future account
    `uiOwnership`; the focused contract test proves it cannot satisfy a ready
    user-facing task. The repaired authority also closes profile, seven-case
    adoption, sync evidence, verified-export/discard and possession-verified
    deletion presentation, and assigns remote sign-in failure to a form-level
    banner. Controller inspection and independent QA remain required before any
    finalization to `APPROVED`.
  - **Owner-requested Fitaly consistency packet (2026-08-01; repair applied;
    controller inspection and independent QA pending):** the owner authorized
    Fitaly as a secondary consistency
    reference. Static inspection is sufficient; the sandbox cannot access
    CoreSimulatorService, and starting another runtime is unnecessary to resolve
    the concrete interaction patterns.
    - **Scope:** compare Fitaly's auth layout, login, shared text input,
      keyboard-aware form shell and account-deletion screen against the Patternly
      candidate; retain its persistent labels, secure reveal target, autofill,
      keyboard/scroll behavior, form-level remote-error placement, safe-area
      action placement and explicit destructive warning only where they agree
      with Patternly's canonical contract and Quiet Layered.
    - **Required repair:** the generic `signIn.invalidCredential` message belongs
      to the form, not specifically to the password field. Move the exact
      “Email or password is incorrect.” message in the composite to a restrained
      form-level error banner and state the same ownership rule in the design
      authority/report; field-level messages remain only for validation owned by
      one field.
    - **Non-goals:** importing Fitaly code, tokens, olive/terracotta palette,
      ornament, brand, username or Terms field; copying its reset-password
      account-existence disclosure; changing Patternly deletion reauthentication,
      copy, lifecycle, shell or visual direction; launching a second runtime when
      static source is decisive; generating another style variant.
    - **Acceptance criteria:** Fitaly is documented as non-authoritative
      interaction evidence; adopted and rejected patterns are explicit; the
      final raster places the generic credential failure at form level while
      preserving exact copy and all four Quiet Layered screens; no Fitaly
      dependency/runtime/source enters Patternly; candidate tests/checks and
      independent QA still pass.
    - **Required evidence:** cited local Fitaly source comparison, repaired
      DESIGN/report/candidate raster, side-by-side visual inspection, unchanged
      runtime/config boundary, controller checks and independent QA.
    - **Repair evidence:** static inspection of Fitaly `AuthScreenLayout`,
      `LoginScreen`, shared `TextInput`, `FormScreenShell`, `DeleteAccountScreen`
      and theme definitions is mapped in the authority/report as
      non-authoritative interaction evidence with adopted and rejected patterns.
      One built-in ImageGen edit moved the unchanged generic credential copy to
      a compact form-level banner above Email, removed Password ownership and
      preserved every other Quiet Layered screen/text/crop with no bottom
      navigation. No Fitaly runtime, dependency, import, token or copy entered
      Patternly; `PENDING` is unchanged.
  - **Controller semantic-completeness repair packet (2026-08-01; repair
    applied; controller inspection and independent QA `pass`):** controller
    review found that enumerating all 99 state names
    is necessary but not sufficient to carry the deeper Task 1 behavior into an
    implementable design.
    - **Scope:** add exact content/action requirements for `accountProfile.ready`
      (identity, sync evidence and security/destructive entry rows), every
      adoption preview case and confirmed divergent-session abandonment, all
      declared sync evidence fields, sign-out's verified export then explicit
      discard sequence, and the same explicit deletion scope on the possession-
      verified public path. Keep remote credential failures form-level while
      validation owned by one field remains inline.
    - **Non-goals:** new lifecycle states, invented merge policy, raw internal
      codes in learner copy, a default conflict winner, silent discard, a second
      account settings surface, backend/provider behavior or implementation.
    - **Acceptance criteria:** the design can be implemented without guessing
      how the profile, adoption, sync, export/discard or public deletion states
      present their canonical data and choices; a divergent active session
      requires explicit choice and abandonment confirmation; export success is
      verified before discard is offered and discard is separately confirmed;
      sync evidence remains human-readable; no silent overwrite/loss path is
      introduced; checks and independent QA pass.
    - **Required evidence:** repaired authority/report sections mapped to the
      relevant Task 1 fields, controller contract comparison, targeted tests and
      QA verdict.
    - **Repair evidence:** `accountProfile.ready` now requires verified identity,
      human-readable sync evidence, security and sign-out/delete rows; all seven
      `adoption.cases` map local/cloud summaries to their exact results, including
      explicit divergent-session selection and confirmed abandonment; all four
      `sync.visibleEvidence` fields have human-readable rules and never expose raw
      codes; `signOut.exportRequired` requires verified file handoff before a
      separate discard offer and confirmation; and
      `publicDeleteRequest.verifyPossession` repeats the exact authenticated
      deletion scope before destructive confirmation. These are presentation
      requirements inside the existing 13 surfaces/99 states, not new lifecycle
      states or implementation.
  - **Candidate review result (2026-08-01; complete):** controller inspection
    confirmed exact 13/13 surface and 99/99 state parity, the complete semantic
    mappings above, the side-by-side Quiet Layered visual result, `PENDING`
    readiness rejection, absence of future account ownership/runtime work and
    all focused checks. Independent QA repeated the contract, artifact,
    architecture, debt, documentation, visual and whitespace checks and returned
    the exact verdict `pass` with no blocking or high finding. This pass
    satisfies the conditional owner authorization for the focused approval
    transition; it does not itself mutate the registry.
  - **Focused approval-finalization packet (2026-08-01; complete; repeated
    independent QA `pass`):**
    - **Confirmed facts:** the same complete `account-lifecycle-001` candidate
      has passed every enumerated acceptance criterion, controller inspection
      and independent QA; `PO-027` conditionally authorizes its approval only
      after that evidence, which now exists. The registry and readiness test
      still intentionally treat it as `PENDING` until this focused transition.
    - **Smallest coherent scope:** change only this reference from `PENDING` to
      `APPROVED`; update the focused contract expectation so a ready task using
      this exact reference resolves successfully; update the design authority,
      PO-027, report and this plan with the truthful approval trail and repeated
      verification result.
    - **Non-goals:** editing the design content or raster; adding account UI,
      routes, backend, cloud resources, provider logic, `uiOwnership`, a second
      reference, compatibility/fallback code, feature flags or any Task 3
      implementation.
    - **Acceptance criteria:** exactly one existing reference changes approval
      status; the readiness resolver accepts it only as `APPROVED`; all prior
      design content and visual evidence remain unchanged; no account ownership
      is registered before real source exists; canonical tests, typecheck,
      contract gate and whitespace checks pass; controller inspection finds no
      unrelated change; repeated independent QA returns exact `pass`.
    - **Required evidence:** minimal focused diff, unchanged PNG checksum and
      design-content comparison except status/audit wording, passing focused
      tests/checks, controller inspection, repeated independent QA and final
      downstream-plan reevaluation before Task 3 starts.
    - **Stop conditions:** any content/raster/runtime/ownership drift, a failed
      readiness or contract check, an unrelated refactor, or QA `fail` leaves
      3A-2 open and requires a recorded small repair before repetition.
    - **Implementation evidence:** before the transition, the unchanged
      1,656,669-byte PNG had SHA-256
      `5914595ac35a76b208555fded011ab0c8d914b01c754ef5bb51e453cf1cf880e`.
      The pre-transition allowed-file diff contained three tracked files
      (`canonical-product-contract.yaml`, the canonical contract test and the
      owner decision register: 1,012 insertions/2 deletions from the complete
      working diff) plus the three untracked design/report/plan documents. The
      implementation changed only `account-lifecycle-001.approvalStatus`, its
      exact readiness expectation and current status/audit wording. The PNG,
      design content, general `PENDING` rejection rule, other references,
      `uiOwnership` and runtime remain unchanged. Focused verification passed;
      the canonical suite returned 21/21, typecheck and the contract gate
      against `HEAD` passed (42 paths), and tracked/untracked-document whitespace
      checks found no error. The post-transition PNG remains 1,656,669 bytes with
      the identical SHA-256
      `5914595ac35a76b208555fded011ab0c8d914b01c754ef5bb51e453cf1cf880e`.
      The stale specific expect-throw is absent while the general `PENDING`
      rejection fixture remains. No placeholder ownership or new path exists.
      Controller inspection repeated the readiness, exact-reference, checksum,
      scope, dead-code and focused test checks. Independent QA then repeated
      those checks read-only, confirmed the unchanged 13/13 and 99/99 design
      authority and returned the exact verdict `pass` with no blocking or high
      finding. The transition is complete.
  - **Direct evidence:**
    `docs/designs/account_lifecycle/DESIGN.md` and its checked-in approved PNG;
    the duplicated task report remains available in Git history.
- **Deferred release-promotion inputs:** select one professional market host and
  control the owned domain/DNS; authorize public deployment of the one static artifact;
  verify the transactional-email sender domain; and provide signing/team access
  to freeze exact AASA/assetlinks identities before Tasks 12–13. Installed
  signed-link drills remain acceptance evidence inside Tasks 12–13 and feed
  Task 14; none of these are local/emulator Task 3 inputs.
- **Closed 3A-2 boundary:** the same account-design reference is `APPROVED` and
  both candidate review and focused-finalization review passed independent QA.
  3A-2 is removed from active work. The first real Task 3 slice must add account
  ownership only together with real account source; a placeholder adapter,
  empty Hosting artifact, fake local account, hidden bypass or speculative
  provider dependency would violate the canonical architecture.
- **Resolved access checkpoint (2026-08-01):** the first post-3B-5 read-only
  Hosting query returned `Authentication Error: credentials are no longer
  valid` before returning project data. Firebase reauthentication then
  completed successfully. Fresh read-only `hosting:sites:list/get` queries
  confirmed exactly one `DEFAULT_SITE` in each matching project:
  `patternly-app-sandbox` at `https://patternly-app-sandbox.web.app` and
  `patternly-app-production` at
  `https://patternly-app-production.web.app`. That CLI site metadata does not
  expose or prove the absence of custom-domain attachments, so attachment state
  remains unverifiable until Firebase Console/API evidence is captured.
- **Historical 3A-0 preflight checkpoint (2026-08-01; independent QA `pass`):**
  the read-only preflight established the two reserved default Hosting sites,
  custom-domain and pricing constraints, and zero repository/Firebase/DNS/
  purchase mutations. Its earlier domain-shortlist and public-default-host
  activation directions are superseded and removed from active work by
  `PO-025`; the current canonical decision is the local-only policy below.
- **Owner decision 3A-0 / `PO-025` — final pre-market access constraint
  (2026-08-01; complete; independent QA `pass` after two focused repairs;
  supersedes
  both domain-shortlist and public-default-host activation):**
  - **Owner requirement:** during product work the web surface must be
    unavailable from the public Internet and usable only from the owner's
    workstation, including the controller's local work in this repository.
  - **Goal:** keep one future-promotable static artifact canonical without
    creating it before its real Task 3 pages exist, and enforce the Firebase
    Hosting Emulator as its sole local serving path before market promotion.
  - **Scope:** keep both reserved `*.web.app` sites empty; configure the one
    canonical Hosting artifact only when its real Task 3 pages are authored;
    bind its emulator explicitly to IPv4 loopback `127.0.0.1`; add a focused
    repository guard proving pre-market Hosting is unpublished/local-only; use
    local Auth action-link/emulator evidence where an Internet callback would
    otherwise be required; and retain professional-host/domain selection plus
    public deployment as a release-promotion gate before native signing.
  - **Threat boundary:** the requirement excludes public-network access, not
    other trusted processes or OS users already able to access the owner's
    workstation. OS/session security remains the workstation access control.
  - **Non-goals:** deploying to either default Hosting site or a preview
    channel; binding to `0.0.0.0`, a LAN address or a public tunnel; activating
    Netlify or any other public host/proxy before gate 11A; JavaScript-only
    passwords, obscurity tokens, fake login success or a second static artifact;
    domain/DNS purchase or mutation; weakening the final market-domain/store
    gate.
  - **Acceptance criteria:** while no real Task 3 public-page artifact exists,
    the repository has no Hosting deploy target and a focused guard rejects a
    public default/preview target or public-deploy script. In the same later
    coherent slice that authors the real artifact, the only accepted pre-market
    configuration binds its Hosting emulator to `127.0.0.1` and the guard
    rejects every non-loopback bind; no Hosting content is deployed externally;
    the same eventual static artifact remains the only artifact promoted later
    through the single provider/adapter selected at gate 11A; Task 3 may use
    local link handling but cannot claim public-link or signed-app association
    completion; the market domain, public deployment and live response/identity
    proof remain mandatory before Tasks 12–13 start; installed signed-link proof
    remains mandatory inside Tasks 12–13 before Task 14; stale public-default
    host activation and candidate-checkout work are removed; checks and
    independent QA return `pass`.
  - **Required evidence:** current empty-site/read-only facts; Firebase
    emulator binding/config documentation; focused configuration test;
    repository search proving no public Hosting deploy/preview path; updated
    contract/decision/plan/report; diff, typecheck/test/contract gates and
    independent QA.
  - **Stop conditions:** Firebase tooling cannot enforce loopback; any
    required test needs a public callback; a deployed Hosting release already
    exists; or a public endpoint/tunnel is required. Surface the limitation
    rather than replacing access control with an untrusted fallback.
  - **Report target:**
    `docs/reports/launch-003a0-domain-hosting-decision.md`.
  - **Implementation evidence:** `firebase.json` still contains only the
    Firestore rules target; `.firebaserc` contains only the two project aliases;
    no public directory, Hosting target or deploy/preview script was added.
    `tests/firebaseHostingPreMarketPolicy.test.ts` accepts this current absence,
    accepts a later real artifact only with exact `127.0.0.1` Hosting-emulator
    binding, and rejects public site/target mappings, live/preview deploy
    commands and every other bind host.
  - **QA repair packet (2026-08-01; recorded before repair):** initial
    independent QA returned `fail` because the existing Expo web script used
    its default LAN mode, the guard missed official `hosting:clone`, legacy
    `firebase serve` and workflow/config-override publication paths, and a
    Hosting array could represent multiple artifacts.
    - **Scope:** force the canonical Expo start/web scripts to localhost-only;
      make the guard accept exactly zero current Hosting artifacts or one later
      object with exact `127.0.0.1` emulator binding; reject arrays, LAN/tunnel
      Expo starts, Firebase live/preview/clone/legacy-serve paths, Hosting deploy
      workflows and executable alternative-config overrides; add negative
      fixtures and reconcile the evidence wording.
    - **Non-goals:** adding a Hosting artifact, changing app behavior beyond the
      local development bind, blocking native simulator builds, external
      deployment/mutation, or broad command-policy refactoring.
    - **Acceptance criteria:** `npm start` and `npm run web` cannot expose the
      development server to LAN/tunnel; every QA-proven Firebase bypass fails
      the focused test; two Hosting entries fail; the current no-artifact state
      and one exact future loopback object with one non-empty repository-relative
      `public` path pass; missing, blank, absolute or parent-traversing artifact
      paths fail rather than creating placeholder or broad local exposure;
      focused/full relevant tests, typecheck, contract gate, whitespace and
      repeated independent QA all pass.
    - **Required evidence:** exact package scripts, positive/negative policy
      fixtures, executable-path scan, controller verification and repeated QA.
  - **Second QA repair packet (2026-08-01; recorded before repair):** repeated
    QA confirmed the first findings closed but returned `fail` because the
    executable guard still allowed alternative public hosts and tunnels.
    - **Scope:** extend the same focused scanner and fixtures to reject Firebase
      App Hosting, Netlify, Vercel, Cloudflare Pages/tunnels, ngrok, localtunnel,
      EAS Hosting and their common CI actions/CLI publication paths.
    - **Non-goals:** a generic ban on `deploy`, blocking the authorized future
      Cloud Run API path, attempting OS-wide command interception, adding a
      dependency scanner unrelated to an executable exposure path, or changing
      any external service.
    - **Acceptance criteria:** each bounded alternative host/tunnel example and
      CI action fails; ordinary Cloud Run deploy text remains outside this web
      exposure rule; current scripts/workflows pass; focused tests, typecheck,
      contract gate, whitespace and a third independent QA all pass.
    - **Required evidence:** negative fixtures for every bounded provider/tunnel,
      one non-regression fixture for allowed Cloud Run API deployment, current
      executable-path scan, controller rerun and third QA verdict.
    - **Repair evidence:** canonical `start`/`web` scripts now use only
      `--localhost`; native build scripts are unchanged. The focused guard scans
      package scripts, `scripts/` and `.github/workflows`, accepts the current
      zero-artifact state or one later Hosting object with one non-empty safe
      relative `public` path and exact `127.0.0.1`, rejects placeholder/unsafe
      paths and every Hosting array, and has explicit negative fixtures for all
      QA-reported Expo, Firebase CLI, alternate-config/host and workflow bypasses.
      It now also rejects the bounded Firebase App Hosting, Netlify publication,
      every Vercel CLI invocation (including default previews), Cloudflare
      Pages/tunnel, ngrok tunnel/start, localtunnel and EAS Hosting CLI/action
      paths while a positive `gcloud run deploy patternly-api` fixture proves
      the Cloud Run API path is not blocked by a generic `deploy` rule.
  - **Closure evidence:** controller verification passed 23/23 focused and
    adjacent contract/configuration tests, TypeScript typecheck, the canonical
    contract-change gate and whitespace checks. The third independent QA
    returned the exact verdict `pass`. No Firebase, DNS, Hosting or other
    external state was changed. 3A-0 is complete and removed from active work.

**Controller prerequisite 3B — sandbox/production projects and credential
boundary (`complete; independent QA pass`)**

- **Goal:** establish two real, isolated Firebase/GCP environments, the
  approved cost boundary and a verified keyless deployment/runtime policy.
  Concrete service identities and IAM are created only with the first real
  Task 3A deployment, never as pre-code placeholder infrastructure.
- **Pre-creation fact (2026-08-01, before 3B-1):** Firebase CLI `15.19.0` was
  installed and authenticated. Its project list contained two active projects
  belonging to other products and neither exact Patternly project ID.
- **Current facts after PO-024 implementation (2026-08-01):** both exact
  projects retain one Standard `(default)` Firestore database in
  `europe-central2`, deletion protection enabled, PITR disabled, byte-exact
  deny-all client rules and the email/password-only `FIREBASE_AUTH` foundation.
  Firebase app and user counts remain zero. `patternly-app-sandbox` is linked
  to the unique open PLN billing account; `patternly-app-production` remains
  unbilled. Sandbox has one monthly `5 PLN` all-service alerts-only budget and
  one monthly `5 PLN` Cloud Run-only Preview spend cap in `Configured` state.
  The owner confirms 50/80/100% actual plus supported 100% forecast handling,
  default IAM role recipients and no Pub/Sub/additional Monitoring channel.
  Cloud Run, Billing Budgets, Secret Manager, IAM Credentials, Artifact
  Registry and Cloud Build APIs remain disabled in both projects; no
  user-managed key or service-account Owner/Editor binding exists. No Cloud Run
  definition, Firebase client environment or production-shaped server exists
  in the repository.
- **Completed slice 3B-1 — empty project shells (`QA pass`, authorized by
  `PO-021`):** the worker created exactly the two declared projects with
  `firebase projects:create` and did not initiate billing, service configuration,
  IAM, secret, credential or repository-write operations.
- **3B-1 acceptance criteria:**
  1. Both exact IDs are returned as distinct active Firebase/GCP projects under
     the authenticated account, with the declared display names.
  2. A fresh read-only project listing independently confirms both projects and
     their Firebase resource registration without modifying either unrelated
     existing project.
  3. The worker initiates no billing link, Blaze upgrade, Firestore database,
     Authentication method, Cloud Run service, IAM grant, secret, downloaded
     credential or repository write. The automatic Firebase baseline created by
     `firebase projects:create`, including the empty default Hosting reservation,
     is the explicit exception. Evidence confirms billing disabled, empty
     Firebase app lists and Firestore disabled; it does not assert that
     Authentication, Cloud Run, IAM or Secret Manager resources are absent
     without service-specific verification.
  4. If either exact ID is unavailable, permission/organization policy blocks
     creation or the CLI requires billing/additional scope, stop without an
     automatic suffix, substitute project, deletion or broader operation.
- **3B-1 required evidence:** sanitized create results for both exact IDs, a
  fresh `firebase projects:list --json` result and repository status proving no
  worker-attributable file change.
- **Historical 3B-1 implementation checkpoint (2026-08-01, before 3B-2; QA
  `pass`):** both exact projects were `ACTIVE`, had no registered Firebase apps
  and reported `billingEnabled: false`; the Firestore API was disabled in both.
  Project creation automatically reserved a default `*.web.app` Hosting site
  and live channel per project, but both URLs return `404` and no content was
  deployed.
  At that historical checkpoint the automatic reservation did not select a
  public host. `PO-025` later selected only the local Firebase Hosting Emulator
  workflow, not either generated URL or a market provider. Evidence is recorded in
  `docs/reports/launch-003b1-project-shells.md`.
- **Completed slice 3B-2 — no-billing Firestore security foundation
  (`QA pass`):**
  - **Goal:** establish two empty server-owned Firestore Standard databases in
    the locked Warsaw region and a checked-in deny-all client-rule boundary
    while both projects remain unbilled Spark projects.
  - **Completed implementation scope:** added only the canonical Firebase
    project aliases and Firestore-rule deployment configuration; created exactly
    one `(default)` Standard database in each existing Patternly project at
    `europe-central2`, with deletion protection enabled and PITR disabled;
    deployed one exact deny-all rule set to both projects; added narrow tests for
    aliases, deploy scope and the complete rule content.
  - **Non-goals:** billing/Blaze, Cloud Run, Authentication, Firebase client-app
    registration or SDK, Hosting deployment or selection, indexes without a
    real query, TTL, backups, PITR, clone/restore, data, IAM changes, Secret
    Manager, service-account keys, application code or another database.
  - **Inputs:** `PO-020`, completed 3B-1 project identities, official current
    Firestore location evidence for `europe-central2` (Warsaw), Firebase CLI
    `15.19.0` database-create support and the existing `billingEnabled: false`
    evidence for both projects.
  - **Acceptance criteria:**
    1. Preflight proves neither project has a Firestore database and both still
       report `billingEnabled: false`; any contradiction stops the slice.
    2. Each project contains exactly one `(default)` Firestore database with
       edition `STANDARD`, location `europe-central2`, deletion protection
       enabled and PITR disabled; no automatic or substitute location is used.
    3. One checked-in Firestore rules file denies every client read and write at
       every document path. The exact same compiled rules are deployed to both
       projects, with no permissive bootstrap rule or server/client fallback.
    4. Repository configuration declares only explicit `sandbox` and
       `production` aliases plus Firestore rules deployment. It has no default
       project alias, Hosting/Functions/Storage/Auth deployment target, secret,
       generated credential or empty future index configuration.
    5. Both projects still report `billingEnabled: false` after creation and
       rule deployment. No worker-initiated operation touches Authentication,
       Cloud Run, Hosting, IAM, Secret Manager, client-app registration or an
       unrelated project.
    6. Focused configuration/rule tests, Firebase rules compilation/deployment,
       read-only database detail checks, contract-change gate, diff check and
       independent QA all pass.
  - **Verification:** exact-file tests for aliases/deploy scope/deny-all rules;
    sanitized CLI create/deploy results; `firestore:databases:get` for both
    projects; direct post-operation billing checks; project/config diff review;
    independent QA `pass`.
  - **Required evidence:** database name, edition, location, protection/PITR
    state and create time for each project; matching rules release/deployment
    evidence; post-operation billing status; scoped changed-file list and test
    output.
  - **Risks:** database location is permanent; Firestore API enablement is an
    expected side effect; project creation already reserved empty Hosting sites
    that must remain unused; a partial one-project success must be reported and
    must not trigger deletion, location substitution or automatic retry.
  - **Stop conditions:** either database unexpectedly exists; billing is
    enabled or requested; the CLI selects a different edition/location or
    requires a broader service; permissions fail; or one project succeeds and
    the other fails. `PO-022` supplies authorization only inside this exact
    boundary.
  - **Report target:** `docs/reports/launch-003b2-firestore-foundation.md`.
  - **Implementation checkpoint (2026-08-01; QA `pass`):** both projects have
    exactly one Standard `(default)` database in `europe-central2`, deletion
    protection enabled, PITR disabled and `freeTier: true`. Active remote rules
    match the checked-in deny-all file byte-for-byte with SHA-256
    `cd5089e4e5116dbb994013dc5fd5e7e411ec348935b8d06d13acd00173cca15b`.
    Both projects still report `billingEnabled: false`. Evidence is recorded in
    `docs/reports/launch-003b2-firestore-foundation.md`.
- **Completed slice 3B-3 — standard email/password Authentication
  (`QA pass`):**
  - **Goal:** initialize the no-billing standard Firebase Authentication
    configuration in both isolated projects with password-based email sign-in
    as the only enabled launch method and with improved email privacy enabled.
  - **Scope:** repeat the no-change preflight; initialize only the standard
    Firebase Authentication configuration through the Firebase provider setup;
    enable email/password with a password required; explicitly keep email-link,
    anonymous and phone sign-in disabled and duplicate email identities
    disallowed; enable improved email privacy; then verify all local, social,
    OIDC and SAML provider surfaces, subtype, users, apps and billing state.
  - **Execution boundary:** Firebase CLI `15.19.0` is not the canonical path for
    this slice because `firebase deploy --only auth` creates a `Default Web App`
    when the project has no web app. That unrequested app registration is an
    observable extra resource. Initialization therefore uses the standard
    Firebase Authentication provider setup without the Identity Platform
    upgrade action; after the standard config exists, any Admin v2 hardening
    update must use only the exact field mask for the fields named in this
    packet. No undocumented provisioning endpoint or delete-after-create
    workaround is allowed.
  - **Non-goals:** Identity Platform initialization/upgrade, billing/Blaze,
    Firebase iOS/Android/web app registration or SDK installation, users or test
    accounts, password-policy selection, email templates or delivery tests,
    custom SMTP, authorized/custom domains, MFA, reCAPTCHA Enterprise, tenants,
    anonymous/phone/social/OIDC/SAML providers, Cloud Run, IAM, Secret Manager,
    Firestore changes, Hosting deployment or application code.
  - **Inputs:** `PO-020`; completed 3B-1 and 3B-2; official Firebase guidance
    that email/password is a standard Authentication provider and Identity
    Platform is a separate optional upgrade; current Admin v2 `Config` and
    `updateConfig` contracts; read-only preflight evidence from both exact
    projects.
  - **Acceptance criteria:**
    1. A repeated preflight confirms both exact project IDs, empty Firebase app
       lists, `billingEnabled: false`, Identity Toolkit API `ENABLED` and
       `CONFIGURATION_NOT_FOUND`. Any existing config, app or billing
       contradiction stops the slice for controller review.
    2. Each project exposes an Authentication config with output subtype
       `FIREBASE_AUTH`, never `IDENTITY_PLATFORM`.
    3. `signIn.email.enabled` and `signIn.email.passwordRequired` are true;
       `signIn.anonymous.enabled`, `signIn.phoneNumber.enabled` and
       `signIn.allowDuplicateEmails` are false. Email-link sign-in is therefore
       unavailable, and improved email privacy is enabled.
    4. Default social-provider, OIDC and SAML configuration lists are empty;
       `multiTenant.allowTenants` is false, and MFA and blocking functions are
       not enabled. The tenant-list endpoint is not treated as evidence because
       it is unsupported for these `FIREBASE_AUTH` projects. No provider is
       silently retained or added by initialization.
    5. Authentication user count remains zero and the Firebase app lists remain
       empty. No test account, SDK config, API key artifact, app registration,
       credential or secret is created or committed.
    6. Both projects still report `billingEnabled: false`; no billing link,
       Blaze upgrade, Identity Platform initialization, Cloud Run, IAM, Secret
       Manager, Hosting deployment, Firestore change or unrelated-project
       operation occurs.
    7. The report, focused repository/doc checks, contract-change gate, diff
       check and independent QA all pass. QA must reject any unverified
       provider surface, broader side effect, hidden fallback or stale plan
       claim.
  - **Verification:** sanitized Admin v2 config reads for both projects; empty
    provider-list reads for default social/OIDC/SAML surfaces; zero-user proof;
    fresh `firebase apps:list` and direct billing reads; repository status and
    diff review; focused documentation checks, contract gate, diff check and
    independent QA.
  - **Required evidence:** per-project config subtype and named sign-in/privacy
    fields; empty provider lists; zero users; empty app lists; post-operation
    billing status; exact external operations and any harmless failed attempt;
    changed-file list and QA verdict.
  - **Risks:** standard Authentication initialization is an external persistent
    change; the console/provider workflow may introduce an unexpected default
    or request an app registration; the CLI path is known to create a web app;
    one project may succeed before the other fails. An unexpected resource or
    broader prompt is a stop condition, not permission to delete, compensate,
    switch tools silently or widen scope.
  - **Stop conditions:** billing or Identity Platform is requested; a Firebase
    app, user, unexpected provider or existing Auth config appears; the standard
    provider setup cannot proceed without a broader resource; permissions fail;
    or only one project succeeds. Partial success is reported and preserved for
    an owner-reviewed repair; there is no automatic rollback or substitute.
  - **Report target:** `docs/reports/launch-003b3-authentication-foundation.md`.
  - **Historical checkpoint (2026-08-01; blocked before initialization):**
    `PO-023` authorizes the exact packet. Repeated preflight confirmed both
    projects `ACTIVE`, `billingEnabled: false`, Identity Toolkit API `ENABLED`,
    empty Firebase app lists and `CONFIGURATION_NOT_FOUND`. One documented
    Admin v2 update attempt in sandbox used only the approved field mask and
    returned the same 404, creating no config or resource; production was not
    mutated. The CLI path remains excluded because it creates `Default Web
    App`, and the in-app browser runtime failed before opening the standard
    Firebase provider setup. No Auth provider, app, user, billing link or other
    cloud resource changed. Evidence is in
    `docs/reports/launch-003b3-authentication-foundation.md`.
  - **Implementation checkpoint (2026-08-01; QA `pass`):** the
    owner completed standard provider setup manually in both projects.
    Sanitized reads prove subtype `FIREBASE_AUTH`, email enabled with a required
    password, improved email privacy enabled, and anonymous/phone/duplicate
    email identities, MFA, multi-tenancy and blocking functions disabled.
    Default social, OIDC and SAML provider counts, user counts and Firebase app
    counts are zero in each project; billing remains disabled. The closure
    worker made no cloud mutation and exposed no secret-bearing fields.
    The first independent QA run found one stale status word in the report;
    the repair changed only `in review` to `partial`, local gates passed and
    repeated independent QA returned `pass`.
- **Completed slice 3B-4 — billing, Cloud Run and cost-control boundary
  (`QA pass`):**
  - **Goal:** produce a decision-ready, sanitized account/project and current
    product-capability packet before requesting authorization for any billing,
    API, IAM or runtime change.
  - **Scope:** read both exact projects' billing state; enumerate only the
    accessible billing-account status/currency and Patternly-scoped budget
    evidence needed for the decision; read Service Usage state for the exact
    Cloud Run, Billing Budgets, Secret Manager, IAM Credentials, Artifact
    Registry and build APIs that a later real deployment could require; perform
    service-specific read-only Cloud Run/IAM/key checks where the enabled APIs
    permit them; verify current official Warsaw-region, Blaze, scale-to-zero,
    maximum-instance, budget-alert and Preview spend-cap behavior; then define
    the smallest separately authorized implementation slice.
  - **Non-goals:** linking or unlinking a billing account; enabling Blaze or an
    API; creating or changing a budget, alert, spend cap, quota, service
    account, IAM binding, service-account key, secret, repository credential,
    Firebase app or Cloud Run resource; deploying placeholder or application
    code; using or inspecting unrelated-project spend.
  - **Acceptance criteria:**
    1. Fresh reads confirm both exact projects remain unbilled and that the
       completed Firestore/Auth foundations have not been broadened.
    2. The packet records, without exposing account identifiers or payment
       data, whether an open billing account is accessible, its currency, the
       narrowly relevant permission result and whether a project-filtered
       budget already applies to either Patternly project.
    3. Each required service is reported as enabled, disabled or unverifiable;
       a disabled list API is not treated as proof that its resources are
       absent. Any existing Cloud Run resource, Patternly budget, custom IAM
       binding or user-managed key is a contradiction for controller review.
    4. Current first-party documentation proves that Cloud Run requires linked
       billing/Blaze, supports `europe-central2`, can scale to zero with minimum
       instances `0`, and allows an explicit service maximum that may be
       exceeded briefly.
    5. Cost controls are separated truthfully: ordinary budgets notify but do
       not cap charges; Preview Cloud Run budget spend caps pause only covered
       Cloud Run workloads and may have availability/enforcement limitations;
       Firestore and API quotas are separate controls and are not presented as
       an exact cross-service currency cap.
    6. The recommended implementation packet does not create an empty or mock
       Cloud Run service. Service deployment stays with the first real Task 3A
       API slice unless repository evidence proves a production-shaped service
       already exists.
    7. The report names every proposed mutation, project, principal, role,
       service/API, cost threshold, failure mode and rollback boundary so the
       owner can authorize or reject the next slice explicitly.
  - **Verification and required evidence:** sanitized billing/project and
    service-state tables; exact read-only command/API inventory; official
    first-party source links and access dates; Cloud Run resource, project IAM
    and user-managed-key results with limitations; current repository diff;
    focused documentation checks, contract-change gate, diff check and
    independent QA `pass`.
  - **Stop conditions:** any read requires a state change or broader OAuth/IAM
    grant; the only available evidence would expose credentials, payment data
    or unrelated-project spend; either exact project is unexpectedly billed or
    already contains a conflicting resource; or an irreversible operation is
    required. No implementation operation starts from this packet without a
    new explicit owner authorization.
  - **Report target:**
    `docs/reports/launch-003b4-cost-cloudrun-preflight.md`.
  - **Preflight checkpoint (2026-08-01; QA `pass`):** both projects remained
    unbilled and the six future deployment APIs are disabled. One open PLN
    billing account and the narrowly required permissions are available;
    existing project-scoped budgets and Cloud Run resources are not falsely
    declared absent because their list APIs are disabled. The first QA run
    found one inaccurate recipient set; the focused repair and repeated QA
    passed. Evidence is recorded in the report target above.
- **PO-024 execution checkpoint (2026-08-01; implementation complete, repeated
  closure QA `pass`):** after the owner proved there was no overlapping Patternly
  budget, the controller linked only sandbox to the verified open PLN account.
  The owner then created the exact all-service alert budget and Cloud Run-only
  spend cap described above. Production remains unbilled, all six deferred APIs
  remain disabled and current spend was `0 PLN` in both budget rows. The first
  implementation-closure QA found only stale partial-state documentation; the
  focused repair and repeated independent QA passed.
- **Completed slice 3B-5 — keyless identity, secret and environment policy
  (`QA pass`; documentation/configuration contract only):**
  - **Goal:** consolidate the one deployable security boundary that the first
    real Task 3A API slice must instantiate, without creating speculative cloud
    resources.
  - **Scope:** reconcile current canonical contracts and official provider
    behavior into one enumerated deployment/runtime identity matrix;
    metadata-service runtime workload identity and explicit deployment
    impersonation flow; Secret Manager injection boundary; fail-closed list of
    required non-secret mobile environment values and API base URL; Cloud Run
    invocation/application-auth boundary; and verified-token UID derivation,
    caller-selected UID mismatch rejection and revoked-token checks.
  - **Non-goals:** enabling an API; creating IAM, service accounts, keys,
    secrets, Firebase apps or Cloud Run; inventing secret values or placeholder
    endpoints; selecting a not-yet-authorized sender-domain or market hostname;
    adding code or a compatibility/fallback path.
  - **Acceptance criteria:** exactly one deployment identity and one runtime
    identity are specified per environment with no Owner/Editor or downloaded
    key; every proposed role and `actAs` edge has a named necessity and resource
    scope; secrets exist only as Cloud Run-bound Secret Manager versions;
    mobile values are explicitly non-secret and missing values fail closed;
    the HTTPS invocation model is compatible with mobile Firebase ID tokens
    without weakening server token/UID/revocation enforcement; deferred
    sender-domain/market-host values remain explicit later inputs rather than
    fake configuration; no duplicate credential or environment path remains.
  - **Verification and required evidence:** repository reachability/dead-code
    search; current first-party IAM, Cloud Run identity/invocation, Firebase
    token-verification and Secret Manager sources; role/edge table, redacted
    environment schema, negative cases, contract gate, diff check and
    independent QA `pass`.
  - **Stop conditions:** the mobile invocation model requires a new gateway or
    provider, least privilege cannot be expressed without a broader role, or an
    exact environment value depends on a not-yet-authorized market hostname or
    sender-domain choice. Record the deferred input; do not create a placeholder.
  - **Report target:** `docs/reports/launch-003b5-keyless-policy.md`.
  - **Closure checkpoint (2026-08-01):** the worker added only the bounded
    policy report and made no application or cloud change. Initial QA found an
    over-broad revocation cadence, an over-broad Firebase Auth role and one
    present-tense resource claim. The focused repair limits remote revocation
    checks to account/security/destructive operations, replaces Firebase Auth
    Admin with the exact three-permission per-project custom role, and states
    all resource names normatively. Repository checks pass and repeated
    independent QA returned `pass`.
- **Non-goals:** reusing either unrelated listed project; Cloud SQL, Identity
  Platform, analytics, App Distribution or unrelated APIs; production users;
  deploying application code; downloading or committing service-account keys;
  creating permissive IAM roles or client Firestore access; treating a budget
  alert, Cloud Run maximum instance count or Preview spend cap as an immediate
  cross-service hard cap.
- **Acceptance criteria:**
  1. Sandbox and production have different globally unique project IDs and no
     shared user data, Auth tenants, Firestore data or service identities.
  2. Both projects record `europe-central2` before the immutable Firestore
     location is created; no default database is provisioned elsewhere.
  3. Standard Firebase Authentication supports only the approved launch method
     at this step; Identity Platform and anonymous/social providers remain off.
  4. Cloud Run execution and deployment use short-lived Google-managed or
     impersonated credentials; no user-managed service-account key exists.
  5. Billing exposure is documented before Blaze is enabled. Cloud Run uses
     `min instances = 0`, an explicit maximum instance count and the Preview
     spend cap where available. Evidence states that the spend cap may apply
     with delay and does not cover Firestore, maximum instances can be exceeded
     briefly during scaling, and ordinary budget alerts only notify. Project
     budgets, notifications and Firestore/API quotas are named separately.
  6. The mobile environment contains only documented non-secret values and
     fails closed when any required value is missing; provider admin credentials
     never enter the repository or mobile bundle.
  7. Firestore client rules deny every mobile/web client read and write. Only
     the Cloud Run runtime identity reaches Firestore through the server Admin
     boundary, and deployment/runtime identities have enumerated least-privilege
     roles with no basic `Owner` or `Editor` grant.
  8. The approved identity-binding policy explicitly requires verified-token
     UID derivation, caller-selected UID mismatch rejection and revoked-token
     checks for sensitive operations; this prerequisite records policy and
     configuration evidence without claiming deployed request behavior.
- **Required evidence:** sanitized project IDs/numbers, IAM principals and
  roles, Firebase enablement, Auth provider state, Firestore edition/location,
  billing-plan and cost-control captures, service identities, Secret Manager
  boundary, deny-all Firestore client rules, token/UID/revocation policy, and a
  redacted environment-value inventory.
- **Stop conditions:** linking billing or continuing the remaining cloud
  configuration lacks explicit owner authorization; the billing account is
  unavailable; the account lacks the narrowly required billing, Firebase or IAM
  permissions; Firestore was already created outside Warsaw; or the only
  available credential path uses a long-lived downloaded key.

### Task 4 — entry, discovery and configuration repair

- **Goal:** make first launch through session start clear and visually coherent.
- **Scope:** onboarding track choice, Home, track selection, roadmap, scope
  selection, both Practice Hubs, setup screens and the learning-goal/cadence
  decision.
- **Non-goals:** runner lifecycle and result screens.
- **Inputs:** Task 2 visual shell, Task 3 account entry and launch surface
  inventory.
- **Acceptance criteria:** no clipping; one obvious primary action per state;
  track/topic/mode context stays visible; alternatives remain discoverable;
  back/tab behaviour is consistent; a goal surface is implemented only if its
  values alter recommendation/reminder behaviour. The Custom Practice length
  selector resolves audit finding `FUI-001`: at Android 360×800 dp / font scale
  1.5, every full label reflows without a mid-word break, clipping or overlap,
  while all options and `Start session` remain reachable. Changes to Home and
  track selection also remove the existing
  `RootNavigator → HomeScreen → SelectTrackScreen → navigation/index →
  RootNavigator` import cycle rather than preserving it through another barrel.
- **Verification:** first-use and returning-user flows on iOS and Android.
- **Required evidence:** complete screenshots for both tracks.
- **Risk:** compressing cards without fixing information priority would only
  hide the hierarchy defect.
- **Report target:** `docs/reports/launch-004-entry-discovery.md`.

### Task 5 — learning runtime completion

- **Goal:** finish product-safe Algorithms and Certification sessions.
- **Scope:** all response types, long content, feedback, canonical
  Certification lifecycle and operational states.
- **Non-goals:** summary redesign and store work.
- **Inputs:** canonical lifecycle, family contracts and Task 2 patterns.
- **Acceptance criteria:** canonical lifecycle behaviour for both families;
  every response type and required recovery branch is visually complete;
  no hidden fallback or second lifecycle remains.
- **Verification:** focused tests, full static checks and two-platform flow
  evidence.
- **Required evidence:** behavioural report plus state screenshots.
- **Risk:** styling the current Certification screen before lifecycle
  replacement would preserve the wrong architecture.
- **Report target:** `docs/reports/launch-005-learning-runtimes.md`.

**Superseded preflight packet — combined Certification ordinary-practice
cutover (not implemented; removed from active work)**

The combined packet below was rejected by controller reassessment before any
worker or code change. Fresh repository evidence proved that it bundled one
already-obsolete writer deletion with the still-unresolved final-submit versus
separate-completion contradiction. Its implementation scope is historical only;
the smaller active 5A packet after it replaces it.

- **Objective:** make all six ordinary Certification modes use the existing one
  active-session lifecycle, durable operation projection and shared Practice
  surface, while deleting the competing answer-write and session-durability
  paths. This is the first independent executable work while Tasks 3–4 wait on
  the Twenty-first-A owner/security decision; it does not close all of Task 5.
- **Confirmed repository facts and root cause:** the Certification family
  runtime already prepares, scores and finalizes canonical sessions through
  `TrainingLifecycleUseCases`, and the current focused baseline passes 68/68.
  The reachable `CertificationPracticeSessionScreen`, however, converts every
  projection failure to `null` and then attempts a new session, accepts an
  active Certification session without proving the requested mode, re-scores a
  committed response inside presentation, renders a static foreground time,
  collapses journal/advance/finalization failures into one terminal error and
  labels destructive abandonment as ordinary leave. It does not expose
  pause/resume, active-session conflict or the lifecycle's recovery actions and
  implements a second Card/Pressable runner beside `PracticeSessionSurface`.
  `src/application/certificationPracticeUseCases.ts` still contains a second
  direct `commitTrainingOutcome` answer path used only by old tests, while
  production uses only its manual-review command. The entire
  `src/application/trainingSessions/sessionDurability.ts` path is test-only and
  writes sessions outside the canonical coordinator. Both facades also create
  reset-prone process counters for session IDs, so a relaunch can collide with
  durable history.
- **Smallest coherent architecture:**
  1. Move the existing foreground timer wrapper to the family-neutral training
     lifecycle owner and use the same injected instance for Algorithms and
     ordinary Certification. It accepts only declared
     `elapsedForeground`/`countdownForeground` sessions, keeps the existing
     checkpoint/relaunch/background semantics and does not add a second timer.
  2. Replace both process counters with one injected, collision-resistant
     training-session identity port. Production uses `expo-crypto` UUIDs;
     tests inject deterministic IDs. There is no timestamp/counter/random
     fallback and the old Algorithms-specific runtime-port file is deleted if
     it no longer owns anything.
  3. Extend the Certification application projection with the exact
     `PracticeDurableOperationState`, pending/materialized response source,
     application-owned feedback/control states and foreground-time projection.
     Screens never import scoring, storage, journal or timer arithmetic.
  4. Render Certification through `PracticeSessionSurface` and the same shared
     phase/action/notice helpers as Algorithms. Starting occurs only after an
     explicit no-active-session result. Exact track+mode resumes; every other
     mode/family/exam is a visible conflict with resume or separately confirmed
     abandon-and-start. Pause keeps the durable active session; abandonment is
     destructive and distinct.
  5. Move the still-reachable manual review command into the canonical
     Certification application owner, then delete
     `certificationPracticeUseCases.ts`, its old direct-answer tests, the
     test-only `application/trainingSessions/**` module and its test. Do not
     retain aliases or compatibility exports.
- **Closed implementation scope:**
  - application/composition:
    `src/application/certification/**`,
    `src/application/trainingLifecycle/**`,
    `src/application/runtime/ForegroundSessionTimer.ts`, the existing
    Algorithms foreground/runtime-port files only for the exact move/deletion
    and unchanged consumer wiring,
    `src/application/algorithms/algorithmsSessionFacade.ts`, Algorithms
    `index.ts`, `src/application/bootstrap/trainingLifecycleComposition.ts`,
    `src/application/certificationPracticeUseCases.ts` and
    `src/application/trainingSessions/**`;
  - reachable presentation:
    `src/features/practice/CertificationPracticeSessionScreen.tsx`,
    `PracticeSessionScreen.tsx`, `PracticeSessionSurface.tsx`,
    `practiceSessionPresentation.ts`, `sessionConfig.ts` only where shared
    conflict/resume projection needs it, and
    `src/features/review/AnswerReviewScreen.tsx` only to repoint the preserved
    manual-review command;
  - focused tests: replace obsolete direct-writer/test-only durability tests
    with Certification facade/lifecycle/presentation/timer tests; update only
    directly changed visual-shell, loading-owner, runtime-selector, generic
    lifecycle and Algorithms timer regressions; this plan, the launch surface
    inventory and the Task 5 report only for truthful current status/evidence.
  A required file outside this matrix is a controller stop, not implied scope.
- **Forbidden scope/non-goals:** Certification Exam Simulation, Algorithms
  behavior or content semantics beyond unchanged generic timer/ID wiring; Task
  4 setup/discovery; Task 6 result/review/history redesign; question banks,
  scoring, review policy, session schema, account/outbox/cloud work, new route,
  second lifecycle/timer/repository, broad component refactor, hidden fallback,
  compatibility alias or generated artifact. A verified abandoned terminal may
  show a truthful bounded handoff, but this slice must not invent the Task 6
  historical/summary experience.
- **Acceptance criteria:**
  1. A projection read, content, corruption or recovery failure never becomes
     “no active session” and never starts a replacement. Start occurs exactly
     once only after verified absence.
  2. Only the exact Certification track+mode resumes. Cross-mode, Certification
     exam and cross-family active sessions expose their real identity and allow
     only resume of that session or a separately confirmed durable abandon then
     start; no current route parameters are reinterpreted as the active plan.
  3. The projection distinguishes UI-local, journal-committed and materialized
     responses; feedback and correctness come only from the family runtime's
     durable attempt. Single- and multiple-choice controls cover all six
     declared ordinary modes without presentation scoring.
  4. Every canonical Practice operation state has one safe rendering/action:
     pre-journal failure preserves the editable response; a durable pending
     journal prevents duplicate submit and offers only recovery; advance and
     completion retry the same verified command; recovery converges to feedback,
     next occurrence or the verified result without reconstructing an answer.
  5. App foreground/background, periodic checkpoint and relaunch use the one
     generic timer; background/closed time is excluded and the visible elapsed
     value cannot be a static or UI-owned clock. Algorithms timer/countdown
     behavior remains byte-for-byte equivalent at its public boundary.
  6. Leave-resumable and destructive abandon are separate. Back gestures and
     hardware back cannot bypass the confirmation. Failed abandon remains on
     the active session with the exact retry/recovery action; verified abandon
     is never presented as completion or a scored result.
  7. Completion navigates to the existing verified-result handoff only after
     the canonical result exists. Failure/replay cannot create a duplicate
     attempt/result or expose success early.
  8. Production session IDs are collision-resistant across relaunch; tests use
     an injected deterministic port; no module counter, clock-only ID or hidden
     fallback remains.
  9. `CertificationPracticeSessionScreen` contains no scoring/storage/journal/
     timer math and renders the shared Practice surface. The old direct
     Certification answer writer, random selector, test-only session durability
     module, obsolete exports/tests and unused imports are absent; the preserved
     manual-review command has one reachable canonical owner.
  10. Focused tests, full tests, root typecheck, content/privacy/contract/diff
      gates and independent implementation QA all return `pass` with no
      Algorithms or Certification Exam regression.
- **Required evidence:** real in-memory lifecycle tests for no-active start,
  exact resume, three conflict classes, read/content failure, pre-journal and
  each post-journal recovery boundary, advance/finalization replay, foreground/
  background/relaunch, pause, confirmed abandon, single/multiple responses and
  all six modes; source scans proving removal of catch-to-null, UI scoring,
  direct answer commits, module counters and duplicate durability; focused
  Algorithms timer and Certification Exam regressions; controller allowed-file
  diff/dead-code review; phone evidence for preparing, unanswered single and
  multiple choice, long prompt/options/feedback, leave confirmation, conflict,
  recoverable failure and verified terminal handoff on iOS and Android; full
  static gates and independent QA verdict.
- **Stop conditions:** the shared lifecycle cannot express a required
  Certification state without a contract/schema change; generic timer reuse
  changes Algorithms semantics; exact resume cannot be derived from the
  immutable session; the only completion path exposes an unverified result; or
  implementation needs an account/cloud/Task 6/broad unrelated change. Return
  the exact contradiction instead of adding a fallback or widening scope.

**Controller slice 5A — delete the competing Certification answer writer
(`complete`; independent implementation QA: `pass`)**

- **Objective:** prove that ordinary Certification answers have exactly one
  production write authority—`TrainingLifecycleUseCases` through
  `CertificationFamilyRuntime` and the canonical mutation coordinator—while
  preserving the one still-reachable manual review command.
- **Confirmed facts:** `certificationPracticeUseCases.ts` contains random
  question selection and `savePracticeAnswer`, which reconstructs attempts and
  review mutations and calls `commitTrainingOutcome` outside the family
  lifecycle. No production source imports those paths; only two old tests do.
  `AnswerReviewScreen` imports only `setQuestionNeedsReview` from the same mixed-
  ownership file. The production Certification runner already submits through
  `certificationSessionFacade -> TrainingLifecycleUseCases ->
  CertificationFamilyRuntime`. Focused current tests pass despite exercising
  the obsolete writer, so green baseline is not proof of one authority.
- **Closed scope:** delete
  `src/application/certificationPracticeUseCases.ts`; move only the reachable
  `setQuestionNeedsReview` command, unchanged in behavior, to
  `src/application/certification/certificationReviewCommands.ts`; export it
  from `src/application/certification/index.ts`; change only that import in the
  already-modified `src/features/review/AnswerReviewScreen.tsx`; remove the old
  writer tests from `tests/certificationScoring.test.ts`; add
  `tests/certificationPracticeLifecycle.test.ts` using the real family runtime,
  lifecycle and in-memory canonical repositories; extend
  `tests/mutationArchitecture.test.ts` with a structural prohibition on the
  deleted writer/selector path; update this plan/report status only.
- **Non-goals:** Certification runner UI, foreground timer, session IDs,
  completion/final-submit semantics, Algorithms, Certification Exam, Task 6
  result/review/history design, content/scoring/review policy, storage schema,
  routing, account/cloud work, a broad review-queue refactor or compatibility
  export. The next runner packet remains separate until the terminal contract
  contradiction is resolved from canonical evidence.
- **Acceptance criteria:**
  1. The old file and symbols `savePracticeAnswer`, `loadPracticeQuestions`,
     `shuffleQuestionOptions`, `getPracticeDomainCounts` and
     `PracticeQuestionCount` are absent from source and tests.
  2. A real ordinary Certification session submission through the installed
     lifecycle materializes exactly one typed attempt and the expected review
     mutation, including stable identity when an existing remediation entry is
     updated. The test cannot call storage-only answer helpers or build the
     attempt itself.
  3. `setQuestionNeedsReview` retains journal-first review mutation behavior,
     has one reachable application owner and is not reimplemented in
     presentation. The worker changes only its import line in
     `AnswerReviewScreen` and preserves all existing Task 2 edits in that dirty
     file.
  4. No adapter, alias, compatibility file, second selector/writer or unused
     export replaces the deleted path. A repository scan finds ordinary
     Certification answer commits only behind the family lifecycle.
  5. Focused tests, full tests, typecheck, content/privacy/contract/diff gates
     and independent implementation QA return `pass`.
- **Required evidence:** before/after reachability scan; allowed-file diff;
  focused `certificationScoring`, new real-lifecycle integration,
  `mutationArchitecture`, `trainingLifecycleUseCases` and
  `cloudExamLifecycle` tests; source search for deleted symbols/direct answer
  commits; root typecheck/full suite/content/privacy/contract gates; dead-code
  review and independent QA verdict.
- **Stop conditions:** an unknown production consumer of the old selector or
  writer appears; the real family lifecycle fails to preserve remediation-entry
  identity; moving the manual command requires review-system redesign; or the
  single import edit cannot preserve the existing dirty
  `AnswerReviewScreen` changes. Record a small repair rather than restoring the
  competing path or widening scope.
- **Post-5A direct dependency review to perform after closure:** re-evaluate the
  ordinary Certification runner cutover, generic timer/session identity and
  exact terminal semantics. Current code uses a separate
  `completeActivePracticeSession`, while
  `docs/17-training-runtime-and-interaction-spec.md` requires the canonical
  result to exist with the verified final answer and the YAML state machine
  declares completion states without transitions. No worker may guess that
  conflict in 5A.
- **Independent preflight evidence (2026-08-01):** a read-only reviewer checked
  the active small packet against the repository, including the dirty
  `AnswerReviewScreen` overlap and the feasibility of a real-lifecycle test,
  and returned `pass`. No implementation was included in that review.
- **Closure evidence (2026-08-01):** the obsolete
  `certificationPracticeUseCases.ts` writer/selector was deleted; the one
  reachable manual-review command moved to the Certification application owner
  without changing its journal-first behavior; `AnswerReviewScreen` retained
  its existing Task 2 changes and changed only that import for 5A. A new test
  uses the real composed `TrainingLifecycleUseCases` and
  `CertificationFamilyRuntime` to prove one typed attempt and one remediation
  entry after the first submission, two distinct attempts after a repeated
  session and stable remediation `id`, `sourceAttemptId` and `sourceSessionId`.
  Source/dead-path scans and `git diff --check` passed; focused tests passed
  43/43, root typecheck passed, the full suite passed 513/513 when its local
  HTTP listeners were run outside the restrictive sandbox, content and runtime
  privacy boundaries passed, and the contract-change gate against `HEAD` passed
  for 47 changed paths. Independent implementation QA returned exact verdict
  `pass`. No compatibility alias, second writer or new fallback remains.

**Task 5B owner decision gate — ordinary-practice terminal command
(`owner choice B approved`; implementation queued after slice 5H)**

- **Confirmed contradiction:** the canonical contract declares itself
  normative and narrative documents non-normative. It maps
  `practice-finish` to `finish` and declares `completing`,
  `completion_failed` and `completed`, but its closed Practice transition list
  contains no completion transition; the validator reproduces that omission
  and its test forbids the runtime from publishing two of those states. The
  current shared lifecycle and both ordinary runners use a separate
  `completeActivePracticeSession` after the final answer, while the stale
  narrative in `docs/17-training-runtime-and-interaction-spec.md` says the
  result already exists before `Finish`. Neither code nor the narrative may
  silently override the internally inconsistent normative contract.
- **Owner choice A — atomic terminal submit:** the final answer's one immutable
  `submit_training_outcome` journal also writes the completed session/result
  and clears the active pointer; `Finish` is navigation-only. This requires a
  shared mutation and terminal-projection migration for both Algorithms and
  Certification plus removal of the separate completion command.
- **Owner choice B — separate canonical Finish (controller recommendation):**
  keep the current learner sequence—durable final answer and feedback, then one
  explicit `Finish` command—and add the missing canonical completion
  transitions plus application-owned completing/failure/recovery projections
  around the existing shared command. This is the smaller change, matches both
  current runners and their tests and does not require a second lifecycle.
- **Forbidden workaround:** no worker may guess A or B, reinterpret an
  undeclared transition, retain both terminal paths, auto-navigate as a hidden
  fallback or implement only one family. The selected choice must update YAML,
  validator/tests, narrative documentation, shared lifecycle and both ordinary
  runners in one coherent packet.
- **Bypass:** this gate blocks only terminal semantics. Collision-resistant
  shared session identity and the family-neutral foreground timer remain
  independently executable Task 5 work.
- **Owner decision (2026-08-01):** approved choice B: one separate canonical
  `Finish` action after the final answer is durably submitted and its feedback
  is visible. The implementation packet must add the missing normative
  completion transitions and application-owned completion/recovery projection
  for both ordinary families, then delete any stale narrative or test that
  claims the final submit already creates the result. Slice 5H remains first so
  its in-progress exit/surface diff can be verified without mixing terminal
  semantics; 5B becomes the immediate next direct dependency after 5H closes.

**Controller implementation slice 5B-1 — separate durable Finish for both
ordinary Practice families (`complete`; repeat independent QA `pass`)**

- **Objective:** implement the approved choice B as one normative terminal
  path: the final answer reaches durable feedback first, then a separate
  application-owned `Finish session` command creates and verifies the canonical
  result before either family may navigate.
- **Confirmed repository facts and root cause:** the YAML declares
  `practice-finish`, `completing`, `completion_failed` and `completed` but has no
  completion transitions; its test explicitly forbids the lifecycle from
  publishing completion states. `completeActivePracticeSession()` already
  performs one shared finalization command but publishes no operation state.
  Certification catches completion failure into a page outage. Algorithms
  catches it, queries a result with `catch(() => null)` and may navigate through
  that hidden fallback. The shared primary-action helper labels final feedback
  `View session result`, while Certification separately labels it `Finish
  session`. The narrative spec incorrectly claims the canonical result already
  exists before Finish.
- **Smallest coherent scope:** add the missing normative Practice transitions
  for `feedback -> completing -> completed`, a typed `completion_failed` path,
  same-command retry before journal durability and exact recovery after a
  durable terminal journal. The one shared lifecycle completion owner publishes
  those states. Add one exact-session completion recovery which may replay only
  the matching terminal journal without requiring an active pointer and returns
  success only after the exact session is `completed`, its exact canonical
  result is verified and that session is no longer active. Both Algorithms and
  Certification facades/screens consume the same state semantics, use the
  shared `Finish session` presentation action, and navigate only from the
  verified success/recovery result. Remove Algorithms' query-result catch
  fallback and the stale narrative claim. Exact areas:
  `docs/canonical-product-contract.yaml`, its JSON Schema transition count,
  validator and mapped tests,
  `docs/17-training-runtime-and-interaction-spec.md`, shared lifecycle
  completion/recovery, both family facades, both ordinary Practice screens,
  `practiceSessionPresentation.ts`, directly focused lifecycle/fault/source
  tests and this plan status.
- **Non-goals:** atomic final submit (choice A); changing answer journals,
  scoring, feedback, summary/result content, history or Task 6; abandonment,
  pause, timer algorithms outside the narrow final-checkpoint retry/recovery,
  Exam/Simulation, setup/conflict/content;
  a second completion command, generic terminal coordinator, new route/schema,
  compatibility alias, result inference or catch-to-query/navigation fallback.
- **Acceptance criteria:**
  1. The normative YAML and validator declare exactly the approved sequence:
     final `feedback` can trigger `finish` to `completing`; verified completion
     reaches `completed`; a failed completion reaches `completion_failed`, from
     which only the exact safe retry or recovery command is allowed. The stale
     assertion forbidding completion states and the narrative claim that the
     result precedes Finish are removed.
  2. Submitting the final answer performs no completion/result write and leaves
     the exact materialized feedback visible and locked. A separately labelled
     `Finish session` action is the only terminal command in both families;
     non-final feedback retains only `Next`.
  3. One shared lifecycle owner publishes `completing`, classifies a
     before-journal failure as safe same-command retry and a matching durable
     journal as recovery-only, and publishes/returns success only after exact
     completed-session plus result verification. Concurrent taps/replays create
     one result and no duplicate attempts.
  4. Exact completion recovery works with or without the active pointer, replays
     only a matching terminal journal for the expected session ID, and rejects
     another operation/session, a missing result, non-completed session or
     still-active exact session. No screen reads storage or infers success.
  5. Algorithms and Certification render the shared completion phase/action/
     notice semantics and navigate to their existing exact result routes only
     from the verified command result. The Algorithms `catch(() => null)` result
     lookup and every other terminal fallback/parallel path are deleted.
  6. Real fault tests cover final-submit separation plus completion journal
     write, materialization, active-clear, result verification and journal-clear
     boundaries for both family handoffs; contract/lifecycle/presentation/source
     focused tests, full tests, typecheck, content/privacy/contract/diff gates
     and independent QA return `pass`.
- **Required evidence:** before/after transition and fallback scans; exact
  final-submit command/write counts; matching/mismatching recovery fixtures;
  one-result/no-duplicate-attempt proofs; both screen-source and shared action
  assertions; allowed-file diff/dead-code review; focused/full/gate output and
  independent correctness/completeness/debt/documentation/architecture QA.
- **Stop conditions:** the existing completion journal cannot be identified and
  verified by exact session without a mutation schema change; Algorithms and
  Certification results require incompatible terminal contracts; or a truthful
  failure UI requires Task 6 summary redesign. Return the exact contradiction
  instead of retaining the fallback, adding a generic terminal layer or
  partially implementing one family.
- **Preflight correction 5B-R1 — close competing completion and timer paths:**
  repository inspection found a second completion API that is reachable only
  from its own tests: `completeOrdinarySession -> mutations.complete ->
  commitSessionCompletion` permits a completed session with no result, while
  the approved command requires an exact verified result. Delete that lifecycle
  method, mutation-port member, composition branch and obsolete no-result tests;
  make the remaining completion journal builder require exactly one
  `put_session_result` write and strengthen mutation verification accordingly,
  so `completeWithResult` is the sole canonical writer. Inspection also found that
  `completeAfterFinalCheckpoint` can fail before the completion journal starts
  and leaves a sticky timer fault. This is not `completion_failed`: both family
  facades must explicitly distinguish a non-durable final-checkpoint retry from
  recovery of the matching timer journal, reconstruct the exact final feedback,
  and only then allow the learner to invoke Finish again. It must never infer a
  result, enter completion recovery or navigate from a timer failure.
- **Closed normative transition list for worker/QA:** add exactly
  `feedback --finish--> completing`, `completing
  --completion_verified--> completed`, `completing --completion_failed-->
  completion_failed`, `completion_failed --finish/durable_state_not_durable-->
  completing`, plus `completion_failed --recover/journal_status_durable-->
  completing`, `completion_failed --recover/journal_status_materialized-->
  completing` and `completion_failed
  --recover/journal_status_verified_pending_clear--> completing`. Increase the
  JSON Schema's exact Practice transition count from 22 to 29 and keep the
  validator's closed list identical. Do not add an unconditional retry/recover
  transition. After each recovery edge, only a separate
  `completion_verified` transition may publish `completed`, and only after the
  matching immutable journal has been replayed and the exact completed session,
  exact result and cleared active pointer are verified. Focused evidence must
  separately cover the pre-completion timer checkpoint boundary and every
  listed completion-journal boundary.
- **Repair 5B-R2 — replace stale terminal tests with behavioural proofs
  (`controller focused baseline: 93/98`):** the interrupted first worker left
  five tests asserting the removed architecture: completion without a result,
  no published completion states, query-to-navigation recovery, the old final
  CTA label and obsolete screen-source shapes. Do not weaken or delete coverage
  alone. Replace those assertions with exact tests for the 29-transition closed
  contract, mandatory one-result completion journal, final-submit/Finish
  separation, lifecycle retry versus exact no-active recovery, all durable
  completion phases, final-checkpoint retry/recovery with feedback
  reconstruction, shared presentation labels and verified-only navigation for
  both families. Scope is limited to directly affected tests and a minimal code
  repair only if a new behavioural test exposes a packet acceptance defect.
  Focused tests, typecheck and diff check must pass before implementation QA.
- **Repair 5B-R3 — verified handoff and real completion-boundary evidence
  (`independent implementation QA: fail`):** Algorithms currently verifies the
  terminal lifecycle command and then performs a second
  `getAlgorithmsPracticeResultProjection` read before returning `verified`.
  Delete that post-verification read from completion and recovery: return the
  lifecycle's exact `PracticeFinalization`, navigate by its verified session
  identity, and leave full result projection loading solely to the summary
  route, matching Certification. A projection/read failure after navigation
  must become the summary's truthful unavailable state, never suppress durable
  completion or recreate a completion-recovery action. Correct the remaining
  narrative claim that final answer materialization creates the completed
  result; only the separate `complete_training_session` Finish journal may do
  so.

  Add real memory-storage fault matrices for both Algorithms and Certification
  handoffs. They must inject completion failures at journal write, result write,
  completed-session write, active-session clear, result/session verification
  and journal clear. Prove: only journal-write failure permits the same Finish;
  every durable phase exposes exact recovery; feedback remains materialized and
  locked until terminal recovery; no route success occurs early; replay creates
  exactly one matching result and no duplicate attempts; exact active/journal
  ownership is cleared; and the verified returned session identity is the only
  navigation input. Include a regression where a first post-completion summary
  projection read fails while verified navigation remains authorized. No new
  result cache, query fallback, compatibility return type or second terminal
  coordinator is allowed. Focused/full/gates and repeat independent QA must
  pass before 5B closes.
- **Repair 5B-R4 — remove false post-clear `not_durable` classification
  (`repeat independent QA: fail`):** the canonical mutation coordinator already
  resolves `completeWithResult` only after materialization, exact journal
  verification and journal clear. The lifecycle must therefore publish
  `completed` and return the identity-checked `PracticeFinalization` directly
  after that successful boundary. Delete the redundant post-clear repository
  verification from the normal path and its speculative catch fallback; retain
  `verifyExpectedSessionCompletion` only for explicit completion recovery. Do
  not add a `verified` failure transition, cache, result-query fallback or
  active-session retry after terminal success. Strengthen the R3 regression by
  arming a result-read fault before Finish that triggers only after both the
  completion journal and active pointer are absent: Finish must still return
  verified, and the first failing read must belong solely to the summary query,
  which remains truthfully unavailable. Focused/full/gates and another
  independent QA `pass` are required.
- **Closure checkpoint (2026-08-01):** the approved separate `Finish session`
  path is now canonical for both ordinary Practice families. The final answer
  persists and displays locked feedback without creating a result; the
  separate command is the sole result writer and navigates only from its
  verified `PracticeFinalization`. The closed contract contains exactly 29
  Practice transitions. Real storage faults cover seven completion boundaries
  for Algorithms and Certification, including exact retry/recovery ownership
  and one-result/no-duplicate-attempt proofs. The R4 repair removed the
  redundant read after the mutation coordinator's verified journal clear, so a
  later summary read failure remains a truthful summary outage instead of a
  false completion retry. Controller verification passed 107/107 focused and
  551/551 full tests, typecheck, content/privacy boundaries, the contract gate
  against `HEAD` for 76 changed paths and diff/dead-code checks. Repeated
  independent correctness/completeness/debt/documentation/architecture QA
  returned exact verdict `pass`; no second writer, result-query fallback or
  post-success active-session retry remains.

**Controller slice 5C — one relaunch-safe training-session identity authority
(`complete`)**

- **Objective:** make every newly started Algorithms or Certification session
  receive one collision-resistant identity from the shared lifecycle, including
  after a composition-root/app relaunch, while keeping development audit flows
  reproducible without using production counters.
- **Confirmed repository facts and root cause:** production Algorithms IDs are
  created by a `sessionSequence` local to
  `composeTrainingLifecycleUseCases`; Certification has a second module-local
  `sequence`. Both reset on relaunch and can reuse an identity already present
  in canonical history. `AlgorithmsSessionRuntimePorts` exists only to expose
  that counter plus a wall clock; its one remaining clock consumer can use the
  lifecycle's existing `currentTime()` application boundary. `expo-crypto` is
  already installed and exposes native UUIDv4. The repository already uses an
  explicit `.ts`/`.native.ts` identity-adapter convention. Development Maestro
  evidence intentionally addresses deterministic numeric IDs after the
  canonical learning-state reset, so replacing every audit selector with a
  random production UUID would be unnecessary scope; an explicit
  development-audit identity implementation must derive the next suffix from
  durable sessions, not a reset-prone process counter.
- **Smallest coherent architecture and closed scope:**
  1. Add one family-neutral async session-identity port to
     `TrainingLifecyclePorts`; `TrainingLifecycleUseCases.startSession` is the
     sole caller and injects the returned identity into the family preparation
     request. Algorithms and Certification facades no longer create or accept
     session identities.
  2. Add the infrastructure identity adapter using Node `crypto.randomUUID()`
     in the repository test/runtime `.ts` boundary and `expo-crypto.randomUUID`
     in the phone `.native.ts` boundary. Both return the same validated
     track/mode/UUID shape and throw explicitly if identity generation fails;
     there is no timestamp, `Math.random`, counter or secondary fallback.
  3. In the existing development-only runtime-auditability branch, inject one
     deterministic identity port that reads canonical session history and
     chooses the next durable numeric suffix for the track. Reset state yields
     the existing `:1` evidence identity; relaunch with retained history cannot
     reuse it. This branch is explicitly unavailable in production and does
     not become a second production authority.
  4. Delete `AlgorithmsSessionRuntimePorts.ts` and its barrel export. Replace
     its one simulation-draft clock read with
     `getTrainingLifecycleUseCases().currentTime()`; remove both old counters
     and all imports/tests that preserve them.
  5. Exact implementation area:
     `src/application/trainingLifecycle/contracts.ts`,
     `TrainingLifecycleUseCases.ts` and its barrel;
     `src/application/bootstrap/trainingLifecycleComposition.ts`;
     the two session facades and Algorithms barrel only for old-port removal;
     `src/application/algorithms/AlgorithmsSessionRuntimePorts.ts` deletion;
     new infrastructure identity adapter files; focused lifecycle,
     foreground-facade/runtime-port replacement, Certification start and new
     session-identity tests; architecture/dead-path tests; this plan status.
     A required file outside this matrix is a controller stop and a new packet.
- **Non-goals:** Task 5B terminal semantics; foreground timer generalization;
  runner UI/shared-surface work; changing session/domain schemas, persisted old
  IDs or runtime-selector grammar; rewriting Maestro flows; account/sync ID
  schemes; content selection; Algorithms or Certification mode behavior;
  web-product support; Task 6; a compatibility alias or fallback generator.
- **Acceptance criteria:**
  1. `TrainingLifecycleUseCases` is the only owner that requests a new session
     ID; neither family facade contains a sequence, UUID call or caller-supplied
     `sessionId`. The lifecycle replaces any caller-provided `sessionId` before
     family preparation; it cannot become a second identity input.
  2. Phone production uses `expo-crypto` UUIDv4 through the one infrastructure
     port; Node verification uses its platform peer. Identifiers include the
     requested track/mode and validate as UUIDv4. Generation failure is an
     explicit start failure and never falls back to time, randomness or a
     counter.
  3. Two starts in one composition and starts after a fresh composition root
     cannot reuse a production identity. A deterministic injected port proves
     exact family-neutral forwarding for Algorithms and Certification.
  4. Development audit reset still starts at the currently evidenced
     Algorithms `:1` identity; retained durable history advances the suffix
     across mode changes and relaunch. It reads only the canonical session
     repository in composition and cannot run in production.
  5. `AlgorithmsSessionRuntimePorts`, both module counters, their export/test
     and unused imports are absent. The simulation draft timestamp still comes
     from the injected lifecycle clock; no wall-clock behavior changes.
  6. Focused relaunch/start/timer/Certification tests, root typecheck, full
     tests, content/privacy/contract/diff gates and independent QA return
     `pass`; existing deterministic Maestro source assertions remain green
     without selector rewrites.
- **Required evidence:** before/after owner and dead-path scan; UUID shape and
  repeated/recomposed uniqueness tests; injected deterministic cross-family
  start test; development durable-suffix reset/relaunch test; existing
  Algorithms timer-port and Certification lifecycle regressions; allowed-file
  diff; typecheck/full suite/content/privacy/contract/diff gates; independent
  QA of correctness, scope, debt and platform resolution.
- **Stop conditions:** platform resolution would load Node crypto in a phone
  build or Expo crypto in Node tests; deterministic audit identity requires a
  presentation/storage import or changes selector grammar; an unknown consumer
  still needs `AlgorithmsSessionRuntimePorts`; family preparation cannot accept
  lifecycle-injected identity without a schema/contract change; or a persisted
  collision cannot be prevented without account/sync migration. Do not add a
  fallback, keep either counter or widen into Task 5B/timer/UI.
- **Independent preflight evidence (2026-08-01):** a read-only reviewer traced
  every consumer and returned exact verdict `pass`. It confirmed the existing
  `.ts`/`.native.ts` resolver convention, synchronous native UUID support, the
  two removable facade consumers of `AlgorithmsSessionRuntimePorts`, the
  lifecycle clock replacement and a durable-history development provider that
  preserves existing Algorithms Maestro identities across reset and relaunch
  without any `.maestro` change. It also identified the direct lifecycle test
  fixtures that must stop supplying their own session IDs.
- **Closure evidence (2026-08-01):** both reset-prone family counters and the
  obsolete `AlgorithmsSessionRuntimePorts` owner were deleted. The shared
  lifecycle now overwrites caller identity and is the sole production caller of
  the async session-identity port; Node and phone adapters use their platform
  UUIDv4 peer with one validated track/mode shape and explicit failure. The
  development audit provider derives its suffix from canonical durable history,
  advances across mode/composition changes and returns to `:1` only after the
  canonical reset. No Maestro file, compatibility path, timestamp/random
  fallback or second production generator was added. Controller-focused tests
  passed 68/68, the full suite passed 519/519 outside the restrictive local-port
  sandbox, root typecheck and content/privacy/contract/diff gates passed, and
  independent implementation QA returned exact verdict `pass`.

**Controller slice 5D — one family-neutral foreground-session timer
(`complete`)**

- **Objective:** make the canonical active-foreground timer truthful for both
  Algorithms and ordinary Certification sessions, so every declared
  `elapsedForeground` mode persists, resumes and displays actual foreground
  time through one application owner.
- **Confirmed repository facts and root cause:** the domain record, repository,
  low-level `ForegroundSessionTimer` and lifecycle checkpoint command are
  already family-neutral, but their only application facade is named and
  guarded for Algorithms. All six ordinary Certification configurations declare
  `elapsedForeground`, while their reachable runner never initializes, enters,
  leaves, subscribes to or checkpoints that timer and therefore renders the
  unchanged session aggregate as `00:00`. Certification Exam uses the separate
  canonical `absoluteDeadline` policy and must not enter this foreground timer.
- **Smallest coherent architecture and closed scope:** move/rename the existing
  Algorithms timer facade into the shared training-lifecycle application area
  and generalize only its family guard and durable `familyId` verification. Keep
  one installed instance and the existing repository, serializer, checkpoint
  cadence, failure latch and countdown-finalization operation. Repoint the
  Algorithms facade without changing its public learner behavior. Wire ordinary
  Certification start/resume/projection/submit/final completion/abandon plus its
  runner AppState/subscription lifecycle to that same timer; the projection
  exposes the timer-owned elapsed value instead of reading a stale aggregate.
  Update `ContentPreparationGate` to restore the shared timer for any resumable
  foreground-timed session. Delete the old Algorithms-named facade/export and
  rename its focused tests rather than retain an alias.
- **Exact implementation area:** the existing Algorithms timer facade deletion;
  one shared replacement under `src/application/trainingLifecycle/**` or
  `src/application/runtime/**`; training-lifecycle and Algorithms barrels;
  `trainingLifecycleComposition.ts`; `algorithmsSessionFacade.ts` only for
  repointing; `certificationSessionFacade.ts` for shared timer commands and
  projection; `ContentPreparationGate.tsx`; the reachable
  `CertificationPracticeSessionScreen.tsx` only for AppState/subscription and
  timer projection rendering; focused timer, Certification lifecycle,
  architecture and screen-source tests; this plan status. A required file
  outside this list is a controller stop and a new packet.
- **Non-goals:** Task 5B terminal-command choice or any transition change;
  Certification Exam `absoluteDeadline`; shared Practice surface/style cutover;
  response/scoring/review/content behavior; conflict/leave copy redesign;
  summary/history work; timer cadence/schema/storage-key change; new interval,
  repository, presentation arithmetic, fallback, compatibility export or
  second timer; account/web/deployment work.
- **Acceptance criteria:**
  1. Exactly one installed foreground-timer facade accepts active sessions only
     when their canonical timer is `elapsedForeground` or
     `countdownForeground`; durable `familyId`, `trackId` and `sessionId` must
     match the session and no Algorithms-only assertion remains in the shared
     owner.
  2. Existing Algorithms elapsed/countdown, background exclusion, periodic
     checkpoint, drift, expiry and exactly-once finalization tests remain
     behaviorally unchanged through the renamed owner; no public compatibility
     alias retains the old facade.
  3. Each ordinary Certification start initializes the shared timer; resume
     requires and restores its matching durable timer; foreground/background
     events, periodic refresh, response save, final completion and abandonment
     checkpoint through the application facade. A relaunch test proves closed-
     app time is excluded and retained foreground time resumes.
  4. Certification projection and reachable screen publish increasing elapsed
     foreground time from the shared timer. The screen owns no clock, interval,
     storage call or timer arithmetic beyond formatting the application value.
  5. Certification Exam remains exclusively `absoluteDeadline`; attempting to
     initialize it in the foreground-session timer fails explicitly and no
     exam behavior or tests change.
  6. Old Algorithms timer symbols/files are absent; source contains one timer
     instance, one repository binding and no duplicate AppState timer path.
     Focused tests, full suite, typecheck, content/privacy/contract/diff gates
     and independent QA all return `pass`.
- **Required evidence:** before/after owner/reachability scan; renamed unchanged
  Algorithms regressions; cross-family initialize/restore/mismatch and
  Certification relaunch/background/checkpoint tests; reachable screen-source
  assertion; no-old-symbol/dead-path scan; allowed-file diff; root focused/full
  tests and all standard gates; independent correctness/completeness/debt/
  architecture QA.
- **Stop conditions:** Certification timer wiring requires changing the Task 5B
  terminal transition contract; the shared owner cannot distinguish
  `absoluteDeadline` without changing session schema; repository cleanup does
  not preserve a resumable foreground timer; the UI requires a second clock or
  interval; or an unknown consumer requires the Algorithms-named owner. Record
  a small repair instead of adding an alias, fallback or widening into the
  shared-surface redesign.
- **Repair 5D-R1 — stale canonical evidence path (2026-08-01; recorded after
  controller gate failure and before repair):** the implementation correctly
  deletes `tests/algorithmsForegroundTimerFacade.test.ts` and replaces it with
  the family-neutral `tests/foregroundSessionTimerFacade.test.ts`, but five
  canonical requirement mappings still name the deleted file, so the contract
  gate fails before validation. The smallest repair is restricted to those
  five `testPath` values in `docs/canonical-product-contract.yaml`; every
  requirement ID, test name, semantic value and implementation status remains
  unchanged. Non-goals are any contract behavior/schema/test-body change,
  compatibility filename, duplicate test or documentation rewrite. Acceptance:
  the old path is absent, all five mappings resolve to the renamed real test,
  canonical validation and contract gate pass, focused/full checks remain green
  and independent implementation QA evaluates the repaired final diff. If a
  mapped test name is absent from the replacement file, stop rather than
  weakening or deleting that requirement.
- **Repair 5D-R2 — ordered visual-shell branch extraction (2026-08-01;
  recorded after full-suite failure and before repair):** 522/523 full tests
  pass. The sole failure is not a missing header: the visual-shell helper finds
  an AppState effect's newly added early `if (!projection)` guard before the
  later `if (error)` render branch and therefore slices an empty string. Change
  only the test helper so its end marker is resolved after the matched start
  marker, with explicit missing-marker assertions; keep every exact header and
  active/headerless assertion unchanged. Non-goals are production-code token
  rearrangement, weaker regexes, removal of a render-branch assertion, visual
  redesign or timer behavior change. Acceptance: the repaired visual-shell test
  fails for a genuinely missing branch/header, passes for the current ordered
  source, the full suite and all 5D gates pass, and independent QA reviews the
  final repair. Stop if an actual Certification render branch lacks the shared
  header rather than adjusting the assertion around it.
- **Repair 5D-R3 — explicit timer release after verified ordinary completion
  (2026-08-01; recorded after independent implementation QA `fail` and before
  repair):** QA confirmed that ordinary completion clears durable active state
  but leaves the scheduled interval alive until its next callback discovers the
  missing session and stops through an expected error. Add one synchronous
  shared-facade terminal-success release that cancels the matching interval and
  drops only that completed session's in-memory timer/fault/finalization/
  operation entries. Algorithms and Certification ordinary completion call it
  only after `completeActivePracticeSession` has returned its verified success;
  a failed completion must not release the still-active timer. Do not change
  Task 5B transitions, checkpoint cadence, durable cleanup, abandonment,
  simulation finalization or introduce a second terminal path. Acceptance: a
  focused test proves the final checkpoint is retained, successful release
  invokes cancel and no post-terminal callback/checkpoint occurs; the same test
  proves that omitting release for a simulated completion failure leaves the
  timer scheduled and usable; both family wrappers invoke release after, never
  before, verified completion; all 5D/full gates pass and repeated independent
  QA returns exact `pass`. Stop if cleanup cannot be made in-memory-only or
  requires weakening completion verification.
- **Repair 5D-R4 — serialize terminal completion against already-started ticks
  (2026-08-01; recorded after repeated independent QA `fail` and before
  repair):** cancel prevents future interval delivery but R3 leaves a race for
  a callback that captured the timer while `completeActivePracticeSession` was
  pending; it can be queued after success and write or fault after release.
  Replace the exposed checkpoint-plus-external-release sequence with one shared
  generic terminal operation that serializes the final checkpoint, the supplied
  verified ordinary-completion promise and in-memory release in the timer's
  existing per-session lane. The interval operation must verify that its
  captured timer is still the currently registered timer when its queued body
  starts; a callback queued behind successful terminal release becomes a no-op.
  Do not add a second lock, generation fallback, durable marker or terminal
  lifecycle. On completion rejection the shared operation must not release or
  latch a timer fault and the queued timer remains usable. Replace, rather than
  retain beside it, the R3 external release API/call sequence. Acceptance: a
  deterministic deferred-completion test fires a callback while completion is
  pending, then proves the final checkpoint/cancel and zero post-success write
  or fault; a rejection test proves no release and continued checkpointing;
  both family wrappers use the one serialized terminal operation; full gates
  and another independent QA return exact `pass`. Stop if the terminal callback
  would bypass or duplicate `completeActivePracticeSession`.
- **Closure evidence (2026-08-01):** the Algorithms-only application facade and
  test filename were deleted, and one shared timer owner now serves both
  families through one composition instance, repository binding, cadence,
  serializer and failure latch. Ordinary Certification initializes, restores,
  enters/leaves, subscribes, checkpoints and projects real foreground time;
  Certification Exam remains exclusively `absoluteDeadline`. R1 replaced five
  stale canonical evidence paths without changing any requirement. R2 made the
  visual-shell source helper order-aware without weakening its header
  assertions. Independent QA then found and rejected two terminal interval
  races: R3 added explicit success cleanup, and R4 replaced its external
  two-step sequence with one serialized final-checkpoint/completion/release
  operation plus a queued-callback identity guard. Deferred tests prove a tick
  captured during successful completion cannot write or fault afterward, while
  rejected completion leaves the same timer usable. Final controller-focused
  tests passed 62/62, full tests passed 525/525 outside the local-port sandbox,
  typecheck and content/privacy/contract/diff gates passed, dead-path scans found
  no old facade/alias or second timer, and repeated independent QA returned
  exact verdict `pass`.

**Controller slice 5E — Certification feedback reads the canonical attempt
(`complete`)**

- **Objective:** remove scoring ownership from the reachable Certification
  presentation so feedback is derived only from the canonical durable attempt
  produced by `CertificationFamilyRuntime`.
- **Confirmed repository facts and root cause:**
  `getCertificationPracticeProjection` already loads the materialized attempt
  for the active occurrence but returns only its response. The screen imports
  `scoreCertificationQuestion`, reconstructs a response from local selected
  state and scores it again to decide feedback. That duplicates family
  semantics in presentation and can diverge from the immutable committed
  `TrainingAttempt.result`; the Algorithms projection already treats the
  committed attempt as the result authority.
- **Smallest coherent scope:** add an application-owned nullable Certification
  feedback projection beside `committedResponse`, populated from the exact
  materialized attempt's `result.kind` and the current canonical question's
  authored feedback. The reachable screen renders that projection and deletes
  its scoring import/call; local selection remains only an input control. Add a
  real lifecycle test proving incorrect, partial where supported and correct
  durable attempt kinds reach the projection unchanged, plus an architecture
  assertion that no feature/presentation file imports Certification scoring.
  Exact files: `certificationSessionFacade.ts`,
  `CertificationPracticeSessionScreen.tsx`, focused Certification lifecycle/
  scoring-boundary tests, `mutationArchitecture.test.ts`, and this plan status.
- **Non-goals:** Task 5B completion semantics; pending journal recovery or
  operational-state UI; session load/start/conflict handling; timer behavior;
  shared Practice surface/style cutover; answer-control redesign; scoring or
  authored-feedback changes; content, review policy, summary/history, account,
  web or deployment work; compatibility feedback shape or fallback re-score.
- **Acceptance criteria:**
  1. The application projection exposes feedback only when the current
     occurrence has its exact materialized attempt; its result kind equals the
     stored attempt kind and reason/details come from that occurrence's
     canonical question.
  2. The screen contains no `scoreCertificationQuestion`, scoring helper,
     correctness comparison or substitute fallback; before materialization it
     displays no feedback, and afterward it renders the application projection.
  3. Single- and multiple-selection input behavior remains unchanged and local
     selected state cannot override a committed result.
  4. No duplicate feedback composer, compatibility alias or unused export is
     added; family scoring remains reachable only behind the family runtime and
     its direct domain tests.
  5. Focused real-lifecycle, screen-source and scoring regressions, full tests,
     typecheck, content/privacy/contract/diff gates and independent QA return
     `pass`.
- **Required evidence:** before/after scoring import and call scan; persisted
  attempt-to-projection equality tests across supported result kinds; screen
  source/dead-code assertion; allowed-file diff; focused/full/gate output and
  independent correctness/completeness/debt/architecture QA.
- **Stop conditions:** an authored question type cannot project its committed
  result without changing the attempt or content contract; feedback must expose
  a pending non-materialized journal outcome to remain truthful; or removal of
  the screen scorer requires operational-state/shared-surface work. Record a
  separate small packet rather than re-score, synthesize correctness or widen
  into those areas.
- **Closure evidence:** `CertificationPracticeProjection.feedback` is now
  nullable and comes from the exact materialized attempt's stored result plus
  the current canonical question's authored reason/details. The reachable
  screen no longer imports or calls the family scorer and local selection
  cannot override a committed result. Real lifecycle coverage proves null
  before materialization and unchanged incorrect, partial and correct result
  kinds afterward; architecture coverage prevents presentation scoring from
  returning. Controller-focused tests passed 24/24, full tests passed 527/527
  outside the local-port sandbox, typecheck and content/privacy/contract/diff
  gates passed, the dead-code scan found no duplicate presentation scorer or
  compatibility feedback path, and independent QA returned exact verdict
  `pass`.

**Controller slice 5F — explicit Certification load, resume and conflict
(`complete`)**

- **Objective:** make entry into an ordinary Certification session truthful:
  resume the exact compatible active session, start only when none exists, and
  show an explicit conflict or unavailable state instead of treating every load
  failure as absence.
- **Confirmed repository facts and root cause:**
  `CertificationPracticeSessionScreen` currently converts every
  `getCertificationPracticeProjection` rejection to `null` and then calls
  `startCertificationSession`. This hides projection, timer and persistence
  failures and lets an incompatible active session reach a start attempt. The
  shared lifecycle already provides canonical start/resume and typed
  `active_session_conflict`; the Certification facade owns its foreground-timer
  restoration. Algorithms has an explicit family-local entry pattern, but no
  cross-family coordinator is canonical.
- **Smallest coherent scope:** add one Certification application-owned open
  command returning either a verified ready projection or the exact active
  session conflict. It reads active state before starting, resumes only the
  exact requested ordinary Certification mode, starts once only when no active
  session exists, and on a typed start race re-reads once without retrying or
  substituting another session. Add a narrow resume-only route intent carrying
  the expected durable session ID for ordinary Certification and Exam. Its
  target verifies that exact ID/track/mode and can only resume; absence or
  mismatch is unavailable/conflict and performs zero starts. Existing setup
  params are navigation typing only under this intent and cannot authorize a
  replacement. The practice screen consumes the open result, exposes
  operational failures explicitly and offers only truthful canonical conflict
  handoffs: the active ordinary Certification route with its durable mode and
  expected ID, the Certification Exam route with its expected ID, or Home for
  another family, plus Back to Practice. Exact files:
  `certificationSessionFacade.ts`, `CertificationPracticeSessionScreen.tsx`,
  the Exam route type and resume-only branch in `ExamScreen.tsx`, focused
  Certification lifecycle/route/screen-source tests,
  `mutationArchitecture.test.ts`, and this plan status.
- **Non-goals:** abandoning or replacing an active session; reconstructing its
  setup controls; refactoring the Algorithms entry path; Task 5B terminal
  semantics; pending-journal recovery; timer, feedback or scoring changes;
  general Exam entry/start redesign; shared Practice surface/style work; new
  route names, repositories, generic coordinators, compatibility branches or
  fallback start paths.
- **Acceptance criteria:**
  1. With no active session, open performs exactly one start with the requested
     ordinary Certification mode; a typed start race causes one authoritative
     re-read and no retry.
  2. The exact active ordinary Certification mode is resumed through the
     canonical lifecycle, restores its timer and preserves its session ID.
     Another Certification mode, Certification Exam or another family returns
     an explicit conflict without mutation.
  3. Projection, resume, timer and persistence failures propagate to an
     explicit unavailable state; no broad catch-to-null/catch-to-start or
     caller-owned default remains.
  4. Conflict UI offers only the canonical resume handoff appropriate to the
     exact active session and Back to Practice. The handoff carries the expected
     session ID; if that session disappears or changes before target mount, the
     target exposes unavailable/conflict and starts nothing. It never claims
     success, abandons, replaces or silently redirects.
  5. There is one Certification entry owner and no generic abstraction,
     compatibility alias, duplicate start path or unused export. Focused real-
     lifecycle and screen-source tests, full tests, typecheck,
     content/privacy/contract/diff gates and independent QA return `pass`.
- **Required evidence:** before/after catch/start scan; real lifecycle tests for
  no-active, exact resume, incompatible modes/families, start race and injected
  load/resume/timer failures; route tests proving expected-ID handoff and
  disappearance/mismatch causes zero starts; screen-source/conflict-action
  assertions; allowed-file diff; dead-code scan; focused/full/gate output and independent
  correctness/completeness/debt/documentation/architecture QA.
- **Stop conditions:** exact active identity cannot be obtained without a
  lifecycle contract change; a truthful resume-only intent requires broader
  navigation redesign than an optional expected ID; or safe start-race handling requires retries or
  mutation beyond the typed conflict. Record a separate small packet rather
  than guess identity, start over, add a hidden fallback or widen into shared
  navigation architecture.
- **Preflight correction R1:** the first packet failed independent preflight
  because copying the current route params and changing only `modeId` did not
  carry active-session identity. If the active session disappeared before the
  target mounted, its ordinary entry path could start a replacement with stale
  setup params; Exam had the same identity gap. R1 adds only the expected-ID,
  resume-only intent and the zero-start disappearance proof. It does not adopt
  the existing unsafe Algorithms handoff or widen into general navigation.
- **Repair 5F-R2 — exact visual-shell evidence:** the first full-suite run
  passed 530/531 tests; the sole failure was the order-aware shell test still
  counting three standalone Certification branches after the new explicit
  conflict branch became the fourth. The repair changed only that test to
  assert invalid-mode, conflict, error and loading branches separately, while
  preserving the active runner's headerless assertion. Combined focused tests
  then passed 39/39 without a production change.
- **Repair 5F-R3 — expired exact Exam remains a terminal result:** independent
  implementation QA rejected the resume-only Exam branch because an exact
  session that expired during projection was canonically finalized but shown
  as unavailable. The branch now handles the existing
  `CertificationExamExpiredError` exactly like the canonical refresh path and
  replaces itself with `RESULT` for that same session ID. A real clock-driven
  test proves the active reference is removed, the exact verified result exists
  and no replacement Exam starts.
- **Closure evidence (2026-08-01):** one application-owned Certification open
  command now starts only after verified absence, resumes only an exact ordinary
  track+mode and handles a typed start race with one authoritative re-read and
  zero retry. Conflicts carry an expected durable session ID into resume-only
  Practice or Exam routes; disappearance or mismatch starts nothing, another
  family routes only to Home, and no abandon/replace path was added. The broad
  projection-catch-to-null/start path and the competing public ordinary start/
  resume exports were removed. Exact Exam expiry reaches its verified result.
  Controller-focused tests passed 40/40, full tests passed 532/532 outside the
  local-port sandbox, typecheck and content/privacy/contract/diff gates passed,
  dead-path scans found no old catch/start or duplicate entry owner, and repeat
  independent QA returned exact verdict `pass`.

**Controller slice 5G — Certification durable operation projection and recovery
(`complete`; repeat independent implementation QA: `pass`)**

- **Objective:** expose the shared lifecycle's exact ordinary-Practice durable
  operation state in Certification so a failed or pending answer/advance can be
  retried or recovered safely without losing local input, duplicating a submit
  or replacing the runner with a generic unavailable screen.
- **Confirmed repository facts and root cause:** the Certification projection
  reads only materialized attempts and has no pending-mutation or
  `PracticeDurableOperationState`. Its screen catches submit/advance failures
  into one page-level `error`, so a pre-journal failure loses the editable
  runner and a durable journal has no recovery action. The shared lifecycle
  already owns operation reconstruction and exact recovery; the Algorithms
  facade projects materialized versus journal-committed responses and its
  screen already consumes the same states. The family-neutral notice mapper is
  still private inside the Algorithms screen.
- **Smallest coherent scope:** replace Certification's nullable
  `committedResponse` with one response projection whose source is
  `committed` or `materialized`; a pending journal may supply only its exact
  family-runtime attempt response, while feedback remains materialized-only to
  preserve slice 5E. Add the lifecycle-owned operation state to the projection
  and one Certification recovery command delegating to the existing canonical
  recovery. Move the already-family-neutral Practice operation notice mapper
  from the Algorithms screen into `practiceSessionPresentation.ts` and make
  both screens consume it without changing Algorithms behavior. Certification
  keeps local selection only in unanswered/pre-journal-failure states, locks it
  after a durable command, exposes recovery only when `allowedAction` is
  `recover`, and retries advance without resubmitting. Exact files:
  `certificationSessionFacade.ts`, `CertificationPracticeSessionScreen.tsx`,
  `PracticeSessionScreen.tsx` only for mapper import/removal,
  `practiceSessionPresentation.ts`, focused presentation/Certification real-
  lifecycle/architecture tests, and this plan status.
- **Non-goals:** Task 5B completion semantics; final-result routing; abandon,
  pause or back interception; shared Practice surface/style cutover; option
  correctness decoration; scoring, feedback copy, timer, session entry,
  identity, Exam, Algorithms behavior, content/review policy, storage schema,
  account/cloud work, new repository/coordinator or fallback retry.
- **Acceptance criteria:**
  1. Certification projection returns the exact lifecycle operation state and
     either no response, the journal-committed response or the materialized
     response for the current occurrence. A different session/occurrence is
     never borrowed; materialized wins if both exist.
  2. Feedback remains null until materialization and afterward retains the exact
     stored attempt result plus authored copy. A journal-committed response
     locks input but cannot synthesize feedback or correctness.
  3. `unanswered` and `submit_journal_failed` preserve editable local input and
     permit only the same submit. `commit_pending`, materialization/verification
     failures, verified-pending-clear and recovery-required never resubmit; only
     states whose canonical `allowedAction` is `recover` expose the one recovery
     command.
  4. Successful recovery refreshes to the exact converged state; failed
     recovery remains explicit. `advance_failed` retries only advance and never
     reconstructs or resubmits an answer. Within the submit/recovery/advance
     paths changed by 5G, page-level unavailable remains reserved for a failed
     authoritative projection refresh; completion errors and routing remain
     unchanged and outside this slice under Task 5B.
  5. There is one shared Practice operation notice mapper, one Certification
     recovery command and no compatibility response field, duplicate state
     interpreter, catch-to-default or unused old export. Algorithms public
     behavior and source-owned actions remain unchanged.
  6. Real lifecycle/fault-boundary tests, presentation/source regressions, full
     tests, typecheck, content/privacy/contract/diff gates and independent QA
     return `pass`.
- **Required evidence:** before/after projection and page-level error scan;
  real in-memory pre-journal and durable journal/materialization/verification/
  recovery fixtures proving response source, feedback boundary, no duplicate
  attempt and convergence; advance-failure retry proof; shared-mapper and dead-
  path assertions; focused/full/gate output and independent correctness/
  completeness/debt/documentation/architecture QA.
- **Stop conditions:** pending mutation cannot expose its exact attempt without
  changing the journal contract; operation recovery requires presentation to
  read storage; preserving a local response requires a second durable store;
  or the only truthful rendering requires Task 5B, abandon semantics or the
  shared-surface cutover. Record a separate small packet rather than infer a
  response, add a fallback submit or widen scope.
- **Preflight correction R1:** the first packet's page-level-unavailable
  wording could be read as changing completion failure behavior, conflicting
  with the explicit Task 5B/final-result non-goals. The corrected criterion is
  limited to submit/recovery/advance and leaves completion code untouched.
- **Repair 5G-R2 — occurrence-scoped local selection:** independent
  implementation QA rejected the first implementation because the screen
  preserved `selected` by editable operation kind alone. After a successful
  advance, the next occurrence is `unanswered` with no durable response, so it
  could inherit and submit the previous occurrence's local option IDs. The
  smallest repair binds local selection to the exact `session.id` plus
  `occurrenceId`: a durable projected response always wins; an uncommitted
  selection survives only a refresh of that same editable occurrence; every
  session/occurrence change and every non-editable response-less state clears
  it. Scope is limited to
  `CertificationPracticeSessionScreen.tsx`, one focused pure reconciliation
  helper/test only if needed for behavioural proof, the existing 5G focused
  source/lifecycle tests and this status. It must not add storage, reconstruct
  an answer, change Algorithms, completion, navigation or the response
  contract. Acceptance requires deterministic proof that the same occurrence
  plus `submit_journal_failed` preserves input, while a successful advance to a
  different `unanswered` occurrence clears it; focused/full/gates and repeat
  independent QA must pass.
- **Closure evidence (2026-08-01):** Certification now projects the exact
  shared durable Practice state and the exact current-occurrence response with
  explicit `committed`/`materialized` provenance; authored feedback remains
  materialized-only. Submit, recovery and advance use only their canonical
  commands, and Algorithms plus Certification consume one operation-notice
  mapper. After the first independent QA found cross-occurrence local-selection
  leakage, R2 bound that selection to the exact session and occurrence: a
  durable response wins, the same editable pre-journal retry preserves input,
  and every different or locked response-less occurrence clears it before
  rendering or submission. Controller-focused tests passed 33/33, full tests
  passed 540/540 outside the local-port sandbox, typecheck and
  content/privacy/contract/diff gates passed, dead-path review found no old
  unowned `selected` state or duplicate mapper/recovery command, and repeat
  independent QA returned exact verdict `pass`.

**Controller slice 5H — shared Certification Practice surface and truthful exit
(`complete`; repeat independent implementation QA: `pass`)**

- **Objective:** delete the second reachable Certification question runner and
  render ordinary Certification through the canonical mobile Practice surface,
  while separating resumable pause from confirmed destructive abandonment and
  preventing system back from bypassing that choice.
- **Confirmed repository facts and root cause:** after 5G the Certification
  application projection owns entry, timer, response, feedback and durable
  operation state, but `CertificationPracticeSessionScreen` still duplicates
  the shared Card/Pressable/action/timer composition. Its visible `Leave
  session` directly calls destructive abandonment, has no confirmation or
  rejection handling, and no `beforeRemove` guard. The shared
  `PracticeSessionSurface` already owns the phone session layout, response
  controls and exit modal, and Algorithms already guards route removal; however
  its abandonment copy always promises a partial summary, which is truthful
  only for the existing Algorithms handoff and cannot be reused unchanged for
  Certification.
- **Smallest coherent scope:** project the existing Certification single/multiple
  choice state into `PracticeSessionSurface` and delete its duplicate ready-
  runner markup/styles/imports while preserving the already explicit loading,
  conflict and unavailable branches. Make the shared exit presentation encode
  the truthful verified destination: Algorithms retains its current partial-
  summary wording and navigation unchanged; Certification says that pause keeps
  the exact session resumable, while confirmed end makes it non-resumable and
  returns to Practice without claiming completion, score or summary. Add the
  same route-removal guard and one permit-to-exit owner. Pause leaves the
  foreground timer, performs no abandonment, and exits only afterward.
  Confirmed abandonment invokes the one existing lifecycle command and exits
  only after verified success; a before-journal failure remains on the same
  runner with only retry of that exact abandon, while a durable pending failure
  exposes only canonical recovery. Exact files:
  `CertificationPracticeSessionScreen.tsx`, `PracticeSessionSurface.tsx`,
  `practiceSessionPresentation.ts` only for an already-shared pure projection
  helper if required, `certificationSessionFacade.ts` and the existing
  `TrainingLifecycleUseCases`/port types for the exact abandonment recovery
  described in preflight R1, focused exit/surface/architecture tests, and this
  plan status.
- **Non-goals:** Task 5B final-submit/completion semantics or result routing;
  Algorithms behavior, copy or summary navigation; Certification Exam; setup,
  conflict or resume-intent redesign; response/scoring/feedback/timer/content
  contracts; Task 6 outcome/history work; a second modal, navigation helper,
  lifecycle, repository or compatibility/fallback path; broad visual redesign.
- **Acceptance criteria:**
  1. Every ready ordinary Certification state renders through the one
     `PracticeSessionSurface`; the duplicate Card/Pressable/action bar, timer
     formatter and ready-screen styles/imports are removed, while all runtime
     selectors, single/multiple accessibility roles, durable response locking,
     feedback boundary and 5G recovery/advance behavior remain exact.
  2. A visible leave action, header/system back and back gesture all open the
     same confirmation and perform no route change or durable mutation.
  3. `Pause and resume later` checkpoints/leaves foreground time, preserves the
     exact active session and then permits exactly one existing back or Practice
     Hub exit. Relaunch/resume retains its session ID, position, answer state and
     timer; it never abandons or starts a replacement.
  4. Destructive end is separately labelled and confirmed. It calls one
     canonical abandon command; verified success returns to Practice with no
     completion/score/summary claim. Before-journal failure stays on the exact
     active runner and offers only same-command retry; a durable pending
     journal cannot retry abandonment and offers only recovery. No failure
     produces unhandled rejection, navigation success or a second command.
  5. The shared exit modal has one implementation and explicit truthful outcome
     copy; Algorithms' current partial-summary semantics and tests remain
     unchanged. There is one route-exit permit owner and no duplicated modal,
     stale Certification runner component/style, hidden catch, fallback route
     or unused export.
  6. Focused real-lifecycle failure/resume tests, screen/surface/source and back-
     interception tests, full tests, typecheck, content/privacy/contract/diff
     gates and independent QA return `pass`.
- **Required evidence:** before/after duplicate-runner and direct-abandon scans;
  real in-memory pause/resume plus abandonment failure fixtures proving command
  counts, active identity and recovery safety; source/interaction assertions for
  shared surface, both back paths and truthful family copy; allowed-file diff,
  dead-code scan, focused/full/gate output and independent correctness/
  completeness/debt/documentation/architecture QA.
- **Stop conditions:** exact abandonment recovery cannot be scoped and verified
  by the expected session ID without changing the mutation-journal schema or a
  broader generic terminal contract; preserving exact back behavior requires a
  new route or global navigation redesign; or the shared surface cannot
  represent Certification choices without changing response/content contracts.
  Return a narrower repair packet or required canonical lifecycle-contract
  change rather than infer success, keep the duplicate runner or add a fallback.
- **Preflight correction 5H-R1 — terminal abandonment recovery without an
  active pointer:** the first packet failed because journal materialization may
  durably write the abandoned session and clear the active pointer before a
  later verification/journal-clear failure, while
  `recoverActiveTrainingOperation()` begins with `requireActive()`. R1 adds one
  narrow lifecycle/application command scoped by the expected session ID. It
  may replay only an existing `abandon_training_session` journal owned by that
  ID without requiring an active pointer, then must verify both that no active
  pointer for the session remains and that `getSession(expectedSessionId)` is
  exactly `abandoned` before returning success. If no matching journal exists,
  it may return success only when those same terminal facts are already true;
  every mismatch is explicit. Same-command abandon retry remains available only
  for `not_durable` while that exact session is still active. No generic
  terminal fallback, history inference, completion recovery, second mutation
  coordinator or screen repository read is permitted. Focused fault tests must
  cover journal-write failure, materialization/active-clear failure,
  verification failure and journal-clear failure with exact command/replay
  counts and zero early navigation.
- **Repeat preflight evidence:** the corrected R1 packet passed independent
  architecture preflight. Existing pending-mutation, exact-session,
  active-session and mutation-recovery ports are sufficient; no journal schema,
  repository or generic terminal-recovery expansion is authorized.
- **Repair 5H-R2 — timer checkpoint must not hide the abandonment boundary:**
  the first controller-focused run passed 90/91. The failure fixture reached
  `abandonCertificationSession`, but its foreground-leave checkpoint occurs
  before the facade's abandonment failure classification and consumed the
  injected journal fault as a page-level timer error. The smallest repair must
  keep the exact session active and expose only safe same-command retry when the
  checkpoint failed before any journal, or expose only canonical recovery when
  that checkpoint itself left a durable journal. The abandonment fault fixtures
  must then target the actual `abandon_training_session` journal-write,
  materialization/active-clear, verification and journal-clear boundaries and
  prove one abandon command, zero early success/navigation and the exact replay
  count. Scope is limited to the 5H facade/lifecycle projection, screen retry
  mapping and focused fault tests; the timer algorithm, journal schema,
  Algorithms, Task 5B and shared-surface layout are non-goals. Acceptance
  requires the focused suite, typecheck, full gates and repeat QA to pass with
  no catch-to-page-outage for a classified safe/recoverable pre-abandon timer
  failure.
- **Repair 5H-R3 — reconstruct answered occurrence after pre-abandon timer
  recovery:** independent implementation QA rejected R2 because the shared
  active-operation recovery publishes `unanswered` for a recovered non-submit
  journal. On an occurrence that already has a materialized attempt, the
  Certification pre-abandon timer path then refreshed that transient in-memory
  state, hid feedback and re-enabled duplicate submit. The smallest repair is
  facade-local: after exact active-operation recovery and exact timer-leave
  retry, call the existing canonical operation reconstruction for the verified
  same active session. A current materialized attempt must restore `feedback`;
  absence must restore `unanswered`. Do not change Algorithms, generic recovery,
  storage or the operation contract. Add a real memory-storage regression that
  starts from materialized feedback, induces a durable timer checkpoint fault,
  recovers, and proves exact active ID, pending null, materialized response,
  `feedback`, one attempt and presentation remaining non-editable. Focused/full
  gates and repeat independent QA must pass before 5H closes.
- **Closure evidence (2026-08-01):** ordinary Certification ready states now
  render only through `PracticeSessionSurface`; the competing Card/Pressable/
  action/timer composition and its styles were removed. One shared exit modal
  retains Algorithms' exact partial-summary copy and gives Certification
  truthful pause-versus-end copy. Visible leave plus system/back gesture share
  one guard; pause preserves the exact active session, while verified end
  returns to Practice without a score/summary claim. R1 added exact-ID terminal
  abandonment recovery without requiring an active pointer. R2 separated a
  failed foreground checkpoint, its durable active-operation recovery and the
  actual abandonment journal boundaries; unknown failures remain explicit.
  R3 reconstructs the Practice operation from canonical records after timer
  recovery, so an already materialized response remains locked `feedback` with
  exactly one attempt. Controller-focused tests passed 93/93, full tests passed
  546/546 outside the local-port sandbox, typecheck and
  content/privacy/contract/diff gates passed, dead-path scans found no duplicate
  runner/modal or unused recovery command, and repeat independent QA returned
  exact verdict `pass`.

**Controller evidence slice 5I — two-platform ordinary-runtime proof and Task
5 behavioural report (`packet ready for independent preflight`)**

- **Objective:** close Task 5 with reproducible phone evidence that the now-
  canonical Algorithms and Certification ordinary Practice runtimes render and
  complete truthfully on iOS and Android, without reopening their runtime
  architecture or redesigning Task 6 result surfaces.
- **Confirmed repository facts and remaining gap:** slices 5A–5H and 5B-1 have
  removed the competing writers/lifecycles/fallbacks and pass 551/551 tests,
  but Task 5 still requires a behavioural report, state screenshots and two-
  platform flow evidence. `docs/reports/launch-005-learning-runtimes.md` does
  not exist. Existing Algorithms user-testing and screenshot flows cover a
  deterministic 10-item journey, feedback/details, pause/relaunch/resume and
  conflict, but they do not capture the new final-feedback/separate-Finish
  boundary. `.maestro/cloud-c3-focus-practice.yaml` reaches only the first
  Certification question and is not a completion proof. The repository has
  stable runtime selectors for setup, single/multiple choice, all Algorithms
  controls, feedback, exit/resume and summaries. A booted iPhone 17 simulator
  and `emulator-5554` both contain the development client; no Metro process is
  currently running.
- **Smallest coherent scope:** create or extend capture-only Maestro flows under
  `.maestro/screenshot-capture/launch-005-learning-runtimes/`, reusing the
  existing reset/bootstrap runners and selectors. Produce one clean,
  repeatable light-theme English run on each phone platform for: representative
  Algorithms choice/complexity/ordering controls and long feedback/details;
  Algorithms pause/relaunch/resume/conflict; Certification setup, long single-
  choice and multiple-choice question/feedback plus its own pause, route exit,
  relaunch and exact-session resume; and both families' final
  durable feedback with the separately visible `Finish session` action followed
  by their existing verified result screen. Store unedited full-screen captures
  and the skill-required manifest/run report/coverage/environment/blocker files
  under a new timestamped
  `artifacts/maestro-screen-capture/launch-005-learning-runtimes/` directory.
  Write `docs/reports/launch-005-learning-runtimes.md` tying those device facts
  to the already-passing lifecycle, fault-boundary and source tests. Update this
  plan only after independent evidence QA.
- **Non-goals:** changing production UI, selectors, content order, lifecycle,
  scoring, journal/storage contracts or result/review layouts; hidden debug
  routes, seed data, mock/fallback success, pixel-perfect design approval,
  dark/large-text/tablet expansion already owned by Task 2 or result redesign
  owned by Task 6; cloud, auth, hosting or store work.
- **Acceptance criteria:**
  1. Capture flows use only existing learner-visible navigation, the approved
     development reset/bootstrap boundary and stable runtime selectors. They
     contain stability assertions before every full-screen capture and are
     runnable on both current phone platforms without a production-code change.
  2. Device evidence shows the shared Practice shell with unclipped prompt,
     options/control, timer, progress and primary action for Algorithms choice,
     complexity and ordering plus Certification single and multiple selection;
     at least one long prompt/options state and one expanded long feedback/
     details state remain scroll-reachable with their action.
  3. Both families show the last submitted answer as locked, materialized
     feedback while `Finish session` remains a separate visible action. The
     next capture occurs only after that action reaches the existing verified
     session-keyed result screen; no auto-navigation or query fallback is used.
  4. Algorithms and Certification each demonstrate truthful pause/leave and
     exact resume on device. Existing deterministic fault tests are cited for
     submit, advance, timer, abandonment and all seven completion boundaries;
     screenshots are not misrepresented as fault-injection proof.
  5. The evidence pack contains named screenshots, environment/source identity,
     exact commands and outcomes, per-file manifest, coverage matrix and honest
     blockers. The behavioural report maps every Task 5 acceptance state to
     either device evidence or the exact automated proof and records no UI/UX
     pass claim.
  6. Both platform runs pass, screenshot files are readable/non-empty and match
     the manifest; capture-flow source checks, the focused Task 5 tests,
     typecheck/content/privacy/contract/diff gates and independent evidence QA
     return `pass` before Task 5 is closed.
- **Required evidence:** branch/commit and dirty-source identity; device names,
  OS/app ID, Maestro/Metro commands; iOS and Android run logs; original PNGs;
  screenshot manifest and coverage matrix; selector/flow source diff and dead-
  path check; focused/gate outputs; final behavioural report; independent QA
  verdict on correctness, completeness, evidence honesty, documentation and
  architecture.
- **Stop conditions:** either development client cannot load the current local
  bundle; deterministic content/selector identity differs between platforms;
  a required state cannot be reached without a production UI/contract change or
  hidden fixture; or a screenshot exposes a launch-blocking runtime/layout
  defect. Record the exact blocker and create one bounded repair packet instead
  of altering content, weakening assertions, fabricating evidence or widening
  into Task 6.
- **Preflight correction 5I-R1 — explicit Certification resume and existing
  result boundary (`independent preflight: pass after correction`):** execute
  new flows through the existing generic `runRcAlgorithmsIos.mjs` and
  `runRcAlgorithmsAndroid.mjs` runners, whose bootstrap begins on Algorithms;
  the Certification flow must visibly change to the Cloud Certification track
  through existing learner navigation. Do not use the fixed Certification Exam
  runners. Capture Certification pause, route exit, relaunch and the generic
  `patternly:resume:*:<sessionId>` exact resume path separately from Algorithms.
  The verified ordinary Certification result has no root selector; assert its
  existing `patternly:summary:review-answers:<sessionId>` selector and visible
  `Session complete` copy instead of adding a production selector. With these
  corrections the packet is executable using current selectors and development
  clients without a production-code or hidden-fixture change.
- **Repair 5I-R2 — visible exact Certification Practice resume from Home
  (`completed 2026-08-02`; repeated independent QA: `pass`):** the first real
  device pass proved that the generic
  `patternly:resume:*` selectors are emitted only from an Algorithms dashboard
  recommendation. `HomeScreen` does not load the active training session for
  Cloud Certification, `homeTabModel` returns no Cloud recommendation, and its
  recommendation handler explicitly verifies `trackId === algorithms`.
  Certification pause therefore preserves the canonical session but leaves no
  truthful visible `Continue session` path on Home. Do not weaken 5I to a
  misleading `Start session` re-entry or fabricate a resume-card capture.

  The smallest coherent repair is one Home-owned active-session projection for
  an ordinary Certification Practice session, using the existing canonical
  active-session read and `resumeActiveTrainingSession()` command. It must
  render the existing resume card/title/status/continue selectors, identify the
  exact mode and session, and navigate only after the command returns that same
  active Certification identity. Add one pure resume-route builder for the
  existing Practice route. Persist any selected setup identity that is required
  to reconstruct that route (the current Focus Practice configuration omits its
  selected Cloud domain) in the canonical immutable session configuration for
  newly prepared sessions; do not infer it from the current question, hard-code
  a domain, retain two resume paths or add a compatibility fallback for old
  incomplete development records. This project has no recruited or production
  learners; the approved development reset remains the explicit way to remove
  obsolete local records. Algorithms recommendations/resume, Certification
  Exam, Task 4 discovery redesign and Task 6 results remain unchanged.

  Acceptance requires pure-model tests for priority and copy, Focus/Scenario/
  fixed-scope route reconstruction tests, a real lifecycle pause → Home model →
  exact resume test, screen-source assertions that no repository/content lookup
  or inferred setup value exists in UI, and a dead-code scan for a second
  recommendation/resume branch. Focused/full/typecheck/content/privacy/
  contract/diff gates and independent QA must pass before device capture
  resumes. Stop if a canonical ordinary mode lacks enough immutable session
  configuration to build its exact route without a schema/contract decision;
  report that missing field rather than guess it.

  **Closure evidence:** Home now reads the canonical active session and emits
  one existing recommendation card only for the active ordinary Certification
  Practice identity. Its command verifies the resumed session ID, track and
  mode before navigating through one pure six-mode route builder with
  `expectedSessionId`. Focus Practice persists and validates its selected Cloud
  domain in the immutable configuration; old incomplete development records
  are explicitly unavailable and the application resume boundary returns
  `resume_unavailable` instead of inferring a domain. The real lifecycle test
  proves pause → Home model → exact action → application resume → route → exact
  open. Controller verification passed 47/47 final focused tests, 555/555 full
  tests, typecheck, content/privacy/contract/recovery/diff gates and a dead-path
  scan. The first independent QA `fail` identified only the missing joined
  lifecycle-to-Home proof; the test-only repair passed repeat independent QA
  `pass`. Algorithms, Certification Exam and the shared card/selectors remain
  unchanged, with no second resume implementation or compatibility fallback.
- **Evidence-run correction 5I-R3 — stale track bootstrap (`queued after
  5I-R2`; completed 2026-08-02; independent QA: `pass`):** the first iOS
  attempt reached the current Algorithms Home but the
  existing `rc-algorithms-bootstrap.yaml` tap on
  `patternly:home:change-track` did not navigate and its subsequent selected-
  track assertion timed out. Preserve this failed run in the evidence report.
  After R2 passes, repair only the capture/bootstrap interaction against the
  actual accessible Home tree, prove it once on both platforms, and then rerun
  every 5I flow into a fresh evidence directory. Do not use coordinates, deep
  links, hidden routes or weaken the selected-track assertion.

  **Confirmed facts and smallest repair packet:** the current iOS accessibility
  tree exposes one enabled `patternly:home:change-track` control with the
  expected visible bounds, and an isolated rerun of the existing bootstrap now
  passes through track selection. The production control and selector are
  therefore not missing. The remaining reproducibility risk is the bootstrap's
  conditional `runFlow`: it can skip the only tap when Home is not yet visible
  at that instant, then time out waiting for the selection route. Scope is only
  `.maestro/rc-algorithms-bootstrap.yaml` and its source test: replace the
  conditional tap with an explicit bounded wait for the accessible control,
  tap that exact ID, preserve the exact Algorithms selection and selected-track
  assertion, then prove the bootstrap from reset on iOS and Android. Non-goals
  are production UI/navigation changes, coordinates, deep links, retries that
  hide a failed route change, runner redesign and any Task 6 work. Acceptance
  requires the source test and diff check to pass, one fresh bootstrap run per
  phone platform to reach the exact Algorithms Home, preservation of the first
  failed iOS artifact, and independent QA `pass`. Stop if either platform still
  ignores the enabled control after the explicit wait; capture its hierarchy
  and create a production accessibility repair instead of adding blind taps.

  **First repair-run correction:** the explicit Home-only wait passed from an
  existing-track reset on iOS, but correctly failed after Android's fresh app
  data clear. The preserved Android screenshot and hierarchy show the legitimate
  first-install `Choose a track` surface with an enabled exact
  `patternly:home:select-track:algorithms` control; no Home change-track control
  should exist in that state. This disproves a production accessibility defect
  and invalidates the Home-only bootstrap assumption. The corrected smallest
  repair must handle exactly two canonical entry states: wait for the shared
  `main-tab-bar` shell, conditionally open track selection only when the exact
  Home change-track control exists, then require the exact Algorithms selector,
  choose it and assert the exact Algorithms Home card. The Home tap may use
  bounded `retryTapIfNoChange` because the downstream selection assertion makes
  route failure observable; no coordinate, deep link, repeated blind tap or
  third entry path is permitted. Re-run from existing-track iOS and fresh-data
  Android into a new evidence directory before QA.

  **Closure evidence:** the source test passes 2/2 and `git diff --check`
  passes. The final fresh evidence directory records two successful iOS Home
  paths and, after Android app-data clear, a successful first-install path
  followed by a successful Home path. Every run requires the exact Algorithms
  selector and ends on the exact Algorithms Home card. The failed Home-only
  Android repair artifact and the original failed iOS attempt remain preserved
  alongside their screenshots/hierarchies. Independent QA returned `pass` and
  confirmed exactly two entry states, no production change, coordinates, deep
  link, hidden route failure or third bootstrap path.
- **Evidence-flow repair 5I-R4 — paused Algorithms standalone return
  (`queued from first final iOS evidence run`):** the Algorithms ordering flow
  reached and captured the real pause decision, then correctly returned to the
  standalone `Choose a scope for Independent Practice` route. The flow's extra
  assertion for `main-tab-bar-practice` failed because that nested selection
  route intentionally has no bottom navigation; the preserved failure
  screenshot proves the route and its back control are healthy. Scope is only
  the capture flow and its source contract: remove the invalid bottom-tab
  assertion, keep the exact selection-route assertion and screenshot, then
  continue with the already-declared app relaunch and exact resume selectors.
  Production navigation, the pause destination, bottom-navigation ownership
  and other flows are non-goals. Acceptance requires YAML/source/diff checks,
  a fresh successful iOS rerun, later Android parity, preservation of the failed
  artifact and independent evidence QA. Stop if relaunch cannot expose the
  exact active-session card; do not add a navigation shortcut or hidden setup.
- **Evidence-flow repair 5I-R5 — Certification track control visibility
  (`queued from first final iOS Certification run`):** the track-selection
  route opened correctly and exposed the exact Cloud track control only partly
  below the phone viewport. `extendedWaitUntil` considered that selector
  present, but the subsequent tap did not change routes; the preserved failure
  screenshot remains on the healthy `Choose a track` surface. Scope is only
  both Certification capture flows: scroll the exact Cloud track selector into
  a materially visible centred position before one bounded tap, then keep the
  exact Cloud Home-card assertion. Production layout/navigation, selectors,
  runner/bootstrap and Algorithms flows are non-goals. Acceptance requires
  YAML/source/diff checks, fresh iOS runs for both Certification flows, later
  Android parity, preserved failure evidence and independent evidence QA. Do
  not use coordinates, text-only track selection or a second track path.
- **Evidence-flow repair 5I-R6 — Algorithms conflict must use a different
  canonical mode (`queued from R4 iOS rerun`):** the repaired flow proved
  ordering, pause, relaunch, exact resume and the second pause, but then asked
  to start another Independent Practice scope. The current canonical runtime
  intentionally resumes an active session when track and mode match, so the
  app returned to the exact active ordering session instead of showing a
  conflict. The capture expectation, not the product, was wrong. Scope is only
  the conflict tail of flow 20: from Practice Hub request the enabled exact
  Guided Practice mode while Independent Practice is active, assert the real
  conflict title and exact active/requested mode copy, capture it, open the
  destructive replacement confirmation and keep the active session. Retrying a
  different scope of the same mode, changing runtime semantics, abandoning the
  session or adding fixture state are non-goals. Acceptance requires YAML/
  source/diff checks, a fresh complete iOS flow, later Android parity,
  preserved failed artifact and independent evidence QA.
- **Evidence-flow repair 5I-R7 — Certification multiple-answer option must be
  materially visible before selection (`queued from flow 30 iOS rerun`):** the
  flow reached canonical question `ace-q-0009`, whose correct response is the
  multiple selection A+D. It scrolled only option A into view and issued the
  exact D tap immediately afterward; Maestro reported that tap as completed,
  but the resulting feedback screenshot showed D unselected and an incorrect
  result, so the later correct-state path could not continue. Scope is only the
  question-nine commands in Certification flow 30: after the exact A tap,
  scroll exact option D down into a centred position with at least 50% visible
  and a 30-second bound, then perform the existing exact D tap. Content,
  response semantics, production layout/selectors, coordinates, text-based
  option selection, fallback answers and all other questions/flows are
  non-goals. Acceptance requires YAML parse, a source assertion for the exact
  A → bounded-visible D → exact D sequence, diff check, a fresh complete iOS
  flow 30 rerun, later Android parity, preservation of the failed artifact and
  independent evidence QA. Stop if the centred exact D control still fails to
  materialize as selected; capture the hierarchy instead of adding another
  tap or changing the answer.

  **Source-repair evidence:** flow 30 now preserves the exact A tap, performs
  one bounded `scrollUntilVisible` for exact option D with `DOWN`, centred,
  50% visibility and 30-second timeout, then performs the one existing exact D
  tap. YAML parse, the exact sequence/duplicate-path source scan and
  `git diff --check` pass. The device rerun, Android parity and independent
  evidence QA remain required before R7 or slice 5I can close.
- **Evidence-infrastructure repair 5I-R8 — explicit capture environment and
  development-client relaunch (`queued from final Android evidence run`):**
  both RC Algorithms runners currently receive `SCREENSHOT_ROOT`, `THEME` and
  `PLATFORM` as shell environment but do not pass them to the final Maestro
  capture invocation. Maestro therefore writes otherwise valid screenshots
  under the output directory with `undefined` path/name segments. The same
  Android run proves that `killApp` followed by `launchApp` opens the Expo
  Development Build shell rather than reloading the local Patternly bundle, so
  the exact resume-card selector is legitimately absent. Flow 40 also returns
  Home after pause without exercising the required process relaunch.

  Scope is only both RC Algorithms runners, resume flows 20 and 40, their
  focused source tests and this plan. Each runner must require an explicit
  screenshot root, `light` or `dark` theme and its exact platform identity,
  resolve the screenshot root to an explicit path, and pass those three values
  plus the already-validated local dev-client URL to only the final Maestro
  capture command using the installed CLI's canonical `-e KEY=VALUE` form.
  After each resume flow's `killApp`/`launchApp`, open that explicit
  `${PATTERNLY_DEV_CLIENT_URL}` once as the local development-client bundle
  reload boundary before requiring the exact resume card. Flow 40 must first
  reach exact Certification Home, then perform that relaunch/reopen sequence.
  This boundary is not product navigation or a deep product route.

  Production code, selectors, content, fixture state, runner redesign,
  coordinates, conditional fallback branches and extra taps/retries are
  non-goals. Acceptance requires source tests to prove runner validation, one
  environment-bearing final capture invocation per runner, one explicit reopen
  per resume flow, flow 40's real kill/relaunch and preservation of every exact
  resume assertion. YAML parse, focused tests and `git diff --check` must pass
  before fresh two-platform device evidence. Stop if the installed Maestro CLI
  does not confirm `-e KEY=VALUE`, or if the explicit local bundle reopen still
  cannot expose the exact persisted resume identity; preserve the run instead
  of adding another path.

  **Source-repair and QA evidence:** both runners now validate their exact
  platform, bounded theme and explicit screenshot root, resolve the root, and
  pass the three capture values plus the already-validated local dev-client URL
  exactly once to only the final Maestro flow. Flows 20 and 40 each contain one
  explicit `killApp` -> `launchApp` -> local bundle reopen before their exact
  resume assertions; flow 40 first proves the Certification Home route. Focused
  source tests pass 3/3, both runner syntax checks and YAML parses pass, the
  installed Maestro CLI confirms repeated `-e KEY=VALUE`, `git diff --check`
  passes and independent QA returned `pass` with no production change,
  fallback, coordinate or additional resume path found.

  **Current external execution blocker (2026-08-02):** the first pre-R8 final
  runs are preserved: iOS completed flows 10, 20 and 30; Android completed flow
  10, then flow 20 reached pause and process relaunch but exposed the Expo
  Development Build shell instead of the resume card. Those runs also preserve
  the `undefined` capture-name defect fixed by R8 and are not the accepted final
  pack. A fresh post-R8 two-platform rerun was attempted, but the local
  simulator/emulator access approval service rejected both controllers after
  its usage allowance was exhausted and reported that access is unavailable
  until 2026-08-08 09:18. No post-R8 device flow ran and no Task 5 acceptance
  criterion is being waived. Until local device access is restored, finish the
  non-device report/manifest/gates, keep Task 5 open, and do not start Task 6,
  whose verified-terminal-evidence input is not yet complete.

  The non-device continuation completed the focused Task 5/R8 set `53/53`,
  typecheck, content-boundary, runtime-privacy, recovery, contract-change and
  diff gates. The full suite completed `533/556`; all 23 failures occurred
  before their HTTP assertions because the restricted sandbox denied temporary
  `127.0.0.1` listeners with `listen EPERM`. They are access-blocked, not waived
  or recorded as product passes, and a loopback-enabled `556/556` rerun remains
  part of the unblock work.

### Task 6 — outcomes, review and progress redesign

- **Goal:** make learning outcomes understandable and actionable.
- **Scope:** all summaries, results, reviews, mistakes, Progress and Study
  Activity/history surfaces.
- **Non-goals:** new scoring metrics or synthetic mastery claims.
- **Inputs:** Task 5 verified terminal/result evidence and Task 2 state
  patterns.
- **Acceptance criteria:** empty and populated variants are complete; saved
  state and next action are explicit; repeated empty-state copy is removed;
  long explanations reflow correctly; every durable terminal session can be
  found chronologically and reopens the exact result/review.
- **Verification:** deterministic fixtures for empty, partial, completed,
  incorrect and unavailable states.
- **Required evidence:** before/after screenshots and copy inventory.
- **Risk:** adding decorative cards without improving information hierarchy
  would not fix the product problem.
- **Report target:** `docs/reports/launch-006-outcomes-review-progress.md`.

### Task 7 — settings, privacy and support closure

- **Goal:** make product controls and public trust surfaces complete.
- **Scope:** account entry/group, appearance, language decision, notifications,
  local/remote data, legal, privacy, support and app identity.
- **Non-goals:** analytics, billing or a second account implementation.
- **Inputs:** Task 3 completed account behaviour, the Task 1 contract, actual
  binary behaviour and public policy/support destinations.
- **Acceptance criteria:** no non-functional preference remains; privacy and
  support are reachable in-app; permission and reset branches are truthful;
  headers match the canonical shell; public account, privacy and support
  disclosures form the foundation consumed by Task 8.
- **Verification:** settings matrix on both platforms and public URL checks.
- **Required evidence:** screenshots and store-declaration cross-check.
- **Risk:** publishing policy copy that does not match SDK behaviour.
- **Report target:** `docs/reports/launch-007-settings-trust.md`.

### Task 8 — content trust and issue-reporting path

- **Goal:** make content provenance, freshness and correction operable after
  launch without a manual item-by-item approval gate.
- **Scope:** content information surface, release/version and certification
  source basis, `Report a problem` from feedback/details and review, report
  categories, privacy guidance, stable item/release context, queued/sent/failed
  states and operator correction intake.
- **Non-goals:** crowdsourced answer changes, hidden content filtering,
  metadata labels for weak items or a duplicate question bank.
- **Inputs:** Task 7 public account/privacy/support foundation, pinned
  release/provenance, Task 1 account/network boundary and canonical
  correction/publishing flow.
- **Acceptance criteria:** before any report payload or network work, extend the
  canonical contract with a closed report schema, explicit field purposes,
  retention/deletion behavior, log exclusions and requirement-to-test mapping;
  Task 1 does not authorize item, release, category, free-text or identity
  report fields. The same gate updates Task 7 disclosures before any report
  network path. After that gate, users can identify the active content basis and
  submit a report without copying internal IDs; offline/failure behaviour is
  explicit; operators can trace the report to one immutable item/release and
  ship a canonical in-place correction reproducibly.
- **Verification:** source/provenance mapping tests, report service/use-case
  tests, privacy boundary, offline/retry flow and one synthetic end-to-end
  correction drill.
- **Required evidence:** screenshots of information/report states, sanitized
  intake record and correction/release drill report.
- **Risk:** collecting free text or identity without a data contract creates a
  new privacy surface; silently hiding reported questions would violate the
  canonical content architecture.
- **Report target:** `docs/reports/launch-008-content-trust-reporting.md`.

### Task 9 — platform, theme and responsive hardening

- **Goal:** close device-specific launch defects.
- **Scope:** iOS, Android, small phone, dark appearance, safe areas, keyboard,
  native prompts and phone-only responsive behavior. The supported device
  classes are phones only; tablets are explicitly unsupported by `PO-029`.
- **Non-goals:** feature expansion, tablet layouts or a tablet-specific product
  path.
- **Inputs:** frozen screens from Tasks 2–8.
- **Acceptance criteria:** no clipping, overlap or unreachable action in the
  supported phone matrix; tablet support is absent from configuration,
  metadata and launch claims rather than implied.
- **Verification:** repeatable screenshot pack and focused interaction flows.
- **Required evidence:** matrix with explicit pass/fail per supported class.
- **Risk:** broad device claims without physical/simulator evidence.
- **Report target:** `docs/reports/launch-009-platform-hardening.md`.

### Task 10 — content publishing reproducibility

- **Goal:** restore clean-checkout validation for future releases.
- **Scope:** technical-evidence identity and canonical publication path.
- **Non-goals:** manual question review or silent replacement of release `0015`.
- **Acceptance criteria:** both `validate:real:*` commands and cross-repository
  integration pass.
- **Verification:** content tests, release verification and app integration.
- **Required evidence:** commits, fingerprints and command output.
- **Risk:** regenerating against the wrong source commit.
- **Report target:** `docs/reports/launch-010-content-publishing.md`.

### Task 11 — store developer accounts and app registration

- **Goal:** establish the store-owned application records and access required
  for signing and submission.
- **Scope:** Apple Developer/App Store Connect and Google Play account status,
  agreements, roles, canonical bundle/package identifiers, app records,
  primary language, contact and access model.
- **Non-goals:** storing credentials in Git, producing signed artifacts or
  writing store marketing copy.
- **Inputs:** canonical app identity, owner-controlled store accounts and
  platform requirements.
- **Acceptance criteria:** both store app records exist under the intended
  owner; identifiers match source; required agreements/roles are current; no
  private account data enters reports.
- **Verification:** sanitized App Store Connect and Play Console record
  checklist.
- **Required evidence:** record IDs/identifiers, roles and agreement status
  with secrets and personal data removed.
- **Risk:** wrong ownership or identifier selection can make later signing and
  transfer expensive or impossible.
- **Owner gate:** under `PO-029`, inspection and preparation may continue, but
  no paid developer enrollment, agreement carrying a charge or other purchase
  may occur without a new explicit owner approval after return.
- **Report target:** `docs/reports/launch-011-store-registration.md`.

**Release-promotion gate 11A — professional market host, web identity and live associations**

- **Goal:** select one professional market host and promote the one locally
  validated static artifact to its owner-controlled identity only after store
  identities are exact and before Tasks 12–13 freeze signed artifacts.
- **Scope:** select exactly one market hosting provider and owned domain/DNS;
  publicly deploy the unchanged canonical Task 3 artifact through one deployment
  path; publish `/auth/action`, `/privacy`, `/account-deletion`, AASA
  and `assetlinks.json`; verify the transactional-email sender domain; freeze
  final bundle/package/team and available signing-certificate associations;
  and prove that the live association documents exactly encode those frozen
  identities before artifact signing starts.
- **Non-goals:** preselecting the market provider before current cost/operational
  evidence; a second host, deploy adapter or static artifact; publishing sandbox;
  using a default `web.app` address as market identity; redirect-based
  association proof or changing the public path contract during signing.
- **Inputs:** completed Task 3 local artifact/evidence, Task 11 store records,
  owner-approved domain/registrar/renewal cost, durable DNS access, sender-domain
  access and platform signing/team access.
- **Owner gate:** `PO-029` forbids domain, registrar, hosting, sender or other
  paid activation until the owner returns and explicitly approves the exact
  purchase and renewal commitment.
- **Acceptance criteria:** one owner-controlled HTTPS production hostname maps
  only to the selected professional host; the exact local-tested artifact is the
  deployed artifact through one canonical adapter; privacy/deletion/action
  paths and both association files return exact HTTPS responses without
  redirect; sender-domain verification is
  live; published association data exactly matches the frozen Android and iOS
  identities; no sandbox or default Firebase hostname is accepted as promotion
  evidence. Installed signed-device link drills remain inside Tasks 12–13.
- **Verification:** DNS/TLS and response-header/body checks, selected-host and
  Auth state, sender-domain evidence, Android Digital Asset Links API,
  Apple AASA retrieval and exact identity/content comparison.
- **Required evidence:** sanitized host/provider decision and ownership/DNS
  mapping, deployed artifact checksum, exact public URLs, TLS/response captures,
  sender-domain status, certificate/team identifiers and association-document
  comparison proof.
- **Risk:** freezing signing before the market hostname and association content
  are exact creates broken links or forces new signed artifacts.
- **Report target:** `docs/reports/launch-011a-market-web-promotion.md`.

### Task 12 — Android production signing and Play artifact

- **Goal:** replace debug release signing with a durable production path.
- **Scope:** upload key outside Git, Play App Signing, release configuration,
  signed AAB, certificate verification and Play-delivered install.
- **Non-goals:** iOS signing or store-copy changes.
- **Inputs:** Task 11 Play app record, completed gate 11A and frozen Android
  identity/association content.
- **Acceptance criteria:** release never uses debug signing; upload and
  app-signing keys have distinct documented ownership; signed AAB uploads and
  the Play-delivered artifact installs cleanly; the market-domain App Link
  opens that installed artifact and matches the gate 11A certificate identity.
- **Verification:** Gradle release build, signature/certificate inspection,
  Play artifact install and cold start.
- **Required evidence:** sanitized certificate fingerprints, build ID,
  checksum and install report.
- **Risk:** loss, exposure or mismatch of the signing identity can prevent
  trusted updates.
- **Report target:** `docs/reports/launch-012-android-signing.md`.

### Task 13 — iOS distribution signing and archive

- **Goal:** produce the canonical App Store distribution candidate.
- **Scope:** bundle identifier, certificates, profiles, entitlements, version,
  archive validation, App Store Connect upload and TestFlight install.
- **Non-goals:** Android signing or product redesign.
- **Inputs:** Task 11 App Store record, completed gate 11A and frozen iOS
  identity/association content.
- **Acceptance criteria:** one validated archive uploads successfully and
  installs cleanly from TestFlight; the market-domain Universal Link opens that
  installed build under the gate 11A team/bundle association; signing secrets
  remain outside Git.
- **Verification:** archive/export validation, App Store processing and clean
  TestFlight cold start.
- **Required evidence:** sanitized archive/build identifiers, checksum and
  install report.
- **Risk:** config drift between Expo, plist, Podfile and Xcode can invalidate
  an otherwise correct archive.
- **Report target:** `docs/reports/launch-013-ios-signing.md`.

### Task 14 — store packet and signed-artifact GO/NO-GO

- **Goal:** produce complete submission candidates.
- **Scope:** privacy/data and account-deletion declarations, metadata,
  screenshots and signed-artifact smoke using Tasks 12–13.
- **Non-goals:** product redesign after visual freeze.
- **Inputs:** completed Tasks 1–13 and gate 11A, owner-domain public
  privacy/support/deletion URLs and both store app records.
- **Acceptance criteria:** signed installable artifacts; complete validated
  store drafts; final two-platform smoke has no blocker; neither a default
  Firebase hostname nor local/emulator evidence substitutes for market-domain
  disclosures and signed associations.
- **Verification:** signature/archive inspection, clean installs and release
  checklist.
- **Required evidence:** sanitized build IDs, checksums, store checklist and
  final GO/NO-GO report.
- **Risk:** dev-client evidence cannot substitute for store artifacts.
- **Report target:** `docs/reports/launch-014-final-go-no-go.md`.

## First next task

Task 3 remains current. Completed prerequisites 3B-1 through 3B-5 and slices
3A-0 through 3A-2 are removed from active work; their decisions and evidence
remain recorded in their closed packets. The server authentication, deletion,
adoption/sync semantics and normalized Firestore account store are implemented
locally. The final runtime-mutation repair passed 46/46 focused tests, 473/473
full tests, both typechecks and repeated independent QA `pass`.

Eighteenth-A through Eighteenth-C, Nineteenth-A and Twentieth-A0 through
Twentieth-A1-HTTP are complete and removed from active work. The protected
ordinary-sync endpoint, real Node entrypoint, explicit post-environment
Firebase Admin initialization, bounded stable remote-snapshot page,
deterministic adoption identity, restartable canonical SHA state and the full
bounded durable adoption service/store/HTTP operation now pass 513/513 current
full tests, both typechecks, build/gates and repeated independent QA `pass`. A
naive whole-dataset adoption/restore endpoint remains deleted because canonical
history is intentionally unbounded.

The first reachable mobile account vertical was preflighted and is not yet
implemented. It is blocked by one owner/security contradiction: Firebase's
public client path cannot enforce or prove the contract's exact 30-minute
verification/recovery-link lifetime, and the canonical lifecycle lacks the
transition from a valid but unverified sign-in to the resend-eligible pending
state. Twenty-first-A records the two honest decisions; no worker may invent a
client expiry check, dual provider path or anonymous bypass. Task 4 consumes
that account entry and is skipped with it.

Under the owner's overnight instruction to bypass independent blockers, Task 5
is now the first current executable local task because its inputs are the
completed canonical learning lifecycle, family contracts and Task 2 patterns.
Slice 5A is complete: the competing Certification answer writer was deleted,
the real shared lifecycle is covered directly and independent QA returned
`pass`. Direct reassessment found that the normative Practice terminal contract
is internally contradictory; Task 5B records the owner's A/B decision and is
bypassed rather than guessed. Slice 5C is also complete: one lifecycle-owned,
relaunch-safe identity authority replaced both family counters and passed
519/519 full tests plus independent QA `pass`. Direct dependency review found
the next independent defect: every ordinary Certification mode declares
`elapsedForeground`, but the only installed application timer still rejects
Certification and its reachable screen therefore renders a stale `00:00`.
Slice 5D is complete: the one family-neutral timer now serves ordinary
Algorithms and Certification, terminal callback races were removed, 525/525
full tests pass and repeated independent QA returned `pass`. Slice 5E is also
complete: Certification presentation now renders only the canonical
materialized attempt feedback, the competing screen scorer was deleted,
527/527 full tests pass and independent QA returned `pass`. Direct dependency
review found the next independent defect in the same reachable Certification
runner: it catches every projection failure as absence and then starts, hiding
real failures and incompatible active sessions. Slice 5F is complete: one
explicit open/resume/conflict owner and expected-session-ID handoff replaced
that fallback, exact Exam expiry reaches its verified result, 532/532 full tests
pass and repeated independent QA returned `pass`. Direct dependency review
found the next independent defect: Certification still omits the shared durable
operation projection, treats submit/advance failures as a page-level outage and
cannot recover an exact pending journal. Slice 5G is complete: the exact durable
operation and response provenance now reach presentation, cross-occurrence local
selection leakage found by QA was repaired, 540/540 full tests pass and repeat
independent QA returned `pass`. Direct reassessment found the next independent
defect: the reachable Certification runner still duplicated the canonical
mobile Practice surface, destructively abandoned under the ordinary `Leave`
label and let system back bypass a pause/end decision. Slice 5H is complete:
the runner now uses the shared surface and truthful pause/confirmed-end flow,
exact abandonment recovery preserves materialized feedback, 546/546 full tests
pass and repeat independent QA returned `pass`. `PO-035` resolves the
previously parked Task 5B contradiction in favour of a separate canonical
Finish command. Slice 5B-1 is complete: 551/551 full tests and repeated
independent QA pass. The first real device evidence pass then exposed the
missing visible ordinary Certification resume path. Repair 5I-R2 is complete:
one exact Home resume projection and immutable six-mode route replaced that
gap, the joined pause → Home → exact resume proof passes, 555/555 full tests
pass and repeat independent QA returned `pass`. Direct dependency reassessment
then exposed two legitimate evidence-run entry states. Repair 5I-R3 is complete:
the deterministic bootstrap passed existing-track iOS plus first-install and
existing-track Android, its failed diagnostic runs remain preserved and
independent QA returned `pass`. The remaining two-platform behavioural and
screenshot evidence packet 5I is now the first current executable slice. No
further runtime redesign is implied. This does not close Task 3 or change the
order of any dependent task.

After every local slice closure, re-evaluate only direct dependencies and start
the next coherent slice without another broad product audit. Task 3 and Task 4
resume first after their owner decision; Task 7 still consumes completed
account behaviour, Task 9 is phone-only, and Tasks 11–14/gate 11A retain their
owner/access/purchase inputs.

Under `PO-033`, external work that can be skipped overnight remains parked:
Resend account and Secret Manager material, the `PO-034` durable deletion and
combined Scheduler decision, acceptance or upstream resolution of the six
moderate dependency findings, Firebase emulator/cloud integration evidence and
the single manual Cloud Build/deployment. No public host, paid activation,
production billing, domain purchase, secret creation or other cloud mutation is
required by the next local mobile vertical. No placeholder provider, fallback route, public
deployment, direct client Firestore path or second account-data authority may
substitute for local progress.

## Evidence limitations

- The user-provided temporary screenshot was no longer readable; a fresh
  simulator screenshot of the same Exam Review state was captured.
- Task 2 now proves six representative checkpoints across iOS/Android,
  light/dark and narrow/larger-text profiles. First-install beyond its track
  bootstrap, populated history and most route-specific operational failure
  states still require bounded captures inside the task that implements them.
- Store developer-account, app-record, signing and artifact state was not
  inspected and remains explicitly listed as evidence work.
- Account purpose, identity, remote-data model and local-data adoption rules
  are defined by completed Task 1. `PO-020` resolves Firebase Authentication,
  Firestore Standard, Cloud Run and `europe-central2`; `PO-025` selects only the
  local Firebase Hosting Emulator path before promotion. Professional market
  host/domain selection, deployment, sender-domain and association content
  proof remain gate 11A inputs, not Task 3 inputs.
- Task 2 implementation and evidence are complete; later-task claims remain
  limited to their own future code and runtime proof.
