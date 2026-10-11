import { assertPackageCompletionRuleMatchesQuestions, createPackageCompletionRuleV3, evaluatePackageCompletion } from "../domain/learning/packageCompletionRule";
import { createTrainingAttempt, type TrainingAttempt } from "../domain/learning/trainingAttempt";
import type { TrackId } from "../domain/learning/trackIdentity";
import data from "./claudeCoverageFixtureData.json";

/** Read-only smoke evidence: final source identities, real evaluator, no repository writes. */
export function createClaudeCoverageFixtureCompletion(completed: boolean) {
  const completionRule = createPackageCompletionRuleV3(data.completionRule);
  assertPackageCompletionRuleMatchesQuestions(completionRule, data.questions);
  const profile = { trackId: data.trackId, contentVersion: data.contentVersion, artifactSha256: data.artifactSha256, completionRule };
  const questions = new Map(data.questions.map((question) => [question.questionId, question]));
  const attempts: TrainingAttempt<unknown>[] = [];
  const missingQuestionId = data.questions[data.questions.length - 1]!.questionId;
  function append(questionId: string) {
    const index = attempts.length;
    const answeredAt = new Date(Date.UTC(2026, 9, 11, 12, 0, index)).toISOString();
    const item = { trackId: data.trackId as TrackId, questionId, contentVersion: data.contentVersion, artifactSha256: data.artifactSha256 };
    const correct = completed || questionId !== missingQuestionId;
    attempts.push(createTrainingAttempt({ id: `cc04-attempt-${String(index).padStart(4, "0")}`, sessionId: "cc04-readonly", occurrenceId: `cc04-occurrence-${index}`, trackId: data.trackId as TrackId, modeId: "certification-focus-practice", item, response: {}, result: correct ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt }));
  }
  for (const chapter of completionRule.chapters) {
    const chapterQuestions = data.questions.filter((question) => question.nodeId === chapter.nodeId);
    for (const question of chapterQuestions) append(question.questionId);
    for (let count = chapterQuestions.length; count < chapter.minimumAttemptCount; count += 1) append(chapterQuestions[0]!.questionId);
  }
  return evaluatePackageCompletion(profile, attempts, (questionId) => questions.get(questionId));
}
