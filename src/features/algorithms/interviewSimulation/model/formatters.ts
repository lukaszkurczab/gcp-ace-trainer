import type { SimulationQuestionCounts, SimulationTimerTone } from "./types";

export function formatSimulationItemProgress(currentIndex: number, total: number): string {
  const safeTotal = Math.max(0, total);
  const position = safeTotal === 0 ? 0 : Math.min(Math.max(currentIndex + 1, 1), safeTotal);

  return `${position} of ${safeTotal}`;
}

export function getSimulationProgress(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max((currentIndex + 1) / total, 0), 1);
}

export function formatSimulationQuestionCounts(counts: SimulationQuestionCounts): string {
  return `${counts.answered} answered, ${counts.unanswered} unanswered, ${counts.flagged} flagged`;
}

export function getSimulationTimerTone(remainingForegroundMs: number): SimulationTimerTone {
  if (remainingForegroundMs <= 0) return "critical";
  if (remainingForegroundMs <= 5 * 60 * 1000) return "critical";
  if (remainingForegroundMs <= 10 * 60 * 1000) return "warning";
  return "normal";
}
