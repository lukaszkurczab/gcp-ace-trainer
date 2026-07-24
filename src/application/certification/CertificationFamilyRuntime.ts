import {
  CLOUD_CERTIFICATION_TRACK_ID,
  completeTrainingSession,
  createFamilyEnvelope,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionDraft,
  createTrainingSessionResult,
  retainReviewQueueEntryIdentity,
  type ReviewMutationCommand,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createAttemptId } from "../learningMutations/identity";
import type { PreparedSession, PracticeFinalization, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime } from "../trainingLifecycle";
import { CertificationContentCatalog } from "../../tracks/cloud-certification/certificationContentCatalog";
import type { PublishedCertificationDiagnosticBaseline, PublishedCertificationExamExperienceProfile, PublishedCertificationFocusPractice } from "../../content/contracts";
import {
  buildCloudCertificationProgressViewModel,
  createCertificationReviewEntry,
  getCertificationMode,
  scoreCertificationQuestion,
  type CertificationResponse,
} from "../../tracks/cloud-certification";

export type CertificationPreparationRequest = Readonly<{
  sessionId: string;
  requestedLength?: number;
  domain?: "setup_environment" | "planning_implementation" | "access_security" | "operations";
}>;

/**
 * Canonical Cloud Certification semantics. It consumes only the installed,
 * validated catalog and delegates every durable mutation to the shared
 * lifecycle boundary.
 */
export class CertificationFamilyRuntime implements TrainingFamilyRuntime {
  readonly familyId = "certification" as const;

  constructor(private readonly catalog: CertificationContentCatalog, private readonly taxonomyVersion: string) {}

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== CLOUD_CERTIFICATION_TRACK_ID) throw new Error(`Certification runtime cannot prepare ${input.trackId}.`);
    const mode = getCertificationMode(input.modeId);
    const request = preparationRequest(input.request);
    const diagnosticBaseline = mode.id === "certification-diagnostic-baseline" ? this.catalog.getDiagnosticBaseline() : null;
    const focusPractice = mode.id === "certification-focus-practice" ? this.catalog.getFocusPractice() : null;
    const simulation = mode.id === "cloud-exam-simulation";
    const profile = simulation ? this.catalog.getExamExperienceProfile() : null;
    if (diagnosticBaseline && (request.requestedLength !== undefined || request.domain !== undefined)) throw new Error("Certification Diagnostic Baseline has a fixed 40-item scope and does not accept selectors.");
    if (focusPractice && !request.domain) throw new Error("Certification Focus Practice requires an explicit topic.");
    const declaredLength = diagnosticBaseline ? diagnosticBaseline.requestedLength : request.requestedLength ?? (profile ? profile.questionCount.minimum : mode.defaultQuestionCount);
    if (declaredLength !== undefined && (!Number.isInteger(declaredLength) || declaredLength <= 0)) throw new Error("Certification requested length is invalid.");
    if (focusPractice && !focusPractice.requestedLengths.includes(declaredLength as 10 | 20 | 40)) throw new Error("Certification Focus Practice supports only its installed 10, 20, or 40 item lengths.");
    if (profile && (declaredLength! < profile.questionCount.minimum || declaredLength! > profile.questionCount.maximum)) throw new Error("Cloud exam requested length is outside its installed exam experience profile.");
    const configurationSnapshot: TrainingSession["configurationSnapshot"] = diagnosticBaseline
      ? diagnosticConfiguration(diagnosticBaseline)
      : focusPractice
      ? focusConfiguration(focusPractice)
      : simulation
      ? simulationConfiguration(profile!, input.now)
      : { kind: "certificationPractice", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "none" };
    const pool = this.poolFor(mode.id, request, input.reviews, declaredLength ?? 0, profile, diagnosticBaseline, focusPractice);
    const requestedLength = declaredLength ?? pool.length;
    if (!Number.isInteger(requestedLength) || requestedLength <= 0) throw new Error("Certification requested length is invalid.");
    const questions = focusPractice ? pool.slice(0, Math.min(requestedLength, pool.length)) : pool.slice(0, requestedLength);
    if (!questions.length || (!focusPractice && questions.length !== requestedLength)) throw new Error(`Certification mode ${mode.id} cannot satisfy its declared question count.`);
    const base = {
      id: request.sessionId,
      trackId: CLOUD_CERTIFICATION_TRACK_ID,
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
      taxonomyVersion: this.taxonomyVersion,
      status: "active" as const,
      startedAt: input.now,
    };
    const session = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base) });
    const draft = simulation ? createTrainingSessionDraft({ familyId: this.familyId, sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, updatedAt: input.now }) : null;
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    this.assertSession(input.session);
    const simulation = input.session.modeId === "cloud-exam-simulation";
    if (simulation && (!input.draft || input.draft.familyId !== this.familyId || input.draft.trackId !== CLOUD_CERTIFICATION_TRACK_ID || input.draft.sessionId !== input.session.id)) throw new Error("Cloud exam simulation requires its exact persisted draft.");
    if (!simulation && input.draft) throw new Error("Cloud practice cannot resume with an exam draft.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    this.assertSession(input.session);
    if (input.session.modeId === "cloud-exam-simulation") throw new Error("Cloud exam simulation accepts responses only in its persisted draft.");
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
    const candidate = createCertificationReviewEntry(attempt);
    const prior = input.reviews.find((review) => review.trackId === CLOUD_CERTIFICATION_TRACK_ID && sameItem(review.sourceItem, occurrence.item));
    const reviewMutations: readonly ReviewMutationCommand[] = candidate
      ? [Object.freeze({ kind: "upsert", entry: prior ? retainReviewQueueEntryIdentity(prior, candidate) : candidate, transitionAttemptId: attempt.id })]
      : prior ? [Object.freeze({ kind: "remove", entry: prior, transitionAttemptId: attempt.id })] : [];
    return Object.freeze({ attempt, session: input.session, reviewMutations });
  }

  async finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>): Promise<PracticeFinalization> {
    this.assertSession(input.session);
    if (input.session.modeId === "cloud-exam-simulation") throw new Error("Cloud exam simulation uses simulation finalization.");
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
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }, ...question.tags.map((nodeId) => ({ axisId: "tag", nodeId }))] }, answeredAt: input.now, committedAt: input.now,
      });
      attempts.push(attempt);
      const candidate = createCertificationReviewEntry(attempt);
      const prior = input.reviews.find((review) => review.trackId === CLOUD_CERTIFICATION_TRACK_ID && sameItem(review.sourceItem, occurrence.item));
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
  }

  async queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== CLOUD_CERTIFICATION_TRACK_ID) throw new Error("Cloud dashboard requested for another track.");
    return Object.freeze({ activeSessionId: input.activeSession?.id, progress: buildCloudCertificationProgressViewModel({ attempts: input.attempts, reviewQueueItems: input.reviews, now: input.now }) });
  }
  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== CLOUD_CERTIFICATION_TRACK_ID) throw new Error("Cloud progress requested for another track.");
    return buildCloudCertificationProgressViewModel({ attempts: input.attempts, reviewQueueItems: input.reviews, now: input.now });
  }
  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== CLOUD_CERTIFICATION_TRACK_ID) throw new Error("Cloud review requested for another track.");
    return Object.freeze({ due: Object.freeze(input.reviews.filter((review) => review.dueAt <= input.now)) });
  }

  private poolFor(modeId: string, request: CertificationPreparationRequest, reviews: readonly ReviewQueueEntry[], requestedLength: number, profile: PublishedCertificationExamExperienceProfile | null, diagnosticBaseline: PublishedCertificationDiagnosticBaseline | null, focusPractice: PublishedCertificationFocusPractice | null) {
    const all = [...this.catalog.getItems()].sort((left, right) => left.id.localeCompare(right.id));
    if (diagnosticBaseline) {
      if (requestedLength !== 40) throw new Error("Certification Diagnostic Baseline must remain exactly 40 items.");
      const byId = new Map(all.map((question) => [question.id, question]));
      const selected = diagnosticBaseline.itemIds.map((itemId) => byId.get(itemId));
      if (selected.some((question) => !question) || new Set(diagnosticBaseline.itemIds).size !== 40) throw new Error("Certification Diagnostic Baseline cannot satisfy its immutable 40-item blueprint.");
      return selected as readonly (typeof all)[number][];
    }
    if (modeId === "cloud-review") {
      const due = new Set(reviews.filter((review) => review.trackId === CLOUD_CERTIFICATION_TRACK_ID).map((review) => review.sourceItem.itemId));
      const selected = all.filter((question) => due.has(question.id));
      if (!selected.length) throw new Error("Cloud Review has no due items; no substitute practice session was created.");
      return selected;
    }
    if (focusPractice) {
      if (!request.domain || !focusPractice.topicIds.includes(request.domain)) throw new Error("Certification Focus Practice requires one domain declared by its installed blueprint.");
      const selected = all.filter((question) => question.domain === request.domain);
      if (!selected.length) throw new Error("Certification Focus Practice has no installed questions for the selected domain.");
      return selected;
    }
    const scoped = request.domain ? all.filter((question) => question.domain === request.domain) : all;
    if (modeId !== "cloud-exam-simulation") return scoped;
    if (!profile) throw new Error("Cloud exam simulation requires an installed exam experience profile.");
    return allocateBlueprintOccurrences(profile.blueprint.sections, requestedLength).flatMap(({ id, count }) => {
      const questions = all.filter((question) => question.domain === id);
      if (!questions.length) throw new Error(`Cloud exam profile section ${id} cannot be mapped to the installed Cloud content domains.`);
      if (questions.length < count) throw new Error(`Cloud exam profile section ${id} cannot satisfy its required occurrence count.`);
      return questions.slice(0, count);
    });
  }

  private assertSession(session: TrainingSession): void {
    if (session.trackId !== CLOUD_CERTIFICATION_TRACK_ID || session.contentVersion !== this.catalog.getContentVersion() || session.taxonomyVersion !== this.taxonomyVersion || !session.planFingerprint || !["certification-diagnostic-baseline", "certification-focus-practice", "cloud-practice", "cloud-exam-simulation", "cloud-review"].includes(session.modeId)) throw new Error("Cloud session does not match its validated immutable artifact.");
    if (session.modeId === "cloud-exam-simulation" && (typeof session.configurationSnapshot.timerDeadlineAt !== "string" || Number.isNaN(Date.parse(session.configurationSnapshot.timerDeadlineAt)) || typeof session.configurationSnapshot.timerDurationMs !== "number" || session.configurationSnapshot.timerDurationMs <= 0)) throw new Error("Cloud exam simulation requires its immutable absolute deadline.");
    if (session.modeId === "certification-diagnostic-baseline" && (session.actualLength !== 40 || session.requestedLength !== 40 || session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none")) throw new Error("Certification Diagnostic Baseline does not match its immutable fixed-session contract.");
    if (session.modeId === "certification-focus-practice") {
      const focusPractice = this.catalog.getFocusPractice();
      const domains = new Set(session.itemOrder.map((occurrence) => this.catalog.getItemById(occurrence.item.itemId).domain));
      if (session.configurationSnapshot.timer !== "elapsedForeground" || session.configurationSnapshot.feedbackMode !== "afterEachAnswer" || session.configurationSnapshot.answerChanges !== "none" || ![10, 20, 40].includes(session.requestedLength) || domains.size !== 1 || !focusPractice.topicIds.includes([...domains][0]!)) throw new Error("Certification Focus Practice does not match its single-domain immutable contract.");
    }
  }
}

function diagnosticConfiguration(baseline: PublishedCertificationDiagnosticBaseline): TrainingSession["configurationSnapshot"] {
  if (baseline.requestedLength !== 40 || baseline.actualLength !== 40 || baseline.shortening !== "prohibited" || baseline.uniqueItemsRequired !== 40 || baseline.timerKind !== "elapsed_foreground" || baseline.feedbackTiming !== "after_each_durable_submit" || baseline.reinsertPolicy !== "disabled") throw new Error("Certification Diagnostic Baseline content configuration is invalid.");
  return { kind: "certificationDiagnosticBaseline", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function focusConfiguration(focus: PublishedCertificationFocusPractice): TrainingSession["configurationSnapshot"] {
  if (focus.modeId !== "certification-focus-practice" || focus.shortening !== "allowed_within_topic" || focus.selectionScope !== "cloud_domain" || focus.requestedLengths.length !== 3 || focus.requestedLengths.some((length, index) => length !== [10, 20, 40][index]) || !focus.topicIds.length) throw new Error("Certification Focus Practice content configuration is invalid.");
  return { kind: "certificationFocusPractice", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" };
}

function simulationConfiguration(profile: PublishedCertificationExamExperienceProfile, now: string): TrainingSession["configurationSnapshot"] {
  if (profile.navigation !== "free" || profile.answerChanges !== "until_final_submission" || profile.timeout !== "absolute_deadline") {
    throw new Error("Cloud exam simulation is unavailable because the installed exam experience profile does not document every required interaction rule.");
  }
  const timerDurationMs = profile.durationMinutes * 60 * 1000;
  return {
    kind: "certificationSimulation",
    navigation: profile.navigation,
    submission: "manualOrForegroundTimeout",
    feedbackMode: "atSessionEnd",
    answerChanges: "untilFinalSubmission",
    timer: "absoluteDeadline",
    timerDeadlineAt: new Date(Date.parse(now) + timerDurationMs).toISOString(),
    timerDurationMs,
  };
}

function allocateBlueprintOccurrences(sections: PublishedCertificationExamExperienceProfile["blueprint"]["sections"], requestedLength: number): readonly Readonly<{ id: string; count: number }>[] {
  const allocations = sections.map((section, index) => {
    const exact = (section.weightPercent / 100) * requestedLength;
    return { id: section.id, count: Math.floor(exact), remainder: exact % 1, index };
  });
  let remaining = requestedLength - allocations.reduce((sum, allocation) => sum + allocation.count, 0);
  for (const allocation of [...allocations].sort((left, right) => right.remainder - left.remainder || left.index - right.index)) {
    if (remaining === 0) break;
    allocation.count += 1;
    remaining -= 1;
  }
  return allocations.map(({ id, count }) => Object.freeze({ id, count }));
}

function preparationRequest(value: unknown): CertificationPreparationRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Cloud session request is invalid.");
  const request = value as Record<string, unknown>;
  if (typeof request.sessionId !== "string" || !request.sessionId.trim()) throw new Error("Cloud session request requires an immutable session ID.");
  if (request.requestedLength !== undefined && (!Number.isInteger(request.requestedLength) || (request.requestedLength as number) <= 0)) throw new Error("Cloud session requested length is invalid.");
  if (request.domain !== undefined && !["setup_environment", "planning_implementation", "access_security", "operations"].includes(request.domain as string)) throw new Error("Cloud session domain is invalid.");
  return request as CertificationPreparationRequest;
}
function certificationResponse(value: unknown): CertificationResponse {
  if (!value || typeof value !== "object" || Array.isArray(value) || (value as { kind?: unknown }).kind !== "option_selection" || !Array.isArray((value as { selectedOptionIds?: unknown }).selectedOptionIds) || !(value as { selectedOptionIds: unknown[] }).selectedOptionIds.every((id) => typeof id === "string")) throw new Error("Cloud response must be an option selection.");
  return value as CertificationResponse;
}
function validateResponseForQuestion(response: CertificationResponse, optionIds: readonly string[]) {
  if (!response.selectedOptionIds.length || new Set(response.selectedOptionIds).size !== response.selectedOptionIds.length || response.selectedOptionIds.some((id) => !optionIds.includes(id))) throw new Error("Cloud response must select unique declared options.");
}
function sameItem(left: { trackId: string; itemId: string; contentVersion: string }, right: { trackId: string; itemId: string; contentVersion: string }) { return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion; }
function resultFor(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[], completedAt: string) {
  const pointsEarned = attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0);
  const maxPoints = attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0);
  return createTrainingSessionResult({ id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId, totalOccurrences: session.actualLength, answeredOccurrenceIds: attempts.map((attempt) => attempt.occurrenceId), unansweredOccurrenceIds: session.itemOrder.filter((occurrence) => !attempts.some((attempt) => attempt.occurrenceId === occurrence.occurrenceId)).map((occurrence) => occurrence.occurrenceId), completedAt, evidence: createFamilyEnvelope({ familyId: "certification", details: { pointsEarned, maxPoints, correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length, partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length, incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length } }) });
}
