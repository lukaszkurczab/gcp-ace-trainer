import { resolvedContentRefsEqual, type AttemptResultKind, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { isCanonicalResponseComplete, scoreCanonicalQuestion, type CanonicalFeedbackMessage, type CanonicalSimulationProfile, type Question } from "../../content/canonical";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { allocateWeightedBlueprintQuotas } from "../../content/canonical/weightedBlueprintAllocation";
import { projectCanonicalSourceLinks, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import { projectCanonicalChoiceFeedbackMessages } from "../canonical/canonicalInteractionPresentation";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import { TrainingApplicationFailure } from "../trainingLifecycle";

export type CertificationExamReviewItem = Readonly<{
  answerState: "answered" | "unanswered";
  constraints: readonly string[];
  correctOptionIds: readonly string[];
  details: Question["feedback"]["details"];
  messages?: readonly CanonicalFeedbackMessage[];
  item: CompletedTrainingSession["itemOrder"][number]["item"];
  occurrenceId: string;
  options: readonly Readonly<{ optionId: string; text: string }>[];
  ordinal: number;
  prompt: string;
  questionId: string;
  reason: string;
  result: AttemptResultKind | "unanswered";
  selectedOptionIds: readonly string[];
  sourceAttemptId?: string;
  selectionMode: "single" | "multiple";
  sources: readonly CanonicalSourceLink[];
}>;

export type CertificationExamReviewProjection = Readonly<{
  answeredCount: number;
  items: readonly CertificationExamReviewItem[];
  maxPoints: number;
  modeId: "certification-exam-simulation";
  overallPointsEarned: number;
  pointsEarned: number;
  profileId: string;
  profileVersion: string;
  score: Readonly<{ correctCount: number; incorrectCount: number; partialCount: number }>;
  sessionId: string;
  total: 50;
  unansweredCount: number;
}>;

/** Validates durable completed exam evidence before projecting the complete immutable review. */
export async function projectCertificationExamReview(input: Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  profile: CanonicalSimulationProfile;
  questionsById: ReadonlyMap<string, Question>;
  result: TrainingSessionResult;
  session: CompletedTrainingSession;
}>): Promise<CertificationExamReviewProjection> {
  const { attempts, profile, questionsById, result, session } = input;
  const fail = (message: string): never => { throw new TrainingApplicationFailure("summary_unavailable", message); };
  const details = result.evidence.details;
  if (session.id !== result.sessionId || result.id !== `${session.id}:result` || session.status !== "completed" || !session.completedAt || result.completedAt !== session.completedAt ||
    session.trackId !== "google-cloud-associate-cloud-engineer" || result.trackId !== session.trackId || session.modeId !== "certification-exam-simulation" || result.evidence.familyId !== "certification" ||
    session.actualLength !== 50 || session.requestedLength !== 50 || session.itemOrder.length !== 50 || !session.planFingerprint ||
    session.contentVersion.trim().length === 0 || !/^[a-f0-9]{64}$/.test(session.artifactSha256) || !session.taxonomyVersion?.trim() ||
    profile.profileId !== "google-cloud-associate-cloud-engineer-certification-exam-v1" || profile.profileVersion !== "1" || profile.modeId !== session.modeId || profile.familyId !== "certification" ||
    session.configurationSnapshot.kind !== "certificationSimulation" || session.configurationSnapshot.simulationProfileId !== profile.profileId || session.configurationSnapshot.simulationProfileVersion !== profile.profileVersion) {
    return fail("Certification Exam result does not match its completed session and simulation profile.");
  }
  if (await createContentSessionPlanFingerprint(session as CompletedTrainingSession & { taxonomyVersion: string }) !== session.planFingerprint) {
    return fail("Certification Exam immutable plan fingerprint is invalid.");
  }

  const occurrenceIds = session.itemOrder.map((occurrence) => occurrence.occurrenceId);
  const occurrenceIdSet = new Set(occurrenceIds);
  const answeredSet = new Set(result.answeredOccurrenceIds);
  const unansweredSet = new Set(result.unansweredOccurrenceIds);
  if (occurrenceIdSet.size !== 50 || result.totalOccurrences !== 50 || answeredSet.size !== result.answeredOccurrenceIds.length || unansweredSet.size !== result.unansweredOccurrenceIds.length ||
    [...answeredSet].some((id) => unansweredSet.has(id)) || answeredSet.size + unansweredSet.size !== 50 ||
    JSON.stringify(result.answeredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => answeredSet.has(id))) ||
    JSON.stringify(result.unansweredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => unansweredSet.has(id)))) {
    return fail("Certification Exam answer coverage is not an exact ordered partition of its 50-item plan.");
  }

  const config = profile.familyConfig;
  if (config.questionCount.minimum !== 50 || config.questionCount.maximum < 50 || config.blueprint.kind !== "weighted_sections") {
    return fail("Certification Exam profile does not describe its validated 50-item blueprint.");
  }
  let quotas: ReturnType<typeof allocateWeightedBlueprintQuotas>;
  try {
    quotas = allocateWeightedBlueprintQuotas(50, config.blueprint.sections);
  } catch {
    return fail("Certification Exam profile has invalid weighted quotas.");
  }
  const deadline = Date.parse(String(session.configurationSnapshot.timerDeadlineAt));
  if (session.configurationSnapshot.feedbackMode !== "atSessionEnd" || session.configurationSnapshot.answerChanges !== "untilFinalSubmission" || session.configurationSnapshot.navigation !== "free" ||
    session.configurationSnapshot.submission !== "manualOrForegroundTimeout" || session.configurationSnapshot.timer !== "absoluteDeadline" || session.configurationSnapshot.timerDurationMs !== config.durationMinutes * 60_000 ||
    !Number.isFinite(deadline) || deadline !== Date.parse(session.startedAt) + config.durationMinutes * 60_000 || session.configurationSnapshot.simulationPolicyId !== config.interactionPolicy.policyId ||
    session.configurationSnapshot.simulationPolicyVersion !== config.interactionPolicy.policyVersion || session.configurationSnapshot.flagging !== config.interactionPolicy.flagging ||
    session.configurationSnapshot.navigator !== config.interactionPolicy.navigator || JSON.stringify(session.configurationSnapshot.sectionIds) !== JSON.stringify(config.blueprint.sections.map((section) => section.id))) {
    return fail("Certification Exam completed session configuration does not match its immutable profile policy.");
  }
  const expectedDomainCounts = new Map(quotas.map((section) => [section.contentDomainId, section.questionCount]));
  const planQuestions = session.itemOrder.map((occurrence) => {
    if (occurrence.item.trackId !== session.trackId || occurrence.item.contentVersion !== session.contentVersion || occurrence.item.artifactSha256 !== session.artifactSha256) {
      return fail("Certification Exam plan contains a foreign content reference.");
    }
    const question = questionsById.get(occurrence.item.questionId);
    if (!question || question.trackId !== session.trackId || !question.contentDomainId || config.nodeDomainMap[question.nodeId] !== question.contentDomainId || !expectedDomainCounts.has(question.contentDomainId)) {
      return fail("Certification Exam plan contains content outside its exact profile domains.");
    }
    return question;
  });
  if (new Set(planQuestions.map((question) => question.questionId)).size !== 50) return fail("Certification Exam plan contains duplicate content items.");
  const domainCounts = new Map<string, number>();
  for (const question of planQuestions) domainCounts.set(question.contentDomainId!, (domainCounts.get(question.contentDomainId!) ?? 0) + 1);
  if ([...expectedDomainCounts].some(([domain, count]) => domainCounts.get(domain) !== count)) return fail("Certification Exam plan does not match its weighted profile quotas.");
  const expectedQuestionIds = quotas.flatMap((section) => [...questionsById.values()]
    .filter((question) => question.contentDomainId === section.contentDomainId && config.nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0)
    .sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0)
    .slice(0, expectedDomainCounts.get(section.contentDomainId))
    .map((question) => question.questionId));
  if (JSON.stringify(planQuestions.map((question) => question.questionId)) !== JSON.stringify(expectedQuestionIds)) return fail("Certification Exam item order does not match the immutable canonical 50-item selection.");

  const sessionAttempts = attempts.filter((attempt) => attempt.sessionId === session.id);
  const attemptByOccurrence = new Map(sessionAttempts.map((attempt) => [attempt.occurrenceId, attempt]));
  if (sessionAttempts.length !== answeredSet.size || attemptByOccurrence.size !== answeredSet.size || sessionAttempts.some((attempt) => !answeredSet.has(attempt.occurrenceId))) {
    return fail("Certification Exam attempts do not exactly match answered occurrences.");
  }
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  let pointsEarned = 0;
  let overallPointsEarned = 0;
  let answeredMaxPoints = 0;
  const items = await Promise.all(session.itemOrder.map(async (occurrence, index): Promise<CertificationExamReviewItem> => {
    const question = planQuestions[index]!;
    if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") return fail("Certification Exam review requires choice questions.");
    const correctOptionIds = question.answer.type === "choice_single" ? [question.answer.optionId] : question.answer.type === "choice_multiple" ? [...question.answer.optionIds] : [];
    if (correctOptionIds.length === 0) return fail("Certification Exam correct answer is unavailable for review.");
    const attempt = attemptByOccurrence.get(occurrence.occurrenceId);
    let selectedOptionIds: readonly string[] = [];
    let resultKind: AttemptResultKind | "unanswered" = "unanswered";
    let messages: readonly CanonicalFeedbackMessage[] | undefined;
    if (attempt) {
      if (attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || !resolvedContentRefsEqual(attempt.item, occurrence.item) || !isCanonicalResponseComplete(question, attempt.response)) {
        return fail("Certification Exam attempt does not match its immutable occurrence and canonical response.");
      }
      const scored = scoreCanonicalQuestion(question, attempt.response);
      if (JSON.stringify(scored) !== JSON.stringify(attempt.result)) return fail("Certification Exam attempt score does not match the canonical scorer.");
      resultKind = attempt.result.kind;
      selectedOptionIds = attempt.response.type === "choice_single" ? [attempt.response.optionId] : attempt.response.type === "choice_multiple" ? [...attempt.response.optionIds] : [];
      if (selectedOptionIds.length === 0) return fail("Certification Exam answered attempt has no canonical selection.");
      messages = projectCanonicalChoiceFeedbackMessages(question, attempt.response);
      if (resultKind === "correct") correctCount += 1;
      else if (resultKind === "partial") partialCount += 1;
      else incorrectCount += 1;
      pointsEarned += attempt.result.earnedPoints;
      overallPointsEarned += overallScoreCredit(attempt.result);
      answeredMaxPoints += attempt.result.maxPoints;
    }
    return Object.freeze({
      answerState: attempt ? "answered" : "unanswered",
      constraints: Object.freeze([...(question.constraints ?? [])]),
      correctOptionIds: Object.freeze(correctOptionIds),
      details: question.feedback.details,
      ...(messages === undefined ? {} : { messages }),
      item: occurrence.item,
      occurrenceId: occurrence.occurrenceId,
      options: Object.freeze(question.interaction.options.map((option) => Object.freeze({ optionId: option.optionId, text: option.text }))),
      ordinal: index + 1,
      prompt: question.prompt,
      questionId: question.questionId,
      reason: question.feedback.reason,
      result: resultKind,
      selectedOptionIds: Object.freeze([...selectedOptionIds]),
      ...(attempt ? { sourceAttemptId: attempt.id } : {}),
      selectionMode: question.interaction.type === "choice_multiple" ? "multiple" : "single",
      sources: projectCanonicalSourceLinks(question),
    });
  }));
  const expectedEvidence = {
    activeForegroundMs: session.activeForegroundMs,
    correctCount,
    incorrectCount,
    maxPoints: answeredMaxPoints,
    partialCount,
    pointsEarned,
    profileId: profile.profileId,
    profileVersion: profile.profileVersion,
  };
  if (!details || typeof details !== "object" || Array.isArray(details) || Object.entries(expectedEvidence).some(([key, value]) => (details as Record<string, unknown>)[key] !== value)) {
    return fail("Certification Exam result totals or profile evidence do not match its canonical attempts.");
  }
  const maxPoints = planQuestions.reduce((sum, question) => sum + scoreCanonicalQuestion(question, question.answer).maxPoints, 0);
  if (!Number.isSafeInteger(maxPoints) || maxPoints <= 0 || pointsEarned > maxPoints) return fail("Certification Exam maximum points are invalid.");
  return Object.freeze({
    answeredCount: answeredSet.size,
    items: Object.freeze(items),
    maxPoints,
    modeId: "certification-exam-simulation",
    overallPointsEarned,
    pointsEarned,
    profileId: profile.profileId,
    profileVersion: profile.profileVersion,
    score: Object.freeze({ correctCount, incorrectCount, partialCount }),
    sessionId: session.id,
    total: 50,
    unansweredCount: unansweredSet.size,
  });
}
