import {
  completeTrainingSession,
  createFamilyEnvelope,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionDraft,
  createTrainingSessionResult,
  retainReviewQueueEntryIdentity,
  contentPackagePinsEqual,
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
import type { CertificationRuntimeCatalog } from "../../tracks/certification/certificationRuntimeCatalog";
import type { PublishedCertificationDiagnosticBaseline, PublishedCertificationExamExperienceProfile, PublishedCertificationFocusPractice, PublishedCertificationMixedPractice, PublishedCertificationQuickReview, PublishedCertificationScenarioPractice, PublishedCertificationWeakAreaReview } from "../../content/contracts";
import {
  buildCloudCertificationProgressViewModel,
  CERTIFICATION_MODE_IDS,
  createCertificationReviewEntry,
  getCertificationMode,
  scoreCertificationQuestion,
  type CertificationDomain,
  type CertificationResponse,
} from "../../tracks/certification";

export type CertificationPreparationRequest = Readonly<{
  sessionId: string;
  requestedLength?: number;
  domain?: string;
  competency?: string;
}>;

/**
 * Canonical Cloud Certification semantics. It consumes only the installed,
 * validated catalog and delegates every durable mutation to the shared
 * lifecycle boundary.
 */
export class CertificationFamilyRuntime implements TrainingFamilyRuntime {
  readonly familyId = "certification" as const;

  constructor(private readonly catalog: CertificationRuntimeCatalog, private readonly taxonomyVersion: string) {}

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error(`Certification runtime cannot prepare ${input.trackId}.`);
    const mode = getCertificationMode(input.modeId);
    const request = preparationRequest(input.request);
    const diagnosticBaseline = mode.id === "certification-diagnostic-baseline" ? this.catalog.getDiagnosticBaseline() : null;
    const focusPractice = mode.id === "certification-focus-practice" ? this.catalog.getFocusPractice() : null;
    const scenarioPractice = mode.id === "certification-scenario-practice" ? this.catalog.getScenarioPractice() : null;
    const weakAreaReview = mode.id === "certification-weak-area-review" ? this.catalog.getWeakAreaReview() : null;
    const mixedPractice = mode.id === "certification-mixed-practice" ? this.catalog.getMixedPractice() : null;
    const quickReview = mode.id === "certification-quick-review" ? this.catalog.getQuickReview() : null;
    const simulation = mode.id === "certification-exam-simulation";
    const profile = simulation ? this.catalog.getExamExperienceProfile() : null;
    if (diagnosticBaseline && (request.requestedLength !== undefined || request.domain !== undefined || request.competency !== undefined)) throw new Error("Certification Diagnostic Baseline has a fixed 40-item scope and does not accept selectors.");
    if (focusPractice && !request.domain) throw new Error("Certification Focus Practice requires an explicit topic.");
    if (focusPractice && request.competency !== undefined) throw new Error("Certification Focus Practice does not accept a competency selector.");
    if (scenarioPractice && (!request.competency || request.domain !== undefined)) throw new Error("Certification Scenario Practice requires exactly one explicit competency.");
    if (weakAreaReview && (request.domain !== undefined || request.competency !== undefined)) throw new Error("Certification Weak Area Review does not accept selectors.");
    if (mixedPractice && (request.domain !== undefined || request.competency !== undefined)) throw new Error("Certification Mixed Practice does not accept selectors.");
    if (quickReview && (request.requestedLength !== undefined || request.domain !== undefined || request.competency !== undefined)) throw new Error("Certification Quick Review has a fixed maximum of ten due items and does not accept selectors.");
    const declaredLength = diagnosticBaseline ? diagnosticBaseline.requestedLength : quickReview ? quickReview.maximumLength : request.requestedLength ?? focusPractice?.defaultRequestedLength ?? weakAreaReview?.defaultRequestedLength ?? mixedPractice?.defaultRequestedLength ?? (profile ? profile.questionCount.minimum : mode.defaultQuestionCount ?? 10);
    if (!Number.isInteger(declaredLength) || declaredLength <= 0) throw new Error("Certification requested length is invalid.");
    if (focusPractice && !focusPractice.requestedLengths.includes(declaredLength)) throw new Error("Certification Focus Practice requested length is not installed in this package.");
    if (scenarioPractice && !scenarioPractice.requestedLengths.includes(declaredLength)) throw new Error("Certification Scenario Practice requested length is not installed in this package.");
    if (weakAreaReview && !weakAreaReview.requestedLengths.includes(declaredLength)) throw new Error("Certification Weak Area Review requested length is not installed in this package.");
    if (mixedPractice && !mixedPractice.requestedLengths.includes(declaredLength)) throw new Error("Certification Mixed Practice requested length is not installed in this package.");
    if (profile && (declaredLength! < profile.questionCount.minimum || declaredLength! > profile.questionCount.maximum)) throw new Error("Cloud exam requested length is outside its installed exam experience profile.");
    const configurationSnapshot: TrainingSession["configurationSnapshot"] = diagnosticBaseline
      ? diagnosticConfiguration(diagnosticBaseline)
      : focusPractice
      ? focusConfiguration(focusPractice, request.domain!)
      : scenarioPractice
      ? scenarioConfiguration(scenarioPractice, request.competency!)
      : weakAreaReview
      ? weakAreaReviewConfiguration(weakAreaReview)
      : mixedPractice
      ? mixedPracticeConfiguration(mixedPractice)
      : quickReview
      ? quickReviewConfiguration(quickReview)
      : simulation
      ? simulationConfiguration(profile!, input.now)
      : { kind: "certificationPractice", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "none" };
    const pool = this.poolFor(mode.id, request, input.reviews, input.now, declaredLength ?? 0, profile, diagnosticBaseline, focusPractice, scenarioPractice, weakAreaReview, mixedPractice, quickReview);
    const requestedLength = declaredLength ?? pool.length;
    if (!Number.isInteger(requestedLength) || requestedLength <= 0) throw new Error("Certification requested length is invalid.");
    const questions = focusPractice || scenarioPractice || weakAreaReview || mixedPractice || quickReview ? pool.slice(0, Math.min(requestedLength, pool.length)) : pool.slice(0, requestedLength);
    if (!questions.length || (!focusPractice && !scenarioPractice && !weakAreaReview && !mixedPractice && !quickReview && questions.length !== requestedLength)) throw new Error(`Certification mode ${mode.id} cannot satisfy its declared question count.`);
    const base = {
      id: request.sessionId,
      trackId: this.catalog.getTrackId(),
      modeId: mode.id,
      configurationSnapshot,
      requestedLength,
      actualLength: questions.length,
      currentItemIndex: 0,
      itemOrder: questions.map((question, index) => ({ occurrenceId: `${request.sessionId}:occurrence:${index}`, item: this.catalog.toContentItemRef(question) })),
      optionOrderByOccurrence: Object.fromEntries(questions.map((question, index) => [`${request.sessionId}:occurrence:${index}`, question.options.map((option) => option.id)])),
      conditionalReinsertSlots: [],
      activeForegroundMs: 0,
      contentVersion: this.catalog.getContentVersion(),
      packagePin: this.catalog.getPackagePin(),
      taxonomyVersion: this.taxonomyVersion,
      status: "active" as const,
      startedAt: input.now,
    };
    const session = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base) });
    const draft = simulation ? createTrainingSessionDraft({ familyId: this.familyId, sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: input.now }) : null;
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    this.assertSession(input.session);
    const simulation = input.session.modeId === "certification-exam-simulation";
      if (simulation && (!input.draft || input.draft.familyId !== this.familyId || input.draft.trackId !== this.catalog.getTrackId() || input.draft.sessionId !== input.session.id)) throw new Error("Certification exam simulation requires its exact persisted draft.");
    if (simulation && input.draft?.flaggedOccurrenceIds.some((occurrenceId) => !input.session.itemOrder.some((occurrence) => occurrence.occurrenceId === occurrenceId))) throw new Error("Cloud exam draft flags an occurrence outside its immutable session.");
    if (!simulation && input.draft) throw new Error("Cloud practice cannot resume with an exam draft.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    this.assertSession(input.session);
    if (input.session.modeId === "certification-exam-simulation") throw new Error("Cloud exam simulation accepts responses only in its persisted draft.");
    const occurrence = input.session.itemOrder[input.session.currentItemIndex];
    if (!occurrence) throw new Error("Cloud practice has no current occurrence.");
    const response = certificationResponse(input.response);
    const question = this.catalog.getItemById(occurrence.item.itemId);
    validateResponseForQuestion(response, question.options.map((option) => option.id));
    const attempt = createTrainingAttempt({
      id: await createAttemptId(input.session.id, occurrence.occurrenceId, response), sessionId: input.session.id, trackId: input.session.trackId, modeId: input.session.modeId,
      occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: scoreCertificationQuestion(question, response),
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }, ...question.tags.map((nodeId) => ({ axisId: "tag", nodeId }))] }, answeredAt: input.now, committedAt: input.now,
    });
    const prior = input.reviews.find((review) => review.trackId === this.catalog.getTrackId() && sameItem(review.sourceItem, occurrence.item));
    const candidate = (input.session.modeId === "certification-weak-area-review" || input.session.modeId === "certification-quick-review") && prior
      ? updateCertificationReviewEntry(prior, attempt)
      : createCertificationReviewEntry(attempt);
    const reviewMutations: readonly ReviewMutationCommand[] = candidate
      ? [Object.freeze({ kind: "upsert", entry: prior ? retainReviewQueueEntryIdentity(prior, candidate) : candidate, transitionAttemptId: attempt.id })]
      : prior ? [Object.freeze({ kind: "remove", entry: prior, transitionAttemptId: attempt.id })] : [];
    return Object.freeze({ attempt, session: input.session, reviewMutations });
  }

  async finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>): Promise<PracticeFinalization> {
    this.assertSession(input.session);
    if (input.session.modeId === "certification-exam-simulation") throw new Error("Cloud exam simulation uses simulation finalization.");
    const sessionAttempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    if (sessionAttempts.length !== input.session.actualLength || new Set(sessionAttempts.map((attempt) => attempt.occurrenceId)).size !== input.session.actualLength) throw new Error("Cloud practice finalization requires one durable attempt per occurrence.");
    return Object.freeze({ session: completeTrainingSession(input.session, input.now), result: resultFor(input.session, sessionAttempts, input.now) });
  }

  async finalizeSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization> {
    await this.validateResume({ session: input.session, draft: input.draft });
    const attempts: TrainingAttempt<unknown>[] = [];
    const mutations: ReviewMutationCommand[] = [];
    for (const occurrence of input.session.itemOrder) {
      const raw = input.draft.responsesByOccurrenceId[occurrence.occurrenceId];
      if (raw === undefined) continue;
      const response = certificationResponse(raw);
      const question = this.catalog.getItemById(occurrence.item.itemId);
      validateResponseForQuestion(response, question.options.map((option) => option.id));
      const attempt = createTrainingAttempt({
        id: await createAttemptId(input.session.id, occurrence.occurrenceId, response), sessionId: input.session.id, trackId: input.session.trackId, modeId: input.session.modeId,
        occurrenceId: occurrence.occurrenceId, item: occurrence.item, response, result: scoreCertificationQuestion(question, response),
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }, ...question.tags.map((nodeId) => ({ axisId: "tag", nodeId })), ...(input.draft.flaggedOccurrenceIds.includes(occurrence.occurrenceId) ? [{ axisId: "exam-state", nodeId: "flagged" }] : [])] }, answeredAt: input.now, committedAt: input.now,
      });
      attempts.push(attempt);
      const candidate = createCertificationReviewEntry(attempt);
      const prior = input.reviews.find((review) => review.trackId === this.catalog.getTrackId() && sameItem(review.sourceItem, occurrence.item));
      if (candidate) mutations.push(Object.freeze({ kind: "upsert", entry: prior ? retainReviewQueueEntryIdentity(prior, candidate) : candidate, transitionAttemptId: attempt.id }));
      else if (prior) mutations.push(Object.freeze({ kind: "remove", entry: prior, transitionAttemptId: attempt.id }));
    }
    const session = completeTrainingSession(input.session, input.now);
    return Object.freeze({ session, attempts: Object.freeze(attempts), reviewMutations: Object.freeze(mutations), frozenDraft: input.draft, result: resultFor(input.session, attempts, input.now) });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateResume({ session: input.session, draft: input.draft });
    if (!Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1) throw new Error("Cloud exam draft revision is invalid.");
    for (const [occurrenceId, raw] of Object.entries(input.draft.responsesByOccurrenceId)) {
      const occurrence = input.session.itemOrder.find((candidate) => candidate.occurrenceId === occurrenceId);
      if (!occurrence) throw new Error(`Cloud exam draft response ${occurrenceId} is outside its immutable plan.`);
      validateResponseForQuestion(certificationResponse(raw), this.catalog.getItemById(occurrence.item.itemId).options.map((option) => option.id));
    }
    if (input.draft.flaggedOccurrenceIds.some((occurrenceId) => !input.session.itemOrder.some((occurrence) => occurrence.occurrenceId === occurrenceId))) throw new Error("Cloud exam draft flags an occurrence outside its immutable session.");
  }

  async queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Certification dashboard requested for another track.");
    return Object.freeze({ activeSessionId: input.activeSession?.id, progress: buildCloudCertificationProgressViewModel({ attempts: input.attempts, reviewQueueItems: input.reviews, now: input.now, packagePin: this.catalog.getPackagePin() }) });
  }
  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Certification progress requested for another track.");
    return buildCloudCertificationProgressViewModel({ attempts: input.attempts, reviewQueueItems: input.reviews, now: input.now, packagePin: this.catalog.getPackagePin() });
  }
  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== this.catalog.getTrackId()) throw new Error("Certification review requested for another track.");
    return Object.freeze({ due: Object.freeze(input.reviews.filter((review) => review.dueAt <= input.now)) });
  }

  private poolFor(modeId: string, request: CertificationPreparationRequest, reviews: readonly ReviewQueueEntry[], now: string, requestedLength: number, profile: PublishedCertificationExamExperienceProfile | null, diagnosticBaseline: PublishedCertificationDiagnosticBaseline | null, focusPractice: PublishedCertificationFocusPractice | null, scenarioPractice: PublishedCertificationScenarioPractice | null, weakAreaReview: PublishedCertificationWeakAreaReview | null, mixedPractice: PublishedCertificationMixedPractice | null, quickReview: PublishedCertificationQuickReview | null) {
    const all = [...this.catalog.getItems()].sort((left, right) => left.id.localeCompare(right.id));
    if (diagnosticBaseline) {
      if (requestedLength !== 40) throw new Error("Certification Diagnostic Baseline must remain exactly 40 items.");
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = diagnosticBaseline.itemIds.map((itemId) => byId.get(itemId));
      if (selected.some((question) => !question) || new Set(diagnosticBaseline.itemIds).size !== 40) throw new Error("Certification Diagnostic Baseline cannot satisfy its immutable 40-item blueprint.");
      return selected as readonly (typeof all)[number][];
    }
    if (weakAreaReview) {
      const due = reviews.filter((review) => review.trackId === this.catalog.getTrackId() && review.sourceItem.contentVersion === this.catalog.getContentVersion() && contentPackagePinsEqual(review.sourceItem.packagePin, this.catalog.getPackagePin()) && review.dueAt <= now).sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.sourceItem.itemId.localeCompare(right.sourceItem.itemId));
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = due.reduce<(typeof all)[number][]>((questions, review) => {
        const question = byId.get(review.sourceItem.itemId);
        if (question && !questions.some((candidate) => candidate.id === question.id)) questions.push(question);
        return questions;
      }, []);
      if (!selected.length) throw new Error("Certification Weak Area Review has no eligible due items; no substitute practice session was created.");
      return selected;
    }
    if (mixedPractice) {
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = mixedPractice.itemIds.map((itemId) => byId.get(itemId));
      if (selected.some((question) => !question) || new Set(mixedPractice.itemIds).size !== mixedPractice.itemIds.length) throw new Error("Certification Mixed Practice has an invalid immutable interleaved blueprint.");
      return selected as readonly (typeof all)[number][];
    }
    if (quickReview) {
      const due = reviews
        .filter((review) => review.trackId === this.catalog.getTrackId() && review.sourceItem.contentVersion === this.catalog.getContentVersion() && contentPackagePinsEqual(review.sourceItem.packagePin, this.catalog.getPackagePin()) && review.dueAt <= now)
        .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.sourceItem.itemId.localeCompare(right.sourceItem.itemId));
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = due.reduce<(typeof all)[number][]>((questions, review) => {
        const question = byId.get(review.sourceItem.itemId);
        if (question && !questions.some((candidate) => candidate.id === question.id)) questions.push(question);
        return questions;
      }, []);
      if (!selected.length) throw new Error("Certification Quick Review has no eligible due items; no substitute practice session was created.");
      return selected.slice(0, quickReview.maximumLength);
    }
    if (focusPractice) {
      if (!request.domain || !focusPractice.topicIds.includes(request.domain)) throw new Error("Certification Focus Practice requires one domain declared by its installed blueprint.");
      const selected = all.filter((question) => question.domain === request.domain || question.nodeId === request.domain);
      if (!selected.length) throw new Error("Certification Focus Practice has no installed questions for the selected domain.");
      return selected;
    }
    if (scenarioPractice) {
      const competency = scenarioPractice.competencies.find((entry) => entry.id === request.competency);
      if (!competency) throw new Error("Certification Scenario Practice requires one competency declared by its installed blueprint.");
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = competency.scenarioItemIds.map((itemId) => byId.get(itemId));
      if (selected.some((question) => !question)) throw new Error("Certification Scenario Practice has an unresolved item in its explicit competency scope.");
      return selected as readonly (typeof all)[number][];
    }
    const scoped = request.domain ? all.filter((question) => question.domain === request.domain) : all;
    if (modeId !== "certification-exam-simulation") return scoped;
    if (!profile) throw new Error("Cloud exam simulation requires an installed exam experience profile.");
    const usedItemIds = new Set<string>();
    return allocateBlueprintOccurrences(profile.blueprint.sections, requestedLength).flatMap(({ id, contentDomainId, count }) => {
      const questions = all.filter((question) => question.domain === contentDomainId && !usedItemIds.has(question.id));
      if (questions.length < count) throw new Error(`Cloud exam profile section ${id} cannot satisfy its required unique occurrence count.`);
      const selected = questions.slice(0, count);
      selected.forEach((question) => usedItemIds.add(question.id));
      return selected;
    });
  }

  private assertSession(session: TrainingSession): void {
    if (session.trackId !== this.catalog.getTrackId() || session.contentVersion !== this.catalog.getContentVersion() || !contentPackagePinsEqual(session.packagePin, this.catalog.getPackagePin()) || session.taxonomyVersion !== this.taxonomyVersion || !session.planFingerprint || !CERTIFICATION_MODE_IDS.includes(session.modeId as typeof CERTIFICATION_MODE_IDS[number])) throw new Error("Certification session does not match its validated immutable artifact.");
    if (session.modeId === "certification-exam-simulation" && (typeof session.configurationSnapshot.timerDeadlineAt !== "string" || Number.isNaN(Date.parse(session.configurationSnapshot.timerDeadlineAt)) || typeof session.configurationSnapshot.timerDurationMs !== "number" || session.configurationSnapshot.timerDurationMs <= 0 || session.configurationSnapshot.simulationPolicyId !== "patternly-certification-simulation-v1" || session.configurationSnapshot.simulationPolicyVersion !== "1" || session.configurationSnapshot.feedbackMode !== "atSessionEnd" || new Set(session.itemOrder.map((occurrence) => occurrence.item.itemId)).size !== session.actualLength)) throw new Error("Cloud exam simulation does not match its immutable Patternly interaction policy.");
    if (session.modeId === "certification-diagnostic-baseline" && (session.actualLength !== 40 || session.requestedLength !== 40 || session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none")) throw new Error("Certification Diagnostic Baseline does not match its immutable fixed-session contract.");
    if (session.modeId === "certification-focus-practice") {
      const focusPractice = this.catalog.getFocusPractice();
      const domains = new Set(session.itemOrder.map((occurrence) => { const question = this.catalog.getItemById(occurrence.item.itemId); return question.nodeId ?? question.domain; }));
      const domain = session.configurationSnapshot.domain;
      if (typeof domain !== "string" || !focusPractice.topicIds.includes(domain as CertificationDomain) || session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || !focusPractice.requestedLengths.includes(session.requestedLength) || domains.size !== 1 || !domains.has(domain as CertificationDomain)) throw new Error("Certification Focus Practice does not match its single-domain immutable contract.");
    }
    if (session.modeId === "certification-scenario-practice") {
      const scenario = this.catalog.getScenarioPractice();
      const competencyId = session.configurationSnapshot.competencyId;
      const competency = typeof competencyId === "string" ? scenario.competencies.find((entry) => entry.id === competencyId) : undefined;
      const itemIds = new Set(competency?.scenarioItemIds ?? []);
      if (!competency || session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || !scenario.requestedLengths.includes(session.requestedLength) || session.itemOrder.some((occurrence) => !itemIds.has(occurrence.item.itemId))) throw new Error("Certification Scenario Practice does not match its explicit immutable competency scope.");
    }
    if (session.modeId === "certification-weak-area-review") {
      const weakAreaReview = this.catalog.getWeakAreaReview();
      if (session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || !weakAreaReview.requestedLengths.includes(session.requestedLength) || session.actualLength > session.requestedLength || new Set(session.itemOrder.map((occurrence) => occurrence.item.itemId)).size !== session.actualLength) {
      throw new Error("Certification Weak Area Review does not match its eligible-review immutable contract.");
      }
    }
    if (session.modeId === "certification-mixed-practice") {
      const mixed = this.catalog.getMixedPractice();
      const itemIds = session.itemOrder.map((occurrence) => occurrence.item.itemId);
      if (session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || !mixed.requestedLengths.includes(session.requestedLength) || session.actualLength > session.requestedLength || new Set(itemIds).size !== session.actualLength || itemIds.some((itemId, index) => itemId !== mixed.itemIds[index])) throw new Error("Certification Mixed Practice does not match its immutable interleaved contract.");
    }
    if (session.modeId === "certification-quick-review") {
      const quickReview = this.catalog.getQuickReview();
      const itemIds = session.itemOrder.map((occurrence) => occurrence.item.itemId);
      if (session.configurationSnapshot.kind !== "certificationQuickReview" || session.configurationSnapshot.reviewSource !== "due_queue" || session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || session.requestedLength !== quickReview.maximumLength || session.actualLength > quickReview.maximumLength || new Set(itemIds).size !== session.actualLength) throw new Error("Certification Quick Review does not match its eligible due-review immutable contract.");
    }
  }
}

function weakAreaReviewConfiguration(review: PublishedCertificationWeakAreaReview): TrainingSession["configurationSnapshot"] {
  if (review.modeId !== "certification-weak-area-review" || review.shortening !== "allowed_within_eligible_review_evidence" || review.selectionScope !== "eligible_due_review_evidence" || review.persistentResolutionPolicy !== "two_consecutive_due_review_successes" || review.requestedLengths.length === 0 || review.requestedLengths.some((length) => !Number.isSafeInteger(length) || length <= 0) || (review.defaultRequestedLength !== undefined && !review.requestedLengths.includes(review.defaultRequestedLength))) throw new Error("Certification Weak Area Review content configuration is invalid.");
  return { kind: "certificationWeakAreaReview", reviewSource: "due_queue", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function mixedPracticeConfiguration(mixed: PublishedCertificationMixedPractice): TrainingSession["configurationSnapshot"] {
  if (mixed.modeId !== "certification-mixed-practice" || mixed.shortening !== "allowed_within_interleaved_blueprint" || mixed.selectionScope !== "unique_interleaved_blueprint" || mixed.requestedLengths.length === 0 || mixed.requestedLengths.some((length) => !Number.isSafeInteger(length) || length <= 0) || mixed.itemIds.length === 0 || new Set(mixed.itemIds).size !== mixed.itemIds.length) throw new Error("Certification Mixed Practice content configuration is invalid.");
  return { kind: "certificationMixedPractice", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function quickReviewConfiguration(review: PublishedCertificationQuickReview): TrainingSession["configurationSnapshot"] {
  if (review.modeId !== "certification-quick-review" || !Number.isSafeInteger(review.maximumLength) || review.maximumLength <= 0 || review.shortening !== "allowed_within_eligible_review_evidence" || review.selectionScope !== "eligible_due_review_evidence" || review.persistentResolutionPolicy !== "two_consecutive_due_review_successes") throw new Error("Certification Quick Review content configuration is invalid.");
  return { kind: "certificationQuickReview", reviewSource: "due_queue", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground", maximumLength: review.maximumLength, shortening: review.shortening, resolutionPolicy: review.persistentResolutionPolicy };
}

function diagnosticConfiguration(baseline: PublishedCertificationDiagnosticBaseline): TrainingSession["configurationSnapshot"] {
  if (baseline.requestedLength !== 40 || baseline.actualLength !== 40 || baseline.shortening !== "prohibited" || baseline.uniqueItemsRequired !== 40 || baseline.timerKind !== "elapsed_foreground" || baseline.feedbackTiming !== "after_each_durable_submit" || baseline.reinsertPolicy !== "disabled") throw new Error("Certification Diagnostic Baseline content configuration is invalid.");
  return { kind: "certificationDiagnosticBaseline", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function focusConfiguration(focus: PublishedCertificationFocusPractice, domain: CertificationDomain): TrainingSession["configurationSnapshot"] {
  if (focus.modeId !== "certification-focus-practice" || focus.shortening !== "allowed_within_topic" || focus.selectionScope !== "cloud_domain" || focus.requestedLengths.length === 0 || focus.requestedLengths.some((length) => !Number.isSafeInteger(length) || length <= 0) || (focus.defaultRequestedLength !== undefined && !focus.requestedLengths.includes(focus.defaultRequestedLength)) || !focus.topicIds.includes(domain)) throw new Error("Certification Focus Practice content configuration is invalid.");
  return { kind: "certificationFocusPractice", domain, navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function scenarioConfiguration(scenario: PublishedCertificationScenarioPractice, competencyId: string): TrainingSession["configurationSnapshot"] {
  if (scenario.modeId !== "certification-scenario-practice" || scenario.shortening !== "allowed_within_competency" || scenario.selectionScope !== "explicit_tag_competency" || scenario.requestedLengths.length === 0 || scenario.requestedLengths.some((length) => !Number.isSafeInteger(length) || length <= 0) || (scenario.defaultRequestedLength !== undefined && !scenario.requestedLengths.includes(scenario.defaultRequestedLength)) || !scenario.competencies.some((competency) => competency.id === competencyId && competency.scenarioItemIds.length > 0)) throw new Error("Certification Scenario Practice content configuration is invalid.");
  return { kind: "certificationScenarioPractice", competencyId, navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function simulationConfiguration(profile: PublishedCertificationExamExperienceProfile, now: string): TrainingSession["configurationSnapshot"] {
  const policy = profile.interactionPolicy;
  if (policy.schemaVersion !== "patternly-certification-simulation-policy-v1" || policy.policyId !== "patternly-certification-simulation-v1" || policy.policyVersion !== "1" || policy.owner !== "patternly_product" || policy.navigation !== "free" || policy.answerChanges !== "until_final_submission" || policy.flagging !== "available" || policy.navigator !== "available" || policy.sections !== "blueprint_visible" || policy.timeout !== "absolute_deadline" || policy.feedbackTiming !== "after_verified_finalization") {
    throw new Error("Cloud exam simulation is unavailable because the installed Patternly interaction policy is invalid.");
  }
  const timerDurationMs = profile.durationMinutes * 60 * 1000;
  return {
    kind: "certificationSimulation",
    navigation: policy.navigation,
    submission: "manualOrForegroundTimeout",
    feedbackMode: "atSessionEnd",
    answerChanges: "untilFinalSubmission",
    timer: "absoluteDeadline",
    timerDeadlineAt: new Date(Date.parse(now) + timerDurationMs).toISOString(),
    timerDurationMs,
    simulationProfileId: profile.profileId,
    simulationProfileVersion: profile.profileVersion,
    simulationPolicyId: policy.policyId,
    simulationPolicyVersion: policy.policyVersion,
    sectionPresentation: policy.sections,
  };
}

function allocateBlueprintOccurrences(sections: PublishedCertificationExamExperienceProfile["blueprint"]["sections"], requestedLength: number): readonly Readonly<{ id: string; contentDomainId: string; count: number }>[] {
  const allocations = sections.map((section, index) => {
    const exact = (section.weightPercent / 100) * requestedLength;
    return { id: section.id, contentDomainId: section.contentDomainId, count: Math.floor(exact), remainder: exact % 1, index };
  });
  let remaining = requestedLength - allocations.reduce((sum, allocation) => sum + allocation.count, 0);
  for (const allocation of [...allocations].sort((left, right) => right.remainder - left.remainder || left.index - right.index)) {
    if (remaining === 0) break;
    allocation.count += 1;
    remaining -= 1;
  }
  return allocations.map(({ id, contentDomainId, count }) => Object.freeze({ id, contentDomainId, count }));
}

function preparationRequest(value: unknown): CertificationPreparationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Cloud session request is invalid.");
  const request = value as Record<string, unknown>;
  if (typeof request.sessionId !== "string" || !request.sessionId.trim()) throw new Error("Cloud session request requires an immutable session ID.");
  if (request.requestedLength !== undefined && (!Number.isInteger(request.requestedLength) || (request.requestedLength as number) <= 0)) throw new Error("Cloud session requested length is invalid.");
  if (request.domain !== undefined && (typeof request.domain !== "string" || !request.domain.trim())) throw new Error("Certification session domain is invalid.");
  if (request.competency !== undefined && (typeof request.competency !== "string" || !request.competency.trim())) throw new Error("Cloud session competency is invalid.");
  return request as CertificationPreparationRequest;
}
function certificationResponse(value: unknown): CertificationResponse {
  if (!value || typeof value !== "object" || Array.isArray(value) || (value as { kind?: unknown }).kind !== "option_selection" || !Array.isArray((value as { selectedOptionIds?: unknown }).selectedOptionIds) || !(value as { selectedOptionIds: unknown[] }).selectedOptionIds.every((id) => typeof id === "string")) throw new Error("Cloud response must be an option selection.");
  return value as CertificationResponse;
}
function validateResponseForQuestion(response: CertificationResponse, optionIds: readonly string[]) {
  if (!response.selectedOptionIds.length || new Set(response.selectedOptionIds).size !== response.selectedOptionIds.length || response.selectedOptionIds.some((id) => !optionIds.includes(id))) throw new Error("Cloud response must select unique declared options.");
}
function sameItem(left: ContentItemRef, right: ContentItemRef) { return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion && contentPackagePinsEqual(left.packagePin, right.packagePin); }
function updateCertificationReviewEntry(entry: ReviewQueueEntry, attempt: TrainingAttempt<CertificationResponse>): ReviewQueueEntry | undefined {
  if (attempt.id === entry.sourceAttemptId || attempt.committedAt < entry.dueAt) return entry;
  if (attempt.result.kind !== "correct") return { ...entry, consecutiveAfterDueSuccesses: 0, lastReviewedAt: attempt.committedAt, persistent: true, reasons: [attempt.result.kind] };
  const sameSessionCorrection = entry.persistent && entry.sourceSessionId === attempt.sessionId;
  const consecutiveAfterDueSuccesses = sameSessionCorrection ? entry.consecutiveAfterDueSuccesses : entry.consecutiveAfterDueSuccesses + 1;
  return consecutiveAfterDueSuccesses >= 2 ? undefined : { ...entry, consecutiveAfterDueSuccesses, lastReviewedAt: attempt.committedAt };
}
function resultFor(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[], completedAt: string) {
  const pointsEarned = attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0);
  const maxPoints = session.actualLength;
  return createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength, answeredOccurrenceIds: attempts.map((attempt) => attempt.occurrenceId), unansweredOccurrenceIds: session.itemOrder.filter((occurrence) => !attempts.some((attempt) => attempt.occurrenceId === occurrence.occurrenceId)).map((occurrence) => occurrence.occurrenceId), completedAt, evidence: createFamilyEnvelope({ familyId: "certification", details: { pointsEarned, maxPoints, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length } }) });
}
