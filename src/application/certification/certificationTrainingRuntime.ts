import { createTrainingAttempt, createTrainingSessionDraft, createTrainingSessionResult, completeTrainingSession, createFamilyEnvelope, isActiveReviewQueueEntry, createReviewSourceSnapshot, matchesReviewSourceSnapshot, manualRequestIdForEntry, type ReviewMutationCommand, type ReviewQueueEntry, type ReviewSourceSnapshot, type TrainingAttempt, type TrainingSession, type TrainingSessionDraft, type TrackFamilyId } from "../../domain";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime, FamilyPlanningModeBinding, TrainingCatalog, TrainingInteractionPort, TrainingQuestionSummary } from "../trainingLifecycle";
import { getProductSimulationModeConfig, ProductModeUnavailableError, resolveRequiredUnitFocusMode, type ProductModeConfig } from "../../content/canonical/productModeConfig";
import { consumeManualRequest, createMaintenanceCycle, createOrUpdateErrorCycle, transitionQualifiedSuccess } from "../../domain/learning/reviewCycleTransition";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import { isCanonicalOptionOrder, prepareCanonicalOptionOrder } from "../canonical/canonicalOptionOrder";
import { prepareCanonicalPlanOccurrences, buildCanonicalSessionPlan, validateCanonicalSessionPlan, applyCanonicalPlanReplacements, CANONICAL_TRAINING_RELEASE } from "../canonical/canonicalSessionPlanMechanics";
import { createCanonicalAttempt, scopeAttemptsToExactCatalog, scopeReviewsToExactCatalog } from "../canonical/canonicalFamilyMechanics";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";
import { qualifyPackageAttempts } from "../../domain/learning/packageCompletionRule";
import { allocateWeightedBlueprintQuotas } from "../../content/canonical/weightedBlueprintAllocation";
import type { CanonicalProductSimulationProfile } from "../../content/canonical/questionTypes";

const FAMILY: TrackFamilyId = "certification";
const RELEASE = CANONICAL_TRAINING_RELEASE;

/** Certification-owned admission, selection, scoring, review qualification, result and query policy. */
export class CertificationTrainingRuntime implements TrainingFamilyRuntime {
  readonly familyId = FAMILY;
  constructor(private readonly catalog: TrainingCatalog, readonly interactions: TrainingInteractionPort) {}

  getPlanningModeBinding(): FamilyPlanningModeBinding {
    const diagnosticModeId = "certification-diagnostic-baseline";
    return Object.freeze({
      trackId: this.catalog.trackId,
      diagnosticModeId: this.catalog.modes.some((mode) => mode.modeId === diagnosticModeId) ? diagnosticModeId : null,
      practiceModeId: "certification-focus-practice",
      dueReviewModeId: "certification-weak-area-review",
    });
  }

  async prepare(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    assertTrack(input.trackId, this.catalog.trackId);
    if (input.modeId === "certification-exam-simulation") {
      if (requestRecord(input.request).reviewSource !== undefined || requestRecord(input.request).reviewItemRefs !== undefined) throw new Error("Canonical reviewSource requires an evidence-conditioned mode.");
      return this.prepareSimulation(input);
    }
    const mode = this.mode(input.modeId);
    const request = parseRequest(input.request, mode.defaultRequestedLength);
    if (!mode.requestedLengths.includes(request.requestedLength)) throw new Error("Requested length is unavailable for this Certification mode.");
    validateEvidenceSource(mode, request.reviewSource);
    if (request.reviewSource === "session_misses") throw new Error("Certification session_misses requires verified completed-session evidence.");
    if (request.mentalUnitId !== undefined && (mode.modeId !== "certification-focus-practice" || mode.selection.kind !== "node")) throw new Error("Mental-unit scope is unavailable for this Certification mode.");
    if (request.expectedContentVersion !== undefined || request.expectedArtifactSha256 !== undefined) {
      if (mode.modeId !== "certification-focus-practice" || request.mentalUnitId === undefined || request.expectedContentVersion !== this.catalog.contentVersion || request.expectedArtifactSha256 !== this.catalog.artifactSha256) throw new Error("Focused-practice exact content identity is unavailable.");
    }
    const reviewSource = request.reviewSource ?? (mode.selection.kind === "evidence_conditioned" && mode.selection.evidenceSources.length === 1 && mode.selection.evidenceSources[0] === "due_queue" ? "due_queue" : undefined);
    const baseSource = mode.selection.kind === "evidence_conditioned" ? this.eligibleEvidence(mode, input.reviews, input.now, reviewSource) : this.catalog.getPool(mode.modeId);
    const selectedNodeId = request.mentalUnitId === undefined ? mode.selection.kind === "node" ? mode.selection.nodeId : undefined
      : this.catalog.completionRule?.ruleVersion === 3 ? requiredUnitNodeId(this.catalog, request.mentalUnitId) : mode.selection.kind === "node" ? mode.selection.nodeId : undefined;
    const v3UnitTarget = request.mentalUnitId !== undefined && isRequiredV3Unit(this.catalog, selectedNodeId, request.mentalUnitId);
    const source = request.mentalUnitId === undefined ? baseSource : selectedNodeId
      ? Object.freeze((v3UnitTarget ? this.catalog.questions : baseSource).filter((question) => question.nodeId === selectedNodeId && question.mentalUnitId === request.mentalUnitId))
      : (() => { throw new Error("Certification mental-unit scope requires a node-selected mode."); })();
    const coverageTargets = v3UnitTarget ? this.latestUncovered(source, input.attempts) : undefined;
    const scopedMode = v3UnitTarget ? resolveRequiredUnitFocusMode(mode, this.catalog.completionRule, selectedNodeId!, request.mentalUnitId!) : mode;
    const count = Math.min(request.requestedLength, source.length);
    if (count === 0 || (mode.selection.kind !== "evidence_conditioned" && count < scopedMode.minimumActualLength)) throw new Error("Certification mode has insufficient eligible content.");
    const questions = mode.selection.kind === "node"
      ? selectPracticeQuestions(source, input.attempts, exactIdentity(this.catalog), count, coverageTargets?.size ? coverageTargets : undefined)
      : source.slice(0, count);
    const feedbackMode = feedbackModeFor(mode, request.feedbackTiming);
    const usesReviewQueue = mode.selection.kind === "evidence_conditioned" && (reviewSource === "due_queue" || reviewSource === "manual_request");
    const orderedItems = questions.map((question) => {
      const item = ref(this.catalog, question);
      const sourceReview = usesReviewQueue ? input.reviews.find((entry) => this.isSelectedReviewEntry(entry, reviewSource!, input.now) && resolvedContentRefsEqual(entry.sourceItem, item)) : undefined;
      if (usesReviewQueue && !sourceReview) throw new Error("Certification review selection lost its exact source before the plan snapshot.");
      return { item, ...(sourceReview ? { reviewSourceSnapshot: createReviewSourceSnapshot(sourceReview, reviewSource!, input.now) } : {}) };
    });
    const sessionId = requireSessionId(input.request);
    const prepared = prepareCanonicalPlanOccurrences(this.catalog, this.interactions, sessionId, orderedItems);
    const slots = this.buildReinsertionSlots(mode, prepared.itemOrder, prepared.optionOrderByOccurrence);
    const session = await buildCanonicalSessionPlan(this.catalog, { sessionId, modeId: mode.modeId,
      configurationSnapshot: { kind: "practice", timer: "elapsedForeground", feedbackMode, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect", ...(request.mentalUnitId === undefined ? {} : { mentalUnitId: request.mentalUnitId }) },
      requestedLength: request.requestedLength, preparedOccurrences: prepared, conditionalReinsertSlots: slots, startedAt: input.now });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    if (input.session.modeId === "certification-exam-simulation") return this.validateSimulationResume(input);
    if (input.draft) throw new Error("Certification practice has no simulation draft.");
    const session = input.session;
    const mode = this.mode(session.modeId);
    if (!mode.requestedLengths.includes(session.requestedLength)) throw new ProductModeUnavailableError("Certification session mode or requested length is unavailable.");
    const rawUnitId = session.configurationSnapshot.mentalUnitId;
    if (rawUnitId !== undefined && (typeof rawUnitId !== "string" || !rawUnitId.trim())) throw new Error("Certification focused-practice scope is invalid.");
    const mentalUnitId = typeof rawUnitId === "string" ? rawUnitId : undefined;
    if (mentalUnitId !== undefined && (session.modeId !== "certification-focus-practice" || mode.selection.kind !== "node")) throw new Error("Certification focused-practice scope is invalid.");
    const selectedNodeId = mentalUnitId === undefined ? mode.selection.kind === "node" ? mode.selection.nodeId : undefined
      : this.catalog.completionRule?.ruleVersion === 3 ? requiredUnitNodeId(this.catalog, mentalUnitId) : mode.selection.kind === "node" ? mode.selection.nodeId : undefined;
    if (mentalUnitId !== undefined && !selectedNodeId) throw new Error("Certification focused-practice node is unavailable.");
    const scopedMode = mentalUnitId !== undefined && this.catalog.completionRule?.ruleVersion === 3 ? resolveRequiredUnitFocusMode(mode, this.catalog.completionRule, selectedNodeId!, mentalUnitId) : mode;
    const feedbackMode = session.configurationSnapshot.feedbackMode;
    if (!(mode.feedbackTiming.kind === "fixed" ? ["afterEachAnswer"] : ["afterEachAnswer", "atSessionEnd"]).includes(String(feedbackMode))) throw new Error("Certification session feedback timing is invalid.");
    const expected = { kind: "practice", timer: "elapsedForeground", feedbackMode, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect", ...(mentalUnitId === undefined ? {} : { mentalUnitId }) };
    if (JSON.stringify(session.configurationSnapshot) !== JSON.stringify(expected)) throw new Error("Certification session configuration snapshot is invalid.");
    if (session.actualLength < (mode.selection.kind === "evidence_conditioned" ? 1 : scopedMode.minimumActualLength) || session.itemOrder.some((occurrence) => {
      const question = this.catalog.getQuestion(occurrence.item.questionId);
      return !question || (mentalUnitId !== undefined && (question.nodeId !== selectedNodeId || question.mentalUnitId !== mentalUnitId));
    })) throw new Error("Certification session scope or minimum length is invalid.");
    if (mode.selection.kind === "exact_ordered_questions" && JSON.stringify(session.itemOrder.map((entry) => entry.item.questionId)) !== JSON.stringify(mode.selection.questionIds.slice(0, session.actualLength))) throw new Error("Certification exact-order session is invalid.");
    await validateCanonicalSessionPlan(this.catalog, this.interactions, session);
  }

  async submitPractice(input: Parameters<TrainingFamilyRuntime["submitPractice"]>[0]): Promise<PracticeSubmission> {
    await this.validateResume({ session: input.session, draft: null });
    const occurrence = input.session.itemOrder[input.session.currentItemIndex]!;
    const question = this.catalog.getQuestion(occurrence.item.questionId)!;
    const evaluation = this.interactions.evaluate(question.questionId, input.response);
    if (!evaluation.complete || !evaluation.result) throw new Error("Certification response is incomplete or invalid.");
    const result = evaluation.result;
    const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: input.response, result,
      reviewEvidence: evidenceFor(question, occurrence.item), answeredAt: input.now, committedAt: input.now });
    const matching = input.reviews.filter((entry) => entry.trackId === input.session.trackId && resolvedContentRefsEqual(entry.sourceItem, occurrence.item));
    const prior = matching.find(isActiveReviewQueueEntry);
    const completed = matching.some((entry) => entry.status === "completed");
    const dueSnapshot = occurrence.reviewSourceSnapshot;
    const usesDueQueue = this.usesDueQueueReview(input.session.modeId);
    const snapshotMatches = dueSnapshot !== undefined && prior !== undefined && matchesReviewSourceSnapshot(dueSnapshot, prior);
    const sourceExpired = result.kind === "correct" && dueSnapshot?.source === "manual_request" && prior?.dueAt !== undefined && Date.parse(attempt.answeredAt) >= Date.parse(prior.dueAt);
    const conflict = usesDueQueue && (!dueSnapshot || !snapshotMatches || sourceExpired);
    let reviewMutations: readonly ReviewMutationCommand[] = [];
    if (!conflict && result.kind !== "correct") {
      const consumeManual = Boolean(prior && dueSnapshot?.manualRequestId && snapshotMatches && (dueSnapshot.source === "due_queue" || dueSnapshot.source === "manual_request"));
      reviewMutations = [{ kind: "upsert", entry: createOrUpdateErrorCycle(prior, attempt, consumeManual), transitionAttemptId: attempt.id }];
    } else if (!conflict && usesDueQueue && dueSnapshot && snapshotMatches && prior?.dueAt && Date.parse(attempt.answeredAt) >= Date.parse(prior.dueAt)) {
      reviewMutations = [{ kind: "upsert", entry: transitionQualifiedSuccess(prior, attempt), transitionAttemptId: attempt.id }];
    } else if (!conflict && usesDueQueue && dueSnapshot?.source === "manual_request" && snapshotMatches && prior && result.kind === "correct") {
      reviewMutations = [{ kind: "upsert", entry: consumeManualRequest(prior), transitionAttemptId: attempt.id }];
    } else if (!conflict && !prior && !completed) reviewMutations = [{ kind: "upsert", entry: createMaintenanceCycle(attempt), transitionAttemptId: attempt.id }];
    const session = await this.resolveReinsertions(input.session, [...input.attempts, attempt]);
    return Object.freeze({ attempt, session, reviewMutations, reviewBaseline: input.reviews, ...(conflict ? { reviewSnapshotConflict: true } : {}) });
  }

  async finalizePractice(input: Parameters<TrainingFamilyRuntime["finalizePractice"]>[0]): Promise<PracticeFinalization> {
    await this.validateResume({ session: input.session, draft: null });
    const attempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    this.assertCompletePracticeAttemptSet(input.session, attempts);
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds: session.itemOrder.map((occurrence) => occurrence.occurrenceId), unansweredOccurrenceIds: [], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: aggregateEvidence(session.activeForegroundMs, attempts) }) });
    return Object.freeze({ session, result });
  }

  async finalizeSimulation(input: Parameters<TrainingFamilyRuntime["finalizeSimulation"]>[0]): Promise<SimulationFinalization> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active") throw new Error("Only an active Certification simulation can be finalized.");
    if (!Number.isFinite(Date.parse(input.now)) || Date.parse(input.now) < Date.parse(input.draft.updatedAt)) throw new Error("Certification simulation finalization time precedes the durable draft.");
    const prior = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    if (prior.length) throw new Error("Certification simulation already has attempts and cannot be finalized twice.");
    const attempts: TrainingAttempt<unknown>[] = [];
    const reviewMutations: ReviewMutationCommand[] = [];
    for (const occurrence of input.session.itemOrder) {
      if (!Object.hasOwn(input.draft.responsesByOccurrenceId, occurrence.occurrenceId)) continue;
      const response = input.draft.responsesByOccurrenceId[occurrence.occurrenceId];
      const question = this.catalog.getQuestion(occurrence.item.questionId);
      if (!question) throw new Error("Certification simulation draft contains an incomplete response.");
      const evaluation = this.interactions.evaluate(question.questionId, response);
      if (!evaluation.complete || !evaluation.result) throw new Error("Certification simulation draft contains an incomplete response.");
      const attempt = await createCanonicalAttempt({ session: input.session, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: evaluation.result, reviewEvidence: evidenceFor(question, occurrence.item), answeredAt: input.draft.updatedAt, committedAt: input.now });
      attempts.push(attempt);
      const matching = input.reviews.filter((entry) => entry.trackId === input.session.trackId && resolvedContentRefsEqual(entry.sourceItem, occurrence.item));
      const active = matching.find(isActiveReviewQueueEntry);
      const completed = matching.some((entry) => entry.status === "completed");
      if (attempt.result.kind !== "correct") reviewMutations.push({ kind: "upsert", entry: createOrUpdateErrorCycle(active, attempt), transitionAttemptId: attempt.id });
      else if (!active && !completed) reviewMutations.push({ kind: "upsert", entry: createMaintenanceCycle(attempt), transitionAttemptId: attempt.id });
    }
    const session = completeTrainingSession(input.session, input.now);
    const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
    const answeredOccurrenceIds = attempts.map((attempt) => attempt.occurrenceId);
    const answered = new Set(answeredOccurrenceIds);
    const unansweredOccurrenceIds = input.session.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId)).map((occurrence) => occurrence.occurrenceId);
    const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds, unansweredOccurrenceIds, completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: FAMILY, details: { profileId: profile.profileId, profileVersion: profile.profileVersion, ...aggregateEvidence(session.activeForegroundMs, attempts) } }) });
    return Object.freeze({ session, result, attempts: Object.freeze(attempts), reviewMutations: Object.freeze(reviewMutations), frozenDraft: input.draft, reviewBaseline: input.reviews });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active" || !Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1 || input.draft.revision !== input.expectedPreviousRevision + 1) throw new Error("Certification simulation draft command identity or state is invalid.");
    if (input.session.configurationSnapshot.timer === "absoluteDeadline" && Date.parse(input.draft.updatedAt) >= Date.parse(String(input.session.configurationSnapshot.timerDeadlineAt))) throw new Error("Certification simulation draft is after its immutable deadline.");
  }

  async queryDashboard(input: Parameters<TrainingFamilyRuntime["queryDashboard"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopeReviewsToExactCatalog(input.reviews, this.catalog); const attempts = scopeAttemptsToExactCatalog(input.attempts, this.catalog); return Object.freeze({ trackId: input.trackId, activeSessionId: input.activeSession?.trackId === input.trackId && input.activeSession.artifactSha256 === this.catalog.artifactSha256 ? input.activeSession.id : undefined, attemptCount: attempts.length, dueReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "due_queue", input.now)).length, manualReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "manual_request", input.now)).length }); }
  async queryProgress(input: Parameters<TrainingFamilyRuntime["queryProgress"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopeReviewsToExactCatalog(input.reviews, this.catalog); return Object.freeze({ trackId: input.trackId, attemptCount: scopeAttemptsToExactCatalog(input.attempts, this.catalog).length, dueReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "due_queue", input.now)).length, manualReviewCount: reviews.filter((entry) => this.isSelectedReviewEntry(entry, "manual_request", input.now)).length }); }
  async queryReview(input: Parameters<TrainingFamilyRuntime["queryReview"]>[0]): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); return Object.freeze({ trackId: input.trackId, due: Object.freeze(scopeReviewsToExactCatalog(input.reviews, this.catalog).filter((entry) => isActiveReviewQueueEntry(entry) && entry.dueAt !== undefined && entry.dueAt <= input.now)) }); }

  private mode(modeId: string): ProductModeConfig { try { return this.catalog.getMode(modeId); } catch { throw new ProductModeUnavailableError(`Certification mode ${this.catalog.trackId}/${modeId} is unavailable.`); } }
  private eligibleEvidence(mode: ProductModeConfig, reviews: readonly ReviewQueueEntry[], now: string, source: string | undefined): readonly TrainingQuestionSummary[] {
    if (mode.selection.kind !== "evidence_conditioned") return this.catalog.getPool(mode.modeId);
    const ids = new Set(scopeReviewsToExactCatalog(reviews, this.catalog).filter((entry) => source === "due_queue" ? this.isSelectedReviewEntry(entry, source, now) : source === "manual_request" ? this.isSelectedReviewEntry(entry, source, now) : false).map((entry) => entry.sourceItem.questionId));
    return this.catalog.getPool(mode.modeId).filter((question) => ids.has(question.questionId));
  }
  private latestUncovered(pool: readonly TrainingQuestionSummary[], attempts: readonly TrainingAttempt<unknown>[]): ReadonlySet<string> | undefined {
    if (this.catalog.completionRule?.ruleVersion !== 3) return undefined;
    const poolIds = new Set(pool.map((question) => question.questionId)); const latest = new Map<string, TrainingAttempt<unknown>>();
    for (const attempt of qualifyPackageAttempts(this.catalog, attempts)) if (poolIds.has(attempt.item.questionId)) latest.set(attempt.item.questionId, attempt);
    return new Set(pool.filter((question) => latest.get(question.questionId)?.result.kind !== "correct").map((question) => question.questionId));
  }
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
    const remaining = slots.filter((slot) => !usedSlots.has(slot.slotId));
    return applyCanonicalPlanReplacements(session, replacements, remaining);
  }
  private isSelectedReviewEntry(entry: ReviewQueueEntry, source: "due_queue" | "manual_request", now: string): boolean {
    if (!isActiveReviewQueueEntry(entry) || !entry.dueAt) return false; const due = Date.parse(entry.dueAt); const current = Date.parse(now); if (!Number.isFinite(due) || !Number.isFinite(current)) return false;
    if (source === "due_queue") return due <= current;
    return due > current && entry.reasons.includes("manual_mark") && manualRequestIdForEntry(entry) !== undefined;
  }
  private usesDueQueueReview(modeId: string): boolean { return modeId === "certification-weak-area-review" || modeId === "certification-quick-review"; }
  private assertCompletePracticeAttemptSet(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[]): void {
    const ids = new Set(attempts.map((attempt) => attempt.occurrenceId));
    if (attempts.length !== session.actualLength || ids.size !== session.actualLength || session.itemOrder.some((occurrence) => !ids.has(occurrence.occurrenceId)) || attempts.some((attempt) => { const occurrence = session.itemOrder.find((item) => item.occurrenceId === attempt.occurrenceId); return !occurrence || attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || !resolvedContentRefsEqual(attempt.item, occurrence.item); })) throw new Error("Certification finalization requires one unique attempt per planned item.");
  }
  private async prepareSimulation(input: Parameters<TrainingFamilyRuntime["prepare"]>[0]): Promise<PreparedSession> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles);
    if (config.kind !== "certification_exam_simulation" || profile.familyId !== FAMILY || input.trackId !== config.trackId || input.modeId !== config.modeId) throw new ProductModeUnavailableError("Certification simulation profile is unavailable.");
    if (!("durationMinutes" in profile.familyConfig)) throw new ProductModeUnavailableError("Certification simulation duration is unavailable.");
    const sessionId = requireSessionId(input.request); const questions = selectCertificationSimulationQuestions(this.catalog, profile);
    const deadlineAt = new Date(Date.parse(input.now) + profile.familyConfig.durationMinutes * 60_000).toISOString();
    const orderedItems = questions.map((question) => ({ item: ref(this.catalog, question) }));
    const prepared = prepareCanonicalPlanOccurrences(this.catalog, this.interactions, sessionId, orderedItems);
    const session = await buildCanonicalSessionPlan(this.catalog, { sessionId, modeId: config.modeId, configurationSnapshot: certificationSimulationSnapshot(profile, deadlineAt), requestedLength: questions.length, preparedOccurrences: prepared, conditionalReinsertSlots: [], startedAt: input.now });
    const draft = createTrainingSessionDraft({ sessionId, trackId: this.catalog.trackId, familyId: FAMILY, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: input.now });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft });
  }
  private async validateSimulationResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles); const session = input.session;
    if (config.kind !== "certification_exam_simulation" || profile.familyId !== FAMILY || session.trackId !== config.trackId || session.modeId !== config.modeId) throw new ProductModeUnavailableError("Certification simulation profile or mode is unavailable.");
    if (!("durationMinutes" in profile.familyConfig)) throw new ProductModeUnavailableError("Certification simulation duration is unavailable.");
    const deadline = new Date(Date.parse(session.startedAt) + profile.familyConfig.durationMinutes * 60_000).toISOString();
    if (!Number.isFinite(Date.parse(session.startedAt)) || JSON.stringify(session.configurationSnapshot) !== JSON.stringify(certificationSimulationSnapshot(profile, deadline))) throw new Error("Certification simulation snapshot or deadline is invalid.");
    const expected = selectCertificationSimulationQuestions(this.catalog, profile);
    await validateCanonicalSessionPlan(this.catalog, this.interactions, session);
    if (session.actualLength !== expected.length || session.requestedLength !== expected.length || session.itemOrder.length !== expected.length || new Set(session.itemOrder.map((entry) => entry.item.questionId)).size !== expected.length || session.itemOrder.some((entry, index) => entry.item.questionId !== expected[index]?.questionId) || (session.conditionalReinsertSlots?.length ?? 0) !== 0) throw new Error("Certification simulation plan differs from its weighted profile.");
    const draft = input.draft;
    if (!draft || draft.schemaVersion !== 1 || draft.draftVersion !== 1 || draft.sessionId !== session.id || draft.trackId !== session.trackId || draft.familyId !== FAMILY || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || Date.parse(draft.updatedAt) < Date.parse(session.startedAt) || (session.configurationSnapshot.timer === "absoluteDeadline" && Date.parse(draft.updatedAt) > Date.parse(deadline)) || Number.isNaN(Date.parse(draft.updatedAt))) throw new Error("Certification simulation draft identity, revision, or deadline is unavailable.");
    const ids = new Set(session.itemOrder.map((entry) => entry.occurrenceId));
    if (Object.keys(draft.responsesByOccurrenceId).some((id) => !ids.has(id)) || draft.flaggedOccurrenceIds.some((id) => !ids.has(id)) || new Set(draft.flaggedOccurrenceIds).size !== draft.flaggedOccurrenceIds.length) throw new Error("Certification simulation draft references an unknown occurrence.");
    for (const [id, response] of Object.entries(draft.responsesByOccurrenceId)) { const occurrence = session.itemOrder.find((entry) => entry.occurrenceId === id)!; if (!this.interactions.isComplete(occurrence.item.questionId, response)) throw new Error("Certification simulation response is incomplete."); }
  }
}

function parseRequest(value: unknown, fallback: number): Readonly<{ requestedLength: number; feedbackTiming?: string; reviewSource?: "due_queue" | "manual_request" | "session_misses"; mentalUnitId?: string; expectedContentVersion?: string; expectedArtifactSha256?: string }> {
  const request = requestRecord(value);
  if (request.requestedLength !== undefined && (!Number.isSafeInteger(request.requestedLength) || Number(request.requestedLength) <= 0)) throw new Error("Canonical requestedLength is invalid.");
  if (request.feedbackTiming !== undefined && request.feedbackTiming !== "after_each_durable_submit" && request.feedbackTiming !== "after_session_completion") throw new Error("Canonical feedbackTiming is invalid.");
  const reviewSource = request.reviewSource;
  if (reviewSource !== undefined && reviewSource !== "due_queue" && reviewSource !== "manual_request" && reviewSource !== "session_misses") throw new Error("Canonical reviewSource is invalid.");
  if (request.reviewItemRefs !== undefined && reviewSource !== "session_misses") throw new Error("Canonical review item refs require session_misses source.");
  if ("mentalUnitId" in request && (typeof request.mentalUnitId !== "string" || !request.mentalUnitId.trim())) throw new Error("Canonical mentalUnitId is invalid.");
  if ("expectedContentVersion" in request && (typeof request.expectedContentVersion !== "string" || !request.expectedContentVersion.trim())) throw new Error("Canonical expected contentVersion is invalid.");
  if ("expectedArtifactSha256" in request && (typeof request.expectedArtifactSha256 !== "string" || !/^[a-f0-9]{64}$/iu.test(String(request.expectedArtifactSha256)))) throw new Error("Canonical expected artifact checksum is invalid.");
  return { requestedLength: typeof request.requestedLength === "number" ? request.requestedLength : fallback, feedbackTiming: typeof request.feedbackTiming === "string" ? request.feedbackTiming : undefined, reviewSource: reviewSource as "due_queue" | "manual_request" | "session_misses" | undefined, mentalUnitId: typeof request.mentalUnitId === "string" ? request.mentalUnitId : undefined, expectedContentVersion: typeof request.expectedContentVersion === "string" ? request.expectedContentVersion : undefined, expectedArtifactSha256: typeof request.expectedArtifactSha256 === "string" ? request.expectedArtifactSha256 : undefined };
}
function requestRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function requireSessionId(value: unknown): string { const id = requestRecord(value).sessionId; if (typeof id !== "string" || !id.trim()) throw new Error("Certification preparation requires sessionId."); return id; }
function validateEvidenceSource(mode: ProductModeConfig, source: "due_queue" | "manual_request" | "session_misses" | undefined): void { if (mode.selection.kind === "evidence_conditioned") { if (mode.selection.evidenceSources.length > 1 && !source) throw new Error("Certification multi-source review requires an explicit reviewSource."); const mapped = source === "session_misses" ? "committed_session_misses" : source === "manual_request" ? "due_queue" : source; if (mapped && !mode.selection.evidenceSources.includes(mapped)) throw new Error("Certification reviewSource is unavailable for this mode."); } else if (source) throw new Error("Certification reviewSource requires an evidence-conditioned mode."); }
function feedbackModeFor(mode: ProductModeConfig, requested?: string): "afterEachAnswer" | "atSessionEnd" { if (mode.feedbackTiming.kind === "fixed") { if (requested && requested !== "after_each_durable_submit") throw new Error("Certification mode has fixed feedback timing."); return "afterEachAnswer"; } return requested === "after_session_completion" ? "atSessionEnd" : "afterEachAnswer"; }
function exactIdentity(catalog: TrainingCatalog): Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }> { return { trackId: catalog.trackId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }; }
function ref(catalog: TrainingCatalog, question: Pick<TrainingQuestionSummary, "questionId">): ResolvedContentRef { return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }); }
function evidenceFor(question: TrainingQuestionSummary, item: ResolvedContentRef): TrainingAttempt<unknown>["reviewEvidence"] { return { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }; }
function aggregateEvidence(activeForegroundMs: number, attempts: readonly TrainingAttempt<unknown>[]) { return { activeForegroundMs, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0), maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0) }; }
function assertTrack(actual: string, expected: string): void { if (actual !== expected) throw new Error("Certification runtime track mismatch."); }
function requiredUnitNodeId(catalog: TrainingCatalog, mentalUnitId: string): string | undefined { const rule = catalog.completionRule; if (rule?.ruleVersion !== 3) return undefined; const matches = rule.chapters.filter((chapter) => chapter.units.some((unit) => unit.mentalUnitId === mentalUnitId)); if (matches.length > 1) throw new Error("Canonical completion unit is ambiguous across required chapters."); return matches[0]?.nodeId; }
function isRequiredV3Unit(catalog: TrainingCatalog, nodeId: string | undefined, mentalUnitId: string): boolean { const rule = catalog.completionRule; return rule?.ruleVersion === 3 && nodeId !== undefined && rule.chapters.some((chapter) => chapter.nodeId === nodeId && chapter.units.some((unit) => unit.mentalUnitId === mentalUnitId)); }
function selectCertificationSimulationQuestions(catalog: TrainingCatalog, profile: CanonicalProductSimulationProfile): readonly TrainingQuestionSummary[] {
  if (profile.familyId !== FAMILY || profile.modeId !== "certification-exam-simulation") throw new ProductModeUnavailableError("Certification simulation profile is invalid.");
  const { blueprint, nodeDomainMap, questionCount } = profile.familyConfig; const targetCount = questionCount.minimum;
  if (blueprint.kind !== "weighted_sections" || !Number.isSafeInteger(targetCount) || targetCount !== 50) throw new Error("Certification simulation profile does not define the validated 50-item weighted blueprint.");
  const quotas = allocateWeightedBlueprintQuotas(targetCount, blueprint.sections); const selected: TrainingQuestionSummary[] = [];
  for (const section of quotas) { const pool = catalog.questions.filter((question) => question.contentDomainId === section.contentDomainId && nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0).slice().sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0); if (pool.length < section.questionCount) throw new Error(`Certification simulation source pool ${section.contentDomainId} requires ${section.questionCount} unique items but has ${pool.length}.`); selected.push(...pool.slice(0, section.questionCount)); }
  if (selected.length !== 50 || new Set(selected.map((question) => question.questionId)).size !== 50) throw new Error("Certification simulation blueprint did not produce exactly 50 unique items.");
  return Object.freeze(selected);
}
function certificationSimulationSnapshot(profile: CanonicalProductSimulationProfile, deadline: string): TrainingSession["configurationSnapshot"] { if (profile.familyId !== FAMILY || profile.modeId !== "certification-exam-simulation") throw new ProductModeUnavailableError("Certification simulation profile is invalid."); const config = profile.familyConfig; const policy = config.interactionPolicy; return Object.freeze({ kind: "certificationSimulation", feedbackMode: "atSessionEnd", answerChanges: policy.answerChanges === "until_final_submission" ? "untilFinalSubmission" : "none", navigation: policy.navigation, submission: "manualOrForegroundTimeout", timer: policy.timeout === "absolute_deadline" ? "absoluteDeadline" : "elapsedForeground", timerDurationMs: config.durationMinutes * 60_000, timerDeadlineAt: deadline, simulationProfileId: profile.profileId, simulationProfileVersion: profile.profileVersion, simulationPolicyId: policy.policyId, simulationPolicyVersion: policy.policyVersion, flagging: policy.flagging, navigator: policy.navigator, sectionIds: config.blueprint.sections.map((section) => section.id) }); }
