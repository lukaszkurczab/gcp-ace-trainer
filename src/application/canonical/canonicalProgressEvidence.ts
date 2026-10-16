import type { TrainingAttempt } from "../../domain";
import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import { overallScoreCredit } from "./overallScoreCredit";

/** Family-neutral aggregation of already qualified exact, durable outcomes. */
export function projectCanonicalNodePerformance(track: TrainingCatalog, attempts: readonly TrainingAttempt[]) {
  const scores = new Map<string, { correct: number; earned: number; max: number; total: number }>();
  for (const attempt of attempts) {
    const nodeId = track.getQuestion(attempt.item.questionId)!.nodeId;
    const score = scores.get(nodeId) ?? { correct: 0, earned: 0, max: 0, total: 0 };
    scores.set(nodeId, {
      correct: score.correct + (attempt.result.kind === "correct" ? 1 : 0),
      earned: score.earned + overallScoreCredit(attempt.result),
      max: score.max + attempt.result.maxPoints,
      total: score.total + 1,
    });
  }
  return [...scores].map(([nodeId, score]) => ({ nodeId, ...score, percent: Math.round(score.earned / score.max * 100) }));
}
