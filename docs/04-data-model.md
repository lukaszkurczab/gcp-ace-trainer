# 04 — Data Model

## Core contracts

```ts
type TrackFamilyId = string;
type TrackId = string;

type TrackDescriptor = {
  id: TrackId;
  familyId: TrackFamilyId;
  contentVersion: string;
  taxonomyVersion: string;
  enabledModeIds: readonly string[];
};

type AlgorithmsModeId = string; // validated against canonical-product-contract.yaml at the family boundary

type ReviewSource = 'due_queue' | 'session_misses';
type ResultKind = 'correct' | 'partial' | 'incorrect';

type TrainingSession = {
  id: string;
  trackId: string;
  mode: string;
  requestedLength: number;
  actualLength: number;
  itemOrder: readonly ContentItemRef[];
  optionOrderByItem: Readonly<Record<string, readonly string[]>>;
  activeForegroundMs: number;
  contentVersion: string;
  status: 'active' | 'completed' | 'abandoned';
};

type ReviewEvidence = {
  sourceItem: ContentItemRef;
  taxonomyOrSkillRefs: readonly string[];
};

type ReviewReason =
  | 'incorrect' | 'partial' | 'hint_used' | 'wrong_pattern'
  | 'wrong_strategy' | 'complexity_error' | 'repeated_mistake'
  | 'scheduled_retrieval' | 'weak_taxonomy_area' | 'manual_mark';

type ReviewQueueEntry = ReviewEvidence & {
  reasons: readonly ReviewReason[];
  dueAt: string;
  consecutiveAfterDueSuccesses: number;
  persistent: boolean;
};

type EvidenceModel = {
  evidenceVolume: unknown;
  learningStageEvidence: unknown;
  performanceSignals: unknown;
};
```


## Track registry and family extensibility

`TrackFamilyId` and `TrackId` are opaque identifiers at the shared-kernel boundary. The kernel must not use a closed union of all product families or tracks and must not branch on concrete IDs. The application composition root registers a `TrackDescriptor` with exactly one family runtime. Family-specific configuration is registered and typed inside that family; the kernel neither stores nor interprets a generic `familyConfig` payload.

Current registrations are Certification and Algorithms. Future examples include Azure AI Fundamentals and AWS Solutions Architect Associate as Certification track instances, plus possible `database_reasoning`, `code_reasoning`, and `system_design` families. These examples do not add shared domain fields for SQL, code traces, or architecture evaluation. Concrete payload and response contracts remain owned by their family runtime.

A new track inside an existing family does not add a new session, attempt, review, or repository model. A new family may define new payload, response, score-detail, and evidence-detail types, but they remain inside deterministic family outcomes carried by canonical envelopes.

`TrainingAttempt` is immutable and stores deterministic response, result, score, review evidence, and committed time. It has no confidence field. One active session exists. Current selection is UI state and is never persisted.

## Scoring models

Multiple-choice practice is correct only when the selected set equals the correct set; it is partial only for a non-empty proper correct subset without wrong options; any wrong option is incorrect with zero points. In an exam only correct contributes to the correct count.

Ordering content has at least two elements. It scores preserved correct adjacent relations: for `A → B → C → D`, evaluate `A→B`, `B→C`, and `C→D`; `maxPoints = itemCount - 1`. All relations are correct, some but not all are partial, and zero is incorrect.

Complexity content declares its checked dimensions, available values, accepted values or normalized aliases, and optional shared preset. It awards one point per checked dimension. Time-only and space-only items are valid; there is no closed global class list.

## Review and reinsert

Review resolution requires two successful review attempts after `dueAt`; attempts before it do not increment success, and incorrect or partial resets the consecutive count. A same-session correction does not resolve persistent review. Reinsert availability and placement resolve from the canonical mode configuration and family policy; it preserves both diagnostic attempts when selected.

## Durable storage model

```ts
type MutationJournal = {
  id: string;
  operation: 'submit' | 'complete_exam';
  deterministicOutcome: unknown;
  state: 'durable' | 'materialized';
};
```

Submit validates and freezes, builds a deterministic attempt/session/review outcome, persists this journal, then exposes feedback or transition, materializes canonical records, verifies materialization, and clears the journal. Retry and force-close recovery are idempotent.

## Exam profile

```ts
type ExamExperienceProfile = {
  sourceUrl: string; sourceCheckedAt: string; examGuideVersion?: string;
  durationMinutes: number; questionCount: number | { min: number; max: number };
  navigationPolicy: 'linear_no_return' | 'previous_next' | 'free_navigation';
  answerChangePolicy: 'locked_after_submit' | 'editable_until_section_submit' | 'editable_until_final_submit';
  flaggingPolicy: 'not_available' | 'available';
  navigatorPolicy: 'not_available' | 'answered_unanswered' | 'answered_unanswered_flagged';
  sectionPolicy: { kind: 'single_section' } | { kind: 'multiple_sections'; sections: readonly unknown[]; canReturnToCompletedSection: boolean };
  timeoutPolicy: 'automatic_final_submit';
};
```

Historical item maps, explanation reconstruction, confidence, and translated old records are not models in the target.

## Account and synchronization envelopes

The normative record ownership and sync policies are declared in
`canonical-product-contract.yaml`. The launch implementation adds envelopes at
the application/repository boundary; it does not add account fields to family
payloads or duplicate canonical learning records.

```ts
type AccountBinding = {
  accountId: string;
  normalizedEmail: string;
  verificationState: 'verified';
  accountRevision: number;
};

type SyncOperationEnvelope = {
  operationId: string;
  accountId: string;
  expectedAccountRevision: number;
  localCommitFingerprint: string;
  canonicalWrites: readonly unknown[];
};

type SyncProjection = {
  state: 'initialSyncRequired' | 'syncing' | 'synced' |
    'offlinePending' | 'conflict' | 'failed' | 'deletionPending';
  lastSuccessfulSyncAt?: string;
  pendingMutationCount: number;
  blockingConflictCode?: string;
  lastFailureCode?: string;
};
```

An access token is not a learning-data owner. Authentication proves access to
one account dataset; local record revisions and the remote account revision
govern synchronization. Device settings and notification permission state do
not sync. Mutation journals remain device-operational; only their verified
materialized writes enter the ordered sync outbox.

Canonical account records are ordered lexicographically by the exact UTF-8
bytes of `type`, then by the exact UTF-8 bytes of `id`; a shorter equal byte
prefix sorts first. Record IDs must be Unicode-scalar strings: valid surrogate
pairs are accepted, while lone high or low UTF-16 surrogates are rejected. This
order is shared by canonical dataset identity, adoption results and Firestore
semantic record traversal.
