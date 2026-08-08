# 04 — Data Model

This document owns narrative domain and persistence-record context. Exact normative fields and invariants belong to `canonical-product-contract.yaml` and its schema/parser.

## Core identity and registry

```ts
type TrackFamilyId = 'certification' | 'coding_interview' | 'design_interview';
type TrackId = string;

type TrackDescriptor = {
  id: TrackId;
  familyId: TrackFamilyId;
  freeNodeId: string;
  taxonomyVersion: string;
  validModeIds: readonly string[];
  validGoalTemplateIds: readonly string[];
};
```

Families remain internal. A registry descriptor exists only for a shipping
track with a complete free vertical and core loop. Ten-track density evidence
uses separate design/test fixtures and never creates an incomplete registry
record or unavailable product path.

## Guest, account and identity

```ts
type GuestInstallation = {
  installationId: string;
  localDatasetId: string;
  bindingState: 'guest' | 'adoption_pending' | 'account_bound';
};

type AccountBinding = {
  accountId: string; // stable opaque Patternly ID
  firebaseUid: string;
  verificationState: 'verified';
  accountRevision: number;
};

type TermsAcceptance = {
  version: string;
  acceptedAt: string;
};
```

Credentials, raw provider tokens and recovery-code plaintext are not domain learning records. Eight recovery codes are shown once; only strong hashes and bounded metadata are stored server-side.

An adoption plan records dataset classes, counts, intended direction, destructive choices and confirmation. It never treats a mutable active session as adoptable account data.

## Entitlement

```ts
type PremiumProjection = {
  accountId: string;
  entitlement: 'premium';
  state: 'active' | 'grace' | 'expired' | 'revoked' | 'refunded';
  verifiedAt: string;
  sourceRevision: string;
};
```

There is one Premium entitlement, not a track-slot allocation. Store transaction, RevenueCat normalized state, backend projection and device cache are distinct layers. Email is never the RevenueCat user identity.

## Goals, learning facts and Activity

```ts
type TrackGoal = {
  trackId: TrackId;
  goalType: string;
  targetDate?: string;
  weeklySessionTarget: number;
  preferredDays?: readonly number[];
  preferredLocalReminderTime?: string;
  preferredSessionLength?: number;
  state: 'active' | 'paused';
};

type ActivitySummary = {
  sessionId: string;
  trackId: TrackId;
  nodeId: string;
  modeId: string;
  contentReleaseId: string;
  packageVersion: string;
  startedAt: string;
  endedAt: string;
  completionKind: 'completed' | 'ended_early';
  requestedLength: number;
  actualLength: number;
  answeredCount: number;
  elapsedForegroundMs: number;
  resultRef: string;
};
```

Immutable attempts/results/review facts remain canonical. Progress and statistics are rebuildable read models, never the only authority. Activity stores compact terminal summaries and resolves exact result detail on demand.

## Device-owned session and local journal

```ts
type DeviceSessionPointer = {
  installationId: string;
  sessionId: string;
};

type LocalMutationJournal = {
  operationId: string;
  deterministicWritePlan: unknown;
  state: 'durable' | 'materialized';
};
```

At most one pointer exists per device. The pointer, session draft, current position, timer and journal never enter account sync. Terminal attempts, results, review mutations and summaries may enqueue only after local materialization and verification.

## Incremental synchronization

```ts
type AccountOperation = {
  operationId: string;
  accountId: string;
  expectedRevision: number;
  kind: string;
  compactCanonicalFacts: readonly unknown[];
};

type SyncCursor = {
  accountRevision: number;
  activityCursor?: string;
  resultDetailCursor?: string;
};
```

The initial/returning-device projection contains profile/entitlement, current track, goals, compact per-track Progress, current-track due review, recent Activity and cursors. Older pages and exact details load on demand. There is no remote active-session record, divergent-draft choice or account-wide session lock.

## Content packages

```ts
type NodePackageManifest = {
  trackId: TrackId;
  nodeId: string;
  contentReleaseId: string;
  packageVersion: string;
  locale: string;
  checksumSha256: string;
  objectIdentity: string;
  objectGeneration: string;
  minimumAppVersion: string;
  schemaVersion: string;
};

type PreparedContentPin = {
  sessionId: string;
  packageIdentity: string;
  packageVersion: string;
  contentReleaseId: string;
};
```

Published objects are immutable. Activation is atomic and a failed candidate cannot replace the last verified version. Locale variants reuse stable instructional evidence identities. A package pinned by an active session cannot be evicted.

## Content report and deletion records

Content reports attach only bounded content/build context by default. Learner response, full prompt/feedback, account ID and email require explicit rules and are not automatic. Account/contact linking is an intentional optional consent.

Deletion uses durable intent, idempotent service operation, minimal proof and tombstone/proof reconciliation. Restore records cannot authorize account resurrection. Backup/PITR records are disaster-recovery metadata, not user account-recovery state.

## Boundaries

Design tokens, Figma status and Storybook fixtures are not product-domain records. Static content is not copied into user learning persistence. Unknown IDs, invalid package identity, immutable collisions, stale revisions and corrupt records fail explicitly.
