import { completeTrainingSession, createFamilyEnvelope, createTrainingSessionDraft, createTrainingSessionResult, isActiveReviewQueueEntry, createReviewSourceSnapshot, matchesReviewSourceSnapshot, manualRequestIdForEntry, type ReviewMutationCommand, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession, type TrainingSessionDraft, type TrackFamilyId } from "../../domain";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime, FamilyPlanningModeBinding, TrainingCatalog, TrainingInteractionPort, TrainingQuestionSummary } from "../trainingLifecycle";
import { getProductSimulationModeConfig, ProductModeUnavailableError, type ProductModeConfig } from "../../content/canonical/productModeConfig";
import type { CanonicalProductSimulationProfile } from "../../content/canonical/questionTypes";
import { createMaintenanceCycle, createOrUpdateErrorCycle, transitionQualifiedSuccess, consumeManualRequest } from "../../domain/learning/reviewCycleTransition";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import { sameLearningUnit } from "../../domain/learning/mentalUnitEvidence";
import { canonicalQuestionReviewEvidence, createCanonicalAttempt, limitQuestionsToReviewNeeds, reviewNeedForQuestion, sameCurrentReviewUnit, scopeAttemptsToLearningTrack, scopeReviewsToLearningTrack } from "../canonical/canonicalFamilyMechanics";
import { applyCanonicalPlanReplacements, buildCanonicalSessionPlan, prepareCanonicalPlanOccurrences, validateCanonicalSessionPlan } from "../canonical/canonicalSessionPlanMechanics";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";

const FAMILY: TrackFamilyId = "design_interview";

/** Coding-owned mode selection, exact simulation profile, scoring and review qualification. */
export class DesignInterviewTrainingRuntime implements TrainingFamilyRuntime {
  readonly familyId = FAMILY;
  constructor(private readonly catalog: TrainingCatalog, readonly interactions: TrainingInteractionPort) {}

  getPlanningModeBinding(): FamilyPlanningModeBinding {
    return Object.freeze({
      trackId: this.catalog.trackId,
      diagnosticModeId: null,
      practiceModeId: "design-interview-tradeoff-practice",
      dueReviewModeId: "design-interview-weak-area-review",
    });
  }

  async prepare(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    assertTrack(input.trackId, this.catalog.trackId);
    if (input.modeId === "design-interview-simulation") {
      const request = requestRecord(input.request);
      if (request.reviewSource !== undefined || request.reviewItemRefs !== undefined) throw new Error("Design Interview simulation does not accept review sources.");
      return this.prepareSimulation(input);
    }
    const mode = this.mode(input.modeId);
    const request = parseRequest(input.request, mode.defaultRequestedLength);
    if (!mode.requestedLengths.includes(request.requestedLength)) throw new Error("Requested length is unavailable for this Design Interview mode.");
    validateEvidenceSource(mode, request.reviewSource);
    if (request.reviewSource === "session_misses") throw new Error("Design Interview session_misses requires verified completed-session evidence.");
    const reviewSource = request.reviewSource ?? (mode.selection.kind === "evidence_conditioned" && mode.selection.evidenceSources.length === 1 && mode.selection.evidenceSources[0] === "due_queue" ? "due_queue" : undefined);
    const source = mode.selection.kind === "evidence_conditioned" ? this.eligibleEvidence(mode, input.reviews, input.now, reviewSource) : this.catalog.getPool(mode.modeId);
    const count = Math.min(request.requestedLength, source.length);
    if (!count || (mode.selection.kind !== "evidence_conditioned" && count < mode.minimumActualLength)) throw new Error("Design Interview mode has insufficient eligible content.");
    const questions = mode.selection.kind === "node"
      ? selectPracticeQuestions(source, input.attempts, exactIdentity(this.catalog), count)
      : mode.selection.kind === "exact_ordered_questions"
        ? mode.selection.questionIds.slice(0, count).map((id) => this.catalog.getQuestion(id)).filter((question): question is TrainingQuestionSummary => Boolean(question))
        : source.slice(0, count);
    if (questions.length !== count) throw new Error("Design Interview selection could not resolve its exact question set.");
    const items = questions.map((question) => {
      const item = ref(this.catalog, question);
      const review = reviewSource && mode.selection.kind === "evidence_conditioned"
        ? this.reviewForQuestion(this.catalog.getQuestion(question.questionId)!, source, input.reviews, reviewSource, input.now)
        : undefined;
      if (reviewSource && mode.selection.kind === "evidence_conditioned" && !review) throw new Error("Design Interview review selection lost its source unit before plan capture.");
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
    if (input.session.modeId === "design-interview-simulation") return this.validateSimulationResume(input);
    if (input.draft) throw new Error("Design Interview practice cannot contain a simulation draft.");
    const mode = this.mode(input.session.modeId);
    if (!mode.requestedLengths.includes(input.session.requestedLength)) throw new ProductModeUnavailableError("Design Interview session mode or requested length is unavailable.");
    const feedback = input.session.configurationSnapshot.feedbackMode;
    if (!(mode.feedbackTiming.kind === "fixed" ? ["afterEachAnswer"] : ["afterEachAnswer", "atSessionEnd"]).includes(String(feedback))) throw new Error("Design Interview feedback configuration is invalid.");
    const expected = { kind: "practice", timer: "elapsedForeground", feedbackMode: feedback, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect" };
    if (JSON.stringify(input.session.configurationSnapshot) !== JSON.stringify(expected)) throw new Error("Design Interview session configuration is invalid.");
    if (input.session.actualLength < (mode.selection.kind === "evidence_conditioned" ? 1 : mode.minimumActualLength)) throw new Error("Design Interview session is below the accepted minimum length.");
    if (mode.selection.kind === "exact_ordered_questions" && JSON.stringify(input.session.itemOrder.map((entry) => entry.item.questionId)) !== JSON.stringify(mode.selection.questionIds.slice(0, input.session.actualLength))) throw new Error("Design Interview exact-order plan is invalid.");
    await validateCanonicalSessionPlan(this.catalog, this.interactions, input.session);
  }

  async submitPractice(input: Parameters<TrainingFamilyRuntime["submitPractice"]>[0]): Promise<PracticeSubmission> {
    await this.validateResume({ session: input.session, draft: null });
    const occurrence = input.session.itemOrder[input.session.currentItemIndex]!;
    const question = this.catalog.getQuestion(occurrence.item.questionId)!;
    const evaluation = this.interactions.evaluate(question.questionId, input.response);
    if (!evaluation.complete || !evaluation.result) throw new Error("Design Interview response is incomplete or invalid.");
    const result = evaluation.result;
    const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: input.response, result,
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }, answeredAt: input.now, committedAt: input.now });
    const matching = occurrence.reviewSourceSnapshot
      ? input.reviews.filter((entry) => entry.id === occurrence.reviewSourceSnapshot!.reviewEntryId && (sameLearningUnit(entry, attempt.reviewEvidence) || resolvedContentRefsEqual(entry.sourceItem, attempt.reviewEvidence.sourceItem)))
      : input.reviews.filter((entry) => entry.trackId === input.session.trackId && resolvedContentRefsEqual(entry.sourceItem, occurrence.item));
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
    })) throw new Error("Design Interview finalization requires one exact attempt per planned item.");
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds: session.itemOrder.map((occurrence) => occurrence.occurrenceId), unansweredOccurrenceIds: [], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: aggregateEvidence(session.activeForegroundMs, attempts) }) });
    return Object.freeze({ session, result });
  }

  async finalizeSimulation(input: Parameters<TrainingFamilyRuntime["finalizeSimulation"]>[0]): Promise<SimulationFinalization> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active" || !Number.isFinite(Date.parse(input.now)) || !Number.isFinite(Date.parse(input.draft.updatedAt)) || Date.parse(input.now) < Date.parse(input.draft.updatedAt)) throw new Error("Design Interview simulation cannot be finalized from this state.");
    const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
    if (profile.familyId !== FAMILY || profile.modeId !== "design-interview-simulation") throw new ProductModeUnavailableError("Design Interview simulation profile is unavailable.");
    const occurrenceId = input.session.itemOrder[0]!.occurrenceId;
    const responses = designSimulationResponses(input.draft.responsesByOccurrenceId[occurrenceId], profile.familyConfig.stages.map((stage) => stage.stageId));
    const completeness = Object.fromEntries(profile.familyConfig.stages.map((stage) => [stage.stageId, responses[stage.stageId]!.trim().length > 0]));
    const complete = Object.values(completeness).every(Boolean);
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: 1,
      answeredOccurrenceIds: complete ? [occurrenceId] : [], unansweredOccurrenceIds: complete ? [] : [occurrenceId], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: { profileId: profile.profileId, profileVersion: profile.profileVersion, caseId: profile.familyConfig.caseId, caseVersion: profile.familyConfig.caseVersion, responsesByStage: responses, stageCompleteness: completeness } }) });
    return Object.freeze({ session, result, attempts: Object.freeze([]), reviewMutations: Object.freeze([]), frozenDraft: input.draft });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active" || input.draft.familyId !== FAMILY || !Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1 || input.draft.revision !== input.expectedPreviousRevision + 1) throw new Error("Design Interview draft command identity or revision is invalid.");
    if (input.session.configurationSnapshot.timer === "absoluteDeadline" && Date.parse(input.draft.updatedAt) >= Date.parse(String(input.session.configurationSnapshot.timerDeadlineAt))) throw new Error("Design Interview simulation draft is after its immutable deadline.");
  }

  async queryDashboard(input: Parameters<TrainingFamilyRuntime["queryDashboard"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopeReviewsToLearningTrack(input.reviews, this.catalog); return Object.freeze({ trackId: input.trackId, activeSessionId: input.activeSession?.trackId === input.trackId && input.activeSession.artifactSha256 === this.catalog.artifactSha256 ? input.activeSession.id : undefined, attemptCount: scopeAttemptsToLearningTrack(input.attempts, this.catalog).length, dueReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "due_queue", input.now)).length, manualReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "manual_request", input.now)).length }); }
  async queryReview(input: Parameters<TrainingFamilyRuntime["queryReview"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); return Object.freeze({ trackId: input.trackId, due: Object.freeze(scopeReviewsToLearningTrack(input.reviews, this.catalog).filter((entry) => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.dueAt <= input.now)) }); }

  private mode(modeId: string): ProductModeConfig { try { return this.catalog.getMode(modeId); } catch { throw new ProductModeUnavailableError(`Design Interview mode ${modeId} is unavailable.`); } }
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
    return applyCanonicalPlanReplacements(session, replacements, slots.filter((slot) => !usedSlots.has(slot.slotId)));
  }
  private eligibleEvidence(mode: ProductModeConfig, reviews: readonly ReviewQueueEntry[], now: string, source: "due_queue" | "manual_request" | "session_misses" | undefined): readonly TrainingQuestionSummary[] {
    if (mode.selection.kind !== "evidence_conditioned") return this.catalog.getPool(mode.modeId);
    const selected = reviews.filter((entry) => source === "due_queue" ? this.isSelectedReviewEntry(entry, source, now) : source === "manual_request" ? this.isSelectedReviewEntry(entry, source, now) : false);
    return limitQuestionsToReviewNeeds(this.catalog.getPool(mode.modeId).filter((question) => selected.some((entry) => sameCurrentReviewUnit(entry, canonicalQuestionReviewEvidence(this.catalog, question), this.catalog))), selected, this.catalog);
  }
  private reviewForQuestion(question: TrainingQuestionSummary, candidates: readonly TrainingQuestionSummary[], reviews: readonly ReviewQueueEntry[], source: "due_queue" | "manual_request", now: string): ReviewQueueEntry | undefined {
    const selected = reviews.filter((entry) => this.isSelectedReviewEntry(entry, source, now) && sameCurrentReviewUnit(entry, canonicalQuestionReviewEvidence(this.catalog, question), this.catalog));
    return reviewNeedForQuestion(question, candidates, selected, this.catalog);
  }
  private isSelectedReviewEntry(entry: ReviewQueueEntry, source: "due_queue" | "manual_request", now: string): boolean { if (!isActiveReviewQueueEntry(entry) || !entry.dueAt) return false; const due = Date.parse(entry.dueAt); const current = Date.parse(now); if (!Number.isFinite(due) || !Number.isFinite(current)) return false; return source === "due_queue" ? due <= current : due > current && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined; }
  private usesDueQueueReview(modeId: string): boolean { return modeId === "design-interview-weak-area-review"; }
  private async prepareSimulation(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles);
    if (config.kind !== "design_interview_simulation" || profile.familyId !== FAMILY || input.trackId !== config.trackId || input.modeId !== config.modeId || simulationProfileId(input.request) !== config.profileId) throw new ProductModeUnavailableError("Design Interview Simulation requires its exact profile identity.");
    if (profile.familyConfig.schemaVersion !== "patternly-design-interview-simulation-config-v1") throw new ProductModeUnavailableError("Design Interview Simulation profile is unsupported.");
    const question = this.catalog.questions[0];
    if (!question || question.trackId !== this.catalog.trackId) throw new ProductModeUnavailableError("Design Interview simulation requires a canonical session anchor.");
    const sessionId = requireSessionId(input.request);
    const prepared = prepareCanonicalPlanOccurrences(this.catalog, this.interactions, sessionId, [{ item: ref(this.catalog, question) }]);
    const deadlineAt = new Date(Date.parse(input.now) + profile.familyConfig.timer.durationSeconds * 1000).toISOString();
    const session = await buildCanonicalSessionPlan(this.catalog, { sessionId, modeId: config.modeId, configurationSnapshot: designSimulationSnapshot(profile, deadlineAt), requestedLength: 1, preparedOccurrences: prepared, conditionalReinsertSlots: [], startedAt: input.now });
    const draft = createTrainingSessionDraft({ sessionId, trackId: this.catalog.trackId, familyId: FAMILY, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: input.now });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft });
  }
  private async validateSimulationResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles); const session = input.session;
    if (config.kind !== "design_interview_simulation" || profile.familyId !== FAMILY || session.trackId !== config.trackId || session.modeId !== config.modeId || profile.familyConfig.schemaVersion !== "patternly-design-interview-simulation-config-v1") throw new ProductModeUnavailableError("Design Interview simulation profile or mode is unavailable.");
    const deadline = new Date(Date.parse(session.startedAt) + profile.familyConfig.timer.durationSeconds * 1000).toISOString();
    await validateCanonicalSessionPlan(this.catalog, this.interactions, session);
    if (session.actualLength !== 1 || session.requestedLength !== 1 || session.itemOrder.length !== 1 || session.itemOrder[0]?.item.questionId !== this.catalog.questions[0]?.questionId || (session.conditionalReinsertSlots?.length ?? 0) !== 0 || JSON.stringify(session.configurationSnapshot) !== JSON.stringify(designSimulationSnapshot(profile, deadline))) throw new Error("Design Interview simulation snapshot or pinned plan is invalid.");
    const draft = input.draft;
    if (!draft || draft.schemaVersion !== 1 || draft.draftVersion !== 1 || draft.sessionId !== session.id || draft.trackId !== session.trackId || draft.familyId !== FAMILY || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || Date.parse(draft.updatedAt) < Date.parse(session.startedAt) || Date.parse(draft.updatedAt) > Date.parse(deadline) || Number.isNaN(Date.parse(draft.updatedAt))) throw new Error("Design Interview simulation draft identity, revision, or deadline is invalid.");
    const ids = new Set(session.itemOrder.map((entry) => entry.occurrenceId));
    if (Object.keys(draft.responsesByOccurrenceId).some((id) => !ids.has(id)) || draft.flaggedOccurrenceIds.some((id) => !ids.has(id)) || new Set(draft.flaggedOccurrenceIds).size !== draft.flaggedOccurrenceIds.length) throw new Error("Coding Interview simulation draft contains an unknown occurrence.");
    for (const [id, response] of Object.entries(draft.responsesByOccurrenceId)) { if (!ids.has(id)) throw new Error("Design Interview simulation response references an unknown occurrence."); designSimulationResponses(response, profile.familyConfig.stages.map((stage) => stage.stageId)); }
  }
}

function requestRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function parseRequest(value: unknown, fallback: number): Readonly<{ requestedLength: number; feedbackTiming?: string; reviewSource?: "due_queue" | "manual_request" | "session_misses" }> { const request = requestRecord(value); if (request.requestedLength !== undefined && (!Number.isSafeInteger(request.requestedLength) || Number(request.requestedLength) <= 0)) throw new Error("Design Interview requestedLength is invalid."); if (request.feedbackTiming !== undefined && request.feedbackTiming !== "after_each_durable_submit" && request.feedbackTiming !== "after_session_completion") throw new Error("Design Interview feedbackTiming is invalid."); const reviewSource = request.reviewSource; if (reviewSource !== undefined && reviewSource !== "due_queue" && reviewSource !== "manual_request" && reviewSource !== "session_misses") throw new Error("Design Interview reviewSource is invalid."); if (request.reviewItemRefs !== undefined && reviewSource !== "session_misses") throw new Error("Design Interview review item refs require session_misses."); return { requestedLength: typeof request.requestedLength === "number" ? request.requestedLength : fallback, feedbackTiming: typeof request.feedbackTiming === "string" ? request.feedbackTiming : undefined, reviewSource: reviewSource as "due_queue" | "manual_request" | "session_misses" | undefined }; }
function requireSessionId(value: unknown): string { const id = requestRecord(value).sessionId; if (typeof id !== "string" || !id.trim()) throw new Error("Design Interview preparation requires sessionId."); return id; }
function simulationProfileId(value: unknown): string | undefined { const scope = requestRecord(value).scope; return typeof requestRecord(scope).simulationProfileId === "string" ? String(requestRecord(scope).simulationProfileId) : undefined; }
function feedbackModeFor(mode: ProductModeConfig, requested?: string): "afterEachAnswer" | "atSessionEnd" { if (mode.feedbackTiming.kind === "fixed") { if (requested && requested !== "after_each_durable_submit") throw new Error("Design Interview mode has fixed feedback timing."); return "afterEachAnswer"; } return requested === "after_session_completion" ? "atSessionEnd" : "afterEachAnswer"; }
function validateEvidenceSource(mode: ProductModeConfig, source: "due_queue" | "manual_request" | "session_misses" | undefined): void { if (mode.selection.kind === "evidence_conditioned") { if (mode.selection.evidenceSources.length > 1 && !source) throw new Error("Design Interview multi-source review requires an explicit source."); const mapped = source === "session_misses" ? "committed_session_misses" : source === "manual_request" ? "due_queue" : source; if (mapped && !mode.selection.evidenceSources.includes(mapped)) throw new Error("Design Interview review source is unavailable."); } else if (source) throw new Error("Design Interview review source requires an evidence-conditioned mode."); }
function exactIdentity(catalog: TrainingCatalog): Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }> { return { trackId: catalog.trackId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }; }
function ref(catalog: TrainingCatalog, question: Pick<TrainingQuestionSummary, "questionId">): ResolvedContentRef { return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }); }
function assertTrack(actual: string, expected: string): void { if (actual !== expected) throw new Error("Design Interview query track mismatch."); }
function aggregateEvidence(activeForegroundMs: number, attempts: readonly TrainingAttempt<unknown>[]) { return { activeForegroundMs, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0), maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0) }; }
function designSimulationSnapshot(profile: CanonicalProductSimulationProfile, deadlineAt: string): TrainingSession["configurationSnapshot"] { if (profile.familyId !== FAMILY || profile.modeId !== "design-interview-simulation" || profile.familyConfig.schemaVersion !== "patternly-design-interview-simulation-config-v1") throw new ProductModeUnavailableError("Design Interview simulation profile is invalid."); return Object.freeze({ kind: "designInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "absoluteDeadline", timerDurationMs: profile.familyConfig.timer.durationSeconds * 1000, timerDeadlineAt: deadlineAt, simulationProfileId: profile.profileId, simulationProfileVersion: profile.profileVersion, simulationCaseId: profile.familyConfig.caseId, simulationCaseVersion: profile.familyConfig.caseVersion }); }
function designSimulationResponses(value: unknown, stageIds: readonly string[]): Record<string, string> { if (value === undefined) return Object.fromEntries(stageIds.map((id) => [id, ""])); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Design Interview stage responses must be a canonical record."); const record = value as Record<string, unknown>; if (JSON.stringify(Object.keys(record).sort()) !== JSON.stringify([...stageIds].sort()) || stageIds.some((id) => typeof record[id] !== "string")) throw new Error("Design Interview stage response identities or values are invalid."); return Object.fromEntries(stageIds.map((id) => [id, record[id] as string])); }
