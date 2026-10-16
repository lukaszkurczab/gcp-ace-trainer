import { resolvedContentRefsEqual, type AttemptResultKind, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import type { CanonicalFeedbackMessage, CanonicalSimulationProfile, JsonValue } from "../../content/canonical";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { allocateWeightedBlueprintQuotas } from "../../content/canonical/weightedBlueprintAllocation";
import { projectCanonicalSourceEvidence, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import { TrainingApplicationFailure } from "../trainingLifecycle";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";

export type CertificationExamReviewItem = Readonly<{
  answerState: "answered" | "unanswered";
  constraints: readonly string[];
  correctOptionIds: readonly string[];
  details: JsonValue;
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
  total: number;
  unansweredCount: number;
}>;

/** Validates durable completed exam evidence before projecting the complete immutable review. */
export async function projectCertificationExamReview(input: Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  profile: CanonicalSimulationProfile;
  questionsById: ReadonlyMap<string, TrainingQuestionSummary>;
  resolveItem: (item: CompletedTrainingSession["itemOrder"][number]["item"]) => Promise<ResolvedInteractionItem>;
  result: TrainingSessionResult;
  session: CompletedTrainingSession;
}>): Promise<CertificationExamReviewProjection> {
  const { attempts, profile, questionsById, resolveItem, result, session } = input;
  const fail = (message: string): never => { throw new TrainingApplicationFailure("summary_unavailable", message); };
  const details = result.evidence.details;
  const targetCount = profile.familyConfig.questionCount.minimum;
  if (session.id !== result.sessionId || result.id !== `${session.id}:result` || session.status !== "completed" || !session.completedAt || result.completedAt !== session.completedAt ||
    result.trackId !== session.trackId || session.modeId !== "certification-exam-simulation" || result.evidence.familyId !== "certification" ||
    session.actualLength !== targetCount || session.requestedLength !== targetCount || session.itemOrder.length !== targetCount || !session.planFingerprint ||
    session.contentVersion.trim().length === 0 || !/^[a-f0-9]{64}$/.test(session.artifactSha256) || !session.taxonomyVersion?.trim() ||
    profile.familyConfig.nodeDomainMapEvidence.artifactPath !== `artifacts/tracks/${session.trackId}/${profile.familyConfig.nodeDomainMapEvidence.contentVersion}/track-artifact.json` || profile.modeId !== session.modeId || profile.familyId !== "certification" ||
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
  if (occurrenceIdSet.size !== targetCount || result.totalOccurrences !== targetCount || answeredSet.size !== result.answeredOccurrenceIds.length || unansweredSet.size !== result.unansweredOccurrenceIds.length ||
    [...answeredSet].some((id) => unansweredSet.has(id)) || answeredSet.size + unansweredSet.size !== targetCount ||
    JSON.stringify(result.answeredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => answeredSet.has(id))) ||
    JSON.stringify(result.unansweredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => unansweredSet.has(id)))) {
    return fail("Certification Exam answer coverage is not an exact ordered partition of its configured plan.");
  }

  const config = profile.familyConfig;
  if (!Number.isSafeInteger(targetCount) || targetCount <= 0 || !Number.isSafeInteger(config.questionCount.maximum) || config.questionCount.maximum < targetCount || config.blueprint.kind !== "weighted_sections" || !Number.isSafeInteger(config.durationMinutes) || config.durationMinutes <= 0 || !Number.isSafeInteger(config.durationMinutes * 60_000)) {
    return fail("Certification Exam profile does not describe its configured blueprint.");
  }
  let quotas: ReturnType<typeof allocateWeightedBlueprintQuotas>;
  try {
    quotas = allocateWeightedBlueprintQuotas(targetCount, config.blueprint.sections);
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
  if (new Set(planQuestions.map((question) => question.questionId)).size !== targetCount) return fail("Certification Exam plan contains duplicate content items.");
  const domainCounts = new Map<string, number>();
  for (const question of planQuestions) domainCounts.set(question.contentDomainId!, (domainCounts.get(question.contentDomainId!) ?? 0) + 1);
  if ([...expectedDomainCounts].some(([domain, count]) => domainCounts.get(domain) !== count)) return fail("Certification Exam plan does not match its weighted profile quotas.");
  const expectedQuestionIds = quotas.flatMap((section) => [...questionsById.values()]
    .filter((question) => question.contentDomainId === section.contentDomainId && config.nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0)
    .sort((left, right) => left.questionId < right.questionId ? -1 : left.questionId > right.questionId ? 1 : 0)
    .slice(0, expectedDomainCounts.get(section.contentDomainId))
    .map((question) => question.questionId));
  if (JSON.stringify(planQuestions.map((question) => question.questionId)) !== JSON.stringify(expectedQuestionIds)) return fail("Certification Exam item order does not match the immutable canonical configured selection.");

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
  const exactItems = await Promise.all(session.itemOrder.map((occurrence) => resolveItem(occurrence.item)));
  const items = await Promise.all(session.itemOrder.map(async (occurrence, index): Promise<CertificationExamReviewItem> => {
    const question = planQuestions[index]!;
    const exact = exactItems[index]!;
    if (exact.question.questionId !== question.questionId || (question.interactionType !== "choice_single" && question.interactionType !== "choice_multiple")) return fail("Certification Exam review requires an exact choice interaction.");
    const attempt = attemptByOccurrence.get(occurrence.occurrenceId);
    let selectedOptionIds: readonly string[] = [];
    let resultKind: AttemptResultKind | "unanswered" = "unanswered";
    let messages: readonly CanonicalFeedbackMessage[] | undefined;
    if (attempt) {
      if (attempt.trackId !== session.trackId || attempt.modeId !== session.modeId || !resolvedContentRefsEqual(attempt.item, occurrence.item) || !exact.interactions.isComplete(question.questionId, attempt.response)) {
        return fail("Certification Exam attempt does not match its immutable occurrence and canonical response.");
      }
      const scored = exact.interactions.evaluate(question.questionId, attempt.response).result;
      if (!scored) return fail("Certification Exam attempt result is incomplete.");
      if (JSON.stringify(scored) !== JSON.stringify(attempt.result)) return fail("Certification Exam attempt score does not match the canonical scorer.");
      resultKind = attempt.result.kind;
      if (resultKind === "correct") correctCount += 1;
      else if (resultKind === "partial") partialCount += 1;
      else incorrectCount += 1;
      pointsEarned += attempt.result.earnedPoints;
      overallPointsEarned += overallScoreCredit(attempt.result);
      answeredMaxPoints += attempt.result.maxPoints;
    }
    const review = exact.interactions.presentReview(question.questionId, attempt?.response ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
    const feedback = review.feedback;
    const renderer = review.model as { renderer?: { kind?: string; options?: readonly Readonly<{ id: string; text: string; selected: boolean }>[] } };
    if (!feedback || renderer.renderer?.kind !== "choice" || !Array.isArray(renderer.renderer.options)) return fail("Certification Exam interaction cannot provide its exact review projection.");
    selectedOptionIds = attempt ? renderer.renderer.options.filter((option) => option.selected).map((option) => option.id) : [];
    if (attempt && selectedOptionIds.length === 0) return fail("Certification Exam answered attempt has no canonical selection.");
    const diagnosticEntries = Array.isArray(review.diagnostics) ? review.diagnostics as readonly Readonly<{ id: string; state: string }>[] : [];
    const correctOptionIds = diagnosticEntries.filter((entry) => entry.state === "correct" || entry.state === "omitted_correct").map((entry) => entry.id);
    if (correctOptionIds.length === 0) return fail("Certification Exam correct answer is unavailable for review.");
    messages = feedback.messages;
    return Object.freeze({
      answerState: attempt ? "answered" : "unanswered",
      constraints: Object.freeze([...(question.constraints ?? [])]),
      correctOptionIds: Object.freeze(correctOptionIds),
      details: feedback.details,
      ...(messages === undefined ? {} : { messages }),
      item: occurrence.item,
      occurrenceId: occurrence.occurrenceId,
      options: Object.freeze(renderer.renderer.options.map((option) => Object.freeze({ optionId: option.id, text: option.text }))),
      ordinal: index + 1,
      prompt: question.prompt,
      questionId: question.questionId,
      reason: feedback.reason,
      result: resultKind,
      selectedOptionIds: Object.freeze([...selectedOptionIds]),
      ...(attempt ? { sourceAttemptId: attempt.id } : {}),
      selectionMode: question.interactionType === "choice_multiple" ? "multiple" : "single",
      sources: projectCanonicalSourceEvidence({ sourceRefs: question.sourceRefs, feedback }),
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
  const maxPoints = planQuestions.reduce((sum, question, index) => {
    if (question.interactionType === "choice_single") return sum + 1;
    if (question.interactionType === "choice_multiple") return sum + exactItems[index]!.interactions.controlIds(question.questionId).length;
    return fail("Certification Exam review requires choice questions.");
  }, 0);
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
    total: targetCount,
    unansweredCount: unansweredSet.size,
  });
}
