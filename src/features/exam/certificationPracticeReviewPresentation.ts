import type { CertificationPracticeReviewItem } from "../../application/certification";
import type { CertificationExamReviewItem } from "../../application/certification/certificationExamReviewProjection";
import type { PracticeChoiceControl, PracticeOptionState, PracticeResponseControl } from "../practice/practiceSessionPresentation";

export type ManualReviewReadbackOutcome<T> =
  | Readonly<{ kind: "commit_failed" }>
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "stale" }>
  | Readonly<{ kind: "ready"; value: T }>;

/** Keeps a durable manual-review ACK distinct from the local read that refreshes its UI state. */
export async function commitManualReviewAndReadback<T>(input: Readonly<{
  commit: () => Promise<void>;
  onCommitted: () => void;
  readback: () => Promise<T>;
  isCurrent: () => boolean;
}>): Promise<ManualReviewReadbackOutcome<T>> {
  try {
    await input.commit();
  } catch {
    return input.isCurrent() ? { kind: "commit_failed" } : { kind: "stale" };
  }

  if (!input.isCurrent()) return { kind: "stale" };
  input.onCommitted();

  let value: T;
  try {
    value = await input.readback();
  } catch {
    return input.isCurrent() ? { kind: "unavailable" } : { kind: "stale" };
  }
  if (!input.isCurrent()) return { kind: "stale" };
  return { kind: "ready", value };
}

/** Projects immutable completed evidence into explicit user/correct/omitted option states. */
export function buildCertificationPracticeReviewControl(item: CertificationPracticeReviewItem): PracticeResponseControl {
  return buildChoiceReviewControl(item);
}

export function buildCertificationReviewControl(item: CertificationPracticeReviewItem | CertificationExamReviewItem): PracticeResponseControl {
  return buildChoiceReviewControl(item);
}

function buildChoiceReviewControl(item: Readonly<{
  correctOptionIds: readonly string[];
  options: readonly Readonly<{ optionId: string; text: string }>[];
  selectedOptionIds: readonly string[];
  selectionMode: "single" | "multiple";
}>): PracticeResponseControl {
  const selected = new Set(item.selectedOptionIds);
  const correct = new Set(item.correctOptionIds);
  const interactionType = item.selectionMode === "multiple" ? "choice_multiple" : "choice_single";
  const model: PracticeChoiceControl = Object.freeze({
    kind: "choice",
    interactionType,
    selectionMode: item.selectionMode,
    options: Object.freeze(item.options.map((option) => Object.freeze({
      id: option.optionId,
      state: certificationPracticeReviewOptionState(selected.has(option.optionId), correct.has(option.optionId)),
      text: option.text,
    }))),
  });
  return Object.freeze({ interactionType, model });
}

export function certificationPracticeReviewOptionState(selected: boolean, correct: boolean): PracticeOptionState {
  if (selected && correct) return "correct";
  if (selected) return "incorrect";
  if (correct) return "omitted_correct";
  return "not_selected";
}
