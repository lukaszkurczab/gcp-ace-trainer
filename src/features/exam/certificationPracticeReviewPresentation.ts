import type { CertificationPracticeReviewItem } from "../../application/certification";
import type { PracticeChoiceControl, PracticeOptionState } from "../practice/practiceSessionPresentation";

/** Projects immutable completed evidence into explicit user/correct/omitted option states. */
export function buildCertificationPracticeReviewControl(item: CertificationPracticeReviewItem): PracticeChoiceControl {
  const selected = new Set(item.selectedOptionIds);
  const correct = new Set(item.correctOptionIds);
  return Object.freeze({
    kind: "choice",
    selectionMode: item.selectionMode,
    options: Object.freeze(item.options.map((option) => Object.freeze({
      id: option.optionId,
      state: certificationPracticeReviewOptionState(selected.has(option.optionId), correct.has(option.optionId)),
      text: option.text,
    }))),
  });
}

export function certificationPracticeReviewOptionState(selected: boolean, correct: boolean): PracticeOptionState {
  if (selected && correct) return "correct";
  if (selected) return "incorrect";
  if (correct) return "omitted_correct";
  return "not_selected";
}
