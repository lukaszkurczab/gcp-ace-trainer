import { createAttemptResult, type AttemptResult } from "../../domain/learning";
import type { CertificationQuestion, CertificationResponse } from "./domain";

export function getCertificationQuestionMaxPoints(question: CertificationQuestion): number {
  return new Set(question.correctOptionIds).size;
}

export function scoreCertificationQuestion(
  question: CertificationQuestion,
  response: CertificationResponse,
): AttemptResult {
  const correctIds = new Set(question.correctOptionIds);
  const maxPoints = getCertificationQuestionMaxPoints(question);
  const selectedIds = new Set(response.selectedOptionIds);
  const selectedCorrectCount = [...selectedIds].filter((id) => correctIds.has(id)).length;
  const selectedWrongCount = [...selectedIds].filter((id) => !correctIds.has(id)).length;
  const exact = selectedCorrectCount === correctIds.size && selectedWrongCount === 0;
  if (exact) return createAttemptResult({ earnedPoints: maxPoints, kind: "correct", maxPoints });
  if (selectedWrongCount === 0 && selectedCorrectCount > 0 && selectedCorrectCount < correctIds.size) {
    return createAttemptResult({ earnedPoints: selectedCorrectCount, kind: "partial", maxPoints });
  }
  return createAttemptResult({ earnedPoints: 0, kind: "incorrect", maxPoints });
}
