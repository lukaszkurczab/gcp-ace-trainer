# Patternly — launch completion plan

**Authority:** `docs/canonical-product-contract.yaml`,
`docs/product-owner-decision-register.md`, and the owner directive/manual actions
dated 2026-08-24. This file owns execution order and repository status only.

**As of:** 2026-08-25

**Current pushed canonical heads:** app `origin/main`; content `origin/master`.
Both refs are independently fetched and verified at each handoff.

At the 2026-08-25 controller checkpoint, both canonical worktrees were clean
after independent fetch-and-match verification. Exact commit IDs remain in Git
history and the readiness output; this plan avoids a self-referential SHA.

Exact commit IDs belong to the fetched canonical refs and are recorded in the
controller handoff evidence; this plan intentionally avoids a self-referential
app SHA because each plan update creates a new documentation commit.

## Locked launch decisions

- Launch contains exactly these eight learner-visible tracks:
  `coding-interview-dsa-problem-solving`, `backend-system-design-interview`,
  `frontend-system-design-interview`, `object-oriented-design-interview`,
  `aws-certified-solutions-architect-associate`,
  `google-cloud-associate-cloud-engineer`,
  `microsoft-azure-administrator-associate-az-104`, and
  `microsoft-azure-ai-fundamentals-ai-901`.
- The current eight-track banks are the accepted final launch baseline. No mass
  reduction, mass expansion, or exhaustive re-review is authorized.
- There is no global `>120 questions/node` readiness rule. Content changes are
  targeted and evidence-driven; counts are operational evidence only.
- A family/mode capability envelope is narrowed by the versioned track, package,
  and Free profile. The UI renders the resolved profile and explicitly reports
  requested versus actual length when shortening is allowed.
- Patternly is decision practice and remediation, not a question bank. Its loop is
  recognition → decision/mechanism → explained correctness and alternatives →
  varied practice → repeated-mistake remediation → revisit → transfer.
- Premium is one SKU-neutral account entitlement for fixed 30-day, fixed 90-day,
  and discounted recurring access. Exact products, prices, and promotions remain
  provider/owner gates.
- The local/internal Content Review Console is a review aid over source files;
  source remains authoritative, automated signals are advisory, and human outcomes
  are explicit. No cloud, remote database, production auth, secrets, auto-rewrite,
  self-approval, or second content authority.
- There is no AI mock interviewer and no assumed paid tester, coach, reviewer,
  agency, or permanent paid Figma dependency.

## Current status

| Stage | Status | Exit evidence |
| --- | --- | --- |
| 0. Strategic reconciliation | complete | Contract, tests, current-only decision register and affected docs are reconciled and pushed to canonical heads. |
| 1. Evidence and artifact cleanup | complete | The current-only decision-register rule, affected content count-gate narrative cleanup, and removal of the unreferenced resolved RC-003 decision packet are complete. Retained directives/reports are explicitly non-authoritative or unique provenance/release/legal/security evidence. |
| 2. Figma/UI reconciliation | in_progress | Owner has declared `Page 1` and `Patternly Library` final visual authority in channel `hgz70ud2`; implementation targets 99% fidelity. The first Progress evidence-state slice is implemented and tested; missing screens/states remain explainable work, not blockers. |
| 3. Content Review Console V1 | complete | Local CLI/localhost console renders real source items, navigates track/node/mental-unit coverage, exposes advisory risks and fingerprints, records bounded explicit outcomes, and is pushed on content `master` at `73e7867`; content suite is 146/146. |
| 4. Eight-track content audit | complete | Readiness report `32e2003df80b8b62bce17c76c29465a452910ca8027ec707faaa6a8bdcf93a5a` verifies all eight structural validators pass; the current content head is `0463a2b` after a test-only stale-evidence assertion repair. No bank expansion or count gate was introduced. Runtime and publishing admission remain not granted. |
| 5. Account, identity, sync, adoption, deletion | partial | Guest/local-first behavior and explicit unavailable account states exist; adoption, sync, deletion, recovery and cross-device provider evidence remain unimplemented or unevidenced. |
| 6. Commercial entitlement | planned | No provider-neutral entitlement runtime is currently composed. The fixed/recurring chain remains an implementation task after the provider/backend input contract exists; no store/provider evidence is claimed. |
| 7. Provider, privacy, security, operations | planned | Production configuration, privacy/legal, retention, domain, sender, IAM, billing and recovery evidence remains absent and requires the corresponding external gates. |
| 8. QA, signing, stores, GO/NO-GO | partial | Owner commits `03a032c`, `15b00af`, and `ea4ad79` are on canonical `main`; the Android NDK/signing-boundary slice is now pushed and the app worktree is clean. Actual EAS-managed signing/build, store evidence, and owner GO/NO-GO remain unavailable gates. |

## Execution stages

### 0. Strategic reconciliation — current slice

Update the canonical contract and its coverage tests; update the owner register;
reconcile only affected narrative documents; replace stale launch-plan history;
and supersede contradictory active assumptions. Verify contract parsing, focused
tests, documentation references, and both clean/pushed heads.

Controller QA of the owner-owned EAS/signing hardening is complete locally with
gaps: focused invariants pass, but no delegated QA report or EAS artifact exists.
No further account/entitlement implementation is safe at the current boundary
without inventing the missing provider/backend input contract. Cleanup remains a
mandatory gate before each later release slice.

The current controller checkpoint joined Figma channel `hgz70ud2` and verified
the existing `QA / G01-G13 acceptance / canonical instances`,
`QA / G07 canonical screen owners`, and bottom-navigation QA sections. The owner
has now explicitly approved `Page 1` and `Patternly Library` as final visual
authority and set a 99% fidelity target. Missing screens/states remain
explainable implementation work, not launch blockers; only buildable,
contract-compatible states are added. The first application-code parity slice
now covers the Algorithms Progress `no_evidence`, `building`, and `established`
evidence states, the effectiveness trend, track evidence, and recent activity
hierarchy using current-package local attempts only. Focused tests, full app
verification, and typecheck are `npm test` 581/581 and `npm run typecheck` pass;
no device screenshot or EAS artifact is claimed. `npm run launch:readiness`
remains `not_ready` with a clean application repository. Content verification
is `npm test` 146/146
(the local Console test required host loopback permission). No source banks,
runtime contracts, or external evidence were changed in this checkpoint.

### 1. Evidence and artifact cleanup — mandatory

Audit both repositories and remove only artifacts that satisfy all of these:

1. no runtime, build, test, or active-document dependency;
2. no inbound active reference;
3. no unique immutable release, provenance, legal, security, or owner-decision
   evidence;
4. no current owner decision depends on it; and
5. Git history is sufficient for provenance.

Remove obsolete evidence, directives, finished-task notes, duplicate reports and
dead artifacts. The `product-owner-decision-register.md` is cleaned under a
stronger rule: it is not a history log. Delete every resolved, implemented,
superseded, historical, duplicate, or option-matrix entry. When an owner decision
is made, remove its question, uncertainty, and rejected alternatives. When the
decision is implemented, remove it from the register entirely and rely on the real
contract, architecture, manifest, or evidence. Keep only unresolved owner choices
and genuine external gates. Preserve unique provenance/release/legal/security
evidence in its proper evidence location, not by keeping it as a decision entry.
Preserve the canonical contract, current plan, design authority, active
assets/licenses, and unique immutable evidence. Run reference searches and focused
repository tests before and after deletion.

The current cleanup audit removed the unreferenced resolved decision packet
`docs/po-questions/rc-003-certification-exam-interaction-policy.md`. The decision
is implemented in the canonical contract and runtime/tests, so its question,
alternatives, and recommendation no longer belong in the repository's active
decision surfaces. The five input directives remain because they are the unique
owner/provenance package and `docs/README.md` marks them historical and
non-authoritative; no duplicate report or evidence artifact met the deletion
criteria. A stale content contract assertion that treated superseded immutable
evidence as current was corrected in `patternly-content@0463a2b`; source banks,
readiness artifacts, and release admissions were not regenerated or expanded.

### 2. Figma/UI reconciliation

Reconcile affected UI behavior and geometry against the canonical contract and
the final `Page 1` / `Patternly Library` visual authority. The implementation
target is 99% fidelity. Practice Setup must expose the resolved profile-specific
session capability. Do not invent routes, metrics, unavailable content, or
semantic product decisions from visual material. Missing screens/states are
explainable gaps; if a state is buildable from existing canonical components,
models, and routes, implement it directly without parallel architecture. A
Figma-only metric or provider/account/commercial behavior remains unexplained
until its real contract exists, rather than becoming fabricated product truth.

The current completed code slices are the Algorithms Progress evidence-state
parity implementation in `src/features/home/tabs/ProgressTab.tsx` and
`src/features/home/tabs/progressTabModel.ts`, plus Activity variable-height row
parity in `src/features/home/ActivityScreen.tsx`. Projection coverage is in
`tests/homeProgressProjections.test.ts`, activity behavior in
`tests/activityModel.test.ts`, and visual-shell coverage in
`tests/visualShell.test.ts`. They add no route, persistence, metric source,
account command, or commercial contract. Sparse states explicitly withhold
effectiveness and trend values until recorded response thresholds are met;
established values are derived from the exact current content package. Activity
rows no longer clip long scope/status copy and remain accessible at 200% text.

The current G07 Goal cadence and existing Settings surfaces were inspected against
their canonical owners and presentation tests; no additional safe geometry-only
delta was identified in this checkpoint. Account, recovery, Premium, report, and
provider-backed states remain explainable tasks but are not to be fabricated
without their canonical input contracts.

### 3. Content Review Console V1

Build the smallest local/internal console in `patternly-content`. It must navigate
track → node → mental unit, search/filter real items, render prompt/answer/scoring/
Reason/Details/distractor explanations, show taxonomy/provenance/source identity,
surface advisory risk and coverage, navigate to risks, and record
`approved|needs_change|rejected` with note, exact identity, and fingerprint.
Changed content invalidates prior review. Support diff, keyboard use, and bounded
batch operations. Source files remain the only content authority.

The first local/internal implementation is `scripts/review/content-review-console.mjs`.
It has no cloud, auth, or automatic approval path; no review outcome is created
until a reviewer supplies an identity, note, and explicit disposition.

### 4. Eight-track content audit

Audit current banks with targeted classification:
`no_action`, `advisory`, `needs_human_review`, `confirmed_change_required`, or
`blocking_content_defect`. A missing classification is not a reason to add items.
Review new/materially changed items through the human outcome path. If a real
defect is confirmed, make the smallest source correction, create a new immutable
release/package identity, and preserve provenance. Do not mass-edit banks or add
count-driven content.

The current readiness pass is complete: all eight structural validators pass and
the tracked human-review fields remain existing evidence, not newly fabricated
approval. The remaining per-track blockers are runtime admission and publishing
admission, which are genuine external/release gates rather than content defects.

The application release-readiness gate also passes its internal content-lock and
source-integrity checks. The latest owner-owned EAS/NDK/signing changes are
committed on canonical `main` at `ea4ad79` and the worktree is clean. The gate remains `not_ready`
because actual EAS-managed signing/build evidence, eight-track runtime/publishing
admission, immutable full-package verification, and required external release
evidence are absent.

### 5. Account, identity, sync, adoption, deletion

Close the guest-first adoption preview, deterministic reconciliation, identity
provider/recovery, local durability, bounded sync, conflict, sign-out, deletion,
retention, and no-resurrection paths. Every unavailable provider or configuration
state is visible and fail-closed. The current build has the explicit unavailable
state and local durability boundary, but the provider-composed adoption/sync/
deletion path is not present. Continue only when its real provider/backend
contract is available; no production provider evidence is fabricated.

### 6. Commercial entitlement

Implement and verify one account-bound entitlement independent of storefront SKU
shape once the provider/backend input contract is available. Support fixed-duration
and recurring access through the same store → RevenueCat → backend projection →
bounded device cache chain. Keep exact SKU names, prices, promotions, product
availability, and provider configuration at the owner/provider gate. Verify Free,
purchase, restore, cross-platform, offline grace, downgrade, deletion/billing
independence, and package authorization. Do not create speculative adapters or
placeholder entitlement code before that boundary exists.

### 7. Provider, privacy, security, operations

Close only with real evidence for Firebase/backend/App Check/IAM/deploy/billing/
retention, domains/DNS/email/public URLs, provider credentials, legal/privacy,
secrets, logging, recovery, and operational runbooks. Draft instructions and
local checks are not production evidence.

### 8. QA, signing, stores, GO/NO-GO

Run contract, architecture, type, unit, integration, UI, accessibility, and
release-compatible flows; verify clean working trees, immutable manifests,
provenance, signed artifacts, store metadata, privacy/legal surfaces, and the
whole-product journey. Request explicit owner GO/NO-GO only after all internal
evidence is complete. Physical-device testing is optional and non-blocking.

The current owner-owned EAS/signing slice is committed on canonical `main` at
`ea4ad79`, with EAS project/update initialization in `15b00af`, and locally verified with
`tests/easReleaseConfiguration.test.ts` and `tests/releaseSigningBoundary.test.ts`
(8/8 focused invariants passing). The full app suite is 581/581 and typecheck passes.
This proves configuration and no-debug-fallback invariants only; it
does not prove an EAS-managed signed artifact. The delegated QA attempt used the
required `gpt-5.6-luna` model at `max` reasoning but returned no report, so the
controller records local QA as `PASS WITH GAPS`, not independent QA approval.
The signing boundary now requires both the EAS credentials file and generated
`app/eas-build.gradle`; the Android NDK pin is covered by
`tests/androidNdkVersion.test.ts`. Content `0463a2b` passes its full suite
(146/146) with the local Console bind test run under the required
localhost-enabled environment. Both canonical worktrees are clean.

## Genuine stop gates

Continue through routine cleanup, implementation, deletion, tests, architecture,
local/internal tooling, evidence manifests, and draft provider instructions.
Stop only for:

- owner review of flagged/new content;
- exact pricing, SKU, recurring period, product name, or promotion choice;
- Apple, Google, RevenueCat, EAS, signing, store, domain, legal, privacy,
  provider credentials, Firebase/backend/IAM/billing/deploy, or production config;
- runtime admission or publishing admission for any launch track;
- organic beta-user recruitment/feedback;
- final owner review and explicit GO/NO-GO.

No stage may claim provider, store, Figma, human-review, legal, or production
evidence that has not actually occurred.
