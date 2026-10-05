import type { AttemptResultKind } from "../../domain";

/** Returns the user's overall-score contribution without changing diagnostic attempt evidence. */
export function overallScoreCredit(result: Readonly<{ earnedPoints: number; kind: AttemptResultKind }>): number {
  return result.kind === "correct" ? result.earnedPoints : 0;
}
