import { completeTrainingSession, createFamilyEnvelope, createTrainingSessionDraft, createTrainingSessionResult, isActiveReviewQueueEntry, createReviewSourceSnapshot, matchesReviewSourceSnapshot, manualRequestIdForEntry, type ReviewMutationCommand, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession, type TrainingSessionDraft, type TrackFamilyId } from "../../domain";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime, FamilyPlanningModeBinding, TrainingCatalog, TrainingInteractionPort, TrainingQuestionSummary } from "../trainingLifecycle";
import { getProductSimulationModeConfig, ProductModeUnavailableError, type ProductModeConfig } from "../../content/canonical/productModeConfig";
import type { CanonicalProductSimulationProfile } from "../../content/canonical/questionTypes";
import { createMaintenanceCycle, createOrUpdateErrorCycle, transitionQualifiedSuccess, consumeManualRequest } from "../../domain/learning/reviewCycleTransition";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import { createCanonicalAttempt, scopeAttemptsToExactCatalog, scopeReviewsToExactCatalog } from "../canonical/canonicalFamilyMechanics";
import { applyCanonicalPlanReplacements, buildCanonicalSessionPlan, prepareCanonicalPlanOccurrences, validateCanonicalSessionPlan } from "../canonical/canonicalSessionPlanMechanics";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";

const FAMILY: TrackFamilyId = "coding_interview";

/** Coding-owned mode selection, exact simulation profile, scoring and review qualification. */
export class CodingInterviewTrainingRuntime implements TrainingFamilyRuntime {
  readonly familyId = FAMILY;
  constructor(private readonly catalog: TrainingCatalog, readonly interactions: TrainingInteractionPort) {}

  getPlanningModeBinding(): FamilyPlanningModeBinding {
    return Object.freeze({
      trackId: this.catalog.trackId,
      diagnosticModeId: null,
      practiceModeId: "coding-interview-guided-practice",
      dueReviewModeId: "coding-interview-weak-area-review",
    });
  }

  async prepare(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    assertTrack(input.trackId, this.catalog.trackId);
    if (input.modeId === "coding-interview-simulation") {
      const request = requestRecord(input.request);
      if (request.reviewSource !== undefined || request.reviewItemRefs !== undefined) throw new Error("Coding Interview simulation does not accept review sources.");
      return this.prepareSimulation(input);
    }
    const mode = this.mode(input.modeId);
    const request = parseRequest(input.request, mode.defaultRequestedLength);
    if (!mode.requestedLengths.includes(request.requestedLength)) throw new Error("Requested length is unavailable for this Coding Interview mode.");
    validateEvidenceSource(mode, request.reviewSource);
    if (request.reviewSource === "session_misses") throw new Error("Coding Interview session_misses requires verified completed-session evidence.");
    const reviewSource = request.reviewSource ?? (mode.selection.kind === "evidence_conditioned" && mode.selection.evidenceSources.length === 1 && mode.selection.evidenceSources[0] === "due_queue" ? "due_queue" : undefined);
    const source = mode.selection.kind === "evidence_conditioned" ? this.eligibleEvidence(mode, input.reviews, input.now, reviewSource) : this.catalog.getPool(mode.modeId);
    const count = Math.min(request.requestedLength, source.length);
    if (!count || (mode.selection.kind !== "evidence_conditioned" && count < mode.minimumActualLength)) throw new Error("Coding Interview mode has insufficient eligible content.");
    const questions = mode.selection.kind === "node"
      ? selectPracticeQuestions(source, input.attempts, exactIdentity(this.catalog), count)
      : mode.selection.kind === "exact_ordered_questions"
        ? mode.selection.questionIds.slice(0, count).map((id) => this.catalog.getQuestion(id)).filter((question): question is TrainingQuestionSummary => Boolean(question))
        : source.slice(0, count);
    if (questions.length !== count) throw new Error("Coding Interview selection could not resolve its exact question set.");
    const items = questions.map((question) => {
      const item = ref(this.catalog, question);
      const review = reviewSource && mode.selection.kind === "evidence_conditioned"
        ? input.reviews.find((entry) => this.isSelectedReviewEntry(entry, reviewSource, input.now) && resolvedContentRefsEqual(entry.sourceItem, item))
        : undefined;
      if (reviewSource && mode.selection.kind === "evidence_conditioned" && !review) throw new Error("Coding Interview review selection lost its exact source before plan capture.");
      return { item, ...(review ? { reviewSourceSnapshot: createReviewSourceSnapshot(review, reviewSource, input.now) } : {}) };
    });
    const sessionId = requireSessionId(input.request);
    const prepared = prepareCanonicalPlanOccurrences(this.catalog, this.interactions, sessionId, items);
    const feedbackMode = feedbackModeFor(mode, request.feedbackTiming);
    const session = await buildCanonicalSessionPlan(this.catalog, { sessionId, modeId: mode.modeId,
      configurationSnapshot: { kind: "practice", timer: "elapsedForeground", feedbackMode, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect" },
      requestedLength: request.requestedLength, preparedOccurrences: prepared, conditionalReinsertSlots: this.buildReinsertionSlots(mode, prepared.itemOrder, prepared.optionOrderByOccurrence), startedAt: input.now });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    if (input.session.modeId === "coding-interview-simulation") return this.validateSimulationResume(input);
    if (input.draft) throw new Error("Coding Interview practice cannot contain a simulation draft.");
    const mode = this.mode(input.session.modeId);
    if (!mode.requestedLengths.includes(input.session.requestedLength)) throw new ProductModeUnavailableError("Coding Interview session mode or requested length is unavailable.");
    const feedback = input.session.configurationSnapshot.feedbackMode;
    if (!(mode.feedbackTiming.kind === "fixed" ? ["afterEachAnswer"] : ["afterEachAnswer", "atSessionEnd"]).includes(String(feedback))) throw new Error("Coding Interview feedback configuration is invalid.");
    const expected = { kind: "practice", timer: "elapsedForeground", feedbackMode: feedback, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect" };
    if (JSON.stringify(input.session.configurationSnapshot) !== JSON.stringify(expected)) throw new Error("Coding Interview session configuration is invalid.");
    if (input.session.actualLength < (mode.selection.kind === "evidence_conditioned" ? 1 : mode.minimumActualLength)) throw new Error("Coding Interview session is below the accepted minimum length.");
    if (mode.selection.kind === "exact_ordered_questions" && JSON.stringify(input.session.itemOrder.map((entry) => entry.item.questionId)) !== JSON.stringify(mode.selection.questionIds.slice(0, input.session.actualLength))) throw new Error("Coding Interview exact-order plan is invalid.");
    await validateCanonicalSessionPlan(this.catalog, this.interactions, input.session);
  }

  async submitPractice(input: Parameters<TrainingFamilyRuntime["submitPractice"]>[0]): Promise<PracticeSubmission> {
    await this.validateResume({ session: input.session, draft: null });
    const occurrence = input.session.itemOrder[input.session.currentItemIndex]!;
    const question = this.catalog.getQuestion(occurrence.item.questionId)!;
    const evaluation = this.interactions.evaluate(question.questionId, input.response);
    if (!evaluation.complete || !evaluation.result) throw new Error("Coding Interview response is incomplete or invalid.");
    const result = evaluation.result;
    const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: input.response, result,
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }, answeredAt: input.now, committedAt: input.now });
    const matching = input.reviews.filter((entry) => entry.trackId === input.session.trackId && resolvedContentRefsEqual(entry.sourceItem, occurrence.item));
    const prior = matching.find(isActiveReviewQueueEntry);
    const completed = matching.some((entry) => entry.status === "completed");
    const snapshot = occurrence.reviewSourceSnapshot;
    const snapshotMatches = snapshot !== undefined && prior !== undefined && matchesReviewSourceSnapshot(snapshot, prior);
    const sourceExpired = result.kind === "correct" && snapshot?.source === "manual_request" && prior?.dueAt !== undefined && Date.parse(attempt.answeredAt) >= Date.parse(prior.dueAt);
    const conflict = this.usesDueQueueReview(input.session.modeId) && (!snapshot || !snapshotMatches || sourceExpired);
    let reviewMutations: readonly ReviewMutationCommand[] = [];
    if (!conflict && result.kind !== "correct") reviewMutations = [{ kind: "upsert", entry: createOrUpdateErrorCycle(prior, attempt, Boolean(prior && snapshot?.manualRequestId && snapshotMatches)), transitionAttemptId: attempt.id }];
    else if (!conflict && this.usesDueQueueReview(input.session.modeId) && snapshot && snapshotMatches && prior?.dueAt && Date.parse(attempt.answeredAt) >= Date.parse(prior.dueAt)) reviewMutations = [{ kind: "upsert", entry: transitionQualifiedSuccess(prior, attempt), transitionAttemptId: attempt.id }];
    else if (!conflict && this.usesDueQueueReview(input.session.modeId) && snapshot?.source === "manual_request" && snapshotMatches && prior && result.kind === "correct") reviewMutations = [{ kind: "upsert", entry: consumeManualRequest(prior), transitionAttemptId: attempt.id }];
    else if (!conflict && !prior && !completed) reviewMutations = [{ kind: "upsert", entry: createMaintenanceCycle(attempt), transitionAttemptId: attempt.id }];
    const session = await this.resolveReinsertions(input.session, [...input.attempts, attempt]);
    return Object.freeze({ attempt, session, reviewMutations, reviewBaseline: input.reviews, ...(conflict ? { reviewSnapshotConflict: true } : {}) });
  }

  async finalizePractice(input: Parameters<TrainingFamilyRuntime["finalizePractice"]>[0]): Promise<PracticeFinalization> {
    await this.validateResume({ session: input.session, draft: null });
    const attempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    const ids = new Set(attempts.map((attempt) => attempt.occurrenceId));
    if (attempts.length !== input.session.actualLength || ids.size !== input.session.actualLength || input.session.itemOrder.some((occurrence) => !ids.has(occurrence.occurrenceId)) || attempts.some((attempt) => {
      const occurrence = input.session.itemOrder.find((candidate) => candidate.occurrenceId === attempt.occurrenceId);
      return !occurrence || attempt.trackId !== input.session.trackId || attempt.modeId !== input.session.modeId || !resolvedContentRefsEqual(attempt.item, occurrence.item);
    })) throw new Error("Coding Interview finalization requires one exact attempt per planned item.");
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds: session.itemOrder.map((occurrence) => occurrence.occurrenceId), unansweredOccurrenceIds: [], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: aggregateEvidence(session.activeForegroundMs, attempts) }) });
    return Object.freeze({ session, result });
  }

  async finalizeSimulation(input: Parameters<TrainingFamilyRuntime["finalizeSimulation"]>[0]): Promise<SimulationFinalization> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active" || !Number.isFinite(Date.parse(input.now)) || !Number.isFinite(Date.parse(input.draft.updatedAt)) || Date.parse(input.now) < Date.parse(input.draft.updatedAt)) throw new Error("Coding Interview simulation cannot be finalized from this state.");
    if (input.attempts.some((attempt) => attempt.sessionId === input.session.id)) throw new Error("Coding Interview simulation already has attempts.");
    const attempts: TrainingAttempt<unknown>[] = [];
    const reviewMutations: ReviewMutationCommand[] = [];
    for (const occurrence of input.session.itemOrder) {
      if (!Object.hasOwn(input.draft.responsesByOccurrenceId, occurrence.occurrenceId)) continue;
      const question = this.catalog.getQuestion(occurrence.item.questionId)!;
      const response = input.draft.responsesByOccurrenceId[occurrence.occurrenceId];
      const evaluation = this.interactions.evaluate(question.questionId, response);
      if (!evaluation.complete || !evaluation.result) throw new Error("Coding Interview simulation response is incomplete.");
      const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: evaluation.result,
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }, answeredAt: input.draft.updatedAt, committedAt: input.now });
      attempts.push(attempt);
      const matching = input.reviews.filter((entry) => entry.trackId === input.session.trackId && resolvedContentRefsEqual(entry.sourceItem, occurrence.item));
      const prior = matching.find(isActiveReviewQueueEntry);
      if (attempt.result.kind !== "correct") reviewMutations.push({ kind: "upsert", entry: createOrUpdateErrorCycle(prior, attempt), transitionAttemptId: attempt.id });
      else if (!prior && !matching.some((entry) => entry.status === "completed")) reviewMutations.push({ kind: "upsert", entry: createMaintenanceCycle(attempt), transitionAttemptId: attempt.id });
    }
    const session = completeTrainingSession(input.session, input.now);
    const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
    if (profile.familyId !== FAMILY) throw new ProductModeUnavailableError("Coding Interview simulation profile is unavailable.");
    const answered = new Set(attempts.map((attempt) => attempt.occurrenceId));
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds: [...answered], unansweredOccurrenceIds: session.itemOrder.filter((entry) => !answered.has(entry.occurrenceId)).map((entry) => entry.occurrenceId), completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: { profileId: profile.profileId, profileVersion: profile.profileVersion, ...aggregateEvidence(session.activeForegroundMs, attempts) } }) });
    return Object.freeze({ session, result, attempts, reviewMutations, frozenDraft: input.draft, reviewBaseline: input.reviews });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active" || input.draft.familyId !== FAMILY || !Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1 || input.draft.revision !== input.expectedPreviousRevision + 1) throw new Error("Coding Interview draft command identity or revision is invalid.");
    if (input.session.configurationSnapshot.timer === "absoluteDeadline" && Date.parse(input.draft.updatedAt) >= Date.parse(String(input.session.configurationSnapshot.timerDeadlineAt))) throw new Error("Coding Interview simulation draft is after its immutable deadline.");
  }

  async queryDashboard(input: Parameters<TrainingFamilyRuntime["queryDashboard"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopeReviewsToExactCatalog(input.reviews, this.catalog); return Object.freeze({ trackId: input.trackId, activeSessionId: input.activeSession?.trackId === input.trackId && input.activeSession.artifactSha256 === this.catalog.artifactSha256 ? input.activeSession.id : undefined, attemptCount: scopeAttemptsToExactCatalog(input.attempts, this.catalog).length, dueReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "due_queue", input.now)).length, manualReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "manual_request", input.now)).length }); }
  async queryReview(input: Parameters<TrainingFamilyRuntime["queryReview"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); return Object.freeze({ trackId: input.trackId, due: Object.freeze(scopeReviewsToExactCatalog(input.reviews, this.catalog).filter((entry) => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.dueAt <= input.now)) }); }

  private mode(modeId: string): ProductModeConfig { try { return this.catalog.getMode(modeId); } catch { throw new ProductModeUnavailableError(`Coding Interview mode ${modeId} is unavailable.`); } }
  private buildReinsertionSlots(mode: ProductModeConfig, items: TrainingSession["itemOrder"], orders: TrainingSession["optionOrderByOccurrence"]): NonNullable<TrainingSession["conditionalReinsertSlots"]> {
    if (mode.reinsertPolicy !== "conditional_after_incorrect") return [];
    return items.slice(0, Math.max(0, items.length - 4)).map((source, index) => {
      const ordinary = items[index + 4]!;
      return { slotId: `${source.occurrenceId}:conditional:${index + 4}`, sourceOccurrenceId: source.occurrenceId,
        ordinaryBranch: { occurrence: ordinary, optionOrder: orders[ordinary.occurrenceId] ?? [] },
        exactSourceBranch: { occurrence: { occurrenceId: `${source.occurrenceId}:conditional:${index + 4}:exact`, item: source.item }, optionOrder: orders[source.occurrenceId] ?? [] },
        resolutionRule: "incorrect_or_partial_after_three_materialized_submissions" as const };
    });
  }
  private async resolveReinsertions(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[]): Promise<TrainingSession> {
    const slots = session.conditionalReinsertSlots ?? [];
    if (!slots.length) return session;
    const current = new Map(attempts.filter((attempt) => attempt.sessionId === session.id).map((attempt) => [attempt.occurrenceId, attempt]));
    const indexes = new Map(session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, index]));
    const replacements: Array<{ targetOccurrenceId: string; occurrenceId: string; item: ResolvedContentRef; optionOrder: readonly string[] }> = [];
    const usedSlots = new Set<string>();
    for (const slot of slots) {
      const sourceIndex = indexes.get(slot.sourceOccurrenceId); const targetIndex = indexes.get(slot.ordinaryBranch.occurrence.occurrenceId); const source = current.get(slot.sourceOccurrenceId); const alternative = slot.reviewedVariantBranch ?? slot.exactSourceBranch;
      if (sourceIndex === undefined || targetIndex === undefined || !source || !alternative || (source.result.kind !== "incorrect" && source.result.kind !== "partial")) continue;
      const intervening = [...current.values()].filter((candidate) => { const index = indexes.get(candidate.occurrenceId); return index !== undefined && index > sourceIndex && index < targetIndex; }).length;
      if (intervening < 3 || current.has(slot.ordinaryBranch.occurrence.occurrenceId) || current.has(alternative.occurrence.occurrenceId)) continue;
      replacements.push({ targetOccurrenceId: slot.ordinaryBranch.occurrence.occurrenceId, occurrenceId: alternative.occurrence.occurrenceId, item: alternative.occurrence.item, optionOrder: alternative.optionOrder });
      usedSlots.add(slot.slotId);
    }
    const replacementByTarget = new Map(replacements.map((replacement) => [replacement.targetOccurrenceId, replacement.occurrenceId]));
    const remainingOccurrenceIds = new Set(session.itemOrder.map((occurrence) => replacementByTarget.get(occurrence.occurrenceId) ?? occurrence.occurrenceId));
    const remainingSlots = slots.filter((slot) => !usedSlots.has(slot.slotId)
      && remainingOccurrenceIds.has(slot.sourceOccurrenceId)
      && remainingOccurrenceIds.has(slot.ordinaryBranch.occurrence.occurrenceId));
    return applyCanonicalPlanReplacements(session, replacements, remainingSlots);
  }
  private eligibleEvidence(mode: ProductModeConfig, reviews: readonly ReviewQueueEntry[], now: string, source: "due_queue" | "manual_request" | "session_misses" | undefined): readonly TrainingQuestionSummary[] {
    if (mode.selection.kind !== "evidence_conditioned") return this.catalog.getPool(mode.modeId);
    const ids = new Set(scopeReviewsToExactCatalog(reviews, this.catalog).filter((entry) => source === "due_queue" ? this.isSelectedReviewEntry(entry, source, now) : source === "manual_request" ? this.isSelectedReviewEntry(entry, source, now) : false).map((entry) => entry.sourceItem.questionId));
    return this.catalog.getPool(mode.modeId).filter((question) => ids.has(question.questionId));
  }
  private isSelectedReviewEntry(entry: ReviewQueueEntry, source: "due_queue" | "manual_request", now: string): boolean { if (!isActiveReviewQueueEntry(entry) || !entry.dueAt) return false; const due = Date.parse(entry.dueAt); const current = Date.parse(now); if (!Number.isFinite(due) || !Number.isFinite(current)) return false; return source === "due_queue" ? due <= current : due > current && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined; }
  private usesDueQueueReview(modeId: string): boolean { return modeId === "coding-interview-weak-area-review"; }
  private async prepareSimulation(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles);
    if (config.kind !== "coding_interview_simulation" || profile.familyId !== FAMILY || input.trackId !== config.trackId || input.modeId !== config.modeId || simulationProfileId(input.request) !== config.profileId) throw new ProductModeUnavailableError("Coding Interview Simulation requires its exact profile identity.");
    const familyConfig = profile.familyConfig;
    if (familyConfig.schemaVersion !== "patternly-coding-interview-simulation-config-v1") throw new ProductModeUnavailableError("Coding Interview Simulation profile is unsupported.");
    const questions = familyConfig.eligibleQuestionIds.map((id) => this.catalog.getQuestion(id));
    if (questions.length !== 40 || new Set(familyConfig.eligibleQuestionIds).size !== 40 || questions.some((question) => !question)) throw new ProductModeUnavailableError("Coding Interview Simulation profile does not resolve 40 exact questions.");
    const sessionId = requireSessionId(input.request);
    const prepared = prepareCanonicalPlanOccurrences(this.catalog, this.interactions, sessionId, questions.map((question) => ({ item: ref(this.catalog, question!) })));
    const session = await buildCanonicalSessionPlan(this.catalog, { sessionId, modeId: config.modeId, configurationSnapshot: codingSimulationSnapshot(profile), requestedLength: 40, preparedOccurrences: prepared, conditionalReinsertSlots: [], startedAt: input.now });
    const draft = createTrainingSessionDraft({ sessionId, trackId: this.catalog.trackId, familyId: FAMILY, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: input.now });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft });
  }
  private async validateSimulationResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles); const session = input.session;
    if (config.kind !== "coding_interview_simulation" || profile.familyId !== FAMILY || session.trackId !== config.trackId || session.modeId !== config.modeId) throw new ProductModeUnavailableError("Coding Interview simulation profile or mode is unavailable.");
    const familyConfig = profile.familyConfig;
    if (familyConfig.schemaVersion !== "patternly-coding-interview-simulation-config-v1") throw new ProductModeUnavailableError("Coding Interview simulation profile is unsupported.");
    await validateCanonicalSessionPlan(this.catalog, this.interactions, session);
    const expected = familyConfig.eligibleQuestionIds;
    if (session.actualLength !== 40 || session.requestedLength !== 40 || session.itemOrder.length !== 40 || JSON.stringify(session.itemOrder.map((entry) => entry.item.questionId)) !== JSON.stringify(expected) || (session.conditionalReinsertSlots?.length ?? 0) !== 0 || JSON.stringify(session.configurationSnapshot) !== JSON.stringify(codingSimulationSnapshot(profile))) throw new Error("Coding Interview simulation snapshot or pinned plan is invalid.");
    const draft = input.draft;
    if (!draft || draft.schemaVersion !== 1 || draft.draftVersion !== 1 || draft.sessionId !== session.id || draft.trackId !== session.trackId || draft.familyId !== FAMILY || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || Date.parse(draft.updatedAt) < Date.parse(session.startedAt) || Number.isNaN(Date.parse(draft.updatedAt))) throw new Error("Coding Interview simulation draft identity or revision is invalid.");
    const ids = new Set(session.itemOrder.map((entry) => entry.occurrenceId));
    if (Object.keys(draft.responsesByOccurrenceId).some((id) => !ids.has(id)) || draft.flaggedOccurrenceIds.some((id) => !ids.has(id)) || new Set(draft.flaggedOccurrenceIds).size !== draft.flaggedOccurrenceIds.length) throw new Error("Coding Interview simulation draft contains an unknown occurrence.");
    for (const [id, response] of Object.entries(draft.responsesByOccurrenceId)) { const occurrence = session.itemOrder.find((entry) => entry.occurrenceId === id)!; const question = this.catalog.getQuestion(occurrence.item.questionId)!; if (!this.interactions.isComplete(question.questionId, response)) throw new Error("Coding Interview simulation response is incomplete."); }
  }
}

function requestRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function parseRequest(value: unknown, fallback: number): Readonly<{ requestedLength: number; feedbackTiming?: string; reviewSource?: "due_queue" | "manual_request" | "session_misses" }> { const request = requestRecord(value); if (request.requestedLength !== undefined && (!Number.isSafeInteger(request.requestedLength) || Number(request.requestedLength) <= 0)) throw new Error("Coding Interview requestedLength is invalid."); if (request.feedbackTiming !== undefined && request.feedbackTiming !== "after_each_durable_submit" && request.feedbackTiming !== "after_session_completion") throw new Error("Coding Interview feedbackTiming is invalid."); const reviewSource = request.reviewSource; if (reviewSource !== undefined && reviewSource !== "due_queue" && reviewSource !== "manual_request" && reviewSource !== "session_misses") throw new Error("Coding Interview reviewSource is invalid."); if (request.reviewItemRefs !== undefined && reviewSource !== "session_misses") throw new Error("Coding Interview review item refs require session_misses."); return { requestedLength: typeof request.requestedLength === "number" ? request.requestedLength : fallback, feedbackTiming: typeof request.feedbackTiming === "string" ? request.feedbackTiming : undefined, reviewSource: reviewSource as "due_queue" | "manual_request" | "session_misses" | undefined }; }
function requireSessionId(value: unknown): string { const id = requestRecord(value).sessionId; if (typeof id !== "string" || !id.trim()) throw new Error("Coding Interview preparation requires sessionId."); return id; }
function simulationProfileId(value: unknown): string | undefined { const scope = requestRecord(value).scope; return typeof requestRecord(scope).simulationProfileId === "string" ? String(requestRecord(scope).simulationProfileId) : undefined; }
function feedbackModeFor(mode: ProductModeConfig, requested?: string): "afterEachAnswer" | "atSessionEnd" { if (mode.feedbackTiming.kind === "fixed") { if (requested && requested !== "after_each_durable_submit") throw new Error("Coding Interview mode has fixed feedback timing."); return "afterEachAnswer"; } return requested === "after_session_completion" ? "atSessionEnd" : "afterEachAnswer"; }
function validateEvidenceSource(mode: ProductModeConfig, source: "due_queue" | "manual_request" | "session_misses" | undefined): void { if (mode.selection.kind === "evidence_conditioned") { if (mode.selection.evidenceSources.length > 1 && !source) throw new Error("Coding Interview multi-source review requires an explicit source."); const mapped = source === "session_misses" ? "committed_session_misses" : source === "manual_request" ? "due_queue" : source; if (mapped && !mode.selection.evidenceSources.includes(mapped)) throw new Error("Coding Interview review source is unavailable."); } else if (source) throw new Error("Coding Interview review source requires an evidence-conditioned mode."); }
function exactIdentity(catalog: TrainingCatalog): Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }> { return { trackId: catalog.trackId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }; }
function ref(catalog: TrainingCatalog, question: Pick<TrainingQuestionSummary, "questionId">): ResolvedContentRef { return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }); }
function assertTrack(actual: string, expected: string): void { if (actual !== expected) throw new Error("Coding Interview query track mismatch."); }
function aggregateEvidence(activeForegroundMs: number, attempts: readonly TrainingAttempt<unknown>[]) { return { activeForegroundMs, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0), maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0) }; }
function codingSimulationSnapshot(profile: CanonicalProductSimulationProfile): TrainingSession["configurationSnapshot"] { if (profile.familyId !== FAMILY || profile.modeId !== "coding-interview-simulation" || profile.familyConfig.schemaVersion !== "patternly-coding-interview-simulation-config-v1") throw new ProductModeUnavailableError("Coding Interview simulation profile is invalid."); const config = profile.familyConfig; return Object.freeze({ kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: config.answerChangePolicy === "editable_until_finalization" ? "untilFinalSubmission" : "none", navigation: config.navigationPolicy === "free_navigation" ? "free" : "linear", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: config.durationMinutes * 60_000, simulationProfileId: profile.profileId, simulationProfileVersion: profile.profileVersion, simulationBlueprintId: config.blueprintId, simulationBlueprintVersion: config.blueprintVersion, simulationPoolId: config.poolId, simulationPoolVersion: config.poolVersion }); }
