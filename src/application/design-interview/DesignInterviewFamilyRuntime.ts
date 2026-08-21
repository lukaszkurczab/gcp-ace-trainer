import {
  completeTrainingSession,
  contentPackagePinsEqual,
  createFamilyEnvelope,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionResult,
  retainReviewQueueEntryIdentity,
  type ContentItemRef,
  type ReviewMutationCommand,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createAttemptId } from "../learningMutations/identity";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime } from "../trainingLifecycle";
import { DESIGN_INTERVIEW_MODE_IDS, type DesignInterviewModeId } from "../../tracks/design-interview/designModes";
import { scoreDesignQuestion } from "../../tracks/design-interview/designScoring";
import type { DesignInteraction, DesignQuestion } from "../../tracks/design-interview/designRuntimeCatalog";
import type { DesignResponse } from "../../tracks/design-interview/designTypes";
import type { DesignRuntimeCatalog } from "../../tracks/design-interview/designRuntimeCatalog";

export type DesignInterviewPreparationRequest = Readonly<{ sessionId: string; requestedLength?: number }>;

/** Canonical runtime for the installed, node-local Design Interview packages. */
export class DesignInterviewFamilyRuntime implements TrainingFamilyRuntime {
  readonly familyId = "design_interview" as const;

  constructor(private readonly catalog: DesignRuntimeCatalog, private readonly taxonomyVersion: string) {}

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error(`Design Interview runtime cannot prepare ${input.trackId}.`);
    const modeId = designMode(input.modeId);
    const request = preparationRequest(input.request);
    const mode = this.catalog.getMode(modeId);
    const requestedLength = request.requestedLength ?? mode.defaultRequestedLength;
    if (!mode.requestedLengths.includes(requestedLength)) throw new Error(`Design Interview mode ${modeId} does not support requested length ${requestedLength}.`);
    const all = [...this.catalog.getItems()].sort((left, right) => left.id.localeCompare(right.id));
    const pool = modeId === "design-interview-weak-area-review" ? dueReviewItems(all, input.reviews, input.now, this.catalog) : all;
    if (pool.length === 0) throw new Error("Design Interview Weak Area Review is unavailable until a committed due review item exists.");
    const questions = pool.slice(0, Math.min(requestedLength, pool.length));
    const base = {
      id: request.sessionId,
      trackId: this.catalog.getTrackId(),
      modeId,
      configurationSnapshot: configurationFor(modeId),
      requestedLength,
      actualLength: questions.length,
      currentItemIndex: 0,
      itemOrder: questions.map((question, index) => ({ occurrenceId: `${request.sessionId}:occurrence:${index}`, item: this.catalog.toContentItemRef(question) })),
      optionOrderByOccurrence: Object.fromEntries(questions.map((question, index) => [`${request.sessionId}:occurrence:${index}`, interactionOrder(question.interaction)])),
      conditionalReinsertSlots: [],
      activeForegroundMs: 0,
      contentVersion: this.catalog.getContentVersion(),
      packagePin: this.catalog.getPackagePin(),
      taxonomyVersion: this.taxonomyVersion,
      status: "active" as const,
      startedAt: input.now,
    };
    const identified = { ...base, planFingerprint: await createContentSessionPlanFingerprint(base) };
    const session = createTrainingSession(identified);
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    this.assertSession(input.session);
    if (input.draft) throw new Error("Design Interview practice does not resume with a simulation draft.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    this.assertSession(input.session);
    const occurrence = input.session.itemOrder[input.session.currentItemIndex];
    if (!occurrence) throw new Error("Design Interview practice has no current occurrence.");
    const question = this.catalog.getItemById(occurrence.item.itemId);
    const response = designResponse(input.response);
    validateResponseForQuestion(question.interaction, response);
    const attempt = createTrainingAttempt({
      id: await createAttemptId(input.session.id, occurrence.occurrenceId, response),
      sessionId: input.session.id,
      trackId: input.session.trackId,
      modeId: input.session.modeId,
      occurrenceId: occurrence.occurrenceId,
      item: occurrence.item,
      response,
      result: scoreDesignQuestion(question, response),
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [
        { axisId: "roadmap_node", nodeId: question.taxonomy.roadmapNodeId, role: "primary" },
        { axisId: "mental_unit", nodeId: question.taxonomy.mentalUnitId, role: "primary" },
        { axisId: "competency", nodeId: question.taxonomy.primaryCompetencyId, role: "primary" },
      ] },
      answeredAt: input.now,
      committedAt: input.now,
    });
    const prior = input.reviews.find((review) => review.trackId === this.catalog.getTrackId() && sameItem(review.sourceItem, occurrence.item));
    const candidate = input.session.modeId === "design-interview-weak-area-review" && prior ? updateDesignReviewEntry(prior, attempt) : createDesignReviewEntry(attempt);
    const reviewMutations: readonly ReviewMutationCommand[] = candidate
      ? [Object.freeze({ kind: "upsert" as const, entry: prior ? retainReviewQueueEntryIdentity(prior, candidate) : candidate, transitionAttemptId: attempt.id })]
      : prior ? [Object.freeze({ kind: "remove" as const, entry: prior, transitionAttemptId: attempt.id })] : [];
    return Object.freeze({ attempt, session: input.session, reviewMutations });
  }

  async finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>): Promise<PracticeFinalization> {
    this.assertSession(input.session);
    const attempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    if (attempts.length !== input.session.actualLength || new Set(attempts.map((attempt) => attempt.occurrenceId)).size !== input.session.actualLength || attempts.some((attempt) => !input.session.itemOrder.some((occurrence) => occurrence.occurrenceId === attempt.occurrenceId))) throw new Error("Design Interview practice finalization requires one durable attempt per occurrence.");
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({
      id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds: attempts.map((attempt) => attempt.occurrenceId), unansweredOccurrenceIds: [], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: this.familyId, details: {
        correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length,
        partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length,
        incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length,
        pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0),
        maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0),
        activeForegroundMs: session.activeForegroundMs,
      } }),
    });
    return Object.freeze({ session, result });
  }

  async finalizeSimulation(_input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization> {
    throw new Error("Design Interview has no simulation mode in the installed package.");
  }

  async validateDraftCommand(_input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    throw new Error("Design Interview has no simulation draft contract.");
  }

  async queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Design Interview dashboard requested for another track.");
    return Object.freeze({ activeSessionId: input.activeSession?.id, progress: progressFor(input.attempts, input.reviews, input.now, this.catalog) });
  }

  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Design Interview progress requested for another track.");
    return progressFor(input.attempts, input.reviews, input.now, this.catalog);
  }

  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Design Interview review requested for another track.");
    return Object.freeze({ due: Object.freeze(input.reviews.filter((review) => review.trackId === this.catalog.getTrackId() && review.dueAt <= input.now)) });
  }

  private assertSession(session: TrainingSession): void {
    if (session.trackId !== this.catalog.getTrackId() || session.contentVersion !== this.catalog.getContentVersion() || !contentPackagePinsEqual(session.packagePin, this.catalog.getPackagePin()) || session.taxonomyVersion !== this.taxonomyVersion || !session.planFingerprint || !DESIGN_INTERVIEW_MODE_IDS.includes(session.modeId as DesignInterviewModeId)) throw new Error("Design Interview session does not match its validated immutable artifact.");
    if (session.configurationSnapshot.kind !== "designInterviewPractice" || session.configurationSnapshot.navigation !== "linear" || session.configurationSnapshot.submission !== "perItem" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || session.configurationSnapshot.timer !== "elapsedForeground" || session.actualLength > session.requestedLength || new Set(session.itemOrder.map((occurrence) => occurrence.item.itemId)).size !== session.actualLength) throw new Error("Design Interview session does not match its immutable interaction policy.");
  }
}

function designMode(value: string): DesignInterviewModeId {
  if (!DESIGN_INTERVIEW_MODE_IDS.includes(value as DesignInterviewModeId)) throw new Error(`Design Interview mode ${value} is unavailable in this package.`);
  return value as DesignInterviewModeId;
}

function preparationRequest(value: unknown): DesignInterviewPreparationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Design Interview session request is invalid.");
  const request = value as Record<string, unknown>;
  if (typeof request.sessionId !== "string" || !request.sessionId.trim()) throw new Error("Design Interview session request requires an immutable session ID.");
  if (request.requestedLength !== undefined && (!Number.isSafeInteger(request.requestedLength) || (request.requestedLength as number) <= 0)) throw new Error("Design Interview requested length is invalid.");
  return request as DesignInterviewPreparationRequest;
}

function configurationFor(modeId: DesignInterviewModeId): TrainingSession["configurationSnapshot"] {
  return { kind: "designInterviewPractice", modeId, navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground", reviewSource: modeId === "design-interview-weak-area-review" ? "due_queue" : "package_items" };
}

function interactionOrder(interaction: DesignInteraction): readonly string[] {
  if (interaction.type === "choice") return interaction.options.map((option) => option.id);
  if (interaction.type === "ordering") return interaction.elements.map((element) => element.id);
  return interaction.dimensions.map((dimension) => dimension.dimensionId);
}

function validateResponseForQuestion(interaction: DesignInteraction, response: DesignResponse): void {
  if (interaction.type === "choice" && response.kind === "choice") {
    const ids = interaction.options.map((option) => option.id);
    if (!response.selectedOptionIds.length || new Set(response.selectedOptionIds).size !== response.selectedOptionIds.length || response.selectedOptionIds.some((id) => !ids.includes(id)) || (interaction.selectionMode === "single" && response.selectedOptionIds.length !== 1)) throw new Error("Design choice response must select declared unique options.");
    return;
  }
  if (interaction.type === "ordering" && response.kind === "ordering") {
    const ids = interaction.elements.map((element) => element.id);
    if (response.orderedElementIds.length !== ids.length || new Set(response.orderedElementIds).size !== ids.length || response.orderedElementIds.some((id) => !ids.includes(id))) throw new Error("Design ordering response must be a complete permutation of declared elements.");
    return;
  }
  if (interaction.type === "decision_matrix" && response.kind === "decision_matrix") {
    const dimensions = new Map(interaction.dimensions.map((dimension) => [dimension.dimensionId, dimension]));
    const keys = Object.keys(response.selectedValueIdsByDimension);
    if (keys.length !== dimensions.size || keys.some((key) => !dimensions.has(key)) || keys.some((key) => !dimensions.get(key)!.values.some((value) => value.valueId === response.selectedValueIdsByDimension[key]))) throw new Error("Design decision matrix response must select one declared value for every dimension.");
    return;
  }
  throw new Error("Design response interaction does not match the question interaction.");
}

function designResponse(value: unknown): DesignResponse {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof (value as { kind?: unknown }).kind !== "string") throw new Error("Design response is invalid.");
  const response = value as Record<string, unknown>;
  if (response.kind === "choice" && Array.isArray(response.selectedOptionIds) && response.selectedOptionIds.every((id) => typeof id === "string")) return response as DesignResponse;
  if (response.kind === "ordering" && Array.isArray(response.orderedElementIds) && response.orderedElementIds.every((id) => typeof id === "string")) return response as DesignResponse;
  if (response.kind === "decision_matrix" && response.selectedValueIdsByDimension && typeof response.selectedValueIdsByDimension === "object" && !Array.isArray(response.selectedValueIdsByDimension) && Object.values(response.selectedValueIdsByDimension).every((id) => typeof id === "string")) return response as DesignResponse;
  throw new Error("Design response is invalid.");
}

function dueReviewItems(all: readonly DesignQuestion[], reviews: readonly ReviewQueueEntry[], now: string, catalog: DesignRuntimeCatalog): readonly DesignQuestion[] {
  const byId = new Map(all.map((question) => [question.id, question]));
  return reviews.filter((review) => review.trackId === catalog.getTrackId() && review.dueAt <= now && review.sourceItem.contentVersion === catalog.getContentVersion() && contentPackagePinsEqual(review.sourceItem.packagePin, catalog.getPackagePin())).sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.sourceItem.itemId.localeCompare(right.sourceItem.itemId)).map((review) => byId.get(review.sourceItem.itemId)).filter((question): question is DesignQuestion => question !== undefined).filter((question, index, values) => values.findIndex((candidate) => candidate.id === question.id) === index);
}

function createDesignReviewEntry(attempt: TrainingAttempt<DesignResponse>): ReviewQueueEntry | undefined {
  if (attempt.result.kind === "correct") return undefined;
  return { consecutiveAfterDueSuccesses: 0, createdAt: attempt.committedAt, dueAt: addDaysIso(attempt.committedAt, 1), id: `review:${attempt.id}`, persistent: true, reasons: [attempt.result.kind], sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId, sourceItem: attempt.reviewEvidence.sourceItem, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs, trackId: attempt.trackId };
}

function updateDesignReviewEntry(entry: ReviewQueueEntry, attempt: TrainingAttempt<DesignResponse>): ReviewQueueEntry | undefined {
  if (attempt.id === entry.sourceAttemptId || attempt.committedAt < entry.dueAt) return entry;
  if (attempt.result.kind !== "correct") return { ...entry, consecutiveAfterDueSuccesses: 0, lastReviewedAt: attempt.committedAt, persistent: true, reasons: [attempt.result.kind] };
  const consecutiveAfterDueSuccesses = entry.sourceSessionId === attempt.sessionId && entry.persistent ? entry.consecutiveAfterDueSuccesses : entry.consecutiveAfterDueSuccesses + 1;
  return consecutiveAfterDueSuccesses >= 2 ? undefined : { ...entry, consecutiveAfterDueSuccesses, lastReviewedAt: attempt.committedAt };
}

function progressFor(attempts: readonly TrainingAttempt<unknown>[], reviews: readonly ReviewQueueEntry[], now: string, catalog: DesignRuntimeCatalog) {
  const scoped = attempts.filter((attempt) => attempt.trackId === catalog.getTrackId() && attempt.item.contentVersion === catalog.getContentVersion() && contentPackagePinsEqual(attempt.item.packagePin, catalog.getPackagePin()));
  return Object.freeze({ attemptCount: scoped.length, dueReviewCount: reviews.filter((review) => review.trackId === catalog.getTrackId() && review.dueAt <= now).length, itemCount: catalog.getItems().length });
}

function sameItem(left: ContentItemRef, right: ContentItemRef): boolean { return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion && contentPackagePinsEqual(left.packagePin, right.packagePin); }
function addDaysIso(value: string, days: number): string { const date = new Date(value); date.setUTCDate(date.getUTCDate() + days); return date.toISOString(); }
