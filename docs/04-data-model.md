# 04 — Data Model

## Core contracts

```ts
type AlgorithmsMode =
  | 'Learn Approach' | 'Guided Practice' | 'Recognize Patterns'
  | 'Contrast Practice' | 'Weak Area Review' | 'Independent Practice'
  | 'Interview Simulation';

type ReviewSource = 'due_queue' | 'session_misses';
type ResultKind = 'correct' | 'partial' | 'incorrect';

type TrainingSession = {
  id: string;
  trackId: string;
  modeId: string;
  configurationSnapshot: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  requestedLength: number;
  actualLength: number;
  currentItemIndex: number;
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

type ReinsertPolicy = {
  enabled: boolean;
  maxReinserts: 1;
  minimumSubmittedItemsBetweenAttempts: 2;
  onInsufficientRemainingItems: 'skip';
};

type EvidenceModel = {
  evidenceVolume: unknown;
  learningStageEvidence: unknown;
  performanceSignals: unknown;
};
```

`TrainingAttempt` is immutable and stores deterministic response, result, score, review evidence, and committed time. It has no confidence field. One active session exists. Current selection is UI state and is never persisted.

## Scoring models

Multiple-choice practice is correct only when the selected set equals the correct set; it is partial only for a non-empty proper correct subset without wrong options; any wrong option is incorrect with zero points. In an exam only correct contributes to the correct count.

Ordering content has at least two elements. It scores preserved correct adjacent relations: for `A → B → C → D`, evaluate `A→B`, `B→C`, and `C→D`; `maxPoints = itemCount - 1`. All relations are correct, some but not all are partial, and zero is incorrect.

Complexity content declares its checked dimensions, available values, accepted values or normalized aliases, and optional shared preset. It awards one point per checked dimension. Time-only and space-only items are valid; there is no closed global class list.

## Review and reinsert

Review resolution requires two successful review attempts after `dueAt`; attempts before it do not increment success, and incorrect or partial resets the consecutive count. A same-session correction does not resolve persistent review. Reinsert is enabled only for `Guided Practice` and Algorithms `Weak Area Review` with `source = due_queue` or `source = session_misses`; it is disabled in every other Algorithms mode. It is maximum once for the original failed or partial attempt and requires at least two other submitted items between attempts. It prefers a reviewed variant of the same mechanism and may use the exact original item only when no reviewed compatible variant exists. The reinsert creates a separate attempt, preserves both attempts in diagnostics, and never removes the first error.

If the already selected session plan cannot provide two other submitted items before completion, skip the reinsert as a normal outcome. Do not extend or reorder the session, duplicate unrelated items, widen taxonomy, or insert generic content. Skipping does not change persistent review scheduling or resolve the review entry.

## Durable storage model

```ts
type MutationJournal = {
  journalId: `journal:${string}`;
  operation:
    | 'submit_training_outcome'
    | 'complete_training_session'
    | 'abandon_training_session'
    | 'finalize_certification_exam'
    | 'set_review_entry'
    | 'remove_review_entry';
  status: 'prepared';
  createdAt: string;
  sessionId: string;
  trackId: string;
  commandFingerprint: string;
  planFingerprint: string;
  writes: readonly JournalWrite[];
};
```

The command fingerprint is a canonical SHA-256 identity and the plan fingerprint detects changes to the exact prepared write plan. Each operation admits only its complete, scoped write set; unknown, duplicate, cross-session, or incomplete writes are rejected before persistence. Submit validates and freezes, builds a deterministic attempt/session/review outcome, persists this journal, then exposes feedback or transition, materializes canonical records, verifies materialization, and clears the journal. Retry and force-close recovery are idempotent.

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
