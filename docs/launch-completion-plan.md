# Patternly — launch completion plan

**Authority:** `docs/canonical-product-contract.yaml` defines product behavior;
this document is the sole active execution order and repository-status source.
`product-owner-decision-register.md` contains only missing owner inputs and
external gates.

**Reconciled:** 2026-08-25. This plan is a handoff for an implementation agent.
It already contains the relevant current-source, test and iPhone 17 evidence;
the agent must perform bounded verification for its assigned task, not repeat a
whole-product discovery audit.

## Confirmed working context

- App: React Native/Expo in this repository. Guest/local-first learning works
  on the booted iPhone 17, iOS 26.4 simulator. `npm run typecheck` and the
  full application suite (600 tests) passed on 2026-08-25.
- Backend: `../patternly-backend` is Fastify + Firebase Admin SDK/Firestore.
  The API serves identity mapping, entitlement/progress projections and
  versioned sync through the backend only. On 2026-08-25 Task 1 replaced the
  PostgreSQL/Drizzle persistence path, added transactional CAS/idempotency,
  App Check and the account-unlinked report boundary. Task 2 adds the
  report outbox, server-owned triage state machine, and authenticated queue
  read; 11 Firebase Emulator Suite tests pass. Production TTL/PITR and
  deployment evidence remain external gates.
- Website: a new local Git repository `../patternly-web` has a static Polish
  product surface and an administrator entry. It is not deployed and contains
  no client-side privilege grant or simulated user data.
- Owner inputs already fixed: one administrator is
  `lukasz.kurczab@gmail.com`; login methods are email/password, Apple, Google
  and recovery codes; seller is Łukasz Kurczab; Poland price basis is 49 zł / 30
  days, 119 zł / 90 days, 199 zł / renewing year; Poland is the sole initial
  territory; support/privacy contact is `lukasz.kurczab@gmail.com`; ordinary
  report and deletion-proof retention is 30 days unless law requires longer;
  App Check plus backend rate limiting protects anonymous reports; work remains
  local.
- Proposed production origin architecture is `learnpatternly.com` with API at
  `api.learnpatternly.com` and auth redirects at `auth.learnpatternly.com`.
  It is not registered or legally cleared. Market search found several existing
  unrelated Patternly products, so registration requires availability and
  trademark review before public use.
- iOS visual evidence: the fresh dark iPhone 17 track-selection screenshot is
  at `artifacts/maestro-screen-capture/current-head/2026-08-25-iphone17/maestro-output-final/screenshots/artifacts/maestro-screen-capture/current-head/2026-08-25-iphone17/screenshots-final/visual-shell__core__005__track-selection-ready__dark__ios-26.4-iphone-17.png`.
  It confirms a working app and shows a long, dense first track-selection
  viewport. The shared Maestro journey then fails because it expects a Continue
  footer after reselecting the already active Coding track; that footer is
  correctly hidden by current UI logic. The reset wait was corrected from 30 to
  60 seconds after evidence showed the marker appears just after the old limit.

## Non-negotiable corrections before continuation

1. **Report privacy boundary.** Task 1 now enforces account-unlinked reports
   by default, explicit account/contact attachment, bounded context and
   redaction of learner response data. Task 2 still owns the learner report
   flow and administrator triage surface.
2. **Firestore rewrite.** Task 1 now makes Firestore the sole backend store and
   removes PostgreSQL/Drizzle code, migrations, dependencies and obsolete
   tests. No adapter, dual-write, compatibility route or second data authority
   remains.
3. **No production account or billing composition.** The app has no Firebase
   sign-in UI/provider composition, adoption/sync bridge, deletion service,
   RevenueCat purchase/restore integration or production public environment.
   Existing local-unavailable text is truthful for the current binary but is not
   launch completion.
4. **No legally complete public sale surface.** The seller's name is known, but
   no publishable address, support contact, legal/tax status, public domain,
   approved consumer documents or payment setup is available. Do not publish
   purchase actions or claim legal readiness.

## Stage assessment

Scores measure launch readiness of the stage, not code volume. A score below
`0.80` **requires stage repair/change** before that stage may be called complete.

| Stage | Status | Score | Evidence-based assessment and required change |
| --- | --- | ---: | --- |
| 0. Strategic reconciliation | `done` | 0.90 | Eight-track scope, guest-first model, identity/Premium contracts and Firestore as the sole account/report store are now explicit. Task 1 implements this decision without reopening scope. |
| 1. Evidence and artifact cleanup | `partial` | 0.76 | Historical material is labelled and the active decision register is reduced. Task 1 deletes the obsolete PostgreSQL/Drizzle implementation and records the Firestore/report-boundary evidence; production TTL/PITR and deployment evidence remain external gates. |
| 2. Figma/UI reconciliation | `partial` | 0.71 | Core UI work and prior tests exist, but fresh iPhone 17 evidence covers only track selection. The capture flow contains a deterministic false expectation, and the first selection viewport is overly long/dense. Repair capture and make only evidence-backed UI changes in Task 7. |
| 3. Content Review Console V1 | `done` | 0.87 | Local source-authoritative console and full content evidence are recorded. Keep it isolated from learner reports and do not create a second content authority. |
| 4. Eight-track content audit | `done` | 0.86 | Accepted immutable eight-track release and validators exist. Semantic defects remain corrected only when demonstrated; learner report delivery belongs to Task 2, not a renewed mass content audit. |
| 5. Account, identity, sync, adoption, deletion | `partial` | 0.24 | Contract/backend foundations exist, but no composed app identity, adoption, remote sync, recovery, sign-out or verified deletion path exists. Tasks 3–5 replace this stage with independently testable vertical slices. |
| 6. Commercial entitlement | `partial` | 0.31 | Pure entitlement model and Poland price basis exist. No store catalog, purchase, restore, backend reconciliation, package authorization or consumer checkout evidence exists. Task 6 is required. |
| 7. Provider, privacy, security, operations | `blocking` | 0.22 | No public origins, Firebase/App Check/IAM, deploy, retention/restore implementation, legal data or approved disclosures. Task 1 resolves architecture; Task 8 collects real external evidence. |
| 8. QA, signing, stores, GO/NO-GO | `partial` | 0.43 | Local tests and simulator evidence exist; no signed iOS/Android artifacts, store records, complete screenshots, legal/public links or final smoke exist. Tasks 7–9 are required. |

## Work already removed from the active queue

- Strategic scope reconciliation, mandatory content-baseline cleanup, Content
  Review Console V1 and the eight-track structural audit are complete; do not
  schedule a repeat audit.
- The local static public surface, backend report foundation, learner report
  flow, and administrator queue read exist; do not recreate them. Repair
  their stated gaps in place.
- Task 1 and Task 2 are complete implementation slices. Task 3 is the next
  active task; visual/browser evidence that could not run locally is recorded
  in the Task 2 report rather than being treated as a false pass.
- Historical route, competition and earlier readiness audits remain evidence
  only. They must not be used to resurrect old sequencing or a second launch
  contract.

## Execution queue

### Task 1 — replace PostgreSQL backend logic with Firestore and repair report privacy (completed 2026-08-25)

- **Goal:** make Firestore the one real backend authority and correct the
  account-linked report implementation before any feature is layered on top.
- **Scope:** rewrite `patternly-backend` user, progress, entitlement, content
  version and report persistence using Firebase Admin Firestore; replace
  PostgreSQL/Drizzle bootstrap, schema, stores, migrations, dependencies,
  deployment configuration and tests; update only the app transport contracts
  required by the new canonical API.
- **Non-goals:** account UI, generic analytics, content editing, report console
  expansion, billing or deployment.
- **Inputs:** owner Firestore decision; contract requirements
  `ANALYTICS-REPORTS-001` and `BACKUP-RESTORE-001`; current Fastify API
  contracts; Firebase project/App Check configuration through the secure
  deployment channel.
- **Acceptance criteria:** Firestore is the only account/progress/entitlement/
  content-version/report authority; all PostgreSQL/Drizzle code, migrations,
  dependencies, configuration and obsolete tests are deleted; backend keeps
  explicit idempotency and compare-and-swap semantics through Firestore
  transactions; no mobile client gets direct Firestore access; report submission
  is account-unlinked by default with optional explicit identity/contact link;
  automatic data excludes response, prompt, feedback, email and account ID;
  App Check plus backend rate limiting protects submission; TTL/retention,
  de-identification, audit states and seven-day PITR runbook are real; client
  states are queued/retrying/failed/accepted without false success.
- **Verification:** contract parser and negative tests; Firebase Emulator Suite
  integration tests for identity, CAS conflict, idempotency, deletion and report
  redaction; client typecheck; reference search proving no PostgreSQL/Drizzle or
  direct client Firestore path remains; PITR/TTL configuration check in sandbox.
- **Required evidence:** Firestore collection/field contract, emulator test
  output, App Check/rate-limit design, TTL/PITR configuration checklist and a
  short architecture report under `docs/reports/`.
- **Risks:** Firestore transaction callbacks can rerun and must have no side
  effects; account deletion has no SQL cascade and must delete every owned
  document explicitly. Do not preserve PostgreSQL as a rollback path.
- **Report target:** `docs/reports/launch-101-firestore-and-report-boundary.md`.

### Task 2 — deliver learner report flow and administrator triage (completed implementation 2026-08-25)

- **Goal:** make per-item trust reporting usable and privacy-correct from
  feedback/details and Answer Review through resolution workflow.
- **Scope:** app report entry/form/local outbox/status/retry; backend corrected
  report API and status transitions; `patternly-web/admin` real authentication
  entry and read-only open/in-review queue after production config exists.
- **Non-goals:** content auto-editing, free-form administrator commands,
  content-source mutation from the web panel or hidden status changes.
- **Inputs:** completed Task 1 API, stable package/item identity, owner admin
  identity and web repo.
- **Acceptance criteria:** report originates from both required learning
  surfaces; stable item/release context is attached without learner content;
  retry is idempotent; each user-visible terminal state is truthful; admin
  access is verified by backend, not page code; the sole configured admin can
  view the queue and the backend exposes only monotonic, audited transitions;
  the static web surface remains read-only.
- **Verification:** UI tests for form and offline branches; API authorization
  and transition tests; iOS Maestro screenshots; web browser smoke using a
  non-admin denial and admin acceptance. Local automated verification is
  recorded in `docs/reports/launch-102-content-reports-and-admin.md`; the
  browser smoke remains unavailable when the in-app browser connection cannot
  be established.
- **Required evidence:** screenshots, sanitized audit trail, and source
  correction/release linkage for one controlled report.
- **Risks:** do not ship the current account-linked implementation as a privacy
  workaround; do not put Firebase credentials in static source.
- **Report target:** `docs/reports/launch-102-content-reports-and-admin.md`.

### Task 3 — compose identity and account entry vertical slice

- **Goal:** give a guest a real, secure path to register/sign in with the
  agreed methods without changing local learning before consent.
- **Scope:** Firebase client composition, public environment validation,
  account entry/register/sign-in/verification/recovery surfaces and backend
  identity mapping.
- **Non-goals:** adoption merge execution, remote progress sync, purchase,
  deletion or fabricated provider success in unconfigured builds.
- **Inputs:** existing identity contract, Firebase project/App Check origins,
  Terms version and public links from owner/external gates.
- **Acceptance criteria:** email/password, Apple and Google paths are real;
  recovery uses the agreed contract; invalid/duplicate/rate-limited/offline/
  revoked cases are explicit and non-enumerating; credentials and tokens stay
  out of logs/storage; guest learning stays available before account binding.
- **Verification:** provider sandbox tests, unit negative cases, app typecheck,
  iOS flows for each user-visible state and backend token-verification tests.
- **Required evidence:** sanitized provider configuration checklist and
  screenshots of success/failure states.
- **Risks:** no production URLs or account claims may be invented locally.
- **Report target:** `docs/reports/launch-103-identity-entry.md`.

### Task 4 — account adoption and incremental sync

- **Goal:** move an authenticated learner from one local dataset to one
  revisioned remote account dataset without silent loss or duplicated state.
- **Scope:** local installation binding, preview/confirmation, compact outbox,
  progress projection, conflict UI and sign-out precondition.
- **Non-goals:** cross-device active-session resume, last-write-wins merge,
  a second persistence model or background sync promise.
- **Inputs:** completed Task 3 identity and Task 1 Firestore rewrite;
  existing backend CAS sync endpoints and merge contract.
- **Acceptance criteria:** empty/local/remote/both/divergent and active-session
  cases have deterministic previewed outcomes; confirmed mutations are
  idempotent and CAS-protected; conflict preserves last verified states;
  offline/pending/retry status is visible; device-only records never sync.
- **Verification:** backend conflict/idempotency tests, local journal recovery
  tests, two-simulator bounded scenario, iOS screenshots and import/reference
  checks for duplicate storage paths.
- **Required evidence:** preview transcript fixtures and before/after remote
  projections without personal data.
- **Risks:** forcing a merge or discarding guest data is launch-blocking.
- **Report target:** `docs/reports/launch-104-adoption-sync.md`.

### Task 5 — recovery, sign-out and verified account deletion

- **Goal:** complete secure account lifecycle and public deletion path after
  identity and sync exist.
- **Scope:** recent reauthentication, recovery-code lifecycle, session
  revocation, sign-out, in-app deletion, public possession-verified deletion,
  server tombstone/proof, local cleanup and restore reconciliation.
- **Non-goals:** pretending store subscription cancellation or provider-data
  deletion is performed by Patternly.
- **Inputs:** completed Tasks 1, 3 and 4; public domain/email sender; actual
  retention and database recovery policy.
- **Acceptance criteria:** all destructive actions explain scope and failure;
  reauth is enforced; deletion is verifiably remote and local; stale sessions
  and restore cannot resurrect account data; public flow is non-enumerating;
  subscription management remains separate.
- **Verification:** integration tests, provider sandbox deletion/revocation,
  restore/tombstone drill, iOS destructive-state screenshots and public-web
  test with sanitized mail evidence.
- **Required evidence:** retention/deletion runbook and deletion proof format.
- **Risks:** irreversible provider calls require real configuration and must not
  be tested against a production account.
- **Report target:** `docs/reports/launch-105-deletion-recovery.md`.

### Task 6 — commercial entitlement, purchase and restore

- **Goal:** connect the fixed Premium offers to one account-bound entitlement
  through store → RevenueCat → backend → bounded device cache.
- **Scope:** Polish store catalog/products, purchase/restore/manage
  subscription UI, RevenueCat webhook/reconciliation, backend authorization and
  Premium package access.
- **Non-goals:** custom web checkout, tiers, track slots, client-side purchase
  authority or a non-production offer that looks purchasable.
- **Inputs:** Tasks 1 and 3, App Store/Play/RevenueCat records, product IDs and
  consumer documentation from owner gates.
- **Acceptance criteria:** 49/119/199 PLN offer semantics map exactly once;
  guest purchase is impossible; purchase/restore/cancel/refund/expiry/grace are
  explicit; backend is authorization authority; deletion does not promise a
  refund or cancellation; no Premium package downloads without entitlement.
- **Verification:** sandbox purchases and restore on both platforms, webhook
  replay/idempotency tests, cross-device entitlement test, offline-grace test
  and pricing/store metadata review.
- **Required evidence:** sanitized catalog mapping, receipt/webhook traces and
  platform screenshots.
- **Risks:** price/tax/promotion behavior in stores can differ by territory;
  do not infer it from the static website.
- **Report target:** `docs/reports/launch-106-premium-commerce.md`.

### Task 7 — repair visual evidence and close concrete iOS UX gaps

- **Goal:** make iPhone 17 visual verification reproducible and address only
  evidenced UI defects.
- **Scope:** Maestro visual-shell journey, screenshot manifest and focused
  selection-screen density/first-viewport correction if confirmed by review.
- **Non-goals:** a second broad UX audit, new product metrics, visual invention
  outside final design authority or a navigation rewrite.
- **Inputs:** current iPhone 17 screenshot, fixed reset wait, current
  SelectTrack behavior and final design authority.
- **Acceptance criteria:** capture flow does not expect an action hidden by its
  own selected/active state; it produces the declared dark and light checkpoints
  on iPhone 17; any density fix preserves selection semantics, 200% type and
  accessibility labels.
- **Verification:** repeatable Maestro runs without concurrent driver conflict,
  screenshot manifest, visual comparison and focused UI tests.
- **Required evidence:** before/after screenshot pair and failed-command root
  cause if a checkpoint remains unavailable.
- **Risks:** changing the UI merely to satisfy an automation selector is
  prohibited.
- **Report target:** `docs/reports/launch-107-ios-visual-evidence.md`.

### Task 8 — public web, legal and operational readiness

- **Goal:** turn the local web surface into truthful public legal/support/auth/
  deletion origins only after factual seller and provider data exists.
- **Scope:** `patternly-web`, public environment configuration, legal/privacy/
  Terms/support/deletion pages, Firebase web login/admin shell, domain/DNS/
  sender and backend deployment/runbooks.
- **Non-goals:** publishing now, inventing a business address, legal advice
  without factual data, exposing the administrator email in public UI or client
  privilege checks.
- **Inputs:** remaining owner questionnaire, Tasks 1–5, production origins,
  legal review and deployment credentials.
- **Acceptance criteria:** every public URL resolves over the professional
  domain; documents describe the actual binary and processors; consumer terms
  present required seller/contact/price/contract/digital-content information;
  public deletion flow is reachable; admin rejects non-admin server-side;
  deployment/backup/incident runbooks use Firestore and its configured PITR.
- **Verification:** browser/accessibility checks, link crawl, Firebase auth
  redirect test, server authorization test, legal-owner review, deployment
  readiness and recovery drill.
- **Required evidence:** published URL list, sanitized configuration checklist,
  legal approval record and runbook drill results.
- **Risks:** no personal address, terms or privacy policy may be fabricated.
- **Report target:** `docs/reports/launch-108-public-operations.md`.

### Task 9 — signed artifacts, store packet and final release gate

- **Goal:** produce and assess real iOS/Android store candidates.
- **Scope:** signing, EAS/Android release artifacts, store metadata/screenshots,
  signed-artifact smoke and explicit owner GO/NO-GO.
- **Non-goals:** new product capabilities or substituting simulator evidence for
  signed candidates.
- **Inputs:** all preceding tasks and external store/provider/legal gates.
- **Acceptance criteria:** no debug-signing path; artifacts install and identify
  correctly; store privacy/support/legal URLs work; core guest/account/Premium/
  deletion/report journeys are truthful; metadata and screenshots match the
  candidate; every launch stage scores at least 0.80.
- **Verification:** signing inspection, TestFlight/Play internal testing,
  release smoke, final readiness command and clean-tree checks.
- **Required evidence:** build IDs/checksums, store validation records,
  screenshot set and owner GO/NO-GO.
- **Risks:** development-client and local backend evidence cannot replace store
  artifact evidence.
- **Report target:** `docs/reports/launch-109-final-release-gate.md`.

## First next task

Execute **Task 1 — replace PostgreSQL backend logic with Firestore and repair
report privacy**.
It is first because current partially implemented report code conflicts with the
active privacy contract and the backend still contradicts the now-confirmed
Firestore architecture. Account, deletion, retention and operations work would
be unsafe to build before the replacement is complete.

## Owner questionnaire — information still needed

Answer only the unknown fields; no new product audit is required.

1. **Public seller address:** What publishable address can appear alongside
   Łukasz Kurczab and `lukasz.kurczab@gmail.com`? Confirm the legal/tax review
   before first paid sale without a registered business.
2. **Domain clearance:** May the owner register `learnpatternly.com` after an
   availability and trademark check, or should a different brand/domain be
   selected because of the existing unrelated Patternly products?
3. **Firebase/admin:** Confirm whether backend production configuration may set
   `ADMINISTRATOR_EMAIL=lukasz.kurczab@gmail.com`; provide Firebase project and
   the responsible account only through the secure deployment channel, never in
   chat or Git.
4. **Store accounts:** Are Apple Developer, App Store Connect, Google Play,
   RevenueCat and EAS already available? For each available service, identify
   only the owner/operator and current state; never send secrets or tokens.

## Verification performed for this reconciliation

- Read active contract, owner register, current launch plan, security narrative,
  frontend/backend audit and historical evidence index.
- Inspected current backend schemas/routes/stores/tests and current mobile
  client/environment/report registry.
- Ran backend `npm run typecheck`, `npm test`, `npm run openapi:generate` and
  `npm run frontend:client:check`: passed (11 backend tests).
- Ran app `npm run typecheck`: passed.
- Ran the current iPhone 17 Maestro visual shell. Reset marker works with a
  60-second limit; capture then fails at the stale Continue expectation
  described above. No user-facing implementation change was made to hide it.

## Remaining risks and unverified areas

- No real Firebase, Firestore, App Check, Apple/Google auth,
  RevenueCat, store catalog, signed artifact, public domain, legal review or
  consumer documents are evidenced.
- No final visual audit exists beyond the captured track-selection checkpoint;
  Task 7 must produce the rest rather than re-auditing unrelated routes.
- The local website and backend changes are uncommitted at this handoff. The
  next agent must preserve them, inspect the diff and report them accurately.
