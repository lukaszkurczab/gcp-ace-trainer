import { createAttemptId } from "../learningMutations/identity";
import { createTrainingAttempt, createTrainingSession, createTrainingSessionDraft, createTrainingSessionResult, completeTrainingSession, createFamilyEnvelope, type ReviewMutationCommand, type ReviewQueueEntry, type TrainingAttempt, type TrainingSession, type TrainingSessionDraft, type TrackFamilyId } from "../../domain";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime } from "../trainingLifecycle";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { isCanonicalResponseComplete, scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import type { CanonicalProductSimulationProfile, Question } from "../../content/canonical/questionTypes";
import { getProductSimulationModeConfig, ProductModeUnavailableError, type ProductFeedbackTiming, type ProductModeConfig } from "../../content/canonical/productModeConfig";
import { retainReviewQueueEntryIdentity } from "../../domain/learning/reviewQueueEntry";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import { selectPracticeQuestions } from "./practiceQuestionSelector";
import { isCanonicalOptionOrder, prepareCanonicalOptionOrder } from "./canonicalOptionOrder";

const RELEASE = "canonical-content-v1";
const families: Record<string, string> = {
  "coding-interview-dsa-problem-solving": "coding_interview",
  "backend-system-design-interview": "design_interview",
  "frontend-system-design-interview": "design_interview",
  "object-oriented-design-interview": "design_interview",
};

export class CanonicalTrainingRuntime implements TrainingFamilyRuntime {
  readonly familyId: TrackFamilyId;
  constructor(private readonly catalog: CanonicalTrackRuntime, familyId = families[catalog.trackId] ?? "certification") { const expected = families[catalog.trackId] ?? "certification"; if (familyId !== expected) throw new Error("Canonical family routing does not match the track."); this.familyId = familyId; }

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== this.catalog.trackId) throw new Error("Canonical runtime track mismatch.");
    if (input.modeId === "certification-exam-simulation" || input.modeId === "coding-interview-simulation" || input.modeId === "design-interview-simulation") return this.prepareSimulation(input);
    let mode: ProductModeConfig; try { mode = this.catalog.getMode(input.modeId); } catch { throw new ProductModeUnavailableError(`Canonical mode ${input.trackId}/${input.modeId} is unavailable.`); } const req = requestOf(input.request, mode.defaultRequestedLength);
    if (!mode.requestedLengths.includes(req.requestedLength)) throw new Error("Requested length is unavailable for this canonical mode.");
    const source = mode.selection.kind === "evidence_conditioned" ? eligibleEvidence(this.catalog, mode, input.reviews, input.attempts, input.now) : this.catalog.getPool(mode.modeId);
    const count = Math.min(req.requestedLength, source.length); if (count === 0 || (mode.selection.kind !== "evidence_conditioned" && count < mode.minimumActualLength)) throw new Error("Canonical mode has insufficient eligible content.");
    const questions = mode.selection.kind === "node"
      ? selectPracticeQuestions(source, input.attempts, { trackId: this.catalog.trackId, contentVersion: this.catalog.contentVersion, artifactSha256: this.catalog.artifactSha256 }, count)
      : source.slice(0, count);
    const feedback = feedbackValue(mode.feedbackTiming, req.feedbackTiming);
    const items = questions.map((q, i) => ({ occurrenceId: `${input.request instanceof Object && "sessionId" in input.request ? String(input.request.sessionId) : "session"}:occurrence:${i}`, item: ref(this.catalog, q) }));
    const optionOrderByOccurrence = Object.fromEntries(items.map((o, i) => [o.occurrenceId, prepareCanonicalOptionOrder(questions[i]!, o.occurrenceId, o.item)]));
    const base = { id: requestSessionId(input.request), trackId: this.catalog.trackId, modeId: mode.modeId, configurationSnapshot: { kind: "practice", timer: "elapsedForeground", feedbackMode: feedback, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect" }, requestedLength: req.requestedLength, actualLength: count, currentItemIndex: 0, itemOrder: items, optionOrderByOccurrence, conditionalReinsertSlots: reinsertionSlots(mode, items, optionOrderByOccurrence), activeForegroundMs: 0, contentVersion: this.catalog.contentVersion, artifactSha256: this.catalog.artifactSha256, taxonomyVersion: RELEASE, status: "active" as const, startedAt: input.now };
    const session = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base as TrainingSession & { taxonomyVersion: string }) });
    return Object.freeze({ session, firstOccurrence: items[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    if (input.session.modeId === "certification-exam-simulation" || input.session.modeId === "coding-interview-simulation" || input.session.modeId === "design-interview-simulation") return this.validateSimulationResume(input);
    if (input.draft) throw new Error("Canonical practice has no simulation draft.");
    if (input.session.trackId !== this.catalog.trackId || input.session.contentVersion !== this.catalog.contentVersion || input.session.artifactSha256 !== this.catalog.artifactSha256 || input.session.taxonomyVersion !== RELEASE || !input.session.planFingerprint) throw new Error("Canonical session content identity is unavailable.");
    let mode: ProductModeConfig; try { mode = this.catalog.getMode(input.session.modeId); } catch { throw new ProductModeUnavailableError(`Canonical mode ${input.session.trackId}/${input.session.modeId} is unavailable.`); } if (!mode.requestedLengths.includes(input.session.requestedLength)) throw new ProductModeUnavailableError("Canonical session mode or requested length is unavailable.");
    const feedbackMode = input.session.configurationSnapshot.feedbackMode;
    const allowedFeedbackModes = mode.feedbackTiming.kind === "fixed" ? ["afterEachAnswer"] : ["afterEachAnswer", "atSessionEnd"];
    if (!allowedFeedbackModes.includes(String(feedbackMode))) throw new Error("Canonical session feedback timing is invalid.");
    const expectedSnapshot = { kind: "practice", timer: "elapsedForeground", feedbackMode, answerChanges: "none", submission: "perItem", reinsertEnabled: mode.reinsertPolicy === "conditional_after_incorrect" };
    if (JSON.stringify(input.session.configurationSnapshot) !== JSON.stringify(expectedSnapshot)) throw new Error("Canonical session configuration snapshot is invalid.");
    if (input.session.actualLength !== input.session.itemOrder.length || input.session.actualLength > input.session.requestedLength || input.session.itemOrder.some((o) => o.item.trackId !== this.catalog.trackId || o.item.questionId !== this.catalog.getQuestion(o.item.questionId)?.questionId || o.item.contentVersion !== this.catalog.contentVersion || o.item.artifactSha256 !== this.catalog.artifactSha256 || !this.catalog.getQuestion(o.item.questionId))) throw new Error("Canonical session item reference is unavailable.");
    if (mode.selection.kind === "exact_ordered_questions" && JSON.stringify(input.session.itemOrder.map((entry) => entry.item.questionId)) !== JSON.stringify(mode.selection.questionIds.slice(0, input.session.actualLength))) throw new Error("Canonical exact-order session plan is invalid.");
    if (!hasValidPreparedOrders(input.session, this.catalog)) throw new Error("Canonical session option order is invalid.");
    if (await createContentSessionPlanFingerprint(input.session as TrainingSession & { taxonomyVersion: string }) !== input.session.planFingerprint) throw new Error("Canonical session plan fingerprint is invalid.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    await this.validateResume({ session: input.session, draft: null }); const occurrence = input.session.itemOrder[input.session.currentItemIndex]!; const question = this.catalog.getQuestion(occurrence.item.questionId)!;
    if (!isCanonicalResponseComplete(question, input.response)) throw new Error("Canonical response is incomplete or invalid.");
    const result = scoreCanonicalQuestion(question, input.response); const attempt = createTrainingAttempt({ id: await createAttemptId(input.session.id, occurrence.occurrenceId, input.response), sessionId: input.session.id, trackId: input.session.trackId, modeId: input.session.modeId, occurrenceId: occurrence.occurrenceId, item: occurrence.item, response: input.response, result, reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] }, answeredAt: input.now, committedAt: input.now });
    const review: ReviewQueueEntry = { id: `review:${attempt.id}`, trackId: input.session.trackId, sourceAttemptId: attempt.id, sourceSessionId: input.session.id, sourceItem: occurrence.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs, reasons: [result.kind === "partial" ? "partial" : "incorrect"], dueAt: new Date(Date.parse(input.now) + 86400000).toISOString(), createdAt: input.now, consecutiveAfterDueSuccesses: 0, persistent: true };
    const prior = input.reviews.find((r) => r.trackId === input.session.trackId && resolvedContentRefsEqual(r.sourceItem, occurrence.item)); const due = prior !== undefined && input.now >= prior.dueAt; const sameSessionCorrection = prior !== undefined && prior.persistent && prior.sourceSessionId === attempt.sessionId;
    let mutations: readonly ReviewMutationCommand[] = [];
    if (result.kind !== "correct") { const candidate = prior ? { ...prior, dueAt: addDaysIso(input.now, 1), lastReviewedAt: input.now, persistent: true, reasons: [result.kind] as const, consecutiveAfterDueSuccesses: 0 } : review; mutations = [{ kind: "upsert", entry: prior ? retainReviewQueueEntryIdentity(prior, candidate) : candidate, transitionAttemptId: attempt.id }]; }
    else if (prior && due && !sameSessionCorrection) { const successes = prior.consecutiveAfterDueSuccesses + 1; mutations = successes >= 2 ? [{ kind: "remove", entry: prior, transitionAttemptId: attempt.id }] : [{ kind: "upsert", entry: retainReviewQueueEntryIdentity(prior, { ...prior, consecutiveAfterDueSuccesses: successes, lastReviewedAt: input.now }), transitionAttemptId: attempt.id }]; }
    else if (!prior && this.familyId === "coding_interview") { mutations = [{ kind: "upsert", entry: { ...review, dueAt: addDaysIso(input.now, 7), persistent: false, reasons: ["scheduled_retrieval"] }, transitionAttemptId: attempt.id }]; }
    const session = await resolveCanonicalReinsertions(input.session, [...input.attempts, attempt]);
    return Object.freeze({ attempt, session, reviewMutations: mutations });
  }

  async finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>): Promise<PracticeFinalization> {
    await this.validateResume({ session: input.session, draft: null }); const attempts = input.attempts.filter((a) => a.sessionId === input.session.id); const ids = new Set(attempts.map((a) => a.occurrenceId)); if (attempts.length !== input.session.actualLength || ids.size !== input.session.actualLength || input.session.itemOrder.some((o) => !ids.has(o.occurrenceId)) || attempts.some((a) => { const o = input.session.itemOrder.find((x) => x.occurrenceId === a.occurrenceId); return !o || a.trackId !== input.session.trackId || a.modeId !== input.session.modeId || !resolvedContentRefsEqual(a.item, o.item); })) throw new Error("Canonical finalization requires one unique attempt per item.");
    const session = completeTrainingSession(input.session, input.now); const result = createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength, answeredOccurrenceIds: session.itemOrder.map((o) => o.occurrenceId), unansweredOccurrenceIds: [], completedAt: input.now, evidence: createFamilyEnvelope({ familyId: this.familyId, details: { activeForegroundMs: session.activeForegroundMs, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length, pointsEarned: attempts.reduce((n, a) => n + a.result.earnedPoints, 0), maxPoints: attempts.reduce((n, a) => n + a.result.maxPoints, 0) } }) });
    return Object.freeze({ session, result });
  }

  async finalizeSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active") throw new Error("Only an active canonical simulation can be finalized.");
    if (!Number.isFinite(Date.parse(input.now)) || Date.parse(input.now) < Date.parse(input.draft.updatedAt)) throw new Error("Canonical simulation finalization time precedes the durable draft.");
    if (input.session.modeId === "design-interview-simulation") return this.finalizeDesignSimulation(input);
    const prior = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    if (prior.length) throw new Error("Canonical simulation already has attempts and cannot be finalized twice.");
    const attempts: TrainingAttempt<unknown>[] = [];
    const reviewMutations: ReviewMutationCommand[] = [];
    for (const occurrence of input.session.itemOrder) {
      if (!Object.hasOwn(input.draft.responsesByOccurrenceId, occurrence.occurrenceId)) continue;
      const response = input.draft.responsesByOccurrenceId[occurrence.occurrenceId];
      const question = this.catalog.getQuestion(occurrence.item.questionId);
      if (!question || !isCanonicalResponseComplete(question, response)) throw new Error("Canonical simulation draft contains an incomplete response.");
      const result = scoreCanonicalQuestion(question, response);
      const attempt = createTrainingAttempt({
        id: await createAttemptId(input.session.id, occurrence.occurrenceId, response), sessionId: input.session.id,
        trackId: input.session.trackId, modeId: input.session.modeId, occurrenceId: occurrence.occurrenceId,
        item: occurrence.item, response, result,
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] },
        answeredAt: input.draft.updatedAt, committedAt: input.now,
      });
      attempts.push(attempt);
      const existing = input.reviews.find((review) => review.trackId === input.session.trackId && resolvedContentRefsEqual(review.sourceItem, occurrence.item));
      if (result.kind !== "correct") {
        const entry: ReviewQueueEntry = existing
          ? retainReviewQueueEntryIdentity(existing, { ...existing, dueAt: addDaysIso(input.now, 1), lastReviewedAt: input.now, persistent: true, reasons: [result.kind], consecutiveAfterDueSuccesses: 0, sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId })
          : { id: `review:${attempt.id}`, trackId: input.session.trackId, sourceAttemptId: attempt.id, sourceSessionId: input.session.id, sourceItem: occurrence.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs, reasons: [result.kind], dueAt: addDaysIso(input.now, 1), createdAt: input.now, consecutiveAfterDueSuccesses: 0, persistent: true };
        reviewMutations.push({ kind: "upsert", entry, transitionAttemptId: attempt.id });
      } else if (existing && Date.parse(attempt.answeredAt) >= Date.parse(existing.dueAt) && !(existing.persistent && existing.sourceSessionId === attempt.sessionId)) {
        const successes = existing.consecutiveAfterDueSuccesses + 1;
        reviewMutations.push(successes >= 2
          ? { kind: "remove", entry: existing, transitionAttemptId: attempt.id }
          : { kind: "upsert", entry: retainReviewQueueEntryIdentity(existing, { ...existing, consecutiveAfterDueSuccesses: successes, lastReviewedAt: attempt.answeredAt }), transitionAttemptId: attempt.id });
      }
    }
    const answeredOccurrenceIds = attempts.map((attempt) => attempt.occurrenceId);
    const answered = new Set(answeredOccurrenceIds);
    const unansweredOccurrenceIds = input.session.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId)).map((occurrence) => occurrence.occurrenceId);
    const session = completeTrainingSession(input.session, input.now);
    const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
    const result = createTrainingSessionResult({
      id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength,
      answeredOccurrenceIds, unansweredOccurrenceIds, completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: this.familyId, details: {
        activeForegroundMs: session.activeForegroundMs, profileId: profile.profileId, profileVersion: profile.profileVersion,
        correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length,
        partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length,
        incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length,
        pointsEarned: attempts.reduce((total, attempt) => total + attempt.result.earnedPoints, 0),
        maxPoints: attempts.reduce((total, attempt) => total + attempt.result.maxPoints, 0),
      } }),
    });
    return Object.freeze({ session, result, attempts: Object.freeze(attempts), reviewMutations: Object.freeze(reviewMutations), frozenDraft: input.draft });
  }

  private finalizeDesignSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; now: string }>): SimulationFinalization {
    const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
    if (profile.familyId !== "design_interview" || profile.modeId !== "design-interview-simulation") throw new ProductModeUnavailableError("Design Interview simulation profile is unavailable.");
    const occurrenceId = input.session.itemOrder[0]!.occurrenceId;
    const responses = designSimulationResponses(input.draft.responsesByOccurrenceId[occurrenceId], profile.familyConfig.stages.map((stage) => stage.stageId));
    const completeness = Object.fromEntries(profile.familyConfig.stages.map((stage) => [stage.stageId, (responses[stage.stageId] ?? "").trim().length > 0]));
    const complete = Object.values(completeness).every(Boolean);
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({
      id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: 1,
      answeredOccurrenceIds: complete ? [occurrenceId] : [], unansweredOccurrenceIds: complete ? [] : [occurrenceId], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: this.familyId, details: {
        profileId: profile.profileId, profileVersion: profile.profileVersion,
        caseId: profile.familyConfig.caseId, caseVersion: profile.familyConfig.caseVersion,
        responsesByStage: responses, stageCompleteness: completeness,
      } }),
    });
    return Object.freeze({ session, result, attempts: Object.freeze([]), reviewMutations: Object.freeze([]), frozenDraft: input.draft });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateSimulationResume({ session: input.session, draft: input.draft });
    if (input.session.status !== "active") throw new Error("Only an active session can accept a canonical simulation draft command.");
    if (!Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1) throw new Error("Canonical simulation previous draft revision is invalid.");
    if (input.draft.sessionId !== input.session.id || input.draft.trackId !== input.session.trackId || input.draft.familyId !== this.familyId || input.draft.revision !== input.expectedPreviousRevision + 1) throw new Error("Canonical simulation draft command identity or revision is invalid.");
    if (input.session.configurationSnapshot.timer === "absoluteDeadline") {
      const deadline = Date.parse(String(input.session.configurationSnapshot.timerDeadlineAt));
      if (Date.parse(input.draft.updatedAt) >= deadline) throw new Error("Canonical simulation draft cannot be changed at or after its immutable deadline.");
    }
  }

  private async prepareSimulation(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles);
    if (input.trackId !== config.trackId || input.modeId !== config.modeId || this.familyId !== config.familyId) throw new ProductModeUnavailableError(`Simulation mode ${input.trackId}/${input.modeId} is unavailable.`);
    if (config.kind !== "certification_exam_simulation" && requestSimulationProfileId(input.request) !== config.profileId) throw new ProductModeUnavailableError("Interview Simulation requires its exact canonical profile identity.");
    const sessionId = requestSessionId(input.request);
    const questions = selectSimulationQuestions(this.catalog, profile);
    const durationMs = profile.familyId === "design_interview" ? profile.familyConfig.timer.durationSeconds * 1000 : profile.familyConfig.durationMinutes * 60_000;
    const deadlineAt = new Date(Date.parse(input.now) + durationMs).toISOString();
    const snapshot = simulationSnapshot(profile, deadlineAt);
    const items = questions.map((question, index) => ({ occurrenceId: `${sessionId}:occurrence:${index}`, item: ref(this.catalog, question) }));
    const optionOrderByOccurrence = Object.fromEntries(items.map((occurrence, index) => [occurrence.occurrenceId, prepareCanonicalOptionOrder(questions[index]!, occurrence.occurrenceId, occurrence.item)]));
    const base = {
      id: sessionId, trackId: this.catalog.trackId, modeId: config.modeId, configurationSnapshot: snapshot,
      requestedLength: questions.length, actualLength: questions.length, currentItemIndex: 0, itemOrder: items,
      optionOrderByOccurrence, conditionalReinsertSlots: [], activeForegroundMs: 0,
      contentVersion: this.catalog.contentVersion, artifactSha256: this.catalog.artifactSha256,
      taxonomyVersion: RELEASE, status: "active" as const, startedAt: input.now,
    };
    const session = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base as TrainingSession & { taxonomyVersion: string }) });
    const draft = createTrainingSessionDraft({ sessionId, trackId: this.catalog.trackId, familyId: this.familyId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: input.now });
    return Object.freeze({ session, firstOccurrence: items[0]!.item, draft });
  }

  private async validateSimulationResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    const { config, profile } = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles);
    const session = input.session;
    if (session.trackId !== config.trackId || session.modeId !== config.modeId || this.familyId !== config.familyId || session.contentVersion !== this.catalog.contentVersion || session.artifactSha256 !== this.catalog.artifactSha256 || session.taxonomyVersion !== RELEASE || !session.planFingerprint) throw new ProductModeUnavailableError("Canonical simulation profile, mode, or content identity is unavailable.");
    const durationMs = profile.familyId === "design_interview" ? profile.familyConfig.timer.durationSeconds * 1000 : profile.familyConfig.durationMinutes * 60_000;
    const deadline = new Date(Date.parse(session.startedAt) + durationMs).toISOString();
    if (!Number.isFinite(Date.parse(session.startedAt)) || JSON.stringify(session.configurationSnapshot) !== JSON.stringify(simulationSnapshot(profile, deadline))) throw new Error("Canonical simulation configuration snapshot or deadline is invalid.");
    const questions = selectSimulationQuestions(this.catalog, profile);
    if (session.actualLength !== questions.length || session.requestedLength !== questions.length || session.itemOrder.length !== questions.length || new Set(session.itemOrder.map((entry) => entry.item.questionId)).size !== questions.length || session.itemOrder.some((entry, index) => entry.occurrenceId !== `${session.id}:occurrence:${index}` || entry.item.questionId !== questions[index]?.questionId || entry.item.trackId !== this.catalog.trackId || entry.item.contentVersion !== this.catalog.contentVersion || entry.item.artifactSha256 !== this.catalog.artifactSha256)) throw new Error("Canonical simulation item plan is unavailable or changed.");
    if (!hasValidPreparedOrders(session, this.catalog) || (session.conditionalReinsertSlots?.length ?? 0) !== 0) throw new Error("Canonical simulation option order or plan is invalid.");
    if (await createContentSessionPlanFingerprint(session as TrainingSession & { taxonomyVersion: string }) !== session.planFingerprint) throw new Error("Canonical simulation plan fingerprint is invalid.");
    const draft = input.draft;
    if (!draft || draft.schemaVersion !== 1 || draft.draftVersion !== 1 || draft.sessionId !== session.id || draft.trackId !== session.trackId || draft.familyId !== this.familyId || !Number.isSafeInteger(draft.revision) || draft.revision < 1 || Date.parse(draft.updatedAt) < Date.parse(session.startedAt) || (session.configurationSnapshot.timer === "absoluteDeadline" && Date.parse(draft.updatedAt) > Date.parse(deadline)) || Number.isNaN(Date.parse(draft.updatedAt))) throw new Error("Canonical simulation draft identity, revision, or deadline is unavailable.");
    const occurrenceIds = new Set(session.itemOrder.map((entry) => entry.occurrenceId));
    if (Object.keys(draft.responsesByOccurrenceId).some((id) => !occurrenceIds.has(id)) || draft.flaggedOccurrenceIds.some((id) => !occurrenceIds.has(id)) || new Set(draft.flaggedOccurrenceIds).size !== draft.flaggedOccurrenceIds.length) throw new Error("Canonical simulation draft references an occurrence outside its immutable plan.");
    for (const [occurrenceId, response] of Object.entries(draft.responsesByOccurrenceId)) {
      const occurrence = session.itemOrder.find((entry) => entry.occurrenceId === occurrenceId)!;
      if (session.modeId === "design-interview-simulation") {
        const profile = getProductSimulationModeConfig(this.catalog.trackId, this.catalog.simulationProfiles).profile;
        if (profile.familyId !== "design_interview" || profile.modeId !== "design-interview-simulation") throw new ProductModeUnavailableError("Design Interview simulation profile is unavailable.");
        designSimulationResponses(response, profile.familyConfig.stages.map((stage) => stage.stageId));
        continue;
      }
      if (!isCanonicalResponseComplete(this.catalog.getQuestion(occurrence.item.questionId)!, response)) throw new Error("Canonical simulation draft contains an incomplete or noncanonical response.");
    }
  }
  async queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopedReviews(input.reviews, this.catalog); return Object.freeze({ trackId: input.trackId, activeSessionId: input.activeSession?.trackId === input.trackId && input.activeSession.artifactSha256 === this.catalog.artifactSha256 ? input.activeSession.id : undefined, attemptCount: scopedAttempts(input.attempts, this.catalog).length, dueReviewCount: reviews.filter((r) => r.dueAt <= input.now).length }); }
  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); const reviews = scopedReviews(input.reviews, this.catalog); return Object.freeze({ trackId: input.trackId, attemptCount: scopedAttempts(input.attempts, this.catalog).length, dueReviewCount: reviews.filter((r) => r.dueAt <= input.now).length }); }
  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> { assertTrack(input.trackId, this.catalog.trackId); return Object.freeze({ trackId: input.trackId, due: Object.freeze(scopedReviews(input.reviews, this.catalog).filter((r) => r.dueAt <= input.now)) }); }
}

function selectSimulationQuestions(catalog: CanonicalTrackRuntime, profile: CanonicalProductSimulationProfile): readonly Question[] {
  if (profile.familyId === "design_interview" && profile.modeId === "design-interview-simulation") {
    const question = catalog.questions[0];
    if (!question || question.trackId !== catalog.trackId) throw new ProductModeUnavailableError("Design Interview requires a canonical session anchor.");
    return Object.freeze([question]);
  }
  if (profile.familyId === "coding_interview" && profile.modeId === "coding-interview-simulation") {
    const ids = profile.familyConfig.eligibleQuestionIds;
    if (profile.familyConfig.schemaVersion !== "patternly-coding-interview-simulation-config-v1" || ids.length !== 40 || new Set(ids).size !== 40) throw new ProductModeUnavailableError("Coding Interview Simulation profile does not declare 40 unique questions.");
    const selected = ids.map((questionId) => catalog.getQuestion(questionId));
    if (selected.some((question) => !question || question.trackId !== catalog.trackId)) throw new ProductModeUnavailableError("Coding Interview Simulation profile references unavailable canonical questions.");
    return Object.freeze(selected as Question[]);
  }
  if (profile.familyId !== "certification" || profile.modeId !== "certification-exam-simulation") throw new ProductModeUnavailableError("Canonical simulation profile family and mode are unavailable.");
  const { blueprint, nodeDomainMap, questionCount } = profile.familyConfig;
  const targetCount = questionCount.minimum;
  if (blueprint.kind !== "weighted_sections" || !Number.isSafeInteger(targetCount) || targetCount !== 50 || blueprint.sections.reduce((sum, section) => sum + section.weightPercent, 0) !== 100) throw new Error("Canonical simulation profile does not define the validated 50-item weighted blueprint.");
  const selected: Question[] = [];
  for (const section of blueprint.sections) {
    const exactCount = targetCount * section.weightPercent / 100;
    if (!Number.isSafeInteger(exactCount)) throw new Error("Canonical simulation blueprint does not produce whole-item quotas.");
    const pool = catalog.questions.filter((question) => question.contentDomainId === section.contentDomainId && nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0).slice().sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0);
    if (pool.length < exactCount) throw new Error(`Canonical simulation source pool ${section.contentDomainId} requires ${exactCount} unique items but has ${pool.length}.`);
    selected.push(...pool.slice(0, exactCount));
  }
  if (selected.length !== 50 || new Set(selected.map((question) => question.questionId)).size !== 50) throw new Error("Canonical simulation blueprint did not produce exactly 50 unique items.");
  return Object.freeze(selected);
}

function simulationSnapshot(profile: CanonicalProductSimulationProfile, deadlineAt: string): TrainingSession["configurationSnapshot"] {
  if (profile.familyId === "design_interview" && profile.modeId === "design-interview-simulation") {
    return Object.freeze({ kind: "designInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "absoluteDeadline", timerDurationMs: profile.familyConfig.timer.durationSeconds * 1000, timerDeadlineAt: deadlineAt, simulationProfileId: profile.profileId, simulationProfileVersion: profile.profileVersion, simulationCaseId: profile.familyConfig.caseId, simulationCaseVersion: profile.familyConfig.caseVersion });
  }
  if (profile.familyId === "coding_interview" && profile.modeId === "coding-interview-simulation") {
    const config = profile.familyConfig;
    const durationMs = config.durationMinutes * 60_000;
    return Object.freeze({
      kind: "algorithmsInterviewSimulation",
      feedbackMode: "atSessionEnd",
      answerChanges: config.answerChangePolicy === "editable_until_finalization" ? "untilFinalSubmission" : "none",
      navigation: config.navigationPolicy === "free_navigation" ? "free" : "linear",
      submission: "manualOrForegroundTimeout",
      timer: "countdownForeground",
      timerDurationMs: durationMs,
      simulationProfileId: profile.profileId,
      simulationProfileVersion: profile.profileVersion,
      simulationBlueprintId: config.blueprintId,
      simulationBlueprintVersion: config.blueprintVersion,
      simulationPoolId: config.poolId,
      simulationPoolVersion: config.poolVersion,
    });
  }
  if (profile.familyId !== "certification" || profile.modeId !== "certification-exam-simulation") throw new ProductModeUnavailableError("Canonical simulation profile family and mode are unavailable.");
  const config = profile.familyConfig;
  const policy = config.interactionPolicy;
  return Object.freeze({
    kind: "certificationSimulation",
    feedbackMode: "atSessionEnd",
    answerChanges: policy.answerChanges === "until_final_submission" ? "untilFinalSubmission" : "none",
    navigation: policy.navigation,
    submission: "manualOrForegroundTimeout",
    timer: policy.timeout === "absolute_deadline" ? "absoluteDeadline" : "elapsedForeground",
    timerDurationMs: config.durationMinutes * 60_000,
    timerDeadlineAt: deadlineAt,
    simulationProfileId: profile.profileId,
    simulationProfileVersion: profile.profileVersion,
    simulationPolicyId: policy.policyId,
    simulationPolicyVersion: policy.policyVersion,
    flagging: policy.flagging,
    navigator: policy.navigator,
    sectionIds: config.blueprint.sections.map((section) => section.id),
  });
}

function designSimulationResponses(value: unknown, stageIds: readonly string[]): Record<string, string> {
  if (value === undefined) return Object.fromEntries(stageIds.map((stageId) => [stageId, ""]));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Design Interview stage responses must be a canonical record.");
  const record = value as Record<string, unknown>;
  if (JSON.stringify(Object.keys(record).sort()) !== JSON.stringify([...stageIds].sort()) || stageIds.some((stageId) => typeof record[stageId] !== "string")) throw new Error("Design Interview stage response identities or values are invalid.");
  return Object.fromEntries(stageIds.map((stageId) => [stageId, record[stageId] as string]));
}

function requestSimulationProfileId(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const request = value as Record<string, unknown>;
  if (!request.scope || typeof request.scope !== "object" || Array.isArray(request.scope)) return undefined;
  const scope = request.scope as Record<string, unknown>;
  return typeof scope.simulationProfileId === "string" ? scope.simulationProfileId : undefined;
}

function requestOf(value: unknown, fallback: number): { requestedLength: number; feedbackTiming?: string } { const r = value && typeof value === "object" ? value as Record<string, unknown> : {}; if (r.requestedLength !== undefined && (!Number.isSafeInteger(r.requestedLength) || Number(r.requestedLength) <= 0)) throw new Error("Canonical requestedLength is invalid."); if (r.feedbackTiming !== undefined && r.feedbackTiming !== "after_each_durable_submit" && r.feedbackTiming !== "after_session_completion") throw new Error("Canonical feedbackTiming is invalid."); return { requestedLength: typeof r.requestedLength === "number" ? r.requestedLength : fallback, feedbackTiming: typeof r.feedbackTiming === "string" ? r.feedbackTiming : undefined }; }
function requestSessionId(value: unknown): string { const r = value && typeof value === "object" ? value as Record<string, unknown> : {}; if (typeof r.sessionId !== "string" || !r.sessionId.trim()) throw new Error("Canonical preparation requires sessionId."); return r.sessionId; }
function ref(catalog: CanonicalTrackRuntime, question: Question): ResolvedContentRef { return createResolvedContentRef({ trackId: catalog.trackId, questionId: question.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 }); }
function hasValidPreparedOrders(session: TrainingSession, catalog: CanonicalTrackRuntime): boolean {
  const orders = session.optionOrderByOccurrence;
  if (Object.keys(orders).length !== session.itemOrder.length || Object.keys(orders).some((id) => !session.itemOrder.some((occurrence) => occurrence.occurrenceId === id))) return false;
  const validOrder = (item: ResolvedContentRef, order: unknown) => {
    const question = catalog.getQuestion(item.questionId);
    return item.trackId === catalog.trackId && item.contentVersion === catalog.contentVersion && item.artifactSha256 === catalog.artifactSha256 && Boolean(question && isCanonicalOptionOrder(question, order));
  };
  if (session.itemOrder.some((occurrence) => !validOrder(occurrence.item, orders[occurrence.occurrenceId]))) return false;
  for (const slot of session.conditionalReinsertSlots ?? []) {
    if (!validOrder(slot.ordinaryBranch.occurrence.item, slot.ordinaryBranch.optionOrder) || JSON.stringify(slot.ordinaryBranch.optionOrder) !== JSON.stringify(orders[slot.ordinaryBranch.occurrence.occurrenceId])) return false;
    if (slot.exactSourceBranch && (!validOrder(slot.exactSourceBranch.occurrence.item, slot.exactSourceBranch.optionOrder) || JSON.stringify(slot.exactSourceBranch.optionOrder) !== JSON.stringify(orders[slot.sourceOccurrenceId]))) return false;
    if (slot.reviewedVariantBranch && !validOrder(slot.reviewedVariantBranch.occurrence.item, slot.reviewedVariantBranch.optionOrder)) return false;
  }
  return true;
}
function feedbackValue(policy: ProductFeedbackTiming, requested?: string): string { if (policy.kind === "fixed") { if (requested && requested !== "after_each_durable_submit") throw new Error("This mode has fixed feedback timing."); return "afterEachAnswer"; } return requested === "after_session_completion" ? "atSessionEnd" : "afterEachAnswer"; }
function eligibleEvidence(catalog: CanonicalTrackRuntime, mode: ProductModeConfig, reviews: readonly ReviewQueueEntry[], attempts: readonly TrainingAttempt<unknown>[], now: string): readonly Question[] { const selection = mode.selection; if (selection.kind !== "evidence_conditioned") return catalog.getPool(mode.modeId); const ids = new Set<string>(); if (selection.evidenceSources.includes("due_queue")) scopedReviews(reviews, catalog).filter((r) => r.dueAt <= now).forEach((r) => ids.add(r.sourceItem.questionId)); if (selection.evidenceSources.includes("committed_session_misses")) scopedAttempts(attempts, catalog).filter((a) => a.result.kind !== "correct").forEach((a) => ids.add(a.item.questionId)); return catalog.getPool(mode.modeId).filter((q) => ids.has(q.questionId)); }
function reinsertionSlots(mode: ProductModeConfig, items: readonly { occurrenceId: string; item: ResolvedContentRef }[], orders: Readonly<Record<string, readonly string[]>>) { if (mode.reinsertPolicy !== "conditional_after_incorrect") return []; return items.slice(0, Math.max(0, items.length - 4)).map((source, i) => { const ordinary = items[i + 4]!; return { slotId: `${source.occurrenceId}:conditional:${i + 4}`, sourceOccurrenceId: source.occurrenceId, ordinaryBranch: { occurrence: ordinary, optionOrder: orders[ordinary.occurrenceId] ?? [] }, exactSourceBranch: { occurrence: { occurrenceId: `${source.occurrenceId}:conditional:${i + 4}:exact`, item: source.item }, optionOrder: orders[source.occurrenceId] ?? [] }, resolutionRule: "incorrect_or_partial_after_three_materialized_submissions" as const }; }); }
function addDaysIso(value: string, days: number): string { const d = new Date(value); d.setUTCDate(d.getUTCDate() + days); return d.toISOString(); }
function assertTrack(actual: string, expected: string): void { if (actual !== expected) throw new Error("Canonical query track mismatch."); }
function scopedReviews(reviews: readonly ReviewQueueEntry[], catalog: CanonicalTrackRuntime): readonly ReviewQueueEntry[] { return reviews.filter((r) => r.trackId === catalog.trackId && r.sourceItem.trackId === catalog.trackId && r.sourceItem.contentVersion === catalog.contentVersion && r.sourceItem.artifactSha256 === catalog.artifactSha256); }
function scopedAttempts(attempts: readonly TrainingAttempt<unknown>[], catalog: CanonicalTrackRuntime): readonly TrainingAttempt<unknown>[] { return attempts.filter((attempt) => attempt.trackId === catalog.trackId && attempt.item.trackId === catalog.trackId && attempt.item.contentVersion === catalog.contentVersion && attempt.item.artifactSha256 === catalog.artifactSha256); }

async function resolveCanonicalReinsertions(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[]): Promise<TrainingSession> {
  const slots = session.conditionalReinsertSlots ?? [];
  if (!slots.length) return session;
  const attemptByOccurrence = new Map(attempts.filter((attempt) => attempt.sessionId === session.id).map((attempt) => [attempt.occurrenceId, attempt]));
  const indexByOccurrence = new Map(session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, index]));
  let changed = false;
  const resolvedSlotIds = new Set<string>();
  const itemOrder = [...session.itemOrder];
  const optionOrderByOccurrence = { ...session.optionOrderByOccurrence };
  for (const slot of slots) {
    const targetIndex = indexByOccurrence.get(slot.ordinaryBranch.occurrence.occurrenceId);
    const sourceIndex = indexByOccurrence.get(slot.sourceOccurrenceId);
    const sourceAttempt = attemptByOccurrence.get(slot.sourceOccurrenceId);
    const alternative = slot.reviewedVariantBranch ?? slot.exactSourceBranch;
    if (targetIndex === undefined || sourceIndex === undefined || !alternative || !sourceAttempt || (sourceAttempt.result.kind !== "incorrect" && sourceAttempt.result.kind !== "partial")) continue;
    const intervening = [...attemptByOccurrence.values()].filter((candidate) => {
      const index = indexByOccurrence.get(candidate.occurrenceId);
      return index !== undefined && index > sourceIndex && index < targetIndex;
    }).length;
    if (intervening < 3 || attemptByOccurrence.has(slot.ordinaryBranch.occurrence.occurrenceId) || attemptByOccurrence.has(alternative.occurrence.occurrenceId)) continue;
    itemOrder[targetIndex] = alternative.occurrence;
    delete optionOrderByOccurrence[slot.ordinaryBranch.occurrence.occurrenceId];
    optionOrderByOccurrence[alternative.occurrence.occurrenceId] = alternative.optionOrder;
    resolvedSlotIds.add(slot.slotId);
    changed = true;
  }
  if (!changed) return session;
  const remainingOccurrenceIds = new Set(itemOrder.map((occurrence) => occurrence.occurrenceId));
  const remainingSlots = slots.filter((slot) => !resolvedSlotIds.has(slot.slotId) && remainingOccurrenceIds.has(slot.sourceOccurrenceId) && remainingOccurrenceIds.has(slot.ordinaryBranch.occurrence.occurrenceId));
  const candidate = createTrainingSession({ ...session, itemOrder, optionOrderByOccurrence, conditionalReinsertSlots: remainingSlots, planFingerprint: undefined, taxonomyVersion: undefined });
  return createTrainingSession({ ...candidate, taxonomyVersion: RELEASE, planFingerprint: await createContentSessionPlanFingerprint({ ...candidate, taxonomyVersion: RELEASE }) });
}
