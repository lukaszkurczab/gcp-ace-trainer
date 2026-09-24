import type { TrainingAttempt } from "../../domain";
import type { Question } from "../../content/canonical/questionTypes";

type ContentPin = Readonly<{ trackId: string; contentVersion: string; artifactSha256: string }>;

/**
 * Selects a deterministic, coverage-oriented plan from an already eligible
 * mode pool. Existing attempts outside that exact pool/content pin are ignored.
 */
export function selectPracticeQuestions(
  pool: readonly Question[],
  attempts: readonly TrainingAttempt<unknown>[],
  contentPin: ContentPin,
  count: number,
): readonly Question[] {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Practice selection count is invalid.");
  if (count === 0 || pool.length === 0) return Object.freeze([]);

  const questionIds = new Set<string>();
  const questionAttempts = new Map<string, number>();
  const unitQuestions = new Map<string, Question[]>();
  const poolIndex = new Map<string, number>();
  for (const [index, question] of pool.entries()) {
    if (question.trackId !== contentPin.trackId || questionIds.has(question.questionId)) {
      throw new Error("Practice selection pool has invalid or duplicate questions.");
    }
    questionIds.add(question.questionId);
    poolIndex.set(question.questionId, index);
    const unit = unitQuestions.get(question.mentalUnitId) ?? [];
    unit.push(question);
    unitQuestions.set(question.mentalUnitId, unit);
  }

  for (const attempt of attempts) {
    if (attempt.trackId !== contentPin.trackId
      || attempt.item.trackId !== contentPin.trackId
      || attempt.item.contentVersion !== contentPin.contentVersion
      || attempt.item.artifactSha256 !== contentPin.artifactSha256
      || !questionIds.has(attempt.item.questionId)) continue;
    questionAttempts.set(attempt.item.questionId, (questionAttempts.get(attempt.item.questionId) ?? 0) + 1);
  }

  const historicalSeenByUnit = new Map<string, number>();
  for (const [unitId, questions] of unitQuestions) {
    historicalSeenByUnit.set(unitId, questions.reduce((total, question) => total + Number(questionAttempts.has(question.questionId)), 0));
  }

  const selected: Question[] = [];
  const selectedIds = new Set<string>();
  const selectedByUnit = new Map<string, number>();
  const targetLength = Math.min(count, pool.length);

  while (selected.length < targetLength) {
    let best: Question | undefined;
    for (const candidate of pool) {
      if (selectedIds.has(candidate.questionId)) continue;
      if (!best || compareCandidates(candidate, best, unitQuestions, historicalSeenByUnit, questionAttempts, selectedByUnit, poolIndex) < 0) best = candidate;
    }
    if (!best) break;
    selected.push(best);
    selectedIds.add(best.questionId);
    selectedByUnit.set(best.mentalUnitId, (selectedByUnit.get(best.mentalUnitId) ?? 0) + 1);
  }

  return Object.freeze(selected);
}

function compareCandidates(
  left: Question,
  right: Question,
  unitQuestions: ReadonlyMap<string, readonly Question[]>,
  historicalSeenByUnit: ReadonlyMap<string, number>,
  questionAttempts: ReadonlyMap<string, number>,
  selectedByUnit: ReadonlyMap<string, number>,
  poolIndex: ReadonlyMap<string, number>,
): number {
  const leftUnitSize = unitQuestions.get(left.mentalUnitId)!.length;
  const rightUnitSize = unitQuestions.get(right.mentalUnitId)!.length;
  const leftUnitSeen = (historicalSeenByUnit.get(left.mentalUnitId) ?? 0) + (selectedByUnit.get(left.mentalUnitId) ?? 0);
  const rightUnitSeen = (historicalSeenByUnit.get(right.mentalUnitId) ?? 0) + (selectedByUnit.get(right.mentalUnitId) ?? 0);
  const leftUntouched = leftUnitSeen === 0 ? 0 : 1;
  const rightUntouched = rightUnitSeen === 0 ? 0 : 1;
  if (leftUntouched !== rightUntouched) return leftUntouched - rightUntouched;

  const leftQuestionSeen = (questionAttempts.get(left.questionId) ?? 0) > 0;
  const rightQuestionSeen = (questionAttempts.get(right.questionId) ?? 0) > 0;
  if (leftQuestionSeen !== rightQuestionSeen) return Number(leftQuestionSeen) - Number(rightQuestionSeen);

  const unitCoverageDifference = leftUnitSeen / leftUnitSize - rightUnitSeen / rightUnitSize;
  if (unitCoverageDifference !== 0) return unitCoverageDifference;

  const attemptDifference = (questionAttempts.get(left.questionId) ?? 0) - (questionAttempts.get(right.questionId) ?? 0);
  if (attemptDifference !== 0) return attemptDifference;
  return poolIndex.get(left.questionId)! - poolIndex.get(right.questionId)!;
}
