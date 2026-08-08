# 08 — Storage, Offline, and Synchronization

## Purpose and authority

This document owns the narrative persistence, offline, guest-adoption, synchronization, and package-cache boundaries. The normative behavior is in `canonical-product-contract.yaml`; document `17` owns the detailed learning-session lifecycle. Current repository behavior does not override the target.

Patternly is local-first. A learning mutation is successful locally before synchronization is attempted. Network availability is never required for a guest to use the bundled Free product.

## Local persistence ownership

One infrastructure-owned MMKV client and one canonical repository set own local application state. Screens, components, family runtimes, track instances, and content modules do not import MMKV directly.

Canonical local records include:

- installation and guest identity metadata;
- optional verified Patternly-account binding;
- current track and per-track goals;
- one active-session pointer per device;
- active and completed device sessions;
- immutable attempts and terminal results;
- review entries and Activity facts;
- simulation drafts, current position, and foreground timer checkpoints;
- one pending local mutation journal;
- ordered idempotent account-operation outbox and incremental sync cursors;
- validated package metadata, versioned package payloads, and atomic active-package pointers;
- account-deletion intent and tombstone evidence needed for safe cleanup.

Derived progress, recommendations, due-review summaries, and compact Activity projections are rebuildable. They are not independent canonical learning authority.

## Guest dataset

Every installation starts with a local guest identity and guest dataset. Guest use supports track switching, goals, attempts, review, Activity, Progress, and offline operation. It does not use Firebase Anonymous Authentication.

Guest data remains local until the learner explicitly creates or signs into a Patternly account and confirms an adoption plan. Registration never silently discards, overwrites, or merges guest learning.

## Device-owned active session

At most one active learning session exists per device. The following records are always device-owned and have no remote representation:

- active-session pointer;
- active session and exact prepared item order;
- simulation draft;
- current item or position;
- foreground timer and timer checkpoints;
- local mutation journal.

An active session is never resumed, selected, merged, or resolved on another device. Cross-device synchronization cannot create an account-wide active-session conflict because active sessions are outside the account dataset.

Session preparation pins exact track, node/package or bundled-content version, taxonomy/configuration versions, and item occurrences before the first item appears. A published version is never silently substituted during resume or review.

## Journal-first mutation

Every learning mutation follows one durability boundary:

```txt
validate command and expected revision
→ persist a self-contained local journal entry
→ materialize every declared local write and deletion
→ read back and verify the intended final state
→ clear the journal
→ append one compact idempotent account operation when the dataset is bound
→ render committed success
```

Synchronization does not sit inside the local success boundary. A network failure leaves the verified local result intact and the account operation visibly pending. Recovery replays the journal by operation identity and expected prior state; it never reconstructs an answer, score, explanation, or package version from current content.

## Guest-to-account adoption

Adoption begins only after registration or sign-in. The learner sees a preview and confirms the exact deterministic plan before either dataset changes.

The plan handles these cases:

- new empty account: preserve the guest dataset by default; explicit discard remains available;
- existing account with no guest learning: restore the account dataset;
- existing account plus guest learning: deduplicate identical stable facts, preserve distinct facts, and block irreconcilable same-ID/different-fingerprint collisions;
- active guest session: finish or abandon it before binding; it is never uploaded or merged.

Cancellation and failed verification preserve both last verified datasets. Adoption becomes effective only after the remote operation converges and the resulting local binding is verified.

## Account-owned synchronized facts

The account dataset may contain:

- current track;
- per-track goals;
- immutable attempt and terminal-result facts;
- review mutations and resolution facts;
- compact recent Activity and Progress projections;
- stable content, node, package, taxonomy, and configuration references;
- account/profile, consent, entitlement projection, and deletion metadata owned by their respective contracts.

It never contains an active-session pointer, session draft, current position, timer, or local journal. A compact canonical fact remains authority; a server or device projection must be rebuildable from those facts.

## Incremental synchronization

Each account operation has a stable idempotency key, expected revision or cursor boundary, closed operation type, and bounded payload. The service either applies it once or returns an explicit stale, duplicate, invalid, revoked, deleted-account, or integrity result.

Synchronization is triggered explicitly by account bootstrap, foreground/resume, network regain while the app is active, a committed local mutation, a user refresh, and pre-sign-out/deletion flush where safe. Patternly does not promise unrestricted operating-system background synchronization.

Bootstrap and refresh use incremental cursors and pagination. Initial reads are bounded to current track, goals, due review, compact progress, and recent Activity. Exact historical results load on demand. Retry is ordered and idempotent; it never duplicates a logical learning fact.

## Offline behavior

Guests can use bundled Free nodes entirely offline. A previously verified account can continue locally while offline. Pending account operations are visible and retry after an explicit trigger.

Premium package use follows the entitlement cache and seven-day offline verification grace in the canonical contract. A session already started while entitled may finish safely even if entitlement becomes unverifiable or expires during the session. Starting a new Premium session requires the applicable entitlement and package checks.

Authentication, first account binding, purchase, restore, remote package download, sensitive account security operations, and remote account deletion require network access.

If a bound device later receives verified deleted-account evidence, it durably records cleanup intent, removes credentials, binding, outbox, entitlement association, and account-owned local facts, and exposes a terminal deleted-account result. It does not resurrect or reauthenticate the deleted account.

## Bundled Free nodes

Each production-visible track has one canonical `freeNodeId`. Its complete Free node and every interaction needed for its core loop are bundled with the application. Free session and Free review selection are strictly filtered to that node; Premium content is never filler for a Free session.

Bundled content remains immutable within an application build and is referenced by stable evidence identity.

## Premium whole-node packages

Premium content is published as immutable compressed whole-node packages. Firestore owns manifest/account metadata; Cloud Storage owns immutable package bytes; Cloud Run verifies identity and backend entitlement before returning a short-lived signed URL.

A manifest contains at least track, node, package, schema, content, taxonomy/configuration, locale, checksum, compressed/uncompressed size, immutable object identity and generation, minimum app version, and publication identity.

Download and activation follow this boundary:

```txt
authorize identity and backend entitlement
→ obtain short-lived URL
→ download to temporary storage
→ verify checksum and immutable object identity
→ validate schema and semantic content
→ persist under its exact version
→ atomically move the active pointer
```

Failure leaves the previous verified package active. Runtime never fetches one question at a time from Firestore and never substitutes another package version silently.

## Review resolution and cache eviction

Review facts retain stable evidence and exact content references. The resolver uses the pinned package version when available and follows an explicit unavailable-content state when exact material cannot be resolved; it does not rewrite historical evidence against current content.

Eviction is deterministic and cannot remove:

- a package pinned by an active device session;
- a package required by a pending local journal;
- a package required for an immediately due review when no safe replacement exists;
- the previous verified version until activation of the replacement succeeds.

The bundled Free node is not evicted.

## Bootstrap and recovery

Bootstrap runs in this order:

```txt
initialize MMKV and verify backup exclusion
→ validate storage identity
→ recover and verify the pending local journal
→ load guest/account binding and entitlement cache
→ validate bundled Free manifests and installed package index
→ resolve the device-owned active-session pointer and records
→ verify every pinned content/configuration reference
→ enter ready, unavailable, or explicit recovery state
```

Normal learning navigation remains unavailable while local integrity recovery is unresolved. Network and account failures do not invalidate verified guest/local learning.

## Platform backup

Canonical learning data, package cache, credentials, and entitlement cache are excluded from automatic iCloud/Android backup and device-transfer restore. Cross-device continuity is an application-level account synchronization feature, not an operating-system backup feature.

Firestore PITR is disaster recovery for the service. It is not a user account recovery path and cannot restore a deleted account into live service. Document `09` owns restore authorization, tombstone reconciliation, and deletion/privacy constraints.

## Reset, sign-out, and deletion

Local reset is journaled, verified, and scoped explicitly. It is distinct from sign-out and account deletion.

Sign-out removes credentials and binding only after the selected pending-operation policy completes; it never pretends unsynchronized work was uploaded. Account deletion follows document `09`, persists retryable cleanup intent, and prevents stale local state or disaster-recovery data from recreating the account.

## Required recovery rule

Old namespaces, dual reads/writes, translators, compatibility stores, fallback package banks, and parallel sync paths are not retained. If pre-production state cannot move without preserving obsolete meaning, implementation deletes that path and exposes an explicit unavailable or reset boundary.
