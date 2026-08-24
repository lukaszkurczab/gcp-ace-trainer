# Patternly — launch completion plan

**Authority:** `docs/canonical-product-contract.yaml`,
`docs/product-owner-decision-register.md`, and the owner directive/manual actions
dated 2026-08-24. This file owns execution order and repository status only.

**As of:** 2026-08-24

**Starting pushed app head:** `2668022f2211453cb5a715bb0da5f1473fb3c119` on `origin/main`

**Starting pushed content head:** `7fcf28d159c19e6b5d1c7e63828ae943ca3ce7e3` on `origin/master`

The app checkout also contained a clean, user-owned local `main` ahead of its
pushed head. It is preserved and will be pushed with verified reconciliation work;
the pushed ref is the release baseline until that verification completes.

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
| 1. Evidence and artifact cleanup | in_progress | Decision-register cleanup and removal of the obsolete global content-count gate are complete; the remaining strict deletion audit preserves unique provenance/release/legal/security evidence. |
| 2. Figma/UI reconciliation | partial | Existing repository-owned implementation and visual evidence exist; remaining semantic conflicts or owner approvals remain explicit. |
| 3. Content Review Console V1 | planned | Local console renders real source items, surfaces advisory risks/coverage, tracks fingerprints, and records explicit human outcomes. |
| 4. Eight-track content audit | partial | Existing evidence is available; targeted classification is required without reopening the accepted baseline by count. |
| 5. Account, identity, sync, adoption, deletion | partial | Local and server foundations exist; release-compatible provider, failure, deletion and cross-device evidence remains to be closed. |
| 6. Commercial entitlement | planned | SKU-neutral fixed/recurring entitlement chain is implemented and verified without inventing store/provider evidence. |
| 7. Provider, privacy, security, operations | planned | External configuration, privacy/legal, retention, domain, sender, IAM, billing and recovery gates are evidenced. |
| 8. QA, signing, stores, GO/NO-GO | planned | Release-compatible test/signing/store evidence and explicit owner GO/NO-GO exist. |

## Execution stages

### 0. Strategic reconciliation — current slice

Update the canonical contract and its coverage tests; update the owner register;
reconcile only affected narrative documents; replace stale launch-plan history;
and supersede contradictory active assumptions. Verify contract parsing, focused
tests, documentation references, and both clean/pushed heads.

The first non-blocked task after this slice is Stage 1 cleanup.

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

### 2. Figma/UI reconciliation

Reconcile only affected UI behavior and geometry against the canonical contract.
Practice Setup must expose the resolved profile-specific session capability. Do
not invent routes, metrics, unavailable content, Figma approvals, or semantic
product decisions. Geometry differences default to the canonical product truth;
stop only for a real unresolved owner approval or material semantic conflict.

### 3. Content Review Console V1

Build the smallest local/internal console in `patternly-content`. It must navigate
track → node → mental unit, search/filter real items, render prompt/answer/scoring/
Reason/Details/distractor explanations, show taxonomy/provenance/source identity,
surface advisory risk and coverage, navigate to risks, and record
`approved|needs_change|rejected` with note, exact identity, and fingerprint.
Changed content invalidates prior review. Support diff, keyboard use, and bounded
batch operations. Source files remain the only content authority.

### 4. Eight-track content audit

Audit current banks with targeted classification:
`no_action`, `advisory`, `needs_human_review`, `confirmed_change_required`, or
`blocking_content_defect`. A missing classification is not a reason to add items.
Review new/materially changed items through the human outcome path. If a real
defect is confirmed, make the smallest source correction, create a new immutable
release/package identity, and preserve provenance. Do not mass-edit banks or add
count-driven content.

### 5. Account, identity, sync, adoption, deletion

Close the guest-first adoption preview, deterministic reconciliation, identity
provider/recovery, local durability, bounded sync, conflict, sign-out, deletion,
retention, and no-resurrection paths. Every unavailable provider or configuration
state is visible and fail-closed. Verify with focused tests and release-compatible
flows; no production provider evidence is fabricated.

### 6. Commercial entitlement

Implement and verify one account-bound entitlement independent of storefront SKU
shape. Support fixed-duration and recurring access through the same
store → RevenueCat → backend projection → bounded device cache chain. Keep exact
SKU names, prices, promotions, product availability, and provider configuration at
the owner/provider gate. Verify Free, purchase, restore, cross-platform, offline
grace, downgrade, deletion/billing independence, and package authorization.

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

## Genuine stop gates

Continue through routine cleanup, implementation, deletion, tests, architecture,
local/internal tooling, evidence manifests, and draft provider instructions.
Stop only for:

- owner review of flagged/new content;
- unresolved Figma owner approval or material semantic conflict;
- exact pricing, SKU, recurring period, product name, or promotion choice;
- Apple, Google, RevenueCat, EAS, signing, store, domain, legal, privacy,
  provider credentials, Firebase/backend/IAM/billing/deploy, or production config;
- organic beta-user recruitment/feedback;
- final owner review and explicit GO/NO-GO.

No stage may claim provider, store, Figma, human-review, legal, or production
evidence that has not actually occurred.
