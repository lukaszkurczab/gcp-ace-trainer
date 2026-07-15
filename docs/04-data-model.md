# 04 — Data Model

## Core identities and envelopes

```ts
type AlgorithmsMode =
  | "Learn Approach"
  | "Guided Practice"
  | "Recognize Patterns"
  | "Contrast Practice"
  | "Weak Area Review"
  | "Independent Practice"
  | "Interview Simulation";

type AlgorithmsReviewSource = "due_queue" | "session_misses";

type ResultKind = "correct" | "partial" | "incorrect";

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

type ContentIdentity = {
  trackId: string;
  contentVersion: string;
  itemId: string;
};

type ContentItemRef = ContentIdentity;

type SessionOccurrence = {
  occurrenceId: string;
  item: ContentItemRef;
};

type FamilyConfigurationSnapshot = {
  familyId: string;
  modeId: string;
  schemaVersion: string;
  payload: JsonValue;
  fingerprint: string;
};

type PersistedFamilyResponse = {
  familyId: string;
  interactionType: string;
  schemaVersion: string;
  payload: JsonValue;
};

type AttemptResult = {
  kind: ResultKind;
  pointsEarned: number;
  maxPoints: number;
  diagnosticCodes: readonly string[];
};
```

Concrete response contracts, diagnostic codes, configuration payloads, and their validators belong to the applicable family runtime. The shared kernel stores only validated envelopes.

`pointsEarned` and `maxPoints` are finite non-negative numbers and `pointsEarned <= maxPoints`.

## Foreground timer state

```ts
type ForegroundTimerState = {
  accumulatedMs: number;
  checkpointSequence: number;
  lastCheckpointAt: string;
  runningWhenCheckpointed: boolean;
};
```

`accumulatedMs` contains only durably checkpointed foreground time.

Runtime may add an in-memory monotonic segment while the application is active. App-state transitions and periodic checkpoints materialize that segment into `accumulatedMs`.

After force-close, recovery resumes from the last durable checkpoint. It does not infer foreground work from closed-app wall-clock time.

The checkpoint policy and maximum permitted timer drift are part of the storage and runtime contracts and must be tested explicitly.

## Session plan

```ts
type TrainingSessionBase = {
  id: string;
  trackId: string;
  familyId: string;
  modeId: string;
  configurationSnapshot: FamilyConfigurationSnapshot;
  requestedLength: number;
  actualLength: number;
  itemOrder: readonly SessionOccurrence[];
  optionOrderByOccurrence: Readonly<Record<string, readonly string[]>>;
  contentVersion: string;
  createdAt: string;
};

type PracticeRuntimeState = {
  kind: "practice";
  currentOccurrenceId: string;
  timer: ForegroundTimerState;
};

type SimulationRuntimeState = {
  kind: "simulation";
  draftId: string;
};

type ActiveTrainingSession = TrainingSessionBase & {
  status: "active";
  runtimeState: PracticeRuntimeState | SimulationRuntimeState;
};

type CompletedTrainingSession = TrainingSessionBase & {
  status: "completed";
  completedAt: string;
  result: SessionCompletionResult;
};

type AbandonedSessionTombstone = {
  id: string;
  trackId: string;
  familyId: string;
  modeId: string;
  status: "abandoned";
  abandonedAt: string;
};

type TrainingSession =
  | ActiveTrainingSession
  | CompletedTrainingSession
  | AbandonedSessionTombstone;
```

For every active or completed session:

```txt
actualLength = itemOrder.length
```

Every `occurrenceId` is unique within the session.

`optionOrderByOccurrence` may contain only occurrence IDs belonging to the session and only option IDs valid for the referenced content item.

The repository enforces that at most one session has `status = active`.

An abandoned session is excluded from history. Its full item plan, flags, responses, and draft state are deleted. Already committed attempts remain canonical evidence.

## Occurrence and duplicate rules

`occurrenceId` identifies a position in a specific session plan. It does not redefine content identity.

Normal selection must not place the same `ContentIdentity` into a session more than once.

A repeated content identity is allowed only when the applicable mode contract explicitly permits an exact-item reinsert. The second occurrence receives a new `occurrenceId`.

The following remain prohibited:

- duplicate content in Algorithms `Interview Simulation`;
- duplicate content added to fill a requested review length;
- accidental duplicates caused by merging selection sources;
- unrelated duplicate or generic substitute content.

Algorithms `Interview Simulation` contains exactly 40 unique content identities.

## Attempts

```ts
type ReviewProvenance =
  | {
      kind: "attempt";
      attemptId: string;
    }
  | {
      kind: "session_transition";
      sessionId: string;
      occurrenceId: string;
      transitionId: string;
    }
  | {
      kind: "manual_mark";
      sessionId?: string;
      occurrenceId?: string;
      markedAt: string;
    };

type ReviewEvidence = {
  sourceItem: ContentItemRef;
  taxonomyOrSkillRefs: readonly string[];
  provenance: ReviewProvenance;
};

type TrainingAttempt = {
  id: string;
  sessionId: string;
  trackId: string;
  familyId: string;
  modeId: string;
  occurrenceId: string;
  item: ContentItemRef;
  response: PersistedFamilyResponse;
  result: AttemptResult;
  reviewEvidence: readonly ReviewEvidence[];
  responseLastChangedAt: string;
  committedAt: string;
};
```

`TrainingAttempt` is immutable.

`occurrenceId` must identify the exact matching occurrence in the referenced session plan, and the attempt’s `item` must equal that occurrence’s `ContentItemRef`.

For practice, `responseLastChangedAt` is the response-freeze time used by submit.

For finalization-only simulation, it is the last durable draft-change time for that occurrence. `committedAt` is the time at which the immutable attempt was materialized from the finalization outcome.

An unsubmitted practice selection is ephemeral UI state and is never persisted.

## Session completion result

```ts
type FamilySessionResult = {
  familyId: string;
  schemaVersion: string;
  payload: JsonValue;
};

type SessionCompletionResult = {
  answeredOccurrenceIds: readonly string[];
  unansweredOccurrenceIds: readonly string[];
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  pointsEarned: number;
  maxPoints: number;
  foregroundTimeMs: number;
  flaggedOccurrenceIds: readonly string[];
  familyResult: FamilySessionResult;
};
```

The following invariants apply:

```txt
answeredOccurrenceIds and unansweredOccurrenceIds are disjoint
answeredOccurrenceIds + unansweredOccurrenceIds cover itemOrder
correctCount + partialCount + incorrectCount = answeredOccurrenceIds.length
pointsEarned <= maxPoints
```

An unanswered occurrence:

- contributes zero points;
- remains distinct from incorrect;
- does not create an ordinary item-level attempt;
- does not automatically create content-specific review;
- remains persisted in `unansweredOccurrenceIds`.

Family-specific breakdowns, completion-rate signals, answer-change diagnostics, taxonomy summaries, and recommendation inputs belong in the validated `familyResult`.

Summary and post-session review load this completed result. They do not reconstruct unanswered state from a deleted draft.

## Review queue

```ts
type ReviewReason =
  | "incorrect"
  | "partial"
  | "hint_used"
  | "wrong_pattern"
  | "wrong_strategy"
  | "complexity_error"
  | "repeated_mistake"
  | "scheduled_retrieval"
  | "weak_taxonomy_area"
  | "manual_mark";

type ReviewQueueEntry = {
  id: string;
  trackId: string;
  evidence: ReviewEvidence;
  reasons: readonly ReviewReason[];
  dueAt: string;
  consecutiveAfterDueSuccesses: number;
  persistent: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Review reasons and taxonomy or skill references contain unique values.

A review mutation names its exact provenance. Runtime must not create review evidence without an attempt, documented session transition, or manual mark.

Review resolution requires two consecutive successful review attempts submitted after the entry’s applicable `dueAt`.

A successful attempt before `dueAt` does not increment the consecutive-success count. A partial or incorrect review attempt resets the count. A correction in the same session does not resolve persistent review.

## Reinsert policy

```ts
type ReinsertPolicy =
  | {
      enabled: false;
    }
  | {
      enabled: true;
      maxReinsertsPerSourceAttempt: 1;
      minimumSubmittedItemsBetweenAttempts: 3;
      onInsufficientRemainingItems: "skip";
    };
```

Reinsert is enabled only for:

- `Guided Practice`;
- Algorithms `Weak Area Review` with `source = due_queue`;
- Algorithms `Weak Area Review` with `source = session_misses`.

It is disabled in every other Algorithms mode.

A reinsert:

- is tied to one original incorrect or partial attempt;
- occurs at most once for that source attempt;
- requires at least three other submitted items between attempts;
- prefers a reviewed variant of the same mechanism;
- may use the exact source item only when no compatible reviewed variant exists;
- creates a new occurrence and a separate immutable attempt;
- preserves the original diagnostic outcome;
- never resolves persistent review merely because correction occurred in the same session.

If the already selected session plan cannot satisfy the required gap, the reinsert is skipped as a normal deterministic outcome.

Skipping must not:

- extend the session;
- reorder already fixed occurrences;
- add unrelated content;
- widen taxonomy;
- duplicate generic content;
- resolve or remove the existing review obligation.

## Algorithms Interview Simulation profile

```ts
type AlgorithmsInterviewSimulationProfile = {
  profileId: "algorithms-interview-simulation";
  profileVersion: string;
  selectionBlueprintId: string;
  itemCount: 40;
  durationForegroundMinutes: 45;
  navigationPolicy: "free_navigation";
  answerChangePolicy: "editable_until_final_submit";
  completionPolicy: "manual_or_foreground_timeout";
  feedbackPolicy: "session_end";
  unansweredPolicy: "reported_separately";
  reinsertPolicy: "disabled";
  attemptPolicy: "finalization_only";
  persistentReviewPolicy: "finalized_answered_outcomes_only";
};
```

This is a Patternly-defined Algorithms configuration. It is not an `ExamExperienceProfile` and does not claim official provenance.

The profile version and exact selection blueprint are included in the session’s immutable configuration snapshot.

## Simulation draft

```ts
type SimulationDraftResponse = {
  response: PersistedFamilyResponse;
  lastChangedAt: string;
  changeCount: number;
};

type AlgorithmsInterviewSimulationDraft = {
  draftId: string;
  sessionId: string;
  trackId: string;
  revision: number;
  responsesByOccurrenceId: Readonly<Record<string, SimulationDraftResponse>>;
  currentOccurrenceId: string;
  flaggedOccurrenceIds: readonly string[];
  timer: ForegroundTimerState;
  updatedAt: string;
};
```

The draft belongs exclusively to one active Algorithms `Interview Simulation` session. It is not a second session or a separate history model.

Draft invariants:

- every response key belongs to `itemOrder`;
- `currentOccurrenceId` belongs to `itemOrder`;
- every flagged occurrence belongs to `itemOrder`;
- flag IDs are unique;
- every stored response is valid for its referenced item;
- `revision` increases on each durable draft mutation.

Draft responses, current position, flags, and timer state are persisted together under one session-owned draft contract.

A draft mutation creates no immutable attempt, score, review mutation, feedback, or completed-session result.

The UI may report a response, flag, position, or timer checkpoint as saved only after the corresponding draft revision is durable.

## Scoring models

### Multiple choice

A multiple-choice response is:

- `correct` when the selected set equals the complete correct set;
- `partial` when it is a non-empty proper subset of the correct set and contains no wrong option;
- `incorrect` with zero points when any wrong option is selected.

In certification exam scoring, only `correct` increases the correct count. Partial remains diagnostic.

### Ordering

Ordering content contains at least two elements.

For canonical order:

```txt
A → B → C → D
```

score the adjacent relations:

```txt
A→B
B→C
C→D
```

```txt
maxPoints = itemCount - 1
```

All preserved relations produce `correct`. At least one but not all produces `partial`. Zero preserved relations produces `incorrect`.

Exact-position scoring is not used.

### Complexity

Complexity content declares:

- checked dimensions;
- available values;
- accepted values or explicit normalized aliases;
- an optional shared preset.

Each correctly answered checked dimension awards one point.

Time-only and space-only items are valid. No closed global list of complexity classes exists.

## Durable mutation journal

```ts
type JournalOperation =
  | "submit_training_outcome"
  | "complete_training_session"
  | "abandon_training_session"
  | "finalize_training_session"
  | "set_review_entry"
  | "remove_review_entry";

type MutationJournal = {
  journalId: `journal:${string}`;
  schemaVersion: string;
  operation: JournalOperation;
  status: "prepared";
  createdAt: string;
  sessionId: string;
  trackId: string;
  expectedSessionRevision: number;
  commandFingerprint: string;
  planFingerprint: string;
  writes: readonly JournalWrite[];
};
```

`JournalWrite` is an infrastructure-neutral deterministic repository mutation containing:

- target repository and canonical key;
- expected record revision or absence condition;
- `put` or `delete` operation;
- value or value fingerprint;
- operation-local ordering information where required.

The command fingerprint is the canonical SHA-256 identity of the logical command.

The plan fingerprint identifies the exact complete prepared write set.

Before journal persistence, validation rejects:

- unknown write kinds;
- duplicate target writes;
- cross-session writes;
- cross-track writes;
- missing required writes;
- unexpected writes;
- invalid expected revisions;
- an incomplete operation plan.

The journal provides logical atomicity and crash-consistent recovery. It does not imply that the underlying engine physically commits every record in one native transaction.

## Practice submit

Practice submit follows:

```txt
validate and freeze response
→ build deterministic attempt, session, evidence, and review outcome
→ persist complete mutation journal
→ allow feedback or transition
→ materialize canonical writes idempotently
→ verify every materialized record
→ clear journal
```

No feedback or advance occurs before journal durability.

Retry and force-close recovery execute the same prepared write plan and cannot create a second attempt or duplicate review mutation.

## Algorithms Interview Simulation finalization

Manual submission or foreground-timer exhaustion freezes one exact durable draft revision.

Finalization follows:

```txt
freeze durable draft revision
→ reject further draft mutations
→ build deterministic attempts, completed-session result, and review mutations
→ persist complete finalize_training_session journal
→ materialize all canonical writes idempotently
→ verify attempts, review mutations, completed session, and draft deletion
→ clear journal
→ expose canonical summary
```

The finalization write plan includes:

- one immutable attempt for every answered occurrence;
- zero attempts for unanswered occurrences;
- deterministic review mutations for eligible finalized outcomes;
- one completed-session result containing unanswered diagnostics;
- deletion of the simulation draft;
- removal of the active-session designation.

No attempt, score, review mutation, or instructional feedback exists before finalization.

A failed materialization leaves the simulation frozen and recoverable from the durable journal and draft revision. It must not reopen editable state or create a second finalization outcome.

Summary navigation occurs only after materialization has been verified.

## Certification exam profile

```ts
type ExamSectionProfile = {
  sectionId: string;
  title: string;
  questionCount: number | { min: number; max: number };
  durationMinutes?: number;
};

type ExamExperienceProfile = {
  profileId: string;
  profileVersion: string;
  sourceUrl: string;
  sourceCheckedAt: string;
  examGuideVersion?: string;
  durationMinutes: number;
  questionCount: number | { min: number; max: number };
  navigationPolicy: "linear_no_return" | "previous_next" | "free_navigation";
  answerChangePolicy:
    | "locked_after_submit"
    | "editable_until_section_submit"
    | "editable_until_final_submit";
  flaggingPolicy: "not_available" | "available";
  navigatorPolicy:
    | "not_available"
    | "answered_unanswered"
    | "answered_unanswered_flagged";
  sectionPolicy:
    | {
        kind: "single_section";
      }
    | {
        kind: "multiple_sections";
        sections: readonly ExamSectionProfile[];
        canReturnToCompletedSection: boolean;
      };
  timeoutPolicy: "automatic_final_submit";
};
```

A certification session configuration snapshot identifies the exact `profileId` and `profileVersion` used during preparation.

Resume fails explicitly when the required profile or content version cannot be resolved. Runtime never substitutes a newer profile or global default.

## Excluded historical models

The target does not contain:

- historical item maps;
- obsolete explanation reconstruction;
- confidence fields;
- translated old records;
- AsyncStorage records;
- dual old/new schemas;
- compatibility payloads;
- fallback answers;
- fallback topics;
- fallback content items.
