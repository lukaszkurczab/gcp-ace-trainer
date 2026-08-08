# 02 — Architecture

## Canonical structure

```txt
composition root
  → application use cases
  → shared learning kernel
  → internal family runtime
  → track instance + exact local package/content version
  → repository contracts
  → one MMKV infrastructure owner
```

The shared kernel owns the family-neutral session lifecycle, immutable attempts, terminal results, review commands, evidence envelopes and repository interfaces. A family runtime owns its payload validation, selection, scoring, feedback, review and recommendation semantics. A track instance owns concrete metadata, taxonomy, valid goals/modes, `freeNodeId`, packages and any official-source simulation profile.

There is one learning lifecycle, one local persistence path and one session shell. A new track or family cannot create a parallel runner, repository set, package bank, entitlement authority or UI implementation.

## Guest, account and synchronization boundary

Guest identity and learning state are local installation state. Account creation invokes one explicit adoption application service; it does not add account fields to family payloads or silently merge datasets.

```txt
learning command
→ validate
→ persist local mutation journal
→ materialize and verify canonical local facts
→ clear journal
→ enqueue compact idempotent account operation
→ synchronize opportunistically
```

Canonical local repositories are the device durability authority. The Patternly service is the account convergence authority for compact account-owned facts and rebuildable projections. Screens and family runtimes never access Firestore, RevenueCat, Cloud Storage or raw networking directly.

`currentTrackId`, goals, terminal attempts/results, review facts and compact Activity/Progress projections may synchronize. Active-session pointer, mutable draft, current position, timer and mutation journal are device-owned and never synchronize. Each device may hold one independent active session; there is no account-wide active-session conflict or cross-device resume.

Sync is incremental and paginated. Startup, network/foreground return when stale, terminal session completion, goal/current-track/entitlement changes and explicit retry are triggers. The target does not promise background synchronization.

## Identity, entitlement and package authority

Firebase Authentication establishes identity. Cloud Run verifies Firebase tokens and owns protected Patternly operations. Direct client Firestore access remains deny-all.

For Premium, Apple/Google owns the transaction, RevenueCat normalizes store state, the backend owns the account entitlement projection, and the device owns only a bounded cache. A local RevenueCat SDK result cannot authorize a Premium package download.

Bundled content contains the complete free node of each production track. Premium content uses immutable compressed whole-node objects in Cloud Storage, Firestore manifest metadata, Cloud Run authorization and short-lived signed URLs. The app downloads to a temporary location, verifies checksum/schema/semantics, persists a versioned package and atomically switches the active pointer. Failed activation leaves the previous verified version active. Sessions pin exact versions, and cache eviction cannot remove a package pinned by an active session.

## Internal family extension

The target families are `certification`, `coding_interview` and `design_interview`. `TrackFamilyId` and `TrackId` remain opaque at the kernel boundary. The user sees only tracks.

A track reuses a family only when that family can validate its payloads, represent scoring/evidence/review and render interactions without checking the concrete track ID. Otherwise a new family runtime is required, still using the shared lifecycle and repositories. A shipping registry entry requires a real free vertical and full core loop; descriptor-only and density-test entries remain non-production evidence.

## Presentation and design authority

During the one-time active design phase, Figma owns visual exploration and approved presentation. Only the Product Owner can move actual work to `APPROVED`. Product/runtime behavior continues to come from the canonical contract.

The handoff lifecycle is:

```txt
FIGMA_DRAFT → FIGMA_REVIEW → FIGMA_APPROVED → IMPLEMENTED
→ VISUALLY_VERIFIED → HANDED_OFF → CODE_CANONICAL
```

After `CODE_CANONICAL`, one repository-owned platform-neutral token source, checked-in assets, production components, canonical states, Storybook, tests and baselines are operational visual authority. Figma may remain an archive but is not a build, CI or ordinary-development dependency.

Storybook is a separate development-only React Native entry/target. It renders production components through deterministic typed presentation fixtures. It cannot access MMKV, repositories, accounts, payment, sync, package/session lifecycle or create parallel business logic. Release builds must statically exclude Storybook and its entry path.

## Dependency and failure rules

UI renders typed application states and dispatches commands; it does not score, persist, authorize, synchronize, select packages or fabricate feedback. Provider adapters stay behind application ports. Infrastructure alone imports concrete storage/network/provider libraries.

Missing or invalid identity, entitlement, package, content, profile, record or revision state produces an explicit unavailable/error state. There are no fallback topics, packages, accounts, generic answers, compatibility aliases or old/new parallel authorities.

Pre-production obsolete storage and family identifiers are migrated atomically where required or deleted in their scheduled implementation task. Documentation does not create an `algorithms`/`coding_interview` alias.
