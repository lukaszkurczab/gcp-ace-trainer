import {
  ALGORITHMS_TRACK_ID,
  accumulateTrainingSessionForegroundTime,
  abandonTrainingSession,
  completeTrainingSession,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionDraft,
  moveTrainingSessionToIndex,
  setTrainingSessionOccurrenceFlagged,
  type ReviewQueueEntry,
  type ContentItemRef,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import { areTrainingSessionConfigurationsEqual } from "../../domain";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import type { AlgorithmContentCatalog } from "../../tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHM_MODE_IDS,
  createAlgorithmReviewEntry,
  decideAlgorithmReinsert,
  getAlgorithmQuestionEntries,
  getAlgorithmMode,
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  scoreAlgorithmQuestion,
  updateAlgorithmReviewEntry,
  type AlgorithmModeDefinition,
  type AlgorithmModeId,
  type AlgorithmQuestion,
  type AlgorithmQuestionScore,
  type AlgorithmResponse,
  type AlgorithmReviewSource,
  type AlgorithmRoadmapNodeId,
  type SelectAlgorithmSessionItemsInput,
} from "../../tracks/algorithms";
import type { TrainingSessionFinalizationReviewMutation } from "../learningMutations";
import { assertTrainingSessionOptionPlan, getTrainingSessionProgress } from "../trainingSessions";
export type AlgorithmsRuntimeStartInput = Readonly<{
  modeId: AlgorithmModeId;
  nodeId: AlgorithmRoadmapNodeId;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
}>;

export type AlgorithmsRuntimeSummary = Readonly<{
  completed: number;
  correct: number;
  incorrect: number;
  partial: number;
  unansweredItemIds: readonly string[];
  unansweredOccurrenceIds: readonly string[];
}>;

export type AlgorithmsRuntimeFeedback = Readonly<{ questionId: string; score: AlgorithmQuestionScore }>;

export type AlgorithmsRuntimeAnswerState = "unanswered" | "partial" | "complete";
export type AlgorithmsRuntimeNavigatorOccurrence = Readonly<{
  occurrenceId: string;
  index: number;
  answerState: AlgorithmsRuntimeAnswerState;
  flagged: boolean;
}>;
export type AlgorithmsRuntimeNavigator = Readonly<{
  occurrences: readonly AlgorithmsRuntimeNavigatorOccurrence[];
  counts: Readonly<{ total: number; unanswered: number; partial: number; complete: number; flagged: number }>;
}>;

export type AlgorithmsRuntimeState = Readonly<{
  attempts: readonly TrainingAttempt<AlgorithmResponse>[];
  currentQuestion: AlgorithmQuestion;
  draftResponsesByOccurrenceId: Readonly<Record<string, AlgorithmResponse>>;
  feedback: AlgorithmsRuntimeFeedback | null;
  mode: AlgorithmModeDefinition;
  navigator: AlgorithmsRuntimeNavigator;
  questions: readonly AlgorithmQuestion[];
  remainingMs: number | null;
  session: TrainingSession;
  summary: AlgorithmsRuntimeSummary | null;
}>;

export type AlgorithmsRuntimeDependencies = Readonly<{
  catalog(): AlgorithmContentCatalog;
  commitCompletion(session: TrainingSession, createdAt: string): Promise<void>;
  commitAbandonment(session: TrainingSession, createdAt: string): Promise<void>;
  commitFinalization(input: { session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; reviewMutations: readonly TrainingSessionFinalizationReviewMutation[]; cleanup: { kind: "training_session_draft"; draft: TrainingSessionDraft; submittedOccurrenceIds: readonly string[] }; createdAt: string }): Promise<void>;
  commitOutcome(input: { attempt: TrainingAttempt<unknown>; session: TrainingSession; reviews: readonly ReviewQueueEntry[]; resolvedReviews?: readonly ReviewQueueEntry[]; createdAt: string }): Promise<void>;
  commitStart(input: { session: TrainingSession; draft: TrainingSessionDraft | null; createdAt: string }): Promise<void>;
  createAttemptId(sessionId: string, occurrenceId: string, response: unknown): Promise<string>;
  createSessionId(now: string): string;
  getActiveDraft(): Promise<TrainingSessionDraft | null>;
  getActiveSession(): Promise<TrainingSession | null>;
  getAttempts(): Promise<readonly TrainingAttempt<unknown>[]>;
  getReviews(): Promise<readonly ReviewQueueEntry[]>;
  now(): string;
  planOptionIds(question: AlgorithmQuestion): readonly string[];
  resolveNextOccurrenceIndex(input: Readonly<{ attempts: readonly TrainingAttempt<AlgorithmResponse>[]; questions: readonly AlgorithmQuestion[]; session: TrainingSession }>): number;
  saveDraft(draft: TrainingSessionDraft): Promise<void>;
  saveSession(session: TrainingSession): Promise<void>;
  select(input: SelectAlgorithmSessionItemsInput): readonly AlgorithmQuestion[];
}>;

export class AlgorithmsFamilyRuntime {
  private attempts: TrainingAttempt<AlgorithmResponse>[] = [];
  private draft: TrainingSessionDraft | null = null;
  private feedback: AlgorithmsRuntimeFeedback | null = null;
  private catalog: AlgorithmContentCatalog | null = null;
  private input: AlgorithmsRuntimeStartInput | null = null;
  private mode: AlgorithmModeDefinition | null = null;
  private questions: readonly AlgorithmQuestion[] = [];
  private session: TrainingSession | null = null;
  private summary: AlgorithmsRuntimeSummary | null = null;
  private transientResponse: AlgorithmResponse | null = null;
  private readonly reinsertedSourceOccurrenceIds = new Set<string>();
  private reviewedItemRefs: ContentItemRef[] = [];
  private readonly scheduledReinsertSourceByTarget = new Map<string, string>();
  private finalizationPromise: Promise<AlgorithmsRuntimeState> | null = null;
  private finalizationCreatedAt: string | null = null;
  private finalizationForegroundElapsedMs = 0;
  private finalizationElapsedCutoffReached = false;
  private simulationMutationTail: Promise<void> = Promise.resolve();
  private simulationAbandonmentPromise: Promise<AlgorithmsRuntimeState> | null = null;

  constructor(private readonly dependencies: AlgorithmsRuntimeDependencies) {}

  async start(input: AlgorithmsRuntimeStartInput): Promise<AlgorithmsRuntimeState> {
    if (this.session) throw new Error("Algorithms runtime is already started.");
    const mode = getAlgorithmMode(input.modeId);
    const catalog = this.dependencies.catalog();
    const active = await this.dependencies.getActiveSession();
    let session: TrainingSession;
    let questions: readonly AlgorithmQuestion[];
    let createdDraft: TrainingSessionDraft | null = null;
    if (active) {
      if (active.status !== "active") throw new Error("The active Algorithms session slot contains a terminal session.");
      if (active.trackId !== ALGORITHMS_TRACK_ID) throw new Error(`Active ${active.trackId} session must be finalized or abandoned first.`);
      if (active.modeId !== mode.id || !areTrainingSessionConfigurationsEqual(active.configurationSnapshot, configuration(mode, input))) throw new Error("Active Algorithms session configuration does not match the requested mode-owned profile.");
      session = active;
      questions = active.itemOrder.map((occurrence) => catalog.getItemById(occurrence.item.itemId));
    } else {
      const [attempts, reviews] = await Promise.all([this.dependencies.getAttempts(), this.dependencies.getReviews()]);
      questions = this.dependencies.select({ attempts, contentCatalog: catalog, mode: mode.id, nodeId: input.nodeId, now: this.dependencies.now(), reviewItemRefs: input.reviewItemRefs, reviewQueueItems: reviews, reviewSource: input.reviewSource, sessionLength: mode.profile.sessionLength });
      assertSelectedLength(mode, questions.length);
      validateQuestions(mode, questions, catalog.getContentVersion());
      const startedAt = this.dependencies.now();
      const sessionId = this.dependencies.createSessionId(startedAt);
      const itemOrder = questions.map((question, index) => ({ occurrenceId: `${sessionId}:occurrence:${index}`, item: catalog.toContentItemRef(question) }));
      const optionOrderByOccurrence = Object.fromEntries(questions.map((question, index) => [itemOrder[index]!.occurrenceId, [...this.dependencies.planOptionIds(question)]]));
      session = createTrainingSession({ id: sessionId, trackId: ALGORITHMS_TRACK_ID, modeId: mode.id, configurationSnapshot: configuration(mode, input), requestedLength: mode.profile.sessionLength, actualLength: questions.length, currentItemIndex: 0, itemOrder, optionOrderByOccurrence, flaggedOccurrenceIds: [], activeForegroundMs: 0, contentVersion: catalog.getContentVersion(), status: "active", startedAt });
      validateSessionContent(session, questions);
      createdDraft = mode.id === ALGORITHM_MODE_IDS.interviewSimulation
        ? createTrainingSessionDraft({ sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, updatedAt: startedAt })
        : null;
      await this.dependencies.commitStart({ session, draft: createdDraft, createdAt: startedAt });
    }
    assertSelectedLength(mode, session.actualLength);
    validateQuestions(mode, questions, catalog.getContentVersion());
    validateSessionContent(session, questions);
    const allAttempts = await this.dependencies.getAttempts();
    const allReviews = await this.dependencies.getReviews();
    const progress = getTrainingSessionProgress(session, allAttempts.filter(isAlgorithmAttempt));
    this.attempts = [...progress.attempts];
    if (mode.id === ALGORITHM_MODE_IDS.interviewSimulation && this.attempts.length > 0) throw new Error("Active Interview Simulation cannot contain pre-finalization attempts.");
    for (const attempt of this.attempts) {
      const questionIndex = session.itemOrder.findIndex(
        (occurrence) => occurrence.occurrenceId === attempt.occurrenceId,
      );
      const question = questionIndex >= 0 ? questions[questionIndex] : undefined;
      if (!question) {
        throw new Error(
          `Algorithms session ${session.id} contains an attempt for unknown occurrence ${attempt.occurrenceId}.`,
        );
      }
      validateHydratedAttempt(session, question, attempt);
    }
    this.reviewedItemRefs = uniqueItemRefs([...allAttempts.map((attempt) => attempt.item), ...allReviews.map((review) => review.sourceItem)]);
    this.catalog = catalog;
    this.input = input;
    this.mode = mode;
    this.questions = questions;
    this.session = session;
    if (progress.currentAttempt && mode.profile.feedbackMode === "afterEachAnswer") {
      const question = questions[session.currentItemIndex]!;
      this.feedback = Object.freeze({ questionId: question.id, score: scoreAlgorithmQuestion(question, progress.currentAttempt.response) });
    }
    hydrateReinsertedSources(this.reinsertedSourceOccurrenceIds, this.attempts, session, questions);
    this.refreshScheduledReinserts(session);
    if (mode.id === ALGORITHM_MODE_IDS.interviewSimulation) {
      const storedDraft = createdDraft ?? await this.dependencies.getActiveDraft();
      if (storedDraft && (storedDraft.sessionId !== session.id || storedDraft.trackId !== session.trackId)) throw new Error("Persisted Algorithms draft does not match the active session.");
      if (!storedDraft) throw new Error("Active Interview Simulation is missing its atomically persisted draft.");
      this.draft = storedDraft;
      validateDraftResponses(this.draft, session, questions);
    } else if (await this.dependencies.getActiveDraft()) {
      throw new Error("Immediate-feedback Algorithms sessions cannot own persisted drafts.");
    }
    return this.getState();
  }

  getState(): AlgorithmsRuntimeState {
    const { mode, session } = this.requireStarted();
    const currentQuestion = this.questions[session.currentItemIndex];
    if (!currentQuestion) throw new Error("Current Algorithms question is unavailable.");
    return Object.freeze({ attempts: [...this.attempts], currentQuestion, draftResponsesByOccurrenceId: this.draft ? draftResponses(this.draft, session, this.questions) : {}, feedback: this.feedback, mode, navigator: buildNavigatorProjection(session, this.questions, this.draft, this.attempts), questions: this.questions, remainingMs: mode.profile.timer.kind === "countdownForeground" ? Math.max(0, mode.profile.timer.durationMs - session.activeForegroundMs) : null, session, summary: this.summary });
  }

  getScheduledReinsertAssignments(): Readonly<Record<string, string>> {
    return Object.freeze(Object.fromEntries(this.scheduledReinsertSourceByTarget));
  }

  setTransientResponse(response: AlgorithmResponse | null): void {
    const { mode } = this.requireStarted();
    if (mode.profile.feedbackMode !== "afterEachAnswer") throw new Error("Interview Simulation responses must use persisted draft handlers.");
    if (this.feedback) throw new Error("The submitted response is immutable.");
    this.transientResponse = response;
  }

  async submitCurrent(foregroundElapsedMs = 0): Promise<AlgorithmsRuntimeState> {
    const { mode, session } = this.requireStarted();
    if (mode.profile.feedbackMode !== "afterEachAnswer") throw new Error("Interview Simulation finalizes as one submitted draft.");
    if (this.feedback) throw new Error("The current occurrence is already submitted.");
    const question = this.questions[session.currentItemIndex]!;
    const response = this.transientResponse;
    assertCompleteAlgorithmResponse(question, response);
    const timedSession = accumulateTrainingSessionForegroundTime(session, foregroundElapsedMs);
    const attempt = await this.createAttempt(timedSession, question, response, this.dependencies.now());
    const score = scoreAlgorithmQuestion(question, response);
    const existing = (await this.dependencies.getReviews()).find((entry) => sameContent(entry.sourceItem, attempt.item));
    const created = createAlgorithmReviewEntry(attempt);
    const updated = existing ? updateAlgorithmReviewEntry(existing, attempt) : created;
    await this.dependencies.commitOutcome({ attempt, session: timedSession, reviews: updated ? [updated] : [], resolvedReviews: existing && !updated ? [existing] : [], createdAt: attempt.committedAt });
    this.session = timedSession;
    this.attempts.push(attempt);
    this.reviewedItemRefs = uniqueItemRefs([...this.reviewedItemRefs, attempt.item]);
    const sourceForTarget = this.scheduledReinsertSourceByTarget.get(attempt.occurrenceId);
    if (sourceForTarget) this.reinsertedSourceOccurrenceIds.add(sourceForTarget);
    this.feedback = Object.freeze({ questionId: question.id, score });
    return this.getState();
  }

  async continueAfterFeedback(foregroundElapsedMs = 0): Promise<AlgorithmsRuntimeState> {
    const { mode, session } = this.requireStarted();
    if (mode.profile.feedbackMode !== "afterEachAnswer" || !this.feedback) throw new Error("A durable submitted response is required before continuing.");
    const timed = accumulateTrainingSessionForegroundTime(session, foregroundElapsedMs);
    if (this.attempts.length === session.actualLength) {
      const completed = completeTrainingSession(timed, this.dependencies.now());
      await this.dependencies.commitCompletion(completed, completed.completedAt!);
      this.session = completed;
      this.summary = buildRuntimeSummary(this.attempts, []);
      return this.getState();
    }
    let nextIndex: number;
    this.refreshScheduledReinserts(timed);
    const preferred = this.dependencies.resolveNextOccurrenceIndex({ attempts: this.attempts, questions: this.questions, session: timed });
    const submitted = new Set(this.attempts.map((attempt) => attempt.occurrenceId));
    nextIndex = !submitted.has(timed.itemOrder[preferred]?.occurrenceId ?? "")
      ? preferred
      : timed.itemOrder.findIndex((occurrence) => !submitted.has(occurrence.occurrenceId));
    if (nextIndex < 0) throw new Error("Algorithms session has no unsubmitted occurrence to continue.");
    const next = moveTrainingSessionToIndex(timed, nextIndex);
    await this.dependencies.saveSession(next);
    this.session = next;
    this.feedback = null;
    this.transientResponse = null;
    return this.getState();
  }

  async saveSimulationResponse(occurrenceId: string, response: AlgorithmResponse | null): Promise<AlgorithmsRuntimeState> {
    this.assertSimulationWritable();
    return this.enqueueSimulationMutation(async () => {
      const { mode, session } = this.requireStarted();
      if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation || !this.draft) throw new Error("Persisted response editing is available only in Interview Simulation.");
      const index = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === occurrenceId);
      if (index < 0) throw new Error(`Unknown Algorithms session occurrence: ${occurrenceId}`);
      if (response) assertAlgorithmResponseStructure(this.questions[index]!, response);
      const responses = { ...this.draft.responsesByOccurrenceId };
      if (response) responses[occurrenceId] = response;
      else delete responses[occurrenceId];
      const next = createTrainingSessionDraft({ ...this.draft, responsesByOccurrenceId: responses, updatedAt: nextTimestamp(this.draft.updatedAt, this.dependencies.now()) });
      await this.dependencies.saveDraft(next);
      this.draft = next;
      return this.getState();
    });
  }

  async moveSimulationToIndex(index: number, foregroundElapsedMs = 0): Promise<AlgorithmsRuntimeState> {
    this.assertSimulationWritable();
    return this.enqueueSimulationMutation(async () => {
      const { mode, session } = this.requireStarted();
      if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Free navigation is available only in Interview Simulation.");
      const next = moveTrainingSessionToIndex(accumulateTrainingSessionForegroundTime(session, foregroundElapsedMs), index);
      await this.dependencies.saveSession(next);
      this.session = next;
      return this.getState();
    });
  }

  async setSimulationFlag(occurrenceId: string, flagged?: boolean): Promise<AlgorithmsRuntimeState> {
    this.assertSimulationWritable();
    return this.enqueueSimulationMutation(async () => {
      const { mode, session } = this.requireStarted();
      if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Occurrence flags are available only in Interview Simulation.");
      const next = setTrainingSessionOccurrenceFlagged(session, occurrenceId, flagged ?? !session.flaggedOccurrenceIds.includes(occurrenceId));
      await this.dependencies.saveSession(next);
      this.session = next;
      return this.getState();
    });
  }

  abandonSimulation(): Promise<AlgorithmsRuntimeState> {
    this.assertSimulationWritable();
    const operation = this.enqueueSimulationMutation(async () => {
      const { mode, session } = this.requireStarted();
      if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation || !this.draft) throw new Error("Only an active Interview Simulation can be abandoned.");
      const abandonedAt = this.dependencies.now();
      const abandoned = abandonTrainingSession(session, abandonedAt);
      await this.dependencies.commitAbandonment(abandoned, abandonedAt);
      this.session = abandoned;
      this.draft = null;
      return this.getState();
    });
    const shared = operation.finally(() => { if (this.simulationAbandonmentPromise === shared) this.simulationAbandonmentPromise = null; });
    this.simulationAbandonmentPromise = shared;
    return shared;
  }

  recordForegroundTime(elapsedMs: number): Promise<AlgorithmsRuntimeState> {
    const { mode, session } = this.requireStarted();
    if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation) {
      const next = accumulateTrainingSessionForegroundTime(session, elapsedMs);
      return this.dependencies.saveSession(next).then(() => { this.session = next; return this.getState(); });
    }
    if (this.finalizationCreatedAt && !this.finalizationPromise) return Promise.reject(new Error("Interview Simulation has a pending finalization that must be retried before foreground time can change."));
    const next = accumulateTrainingSessionForegroundTime(session, elapsedMs);
    const expires = mode.profile.timer.kind === "countdownForeground" && Math.max(0, mode.profile.timer.durationMs - next.activeForegroundMs) === 0;
    if (this.finalizationPromise) {
      if (expires) return this.finalizeSimulation(elapsedMs);
      return Promise.reject(new Error("Interview Simulation finalization is already in progress."));
    }
    if (this.simulationAbandonmentPromise) return Promise.reject(new Error("Interview Simulation abandonment is already in progress."));
    return this.enqueueSimulationMutation(async () => {
      const { mode: queuedMode, session: queuedSession } = this.requireStarted();
      const queuedNext = accumulateTrainingSessionForegroundTime(queuedSession, elapsedMs);
      const queuedExpires = queuedMode.profile.timer.kind === "countdownForeground" && Math.max(0, queuedMode.profile.timer.durationMs - queuedNext.activeForegroundMs) === 0;
      if (!queuedExpires) {
        await this.dependencies.saveSession(queuedNext);
        this.session = queuedNext;
        return this.getState();
      }
      this.noteFinalizationForegroundElapsed(elapsedMs);
      if (this.finalizationPromise) return this.getState();
      return this.startSimulationFinalizationFromCurrentMutation();
    });
  }

  finalizeSimulation(foregroundElapsedMs = 0): Promise<AlgorithmsRuntimeState> {
    const { mode } = this.requireStarted();
    if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only Interview Simulation uses batch finalization.");
    if (this.summary) return Promise.resolve(this.getState());
    if (this.simulationAbandonmentPromise) return Promise.reject(new Error("Interview Simulation abandonment is already in progress."));
    try {
      this.noteFinalizationForegroundElapsed(foregroundElapsedMs);
    } catch (error) {
      return Promise.reject(error);
    }
    if (this.finalizationPromise) return this.finalizationPromise;
    const operation = this.enqueueSimulationMutation(() => this.startSimulationFinalizationFromCurrentMutation(true));
    const shared = operation.finally(() => { if (this.finalizationPromise === shared) this.finalizationPromise = null; });
    this.finalizationPromise = shared;
    return shared;
  }

  private async performSimulationFinalization(session: TrainingSession, draft: TrainingSessionDraft): Promise<AlgorithmsRuntimeState> {
    const completedAt = this.finalizationCreatedAt ?? this.dependencies.now();
    this.finalizationCreatedAt = completedAt;
    const attempts: TrainingAttempt<AlgorithmResponse>[] = [];
    for (const occurrence of session.itemOrder) {
      const response = draft.responsesByOccurrenceId[occurrence.occurrenceId];
      if (response === undefined) continue;
      const question = this.questions[session.itemOrder.indexOf(occurrence)]!;
      if (!isCompleteAlgorithmResponse(question, response)) continue;
      attempts.push(await this.createAttempt(session, question, response, completedAt, occurrence.occurrenceId));
    }
    this.finalizationElapsedCutoffReached = true;
    const timed = accumulateTrainingSessionForegroundTime(session, this.finalizationForegroundElapsedMs);
    const reviewMutations = buildFinalizationReviewMutations(attempts, await this.dependencies.getReviews());
    const completed = completeTrainingSession(timed, completedAt);
    const submittedOccurrenceIds = attempts.map((attempt) => attempt.occurrenceId);
    await this.dependencies.commitFinalization({ session: completed, attempts, reviewMutations, cleanup: { kind: "training_session_draft", draft, submittedOccurrenceIds }, createdAt: completedAt });
    const answered = new Set(attempts.map((attempt) => attempt.occurrenceId));
    const unanswered = completed.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId));
    this.session = completed;
    this.attempts = attempts;
    this.draft = null;
    this.summary = buildRuntimeSummary(attempts, unanswered);
    this.finalizationCreatedAt = null;
    this.finalizationForegroundElapsedMs = 0;
    this.finalizationElapsedCutoffReached = false;
    return this.getState();
  }

  private enqueueSimulationMutation<T>(command: () => Promise<T>): Promise<T> {
    const result = this.simulationMutationTail.then(command);
    this.simulationMutationTail = result.then(() => undefined, () => undefined);
    return result;
  }

  private assertSimulationWritable(): void {
    if (this.finalizationPromise || this.finalizationCreatedAt) throw new Error("Interview Simulation finalization is in progress or pending recovery.");
    if (this.simulationAbandonmentPromise) throw new Error("Interview Simulation abandonment is in progress.");
  }

  private noteFinalizationForegroundElapsed(elapsedMs: number): void {
    if (elapsedMs <= this.finalizationForegroundElapsedMs) return;
    if (this.finalizationElapsedCutoffReached) throw new Error("Interview Simulation finalization no longer accepts foreground time after its durable payload cutoff.");
    this.finalizationForegroundElapsedMs = elapsedMs;
  }

  private startSimulationFinalizationFromCurrentMutation(reservedByQueuedCommand = false): Promise<AlgorithmsRuntimeState> {
    const { mode, session } = this.requireStarted();
    if (mode.id !== ALGORITHM_MODE_IDS.interviewSimulation || !this.draft) throw new Error("Only Interview Simulation uses batch finalization.");
    if (this.summary) return Promise.resolve(this.getState());
    if (this.finalizationPromise && !reservedByQueuedCommand) return this.finalizationPromise;
    const operation = this.performSimulationFinalization(session, this.draft);
    if (reservedByQueuedCommand) return operation;
    const shared = operation.finally(() => { if (this.finalizationPromise === shared) this.finalizationPromise = null; });
    this.finalizationPromise = shared;
    return shared;
  }

  private async createAttempt(session: TrainingSession, question: AlgorithmQuestion, response: AlgorithmResponse, answeredAt: string, occurrenceId = session.itemOrder[session.currentItemIndex]!.occurrenceId): Promise<TrainingAttempt<AlgorithmResponse>> {
    const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === occurrenceId);
    if (!occurrence || occurrence.item.itemId !== question.id || occurrence.item.contentVersion !== question.contentVersion) throw new Error("Algorithms response does not match its session occurrence.");
    const score = scoreAlgorithmQuestion(question, response);
    return createTrainingAttempt({ id: await this.dependencies.createAttemptId(session.id, occurrenceId, response), sessionId: session.id, trackId: ALGORITHMS_TRACK_ID, modeId: session.modeId, occurrenceId, item: occurrence.item, response, result: score.result, reviewEvidence: algorithmReviewEvidence(question, occurrence.item, score), answeredAt, committedAt: answeredAt });
  }

  private requireStarted(): { mode: AlgorithmModeDefinition; session: TrainingSession } {
    if (!this.mode || !this.session) throw new Error("Algorithms runtime has not started.");
    return { mode: this.mode, session: this.session };
  }

  private refreshScheduledReinserts(session: TrainingSession): void {
    if (!this.catalog || !this.mode) throw new Error("Algorithms runtime content is unavailable.");
    const submittedOccurrenceIds = new Set(this.attempts.map((attempt) => attempt.occurrenceId));
    for (const source of this.attempts) {
      const decision = decideAlgorithmReinsert({ entries: getAlgorithmQuestionEntries(this.catalog.getGroups()), mode: this.mode.id, plan: session.itemOrder, reinsertedSourceOccurrenceIds: this.reinsertedSourceOccurrenceIds, reviewedItemRefs: this.reviewedItemRefs, reviewSource: this.input?.reviewSource, sourceOccurrenceId: source.occurrenceId, sourceResult: source.result.kind, submittedOccurrenceIds });
      if (decision.kind === "scheduled") {
        if (!this.scheduledReinsertSourceByTarget.has(decision.targetOccurrence.occurrenceId)) this.scheduledReinsertSourceByTarget.set(decision.targetOccurrence.occurrenceId, source.occurrenceId);
      }
    }
  }
}

export function assertCompleteAlgorithmResponse(question: AlgorithmQuestion, response: unknown): asserts response is AlgorithmResponse {
  assertAlgorithmResponseStructure(question, response);
  if (isAlgorithmChoiceQuestion(question)) {
    const selected = (response as Extract<AlgorithmResponse, { kind: "choice" }>).selectedOptionIds;
    if (selected.length === 0) throw new Error(`Algorithms response is incomplete or invalid for ${question.id}.`);
    return;
  }
  if (isAlgorithmOrderingQuestion(question)) {
    const ordered = (response as Extract<AlgorithmResponse, { kind: "ordering" }>).orderedSubgoalIds;
    if (ordered.length !== question.correctOrder.length) throw new Error(`Algorithms response is incomplete or invalid for ${question.id}.`);
    return;
  }
  if (isAlgorithmComplexityQuestion(question)) {
    const selected = (response as Extract<AlgorithmResponse, { kind: "complexity" }>).selectedValuesByDimension;
    const dimensions = new Set(question.correctComplexity.dimensions.map((dimension) => dimension.id));
    if (Object.keys(selected).length !== dimensions.size || question.correctComplexity.dimensions.some((dimension) => !selected[dimension.id])) throw new Error(`Algorithms complexity response is incomplete for ${question.id}.`);
    return;
  }
  throw new Error(`Unsupported Algorithms question: ${JSON.stringify(question)}`);
}

export function assertAlgorithmResponseStructure(question: AlgorithmQuestion, response: unknown): asserts response is AlgorithmResponse {
  if (!response || typeof response !== "object") throw new Error(`Algorithms response is invalid for ${question.id}.`);
  if (isAlgorithmChoiceQuestion(question)) {
    if ((response as AlgorithmResponse).kind !== "choice") throw new Error(`Algorithms response kind is invalid for ${question.id}.`);
    const selected = (response as Extract<AlgorithmResponse, { kind: "choice" }>).selectedOptionIds;
    const valid = new Set(question.options.map((option) => option.id));
    if (!Array.isArray(selected) || new Set(selected).size !== selected.length || selected.some((id) => typeof id !== "string" || !valid.has(id))) throw new Error(`Algorithms response is invalid for ${question.id}.`);
    return;
  }
  if (isAlgorithmOrderingQuestion(question)) {
    if ((response as AlgorithmResponse).kind !== "ordering") throw new Error(`Algorithms response kind is invalid for ${question.id}.`);
    const ordered = (response as Extract<AlgorithmResponse, { kind: "ordering" }>).orderedSubgoalIds;
    if (!Array.isArray(ordered) || ordered.length > question.correctOrder.length || new Set(ordered).size !== ordered.length || ordered.some((id) => typeof id !== "string" || !question.correctOrder.includes(id))) throw new Error(`Algorithms response is invalid for ${question.id}.`);
    return;
  }
  if (isAlgorithmComplexityQuestion(question)) {
    if ((response as AlgorithmResponse).kind !== "complexity") throw new Error(`Algorithms response kind is invalid for ${question.id}.`);
    const selected = (response as Extract<AlgorithmResponse, { kind: "complexity" }>).selectedValuesByDimension;
    if (!selected || typeof selected !== "object" || Array.isArray(selected)) throw new Error(`Algorithms complexity response is invalid for ${question.id}.`);
    const dimensions = new Map(question.correctComplexity.dimensions.map((dimension) => [dimension.id, dimension]));
    if (Object.entries(selected).some(([id, value]) => { const dimension = dimensions.get(id as "time" | "space"); return !dimension || typeof value !== "string" || ![...dimension.values, ...(dimension.acceptedAliases ?? [])].includes(value); })) throw new Error(`Algorithms complexity response is invalid for ${question.id}.`);
    return;
  }
  throw new Error(`Unsupported Algorithms question: ${JSON.stringify(question)}`);
}

function isCompleteAlgorithmResponse(question: AlgorithmQuestion, response: unknown): response is AlgorithmResponse {
  try { assertCompleteAlgorithmResponse(question, response); return true; } catch { return false; }
}

function configuration(mode: AlgorithmModeDefinition, input: AlgorithmsRuntimeStartInput): TrainingSession["configurationSnapshot"] {
  return { answerChanges: mode.profile.answerChanges, feedbackMode: mode.profile.feedbackMode, kind: "algorithms", mode: mode.id, navigation: mode.profile.navigation, nodeId: input.nodeId, reinsertEnabled: mode.profile.reinsertEnabled, reviewItemRefs: (input.reviewItemRefs ?? []).map((item) => canonicalSerialize(item)), reviewSource: input.reviewSource ?? "none", sessionLength: mode.profile.sessionLength, submission: mode.profile.submission, timer: mode.profile.timer.kind, timerDurationMs: mode.profile.timer.kind === "countdownForeground" ? mode.profile.timer.durationMs : 0 };
}

function validateHydratedAttempt(session: TrainingSession, question: AlgorithmQuestion, attempt: TrainingAttempt<AlgorithmResponse>): void {
  assertCompleteAlgorithmResponse(question, attempt.response);
  const score = scoreAlgorithmQuestion(question, attempt.response);
  if (canonicalJson(score.result) !== canonicalJson(attempt.result)) throw new Error(`Algorithms attempt ${attempt.id} contradicts canonical scoring.`);
  const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === attempt.occurrenceId);
  if (!occurrence) throw new Error(`Algorithms attempt ${attempt.id} is outside the durable occurrence plan.`);
  const expectedEvidence = algorithmReviewEvidence(question, occurrence.item, score);
  if (canonicalJson(expectedEvidence) !== canonicalJson(attempt.reviewEvidence)) throw new Error(`Algorithms attempt ${attempt.id} contradicts canonical review evidence.`);
}

function canonicalJson(value: unknown): string { return canonicalSerialize(JSON.parse(JSON.stringify(value))); }

function algorithmReviewEvidence(question: AlgorithmQuestion, item: ContentItemRef, score: AlgorithmQuestionScore): TrainingAttempt<AlgorithmResponse>["reviewEvidence"] {
  return { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "algorithm-skill", nodeId: question.primarySkillAtomId, role: "primary" }, ...(question.secondarySkillAtomIds ?? []).map((nodeId) => ({ axisId: "algorithm-skill", nodeId, role: "secondary" })), ...score.mistakeTypes.map((nodeId) => ({ axisId: "mistake_type", nodeId, role: "mistake_type" }))] };
}

function assertSelectedLength(mode: AlgorithmModeDefinition, actualLength: number): void {
  if (actualLength <= 0) throw new Error(`No compatible content is available for ${mode.title}.`);
  if (mode.id === ALGORITHM_MODE_IDS.weakAreaReview) {
    if (actualLength > mode.profile.sessionLength) throw new Error("Weak Area Review selection exceeds its requested length.");
    return;
  }
  if (actualLength !== mode.profile.sessionLength) throw new Error(`${mode.title} requires exactly ${mode.profile.sessionLength} compatible items; received ${actualLength}.`);
}

function validateQuestions(mode: AlgorithmModeDefinition, questions: readonly AlgorithmQuestion[], contentVersion: string): void {
  if (!contentVersion || questions.some((question) => question.contentVersion !== contentVersion || !mode.itemTypes.includes(question.type))) throw new Error("Algorithms selection does not match the active content version and mode profile.");
}

function validateSessionContent(session: TrainingSession, questions: readonly AlgorithmQuestion[]): void {
  if (session.actualLength !== questions.length || session.contentVersion !== questions[0]?.contentVersion) throw new Error("Durable Algorithms session does not match active content.");
  const expected = Object.fromEntries(session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, optionIds(questions[index]!) ]));
  if (Object.keys(session.optionOrderByOccurrence).length !== session.itemOrder.length) throw new Error("Durable Algorithms option plan is incomplete.");
  assertTrainingSessionOptionPlan(session, expected);
  session.itemOrder.forEach((occurrence, index) => { if (occurrence.item.itemId !== questions[index]?.id || occurrence.item.contentVersion !== questions[index]?.contentVersion) throw new Error("Durable Algorithms occurrence plan conflicts with active content."); });
}

function optionIds(question: AlgorithmQuestion): readonly string[] {
  if (isAlgorithmChoiceQuestion(question)) return question.options.map((option) => option.id);
  if (isAlgorithmOrderingQuestion(question)) return question.subgoals.map((subgoal) => subgoal.id);
  return [];
}

function isAlgorithmAttempt(attempt: TrainingAttempt<unknown>): attempt is TrainingAttempt<AlgorithmResponse> {
  return attempt.trackId === ALGORITHMS_TRACK_ID;
}

function validateDraftResponses(draft: TrainingSessionDraft, session: TrainingSession, questions: readonly AlgorithmQuestion[]): void {
  for (const [occurrenceId, response] of Object.entries(draft.responsesByOccurrenceId)) {
    const index = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === occurrenceId);
    if (index < 0) throw new Error(`Draft occurrence ${occurrenceId} is outside the Algorithms session plan.`);
    assertAlgorithmResponseStructure(questions[index]!, response);
  }
}

function draftResponses(draft: TrainingSessionDraft, session: TrainingSession, questions: readonly AlgorithmQuestion[]): Readonly<Record<string, AlgorithmResponse>> {
  validateDraftResponses(draft, session, questions);
  return draft.responsesByOccurrenceId as Readonly<Record<string, AlgorithmResponse>>;
}

function buildNavigatorProjection(
  session: TrainingSession,
  questions: readonly AlgorithmQuestion[],
  draft: TrainingSessionDraft | null,
  attempts: readonly TrainingAttempt<AlgorithmResponse>[],
): AlgorithmsRuntimeNavigator {
  const responses = draft?.responsesByOccurrenceId ?? Object.fromEntries(attempts.map((attempt) => [attempt.occurrenceId, attempt.response]));
  const flagged = new Set(session.flaggedOccurrenceIds);
  const occurrences = session.itemOrder.map((occurrence, index) => {
    const response = responses[occurrence.occurrenceId];
    const answerState: AlgorithmsRuntimeAnswerState = response === undefined
      ? "unanswered"
      : isCompleteAlgorithmResponse(questions[index]!, response) ? "complete" : "partial";
    return Object.freeze({ occurrenceId: occurrence.occurrenceId, index, answerState, flagged: flagged.has(occurrence.occurrenceId) });
  });
  return Object.freeze({
    occurrences: Object.freeze(occurrences),
    counts: Object.freeze({
      total: occurrences.length,
      unanswered: occurrences.filter((occurrence) => occurrence.answerState === "unanswered").length,
      partial: occurrences.filter((occurrence) => occurrence.answerState === "partial").length,
      complete: occurrences.filter((occurrence) => occurrence.answerState === "complete").length,
      flagged: occurrences.filter((occurrence) => occurrence.flagged).length,
    }),
  });
}

function buildFinalizationReviewMutations(attempts: readonly TrainingAttempt<AlgorithmResponse>[], reviews: readonly ReviewQueueEntry[]): readonly TrainingSessionFinalizationReviewMutation[] {
  const durable = new Map(reviews.map((entry) => [contentKey(entry.sourceItem), entry]));
  const current = new Map(durable);
  const transitionByContent = new Map<string, string>();
  for (const attempt of attempts) {
    const key = contentKey(attempt.item);
    const existing = current.get(key);
    const next = existing ? updateAlgorithmReviewEntry(existing, attempt) : createAlgorithmReviewEntry(attempt);
    if (next) current.set(key, next);
    else current.delete(key);
    transitionByContent.set(key, attempt.id);
  }
  const mutations: TrainingSessionFinalizationReviewMutation[] = [];
  for (const [key, transitionAttemptId] of transitionByContent) {
    const existing = durable.get(key);
    const next = current.get(key);
    if (next) mutations.push({ action: existing ? "update" : "put", record: next, transitionAttemptId });
    else if (existing) mutations.push({ action: "delete", record: existing, transitionAttemptId });
  }
  return mutations;
}

function buildRuntimeSummary(attempts: readonly TrainingAttempt<AlgorithmResponse>[], unanswered: readonly TrainingSession["itemOrder"][number][]): AlgorithmsRuntimeSummary {
  return { completed: attempts.length, correct: attempts.filter((attempt) => attempt.result.kind === "correct").length, incorrect: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, partial: attempts.filter((attempt) => attempt.result.kind === "partial").length, unansweredItemIds: unanswered.map((occurrence) => occurrence.item.itemId), unansweredOccurrenceIds: unanswered.map((occurrence) => occurrence.occurrenceId) };
}

function nextTimestamp(previous: string, candidate: string): string {
  return Date.parse(candidate) > Date.parse(previous) ? candidate : new Date(Date.parse(previous) + 1).toISOString();
}

function sameContent(left: { trackId: string; itemId: string; contentVersion: string }, right: { trackId: string; itemId: string; contentVersion: string }): boolean { return contentKey(left) === contentKey(right); }
function contentKey(item: { trackId: string; itemId: string; contentVersion: string }): string { return `${item.trackId}:${item.contentVersion}:${item.itemId}`; }
function uniqueItemRefs(items: readonly ContentItemRef[]): ContentItemRef[] { return [...new Map(items.map((item) => [contentKey(item), item])).values()]; }

function hydrateReinsertedSources(target: Set<string>, attempts: readonly TrainingAttempt<AlgorithmResponse>[], session: TrainingSession, questions: readonly AlgorithmQuestion[]): void {
  const attemptByOccurrence = new Map(attempts.map((attempt) => [attempt.occurrenceId, attempt]));
  const skillByItem = new Map(questions.map((question) => [question.id, question.primarySkillAtomId]));
  const usedTargetOccurrenceIds = new Set<string>();
  for (const source of attempts.filter((attempt) => attempt.result.kind !== "correct")) {
    const sourceIndex = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === source.occurrenceId);
    if (sourceIndex < 0) continue;
    const laterCompatible = session.itemOrder.slice(sourceIndex + 1).find((candidate, offset) => {
      if (!attemptByOccurrence.has(candidate.occurrenceId) || usedTargetOccurrenceIds.has(candidate.occurrenceId)) return false;
      const targetIndex = sourceIndex + 1 + offset;
      const intervening = session.itemOrder.slice(sourceIndex + 1, targetIndex).filter((occurrence) => attemptByOccurrence.has(occurrence.occurrenceId)).length;
      return intervening >= 2 && (candidate.item.itemId === source.item.itemId || skillByItem.get(candidate.item.itemId) === skillByItem.get(source.item.itemId));
    });
    if (laterCompatible) {
      target.add(source.occurrenceId);
      usedTargetOccurrenceIds.add(laterCompatible.occurrenceId);
    }
  }
}
