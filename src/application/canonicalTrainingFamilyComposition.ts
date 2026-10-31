import { CertificationTrainingRuntime } from "./certification/certificationTrainingRuntime";
import { CodingInterviewTrainingRuntime } from "./coding-interview/codingInterviewTrainingRuntime";
import { DesignInterviewTrainingRuntime } from "./design-interview/designInterviewTrainingRuntime";
import { createTrainingFamilyRuntimeResolver } from "./trainingFamilyRuntimeResolver";
import type { CanonicalTrackRuntime } from "../content/canonical";
import { getTrackRegistration } from "../domain/tracks/trackRegistry";
import type { TrainingCatalog, TrainingPresentationPort, TrainingQuestionSummary } from "./trainingLifecycle";
import type { Question } from "../content/canonical/questionTypes";
import { isValidCertificationExamDraftResponse } from "./certification/certificationExamDraftResponse";

/** Application composition owns the explicit family-to-runtime bindings. */
export const canonicalTrainingFamilyResolver = createTrainingFamilyRuntimeResolver([
  { familyId: "certification", create: (catalog, interactions) => new CertificationTrainingRuntime(catalog, interactions) },
  { familyId: "coding_interview", create: (catalog, interactions) => new CodingInterviewTrainingRuntime(catalog, interactions) },
  { familyId: "design_interview", create: (catalog, interactions) => new DesignInterviewTrainingRuntime(catalog, interactions) },
]);

/** Resolve only the family registered for this canonical track. */
export function createCanonicalTrainingFamilyRuntime(track: CanonicalTrackRuntime) {
  return createCanonicalTrainingFamilyComposition(track).runtime;
}

export function createCanonicalTrainingFamilyComposition(track: CanonicalTrackRuntime) {
  const catalog = createTrainingCatalog(track);
  const interactions = createTrainingInteractionPort(track);
  return Object.freeze({
    catalog,
    presentation: interactions,
    runtime: canonicalTrainingFamilyResolver.resolve(catalog, getTrackRegistration(track.trackId).familyId, interactions),
  });
}

/** Keeps authored question unions and answers behind one exact-package interaction port. */
export function createTrainingInteractionPort(track: CanonicalTrackRuntime): TrainingPresentationPort {
  const question = (questionId: string): Question => {
    const resolved = track.getQuestion(questionId);
    if (!resolved) throw new Error("Canonical interaction question is unavailable in the exact package.");
    return resolved;
  };
  return Object.freeze({
    evaluate: (questionId: string, response: unknown) => track.interactions.evaluate(question(questionId), response),
    isComplete: (questionId: string, response: unknown) => track.interactions.isComplete(question(questionId), response),
    isValidPartialResponse: (questionId: string, response: unknown) => {
      const exact = question(questionId);
      const summary = { questionId, interactionType: exact.interaction.type, ...(exact.interaction.type === "choice_multiple" && exact.interaction.requiredSelectionCount !== undefined ? { requiredSelectionCount: exact.interaction.requiredSelectionCount } : {}) };
      return isValidCertificationExamDraftResponse(summary, response, {
        isComplete: (_id, value) => track.interactions.isComplete(exact, value),
        controlIds: (_id) => track.interactions.controlIds(exact),
        present: (_id, value) => track.interactions.present(exact, value),
      } as TrainingPresentationPort);
    },
    controlIds: (questionId: string) => track.interactions.controlIds(question(questionId)),
    randomizeControlOrder: (questionId: string) => track.interactions.randomizeControlOrder(question(questionId)),
    present: (questionId: string, response: unknown, displayOrder: readonly string[] = []) => track.interactions.present(question(questionId), response, displayOrder),
    projectDiagnostics: (questionId: string, response: unknown) => track.interactions.projectDiagnostics(question(questionId), response),
    projectFeedback: (questionId: string, response: unknown) => track.interactions.projectFeedback(question(questionId), response),
    presentReview: (questionId: string, response: unknown | null, displayOrder: readonly string[] = []) => track.interactions.presentReview(question(questionId), response, displayOrder),
  });
}

/** A metadata-only view used by family lifecycle code; authored response/answer shapes never cross it. */
export function createTrainingCatalog(track: CanonicalTrackRuntime): TrainingCatalog {
  const summarize = (question: Question): TrainingQuestionSummary => Object.freeze({
    questionId: question.questionId,
    trackId: question.trackId,
    nodeId: question.nodeId,
    mentalUnitId: question.mentalUnitId,
    prompt: question.prompt,
    interactionType: question.interaction.type,
    ...("requiredSelectionCount" in question.interaction && typeof question.interaction.requiredSelectionCount === "number" ? { requiredSelectionCount: question.interaction.requiredSelectionCount } : {}),
    ...(question.examMetadata ? { examMetadata: Object.freeze({ ...question.examMetadata }) } : {}),
    difficulty: question.difficulty ?? null,
    ...(question.constraints ? { constraints: question.constraints } : {}),
    ...(question.sourceRefs ? { sourceRefs: question.sourceRefs } : {}),
    ...(question.contentDomainId ? { contentDomainId: question.contentDomainId } : {}),
    ...(question.caseRecipe ? { caseRecipe: question.caseRecipe } : {}),
    ...(question.questionRelation ? { questionRelation: question.questionRelation } : {}),
  });
  const questions = Object.freeze(track.questions.map(summarize));
  const byId = new Map(questions.map((question) => [question.questionId, question]));
  return Object.freeze({
    trackId: track.trackId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    ...(track.trainingIdentity ? { trainingIdentity: Object.freeze({ contentVersion: track.trainingIdentity.contentVersion, artifactSha256: track.trainingIdentity.artifactSha256 }) } : {}),
    contentReleaseId: track.contentReleaseId,
    questions,
    ...(track.completionRule ? { completionRule: track.completionRule } : {}),
    ...(track.completionSources ? { completionSources: track.completionSources } : {}),
    ...(track.simulationProfiles ? { simulationProfiles: track.simulationProfiles } : {}),
    ...(track.planningPolicy ? { planningPolicy: track.planningPolicy } : {}),
    modes: track.modes,
    getQuestion: (questionId: string) => byId.get(questionId),
    getQuestionsForNode: (nodeId: string) => Object.freeze(questions.filter((question) => question.nodeId === nodeId)),
    getQuestionsForMentalUnit: (unitId: string) => Object.freeze(questions.filter((question) => question.mentalUnitId === unitId)),
    getMode: (modeId: string) => track.getMode(modeId),
    getPool: (modeId: string) => Object.freeze(track.getPool(modeId).map((question) => byId.get(question.questionId)!)),
    ...(track.approachChallengeProblems ? { approachChallengeProblems: Object.freeze([...track.approachChallengeProblems]) } : {}),
    ...(track.approachChallengeProblems ? { getApproachChallengeProblem: (problemId: string, problemVersion: string) => track.approachChallengeProblems!.find((problem) => problem.problemId === problemId && problem.problemVersion === problemVersion) } : {}),
  });
}
